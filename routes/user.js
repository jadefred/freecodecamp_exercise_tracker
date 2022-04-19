const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const { Exercise } = require("../models/user");
const { User } = require("../models/user");

router.post("/", (req, res) => {
  User.create({ username: req.body.username }, (err, data) => {
    if (err) {
      res.json({ err });
    }
    res.json({ username: req.body.username, _id: data.id });
  });
});

router.get("/", (req, res) => {
  User.find({}, (err, data) => {
    if (err) {
      res.json({ err });
    }
    res.json(data);
  });
});

router.post("/:_id/exercises", (req, res) => {
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

    let logLength = user.log.length - 1;

    res.status(200).json({
      _id: user._id,
      username: user.username,
      date: user.log[logLength].date.toDateString(),
      duration: user.log[logLength].duration,
      description: user.log[logLength].description,
    });
  });
});

router.get("/:_id/logs", (req, res) => {
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

module.exports = router;
