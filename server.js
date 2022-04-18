const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const mySecret = process.env["mongo"];
const bodyParser = require("body-parser");
const moment = require("moment");

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
      description: req.body.description,
      duration: req.body.duration,
      date: date,
    });

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
            date: i.date.toDateString(),
          };
        }),
      });
    });
  } else {
    let limit = req.query.limit ? req.query.limit : 0;
    let from = moment(req.query.from, "YYYY-MM-DD").isValid()
      ? moment(req.query.from, "YYYY-MM-DD")
      : 0;
    let to = moment(req.query.to, "YYYY-MM-DD").isValid()
      ? moment(req.query.to, "YYYY-MM-DD")
      : moment().add(1000000000000);

    let filter = { _id: req.params._id };
    if (from || to) {
      filter.date = { $gte: from, $lte: to };
    }

    User.findById({ _id: req.params._id }, (err, user) => {
      if (err) {
        res.status(500).json({ err });
      }

      Exercise.find(filter)
        .limit(+limit)
        .exec((err, data) => {
          res.json({
            _id: req.params._id,
            username: user.username,
            count: data.length,
            log: data.map((i) => {
              return {
                description: i.description,
                duration: i.duration,
                date: i.date.toDateString(),
              };
            }),
          });
        });
    });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
