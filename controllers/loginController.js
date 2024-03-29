const bcrypt = require("bcrypt");
const createError = require("http-errors");
const jwt = require("jsonwebtoken");

const User = require("../models/People");
const Conversation = require("../models/Conversation");

function getLogin(req, res) {
 res.render("index");
}

async function login(req, res, next) {
 try {
  const user = await User.findOne({
   $or: [
    {
     username: req.body.username,
    },
    {
     email: req.body.username,
    },
   ],
  });
  if (user && user._id) {
   const isValidPass = await bcrypt.compare(req.body.password, user.password);
   if (isValidPass) {
    const userObj = {
     userid: user._id,
     name: user.name,
     username: user.username,
     email: user.email,
     avatar: user.avatar || null,
     role: user.role || "user",
    };
    const token = jwt.sign(userObj, process.env.JWT_SECRET, {
     expiresIn: process.env.JWT_EXPIRY + "d",
    });
    res.cookie(process.env.COOKIE_NAME, token, {
     expires: new Date(
      Date.now() + process.env.JWT_EXPIRY * 24 * 60 * 60 * 1000
     ),
     httpOnly: true,
     signed: true,
    });
    res.locals.loggedInUser = userObj;
    res.redirect("/");
   } else {
    throw createError("User not found or invalid credentials.");
   }
  } else {
   throw createError("User not found or invalid credentials.");
  }
 } catch (err) {
  res.render("index", {
   data: {
    username: req.body.username,
   },
   errors: {
    common: {
     msg: err.message,
    },
   },
  });
 }
}

function logout(req, res, next) {
 res.clearCookie(process.env.COOKIE_NAME);
 res.locals.loggedInUser = null;
 res.locals.data = null;
 res.send("You have been logged out.");
}

module.exports = {
 getLogin,
 login,
 logout,
};
