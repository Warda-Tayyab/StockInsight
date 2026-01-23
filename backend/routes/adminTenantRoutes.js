const express = require('express');
const router = express.Router();
const Tenant = require('../models/shared/Tenant');
const adminAuthMiddleware = require('../middleware/auth/adminAuthMiddleware');

router.post('/', adminAuthMiddleware, async (req, res) => {
  const { name, slug } = req.body;

  const tenant = await Tenant.create({
    tenantId: crypto.randomUUID(),
    name,
    slug
  });

  res.json(tenant);
});

module.exports = router;
