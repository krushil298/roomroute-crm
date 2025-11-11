#!/bin/bash

# Railway API endpoint
API_URL="https://backboard.railway.app/graphql/v2"
TOKEN="c1728d2f-9399-4d07-90e4-8673c0b9ec68"

# First, get the service ID
echo "Getting service information..."
SERVICE_QUERY='{"query":"query { me { projects { edges { node { id name services { edges { node { id name } } } } } } } }"}'

RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$SERVICE_QUERY")

echo "$RESPONSE" | jq '.'
