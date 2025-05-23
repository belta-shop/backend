import "dotenv/config";
import express from "express";
import "express-async-errors";
import { connectDb } from "./db/connect";
import { authRouter } from "./routes";
import { ErrorHandler } from "./middleware/error-handler";
const app = express();
const port = process.env.PORT || 3000;

app.set("trust proxy", true);
app.use(express.json());

app.use("/auth", authRouter);

// error handler
app.use(ErrorHandler);

(async function start() {
  try {
    await connectDb(process.env.MONGO_URI!);
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  } catch (error) {
    console.log(error);
  }
})();
