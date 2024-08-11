import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectToMongoDB from "./db/connection.js";
// import userRoutes from "./routes/user.routes.js";
// import jobRoutes from "./routes/job.routes.js";
// import companyRoutes from "./routes/company.routes.js";
// import applicationRoutes from "./routes/application.routes.js";
// import {
//   notFound,
//   globalErrorHandler,
// } from "./middlewares/error/error.middleware.js";

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  console.log("UNHANDLED EXCEPTION! 💥 shutting down...");
  process.exit(1);
});

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});
// app.use("/api/users", userRoutes);
// app.use("/api/jobs", jobRoutes);
// app.use("/api/companies", companyRoutes);
// app.use("/api/applications", applicationRoutes);
// app.use(notFound);
// app.use(globalErrorHandler);

connectToMongoDB();
const server = app.listen(PORT, () => {
  console.log(`App listening on port ${PORT} 📟`);
});

process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  console.log("UNHANDLED REJECTION! 💥 shutting down...");
  server.close(() => {
    process.exit(1);
  });
});
