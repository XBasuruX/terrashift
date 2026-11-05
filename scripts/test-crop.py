from PIL import Image

im = Image.open("public/data/cuneo-ortho.webp")
w, h = im.size
print("Ortho size:", w, h)
# If toMap maps to 1050x600, then in the 3584x2048 image:
# scale_x = 3584 / 1050 = 3.4133
# scale_y = 2048 / 600 = 3.4133
# So point (864, 409) is at (864 * 3.4133, 409 * 3.4133) = (2949, 1396)
crop_w = int(60 * 3.4133)
crop_h = int(60 * 3.4133)
x1 = int(864 * 3.4133) - crop_w
y1 = int(409 * 3.4133) - crop_h
crop = im.crop((x1, y1, x1 + crop_w*2, y1 + crop_h*2))
crop.save("public/images/test-ortho-crop.jpg", quality=95)
print("Saved test-ortho-crop.jpg")
