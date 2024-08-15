class appError extends Error {
  constructor(message, statusCode, errorData) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.errorData = errorData ? errorData : null;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default appError;
