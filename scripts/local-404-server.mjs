import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const port = Number.parseInt(process.argv[2] || "4173", 10);

const MIME_BY_EXT = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_BY_EXT[ext] || "application/octet-stream";
}

function normalizeRequestPath(urlPathname) {
  const decoded = decodeURIComponent(urlPathname || "/");
  const normalized = path.posix.normalize(decoded);
  if (normalized.startsWith("../") || normalized.includes("/../")) {
    return "/";
  }
  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

function resolvePathInProject(posixPathname) {
  const clean = posixPathname.replace(/^\/+/, "");
  return path.resolve(projectRoot, clean);
}

function isInsideProject(absPath) {
  const rel = path.relative(projectRoot, absPath);
  return rel && !rel.startsWith("..") && !path.isAbsolute(rel);
}

async function serveFile(res, filePath, statusCode = 200) {
  const body = await fs.readFile(filePath);
  res.writeHead(statusCode, {
    "Content-Type": contentTypeFor(filePath),
    "Cache-Control": "no-store"
  });
  res.end(body);
}

async function serve404(res) {
  const fallback404 = path.resolve(projectRoot, "404.html");
  try {
    await serveFile(res, fallback404, 404);
  } catch (error) {
    const plain = "404 Not Found";
    res.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store"
    });
    res.end(plain);
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const reqUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const reqPath = normalizeRequestPath(reqUrl.pathname);
    const isRoot = reqPath === "/";
    const targetPath = resolvePathInProject(isRoot ? "/index.html" : reqPath);

    if (!isInsideProject(targetPath)) {
      await serve404(res);
      return;
    }

    let stat = null;
    try {
      stat = await fs.stat(targetPath);
    } catch (error) {
      stat = null;
    }

    if (!stat || !stat.isFile()) {
      await serve404(res);
      return;
    }

    await serveFile(res, targetPath, 200);
  } catch (error) {
    await serve404(res);
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Local 404 server running at http://127.0.0.1:${port}`);
});
