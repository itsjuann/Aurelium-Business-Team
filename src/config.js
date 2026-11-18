import crypto from 'node:crypto';

const env = process.env;
const isProd = env.NODE_ENV === 'production';

if (isProd && (!env.ADMIN_PASSWORD || !env.SESSION_SECRET)) {
  throw new Error('ADMIN_PASSWORD and SESSION_SECRET must be set in production');
}

export const config = {
  isProd,
  port: Number(env.PORT || 3000),
  // Public origin printed inside QR codes and messages, e.g. https://guests.example.com
  baseUrl: (env.BASE_URL || `http://localhost:${env.PORT || 3000}`).replace(/\/$/, ''),
  dbPath: env.DB_PATH || 'data/app.db',
  adminPassword: env.ADMIN_PASSWORD || 'admin',
  sessionSecret: env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  defaultCountryCode: env.DEFAULT_COUNTRY_CODE || '1',
  twilio: {
    accountSid: env.TWILIO_ACCOUNT_SID || '',
    authToken: env.TWILIO_AUTH_TOKEN || '',
    // Either a Messaging Service SID (MG...) or a plain from-number
    messagingServiceSid: env.TWILIO_MESSAGING_SERVICE_SID || '',
    from: env.TWILIO_FROM || '',
  },
  resend: {
    apiKey: env.RESEND_API_KEY || '',
    from: env.EMAIL_FROM || '',
  },
};

export const smsLive = () =>
  Boolean(config.twilio.accountSid && config.twilio.authToken &&
    (config.twilio.messagingServiceSid || config.twilio.from));
export const emailLive = () => Boolean(config.resend.apiKey && config.resend.from);
