$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:7000/")
$listener.Start()
Write-Output "Server running on http://localhost:7000/"

$root = "F:\cx\src\garden-sandbox"
$mimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".js" = "application/javascript"
  ".css" = "text/css"
  ".json" = "application/json"
  ".png" = "image/png"
  ".jpg" = "image/jpeg"
  ".svg" = "image/svg+xml"
  ".ico" = "image/x-icon"
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $path = $req.Url.AbsolutePath
  if ($path -eq "/") { $path = "/index.html" }
  $filePath = Join-Path $root $path.TrimStart("/")
  
  if (Test-Path $filePath -PathType Leaf) {
    $ext = [IO.Path]::GetExtension($filePath)
    $mime = $mimeTypes[$ext]
    if (-not $mime) { $mime = "application/octet-stream" }
    $bytes = [IO.File]::ReadAllBytes($filePath)
    $ctx.Response.ContentType = $mime
    $ctx.Response.ContentLength64 = $bytes.Length
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $ctx.Response.StatusCode = 404
    $msg = [Text.Encoding]::UTF8.GetBytes("404 Not Found")
    $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
  }
  $ctx.Response.Close()
}
