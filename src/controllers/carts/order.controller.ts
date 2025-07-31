import { Request, Response } from "express";
import { getPagination } from "../../utils/routes";
import { StatusCodes } from "http-status-codes";
import CustomError from "../../errors/custom-error";
import { OrderStatus } from "../../types/cart";
import { orderService, activeCartService } from "../../services";
import { Language } from "../../types/language";
import { getAggregatedLookup } from "../../utils/models";

export const getAllOrders = async (req: Request, res: Response) => {
  const { status } = req.query;

  if (
    status &&
    ![
      OrderStatus.Confirmed,
      OrderStatus.Delivered,
      OrderStatus.Cancelled,
    ].includes(status as OrderStatus)
  )
    throw new CustomError("Invalid status", StatusCodes.BAD_REQUEST);

  const data = await orderService.getAllOrders(
    {
      status: status as OrderStatus,
      userId: req.currentUser!.sub,
      ...getPagination(req.query),
    },
    [
      {
        $project: {
          finalPrice: 1,
          status: 1,
          createdAt: 1,
        },
      },
    ]
  );

  res.status(StatusCodes.OK).json(data);
};

export const getAllOrdersForStaff = async (req: Request, res: Response) => {
  const { status, userId } = req.query;

  if (
    status &&
    ![
      OrderStatus.Confirmed,
      OrderStatus.Delivered,
      OrderStatus.Cancelled,
    ].includes(status as OrderStatus)
  )
    throw new CustomError("Invalid status", StatusCodes.BAD_REQUEST);

  const lookup = getAggregatedLookup([
    { collection: "users", fieldName: "user", isArray: false },
  ]);

  const data = await orderService.getAllOrders(
    {
      status: status as OrderStatus,
      userId: userId as string | undefined,
      ...getPagination(req.query),
    },
    [
      ...lookup,
      {
        $project: {
          user: 1,
          productsCount: { $size: "$products" },
          finalPrice: 1,
          status: 1,
          createdAt: 1,
        },
      },
    ]
  );

  res.status(StatusCodes.OK).json(data);
};

export const getOrder = async (req: Request, res: Response) => {
  const { orderId } = req.params;

  const order = await orderService.getOrderById(orderId, {
    finalPrice: 1,
    user: 1,
    status: 1,
    createdAt: 1,
    products: {
      $map: {
        input: "$products",
        as: "product",
        in: {
          productId: "$$product.productId",
          name: req.lang === "ar" ? "$$product.nameAr" : "$$product.nameEn",
          itemPrice: "$$product.itemPrice",
          quantity: "$$product.quantity",
          totalPrice: "$$product.totalPrice",
          cover: "$$product.cover",
        },
      },
    },
  });

  // Check if the order belongs to the current user
  if (order.user.toString() !== req.currentUser!.sub) {
    throw new CustomError("Unauthorized", StatusCodes.UNAUTHORIZED);
  }

  res.status(StatusCodes.OK).json(order);
};

export const getOrderForStaff = async (req: Request, res: Response) => {
  const { orderId } = req.params;

  const order = await orderService.getOrderById(
    orderId,
    {
      finalPrice: 1,
      user: 1,
      status: 1,
      createdAt: 1,
      products: 1,
    },
    "user"
  );

  res.status(StatusCodes.OK).json(order);
};

export const orderAgain = async (req: Request, res: Response) => {
  const { orderId } = req.params;

  const order = await orderService.getOrderById(orderId);

  // Check if the order belongs to the current user
  if (order.user.toString() !== req.currentUser!.sub) {
    throw new CustomError("Unauthorized", StatusCodes.UNAUTHORIZED);
  }

  // Extract product IDs and quantities from the order
  const products = order.products.map((product: any) => ({
    productId: product.productId.toString(),
    quantity: product.quantity,
  }));

  const updatedCart = await activeCartService.addMultiProduct({
    userId: req.currentUser!.sub,
    role: req.currentUser!.role,
    items: products,
  });

  res.status(StatusCodes.OK).json(updatedCart);
};
