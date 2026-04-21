$port = 8081
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "Servidor web iniciado. Abre tu navegador en: http://localhost:$port/"
Write-Host "Presiona Ctrl+C para detenerlo."

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath
        if ($localPath -eq "/") { $localPath = "/index.html" }
        
        $filePath = Join-Path (Get-Location) $localPath.Replace('/', '\')
        
        if (Test-Path $filePath -PathType Leaf) {
            try {
                $content = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $content.Length
                
                if ($filePath -match "\.css$") { 
                    $response.ContentType = "text/css" 
                }
                elseif ($filePath -match "\.js$") { 
                    $response.ContentType = "application/javascript" 
                }
                elseif ($filePath -match "\.html$") { 
                    $response.ContentType = "text/html" 
                }
                elseif ($filePath -match "\.mp4$") { 
                    $response.ContentType = "video/mp4" 
                }
                
                $response.OutputStream.Write($content, 0, $content.Length)
            } catch {
                $response.StatusCode = 500
            }
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
}
