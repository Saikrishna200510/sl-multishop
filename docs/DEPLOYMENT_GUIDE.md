# SL MULTISHOP – PRODUCTION VPS DEPLOYMENT GUIDE
**Product:** SL MultiShop  
**Company:** SL IT SOLUTIONS  
**Target OS:** Ubuntu 24.04 / 22.04 LTS (x86_64 or ARM64)  
**Proxy:** Caddy Server 2 with Automatic Free HTTPS (Let's Encrypt)  

---

## Architecture Overview

In production, SL MultiShop runs as a set of isolated, highly secure Docker containers managed by Docker Compose:
- **Caddy (Reverse Proxy & SSL):** Handles public ports `80` & `443`, enforces HTTP/2 & HTTP/3, auto-provisions TLS certificates, and routes traffic.
- **Frontend (React + Nginx):** Serves the high-speed Single Page Application (SPA).
- **Backend (Node.js + Express + Prisma):** Handles API requests, business logic, POS transactions, and PDF generation.
- **Database (PostgreSQL 17):** Isolated inside private Docker network `sl_network` with Row-Level Security (RLS) enabled. Never exposed to the public internet.

---

## Method 1: Docker Compose Deployment (Recommended)

### Step 1: Server Provisioning & Prerequisites
Get an Ubuntu 22.04 or 24.04 LTS VPS (Minimum recommended: 2 vCPU, 4GB RAM, 40GB SSD) from any cloud provider (DigitalOcean, AWS EC2, Hetzner, Linode, Vultr, Google Cloud).

SSH into your server and update packages:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw fail2ban ca-certificates apt-transport-https
```

Install official Docker & Docker Compose:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

Configure Firewall (UFW):
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```
*(PostgreSQL port 5432 is kept closed from outside access for maximum security).*

---

### Step 2: Clone Repository & Configure Environment
Clone your repository into `/opt/sl-multishop`:
```bash
cd /opt
sudo git clone https://github.com/your-username/sl-multishop.git
cd /opt/sl-multishop
```

Create production `.env` file in the project root:
```bash
cat << 'EOF' > .env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=SetAStrongRandomPassword2026!
POSTGRES_DB=sl_multishop

JWT_ACCESS_SECRET=your_production_access_secret_min_32_characters_random
JWT_REFRESH_SECRET=your_production_refresh_secret_min_32_characters_random
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=*
SUPERADMIN_EMAIL=admin@slit-solutions.com
SUPERADMIN_PASSWORD=SuperAdmin@2026!SL
EOF
```

---

### Step 3: Configure Your Domain & SSL
Point your domain's DNS **A record** to your VPS public IP address (e.g. `billing.yourdomain.com -> 203.0.113.10`).

Edit `deploy/Caddyfile`:
```caddy
billing.yourdomain.com {
    encode gzip zstd

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        X-XSS-Protection "1; mode=block"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # Backend API endpoints
    handle /api/* {
        reverse_proxy backend:5000 {
            header_up X-Real-IP {remote_host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
        }
    }

    # Swagger Documentation
    handle /api-docs* {
        reverse_proxy backend:5000
    }

    # Frontend Single Page App
    handle {
        reverse_proxy frontend:80
    }
}
```

---

### Step 4: Build & Launch Containers
Run from the project root:
```bash
docker compose up -d --build
```
Verify all 4 containers (`sl_caddy`, `sl_frontend`, `sl_backend`, `sl_postgres`) are healthy:
```bash
docker compose ps
```

---

### Step 5: Initialize Database & RLS

You have two choices for setting up the database:

#### Choice A: Restore Existing Data (includes demo store, catalog, users):
```bash
docker exec -i sl_postgres psql -U postgres -d sl_multishop < sl_multishop_data.sql
```

#### Choice B: Clean Migration & Seed:
```bash
# 1. Apply Prisma migrations
docker exec -it sl_backend npx prisma migrate deploy

# 2. Apply PostgreSQL Row-Level Security (RLS) policies
docker exec -i sl_postgres psql -U postgres -d sl_multishop < backend/prisma/rls-setup.sql

# 3. Seed default roles, tax slabs, plans, and demo store
docker exec -it sl_backend npm run prisma:seed
```

---

### Step 6: Automated Nightly Backups
Make the backup script executable:
```bash
chmod +x deploy/backup.sh deploy/restore.sh
```

Add a cron job to automatically backup the database every night at 2:00 AM:
```bash
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/sl-multishop/deploy/backup.sh >> /var/log/sl_multishop_backup.log 2>&1") | crontab -
```

---

## Method 2: Native Ubuntu Deployment (PM2 + Nginx)

If you prefer deploying natively on Ubuntu without Docker:

### 1. Install Node.js 22 & PostgreSQL 17
```bash
# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs postgresql postgresql-contrib nginx

# Install PM2 process manager
sudo npm install -g pm2
```

### 2. Configure PostgreSQL
```bash
sudo -u postgres psql -c "CREATE DATABASE sl_multishop;"
sudo -u postgres psql -d sl_multishop -f backend/prisma/rls-setup.sql
```

### 3. Build & Run Backend
```bash
cd backend
npm ci
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run build

# Start with PM2
pm2 start dist/server.js --name "sl-backend"
pm2 save
pm2 startup
```

### 4. Build & Serve Frontend with Nginx
```bash
cd ../frontend
npm ci
npm run build

# Copy build to Nginx web root
sudo mkdir -p /var/www/sl-multishop
sudo cp -r dist/* /var/www/sl-multishop/
```

Configure Nginx `/etc/nginx/sites-available/sl-multishop`:
```nginx
server {
    listen 80;
    server_name billing.yourdomain.com;

    location /api/ {
        proxy_pass http://localhost:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /var/www/sl-multishop;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```
Enable site and install free SSL certificate with Certbot:
```bash
sudo ln -s /etc/nginx/sites-available/sl-multishop /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d billing.yourdomain.com
```

---

## Operations & Maintenance Quick Reference

| Action | Command |
| :--- | :--- |
| **Check Container Status** | `docker compose ps` |
| **View Live Logs** | `docker compose logs -f --tail=100` |
| **Restart Backend** | `docker restart sl_backend` |
| **Trigger Immediate Backup** | `./deploy/backup.sh` |
| **Restore Database Backup** | `./deploy/restore.sh /var/backups/sl_multishop/backup_file.sql.gz` |
| **Update App to Latest Code** | `git pull && docker compose up -d --build` |
