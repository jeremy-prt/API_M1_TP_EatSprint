import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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

function parseCsv(filePath: string) {
  const content = readFileSync(resolve(filePath), "utf-8");
  const lines = content.split("\n").filter((line) => line.trim());
  const headers = lines[0]!.split(",");
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (const char of lines[i]!) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header!.trim()] = values[index]?.trim() || "";
    });
    rows.push(row);
  }

  return rows;
}

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

  const restaurantRows = parseCsv("prisma/data/restaurants.csv");
  const dishRows = parseCsv("prisma/data/plats.csv");

  const oldIdToNewId = new Map<number, number>();

  for (const row of restaurantRows) {
    const oldId = parseInt(row["id"]!);
    const slug = row["slug"]!;

    const ownerEmail = `owner-${slug}@eatsprint.com`;

    const owner = await prisma.user.upsert({
      where: { email: ownerEmail },
      update: {},
      create: {
        email: ownerEmail,
        password: hashedPassword,
        name: `Gérant ${row["nom"]}`,
        role: "RESTAURANT_OWNER",
      },
    });

    const restaurant = await prisma.restaurant.upsert({
      where: { slug },
      update: {},
      create: {
        name: row["nom"]!,
        address: row["adresse"]!,
        city: row["ville"]!,
        category: row["categorie"]!,
        image: row["image"]!,
        cuisine: row["cuisine"]!,
        rating: parseFloat(row["note"]!) || 0,
        reviewCount: parseInt(row["nb_avis"]!) || 0,
        priceRange: row["gamme_prix"]!,
        deliveryTimeMin: parseInt(row["temps_livraison_min"]!) || 30,
        slug,
        ownerId: owner.id,
      },
    });

    oldIdToNewId.set(oldId, restaurant.id);
  }

  for (const row of dishRows) {
    const oldRestaurantId = parseInt(row["restaurant_id"]!);
    const newRestaurantId = oldIdToNewId.get(oldRestaurantId);

    if (!newRestaurantId) continue;

    const slug = row["slug"]!;

    await prisma.dish.upsert({
      where: { slug },
      update: {},
      create: {
        name: row["nom"]!,
        slug,
        price: parseFloat(row["prix"]!) || 0,
        description: row["description"]!,
        category: row["categorie"]!,
        restaurantId: newRestaurantId,
        calories: parseInt(row["calories"]!) || 0,
        preparationTime: parseInt(row["temps_preparation_min"]!) || 15,
        isVegetarian: row["vegetarien"] === "true",
        isVegan: row["vegan"] === "true",
        isSpicy: row["epice"] === "true",
        allergens: row["allergenes"] || null,
        isAvailable: row["disponible"] !== "false",
        image: row["image"]!,
      },
    });
  }

  console.log(`Seed terminé :`);
  console.log(`  ${restaurantRows.length} restaurants importés`);
  console.log(`  ${dishRows.length} plats importés`);
  console.log(
    `  Users: ${admin.name}, ${customer.name} + ${restaurantRows.length} owners`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
