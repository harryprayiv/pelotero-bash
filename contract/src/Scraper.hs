module Scraper where
{-# LANGUAGE OverloadedStrings #-}

import Control.Monad (when, forM)
import Data.Aeson
import Data.Aeson.Lens (_Object, key, _Array, _String, _Bool)
import Data.Time
import qualified Data.HashMap.Strict as HM
import Network.HTTP.Client
import Network.HTTP.Client.TLS (tlsManagerSettings)


fetchGameData :: UTCTime -> UTCTime -> IO ()
fetchGameData start end = do
    manager <- newManager tlsManagerSettings
    go start
  where
    go currentDate
        | currentDate > end = pure ()
        | otherwise = do
            gameData <- getGameData manager currentDate
            print gameData -- Do whatever you need with gameData
            go (addUTCTime (fromIntegral (24*60*60)) currentDate)  -- Move to the next day

getGameData :: Manager -> UTCTime -> IO (Maybe Value)
getGameData manager date = do
    initialRequest <- parseRequest $ "https://statsapi.mlb.com/api/v1/schedule/games/?language=en&sportId=1&startDate=" ++ formatTime defaultTimeLocale "%Y-%m-%d" date
    response <- httpLbs initialRequest manager
    let jsonBody = responseBody response
    case eitherDecode jsonBody of
        Left err -> putStrLn err >> pure Nothing
        Right json -> flattenGameData json

flattenGameData :: Value -> IO (Maybe Value)
flattenGameData jsonData = do
    -- Implement the flattenGameData logic here similar to the Bash function
    -- You'll likely want to manipulate the JSON structure using Aeson's functionality
    -- The Bash script used `jq`, but Aeson provides a Haskell-native way to work with JSON.
    -- You can extract values, modify them, and create new JSON structures.
    pure Nothing  -- Replace with actual implementation