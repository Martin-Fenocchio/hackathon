#!/bin/bash

# Load environment variables
source .env

curl --location 'http://localhost:8080/users' \
--header 'Content-Type: application/json' \
--data '{
    "telephone": "'$USER_TELEPHONE'",
    "privatekey": "your-private-key-here",
    "publickey": "your-public-key-here"
}' 