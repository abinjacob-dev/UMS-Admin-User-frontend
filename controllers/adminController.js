const User = require("../models/userModels");
const bcrypt = require("bcrypt");
const randomstring = require("randomstring");
const config = require("../config/config");
const nodemailer = require("nodemailer");
const excelJS = require("exceljs");
const jwt = require("jsonwebtoken");

// html to pdf require things
const ejs = require("ejs");
const pdf = require("html-pdf");
const fs = require("fs");
const path = require("path");


// JWT Creator
const createToken_admin = (id) => {
  return jwt.sign({ id }, "admin-token", { expiresIn: 1 * 24 * 60 * 60 });
};



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
      from: "shinytm36@gmail.com",
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
      from: "shinytm36@gmail.com",
      to: email,
      subject: "Admin added, verify your mail",
      html:
        "<p>Hi, " +
        name +
        ', Please click here to <a href="http://localhost:3000/verify?id=' +
        user_id +
        '"> verify </a> your mail.</p> <br><br><b>Email:-</b>' +
        email +
        "<br><b>Password :- </b>" +
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
      const passwordHash = await bcrypt.compare(password, userData.password);

      if (passwordHash) {
        if (userData.is_admin === 0) {
          return res.render("login", {
            message: "Email and password is incorrect",
          });
        } else {
          const token_admin = createToken_admin(userData._id);
          res.cookie("jwt_admin", token_admin, { httpOnly: true, maxAge: 1000 * 24 * 60 * 60 }).status(201)
          
          req.session.user = userData
          req.session.user_id = userData._id;
          return res.redirect("/admin/home");
        }
      } else {
        return res.render("login", {
          message: "Email and password is incorrect",
        });
      }
    } else {
      return res.render("login", {
        message: "Email and password is incorrect",
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadDashboard = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    req.session.admin= userData
    return res.render("home", { admin: userData });
  } catch (error) {
    console.log(error.message);
  }
};
const logout = async (req, res) => {
  try {
    res.cookie("jwt_admin","",{maxAge:1})
    
    req.session.destroy();
    return res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};
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
      if (userData.is_admin === 0) {
        return res.render("forget", {
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
      return res.render("forget", {
        message: "Please check your mail to reset your Password",
      });
    } else {
      return res.render("forget", {
        message: "User not found or Email is incorrect",
      });
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
      return res.render("forget-password", { user_id: tokenData._id });
    } else {
      return res.render("404", { message: "Invalid Link" });
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
    return res.redirect("/admin");
  } catch (error) {
    console.log(error.message);
  }
};

const adminDashboard = async (req, res) => {
  try {
    var search = "";
    if (req.query.search) {
      search = req.query.search;
    }

    var page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    const limit = 5;

    const usersData = await User.find({
      is_admin: 0,
      $or: [
        { name: { $regex: ".*" + search + ".*", $options: "i" } },
        { email: { $regex: ".*" + search + ".*", $options: "i" } },
        { mobile: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await User.find({
      is_admin: 0,
      $or: [
        { name: { $regex: ".*" + search + ".*", $options: "i" } },
        { email: { $regex: ".*" + search + ".*", $options: "i" } },
        { mobile: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    }).countDocuments();

    return res.render("dashboard", {
      users: usersData,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.log(error.message);
  }
};

// Add New User Start
const newUserLoad = async (req, res) => {
  try {
    return res.render("new-user");
  } catch (error) {
    console.log(error.message);
  }
};

const newUser = async (req, res) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const mobile = req.body.mno;
    const image = req.body.name;
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

      return res.redirect("/admin/dashboard");
    } else {
      return res.render("new-user", { message: "Something Wrong" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//Edit User Functionality

const editUserLoad = async (req, res) => {
  try {
    const id = req.query.id;
    const userData = await User.findById({ _id: id });
    if (userData) {
      return res.render("edit-user", { user: userData });
    } else {
      return res.redirect("/admin/dashboard");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateUser = async (req, res) => {
  try {
    const userData = await User.findByIdAndUpdate(
      { _id: req.body.id },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          mobile: req.body.mno,
          is_verified: req.body.verify,
          role : req.body.permission,
        },
      }
    );
    return res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

const deleteUser = async (req, res) => {
  try {
    const id = req.query.id;
    await User.deleteOne({ _id: id });
    return res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error.message);
  }
};

// export users data
const exportUsers = async (req, res) => {
  try {
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("My Users");
    worksheet.columns = [
      { header: "S. No.", key: "s_no" },
      { header: "Name", key: "name" },
      { header: "Email ID", key: "email" },
      { header: "Mobile", key: "mobile" },
      { header: "Image", key: "image" },
      { header: "Is Admin", key: "is_admin" },
      { header: "Is Verified", key: "is_verified" },
    ];
    let counter = 1;
    const userData = await User.find({ is_admin: 0 });

    userData.forEach((user) => {
      user.s_no = counter;

      worksheet.addRow(user);

      counter++;
    });
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
    });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheatml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment;filename=users.xlsx");
    return workbook.xlsx.write(res).then(() => {
      return res.status(200);
    });
  } catch (error) {
    console.log(error.message);
  }
};

// Export user data into PDF
const exportUserPdf = async (req, res) => {
  try {
    const users = await User.find({ is_admin: 0 });
    const data = {
      users: users,
    };
    const filePathName = path.resolve(
      __dirname,
      "../views/admin/htmltopdf.ejs"
    );
    const htmlString = fs.readFileSync(filePathName).toString();
    let options = {
      format: "A3",
      orientation: "portrait",
      border: "10mm",
      // format: "Letter",
    };
    const ejsData = ejs.render(htmlString, data);
    pdf.create(ejsData, options).toFile("users.pdf", (err, response) => {
      if (err) console.log(err);

      console.log("file generated");
      const filePath = path.resolve(__dirname, "../users.pdf");
      fs.readFile(filePath, (err, file) => {
        if (err) {
          console.log(err);
          return res.status(500).send("Could not Download file");
        }
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          'attachment;filename= "users.pdf"'
        );
        return res.send(file);
      });
    });
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
  editUserLoad,
  updateUser,
  deleteUser,
  exportUsers,
  exportUserPdf,
};
