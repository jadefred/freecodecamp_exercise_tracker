const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const exerciseSchema = new Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date,
});

const userSchema = new Schema({
  username: String,
  count: { type: Number, default: 0 },
  log: [exerciseSchema],
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

module.exports = { User: User, Exercise: Exercise }; 
