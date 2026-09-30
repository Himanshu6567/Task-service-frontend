import mongoose from "../../Server/node_modules/mongoose/index.js";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), "../Server/.env") });

let connectionPromise;

export async function connectDatabase() {
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.mongooseConnectionString);
  }
  return connectionPromise;
}

export function createResponse() {
  let statusCode = 200;
  let payload;
  const cookies = [];

  return {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      payload = data;
      return this;
    },
    cookie(name, value, options = {}) {
      const attributes = [
        "Path=/",
        "HttpOnly",
        "SameSite=Strict",
        process.env.NODE_ENV === "production" ? "Secure" : "",
        options.maxAge === 0
          ? "Max-Age=0"
          : options.maxAge
            ? `Max-Age=${options.maxAge}`
            : "",
      ].filter(Boolean);
      cookies.push(`${name}=${value}; ${attributes.join("; ")}`);
      return this;
    },
    getResult() {
      return { statusCode, payload, cookies };
    },
  };
}

export function createRequest(request, body, params = {}, file) {
  const headers = Object.fromEntries(request.headers.entries());
  const token = request.headers
    .get("cookie")
    ?.match(/(?:^|;\s*)token=([^;]+)/)?.[1];
  if (token && !headers.authorization)
    headers.authorization = `Bearer ${token}`;
  const query = Object.fromEntries(new URL(request.url).searchParams.entries());
  return {
    body,
    file,
    params,
    query,
    headers,
    header(name) {
      return headers[name.toLowerCase()];
    },
  };
}

export async function parseRequestBody(request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const body = {};
    let file;

    for (const [key, value] of form.entries()) {
      if (typeof value === "string") {
        body[key] = value;
      } else if (value && value.size > 0) {
        const tempPath = path.join(os.tmpdir(), `${Date.now()}-${value.name}`);
        await fs.writeFile(tempPath, Buffer.from(await value.arrayBuffer()));
        file = {
          path: tempPath,
          originalname: value.name,
          mimetype: value.type,
        };
      }
    }

    return { body, file };
  }

  if (request.method === "GET" || request.method === "DELETE") {
    return { body: {} };
  }

  return { body: await request.json() };
}

export async function sendController(controller, request, body, params, file) {
  const req = createRequest(request, body, params, file);
  const res = createResponse();
  await controller(req, res);
  const result = res.getResult();
  const response = Response.json(result.payload ?? {}, {
    status: result.statusCode,
  });
  if (result.cookies.length) {
    result.cookies.forEach((cookie) =>
      response.headers.append("Set-Cookie", cookie),
    );
  }
  return response;
}
