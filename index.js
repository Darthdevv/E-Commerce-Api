import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectToMongoDB from "./db/connection.js";
import * as router from "./routes/index.js"
import {
  notFound,
  globalErrorHandler,
} from "./middlewares/error/error.middleware.js";

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
app.use("/api/brands", router.brandRouter);
app.use("/api/categories", router.categoryRouter);
app.use("/api/subcategories", router.subCategoryRouter);
app.use("/api/products", router.productRouter);
app.use(notFound);
app.use(globalErrorHandler);

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
