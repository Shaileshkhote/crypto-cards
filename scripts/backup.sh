#!/usr/bin/env bash
set -euo pipefail
# Run from the Compose checkout. A destination outside this host must be configured
# by the operator/scheduler; this script deliberately does not claim local files are backups.
: "${BACKUP_DESTINATION:?Set BACKUP_DESTINATION to an off-host SSH destination, e.g. backup@host:/srv/cards}"
archive=$(mktemp /tmp/crypto-cards-backup.XXXXXX.dump)
trap 'rm -f "$archive"' EXIT
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$archive"
scp "$archive" "${BACKUP_DESTINATION%/}/cards-$(date -u +%Y%m%dT%H%M%SZ).dump"
