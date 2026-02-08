import { test, expect } from "@playwright/test";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

let server;
let baseURL;

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      if (url.pathname === "/" || url.pathname === "/index.html") {
        res.writeHead(200, { "content-type": "text/html" });
        res.end(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Password Generator Browser Test</title>
  </head>
  <body>
    <script type="module">
      import { generatePassword, generatePasswordWithOptions } from "/dist/index.js";
      window.__generatePassword = generatePassword;
      window.__generatePasswordWithOptions = generatePasswordWithOptions;
    </script>
  </body>
</html>`);
        return;
      }

      if (url.pathname.startsWith("/dist/")) {
        const filePath = path.join(root, url.pathname);
        const normalized = path.normalize(filePath);
        const distRoot = path.join(root, "dist") + path.sep;
        if (!normalized.startsWith(distRoot)) {
          res.writeHead(403);
          res.end();
          return;
        }
        const content = await readFile(normalized);
        const ext = path.extname(normalized);
        const type =
          ext === ".js"
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

test("generates a memorable password in the browser", async ({ page }) => {
  await page.goto(baseURL);
  await page.waitForFunction(() => (window as any).__generatePassword);
  const pass = await page.evaluate(async () => {
    return await (window as any).__generatePassword(20, true);
  });
  expect(pass).toMatch(/([bcdfghjklmnpqrstvwxyz][aeiou]){10}/);
});

test("generates a patterned password in the browser", async ({ page }) => {
  await page.goto(baseURL);
  await page.waitForFunction(
    () => (window as any).__generatePasswordWithOptions,
  );
  const pass = await page.evaluate(async () => {
    return await (window as any).__generatePasswordWithOptions({
      length: 6,
      memorable: false,
      pattern: /\d/,
      ignoreSecurityRecommendations: true,
    });
  });
  expect(pass).toMatch(/^\d{6}$/);
});
