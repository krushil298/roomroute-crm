#!/bin/bash

# We need to find the service ID first, then add the custom domain
# Since the Railway token doesn't work for GraphQL, let's try the REST API

echo "Adding custom domain roomroute.org to Railway..."
echo ""
echo "⚠️  Note: This requires Railway CLI or API access."
echo "Since we can't use the CLI, you need to add it manually:"
echo ""
echo "1. Go to: https://railway.app/project"
echo "2. Click on your 'roomroute-crm' project"
echo "3. Click on the service (node app)"
echo "4. Go to Settings tab"
echo "5. Scroll down to 'Domains'"
echo "6. Click 'Add Domain'"
echo "7. Enter: roomroute.org"
echo "8. Railway will generate an SSL certificate"
echo ""
echo "OR use Railway CLI:"
echo "railway domain add roomroute.org"
