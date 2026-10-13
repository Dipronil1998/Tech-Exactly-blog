const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');

module.exports = async function globalSetup() {
  const mongoServer = await MongoMemoryServer.create();
  global.__MONGOINSTANCE = mongoServer;
  const uri = mongoServer.getUri();
  process.env.TEST_MONGODB_URI = uri;

  // Write URI to temp file so all worker threads can read it
  fs.writeFileSync(path.join(__dirname, '.mongo-uri'), uri, 'utf8');
};
