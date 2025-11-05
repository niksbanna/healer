import os
from huggingface_hub import snapshot_download, login

my_token = os.getenv("MY_HF_TOKEN")

if not my_token:
    print("Error: MY_HF_TOKEN environment variable not set.")
    exit(1)

login(token=my_token)

model_name_to_download = "google/medgemma-4b-it"
folder_to_save_model = "./medgemma-model"

print(f"Starting download of {model_name_to_download}...")

snapshot_download(
    repo_id=model_name_to_download,
    local_dir=folder_to_save_model,
    token=my_token,
    local_dir_use_symlinks=False
)

print("Model download complete.")