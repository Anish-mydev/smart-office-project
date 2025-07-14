$body = @{
    email = "user@example.com"
    password = "password123"
}

$response = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -ContentType "application/json" -Body ($body | ConvertTo-Json)

$token = $response.token
Write-Host "Full JWT Token: $token"