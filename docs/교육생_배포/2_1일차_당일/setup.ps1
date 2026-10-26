# Vibe Coding Intermediate Course - Day 1 setup script
# Windows PowerShell 5.1 or later. ASCII only, so it survives copy/paste and re-saving.
#
# Run in a NORMAL PowerShell window (not "Run as administrator"),
# after the pre-course setup (Node.js, your AI agent, subscription login) is done.
# Course workspace on every PC: C:\workspace. Put the instructor's files there
# (setup.ps1, 00_*.md, AGENTS.global.md) and run:
#
#   cd C:\workspace
#   powershell -ExecutionPolicy Bypass -File .\setup.ps1
#   powershell -ExecutionPolicy Bypass -File .\setup.ps1 -Agents codex,claude,antigravity
#
# "not digitally signed" error (IT sets RemoteSigned and the file came from the web):
#   Unblock-File .\setup.ps1   then run it again.
#
# Without -Agents it asks which AI agents to set up (default: the ones found on this PC).
# Each trainee brings a subscription (ChatGPT, Claude or Google AI plan); an API-key login is reported as WARN.
# Safe to run again: finished items are skipped and course repositories are updated.
# Results go to C:\workspace\setup-log.txt (lines "Item | Status | Detail").
# LAW_OC and e-mail are never written to the log.

param([string]$Agents = '')

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'  # progress bars make downloads and unzipping very slow in PowerShell 5.1

# Normal windows and the agents use Windows PowerShell 5.1, and PowerShell 7 keeps its own
# execution policy. Run in Windows PowerShell so the policy check below fixes the right one.
if ($PSVersionTable.PSEdition -eq 'Core' -and $IsWindows) {
    $self = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $PSCommandPath)
    if ($Agents) { $self += @('-Agents', $Agents) }
    & powershell.exe @self
    exit $LASTEXITCODE
}

# AppLocker or WDAC (set by IT) can lock PowerShell into Constrained Language mode,
# which would stop the .NET calls below halfway through the setup
if ($ExecutionContext.SessionState.LanguageMode -ne 'FullLanguage') {
    Write-Host "PowerShell runs in $($ExecutionContext.SessionState.LanguageMode) mode on this PC (IT policy). setup.ps1 cannot run - ask IT." -ForegroundColor Red
    exit 1
}

# Python: official python.org installer, installed for the current user only (no admin, no winget).
# Pinned to one stable release so every PC gets the same version. Change it here to update.
$PythonVersion = '3.14.8'

# kordoc version tested by report-harness (its .mcp.json). Every agent gets the same one.
$KordocPackage = 'kordoc@4.15.3'

# Course repositories, each cloned to C:\workspace\<Name>
$CourseRepos = @(
    @{ Name = 'report-harness'; Url = 'https://github.com/bcchung81/report-harness.git' }
)

# HyperFrames video skills: only the skills folder of the repository (the whole repository is about 500 MB)
$HyperframesRepo = @{ Name = 'hyperframes-skills'; Url = 'https://github.com/heygen-com/hyperframes.git'; Sparse = 'skills' }

# MCP servers for every selected agent (wrapped in "cmd /c" on Windows)
$McpServers = @(
    @{ Name = 'sequential-thinking'; Cmd = @('npx', '-y', '@modelcontextprotocol/server-sequential-thinking'); NeedsLaw = $false },
    @{ Name = 'kordoc';              Cmd = @('npx', '-y', $KordocPackage, 'mcp');                              NeedsLaw = $false },
    @{ Name = 'korean-law';          Cmd = @('npx', '-y', 'korean-law-mcp');                                    NeedsLaw = $true }
)

# Same short path on every PC: no Korean user name, spaces or OneDrive in it
$Workspace = 'C:\workspace'
$LogPath = Join-Path $Workspace 'setup-log.txt'
try {
    if (-not (Test-Path $Workspace)) { New-Item -ItemType Directory -Path $Workspace -ErrorAction Stop | Out-Null }
    Set-Content -Path $LogPath -Value ('setup.ps1 started {0}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')) -Encoding UTF8 -ErrorAction Stop
} catch {
    Write-Host "Cannot write to $Workspace - ask an assistant or IT." -ForegroundColor Red
    exit 1
}
$Results = New-Object System.Collections.ArrayList
$PathChanged = $false

$CodexHome = Join-Path $HOME '.codex'
if ($env:CODEX_HOME) { $CodexHome = $env:CODEX_HOME }
$AntigravitySkillRoots = @((Join-Path $HOME '.gemini\config\skills'), (Join-Path $HOME '.gemini\antigravity-cli\skills'))
$AntigravityMcpPath = Join-Path $HOME '.gemini\config\mcp_config.json'
# Personal skill folders each agent reads (Codex reads .agents\skills)
$SkillRoots = @{ codex = @(Join-Path $HOME '.agents\skills'); claude = @(Join-Path $HOME '.claude\skills'); antigravity = $AntigravitySkillRoots }

# "think": a custom command as a skill, so all three agents get it (Claude Code runs it as /think).
# AGENTS.global.md keeps sequential-thinking for user requests only; this skill is that request.
$ThinkSkill = @'
---
name: think
description: "Step-by-step analysis with the sequential-thinking MCP. Use only when the user types /think or asks to think a topic through step by step."
---

Analyze the user's topic step by step with the sequential-thinking MCP tool.

- Topic: what the user wrote after /think. If it is empty, use the task under discussion. If that is unclear too, ask once.
- First thought: restate the problem and estimate how many thoughts it needs. Change the estimate as you go.
- One judgment per thought. Revise a thought that turned out wrong; branch to compare alternatives.
- When a fact needs checking, check it with your other tools between thoughts. Keep checked facts apart from guesses.
- Last thought: verify the answer, then stop.
- Reply in Korean: the conclusion first, then the reasons and what is still uncertain, briefly. Do not paste the thought log.
'@

function Write-Log([string]$Text) {
    $line = '[{0}] {1}' -f (Get-Date -Format 'HH:mm:ss'), $Text
    Add-Content -Path $LogPath -Value $line -Encoding UTF8
}

function Write-Step([string]$Text) {
    Write-Host ''
    Write-Host "== $Text" -ForegroundColor Cyan
    Write-Log "== $Text"
}

# Status: OK, SKIP (already done), WARN, FAIL
function Add-Result([string]$Item, [string]$Status, [string]$Detail) {
    [void]$Results.Add([pscustomobject]@{ Item = $Item; Status = $Status; Detail = $Detail })
    Write-Log ('{0} | {1} | {2}' -f $Item, $Status, $Detail)
    $color = switch ($Status) {
        'OK'    { 'Green' }
        'SKIP'  { 'Gray' }
        'WARN'  { 'Yellow' }
        default { 'Red' }
    }
    Write-Host ('   {0}: {1}  {2}' -f $Item, $Status, $Detail) -ForegroundColor $color
}

# UTF-8 without BOM; creates the parent folder
function Write-Utf8([string]$Path, [string]$Text) {
    $parent = Split-Path $Path
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    [IO.File]::WriteAllText($Path, $Text, (New-Object System.Text.UTF8Encoding $false))
}

# Reload PATH from the registry so programs installed after this window opened are found.
# Entries only this window had (e.g. a Node version manager set up by the profile) stay at the end.
function Update-SessionPath {
    $machine = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $user = [Environment]::GetEnvironmentVariable('Path', 'User')
    $fresh = @("$machine;$user" -split ';' | Where-Object { $_ })
    $extra = @($env:Path -split ';' | Where-Object { $_ -and ($fresh -notcontains $_) })
    $env:Path = ($fresh + $extra) -join ';'
}

function Test-Command([string]$Name) {
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

# The .exe or .cmd behind a command. npm also makes a .ps1 shim, which PowerShell prefers, and a .ps1
# passes an array argument on as one string: "codex mcp add ... -- cmd /c ..." would break.
function Get-NativeCommand([string]$Name) {
    $found = @(Get-Command $Name -CommandType Application -ErrorAction SilentlyContinue)
    if ($found.Count -gt 0) { return $found[0].Source }
    return $Name
}

# Major version of "node", 0 if missing
function Get-NodeMajor {
    if ((Test-Command 'node') -and ((Get-FirstLine { node -v }) -match '^v(\d+)')) { return [int]$Matches[1] }
    return 0
}

# Command output (stdout + stderr) as an array of non-empty strings
function Get-Lines([scriptblock]$Block) {
    try {
        return @(& $Block 2>&1 | ForEach-Object { "$_".Trim() } | Where-Object { $_ })
    } catch {
        return @()
    }
}

function Get-FirstLine([scriptblock]$Block) {
    $lines = @(Get-Lines $Block)  # @() keeps a single line as an array, not a string
    if ($lines.Count -gt 0) { return $lines[0] }
    return ''
}

# Which agents to set up: -Agents value, or ask (default: every agent found). Accepts numbers or names.
function Select-Agents([string]$Given) {
    if (-not $Given) {
        $have = @((Test-Command 'codex'), (Test-Command 'claude'), (Test-Antigravity))
        $found = @{ $true = '(found)'; $false = '(not found)' }
        $default = (@(1..3 | Where-Object { $have[$_ - 1] }) -join ',')
        if (-not $default) { $default = '1' }
        Write-Host ''
        Write-Host 'Which AI agents should be set up? Pick the one you subscribed to.' -ForegroundColor Cyan
        Write-Host ('   1) Codex        {0}' -f $found[$have[0]])
        Write-Host ('   2) Claude Code  {0}' -f $found[$have[1]])
        Write-Host ('   3) Antigravity  {0}' -f $found[$have[2]])
        try { $Given = Read-Host "   Numbers or names, comma separated [$default]" } catch { $Given = '' }
        if (-not $Given) { $Given = $default }
    }
    $map = @{ '1' = 'codex'; '2' = 'claude'; '3' = 'antigravity'; 'codex' = 'codex'; 'claude' = 'claude'; 'claude-code' = 'claude'; 'antigravity' = 'antigravity' }
    $picked = @($Given -split '[,\s]+' | Where-Object { $_ } | ForEach-Object { $map[$_.ToLower()] } | Where-Object { $_ } | Select-Object -Unique)
    if ($picked.Count -eq 0) { $picked = @('codex') }
    return $picked
}

function Test-Antigravity {
    return ((Test-Command 'antigravity') -or (Test-Command 'agy') -or
        (Test-Path (Join-Path $env:LOCALAPPDATA 'Programs\Antigravity')) -or (Test-Path (Join-Path $HOME '.gemini\antigravity')))
}

# A real Python, not the Microsoft Store shortcut that prints "Python was not found"
function Get-PythonVersion {
    if (-not (Test-Command 'python')) { return '' }
    $v = Get-FirstLine { python --version }
    if ($v -match '^Python 3') { return $v }
    return ''
}

# True if "python" is at least the major.minor of $PythonVersion
function Test-PythonOk {
    $v = Get-PythonVersion
    if ($v -notmatch '^Python (\d+)\.(\d+)') { return $false }
    $want = [version]($PythonVersion -replace '^(\d+\.\d+).*', '$1')
    return ([version]"$($Matches[1]).$($Matches[2])" -ge $want)
}

# Download the official installer and install for the current user only. Returns '' or an error.
function Install-PythonLocal {
    $arch = 'amd64'
    if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { $arch = 'arm64' }
    $file = "python-$PythonVersion-$arch.exe"
    $url = "https://www.python.org/ftp/python/$PythonVersion/$file"
    $installer = Join-Path $env:TEMP $file
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
        # proxies that ask for the Windows login
        if ([Net.WebRequest]::DefaultWebProxy) { [Net.WebRequest]::DefaultWebProxy.Credentials = [Net.CredentialCache]::DefaultNetworkCredentials }
        Invoke-WebRequest -Uri $url -OutFile $installer -UseBasicParsing
    } catch {
        return "download failed: $url"
    }
    $sig = Get-AuthenticodeSignature $installer
    if ($sig.Status -ne 'Valid' -or $sig.SignerCertificate.Subject -notmatch 'Python Software Foundation') {
        Remove-Item $installer -ErrorAction SilentlyContinue
        return 'installer signature check failed'
    }
    $proc = Start-Process -FilePath $installer -Wait -PassThru -ArgumentList @(
        '/quiet', 'InstallAllUsers=0', 'PrependPath=1', 'Include_launcher=1', 'InstallLauncherAllUsers=0', 'Include_test=0')
    Remove-Item $installer -ErrorAction SilentlyContinue
    if ($proc.ExitCode -ne 0) { return "installer exit code $($proc.ExitCode)" }
    return ''
}

# Newest Python 3 folder (per-user or all-users install) and its Scripts folder
function Get-PythonDirs {
    $roots = @((Join-Path $env:LOCALAPPDATA 'Programs\Python'), $env:ProgramFiles)
    $found = foreach ($r in $roots) {
        if ($r -and (Test-Path $r)) { Get-ChildItem $r -Directory -Filter 'Python3*' -ErrorAction SilentlyContinue }
    }
    $latest = $found |
        Where-Object { Test-Path (Join-Path $_.FullName 'python.exe') } |
        Sort-Object { [int]($_.Name -replace '\D', '') } -Descending |
        Select-Object -First 1
    if ($latest) { return @($latest.FullName, (Join-Path $latest.FullName 'Scripts')) }
    return @()
}

# New PATH list with $Dir added (front or back). Returns $null if nothing changes.
function Merge-PathList([string]$Current, [string]$Dir, [bool]$Prepend) {
    $parts = @()
    if ($Current) { $parts = @($Current -split ';' | Where-Object { $_ }) }
    $key = $Dir.TrimEnd('\')
    $others = @($parts | Where-Object { $_.TrimEnd('\') -ne $key })
    if ($Prepend) {
        if ($parts.Count -gt 0 -and $parts[0].TrimEnd('\') -eq $key) { return $null }
        return (@($Dir) + $others) -join ';'
    }
    if ($others.Count -lt $parts.Count) { return $null }
    return ($parts + @($Dir)) -join ';'
}

# Add an existing folder to the USER PATH (no admin needed) and reload this window's PATH
function Add-UserPath([string]$Dir, [bool]$Prepend = $false) {
    if (-not $Dir -or -not (Test-Path $Dir)) { return }
    $new = Merge-PathList ([Environment]::GetEnvironmentVariable('Path', 'User')) $Dir $Prepend
    if ($null -eq $new) { return }
    [Environment]::SetEnvironmentVariable('Path', $new, 'User')
    $script:PathChanged = $true
    Write-Log "User PATH: added $Dir"
    Update-SessionPath
}

# winget install, trying each scope in turn ('' = the package default) until one works.
# A 'user' scope needs no admin rights. $LASTEXITCODE holds the result.
function Install-WingetPackage([string]$Id, [string[]]$Scopes) {
    foreach ($scope in $Scopes) {
        $wingetArgs = @('install', '--id', $Id, '-e', '--source', 'winget', '--accept-source-agreements', '--accept-package-agreements')
        if ($scope) { $wingetArgs += @('--scope', $scope) }
        winget @wingetArgs
        if ($LASTEXITCODE -eq 0) { return }
    }
}

# npm global install of a CLI, unless $Command already works
function Install-NpmGlobal([string]$Item, [string]$Package, [string]$Command) {
    if (Test-Command $Command) {
        Add-Result $Item 'SKIP' 'already installed'
        return
    }
    npm.cmd install -g $Package
    $code = $LASTEXITCODE
    Update-SessionPath
    if (-not (Test-Command $Command)) {
        # npm global folder missing from PATH (e.g. Node.js not installed with the official installer)
        Add-UserPath (Get-FirstLine { npm.cmd prefix -g })
    }
    if (Test-Command $Command) {
        Add-Result $Item 'OK' (Get-FirstLine { & "$Command.cmd" --version })
    } else {
        Add-Result $Item 'FAIL' "npm exit code $code"
    }
}

function Test-Mcp([string]$Name) {
    & $Codex mcp get $Name *> $null
    if ($LASTEXITCODE -eq 0) { return $true }
    $list = (Get-Lines { & $Codex mcp list }) -join "`n"
    return ($list -match ('(?m)^\s*' + [regex]::Escape($Name) + '(\s|$)'))
}

function Test-ClaudeMcp([string]$Name) {
    & $Claude mcp get $Name *> $null
    return ($LASTEXITCODE -eq 0)
}

function Test-AntigravityMcp([string]$Name) {
    if (-not (Test-Path $AntigravityMcpPath)) { return $false }
    return [bool](Select-String -Path $AntigravityMcpPath -SimpleMatch ('"' + $Name + '"') -Quiet)
}

# Codex: register (or re-register an older unpinned kordoc)
function Register-CodexMcp($Server, [string]$LawOc) {
    $item = "Codex MCP $($Server.Name)"
    if (Test-Mcp $Server.Name) {
        $cfg = Join-Path $CodexHome 'config.toml'
        $pinned = (Test-Path $cfg) -and (Select-String -Path $cfg -SimpleMatch $KordocPackage -Quiet)
        if ($Server.Name -ne 'kordoc' -or $pinned) {
            Add-Result $item 'SKIP' 'already registered'
            return
        }
        & $Codex mcp remove $Server.Name *> $null
    }
    if ($Server.NeedsLaw -and -not $LawOc) {
        Add-Result $item 'WARN' 'skipped - run setup.ps1 again after you get LAW_OC'
        return
    }
    $addArgs = @()
    if ($Server.NeedsLaw) { $addArgs += @('--env', "LAW_OC=$LawOc") }
    $addArgs += @('--', 'cmd', '/c') + $Server.Cmd   # '--' inside an array so PowerShell does not drop it
    & $Codex mcp add $Server.Name $addArgs | Out-Null
    if (Test-Mcp $Server.Name) { Add-Result $item 'OK' 'registered' } else { Add-Result $item 'FAIL' 'not registered' }
}

# Claude Code: user scope, so every project sees it
function Register-ClaudeMcp($Server, [string]$LawOc) {
    $item = "Claude MCP $($Server.Name)"
    if (Test-ClaudeMcp $Server.Name) {
        Add-Result $item 'SKIP' 'already registered'
        return
    }
    if ($Server.NeedsLaw -and -not $LawOc) {
        Add-Result $item 'WARN' 'skipped - run setup.ps1 again after you get LAW_OC'
        return
    }
    $addArgs = @('mcp', 'add')
    if ($Server.NeedsLaw) { $addArgs += @('--env', "LAW_OC=$LawOc") }   # --env must not sit right before the name
    $addArgs += @('--scope', 'user', '--transport', 'stdio', $Server.Name, '--', 'cmd', '/c') + $Server.Cmd
    & $Claude @addArgs | Out-Null
    if (Test-ClaudeMcp $Server.Name) { Add-Result $item 'OK' 'registered' } else { Add-Result $item 'FAIL' 'not registered' }
}

# Antigravity: merge missing servers into ~/.gemini/config/mcp_config.json, keep existing ones
function Register-AntigravityMcp([string]$LawOc) {
    $config = $null
    if (Test-Path $AntigravityMcpPath) {
        try {
            $config = Get-Content $AntigravityMcpPath -Raw -Encoding UTF8 | ConvertFrom-Json -ErrorAction Stop
        } catch {
            Add-Result 'Antigravity MCP' 'WARN' 'mcp_config.json is not valid JSON - not changed'
            return
        }
    }
    if (-not $config) { $config = New-Object PSObject }
    if (-not $config.PSObject.Properties['mcpServers']) {
        $config | Add-Member -NotePropertyName 'mcpServers' -NotePropertyValue (New-Object PSObject)
    }
    $added = @()
    foreach ($s in $McpServers) {
        if ($config.mcpServers.PSObject.Properties[$s.Name]) { continue }
        if ($s.NeedsLaw -and -not $LawOc) { continue }
        $entry = [ordered]@{ command = 'cmd'; args = @('/c') + $s.Cmd }
        if ($s.NeedsLaw) { $entry['env'] = @{ LAW_OC = $LawOc } }
        $config.mcpServers | Add-Member -NotePropertyName $s.Name -NotePropertyValue ([pscustomobject]$entry)
        $added += $s.Name
    }
    if ($added.Count -gt 0) {
        Write-Utf8 $AntigravityMcpPath ($config | ConvertTo-Json -Depth 10)
        Add-Result 'Antigravity MCP' 'OK' ('added ' + ($added -join ', '))
    } else {
        Add-Result 'Antigravity MCP' 'SKIP' 'already registered'
    }
    if (-not $config.mcpServers.PSObject.Properties['korean-law']) {
        Add-Result 'Antigravity MCP korean-law' 'WARN' 'skipped - run setup.ps1 again after you get LAW_OC'
    }
}

# Clone C:\workspace\<Name>, or update it with a fast-forward pull.
# $Sparse: check out only that folder (a partial clone downloads just its files).
function Sync-Repo([string]$Name, [string]$Url, [string]$Sparse = '') {
    $dir = Join-Path $Workspace $Name
    $item = "Repo $Name"
    if (Test-Path (Join-Path $dir '.git')) {
        # A clone made from an administrator window has another owner, and git refuses it.
        # git's message names the fix (safe.directory); the folder is this user's own workspace.
        if (((Get-Lines { git -C $dir rev-parse HEAD }) -join ' ') -match 'safe\.directory') {
            git config --global --add safe.directory ($dir -replace '\\', '/')
        }
        $before = Get-FirstLine { git -C $dir rev-parse HEAD }
        $null = Get-Lines { git -C $dir pull --ff-only }
        if ($LASTEXITCODE -ne 0) {
            Add-Result $item 'WARN' 'update failed (local changes?) - kept the current copy'
            return
        }
        if ((Get-FirstLine { git -C $dir rev-parse HEAD }) -eq $before) {
            Add-Result $item 'SKIP' 'already up to date'
        } else {
            Add-Result $item 'OK' 'updated'
        }
        return
    }
    if (Test-Path $dir) {
        Add-Result $item 'WARN' "$dir exists but is not a git folder - skipped"
        return
    }
    if ($Sparse) {
        git clone --depth 1 --filter=blob:none --sparse $Url $dir
        if ($LASTEXITCODE -eq 0) { git -C $dir sparse-checkout set $Sparse }
    } else {
        git clone --depth 1 $Url $dir
    }
    if ($LASTEXITCODE -eq 0) { Add-Result $item 'OK' $dir } else { Add-Result $item 'FAIL' "git clone failed: $Url" }
}

# Unzip a skill package into each skill root. A hash marker skips it when nothing changed.
function Install-ZipSkill([string]$Item, [string]$Zip, [string]$SkillName, [string[]]$Roots) {
    if (-not (Test-Path $Zip)) {
        Add-Result $Item 'FAIL' "$(Split-Path $Zip -Leaf) not found - report-harness not cloned?"
        return
    }
    $hash = (Get-FileHash $Zip).Hash
    $done = 0
    foreach ($root in $Roots) {
        $dest = Join-Path $root $SkillName
        $marker = Join-Path $dest '.source-sha256'
        if ((Test-Path $marker) -and ((Get-Content $marker -Raw).Trim() -eq $hash)) { continue }
        if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
        if (-not (Test-Path $root)) { New-Item -ItemType Directory -Path $root -Force | Out-Null }
        Expand-Archive -Path $Zip -DestinationPath $root -Force
        Set-Content -Path $marker -Value $hash -Encoding ASCII
        $done++
    }
    if ($done -eq 0) { Add-Result $Item 'SKIP' 'already up to date' } else { Add-Result $Item 'OK' "installed in $done folder(s)" }
}

function Copy-SkillFolder([string]$Item, [string]$From, [string]$SkillName, [string[]]$Roots) {
    $hash = (Get-FileHash (Join-Path $From 'SKILL.md')).Hash
    $todo = @($Roots | Where-Object {
        $f = Join-Path (Join-Path $_ $SkillName) 'SKILL.md'
        -not ((Test-Path $f) -and (Get-FileHash $f).Hash -eq $hash)
    })
    if ($todo.Count -eq 0) {
        Add-Result $Item 'SKIP' 'already up to date'
        return
    }
    foreach ($root in $todo) {
        $dest = Join-Path $root $SkillName
        if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
        if (-not (Test-Path $root)) { New-Item -ItemType Directory -Path $root -Force | Out-Null }
        Copy-Item $From $dest -Recurse -Force
    }
    Add-Result $Item 'OK' "copied to $($todo.Count) folder(s)"
}

# Every skill folder under $From into each root, one result line for the whole set
function Copy-SkillSet([string]$Item, [string]$From, [string[]]$Roots) {
    $skills = @(Get-ChildItem $From -Directory -ErrorAction SilentlyContinue | Where-Object { Test-Path (Join-Path $_.FullName 'SKILL.md') })
    if ($skills.Count -eq 0) {
        Add-Result $Item 'FAIL' "no skills in $From"
        return
    }
    $copied = 0
    foreach ($root in $Roots) {
        foreach ($s in $skills) {
            $dest = Join-Path $root $s.Name
            $f = Join-Path $dest 'SKILL.md'
            if ((Test-Path $f) -and (Get-FileHash $f).Hash -eq (Get-FileHash (Join-Path $s.FullName 'SKILL.md')).Hash) { continue }
            if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
            if (-not (Test-Path $root)) { New-Item -ItemType Directory -Path $root -Force | Out-Null }
            Copy-Item $s.FullName $dest -Recurse -Force
            $copied++
        }
    }
    if ($copied -eq 0) { Add-Result $Item 'SKIP' "already up to date ($($skills.Count) skills)" } else { Add-Result $Item 'OK' "$($skills.Count) skills, $copied copied" }
}

# Claude Code gets the full report-harness plugin from the local clone
function Install-ClaudePlugin([string]$Dir) {
    $item = 'Claude plugin report-harness'
    if (-not (Test-Path (Join-Path $Dir '.claude-plugin\marketplace.json'))) {
        Add-Result $item 'FAIL' 'report-harness not cloned'
        return
    }
    if (((Get-Lines { & $Claude plugin list }) -join ' ') -match 'report-harness') {
        & $Claude plugin marketplace update report-harness *> $null
        & $Claude plugin update report-harness@report-harness *> $null
        Add-Result $item 'SKIP' 'already installed (update checked)'
        return
    }
    & $Claude plugin marketplace add $Dir *> $null
    & $Claude plugin install report-harness@report-harness
    if (((Get-Lines { & $Claude plugin list }) -join ' ') -match 'report-harness') {
        Add-Result $item 'OK' 'installed'
    } else {
        Add-Result $item 'FAIL' 'claude plugin install failed'
    }
}

# Same content: skip. Different content: back up and replace, or keep the user's own file.
function Copy-RuleFile([string]$Item, [string]$From, [string]$To, [bool]$KeepExisting = $false) {
    if (-not (Test-Path $From)) {
        Add-Result $Item 'FAIL' "$(Split-Path $From -Leaf) not found - put it in $Workspace"
        return
    }
    $parent = Split-Path $To
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    if (Test-Path $To) {
        if ((Get-FileHash $From).Hash -eq (Get-FileHash $To).Hash) {
            Add-Result $Item 'SKIP' 'already up to date'
            return
        }
        if ($KeepExisting) {
            Add-Result $Item 'WARN' "kept your own $(Split-Path $To -Leaf) - merge AGENTS.global.md by hand if you want it"
            return
        }
        $backup = '{0}.bak-{1}' -f $To, (Get-Date -Format 'yyyyMMdd-HHmmss')
        Copy-Item $To $backup
        Copy-Item $From $To -Force
        Add-Result $Item 'WARN' "replaced; old file saved as $(Split-Path $backup -Leaf)"
        return
    }
    Copy-Item $From $To
    Add-Result $Item 'OK' $To
}

# Policy a normal PowerShell window will use (this window runs with -ExecutionPolicy Bypass)
function Get-EffectivePolicy {
    foreach ($scope in @('MachinePolicy', 'UserPolicy', 'CurrentUser', 'LocalMachine')) {
        $p = "$(Get-ExecutionPolicy -Scope $scope)"
        if ($p -ne 'Undefined') { return [pscustomobject]@{ Scope = $scope; Policy = $p } }
    }
    return [pscustomobject]@{ Scope = 'Default'; Policy = 'Restricted' }
}

# True if Everyone, Authenticated Users or Users may write in $Dir.
# A new folder under C:\ inherits this from C:\, unlike folders under the user profile.
function Test-SharedWrite([string]$Dir) {
    $shared = @('S-1-1-0', 'S-1-5-11', 'S-1-5-32-545')
    $write = [int][Security.AccessControl.FileSystemRights]'WriteData, AppendData'
    foreach ($ace in (Get-Acl $Dir).Access) {
        if ("$($ace.AccessControlType)" -ne 'Allow') { continue }
        try { $sid = $ace.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value } catch { continue }
        if (($shared -contains $sid) -and (([int]$ace.FileSystemRights -band $write) -ne 0)) { return $true }
    }
    return $false
}

# Limit the workspace to this user, SYSTEM and Administrators (SIDs avoid localized names)
function Protect-Workspace([string]$Dir) {
    if (-not (Test-SharedWrite $Dir)) {
        Add-Result 'Workspace access' 'SKIP' 'only this user can write'
        return
    }
    $me = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
    icacls $Dir /inheritance:r /grant:r "*$($me):(OI)(CI)F" '*S-1-5-18:(OI)(CI)F' '*S-1-5-32-544:(OI)(CI)F' | Out-Null
    if (Test-SharedWrite $Dir) {
        Add-Result 'Workspace access' 'WARN' 'other accounts can still write - ask an assistant'
    } else {
        Add-Result 'Workspace access' 'OK' 'limited to this user'
    }
}

function Test-Elevated {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($id)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

Write-Host 'Vibe Coding Day 1 setup. Takes about 25 minutes.' -ForegroundColor Cyan
Write-Host 'If a Windows permission window (UAC) appears, click "Yes".' -ForegroundColor Cyan
Update-SessionPath
# The agent installers add their folder to the user PATH; repair it if that did not happen
$AgentBins = @{ claude = (Join-Path $HOME '.local\bin'); codex = (Join-Path $env:LOCALAPPDATA 'Programs\OpenAI\Codex\bin') }
foreach ($n in $AgentBins.Keys) {
    if (-not (Test-Command $n) -and (Test-Path (Join-Path $AgentBins[$n] "$n.exe"))) { Add-UserPath $AgentBins[$n] }
}
$Codex = Get-NativeCommand 'codex'
$Claude = Get-NativeCommand 'claude'
$Selected = @(Select-Agents $Agents)

# ---------------------------------------------------------------- 1
Write-Step '1. Check pre-course setup'

if (Test-Elevated) {
    Write-Host '   This window is "Run as administrator". Tools may be installed for the wrong user.' -ForegroundColor Yellow
    Write-Host '   Recommended: close it and run setup.ps1 in a normal PowerShell window.' -ForegroundColor Yellow
    $answer = Read-Host '   Continue anyway? (y/N)'
    if ($answer -notmatch '^[yY]') {
        Write-Log 'Stopped: running as administrator'
        exit 1
    }
    Add-Result 'Admin window' 'WARN' 'continued as administrator'
}

Add-Result 'Workspace' 'OK' $Workspace
Protect-Workspace $Workspace

# Files from the instructor belong in the workspace (the agent reads 00_*.md there)
$isCourseFile = { $_.Name -eq 'setup.ps1' -or $_.Name -eq 'AGENTS.global.md' -or $_.Name -like '00_*.md' }
if ($PSScriptRoot -and (Resolve-Path $PSScriptRoot).Path.TrimEnd('\') -ne $Workspace) {
    $files = @(Get-ChildItem $PSScriptRoot -File | Where-Object $isCourseFile)
    foreach ($f in $files) { Copy-Item $f.FullName (Join-Path $Workspace $f.Name) -Force }
    Add-Result 'Course files' 'OK' "copied $($files.Count) file(s) to $Workspace"
}
# Downloaded files carry a "from the internet" mark. Under a RemoteSigned policy set by IT
# that mark stops setup.ps1 from running again, so clear it.
try { Get-ChildItem $Workspace -File | Where-Object $isCourseFile | Unblock-File -ErrorAction Stop } catch { }

# An AGENTS.md here would be loaded on top of the global one when Codex starts in the workspace
if (Test-Path (Join-Path $Workspace 'AGENTS.md')) {
    Add-Result 'Workspace AGENTS.md' 'WARN' 'loaded twice with the global rules - delete it unless you need it'
}

$os = Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue
if (-not $os) { $os = [pscustomobject]@{ BuildNumber = [Environment]::OSVersion.Version.Build; Caption = "Windows $([Environment]::OSVersion.Version)" } }
if ([int]$os.BuildNumber -ge 22000) {
    Add-Result 'Windows' 'OK' $os.Caption
} else {
    Add-Result 'Windows' 'WARN' "$($os.Caption) - Windows 10 is not supported"
}

# Downloads in this script follow the Windows proxy setting; npm and git do not
try {
    $proxy = [Net.WebRequest]::GetSystemWebProxy().GetProxy([uri]'https://registry.npmjs.org/')
    if ($proxy -and $proxy.Host -ne 'registry.npmjs.org') {
        Add-Result 'Proxy' 'WARN' "$($proxy.Authority) - if npm or git downloads fail, ask an assistant"
    }
} catch { }

# npm.ps1 / npx.ps1 need RemoteSigned or looser in normal windows
$ep = Get-EffectivePolicy
if (@('RemoteSigned', 'Unrestricted', 'Bypass') -contains $ep.Policy) {
    Add-Result 'Execution policy' 'OK' "$($ep.Policy) ($($ep.Scope))"
} elseif (@('MachinePolicy', 'UserPolicy') -contains $ep.Scope) {
    Add-Result 'Execution policy' 'FAIL' "$($ep.Policy) set by Group Policy - ask IT to allow RemoteSigned"
} else {
    # This window's Bypass makes Set-ExecutionPolicy report an "overridden" error; the value is still saved
    try { Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force -ErrorAction Stop } catch { }
    if ("$(Get-ExecutionPolicy -Scope CurrentUser)" -eq 'RemoteSigned') {
        Add-Result 'Execution policy' 'OK' 'set to RemoteSigned (CurrentUser)'
    } else {
        Add-Result 'Execution policy' 'FAIL' "still $($ep.Policy) - run pre-course step 3-1"
    }
}

$blocked = $false

# winget installs Node.js, Git, GitHub CLI and FFmpeg. A new Windows account gets it only
# after App Installer registers itself, so register it now (no admin needed).
if (-not (Test-Command 'winget')) {
    try { Add-AppxPackage -RegisterByFamilyName -MainPackage Microsoft.DesktopAppInstaller_8wekyb3d8bbwe -ErrorAction Stop } catch { }
    Add-UserPath (Join-Path $env:LOCALAPPDATA 'Microsoft\WindowsApps')
}
$HaveWinget = Test-Command 'winget'
if (-not $HaveWinget) {
    Add-Result 'winget' 'WARN' 'not found - update "App Installer" in Microsoft Store; tools that need it are skipped'
}

# Node.js 22 or later. Missing or older: install the LTS (installer with UAC first, per-user zip if that fails).
$nodeNote = ''
if ((Get-NodeMajor) -lt 22) { Add-UserPath (Join-Path $env:ProgramFiles 'nodejs') }
if ((Get-NodeMajor) -lt 22 -and $HaveWinget) {
    Write-Host '   Installing Node.js LTS...'
    Install-WingetPackage 'OpenJS.NodeJS.LTS' @('', 'user')
    Update-SessionPath
    Add-UserPath (Join-Path $env:ProgramFiles 'nodejs')
    $nodeNote = ' (installed now)'
}
if ((Get-NodeMajor) -ge 22) {
    Add-Result 'Node.js' 'OK' ((Get-FirstLine { node -v }) + $nodeNote)
} elseif (Test-Command 'node') {
    Add-Result 'Node.js' 'FAIL' "$(Get-FirstLine { node -v }) at $((Get-Command node).Source) - v22 or later needed (pre-course step 3-2)"
    $blocked = $true
} else {
    Add-Result 'Node.js' 'FAIL' 'not found (pre-course step 3-2)'
    $blocked = $true
}

# Agents: a chosen agent that is not installed is dropped from the selection.
# Trainees use their own subscription, so an API-key login (billed per use) is a WARN.
if ($Selected -contains 'codex') {
    if (Test-Command 'codex') {
        Add-Result 'Codex' 'OK' (Get-FirstLine { & $Codex --version })
        $login = (Get-Lines { & $Codex login status }) -join ' '
        if ($login -match 'ChatGPT') {
            Add-Result 'Codex login' 'OK' 'ChatGPT subscription'
        } elseif ($login -match 'API key') {
            Add-Result 'Codex login' 'WARN' 'API key, billed per use - run: codex logout, then codex login'
        } elseif ($login -cmatch 'Logged in') {  # case-sensitive: "Not logged in" must not match
            Add-Result 'Codex login' 'OK' 'logged in'
        } else {
            Add-Result 'Codex login' 'WARN' 'not logged in - run: codex login'
        }
    } else {
        Add-Result 'Codex' 'FAIL' 'not found (pre-course step 3-3) - Codex steps skipped'
        $Selected = @($Selected | Where-Object { $_ -ne 'codex' })
    }
}
if ($Selected -contains 'claude') {
    if (Test-Command 'claude') {
        $claudeV = Get-FirstLine { & $Claude --version }
        Add-Result 'Claude Code' 'OK' $claudeV
        # "claude auth status" prints JSON (loggedIn, authMethod). Older versions would take
        # "auth status" as a prompt and open a session, so ask only versions documented to have it.
        $auth = $null
        if ($claudeV -match '^(\d+\.\d+\.\d+)' -and [version]$Matches[1] -ge [version]'2.1.268') {
            try { $auth = ((& $Claude auth status 2>$null) -join "`n") | ConvertFrom-Json } catch { }
        }
        if ($null -eq $auth) {
            Add-Result 'Claude login' 'WARN' 'not checked - run: claude update, then /status in Claude Code'
        } elseif (-not $auth.loggedIn) {
            Add-Result 'Claude login' 'WARN' 'not logged in - run: claude auth login'
        } elseif (@('claude.ai', 'oauth_token') -contains $auth.authMethod) {
            Add-Result 'Claude login' 'OK' 'Claude subscription'
        } else {
            Add-Result 'Claude login' 'WARN' "$($auth.authMethod), billed per use - run: claude auth logout, then claude auth login"
        }
        # Once approved, an API key in the environment is used instead of the subscription
        if ($env:ANTHROPIC_API_KEY -or [Environment]::GetEnvironmentVariable('ANTHROPIC_API_KEY', 'User') -or
            [Environment]::GetEnvironmentVariable('ANTHROPIC_API_KEY', 'Machine')) {
            Add-Result 'ANTHROPIC_API_KEY' 'WARN' 'set on this PC - answer No when Claude Code asks to use it'
        }
    } else {
        Add-Result 'Claude Code' 'FAIL' 'not found (pre-course step 3-3) - Claude Code steps skipped'
        $Selected = @($Selected | Where-Object { $_ -ne 'claude' })
    }
}
if ($Selected -contains 'antigravity') {
    if (Test-Antigravity) {
        Add-Result 'Antigravity' 'OK' 'found'
    } else {
        Add-Result 'Antigravity' 'WARN' 'app not found - its files are installed anyway'
    }
}
if ($Selected.Count -eq 0) {
    Add-Result 'Agents' 'FAIL' 'no chosen agent is installed - install the one you subscribed to (pre-course step 3-3)'
    $blocked = $true
} else {
    Add-Result 'Agents' 'OK' ($Selected -join ', ')
}

if ($blocked) {
    Write-Host ''
    Write-Host 'Pre-course setup is not finished. Stopping here - please call an assistant.' -ForegroundColor Red
    Write-Log 'Stopped: pre-course setup not finished'
    exit 1
}

# ---------------------------------------------------------------- 2
Write-Step '2. Base tools - Git, GitHub CLI, FFmpeg, Python'

# Scopes: per-user install first (no admin rights needed), then the package default
$packages = @(
    @{ Name = 'Git';        Id = 'Git.Git';     Scopes = @('user', ''); Test = { Test-Command 'git' };
       Dirs = { @((Join-Path $env:ProgramFiles 'Git\cmd'), (Join-Path $env:LOCALAPPDATA 'Programs\Git\cmd')) } },
    @{ Name = 'GitHub CLI'; Id = 'GitHub.cli';  Scopes = @('user', ''); Test = { Test-Command 'gh' };
       Dirs = { @((Join-Path $env:ProgramFiles 'GitHub CLI'), (Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links')) } },
    @{ Name = 'FFmpeg';     Id = 'Gyan.FFmpeg'; Scopes = @('');         Test = { Test-Command 'ffmpeg' };
       Dirs = { @(Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links') } }
)

foreach ($p in $packages) {
    if (& $p.Test) {
        Add-Result $p.Name 'SKIP' 'already installed'
        continue
    }
    # Installed before but missing from PATH?
    foreach ($d in (& $p.Dirs)) { Add-UserPath $d }
    if (& $p.Test) {
        Add-Result $p.Name 'OK' 'already installed - added to PATH'
        continue
    }
    if (-not $HaveWinget) {
        Add-Result $p.Name 'FAIL' 'winget not found - update "App Installer" in Microsoft Store'
        continue
    }
    Write-Host "   Installing $($p.Name)..."
    Install-WingetPackage $p.Id $p.Scopes
    $code = $LASTEXITCODE
    Update-SessionPath
    if (-not (& $p.Test)) {
        foreach ($d in (& $p.Dirs)) { Add-UserPath $d }
    }
    if (& $p.Test) {
        Add-Result $p.Name 'OK' 'installed'
    } else {
        Add-Result $p.Name 'FAIL' "winget exit code $code - ask an assistant"
    }
}

# Python folders go to the FRONT of the user PATH so they win over the Microsoft Store shortcut
if (Test-PythonOk) {
    Add-Result 'Python' 'SKIP' (Get-PythonVersion)
} else {
    $pyError = ''
    foreach ($d in Get-PythonDirs) { Add-UserPath $d $true }
    if (-not (Test-PythonOk)) {
        Write-Host "   Installing Python $PythonVersion for this user (python.org)..."
        $pyError = Install-PythonLocal
        Update-SessionPath
        if (-not (Test-PythonOk)) {
            foreach ($d in Get-PythonDirs) { Add-UserPath $d $true }
        }
    }
    if (Test-PythonOk) {
        Add-Result 'Python' 'OK' (Get-PythonVersion)
    } elseif ($pyError) {
        Add-Result 'Python' 'FAIL' $pyError
    } elseif (Get-PythonVersion) {
        # an older all-users Python on the system PATH comes before the user PATH
        Add-Result 'Python' 'FAIL' "$(Get-PythonVersion) at $((Get-Command python).Source) comes first on PATH - ask an assistant"
    } else {
        Add-Result 'Python' 'FAIL' "Python $PythonVersion not found after install"
    }
}

# report-harness scripts and hooks call "python3"; on Windows that name is only the Store shortcut
if ((Test-PythonOk) -and ((Get-FirstLine { python3 --version }) -notmatch '^Python 3')) {
    $pyDir = Split-Path (Get-Command python).Source
    Copy-Item (Join-Path $pyDir 'python.exe') (Join-Path $pyDir 'python3.exe') -Force
    if ((Get-FirstLine { python3 --version }) -match '^Python 3') {
        Add-Result 'python3 command' 'OK' 'python3.exe added'
    } else {
        Add-Result 'python3 command' 'WARN' 'python3 still not working - tell the instructor'
    }
}

# ---------------------------------------------------------------- 3
Write-Step '3. Git user name and e-mail'

if (Test-Command 'git') {
    if (-not (git config --global user.name)) {
        $name = Read-Host '   Git user name (e.g. Hong Gildong)'
        if ($name) { git config --global user.name $name }
    }
    if (-not (git config --global user.email)) {
        $email = Read-Host '   GitHub e-mail'
        if ($email) { git config --global user.email $email }
    }
    git config --global init.defaultBranch main
    if ((git config --global user.name) -and (git config --global user.email)) {
        Add-Result 'Git user' 'OK' 'name and e-mail set'
    } else {
        Add-Result 'Git user' 'WARN' 'name or e-mail is empty'
    }
} else {
    Add-Result 'Git user' 'FAIL' 'Git not found'
}

# ---------------------------------------------------------------- 4
Write-Step '4. Vercel CLI, Supabase CLI, HyperFrames CLI'

Install-NpmGlobal 'Vercel CLI' 'vercel' 'vercel'

# Supabase CLI runs through npx (no install). Download it once now so login is faster later.
Write-Host '   Downloading Supabase CLI...'
$sbVersion = Get-Lines { npx.cmd -y supabase@latest --version } | Where-Object { $_ -match '^\d+\.\d+' } | Select-Object -Last 1
if ($sbVersion) {
    Add-Result 'Supabase CLI' 'OK' $sbVersion
} else {
    Add-Result 'Supabase CLI' 'WARN' 'first run failed - check again at login'
}

# HyperFrames renders videos (day 2) with its own pinned Chrome build. Download it now, not 30 PCs at once in class.
Install-NpmGlobal 'HyperFrames CLI' 'hyperframes' 'hyperframes'
if (Test-Command 'hyperframes') {
    Write-Host '   Downloading Chrome for HyperFrames rendering...'
    $null = Get-Lines { hyperframes.cmd browser ensure }
    if ($LASTEXITCODE -eq 0) {
        Add-Result 'HyperFrames Chrome' 'OK' 'ready'
    } else {
        Add-Result 'HyperFrames Chrome' 'WARN' 'download failed - the first render downloads it'
    }
}

# ---------------------------------------------------------------- 5
Write-Step '5. Course repositories - report-harness, HyperFrames skills'

if (Test-Command 'git') {
    $env:GIT_TERMINAL_PROMPT = '0'   # public repositories: never wait for a password prompt
    foreach ($r in $CourseRepos) { Sync-Repo $r.Name $r.Url }
    $env:GIT_LFS_SKIP_SMUDGE = '1'   # the hyperframes repository keeps large test media in Git LFS; skills need none of it
    Sync-Repo $HyperframesRepo.Name $HyperframesRepo.Url $HyperframesRepo.Sparse
} else {
    Add-Result 'Course repositories' 'FAIL' 'Git not found'
}

# ---------------------------------------------------------------- 6
Write-Step '6. MCP - sequential-thinking, kordoc, korean-law'

# Ask for LAW_OC once, only if a selected agent still lacks korean-law
$needLaw = (($Selected -contains 'codex') -and -not (Test-Mcp 'korean-law')) -or
    (($Selected -contains 'claude') -and -not (Test-ClaudeMcp 'korean-law')) -or
    (($Selected -contains 'antigravity') -and -not (Test-AntigravityMcp 'korean-law'))
$oc = ''
if ($needLaw) {
    Write-Host '   Enter your law API key (LAW_OC). Typing is hidden. Press Enter to skip.' -ForegroundColor Yellow
    $secure = Read-Host '   LAW_OC' -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        $oc = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}

if ($Selected -contains 'codex') {
    foreach ($s in $McpServers) { Register-CodexMcp $s $oc }
}
if ($Selected -contains 'claude') {
    foreach ($s in $McpServers) { Register-ClaudeMcp $s $oc }
    if ($oc) {
        # the report-harness plugin reads ${LAW_OC} from the environment
        [Environment]::SetEnvironmentVariable('LAW_OC', $oc, 'User')
        Add-Result 'LAW_OC for Claude plugin' 'OK' 'saved as a user environment variable'
    }
}
if ($Selected -contains 'antigravity') {
    Register-AntigravityMcp $oc
}
$oc = $null

# ---------------------------------------------------------------- 7
Write-Step '7. Skills - impeccable, report tools, humanizer, think, HyperFrames'

# impeccable: the installer knows Codex and Claude Code; Antigravity gets a copy of the skill folder
$impPaths = @{ codex = (Join-Path $HOME '.agents\skills\impeccable'); claude = (Join-Path $HOME '.claude\skills\impeccable') }
$impProviders = @($Selected | Where-Object { $_ -eq 'codex' -or $_ -eq 'claude' })
if ($impProviders.Count -eq 0) { $impProviders = @('codex') }
$impMissing = @($impProviders | Where-Object { -not (Test-Path (Join-Path $impPaths[$_] 'SKILL.md')) })
if ($impMissing.Count -gt 0) {
    npx.cmd -y impeccable install -y "--providers=$($impMissing -join ',')" --scope=global
}
foreach ($pv in $impProviders) {
    $item = "impeccable ($pv)"
    if ($impMissing -notcontains $pv) {
        Add-Result $item 'SKIP' 'already installed'
    } elseif (Test-Path (Join-Path $impPaths[$pv] 'SKILL.md')) {
        Add-Result $item 'OK' 'installed'
    } else {
        Add-Result $item 'FAIL' "$($impPaths[$pv]) not found"
    }
}
if ($Selected -contains 'antigravity') {
    $impSource = @($impPaths.Values | Where-Object { Test-Path (Join-Path $_ 'SKILL.md') } | Select-Object -First 1)
    if ($impSource.Count -gt 0) {
        Copy-SkillFolder 'impeccable (antigravity)' $impSource[0] 'impeccable' $AntigravitySkillRoots
    } else {
        Add-Result 'impeccable (antigravity)' 'FAIL' 'no impeccable skill to copy'
    }
}

# Report tools: Codex and Antigravity get the kca-report-hwpx skill, Claude Code the full harness plugin
$Harness = Join-Path $Workspace 'report-harness'
if ($Selected -contains 'codex') {
    Install-ZipSkill 'kca-report-hwpx (codex)' (Join-Path $Harness 'dist\kca-report-hwpx-codex.zip') 'kca-report-hwpx' @(Join-Path $HOME '.agents\skills')
}
if ($Selected -contains 'antigravity') {
    Install-ZipSkill 'kca-report-hwpx (antigravity)' (Join-Path $Harness 'dist\kca-report-hwpx-antigravity.zip') 'kca-report-hwpx' $AntigravitySkillRoots
}
if ($Selected -contains 'claude') {
    Install-ClaudePlugin $Harness
}

# humanizer (natural Korean wording) comes with the report-harness plugin for Claude Code; Codex and Antigravity get a copy
$Humanizer = Join-Path $Harness 'skills\humanizer'
foreach ($a in @($Selected | Where-Object { $_ -ne 'claude' })) {
    if (Test-Path (Join-Path $Humanizer 'SKILL.md')) {
        Copy-SkillFolder "humanizer ($a)" $Humanizer 'humanizer' $SkillRoots[$a]
    } else {
        Add-Result "humanizer ($a)" 'FAIL' 'report-harness not cloned'
    }
}

foreach ($a in $Selected) {
    $written = 0
    foreach ($root in $SkillRoots[$a]) {
        $f = Join-Path $root 'think\SKILL.md'
        if ((Test-Path $f) -and ((Get-Content $f -Raw -Encoding UTF8) -eq $ThinkSkill)) { continue }
        Write-Utf8 $f $ThinkSkill
        $written++
    }
    if ($written -eq 0) { Add-Result "think ($a)" 'SKIP' 'already up to date' } else { Add-Result "think ($a)" 'OK' "written to $written folder(s)" }
}

# HyperFrames: the same skill set for every selected agent
$HfSkills = Join-Path (Join-Path $Workspace $HyperframesRepo.Name) 'skills'
if (Test-Path $HfSkills) {
    foreach ($a in $Selected) { Copy-SkillSet "HyperFrames skills ($a)" $HfSkills $SkillRoots[$a] }
    # Keep these skills as installed: "hyperframes init" would otherwise update them from GitHub (a ~500 MB clone)
    if ([Environment]::GetEnvironmentVariable('HYPERFRAMES_SKIP_SKILLS', 'User') -eq '1') {
        Add-Result 'HyperFrames skill updates' 'SKIP' 'already off'
    } else {
        [Environment]::SetEnvironmentVariable('HYPERFRAMES_SKIP_SKILLS', '1', 'User')
        Add-Result 'HyperFrames skill updates' 'OK' 'off (HYPERFRAMES_SKIP_SKILLS=1) - run setup.ps1 again to update'
    }
} else {
    Add-Result 'HyperFrames skills' 'FAIL' 'hyperframes-skills not cloned'
}

# ---------------------------------------------------------------- 8
Write-Step '8. Global rules for each agent'

# Global locations, so they are also read inside project folders that are git repositories
$Rules = Join-Path $Workspace 'AGENTS.global.md'
if ($Selected -contains 'codex') {
    Copy-RuleFile 'Codex rules' $Rules (Join-Path $CodexHome 'AGENTS.md')

    # AGENTS.global.md caps the course at gpt-6-sol / medium; spawned sub-agents get the same cap
    $ConfigPath = Join-Path $CodexHome 'config.toml'
    $config = ''
    if (Test-Path $ConfigPath) { $config = Get-Content $ConfigPath -Raw }
    $subModel = '(?m)^\s*default_subagent_model\s*=\s*"gpt-6-sol"'
    $subEffort = '(?m)^\s*default_subagent_reasoning_effort\s*=\s*"(low|medium)"'
    if ($config -match '(?m)^\s*\[agents\]') {
        if (($config -match $subModel) -and ($config -match $subEffort)) {
            Add-Result 'Sub-agent reasoning' 'SKIP' 'already set'
        } else {
            Add-Result 'Sub-agent reasoning' 'WARN' '[agents] exists - set default_subagent_model = "gpt-6-sol" and default_subagent_reasoning_effort = "medium" by hand'
        }
    } else {
        # Append without BOM; a table at the end of the file is valid TOML
        $block = "`r`n[agents]`r`ndefault_subagent_model = `"gpt-6-sol`"`r`ndefault_subagent_reasoning_effort = `"medium`"`r`n"
        try {
            if (-not (Test-Path $CodexHome)) { New-Item -ItemType Directory -Path $CodexHome -Force -ErrorAction Stop | Out-Null }
            [IO.File]::AppendAllText($ConfigPath, $block, (New-Object System.Text.UTF8Encoding $false))
            Add-Result 'Sub-agent reasoning' 'OK' 'gpt-6-sol, medium'
        } catch {
            Add-Result 'Sub-agent reasoning' 'FAIL' "cannot write $ConfigPath"
        }
    }
}
# Claude Code and Antigravity: never overwrite a personal global file
if ($Selected -contains 'claude') {
    Copy-RuleFile 'Claude rules' $Rules (Join-Path $HOME '.claude\CLAUDE.md') $true
}
if ($Selected -contains 'antigravity') {
    Copy-RuleFile 'Antigravity rules' $Rules (Join-Path $HOME '.gemini\AGENTS.md') $true
}

# ---------------------------------------------------------------- Result
Write-Step 'Result'
$Results | Format-Table -AutoSize | Out-String | Write-Host

$failed = @($Results | Where-Object { $_.Status -eq 'FAIL' }).Count
if ($failed -gt 0) {
    Write-Host "FAIL: $failed item(s). Your AI agent will help fix them in the next step." -ForegroundColor Yellow
}
Write-Log ('Finished - FAIL {0}' -f $failed)

Write-Host ''
Write-Host 'Next:' -ForegroundColor Cyan
if ($PathChanged) {
    Write-Host '   PATH was updated. Close ALL PowerShell and Terminal windows first.' -ForegroundColor Yellow
} else {
    Write-Host '   Close this window.'
}
Write-Host '   Open a new PowerShell window and start your agent:'
Write-Host '      cd C:\workspace'
if ($Selected -contains 'codex') { Write-Host '      codex           (Codex)' }
if ($Selected -contains 'claude') { Write-Host '      claude          (Claude Code)' }
if ($Selected -contains 'antigravity') { Write-Host '   Antigravity: open the app and open the folder C:\workspace' }
Write-Host '   Then type the one-line request from Part A, step 5 of the setup guide.'
