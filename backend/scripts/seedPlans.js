require('dotenv').config();
const mongoose = require('mongoose');
const Plan = require('../models/shared/Plan');

const defaultPlans = [
  {
    name: 'free',
    displayName: 'Free',
    price: 0,
    description: 'Get started with basic inventory management',
    features: ['Up to 50 products', '1 warehouse', 'Basic reports'],
    color: '#0ea5e9',
    sortOrder: 0
  },
  {
    name: 'basic',
    displayName: 'Basic',
    price: 49,
    description: 'For growing businesses with more inventory needs',
    features: ['Up to 500 products', '3 warehouses', 'Advanced reports', 'Email support'],
    color: '#8b5cf6',
    sortOrder: 1
  },
  {
    name: 'pro',
    displayName: 'Pro',
    price: 199,
    description: 'Full-featured plan for established businesses',
    features: ['Unlimited products', 'Unlimited warehouses', 'All reports', 'Priority support', 'API access'],
    color: '#10b981',
    sortOrder: 2
  }
];

async function seedPlans() {
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

  for (const planData of defaultPlans) {
    const existing = await Plan.findOne({ name: planData.name });
    if (existing) {
      console.log(`Plan "${planData.displayName}" already exists, skipping.`);
    } else {
      await Plan.create(planData);
      console.log(`Created plan: ${planData.displayName}`);
    }
  }

  console.log('Plan seeding complete.');
  await mongoose.disconnect();
}

seedPlans().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
