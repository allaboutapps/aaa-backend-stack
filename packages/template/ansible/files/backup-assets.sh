#!/bin/bash
#
# Asset Backups: Daily, Weekly & Monthly
#

# Retention configuration
DAILY_DELETE_AFTER_DAYS={{ keep_assets_backups_days.daily }}
WEEKLY_DELETE_AFTER_DAYS={{ keep_assets_backups_days.weekly }}
MONTHLY_DELETE_AFTER_DAYS={{ keep_assets_backups_days.monthly }}

# Directory configuration
# source
SRC="{{ code_root }}/assets"

# targets
DIR_BACKUP="/server/backups"
DIR_BACKUP_DAILY="$DIR_BACKUP/daily/assets"
DIR_BACKUP_WEEKLY="$DIR_BACKUP/weekly/assets"
DIR_BACKUP_MONTHLY="$DIR_BACKUP/monthly/assets"

function backup_assets {
	SOURCE=$1
	DIR_BACKUP_BASE=$2
	RETENTION_DAYS=$3

	# backup filename is the basename of the source path.
	# if there are multiple with same name, add an extra parameter.
	FILENAME=$( basename $SOURCE )

	DIR_BACKUP="$DIR_BACKUP_BASE/$( date +"%Y-%m-%d" )"
	FILE_TARGET="$DIR_BACKUP/$FILENAME.tar.gz"

	echo "Backing up $SOURCE to $FILE_TARGET"
	mkdir -p $DIR_BACKUP
	tar -czf $FILE_TARGET $SOURCE

	# Delete all backup directories older than 14 days
	find $DIR_BACKUP_BASE/* -maxdepth 0 -type d -ctime +$RETENTION_DAYS -exec rm -rf {} \;
}

# Daily backup
if [ "$DAILY_DELETE_AFTER_DAYS" != "0" ]; then
	backup_assets $SRC $DIR_BACKUP_DAILY $DAILY_DELETE_AFTER_DAYS
fi

# Weekly backup (always on Monday)
if [ $(date +%u) == 1 ] && [ "$WEEKLY_DELETE_AFTER_DAYS" != "0" ]; then
	backup_assets $SRC $DIR_BACKUP_WEEKLY $WEEKLY_DELETE_AFTER_DAYS
fi

# Monthly backup (always on the 1st of each month)
if [ $(date +%d) == 01 ] && [ "$MONTHLY_DELETE_AFTER_DAYS" != "0" ]; then
	backup_assets $SRC $DIR_BACKUP_MONTHLY $MONTHLY_DELETE_AFTER_DAYS
fi
