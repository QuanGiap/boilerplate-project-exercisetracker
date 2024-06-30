const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();
mongoose.connect(process.env.MONGODB_URI);
app.use(cors());
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
const userSchema = new mongoose.Schema({
  username: String,
});
const exerciseSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.ObjectId,
    index: true,
  },
  description: String,
  duration: Number,
  date: {
    type: Date,
    index: true,
  },
});
const userModel = mongoose.model("user", userSchema);
const exerciseModel = mongoose.model("exercise", exerciseSchema);
app.post("/api/users", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.json({ error: "Missing username" });
  const user = await userModel.create({ username });
  return res.json({ username, _id: user._id });
});
app.get("/api/users", async (req, res) => {
  const users = await userModel.find();
  return res.send(users);
});
app.post("/api/users/:_id/exercises", async (req, res) => {
  const { description, duration, date = null } = req.body;
  const dateInsert = date ? new Date(date) : new Date();
  const { _id } = req.params;
  const exercise = await exerciseModel.create({
    user_id: _id,
    duration: Number(duration),
    description,
    date: dateInsert,
  });
  const user = await userModel.findById(_id);
  return res.json({
    username: user.username,
    _id: user._id,
    description,
    duration,
    date: dateInsert.toDateString(),
  });
});
app.get("/api/users/:_id/logs", async (req, res) => {
  const { _id } = req.params;
  const exercises = await exerciseModel.find({ user_id: _id });
  const user = await userModel.findById(_id);
  return res.json({
    username: user.username,
    _id: user._id,
    count: exercises.length,
    log: exercises.map(({ description, duration, date }) => ({
      description,
      duration,
      date: date?.toDateString(),
    })),
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
