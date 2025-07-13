const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error.status = 400;
    error.message = 'Validation Error';
    error.details = err.details;
  } else if (err.name === 'UnauthorizedError') {
    error.status = 401;
    error.message = 'Unauthorized';
  } else if (err.name === 'ForbiddenError') {
    error.status = 403;
    error.message = 'Forbidden';
  } else if (err.name === 'NotFoundError') {
    error.status = 404;
    error.message = 'Resource Not Found';
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && error.status === 500) {
    error.message = 'Internal Server Error';
  }

  res.status(error.status).json({
    error: error.message,
    status: error.status,
    timestamp: new Date().toISOString(),
    path: req.path,
    ...(error.details && { details: error.details })
  });
};

module.exports = errorHandler; 