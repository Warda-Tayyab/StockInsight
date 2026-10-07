const express = require('express');
const nodemailer = require('nodemailer');
const Integration = require('../models/shared/Integration');
const { authenticate, authorize } = require('../middleware/auth/authMiddleware');
const {
  sanitizeIntegration,
  mergeConfig,
  validateIntegrationConfig
} = require('../utils/integrationHelpers');

const router = express.Router();

router.get(
  '/',
  authenticate,
  authorize({ requireSuperAdmin: true }),
  async (req, res) => {
    try {
      const integrations = await Integration.find().sort({ sortOrder: 1, createdAt: 1 });
      res.json({ integrations: integrations.map(sanitizeIntegration) });
    } catch (error) {
      console.error('Fetch integrations error:', error);
      res.status(500).json({ message: 'Failed to fetch integrations' });
    }
  }
);

router.get(
  '/:id',
  authenticate,
  authorize({ requireSuperAdmin: true }),
  async (req, res) => {
    try {
      const integration = await Integration.findById(req.params.id);
      if (!integration) {
        return res.status(404).json({ message: 'Integration not found' });
      }
      res.json({ integration: sanitizeIntegration(integration) });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.put(
  '/:id',
  authenticate,
  authorize({ requireSuperAdmin: true }),
  async (req, res) => {
    try {
      const integration = await Integration.findById(req.params.id);
      if (!integration) {
        return res.status(404).json({ message: 'Integration not found' });
      }

      const { name, description, config, status } = req.body;

      if (name !== undefined) integration.name = name.trim();
      if (description !== undefined) integration.description = description.trim();

      if (config !== undefined) {
        integration.config = mergeConfig(integration.config || {}, config);
        const configError = validateIntegrationConfig(integration.key, integration.config);
        if (configError && status === 'connected') {
          return res.status(400).json({ message: configError });
        }
      }

      if (status !== undefined) {
        if (!['connected', 'disconnected'].includes(status)) {
          return res.status(400).json({ message: 'Invalid status' });
        }
        if (status === 'connected') {
          const configError = validateIntegrationConfig(integration.key, integration.config);
          if (configError) {
            return res.status(400).json({ message: configError });
          }
        }
        integration.status = status;
      }

      await integration.save();

      res.json({ message: 'Integration updated successfully', integration: sanitizeIntegration(integration) });
    } catch (error) {
      console.error('Update integration error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.patch(
  '/:id/toggle',
  authenticate,
  authorize({ requireSuperAdmin: true }),
  async (req, res) => {
    try {
      const integration = await Integration.findById(req.params.id);
      if (!integration) {
        return res.status(404).json({ message: 'Integration not found' });
      }

      if (integration.status === 'disconnected') {
        const configError = validateIntegrationConfig(integration.key, integration.config);
        if (configError) {
          return res.status(400).json({ message: `Configure integration first: ${configError}` });
        }
        integration.status = 'connected';
      } else {
        integration.status = 'disconnected';
      }

      await integration.save();

      res.json({ integration: sanitizeIntegration(integration) });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.post(
  '/:id/test',
  authenticate,
  authorize({ requireSuperAdmin: true }),
  async (req, res) => {
    try {
      const integration = await Integration.findById(req.params.id);
      if (!integration) {
        return res.status(404).json({ message: 'Integration not found' });
      }

      const configError = validateIntegrationConfig(integration.key, integration.config);
      if (configError) {
        return res.status(400).json({ message: configError });
      }

      let result;

      switch (integration.key) {
        case 'email': {
          const { testEmail } = req.body;
          if (!testEmail?.trim()) {
            return res.status(400).json({ message: 'Test email address is required.' });
          }

          const transporter = nodemailer.createTransport({
            host: integration.config.smtpHost,
            port: Number(integration.config.smtpPort),
            secure: Number(integration.config.smtpPort) === 465,
            auth: {
              user: integration.config.smtpUser,
              pass: integration.config.smtpPass
            }
          });

          await transporter.verify();
          await transporter.sendMail({
            from: integration.config.smtpFrom,
            to: testEmail.trim(),
            subject: 'StockInsights Integration Test',
            html: '<p>Your email integration is working correctly.</p>'
          });

          result = { success: true, message: `Test email sent to ${testEmail.trim()}` };
          break;
        }
        case 'payment':
          result = {
            success: true,
            message: 'Stripe credentials saved. Payment processing ready when connected.'
          };
          break;
        case 'analytics':
          result = {
            success: true,
            message: `Analytics tracking ID "${integration.config.trackingId}" is configured.`
          };
          break;
        case 'webhooks': {
          const response = await fetch(integration.config.endpointUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Secret': integration.config.secretKey
            },
            body: JSON.stringify({
              event: 'integration.test',
              message: 'Test webhook from StockInsights Super Admin',
              timestamp: new Date().toISOString()
            })
          });

          result = {
            success: response.ok,
            message: response.ok
              ? `Webhook test sent successfully (HTTP ${response.status}).`
              : `Webhook endpoint responded with HTTP ${response.status}.`
          };
          break;
        }
        default:
          return res.status(400).json({ message: 'Test not supported for this integration.' });
      }

      res.json(result);
    } catch (error) {
      console.error('Integration test error:', error);
      res.status(400).json({
        message: error.message || 'Integration test failed. Check your configuration.'
      });
    }
  }
);

module.exports = router;
