const fs = require('fs');
const path = require('path');

module.exports = async function globalTeardown() {
  const mongoServer = global.__MONGOINSTANCE;
  if (mongoServer) {
    await mongoServer.stop();
  }

  const uriFile = path.join(__dirname, '.mongo-uri');
  if (fs.existsSync(uriFile)) {
    try {
      fs.unlinkSync(uriFile);
    } catch {
      // ignore
    }
  }
};
