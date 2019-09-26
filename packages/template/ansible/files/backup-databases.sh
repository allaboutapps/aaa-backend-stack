#!/bin/bash
#
# Database Backups: Daily, Weekly & Monthly
#

# Retention configuration
DAILY_DELETE_AFTER_DAYS={{ keep_database_backups_days.daily }}
WEEKLY_DELETE_AFTER_DAYS={{ keep_database_backups_days.weekly }}
MONTHLY_DELETE_AFTER_DAYS={{ keep_database_backups_days.monthly }}

# Directory configuration
DIR_BACKUP="/server/backups"
DIR_BACKUP_DAILY="$DIR_BACKUP/daily/database"
DIR_BACKUP_WEEKLY="$DIR_BACKUP/weekly/database"
DIR_BACKUP_MONTHLY="$DIR_BACKUP/monthly/database"

function backup_database {
    DIR_BACKUP_BASE=$1
	RETENTION_DAYS=$2

	DIR_TARGET="$DIR_BACKUP_BASE/$( date +"%Y-%m-%d" )"

	echo "Backing up PostgreSQL databases to $DIR_TARGET"
	mkdir -p "${DIR_TARGET}"

	FULL_BACKUP_QUERY="select datname from pg_database where not datistemplate and datallowconn order by datname;"
	DATABASES=`su - postgres -c "psql -At -c '$FULL_BACKUP_QUERY'"`
	#echo $DATABASES

	for db in $DATABASES; do
	    fn="${DIR_TARGET}/${db}.sql.gz"
	    echo -e "- database: $db \t-> $fn"
	    su - postgres -c "pg_dump -Fp -c --if-exists $db" | gzip > $fn
	done

	# Delete all backup directories older than 7 days
	find $DIR_BACKUP_BASE/* -maxdepth 0 -type d -ctime +$RETENTION_DAYS -exec rm -rf {} \;
}

# Daily backup
backup_database $DIR_BACKUP_DAILY $DAILY_DELETE_AFTER_DAYS

# Weekly backup (always on Monday)
if [ $(date +%u) == 1 ]; then
	backup_database $DIR_BACKUP_WEEKLY $WEEKLY_DELETE_AFTER_DAYS
fi

# Monthly backup (always on the 1st of each month)
if [ $(date +%d) == 01 ]; then
	backup_database $DIR_BACKUP_MONTHLY $MONTHLY_DELETE_AFTER_DAYS
fi
