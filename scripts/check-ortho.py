from PIL import Image

im = Image.open("public/data/cuneo-ortho.webp")
print("Size:", im.size)
print("Mode:", im.mode)
pixels = im.load()
# Sample some points
print("0,0:", pixels[0, 0])
print("100,100:", pixels[100, 100])
print("1000,1000:", pixels[1000, 1000])
print("center:", pixels[im.size[0]//2, im.size[1]//2])
