#!/bin/bash

# Add CNAME record for roomroute.org pointing to Railway
curl -X POST 'https://api.cloudflare.com/client/v4/zones/a952915df130f72c9365e98eb97e407b/dns_records' \
  -H 'Authorization: Bearer q_793Mn0fwwOWHwFxOHvwelpXrspKQptRao085EJ' \
  -H 'Content-Type: application/json' \
  -d '{"type":"CNAME","name":"@","content":"roomroute-crm-production-dd6e.up.railway.app","ttl":1,"proxied":true}'
