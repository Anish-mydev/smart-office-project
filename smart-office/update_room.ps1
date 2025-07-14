$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbkBleGFtcGxlLmNvbSIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiQWRtaW4iLCJpYXQiOjE3NTI0OTcxNzcsImV4cCI6MTc1MjUwMDc3N30.6sRWUPbhP6IvKf5pZVsqAlTJBBOqA1Vbjn3nBQFdEjE"

$headers = @{
    "Authorization" = "Bearer $token"
}

$roomId = "ee3a2e6f-dd9d-4b32-b598-ac450e7c6f54"

$body = @{
    roomName = "Conference Room Beta"
    capacity = 12
}

Invoke-RestMethod -Uri "http://localhost:3002/rooms/$roomId" -Method Put -Headers $headers -ContentType "application/json" -Body ($body | ConvertTo-Json)