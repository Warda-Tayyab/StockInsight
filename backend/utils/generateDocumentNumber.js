const Counter = require('../models/tenant/Counter');

/**
 * Generate sequential document numbers per tenant + document type.
 * e.g. generateDocumentNumber(tenantId, 'po', 'PO') => PO-2026-000001
 */
const generateDocumentNumber = async (tenantId, counterName, prefix) => {
  const counter = await Counter.findOneAndUpdate(
    { tenantId, name: counterName, type: counterName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const year = new Date().getFullYear();
  const seq = String(counter.seq).padStart(6, '0');
  return `${prefix}-${year}-${seq}`;
};

module.exports = generateDocumentNumber;
