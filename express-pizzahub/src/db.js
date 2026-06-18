const mongoose = require('mongoose');
const config = require('./config');

async function connect() {
  await mongoose.connect(config.mongo.uri, { dbName: config.mongo.database });
  return mongoose.connection;
}

module.exports = { connect, mongoose };
