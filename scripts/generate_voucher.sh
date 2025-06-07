#!/bin/bash

# Load environment variables
source .env

curl --location --request POST 'http://localhost:8080/voucher/generate' \
--header 'Content-Type: application/json' \
--data '{
    "telephone": "'$USER_TELEPHONE'",
    "amount": 5,
    "destination_publickey": "0x1234567890abcdef",
    "transferid": "TRANSFER123",
    "created_at": "2024-03-20T12:00:00Z"
}' \
--output 'transfer-voucher.png' 