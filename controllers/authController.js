const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');
const crypto = require('crypto');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}

function createSendToken(user, statusCode, res) {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 //90 days
    ),
    secure: true, //The cookie will only be sent on an encrypted connection
    httpOnly: true, //The cookie can't be accessed or modified in any way by the browser- prevents xss attacks
    sameSite: 'None',
  };
  // if(process.env.NODE_ENV === 'production'){ cookieOptions.secure = true}
  res.cookie('jwt', token, cookieOptions);

  //Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
}

module.exports = {
  signup: catchAsync(async function (req, res, next) {
    const newUser = await User.create(req.body);
    console.log(newUser);
    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser, url).sendWelcome();
    createSendToken(newUser, 201, res);
  }),

  login: catchAsync(async function (req, res, next) {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }
    const user = await User.findOne({ email }).select('+password'); //Include password field in the output
    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    createSendToken(user, 200, res);
  }),
  logout: function (req, res) {
    // The original jwt token is sent through a secure cookie that we can't modify so the solution will be sending a "dummy" cookie with no content that will replace the jwt and expire in 10s
    res.cookie('jwt', 'logged out', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
      secure: true
    });
    res.status(200).json({ status: 'success' });
  },

  protect: catchAsync(async function (req, res, next) {
    // 1) Getting the token and check if it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) token = req.cookies.jwt;

    if (!token) {
      return next(
        new AppError('You are not logged in! Please log in to get access', 401)
      );
    }

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); //The jwt.verify() function expects a callback function but instead we can make it return a prmoise and just await it
    // 3) Check if user still exists

    const currentUser = await User.findById(decoded.id);
    if (!currentUser)
      return next(
        new AppError('The user belonging to this token does no longer exist')
      );
    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError(
          'User reccently changed password! Please log in again.',
          401
        )
      );
    }
    //GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  }),

  //Only for rendered pages, no errors!
  isLoggedIn: async function (req, res, next) {
    try {
      if (req.cookies.jwt) {
        // 1) Verify token
        const decoded = await promisify(jwt.verify)(
          req.cookies.jwt,
          process.env.JWT_SECRET
        );

        // 2) Check if user still exists

        const currentUser = await User.findById(decoded.id);
        if (!currentUser) return next();

        // 3) Check if user changed password after the token was issued
        if (currentUser.changedPasswordAfter(decoded.iat)) {
          return next();
        }
        //THERE IS A LOGGED IN USER
        res.locals.user = currentUser;
        return next();
      }
      next();
    } catch (err) {
      return next();
    }
  },

  restrictTo: function (...roles) {
    return function (req, res, next) {
      if (!roles.includes(req.user.role))
        return next(
          new AppError("You don't have permission to perform this action", 403)
        );
      next();
    };
  },
  forgotPassword: catchAsync(async function (req, res, next) {
    // 1) Get user based on posted email
    const user = await User.findOne({ email: req.body.email });
    if (!user)
      return next(
        new AppError('There is no user with that email address.', 404)
      );

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateModifiedOnly: true }); //This will deactivate all the validators that we specifeid in our schema

    // 3) Send it to user's email
    try {
      const resetURL = `${req.protocol}://${req.get(
        'host'
      )}/api/v1/users/resetPassword/${resetToken}`;
      await new Email(user, resetURL).sendPasswordReset();
      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!',
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateModifiedOnly: true });
      return next(
        new AppError(
          'There was an error sending the email. Try again later!',
          500
        )
      );
    }
  }),
  resetPassword: catchAsync(async function (req, res, next) {
    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    // 2) If token has not expired, and there is a user, set the new password
    if (!user) return next(new AppError('Token is not valid or expired', 400));

    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // 3) Update changedPasswordAt property for the user
    // 4) Log the user in, send JWT
    await user.save();

    createSendToken(user, 200, res);
  }),
  updatePassword: catchAsync(async function (req, res, next) {
    // 1) Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    // 2) Check if posted current password is correct
    if (!(await user.correctPassword(req.body.currentPassword, user.password)))
      return next(new AppError('Your current password is wrong.', 401));
    // 3) If so, update password
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    await user.save();
    // 4) Log user in, send JWT
    createSendToken(user, 200, res);
  }),
};
