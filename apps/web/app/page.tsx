"use client";
import { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import { ChartData } from "chart.js";
import {
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Chart,
  Tooltip,
} from "chart.js";

// Register the necessary scales and elements
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

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

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

const formatDate2 = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("ko-KR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
};

const customName = (name: string) => {
  if (name == "CS330") {
    return "CS330 (Pintos Server)";
  }
  return name;
};

const ServerCard = ({
  name,
  status,
}: {
  name: string;
  status: DomainStatus;
}) => {
  const [chartData, setChartData] = useState<ChartData<"line">>({
    labels: [],
    datasets: [],
  });
  const graphContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChartData({
      labels: status.history.map((item) => formatDate(item.timestamp)),
      datasets: [
        {
          label: `Server Status - ${name}`,
          data: status.history.map((item) => item.responseTimeMs),
          fill: false,
          borderColor: "rgba(75, 192, 192, 0.8)",
          tension: 0.1,
          pointBackgroundColor: status.history.map((item) =>
            item.responseTimeMs === 0
              ? "rgba(255, 0, 0, 1)"
              : "rgba(75, 192, 192, 0.8)"
          ),
          pointBorderColor: status.history.map((item) =>
            item.responseTimeMs === 0
              ? "rgba(255, 0, 0, 1)"
              : "rgba(75, 192, 192, 0.8)"
          ),
        },
      ],
    });
  }, [name, status.history]);

  useEffect(() => {
    if (graphContainerRef.current) {
      graphContainerRef.current.scrollLeft =
        graphContainerRef.current.scrollWidth;
    }
  }, []);

  return (
    <div className="w-full bg-white rounded-lg shadow-md overflow-hidden relative">
      <div id={name} className="relative -top-20 w-full h-0"></div>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {customName(name)}
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              status.isOnline
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {status.isOnline ? "UP" : "DOWN"}
          </span>
        </div>
        <p className="text-gray-500 text-sm mb-4 break-all">
          url:{" "}
          <a
            href={status.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {status.url}
          </a>
        </p>
        <div className="h-48 mb-4 overflow-x-auto" ref={graphContainerRef}>
          <div className="min-w-[1000px]">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                  mode: "index",
                  intersect: false,
                },
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        return `${context.parsed.y}ms`;
                      },
                    },
                  },
                },
                scales: {
                  y: {
                    position: "right",
                    suggestedMin: 0,
                    suggestedMax: 1000,
                    ticks: {
                      stepSize: 100,
                      callback: (value) => `${value}ms`,
                    },
                  },
                  x: {
                    ticks: {
                      maxRotation: 45,
                      minRotation: 45,
                      autoSkip: false,
                      callback: (_, index) =>
                        formatDate(
                          status.history[status.history.length - 1 - index]
                            ?.timestamp || ""
                        ),
                    },
                  },
                },
              }}
            />
          </div>
        </div>
        <div className="text-sm text-gray-600">
          <p>
            Last Downtime:{" "}
            <span className="font-medium">
              {status.lastDowntime
                ? formatDate2(status.lastDowntime)
                : "No downtime recorded"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [names, setDomains] = useState<Record<string, DomainStatus>>({});
  const [countdown, setCountdown] = useState(5);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      const mockData: AllServerStatus = await (
        await fetch("/api/server-status")
      ).json();

      setDomains(mockData);
      setCountdown(5);
      setLastUpdated(
        new Date().toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 5));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--kaist-blue)]">
      {/* KAIST Portal Header */}
      <div className="flex flex-col items-center justify-center pt-12 pb-6">
        <img src="/kaist-logo.svg" alt="KAIST Logo" className="h-12 mb-4" />
        <h1 className="text-4xl font-extrabold text-white mb-4 tracking-wide text-center">
          KAIST SERVER STATUS
        </h1>
      </div>
      {/* Refresh Bar */}
      <div className="fixed top-0 left-0 right-0 bg-[var(--kaist-dark-blue)] text-white py-2 px-4 z-50 h-12 shadow">
        <div className="container mx-auto flex justify-between items-center">
          <span className="font-semibold">Next refresh in: {countdown}s</span>
          <span className="text-sm">Last updated: {lastUpdated}</span>
        </div>
      </div>
      {/* Main Content */}
      <main className="mx-auto px-4 pt-4 max-w-7xl">
        {Object.keys(names).length === 0 ? (
          <div className="block text-center text-white text-2xl">
            LOADING...
            <div className="text-md mt-2">
              If loading persists, please report the issue to:{" "}
              <a
                href="mailto:skykhs3@kaist.ac.kr"
                className="underline hover:text-blue-200"
              >
                skykhs3@kaist.ac.kr
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(names)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([name, status]) => (
                <div
                  key={name}
                  className="bg-white rounded-xl shadow-lg border border-[var(--kaist-gray)]"
                >
                  <ServerCard name={name} status={status} />
                </div>
              ))}
          </div>
        )}
      </main>
      <footer className="mt-8 py-4 text-center text-[var(--kaist-light-blue)]">
        <p>© 2025 KAIST Server Status Monitor</p>
      </footer>
    </div>
  );
}
