import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
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

const app = express();

export type AllServerStatus = Record<string, DomainStatus>;
export interface ServerStatus {
  timestamp: string;
  responseTimeMs: number;
}

export interface DomainStatus {
  lastDowntime: string;
  isOnline: boolean;
  history: ServerStatus[];
  url: string;
}

interface SavedResult {
  result: AllServerStatus;
  millisecondsTimestamp: number;
}

const savedResult: SavedResult = {
  result: {},
  millisecondsTimestamp: 0,
};

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/api/server-status", async (req: Request, res: Response) => {
  try {
    if (savedResult.millisecondsTimestamp + 1000 < Date.now()) {
      const client = await getMongoClient();
      const db = client.db("project-is-server-down");
      const collection = db.collection("website_checks");
      const data = await collection
        .aggregate([
          { $sort: { "metadata.name": 1, timestamp: -1 } },
          {
            $group: {
              _id: "$metadata.name",
              items: { $push: "$$ROOT" },
            },
          },
          {
            $project: {
              _id: 1,
              items: { $slice: ["$items", 60] },
            },
          },
          {
            $lookup: {
              from: "website_checks",
              let: { name: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$metadata.name", "$$name"] },
                        { $eq: ["$metadata.statusCode", 0] },
                      ],
                    },
                  },
                },
                { $sort: { timestamp: -1 } },
                { $limit: 1 },
                { $project: { timestamp: 1, _id: 0 } },
              ],
              as: "latestStatusZero",
            },
          },
          {
            $addFields: {
              latestStatusZeroTimestamp: {
                $ifNull: [
                  { $arrayElemAt: ["$latestStatusZero.timestamp", 0] },
                  null,
                ],
              },
            },
          },
          {
            $project: {
              latestStatusZero: 0,
            },
          },
        ])
        .toArray();

      const result: AllServerStatus = {};
      for (const item of data) {
        const name = item._id;
        const lastDowntime: string = item.latestStatusZeroTimestamp;
        const history: ServerStatus[] = item.items.map((ele: any) => {
          return {
            timestamp: ele.timestamp,
            responseTimeMs:
              ele.metadata.statusCode === 0 ? 0 : ele.responseTimeMs,
          };
        });
        const isOnline: boolean = item.items[0].metadata.statusCode !== 0;
        const url: string = item.items[0].metadata.url;

        const domainStatus: DomainStatus = {
          lastDowntime,
          isOnline,
          history,
          url,
        };
        result[name] = domainStatus;
      }

      savedResult.result = result;
      // savedResult.millisecondsTimestamp = Date.now();
    }

    res.status(200).json(savedResult.result);
  } catch (error) {
    res.status(200).json({});
  }
});

const PORT = process.env.PORT || 1025;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
