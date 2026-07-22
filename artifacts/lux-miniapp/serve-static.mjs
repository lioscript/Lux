import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { join, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = resolve(__dirname, "dist/public");
const port = Number(process.env.PORT) || 3000;

const mime = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
};

createServer((req, res) => {
  let urlPath = req.url.split("?")[0];
  let filePath = join(root, urlPath);

  // SPA fallback
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(root, "index.html");
  }

  const ext = extname(filePath);
  const contentType = mime[ext] || "application/octet-stream";

  res.writeHead(200, { "Content-Type": contentType });
  createReadStream(filePath).pipe(res);
}).listen(port, "0.0.0.0", () => {
  console.log(`Mini App serving on port ${port}`);
});
