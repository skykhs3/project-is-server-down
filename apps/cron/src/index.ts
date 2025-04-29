import dotenv from "dotenv";
import { CronJob } from "cron";
import { MongoClient } from "mongodb";
import winston from "winston";

// Load environment variables
dotenv.config();

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : "";
      return `${timestamp} [${level}] ${message} ${metaStr}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

// MongoDB connection string
const mongoUri: string = process.env.MONGODB_URI || "";
let client: MongoClient;
// Function to send a health check request to a specified URL with options
async function sendHealthCheckRequest(
  name: string,
  url: string,
  fetchOptions: RequestInit = {}
) {
  let startTime: number = 0;
  try {
    logger.info("Sending request", { url, startTime });
    startTime = Date.now();
    const response = await fetch(url, fetchOptions);
    // 2) 스트리밍으로 첫 청크만 읽어 preview 생성
    let preview = "";
    if (response.body) {
      const reader = response.body.getReader();
      const { value, done } = await reader.read();
      if (value) {
        // 텍스트로 변환 후 50글자만
        preview = new TextDecoder().decode(value).slice(0, 50);
      }
      await reader.cancel();
    } else {
      // 스트리밍 지원 안 하면 fallback
      const text = await response.text();
      preview = text.slice(0, 50);
    }

    const endTime = Date.now();
    const responseTime = endTime - startTime;
    logger.info("Response received", {
      url,
      status: response.status,
      responseTime,
      preview,
    });

    const logEntry = {
      timestamp: new Date(startTime),
      metadata: {
        name: name,
        url: url,
        statusCode: response.status,
      },
      responseTimeMs: responseTime,
      responseData: preview,
    };

    try {
      const db = client.db();
      await db.collection("website_checks").insertOne(logEntry);
    } finally {
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      logger.error("Request error", {
        url,
        responseTime,
        message: error.message,
      });

      const logEntry = {
        timestamp: new Date(startTime),
        metadata: {
          name: name,
          url: url,
          statusCode: 0,
        },
        responseTimeMs: responseTime,
        errorMessage: error.message,
      };

      try {
        const db = client.db();
        await db.collection("website_checks").insertOne(logEntry);
      } finally {
      }
    }
  }
}

// Function to run the job
async function runJob() {
  await Promise.all([
    sendHealthCheckRequest("CS330", "http://localhost:7000/health", {
      method: "GET",
    }),

    sendHealthCheckRequest("OTL", "https://otl.sparcs.org/api/tracks", {
      method: "GET",
    }),
    sendHealthCheckRequest(
      "SSO",
      "https://sso.kaist.ac.kr/auth/twofactor/mfa/init",
      {
        method: "POST",
      }
    ),
    sendHealthCheckRequest(
      "ERP",
      "https://erp.kaist.ac.kr/com/cnst/PropCtr/findClientDevice.do",
      {
        method: "POST",
      }
    ),
    sendHealthCheckRequest(
      "KLMS",
      "https://klms.kaist.ac.kr/theme/yui_combo.php?m/1744940622/block_panopto/asyncload/asyncload-min.js",
      {
        method: "GET",
      }
    ),
    sendHealthCheckRequest(
      "Elice",
      "https://api-rest.elice.io/global/account/get/",
      {
        method: "GET",
      }
    ),
  ]);
}

async function main() {
  client = await MongoClient.connect(mongoUri);
  const job = new CronJob("*/10 * * * * *", runJob, null, true, "Asia/Seoul");
}

main();
