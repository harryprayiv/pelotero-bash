#!/usr/bin/env bash

# Set the input and output files
input_file="scrapedData/activePlayers.json"
output_file="scrapedData/activePlayers_sorted.json"

# Check if the input file exists
if [[ ! -f "$input_file" ]]; then
    echo "Input file not found!"
    exit 1
fi

# Sort players based on the 'id' field, filtering out entries that don't have the "id" key
sorted_players=$(jq 'to_entries | map(select(.value.id?)) | sort_by(.value.id) | from_entries' "$input_file")

# Merge the sorted players back into the original structure
sorted_json=$(jq --argjson sorted "$sorted_players" '.people = $sorted' "$input_file")

# Save the sorted JSON to the new output file
echo "$sorted_json" > "$output_file"

echo "Saved sorted active players JSON to: ${output_file}"
