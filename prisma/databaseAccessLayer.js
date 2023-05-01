import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const scores = await prisma.score.findMany();
  console.log(scores);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
