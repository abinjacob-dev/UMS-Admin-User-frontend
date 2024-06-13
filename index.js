const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/user_management_system");
const express = require("express");
const user_route = require("./routes/userRoute");
const app = express();

// for user routes
app.use("/", user_route);

app.listen(3000, function () {
  console.log("Server is running...");
});
