const SENSITIVE_KEYS = ['smtpPass', 'secretKey', 'webhookSecret', 'apiKey', 'publishableKey'];

const maskValue = (value) => {
  if (!value || typeof value !== 'string') return value;
  if (value.length <= 4) return '****';
  return `${'*'.repeat(Math.min(value.length - 4, 12))}${value.slice(-4)}`;
};

const maskConfig = (config = {}) => {
  const masked = { ...config };
  SENSITIVE_KEYS.forEach((key) => {
    if (masked[key]) masked[key] = maskValue(masked[key]);
  });
  return masked;
};

const sanitizeIntegration = (integration) => {
  const obj = integration.toObject ? integration.toObject() : { ...integration };
  obj.config = maskConfig(obj.config || {});
  obj.statusLabel = obj.status === 'connected' ? 'Connected' : 'Not Connected';
  return obj;
};

const mergeConfig = (existing = {}, incoming = {}) => {
  const merged = { ...existing, ...incoming };
  SENSITIVE_KEYS.forEach((key) => {
    if (incoming[key] === undefined || incoming[key] === '' || incoming[key]?.includes('*')) {
      merged[key] = existing[key];
    }
  });
  return merged;
};

const validateIntegrationConfig = (key, config = {}) => {
  switch (key) {
    case 'email':
      if (!config.smtpHost?.trim()) return 'SMTP host is required.';
      if (!config.smtpPort) return 'SMTP port is required.';
      if (!config.smtpUser?.trim()) return 'SMTP user is required.';
      if (!config.smtpPass?.trim()) return 'SMTP password is required.';
      if (!config.smtpFrom?.trim()) return 'From email is required.';
      return null;
    case 'payment':
      if (!config.publishableKey?.trim()) return 'Publishable key is required.';
      if (!config.secretKey?.trim()) return 'Secret key is required.';
      return null;
    case 'analytics':
      if (!config.trackingId?.trim()) return 'Tracking ID is required.';
      return null;
    case 'webhooks':
      if (!config.endpointUrl?.trim()) return 'Webhook URL is required.';
      if (!config.secretKey?.trim()) return 'Secret key is required.';
      return null;
    default:
      return 'Unknown integration type.';
  }
};

module.exports = {
  SENSITIVE_KEYS,
  maskConfig,
  sanitizeIntegration,
  mergeConfig,
  validateIntegrationConfig
};
