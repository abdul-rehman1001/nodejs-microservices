const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const amqp = require('amqplib')

const app = express()
const PORT = process.env.PORT || 3002

const MONGO_URI = process.env.MONGO_URI
const RABBITMQ_URL = process.env.RABBITMQ_URL
const QUEUE_NAME = process.env.QUEUE_NAME || 'task_created'

app.use(bodyParser.json())

mongoose.connect(MONGO_URI).then(() => {
  console.log('Connected to MongoDB')
}).catch(err => {
  console.error('Could not connect to MongoDB', err)
})

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  userId: String,

  createdAt: { type: Date, default: Date.now }
})

const Task = mongoose.model('Task', TaskSchema)

let channel,connection;

async function connectRabbitMQWithRetry(retries=5,delay=3000) {
  
  while(retries){
    try {
      connection = await amqp.connect(RABBITMQ_URL);
      channel = await connection.createChannel();
      await channel.assertQueue(QUEUE_NAME);
      console.log('Connected to RabbitMQ');
      return;
    }catch(error){
      console.error('Failed to connect to RabbitMQ, retrying in 3 seconds...',error);
      retries--;
      console.log(`Retries left: ${retries}`);
      await new Promise(res=>setTimeout(res,delay));


    }   

} 
}

app.post('/tasks', async (req, res) => {
    const { title, description, userId } = req.body;    
    try {
        const newTask = new Task({ title, description, userId });
        await newTask.save();
        const message = {
            id: newTask._id,
            title: newTask.title,
         
            userId: newTask.userId,
        };

        if(channel){
            channel.sendToQueue('task_created', Buffer.from(JSON.stringify(message)));
            console.log('Sent message to task_created queue',message);
        }else{
            console.error('Cannot send message, no channel available');
        }
        res.status(201).json(newTask);
    }
    catch (error) {
        res.status(500).json({ error: 'Error creating task' });
    }   
})

app.get('/tasks',async(req,res)=>{
    const tasks=await Task.find();
    res.json(tasks);        
})





app.listen(port, () => {
  console.log(`Task Service listening on port ${port}`)
  connectRabbitMQWithRetry();
}
)