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
  const exercisePromise = exerciseModel.create({
    user_id: _id,
    duration: Number(duration),
    description,
    date: dateInsert,
  });
  const userPromise = userModel.findById(_id);
  const [exercise,user] = await Promise.all([exercisePromise,userPromise]);
  return res.json({
    _id: user._id,
    username: user.username,
    description,
    duration,
    date: new Date(exercise.date).toDateString(),
  });
});
app.get("/api/users/:_id/logs", async (req, res) => {
  const { _id } = req.params;
  const {from=null,to=null,limit=null} = req.query;
  let queryFilter = {user_id: _id}
  let dateObject = {};
  if(from){
    const beginDate = new Date(from);
    dateObject['$gte'] = beginDate;
  }
  if(to){
    const endDate = new Date(from);
    dateObject['$lte'] = endDate;
  }
  if(from||to){
    queryFilter['date']=dateObject;
  }
  const exercises = await exerciseModel.find(queryFilter).limit(Number(limit)||1000);
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
