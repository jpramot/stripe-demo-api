import prisma from "../src/config/prisma.js";

async function main() {
  await prisma.user.deleteMany();
  await prisma.user.createMany({
    data: [
      {
        name: "Alice",
        email: "alice@example.com",
      },
      {
        name: "Bob",
        email: "bob@example.com",
      },
      {
        name: "Charlie",
        email: "charlie@example.com",
      },
      {
        name: "Dobbie",
        email: "dobbie@example.com",
      },
      {
        name: "Eve",
        email: "eve@example.com",
      },
    ],
  });
}

main()
  .then(() => {
    console.log("Seed data created successfully!");
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
