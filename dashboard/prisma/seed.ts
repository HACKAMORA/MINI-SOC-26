// Creates (or updates the password of) a user for local/dev use.
// Usage: npx tsx prisma/seed.ts <email> <password> [name]

import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: (process.env.DATABASE_URL ?? "file:./dev.db").replace(/^file:/, ""),
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const [, , email, password, name] = process.argv;
  if (!email || !password) {
    console.error("Usage: npx tsx prisma/seed.ts <email> <password> [name]");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      email,
      name: name ?? null,
      passwordHash,
      // Deterministic, never client-editable — see prisma/schema.prisma.
      wazuhGroup: `user-${email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
    },
  });

  console.log(`User ready: ${user.email} (wazuhGroup=${user.wazuhGroup})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
