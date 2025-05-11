import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://fyp-management-system.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "16kb",
  })
);

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use(cookieParser());

// import routes
import adminRouter from "./routes/admin.route.js";
app.use("/api/v1/admin", adminRouter);

// import supervisor routes
import supervisorRouter from "./routes/supervisor.route.js";
app.use("/api/v1/supervisor", supervisorRouter);

// import student routes
import studentRouter from "./routes/student.route.js";
app.use("/api/v1/student", studentRouter);

export { app };
