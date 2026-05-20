# Load environment variables from .env file
$envFilePath = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFilePath) {
    Get-Content $envFilePath | Foreach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line.Split("=", 2)
            if ($parts.Length -eq 2) {
                $key = $parts[0].Trim()
                $value = $parts[1].Trim()
                # Remove surrounding quotes if any
                if ($value.StartsWith('"') -and $value.EndsWith('"')) {
                    $value = $value.Substring(1, $value.Length - 2)
                } elseif ($value.StartsWith("'") -and $value.EndsWith("'")) {
                    $value = $value.Substring(1, $value.Length - 2)
                }
                [System.Environment]::SetEnvironmentVariable($key, $value)
            }
        }
    }
}

# Resolve variables from environment or use smart defaults
$port = if ($env:PORT) { $env:PORT } else { "8080" }
$appRoot = if ($env:APP_ROOT) { $env:APP_ROOT } else { $PSScriptRoot }
$dbPath = if ($env:DB_PATH) { $env:DB_PATH } else { Join-Path $appRoot "data\content.json" }
$imgPath = if ($env:IMAGE_DIR) { $env:IMAGE_DIR } else { Join-Path $appRoot "images" }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Server running at http://localhost:$port/"

while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $path = $ctx.Request.Url.LocalPath

    # Intercept API calls
    if ($path.StartsWith("/api/")) {
        $ctx.Response.AddHeader("Access-Control-Allow-Origin", "*")
        $ctx.Response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $ctx.Response.AddHeader("Access-Control-Allow-Headers", "Content-Type")

        if ($ctx.Request.HttpMethod -eq "OPTIONS") {
            $ctx.Response.StatusCode = 200
            $ctx.Response.Close()
            continue
        }

        if ($path -eq "/api/content" -and $ctx.Request.HttpMethod -eq "GET") {
            if (Test-Path $dbPath) {
                $bytes = [System.IO.File]::ReadAllBytes($dbPath)
                $ctx.Response.ContentType = "application/json"
                $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $ctx.Response.StatusCode = 404
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"error":"File not found"}')
                $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        }
        elseif ($path -eq "/api/content" -and $ctx.Request.HttpMethod -eq "POST") {
            $dbDir = [System.IO.Path]::GetDirectoryName($dbPath)
            if (-not (Test-Path $dbDir)) {
                New-Item -ItemType Directory -Force -Path $dbDir | Out-Null
            }
            $fileStream = [System.IO.File]::Create($dbPath)
            $ctx.Request.InputStream.CopyTo($fileStream)
            $fileStream.Close()
            
            $ctx.Response.ContentType = "application/json"
            $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":true}')
            $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        elseif ($path -eq "/api/upload" -and $ctx.Request.HttpMethod -eq "POST") {
            $filename = $ctx.Request.QueryString["filename"]
            if ($filename) {
                if (-not (Test-Path $imgPath)) {
                    New-Item -ItemType Directory -Force -Path $imgPath | Out-Null
                }
                $fullPath = Join-Path $imgPath $filename
                $fileStream = [System.IO.File]::Create($fullPath)
                $ctx.Request.InputStream.CopyTo($fileStream)
                $fileStream.Close()

                $ctx.Response.ContentType = "application/json"
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":true,"url":"images/' + $filename + '"}')
                $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $ctx.Response.StatusCode = 400
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"error":"Missing filename"}')
                $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        }
        elseif ($path -eq "/api/git-push" -and $ctx.Request.HttpMethod -eq "POST") {
            try {
                $msg = "CMS update: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
                git add .
                git commit -m $msg
                git push origin main
                
                $ctx.Response.ContentType = "application/json"
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":true,"message":"Successfully pushed to GitHub"}')
                $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
            } catch {
                $ctx.Response.StatusCode = 500
                $err = $_.Exception.Message -replace '"','\"'
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":false,"error":"' + $err + '"}')
                $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        }
        else {
            $ctx.Response.StatusCode = 404
            $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"error":"Not Found"}')
            $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        $ctx.Response.Close()
        continue
    }

    if ($path -eq "/") { $path = "/index.html" }
    $file = Join-Path $appRoot ($path -replace "/","\")
    
    if (Test-Path $file) {
        $bytes = [System.IO.File]::ReadAllBytes($file)
        $ext = [System.IO.Path]::GetExtension($file)
        $mime = switch($ext) {
            ".html" { "text/html" }
            ".css"  { "text/css" }
            ".js"   { "application/javascript" }
            ".json" { "application/json" }
            ".png"  { "image/png" }
            ".jpg"  { "image/jpeg" }
            ".svg"  { "image/svg+xml" }
            default { "application/octet-stream" }
        }
        $ctx.Response.ContentType = $mime
        $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $ctx.Response.StatusCode = 404
        $bytes = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
        $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
    $ctx.Response.Close()
}

