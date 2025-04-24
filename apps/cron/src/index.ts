import dotenv from "dotenv";
import { CronJob } from "cron";
import fs from "fs/promises";
import path from "path";

// Load environment variables
dotenv.config();

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "logs");
fs.mkdir(logsDir, { recursive: true }).catch(console.error);

// Function to get current log file name based on date
function getLogFileName(name: string) {
  const date = new Date();
  const seoulTime = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );
  return path.join(
    logsDir,
    `${name}-${seoulTime.getFullYear()}-${String(seoulTime.getMonth() + 1).padStart(2, "0")}-${String(seoulTime.getDate()).padStart(2, "0")}.log`
  );
}

// Function to write log entry
async function writeLogEntry(name: string, logEntry: any) {
  try {
    await fs.appendFile(getLogFileName(name), JSON.stringify(logEntry) + "\n");
  } catch (error) {
    console.error("Error writing to log file:", error);
  }
}

// Function to send a health check request to a specified URL with options
async function sendHealthCheckRequest(
  name: string,
  url: string,
  fetchOptions: RequestInit = {}
) {
  const startTime = Date.now();
  const seoulTime = new Date(startTime + 9 * 60 * 60 * 1000);
  const seoulISOString = `${seoulTime.getFullYear()}-${String(seoulTime.getMonth() + 1).padStart(2, "0")}-${String(seoulTime.getDate()).padStart(2, "0")}T${String(seoulTime.getHours()).padStart(2, "0")}:${String(seoulTime.getMinutes()).padStart(2, "0")}:${String(seoulTime.getSeconds()).padStart(2, "0")}.${String(seoulTime.getMilliseconds()).padStart(3, "0")}+09:00`;

  try {
    console.log("Sending request to", url, ":", seoulISOString);
    const response = await fetch(url, fetchOptions);
    const data = await response.json();
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    const logEntry = {
      timestamp: seoulISOString,
      responseTime: `${responseTime}ms`,
      status: response.status,
      data: data,
    };

    // Write to log file asynchronously
    await writeLogEntry(name, logEntry);

    console.log("Response:", data);
  } catch (error: unknown) {
    if (error instanceof Error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      const logEntry = {
        timestamp: seoulISOString,
        responseTime: `${responseTime}ms`,
        error: error.message,
      };

      // Write error to log file asynchronously
      await writeLogEntry(name, logEntry);
    }
  }
}

// Function to run the job
async function runJob() {
  await Promise.all([
    sendHealthCheckRequest("cs330", "http://localhost:7000/health", {
      method: "GET",
    }),
    sendHealthCheckRequest(
      "elice",
      "https://api-rest.elice.io/global/account/get/",
      {
        method: "GET",
      }
    ),
  ]);
}

const job = new CronJob("*/15 * * * * *", runJob, null, true, "Asia/Seoul");
