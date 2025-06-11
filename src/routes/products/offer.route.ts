import { Router } from "express";
import {
  getAllOffers,
  getOffer,
  createOffer,
  updateOffer,
  deleteOffer,
} from "../../controllers/products/offer.controller";
import { authMiddleware, staffMiddleware } from "../../middleware/auth";

const router = Router();
router.use(authMiddleware, staffMiddleware);

router.route("/").get(getAllOffers).post(createOffer);

router.route("/:id").get(getOffer).patch(updateOffer).delete(deleteOffer);

export default router;
