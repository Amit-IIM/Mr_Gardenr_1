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

# --- Authentication and Security Globals & Helpers ---
$global:Sessions = @{}       # SessionId -> DateTime (LastActive)
$global:LoginAttempts = @{}  # IPAddress -> @{ Count = Int; LockoutTime = DateTime }

function Get-Sha256Hash ($string) {
    if ([string]::IsNullOrEmpty($string)) { return "" }
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($string)
    $sha = [System.Security.Cryptography.SHA256]::Create()
    $hashBytes = $sha.ComputeHash($bytes)
    $sha.Dispose()
    $hashString = [System.BitConverter]::ToString($hashBytes) -replace "-"
    return $hashString.ToLower()
}

function Get-SessionId ($ctx) {
    $cookieHeader = $ctx.Request.Headers["Cookie"]
    if ($cookieHeader) {
        $cookies = $cookieHeader.Split(";")
        foreach ($cookie in $cookies) {
            $parts = $cookie.Trim().Split("=", 2)
            if ($parts.Length -eq 2 -and $parts[0] -eq "SessionId") {
                return $parts[1]
            }
        }
    }
    return $null
}

function Is-SessionValid ($sessionId) {
    if ([string]::IsNullOrEmpty($sessionId)) { return $false }
    if ($global:Sessions.ContainsKey($sessionId)) {
        $lastActive = $global:Sessions[$sessionId]
        $now = Get-Date
        if (($now - $lastActive).TotalMinutes -le 30) {
            # Update the last active timestamp to slide the session window
            $global:Sessions[$sessionId] = $now
            return $true
        } else {
            # Session expired
            $global:Sessions.Remove($sessionId) | Out-Null
        }
    }
    return $false
}

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

        # Enforce Protected Route Middleware check
        $isPublicApi = ($path -eq "/api/login") -or 
                       ($path -eq "/api/logout") -or 
                       ($path -eq "/api/session-check") -or 
                       ($path -eq "/api/content" -and $ctx.Request.HttpMethod -eq "GET")

        if (-not $isPublicApi) {
            $sid = Get-SessionId $ctx
            if (-not (Is-SessionValid $sid)) {
                $ctx.Response.StatusCode = 401
                $ctx.Response.ContentType = "application/json"
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"error":"Unauthorized. Invalid or expired session."}')
                $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
                $ctx.Response.Close()
                continue
            }
        }

        # Authentication Endpoints
        if ($path -eq "/api/login" -and $ctx.Request.HttpMethod -eq "POST") {
            $ip = $ctx.Request.RemoteEndPoint.Address.ToString()
            $now = Get-Date

            # Lockout Check
            if ($global:LoginAttempts.ContainsKey($ip)) {
                $attempt = $global:LoginAttempts[$ip]
                if ($attempt.Count -ge 5) {
                    $elapsed = ($now - $attempt.LockoutTime).TotalSeconds
                    $remaining = 900 - $elapsed
                    if ($remaining -gt 0) {
                        $ctx.Response.StatusCode = 429
                        $ctx.Response.ContentType = "application/json"
                        $msg = '{"error":"Too many failed attempts. Locked out. Try again in ' + [Math]::Ceiling($remaining / 60) + ' minutes."}'
                        $bytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
                        $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
                        $ctx.Response.Close()
                        continue
                    } else {
                        # Lockout expired
                        $global:LoginAttempts.Remove($ip) | Out-Null
                    }
                }
            }

            try {
                $reader = New-Object System.IO.StreamReader($ctx.Request.InputStream, [System.Text.Encoding]::UTF8)
                $body = $reader.ReadToEnd()
                $reader.Close()
                
                $loginData = $body | ConvertFrom-Json
                $username = $loginData.username
                $password = $loginData.password

                $expectedUsername = if ($env:ADMIN_USERNAME) { $env:ADMIN_USERNAME } else { "admin" }
                $expectedHash = if ($env:ADMIN_PASSWORD_HASH) { $env:ADMIN_PASSWORD_HASH } else { "9261a86851b2f7035a78622c10b427d14217fa3561c28c8959f635678a594895" }

                $inputHash = Get-Sha256Hash $password

                if ($username -eq $expectedUsername -and $inputHash -eq $expectedHash) {
                    if ($global:LoginAttempts.ContainsKey($ip)) {
                        $global:LoginAttempts.Remove($ip) | Out-Null
                    }

                    $guid = [System.Guid]::NewGuid().ToString()
                    $global:Sessions[$guid] = $now

                    $ctx.Response.AddHeader("Set-Cookie", "SessionId=$guid; Path=/; HttpOnly; SameSite=Strict")
                    
                    $ctx.Response.StatusCode = 200
                    $ctx.Response.ContentType = "application/json"
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":true,"message":"Login successful"}')
                    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
                } else {
                    if (-not $global:LoginAttempts.ContainsKey($ip)) {
                        $global:LoginAttempts[$ip] = @{ Count = 1; LockoutTime = $null }
                    } else {
                        $attempt = $global:LoginAttempts[$ip]
                        $attempt.Count++
                        if ($attempt.Count -ge 5) {
                            $attempt.LockoutTime = $now
                        }
                        $global:LoginAttempts[$ip] = $attempt
                    }

                    $failedCount = $global:LoginAttempts[$ip].Count
                    $remainingAttempts = 5 - $failedCount
                    
                    $ctx.Response.StatusCode = 401
                    $ctx.Response.ContentType = "application/json"
                    if ($remainingAttempts -gt 0) {
                        $msg = '{"error":"Invalid username or password. ' + $remainingAttempts + ' attempts remaining."}'
                    } else {
                        $msg = '{"error":"Too many failed attempts. Locked out for 15 minutes."}'
                    }
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
                    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
                }
            } catch {
                $ctx.Response.StatusCode = 400
                $ctx.Response.ContentType = "application/json"
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"error":"Invalid request payload."}')
                $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            $ctx.Response.Close()
            continue
        }
        elseif ($path -eq "/api/logout" -and $ctx.Request.HttpMethod -eq "POST") {
            $sid = Get-SessionId $ctx
            if ($sid -and $global:Sessions.ContainsKey($sid)) {
                $global:Sessions.Remove($sid) | Out-Null
            }
            $ctx.Response.AddHeader("Set-Cookie", "SessionId=; Path=/; HttpOnly; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT")
            $ctx.Response.StatusCode = 200
            $ctx.Response.ContentType = "application/json"
            $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"success":true}')
            $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
            $ctx.Response.Close()
            continue
        }
        elseif ($path -eq "/api/session-check" -and $ctx.Request.HttpMethod -eq "GET") {
            $sid = Get-SessionId $ctx
            if (Is-SessionValid $sid) {
                $ctx.Response.StatusCode = 200
                $ctx.Response.ContentType = "application/json"
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"authenticated":true}')
                $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $ctx.Response.StatusCode = 401
                $ctx.Response.ContentType = "application/json"
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('{"authenticated":false}')
                $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
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

