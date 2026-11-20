const express = require('express');
const controller = require('../controllers/simulation.controller');
const { extractTenantContext } = require('../middleware/tenant.middleware');

const router = express.Router();

router.get('/health', (req, res) => controller.health(req, res));
router.get('/risk-policy', (req, res) => controller.getRiskPolicy(req, res));

router.get('/bootstrap', extractTenantContext, (req, res) => controller.bootstrap(req, res));
router.post('/transactions', extractTenantContext, (req, res) =>
  controller.createTransaction(req, res)
);
router.get('/transactions/:id', extractTenantContext, (req, res) =>
  controller.getTransaction(req, res)
);
router.patch('/cases/:caseId', extractTenantContext, (req, res) =>
  controller.updateCase(req, res)
);
router.post('/admin/reset', (req, res) => controller.resetSimulation(req, res));

module.exports = router;
