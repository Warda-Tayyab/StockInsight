const express = require('express');
const router = express.Router();
const Plan = require('../models/shared/Plan');
const Tenant = require('../models/shared/Tenant');
const { authenticate, authorize } = require('../middleware/auth/authMiddleware');
const logAdminActivity = require('../utils/logAdminActivity');

router.get(
  '/',
  authenticate,
  authorize({ requireSuperAdmin: true }),
  async (req, res) => {
    try {
      const { activeOnly } = req.query;
      const filter = activeOnly === 'true' ? { isActive: true } : {};
      const plans = await Plan.find(filter).sort({ sortOrder: 1, createdAt: 1 });
      res.json({ plans });
    } catch (error) {
      console.error('Fetch plans error:', error);
      res.status(500).json({ message: 'Failed to fetch plans' });
    }
  }
);

router.get(
  '/:id',
  authenticate,
  authorize({ requireSuperAdmin: true }),
  async (req, res) => {
    try {
      const plan = await Plan.findById(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }
      res.json({ plan });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.post(
  '/',
  authenticate,
  authorize({ requireSuperAdmin: true }),
  async (req, res) => {
    try {
      const { name, displayName, price, description, features, color, isActive, sortOrder } = req.body;

      if (!name?.trim()) {
        return res.status(400).json({ message: 'Plan name (slug) is required' });
      }
      if (!displayName?.trim()) {
        return res.status(400).json({ message: 'Display name is required' });
      }

      const existing = await Plan.findOne({ name: name.trim().toLowerCase() });
      if (existing) {
        return res.status(400).json({ message: 'A plan with this name already exists' });
      }
      const totalPlans = await Plan.countDocuments();

if (totalPlans >= 3) {
  return res.status(400).json({
    message: 'Maximum 3 plans are allowed.'
  });
}

      const plan = await Plan.create({
        name: name.trim().toLowerCase(),
        displayName: displayName.trim(),
        price: price ?? 0,
        description: description?.trim() || '',
        features: Array.isArray(features) ? features.filter(Boolean) : [],
        color: color || '#0ea5e9',
        isActive: isActive !== false,
        sortOrder: sortOrder ?? 0
      });

      await logAdminActivity({
        type: 'plan_created',
        title: 'Pricing plan created',
        description: `${plan.displayName} plan was added ($${plan.price}/mo)`,
        entityType: 'plan',
        entityId: plan._id,
        metadata: { planName: plan.displayName, price: plan.price }
      });

      res.status(201).json({ message: 'Plan created successfully', plan });
    } catch (error) {
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((e) => e.message);
        return res.status(400).json({ message: messages.join(', ') });
      }
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
      const plan = await Plan.findById(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }

      const { displayName, price, description, features, color, isActive, sortOrder } = req.body;

      if (displayName !== undefined) plan.displayName = displayName.trim();
      if (price !== undefined) plan.price = price;
      if (description !== undefined) plan.description = description.trim();
      if (features !== undefined) plan.features = Array.isArray(features) ? features.filter(Boolean) : [];
      if (color !== undefined) plan.color = color;
      if (isActive !== undefined) plan.isActive = isActive;
      if (sortOrder !== undefined) plan.sortOrder = sortOrder;

      await plan.save();

      await logAdminActivity({
        type: 'plan_updated',
        title: 'Pricing plan updated',
        description: `${plan.displayName} plan was modified ($${plan.price}/mo)`,
        entityType: 'plan',
        entityId: plan._id,
        metadata: { planName: plan.displayName, price: plan.price }
      });

      res.json({ message: 'Plan updated successfully', plan });
    } catch (error) {
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((e) => e.message);
        return res.status(400).json({ message: messages.join(', ') });
      }
      res.status(500).json({ message: 'Server error' });
    }
  }
);

router.delete(
  '/:id',
  authenticate,
  authorize({ requireSuperAdmin: true }),
  async (req, res) => {
    try {
      const plan = await Plan.findById(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }

      const tenantsUsingPlan = await Tenant.countDocuments({ plan: plan.name });
      if (tenantsUsingPlan > 0) {
        return res.status(400).json({
          message: `Cannot delete plan. ${tenantsUsingPlan} tenant(s) are using this plan. Deactivate it instead.`
        });
      }

      const planName = plan.displayName;
      const planId = plan._id;

      await plan.deleteOne();

      await logAdminActivity({
        type: 'plan_deleted',
        title: 'Pricing plan removed',
        description: `${planName} plan was deleted`,
        entityType: 'plan',
        entityId: planId,
        metadata: { planName }
      });

      res.json({ message: 'Plan deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
