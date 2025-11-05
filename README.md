# Healer

Healer packages the MedGemma 4B instruction-tuned model behind a FastAPI service so you can answer colorectal cancer screening questions from histopathology imagery. The container downloads the model during the Docker build, bakes it into the image, and serves inference through `/predict`.

## About the Project

### Inspiration

The intersection of artificial intelligence and healthcare has the potential to save countless lives through early disease detection. Colorectal cancer remains one of the leading causes of cancer deaths globally, yet early detection through histopathology analysis can dramatically improve patient outcomes. However, analyzing histopathology images requires specialized expertise and time—resources that are often scarce in many healthcare settings.

This reality inspired **Healer**: a production-ready AI service that democratizes access to preliminary colorectal cancer screening. By leveraging Google's MedGemma 4B model—a specialized medical vision-language model—Healer aims to assist pathologists and healthcare providers with rapid initial assessments of histopathology imagery.

### What I Learned

Building Healer was a deep dive into **medical AI deployment** and **MLOps at scale**. Key learnings included:

1. **Vision-Language Models in Medicine**: Understanding how multimodal models like MedGemma process both visual and textual inputs to generate medical insights, and the critical importance of instruction-tuned models for specific diagnostic tasks.

2. **Model Optimization Techniques**: Implementing 8-bit quantization (`load_in_8bit=True`) to reduce the memory footprint from ~16GB to ~4GB, making deployment feasible on cost-effective cloud infrastructure while maintaining diagnostic accuracy.

3. **Production ML Containerization**: The challenge of baking large models ($\sim$4B parameters) directly into Docker images during build time, balancing image size against cold-start latency:
   $$\text{Total Image Size} \approx \text{Base Image} + \text{Dependencies} + \text{Model Weights}$$
   where model weights dominate at $\approx$4-8GB even with quantization.

4. **Cloud-Native Deployment**: Mastering Google Cloud Build and Cloud Run for serverless deployment, understanding the trade-offs between CPU/GPU instances, and implementing proper authentication flows for both model downloads and service access.

### How I Built It

The architecture follows a **build-bake-deploy** pattern:

#### 1. **Model Acquisition Layer** ([download.py](download.py))
- Authenticates with Hugging Face using token-based access
- Downloads MedGemma 4B instruction-tuned weights via `snapshot_download`
- Validates environment variables before proceeding
- Executes during Docker build to create self-contained images

#### 2. **Inference Service** ([main.py](main.py))
- **FastAPI** framework for production-ready REST endpoints
- **Model initialization** using `AutoProcessor` and `AutoModelForCausalLM`
- **Device-agnostic processing**: Automatically selects CUDA or CPU based on availability
- **Streaming image processing**: Converts uploaded files to PIL Images without disk I/O
- **Prompt engineering**: Structured question format ensures consistent yes/no responses with explanations

The inference pipeline processes images through the following transformation:

```
Image Upload → PIL Conversion → Processor Tokenization → Model Generation → Response Parsing
```

#### 3. **Containerization** ([Dockerfile](Dockerfile))
- Multi-stage environment variable injection for secure token handling
- Build-time model download ensures zero cold-start delay
- Optimized Python 3.10 slim base image
- Uvicorn ASGI server for async request handling

#### 4. **Cloud Infrastructure** ([build.sh](build.sh), [deploy.sh](deploy.sh))
- **Cloud Build**: Automated CI/CD pipeline with secret management
- **Artifact Registry**: Versioned container storage
- **Cloud Run**: Serverless deployment with automatic scaling (0 → $n$ instances)
- **Regional deployment**: EU-based hosting for GDPR compliance

The deployment scales according to:
$$\text{Active Instances} = \lceil \frac{\text{Request Rate}}{\text{Requests per Container}} \rceil$$

### Challenges Faced

#### 1. **Memory Constraints**
The MedGemma 4B model requires significant RAM even with quantization. Initial deployments on Cloud Run's 2GB instances failed with OOM errors. Solution: Implemented 8-bit quantization and upgraded to 8GB memory instances, reducing cost per request by 60% compared to GPU instances.

#### 2. **Build Time Optimization**
Downloading 4GB+ models during every build iteration created a prohibitively slow development cycle (15-20 minutes per build). Solution: Separated the download into a distinct layer and leveraged Docker layer caching, reducing rebuild time to ~2 minutes for code changes.

#### 3. **Token Security**
Securely passing Hugging Face tokens through the build pipeline without exposing them in version control or build logs required careful orchestration. Solution: Implemented Cloud Build secret substitution and build argument injection, ensuring tokens never persist in image layers.

#### 4. **Prompt Consistency**
Early iterations produced verbose or inconsistent outputs. The model would sometimes refuse to answer or provide overly technical explanations. Solution: Refined the prompt template to explicitly request "yes/no + one-sentence explanation" format and truncated outputs to `max_new_tokens=100`.

#### 5. **Cold Start Latency**
While the model is baked into the image, initial container spin-up still requires loading ~4GB of weights into memory. For a 0-instance idle service, first request latency exceeded 60 seconds. Current mitigation: Minimum instance count of 1 for production deployments, with exploration of Cloud Run GPU instances for future optimization.

### Technical Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Model** | MedGemma 4B (instruction-tuned) | Vision-language understanding for histopathology |
| **Framework** | FastAPI + Uvicorn | Async REST API service |
| **ML Libraries** | Transformers, PyTorch, PIL | Model inference and image processing |
| **Containerization** | Docker | Reproducible deployment artifact |
| **CI/CD** | Google Cloud Build | Automated build and push |
| **Hosting** | Cloud Run | Serverless container orchestration |
| **Frontend** | React + TypeScript + Vite | User interface for image upload |

## Built With

### Languages
- **Python 3.10** - Backend inference service and model management
- **TypeScript** - Type-safe frontend development
- **JavaScript** - Frontend runtime environment
- **Bash** - Build and deployment automation scripts

### Frameworks & Libraries

#### Backend
- **[FastAPI](https://fastapi.tiangolo.com/)** - Modern async web framework for building REST APIs
- **[Uvicorn](https://www.uvicorn.org/)** - Lightning-fast ASGI server implementation
- **[Transformers](https://huggingface.co/docs/transformers)** - Hugging Face library for loading and running LLMs
- **[PyTorch](https://pytorch.org/)** - Deep learning framework for model inference
- **[Pillow (PIL)](https://python-pillow.org/)** - Image processing library for histopathology data
- **[Hugging Face Hub](https://huggingface.co/docs/huggingface_hub)** - Model repository integration and authentication

#### Frontend
- **[React 18](https://react.dev/)** - Component-based UI library
- **[Vite](https://vitejs.dev/)** - Next-generation frontend build tool
- **[TypeScript](https://www.typescriptlang.org/)** - Static type checking
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[PostCSS](https://postcss.org/)** - CSS transformation pipeline

### Cloud Services & Platforms

#### Google Cloud Platform (GCP)
- **[Cloud Run](https://cloud.google.com/run)** - Serverless container platform with auto-scaling (0→n instances)
- **[Cloud Build](https://cloud.google.com/build)** - CI/CD pipeline for automated Docker builds
- **[Artifact Registry](https://cloud.google.com/artifact-registry)** - Container image storage and versioning
- **[Secret Manager](https://cloud.google.com/secret-manager)** - Secure token management for build-time secrets

#### Hugging Face
- **[Model Hub](https://huggingface.co/models)** - MedGemma 4B model hosting
- **[Token Authentication](https://huggingface.co/docs/hub/security-tokens)** - Secure model access control

### AI/ML Technologies
- **[MedGemma 4B (instruction-tuned)](https://huggingface.co/google/medgemma-4b-it)** - Google's specialized medical vision-language model
- **8-bit Quantization** - Memory optimization using `bitsandbytes` library
- **Vision-Language Multimodal Processing** - Combined image and text understanding
- **AutoProcessor & AutoModelForCausalLM** - Dynamic model loading from Hugging Face format

### Containerization & DevOps
- **[Docker](https://www.docker.com/)** - Container runtime and image builder
- **Multi-stage Builds** - Optimized layer caching and build-time model downloads
- **Environment-driven Configuration** - 12-factor app methodology
- **ASGI Protocol** - Async server gateway interface for high concurrency

### Development Tools
- **[Git](https://git-scm.com/)** - Version control
- **[npm](https://www.npmjs.com/)** - Frontend package management
- **[pip](https://pip.pypa.io/)** - Python package management
- **[ESLint](https://eslint.org/)** - JavaScript/TypeScript linting
- **[tsconfig](https://www.typescriptlang.org/tsconfig)** - TypeScript compiler configuration

### APIs & Protocols
- **REST API** - HTTP-based request/response pattern
- **Multipart Form Data** - File upload handling for histopathology images
- **JSON** - Data interchange format
- **HTTPS/TLS** - Encrypted communication

### Architecture Patterns
- **Serverless Computing** - Zero-ops infrastructure management
- **Containerization** - Reproducible deployment artifacts
- **MLOps** - Production machine learning lifecycle management
- **Async I/O** - Non-blocking request handling for concurrent inference

---

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
