#!/bin/bash
# End-to-end RBAC + contract smoke test against a running API.
API=${API:-http://localhost:5001}
pass=0; fail=0
check() { # check <desc> <expected> <actual>
  if [ "$2" = "$3" ]; then echo "  PASS  $1"; pass=$((pass+1));
  else echo "  FAIL  $1 (expected $2, got $3)"; fail=$((fail+1)); fi
}
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }

echo "== root & health =="
check "GET / returns 200" 200 "$(code $API/)"
check "GET /api/health returns 200" 200 "$(code $API/api/health)"
check "GET /api/docs returns 200" 200 "$(code $API/api/docs)"
echo "  health: $(curl -s $API/api/health)"

echo "== auth =="
ADMIN=$(curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@test.com","password":"admin123"}')
USER=$(curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' -d '{"email":"alice@test.com","password":"password123"}')
AT=$(echo "$ADMIN" | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.access_token')
UT=$(echo "$USER"  | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.access_token')
check "admin login issues token" "yes" "$([ -n "$AT" ] && echo yes)"
check "login response hides password" "clean" "$(echo "$ADMIN" | grep -qi '"password"' && echo LEAK || echo clean)"
check "wrong password rejected" 401 "$(code -X POST $API/api/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@test.com","password":"nope"}')"
check "unknown email rejected" 401 "$(code -X POST $API/api/auth/login -H 'Content-Type: application/json' -d '{"email":"ghost@test.com","password":"whatever"}')"
check "no token = 401" 401 "$(code $API/api/notes)"
check "garbage token = 401" 401 "$(code $API/api/notes -H 'Authorization: Bearer not.a.token')"

echo "== RBAC =="
check "user blocked from /users" 403 "$(code $API/api/users -H "Authorization: Bearer $UT")"
check "user blocked from grouped-by-interests" 403 "$(code $API/api/users/grouped-by-interests -H "Authorization: Bearer $UT")"
check "admin allowed on /users" 200 "$(code $API/api/users -H "Authorization: Bearer $AT")"
check "user can read own profile" 200 "$(code $API/api/users/me -H "Authorization: Bearer $UT")"
check "user can patch own profile" 200 "$(code -X PATCH $API/api/users/me -H "Authorization: Bearer $UT" -H 'Content-Type: application/json' -d '{"interests":["chess","reading","painting"]}')"
check "user cannot escalate via /users/me" 400 "$(code -X PATCH $API/api/users/me -H "Authorization: Bearer $UT" -H 'Content-Type: application/json' -d '{"role":"admin"}')"

echo "== password never leaks =="
USERS=$(curl -s "$API/api/users?page=1&limit=100" -H "Authorization: Bearer $AT")
check "GET /users hides hashes" "clean" "$(echo "$USERS" | grep -qi '"password"\|\$2[aby]\$' && echo LEAK || echo clean)"
check "GET /users/me hides hash" "clean" "$(curl -s $API/api/users/me -H "Authorization: Bearer $UT" | grep -qi '"password"' && echo LEAK || echo clean)"
check "GET /auth/me hides hash" "clean" "$(curl -s $API/api/auth/me -H "Authorization: Bearer $UT" | grep -qi '"password"' && echo LEAK || echo clean)"

echo "== notes ownership =="
NOTE=$(curl -s -X POST $API/api/notes -H "Authorization: Bearer $UT" -H 'Content-Type: application/json' -d '{"title":"Alice private","content":"secret"}')
NID=$(echo "$NOTE" | node -pe 'JSON.parse(require("fs").readFileSync(0)).data._id')
BOB=$(curl -s -X POST $API/api/auth/login -H 'Content-Type: application/json' -d '{"email":"bob@test.com","password":"password123"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.access_token')
check "owner can read own note" 200 "$(code $API/api/notes/$NID -H "Authorization: Bearer $UT")"
check "other user cannot read it" 404 "$(code $API/api/notes/$NID -H "Authorization: Bearer $BOB")"
check "other user cannot update it" 404 "$(code -X PUT $API/api/notes/$NID -H "Authorization: Bearer $BOB" -H 'Content-Type: application/json' -d '{"title":"hijacked"}')"
check "other user cannot delete it" 404 "$(code -X DELETE $API/api/notes/$NID -H "Authorization: Bearer $BOB")"
check "admin can read any note" 200 "$(code $API/api/notes/$NID -H "Authorization: Bearer $AT")"
check "owner can delete own note" 204 "$(code -X DELETE $API/api/notes/$NID -H "Authorization: Bearer $UT")"
check "invalid id = 400" 400 "$(code $API/api/notes/not-an-id -H "Authorization: Bearer $UT")"

echo "== pagination =="
P=$(curl -s "$API/api/notes?page=2&limit=5" -H "Authorization: Bearer $AT")
echo "  notes p2:  $(echo "$P" | node -pe 'const r=JSON.parse(require("fs").readFileSync(0));JSON.stringify(r.meta)+" items="+r.data.length')"
check "limit>100 rejected" 400 "$(code "$API/api/notes?limit=500" -H "Authorization: Bearer $AT")"
check "page=0 rejected" 400 "$(code "$API/api/notes?page=0" -H "Authorization: Bearer $AT")"
check "unknown query param rejected" 400 "$(code "$API/api/notes?bogus=1" -H "Authorization: Bearer $AT")"

echo "== aggregations =="
G=$(curl -s "$API/api/users/grouped-by-interests?page=1&limit=3" -H "Authorization: Bearer $AT")
echo "  scenario1: $(echo "$G" | node -pe 'const r=JSON.parse(require("fs").readFileSync(0));JSON.stringify(r.meta)+" first="+JSON.stringify(r.data[0])')"
check "scenario1 paginates" 3 "$(echo "$G" | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.length')"
AID=$(echo "$USERS" | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.find(u=>u.email==="alice@test.com")._id')
L=$(curl -s "$API/api/posts/by-user/$AID?page=1&limit=2" -H "Authorization: Bearer $UT")
echo "  scenario2: $(echo "$L" | node -pe 'const r=JSON.parse(require("fs").readFileSync(0));JSON.stringify(r.meta)+" first="+JSON.stringify(r.data[0])')"
check "scenario2 joins author" "yes" "$(echo "$L" | grep -q '"author"' && echo yes)"
check "scenario2 hides author hash" "clean" "$(echo "$L" | grep -qi '"password"' && echo LEAK || echo clean)"

echo "== posts =="
check "any user can list posts" 200 "$(code $API/api/posts -H "Authorization: Bearer $UT")"
check "any user can write a post" 201 "$(code -X POST $API/api/posts -H "Authorization: Bearer $UT" -H 'Content-Type: application/json' -d '{"title":"Hello","content":"world"}')"
check "posts list shows author" "yes" "$(curl -s $API/api/posts -H "Authorization: Bearer $UT" | grep -q '"name"' && echo yes)"

echo "== admin safety rails =="
MEID=$(curl -s $API/api/users/me -H "Authorization: Bearer $AT" | node -pe 'JSON.parse(require("fs").readFileSync(0)).data._id')
check "admin cannot delete self" 400 "$(code -X DELETE $API/api/users/$MEID -H "Authorization: Bearer $AT")"
check "admin cannot demote self" 400 "$(code -X PUT $API/api/users/$MEID -H "Authorization: Bearer $AT" -H 'Content-Type: application/json' -d '{"role":"user"}')"
check "duplicate email = 409" 409 "$(code -X POST $API/api/users -H "Authorization: Bearer $AT" -H 'Content-Type: application/json' -d '{"name":"Dupe","email":"alice@test.com","password":"password123"}')"
check "short password = 400" 400 "$(code -X POST $API/api/auth/register -H 'Content-Type: application/json' -d '{"name":"Tiny","email":"tiny@test.com","password":"123"}')"

echo "== token revocation =="
TMP=$(curl -s -X POST $API/api/auth/register -H 'Content-Type: application/json' -d '{"name":"Temp User","email":"temp@test.com","password":"password123"}')
TT=$(echo "$TMP" | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.access_token')
TID=$(echo "$TMP" | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.user._id')
check "new account works" 200 "$(code $API/api/notes -H "Authorization: Bearer $TT")"
curl -s -o /dev/null -X POST $API/api/notes -H "Authorization: Bearer $TT" -H 'Content-Type: application/json' -d '{"title":"doomed"}'
curl -s -o /dev/null -X DELETE $API/api/users/$TID -H "Authorization: Bearer $AT"
check "deleted user's token is dead" 401 "$(code $API/api/notes -H "Authorization: Bearer $TT")"
check "deleted user's notes cascaded" 0 "$(curl -s "$API/api/notes?limit=100" -H "Authorization: Bearer $AT" | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.filter(n=>n.title==="doomed").length')"

echo
echo "passed: $pass   failed: $fail"
[ "$fail" -eq 0 ]
