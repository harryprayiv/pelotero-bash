#!/usr/bin/env bash

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <start_date> <end_date>"
    exit 1
fi

start_date="$1"
end_date="$2"
current_date="$start_date"

start_ts=$(date -d "$start_date" +%s)
end_ts=$(date -d "$end_date" +%s)
current_ts=$(date -d "$current_date" +%s)

# Define the name and location for the master JSON file
COMPOSITE_FILE="scrapedData/${start_date}_${end_date}.json"

# Initialize the master file with an empty JSON object
echo "{}" > "$COMPOSITE_FILE"

while [ "$current_ts" -le "$end_ts" ]; do
    echo "Merging data for $current_date"

    # Define the filename for the day's data
    day_file="scrapedData/$(date -d "$current_date" +%Y_%m_%d).json"

    # If the day's file exists, merge it with the master data
    if [ -f "$day_file" ]; then
        # Merge the day's data with the master data
        jq -s '.[0] * .[1]' "$COMPOSITE_FILE" "$day_file" > temp.json && mv temp.json "$COMPOSITE_FILE"
    else
        echo "No data found for $current_date"
    fi

    # Move to the next day
    current_date=$(date -I -d "$current_date + 1 day")
    current_ts=$(date -d "$current_date" +%s)
done

echo "Merging complete. Check $COMPOSITE_FILE for the accumulated data."
