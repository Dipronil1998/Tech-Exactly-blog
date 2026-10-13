const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');
const os = require('os');

let localServer = null;

/**
 * Resolves the MongoDB connection URI from globalSetup or spins up a fallback instance
 */
const getUri = async () => {
  // 1. Check environment variable
  if (process.env.TEST_MONGODB_URI) {
    return process.env.TEST_MONGODB_URI;
  }

  // 2. Check globalSetup URI file
  const uriFile = path.join(__dirname, '..', '.mongo-uri');
  if (fs.existsSync(uriFile)) {
    try {
      const savedUri = fs.readFileSync(uriFile, 'utf8').trim();
      if (savedUri) return savedUri;
    } catch {
      // fallback below
    }
  }

  // 3. Fallback for standalone single-file test runs
  if (!localServer) {
    localServer = await MongoMemoryServer.create();
  }
  return localServer.getUri();
};

/**
 * Connect to in-memory test database
 */
const connect = async () => {
  const uri = await getUri();
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri, {
      driverInfo: { name: 'nodejs', version: '7.7.0' },
      runtimeAdapters: { os },
    });
  }
};

/**
 * Clear all data from collections
 */
const clearDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
};

/**
 * Disconnect database
 */
const closeDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (localServer) {
    await localServer.stop();
    localServer = null;
  }
};

module.exports = {
  connect,
  clearDatabase,
  closeDatabase,
};
