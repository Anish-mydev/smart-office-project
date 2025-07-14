$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyQGV4YW1wbGUuY29tIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwicm9sZSI6IkVtcGxveWVlIiwiaWF0IjoxNzUyNDk4ODk5LCJleHAiOjE3NTI1MDI0OTl9.rYOWxtAp0wDRLtLn9ROkVEX3WauQQnZUF9ewlFk6F7s"

$headers = @{
    "Authorization" = "Bearer $token"
}

$bookingId = "a3b20f83-0afb-46dc-a05c-aa64a06ef5f9"

Invoke-RestMethod -Uri "http://localhost:3003/desks/bookings/$bookingId" -Method Delete -Headers $headers