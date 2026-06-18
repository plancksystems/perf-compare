const express = require('express');
const { renderPanelHome } = require('../views/panelHome');

const router = express.Router();

router.get('/home', (_req, res) => {
  res.type('html').send(renderPanelHome());
});

module.exports = router;
