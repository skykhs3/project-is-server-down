import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
const options = {};

const client = new MongoClient(uri, options);
const clientPromise = client.connect();

export default clientPromise;
