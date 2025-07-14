$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyQGV4YW1wbGUuY29tIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwicm9sZSI6IkVtcGxveWVlIiwiaWF0IjoxNzUyNDk4ODk5LCJleHAiOjE3NTI1MDI0OTl9.rYOWxtAp0wDRLtLn9ROkVEX3WauQQnZUF9ewlFk6F7s"

$headers = @{
    "Authorization" = "Bearer $token"
}

$roomId = "1d452f44-4e32-4102-ac77-14091a2bcb75"
$startTime = (Get-Date).AddDays(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
$endTime = (Get-Date).AddDays(1).AddHours(1).ToString("yyyy-MM-ddTHH:mm:ssZ")

$body = @{
    roomId = $roomId
    startTime = $startTime
    endTime = $endTime
}

Invoke-RestMethod -Uri "http://localhost:3002/rooms/bookings" -Method Post -Headers $headers -ContentType "application/json" -Body ($body | ConvertTo-Json)