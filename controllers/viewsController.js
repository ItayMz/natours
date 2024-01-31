const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');

module.exports = {
  getOverview: catchAsync(async function (req, res) {
    // Get tour data from collection
    const tours = await Tour.find();
    // Build template
    // Render that template using tour data
    res.status(200).render('overview', {
      title: 'All Tours',
      tours,
    });
  }),
  getTour: catchAsync(async function (req, res, next) {
    console.log('TOUR?', req.tour);
    // Get the data, for the requested tour (including reviews and guides)
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
      path: 'reviews',
      fields: 'review rating user',
    });

    if (!tour)
      return next(new AppError('There is no tour with that name', 404));

    const booking = await Booking.findOne({ user: res.locals.user, tour });

    let commentExist = false;
    if (res.locals.user) {
      for (const review of tour.reviews) {
        if (review.user.id === res.locals.user.id) {
          commentExist = true;
          break;
        }
      }
    }
    const isBooked = booking ? true : false;
    // Build template
    //Render template using the data
    res.status(200).render('tour', {
      title: tour.name,
      tour,
      isBooked,
      commentExist,
    });
  }),
  getLoginForm: function (req, res) {
    res.status(200).render('login', {
      title: 'Log into your account',
    });
  },
  getSignUpForm: function (req, res) {
    res.status(200).render('signup', {
      title: 'Sign up',
    });
  },
  getReviewForm: catchAsync(async function (req, res) {
    const tour = await Tour.findOne({ slug: req.params.slug });
    const user = res.locals.user;
    res.status(200).render('review', {
      title: `Review ${tour.name}`,
      tour,
      user,
    });
  }),
  getAccount: function (req, res) {
    res.status(200).render('account', {
      title: 'Your account',
    });
  },
  updateUserData: catchAsync(async function (req, res, next) {
    const { name, email } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).render('account', {
      title: 'Your account',
      user: updatedUser,
    });
  }),

  getMyTours: catchAsync(async function (req, res, next) {
    // 1) Find all bookings
    const bookings = await Booking.find({ user: req.user.id });
    // 2) Find tours with the returned IDs

    const tourIDs = bookings.map((booking) => booking.tour);
    const tours = await Tour.find({ _id: { $in: tourIDs } });

    res.status(200).render('overview', {
      title: 'My Tours',
      tours,
    });
  }),
};
