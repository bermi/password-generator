import { test, expect } from "@playwright/test";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const benchRoot = path.join(root, "bench") + path.sep;
const distRoot = path.join(root, "dist") + path.sep;

let server;
let baseURL;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const pathname = url.pathname;

      if (pathname === "/" || pathname === "/index.html") {
        const htmlPath = path.join(root, "bench", "browser.html");
        const content = await readFile(htmlPath, "utf8");
        res.writeHead(200, { "content-type": "text/html" });
        res.end(content);
        return;
      }

      if (pathname.startsWith("/bench/") || pathname.startsWith("/dist/")) {
        const filePath = path.join(root, pathname);
        const normalized = path.normalize(filePath);
        const allowedRoot = pathname.startsWith("/bench/")
          ? benchRoot
          : distRoot;
        if (!normalized.startsWith(allowedRoot)) {
          res.writeHead(403);
          res.end();
          return;
        }
        const content = await readFile(normalized);
        const ext = path.extname(normalized);
        const type =
          ext === ".html"
            ? "text/html"
            : ext === ".js" || ext === ".mjs"
              ? "text/javascript"
              : ext === ".map"
                ? "application/json"
                : "text/plain";
        res.writeHead(200, { "content-type": type });
        res.end(content);
        return;
      }

      res.writeHead(404);
      res.end();
    } catch {
      res.writeHead(500);
      res.end();
    }
  });

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  baseURL = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  if (!server) return;
  await new Promise((resolve) => server.close(() => resolve()));
});

test("browser benchmarks run", async ({ page }) => {
  await page.goto(`${baseURL}/bench/browser.html?fast=1`);
  await page.waitForFunction(() => (window as any).__benchDone === true, null, {
    timeout: 30_000,
  });

  const error = await page.evaluate(() => (window as any).__benchError ?? null);
  expect(error).toBeNull();

  const results = await page.evaluate(
    () => (window as any).__benchResults ?? null,
  );
  expect(results).toBeTruthy();
  expect(results.password?.cases?.length ?? 0).toBeGreaterThan(0);
  expect(results.patterns?.suites?.length ?? 0).toBeGreaterThan(0);
  expect(results.structures?.cases?.length ?? 0).toBeGreaterThan(0);
  expect(results.constraints?.cases?.length ?? 0).toBeGreaterThan(0);
});
