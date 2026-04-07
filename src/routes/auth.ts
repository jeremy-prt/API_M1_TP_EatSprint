import type { FastifyInstance } from "fastify";
import { Type, type Static } from "@sinclair/typebox";
import {
  register,
  login,
  getProfile,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from "../services/auth.service.js";
import {
  RegisterBody,
  LoginBody,
  RefreshBody,
  AuthResponse,
  MeResponse,
  ErrorResponse,
} from "../schemas/auth.schema.js";

import type { UserRole } from "../generated/prisma/client.js";

function signAccessToken(
  fastify: FastifyInstance,
  user: { id: number; email: string; role: UserRole },
) {
  return fastify.jwt.sign({ id: user.id, email: user.email, role: user.role });
}

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: Static<typeof RegisterBody> }>(
    "/register",
    {
      schema: {
        body: RegisterBody,
        response: {
          201: AuthResponse,
          409: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const user = await register(request.body);
      const accessToken = signAccessToken(fastify, user);
      const refreshToken = await createRefreshToken(user.id);

      return reply.status(201).send({ user, accessToken, refreshToken });
    },
  );

  fastify.post<{ Body: Static<typeof LoginBody> }>(
    "/login",
    {
      schema: {
        body: LoginBody,
        response: {
          200: AuthResponse,
          401: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const user = await login(request.body);
      const accessToken = signAccessToken(fastify, user);
      const refreshToken = await createRefreshToken(user.id);

      return reply.send({ user, accessToken, refreshToken });
    },
  );

  fastify.post<{ Body: Static<typeof RefreshBody> }>(
    "/refresh",
    {
      schema: {
        body: RefreshBody,
        response: {
          200: AuthResponse,
          401: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const { user, refreshToken } = await rotateRefreshToken(
        request.body.refreshToken,
      );
      const accessToken = signAccessToken(fastify, user);

      return reply.send({ user, accessToken, refreshToken });
    },
  );

  fastify.post<{ Body: Static<typeof RefreshBody> }>(
    "/logout",
    {
      schema: {
        body: RefreshBody,
        response: {
          200: Type.Object({ success: Type.Boolean() }),
        },
      },
    },
    async (request, reply) => {
      await revokeRefreshToken(request.body.refreshToken);
      return reply.send({ success: true });
    },
  );

  fastify.get(
    "/me",
    {
      preHandler: [fastify.authenticate],
      schema: {
        response: {
          200: MeResponse,
          401: ErrorResponse,
        },
      },
    },
    async (request, reply) => {
      const user = await getProfile(request.user.id);
      return reply.send({ user });
    },
  );
}
