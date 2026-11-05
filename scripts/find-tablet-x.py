from PIL import Image

im2 = Image.open(r"C:\Users\dhamn\.gemini\antigravity\brain\97427297-7445-4b64-8937-1fc87255169a\.user_uploaded\media_1793815006600_0f29235a.jpg")
w2, h2 = im2.size
pixels2 = im2.load()

# Let's see x bounds at y=500
left_x = 0
for x in range(0, 100):
    if pixels2[x, 500] not in [(0,0,0), (4,4,6), (6,6,6), (8,8,8), (10,10,10)]:
        left_x = x
        break

right_x = w2
for x in range(w2-1, w2-100, -1):
    if pixels2[x, 500] not in [(0,0,0), (4,4,6), (6,6,6), (8,8,8), (10,10,10)]:
        right_x = x
        break

print(f"Tablet screen x bounds: {left_x} to {right_x}")
