from PIL import Image

im2 = Image.open(r"C:\Users\dhamn\.gemini\antigravity\brain\97427297-7445-4b64-8937-1fc87255169a\.user_uploaded\media_1793815006600_0f29235a.jpg")
w2, h2 = im2.size
pixels2 = im2.load()

# Let's see top to bottom colors in column x=400
for y in range(0, 150, 10):
    print(f"im2 y={y}: {pixels2[400, y]}")
for y in range(h2-100, h2, 10):
    print(f"im2 y={y}: {pixels2[400, y]}")
