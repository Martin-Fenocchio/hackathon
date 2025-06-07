#!/bin/bash

# Load environment variables
source .env

# Create first contact
curl --location 'http://localhost:8080/contacts' \
--header 'Content-Type: application/json' \
--data '{
    "id": 1,
    "user_telephone": "'$USER_TELEPHONE'",
    "name": "Hugo",
    "publickey": "some-public-key-3"
}'

# Create second contact
curl --location 'http://localhost:8080/contacts' \
--header 'Content-Type: application/json' \
--data '{
    "id": 2,
    "user_telephone": "'$USER_TELEPHONE'",
    "name": "Andres",
    "publickey": "some-public-key-4"
}' 