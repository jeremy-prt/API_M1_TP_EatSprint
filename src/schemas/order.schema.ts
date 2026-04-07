import { Type } from "@sinclair/typebox";

const OrderItemInput = Type.Object({
  dishId: Type.Number(),
  quantity: Type.Number({ minimum: 1 }),
});

export const CreateOrderBody = Type.Object(
  {
    restaurantId: Type.Number(),
    items: Type.Array(OrderItemInput, { minItems: 1 }),
  },
  { additionalProperties: false },
);

export const UpdateStatusBody = Type.Object(
  {
    status: Type.Union([
      Type.Literal("CONFIRMED"),
      Type.Literal("PREPARING"),
      Type.Literal("DELIVERING"),
      Type.Literal("DELIVERED"),
    ]),
  },
  { additionalProperties: false },
);

const OrderItemResponse = Type.Object({
  id: Type.Number(),
  orderId: Type.Number(),
  dishId: Type.Number(),
  quantity: Type.Number(),
  unitPrice: Type.Number(),
  dish: Type.Optional(
    Type.Object({
      id: Type.Number(),
      name: Type.String(),
      image: Type.String(),
    }),
  ),
});

export const OrderResponse = Type.Object({
  id: Type.Number(),
  userId: Type.Number(),
  status: Type.String(),
  total: Type.Number(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
  items: Type.Array(OrderItemResponse),
});

export const OrderListResponse = Type.Array(OrderResponse);

export const ErrorResponse = Type.Object({
  error: Type.String(),
  statusCode: Type.Number(),
});
