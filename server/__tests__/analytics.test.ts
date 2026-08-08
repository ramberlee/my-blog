import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

const { tempDir, cleanup } = await vi.hoisted(async () => {
  const { mkdtempSync, rmSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { tmpdir } = await import("node:os");

  const tempDir = mkdtempSync(join(tmpdir(), "blog-test-analytics-"));
  const cleanup = () => rmSync(tempDir, { recursive: true, force: true });
  return { tempDir, cleanup };
});

vi.mock("../storage.js", async () => {
  const { existsSync, readFileSync, writeFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  return {
    readJSON: (filename: string, fallback: unknown) => {
      const path = join(tempDir, filename);
      if (!existsSync(path)) {
        writeFileSync(path, JSON.stringify(fallback, null, 2), "utf-8");
        return fallback;
      }
      try {
        return JSON.parse(readFileSync(path, "utf-8"));
      } catch {
        return fallback;
      }
    },
    writeJSON: (filename: string, data: unknown) => {
      writeFileSync(join(tempDir, filename), JSON.stringify(data, null, 2), "utf-8");
    },
  };
});

import { Hono } from "hono";
import { serve } from "@hono/node-server";
import request from "supertest";
import analytics from "../routes/analytics.js";

const app = new Hono();
app.route("/api/analytics", analytics);

let server: ReturnType<typeof serve>;

beforeAll(async () => {
  server = serve({ fetch: app.fetch, port: 0 });
});

afterAll(async () => {
  server.close();
  cleanup();
});

describe("Analytics API", () => {
  it("GET /api/analytics returns statistics", async () => {
    const res = await request(server).get("/api/analytics");
    expect(res.status).toBe(200);
    expect(res.body.totalVisitors).toBeTypeOf("number");
    expect(res.body.todayVisitors).toBeTypeOf("number");
    expect(res.body.pageViews).toBeTypeOf("number");
    expect(Array.isArray(res.body.topPages)).toBe(true);
    expect(Array.isArray(res.body.referrers)).toBe(true);
  });

  it("POST /api/analytics/track records visit", async () => {
    const res = await request(server).post("/api/analytics/track").send({ page: "Test Page", referrer: "Google" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const statsRes = await request(server).get("/api/analytics");
    expect(statsRes.status).toBe(200);
    const testPage = statsRes.body.topPages.find(
      (p: { page: string; views: number }) => p.page === "Test Page"
    );
    expect(testPage).toBeDefined();
    expect(testPage.views).toBeGreaterThanOrEqual(1);
  });
});
