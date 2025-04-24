"use client";
import Image, { type ImageProps } from "next/image";
import { Button } from "@repo/ui/button";
import styles from "./page.module.css";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { ChartData } from "chart.js";
import {
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Chart,
} from "chart.js";

// Register the necessary scales and elements
Chart.register(CategoryScale, LinearScale, PointElement, LineElement);

interface ServerStatus {
  date: string;
  status: number;
}

const GraphComponent = () => {
  const [data, setData] = useState<ChartData<"line">>({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/api/server-status"); // Replace with actual endpoint
      const json: ServerStatus[] = await response.json();
      // Process json to fit chart.js data format
      setData({
        labels: json.map((item: ServerStatus) => item.date),
        datasets: [
          {
            label: "Server Status",
            data: json.map((item: ServerStatus) => item.status),
            fill: false,
            backgroundColor: "rgb(75, 192, 192)",
            borderColor: "rgba(75, 192, 192, 0.2)",
          },
        ],
      });
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  return <Line data={data} />;
};

const StatusComponent = () => {
  const [status, setStatus] = useState({ lastDowntime: "", currentStatus: "" });

  useEffect(() => {
    const fetchStatus = async () => {
      const response = await fetch("/api/server-recent-status"); // Replace with actual endpoint
      const json = await response.json();
      setStatus({
        lastDowntime: json.lastDowntime,
        currentStatus: json.currentStatus,
      });
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>Server Status</h2>
      <p>Last Downtime: {status.lastDowntime}</p>
      <p>Current Status: {status.currentStatus}</p>
    </div>
  );
};

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.ctas}>
          <GraphComponent />
          <StatusComponent />
        </div>
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
