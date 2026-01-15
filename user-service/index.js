const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const app = express()
const PORT = process.env.PORT || 3001

const MONGO_URI = process.env.MONGO_URI

app.use(bodyParser.json())

mongoose.connect(MONGO_URI).then(() => {
  console.log('Connected to MongoDB')
}).catch(err => {
  console.error('Could not connect to MongoDB', err)
})

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
})

const User = mongoose.model('User', UserSchema)


app.post('/users', async (req, res) => {
    const { name, email } = req.body;

    try {
        const newUser = new User({ name, email });
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        res.status(500).json({ error: 'Error creating user' });
    } 
})

app.get('/users',async(req,res)=>{
    const users=await User.find();
    res.json(users);    

})

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
