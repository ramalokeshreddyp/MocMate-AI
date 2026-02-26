import { config } from "./config.js";
import { createApp } from "./app.js";
import { createMemoryRepo } from "./storage/memoryRepo.js";
import { createPgRepo } from "./storage/pgRepo.js";

const bootstrap = async () => {
  const repo = config.databaseUrl ? await createPgRepo(config.databaseUrl) : createMemoryRepo();
  const app = createApp(repo);

  app.listen(config.port, () => {
    const mode = config.databaseUrl ? "postgres" : "memory";
    console.log(`[interview-api] running on http://localhost:${config.port} using ${mode} storage`);
  });
};

bootstrap().catch((error) => {
  console.error("Failed to start interview-api", error);
  process.exit(1);
});
