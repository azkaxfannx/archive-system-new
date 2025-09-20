#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

// Set environment variables
process.env.NODE_ENV = process.env.NODE_ENV || "production";

// Path to next binary
const nextBin = path.join(
  __dirname,
  "node_modules",
  "next",
  "dist",
  "bin",
  "next"
);

console.log("Starting Next.js application...");
console.log("Environment:", process.env.NODE_ENV);
console.log("Next binary:", nextBin);
console.log("Working directory:", __dirname);

// Start the Next.js application
const child = spawn("node", [nextBin, "start", "-H", "0.0.0.0", "-p", "3000"], {
  stdio: "inherit",
  env: process.env,
  cwd: __dirname,
});

child.on("error", (err) => {
  console.error("Failed to start application:", err);
  process.exit(1);
});

child.on("close", (code) => {
  console.log(`Application exited with code ${code}`);
  process.exit(code);
});

// Handle process termination
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully...");
  child.kill("SIGTERM");
});

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully...");
  child.kill("SIGINT");
});
