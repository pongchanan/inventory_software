import { NextRequest, NextResponse } from "next/server";
import dns from "node:dns";

/**
 * Catch-all API proxy route: /api/[...path]
 *
 * Forwards all /api/* requests to the backend at runtime using BACKEND_URL.
 *
 * Railway internal networking (.railway.internal) resolves to IPv6 addresses.
 * Node.js fetch (undici) defaults to IPv4 → ECONNREFUSED.
 * Fix: force Node.js to prefer IPv6 for DNS resolution.
 */
dns.setDefaultResultOrder("verbatim");

function getBackendUrl(): string {
    const url = process.env.BACKEND_URL ?? "http://127.0.0.1:3000";
    return url.replace(/\/+$/, ""); // strip trailing slash
}

async function proxyRequest(req: NextRequest, path: string[]): Promise<NextResponse> {
    try {
        const base = getBackendUrl();
        const targetUrl = new URL(`${base}/api/${path.join("/")}`);

        // Forward query params
        req.nextUrl.searchParams.forEach((value, key) => {
            targetUrl.searchParams.set(key, value);
        });

        // Forward relevant request headers (auth token, content-type, etc.)
        const forwardHeaders: Record<string, string> = {
            "Content-Type": req.headers.get("Content-Type") ?? "application/json",
        };
        const authorization = req.headers.get("Authorization");
        if (authorization) forwardHeaders["Authorization"] = authorization;

        const fetchOptions: RequestInit = {
            method: req.method,
            headers: forwardHeaders,
        };

        if (["POST", "PUT", "PATCH"].includes(req.method)) {
            fetchOptions.body = await req.text();
        }

        console.log(`[proxy] ${req.method} ${targetUrl.toString()}`);

        const res = await fetch(targetUrl.toString(), fetchOptions);
        const data = await res.text();

        return new NextResponse(data, {
            status: res.status,
            headers: {
                "Content-Type": res.headers.get("Content-Type") ?? "application/json",
            },
        });
    } catch (error) {
        const backendUrl = process.env.BACKEND_URL ?? "(not set)";
        console.error(`[proxy] FAILED → BACKEND_URL=${backendUrl}`, error);
        const detail = error instanceof Error
            ? `${error.message}${error.cause ? ` | cause: ${JSON.stringify(error.cause)}` : ""}`
            : String(error);
        return NextResponse.json(
            { error: "Backend unavailable", detail, backendUrl },
            { status: 502 }
        );
    }
}

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
    const { path } = await ctx.params;
    return proxyRequest(req, path);
}

export async function POST(req: NextRequest, ctx: RouteContext) {
    const { path } = await ctx.params;
    return proxyRequest(req, path);
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
    const { path } = await ctx.params;
    return proxyRequest(req, path);
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
    const { path } = await ctx.params;
    return proxyRequest(req, path);
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
    const { path } = await ctx.params;
    return proxyRequest(req, path);
}
