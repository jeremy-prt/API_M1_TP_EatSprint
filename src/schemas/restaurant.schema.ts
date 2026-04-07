import { Type } from "@sinclair/typebox";

export const CreateRestaurantBody = Type.Object(
  {
    name: Type.String({ minLength: 1 }),
    address: Type.String({ minLength: 1 }),
    city: Type.String({ minLength: 1 }),
    category: Type.String({ minLength: 1 }),
    image: Type.String(),
    cuisine: Type.String({ minLength: 1 }),
    priceRange: Type.String(),
    deliveryTimeMin: Type.Number({ minimum: 1 }),
    ownerEmail: Type.String({ format: "email" }),
    ownerPassword: Type.String({ minLength: 6 }),
    ownerName: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

export const UpdateRestaurantBody = Type.Object(
  {
    name: Type.Optional(Type.String({ minLength: 1 })),
    address: Type.Optional(Type.String({ minLength: 1 })),
    city: Type.Optional(Type.String({ minLength: 1 })),
    category: Type.Optional(Type.String({ minLength: 1 })),
    image: Type.Optional(Type.String()),
    cuisine: Type.Optional(Type.String({ minLength: 1 })),
    priceRange: Type.Optional(Type.String()),
    deliveryTimeMin: Type.Optional(Type.Number({ minimum: 1 })),
  },
  { additionalProperties: false },
);

export const RestaurantResponse = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  address: Type.String(),
  city: Type.String(),
  category: Type.String(),
  image: Type.String(),
  cuisine: Type.String(),
  rating: Type.Number(),
  reviewCount: Type.Number(),
  priceRange: Type.String(),
  deliveryTimeMin: Type.Number(),
  slug: Type.String(),
  ownerId: Type.Union([Type.Number(), Type.Null()]),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

export const RestaurantListResponse = Type.Array(RestaurantResponse);
