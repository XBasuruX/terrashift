from PIL import Image
import os

uploaded_dir = r"C:\Users\dhamn\.gemini\antigravity\brain\97427297-7445-4b64-8937-1fc87255169a\.user_uploaded"
p7 = os.path.join(uploaded_dir, "media_1793815039668_951d6f76.png")
im7 = Image.open(p7)
map7 = im7.crop((44, 100, 742, 530)).convert("RGB")
map7.save(r"c:\Users\dhamn\Downloads\NASA\public\images\plot-n2-crop.jpg", quality=95)

p9 = os.path.join(uploaded_dir, "media_1793815062657_5b78e758.png")
im9 = Image.open(p9)
map9 = im9.crop((44, 100, 486, 880)).convert("RGB")
map9.save(r"c:\Users\dhamn\Downloads\NASA\public\images\create-field-crop.jpg", quality=95)
print("Saved plot-n2-crop and create-field-crop successfully")
