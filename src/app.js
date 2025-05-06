import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
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
