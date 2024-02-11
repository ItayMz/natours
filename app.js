const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-parser'); //Psrses all the cookies from incoming requests so we can have access to them
const compression = require('compression');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const viewRouter = require('./routes/viewRoutes');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const { webhookCheckout } = require('./controllers/bookingController');
const cors = require('cors');
const app = express();

//Implement CORS
app.use(cors());

app.options('*', cors());

// Defining the view engine.
app.set('view engine', 'pug');

// Defining the views directory
app.set('views', path.join(__dirname, './views'));

//GLOBAL MIDDLEWARES

//Serving static files
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());
//Set security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'worker-src': ['blob:'],
        'child-src': ['blob:', 'https://js.stripe.com/'],
        'img-src': ["'self'", 'data: image/webp'],
        'script-src': [
          "'self'",
          'https://api.mapbox.com',
          'https://cdnjs.cloudflare.com',
          'https://js.stripe.com/v3/',
          ,
          "'unsafe-inline'",
        ],
        'connect-src': [
          "'self'",
          'ws://localhost:*',
          'ws://127.0.0.1:*',
          'http://127.0.0.1:*',
          'http://localhost:*',
          'https://*.tiles.mapbox.com',
          'https://api.mapbox.com',
          'https://events.mapbox.com',
        ],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
//Development logging
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

//Limits requests from same API
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, //Limiting 100 requests per hour
  max: 100,
  message: 'Too many requests from this IP, please try again in an hour',
});
app.use('/api', limiter);

//We put this route here instead of the booking controller because in this handler function, when we receive the body from Stripe,
//the Stripe function that we're then gonna use to actually read the body needs this body in a raw form (A string and not JSON)
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  webhookCheckout
);

//Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); //When the req.body is greater than 10kb, the request will not be sent
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
//Data sanitization against NoSQL query injection
app.use(mongoSanitize());
//Data sanitization against XSS
app.use(xss());

//Prevent parameter pollution
app.use(
  hpp({
    whiteList: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'difficulty',
      'price',
    ],
  })
);

app.use(compression());
//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//ROUTES

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.use(globalErrorHandler);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

module.exports = app;
