import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { IsoPacker } from "./isoPacker.js";
import axios from 'axios';

/**
 * Model Context Protocol (MCP) Server for ISO 8583 Simulator
 * Exposes core packing/unpacking and transaction simulation tools to AI assistants.
 */

// Initialize MCP Server
const server = new Server(
  {
    name: "iso-8583-simulator",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define the available tools for the AI Assistant
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "pack_iso_message",
        description: "Packs a JSON object into a raw ISO 8583 hex string using the jPOS v2003 CMF dictionary.",
        inputSchema: {
          type: "object",
          properties: {
            mti: { type: "string", description: "4-digit Message Type Identifier (e.g., '0100')" },
            elements: { 
              type: "object", 
              description: "Key-value pairs of ISO Data Elements. Keys must be 3-digit strings (e.g., '002': '1234567890123456', '004': '000000010000')",
              additionalProperties: { type: "string" }
            }
          },
          required: ["mti", "elements"],
        },
      },
      {
        name: "unpack_iso_message",
        description: "Unpacks a raw ISO 8583 hexadecimal string into a parsed JSON object containing the MTI and Data Elements.",
        inputSchema: {
          type: "object",
          properties: {
            hexString: { type: "string", description: "Raw ISO 8583 hex string including MTI and Bitmap." }
          },
          required: ["hexString"],
        },
      },
      {
        name: "trigger_transaction",
        description: "Triggers a live transaction through the running local simulator backend (must be running on port 3002). Returns the raw response and parsed fields.",
        inputSchema: {
          type: "object",
          properties: {
            mti: { type: "string" },
            elements: { type: "object", additionalProperties: { type: "string" } }
          },
          required: ["mti", "elements"],
        },
      }
    ],
  };
});

// Execute the requested tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "pack_iso_message") {
      // Normalize element keys to strings without leading zeros for the IsoPacker if needed
      const normalizedElements = {};
      for (const [k, v] of Object.entries(args.elements)) {
         normalizedElements[parseInt(k, 10).toString()] = v;
      }
      
      const buffer = IsoPacker.pack({ mti: args.mti, elements: normalizedElements });
      return {
        content: [{ type: "text", text: buffer.toString('hex').toUpperCase() }],
      };
    } 
    
    if (name === "unpack_iso_message") {
      const parsed = IsoPacker.unpack(args.hexString);
      return {
        content: [{ type: "text", text: JSON.stringify(parsed, null, 2) }],
      };
    }

    if (name === "trigger_transaction") {
      try {
        const response = await axios.post('http://127.0.0.1:3002/api/v1/transactions', {
          mti: args.mti,
          elements: args.elements
        });
        return {
          content: [{ type: "text", text: JSON.stringify(response.data, null, 2) }],
        };
      } catch (error) {
         return {
          isError: true,
          content: [{ type: "text", text: `API Request Failed: ${error.message} - Ensure backend is running on 3002.` }],
        };
      }
    }

    throw new Error(`Unknown MCP tool requested: ${name}`);
  } catch (error) {
    return {
      isError: true,
      content: [{ type: "text", text: error.message }],
    };
  }
});

// Start the Stdio Transport Server
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ISO-8583 Simulator MCP Server running on stdio transport.");
}

run().catch((error) => {
  console.error("Fatal MCP Server Error:", error);
  process.exit(1);
});
