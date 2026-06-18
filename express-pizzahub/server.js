const express = require('express');
const config = require('./src/config');
const { connect } = require('./src/db');

const productsRoute = require('./src/routes/products');
const productsApiRoute = require('./src/routes/productsApi');
const categoriesRoute = require('./src/routes/categories');
const panelRoute = require('./src/routes/panel');

async function main() {
  await connect();

  const app = express();

  app.use(express.json({ limit: config.limits.json_body_bytes }));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static('public'));

  if (config.cors?.enabled) {
    app.use((req, res, next) => {
      const origin = config.cors.origins?.[0] || '*';
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
      if (req.method === 'OPTIONS') return res.sendStatus(204);
      next();
    });
  }

  app.use('/products', productsRoute);
  app.use('/api/products', productsApiRoute);
  app.use('/categories', categoriesRoute);
  app.use('/panel', panelRoute);

  app.get('/healthz', (_req, res) => res.json({ ok: true }));

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'internal_error', message: err.message });
  });

  const { host, port } = config.server;
  app.listen(port, host, () => {
    console.log(`[${config.name}] listening on http://${host}:${port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
