$url = "http://localhost:3000/api/health"
$count = 0
$limit = 110

Write-Host "Testing Rate Limit on $url..."

for ($i = 1; $i -le $limit; $i++) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method Get -ErrorAction Stop
        $remaining = $response.Headers["X-RateLimit-Remaining"]
        Write-Host "Request $i - Status: $($response.StatusCode) - Remaining: $remaining"
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        if ($status -eq 429) {
            Write-Host "Request $i - BLOCKED (Status: 429) - SUCCESS: Rate Limit Triggered!" -ForegroundColor Green
            $triggered = $true
            break
        } else {
            Write-Host "Request $i - Error: $($_.Exception.Message)"
        }
    }
    # Small delay to prevent network exhaustion, but fast enough to hit limit
    Start-Sleep -Milliseconds 50
}

if (-not $triggered) {
    Write-Host "FAILED: Rate limit was not triggered after $limit requests." -ForegroundColor Red
}
