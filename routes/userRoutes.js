const express = require('express');
const bookingRouter = require('../routes/bookingRoutes')
const reviewRouter = require('../routes/reviewRoutes')
const router = express.Router();
router.use('/:userId/bookings', bookingRouter);
router.use('/:userId/reviews', reviewRouter)


const {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe,
  uploadUserPhoto,
  resizeUserPhoto,
  
} = require('../controllers/userController');

const {
  signup,
  login,
  logout,
  isLoggedIn,
  forgotPassword,
  resetPassword,
  updatePassword,
  protect,
  restrictTo,
} = require('../controllers/authController');

//AUTH CONTROLLER

router.post('/signup', signup);
router.post('/login', login);
router.get('/logout', logout);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);
router.get('/isLoggedIn', isLoggedIn);
router.use(protect); // Protecting all our routes starting from this line of code, because middleware runs in sequence

router.patch('/updateMyPassword', updatePassword);
router.get('/me', getMe);
router.patch('/updateMe',uploadUserPhoto, resizeUserPhoto, updateMe); 
router.delete('/deleteMe', deleteMe);

//USER CONTROLLER

router.use(restrictTo('admin'));

router.route('/').get(getAllUsers);

router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
