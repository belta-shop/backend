import { Request, Response } from "express";
import { activeCartService } from "../../services";
import CustomError from "../../errors/custom-error";
import { StatusCodes } from "http-status-codes";
import { stripe } from "../../utils/stripe";

export const createCheckoutSession = async (req: Request, res: Response) => {
  const cart = await activeCartService.getCart({
    userId: req.currentUser!.sub,
    role: req.currentUser!.role,
  });

  if (cart.products.length === 0)
    throw new CustomError("Cart is empty", StatusCodes.BAD_REQUEST);

  const { successUrl, cancelUrl } = req.body;

  if (!successUrl || !cancelUrl)
    throw new CustomError(
      "successUrl and cancelUrl are required",
      StatusCodes.BAD_REQUEST
    );
  if (!successUrl.includes("{sessionId}"))
    throw new CustomError(
      "successUrl must contain {sessionId}",
      StatusCodes.BAD_REQUEST
    );

  const lineItems = cart.products.map((item) => {
    const product = item.toObject();
    return {
      price_data: {
        currency: "egp",
        product_data: {
          name: req.lang === "ar" ? product.nameAr : product.nameEn,
          images: [product.cover],
        },
        unit_amount: product.itemPrice * 100, // Convert to cents
      },
      quantity: product.quantity,
    };
  });

  const session = await stripe.checkout.sessions.create({
    line_items: lineItems,
    mode: "payment",
    success_url: successUrl.replace("{sessionId}", req.currentUser!.sub),
    cancel_url: cancelUrl,
  });

  if (!session.url)
    throw new CustomError(
      "Failed to create checkout session",
      StatusCodes.INTERNAL_SERVER_ERROR
    );

  res.status(StatusCodes.OK).json({ url: session.url });
};

export const clearCartSession = async (req: Request, res: Response) => {
  const sessionId = req.body?.sessionId;

  if (!sessionId)
    throw new CustomError("sessionId is required", StatusCodes.BAD_REQUEST);

  if (sessionId !== req.currentUser!.sub)
    throw new CustomError("Unauthorized", StatusCodes.UNAUTHORIZED);

  await activeCartService.clearCart({
    userId: sessionId,
    role: req.currentUser!.role,
  });

  res.status(StatusCodes.NO_CONTENT).json();
};
