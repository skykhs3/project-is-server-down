import dotenv from "dotenv";
dotenv.config();
import logger from "./utils/logger";
import { getMongoClient } from "./utils/mongodb";
import { CronJob } from "cron";

import express, { Request, Response } from "express";
import cors from "./middlewares/cors";

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

let cachedData: AllServerStatus = {};

async function fetchData() {
  let start = Date.now();
  const duration = [0, 0];

  try {
    const client = await getMongoClient();
    const db = client.db("project-is-server-down");
    const collection = db.collection("website_checks");
    const [statusRecordData, latestDowntimesData] = await Promise.all([
      collection
        .aggregate([
          {
            $match: {
              timestamp: {
                $gte: new Date(Date.now() - 30 * 60 * 1000), //30분 이상 체크 데이터만 가져옴
              },
            },
          },
          { $sort: { "metadata.name": 1, timestamp: -1 } },
          {
            $group: {
              _id: "$metadata.name",
              items: {
                $push: {
                  timestamp: "$timestamp",
                  statusCode: "$metadata.statusCode",
                  responseTimeMs: "$responseTimeMs",
                  url: "$metadata.url",
                },
              },
            },
          },
          {
            $project: {
              _id: 1,
              items: { $slice: ["$items", 60] },
            },
          },
        ])
        .toArray(),

      db.collection("latest_downtimes").find({}).toArray(),
    ]);

    duration[0] = Date.now() - start;
    start = Date.now();

    const result: AllServerStatus = {};
    for (const item of statusRecordData) {
      const name = item._id;
      const lastDowntime: string = latestDowntimesData.find(
        (ele: any) => ele.serverName === name
      )?.timestamp;
      const history: ServerStatus[] = item.items.map((ele: any) => {
        return {
          timestamp: ele.timestamp,
          responseTimeMs: ele.statusCode === 0 ? 0 : ele.responseTimeMs,
        };
      });
      const isOnline: boolean = item.items[0].statusCode !== 0;
      const url: string = item.items[0].url;

      const domainStatus: DomainStatus = {
        lastDowntime,
        isOnline,
        history,
        url,
      };
      result[name] = domainStatus;
    }

    cachedData = result;
    duration[1] = Date.now() - start;
    logger.info(`Data fetch duration: ${duration[0]}ms, ${duration[1]}ms`);
  } catch (error) {
    logger.error("Error fetching data:", error);
  }
}

// 1초마다 데이터를 가져오는 크론잡 설정
const job = new CronJob("*/1 * * * * *", fetchData, null, true, "Asia/Seoul");

const app = express();

app.use(cors);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/api/server-status", async (req: Request, res: Response) => {
  res.status(200).json(cachedData);
});

const PORT = process.env.PORT || 1025;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
