#!/bin/bash

echo "🔍 Checking roomroute.org domain status..."
echo ""
echo "="
echo "1. Checking Nameservers"
echo "="
echo "Expected: ashton.ns.cloudflare.com and samara.ns.cloudflare.com"
echo "Current:"
dig +short NS roomroute.org
echo ""

echo "="
echo "2. Checking DNS Resolution (A/CNAME records)"
echo "="
dig +short roomroute.org
echo ""

echo "="
echo "3. Checking Cloudflare Zone Status"
echo "="
curl -s -X GET 'https://api.cloudflare.com/client/v4/zones/a952915df130f72c9365e98eb97e407b' \
  -H 'Authorization: Bearer q_793Mn0fwwOWHwFxOHvwelpXrspKQptRao085EJ' | jq -r '.result.status'
echo ""

echo "="
echo "4. Testing HTTP/HTTPS Access"
echo "="
echo "HTTP Test:"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://roomroute.org 2>/dev/null || echo "Failed to connect"
echo ""
echo "HTTPS Test:"
curl -s -o /dev/null -w "Status: %{http_code}\n" https://roomroute.org 2>/dev/null || echo "Failed to connect"
echo ""

echo "="
echo "5. SSL Certificate Check"
echo "="
echo | openssl s_client -servername roomroute.org -connect roomroute.org:443 2>/dev/null | openssl x509 -noout -subject -issuer 2>/dev/null || echo "No SSL certificate yet"
echo ""

echo "✅ Check complete!"
echo ""
echo "If status is 'pending', wait a few minutes and run this script again."
echo "If status is 'active', your domain is LIVE!"
