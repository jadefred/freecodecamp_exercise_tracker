const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const mySecret = process.env["mongo"];
const bodyParser = require("body-parser");

mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: String,
  count: { type: Number, default: 0 },
  log: [{ description: String, duration: Number, date: Date }],
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
  User.findOne({ _id: req.params._id }, (err, data) => {
    if (err) {
      res.json({ err });
    }
    let formattedDate = Date.now();

    if (req.body.date) {
      formattedDate = new Date(req.body.date);
    }

    data.log.push({
      description: req.body.description,
      duration: req.body.duration,
      date: formattedDate.toDateString(),
    });
    data.save();

    res.json({
      _id: data.id,
      username: data.username,
      date: formattedDate.toDateString(),
      duration: req.body.duration,
      description: req.body.description,
    });
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
