FROM python:3.10-slim

ARG MY_HF_TOKEN
ARG MODEL_ID=google/medgemma-4b-it
ARG MODEL_DIR=./medgemma-model

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY download.py .
RUN test -n "$MY_HF_TOKEN" \
	&& HUGGINGFACE_TOKEN="$MY_HF_TOKEN" MODEL_ID="$MODEL_ID" MODEL_DIR="$MODEL_DIR" python download.py

COPY main.py .

ENV PORT 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]

