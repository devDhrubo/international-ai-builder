const store = require('../repositories/store.repository');

class BehavioralEventService {
  /**
   * Behavioral Event Adapter:
   * 1. Retrieves synthetic customer's prior banking API activity.
   * 2. Incorporates scenario-specific behavioral API actions (for controlled testing).
   * 3. Appends current transaction lifecycle API tokens.
   * 4. Returns a DistilBERT-compatible anonymized API action sequence.
   */
  assembleSequence({ customerId, scenarioId, currentLifecycleEvents = [] }) {
    const priorHistory = store.getBehavioralHistory(customerId);
    const scenario = store.getScenarioById(scenarioId);
    const scenarioEvents = scenario ? scenario.behavioralEvents : [];

    const combined = [...priorHistory, ...scenarioEvents, ...currentLifecycleEvents];
    const sequenceString = combined.join(' ');

    // Persist the new lifecycle events to customer's history
    store.appendBehavioralEvents(customerId, [...scenarioEvents.slice(-2), ...currentLifecycleEvents]);

    return {
      sequenceTokens: combined,
      sequenceString,
      priorCount: priorHistory.length,
      scenarioId: scenario ? scenario.id : 'normal_banking',
      scenarioName: scenario ? scenario.name : 'Normal Banking Activity',
    };
  }
}

module.exports = new BehavioralEventService();
