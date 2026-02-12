import cluster from "cluster";
import os from "os";
import http from "http";
import dotenv from "dotenv";
import app from "./app.js";
import { producer } from "./config/kafka.js";
import { Kafka } from "kafkajs";
import { Server } from "socket.io";
import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";

dotenv.config();

const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });

} else {
  const start = async () => {

    await producer.connect();

    const server = http.createServer(app);
    const io = new Server(server);

    // 🔥 Redis adapter (CRITICAL)
    const pubClient = createClient({ url: "redis://redis:6379" });
    const subClient = pubClient.duplicate();

    await pubClient.connect();
    await subClient.connect();

    io.adapter(createAdapter(pubClient, subClient));

    io.on("connection", (socket) => {
      console.log(`Client connected on worker ${process.pid}`);
    });

    // 🔥 Kafka consumer in ONLY one worker
    if (cluster.worker.id === 1) {
      const kafka = new Kafka({
        clientId: "api-service",
        brokers: ["kafka:9092"],
        retry: {
          retries: 20,
          initialRetryTime: 3000,
        },
      });


      const resultConsumer = kafka.consumer({
        groupId: "api-result-group",
      });

      await resultConsumer.connect();
      await resultConsumer.subscribe({
        topic: "order-results",
      });

      await resultConsumer.run({
        eachMessage: async ({ message }) => {
          const data = JSON.parse(message.value.toString());
          console.log("Emitting order update", data);

          io.emit("orderUpdate", data);  // Now broadcasted to ALL workers
        },
      });
    }

    const connectKafka = async () => {
  let retries = 10;

  while (retries) {
    try {
      console.log("Connecting to Kafka...");
      await producer.connect();
      console.log("Kafka connected ✅");
      break;
    } catch (err) {
      console.log("Kafka not ready, retrying in 5 seconds...");
      retries--;
      await new Promise(res => setTimeout(res, 5000));
    }
  }
};

    

    server.listen(5050, () => {
      console.log(`Worker ${process.pid} running`);
    });
  };

  start();
}
