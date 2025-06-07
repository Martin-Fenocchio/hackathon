#!/bin/bash

# Load environment variables
source .env

curl --location --request POST 'http://localhost:8080/transfers/confirm_last_pending_transfer' \
--header 'Content-Type: application/json' \
--data '{
    "telephone": "'$USER_TELEPHONE'"
}'
