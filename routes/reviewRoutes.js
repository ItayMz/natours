//TODO: Define routes for GET /reviews (get all reviews) and POST /reviews (create a review)
//Then create a review and retrieve from DB

const express = require('express');
const router = express.Router({mergeParams: true}); //We merge parameters to access the previous route

// POST /tour/sefr3q3sq2/reviews
// GET /tour/sefr3q3sq2/reviews

const {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds,
  getReview,
} = require('../controllers/reviewController');
const { protect, restrictTo } = require('../controllers/authController');
const { checkIfBooked } = require('../controllers/bookingController');

router.use(protect)

router
  .route('/')
  .get(getAllReviews)
  .post( restrictTo('user'), setTourUserIds, checkIfBooked ,createReview);



  router.route('/:id').get(getReview).patch(restrictTo('user','admin'),updateReview).delete(restrictTo('user','admin'),deleteReview)

module.exports = router;
