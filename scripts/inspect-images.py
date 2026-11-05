from PIL import Image
import os

uploaded_dir = r"C:\Users\dhamn\.gemini\antigravity\brain\97427297-7445-4b64-8937-1fc87255169a\.user_uploaded"

files = [
    "media_1793814980578_ddec1ff3.png", # Desktop
    "media_1793815000108_5fd87df5.jpg", # Tablet 1
    "media_1793815006600_0f29235a.jpg", # Tablet 2
    "media_1793815039668_951d6f76.png", # Plot N2 Detail
]

for f in files:
    path = os.path.join(uploaded_dir, f)
    if os.path.exists(path):
        im = Image.open(path)
        print(f"{f}: format={im.format}, size={im.size}, mode={im.mode}")
