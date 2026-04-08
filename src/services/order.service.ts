import prisma from "../lib/prisma.js";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from "../common/exceptions.js";
import { notifyRestaurant } from "./websocket.service.js";
import type { OrderStatus } from "../generated/prisma/client.js";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING"],
  PREPARING: ["DELIVERING"],
  DELIVERING: ["DELIVERED"],
};

interface OrderItemInput {
  dishId: number;
  quantity: number;
}

export async function createOrder(
  userId: number,
  restaurantId: number,
  items: OrderItemInput[],
) {
  const dishIds = items.map((item) => item.dishId);

  const dishes = await prisma.dish.findMany({
    where: { id: { in: dishIds } },
  });

  if (dishes.length !== dishIds.length) {
    throw new BadRequestError("Un ou plusieurs plats introuvables");
  }

  const allSameRestaurant = dishes.every(
    (dish) => dish.restaurantId === restaurantId,
  );

  if (!allSameRestaurant) {
    throw new BadRequestError(
      "Tous les plats doivent appartenir au même restaurant",
    );
  }

  const dishMap = new Map(dishes.map((dish) => [dish.id, dish]));

  const total = items.reduce((sum, item) => {
    const dish = dishMap.get(item.dishId)!;
    return sum + dish.price * item.quantity;
  }, 0);

  const order = await prisma.order.create({
    data: {
      userId,
      total: Math.round(total * 100) / 100,
      items: {
        create: items.map((item) => ({
          dishId: item.dishId,
          quantity: item.quantity,
          unitPrice: dishMap.get(item.dishId)!.price,
        })),
      },
    },
    include: {
      items: {
        include: { dish: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  notifyRestaurant(restaurantId, "new-order", {
    orderId: order.id,
    totalPrice: order.total,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    createdAt: order.createdAt,
  });

  return order;
}

interface OrderFilters {
  limit: number;
  offset: number;
  status?: string;
}

export async function getUserOrders(userId: number, filters: OrderFilters) {
  const where: Record<string, unknown> = { userId };

  if (filters.status) where.status = filters.status;

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: filters.limit,
      skip: filters.offset,
      include: {
        items: {
          include: { dish: { select: { id: true, name: true, image: true } } },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    data,
    pagination: { total, limit: filters.limit, offset: filters.offset },
  };
}

export async function getOrderById(orderId: number, userId: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { dish: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  if (!order) {
    throw new NotFoundError("Commande introuvable");
  }

  if (order.userId !== userId) {
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        ownerId: userId,
        dishes: { some: { orderItems: { some: { orderId } } } },
      },
    });

    if (!restaurant) {
      throw new ForbiddenError("Accès interdit à cette commande");
    }
  }

  return order;
}

export async function getRestaurantOrders(
  restaurantId: number,
  userId: number,
) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
  });

  if (!restaurant) {
    throw new NotFoundError("Restaurant introuvable");
  }

  if (restaurant.ownerId !== userId) {
    throw new ForbiddenError(
      "Vous n'êtes pas le propriétaire de ce restaurant",
    );
  }

  return prisma.order.findMany({
    where: {
      items: { some: { dish: { restaurantId } } },
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { dish: { select: { id: true, name: true, image: true } } },
      },
    },
  });
}

export async function updateOrderStatus(
  orderId: number,
  userId: number,
  newStatus: OrderStatus,
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { dish: true } } },
  });

  if (!order) {
    throw new NotFoundError("Commande introuvable");
  }

  const restaurantId = order.items[0]?.dish.restaurantId;

  if (restaurantId) {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant || restaurant.ownerId !== userId) {
      throw new ForbiddenError("Vous n'êtes pas le propriétaire du restaurant");
    }
  }

  const allowed = VALID_TRANSITIONS[order.status];

  if (!allowed || !allowed.includes(newStatus)) {
    throw new BadRequestError(
      `Transition de ${order.status} vers ${newStatus} non autorisée`,
    );
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
    include: {
      items: {
        include: { dish: { select: { id: true, name: true, image: true } } },
      },
    },
  });
}

export async function cancelOrder(orderId: number, userId: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new NotFoundError("Commande introuvable");
  }

  if (order.userId !== userId) {
    throw new ForbiddenError("Cette commande ne vous appartient pas");
  }

  if (order.status !== "PENDING") {
    throw new BadRequestError(
      "Seule une commande en attente peut être annulée",
    );
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
    include: {
      items: {
        include: { dish: { select: { id: true, name: true, image: true } } },
      },
    },
  });
}
