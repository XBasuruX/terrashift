from PIL import Image
import os

uploaded_dir = r"C:\Users\dhamn\.gemini\antigravity\brain\97427297-7445-4b64-8937-1fc87255169a\.user_uploaded"
files = [
    "media_1793815039668_951d6f76.png",
    "media_1793815062657_5b78e758.png",
    "media_1793814993588_e6675a2b.png"
]

for f in files:
    path = os.path.join(uploaded_dir, f)
    im = Image.open(path)
    print(f, im.size)
