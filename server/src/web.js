"use strict";

const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "..", ".env")
});

const { startServer } = require("./server");

startServer().catch((error) => {
  console.error("[web] Startup failed.");
  console.error(error);
  process.exit(1);
});
