from PIL import Image

im = Image.open(r"C:\Users\dhamn\.gemini\antigravity\brain\97427297-7445-4b64-8937-1fc87255169a\.user_uploaded\media_1793814980578_ddec1ff3.png")
w, h = im.size
print(f"Desktop image size: {w}x{h}")

# Find bounding box of non-transparent / screen content
bbox = im.getbbox()
print(f"Non-zero bbox: {bbox}")

# In media_1793814980578_ddec1ff3.png, find the laptop screen area
# The screen bezel is typically inside. Let's sample colors along middle x and y
pixels = im.load()
for y in range(0, 100, 5):
    print(f"y={y}: {pixels[w//2, y]}")
