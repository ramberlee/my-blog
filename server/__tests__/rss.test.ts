import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

const { tempDir, cleanup } = await vi.hoisted(async () => {
  const { mkdtempSync, rmSync, writeFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { tmpdir } = await import("node:os");

  const tempDir = mkdtempSync(join(tmpdir(), "blog-test-rss-"));

  const articles = [
    {
      id: "1",
      title: "Test Article One",
      content: "First test article content for RSS.",
      category: "Tech",
      tags: ["test"],
      createdAt: "2024-01-15",
      updatedAt: "2024-01-15",
      status: "published",
      coverImage: "https://example.com/1.jpg",
    },
    {
      id: "2",
      title: "Test Article Two",
      content: "Second test article content.",
      category: "Life",
      tags: ["test"],
      createdAt: "2024-01-10",
      updatedAt: "2024-01-10",
      status: "published",
      coverImage: "https://example.com/2.jpg",
    },
    {
      id: "3",
      title: "Draft Article",
      content: "This is a draft.",
      category: "Tech",
      tags: ["draft"],
      createdAt: "2024-01-05",
      updatedAt: "2024-01-05",
      status: "draft",
    },
  ];

  const config = {
    siteName: "Test Blog",
    siteDescription: "A test blog description",
    author: { name: "Tester", email: "test@test.com" },
  };

  writeFileSync(join(tempDir, "articles.json"), JSON.stringify(articles, null, 2));
  writeFileSync(join(tempDir, "config.json"), JSON.stringify(config, null, 2));

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
import rss from "../routes/rss.js";

const app = new Hono();
app.route("/api/rss", rss);

let server: ReturnType<typeof serve>;

beforeAll(async () => {
  server = serve({ fetch: app.fetch, port: 0 });
});

afterAll(async () => {
  server.close();
  cleanup();
});

describe("RSS Feed", () => {
  it("GET /api/rss returns 200", async () => {
    const res = await request(server).get("/api/rss");
    expect(res.status).toBe(200);
  });

  it("returns Content-Type application/xml", async () => {
    const res = await request(server).get("/api/rss");
    expect(res.headers["content-type"]).toContain("application/xml");
  });

  it("returns valid RSS XML with channel and items", async () => {
    const res = await request(server).get("/api/rss");
    const xml = res.text;
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain("<channel>");
    expect(xml).toContain("</channel>");
    expect(xml).toContain("<title>Test Blog</title>");
    expect(xml).toContain("<description>A test blog description</description>");
  });

  it("includes only published articles", async () => {
    const res = await request(server).get("/api/rss");
    const xml = res.text;
    expect(xml).toContain("Test Article One");
    expect(xml).toContain("Test Article Two");
    expect(xml).not.toContain("Draft Article");
  });

  it("includes article link, pubDate, and truncated description", async () => {
    const res = await request(server).get("/api/rss");
    const xml = res.text;
    expect(xml).toContain("http://localhost:3001/articles/1");
    expect(xml).toContain("<pubDate>");
    expect(xml).toContain("First test article content for RSS.");
  });
});