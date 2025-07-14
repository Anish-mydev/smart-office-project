$body = @{
    email = "admin@example.com"
    password = "adminpassword"
    name = "Admin User"
}

Invoke-RestMethod -Uri "http://localhost:3001/auth/register-admin" -Method Post -ContentType "application/json" -Body ($body | ConvertTo-Json)