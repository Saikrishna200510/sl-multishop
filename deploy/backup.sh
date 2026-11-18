#!/usr/bin/env bash
# ====================================================================
# SL MULTISHOP - POSTGRESQL BACKUP SCRIPT
# SL IT SOLUTIONS
# ====================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/sl_multishop}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/sl_multishop_backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=14

DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-sl_multishop}"
CONTAINER_NAME="${PG_CONTAINER:-sl_postgres}"

mkdir -p "${BACKUP_DIR}"

echo "[INFO] Starting database backup for '${DB_NAME}' at ${TIMESTAMP}..."

if docker ps -q -f name="${CONTAINER_NAME}" | grep -q .; then
    docker exec -t "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists --no-owner --no-privileges | gzip > "${BACKUP_FILE}"
else
    pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists --no-owner --no-privileges | gzip > "${BACKUP_FILE}"
fi

echo "[SUCCESS] Backup completed successfully: ${BACKUP_FILE}"
echo "[INFO] Backup size: $(du -h "${BACKUP_FILE}" | cut -f1)"

# Prune backups older than RETENTION_DAYS
echo "[INFO] Cleaning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "sl_multishop_backup_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" -exec rm -f {} +
echo "[SUCCESS] Backup maintenance complete."
