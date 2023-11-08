const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const mongoose = require('mongoose');

mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: String,
});

const User = mongoose.model('User', userSchema);

const exerciseSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: false }
});

const Exercise = mongoose.model('Exercise', exerciseSchema);


app.post('/api/users', async (req, res) => {
  const userObj = new User({ username: req.body.username });

  try {
    const user = await userObj.save()
    console.log(user)
    res.json(user)
  } catch (err) {
    console.log(err)
  }
})

app.get('/api/users', async (req, res) => {
  try {
    const user = await User.find().select('username _id')
    res.json(user)
  } catch (err) {
    console.log(err)
  }
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  try {
    const id = req.params._id
    const { description, duration, date } = req.body;
    const user = await User.findById(id)
    if (!user) {
      res.send("Could not find user")
    } else {
      const exerciseObj = new Exercise({
        user_id: user._id,
        description: description,
        duration: duration,
        date: date ? new Date(date) : new Date() 
      })
      const exercise = await exerciseObj.save()
      res.json({
        _id: user._id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString()
      })
    }

  } catch (err) {
    console.log();
    res.send("Error with saving the exercise")
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const {from, to, limit} = req.query;
  const id = req.params._id;
  const user = await User.findById(id);
  if (!user) {
    res.send("Could not find user")
    return;
  }
  let dateObj = {}
  if(from){
    dateObj["$gte"] = new Date(from) //greater than or equal to
  }
  if(to){
    dateObj["$lte"] = new Date(to) //less than or equal to
  }
  let filter = {
    user_id: id
  }
  if(from || to){
    filter.date = dateObj
  }
  const exercise = await Exercise.find(filter).limit(+limit ?? 500) //find by the filter
  const count = exercise.length
  const log = exercise.map((item) => ({
      description: item.description,
      duration: item.duration,
      date: item.date.toDateString()
    }))

  res.json({
    username: user.username,
    count: count,
    _id: user._id,
    log
  })
  
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
