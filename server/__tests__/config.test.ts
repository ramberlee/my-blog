import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

const { tempDir, cleanup } = await vi.hoisted(async () => {
  const { mkdtempSync, rmSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { tmpdir } = await import("node:os");

  const tempDir = mkdtempSync(join(tmpdir(), "blog-test-config-"));
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
import config from "../routes/config.js";

const app = new Hono();
app.route("/api/config", config);

let server: ReturnType<typeof serve>;

beforeAll(async () => {
  server = serve({ fetch: app.fetch, port: 0 });
});

afterAll(async () => {
  server.close();
  cleanup();
});

describe("Config API", () => {
  it("GET /api/config returns config", async () => {
    const res = await request(server).get("/api/config");
    expect(res.status).toBe(200);
    expect(res.body.siteName).toBeTypeOf("string");
    expect(res.body.siteDescription).toBeTypeOf("string");
    expect(res.body.author).toBeTypeOf("object");
    expect(res.body.author.name).toBeTypeOf("string");
  });

  it("GET /api/config returns default heroImages", async () => {
    const res = await request(server).get("/api/config");
    expect(res.status).toBe(200);
    expect(res.body.heroImages).toHaveLength(3);
    expect(res.body.heroImages[0]).toMatchObject({
      id: "hero-main",
      url: expect.any(String),
      alt: expect.any(String),
    });
  });

  it("PUT /api/config updates config", async () => {
    const updates = {
      siteName: "My Updated Blog",
      author: { name: "Updated Author" },
    };
    const res = await request(server).put("/api/config").send(updates);
    expect(res.status).toBe(200);
    expect(res.body.siteName).toBe("My Updated Blog");
    expect(res.body.author.name).toBe("Updated Author");
  });

  it("PUT /api/config updates heroImages", async () => {
    const heroImages = [
      { id: "hero-main", url: "/uploads/photo-1.jpg", alt: "街拍" },
      { id: "hero-side-1", url: "/uploads/photo-2.jpg", alt: "夜景" },
      { id: "hero-side-2", url: "/uploads/photo-3.jpg", alt: "人像" },
    ];
    const res = await request(server).put("/api/config").send({ heroImages });
    expect(res.status).toBe(200);
    expect(res.body.heroImages).toEqual(heroImages);
  });

  it("PUT /api/config accepts 5 heroImages", async () => {
    const heroImages = [
      { id: "hero-1", url: "/uploads/1.jpg", alt: "作品一" },
      { id: "hero-2", url: "/uploads/2.jpg", alt: "作品二" },
      { id: "hero-3", url: "/uploads/3.jpg", alt: "作品三" },
      { id: "hero-4", url: "/uploads/4.jpg", alt: "作品四" },
      { id: "hero-5", url: "/uploads/5.jpg", alt: "作品五" },
    ];
    const res = await request(server).put("/api/config").send({ heroImages });
    expect(res.status).toBe(200);
    expect(res.body.heroImages).toEqual(heroImages);
  });

  it("PUT /api/config accepts an empty heroImages array", async () => {
    const res = await request(server).put("/api/config").send({ heroImages: [] });
    expect(res.status).toBe(200);
    expect(res.body.heroImages).toEqual([]);
  });

  const invalidHeroImages = [
    { label: "missing id", item: { url: "/uploads/a.jpg", alt: "街拍" } },
    { label: "missing url", item: { id: "hero-main", alt: "街拍" } },
    { label: "missing alt", item: { id: "hero-main", url: "/uploads/a.jpg" } },
    { label: "empty id", item: { id: "", url: "/uploads/a.jpg", alt: "街拍" } },
    { label: "empty url", item: { id: "hero-main", url: "", alt: "街拍" } },
    { label: "empty alt", item: { id: "hero-main", url: "/uploads/a.jpg", alt: "" } },
  ];

  it.each(invalidHeroImages)(
    "PUT /api/config rejects heroImages with $label and does not write config",
    async ({ item }) => {
      const baseline = [
        { id: "hero-main", url: "/uploads/baseline-a.jpg", alt: "基线一" },
        { id: "hero-side-1", url: "/uploads/baseline-b.jpg", alt: "基线二" },
        { id: "hero-side-2", url: "/uploads/baseline-c.jpg", alt: "基线三" },
      ];
      await request(server).put("/api/config").send({ heroImages: baseline });

      const res = await request(server).put("/api/config").send({ heroImages: [item] });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeTypeOf("string");

      const after = await request(server).get("/api/config");
      expect(after.status).toBe(200);
      expect(after.body.heroImages).toEqual(baseline);
    },
  );

  it("GET /api/config returns an existing 3-item heroImages config unchanged", async () => {
    const heroImages = [
      { id: "hero-side-2", url: "/uploads/third.jpg", alt: "第三张" },
      { id: "hero-main", url: "/uploads/first.jpg", alt: "第一张" },
      { id: "hero-side-1", url: "/uploads/second.jpg", alt: "第二张" },
    ];
    const put = await request(server).put("/api/config").send({ heroImages });
    expect(put.status).toBe(200);

    const res = await request(server).get("/api/config");
    expect(res.status).toBe(200);
    expect(res.body.heroImages).toEqual(heroImages);
  });

  it("POST /api/config/reset resets config", async () => {
    await request(server).put("/api/config").send({ siteName: "Changed" });

    const res = await request(server).post("/api/config/reset");
    expect(res.status).toBe(200);
    expect(res.body.siteName).toBe("个人博客");
    expect(res.body.heroImages).toHaveLength(3);
  });
});
