import { readdir, rm } from "node:fs/promises";

/** Best-effort cleanup of databases from previous E2E runs. */
export default async function globalSetup() {
  const entries = await readdir(".data").catch(() => [] as string[]);
  await Promise.all(
    entries
      .filter((name) => name.startsWith("e2e"))
      .map((name) => rm(`.data/${name}`, { recursive: true, force: true, maxRetries: 3 }).catch(() => undefined)),
  );
}
