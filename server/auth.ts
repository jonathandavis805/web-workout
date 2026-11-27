import type { Env } from "./env";

const SESSION_COOKIE = "session";
const STATE_COOKIE = "oauth_state";
const SESSION_SECONDS = 60 * 60 * 24 * 30;

export interface User {
  id: number;
  email: string;
  name: string;
}

const toHex = (bytes: Uint8Array) => [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");

export function randomToken(bytes = 32): string {
  return toHex(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function sha256(value: string): Promise<string> {
  return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))));
}

function getCookie(request: Request, name: string): string | null {
  for (const part of (request.headers.get("Cookie") ?? "").split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

function cookie(request: Request, name: string, value: string, maxAge: number): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function redirect(location: string, cookies: string[]): Response {
  const headers = new Headers({ Location: location });
  for (const c of cookies) headers.append("Set-Cookie", c);
  return new Response(null, { status: 302, headers });
}

const redirectUri = (request: Request) => new URL("/authorize", request.url).toString();

export async function getSessionUser(request: Request, env: Env): Promise<User | null> {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;
  return env.DB.prepare(
    `SELECT user.id, user.email, user.name FROM session JOIN user ON user.id = session.user_id
     WHERE session.token_hash = ? AND session.expires_at > ?`,
  )
    .bind(await sha256(token), new Date().toISOString())
    .first<User>();
}

export function login(request: Request, env: Env): Response {
  const state = randomToken(16);
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(request),
    response_type: "code",
    scope: "openid email profile",
    state,
  });
  return redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`, [
    cookie(request, STATE_COOKIE, state, 600),
  ]);
}

export async function authorize(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state || state !== getCookie(request, STATE_COOKIE)) {
    return new Response("Authentication failed", { status: 400 });
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri(request),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenResponse.ok) return new Response("Authentication failed", { status: 400 });
  const { access_token } = await tokenResponse.json<{ access_token: string }>();

  const infoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!infoResponse.ok) return new Response("Authentication failed", { status: 400 });
  const info = await infoResponse.json<{ sub: string; email: string; name?: string }>();

  const user =
    (await env.DB.prepare("SELECT id FROM user WHERE oauth_provider = 'google' AND oauth_id = ?")
      .bind(info.sub)
      .first<{ id: number }>()) ??
    (await env.DB.prepare(
      "INSERT INTO user (email, name, oauth_provider, oauth_id) VALUES (?, ?, 'google', ?) RETURNING id",
    )
      .bind(info.email, info.name ?? info.email, info.sub)
      .first<{ id: number }>());
  if (!user) return new Response("Authentication failed", { status: 400 });

  const token = randomToken();
  const now = new Date();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM session WHERE expires_at < ?").bind(now.toISOString()),
    env.DB.prepare("INSERT INTO session (token_hash, user_id, expires_at) VALUES (?, ?, ?)").bind(
      await sha256(token),
      user.id,
      new Date(now.getTime() + SESSION_SECONDS * 1000).toISOString(),
    ),
  ]);
  return redirect("/", [cookie(request, SESSION_COOKIE, token, SESSION_SECONDS), cookie(request, STATE_COOKIE, "", 0)]);
}

export async function logout(request: Request, env: Env): Promise<Response> {
  const token = getCookie(request, SESSION_COOKIE);
  if (token) await env.DB.prepare("DELETE FROM session WHERE token_hash = ?").bind(await sha256(token)).run();
  return redirect("/", [cookie(request, SESSION_COOKIE, "", 0)]);
}
