import type { WebSocket } from "@fastify/websocket";

const restaurantConnections = new Map<number, Set<WebSocket>>();

export function registerRestaurantConnection(
  restaurantId: number,
  socket: WebSocket,
) {
  if (!restaurantConnections.has(restaurantId)) {
    restaurantConnections.set(restaurantId, new Set());
  }
  restaurantConnections.get(restaurantId)!.add(socket);
}

export function unregisterRestaurantConnection(
  restaurantId: number,
  socket: WebSocket,
) {
  const connections = restaurantConnections.get(restaurantId);
  if (!connections) return;

  connections.delete(socket);

  if (connections.size === 0) {
    restaurantConnections.delete(restaurantId);
  }
}

export function notifyRestaurant(
  restaurantId: number,
  event: string,
  data: Record<string, unknown>,
) {
  const connections = restaurantConnections.get(restaurantId);
  if (!connections) return;

  const message = JSON.stringify({
    event,
    data,
    timestamp: new Date().toISOString(),
  });

  for (const socket of connections) {
    if (socket.readyState === socket.OPEN) {
      socket.send(message);
    }
  }
}
