import type { FastifyInstance } from "fastify";
import type { Static } from "@sinclair/typebox";
import { register, login, getProfile } from "../services/auth.service.js";
import {
  RegisterBody,
  LoginBody,
  AuthResponse,
  MeResponse,
  ErrorResponse,
} from "../schemas/auth.schema.js";

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
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return reply.status(201).send({ user, token });
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
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return reply.send({ user, token });
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
