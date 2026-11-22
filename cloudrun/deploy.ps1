<#
  Deploys a Flux download backend to Google Cloud Run (free allowance, sleeps when idle).

  Usage (PowerShell, from the repository folder):
    .\cloudrun\deploy.ps1 -Project YOUR_GCP_PROJECT_ID -EnvFile C:\path\to\flux-render-backend-1.env

  The env file needs FLUX_ROUTER_SECRET, FIREBASE_DATABASE_URL and
  FIREBASE_SERVICE_ACCOUNT_JSON: the same values your other backends use.
  They are stored in Google Secret Manager; nothing is printed or written to the repo.
  Details and costs: docs/CLOUD-RUN-BACKEND.md
#>
param(
  [Parameter(Mandatory = $true)] [string] $Project,
  [Parameter(Mandatory = $true)] [string] $EnvFile,
  [string] $Region = "us-central1",
  [string] $Service = "flux-backend",
  [string] $BackendId = "cloudrun-1"
)
$ErrorActionPreference = "Stop"

if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
  throw "Install the Google Cloud CLI first: https://cloud.google.com/sdk/docs/install , then run 'gcloud auth login'."
}
if (-not (Test-Path $EnvFile)) { throw "Env file not found: $EnvFile" }

# Read only the three shared values (Get-Content already removes line endings).
$wanted = "FLUX_ROUTER_SECRET", "FIREBASE_DATABASE_URL", "FIREBASE_SERVICE_ACCOUNT_JSON"
$values = @{}
foreach ($line in Get-Content $EnvFile) {
  if ($line -match '^(FLUX_ROUTER_SECRET|FIREBASE_DATABASE_URL|FIREBASE_SERVICE_ACCOUNT_JSON)=(.+)$') {
    $values[$Matches[1]] = $Matches[2].Trim()
  }
}
foreach ($name in $wanted) {
  if (-not $values.ContainsKey($name)) { throw "$name is missing from $EnvFile" }
}

gcloud config set project $Project | Out-Null
Write-Host "Enabling Google services (first time only)..."
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com

# Store each value as a secret (create it, or add a new version).
$secretNames = @{}
foreach ($name in $wanted) {
  $secret = $name.ToLower().Replace("_", "-")
  $secretNames[$name] = $secret
  $temp = New-TemporaryFile
  try {
    [IO.File]::WriteAllText($temp.FullName, $values[$name])
    gcloud secrets describe $secret 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) { gcloud secrets create $secret --data-file=$temp.FullName | Out-Null }
    else { gcloud secrets versions add $secret --data-file=$temp.FullName | Out-Null }
  }
  finally { Remove-Item $temp.FullName -Force }
}

# Let the service read those secrets.
$number = gcloud projects describe $Project --format="value(projectNumber)"
gcloud projects add-iam-policy-binding $Project `
  --member="serviceAccount:$number-compute@developer.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor" --condition=None | Out-Null

$env_vars = "FLUX_HOSTED=true,FLUX_BACKEND_ID=$BackendId,FLUX_MAX_HEIGHT=720,FLUX_MAX_DURATION=300,FLUX_MAX_FILESIZE=100M,FLUX_MAX_CONCURRENT=1,FLUX_RETENTION_HOURS=1"
$secrets = ($wanted | ForEach-Object { "$_=$($secretNames[$_]):latest" }) -join ","

# One instance only: a download's file lives on the instance that made it.
# CPU stays allocated because downloads keep working after the first response.
gcloud run deploy $Service --source . --region $Region --allow-unauthenticated `
  --max-instances 1 --min-instances 0 --concurrency 4 --timeout 900 `
  --memory 1Gi --cpu 1 --no-cpu-throttling --cpu-boost `
  --set-env-vars $env_vars --set-secrets $secrets

$url = gcloud run services describe $Service --region $Region --format="value(status.url)"
Write-Host ""
Write-Host "Deployed: $url"
Write-Host "Add this to FLUX_BACKENDS in wrangler.jsonc, then redeploy the website:"
Write-Host "  `"$BackendId`": `"$url`""
