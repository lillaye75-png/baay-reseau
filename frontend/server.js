const { createServer: createHTTPS } = require("https");
const { createServer: createHTTP } = require("http");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");
const path = require("path");

const dev = true;
const hostname = "0.0.0.0";
const port = 3000;

const certsDir = path.join(__dirname, "..", "certs");
const uploadsDir = path.join(__dirname, "..", "backend", "uploads");

let sslOptions = null;
try {
  sslOptions = {
    key: fs.readFileSync(path.join(certsDir, "key.pem")),
    cert: fs.readFileSync(path.join(certsDir, "cert.pem")),
  };
} catch (e) {
  console.warn("SSL certs not found — running on HTTP only.");
}

const MIME_TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = (sslOptions ? createHTTPS : createHTTP)(sslOptions || {}, async (req, res) => {
    const parsedUrl = parse(req.url, true);

    if (parsedUrl.pathname.startsWith("/uploads/")) {
      const filePath = path.join(uploadsDir, parsedUrl.pathname.replace("/uploads/", ""));
      try {
        const data = fs.readFileSync(filePath);
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
        res.end(data);
      } catch {
        res.writeHead(404);
        res.end("Not Found");
      }
      return;
    }

    try {
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error:", err.message);
      res.statusCode = 500;
      res.end("Internal Server Server");
    }
  });

  server.listen(port, hostname, (err) => {
    if (err) throw err;
    const protocol = sslOptions ? "https" : "http";
    console.log(`> Baay Réseau running on ${protocol}://localhost:${port}`);
    console.log(`> Login: ${protocol}://localhost:${port}/login`);
    console.log(`> API:   http://localhost:8000/docs`);
  });
});
