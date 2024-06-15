const express = require("express");
const admin_route = express();
const config = require("../config/config");
const session = require("express-session");
admin_route.use(session({ secret: config.sessionSecret }));
const bodyParser = require("body-parser");
admin_route.use(bodyParser.json());
admin_route.use(bodyParser.urlencoded({ extended: true }));
admin_route.set("view engine", "ejs");
admin_route.set("views", "./views/admin");

const multer = require("multer");
const path = require("path");
admin_route.use(express.static("public"));
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/userImages"));
  },
  filename: function (req, file, cb) {
    const name = Date.now() + "-" + file.originalname;
    cb(null, name);
  },
});
const upload = multer({ storage: storage });

const auth = require("../middleware/adminAuth");
const adminContoller = require("../controllers/adminController");

admin_route.get("/", auth.isLogout, adminContoller.loadLogin);
admin_route.post("/", adminContoller.verifyLogin);
admin_route.get("/home", auth.isLogin, adminContoller.loadDashboard);
admin_route.get("/logout", auth.isLogin, adminContoller.logout);
admin_route.get("/forget", auth.isLogout, adminContoller.forgetLoad);
admin_route.post("/forget", adminContoller.forgetVerify);
admin_route.get(
  "/forget-password",
  auth.isLogout,
  adminContoller.forgetPasswordLoad
);
admin_route.post("/forget-password", adminContoller.resetPassword);
admin_route.get("/dashboard", auth.isLogin, adminContoller.adminDashboard);
admin_route.get("/new-user", auth.isLogin, adminContoller.newUserLoad);
admin_route.post("/new-user", upload.single("image"), adminContoller.newUser);

admin_route.get("*", function (req, res) {
  res.redirect("/admin");
});

module.exports = admin_route;
