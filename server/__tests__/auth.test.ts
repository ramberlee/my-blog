import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

const { tempDir, cleanup } = await vi.hoisted(async () => {
  const { mkdtempSync, rmSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { tmpdir } = await import("node:os");

  const tempDir = mkdtempSync(join(tmpdir(), "blog-test-auth-"));
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
import auth from "../routes/auth.js";

const app = new Hono();
app.route("/api/auth", auth);

let server: ReturnType<typeof serve>;

beforeAll(async () => {
  server = serve({ fetch: app.fetch, port: 0 });
});

afterAll(async () => {
  server.close();
  cleanup();
});

describe("Auth API", () => {
  it("POST /api/auth/login with correct password returns token", async () => {
    const res = await request(server).post("/api/auth/login").send({ password: "admin123" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTypeOf("string");
    expect(res.body.expiry).toBeTypeOf("number");
  });

  it("POST /api/auth/login with wrong password returns 401", async () => {
    const res = await request(server).post("/api/auth/login").send({ password: "wrongpassword" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBeTypeOf("string");
  });

  it("POST /api/auth/verify with valid token returns valid", async () => {
    const loginRes = await request(server).post("/api/auth/login").send({ password: "admin123" });
    const token = loginRes.body.token;

    const res = await request(server).post("/api/auth/verify").send({ token });
    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
  });

  it("POST /api/auth/verify with invalid token returns 401", async () => {
    const res = await request(server).post("/api/auth/verify").send({ token: "invalid-token" });
    expect(res.status).toBe(401);
    expect(res.body.valid).toBe(false);
  });

  it("POST /api/auth/logout clears session", async () => {
    const loginRes = await request(server).post("/api/auth/login").send({ password: "admin123" });
    const token = loginRes.body.token;

    const logoutRes = await request(server).post("/api/auth/logout").send({ token });
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.ok).toBe(true);

    const verifyRes = await request(server).post("/api/auth/verify").send({ token });
    expect(verifyRes.status).toBe(401);
  });

  it("POST /api/auth/change-password changes password", async () => {
    const res = await request(server)
      .post("/api/auth/change-password")
      .send({ oldPassword: "admin123", newPassword: "newpass123" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const loginRes = await request(server).post("/api/auth/login").send({ password: "newpass123" });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeTypeOf("string");
  });
});
