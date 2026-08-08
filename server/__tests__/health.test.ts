import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import request from "supertest";

const app = new Hono();

app.get("/api/health", (c) => {
  return c.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

let server: ReturnType<typeof serve>;

beforeAll(async () => {
  server = serve({ fetch: app.fetch, port: 0 });
});

afterAll(async () => {
  server.close();
});

describe("GET /api/health", () => {
  it("returns 200 status code", async () => {
    const res = await request(server).get("/api/health");
    expect(res.status).toBe(200);
  });

  it("returns JSON with status, uptime, and timestamp", async () => {
    const res = await request(server).get("/api/health");
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("uptime");
    expect(typeof res.body.uptime).toBe("number");
    expect(res.body).toHaveProperty("timestamp");
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });
});
