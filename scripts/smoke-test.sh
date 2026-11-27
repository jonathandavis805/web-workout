#!/usr/bin/env bash
# End-to-end API test: serves the built site with `wrangler pages dev` on a throwaway
# local D1 database and exercises every endpoint. Run `npm run build` first.
set -u
cd "$(dirname "$0")/.."
PORT=8799
B=http://localhost:$PORT
STATE=$(mktemp -d)
trap 'kill $SERVER 2>/dev/null; rm -rf "$STATE"' EXIT

npx wrangler d1 migrations apply gruuve-db --local --persist-to "$STATE" >/dev/null
npx wrangler pages dev --port $PORT --persist-to "$STATE" --binding REVIEW_PASSWORD=letmein >"$STATE/server.log" 2>&1 &
SERVER=$!
curl -s -o /dev/null --retry 60 --retry-connrefused --retry-delay 1 "$B/"

h() { node -e 'process.stdout.write(require("crypto").createHash("sha256").update(process.argv[1]).digest("hex"))' "$1"; }
sql() { npx wrangler d1 execute gruuve-db --local --persist-to "$STATE" --command "$1" >/dev/null; }
FUT=2099-01-01T00:00:00.000Z
sql "INSERT INTO user (id,email,name,oauth_provider,oauth_id) VALUES (1,'a@x.test','Alice','google','a'),(2,'b@x.test','Bob','google','b');
INSERT INTO session VALUES ('$(h alice)',1,'$FUT'),('$(h bob)',2,'$FUT');"
A="Cookie: session=alice"; Bo="Cookie: session=bob"
FAILED=0
code() { curl -s -o /dev/null -w "%{http_code}" "$@"; }
check() { if [ "$2" = "$3" ]; then echo "ok   $1"; else echo "FAIL $1: got $2 want $3"; FAILED=1; fi; }

check "index" "$(curl -s $B/ | grep -o '<title>[^<]*')" "<title>Gruuve"
check "spa fallback /tv" "$(curl -s $B/tv | grep -o '<title>[^<]*')" "<title>Gruuve"
check "user unauth" "$(code $B/api/user)" 401
loc=$(curl -s -D - -o /dev/null $B/login | tr -d '\r')
check "login redirect" "$(echo "$loc" | grep -o 'redirect_uri=[^&]*')" "redirect_uri=http%3A%2F%2Flocalhost%3A${PORT}%2Fauthorize"
check "login state cookie" "$(echo "$loc" | grep -o 'oauth_state=[^;]*; Path=/; HttpOnly; SameSite=Lax' | wc -l | tr -d ' ')" 1
check "authorize bad state" "$(code -H 'Cookie: oauth_state=x' "$B/authorize?code=c&state=y")" 400
check "user" "$(curl -s -H "$A" $B/api/user)" '{"id":1,"email":"a@x.test","name":"Alice"}'
check "review page" "$(code $B/review)" 200
check "review wrong password" "$(code -d password=nope $B/review)" 401
review_user() { curl -s -H "Cookie: $(curl -s -D - -o /dev/null -d password=letmein $B/review | tr -d '\r' | grep -o 'session=[^;]*')" $B/api/user; }
RU=$(review_user)
check "review sign-in" "$(echo "$RU" | grep -o '"name":"App Reviewer"')" '"name":"App Reviewer"'
check "review reuses account" "$(review_user)" "$RU"

W=$(curl -s -H "$A" -H 'Content-Type: application/json' -d '{"name":"Test","circuits":2,"isPublic":true,"exercises":[{"name":"Squats","duration":30},{"name":"Plank","duration":60}]}' $B/api/workouts)
ID=$(echo "$W" | sed -E 's/.*"id":([0-9]+),"name":"Test".*/\1/')
check "create" "$(echo "$W" | sed -E 's/"id":[0-9]+/"id":N/g')" '{"id":N,"name":"Test","spotifyUrl":null,"exercises":[{"id":N,"name":"Squats","duration":30,"order":0},{"id":N,"name":"Plank","duration":60,"order":1}],"circuits":2,"isPublic":true}'
check "create no name" "$(code -H "$A" -H 'Content-Type: application/json' -d '{}' $B/api/workouts)" 400
check "list" "$(curl -s -H "$A" $B/api/workouts | grep -o '"name":"Test"')" '"name":"Test"'
check "get other user's" "$(code -H "$Bo" $B/api/workouts/$ID)" 404
check "public list (bob sees)" "$(curl -s -H "$Bo" "$B/api/public/workouts?page=0" | grep -o '"name":"Test"')" '"name":"Test"'
check "update" "$(curl -s -X PUT -H "$A" -H 'Content-Type: application/json' -d '{"name":"Renamed","circuits":3,"exercises":[{"name":"Burpees"}]}' $B/api/workouts/$ID | sed -E 's/"id":[0-9]+/"id":N/g')" '{"id":N,"name":"Renamed","spotifyUrl":null,"exercises":[{"id":N,"name":"Burpees","duration":30,"order":0}],"circuits":3,"isPublic":false}'
check "update other user's" "$(code -X PUT -H "$Bo" -H 'Content-Type: application/json' -d '{"name":"x"}' $B/api/workouts/$ID)" 404
check "complete" "$(curl -s -H "$A" -H 'Content-Type: application/json' -d '{}' $B/api/workouts/$ID/complete | grep -oE '"duration_seconds":[0-9]+,"workout_name":"Renamed"')" '"duration_seconds":90,"workout_name":"Renamed"'
check "completions" "$(curl -s -H "$A" $B/api/workout-completions | grep -oE '"completed_at":"[0-9T:.-]+Z"' | wc -l | tr -d ' ')" 1

P=$(curl -s -H 'Content-Type: application/json' -d '{"name":"Test TV"}' $B/api/tv/pair/start)
CODE=$(echo "$P" | sed -E 's/.*"code":"([A-Z0-9]+)".*/\1/'); TOK=$(echo "$P" | sed -E 's/.*"token":"([a-f0-9]+)".*/\1/'); T="Authorization: Bearer $TOK"
check "pair start" "$(echo "$P" | grep -oE '"expiresIn":600')" '"expiresIn":600'
check "tv no token" "$(code $B/api/tv/workouts)" 401
check "status unpaired" "$(curl -s -H "$T" $B/api/tv/pair/status)" '{"paired":false,"expired":false}'
check "tv workouts unpaired" "$(code -H "$T" $B/api/tv/workouts)" 403
check "claim unauth" "$(code -H 'Content-Type: application/json' -d "{\"code\":\"$CODE\"}" $B/api/tv/pair/claim)" 401
check "claim bad code" "$(code -H "$A" -H 'Content-Type: application/json' -d '{"code":"ZZZZZZ"}' $B/api/tv/pair/claim)" 404
check "claim (lowercase)" "$(curl -s -H "$A" -H 'Content-Type: application/json' -d "{\"code\":\" $(echo $CODE | tr A-Z a-z)\"}" $B/api/tv/pair/claim | grep -o '"name":"Test TV","pairedAt":"[^"]*Z"' | wc -l | tr -d ' ')" 1
check "claim reuse (bob)" "$(code -H "$Bo" -H 'Content-Type: application/json' -d "{\"code\":\"$CODE\"}" $B/api/tv/pair/claim)" 404
check "status paired" "$(curl -s -H "$T" $B/api/tv/pair/status)" '{"paired":true,"expired":false}'
check "tv workouts" "$(curl -s -H "$T" $B/api/tv/workouts | grep -o '"name":"Renamed"')" '"name":"Renamed"'
check "tv complete" "$(code -X POST -H "$T" $B/api/tv/workouts/$ID/complete)" 201
DEV=$(curl -s -H "$A" $B/api/tv/devices | sed -E 's/.*"id":([0-9]+),"name":"Test TV".*/\1/')
check "bob can't unpair alice's tv" "$(code -X DELETE -H "$Bo" $B/api/tv/devices/$DEV)" 404
check "unpair" "$(code -X DELETE -H "$A" $B/api/tv/devices/$DEV)" 200
check "tv after unpair" "$(code -H "$T" $B/api/tv/workouts)" 401

check "delete other user's" "$(code -X DELETE -H "$Bo" $B/api/workouts/$ID)" 404
check "delete" "$(code -X DELETE -H "$A" $B/api/workouts/$ID)" 200
check "completions survive delete" "$(curl -s -H "$A" $B/api/workout-completions | grep -o '"workout_id":null,' | wc -l | tr -d ' ')" 2
check "logout clears cookie" "$(curl -s -D - -o /dev/null -H "$A" $B/logout | tr -d '\r' | grep -c 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0')" 1
check "session gone after logout" "$(code -H "$A" $B/api/user)" 401

sql "WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 120)
INSERT INTO workout (user_id, name, circuits) SELECT 2, 'Bulk ' || i, 1 FROM n;
INSERT INTO exercise (workout_id, name, duration, \"order\") SELECT id, 'Jog', 30, 0 FROM workout WHERE user_id = 2;"
P=$(curl -s -H 'Content-Type: application/json' -d '{}' $B/api/tv/pair/start)
CODE=$(echo "$P" | sed -E 's/.*"code":"([A-Z0-9]+)".*/\1/'); T="Authorization: Bearer $(echo "$P" | sed -E 's/.*"token":"([a-f0-9]+)".*/\1/')"
curl -s -o /dev/null -H "$Bo" -H 'Content-Type: application/json' -d "{\"code\":\"$CODE\"}" $B/api/tv/pair/claim
check "tv lists 120 workouts with exercises" "$(curl -s -H "$T" $B/api/tv/workouts | grep -o '"name":"Jog"' | wc -l | tr -d ' ')" 120

[ $FAILED = 0 ] || { echo "--- server log"; tail -30 "$STATE/server.log"; }
exit $FAILED
