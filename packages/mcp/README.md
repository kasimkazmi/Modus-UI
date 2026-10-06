# @modus-ui/mcp

An [MCP](https://modelcontextprotocol.io) server for [Modus UI](https://modusui.kasimkazmi.com), a library of animated React components built with TypeScript, Tailwind CSS and Framer Motion.

It lets your coding agent search the catalogue, read a component's props, usage and full source, and get the exact install command, without leaving the editor. Components are copied into your project with `npx @modus-ui/cli add <name>`; they are not imported from `node_modules`.

## Setup

### Claude Code

```bash
claude mcp add modus-ui -- npx -y @modus-ui/mcp
```

### Cursor, Windsurf, VS Code and other clients

Add this to the client's MCP config (`.cursor/mcp.json`, `~/.codeium/windsurf/mcp_config.json`, and so on):

```json
{
  "mcpServers": {
    "modus-ui": {
      "command": "npx",
      "args": ["-y", "@modus-ui/mcp"]
    }
  }
}
```

VS Code (`.vscode/mcp.json`) uses `servers` instead of `mcpServers`:

```json
{
  "servers": {
    "modus-ui": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modus-ui/mcp"]
    }
  }
}
```

## Tools

| Tool                  | What it does                                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| `search_components`   | Ranked search by intent or name (`query`, optional `category`, optional `limit`, default 10).   |
| `list_components`     | Every component grouped by category with counts (optional `category`).                          |
| `get_component`       | Full markdown for one component (slug or title): description, install, usage, props and source. |
| `get_install_command` | The `npx @modus-ui/cli add <name>` command, the target file, npm dependencies and the docs URL. |

All tools are read-only. The catalogue is cached for 10 minutes.

## Configuration

| Variable       | Default                          | Purpose                                                                |
| -------------- | -------------------------------- | ---------------------------------------------------------------------- |
| `MODUS_UI_URL` | `https://modusui.kasimkazmi.com` | Origin to read the registry from, e.g. `http://localhost:3000` in dev. |

## License

MIT
