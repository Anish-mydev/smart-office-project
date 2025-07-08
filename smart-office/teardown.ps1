# This script destroys all AWS resources created by the project.

# Stop script on error
$ErrorActionPreference = "Stop"

Write-Host "Tearing down the CDK stack..."
Set-Location -Path ./cdk
cdk destroy --force
Set-Location -Path ..

Write-Host "Tear down complete!"
