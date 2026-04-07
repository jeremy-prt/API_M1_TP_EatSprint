import { Type } from "@sinclair/typebox";

export const RegisterBody = Type.Object(
  {
    email: Type.String({ format: "email" }),
    password: Type.String({ minLength: 6 }),
    name: Type.String({ minLength: 1 }),
    address: Type.Optional(Type.String()),
    city: Type.Optional(Type.String()),
    zipCode: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export const LoginBody = Type.Object(
  {
    email: Type.String({ format: "email" }),
    password: Type.String({ minLength: 1 }),
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

export const AuthResponse = Type.Object({
  user: UserResponse,
  token: Type.String(),
});

export const MeResponse = Type.Object({
  user: UserResponse,
});

export const ErrorResponse = Type.Object({
  error: Type.String(),
  statusCode: Type.Number(),
});
