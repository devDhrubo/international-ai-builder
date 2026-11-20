const config = require('../config/simulation.config');

class RiskDecisionService {
  evaluate({ fraudProbability, modelPrediction }) {
    const policy = config.riskPolicy;
    const prob = Number(fraudProbability);

    let riskLevel = 'LOW';
    if (prob >= policy.mediumMaxProbability) {
      riskLevel = 'HIGH';
    } else if (prob >= policy.lowMaxProbability) {
      riskLevel = 'MEDIUM';
    }

    const levelPolicy = policy.levels[riskLevel];

    return {
      riskLevel,
      decision: levelPolicy.decision, // APPROVE | HOLD | BLOCK
      recommendedAction: levelPolicy.action,
      modelPrediction, // kept strictly separate from decision
      fraudProbability: prob,
      thresholdsUsed: {
        lowMaxProbability: policy.lowMaxProbability,
        mediumMaxProbability: policy.mediumMaxProbability,
      },
      evaluatedAt: new Date().toISOString(),
    };
  }

  getPolicy() {
    return config.riskPolicy;
  }
}

module.exports = new RiskDecisionService();
