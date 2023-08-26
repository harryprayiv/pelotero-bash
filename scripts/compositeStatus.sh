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
COMPOSITE_FILE="scrapedData/${start_date}tooo${end_date}.json"

# Initialize the master file with an empty games object
echo '{"games": {}}' > "$COMPOSITE_FILE"

while [ "$current_ts" -le "$end_ts" ]; do
    echo "Accumulating game statuses for $current_date"

    # Define the filename for the day's data
    day_file="scrapedData/$(date -d "$current_date" +%Y_%m_%d).json"

    # If the day's file exists, accumulate its game statuses
    if [ -f "$day_file" ]; then
        day_games=$(jq '.games' "$day_file")

        # Merge the game statuses from the day's file into the composite file
        jq --argjson dg "$day_games" '.games += $dg' "$COMPOSITE_FILE" > temp.json && mv temp.json "$COMPOSITE_FILE"
    else
        echo "No data found for $current_date"
    fi

    # Move to the next day
    current_date=$(date -I -d "$current_date + 1 day")
    current_ts=$(date -d "$current_date" +%s)
done

echo "Accumulation complete. Check $COMPOSITE_FILE for the accumulated game statuses."
