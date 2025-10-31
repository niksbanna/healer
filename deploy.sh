#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID=${PROJECT_ID:-healthcare-476114}
REPOSITORY_NAME=${REPOSITORY_NAME:-healer-medgemma}
SERVICE_NAME=${SERVICE_NAME:-healer-medgemma-service}
REGION=${REGION:-europe-west1}
GPU_TYPE=${GPU_TYPE:-nvidia-l4}
GPU_COUNT=${GPU_COUNT:-1}
MEMORY=${MEMORY:-16Gi}
CPU=${CPU:-4}
TIMEOUT=${TIMEOUT:-900}

IMAGE="gcr.io/${PROJECT_ID}/${REPOSITORY_NAME}"

gcloud run deploy "${SERVICE_NAME}" \
    --image "${IMAGE}" \
    --project "${PROJECT_ID}" \
    --gpu "${GPU_COUNT}" \
    --gpu-type "${GPU_TYPE}" \
    --region "${REGION}" \
    --port 8080 \
    --allow-unauthenticated \
    --memory "${MEMORY}" \
    --cpu "${CPU}" \
    --timeout "${TIMEOUT}"