"use client";
import { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import { ChartData } from "chart.js";
import Image from "next/image";
import {
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Chart,
  Tooltip,
} from "chart.js";

const defaultURL: string = process.env.NEXT_PUBLIC_API_DEV_URL || "";

// Register the necessary scales and elements
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip);

export type AllServerStatus = Record<string, DomainStatus>;
export type AllServerStatusList = [string, DomainStatus][];
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

const customizeServerName = (
  serverNameList: AllServerStatusList
): AllServerStatusList => {
  const res1: AllServerStatusList = serverNameList.sort((a, b) => {
    // 우선 정렬할 서버 이름들
    const priorityServers = ["KLMS", "OTL", "CS330", "Elice", "SSO"];

    for (const server of priorityServers) {
      if (a[0] == server) {
        return -1;
      }
      if (b[0] == server) {
        return 1;
      }
    }
    // 그 외의 경우 알파벳 순으로 정렬
    return a[0].localeCompare(b[0]);
  });

  const res2: AllServerStatusList = res1.map(([name, status]) => {
    if (name == "CS330") {
      return ["CS330 (Pintos Server)", status];
    }
    return [name, status];
  });
  return res2;
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
          <h3 className="text-xl font-semibold text-gray-800">{name}</h3>
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
                    suggestedMax: 400,
                    ticks: {
                      stepSize: 50,
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
  const REFRESH_INTERVAL_IN_SECONDS_FOR_DISPLAY = 10;
  const REFRESH_INTERVAL_IN_MILLISECONDS_FOR_FETCH = 500;
  const [serverNameList, setServerNameList] = useState<AllServerStatusList>([]);
  const [countdown, setCountdown] = useState(0);
  const [currentTime, setCurrentTime] = useState<string>("---");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("ko-KR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };

    const updateCountdown = () => {
      const now = new Date();
      const seconds = now.getSeconds();
      setCountdown(
        (REFRESH_INTERVAL_IN_SECONDS_FOR_DISPLAY -
          (seconds % REFRESH_INTERVAL_IN_SECONDS_FOR_DISPLAY)) %
          REFRESH_INTERVAL_IN_SECONDS_FOR_DISPLAY
      );
    };

    updateTime();
    updateCountdown();

    const timeInterval = setInterval(updateTime, 1000);
    const countdownInterval = setInterval(updateCountdown, 1000);
    return () => {
      clearInterval(timeInterval);
      clearInterval(countdownInterval);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      let resJson: AllServerStatus = {};
      try {
        resJson = await (await fetch(defaultURL + "/api/server-status")).json();
      } catch (error) {
        if (error instanceof Error) {
          console.error(error.message);
        }
        resJson = {};
      }

      for (const k in resJson) {
        if (resJson[k]?.history) {
          resJson[k].history = resJson[k].history.reverse();
        }
      }
      const resArray: AllServerStatusList = Object.entries(resJson);
      setServerNameList(customizeServerName(resArray));
    };
    fetchData();
    const interval = setInterval(
      fetchData,
      REFRESH_INTERVAL_IN_MILLISECONDS_FOR_FETCH
    );
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--kaist-blue)]">
      {/* KAIST Portal Header */}
      <div className="flex flex-col items-center justify-center pt-12">
        <h1 className="text-4xl font-extrabold text-white pt-8 px-4 pb-4 tracking-wide text-center">
          KAIST SERVER STATUS
        </h1>
      </div>
      {/* Refresh Bar */}
      <div className="fixed top-0 left-0 right-0 bg-[var(--kaist-dark-blue)] text-white py-2 px-4 z-50 h-12 shadow items-center flex justify-between">
        <span className="font-semibold">Next Refresh in: {countdown}s</span>
        <span className="text-sm">Current Time: {currentTime}</span>
      </div>
      {/* Main Content */}
      <main className="mx-auto px-4 pt-4 max-w-7xl">
        {serverNameList.length === 0 ? (
          <div className="block text-center text-white text-3xl">
            LOADING...
            <div className="text-lg mt-2">
              If loading persists, please report the issue.
            </div>
            <a
              href="https://forms.gle/hbmMxVh1Xs3UAeN56"
              className="underline hover:text-blue-200 text-lg"
              target="_blank"
              rel="noopener noreferrer"
            >
              Bug Report or Suggestion
            </a>
            <Image
              src="/nupjuk.png"
              width={500}
              height={500}
              alt="nupjuk"
              className="h-1/2 mx-auto"
              priority={true}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serverNameList.map(([name, status]) => (
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
        <a
          href="https://forms.gle/hbmMxVh1Xs3UAeN56"
          className="underline hover:text-blue-200 text-lg"
          target="_blank"
          rel="noopener noreferrer"
        >
          Bug Report or Suggestion
        </a>
        <p>© 2025 KAIST Server Status Monitor</p>
      </footer>
    </div>
  );
}
