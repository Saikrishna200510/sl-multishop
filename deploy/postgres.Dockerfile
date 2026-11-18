FROM postgres:17-alpine

COPY ../backend/prisma/rls-setup.sql /docker-entrypoint-initdb.d/99_rls.sql
