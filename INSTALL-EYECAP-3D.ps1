$ErrorActionPreference = "Stop"

$ProjectRoot = "D:\Web Development\EYECAP WEBSITE"

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " EYECAP 3D STUDIO - AI INTEGRATION INSTALLER" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $ProjectRoot)) {
    throw "Project root not found: $ProjectRoot"
}

$sourceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupRoot = Join-Path $ProjectRoot ".eyecap-3d-backup-$timestamp"

New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null

function Backup-And-Copy($source, $destination) {
    if (Test-Path $destination) {
        $backup = Join-Path $backupRoot (
            $destination.Substring($ProjectRoot.Length).TrimStart("\")
        )

        $backupDir = Split-Path -Parent $backup
        New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

        Copy-Item $destination $backup -Force
        Write-Host "Backed up: $destination" -ForegroundColor Yellow
    }

    $destinationDir = Split-Path -Parent $destination
    New-Item -ItemType Directory -Force -Path $destinationDir | Out-Null

    Copy-Item $source $destination -Force
    Write-Host "Installed: $destination" -ForegroundColor Green
}

Backup-And-Copy `
    (Join-Path $sourceRoot "app\api\3d\generate\route.ts") `
    (Join-Path $ProjectRoot "app\api\3d\generate\route.ts")

Backup-And-Copy `
    (Join-Path $sourceRoot "components\3d-studio\AI3DGenerator\AI3DGeneratorPanel.tsx") `
    (Join-Path $ProjectRoot "components\3d-studio\AI3DGenerator\AI3DGeneratorPanel.tsx")

Backup-And-Copy `
    (Join-Path $sourceRoot "app\3d-studio\page.tsx") `
    (Join-Path $ProjectRoot "app\3d-studio\page.tsx")

$envFile = Join-Path $ProjectRoot ".env.local"

$pythonPath = "C:\Users\dhiman_new\anaconda3\envs\eyecap3d\python.exe"
$envLine = "EYECAP_PYTHON=$pythonPath"

if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw

    if ($content -notmatch "(?m)^EYECAP_PYTHON=") {
        Add-Content -Path $envFile -Value ""
        Add-Content -Path $envFile -Value "# EYECAP AI 3D"
        Add-Content -Path $envFile -Value $envLine
        Write-Host "Added EYECAP_PYTHON to .env.local" -ForegroundColor Green
    }
    else {
        Write-Host "EYECAP_PYTHON already exists in .env.local" -ForegroundColor Yellow
    }
}
else {
    Set-Content -Path $envFile -Value @(
        "# EYECAP AI 3D"
        $envLine
    )

    Write-Host "Created .env.local" -ForegroundColor Green
}

Write-Host ""
Write-Host "Backup directory:" -ForegroundColor Cyan
Write-Host $backupRoot
Write-Host ""

Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "1. Make sure the eyecap3d conda environment contains the working Stable Fast 3D dependencies."
Write-Host "2. Restart the Next.js development server after changing .env.local."
Write-Host ""
Write-Host "Run:" -ForegroundColor Cyan
Write-Host 'cd "D:\Web Development\EYECAP WEBSITE"'
Write-Host "npm run dev"
Write-Host ""
Write-Host "Then open: http://localhost:3000/3d-studio" -ForegroundColor Green
Write-Host ""
