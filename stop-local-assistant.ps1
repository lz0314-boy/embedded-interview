$ErrorActionPreference = "SilentlyContinue"
$ports = @(8000, 8787)
foreach ($port in $ports) {
    $listeners = Get-NetTCPConnection -State Listen -LocalPort $port
    foreach ($listener in $listeners) {
        Stop-Process -Id $listener.OwningProcess -Force
        Write-Host "已停止端口 $port 的本地服务（PID $($listener.OwningProcess)）。"
    }
}
