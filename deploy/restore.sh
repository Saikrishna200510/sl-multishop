#!/usr/bin/env bash
# ====================================================================
# SL MULTISHOP - POSTGRESQL RESTORE SCRIPT
# SL IT SOLUTIONS
# ====================================================================
set -euo pipefail

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <path_to_backup_file.sql.gz>"
    exit 1
fi

BACKUP_FILE="$1"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-sl_multishop}"
CONTAINER_NAME="${PG_CONTAINER:-sl_postgres}"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "[ERROR] Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

echo "===================================================================="
echo "WARNING: Restoring will overwrite existing data in '${DB_NAME}'!"
echo "Target backup: ${BACKUP_FILE}"
echo "===================================================================="
read -p "Type 'RESTORE' to confirm and proceed: " CONFIRM

if [ "${CONFIRM}" != "RESTORE" ]; then
    echo "[ABORT] Restore cancelled."
    exit 1
fi

echo "[INFO] Restoring database from ${BACKUP_FILE}..."

if docker ps -q -f name="${CONTAINER_NAME}" | grep -q .; then
    gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}"
else
    gunzip -c "${BACKUP_FILE}" | psql -U "${DB_USER}" -d "${DB_NAME}"
fi

echo "[SUCCESS] Database restoration complete!"
