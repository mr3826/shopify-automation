# PowerShell script to scaffold coordinator and agent branches and open draft PRs using gh CLI
param(
	[string]$remote = 'origin',
	[string]$base = 'main'
)

function Ensure-GhCli {
	if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
		Write-Error "gh CLI not found in PATH. Install https://github.com/cli/cli and authenticate with 'gh auth login' before running this script."
		exit 1
	}
}

function Create-BranchAndPr {
	param(
		[string]$branchName,
		[string]$title,
		[string]$body
	)

	Write-Host "Creating branch: $branchName"
	git fetch $remote
	git checkout -b $branchName $remote/$base

	# Add a minimal CHANGELOG file to indicate automated agent work
	$changelogPath = "changes/$branchName.txt"
	New-Item -ItemType Directory -Path (Split-Path $changelogPath) -Force | Out-Null
	"Automated agent branch ${branchName}: ${title}`n`n${body}" | Out-File -FilePath $changelogPath -Encoding utf8

	git add $changelogPath
	git commit -m "chore(agents): scaffold $branchName"
	git push --set-upstream $remote $branchName

	# Open a draft PR
	gh pr create --title "$title (agent)" --body "$body`n\nAutomated agent scaffolded branch: $branchName" --base $base --head $branchName --draft
}

Ensure-GhCli

$agents = @(
	@{ name = 'coordinator'; title = 'Coordinator: Setup agent orchestration'; body = 'Creates PR templates, branch naming and CI checklist.' },
	@{ name = 'secrets-fix'; title = 'Fix: robust secrets parsing and validation'; body = 'Handle JSON and plain strings from Secrets Manager; add startup validation.' },
	@{ name = 'lambda-fix'; title = 'Fix: lambda timing and OpenAI/Slack resiliency'; body = 'Capture startTime, add timeouts and retries for OpenAI and Slack.' },
	@{ name = 'frontend-build-fix'; title = 'Fix: disable production sourcemaps'; body = 'Emit sourcemaps only in non-production builds.' },
	@{ name = 'logging-pii-fix'; title = 'Fix: logging and PII redaction'; body = 'Redact PII in logs and external notifications.' },
	@{ name = 'security-hardening'; title = 'Security: rate limits, CORS, SCA'; body = 'Audit rate limits, lock down CORS for production, add SCA.' },
	@{ name = 'ci-integration'; title = 'CI: tests and security checks'; body = 'Add unit/integration tests and security scan jobs to CI.' }
)

foreach ($agent in $agents) {
	$branchName = "agent/" + $agent.name + "-" + (Get-Date -Format 'yyyyMMddHHmmss')
	Create-BranchAndPr -branchName $branchName -title $agent.title -body $agent.body
}

Write-Host "All agent branches and draft PRs created. Review PRs and assign reviewers."