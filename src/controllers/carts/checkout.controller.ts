import { Request, Response } from "express";
import { activeCartService, orderService } from "../../services";
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
    success_url: `${process.env.SERVER_URL}/checkout/success/{CHECKOUT_SESSION_ID}?redirectUrl=${successUrl}`,
    cancel_url: cancelUrl,
    metadata: {
      userId: req.currentUser!.sub,
    },
  });

  if (!session.url)
    throw new CustomError(
      "Failed to create checkout session",
      StatusCodes.INTERNAL_SERVER_ERROR
    );

  res.status(StatusCodes.OK).json({ url: session.url });
};

export const successCheckoutSession = async (req: Request, res: Response) => {
  const sessionId = req.params.sessionId;
  const redirectUrl = req.query.redirectUrl as string;

  if (!sessionId)
    throw new CustomError("sessionId is required", StatusCodes.BAD_REQUEST);

  if (!redirectUrl)
    throw new CustomError("redirectUrl is required", StatusCodes.BAD_REQUEST);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session.metadata?.userId)
      throw new CustomError("Unauthorized", StatusCodes.UNAUTHORIZED);

    await orderService.placeOrder({
      userId: session.metadata.userId,
      sessionId: sessionId,
    });

    res.status(StatusCodes.TEMPORARY_REDIRECT).redirect(redirectUrl);
  } catch (error) {
    console.log(error);
    throw new CustomError(
      "Failed to retrieve checkout session",
      StatusCodes.INTERNAL_SERVER_ERROR
    );
  }
};
