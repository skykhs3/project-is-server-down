"use client";
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
import { useParams } from "next/navigation";

// Register the necessary scales and elements
Chart.register(CategoryScale, LinearScale, PointElement, LineElement);

interface ServerStatus {
  date: string;
  status: number;
}

const GraphComponent = () => {
  const params = useParams();
  const domain = params.domain as string;
  const [data, setData] = useState<ChartData<"line">>({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(
        `/api/server-status?domain=${domain}&timeRange=2h`
      );
      const json: ServerStatus[] = await response.json();

      setData({
        labels: json.map((item) => item.date),
        datasets: [
          {
            label: `Server Status - ${domain}`,
            data: json.map((item) => item.status),
            fill: false,
            backgroundColor: "rgb(75, 192, 192)",
            borderColor: "rgba(75, 192, 192, 0.8)",
          },
        ],
      });
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [domain]);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Server Status (Last 2 Hours)
      </h2>
      <div className="w-full h-96">
        <Line data={data} />
      </div>
    </div>
  );
};

const StatusComponent = () => {
  const params = useParams();
  const domain = params.domain as string;
  const [status, setStatus] = useState({ lastDowntime: "", currentStatus: "" });

  useEffect(() => {
    const fetchStatus = async () => {
      const response = await fetch(
        `/api/server-recent-status?domain=${domain}&timeRange=2h`
      );
      const json = await response.json();
      setStatus(json[domain]);
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [domain]);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Current Server Status - {domain}
      </h2>
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 mb-2">
          Last Downtime:{" "}
          <span className="font-medium">{status.lastDowntime}</span>
        </p>
        <p className="text-sm text-gray-600">
          Current Status:{" "}
          <span
            className={`font-medium ${
              status.currentStatus === "UP" ? "text-green-600" : "text-red-600"
            }`}
          >
            {status.currentStatus}
          </span>
        </p>
      </div>
    </div>
  );
};

export default function DomainPage() {
  const params = useParams();
  const domain = params.domain as string;

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Monitoring: {domain}
          </h1>
          <GraphComponent />
          <StatusComponent />
        </div>
      </main>
      <footer className="mt-8 py-4 text-center text-gray-600">
        <p>© 2024 Server Status Monitor</p>
      </footer>
    </div>
  );
}
