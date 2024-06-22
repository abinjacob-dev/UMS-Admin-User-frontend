const User = require("../models/userModels");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const randomString = require("randomstring");
const userModels = require("../models/userModels");
const dotenv = require("dotenv").config();
const config = require("../config/config");
const { link } = require("../routes/userRoute");

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

// for send mail
console.log(process.env.SMTP_EMAIL);
const sendVerifyMail = async (name, email, user_id) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.emailUser,
        pass: config.emailpassword,
      },
    });
    const mailOptions = {
      from: "shinytm36@gmail.com",
      to: email,
      subject: "Verification mail",
      html:
        "<p>Hi,  " +
        name +
        ' Please click here to <a href="http://localhost:3000/verify?id=' +
        user_id +
        '"> verify </a> your mail.</p>',
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has seen send:-", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

// for reset password sendmail

const sendResetPasswordMail = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.emailUser,
        pass: config.emailpassword,
      },
    });
    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: "For Reset Password",
      html:
        "<p>Hi " +
        name +
        ', Please click here to <a href="http://localhost:3000/forget-password?token=' +
        token +
        '"> Reset </a> your Password.</p>',
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has seen send:-", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

const loadRegister = async (req, res) => {
  try {
    return res.render("registration");
  } catch (error) {
    console.log(error.message);
  }
};
const insertUser = async (req, res) => {
  try {
    const spassword = await securePassword(req.body.password);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mno,
      image: req.body.name,
      password: spassword,
      is_admin: 0,

      // image: req.file.filename,
      // comment down
      // spassword - secure passsword
    });
    const userData = await user.save();
    if (userData) {
      sendVerifyMail(req.body.name, req.body.email, userData._id);

      return res.render("registration", {
        message: "Registration Successful, Please verify your mail",
      });
    } else {
      return res.render("registration", { message: "Registration Failed" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const verifyMail = async (req, res) => {
  try {
    const updateInfo = await User.updateOne(
      { _id: req.query.id },
      { $set: { is_verified: 1 } }
    );
    console.log(updateInfo);
    // viewa/layout ->email-verified.ejs file
    return res.render("email-verified");
  } catch (error) {
    console.log(error.message);
  }
};

const indexLoad = async (req, res) => {
  try {
    return res.render("index");
  } catch (error) {
    console.log(error.message);
  }
};

// Login user method Started

const loginLoad = async (req, res) => {
  try {
    return res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.is_verified === 0) {
          return res.render("login", { message: "Please verify your mail" });
        } else {
          req.session.user = userData
          req.session.user_id = userData._id;
          console.log(req.body)
          return res.redirect("/home");
        }
      } else {
        return res.render("login", {
          message: "Email and Password is incorrect",
        });
      }
    } else {
      return res.render("login", {
        message: "Email and Password is incorrect or User does not exists !",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadHome = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    return res.render("home", { user: userData });
  } catch (error) {
    console.log(error.message);
  }
};

const userLogout = async (req, res) => {
  try {
    req.session.destroy();
    return res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

// forget password code start
const forgetLoad = async (req, res) => {
  try {
    return res.render("forget");
  } catch (error) {
    console.log(error.message);
  }
};

const forgetVerify = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      // userData.is_verified === 0 Tutorial.if 0 && 1 both verified and not veriifed can reset password
      if (userData.is_verified === 0 && 1) {
      return res.render("forget", { message: "Please verify your mail." });
      } else {
        const randomstring = randomString.generate();
        const updatedData = await User.updateOne(
          { email: email },
          { $set: { token: randomstring } }
        );
        sendResetPasswordMail(userData.name, userData.email, randomstring);
        return res.render("forget", {
          message: "Mail Sent, Please Check your mail to reset your password",
        });
      }
    } else {
      return res.render("forget", {
        message:
          "Mail is incorrect or User not registered or please check your mail you have not verifed ",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const forgetPasswordLoad = async (req, res) => {
  try {
    const linktoken = req.query.token;
    const tokenData = await User.findOne({ token: linktoken });
    if (tokenData) {
      return res.render("forget-password", { user_id: tokenData._id });
    } else {
      return res.render("404", { message: "Token is Invalid." });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const resetPassword = async (req, res) => {
  try {
    const changepassword = req.body.password;
    const user_id = req.body.user_id;
    const secure_password = await securePassword(changepassword);
    const updatedData = await User.findByIdAndUpdate(
      { _id: user_id },
      { $set: { password: secure_password, token: "" } }
    );
    return res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

// for verification link
const verificationLoad = async (req, res) => {
  try {
    return res.render("verification");
  } catch (error) {
    console.log(error.message);
  }
};

const sendVerificationLink = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      sendVerifyMail(userData.name, userData.email, userData._id);
      return res.render("verification", {
        message:
          "Resend verification mail has been send to your mail , Please check the mail ",
      });
    } else {
      return res.render("verification", {
        messsage: "This email doesnot exists ",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// user profile edit and update
const editLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
      return res.render("edit", { user: userData });
    } else {
      return res.redirect("/home");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateProfile = async (req, res) => {
  try {
    if (req.file) {
      const userData = await User.findByIdAndUpdate(
        { _id: req.body.user_id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mno,
            // image: req.file.filename,
          },
        }
      );
    } else {
      const userData = await User.findByIdAndUpdate(
        { _id: req.body.user_id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mno,
          },
        }
      );
    }
    return res.redirect("/home");
  } catch (error) {
    console.log(error.message);
  }
};

const personalInfoLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
   return   res.render("personal-info", { user: userData });
    } else {
      return res.redirect("/home");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updatePersonalInfo = async (req, res) => {
  try {
    if (req.file) {
      const userData = await User.findByIdAndUpdate(
        { _id: req.body.user_id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mno,
            // image: req.file.filename,
          },
        }
      );
    } else {
      const userData = await User.findByIdAndUpdate(
        { _id: req.body.user_id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mno,
            age: req.body.age,
          },
        }
      );
    }
    return res.redirect("/home");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  indexLoad,
  loadRegister,
  insertUser,
  verifyMail,
  loginLoad,
  verifyLogin,
  loadHome,
  userLogout,
  forgetLoad,
  forgetVerify,
  forgetPasswordLoad,
  resetPassword,
  verificationLoad,
  sendVerificationLink,
  editLoad,
  updateProfile,
  personalInfoLoad,
  updatePersonalInfo,
};
