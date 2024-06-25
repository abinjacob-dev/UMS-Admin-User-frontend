const jwt = require("jsonwebtoken");
const isLogin = async (req, res, next) => {
  try {
    if (req.session.user_id && req.cookies.jwt) {
      const token = req.cookies.jwt;
      jwt.verify(token, "user-token", (error, decodedToken) => {
        if (error) {
          console.log(error.message);
          return res.redirect("/login");
        } else {
          console.log(decodedToken);
          
        }
      });
    } else {
    return  res.redirect("/login");
    }
    next();
  } catch (error) {
    console.log(error.message);
  }
};
const isLogout = async (req, res, next) => {
  try {
    if (req.session.user_id && req.cookies.jwt) {
      
   return res.redirect("/home")
    // next()
    }
    next();
  } catch (error) {
    console.log(error.message);
  }
};


module.exports = {
  isLogin,
  isLogout,
  
};
