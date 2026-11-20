const config = require('../config/simulation.config');

class FraudDetectionService {
  async checkHealth() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(`${config.aiServiceUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      if (!res.ok) {
        return {
          status: 'unhealthy',
          model_loaded: false,
          error: `AI service returned HTTP ${res.status}`,
        };
      }
      return await res.json();
    } catch (err) {
      return {
        status: 'unavailable',
        model_loaded: false,
        error: err.name === 'AbortError' ? 'AI health check timed out' : err.message,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async predict({ transactionId, sequence, metadata }) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.aiTimeoutMs);

    try {
      const res = await fetch(`${config.aiServiceUrl}/api/v1/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: transactionId,
          sequence,
          metadata,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`AI service error (${res.status}): ${text}`);
      }

      return await res.json();
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error(`AI inference timed out after ${config.aiTimeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}

module.exports = new FraudDetectionService();
