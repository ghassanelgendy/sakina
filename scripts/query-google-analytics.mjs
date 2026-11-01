#!/usr/bin/env node
/**
 * Sakina - Google Analytics MCP CLI Client
 *
 * Allows developers and agents to interact with Google Analytics via the
 * local Google Analytics MCP server over stdio.
 *
 * Usage:
 *   node scripts/query-google-analytics.mjs tools
 *   node scripts/query-google-analytics.mjs accounts
 *   node scripts/query-google-analytics.mjs report <propertyId> [metric1,metric2] [dim1,dim2]
 *   node scripts/query-google-analytics.mjs realtime <propertyId> [metric1,metric2]
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import readline from 'node:readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');
const runnerScript = resolve(__dirname, 'run-google-analytics-mcp.sh');

class McpClient {
  constructor() {
    this.proc = null;
    this.rl = null;
    this.requestId = 1;
    this.pending = new Map();
  }

  async connect(allowWrite = false) {
    const args = allowWrite ? ['--allow-write'] : [];
    this.proc = spawn(runnerScript, args, {
      cwd: projectRoot,
      stdio: ['pipe', 'pipe', 'inherit'],
      env: process.env,
    });

    this.rl = readline.createInterface({
      input: this.proc.stdout,
      crlfDelay: Infinity,
    });

    this.rl.on('line', (line) => {
      try {
        const msg = JSON.parse(line);
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) {
            reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          } else {
            resolve(msg.result);
          }
        }
      } catch (err) {
        // Non-JSON line or log output
      }
    });

    // Initialize MCP handshake
    await this.call('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'sakina-query-client', version: '1.0.0' },
    });

    // Send initialized notification
    this.notify('notifications/initialized', {});
  }

  call(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      this.pending.set(id, { resolve, reject });
      const payload = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
      this.proc.stdin.write(payload);
    });
  }

  notify(method, params = {}) {
    const payload = JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n';
    this.proc.stdin.write(payload);
  }

  async callTool(name, args = {}) {
    return this.call('tools/call', { name, arguments: args });
  }

  async listTools() {
    return this.call('tools/list', {});
  }

  close() {
    if (this.rl) this.rl.close();
    if (this.proc) this.proc.kill();
  }
}

async function main() {
  const [command = 'help', ...args] = process.argv.slice(2);
  const client = new McpClient();

  try {
    await client.connect();

    switch (command) {
      case 'tools': {
        const result = await client.listTools();
        console.log('\nAvailable Google Analytics MCP Tools:');
        console.log('------------------------------------');
        for (const t of result.tools || []) {
          console.log(`• ${t.name}: ${t.description.split('\n')[0]}`);
        }
        console.log();
        break;
      }

      case 'accounts': {
        console.log('\nFetching account summaries...');
        const result = await client.callTool('get_account_summaries', {});
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'property': {
        const propertyId = args[0] || process.env.GA4_PROPERTY_ID;
        if (!propertyId) {
          console.error('Error: Property ID required. Usage: node query-google-analytics.mjs property <propertyId>');
          process.exitCode = 1;
          break;
        }
        console.log(`\nFetching property details for: ${propertyId}`);
        const result = await client.callTool('get_property_details', {
          property_id: propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`,
        });
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'report': {
        const propertyId = args[0] || process.env.GA4_PROPERTY_ID;
        if (!propertyId) {
          console.error('Error: Property ID required. Usage: node query-google-analytics.mjs report <propertyId> [metrics] [dimensions]');
          process.exitCode = 1;
          break;
        }

        const metrics = (args[1] || 'activeUsers,screenPageViews,sessions')
          .split(',')
          .map((m) => ({ name: m.trim() }));
        const dimensions = (args[2] || 'pagePath,country')
          .split(',')
          .map((d) => ({ name: d.trim() }));

        console.log(`\nRunning core report for: ${propertyId}`);
        const result = await client.callTool('run_report', {
          property_id: propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`,
          date_ranges: [{ start_date: '30daysAgo', end_date: 'today' }],
          metrics,
          dimensions,
          limit: 25,
        });
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'realtime': {
        const propertyId = args[0] || process.env.GA4_PROPERTY_ID;
        if (!propertyId) {
          console.error('Error: Property ID required. Usage: node query-google-analytics.mjs realtime <propertyId> [metrics]');
          process.exitCode = 1;
          break;
        }

        const metrics = (args[1] || 'activeUsers')
          .split(',')
          .map((m) => ({ name: m.trim() }));

        console.log(`\nRunning realtime report for: ${propertyId}`);
        const result = await client.callTool('run_realtime_report', {
          property_id: propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`,
          metrics,
        });
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'help':
      default:
        console.log(`
Sakina - Google Analytics MCP CLI Client
=======================================
Usage:
  node scripts/query-google-analytics.mjs tools
  node scripts/query-google-analytics.mjs accounts
  node scripts/query-google-analytics.mjs property <propertyId>
  node scripts/query-google-analytics.mjs report <propertyId> [metrics] [dimensions]
  node scripts/query-google-analytics.mjs realtime <propertyId> [metrics]

Examples:
  npm run ga:tools
  npm run ga:accounts
  node scripts/query-google-analytics.mjs report 12345678 activeUsers,sessions pagePath
`);
        break;
    }
  } catch (err) {
    console.error('MCP Error:', err.message);
    process.exitCode = 1;
  } finally {
    client.close();
  }
}

main();
