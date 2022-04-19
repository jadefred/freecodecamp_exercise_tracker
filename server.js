const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const bodyParser = require("body-parser");

mongoose.connect(process.env.MONGO_KEY, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Schema = mongoose.Schema;

const exerciseSchema = new Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date,
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

const userSchema = new Schema({
  username: String,
  count: { type: Number, default: 0 },
  log: [exerciseSchema],
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
      username: user.username,
      description: req.body.description,
      duration: req.body.duration,
      date: date,
    });

    newExercise.save();

    user.log.push(newExercise);

    User.findOneAndUpdate(
      { _id: req.params._id },
      { count: (user.count += 1) },
      { new: true }
    );

    user.save();

    res.status(200).json({
      _id: user._id,
      username: user.username,
      date: user.log[0].date.toDateString(),
      duration: user.log[0].duration,
      description: user.log[0].description,
    });
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  if (!req.query.from && !req.query.to && !req.query.limit) {
    User.findById({ _id: req.params._id }, (err, user) => {
      if (err) {
        res.status(500).json({ err });
      }

      res.status(200).json({
        user: user.username,
        _id: user._id,
        count: user.count,
        log: user.log.map((i) => {
          return {
            description: i.description,
            duration: i.duration,
            date: new Date(i.date).toDateString(),
          };
        }),
      });
    });
  } else {
    let limit = req.query.limit ? req.query.limit : 0;

    User.findById({ _id: req.params._id }, (err, user) => {
      if (err) {
        res.status(500).json({ err });
      }

      Exercise.find({ username: user.username }).exec((err, data) => {
        if (req.query.from && req.query.to) {
          data = data.filter(
            (d) =>
              Date.parse(d.date) >= Date.parse(req.query.from) &&
              Date.parse(d.date) <= Date.parse(req.query.to)
          );
        }

        if (req.query.limit) {
          data = data.filter((d, i) => i < req.query.limit);
        }

        res.json({
          _id: user._id,
          userName: data.userName,
          conunt: data.length,
          log: data,
        });
      });
    });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
