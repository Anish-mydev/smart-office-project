$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbkBleGFtcGxlLmNvbSIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiQWRtaW4iLCJpYXQiOjE3NTI0OTcxNzcsImV4cCI6MTc1MjUwMDc3N30.6sRWUPbhP6IvKf5pZVsqAlTJBBOqA1Vbjn3nBQFdEjE"

$headers = @{
    "Authorization" = "Bearer $token"
}

$deskId = "13f12ec9-863a-4311-8515-005c2f6c710e"

Invoke-RestMethod -Uri "http://localhost:3003/desks/$deskId" -Method Delete -Headers $headers