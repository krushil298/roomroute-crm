#!/bin/bash

# Railway GraphQL API to add custom domain
API_URL="https://backboard.railway.app/graphql/v2"
TOKEN="c1728d2f-9399-4d07-90e4-8673c0b9ec68"

# First, we need to get the service ID
echo "Step 1: Getting service information..."

# Query to get projects and services
QUERY='{"query":"query { projects { edges { node { id name services { edges { node { id name } } } } } } }"}'

RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$QUERY")

echo "Response: $RESPONSE" | jq .

# Check if we got an error
if echo "$RESPONSE" | jq -e '.errors' > /dev/null 2>&1; then
  echo ""
  echo "❌ Authentication failed with Railway API"
  echo ""
  echo "You need to add the domain manually in Railway dashboard:"
  echo ""
  echo "1. Go to: https://railway.app/"
  echo "2. Login to your account"
  echo "3. Click on 'roomroute-crm' project"
  echo "4. Click on the service (Node.js app)"
  echo "5. Go to 'Settings' tab"
  echo "6. Find 'Domains' section"
  echo "7. Click 'Custom Domain' or 'Generate Domain'"
  echo "8. Enter: roomroute.org"
  echo "9. Click 'Add Domain'"
  echo ""
  echo "Railway will automatically generate an SSL certificate!"
  exit 1
fi

echo ""
echo "✅ If you see project data above, we can proceed to add the domain"
