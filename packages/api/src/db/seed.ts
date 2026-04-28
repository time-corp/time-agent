import { db, schema } from ".";

const seeds = [
  {
    id: crypto.randomUUID(),
    username: "admin",
    email: "admin@example.com",
    password: await Bun.password.hash("admin1234"),
    fullname: "Admin User",
    tenantId: "system",
    createdBy: "system",
    updatedBy: "system",
  },
  {
    id: crypto.randomUUID(),
    username: "alice",
    email: "alice@example.com",
    password: await Bun.password.hash("alice1234"),
    fullname: "Alice Smith",
    tenantId: "system",
    createdBy: "system",
    updatedBy: "system",
  },
];

await db.insert(schema.users).values(seeds).onConflictDoNothing();

console.log(`Seeded ${seeds.length} users`);
process.exit(0);
