#!/usr/bin/env bash
set -euo pipefail
# This job owns its disposable Compose project and volume.
[[ "${CI:-}" == "true" && "${COMPOSE_PROJECT_NAME:-}" == "cards-ci" ]]
archive=$(mktemp /tmp/cards-ci.XXXXXX.dump)
cleanup() {
  result=$?
  if [[ $result -ne 0 ]]; then docker compose logs --tail=60; fi
  docker compose down --volumes
  rm -f "$archive"
  exit "$result"
}
trap cleanup EXIT
docker compose up --detach --build --wait --wait-timeout 240
docker compose exec -T worker pnpm cards validate
docker compose exec -T worker pnpm cards cache
for attempt in {1..30}; do
  ready=$(docker compose exec -T postgres sh -c 'psql -At -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT count(*) FROM cache_entries WHERE key = '\''cards'\''"')
  [[ "$ready" == "1" ]] && break
  sleep 1
done
[[ "$ready" == "1" ]]
docker compose exec -T -e SMOKE_BASE_URL=http://127.0.0.1:3000 admin node --import tsx scripts/smoke.ts
cache_hash() {
  docker compose exec -T postgres sh -c 'psql -At -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT content_hash FROM cache_entries WHERE key = '\''cards'\''"'
}
before=$(cache_hash)
docker compose restart worker admin
docker compose up --detach --wait --wait-timeout 180
docker compose exec -T -e SMOKE_BASE_URL=http://127.0.0.1:3000 admin node --import tsx scripts/smoke.ts
[[ "$before" == "$(cache_hash)" ]]
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$archive"
docker compose exec -T postgres sh -c 'createdb -U "$POSTGRES_USER" cards_restore_test'
docker compose exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" -d cards_restore_test --exit-on-error' < "$archive"
restored=$(docker compose exec -T postgres sh -c 'psql -At -U "$POSTGRES_USER" -d cards_restore_test -c "SELECT content_hash FROM cache_entries WHERE key = '\''cards'\''"')
[[ "$before" == "$restored" ]]
echo 'Compose passed: migration, healthy services, cache job, authenticated HTTP, restart persistence and backup restore.'
