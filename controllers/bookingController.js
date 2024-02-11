const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const catchAsync = require('../utils/catchAsync');
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const factory = require('./handlerFactory');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
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
      // success_url: `${req.protocol}://${req.get('host')}/?tour=${
      //   req.params.tourId
      // }&user=${req.user.id}&price=${tour.price}`,
      success_url: `${req.protocol}://${req.get('host')}/my-tours`,
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
              images: [`${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`],
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
  // createBookingCheckout: catchAsync(async function (req, res, next) {
  //   // This is only TEMPORARY because it's not secure
  //   const { tour, user, price } = req.query;

  //   if (!tour && !user && !price) return next();

  //   const userDB = await User.findById(user)

  //   await Booking.create({ tour, user, price });

  //   res.redirect(req.originalUrl.split('?')[0]);
  // }),
  createBookingCheckout: catchAsync( async function(session){
    const tour = session.client_reference_id;
    const user = (await User.findOne({email: session.customer_email})).id
    const price = session.line_items[0].amount/100;
    await Booking.create({ tour, user, price }); 
  }),
  webhookCheckout: function (req, res, next) {
    const signature = req.headers['stripe-signature'];
    let event;
    try{
       event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    }catch(err){
      return res.status(400).send(`Webhook error: ${err.message}`)
    }

    if(event.type === 'checkout.session.completed')
      this.createBookingCheckout(event.data.object)

    res.status(200).json({received: true})
    
  },
  checkIfBooked: catchAsync(async function (req, res, next) {
    const bookings = await Booking.find({
      user: req.user.id,
      tour: req.body.tour,
    });
    if (bookings.length === 0)
      return next(new AppError('You must buy this tour to review it'));
    next();
  }),
};
