#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { DEFAULT_ORIGIN } from "./catalogue.js";
import { VERSION, createServer } from "./server.js";

const origin = process.env.MODUS_UI_URL || DEFAULT_ORIGIN;

try {
  await createServer(origin).connect(new StdioServerTransport());
  // stdout carries JSON-RPC, so status goes to stderr.
  console.error(`modus-ui-mcp ${VERSION} ready (origin: ${origin})`);
} catch (cause) {
  console.error("modus-ui-mcp failed to start:", cause);
  process.exit(1);
}
