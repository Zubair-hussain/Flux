import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import assert from "node:assert/strict";
const client = new Client({ name: "flux-smoke", version: "1.0.0" });
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [
    path.resolve("node_modules/tsx/dist/cli.mjs"),
    path.resolve("mcp/server.ts"),
  ],
  stderr: "pipe",
});
try {
  await client.connect(transport);
  const tools = await client.listTools();
  assert.deepEqual(tools.tools.map((t) => t.name).sort(), [
    "download_video",
    "get_download",
    "inspect_video",
    "list_downloads",
  ]);
  const result = await client.callTool({
    name: "list_downloads",
    arguments: {},
  });
  assert.equal(result.isError, false);
  console.log(
    "MCP handshake, four tool schemas, and local API round-trip passed.",
  );
} finally {
  await client.close();
}
