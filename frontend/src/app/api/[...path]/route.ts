import { NextRequest, NextResponse } from "next/server";

/**
 * Catch-all API proxy route: /api/[...path]
 *
 * Forwards all /api/* requests to the backend at runtime using BACKEND_URL.
 *
 * Why NOT next.config.ts rewrites?
 *   next.config.ts with `output: "standalone"` evaluates rewrites at BUILD TIME.
 *   BACKEND_URL is a Railway runtime variable — not available during build —
 *   so it would resolve to undefined/localhost and fail with ECONNREFUSED.
 *
 * Why NOT NEXT_PUBLIC_BACKEND_URL?
 *   NEXT_PUBLIC_* vars are also inlined at build time, same problem.
 *
 * This route handler reads process.env.BACKEND_URL at REQUEST TIME (runtime),
 * so it correctly picks up the Railway internal hostname every time.
 *
 * Flow:
 *   Browser → https://frontend.railway.app/api/**
 *     → this handler (Next.js server, inside Railway private network)
 *       → http://inventorysoftware-backend.railway.internal:PORT/api/**
 */

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
        return NextResponse.json(
            { error: "Backend unavailable", detail: String(error) },
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
