$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyQGV4YW1wbGUuY29tIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwicm9sZSI6IkVtcGxveWVlIiwiaWF0IjoxNzUyNDk4ODk5LCJleHAiOjE3NTI1MDI0OTl9.rYOWxtAp0wDRLtLn9ROkVEX3WauQQnZUF9ewlFk6F7s"

$headers = @{
    "Authorization" = "Bearer $token"
}

$deskId = "24f72a93-0451-4582-ad34-d6ab3163b474"
$date = (Get-Date).AddDays(2).ToString("yyyy-MM-dd")

$body = @{
    deskId = $deskId
    date = $date
}

Invoke-RestMethod -Uri "http://localhost:3003/desks/bookings" -Method Post -Headers $headers -ContentType "application/json" -Body ($body | ConvertTo-Json)