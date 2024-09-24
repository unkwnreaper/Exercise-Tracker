const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

// Basic Configuration
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use(bodyParser.urlencoded({ extended: false }));

// mongoose setup
mongoose.connect(process.env.MONGO_URI);
const Schema = mongoose.Schema;
// Schema setup
const userSchema = new Schema({
  username: {type: String, required: true}
});
const exerciseSchema = new Schema({
  username: {type: String, required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: String,
});
// Model setup
const userModel = mongoose.model('userModel', userSchema);
const exerciseModel = mongoose.model('exerciseModel', exerciseSchema);

// Create or view Users
app.route('/api/users').get(async (req, res) => {
  var users = await userModel.find({});
  res.json(users);
}).post(async (req, res) => {
  var userProto = new userModel({username: req.body.username});
  await userProto.save();
  res.json({"username": req.body.username,"_id": userProto._id});
});

// Add exercises
app.post('/api/users/:_id/exercises', async (req, res) => {
  var id = req.params._id;
  var user = await userModel.findById(id);
  if (req.body.date == null) var date = new Date().toDateString();
  else var date = new Date(req.body.date).toDateString();
  console.log(date);
  var exerciseProto = new exerciseModel({
    username: user.username,
    description: req.body.description,
    duration: req.body.duration,
    date: date,
  });
  await exerciseProto.save();
  res.json({
    username: exerciseProto.username,
    description: exerciseProto.description,
    duration: exerciseProto.duration,
    date: exerciseProto.date,
    _id: id
  });
});

// Add Log
app.get('/api/users/:_id/logs', async (req, res) => {
  var id = req.params._id;
  var user = await userModel.findById(id);
  var {from, to, limit} = req.query;
  var dateQuery = {};
  if (to) dateQuery['$lte'] = to;
  if (from) dateQuery['$gte'] = from;

  if (dateQuery.length) {
    if (limit) var logs = await exerciseModel.find({username: user.username, date: dateQuery}).select('-_id description duration date').limit(limit).exec();
    else var logs = await exerciseModel.find({username: user.username, date: dateQuery}).select('-_id description duration date').exec();
  }
  else {
    if (limit) var logs = await exerciseModel.find({username: user.username}).select('-_id description duration date').limit(limit).exec();
    else var logs = await exerciseModel.find({username: user.username}).select('-_id description duration date').exec();
  }

  res.json({  
    username: user.username,
    count: logs.length,
    _id: id,
    log: logs});
});






const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
