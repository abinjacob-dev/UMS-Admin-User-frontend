const User = require("../models/userModels");
const bcrypt = require("bcrypt");
const randomstring = require("randomstring");
const config = require("../config/config");
const nodemailer = require("nodemailer");

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
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
        '(Admin), Please click here to <a href="http://localhost:3000/admin/forget-password?token=' +
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
// for send mail
console.log(process.env.SMTP_EMAIL);
const addUserMail = async (name, email, password, user_id) => {
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
      subject: "Admin added, verify your mail",
      html:
        "<p>Hi, " +
        name +
        ', Please click here to <a href="http://localhost:3000/verify?id=' +
        user_id +
        '"> verify </a> your mail.</p> <br><br><b>Email:-</b>' +
        email +
        "<br><b>Password:-</b>" +
        password +
        "",
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

const loadLogin = async (req, res) => {
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
      const passwordHash = await bcrypt.compare(password, userData.password);

      if (passwordHash) {
        if (userData.is_admin === 0) {
          res.render("login", { message: "Email and password is incorrect" });
        } else {
          req.session.user_id = userData._id;
          res.redirect("/admin/home");
        }
      } else {
        res.render("login", { message: "Email and password is incorrect" });
      }
    } else {
      res.render("login", { message: "Email and password is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadDashboard = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    res.render("home", { admin: userData });
  } catch (error) {
    console.log(error.message);
  }
};
const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};
const forgetLoad = async (req, res) => {
  try {
    res.render("forget");
  } catch (error) {
    console.log(error.message);
  }
};

const forgetVerify = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      if (userData.is_admin === 0) {
        res.render("forget", {
          message: "User not found or Email is incorrect",
        });
      } else {
      }
      const randomString = randomstring.generate();
      const updateData = await User.updateOne(
        { email: email },
        { $set: { token: randomString } }
      );
      sendResetPasswordMail(userData.name, userData.email, randomString);
      res.render("forget", {
        message: "Please check your mail to reset your Password",
      });
    } else {
      res.render("forget", { message: "User not found or Email is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const forgetPasswordLoad = async (req, res) => {
  try {
    const token = req.query.token;

    const tokenData = await User.findOne({ token: token });

    if (tokenData) {
      res.render("forget-password", { user_id: tokenData._id });
    } else {
      res.render("404", { message: "Invalid Link" });
    }
  } catch (error) {
    console.log(error.message);
  }
};
const resetPassword = async (req, res) => {
  try {
    const password = req.body.password;
    const user_id = req.body.user_id;
    const securePass = await securePassword(password);
    const updatedData = await User.findByIdAndUpdate(
      { _id: user_id },
      {
        $set: { password: securePass, token: "" },
      }
    );
    res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};

const adminDashboard = async (req, res) => {
  try {
    const usersData = await User.find({ is_admin: 0 });
    res.render("dashboard", { users: usersData });
  } catch (error) {
    console.log(error.message);
  }
};

// Add New User Start
const newUserLoad = async (req, res) => {
  try {
    res.render("new-user");
  } catch (error) {
    console.log(error.message);
  }
};

const newUser = async (req, res) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const mobile = req.body.mno;
    const image = req.file.filename;
    const password = randomstring.generate(8);
    const spassword = await securePassword(password);

    const user = new User({
      name: name,
      email: email,
      mobile: mobile,
      image: image,
      password: spassword,
      is_admin: 0,
    });
    const userData = await user.save();

    if (userData) {
      addUserMail(name, email, password, userData._id);

      res.redirect("/admin/dashboard");
    } else {
      res.render("new-user", { message: "Something Wrong" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  loadLogin,
  verifyLogin,
  loadDashboard,
  logout,
  forgetLoad,
  forgetVerify,
  forgetPasswordLoad,
  resetPassword,
  adminDashboard,
  newUserLoad,
  newUser,
};
