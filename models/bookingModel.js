const mongoose = require('mongoose');
const AppError = require('../utils/appError');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Types.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must belong to a tour!'],
  },
  user: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a user!'],
  },
  price: {
    type: Number,
    required: [true, 'Booking must have a price.'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  paid: {
    type: Boolean,
    default: true,
  },
});

bookingSchema.pre(/^find/, function (next) {
  this.populate({ path: 'user', select: 'name' }).populate({
    path: 'tour',
    select: 'name',
  });
  next();
});

bookingSchema.pre('save', async function (next) {
  const existingBooking = await this.constructor.findOne({
    user: this.user,
    tour: this.tour,
  });

  if (existingBooking) return next(new AppError("Can't book multiple times"));
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
