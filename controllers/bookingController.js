const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const factory = require('./handlerFactory');
module.exports = {
  createBooking: factory.createOne(Booking),
  getBooking: factory.getOne(Booking),
  getAllBookings: factory.getAll(Booking),
  updateBooking: factory.updateOne(Booking),
  deleteBooking: factory.deleteOne(Booking),

  getCheckoutSession: catchAsync(async function (req, res, next) {
    // 1) get the currently booked tour
    const tour = await Tour.findById(req.params.tourId);

    // 2) Create checkout session

    // Information about the session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      success_url: `${req.protocol}://${req.get('host')}/?tour=${
        req.params.tourId
      }&user=${req.user.id}&price=${tour.price}`,
      cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
      customer_email: req.user.email,
      client_reference_id: req.params.tourId,
      mode: 'payment',

      // Information about the product that the user is about to purchase
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: tour.price * 100,

            product_data: {
              name: `${tour.name} Tour`,
              description: tour.summary,
              images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
            },
          },
        },
      ],
    });
    // 3) Create session as response
    res.status(200).json({
      status: 'success',
      session,
    });
  }),
  createBookingCheckout: catchAsync(async function (req, res, next) {
    // This is only TEMPORARY because it's not secure
    const { tour, user, price } = req.query;

    if (!tour && !user && !price) return next();
    await Booking.create({ tour, user, price });

    res.redirect(req.originalUrl.split('?')[0]);
  }),
};
