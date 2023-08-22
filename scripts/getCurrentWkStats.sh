#!/usr/bin/env bash

# Get the current day of the week (1 = Monday, 7 = Sunday)
current_day=$(date +%u)

# Calculate the date of the last Monday (start of the week)
start_date=$(date -d "last monday" +%Y-%m-%d)

# If today is Sunday, set start_date to today's date
if [[ "$current_day" -eq 7 ]]; then
    start_date=$(date +%Y-%m-%d)
fi

# Calculate the date of the next Sunday (end of the week)
end_date=$(date -d "next sunday" +%Y-%m-%d)

# If today is Sunday, set end_date to today's date
if [[ "$current_day" -eq 7 ]]; then
    end_date=$(date +%Y-%m-%d)
fi

# Launch the desired command with the start and end dates as arguments
./scripts/wholeDAY.sh "$start_date" "$end_date"
