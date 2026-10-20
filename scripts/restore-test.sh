#!/usr/bin/env bash
set -euo pipefail
# Uses a separate disposable database inside the configured Postgres container.
: "${1:?Usage: bash scripts/restore-test.sh /path/to/downloaded-backup.dump}"
docker compose exec -T postgres sh -c 'createdb -U "$POSTGRES_USER" cards_restore_test'
trap 'docker compose exec -T postgres sh -c '\''dropdb -U "$POSTGRES_USER" cards_restore_test'\''' EXIT
docker compose exec -T postgres sh -c 'pg_restore -U "$POSTGRES_USER" -d cards_restore_test --exit-on-error' < "$1"
docker compose exec -T postgres sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d cards_restore_test -c "SELECT count(*) FROM cards; SELECT count(*) FROM card_versions; SELECT count(*) FROM schema_migrations;"'
