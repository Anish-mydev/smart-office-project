$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyQGV4YW1wbGUuY29tIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwicm9sZSI6IkVtcGxveWVlIiwiaWF0IjoxNzUyNDk4ODk5LCJleHAiOjE3NTI1MDI0OTl9.rYOWxtAp0wDRLtLn9ROkVEX3WauQQnZUF9ewlFk6F7s"

$headers = @{
    "Authorization" = "Bearer $token"
}

$bookingId = "c53e3002-7fe5-4891-ad00-1ec9b0a9d4ea"

Invoke-RestMethod -Uri "http://localhost:3002/rooms/bookings/$bookingId" -Method Delete -Headers $headers