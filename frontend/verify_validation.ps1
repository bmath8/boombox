$baseUrl = "http://localhost:3000/api"

function Test-Endpoint ($url, $expectedStatus, $desc) {
    Write-Host "Testing $desc ($url)..." -NoNewline
    try {
        $response = Invoke-WebRequest -Uri $url -Method Get -ErrorAction Stop
        $status = $response.StatusCode
    }
    catch {
        $status = $_.Exception.Response.StatusCode.value__
        if ($null -eq $status) { $status = 500 } # Fallback
    }

    if ($status -eq $expectedStatus) {
        Write-Host " [PASS] (Got $status)" -ForegroundColor Green
    }
    else {
        Write-Host " [FAIL] (Expected $expectedStatus, Got $status)" -ForegroundColor Red
    }
}

# 1. Search Query Validation
Test-Endpoint "$baseUrl/search?q=" 400 "Empty Search Query"
Test-Endpoint "$baseUrl/search?q=valid" 401 "Valid Query (Unauth)" # Expect 401 because we aren't logged in via script

# 2. Spotify Search Validation
Test-Endpoint "$baseUrl/spotify/search?q=" 400 "Empty Spotify Query"

# 3. Spotify Playlist Tracks Validation
Test-Endpoint "$baseUrl/spotify/playlists/invalid-id/tracks" 400 "Invalid Playlist ID"
