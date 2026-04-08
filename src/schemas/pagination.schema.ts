import { Type } from "@sinclair/typebox";

export const PaginationQuery = Type.Object({
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
  offset: Type.Optional(Type.Number({ minimum: 0, default: 0 })),
});

export function PaginatedResponse<T>(itemSchema: T) {
  return Type.Object({
    data: Type.Array(itemSchema as any),
    pagination: Type.Object({
      total: Type.Number(),
      limit: Type.Number(),
      offset: Type.Number(),
    }),
  });
}
