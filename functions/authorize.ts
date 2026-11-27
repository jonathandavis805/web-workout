import { authorize } from "../server/auth";
import type { Env } from "../server/env";

export const onRequestGet: PagesFunction<Env> = ({ request, env }) => authorize(request, env);
