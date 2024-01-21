const AppError = require('../utils/appError')

function handleCastErrorDB(err){
  const message = `Invalid ${err.path}: ${err.value}`
  return new AppError(message, 400)
}

function handleDuplicateFieldsDB(err){
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value} Please use another value`
  return new AppError(message, 400)
}

function handleValidationErrorDB(err){
  const errors = Object.values(err.errors).map(el => el.message)
  const message = `Invalid input data. ${errors.join('. ')}`
  return new AppError(message, 400)
}

function handleJWTError(){
  return new AppError('Invalid token. Please log in again!', 401)
}
function handleJWTExpiredError(){
  return new AppError('Your token has expired! Please log in again.', 401)

}

function sendErrorDev(err, res) {
  console.log(err);
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
}

function sendErrorProd(err, res) {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    console.log(err);
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }
  // Programming or other unknown error: don't leak error details
  else {
    console.error('ERROR', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
}

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  err.message = err.message || 'something went wrong'
  if (process.env.NODE_ENV.trim() === 'development') sendErrorDev(err, res);
  
  if (process.env.NODE_ENV.trim() === 'production'){
    let error = Object.create(err)
    if(error.name === 'CastError') error = handleCastErrorDB(error)
    if(error.code === 11000) error = handleDuplicateFieldsDB(error)
    if(error.name === 'ValidationError') error = handleValidationErrorDB(error)
    if(error.name === 'JsonWebTokenError') error = handleJWTError()
    if(error.name === 'TokenExpiredError') error = handleJWTExpiredError()
    sendErrorProd(error, res);
  } 
  else{
    res.status(500).json({
      status: 'fail',
      message: 'node.js dunno the node_env 🤷‍♂️'
    })
  }
  
};
