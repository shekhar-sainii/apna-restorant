#!/bin/bash

# Database Backup Script for Apna Restorant
# Can be configured as a daily cron job

# Exit immediately if any command exits with a non-zero status
set -e

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}" # fallback to local directory if not specified
DATABASE_NAME="apna_restorant"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="${DATABASE_NAME}_backup_${TIMESTAMP}"
RETENTION_DAYS=7

# If MONGODB_URI is not set, use default docker localhost string
MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017/apna_restorant}"

echo "========================================="
echo "Starting database backup at $(date)"
echo "========================================="

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Perform mongodump
echo "Running mongodump for database: ${DATABASE_NAME}..."
mongodump --uri="${MONGODB_URI}" --archive="${BACKUP_DIR}/${BACKUP_NAME}.archive" --gzip

echo "Backup created successfully: ${BACKUP_DIR}/${BACKUP_NAME}.archive"

# Remove backups older than retention days
echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -type f -name "${DATABASE_NAME}_backup_*.archive" -mtime +$RETENTION_DAYS -delete

echo "Cleanup completed."
echo "========================================="
echo "Backup process finished successfully."
echo "========================================="
