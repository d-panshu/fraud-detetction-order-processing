import { Kafka } from "kafkajs";


const kafka = new Kafka({
  clientId: "api-service",
  brokers: ["kafka:9092"],
  retry: {
    retries: 20,
    initialRetryTime: 3000,
  },
});


export const resultConsumer = kafka.consumer({
  groupId: "api-result-group",
});

export const producer = kafka.producer();