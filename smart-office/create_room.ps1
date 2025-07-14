$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbkBleGFtcGxlLmNvbSIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiQWRtaW4iLCJpYXQiOjE3NTI0OTcxNzcsImV4cCI6MTc1MjUwMDc3N30.6sRWUPbhP6IvKf5pZVsqAlTJBBOqA1Vbjn3nBQFdEjE"

$headers = @{
    "Authorization" = "Bearer $token"
}

$body = @{
    roomName = "Conference Room Alpha"
    capacity = 10
}

Invoke-RestMethod -Uri "http://localhost:3002/rooms" -Method Post -Headers $headers -ContentType "application/json" -Body ($body | ConvertTo-Json)