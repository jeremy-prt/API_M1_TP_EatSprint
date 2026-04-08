import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: process.env["DATABASE_HOST"] || "localhost",
  user: process.env["DATABASE_USER"] || "root",
  password: process.env["DATABASE_PASSWORD"] || "root",
  database: process.env["DATABASE_NAME"] || "eatsprint",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("123456", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@eatsprint.com" },
    update: {},
    create: {
      email: "admin@eatsprint.com",
      password: hashedPassword,
      name: "Admin",
      role: "ADMIN",
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: "chef@pizzapalace.com" },
    update: {},
    create: {
      email: "chef@pizzapalace.com",
      password: hashedPassword,
      name: "Chef Luigi",
      role: "RESTAURANT_OWNER",
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "client@test.com" },
    update: {},
    create: {
      email: "client@test.com",
      password: hashedPassword,
      name: "Jean Dupont",
      address: "12 rue de Paris",
      city: "Paris",
      zipCode: "75001",
      role: "CUSTOMER",
    },
  });

  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "pizza-palace" },
    update: {},
    create: {
      name: "Pizza Palace",
      address: "10 rue de Rome",
      city: "Paris",
      category: "Italien",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591",
      cuisine: "Pizza",
      priceRange: "€€",
      deliveryTimeMin: 30,
      slug: "pizza-palace",
      ownerId: owner.id,
    },
  });

  const sushiOwner = await prisma.user.upsert({
    where: { email: "chef@sushiworld.com" },
    update: {},
    create: {
      email: "chef@sushiworld.com",
      password: hashedPassword,
      name: "Chef Takeshi",
      role: "RESTAURANT_OWNER",
    },
  });

  const sushiRestaurant = await prisma.restaurant.upsert({
    where: { slug: "sushi-world" },
    update: {},
    create: {
      name: "Sushi World",
      address: "5 avenue du Japon",
      city: "Lyon",
      category: "Japonais",
      image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c",
      cuisine: "Sushi",
      priceRange: "€€€",
      deliveryTimeMin: 40,
      slug: "sushi-world",
      ownerId: sushiOwner.id,
    },
  });

  await prisma.dish.upsert({
    where: { slug: "margherita" },
    update: {},
    create: {
      name: "Margherita",
      slug: "margherita",
      price: 9.5,
      description: "Tomate, mozzarella, basilic frais",
      category: "Pizza",
      calories: 800,
      preparationTime: 15,
      isVegetarian: true,
      isVegan: false,
      isSpicy: false,
      allergens: "gluten, lactose",
      isAvailable: true,
      image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002",
      restaurantId: restaurant.id,
    },
  });

  await prisma.dish.upsert({
    where: { slug: "pepperoni" },
    update: {},
    create: {
      name: "Pepperoni",
      slug: "pepperoni",
      price: 12.5,
      description: "Tomate, mozzarella, pepperoni",
      category: "Pizza",
      calories: 950,
      preparationTime: 15,
      isVegetarian: false,
      isVegan: false,
      isSpicy: true,
      allergens: "gluten, lactose",
      isAvailable: true,
      image: "https://images.unsplash.com/photo-1628840042765-356cda07504e",
      restaurantId: restaurant.id,
    },
  });

  await prisma.dish.upsert({
    where: { slug: "salmon-sashimi" },
    update: {},
    create: {
      name: "Salmon Sashimi",
      slug: "salmon-sashimi",
      price: 14,
      description: "6 tranches de saumon frais",
      category: "Sashimi",
      calories: 300,
      preparationTime: 10,
      isVegetarian: false,
      isVegan: false,
      isSpicy: false,
      allergens: "poisson",
      isAvailable: true,
      image: "https://images.unsplash.com/photo-1553621042-f6e147245754",
      restaurantId: sushiRestaurant.id,
    },
  });

  console.log(
    `Seed terminé : ${admin.name}, ${owner.name}, ${sushiOwner.name}, ${customer.name}`,
  );
  console.log(`Restaurants : ${restaurant.name}, ${sushiRestaurant.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
