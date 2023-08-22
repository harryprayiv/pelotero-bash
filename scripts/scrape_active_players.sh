#!/usr/bin/env bash

# Set the current date and time
current_datetime=$(date +%Y_%m_%d_%H_%M)

# Set the output folder and create it if it doesn't exist
output_folder="scrapedData"
mkdir -p "$output_folder"

# Set the output file name
output_file="${output_folder}/activePlayers.json"
backup_file="${output_folder}/activePlayers_OLD_${current_datetime}.json"

# If the output file already exists, rename it to the backup file
if [[ -f "$output_file" ]]; then
    mv "$output_file" "$backup_file"
fi

# Download the JSON file
url="https://statsapi.mlb.com/api/v1/sports/1/players?activeStatus=ACTIVE&season=2023"
raw_json=$(curl -s "$url")

# Transform the JSON structure and filter out the necessary data
sorted_json=$(echo "$raw_json" | jq '[.people[] | {id, useName, useLastName, nameSlug, currentTeam: {id: .currentTeam.id}, primaryPosition: {code: .primaryPosition.code, abbreviation: .primaryPosition.abbreviation}, batSide: {code: .batSide.code}, pitchHand: {code: .pitchHand.code}, active}]')
transformed_json=$(echo "{\"people\": $sorted_json}" | jq 'reduce .people[] as $person ({}; .[$person.id | tostring] = $person)')

# Generate the checksum for the transformed content using SHA-256
checksum=$(echo "$transformed_json" | sha256sum | cut -d ' ' -f 1)

# Append the date the list was pulled and the checksum to the transformed JSON content
transformed_json_with_metadata=$(echo "$transformed_json" | jq --arg checksum "$checksum" --arg datetime "$current_datetime" '. + {dataPulled: $datetime, checksum: $checksum}')

# Save the transformed JSON with the metadata
echo "$transformed_json_with_metadata" > "$output_file"

# Print the saved file path
echo "Saved active players JSON to: ${output_file}"
