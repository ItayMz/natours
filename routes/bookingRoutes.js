const express = require('express');
const router = express.Router({mergeParams: true});
const {
  getCheckoutSession,
  createBooking,
  getBooking,
  updateBooking,
  deleteBooking,
  getAllBookings,
} = require('../controllers/bookingController');
const { protect, restrictTo } = require('../controllers/authController');
const { setTourUserIds } = require('../controllers/reviewController');


router.use(protect)
router.get('/checkout-session/:tourId', restrictTo('user'), getCheckoutSession);

router.use(restrictTo('admin', 'lead-guide'))
router.route('/').get( getAllBookings).post(setTourUserIds, createBooking);
router.route('/:id').get(getBooking).patch(updateBooking).delete(deleteBooking);


module.exports = router;

// Create, get, read, update
