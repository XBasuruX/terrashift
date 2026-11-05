import glob
import os
from PIL import Image

uploaded_dir = r"C:\Users\dhamn\.gemini\antigravity\brain\97427297-7445-4b64-8937-1fc87255169a\.user_uploaded"
for f in sorted(glob.glob(os.path.join(uploaded_dir, "*"))):
    im = Image.open(f)
    print(os.path.basename(f), im.size, im.format)
