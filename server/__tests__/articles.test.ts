import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

const { tempDir, cleanup } = await vi.hoisted(async () => {
  const { mkdtempSync, rmSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { tmpdir } = await import("node:os");

  const tempDir = mkdtempSync(join(tmpdir(), "blog-test-articles-"));
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
import articles from "../routes/articles.js";

const app = new Hono();
app.route("/api/articles", articles);

let server: ReturnType<typeof serve>;

beforeAll(async () => {
  server = serve({ fetch: app.fetch, port: 0 });
});

afterAll(async () => {
  server.close();
  cleanup();
});

describe("Articles API", () => {
  it("GET /api/articles returns list", async () => {
    const res = await request(server).get("/api/articles");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("GET /api/articles/:id returns single article", async () => {
    const res = await request(server).get("/api/articles/1");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("1");
    expect(res.body.title).toBeTypeOf("string");
  });

  it("GET /api/articles/999 returns 404", async () => {
    const res = await request(server).get("/api/articles/999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Not found");
  });

  it("POST /api/articles creates article", async () => {
    const newArticle = {
      title: "Test Article",
      content: "Test content",
      category: "Test",
      tags: ["test"],
      status: "draft",
    };
    const res = await request(server).post("/api/articles").send(newArticle);
    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Test Article");
    expect(res.body.id).toBeTypeOf("string");
    expect(res.body.createdAt).toBeTypeOf("string");
  });

  it("PUT /api/articles/:id updates article", async () => {
    const updates = { title: "Updated Title" };
    const res = await request(server).put("/api/articles/1").send(updates);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated Title");
    expect(res.body.id).toBe("1");
  });

  it("DELETE /api/articles/:id deletes article", async () => {
    const res = await request(server).delete("/api/articles/2");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("POST /api/articles/import imports articles", async () => {
    const imported = [
      {
        id: "imp1",
        title: "Imported Article",
        content: "Imported content",
        category: "Import",
        tags: ["imported"],
        status: "published",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    ];
    const res = await request(server).post("/api/articles/import").send(imported);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.total).toBeGreaterThan(1);
  });
});
