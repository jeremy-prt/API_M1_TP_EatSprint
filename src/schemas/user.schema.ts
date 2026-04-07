import { Type } from "@sinclair/typebox";

export const UpdateUserBody = Type.Object(
  {
    name: Type.Optional(Type.String({ minLength: 1 })),
    email: Type.Optional(Type.String({ format: "email" })),
    address: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    city: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    zipCode: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  },
  { additionalProperties: false },
);

export const UserResponse = Type.Object({
  id: Type.Number(),
  email: Type.String(),
  name: Type.String(),
  address: Type.Union([Type.String(), Type.Null()]),
  city: Type.Union([Type.String(), Type.Null()]),
  zipCode: Type.Union([Type.String(), Type.Null()]),
  role: Type.String(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});
