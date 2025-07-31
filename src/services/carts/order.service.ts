import { StatusCodes } from "http-status-codes";
import CustomError from "../../errors/custom-error";
import Order from "../../models/carts/order.model";
import { checkIfClient } from "../../utils/users";
import { activeCartService } from "..";
import { OrderStatus } from "../../types/cart";
import { emptyPaginationList, getPaginationPipline } from "../../utils/models";

export const placeOrder = async ({
  userId,
  role,
  sessionId,
}: {
  userId: string;
  role?: string;
  sessionId?: string;
}) => {
  await checkIfClient(userId, role);

  const activeCart = await activeCartService.getCart({ userId, role });

  if (activeCart.products.length === 0)
    throw new CustomError("User cart is empty", StatusCodes.BAD_REQUEST);

  // Recalculate the final price
  const finalPrice = activeCart.products.reduce(
    (acc, product) => acc + product.totalPrice,
    0
  );

  // Create new order with cart data
  const newOrder = await Order.create({
    user: userId,
    products: activeCart.products,
    finalPrice,
    status: OrderStatus.Confirmed,
    sessionId: sessionId || null,
  });

  // Clear the active cart
  await activeCartService.clearCart({ userId, role });

  return newOrder;
};

export const changeOrderStatus = async ({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) => {
  const order = await Order.findByIdAndUpdate(
    orderId,
    { status },
    { new: true }
  ).exec();

  if (!order) throw new CustomError("Order not found", StatusCodes.NOT_FOUND);

  return order;
};

export const getOrderById = async (
  orderId: string,
  projection?: any,
  populate?: any
) => {
  const order = await Order.findById(orderId, projection).populate(populate);

  if (!order) throw new CustomError("Order not found", StatusCodes.NOT_FOUND);

  return order;
};

export const getAllOrders = async (
  filters: {
    skip: number;
    limit: number;
    status?: OrderStatus;
    userId?: string;
  },
  dataPipline?: any[]
) => {
  const { skip, limit, status, userId } = filters;

  if (userId) await checkIfClient(userId);

  let query: any = {};
  const andQuery: any = [];

  if (status) andQuery.push({ $eq: ["$status", status] });
  if (userId) andQuery.push({ $eq: ["$user", { $toObjectId: userId }] });

  if (andQuery.length > 0) query.$expr = { $and: andQuery };

  const data = await Order.aggregate(
    getPaginationPipline({
      beforePipline: [{ $match: query }, { $sort: { createdAt: -1 } }],
      skip,
      limit,
      dataPipline,
    })
  );

  return data[0] || emptyPaginationList(skip, limit);
};
