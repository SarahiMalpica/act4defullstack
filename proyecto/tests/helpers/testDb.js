const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongo;

async function connectTestDB() {
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();
  await mongoose.connect(uri);
}

async function clearTestDB() {
  if (!mongoose.connection.db) return;

  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
}

async function disconnectTestDB() {
  await mongoose.disconnect();

  if (mongo) {
    await mongo.stop();
    mongo = null;
  }
}

module.exports = {
  connectTestDB,
  clearTestDB,
  disconnectTestDB
};
