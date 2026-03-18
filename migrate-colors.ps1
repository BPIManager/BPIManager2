param([switch]$DryRun)

$TargetDir = ".\src"
$Files = Get-ChildItem -Path $TargetDir -Recurse -Include "*.tsx","*.ts"

function Replace-InFiles {
  param([string]$From, [string]$To)
  $matchCount = 0
  foreach ($file in $Files) {
    $lines = Get-Content $file.FullName -Encoding UTF8
    $content = $lines -join "`n"
    if ($content -match $From) {
      $matchCount++
      if ($DryRun) {
        for ($i = 0; $i -lt $lines.Count; $i++) {
          if ($lines[$i] -match $From) {
            Write-Host "  $($file.FullName):$($i+1)" -ForegroundColor DarkGray
            Write-Host "    - $($lines[$i].Trim())" -ForegroundColor Red
            Write-Host "    + $(($lines[$i] -replace $From, $To).Trim())" -ForegroundColor Green
          }
        }
      } else {
        $newLines = $lines | ForEach-Object { $_ -replace $From, $To }
        Set-Content $file.FullName -Value $newLines -Encoding UTF8
      }
    }
  }
  $status = if ($matchCount -eq 0) { "skip" } else { "$matchCount files" }
  $color  = if ($matchCount -eq 0) { "DarkGray" } else { "Cyan" }
  Write-Host "  $From  =>  $To  [$status]" -ForegroundColor $color
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Yellow
Write-Host " BPIM2 color token migration" -ForegroundColor Yellow
if ($DryRun) {
  Write-Host " Mode: DRY RUN (no changes)" -ForegroundColor Magenta
} else {
  Write-Host " Mode: EXECUTE" -ForegroundColor Green
}
Write-Host "================================================" -ForegroundColor Yellow
Write-Host ""

Write-Host "[1/5] Background colors" -ForegroundColor White
Replace-InFiles 'bg-\[#0d1117\]'  'bg-bpim-surface'
Replace-InFiles 'bg-\[#0a0c10\]'  'bg-bpim-bg'
Replace-InFiles 'bg-\[#16181c\]'  'bg-bpim-surface-2'
Replace-InFiles 'bg-gray-950'     'bg-bpim-bg'
Replace-InFiles 'bg-gray-900'     'bg-bpim-surface'
Replace-InFiles 'bg-gray-800'     'bg-bpim-surface-2'
Replace-InFiles 'bg-gray-700'     'bg-bpim-overlay'
Replace-InFiles 'bg-gray-500'     'bg-bpim-overlay'
Write-Host ""

Write-Host "[2/5] Text colors" -ForegroundColor White
Replace-InFiles 'text-gray-200'   'text-bpim-text'
Replace-InFiles 'text-gray-300'   'text-bpim-text'
Replace-InFiles 'text-gray-400'   'text-bpim-muted'
Replace-InFiles 'text-gray-500'   'text-bpim-muted'
Replace-InFiles 'text-gray-600'   'text-bpim-subtle'
Replace-InFiles 'text-gray-700'   'text-bpim-subtle'
Write-Host ""

Write-Host "[3/5] Semantic colors" -ForegroundColor White
Replace-InFiles 'text-green-400'  'text-bpim-success'
Replace-InFiles 'text-green-500'  'text-bpim-success'
Replace-InFiles 'text-red-400'    'text-bpim-danger'
Replace-InFiles 'text-red-500'    'text-bpim-danger'
Replace-InFiles 'text-orange-400' 'text-bpim-warning'
Replace-InFiles 'text-orange-300' 'text-bpim-warning'
Replace-InFiles 'text-orange-500' 'text-bpim-warning'
Replace-InFiles 'bg-red-600'      'bg-bpim-danger'
Replace-InFiles 'bg-red-500'      'bg-bpim-danger'
Replace-InFiles 'bg-red-400'      'bg-bpim-danger'
Write-Host ""

Write-Host "[4/5] Primary colors" -ForegroundColor White
Replace-InFiles 'text-blue-400'   'text-bpim-primary'
Replace-InFiles 'text-blue-300'   'text-bpim-primary'
Replace-InFiles 'text-blue-100'   'text-bpim-primary'
Replace-InFiles 'bg-blue-400'     'bg-bpim-primary'
Replace-InFiles 'bg-blue-500'     'bg-bpim-primary'
Replace-InFiles 'bg-blue-600'     'bg-bpim-primary'
Replace-InFiles 'bg-blue-700'     'bg-bpim-primary-dim'
Replace-InFiles 'bg-blue-800'     'bg-bpim-primary-dim'
Replace-InFiles 'bg-blue-900'     'bg-bpim-primary-dim'
Replace-InFiles 'bg-blue-950'     'bg-bpim-primary-dim'
Write-Host ""

Write-Host "[5/5] Border colors" -ForegroundColor White
Write-Host "  border-white/* skipped (keep transparent)" -ForegroundColor DarkGray
Write-Host ""

Write-Host "================================================" -ForegroundColor Yellow
Write-Host " Done" -ForegroundColor Yellow
if ($DryRun) {
  Write-Host " * DryRun: no files were changed" -ForegroundColor Magenta
  Write-Host " * To execute: .\migrate-colors.ps1" -ForegroundColor Magenta
}
Write-Host "================================================" -ForegroundColor Yellow
