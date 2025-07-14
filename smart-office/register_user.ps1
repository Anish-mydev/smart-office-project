$body = @{
    email = "user@example.com"
    password = "password123"
    name = "Regular User"
}

Invoke-RestMethod -Uri "http://localhost:3001/auth/register" -Method Post -ContentType "application/json" -Body ($body | ConvertTo-Json)