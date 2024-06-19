const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      default: "",
    },
    mobile: {
      type: String,
      required: true,
      default: "",
    },
    image: {
      type: String,
      default: "",
      
    },
    password: {
      type: String,
      required: true,
    },
    age:{
      type: String,
      default:""
    }
    ,
    token: {
      type: String,
      default: "",
    },
    is_admin: {
      type: Number,
      required: true,
    },
    is_verified: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
