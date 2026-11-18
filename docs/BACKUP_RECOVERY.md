# SL MULTISHOP – BACKUP & DISASTER RECOVERY GUIDE
**Product:** SL MultiShop  
**Company:** SL IT SOLUTIONS  

---

## 1. Automated Daily Backups

SL MultiShop provides an automated database backup utility `deploy/backup.sh` that creates compressed, timestamped dumps of the entire multi-tenant PostgreSQL database.

### 1.1 Running a Manual Backup
```bash
./deploy/backup.sh
```
This produces a gzipped SQL file in `/var/backups/sl_multishop/sl_multishop_backup_YYYYMMDD_HHMMSS.sql.gz`.

### 1.2 Automated Daily Cron Job
To schedule daily backups at 02:00 AM with a 14-day retention cycle, edit root crontab:
```bash
sudo crontab -e
```
Add the following line:
```cron
0 2 * * * /opt/sl-multishop/deploy/backup.sh >> /var/log/sl_multishop_backup.log 2>&1
```

---

## 2. Disaster Recovery & Database Restoration

To restore data from a previous backup file:

```bash
./deploy/restore.sh /var/backups/sl_multishop/sl_multishop_backup_20261118_020000.sql.gz
```

The script will prompt for explicit confirmation `RESTORE` to prevent accidental overwrites, gunzip the dump, and restore all tables, sequences, indexes, and Row-Level Security policies.

After restoration, verify the RLS policies and application connectivity:
```bash
docker exec -i sl_postgres psql -U postgres -d sl_multishop -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';"
```
All tenant tables should display `rowsecurity: true`.
