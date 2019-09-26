#!/bin/bash
#
# Asset Backups: Incremental continous backup of assets
#

# Retention configuration
DAILY_DELETE_AFTER_DAYS={{ keep_assets_backups_days.incremental }}

# Directory configuration
# source
SRC="{{ code_root }}/assets"

# targets
DIR_BACKUP="/server/backups"
DIR_BACKUP_INCREMENTAL="$DIR_BACKUP/incremental/assets"

function backup_assets_incremental {
	SOURCE=$1
	DIR_BACKUP_BASE=$2
    RETENTION_DAYS_ORG=$3

    # assert that backups typically take some time, therefore we substract a minimal part (0.1) from the RETENTION_DAYS_ORG
    # therefore the initial backup creation time does not interfere with our clearing procedure
    # e.g. retention of 7: on Monday 3:00am, the backup fully created on last Monday 3:15am will be cleared right away (not on Tuesday)
    RETENTION_DAYS=$(bc <<< "$RETENTION_DAYS_ORG-0.3")

    # folder format...
    WEEK=`date +%V`
    YEAR=`date +'%Y'`
    
    # ensure dir exists...
    mkdir -p $DIR_BACKUP_BASE/$YEAR-KW$WEEK

    # Delete all backup directories older than x days (saves up space for the incoming backup...)
	find $DIR_BACKUP_BASE/* -maxdepth 1 -type f -ctime +$RETENTION_DAYS -printf '%h\n' | sort | uniq | xargs rm -r

    # for each new (incremental), we will increment the index. 
    BACKUP_INDEX=`find $DIR_BACKUP_BASE/$YEAR-KW$WEEK -maxdepth 1 -name "assets.*.tar.gz" | wc -l`

    echo "Archiving $SRC into $DIR_BACKUP_BASE/$YEAR-KW$WEEK/assets.$BACKUP_INDEX.tar.gz with snapshot file $DIR_BACKUP_BASE/$YEAR-KW$WEEK/assets.snapshot"
    
    # see https://www.unixmen.com/performing-incremental-backups-using-tar/ for config and how to extract
    tar --atime-preserve=system --listed-incremental=$DIR_BACKUP_BASE/$YEAR-KW$WEEK/assets.snapshot -cvzf $DIR_BACKUP_BASE/$YEAR-KW$WEEK/assets.$BACKUP_INDEX.tar.gz $SRC
}

# Daily incremental backup (beginning with a new week)
if [ "$DAILY_DELETE_AFTER_DAYS" != "0" ]; then
    backup_assets_incremental $SRC $DIR_BACKUP_INCREMENTAL $DAILY_DELETE_AFTER_DAYS
fi
