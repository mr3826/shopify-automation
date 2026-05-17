Agent spawner

This folder contains automation for spawning agent branches and opening draft PRs using the GitHub CLI (gh).

Prerequisites
- git configured with credentials
- gh CLI installed and authenticated (gh auth login)
- PowerShell (pwsh) on PATH

Usage
pwsh ./scripts/spawn_agents.ps1

The script will create several agent branches and open draft PRs against the main branch. Each PR contains a minimal changelog file under changes/ and is intended as a starting point for the corresponding agent's work.