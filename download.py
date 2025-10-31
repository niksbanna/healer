import os
import sys
from huggingface_hub import snapshot_download, login

HUGGINGFACE_TOKEN = os.getenv("HUGGINGFACE_TOKEN")
MODEL_ID = os.getenv("MODEL_ID", "google/medgemma-4b-it")
MODEL_DIR = os.getenv("MODEL_DIR", "./medgemma-model")

if not HUGGINGFACE_TOKEN:
    sys.stderr.write("Error: HUGGINGFACE_TOKEN environment variable not set.\n")
    sys.exit(1)

login(token=HUGGINGFACE_TOKEN)

print(f"Starting download of {MODEL_ID}...")

snapshot_download(
    repo_id=MODEL_ID,
    local_dir=MODEL_DIR,
    token=HUGGINGFACE_TOKEN,
    local_dir_use_symlinks=False
)

print("Model download complete.")