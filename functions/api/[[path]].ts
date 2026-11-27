import { handleApi } from "../../server/api";
import type { Env } from "../../server/env";

export const onRequest: PagesFunction<Env> = ({ request, env }) => handleApi(request, env);
