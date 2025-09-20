import { workerData } from "node:worker_threads";
import { activeCartService } from "../services";
import { DraftCartProductReason } from "../types/cart";
import { connectDb } from "../db/connect";

const runWorker = async (workerData: any) => {
  await connectDb(process.env.MONGO_URI!);

  activeCartService.moveProductToDraft({
    productId: workerData.productId,
    reason: DraftCartProductReason.PriceChange,
  });
};

runWorker(workerData);
