import { logout } from "../server/auth";
import type { Env } from "../server/env";

export const onRequestGet: PagesFunction<Env> = ({ request, env }) => logout(request, env);
