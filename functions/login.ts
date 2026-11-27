import { login } from "../server/auth";
import type { Env } from "../server/env";

export const onRequestGet: PagesFunction<Env> = ({ request, env }) => login(request, env);
