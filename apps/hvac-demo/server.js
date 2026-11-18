'use strict';
// Entry point. Secrets come from the environment only; the service refuses to start without them.
const http = require('node:http');
const path = require('node:path');
const { createApp } = require('./src/app');

const env = process.env;
const app = createApp({
  toolSecret: env.SAVE_LEAD_WEBHOOK_SECRET,
  viewKey: env.DEMO_CRM_VIEW_KEY,
  dataDir: env.DEMO_DATA_DIR || path.join(__dirname, 'data'),
  trustProxy: env.TRUST_PROXY === '1',
  requireHttps: env.REQUIRE_HTTPS === '1',
  insecureCookies: env.INSECURE_COOKIES === '1', // local http testing only
  allowStaticSecret: env.ALLOW_STATIC_SECRET !== '0',
});
const server = http.createServer(app);
server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.keepAliveTimeout = 5000;
setInterval(() => {
  const removed = app.store.purge();
  if (removed) console.log(JSON.stringify({ route: 'purge', status: 200, removed }));
}, 3600000).unref();
app.store.purge();
const port = Number(env.PORT) || 8787;
server.listen(port, () => console.log(JSON.stringify({ route: 'start', status: 200, port })));
