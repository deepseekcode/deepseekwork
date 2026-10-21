<#
.SYNOPSIS
  GitHub Release 下载量统计：即时累计值 + 每日快照（用于算出「最近 N 天新增」）。

.DESCRIPTION
  GitHub 的 API 只返回每个资产「有史以来」的累计 download_count，没有时间序列。
  本脚本做两件事：
    1) Snapshot —— 把当期累计值按日期追加进 CSV，逐日打点即可得到真实的增量趋势。
    2) Report   —— 读 CSV，算出「最近 N 天每个资产新增了多少」。

.EXAMPLE
  # 只看当前累计（不落盘）
  powershell -File scripts\gh-download-stats.ps1

  # 打一次点（同一天重复跑会覆盖当天数据，不会重复累加）
  powershell -File scripts\gh-download-stats.ps1 -Snapshot

  # 看最近 7 天新增（需要至少有 2 个不同日期的快照）
  powershell -File scripts\gh-download-stats.ps1 -Report 7

  # 打点 + 直接出 7 天报告
  powershell -File scripts\gh-download-stats.ps1 -Snapshot -Report 7
#>
[CmdletBinding()]
param(
    [string]$Repo = 'deepseekcode/deepseekwork',
    [int]$Report = 0,
    [switch]$Snapshot,
    [switch]$Quiet,
    [string]$Data,
    [int]$MaxReleases = 100
)

$ErrorActionPreference = 'Stop'
if (-not $Data) {
    $root = Split-Path -Parent $PSScriptRoot
    $Data = Join-Path (Join-Path $root '.gh-stats') 'downloads.csv'
}

function Get-Releases {
    param([string]$Repo, [int]$Max)
    $token = $env:GH_TOKEN
    if (-not $token) { $token = $env:GITHUB_TOKEN }
    # 优先 gh CLI（本地已登录 / CI 里由 GH_TOKEN 提供凭据），失败再退回 REST
    if (Get-Command gh -ErrorAction SilentlyContinue) {
        try {
            $json = gh api "repos/$Repo/releases?per_page=$Max" 2>$null
            if ($LASTEXITCODE -eq 0 -and $json) { return $json | ConvertFrom-Json }
        } catch {
            # gh 未登录或不可用，走下面的 REST 分支
        }
    }
    $headers = @{ 'User-Agent' = 'gh-download-stats'; 'Accept' = 'application/vnd.github+json' }
    if ($token) { $headers['Authorization'] = "Bearer $token" }
    return Invoke-RestMethod -Headers $headers -Uri "https://api.github.com/repos/$Repo/releases?per_page=$Max"
}

# 把资产名归到平台，便于看「哪个系统在下」
function Get-Platform {
    param([string]$Name)
    if ($Name -like '*.sig' -or $Name -eq 'latest.json' -or $Name -like '*.app.tar.gz') { return 'updater' }
    if ($Name -like '*.rpm' -or $Name -like '*.deb' -or $Name -like '*AppImage*') { return 'linux' }
    if ($Name -like '*.dmg') { return 'macos' }
    if ($Name -like '*setup.exe' -or $Name -like '*.msi') { return 'windows' }
    return 'other'
}

$releases = Get-Releases -Repo $Repo -Max $MaxReleases
if (-not $releases) { throw "仓库 $Repo 没有 release" }

# 展平成资产行
$rows = @()
foreach ($rel in $releases) {
    $published = $null
    if ($rel.published_at) { $published = ([datetime]$rel.published_at).ToUniversalTime().ToString('yyyy-MM-dd') }
    foreach ($a in $rel.assets) {
        $rows += [pscustomobject]@{
            tag       = $rel.tag_name
            published = $published
            asset     = $a.name
            platform  = (Get-Platform -Name $a.name)
            count     = [int]$a.download_count
            size_mb   = [math]::Round(($a.size / 1MB), 1)
        }
    }
}

# ---------- 1. 快照 ----------
if ($Snapshot) {
    $today = (Get-Date).ToString('yyyy-MM-dd')
    $dir = Split-Path -Parent $Data
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

    $existing = @()
    if (Test-Path $Data) {
        $existing = @(Import-Csv -Path $Data | Where-Object { $_.date -ne $today })
    }
    $new = $rows | ForEach-Object {
        [pscustomobject]@{
            date = $today; repo = $Repo; tag = $_.tag; published = $_.published
            asset = $_.asset; platform = $_.platform; count = $_.count
        }
    }
    $all = @($existing) + @($new)
    $csv = ($all | Sort-Object date, tag, asset | ConvertTo-Csv -NoTypeInformation) -join "`n"
    # 固定 UTF-8 无 BOM + LF：Windows 本地写入与 CI 写入不会在 git diff 里来回抖动
    [System.IO.File]::WriteAllText($Data, $csv + "`n", (New-Object System.Text.UTF8Encoding($false)))
    Write-Host "快照已写入 $Data （今日 $($new.Count) 条）" -ForegroundColor Green
}

# CI 里只要快照结果，不必把几十行累计表刷进日志
if ($Quiet -and $Report -le 0) { return }

# ---------- 2. 当前累计 ----------
Write-Host ""
Write-Host "== $Repo  累计下载（$(Get-Date -Format 'yyyy-MM-dd HH:mm')）" -ForegroundColor Cyan
Write-Host ""

$reportTags = $rows | Group-Object tag | ForEach-Object { $_.Name }

foreach ($tag in $reportTags) {
    $tagRows = $rows | Where-Object { $_.tag -eq $tag }
    $pub = ($tagRows | Select-Object -First 1).published
    $daysAlive = 0
    if ($pub) { $daysAlive = ((Get-Date) - [datetime]$pub).Days }
    $real = $tagRows | Where-Object { $_.platform -ne 'updater' }
    $total = ($real | Measure-Object -Property count -Sum).Sum
    Write-Host ("{0}  发布 {1}  已 {2} 天  合计 {3} 次" -f $tag, $pub, $daysAlive, $total)
    foreach ($p in ($real | Group-Object platform | Sort-Object Name)) {
        $sub = ($p.Group | Measure-Object -Property count -Sum).Sum
        $perDay = 'n/a'
        if ($daysAlive -gt 0) { $perDay = [math]::Round($sub / $daysAlive, 1) }
        Write-Host ("    {0,-8} {1,6} 次   累计日均 {2}" -f $p.Name, $sub, $perDay)
    }
}

# ---------- 3. 最近 N 天新增 ----------
if ($Report -gt 0) {
    Write-Host ""
    Write-Host "== 最近 $Report 天新增" -ForegroundColor Cyan
    Write-Host ""
    if (-not (Test-Path $Data)) {
        Write-Host "还没有快照文件：先跑一次 -Snapshot，隔天之后再来看增量。" -ForegroundColor Yellow
        Write-Host "注意：GitHub API 不提供历史，历史只能从第一次快照开始攒。" -ForegroundColor Yellow
        return
    }
    $snap = @(Import-Csv -Path $Data | Where-Object { $_.repo -eq $Repo })
    $dates = @($snap | Select-Object -ExpandProperty date -Unique | Sort-Object)
    if ($dates.Count -lt 2) {
        Write-Host ("目前只有 {0} 个日期的快照（{1}），今天打点后要等下一次快照才能算增量。" -f $dates.Count, ($dates -join ',')) -ForegroundColor Yellow
        return
    }
    $cut = (Get-Date).AddDays(-$Report).ToString('yyyy-MM-dd')
    $baseDate = ($dates | Where-Object { $_ -le $cut } | Select-Object -Last 1)
    if (-not $baseDate) { $baseDate = $dates[0] }
    $nowDate = $dates[-1]
    $span = ([datetime]$nowDate - [datetime]$baseDate).Days
    if ($span -le 0) { $span = 1 }
    Write-Host ("基线 {0} → 最新 {1}（实际跨度 {2} 天）" -f $baseDate, $nowDate, $span)

    $res = @()
    $assets = @($snap | Where-Object { $_.date -eq $nowDate } | Select-Object -ExpandProperty asset -Unique)
    foreach ($asset in $assets) {
        $nowRow = $snap | Where-Object { $_.date -eq $nowDate -and $_.asset -eq $asset } | Select-Object -First 1
        if ($nowRow.platform -eq 'updater') { continue }
        $baseRow = $snap | Where-Object { $_.date -eq $baseDate -and $_.asset -eq $asset } | Select-Object -First 1
        $baseCount = 0
        if ($baseRow) { $baseCount = [int]$baseRow.count }
        $res += [pscustomobject]@{
            tag      = $nowRow.tag
            platform = $nowRow.platform
            asset    = $asset
            delta    = ([int]$nowRow.count - $baseCount)
            per_day  = [math]::Round((([int]$nowRow.count - $baseCount) / $span), 2)
        }
    }
    foreach ($p in ($res | Group-Object platform | Sort-Object Name)) {
        $d = ($p.Group | Measure-Object -Property delta -Sum).Sum
        Write-Host ("{0,-8} +{1} 次  （{2}/天）" -f $p.Name, $d, [math]::Round($d / $span, 2))
        foreach ($r in ($p.Group | Sort-Object -Property delta -Descending)) {
            if ($r.delta -eq 0) { continue }
            Write-Host ("    {0,6}  {1}" -f $r.delta, $r.asset)
        }
    }
    $grand = ($res | Measure-Object -Property delta -Sum).Sum
    Write-Host ""
    Write-Host ("合计新增 {0} 次，日均 {1} 次" -f $grand, [math]::Round($grand / $span, 2)) -ForegroundColor Green
}
