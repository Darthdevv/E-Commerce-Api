export const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    data: err.errData,
    stack: err.stack,
    error: err,
  });
};

export const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational === true) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      data: err.errData,
    });
  } else {
    // Programming or other unknown errors: don't leak error details
    // 1) Log Error
    console.error("ERROR 💥:", err);
    // 2) Send generic message
    res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }
};
