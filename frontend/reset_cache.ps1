# Reset Next.js Cache and Restart Dev Server
Write-Host "Cleaning Next.js cache..."
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules/.cache" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Cache cleaned. Starting dev server..."
npm run dev
