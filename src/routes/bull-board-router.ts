import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { removeProductFromCartsQueue } from "../workers/remove-product-from-carts";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/bull-board");

createBullBoard({
  queues: [new BullMQAdapter(removeProductFromCartsQueue)],
  serverAdapter,
});

export const bullBoardRouter = serverAdapter.getRouter();
