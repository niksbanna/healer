# Healer

Healer packages the MedGemma 4B instruction-tuned model behind a FastAPI service so you can answer colorectal cancer screening questions from histopathology imagery. The container downloads the model during the Docker build, bakes it into the image, and serves inference through `/predict`.

## Prerequisites
- Google Cloud SDK (`gcloud`) authenticated for the target project
- Docker
- Hugging Face access token with permission to download `google/medgemma-4b-it`

## Environment Variables
| Variable | Purpose | Default |
| --- | --- | --- |
| `MY_HF_TOKEN` | Hugging Face token passed to Cloud Build and Docker | _required_ |
| `PROJECT_ID` | Google Cloud project that hosts the container image | `YOUR_GCP_PROJECT_ID` |
| `REPOSITORY_NAME` | Container image name in Artifact Registry or GCR | `healer-medgemma` |
| `MODEL_ID` | Hugging Face repo id to download during build | `google/medgemma-4b-it` |
| `MODEL_DIR` | Destination directory for the downloaded model | `./medgemma-model` |
| `SERVICE_NAME` | Cloud Run service name (deploy script only) | `healer-medgemma-service` |
| `REGION` | Cloud Run region (deploy script only) | `europe-west1` |

## Build
```bash
export MY_HF_TOKEN="$(<token>)"
export PROJECT_ID="your-project"
export REPOSITORY_NAME="healer-medgemma"
./build.sh
```
The build script forwards the token and project metadata into Cloud Build, which in turn injects them into the Docker build arguments.

## Deploy
After a successful build and push, deploy to Cloud Run:
```bash
export PROJECT_ID="your-project"
export REPOSITORY_NAME="healer-medgemma"
export SERVICE_NAME="healer-medgemma-service"
./deploy.sh
```

## API
- `GET /` health check
- `POST /predict` accepts an `image_file` upload and returns a short yes/no style diagnosis string.

## Repository Layout
- `download.py` downloads the model using environment-driven configuration.
- `main.py` hosts the FastAPI inference app.
- `Dockerfile`, `cloudbuild.yaml`, `build.sh`, and `deploy.sh` orchestrate packaging and deployment.
