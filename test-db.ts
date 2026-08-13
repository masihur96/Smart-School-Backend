import { AppDataSource } from "./src/data-source";

async function run() {
  await AppDataSource.initialize();
  const res = await AppDataSource.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log("TABLES:", res.map((r: any) => r.table_name));
  process.exit(0);
}

run().catch(console.error);
