param([switch]$DryRun)

$TargetDir = ".\src"
$Files = Get-ChildItem -Path $TargetDir -Recurse -Include "*.tsx","*.ts"

function Replace-InFiles {
  param([string]$From, [string]$To, [string]$Note = "")
  $matchCount = 0
  foreach ($file in $Files) {
    $reader = [System.IO.StreamReader]::new($file.FullName, [System.Text.Encoding]::UTF8)
    $content = $reader.ReadToEnd()
    $reader.Close()
    if ($content -match $From) {
      $matchCount++
      if ($DryRun) {
        $lines = $content -split "`r?`n"
        for ($i = 0; $i -lt $lines.Count; $i++) {
          if ($lines[$i] -match $From) {
            Write-Host "  $($file.Name):$($i+1)" -ForegroundColor DarkGray
            Write-Host "    - $($lines[$i].Trim())" -ForegroundColor Red
            Write-Host "    + $(($lines[$i] -replace $From, $To).Trim())" -ForegroundColor Green
          }
        }
      } else {
        $newContent = $content -replace $From, $To
        $writer = [System.IO.StreamWriter]::new($file.FullName, $false, [System.Text.Encoding]::UTF8)
        $writer.Write($newContent)
        $writer.Close()
      }
    }
  }
  $label = if ($matchCount -eq 0) { "skip" } else { "$matchCount files" }
  $color  = if ($matchCount -eq 0) { "DarkGray" } else { "Cyan" }
  $suffix = if ($Note) { "  # $Note" } else { "" }
  Write-Host "  $From  =>  $To  [$label]$suffix" -ForegroundColor $color
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Yellow
Write-Host " BPIM2 full color migration" -ForegroundColor Yellow
if ($DryRun) {
  Write-Host " Mode: DRY RUN (no changes)" -ForegroundColor Magenta
} else {
  Write-Host " Mode: EXECUTE" -ForegroundColor Green
}
Write-Host "================================================" -ForegroundColor Yellow
Write-Host ""

# =============================================================
# [A] テキスト色 - 完全テーマ追従
# =============================================================
Write-Host "[A] Text colors" -ForegroundColor White

# text-bpim-text / hover:text-bpim-text
# 注意: 有色bg上の text-bpim-text は意図的なので除外できないが
# ほぼ全件がダーク背景想定のため bpim-text に統一
Replace-InFiles 'hover:text-bpim-text(?!/)'    'hover:text-bpim-text'
Replace-InFiles 'group-hover:text-bpim-text'   'group-hover:text-bpim-text'
# data-[state=active]:text-bpim-text は primary 上の白なので維持
# standalone text-bpim-text だけ置換
Replace-InFiles '(?<![:\w-])text-bpim-text(?![/\w])'  'text-bpim-text'

# text-slate-*
Replace-InFiles 'text-slate-200'           'text-bpim-text'
Replace-InFiles 'text-slate-300'           'text-bpim-text'
Replace-InFiles 'group-hover:text-slate-300' 'group-hover:text-bpim-text'
Replace-InFiles 'hover:text-slate-300'     'hover:text-bpim-muted'
Replace-InFiles 'hover:text-slate-400'     'hover:text-bpim-muted'
Replace-InFiles 'text-slate-400'           'text-bpim-muted'
Replace-InFiles 'text-slate-500'           'text-bpim-muted'
Replace-InFiles 'text-slate-600'           'text-bpim-subtle'
Replace-InFiles 'text-slate-700'           'text-bpim-subtle'
Replace-InFiles 'text-slate-800'           'text-bpim-subtle'

# text-gray-* (前回スクリプトで漏れたもの)
Replace-InFiles 'text-gray-200'            'text-bpim-text'
Replace-InFiles 'text-gray-300'            'text-bpim-text'
Replace-InFiles 'text-gray-400'            'text-bpim-muted'
Replace-InFiles 'text-gray-500'            'text-bpim-muted'
Replace-InFiles 'text-gray-600'            'text-bpim-subtle'
Replace-InFiles 'text-gray-700'            'text-bpim-subtle'
Replace-InFiles 'text-gray-800'            'text-bpim-subtle'

# text-blue-* (primary)
Replace-InFiles 'hover:text-blue-400'      'hover:text-bpim-primary'
Replace-InFiles 'hover:text-blue-300'      'hover:text-bpim-primary'
Replace-InFiles 'group-hover:text-blue-400' 'group-hover:text-bpim-primary'
Replace-InFiles '(?<![:\w-])text-blue-400(?![/\w])'  'text-bpim-primary'
Replace-InFiles '(?<![:\w-])text-blue-300(?![/\w])'  'text-bpim-primary'
Replace-InFiles '(?<![:\w-])text-blue-300/80(?![/\w])' 'text-bpim-primary/80'
Replace-InFiles '(?<![:\w-])text-blue-300/60(?![/\w])' 'text-bpim-primary/60'
Replace-InFiles '(?<![:\w-])text-blue-100(?![/\w])'  'text-bpim-primary'

# text-red-* (danger)
Replace-InFiles '(?<![:\w-])text-red-400(?![/\w])'   'text-bpim-danger'
Replace-InFiles '(?<![:\w-])text-red-400/80(?![/\w])' 'text-bpim-danger/80'
Replace-InFiles '(?<![:\w-])text-red-500(?![/\w])'   'text-bpim-danger'
Replace-InFiles 'hover:text-red-300'       'hover:text-bpim-danger'

# text-green-* (success)
Replace-InFiles '(?<![:\w-])text-green-400(?![/\w])' 'text-bpim-success'
Replace-InFiles '(?<![:\w-])text-green-500(?![/\w])' 'text-bpim-success'

# text-orange-* (warning)
Replace-InFiles '(?<![:\w-])text-orange-400(?![/\w])' 'text-bpim-warning'
Replace-InFiles '(?<![:\w-])text-orange-300(?![/\w])' 'text-bpim-warning'
Replace-InFiles '(?<![:\w-])text-orange-500(?![/\w])' 'text-bpim-warning'
Replace-InFiles '(?<![:\w-])text-orange-200(?![/\w])' 'text-bpim-warning'

# text-sky / text-teal / text-purple (info / special)
Replace-InFiles '(?<![:\w-])text-sky-400(?![/\w])'   'text-bpim-info'
Replace-InFiles '(?<![:\w-])text-teal-500(?![/\w])'  'text-bpim-info'
Replace-InFiles '(?<![:\w-])text-purple-400(?![/\w])' 'text-bpim-primary'

Write-Host ""

# =============================================================
# [B] 背景色 - テーマ追従
# =============================================================
Write-Host "[B] Background colors (theme)" -ForegroundColor White

# bg-[#xxxxxx] ハードコード
Replace-InFiles 'bg-\[#0d1117\]'           'bg-bpim-surface'
Replace-InFiles 'bg-\[#0a0c10\]'           'bg-bpim-bg'
Replace-InFiles 'bg-\[#16181c\]'           'bg-bpim-surface-2'
# data-[state=active]:bg-[#0d1117] はアクティブタブ背景
Replace-InFiles 'data-\[state=active\]:bg-\[#0d1117\]' 'data-[state=active]:bg-bpim-surface'

# bg-gray-* / bg-slate-*
Replace-InFiles 'bg-gray-950'              'bg-bpim-bg'
Replace-InFiles 'bg-gray-900'              'bg-bpim-surface'
Replace-InFiles 'bg-gray-800'              'bg-bpim-surface-2'
Replace-InFiles 'bg-gray-700'              'bg-bpim-overlay'
Replace-InFiles 'bg-gray-500'              'bg-bpim-overlay'
Replace-InFiles 'bg-slate-800'             'bg-bpim-surface-2'
Replace-InFiles 'bg-slate-600'             'bg-bpim-overlay'
Replace-InFiles 'hover:bg-slate-800/90'    'hover:bg-bpim-surface-2/90'

# bg-blue-* (primary)
Replace-InFiles 'bg-blue-400(?!/)'         'bg-bpim-primary'
Replace-InFiles 'bg-blue-500(?!/)'         'bg-bpim-primary'
Replace-InFiles 'bg-blue-600(?!/)'         'bg-bpim-primary'
Replace-InFiles 'bg-blue-500/10'           'bg-bpim-primary/10'
Replace-InFiles 'bg-blue-500/5'            'bg-bpim-primary/5'
Replace-InFiles 'bg-blue-900/5'            'bg-bpim-primary/5'
Replace-InFiles 'bg-blue-900/15'           'bg-bpim-primary/10'
Replace-InFiles 'bg-blue-900/60'           'bg-bpim-primary-dim'
Replace-InFiles 'bg-blue-950/30'           'bg-bpim-primary-dim/30'
Replace-InFiles 'bg-blue-950(?!/)'         'bg-bpim-primary-dim'
Replace-InFiles 'bg-blue-800(?!/)'         'bg-bpim-primary-dim'
Replace-InFiles 'bg-blue-700(?!/)'         'bg-bpim-primary-dim'
Replace-InFiles 'hover:bg-blue-500(?!/)'   'hover:bg-bpim-primary'
Replace-InFiles 'hover:bg-blue-700(?!/)'   'hover:bg-bpim-primary-dim'
Replace-InFiles 'hover:bg-blue-400/10'     'hover:bg-bpim-primary/10'
Replace-InFiles 'hover:bg-blue-500/20'     'hover:bg-bpim-primary/20'
Replace-InFiles 'data-\[state=active\]:bg-blue-500' 'data-[state=active]:bg-bpim-primary'
Replace-InFiles 'data-\[state=active\]:bg-blue-600' 'data-[state=active]:bg-bpim-primary'
Replace-InFiles 'data-\[state=checked\]:bg-blue-500' 'data-[state=checked]:bg-bpim-primary'
Replace-InFiles 'data-\[state=checked\]:bg-blue-600' 'data-[state=checked]:bg-bpim-primary'

# bg-red-* (danger)
Replace-InFiles 'bg-red-400(?!/)'          'bg-bpim-danger'
Replace-InFiles 'bg-red-500(?!/)'          'bg-bpim-danger'
Replace-InFiles 'bg-red-600(?!/)'          'bg-bpim-danger'
Replace-InFiles 'bg-red-500/10'            'bg-bpim-danger/10'
Replace-InFiles 'hover:bg-red-400/10'      'hover:bg-bpim-danger/10'

# hover:bg-white/* → overlay
Replace-InFiles 'hover:bg-white/5'         'hover:bg-bpim-overlay/50'
Replace-InFiles 'hover:bg-white/10'        'hover:bg-bpim-overlay'

Write-Host ""

# =============================================================
# [C] ボーダー / シャドウ / リング
# =============================================================
Write-Host "[C] Border / Shadow / Ring" -ForegroundColor White

Replace-InFiles 'border-blue-500(?!/)'     'border-bpim-primary'
Replace-InFiles 'border-blue-800(?!/)'     'border-bpim-border'
Replace-InFiles 'ring-slate-950'           'ring-bpim-bg'
Replace-InFiles 'shadow-blue-500/20'       'shadow-bpim-primary/20'
Replace-InFiles 'shadow-blue-500/10'       'shadow-bpim-primary/10'
Replace-InFiles 'hover:border-blue-500'    'hover:border-bpim-primary'

Write-Host ""

# =============================================================
# [D] グラデーション
# =============================================================
Write-Host "[D] Gradient" -ForegroundColor White

Replace-InFiles 'from-white/5'             'from-bpim-text/5'
Replace-InFiles 'from-white(?![/-])'       'from-bpim-text'
Replace-InFiles 'to-white(?![/-])'         'to-bpim-text'
Replace-InFiles 'from-gray-600'            'from-bpim-subtle'

Write-Host ""

# =============================================================
# [E] SKIP リスト（意図的なカラー - 置換しない）
# =============================================================
Write-Host "[E] SKIPPED (intentional game colors)" -ForegroundColor DarkYellow
Write-Host "  bg-purple-*/text-purple-*  => difficulty badges (LEGGENDARIA)" -ForegroundColor DarkGray
Write-Host "  bg-yellow-*/text-yellow-*  => EXH-CLEAR / gold rank badges" -ForegroundColor DarkGray
Write-Host "  bg-orange-*/text-orange-*  => rival/warning badges" -ForegroundColor DarkGray
Write-Host "  bg-green-6*/text-green-4*  => CLEAR lamp badges" -ForegroundColor DarkGray
Write-Host "  bg-white on colored badge  => white text on colored bg (correct)" -ForegroundColor DarkGray
Write-Host "  constants/bpiColor.tsx     => BPI score colors (hex, keep as-is)" -ForegroundColor DarkGray
Write-Host "  constants/djRankColor.tsx  => DJ rank colors (hex, keep as-is)" -ForegroundColor DarkGray
Write-Host ""

Write-Host "================================================" -ForegroundColor Yellow
Write-Host " Done" -ForegroundColor Yellow
if ($DryRun) {
  Write-Host " * DryRun: no files were changed" -ForegroundColor Magenta
  Write-Host " * To execute: .\migrate-colors-full.ps1" -ForegroundColor Magenta
}
Write-Host "================================================" -ForegroundColor Yellow
