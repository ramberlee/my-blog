import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

const { tempDir, cleanup } = await vi.hoisted(async () => {
  const { mkdtempSync, rmSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { tmpdir } = await import("node:os");

  const tempDir = mkdtempSync(join(tmpdir(), "blog-test-validation-"));
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

vi.mock("../middleware/rateLimit.js", () => ({
  rateLimit: () => async (_c: any, next: () => Promise<void>) => next(),
  resetRateLimitForIp: () => {},
}));

import { Hono } from "hono";
import { serve } from "@hono/node-server";
import request from "supertest";
import articles from "../routes/articles.js";
import auth from "../routes/auth.js";
import config from "../routes/config.js";

const app = new Hono();
app.route("/api/articles", articles);
app.route("/api/auth", auth);
app.route("/api/config", config);

let server: ReturnType<typeof serve>;

beforeAll(async () => {
  server = serve({ fetch: app.fetch, port: 0 });
});

afterAll(async () => {
  server.close();
  cleanup();
});

describe("Articles validation", () => {
  it("POST /api/articles rejects empty title", async () => {
    const res = await request(server)
      .post("/api/articles")
      .send({ title: "", content: "Some content here", category: "Tech", tags: [], status: "draft" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("标题不能为空");
  });

  it("POST /api/articles rejects whitespace-only title", async () => {
    const res = await request(server)
      .post("/api/articles")
      .send({ title: "   ", content: "Some content here", category: "Tech", tags: [], status: "draft" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("标题不能为空");
  });

  it("POST /api/articles rejects title exceeding 100 characters", async () => {
    const res = await request(server)
      .post("/api/articles")
      .send({ title: "a".repeat(101), content: "Some content here", category: "Tech", tags: [], status: "draft" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("标题不能超过100个字符");
  });

  it("POST /api/articles accepts title at exactly 100 characters", async () => {
    const res = await request(server)
      .post("/api/articles")
      .send({ title: "a".repeat(100), content: "Some valid content here", category: "Tech", tags: [], status: "draft" });
    expect(res.status).toBe(201);
  });

  it("POST /api/articles rejects empty content", async () => {
    const res = await request(server)
      .post("/api/articles")
      .send({ title: "Valid Title", content: "", category: "Tech", tags: [], status: "draft" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("内容不能为空");
  });

  it("POST /api/articles rejects missing content", async () => {
    const res = await request(server)
      .post("/api/articles")
      .send({ title: "Valid Title", category: "Tech", tags: [], status: "draft" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("内容不能为空");
  });

  it("PUT /api/articles/:id rejects title exceeding 100 characters", async () => {
    const res = await request(server)
      .put("/api/articles/1")
      .send({ title: "b".repeat(101) });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("标题不能超过100个字符");
  });

  it("PUT /api/articles/:id accepts title at exactly 100 characters", async () => {
    const res = await request(server)
      .put("/api/articles/1")
      .send({ title: "b".repeat(100) });
    expect(res.status).toBe(200);
  });

  it("PUT /api/articles/:id allows update without title", async () => {
    const res = await request(server)
      .put("/api/articles/1")
      .send({ content: "Updated content only" });
    expect(res.status).toBe(200);
  });
});

describe("Auth validation", () => {
  it("POST /api/auth/login rejects empty password", async () => {
    const res = await request(server)
      .post("/api/auth/login")
      .send({ password: "" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("密码不能为空");
  });

  it("POST /api/auth/login rejects missing password", async () => {
    const res = await request(server)
      .post("/api/auth/login")
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("密码不能为空");
  });

  it("POST /api/auth/change-password rejects short new password", async () => {
    const res = await request(server)
      .post("/api/auth/change-password")
      .send({ oldPassword: "admin123", newPassword: "12345" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("新密码至少6位");
  });

  it("POST /api/auth/change-password rejects empty new password", async () => {
    const res = await request(server)
      .post("/api/auth/change-password")
      .send({ oldPassword: "admin123", newPassword: "" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("新密码至少6位");
  });

  it("POST /api/auth/change-password accepts password with exactly 6 chars", async () => {
    const res = await request(server)
      .post("/api/auth/change-password")
      .send({ oldPassword: "admin123", newPassword: "123456" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe("Config validation", () => {
  it("PUT /api/config rejects empty siteName", async () => {
    const res = await request(server)
      .put("/api/config")
      .send({ siteName: "" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("站点名称不能为空");
  });

  it("PUT /api/config rejects whitespace-only siteName", async () => {
    const res = await request(server)
      .put("/api/config")
      .send({ siteName: "   " });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("站点名称不能为空");
  });

  it("PUT /api/config rejects siteName exceeding 50 characters", async () => {
    const res = await request(server)
      .put("/api/config")
      .send({ siteName: "a".repeat(51) });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("站点名称不能超过50个字符");
  });

  it("PUT /api/config accepts siteName at exactly 50 characters", async () => {
    const res = await request(server)
      .put("/api/config")
      .send({ siteName: "a".repeat(50) });
    expect(res.status).toBe(200);
  });

  it("PUT /api/config allows update without siteName", async () => {
    const res = await request(server)
      .put("/api/config")
      .send({ siteDescription: "New description" });
    expect(res.status).toBe(200);
  });
});
