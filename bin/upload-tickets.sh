#!/bin/bash

# Sync ticket individual json files and attachments
gcloud storage rsync ../tickets/ gs://planet4-jira-archive/ --recursive --delete-unmatched-destination-objects

# Sync aggregated tickets summaries
gcloud storage cp ../tickets.json gs://planet4-jira-archive/