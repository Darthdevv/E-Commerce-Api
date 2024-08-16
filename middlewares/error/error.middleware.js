import appError from "../../utils/appError.js";
import { sendErrorDev, sendErrorProd } from "../../utils/envError.js";

// Unsupported 404 routes
export const notFound = (req, res, next) => {
  next(new appError(`Can't find ${req.originalUrl} on this server`, 400));
};

// Global Error Handling Middleware
export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  err.errData = err.errData;

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    sendErrorProd(err, res);
  }
};
