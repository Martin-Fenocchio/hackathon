#!/bin/bash

# Load environment variables
source .env

curl --location 'http://localhost:8080/orchestrator/orchestrate' \
--header 'Content-Type: application/json' \
--data '{
    "text": "Send 5 SOL to Andres",
    "userTelephone": "'$USER_TELEPHONE'"
}'
