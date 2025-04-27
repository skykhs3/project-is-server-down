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
} from "chart.js";

// Register the necessary scales and elements
Chart.register(CategoryScale, LinearScale, PointElement, LineElement);

interface ServerStatus {
  timestamp: string;
  responseTimeMs: number;
}

interface DomainStatus {
  lastDowntime: string;
  isOnline: boolean;
  history: ServerStatus[];
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const generateMockData = (domain: string): DomainStatus => {
  const now = new Date();
  const history: ServerStatus[] = [];

  // Generate 5 seconds of data
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 5000);
    const ping = Math.random() * 1000;
    history.push({
      timestamp: date.toISOString(),
      responseTimeMs: ping,
    });
  }

  // Find last downtime
  const lastDowntime =
    history
      .slice()
      .reverse()
      .find((item) => item.responseTimeMs > 1000)?.timestamp || "";

  return {
    lastDowntime,
    isOnline: history[history.length - 1]?.responseTimeMs !== 0,
    history,
  };
};

const ServerCard = ({
  domain,
  status,
}: {
  domain: string;
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
          label: `Server Status - ${domain}`,
          data: status.history.map((item) => item.responseTimeMs),
          fill: false,
          borderColor: "rgba(75, 192, 192, 0.8)",
          tension: 0.1,
        },
      ],
    });
  }, [domain, status.history]);

  useEffect(() => {
    if (graphContainerRef.current) {
      graphContainerRef.current.scrollLeft =
        graphContainerRef.current.scrollWidth;
    }
  }, []);

  return (
    <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">{domain}</h3>
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
        <div className="h-48 mb-4 overflow-x-auto" ref={graphContainerRef}>
          <div className="min-w-[800px]">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
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
                        formatDate(status.history[index]?.timestamp || ""),
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
                ? formatDate(status.lastDowntime)
                : "No downtime recorded"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const [domains, setDomains] = useState<Record<string, DomainStatus>>({});
  const [countdown, setCountdown] = useState(5);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    const fetchData = () => {
      const mockDomains = [
        "kaist.elice.io",
        "klms.kaist.ac.kr",
        "sso.kaist.ac.kr",
        "otl.sparcs.org",
        "CS330 (OS SERVER)",
      ];
      const mockData = mockDomains.reduce(
        (acc, domain) => {
          acc[domain] = generateMockData(domain);
          return acc;
        },
        {} as Record<string, DomainStatus>
      );

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
    <div className="h-screen bg-gray-100">
      {/* <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white py-2 px-4 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <span className="font-semibold">Next refresh in: {countdown}s</span>
          <span className="text-sm">Last updated: {lastUpdated}</span>
        </div>
      </div> */}
      <main className="container mx-auto px-4 py-8 mt-16">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          KAIST Server Status Monitor
        </h1>
        <div className="grid grid-cols-1 gap-6">
          {Object.entries(domains).map(([domain, status]) => (
            <ServerCard key={domain} domain={domain} status={status} />
          ))}
        </div>
      </main>
      <footer className="mt-8 py-4 text-center text-gray-600">
        <p>© 2025 KAIST Server Status Monitor</p>
      </footer>
    </div>
  );
}
