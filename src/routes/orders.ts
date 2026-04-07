import { Type, type Static } from "@sinclair/typebox";
import type { FastifyInstance } from "fastify";
import {
  createOrder,
  getUserOrders,
  getOrderById,
  getRestaurantOrders,
  updateOrderStatus,
  cancelOrder,
} from "../services/order.service.js";
import {
  CreateOrderBody,
  UpdateStatusBody,
  OrderResponse,
  OrderListResponse,
} from "../schemas/order.schema.js";
import { ErrorResponse } from "../schemas/auth.schema.js";

export default async function orderRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: Static<typeof CreateOrderBody> }>(
    "/orders",
    {
      preHandler: [fastify.authorize(["CUSTOMER"])],
      schema: {
        body: CreateOrderBody,
        response: {
          201: OrderResponse,
          400: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const order = await createOrder(
        request.user.id,
        request.body.restaurantId,
        request.body.items,
      );
      return reply.status(201).send(order);
    },
  );

  fastify.get(
    "/orders",
    {
      preHandler: [fastify.authorize(["CUSTOMER"])],
      schema: {
        response: {
          200: OrderListResponse,
        },
      },
    },
    async (request, reply) => {
      const orders = await getUserOrders(request.user.id);
      return reply.send(orders);
    },
  );

  fastify.get<{ Params: { orderId: string } }>(
    "/orders/:orderId",
    {
      preHandler: [fastify.authenticate],
      schema: {
        response: {
          200: OrderResponse,
          403: ErrorResponse,
          404: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const orderId = parseInt(request.params.orderId);
      const order = await getOrderById(orderId, request.user.id);
      return reply.send(order);
    },
  );

  fastify.patch<{
    Params: { orderId: string };
    Body: Static<typeof UpdateStatusBody>;
  }>(
    "/orders/:orderId/status",
    {
      preHandler: [fastify.authorize(["RESTAURANT_OWNER"])],
      schema: {
        body: UpdateStatusBody,
        response: {
          200: OrderResponse,
          400: ErrorResponse,
          403: ErrorResponse,
          404: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const orderId = parseInt(request.params.orderId);
      const order = await updateOrderStatus(
        orderId,
        request.user.id,
        request.body.status,
      );
      return reply.send(order);
    },
  );

  fastify.post<{ Params: { orderId: string } }>(
    "/orders/:orderId/cancel",
    {
      preHandler: [fastify.authorize(["CUSTOMER"])],
      schema: {
        response: {
          200: OrderResponse,
          400: ErrorResponse,
          403: ErrorResponse,
          404: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const orderId = parseInt(request.params.orderId);
      const order = await cancelOrder(orderId, request.user.id);
      return reply.send(order);
    },
  );

  fastify.get<{ Params: { restaurantId: string } }>(
    "/restaurants/:restaurantId/orders",
    {
      preHandler: [fastify.authorize(["RESTAURANT_OWNER"])],
      schema: {
        response: {
          200: OrderListResponse,
          403: ErrorResponse,
          404: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const restaurantId = parseInt(request.params.restaurantId);
      const orders = await getRestaurantOrders(restaurantId, request.user.id);
      return reply.send(orders);
    },
  );
}
