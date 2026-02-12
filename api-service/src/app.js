import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import transactionRoutes from "./routes/transaction.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "../public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

app.use(transactionRoutes);

app.get("/", (req, res) => {
  res.render("index");
});

export default app;
