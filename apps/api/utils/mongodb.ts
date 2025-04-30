import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

const options = {};
let client: MongoClient | null = null;

async function getMongoClient() {
  if (!client) {
    client = new MongoClient(uri as string, options);
    await client.connect();
  }
  return client;
}

export { getMongoClient };
