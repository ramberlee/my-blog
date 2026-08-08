import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

const { tempDir, cleanup } = await vi.hoisted(async () => {
  const { mkdtempSync, rmSync, writeFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { tmpdir } = await import("node:os");

  const tempDir = mkdtempSync(join(tmpdir(), "blog-test-sitemap-"));

  const articles = [
    {
      id: "1",
      title: "Test Article One",
      content: "Content one.",
      category: "Tech",
      tags: ["test"],
      createdAt: "2024-01-15",
      updatedAt: "2024-01-15",
      status: "published",
      coverImage: "https://example.com/1.jpg",
    },
    {
      id: "2",
      title: "Draft Article",
      content: "This is a draft.",
      category: "Life",
      tags: ["draft"],
      createdAt: "2024-01-05",
      updatedAt: "2024-01-05",
      status: "draft",
    },
  ];

  writeFileSync(join(tempDir, "articles.json"), JSON.stringify(articles, null, 2));

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
import sitemap from "../routes/sitemap.js";

const app = new Hono();
app.route("/api/sitemap", sitemap);

let server: ReturnType<typeof serve>;

beforeAll(async () => {
  server = serve({ fetch: app.fetch, port: 0 });
});

afterAll(async () => {
  server.close();
  cleanup();
});

describe("Sitemap", () => {
  it("GET /api/sitemap returns 200", async () => {
    const res = await request(server).get("/api/sitemap");
    expect(res.status).toBe(200);
  });

  it("returns Content-Type application/xml", async () => {
    const res = await request(server).get("/api/sitemap");
    expect(res.headers["content-type"]).toContain("application/xml");
  });

  it("returns valid XML with urlset", async () => {
    const res = await request(server).get("/api/sitemap");
    const xml = res.text;
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("<urlset");
    expect(xml).toContain("</urlset>");
  });

  it("includes homepage, articles page, and about page", async () => {
    const res = await request(server).get("/api/sitemap");
    const xml = res.text;
    expect(xml).toContain("http://localhost:3001/");
    expect(xml).toContain("http://localhost:3001/articles");
    expect(xml).toContain("http://localhost:3001/about");
  });

  it("includes published articles but not drafts", async () => {
    const res = await request(server).get("/api/sitemap");
    const xml = res.text;
    expect(xml).toContain("http://localhost:3001/articles/1");
    expect(xml).not.toContain("http://localhost:3001/articles/2");
  });

  it("includes lastmod from article updatedAt", async () => {
    const res = await request(server).get("/api/sitemap");
    const xml = res.text;
    expect(xml).toContain("<lastmod>2024-01-15</lastmod>");
  });
});