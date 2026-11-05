from PIL import Image
import os

uploaded_dir = r"C:\Users\dhamn\.gemini\antigravity\brain\97427297-7445-4b64-8937-1fc87255169a\.user_uploaded"
out_dir = r"c:\Users\dhamn\Downloads\NASA\public\images"

d_path = os.path.join(uploaded_dir, "media_1793814980578_ddec1ff3.png")
im = Image.open(d_path)
# Crop the clean right-side map area (past the fleet drawer)
# The fleet drawer ends around x=315
clean_map = im.crop((318, 54, 900, 532)).convert("RGB")
clean_map.save(os.path.join(out_dir, "xfarm-clean-farm-map.jpg"), quality=95)
print("Saved xfarm-clean-farm-map.jpg:", clean_map.size)
