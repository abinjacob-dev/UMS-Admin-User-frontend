const User = require("../models/userModels");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const userModels = require("../models/userModels");
const dotenv = require("dotenv").config();

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

SMTP_HOST = "smtp.gmail.com";
SMTP_PORT = "587";
SMTP_EMAIL = "shinytm36@gmail.com";
SMTP_PASS = "fikyljkceicjdhig";

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
        user: process.env.SMTP_EMAIL,
        pass: SMTP_PASS,
      },
    });
    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: email,
      subject: "Verification mail",
      html:
        "<p>Hi" +
        name +
        ', Please click here to <a href="http://localhost:3000/verify?id=' +
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

const loadRegister = async (req, res) => {
  try {
    res.render("registration");
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
      image: req.file.filename,
      password: spassword,
      // spassword - secure passsword
      is_admin: 0,
    });
    const userData = await user.save();
    if (userData) {
      sendVerifyMail(req.body.name, req.body.email, userData._id);

      res.render("registration", {
        message: "Registration Successful, Please verify your mail",
      });
    } else {
      res.render("registration", { message: "Registration Failed" });
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
    res.render("email-verified");
  } catch (error) {
    console.log(error.message);
  }
};

// Login user method Started

const loginLoad = async (req, res) => {
  try {
    res.render("login");
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
          res.render("login", { message: "Please verify your mail" });
        } else {
          req.sesson.user_id = userData._id;
          res.redirect("/home");
        }
      } else {
        res.render("login", { message: "Email and Password is incorrect" });
      }
    } else {
      res.render("login", {
        message: "Email and Password is incorrect or User does not exists !",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadHome = async (req, res) => {
  try {
    res.render("home");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadRegister,
  insertUser,
  verifyMail,
  loginLoad,
  verifyLogin,
  loadHome,
};
