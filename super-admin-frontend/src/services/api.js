/**
 * API layer - Abhi dummy/mock use ho raha hai.
 * Jab real backend banaogi to yahan replace karna:
 * - axios.get/post/put/delete ya fetch() use karo
 * - Same function names rakhna taake components mein sirf import change ho
 */

import { DUMMY_TENANTS, DUMMY_PLANS, DUMMY_INTEGRATIONS } from '@/data/dummyData';

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Tenants ----------
export const tenantApi = {
  async getList(params = {}) {
    await delay(400);
    // TODO: Replace with real API -> const res = await axios.get('/tenants', { params });
    let list = [...DUMMY_TENANTS];
    if (params.status) list = list.filter((t) => (t.status || '').toLowerCase() === params.status.toLowerCase());
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((t) =>
        (t.companyName || '').toLowerCase().includes(q) ||
        (t.slug || '').toLowerCase().includes(q) ||
        (t.primaryContact?.email || '').toLowerCase().includes(q)
      );
    }
    const page = params.page || 1;
    const limit = params.limit || 10;
    const total = list.length;
    const start = (page - 1) * limit;
    const slice = list.slice(start, start + limit);
    return {
      success: true,
      data: slice,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
    };
  },

  async getById(id) {
    await delay(300);
    // TODO: Replace with real API -> const res = await axios.get(`/tenants/${id}`);
    const tenant = DUMMY_TENANTS.find((t) => t.tenantId === id || t._id === id) || {
      _id: id,
      tenantId: id,
      companyName: 'Demo Tenant',
      slug: 'demo',
      status: 'active',
      region: 'us-east-1',
      features: ['products', 'stock_management'],
      primaryContact: { name: 'Admin', email: 'admin@demo.com' },
      createdAt: new Date().toISOString(),
      quotas: { storageGB: 10, seats: 50 },
      trial: { days: 14 }
    };
    return { success: true, data: tenant };
  },

  async create(payload) {
    await delay(500);
    // TODO: Replace with real API -> const res = await axios.post('/tenants', payload);
    const newTenant = {
      _id: 't' + Date.now(),
      tenantId: 't' + Date.now(),
      ...payload,
      createdAt: new Date().toISOString(),
      status: payload.status || 'trial'
    };
    return { success: true, data: newTenant };
  },

  async update(id, payload) {
    await delay(400);
    // TODO: Replace with real API -> const res = await axios.put(`/tenants/${id}`, payload);
    return { success: true, data: { _id: id, ...payload } };
  }
};

// ---------- Pricing Plans ----------
export const plansApi = {
  async getList() {
    await delay(400);
    // TODO: Replace with real API -> const res = await axios.get('/plans');
    return { success: true, data: { plans: [...DUMMY_PLANS] } };
  },

  async create(payload) {
    await delay(400);
    // TODO: Replace with real API -> const res = await axios.post('/plans', payload);
    const newPlan = { _id: 'plan' + Date.now(), ...payload, isActive: true };
    return { success: true, data: newPlan };
  },

  async update(id, payload) {
    await delay(400);
    // TODO: Replace with real API -> const res = await axios.put(`/plans/${id}`, payload);
    return { success: true, data: { _id: id, ...payload } };
  },

  async delete(id) {
    await delay(300);
    // TODO: Replace with real API -> await axios.delete(`/plans/${id}`);
    return { success: true };
  }
};

// ---------- Integrations ----------
export const integrationsApi = {
  async getList() {
    await delay(400);
    // TODO: Replace with real API -> const res = await axios.get('/integrations');
    return { success: true, data: [...DUMMY_INTEGRATIONS] };
  },

  async create(payload) {
    await delay(300);
    // TODO: Replace with real API -> const res = await axios.post('/integrations', payload);
    const newItem = { _id: 'int' + Date.now(), ...payload, isActive: true };
    return { success: true, data: newItem };
  },

  async update(id, payload) {
    await delay(300);
    // TODO: Replace with real API -> const res = await axios.put(`/integrations/${id}`, payload);
    return { success: true, data: { _id: id, ...payload } };
  },

  async delete(id) {
    await delay(200);
    // TODO: Replace with real API -> await axios.delete(`/integrations/${id}`);
    return { success: true };
  }
};
