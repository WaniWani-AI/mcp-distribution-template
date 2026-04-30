import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import "dotenv/config";
import express from "express";
import { server } from "../server/src/app.js";

const app = express();
app.use(express.json());

app.post("/mcp", async (req, res, next) => {
	try {
		const transport = new StreamableHTTPServerTransport({
			sessionIdGenerator: undefined,

		});

		res.on("close", () => {
			transport.close();
		});
		req.url = req.originalUrl;

		await server.connect(transport);
		await transport.handleRequest(req, res, req.body);
	} catch (error) {
		console.error("Error handling MCP request:", error);
		next(error);
	}
});

app.use("/mcp", ((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
	console.error("Error handling MCP request:", err);
	if (!res.headersSent) {
		res.status(500).json({
			jsonrpc: "2.0",
			error: { code: -32603, message: err instanceof Error ? err.message : "Internal server error" },
			id: null,
		});
	}
}) satisfies express.ErrorRequestHandler);

export default app;
