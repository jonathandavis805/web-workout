import { reviewLogin } from "../server/auth";
import type { Env } from "../server/env";

export const onRequest: PagesFunction<Env> = ({ request, env }) => reviewLogin(request, env);
