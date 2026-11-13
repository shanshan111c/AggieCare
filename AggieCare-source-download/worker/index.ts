/** Cloudflare Worker entry point. The public app has no invite-code gate. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Only anonymous daily counts are stored. No query text, IP, user ID, or location.
    if (url.pathname === "/api/analytics") {
      if (request.method !== "POST") return new Response(null, { status: 405 });
      const body = await request.json().catch(() => null) as { kind?: unknown; target?: unknown } | null;
      const kind = body?.kind;
      const target = body?.target;
      const allowedClicks = ["navigation", "resource_call", "resource_directions", "resource_official", "map", "category", "install", "settings", "external", "other"];
      if ((kind !== "search" && kind !== "click") || typeof target !== "string" || (kind === "search" ? target !== "submitted" : !allowedClicks.includes(target))) {
        return new Response(null, { status: 400 });
      }
      const day = new Date().toISOString().slice(0, 10);
      ctx.waitUntil(recordAnalytics(env.DB, day, kind, target));
      return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;

async function recordAnalytics(db: D1Database, day: string, kind: "search" | "click", target: string): Promise<void> {
  try {
    await db.prepare("INSERT INTO usage_daily (day, kind, target, count) VALUES (?, ?, ?, 1) ON CONFLICT(day, kind, target) DO UPDATE SET count = count + 1").bind(day, kind, target).run();
  } catch (error) {
    console.error("Anonymous usage count failed", error);
  }
}
