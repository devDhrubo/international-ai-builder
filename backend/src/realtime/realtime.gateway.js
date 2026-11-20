const { v4: uuidv4 } = require('uuid');
const store = require('../repositories/store.repository');
const config = require('../config/simulation.config');

class RealtimeGateway {
  constructor() {
    this.io = null;
  }

  init(io) {
    this.io = io;

    this.io.use((socket, next) => {
      const { role, bankId, customerId } = socket.handshake.auth || {};
      const validRoles = ['CUSTOMER', 'BANK', 'CENTRAL_MONITOR', 'CONTROL_PANEL'];
      if (!role || !validRoles.includes(role)) {
        return next(new Error('Unauthorized WebSocket subscription: invalid role'));
      }
      if (role === 'BANK' && !['ABC_BANK', 'XYZ_BANK'].includes(bankId)) {
        return next(new Error('Unauthorized WebSocket subscription: invalid bank tenant'));
      }
      if (role === 'CUSTOMER' && !customerId) {
        return next(new Error('Unauthorized WebSocket subscription: customerId required'));
      }
      socket.data.auth = { role, bankId: bankId || null, customerId: customerId || null };
      return next();
    });

    this.io.on('connection', (socket) => {
      const { role, bankId, customerId } = socket.data.auth;

      if (role === 'CENTRAL_MONITOR' || role === 'CONTROL_PANEL') {
        socket.join('channel:central_monitor');
      } else if (role === 'BANK' && bankId) {
        socket.join(`channel:bank:${bankId}`);
      } else if (role === 'CUSTOMER' && customerId) {
        socket.join(`channel:customer:${customerId}`);
      }

      socket.emit('connection.ready', {
        socketId: socket.id,
        role,
        bankId,
        customerId,
        connectedAt: new Date().toISOString(),
      });

      socket.on('subscribe.customer', (newCustomerId) => {
        if (role === 'CUSTOMER' && newCustomerId) {
          for (const room of socket.rooms) {
            if (room.startsWith('channel:customer:')) {
              socket.leave(room);
            }
          }
          socket.join(`channel:customer:${newCustomerId}`);
          socket.data.auth.customerId = newCustomerId;
        }
      });

      socket.on('subscribe.bank', (newBankId) => {
        if (role === 'BANK' && ['ABC_BANK', 'XYZ_BANK'].includes(newBankId)) {
          for (const room of socket.rooms) {
            if (room.startsWith('channel:bank:')) {
              socket.leave(room);
            }
          }
          socket.join(`channel:bank:${newBankId}`);
          socket.data.auth.bankId = newBankId;
        }
      });
    });
  }

  /**
   * Persists event before broadcasting and routes only authorized data
   * to customer, bank tenants, and central monitoring channels.
   */
  publish({ eventType, transaction, payload = {} }) {
    const event = {
      eventId: `EVT-${uuidv4().slice(0, 8).toUpperCase()}`,
      transactionId: transaction.transactionId,
      eventType,
      timestamp: new Date().toISOString(),
      data: payload,
    };

    // Persist before broadcasting
    store.addEvent(event);

    if (!this.io) return event;

    // 1. Central Monitoring receives full authorized lifecycle & model updates
    this.io.to('channel:central_monitor').emit(eventType, {
      ...event,
      transaction,
    });
    this.io.to('channel:central_monitor').emit('simulation.event', {
      ...event,
      transaction,
    });

    // 2. Customer receives progress & final status for their own transaction (sanitized: no internal model weights/thresholds)
    const customerEvent = {
      ...event,
      transaction: {
        transactionId: transaction.transactionId,
        status: transaction.status,
        currentStage: transaction.currentStage,
        amount: transaction.amount,
        currency: transaction.currency,
        senderAccountRef: transaction.senderAccountRef,
        beneficiaryAccountRef: transaction.beneficiaryAccountRef,
        receiverBankName: transaction.receiverBankName,
        customerResultState: transaction.customerResultState,
        customerMessage: transaction.customerMessage,
        stages: transaction.stages,
        updatedAt: transaction.updatedAt,
      },
    };
    this.io.to(`channel:customer:${transaction.senderCustomerId}`).emit(eventType, customerEvent);
    this.io
      .to(`channel:customer:${transaction.senderCustomerId}`)
      .emit('simulation.event', customerEvent);

    // 3. Bank dashboards receive tenant-isolated updates
    const isAlertOrCase = eventType === 'fraud.alert.created' || eventType === 'case.created';
    this.io.to(`channel:bank:${transaction.senderBankId}`).emit(eventType, {
      ...event,
      transaction,
    });
    this.io.to(`channel:bank:${transaction.senderBankId}`).emit('simulation.event', {
      ...event,
      transaction,
    });

    if (transaction.receiverBankId !== transaction.senderBankId) {
      const allowReceivingAlert =
        !isAlertOrCase || config.infoSharingPolicy.shareIncomingAlertsWithReceivingBank;
      if (allowReceivingAlert) {
        this.io.to(`channel:bank:${transaction.receiverBankId}`).emit(eventType, {
          ...event,
          transaction,
        });
        this.io.to(`channel:bank:${transaction.receiverBankId}`).emit('simulation.event', {
          ...event,
          transaction,
        });
      }
    }

    return event;
  }
}

module.exports = new RealtimeGateway();
