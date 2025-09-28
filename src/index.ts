import "dotenv/config";
import express from "express";
import "express-async-errors";
import "./utils/passport";
import { connectDb } from "./db/connect";
import router from "./routes";
import { ErrorHandler } from "./middleware/error-handler";
import { languageMiddleware } from "./middleware/language";
import cors from "cors";
import bodyParser from "body-parser";
import { redisClient } from "./db/redis";
import { bullBoardRouter } from "./routes/bull-board-router";
import { io } from "./db/socket";
import passport from "passport";
import { RedisStore } from "connect-redis";
import session from "express-session";

const app = express();
const port = process.env.PORT || 5006;

app.set("trust proxy", true);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(languageMiddleware);

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: new RedisStore({ client: redisClient }),
  })
);
app.use(passport.authenticate("session"));

// Routes
app.use(router);
app.get("/", (_, req) => {
  req.status(200).end("<body><h1>Welcome to Belta Shop!</h1></body>");
});
app.use("/admin/bull-board", bullBoardRouter);

// error handler
app.use(ErrorHandler);

async function start() {
  try {
    // MongoDB
    await connectDb(process.env.MONGO_URI!);
    console.log("Connected to MongodDB");

    // Redis
    await redisClient.connect();
    redisClient.on("error", (err) => {
      throw new Error(err.message);
    });
    console.log("Connected to Redis");

    const server = app.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
    io.attach(server);

    return server;
  } catch (error) {
    throw error;
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
