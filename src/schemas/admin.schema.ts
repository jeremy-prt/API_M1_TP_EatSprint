import { Type } from "@sinclair/typebox";

export const CreateUserBody = Type.Object(
  {
    email: Type.String({ format: "email" }),
    password: Type.String({ minLength: 6 }),
    name: Type.String({ minLength: 1 }),
    role: Type.Union([Type.Literal("RESTAURANT_OWNER"), Type.Literal("ADMIN")]),
    address: Type.Optional(Type.String()),
    city: Type.Optional(Type.String()),
    zipCode: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export const UpdateUserAdminBody = Type.Object(
  {
    name: Type.Optional(Type.String({ minLength: 1 })),
    email: Type.Optional(Type.String({ format: "email" })),
    address: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    city: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    zipCode: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  },
  { additionalProperties: false },
);

export const AssignOwnerBody = Type.Object(
  {
    ownerId: Type.Union([Type.Number(), Type.Null()]),
  },
  { additionalProperties: false },
);
