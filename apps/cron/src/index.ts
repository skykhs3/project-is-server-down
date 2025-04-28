import dotenv from "dotenv";
import { CronJob } from "cron";
import { MongoClient } from "mongodb";

// Load environment variables
dotenv.config();

// MongoDB connection string
const mongoUri: string = process.env.MONGODB_URI || "";
let client: MongoClient;
// Function to send a health check request to a specified URL with options
async function sendHealthCheckRequest(
  name: string,
  url: string,
  fetchOptions: RequestInit = {}
) {
  const startTime = Date.now();
  try {
    console.log(url, startTime, "Sending request...");
    const response = await fetch(url, fetchOptions);
    let data: string;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = JSON.stringify(await response.json());
    } else {
      data = await response.text();
    }
    data = data.slice(0, 50);

    const endTime = Date.now();
    console.log(url, endTime, "Response:", data);
    const responseTime = endTime - startTime;

    const logEntry = {
      timestamp: new Date(startTime),
      metadata: {
        name: name,
        url: url,
        statusCode: response.status,
      },
      responseTimeMs: responseTime,
      responseData: data,
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
      console.log(url, endTime, "Error:", error.message);

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
    sendHealthCheckRequest(
      "Elice",
      "https://api-rest.elice.io/global/account/get/",
      {
        method: "GET",
      }
    ),
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
  ]);
}

async function main() {
  client = await MongoClient.connect(mongoUri);
  const job = new CronJob("*/10 * * * * *", runJob, null, true, "Asia/Seoul");
}

main();
