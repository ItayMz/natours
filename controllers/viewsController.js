const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');

module.exports = {
  getOverview: catchAsync(async function (req, res) {
    // Get tour data from collection
    const tours = await Tour.find();
    let user;
    if(res.locals.user) user = res.locals.user
    // Build template
    // Render that template using tour data
    res.status(200).render('overview', {
      title: 'All Tours',
      tours,
      user
    });
  }),
  getTour: catchAsync(async function (req, res, next) {
    // Get the data, for the requested tour (including reviews and guides)
    const tour = await Tour.findOne({ slug: req.params.slug }).populate({
      path: 'reviews',
      fields: 'review rating user',
    });

    if (!tour)
      return next(new AppError('There is no tour with that name', 404));

    let commentExist,
      isBooked = false;
    let canBook = true; // These fields are variables becuase if there's no user logged in, pug will throw an error
    if (res.locals.user) {
      for (const review of tour.reviews) {
        if (review.user.id === res.locals.user.id) {
          commentExist = true;
          break;
        }
      }

      const booking = await Booking.findOne({ user: res.locals.user, tour });
      canBook = res.locals.user.role === 'user' ? true : false; //Only users can add a review
      isBooked = booking ? true : false; //If the tour is booked by the current user, prevent him from booking again by hiding the booking section
    }

    // Build template
    //Render template using the data
    res.status(200).render('tour', {
      title: tour.name,
      tour,
      isBooked,
      commentExist,
      canBook,
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
  getMyLikedTours: catchAsync(async function (req,res,next){
    const currentUser = res.locals.user
    const likedTours = await Tour.find({_id: {$in: currentUser.likedTours}})

    res.status(200).render('overview', {
      title: 'My Liked Tours',
      tours: likedTours,
    });
  }),
  getMyReviews: catchAsync(async function (req,res,next){
    const user = res.locals.user
    const getDataOptions = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${req.cookies.jwt}`, 
        'Content-Type': 'application/json'
      }
    }
    const url = process.env.NODE_ENV === 'production' ? "https://natours-1g23.onrender.com" : `http://localhost:${process.env.PORT}`
    const response = await fetch(`${url}/api/v1/users/${user.id}/reviews`, getDataOptions)
    const data = await response.json()
    const reviews = data.data.data
    res.status(200).render('reviews',{
      title: 'My reviews',
      reviews
    })
  })
};
