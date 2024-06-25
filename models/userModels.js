const mongoose = require("mongoose");
const { isEmail } = require("validator");
const ROLE = {
  USER: 0,
  ADMIN: 1,
  EDITOR: 2,
};
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      default: "",
    },
    email: {
      type: String,
      required: [true, "Please enter an email"],
      default: "",
      // unique: true,
      lowercase: true,
      validate: [
        (val) => {
          isEmail;
        },
        "Please enter a valid email",
      ],
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
      required: [true, "Please enter an Password"],
      // minlength: [6, "Minimum Password length is 6 characters"],
    },
    age: {
      type: String,
      default: "",
    },
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
    role: {
      type: Number,
      default: ROLE.USER, //0 -> USER, 1 ->ADMIN ,2 -> EDITOR
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
