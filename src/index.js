import connectDb from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";
import { initializeAdmin } from "./controller/admin.controller.js";

dotenv.config({
  path: "./.env",
});

initializeAdmin();

connectDb()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(
        `server is running on port: ${process.env.PORT} AND http://localhost:8000/`
      );
    });
    app.on("error", (error) => {
      console.log("Error", error);
      throw err;
    });
    app.get("/", (req, res) => {
      res.send("Welcome to the FYP MANAGEMENT SYSTEM API");
    });
  })
  .catch((err) => {
    console.log(`Mongodb connection is failed: ${err}`);
  });
