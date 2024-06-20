const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
mongoose.connect(process.env.MONGODB_URL);
const express = require("express");
const path = require("path")

const user_route = require("./routes/userRoute");
const admin_route = require("./routes/adminRoute");
const app = express();


app.use(express.static(path.join(__dirname,'public')))


// for user routes
app.use("/", user_route);

// for admin routes
app.use("/admin", admin_route);

app.listen(3000, function () {
  console.log("Server is running...");
});
