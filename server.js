const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const mySecret = process.env["mongo"];
const bodyParser = require("body-parser");

mongoose.connect(process.env.MONGO_KEY, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Schema = mongoose.Schema;

const exerciseSchema = new Schema({
  description: String,
  duration: Number,
  date: Date,
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

const userSchema = new Schema({
  username: String,
  exercise: [exerciseSchema],
});

const User = mongoose.model("User", userSchema);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", (req, res) => {
  User.create({ username: req.body.username }, (err, data) => {
    if (err) {
      res.json({ err });
    }
    res.json({ username: req.body.username, _id: data.id });
  });
});

app.get("/api/users", (req, res) => {
  User.find({}, (err, data) => {
    if (err) {
      res.json({ err });
    }
    res.json(data);
  });
});

app.post("/api/users/:_id/exercises", (req, res) => {
  User.findOne({ _id: req.params._id }, (err, user) => {
    if (!user) {
      res.status(500).json({ err });
    }

    let date = Date.now();

    if (req.body.date) {
      date = new Date(req.body.date);
    }

    const newExercise = new Exercise({
      description: req.body.description,
      duration: req.body.duration,
      date: date,
    });

    user.exercise.push(newExercise);

    res.status(200).json({
      _id: user._id,
      username: user.username,
      date: user.exercise[0].date.toDateString(),
      duration: user.exercise[0].duration,
      description: user.exercise[0].description,
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
