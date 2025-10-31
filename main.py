import io
from fastapi import FastAPI, UploadFile, File
from PIL import Image
import torch
from transformers import AutoProcessor, AutoModelForCausalLM

app = FastAPI()

my_device = "cuda" if torch.cuda.is_available() else "cpu"
my_model_folder = "./medgemma-model"

my_processor = AutoProcessor.from_pretrained(my_model_folder)
my_model = AutoModelForCausalLM.from_pretrained(
    my_model_folder,
    device_map=my_device,
    torch_dtype=torch.bfloat16,
    load_in_8bit=True
)

@app.get("/")
def home():
    return {"message": "Healer API (MedGemma) is running"}

@app.post("/predict")
async def predict(image_file: UploadFile = File(...)):

    file_bytes = await image_file.read()
    my_image = Image.open(io.BytesIO(file_bytes))

    my_question = "<image>\nIs colorectal cancer present in this histopathology image? Answer with 'yes' or 'no' and provide a one-sentence explanation."

    my_inputs = my_processor(
        text=my_question,
        images=my_image,
        return_tensors="pt"
    ).to(my_device)

    output_ids = my_model.generate(**my_inputs, max_new_tokens=100)
    
    all_text = my_processor.batch_decode(output_ids, skip_special_tokens=True)[0]

    answer_text = all_text.split(my_question)[-1]
    final_answer = answer_text.strip()

    return {
        "prediction": final_answer
    }

