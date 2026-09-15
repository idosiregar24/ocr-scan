#!/usr/bin/env node
// Start/stop Postgres lokal (portable, non-service — lihat README §Setup Database).
// Node murni, bukan shell script, supaya jalan sama persis dari cmd/PowerShell/Git Bash.
import { spawnSync } from "node:child_process";
import path from "node:path";

const action = process.argv[2];
if (action !== "start" && action !== "stop") {
  console.error("Usage: node scripts/db-ctl.mjs <start|stop>");
  process.exit(1);
}

const localAppData = process.env.LOCALAPPDATA;
if (!localAppData) {
  console.error("LOCALAPPDATA tidak ditemukan — script ini khusus Windows.");
  process.exit(1);
}

const pgHome = path.join(localAppData, "strukscan-postgres", "postgresql-18.6.0-x86_64-pc-windows-msvc");
const pgCtl = path.join(pgHome, "bin", "pg_ctl.exe");
const dataDir = path.join(pgHome, "data");
const logFile = path.join(pgHome, "server.log");

const args =
  action === "start"
    ? ["-D", dataDir, "-l", logFile, "-o", "-p 5432 -c listen_addresses=localhost", "start"]
    : ["-D", dataDir, "stop"];

const result = spawnSync(pgCtl, args, { stdio: "inherit" });
process.exit(result.status ?? 1);
