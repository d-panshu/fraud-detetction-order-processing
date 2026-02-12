import { Kafka } from "kafkajs";
import axios from "axios";
import { connectDB } from "../config/db.js";
import Order from "../models/order.js";



await connectDB();




const kafka = new Kafka({
  clientId: "api-service",
  brokers: ["kafka:9092"],
  retry: {
    retries: 20,
    initialRetryTime: 3000,
  },
});

const producer = kafka.producer();


const consumer = kafka.consumer({
  groupId: "fraud-processing-group",
  autoCommit: false,
});

const run = async () => {
  await consumer.connect();
  console.log("Worker connected to Kafka");

  await producer.connect();
  console.log("Worker producer connected");



  await consumer.subscribe({
    topic: "transactions",
    fromBeginning: true,
  });

  await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const data = JSON.parse(message.value.toString());

            try {
            console.log("Received:", data.transactionId);

            // const isFraud = data.amount > 10000;

            let order= await Order.findOne({
                transactionId:data.transactionId
            });

            if (!order) {
            order = await Order.create({
                transactionId: data.transactionId,
                userId: data.userId,
                amount: data.amount,
                status: "PENDING",
            });
            }           

            const features={
                amount:data.amount,
                velocity :2,
                amount_vs_avg: 2.5,    
                account_age: 180,     
                fraud_history: 0   
            };

            const response = await axios.post(
                "http://ml-service:8000",
                features
            );

            const fraudProbability= response.data.fraud_probability
            console.log(
                "fraud_prob", fraudProbability
            );


            const isFraud = fraudProbability>0.8;

            if (fraudProbability > 0.8) {
            order.status = "REJECTED";
            } else {
            order.status = "APPROVED";
            }   
            
            

            order.fraudProbability = fraudProbability;

            await order.save();
            
            await producer.send({
                topic: "order-results",
                messages: [
                    {
                    key: order.transactionId,
                    value: JSON.stringify({
                        transactionId: order.transactionId,
                        status: order.status,
                        fraudProbability: order.fraudProbability,
                    }),
                    },
                ],
            });

           console.log("Order result event sent");


            // if(isFraud){
            //     console.log("order rejected")
            // }
            // else{
            //     console.log("order approved")
            // }

            console.log("final order status", order.status);

            await consumer.commitOffsets([
                {
                topic,
                partition,
                offset: (Number(message.offset) + 1).toString(),
                },
            ]);

            console.log("Offset committed");

            }catch (err) {
                console.error("Processing failed:", err.message);

                await producer.send({
                    topic: "transactions-dlq",
                    messages: [
                    {
                        value: message.value.toString(),
                    },
                    ],
                });

                console.log("Sent to DLQ");
                }

        },
    });

};


run().catch(console.error);
