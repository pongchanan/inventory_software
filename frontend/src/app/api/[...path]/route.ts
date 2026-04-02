import { NextRequest, NextResponse } from "next/server";

/**
 * Catch-all API proxy route.
 * Forwards /api/* requests to the backend using BACKEND_URL at runtime.
 *
 * BACKEND_URL (no NEXT_PUBLIC_ prefix) is read from process.env at RUNTIME,
 * so it picks up the Railway internal hostname correctly.
 */

function getBackendUrl(): string {
  const envBackendUrl = process.env.BACKEND_URL?.trim();
  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const url = envBackendUrl || publicApiUrl || "http://localhost:3000";
  return url.replace(/\/+$/, "");
}

async function proxyRequest(req: NextRequest, _path: string) {
  try {
    const base = getBackendUrl();
    // Use the original pathname to preserve trailing slashes
    // (Next.js [..path] segments strip trailing slashes)
    const apiPath = req.nextUrl.pathname.replace(/^\/api\//, "");
    const targetUrl = `${base}/api/${apiPath}`;
    const url = new URL(targetUrl);

    // Forward query params
    req.nextUrl.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    const headers: Record<string, string> = {};
    const contentType = req.headers.get("Content-Type");
    if (contentType) headers["Content-Type"] = contentType;
    const authorization = req.headers.get("Authorization");
    if (authorization) headers["Authorization"] = authorization;

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    // Forward body for POST/PUT/PATCH
    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      fetchOptions.body = await req.text();
    }

    console.log(`[proxy] ${req.method} ${url.toString()}`);

    const res = await fetch(url.toString(), fetchOptions);
    const data = await res.text();

    return new NextResponse(data, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (error) {
    const backendUrl = process.env.BACKEND_URL ?? "(not set)";
    console.error(`[proxy] ERROR → BACKEND_URL=${backendUrl}`, error);
    return NextResponse.json(
      { error: "Backend unavailable", detail: String(error) },
      { status: 502 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, path.join("/"));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, path.join("/"));
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, path.join("/"));
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, path.join("/"));
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, path.join("/"));
}
