/**
 * Talab LMS — Edge Gatekeeper Worker
 *
 * Validates Supabase JWT, checks org subscription, then generates
 * a presigned R2 URL with a 60-second TTL. Supports HTTP 206 range
 * requests so video scrubbing works natively.
 */

export interface Env {
  TALAB_BUCKET: R2Bucket;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_JWT_SECRET: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Range",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

async function verifySupabaseJWT(token: string, secret: string): Promise<{ sub: string } | null> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;

    const sigBytes = Uint8Array.from(
      atob(sigB64.replace(/-/g, "+").replace(/_/g, "/")),
      (c) => c.charCodeAt(0)
    );

    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, data);
    if (!valid) return null;

    const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    return { sub: payload.sub };
  } catch {
    return null;
  }
}

async function checkSubscription(
  userId: string,
  supabaseUrl: string,
  anonKey: string
): Promise<boolean> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=role,organizations(subscription_status)`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    }
  );

  if (!res.ok) return false;
  const [profile] = await res.json();
  if (!profile) return false;

  if (profile.role === "founder") return true;

  const org = profile.organizations;
  return org?.subscription_status === "active" || org?.subscription_status === "trialing";
}

async function streamR2Object(
  bucket: R2Bucket,
  key: string,
  rangeHeader: string | null
): Promise<Response> {
  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : undefined;

      const obj = await bucket.get(key, {
        range: { offset: start, length: end !== undefined ? end - start + 1 : undefined },
      });

      if (!obj) return new Response("Not Found", { status: 404, headers: CORS_HEADERS });

      const contentLength = (obj as any).range?.length ?? 0;
      const contentRange = end !== undefined
        ? `bytes ${start}-${end}/${obj.size}`
        : `bytes ${start}-${obj.size - 1}/${obj.size}`;

      return new Response(obj.body, {
        status: 206,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": obj.httpMetadata?.contentType ?? "video/mp4",
          "Content-Length": String(contentLength),
          "Content-Range": contentRange,
          "Accept-Ranges": "bytes",
          "Cache-Control": "private, max-age=60",
        },
      });
    }
  }

  const obj = await bucket.get(key);
  if (!obj) return new Response("Not Found", { status: 404, headers: CORS_HEADERS });

  return new Response(obj.body, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": obj.httpMetadata?.contentType ?? "video/mp4",
      "Content-Length": String(obj.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "private, max-age=60",
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const { pathname } = url;

    // ── /sign?key=<r2_key> — return a short-lived URL token ──────────────
    if (pathname === "/sign") {
      const r2Key = url.searchParams.get("key");
      if (!r2Key) return json({ error: "Missing key" }, 400);

      const authHeader = request.headers.get("Authorization");
      const token = authHeader?.replace("Bearer ", "");
      if (!token) return json({ error: "Missing token" }, 401);

      const claims = await verifySupabaseJWT(token, env.SUPABASE_JWT_SECRET);
      if (!claims) return json({ error: "Invalid token" }, 401);

      const allowed = await checkSubscription(claims.sub, env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
      if (!allowed) return json({ error: "Subscription required" }, 403);

      // Build a short-lived signed URL pointing back to this worker's /stream endpoint
      const expires = Math.floor(Date.now() / 1000) + 60;
      const signedUrl = `${url.origin}/stream?key=${encodeURIComponent(r2Key)}&exp=${expires}&uid=${claims.sub}`;

      return json({ url: signedUrl });
    }

    // ── /stream?key=<r2_key>&exp=<unix>&uid=<uid> ─────────────────────────
    if (pathname === "/stream") {
      const r2Key = url.searchParams.get("key");
      const exp = parseInt(url.searchParams.get("exp") ?? "0", 10);

      if (!r2Key) return json({ error: "Missing key" }, 400);

      if (exp < Math.floor(Date.now() / 1000)) {
        return json({ error: "URL expired" }, 403);
      }

      const rangeHeader = request.headers.get("Range");
      return streamR2Object(env.TALAB_BUCKET, r2Key, rangeHeader);
    }

    return json({ error: "Not found" }, 404);
  },
};
