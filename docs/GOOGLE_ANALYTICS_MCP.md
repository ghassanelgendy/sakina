# Google Analytics MCP Integration in Sakina

This project integrates the official Google Analytics Model Context Protocol (MCP) server from [googleanalytics/google-analytics-mcp](https://github.com/googleanalytics/google-analytics-mcp).

The integration allows AI coding agents (Antigravity, Claude Code, Cursor, Windsurf) and local CLI tools to query Google Analytics 4 (GA4) traffic, real-time activity, accounts, properties, and reports directly via standard MCP protocols.

---

## 📁 Project Structure

```
sakina/
├── .mcp.json                          # MCP server definition (detected by AI agents)
├── scripts/
│   ├── run-google-analytics-mcp.sh    # Launches MCP server over stdio
│   ├── test-google-analytics-mcp.py   # Diagnostics & tool discovery test
│   └── query-google-analytics.mjs     # Node.js CLI client for manual querying
├── tools/
│   └── google-analytics-mcp/          # Cloned MCP source repository
│       ├── .venv/                     # Dedicated Python 3.12 virtualenv
│       ├── analytics_mcp/             # MCP server implementation
│       └── setup.sh                   # Automated venv installer
└── src/
    └── lib/
        └── gtag.ts                    # Frontend GA4 tracking helpers
```

---

## ⚙️ Configuration in `.mcp.json`

The root `.mcp.json` automatically registers the server for AI clients:

```json
{
  "mcpServers": {
    "google-analytics": {
      "command": "/bin/bash",
      "args": [
        "scripts/run-google-analytics-mcp.sh"
      ],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/home/ghesso/.config/google-analytics-mcp/service-account.json",
        "GOOGLE_CLOUD_PROJECT": "sapient-fabric-513321-h1"
      }
    }
  }
}
```

---

## 🚀 Quick Commands

| Command | Description |
| :--- | :--- |
| `npm run ga:test` | Run connection diagnostics and verify the 9 MCP tools |
| `npm run ga:query tools` | List all discovered MCP tools and summaries |
| `npm run ga:query accounts` | Fetch all accessible GA4 account summaries |
| `npm run ga:query realtime <propertyId>` | Query real-time active users |
| `npm run ga:query report <propertyId>` | Query 30-day traffic report (page views, sessions) |
| `npm run ga:mcp` | Start the MCP server process manually over stdio |
| `npm run ga:setup` | Rebuild or update the Python 3.12 virtual environment |

---

## 🛠️ Available MCP Tools

The server exposes 9 official Google Analytics tools:

1. **`get_account_summaries`**: Lists all accessible GA4 accounts, properties, and sub-properties.
2. **`get_property_details`**: Retrieves metadata for a specific GA4 property.
3. **`list_google_ads_links`**: Lists linked Google Ads accounts.
4. **`list_property_annotations`**: Returns annotations for a property.
5. **`get_custom_dimensions_and_metrics`**: Inspects custom dimensions and metrics.
6. **`run_report`**: Executes core historical reports (metrics, dimensions, date ranges, filters).
7. **`run_realtime_report`**: Fetches active visitors and real-time events.
8. **`run_funnel_report`**: Analyzes multi-step user funnels.
9. **`run_conversions_report`**: Analyzes conversion events.

---

## 🔑 Authentication & Permissions

The server authenticates via **Application Default Credentials (ADC)**:

* **Service Account**: Default location at `~/.config/google-analytics-mcp/service-account.json`. Ensure the service account email has at least **Viewer** access in your Google Analytics Admin settings.
* **User Login via gcloud**: Alternatively, log in with user credentials:
  ```bash
  gcloud auth application-default login \
    --scopes="https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/cloud-platform"
  ```
