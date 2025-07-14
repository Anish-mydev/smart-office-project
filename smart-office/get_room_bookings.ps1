$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyQGV4YW1wbGUuY29tIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwicm9sZSI6IkVtcGxveWVlIiwiaWF0IjoxNzUyNDk4ODk5LCJleHAiOjE3NTI1MDI0OTl9.rYOWxtAp0wDRLtLn9ROkVEX3WauQQnZUF9ewlFk6F7s"

$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3002/rooms/bookings" -Method Get -Headers $headers