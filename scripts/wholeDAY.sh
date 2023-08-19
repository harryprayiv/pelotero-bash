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

flattenGameData() {
  local game_data="$1"
  local game_id="$3"

  jq --arg game_id "$game_id" '
    [
      .teams.away.players as $away_players |
      .teams.home.players as $home_players |
      ($away_players + $home_players) |
      to_entries[] |
      select(.value.allPositions != null) |
      {(.value.person.id | tostring): {
        id: .value.person.id,
        fullName: .value.person.fullName,
        stats: {
          ($game_id): {
            parentTeamId: .value.parentTeamId,
            allPositions: [.value.allPositions[] | .code | tonumber],
            status: .value.status.code,
            batting: (if .value.stats.batting != null then .value.stats.batting | del(.note, .summary, .stolenBasePercentage, .atBatsPerHomeRun) else null end),
            pitching: (if .value.stats.pitching != null then .value.stats.pitching | del(.note, .summary, .stolenBasePercentage, .strikePercentage, .homeRunsPer9, .runsScoredPer9) else null end)
          }
        }
      }}
    ] | add
  ' <<< "$game_data"
}

while [ "$current_ts" -le "$end_ts" ]; do
  echo "Processing $current_date"

  # Create a folder for the current date
  output_folder="scrapedData"
  mkdir -p "$output_folder"

  # Fetch the JSON file with the game data
  api_url="https://statsapi.mlb.com/api/v1/schedule/games/?language=en&sportId=1&startDate=$current_date&endDate=$current_date"
  game_data_json=$(curl -s "$api_url")

  # Check if there are games for the current date
  has_games=$(echo "$game_data_json" | jq '.dates[0].games != null')

  if [ "$has_games" == "true" ]; then
    # Extract game IDs from the JSON file
    game_ids=$(echo "$game_data_json" | jq '.dates[0].games[].gamePk' | tr '\n' ' ')

    # Initialize an empty object for storing the day's summed data
    day_summed_data="{}"
    declare -A incomplete_games=()

    for game_id in $game_ids; do
      # Check the game status
      game_status_json=$(curl -s "https://statsapi.mlb.com//api/v1.1/game/$game_id/feed/live")
      game_status=$(echo "$game_status_json" | jq -r '.gameData.status.codedGameState')

      # Download and compress game data for the current date if the game status is "F"
      if [ "$game_status" == "F" ]; then
        game_data=$(curl -s "http://statsapi.mlb.com/api/v1/game/$game_id/boxscore")
        compressed_data=$(flattenGameData "$game_data" "" "$game_id")

        # Merge the compressed game data with the day's summed data
        day_summed_data=$(jq -s 'reduce .[] as $item ({}; . * $item)' <(echo "$day_summed_data") <(echo "$compressed_data"))
      else
        incomplete_games["$game_id"]="$game_status"
      fi
    done

    # Generate JSON string from the incomplete_games associative array
    incomplete_json="{"
    first=1
    for key in "${!incomplete_games[@]}"; do
      if [ "$first" -ne 1 ]; then
        incomplete_json+=","
      fi
      incomplete_json+="\"$key\":\"${incomplete_games[$key]}\""
      first=0
    done
    incomplete_json+="}"
    day_summed_data=$(jq -s 'reduce .[] as $item ({}; . * $item)' <(echo "$day_summed_data") <(echo "{\"incomplete\": $incomplete_json}"))

    # Generate the checksum for the content using SHA-256
    checksum=$(echo "$day_summed_data" | sha256sum | cut -d ' ' -f 1)

    # Append the checksum to the JSON content
    day_summed_data=$(echo "$day_summed_data" | jq --arg checksum "$checksum" '. + {checksum: $checksum}')

    # Save the day's summed data in the current date's folder without checksum in the filename
    summed_file="$output_folder/$(date -d "$current_date" +%Y_%m_%d)_SUMMED.json"
    echo "$day_summed_data" > "$summed_file"
  else
    echo "No games found for $current_date"
  fi

  # Move to the next day
  current_date=$(date -I -d "$current_date + 1 day")
  current_ts=$(date -d "$current_date" +%s)
done
