from PIL import Image

im = Image.open(r"C:\Users\dhamn\.gemini\antigravity\brain\97427297-7445-4b64-8937-1fc87255169a\.user_uploaded\media_1793815046920_b3a9a29c.png")
crop = im.crop((44, 98, 742, 515)).convert("RGB")
crop.save(r"c:\Users\dhamn\Downloads\NASA\public\images\plot-n2-satellite-hd.jpg", quality=95)
print("Saved plot-n2-satellite-hd.jpg")
