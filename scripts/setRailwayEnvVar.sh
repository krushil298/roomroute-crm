#!/bin/bash

# Script to set APP_URL environment variable in Railway
# This fixes the invitation email link issue

echo "Setting APP_URL environment variable in Railway..."
echo ""
echo "You need to add this environment variable in Railway dashboard:"
echo ""
echo "Variable Name:  APP_URL"
echo "Variable Value: https://www.roomroute.org"
echo ""
echo "Steps:"
echo "1. Go to: https://railway.app/"
echo "2. Click on 'roomroute-crm' project"
echo "3. Click on your service (Node.js app)"
echo "4. Go to 'Variables' tab"
echo "5. Click 'New Variable'"
echo "6. Name: APP_URL"
echo "7. Value: https://www.roomroute.org"
echo "8. Click 'Add'"
echo "9. Railway will automatically redeploy your app"
echo ""
echo "After adding the variable, invitation emails will link to www.roomroute.org!"
