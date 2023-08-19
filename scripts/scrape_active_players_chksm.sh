#!/usr/bin/env bash

# Set the current date and time
current_datetime=$(date +%Y_%m_%d_%H_%M)

# Set the output folder and create it if it doesn't exist
output_folder="scrapedData"
mkdir -p "$output_folder"

# Set the output file name
output_file="${output_folder}/activePlayers_${current_datetime}.json"

# Download the JSON file
url="https://statsapi.mlb.com/api/v1/sports/1/players?activeStatus=ACTIVE&season=2023"
raw_json=$(curl -s "$url")

# Transform the JSON structure
sorted_json=$(echo "$raw_json" | jq '(.people | sort_by(.id))')
transformed_json=$(echo "{\"people\": $sorted_json}" | jq 'reduce .people[] as $person ({}; .[$person.id | tostring] = $person)')

# Generate the checksum for the transformed content using SHA-256
checksum=$(echo "$transformed_json" | sha256sum | cut -d ' ' -f 1)

# Append the checksum to the transformed JSON content
transformed_json_with_checksum=$(echo "$transformed_json" | jq --arg checksum "$checksum" '. + {checksum: $checksum}')

# Save the transformed JSON with the checksum
echo "$transformed_json_with_checksum" > "$output_file"

# Print the saved file path
echo "Saved active players JSON to: ${output_file}"
