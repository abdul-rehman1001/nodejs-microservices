const amqp = require('amqplib')

const RABBITMQ_URL = process.env.RABBITMQ_URL
const QUEUE_NAME = process.env.QUEUE_NAME || 'task_created'

    async function start() {
        try{
             const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME);
    console.log(`Listening for ${QUEUE_NAME} messages...`)

    channel.consume(   QUEUE_NAME, (msg) => {  
        const task = JSON.parse(msg.content.toString());
        console.log(`New task created: [ID: ${task.id}, Title: ${task.title}, UserID: ${task.userId}]`);
        channel.ack(msg);
    });        }catch(error){
        console.error('Failed to connect to RabbitMQ',error);   
        }
   



        
    }


    start();