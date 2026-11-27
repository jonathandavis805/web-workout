import { getSessionUser, randomToken, sha256, type User } from "./auth";
import type { Env } from "./env";

const PAGE_LEN = 5;
const PAIR_CODE_TTL_SECONDS = 600;
const PAIR_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

interface Ctx {
  request: Request;
  env: Env;
  url: URL;
  params: string[];
}
type Handler = (ctx: Ctx) => Promise<Response>;

interface WorkoutRow {
  id: number;
  name: string;
  spotify_url: string | null;
  circuits: number | null;
  is_public: number | null;
}
interface ExerciseRow {
  id: number;
  workout_id: number;
  name: string;
  duration: number;
  order: number;
}
interface WorkoutInput {
  name?: string;
  spotifyUrl?: string | null;
  circuits?: number | null;
  isPublic?: boolean;
  exercises?: { name?: string; duration?: number }[];
}
interface TvDeviceRow {
  id: number;
  name: string | null;
  user_id: number | null;
  pair_expires_at: string | null;
  paired_at: string | null;
}

const json = (data: unknown, status = 200) => Response.json(data, { status });
const error = (message: string, status: number) => json({ error: message }, status);
const nowIso = () => new Date().toISOString();
const readJson = <T>(request: Request) => request.json<T>().catch(() => null);

function withUser(handler: (ctx: Ctx, user: User) => Promise<Response>): Handler {
  return async (ctx) => {
    const user = await getSessionUser(ctx.request, ctx.env);
    return user ? handler(ctx, user) : error("Not signed in", 401);
  };
}

function withTv(handler: (ctx: Ctx, device: TvDeviceRow) => Promise<Response>): Handler {
  return async (ctx) => {
    const token = (ctx.request.headers.get("Authorization") ?? "").replace(/^Bearer /, "").trim();
    const device = token
      ? await ctx.env.DB.prepare(
          "SELECT id, name, user_id, pair_expires_at, paired_at FROM tv_device WHERE token_hash = ?",
        )
          .bind(await sha256(token))
          .first<TvDeviceRow>()
      : null;
    return device ? handler(ctx, device) : error("Unknown device", 401);
  };
}

function withPairedTv(handler: (ctx: Ctx, userId: number) => Promise<Response>): Handler {
  return withTv(async (ctx, device) =>
    device.user_id ? handler(ctx, device.user_id) : error("Device not paired", 403),
  );
}

async function loadWorkouts(env: Env, where: string, ...binds: unknown[]) {
  const { results: workouts } = await env.DB.prepare(
    `SELECT id, name, spotify_url, circuits, is_public FROM workout WHERE ${where}`,
  )
    .bind(...binds)
    .all<WorkoutRow>();
  if (workouts.length === 0) return [];

  const ids = workouts.map((w) => w.id);
  const { results: exercises } = await env.DB.prepare(
    `SELECT id, workout_id, name, duration, "order" FROM exercise
     WHERE workout_id IN (${ids.map(() => "?").join(",")}) ORDER BY "order", id`,
  )
    .bind(...ids)
    .all<ExerciseRow>();

  return workouts.map((w) => ({
    id: w.id,
    name: w.name,
    spotifyUrl: w.spotify_url,
    exercises: exercises
      .filter((e) => e.workout_id === w.id)
      .map(({ id, name, duration, order }) => ({ id, name, duration, order })),
    circuits: w.circuits,
    isPublic: w.is_public === null ? null : Boolean(w.is_public),
  }));
}

async function loadWorkout(env: Env, id: number, userId: number) {
  const [workout] = await loadWorkouts(env, "id = ? AND user_id = ?", id, userId);
  return workout ?? null;
}

function insertExercises(env: Env, workoutId: number, data: WorkoutInput) {
  return (data.exercises ?? []).map((ex, index) =>
    env.DB.prepare('INSERT INTO exercise (workout_id, name, duration, "order") VALUES (?, ?, ?, ?)').bind(
      workoutId,
      ex.name ?? "Exercise",
      ex.duration ?? 30,
      index,
    ),
  );
}

async function recordCompletion(env: Env, userId: number, workoutId: number, durationSeconds?: number) {
  const workout = await loadWorkout(env, workoutId, userId);
  if (!workout) return error("Not found", 404);
  const total = workout.exercises.reduce((sum, ex) => sum + ex.duration, 0) * (workout.circuits || 1);
  const completion = await env.DB.prepare(
    `INSERT INTO workout_completion (user_id, workout_id, completed_at, duration_seconds)
     VALUES (?, ?, ?, ?) RETURNING id, workout_id, completed_at, duration_seconds`,
  )
    .bind(userId, workoutId, nowIso(), durationSeconds ?? total)
    .first();
  return json({ ...completion, workout_name: workout.name }, 201);
}

const tvDeviceDict = (d: { id: number; name: string | null; paired_at: string | null }) => ({
  id: d.id,
  name: d.name,
  pairedAt: d.paired_at,
});

const routes: [string, RegExp, Handler][] = [
  ["GET", /^\/api\/user$/, withUser(async (_ctx, user) => json(user))],

  [
    "GET",
    /^\/api\/workouts$/,
    withUser(async ({ env }, user) => json(await loadWorkouts(env, `user_id = ? ORDER BY id LIMIT ${PAGE_LEN}`, user.id))),
  ],

  [
    "GET",
    /^\/api\/public\/workouts$/,
    withUser(async ({ env, url }) => {
      const page = Number.parseInt(url.searchParams.get("page") ?? "0", 10) || 0;
      return json(await loadWorkouts(env, "is_public = 1 ORDER BY id LIMIT ? OFFSET ?", PAGE_LEN, page * PAGE_LEN));
    }),
  ],

  [
    "GET",
    /^\/api\/workouts\/(\d+)$/,
    withUser(async ({ env, params }, user) => {
      const workout = await loadWorkout(env, Number(params[0]), user.id);
      return workout ? json(workout) : error("Not found", 404);
    }),
  ],

  [
    "POST",
    /^\/api\/workouts$/,
    withUser(async ({ env, request }, user) => {
      const data = await readJson<WorkoutInput>(request);
      if (!data?.name) return error("Name is required", 400);
      const created = await env.DB.prepare(
        "INSERT INTO workout (user_id, name, spotify_url, circuits, is_public) VALUES (?, ?, ?, ?, ?) RETURNING id",
      )
        .bind(user.id, data.name, data.spotifyUrl ?? null, data.circuits ?? null, data.isPublic ? 1 : 0)
        .first<{ id: number }>();
      if (!created) return error("Could not create workout", 500);
      const inserts = insertExercises(env, created.id, data);
      if (inserts.length) await env.DB.batch(inserts);
      return json(await loadWorkout(env, created.id, user.id), 201);
    }),
  ],

  [
    "PUT",
    /^\/api\/workouts\/(\d+)$/,
    withUser(async ({ env, request, params }, user) => {
      const id = Number(params[0]);
      if (!(await loadWorkout(env, id, user.id))) return error("Not found", 404);
      const data = await readJson<WorkoutInput>(request);
      if (!data?.name) return error("Name is required", 400);
      await env.DB.batch([
        env.DB.prepare("UPDATE workout SET name = ?, spotify_url = ?, circuits = ?, is_public = ? WHERE id = ?").bind(
          data.name,
          data.spotifyUrl ?? null,
          data.circuits ?? null,
          data.isPublic ? 1 : 0,
          id,
        ),
        env.DB.prepare("DELETE FROM exercise WHERE workout_id = ?").bind(id),
        ...insertExercises(env, id, data),
      ]);
      return json(await loadWorkout(env, id, user.id));
    }),
  ],

  [
    "DELETE",
    /^\/api\/workouts\/(\d+)$/,
    withUser(async ({ env, params }, user) => {
      const result = await env.DB.prepare("DELETE FROM workout WHERE id = ? AND user_id = ?")
        .bind(Number(params[0]), user.id)
        .run();
      return result.meta.changes ? json({ message: "Workout deleted" }) : error("Not found", 404);
    }),
  ],

  [
    "POST",
    /^\/api\/workouts\/(\d+)\/complete$/,
    withUser(async ({ env, request, params }, user) => {
      const data = await readJson<{ duration_seconds?: number }>(request);
      return recordCompletion(env, user.id, Number(params[0]), data?.duration_seconds);
    }),
  ],

  [
    "GET",
    /^\/api\/workout-completions$/,
    withUser(async ({ env }, user) => {
      const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      const { results } = await env.DB.prepare(
        `SELECT c.id, c.workout_id, c.completed_at, c.duration_seconds, w.name AS workout_name
         FROM workout_completion c LEFT JOIN workout w ON w.id = c.workout_id
         WHERE c.user_id = ? AND c.completed_at >= ? ORDER BY c.completed_at DESC`,
      )
        .bind(user.id, since)
        .all();
      return json(results);
    }),
  ],

  // TV pairing: the TV gets a short code plus a secret token, the user enters the
  // code on the website, and from then on the TV authenticates with the token.
  [
    "POST",
    /^\/api\/tv\/pair\/start$/,
    async ({ env, request }) => {
      const now = new Date();
      await env.DB.prepare("DELETE FROM tv_device WHERE user_id IS NULL AND pair_expires_at < ?")
        .bind(now.toISOString())
        .run();

      const newCode = () =>
        Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => PAIR_CODE_ALPHABET[b % PAIR_CODE_ALPHABET.length]).join("");
      let code = newCode();
      while (await env.DB.prepare("SELECT 1 FROM tv_device WHERE pair_code = ?").bind(code).first()) code = newCode();

      const token = randomToken();
      const data = await readJson<{ name?: string }>(request);
      await env.DB.prepare(
        "INSERT INTO tv_device (name, token_hash, pair_code, pair_expires_at) VALUES (?, ?, ?, ?)",
      )
        .bind(
          data?.name?.slice(0, 100) || null,
          await sha256(token),
          code,
          new Date(now.getTime() + PAIR_CODE_TTL_SECONDS * 1000).toISOString(),
        )
        .run();
      return json({ code, token, expiresIn: PAIR_CODE_TTL_SECONDS }, 201);
    },
  ],

  [
    "GET",
    /^\/api\/tv\/pair\/status$/,
    withTv(async (_ctx, device) => {
      const paired = device.user_id !== null;
      const expired = !paired && (device.pair_expires_at ?? "") < nowIso();
      return json({ paired, expired });
    }),
  ],

  [
    "POST",
    /^\/api\/tv\/pair\/claim$/,
    withUser(async ({ env, request }, user) => {
      const data = await readJson<{ code?: string }>(request);
      const code = String(data?.code ?? "").trim().toUpperCase();
      const now = nowIso();
      const device = code
        ? await env.DB.prepare(
            `UPDATE tv_device SET user_id = ?, paired_at = ?, pair_code = NULL
             WHERE pair_code = ? AND user_id IS NULL AND pair_expires_at >= ?
             RETURNING id, name, paired_at`,
          )
            .bind(user.id, now, code, now)
            .first<{ id: number; name: string | null; paired_at: string }>()
        : null;
      return device ? json(tvDeviceDict(device)) : error("Code not found or expired", 404);
    }),
  ],

  [
    "GET",
    /^\/api\/tv\/devices$/,
    withUser(async ({ env }, user) => {
      const { results } = await env.DB.prepare("SELECT id, name, paired_at FROM tv_device WHERE user_id = ?")
        .bind(user.id)
        .all<{ id: number; name: string | null; paired_at: string | null }>();
      return json(results.map(tvDeviceDict));
    }),
  ],

  [
    "DELETE",
    /^\/api\/tv\/devices\/(\d+)$/,
    withUser(async ({ env, params }, user) => {
      const result = await env.DB.prepare("DELETE FROM tv_device WHERE id = ? AND user_id = ?")
        .bind(Number(params[0]), user.id)
        .run();
      return result.meta.changes ? json({ message: "TV unpaired" }) : error("Not found", 404);
    }),
  ],

  [
    "GET",
    /^\/api\/tv\/workouts$/,
    withPairedTv(async ({ env }, userId) => json(await loadWorkouts(env, "user_id = ? ORDER BY id", userId))),
  ],

  [
    "POST",
    /^\/api\/tv\/workouts\/(\d+)\/complete$/,
    withPairedTv(async ({ env, params }, userId) => recordCompletion(env, userId, Number(params[0]))),
  ],
];

export async function handleApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  for (const [method, pattern, handler] of routes) {
    const match = url.pathname.match(pattern);
    if (match && request.method === method) return handler({ request, env, url, params: match.slice(1) });
  }
  return error("Not found", 404);
}
