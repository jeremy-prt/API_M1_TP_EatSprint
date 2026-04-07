import { Type } from "@sinclair/typebox";

export const CreateDishBody = Type.Object(
  {
    name: Type.String({ minLength: 1 }),
    price: Type.Number({ minimum: 0 }),
    description: Type.String({ minLength: 1 }),
    category: Type.String({ minLength: 1 }),
    calories: Type.Number({ minimum: 0 }),
    preparationTime: Type.Number({ minimum: 1 }),
    isVegetarian: Type.Boolean(),
    isVegan: Type.Boolean(),
    isSpicy: Type.Boolean(),
    allergens: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    isAvailable: Type.Boolean(),
    image: Type.String(),
  },
  { additionalProperties: false },
);

export const UpdateDishBody = Type.Object(
  {
    name: Type.Optional(Type.String({ minLength: 1 })),
    price: Type.Optional(Type.Number({ minimum: 0 })),
    description: Type.Optional(Type.String({ minLength: 1 })),
    category: Type.Optional(Type.String({ minLength: 1 })),
    calories: Type.Optional(Type.Number({ minimum: 0 })),
    preparationTime: Type.Optional(Type.Number({ minimum: 1 })),
    isVegetarian: Type.Optional(Type.Boolean()),
    isVegan: Type.Optional(Type.Boolean()),
    isSpicy: Type.Optional(Type.Boolean()),
    allergens: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    isAvailable: Type.Optional(Type.Boolean()),
    image: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export const DishResponse = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  slug: Type.String(),
  price: Type.Number(),
  description: Type.String(),
  category: Type.String(),
  restaurantId: Type.Number(),
  calories: Type.Number(),
  preparationTime: Type.Number(),
  isVegetarian: Type.Boolean(),
  isVegan: Type.Boolean(),
  isSpicy: Type.Boolean(),
  allergens: Type.Union([Type.String(), Type.Null()]),
  isAvailable: Type.Boolean(),
  image: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

export const DishListResponse = Type.Array(DishResponse);
