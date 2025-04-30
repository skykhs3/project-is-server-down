import cors, { CorsOptions } from "cors";
let whiteList = [
  "https://kaist.vercel.app",
  "https://kaist.site",
  "https://www.kaist.site",
  "http://localhost:3000",
];

let corsOptions: CorsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    if (origin && whiteList.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

export default cors(corsOptions);
