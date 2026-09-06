/** Static server for `docs/`. Enough to preview the built site locally. */

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";

const ROOT = new URL("../docs", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
// 4283 -- the handbooks share the 4280 block, clear of the inferno
// frontend's 4173-4182.
const PORT = Number(process.env.PORT || 4283);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
};

async function handler(req, res) {
  // Strip the query string and refuse traversal before touching the disk.
  const path = decodeURIComponent(req.url.split("?")[0]);
  if (path.includes("..")) {
    res.writeHead(400).end("bad request");
    return;
  }
  const file = join(ROOT, path === "/" ? "index.html" : path);
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" }).end("not found");
  }
}

const server = createServer(handler);

// Without this the process exits on an unhandled EADDRINUSE, and when it has
// been backgrounded that failure is silent -- you then screenshot whatever else
// is already on that port and believe it is your own site.
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    // Print syntax for the shell actually in use. `PORT=x cmd` is a bash-ism
    // and does nothing in PowerShell, which is where this most often runs.
    const next = PORT + 1;
    const hint = process.platform === "win32"
      ? `  PowerShell:  $env:PORT="${next}"; npm run serve\n`
        + `  cmd.exe:     set PORT=${next} && npm run serve\n`
        + `  Git Bash:    PORT=${next} npm run serve`
      : `  PORT=${next} npm run serve`;
    console.error(`port ${PORT} is already in use. Try another:\n${hint}`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => console.log(`serving docs/ on http://localhost:${PORT}`));
