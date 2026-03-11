"use strict";

const path = require("path");

function loadModuleOrExit(request) {
  try {
    return require(request);
  } catch (error) {
    if (error?.code === "MODULE_NOT_FOUND") {
      const missingModule = typeof error.message === "string"
        ? error.message.match(/Cannot find module '([^']+)'/)?.[1] || ""
        : "";
      const isDependencyError = missingModule && !missingModule.startsWith(".") && !path.isAbsolute(missingModule);

      if (isDependencyError) {
        console.error(`[web] Missing dependency "${missingModule}".`);
        console.error("[web] Run \"cd server && npm ci\" before starting the server.");
        process.exit(1);
      }
    }
    throw error;
  }
}

loadModuleOrExit("dotenv").config({
  path: path.resolve(__dirname, "..", ".env")
});

const { startServer } = loadModuleOrExit("./server");

startServer().catch((error) => {
  console.error("[web] Startup failed.");
  console.error(error);
  process.exit(1);
});
