# Vibe Coding Intermediate Course - setup script, run once BEFORE the course (about 50 minutes)
# Windows PowerShell 5.1 or later. ASCII only, so it survives mail, download and re-saving.
#
# Installs AND downloads everything both course days use - nothing is installed or downloaded on the day:
#   1. this PC and C:\workspace       execution policy, workspace folder, course files (latest from the course hub),
#                                      sites the course uses (a blocked one shows up now)
#   2. Node.js and Codex CLI           winget / the official Codex installer
#   3. Git, GitHub CLI, Python, FFmpeg
#   4. Git user name and e-mail        the only questions it asks
#   5. Vercel CLI                      updated if older than the version the course was checked with
#   6. course repositories             slop-rewrite, cokacmotion (aimotion), vibe-coding-start
#      start folders                   C:\workspace\vibe (day 1) and C:\workspace\deck (day 2): copied if missing,
#                                      otherwise only the course's own files are refreshed; npm packages downloaded
#   7. MCP                             sequential-thinking, kordoc - registered and downloaded (kordoc about 600 MB)
#   8. skills                          impeccable (and its engine), think, slop-rewrite, aimotion
#   9. Codex global rules              AGENTS.global.md
#  10. trial run                       build the day-1 web app, make a 1-second day-2 video, look for ego lite
# ego lite (the agent browser) is installed by hand - see the pre-course notice.
#
# Save setup.ps1 and AGENTS.global.md in the SAME folder (Downloads), open "Windows PowerShell"
# from the Start menu (a NORMAL window, not "Run as administrator") and run:
#
#   powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\setup.ps1"
#
# "not digitally signed" error (IT sets RemoteSigned and the file came from the web):
#   Unblock-File "$env:USERPROFILE\Downloads\setup.ps1"   then run it again.
#
# No login here: the course gives each trainee a ChatGPT account on the day.
# An API-key login is reported as WARN.
# Safe to run again: finished items are skipped and course repositories are updated.
# Results go to C:\workspace\setup-log.txt (lines "Item | Status | Detail").
# The e-mail address is never written to the log.

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'  # progress bars make downloads and unzipping very slow in PowerShell 5.1

# Normal windows and Codex use Windows PowerShell 5.1, and PowerShell 7 keeps its own
# execution policy. Run in Windows PowerShell so the policy check below fixes the right one.
if ($PSVersionTable.PSEdition -eq 'Core' -and $IsWindows) {
    $self = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $PSCommandPath)
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

# kordoc version pinned for the course (day 2: read hwpx/pdf, make the 1-page hwpx)
$KordocPackage = 'kordoc@4.15.3'

# Course hub: the latest rules (AGENTS.global.md) and the day-of guide (00_...md) are downloaded from here
$HubUrl = 'https://kca-vibe.vercel.app'
$HubFiles = @('/materials/1/AGENTS.global/download', '/materials/2/00/download')

# An older Vercel CLI is updated: scripts\vercel.mjs (day 1 deploy) was checked with versions 63 and 65
$VercelMinMajor = 63

# Sites the course days use. Any HTTP answer counts as reachable; no answer usually means a firewall or proxy block.
$CourseSites = @(
    @{ Host = 'registry.npmjs.org';  Use = 'npm packages' },
    @{ Host = 'github.com';          Use = 'course repositories' },
    @{ Host = 'nodejs.org';          Use = 'Node.js when winget fails' },
    @{ Host = 'chatgpt.com';         Use = 'Codex' },
    @{ Host = 'auth.openai.com';     Use = 'Codex login' },
    @{ Host = 'www.data.go.kr';      Use = 'day 1 API key' },
    @{ Host = 'apis.data.go.kr';     Use = 'day 1 API (topic 02)' },
    @{ Host = 'api.odcloud.kr';      Use = 'day 1 API (topics 01, 03)' },
    @{ Host = 'vercel.com';          Use = 'day 1 deploy' },
    @{ Host = 'api.vercel.com';      Use = 'day 1 deploy' },
    @{ Host = 'lite.ego.app';        Use = 'ego lite' },
    @{ Host = 'kca-vibe.vercel.app'; Use = 'course hub' }
)

# Course repositories, each cloned to C:\workspace\<Name>
$CourseRepos = @(
    @{ Name = 'slop-rewrite'; Url = 'https://github.com/byungjunjang/slop-rewrite.git' },  # day 2: rewrite and check the report (Python standard library)
    @{ Name = 'cokacmotion';  Url = 'https://github.com/kstost/cokacmotion.git' },         # day 2: aimotion skill, motion technique notes (MIT, about 52 MB)
    @{ Name = 'vibe-coding-start'; Url = 'https://github.com/bcchung81/vibe-coding-start.git' }  # start folders: vibe (day 1 web app), deck (day 2 3D deck)
)

# MCP servers registered in Codex (wrapped in "cmd /c" on Windows). Registering needs no Codex login.
$McpServers = @(
    @{ Name = 'sequential-thinking'; Cmd = @('npx', '-y', '@modelcontextprotocol/server-sequential-thinking') },
    @{ Name = 'kordoc';              Cmd = @('npx', '-y', $KordocPackage, 'mcp') }
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
# Personal skill folder Codex reads
$SkillRoot = Join-Path $HOME '.agents\skills'

# "think": step-by-step analysis as a skill (the trainee asks "use the think skill to ...").
# AGENTS.global.md keeps sequential-thinking for user requests only; this skill is that request.
$ThinkSkill = @'
---
name: think
description: "Step-by-step analysis with the sequential-thinking MCP. Use only when the user asks for the think skill or asks to think a topic through step by step."
---

Analyze the user's topic step by step with the sequential-thinking MCP tool.

- Topic: what the user asked to analyze with this skill. If it is empty, use the task under discussion. If that is unclear too, ask once.
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

# Last line of a command's output, short enough for the result table
function Get-LastLine([string[]]$Lines) {
    $last = "$(@($Lines) | Select-Object -Last 1)"
    if ($last.Length -gt 80) { $last = $last.Substring(0, 80) }
    return $last
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

# Node.js LTS for the current user from the official zip, when winget is missing or fails (no admin needed).
# Checked against the SHA-256 list nodejs.org publishes next to it. Returns '' or an error.
function Install-NodeZip {
    $arch = 'x64'
    if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { $arch = 'arm64' }
    try {
        # Assigned first: PowerShell 5.1 passes a whole JSON array down a pipe as one object
        $releases = (Invoke-WebRequest -Uri 'https://nodejs.org/dist/index.json' -UseBasicParsing -TimeoutSec 60).Content | ConvertFrom-Json
        $lts = @($releases) | Where-Object { $_.lts -and (@($_.files) -contains "win-$arch-zip") } | Select-Object -First 1
        if (-not $lts) { return 'no LTS release found on nodejs.org' }
        $name = "node-$($lts.version)-win-$arch"
        $base = "https://nodejs.org/dist/$($lts.version)"
        $zip = Join-Path $env:TEMP "$name.zip"
        Invoke-WebRequest -Uri "$base/$name.zip" -OutFile $zip -UseBasicParsing
        $sums = "$((Invoke-WebRequest -Uri "$base/SHASUMS256.txt" -UseBasicParsing).Content)"
    } catch {
        return 'download from nodejs.org failed'
    }
    $want = [regex]::Match($sums, '(?m)^([0-9a-fA-F]{64})\s+' + [regex]::Escape("$name.zip") + '\s*$').Groups[1].Value
    if (-not $want -or (Get-FileHash $zip -Algorithm SHA256).Hash -ne $want) {
        Remove-Item $zip -ErrorAction SilentlyContinue
        return 'zip checksum check failed'
    }
    $dest = Join-Path $env:LOCALAPPDATA 'Programs\nodejs'
    try {
        if (Test-Path $dest) { Remove-Item $dest -Recurse -Force -ErrorAction Stop }
        # %LOCALAPPDATA%\Programs is missing on a new Windows account
        New-Item -ItemType Directory -Path (Split-Path $dest) -Force -ErrorAction Stop | Out-Null
        Expand-Archive -Path $zip -DestinationPath $env:TEMP -Force -ErrorAction Stop
        Move-Item (Join-Path $env:TEMP $name) $dest -ErrorAction Stop
    } catch {
        return "unzip failed: $($_.Exception.Message)"
    } finally {
        Remove-Item $zip -ErrorAction SilentlyContinue
    }
    Add-UserPath $dest $true
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

# Codex: register (or re-register an older unpinned kordoc)
function Register-CodexMcp($Server) {
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
    $addArgs = @('--', 'cmd', '/c') + $Server.Cmd   # '--' inside an array so PowerShell does not drop it
    & $Codex mcp add $Server.Name $addArgs | Out-Null
    if (Test-Mcp $Server.Name) { Add-Result $item 'OK' 'registered' } else { Add-Result $item 'FAIL' 'not registered' }
}

# Clone C:\workspace\<Name>, or update it with a fast-forward pull.
function Sync-Repo([string]$Name, [string]$Url) {
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
    git clone --depth 1 $Url $dir
    if ($LASTEXITCODE -eq 0) { Add-Result $item 'OK' $dir } else { Add-Result $item 'FAIL' "git clone failed: $Url" }
}

# A global skill entry that points at a skill kept inside its own repository (its commands run from there).
# The front matter (name, description) is copied from the repository's entry at run time, so this file stays ASCII.
function Install-PointerSkill([string]$Item, [string]$Entry, [string]$RepoDir, [string]$SkillName) {
    if (-not (Test-Path $Entry)) {
        Add-Result $Item 'FAIL' "$(Split-Path $RepoDir -Leaf) not cloned"
        return
    }
    $src = [IO.File]::ReadAllText($Entry)
    if ($src -notmatch '(?s)^\s*(---\r?\n.*?\r?\n---)') {
        Add-Result $Item 'FAIL' "no front matter in $Entry"
        return
    }
    $text = $Matches[1] + "`n`nThe skill lives in its repository. Read $Entry first and follow it exactly. Run its commands from $RepoDir.`n"
    $dest = Join-Path (Join-Path $SkillRoot $SkillName) 'SKILL.md'
    if ((Test-Path $dest) -and ([IO.File]::ReadAllText($dest) -eq $text)) {
        Add-Result $Item 'SKIP' 'already up to date'
        return
    }
    Write-Utf8 $dest $text
    Add-Result $Item 'OK' $dest
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

# Same content: skip. Different content: back up and replace.
function Copy-RuleFile([string]$Item, [string]$From, [string]$To) {
    if (-not (Test-Path $From)) {
        Add-Result $Item 'FAIL' "$(Split-Path $From -Leaf) not found - save it next to setup.ps1 and run setup.ps1 again"
        return
    }
    $parent = Split-Path $To
    if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Path $parent -Force | Out-Null }
    if (Test-Path $To) {
        if ((Get-FileHash $From).Hash -eq (Get-FileHash $To).Hash) {
            Add-Result $Item 'SKIP' 'already up to date'
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

# TLS 1.2, and the Windows login for proxies that ask for it, for Invoke-WebRequest in PowerShell 5.1
function Initialize-Web {
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    if ([Net.WebRequest]::DefaultWebProxy) { [Net.WebRequest]::DefaultWebProxy.Credentials = [Net.CredentialCache]::DefaultNetworkCredentials }
}

# Save a course file from the hub in the workspace, under the name the hub gives (a UTF-8 name such as 00_<Korean>.md,
# so this file stays ASCII). Returns the saved name, or '' if it could not be downloaded.
function Save-HubFile([string]$Path) {
    $tmp = Join-Path $env:TEMP ('hub-{0}.tmp' -f [guid]::NewGuid())
    try {
        $r = Invoke-WebRequest -Uri ($HubUrl + $Path) -OutFile $tmp -PassThru -UseBasicParsing -TimeoutSec 30 -ErrorAction Stop
        $cd = "$($r.Headers.Keys | Where-Object { $_ -eq 'Content-Disposition' } | ForEach-Object { $r.Headers[$_] })"
        if ($cd -notmatch "filename\*=UTF-8''([^;\s]+)") { return '' }
        $name = [uri]::UnescapeDataString($Matches[1])
        if ($name -notmatch '^[^\\/:*?"<>|]+$') { return '' }
        Move-Item $tmp (Join-Path $Workspace $name) -Force
        return $name
    } catch {
        return ''
    } finally {
        Remove-Item $tmp -ErrorAction SilentlyContinue
    }
}

# True if the site answers at all (any HTTP status, even an error page). False: no answer - blocked, DNS or proxy.
function Test-Site([string]$HostName) {
    try {
        $null = Invoke-WebRequest -Uri "https://$HostName/" -Method Head -UseBasicParsing -TimeoutSec 10 -ErrorAction Stop
        return $true
    } catch {
        return ($null -ne $_.Exception.Response)
    }
}

# Major version of the Vercel CLI, 0 if missing
function Get-VercelMajor {
    if (-not (Test-Command 'vercel')) { return 0 }
    if (((Get-Lines { vercel.cmd --version }) -join ' ') -match '(\d+)\.\d+\.\d+') { return [int]$Matches[1] }
    return 0
}

# Items of a start folder that belong to the course: rules, guides, skills, scripts, topic cards.
# Root .md files are the course's guides, except deck-plan.md, which the trainee rewrites on day 2.
# Everything else (app\, data\, src\, package.json, the trainee's PRD.md ...) is the trainee's.
function Test-CourseOwned($Item) {
    if (@('.agents', 'scripts', 'topics', '.env.example', '.gitignore', '.vercelignore') -contains $Item.Name) { return $true }
    return (-not $Item.PSIsContainer -and $Item.Extension -eq '.md' -and $Item.Name -ne 'deck-plan.md')
}

# Relative path and hash of every file under a file or folder, to compare two copies ('' if missing)
function Get-TreeHash([string]$Path) {
    if (-not (Test-Path $Path)) { return '' }
    $base = (Get-Item $Path -Force).FullName
    $lines = Get-ChildItem $Path -Recurse -File -Force | Sort-Object FullName | ForEach-Object {
        $_.FullName.Substring($base.Length) + '=' + (Get-FileHash $_.FullName).Hash
    }
    return ($lines -join "`n")
}

# Replace the course-owned items of an existing start folder that differ from the course copy; returns their names
function Update-StartFolder([string]$From, [string]$To) {
    foreach ($src in @(Get-ChildItem $From -Force | Where-Object { Test-CourseOwned $_ })) {
        $dest = Join-Path $To $src.Name
        if ((Get-TreeHash $src.FullName) -eq (Get-TreeHash $dest)) { continue }
        if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
        Copy-Item $src.FullName $dest -Recurse -Force
        $src.Name
    }
}

# Codex waits 10 seconds for an MCP server to start by default; give a slow one longer.
# "codex mcp add" has no option for it, so add the key to the server's table in config.toml (read and written as UTF-8).
function Set-McpStartupTimeout([string]$Name, [int]$Seconds) {
    $item = "Codex MCP $Name start time"
    $cfg = Join-Path $CodexHome 'config.toml'
    if (-not (Test-Path $cfg)) {
        Add-Result $item 'WARN' 'config.toml not found'
        return
    }
    $text = [IO.File]::ReadAllText($cfg)
    $m = [regex]::Match($text, '(?m)^\[mcp_servers\.("?)' + [regex]::Escape($Name) + '\1\][ \t]*(?=\r?$)')
    if (-not $m.Success) {
        Add-Result $item 'WARN' "[mcp_servers.$Name] not found in config.toml"
        return
    }
    # The table runs to the next [header] or the end of the file
    $rest = $text.Substring($m.Index + $m.Length)
    $next = [regex]::Match($rest, '(?m)^\[')
    $body = $rest
    if ($next.Success) { $body = $rest.Substring(0, $next.Index) }
    if ($body -match '(?m)^\s*startup_timeout_sec\s*=') {
        Add-Result $item 'SKIP' 'already set'
        return
    }
    $nl = "`n"
    if ($text.Contains("`r`n")) { $nl = "`r`n" }
    $text = $text.Insert($m.Index + $m.Length, "$($nl)startup_timeout_sec = $Seconds")
    [IO.File]::WriteAllText($cfg, $text, (New-Object System.Text.UTF8Encoding $false))
    Add-Result $item 'OK' "$Seconds seconds"
}

Write-Host 'Vibe Coding course - setup before the course. Takes about 50 minutes.' -ForegroundColor Cyan
Write-Host 'Keep this window open until "Result" appears. If a Windows permission window (UAC) appears, click "Yes".' -ForegroundColor Cyan
Update-SessionPath
Initialize-Web

# ---------------------------------------------------------------- 1
Write-Step '1. This PC and C:\workspace'

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
# The latest rules and the day-of guide from the course hub (they replace the copies next to setup.ps1),
# so the agent finds the day-of guide in the workspace on the course day
$saved = @($HubFiles | ForEach-Object { Save-HubFile $_ } | Where-Object { $_ })
if ($saved.Count -eq $HubFiles.Count) {
    Add-Result 'Hub files' 'OK' "downloaded $($saved.Count) file(s) from $HubUrl"
} else {
    Add-Result 'Hub files' 'WARN' "downloaded $($saved.Count) of $($HubFiles.Count) - is $HubUrl blocked? the copies next to setup.ps1 are used"
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

try {
    $freeGb = [math]::Round((Get-PSDrive C -ErrorAction Stop).Free / 1GB, 1)
    if ($freeGb -ge 10) { Add-Result 'Disk' 'OK' "$freeGb GB free on C:" } else { Add-Result 'Disk' 'WARN' "$freeGb GB free on C: - 10 GB or more recommended" }
} catch { }

# Day 2 draws 3D in the browser. Without a real graphics driver it falls back to software (WARP) and runs slower.
$gpus = @(Get-CimInstance Win32_VideoController -ErrorAction SilentlyContinue | ForEach-Object { "$($_.Name)" } | Where-Object { $_ })
if ($gpus.Count -eq 0) {
    Add-Result 'Graphics' 'WARN' 'could not read the graphics device'
} elseif (@($gpus | Where-Object { $_ -notmatch 'Basic (Display|Render)|Remote|VMware|VirtualBox|Hyper-V|Parallels' }).Count -gt 0) {
    Add-Result 'Graphics' 'OK' ($gpus -join ', ')
} else {
    Add-Result 'Graphics' 'WARN' "$($gpus -join ', ') - no 3D acceleration; day 2 uses the light mode"
}

# Downloads in this script follow the Windows proxy setting; npm and git do not
try {
    $proxy = [Net.WebRequest]::GetSystemWebProxy().GetProxy([uri]'https://registry.npmjs.org/')
    if ($proxy -and $proxy.Host -ne 'registry.npmjs.org') {
        Add-Result 'Proxy' 'WARN' "$($proxy.Authority) - if npm or git downloads fail, ask an assistant"
    }
} catch { }

# Sites the course uses: a blocked one shows up today, not on the course day
$blockedSites = @($CourseSites | Where-Object { -not (Test-Site $_.Host) })
if ($blockedSites.Count -eq 0) { Add-Result 'Sites' 'OK' "all $($CourseSites.Count) answer" }
foreach ($s in $blockedSites) { Add-Result "Site $($s.Host)" 'WARN' "no answer - needed for $($s.Use); ask IT to allow it" }

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
        Add-Result 'Execution policy' 'FAIL' "still $($ep.Policy) - ask IT to allow RemoteSigned for the current user"
    }
}

# ---------------------------------------------------------------- 2
Write-Step '2. Node.js and Codex CLI'

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

# Node.js 22 or later, before Codex CLI. Missing or older: install the LTS - winget first (installer with UAC,
# then per-user), then the per-user zip from nodejs.org when winget is missing or fails.
$nodeNote = ''
$nodeError = ''
if ((Get-NodeMajor) -lt 22) { Add-UserPath (Join-Path $env:ProgramFiles 'nodejs') }
if ((Get-NodeMajor) -lt 22 -and $HaveWinget) {
    Write-Host '   Installing Node.js LTS...'
    Install-WingetPackage 'OpenJS.NodeJS.LTS' @('', 'user')
    Update-SessionPath
    Add-UserPath (Join-Path $env:ProgramFiles 'nodejs')
    $nodeNote = ' (installed now)'
}
if ((Get-NodeMajor) -lt 22) {
    Write-Host '   Installing Node.js LTS for this user (nodejs.org zip)...'
    $nodeError = Install-NodeZip
    $nodeNote = ' (installed now, this user only)'
}
if ((Get-NodeMajor) -ge 22) {
    Add-Result 'Node.js' 'OK' ((Get-FirstLine { node -v }) + $nodeNote)
} elseif (Test-Command 'node') {
    # an older all-users Node.js on the system PATH comes before the user PATH
    Add-Result 'Node.js' 'FAIL' "$(Get-FirstLine { node -v }) at $((Get-Command node).Source) - v22 or later needed; install the LTS from https://nodejs.org and run setup.ps1 again"
    $blocked = $true
} else {
    Add-Result 'Node.js' 'FAIL' "not found ($nodeError) - install the LTS from https://nodejs.org and run setup.ps1 again"
    $blocked = $true
}

# Codex CLI: the official installer, in its own process so nothing it does can end this script
$CodexBin = Join-Path $env:LOCALAPPDATA 'Programs\OpenAI\Codex\bin'
if (-not (Test-Command 'codex')) {
    Write-Host '   Installing Codex CLI. If it asks whether to start Codex now, answer N.' -ForegroundColor Yellow
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -Command 'irm https://chatgpt.com/codex/install.ps1 | iex'
    Update-SessionPath
}
# The installer adds its folder to the user PATH; repair it if that did not happen
if (-not (Test-Command 'codex') -and (Test-Path (Join-Path $CodexBin 'codex.exe'))) { Add-UserPath $CodexBin }
if (Test-Command 'codex') {
    $Codex = Get-NativeCommand 'codex'
    Add-Result 'Codex' 'OK' (Get-FirstLine { & $Codex --version })
    # The course hands out ChatGPT accounts on the day, so no login yet is normal; an API-key login (billed per use) is a WARN
    $login = (Get-Lines { & $Codex login status }) -join ' '
    if ($login -match 'API key') {
        Add-Result 'Codex login' 'WARN' 'API key, billed per use - run: codex logout (sign in with the course account on the day)'
    } elseif ($login -match 'ChatGPT' -or $login -cmatch 'Logged in') {  # case-sensitive: "Not logged in" must not match
        Add-Result 'Codex login' 'OK' 'logged in'
    } else {
        Add-Result 'Codex login' 'SKIP' 'sign in on the course day with the account you get there'
    }
} else {
    Add-Result 'Codex' 'FAIL' 'not found - close this window, open a new Windows PowerShell window and run setup.ps1 again'
    $blocked = $true
}

if ($blocked) {
    Write-Host ''
    Write-Host 'Node.js or Codex CLI is missing, so the rest cannot be set up. Fix the FAIL line above and run setup.ps1 again.' -ForegroundColor Red
    Write-Log 'Stopped: Node.js or Codex CLI missing'
    exit 1
}

# ---------------------------------------------------------------- 3
Write-Step '3. Base tools - Git, GitHub CLI, Python, FFmpeg'

# Scopes: per-user install first (no admin rights needed), then the package default
$packages = @(
    @{ Name = 'Git';        Id = 'Git.Git';     Scopes = @('user', ''); Test = { Test-Command 'git' };
       Dirs = { @((Join-Path $env:ProgramFiles 'Git\cmd'), (Join-Path $env:LOCALAPPDATA 'Programs\Git\cmd')) } },
    @{ Name = 'GitHub CLI'; Id = 'GitHub.cli';  Scopes = @('user', ''); Test = { Test-Command 'gh' };
       Dirs = { @((Join-Path $env:ProgramFiles 'GitHub CLI'), (Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links')) } },
    # FFmpeg joins the frames of the day-2 deck into an mp4
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

# ---------------------------------------------------------------- 4
Write-Step '4. Git user name and e-mail'

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

# ---------------------------------------------------------------- 5
Write-Step '5. Vercel CLI'

$vercelMajor = Get-VercelMajor
if ((Test-Command 'vercel') -and $vercelMajor -lt $VercelMinMajor) {
    # An older CLI may miss commands scripts\vercel.mjs uses (project create, env add --force)
    Write-Host '   Updating Vercel CLI...'
    npm.cmd install -g vercel@latest
    Update-SessionPath
    $vercelMajor = Get-VercelMajor
    if ($vercelMajor -ge $VercelMinMajor) {
        Add-Result 'Vercel CLI' 'OK' "updated to $(Get-FirstLine { vercel.cmd --version })"
    } else {
        Add-Result 'Vercel CLI' 'WARN' "version $vercelMajor is older than $VercelMinMajor - run: npm.cmd install -g vercel@latest"
    }
} else {
    Install-NpmGlobal 'Vercel CLI' 'vercel' 'vercel'
}

# ---------------------------------------------------------------- 6
Write-Step '6. Course repositories - slop-rewrite, cokacmotion, vibe-coding-start'

if (Test-Command 'git') {
    $env:GIT_TERMINAL_PROMPT = '0'   # public repositories: never wait for a password prompt
    foreach ($r in $CourseRepos) { Sync-Repo $r.Name $r.Url }
} else {
    Add-Result 'Course repositories' 'FAIL' 'Git not found'
}

# Start folders: copy vibe and deck into C:\workspace when they are not there yet. When they are (an earlier run),
# refresh only the course-owned items (Test-CourseOwned), so the course's fixes arrive and a trainee's own work is
# never overwritten. The copies have no .git - each becomes the trainee's own folder.
$StartDir = Join-Path $Workspace 'vibe-coding-start'
$StartVersion = 'version ' + (Get-FirstLine { git -C $StartDir rev-parse --short HEAD })
foreach ($f in @('vibe', 'deck')) {
    $from = Join-Path $StartDir $f
    $to = Join-Path $Workspace $f
    $item = "Start folder $f"
    if (-not (Test-Path (Join-Path $from 'AGENTS.md'))) {
        Add-Result $item 'FAIL' 'vibe-coding-start not cloned'
    } elseif (-not (Test-Path $to)) {
        Copy-Item $from $to -Recurse -Force
        if (Test-Path (Join-Path $to 'AGENTS.md')) { Add-Result $item 'OK' "$to ($StartVersion)" } else { Add-Result $item 'FAIL' "copy to $to failed" }
    } else {
        $changed = @(Update-StartFolder $from $to)
        if ($changed.Count -gt 0) {
            Add-Result $item 'OK' "refreshed $($changed.Count) course item(s), your work kept ($StartVersion)"
        } else {
            Add-Result $item 'SKIP' "up to date ($StartVersion)"
        }
    }
}

# npm packages for both start folders now, not on the day (day 1 alone is about 350 MB)
foreach ($f in @('vibe', 'deck')) {
    $dir = Join-Path $Workspace $f
    if (-not (Test-Path (Join-Path $dir 'package.json'))) { continue }
    Write-Host "   Downloading npm packages for $f..."
    Push-Location $dir
    npm.cmd install --no-audit --no-fund --loglevel=error
    $code = $LASTEXITCODE
    Pop-Location
    if ($code -eq 0) {
        Add-Result "npm packages $f" 'OK' 'downloaded'
    } else {
        Add-Result "npm packages $f" 'FAIL' "npm exit code $code - run setup.ps1 again"
    }
}

# ---------------------------------------------------------------- 7
Write-Step '7. MCP - sequential-thinking, kordoc'

foreach ($s in $McpServers) { Register-CodexMcp $s }

# Download each MCP package now. npx keeps a package in its cache by name and version, so on the day Codex starts
# the server without downloading. "-p <package> node -e 0" fills that cache without starting the server.
foreach ($s in $McpServers) {
    Write-Host "   Downloading MCP $($s.Name)..."
    npx.cmd -y -p $s.Cmd[2] node -e 0
    $code = $LASTEXITCODE
    if ($code -eq 0) {
        Add-Result "MCP $($s.Name) package" 'OK' 'downloaded'
    } else {
        Add-Result "MCP $($s.Name) package" 'FAIL' "npx exit code $code - run setup.ps1 again"
    }
}
# kordoc loads a large engine when it starts, even from the cache
Set-McpStartupTimeout 'kordoc' 60

# ---------------------------------------------------------------- 8
Write-Step '8. Skills - impeccable, think, slop-rewrite, aimotion'

$impPath = Join-Path $SkillRoot 'impeccable'
if (Test-Path (Join-Path $impPath 'SKILL.md')) {
    Add-Result 'impeccable' 'SKIP' 'already installed'
} else {
    npx.cmd -y impeccable install -y --providers=codex --scope=global
    if (Test-Path (Join-Path $impPath 'SKILL.md')) {
        Add-Result 'impeccable' 'OK' 'installed'
    } else {
        Add-Result 'impeccable' 'FAIL' "$impPath not found"
    }
}
# impeccable runs an engine program that its launcher downloads on the first run.
# Run it now: the download happens today, and an antivirus or SmartScreen block shows up today.
$impCmd = Join-Path $impPath 'scripts\impeccable.cmd'
if (Test-Path $impCmd) {
    $impOut = @(Get-Lines { & $impCmd --version })
    $impVersion = @($impOut | Where-Object { $_ -match '^v?\d+\.\d+\.\d+' })
    if ($impVersion.Count -gt 0) {
        Add-Result 'impeccable engine' 'OK' $impVersion[0]
    } else {
        Add-Result 'impeccable engine' 'WARN' "did not start: $(@($impOut | Select-Object -Last 1)) - ask an assistant"
    }
}

$thinkFile = Join-Path $SkillRoot 'think\SKILL.md'
if ((Test-Path $thinkFile) -and ((Get-Content $thinkFile -Raw -Encoding UTF8) -eq $ThinkSkill)) {
    Add-Result 'think' 'SKIP' 'already up to date'
} else {
    Write-Utf8 $thinkFile $ThinkSkill
    Add-Result 'think' 'OK' $thinkFile
}

# slop-rewrite (day 2: rewrite the report and check it): a global entry pointing at the repository's Codex entry.
# Its rewriting and checks use only the Python standard library.
$SlopDir = Join-Path $Workspace 'slop-rewrite'
Install-PointerSkill 'slop-rewrite' (Join-Path $SlopDir '.agents\skills\slop-rewrite\SKILL.md') $SlopDir 'slop-rewrite'

# aimotion (day 2: motion technique notes for the deck): the skill folder copied as its README says. Its search script needs Node 18+.
$AimotionSkill = Join-Path $Workspace 'cokacmotion\skills\aimotion'
if (Test-Path (Join-Path $AimotionSkill 'SKILL.md')) {
    Copy-SkillFolder 'aimotion' $AimotionSkill 'aimotion' @($SkillRoot)
} else {
    Add-Result 'aimotion' 'FAIL' 'cokacmotion not cloned'
}

# kca-report-hwpx came with an earlier setup.ps1; the course no longer uses it, and it would answer day-2 report requests
$OldReportSkill = Join-Path $SkillRoot 'kca-report-hwpx'
if (Test-Path $OldReportSkill) {
    Remove-Item $OldReportSkill -Recurse -Force
    Add-Result 'kca-report-hwpx' 'OK' 'removed (no longer used)'
}

# ---------------------------------------------------------------- 9
Write-Step '9. Codex global rules'

# Global location, so it is also read inside project folders that are git repositories
$Rules = Join-Path $Workspace 'AGENTS.global.md'
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

# ---------------------------------------------------------------- 10
Write-Step '10. Trial run - day-1 web app, 1-second day-2 video, ego lite'

# Day 1: build the start web app once (shows today whether an antivirus blocks the Next.js compiler)
$vibeDir = Join-Path $Workspace 'vibe'
if (Test-Path (Join-Path $vibeDir 'node_modules')) {
    Write-Host '   Building the day-1 web app...'
    Push-Location $vibeDir
    $out = @(Get-Lines { npm.cmd run build })
    $code = $LASTEXITCODE
    Pop-Location
    if ($code -eq 0) { Add-Result 'Trial web app' 'OK' 'built' } else { Add-Result 'Trial web app' 'WARN' "build failed: $(Get-LastLine $out)" }
} else {
    Add-Result 'Trial web app' 'FAIL' 'npm packages for vibe missing - run setup.ps1 again'
}

# Day 2: a 1-second video from the deck (Edge draws it headless, FFmpeg joins the frames).
# Skipped when the trainee already made out\deck.mp4, so a real video is never replaced.
$deckDir = Join-Path $Workspace 'deck'
$video = Join-Path $deckDir 'out\deck.mp4'
if (Test-Path $video) {
    Add-Result 'Trial video' 'SKIP' 'out\deck.mp4 already exists - kept'
} elseif (-not (Test-Path (Join-Path $deckDir 'node_modules'))) {
    Add-Result 'Trial video' 'FAIL' 'npm packages for deck missing - run setup.ps1 again'
} else {
    Write-Host '   Making a 1-second test video...'
    Push-Location $deckDir
    # The script prints Korean in UTF-8; read it as UTF-8 so an error line stays readable
    $consoleEncoding = [Console]::OutputEncoding
    try { [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false } catch { }
    $out = @(Get-Lines { node scripts\export.mjs --slides 1 --sec 1 --light })
    $code = $LASTEXITCODE
    try { [Console]::OutputEncoding = $consoleEncoding } catch { }
    Pop-Location
    if ($code -eq 0 -and (Test-Path $video)) {
        Remove-Item $video   # only a test; the trainee makes the real one on day 2
        Add-Result 'Trial video' 'OK' 'Edge and FFmpeg made a 1-second video'
    } else {
        Add-Result 'Trial video' 'WARN' "failed: $(Get-LastLine $out) - ask an assistant"
    }
}

# ego lite is installed by hand (pre-course notice 3-3); its command comes with the app
$HaveEgo = Test-Command 'ego-browser'
if ($HaveEgo) {
    Add-Result 'ego lite' 'OK' 'ego-browser found'
} else {
    Add-Result 'ego lite' 'WARN' 'not installed yet - install it (pre-course notice 3-3), then run setup.ps1 again'
}

# ---------------------------------------------------------------- Result
Write-Step 'Result'
$Results | Format-Table -AutoSize | Out-String | Write-Host

$failed = @($Results | Where-Object { $_.Status -eq 'FAIL' }).Count
$warned = @($Results | Where-Object { $_.Status -eq 'WARN' }).Count
Write-Log ('Finished - FAIL {0}, WARN {1}' -f $failed, $warned)

# Short box for the screenshot the pre-course notice asks for: counts, then every line that needs a look
Write-Host '======================== RESULT ========================' -ForegroundColor Cyan
Write-Host ('{0,-24}{1}' -f 'Checked at', (Get-Date -Format 'yyyy-MM-dd HH:mm'))
Write-Host ('{0,-24}{1}' -f 'Items', $Results.Count)
foreach ($r in @($Results | Where-Object { $_.Status -eq 'FAIL' -or $_.Status -eq 'WARN' -or $_.Item -eq 'Graphics' })) {
    $color = switch ($r.Status) { 'OK' { 'Green' } 'WARN' { 'Yellow' } default { 'Red' } }
    Write-Host ('{0,-24}{1,-6}{2}' -f $r.Item, $r.Status, $r.Detail) -ForegroundColor $color
}
Write-Host '========================================================' -ForegroundColor Cyan
if ($failed -eq 0) {
    Write-Host 'All installed. Take a screenshot of the RESULT box and send it as the pre-course notice says.' -ForegroundColor Green
} else {
    Write-Host "FAIL: $failed item(s). Run setup.ps1 again; if it still fails, send the screenshot as it is - the instructor will help." -ForegroundColor Yellow
}
Write-Host 'Hide your e-mail address or other personal details in the screenshot.'

Write-Host ''
Write-Host 'Next (pre-course notice, section 3):' -ForegroundColor Cyan
if ($PathChanged) {
    Write-Host '   PATH was updated. Close ALL PowerShell and Terminal windows.' -ForegroundColor Yellow
}
if (-not $HaveEgo) {
    Write-Host '   Install ego lite (the agent browser) yourself - on first launch answer NO to importing Chrome data.' -ForegroundColor Yellow
    Write-Host '   Then run setup.ps1 once more (a few minutes - finished items are skipped) and send that RESULT box.' -ForegroundColor Yellow
}
Write-Host '   Codex login comes on the course day, with the account you get there.'
