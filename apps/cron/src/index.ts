import dotenv from "dotenv";
import { CronJob } from "cron";
import { MongoClient, Db } from "mongodb";
import winston, { log } from "winston";

// Load environment variables
dotenv.config();

// Types
interface HealthCheckConfig {
  serverName: string;
  url: string;
  fetchOptions?: RequestInit;
}

interface LogEntry {
  timestamp: Date;
  metadata: {
    name: string;
    url: string;
    statusCode: number;
  };
  responseTimeMs: number;
  responseData?: string;
  errorMessage?: string;
}

// Constants
const MONGODB_URI = process.env.MONGODB_URI || "";
const CRON_SCHEDULE = "*/10 * * * * *";
const TIMEZONE = "Asia/Seoul";
const PREVIEW_LENGTH = 50;

// Logger configuration
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

// MongoDB client
let client: MongoClient;
let db: Db;

// Health check configurations
const healthCheckConfigs: HealthCheckConfig[] = [
  {
    serverName: "CS330",
    url: "http://localhost:7000/health",
    fetchOptions: { method: "GET" },
  },
  {
    serverName: "OTL",
    url: "https://otl.sparcs.org/api/tracks",
    fetchOptions: { method: "GET" },
  },
  {
    serverName: "SSO",
    url: "https://sso.kaist.ac.kr/auth/twofactor/mfa/init",
    fetchOptions: { method: "POST" },
  },
  {
    serverName: "ERP",
    url: "https://erp.kaist.ac.kr/com/cnst/PropCtr/findClientDevice.do",
    fetchOptions: { method: "POST" },
  },
  {
    serverName: "KLMS",
    url: "https://klms.kaist.ac.kr/theme/yui_combo.php?m/1744940622/block_panopto/asyncload/asyncload-min.js",
    fetchOptions: { method: "GET" },
  },
  {
    serverName: "Elice",
    url: "https://api-rest.elice.io/global/account/get/",
    fetchOptions: { method: "GET" },
  },
  {
    serverName: "CLUBS",
    url: "https://clubs.sparcs.org/api/notices?pageOffset=1&itemCount=6",
    fetchOptions: { method: "GET" },
  },
  {
    serverName: "KAIST Server Status Monitor",
    url: "http://localhost:1025/api/server-status",
    fetchOptions: {
      method: "GET",
      headers: { origin: "https://kaist.vercel.app" },
    },
  },
];

// Helper functions
async function getResponsePreview(response: Response): Promise<string> {
  if (response.body) {
    const reader = response.body.getReader();
    const { value } = await reader.read();
    await reader.cancel();
    return value
      ? new TextDecoder().decode(value).slice(0, PREVIEW_LENGTH)
      : "";
  }
  const text = await response.text();
  return text.slice(0, PREVIEW_LENGTH);
}

async function saveLogEntry(logEntry: LogEntry): Promise<void> {
  try {
    await db.collection("website_checks").insertOne(logEntry);
    if (
      !(
        logEntry.metadata.statusCode < 500 &&
        logEntry.metadata.statusCode >= 200
      )
    ) {
      await db
        .collection("latest_downtimes")
        .updateOne(
          { serverName: logEntry.metadata.name },
          { $set: { timestamp: logEntry.timestamp } },
          { upsert: true }
        );
    }
  } catch (error) {
    logger.error("Failed to save log entry", { error });
  }
}

// Main health check function
async function sendHealthCheckRequest(
  config: HealthCheckConfig
): Promise<void> {
  const { serverName, url, fetchOptions } = config;
  const startTime = Date.now();

  try {
    logger.info("Sending request", { url });
    const response = await fetch(url, fetchOptions);
    const preview = await getResponsePreview(response);
    const responseTime = Date.now() - startTime;

    logger.info("Response received", {
      url,
      status: response.status,
      responseTime,
      preview,
    });

    const logEntry: LogEntry = {
      timestamp: new Date(startTime),
      metadata: {
        name: serverName,
        url,
        statusCode: response.status,
      },
      responseTimeMs: responseTime,
      responseData: preview,
    };

    await saveLogEntry(logEntry);
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    logger.error("Request error", {
      url,
      responseTime,
      message: errorMessage,
    });

    const logEntry: LogEntry = {
      timestamp: new Date(startTime),
      metadata: {
        name: serverName,
        url,
        statusCode: 0,
      },
      responseTimeMs: responseTime,
      errorMessage,
    };

    await saveLogEntry(logEntry);
  }
}

// Job runner
async function runJob(): Promise<void> {
  await Promise.all(healthCheckConfigs.map(sendHealthCheckRequest));
}

// Main function
async function main(): Promise<void> {
  try {
    client = await MongoClient.connect(MONGODB_URI);
    db = client.db();

    const job = new CronJob(CRON_SCHEDULE, runJob, null, true, TIMEZONE);
    logger.info("Health check job started");
  } catch (error) {
    logger.error("Failed to start health check job", { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("Shutting down...");
  await client?.close();
  process.exit(0);
});

main();
