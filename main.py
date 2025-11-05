import io
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
import torch
from transformers import AutoProcessor, AutoModelForImageTextToText

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

my_device = "cuda" if torch.cuda.is_available() else "cpu"
my_dtype = torch.bfloat16 if my_device == "cuda" else torch.float32
my_model_folder = "./medgemma-model"

my_processor = AutoProcessor.from_pretrained(my_model_folder)
my_model = AutoModelForImageTextToText.from_pretrained(
    my_model_folder,
    device_map="auto",
    torch_dtype=my_dtype,
)

@app.get("/")
def home():
    return {"message": "Healer API (MedGemma) is running"}

@app.post("/predict")
async def predict(
    question: str = Form(...),
    image_file: Optional[UploadFile] = File(None)
):
    try:
        # Base system prompt shared by both text and image modes
        base_prompt = (
            "You are Dr. Healer, a board-certified physician with comprehensive expertise across all medical "
            "specialties. You provide expert medical consultation, diagnosis, and treatment recommendations.\n\n"
        )

        # Common clinical approach and communication guidelines
        common_guidelines = (
            "CLINICAL APPROACH:\n"
            "- Provide differential diagnoses with clinical reasoning\n"
            "- Recommend appropriate diagnostic tests and investigations\n"
            "- Prescribe evidence-based treatment plans including medications, dosages, and duration\n"
            "- Discuss prognosis, treatment options, and expected outcomes\n"
            "- Address urgency of findings and need for immediate intervention if applicable\n\n"

            "COMMUNICATION STYLE:\n"
            "- Communicate as a confident, experienced clinician would\n"
            "- Provide definitive assessments when findings are clear\n"
            "- Explain medical concepts in terms patients can understand\n"
            "- Address concerns with empathy while maintaining clinical objectivity\n"
            "- Use medical terminology appropriately, explaining complex terms when needed\n"
            "- Include practical management recommendations and patient education\n\n"

            "MEDICAL PRACTICE:\n"
            "- Apply current evidence-based guidelines and best practices\n"
            "- Consider patient-specific factors in your recommendations\n"
            "- Provide specific medication names, dosages, and instructions when appropriate\n"
            "- Discuss when urgent care or specialist referral is indicated\n"
            "- Offer comprehensive care including psychosocial aspects of health"
        )

        # Additional context for image-based consultations
        if image_file:
            image_specific = (
                "IMAGING EXPERTISE:\n"
                "You have extensive experience in medical imaging, radiology, pathology, and dermatology, "
                "including interpreting X-rays, CT scans, MRIs, ultrasounds, histopathology slides, and clinical photographs.\n\n"

                "IMAGE ANALYSIS:\n"
                "- Thoroughly examine the medical image and identify all relevant findings\n"
                "- Provide your clinical assessment with specific diagnostic impressions\n"
                "- Explain the pathophysiology and clinical significance of imaging findings\n\n"
            )
            system_message = base_prompt + image_specific + common_guidelines
        else:
            text_specific = (
                "CONSULTATION APPROACH:\n"
                "- Take a thorough medical history and assess symptoms systematically\n"
                "- Offer preventive care advice and lifestyle modifications\n\n"
            )
            system_message = base_prompt + text_specific + common_guidelines

        # Build the user content
        user_content = [{"type": "text", "text": question}]

        # If an image is provided, add it to the content
        if image_file:
            file_bytes = await image_file.read()
            my_image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
            user_content.append({"type": "image", "image": my_image})

        messages = [
            {
                "role": "system",
                "content": [
                    {
                        "type": "text",
                        "text": system_message
                    }
                ],
            },
            {
                "role": "user",
                "content": user_content,
            },
        ]

        inputs = my_processor.apply_chat_template(
            messages,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt"
        )

        inputs = inputs.to(torch.device(my_device), dtype=my_dtype)

        input_length = inputs["input_ids"].shape[-1]

        with torch.inference_mode():
            generation = my_model.generate(
                **inputs,
                max_new_tokens=1024,
                do_sample=False
            )

        generated_tokens = generation[0][input_length:]
        response_text = my_processor.decode(generated_tokens, skip_special_tokens=True)
        final_answer = response_text.strip()

        return {"prediction": final_answer}
    except UnidentifiedImageError as exc:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc

