import { randomUUID } from "node:crypto";

const BACKEND_URL =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

export const runtime = "nodejs";
export const maxDuration = 120;

async function proxy(request, context) {
  if (!BACKEND_URL) {
    return Response.json(
      { msg: "Set BACKEND_URL to the deployed Express API URL" },
      { status: 500 },
    );
  }

  const { path } = await context.params;
  const route = path.join("/");
  const requestId = request.headers.get("x-request-id") || randomUUID();
  const isOtpRequest = route.startsWith("signup/");
  const isOtpSend = route === "signup/send-otp" && request.method === "POST";
  const backendPath =
    route === "initialService" || route === "Feedbacks" ? `${route}/` : route;
  const sourceUrl = new URL(request.url);
  const target = new URL(
    `${backendPath}${sourceUrl.search}`,
    `${BACKEND_URL.replace(/\/+$/, "")}/`,
  );
  const headers = new Headers();

  for (const name of ["authorization", "cookie", "content-type"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("x-request-id", requestId);
  const token = request.headers
    .get("cookie")
    ?.match(/(?:^|;\s*)token=([^;]+)/)?.[1];
  if (token && !headers.has("authorization")) {
    headers.set("authorization", `Bearer ${decodeURIComponent(token)}`);
  }

  let upstream;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method)
        ? undefined
        : await request.arrayBuffer(),
      cache: "no-store",
      signal: AbortSignal.timeout(isOtpSend ? 110000 : 65000),
    });
  } catch (error) {
    const timedOut = error?.name === "TimeoutError";
    console.error(
      "[api-proxy] upstream request failed",
      JSON.stringify({
        requestId,
        route,
        method: request.method,
        timedOut,
        error: error.message,
      }),
    );
    return Response.json(
      {
        msg: timedOut
          ? isOtpSend
            ? "The backend timed out while generating or emailing the OTP. Check the Render logs for this request ID."
            : "The backend took too long to respond. Please try again."
          : "Unable to reach the backend. Check that the API is running and BACKEND_URL is correct.",
        requestId,
      },
      {
        status: timedOut ? 504 : 502,
        headers: { "x-request-id": requestId },
      },
    );
  }

  if (isOtpRequest) {
    console.info(
      "[api-proxy] OTP request completed",
      JSON.stringify({ requestId, route, status: upstream.status }),
    );
  }
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.set("x-request-id", requestId);

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
