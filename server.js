/*
App Name: CWL Hardware
App Client: CWL Hardware
Author: James Bryant D. Espino
URL: https://github.com/Jamespino20
Last Update Date: June 13, 2026
*/

process.on("uncaughtException", (err) => {
  console.log("[FATAL] UNCAUGHT EXCEPTION: " + (err?.stack || err));
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.log("[FATAL] UNHANDLED REJECTION: " + (reason?.stack || reason));
});

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  }).listen(process.env.PORT || 3000, () => {
    console.log("> Ready on http://localhost:" + (process.env.PORT || 3000));
  });
}).catch((err) => {
  console.log("[FATAL] app.prepare() failed: " + (err?.stack || err));
  process.exit(1);
});
