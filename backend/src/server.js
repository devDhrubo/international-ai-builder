const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const config = require('./config/simulation.config');
const simulationRoutes = require('./routes/simulation.routes');
const realtimeGateway = require('./realtime/realtime.gateway');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/v1', simulationRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH'],
  },
});

realtimeGateway.init(io);

server.listen(config.port, () => {
  console.log(`FraudShield Simulation Backend listening on http://127.0.0.1:${config.port}`);
  console.log(`Configured AI Service URL: ${config.aiServiceUrl}`);
});
