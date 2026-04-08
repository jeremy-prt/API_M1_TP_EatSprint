import type { FastifyInstance } from "fastify";
import type { WebSocket } from "@fastify/websocket";
import prisma from "../lib/prisma.js";
import {
  registerRestaurantConnection,
  unregisterRestaurantConnection,
} from "../services/websocket.service.js";

interface AuthenticatedSocket {
  user: { id: number; email: string; role: string };
  restaurantId: number;
  socket: WebSocket;
}

export default async function websocketRoutes(fastify: FastifyInstance) {
  fastify.get("/ws/restaurant", { websocket: true }, (socket: WebSocket) => {
    let authSocket: AuthenticatedSocket | null = null;

    socket.on("message", async (raw) => {
      try {
        const message = JSON.parse(raw.toString());

        if (message.event === "authenticate") {
          try {
            const payload = fastify.jwt.verify<{
              id: number;
              email: string;
              role: string;
            }>(message.token);

            const user = await prisma.user.findUnique({
              where: { id: payload.id },
            });

            if (!user || user.role !== "RESTAURANT_OWNER") {
              socket.close(1008, "Rôle RESTAURANT_OWNER requis");
              return;
            }

            const restaurant = await prisma.restaurant.findFirst({
              where: { ownerId: user.id },
            });

            if (!restaurant) {
              socket.close(1008, "Aucun restaurant associé");
              return;
            }

            authSocket = {
              user: { id: user.id, email: user.email, role: user.role },
              restaurantId: restaurant.id,
              socket,
            };

            registerRestaurantConnection(restaurant.id, socket);

            socket.send(
              JSON.stringify({
                event: "connected",
                data: {
                  restaurantId: restaurant.id,
                  message: `Connecté au restaurant ${restaurant.name}`,
                },
                timestamp: new Date().toISOString(),
              }),
            );
          } catch {
            socket.close(1008, "Token invalide");
          }
          return;
        }

        if (!authSocket) {
          socket.send(
            JSON.stringify({
              event: "error",
              data: { message: "Authentification requise" },
            }),
          );
          return;
        }

        if (message.event === "ping") {
          socket.send(
            JSON.stringify({
              event: "pong",
              timestamp: new Date().toISOString(),
            }),
          );
        }
      } catch {
        socket.send(
          JSON.stringify({
            event: "error",
            data: { message: "Message invalide" },
          }),
        );
      }
    });

    socket.on("close", () => {
      if (authSocket) {
        unregisterRestaurantConnection(
          authSocket.restaurantId,
          authSocket.socket,
        );
      }
    });

    socket.on("error", (err) => {
      fastify.log.error(err, "WebSocket error");
      if (authSocket) {
        unregisterRestaurantConnection(
          authSocket.restaurantId,
          authSocket.socket,
        );
      }
      socket.close(1011, "Erreur serveur");
    });
  });
}
