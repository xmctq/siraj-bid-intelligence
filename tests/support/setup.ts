import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// An empty DATABASE_URL from the test env must mean "use PGlite", not an invalid URL.
if (process.env.DATABASE_URL === "") delete process.env.DATABASE_URL;

// Testing Library only auto-cleans with Vitest globals enabled; do it explicitly.
afterEach(async () => {
  if (typeof document !== "undefined") {
    const { cleanup } = await import("@testing-library/react");
    cleanup();
  }
});
