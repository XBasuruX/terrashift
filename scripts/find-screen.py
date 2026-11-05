from PIL import Image

im = Image.open(r"C:\Users\dhamn\.gemini\antigravity\brain\97427297-7445-4b64-8937-1fc87255169a\.user_uploaded\media_1793814980578_ddec1ff3.png")
w, h = im.size
pixels = im.load()

# Find left and right bounds of the screen at y=200
left_x = 0
for x in range(0, 300):
    if pixels[x, 200][3] > 0 and pixels[x, 200][:3] != (0,0,0) and pixels[x, 200][:3] != (152,152,152):
        # We hit the inner screen
        left_x = x
        break

right_x = w
for x in range(w-1, w-300, -1):
    if pixels[x, 200][3] > 0 and pixels[x, 200][:3] != (0,0,0) and pixels[x, 200][:3] != (152,152,152):
        right_x = x
        break

print(f"Screen x range: {left_x} to {right_x}")

# Find top and bottom bounds of the screen at x=500
top_y = 0
for y in range(0, 200):
    if pixels[500, y][3] > 0 and pixels[500, y][:3] == (104, 140, 102):
        top_y = y
        break

bottom_y = h
for y in range(h-1, h-200, -1):
    # Laptop keyboard / bezel starts below screen
    # Check when y is inside the screen
    if pixels[500, y][3] > 0 and pixels[500, y][:3] not in [(152,152,152), (180,180,180), (200,200,200), (0,0,0)]:
        bottom_y = y
        break

print(f"Screen y range: {top_y} to {bottom_y}")
