const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const configPath = path.join(__dirname, '..', 'config.yaml');
const raw = fs.readFileSync(configPath, 'utf8');
const config = YAML.parse(raw);

module.exports = config;
