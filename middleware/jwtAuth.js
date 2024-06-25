const jwt = require("jsonwebtoken");
const User = require("../models/userModels");
const roles = require("../models/role");
const requirejwtAuth = async (req, res, next) => {
  const token = req.cookies.jwt;
  try {
    // Check JWT exists is verified
    if (token) {
      jwt.verify(token, "user-token", (error, decodedToken) => {
        if (error) {
          console.log(error.message);
          return res.redirect("/login");
        } else {
          console.log(decodedToken);
          next();
        }
      });
    } else {
      return res.redirect("/login");
    }
  } catch (error) {
    console.lof(error.message);
  }
};
// Admin Token
const adminAuth = async (req, res, next) => {
  const token = req.cookies.jwt_admin;
  try {
    // Check JWT exists is verified
    if (token) {
      jwt.verify(token, "admin-token", (error, decodedToken) => {
        if (error) {
          console.log(error.message);
          return res.redirect("/admin/login");
        } else {
          console.log(decodedToken);
          next();
        }
      });
    } else {
      return res.redirect("/admin/login");
    }
  } catch (error) {
    console.log(error.message);
  }
};

// user Data
const checkUser = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, "user-token", async (error, decodedToken) => {
      if (error) {
        console.log(error.message);
        res.locals.userData = null;

        next();
      } else {
        console.log(decodedToken);
        const userData = await User.findById(decodedToken.id);
        res.locals.userData = userData;
        next();
      }
    });
  } else {
    res.locals.userData = null;
    next();
  }
};

function authRole(role) {
  return async (req, res, next) => {
    const user_id = req.session.user_id;
    const userData = await User.findById(user_id);
    console.log(userData)
    if (userData.role !== role ) {
      res.status(401);
      return res.send("Not Allowed");
    }
    
    next();
  };
}

module.exports = {
  requirejwtAuth,
  checkUser,
  authRole,
  adminAuth,
};
