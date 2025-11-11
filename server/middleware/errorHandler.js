import mongoose from 'mongoose';

export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error with full details in development
  console.error('❌ Error Details:', {
    message: err.message,
    name: err.name,
    code: err.code,
    statusCode: err.statusCode || error.statusCode,
    url: req.originalUrl || req.url,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
  
  // Log MongoDB connection status
  if (err.name === 'MongoError' || err.message?.includes('MongoDB') || err.message?.includes('database')) {
    console.error('❌ MongoDB connection state:', mongoose.connection.readyState);
    console.error('  0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting');
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'المورد غير موجود';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'قيمة مكررة في قاعدة البيانات';
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  const statusCode = error.statusCode || 500;
  
  // Ensure message is always a string, never null
  const errorMessage = error.message || err.message || 'خطأ في الخادم';
  
  const response = {
    success: false,
    message: String(errorMessage),
  };

  // Only add development details if in development mode
  if (process.env.NODE_ENV === 'development') {
    if (err.message) {
      response.details = String(err.message);
    }
    if (err.stack) {
      response.stack = String(err.stack);
    }
  }

  console.error('❌ Sending error response:', {
    statusCode,
    message: response.message,
  });

  // Ensure we always send valid JSON
  if (!res.headersSent) {
    res.status(statusCode).json(response);
  }
};
