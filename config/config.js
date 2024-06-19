const dotenv = require("dotenv").config();

const sessionSecret = "mysitesessionsecret";

const emailUser = process.env.SMTP_EMAIL;
const emailpassword = process.env.SMTP_PASS;
module.exports = {
  sessionSecret,
  emailUser,
  emailpassword,
};
