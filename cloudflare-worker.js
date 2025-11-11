// Cloudflare Worker to proxy roomroute.org to Railway
// This fixes the "Application not found" error by setting the correct Host header

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Clone the request and modify the Host header
  const url = new URL(request.url)

  // Replace the hostname with Railway's domain
  url.hostname = 'roomroute-crm-production-dd6e.up.railway.app'

  // Create new request with modified URL and headers
  const modifiedRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'follow'
  })

  // Set the Host header to Railway's domain
  modifiedRequest.headers.set('Host', 'roomroute-crm-production-dd6e.up.railway.app')

  // Forward the request to Railway
  const response = await fetch(modifiedRequest)

  // Return the response
  return response
}
