const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  getMe
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
router.get('/logout', logout)
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);
router.get('/isLoggedIn', isLoggedIn)
router.use(protect) // Protecting all our routes starting from this line of code, because middleware runs in sequence

router.patch('/updateMyPassword',  updatePassword);
router.get('/me', getMe)
router.patch('/updateMe', updateMe);
router.delete('/deleteMe', deleteMe);


//USER CONTROLLER

router.use(restrictTo('admin'))

router.route('/').get(getAllUsers)

router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

module.exports = router;
