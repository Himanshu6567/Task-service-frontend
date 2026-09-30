import http from "node:http";
import path from "node:path";
import next from "next";
import express from "express";
import dotenv from "dotenv";
import { initializeSocket } from "../Server/socket.js";

dotenv.config({ path: path.resolve(process.cwd(), "../Server/.env") });

const dev = process.argv[2] === "dev";
const hostname = process.env.HOSTNAME || "localhost";
const port = Number(process.env.NEXT_PORT || 3000);
const nextApp = next({ dev, hostname, port });
const handle = nextApp.getRequestHandler();

await nextApp.prepare();

const expressApp = express();
const server = http.createServer(expressApp);
initializeSocket(server);

expressApp.use((request, response) => handle(request, response));

server.listen(port, hostname, () => {
  console.log(`Next.js server running at http://${hostname}:${port}`);
});
