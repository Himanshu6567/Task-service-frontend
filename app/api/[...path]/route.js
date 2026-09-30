const BACKEND_URL =
  process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

async function proxy(request, context) {
  if (!BACKEND_URL) {
    return Response.json(
      { msg: "Set BACKEND_URL to the deployed Express API URL" },
      { status: 500 },
    );
  }

  const { path } = await context.params;
  const route = path.join("/");
  const backendPath =
    route === "initialService" || route === "Feedbacks"
      ? `${route}/`
      : route;
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

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method)
      ? undefined
      : await request.arrayBuffer(),
    cache: "no-store",
  });
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
