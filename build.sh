#!/usr/bin/env bash
set -euo pipefail

: "${MY_HF_TOKEN:?Environment variable MY_HF_TOKEN must be set}"

PROJECT_ID=${PROJECT_ID:-YOUR_GCP_PROJECT_ID}
REPOSITORY_NAME=${REPOSITORY_NAME:-healer-medgemma}
MODEL_ID=${MODEL_ID:-google/medgemma-4b-it}
MODEL_DIR=${MODEL_DIR:-./medgemma-model}

gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions=_MY_HF_TOKEN="${MY_HF_TOKEN}",_PROJECT_ID="${PROJECT_ID}",_REPOSITORY_NAME="${REPOSITORY_NAME}",_MODEL_ID="${MODEL_ID}",_MODEL_DIR="${MODEL_DIR}"