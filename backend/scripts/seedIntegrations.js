require('dotenv').config();
const mongoose = require('mongoose');
const Integration = require('../models/shared/Integration');

const defaultIntegrations = [
  {
    key: 'email',
    name: 'Email Service',
    description: 'Send transactional emails for tenant invites, activations, and password resets.',
    category: 'communication',
    status: 'disconnected',
    config: {},
    sortOrder: 0
  },
  {
    key: 'payment',
    name: 'Payment Gateway',
    description: 'Stripe integration for subscription billing and payments.',
    category: 'payment',
    status: 'disconnected',
    config: { provider: 'stripe' },
    sortOrder: 1
  },
  {
    key: 'analytics',
    name: 'Analytics',
    description: 'Google Analytics for tracking platform usage and events.',
    category: 'analytics',
    status: 'disconnected',
    config: { provider: 'google' },
    sortOrder: 2
  },
  {
    key: 'webhooks',
    name: 'Webhooks',
    description: 'Outbound webhook endpoints for tenant and system events.',
    category: 'automation',
    status: 'disconnected',
    config: { events: ['tenant.created', 'tenant.updated'] },
    sortOrder: 3
  }
];

async function seedIntegrations() {
  const MONGO_URI =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL;

  if (!MONGO_URI) {
    console.error('Missing MongoDB connection string in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  for (const data of defaultIntegrations) {
    const existing = await Integration.findOne({ key: data.key });
    if (existing) {
      console.log(`Integration "${data.name}" already exists, skipping.`);
    } else {
      await Integration.create(data);
      console.log(`Created integration: ${data.name}`);
    }
  }

  console.log('Integration seeding complete.');
  await mongoose.disconnect();
}

seedIntegrations().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
