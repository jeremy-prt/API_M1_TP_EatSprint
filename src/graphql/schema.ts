export const schema = `
  type Restaurant {
    id: Int!
    name: String!
    address: String!
    city: String!
    category: String!
    image: String!
    cuisine: String!
    rating: Float!
    reviewCount: Int!
    priceRange: String!
    deliveryTimeMin: Int!
    slug: String!
    ownerId: Int
    createdAt: String!
    updatedAt: String!
    dishes: [Dish!]!
  }

  type Dish {
    id: Int!
    name: String!
    slug: String!
    price: Float!
    description: String!
    category: String!
    restaurantId: Int!
    calories: Int!
    preparationTime: Int!
    isVegetarian: Boolean!
    isVegan: Boolean!
    isSpicy: Boolean!
    allergens: String
    isAvailable: Boolean!
    image: String!
    createdAt: String!
    updatedAt: String!
  }

  type OrderItem {
    id: Int!
    orderId: Int!
    dishId: Int!
    quantity: Int!
    unitPrice: Float!
    dish: Dish
  }

  type User {
    id: Int!
    email: String!
    name: String!
    address: String
    city: String
    zipCode: String
    role: String!
    createdAt: String!
    updatedAt: String!
  }

  type Order {
    id: Int!
    userId: Int!
    status: String!
    total: Float!
    createdAt: String!
    updatedAt: String!
    items: [OrderItem!]!
  }

  type Query {
    restaurants(limit: Int, offset: Int, city: String, category: String): [Restaurant!]!
    restaurant(id: Int!): Restaurant
    dishes(restaurantId: Int!, limit: Int, offset: Int): [Dish!]!
    dish(id: Int!): Dish
    me: User
    myOrders: [Order!]!
  }
`;
