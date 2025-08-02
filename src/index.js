import express from "express";
import cors from "cors";
import { config } from "dotenv";
import orderRouter from "./routes/order.route.js";
import errorMiddleware from "./middleware/error.middleware.js";
import webhookRouter from "./routes/webhook.route.js";
import checkoutRouter from "./routes/checkout.route.js";

config();
const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: "GET, POST, PUT, DELETE",
    credentials: true,
  })
);

app.use("/webhook", express.raw({ type: "application/json" }), webhookRouter);

app.use(express.json());

app.use("/api/orders", orderRouter);
app.use("/api/checkout", checkoutRouter);

app.use(errorMiddleware);

export default app;
