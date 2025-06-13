import "dotenv/config";
import express from "express";
import "express-async-errors";
import { connectDb } from "./db/connect";
import router from "./routes";
import { ErrorHandler } from "./middleware/error-handler";
import { languageMiddleware } from "./middleware/language";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
const port = process.env.PORT || 5006;

app.set("trust proxy", true);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(languageMiddleware);
app.use(router);

app.get("/", (_, req) => {
  req.status(200).end("<body><h1>Welcome to Belta Shop!</h1></body>");
});

// error handler
app.use(ErrorHandler);

async function start() {
  try {
    console.log("Connecting to database...");
    await connectDb(process.env.MONGO_URI!);
    console.log("Connected to database");
    return app.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
}

const server = start();

process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: gracefully shutting down");
  const s = await server;
  if (s) {
    s.close(() => {
      console.log("HTTP server closed");
    });
  }
});
