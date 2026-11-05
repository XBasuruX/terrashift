from PIL import Image, ImageEnhance, ImageFilter
import os

uploaded_dir = r"C:\Users\dhamn\.gemini\antigravity\brain\97427297-7445-4b64-8937-1fc87255169a\.user_uploaded"
out_dir = r"c:\Users\dhamn\Downloads\NASA\public\images"
os.makedirs(out_dir, exist_ok=True)

# 1. Desktop Satellite Map
# media_1793814980578_ddec1ff3.png contains the desktop satellite map
d_path = os.path.join(uploaded_dir, "media_1793814980578_ddec1ff3.png")
d_im = Image.open(d_path)
# Crop the exact inner screen of laptop:
# Screen is from x=115 to 900, y=53 to 535
screen_map = d_im.crop((116, 53, 902, 535)).convert("RGB")
# Enhance sharpness and contrast slightly for crisp display
enhancer = ImageEnhance.Sharpness(screen_map)
screen_map_sharp = enhancer.enhance(1.4)
# Resize to 1400x840 with Lanczos
hd_desktop = screen_map_sharp.resize((1400, 840), Image.Resampling.LANCZOS)
hd_desktop.save(os.path.join(out_dir, "xfarm-satellite-desktop-hd.jpg"), quality=95)
print("Created xfarm-satellite-desktop-hd.jpg")

# 2. Regional Satellite Map
t_path = os.path.join(uploaded_dir, "media_1793815006600_0f29235a.jpg")
t_im = Image.open(t_path)
# Crop the tablet map (from below header y=106 to above bottom y=965)
t_map = t_im.crop((44, 106, 742, 965)).convert("RGB")
enhancer2 = ImageEnhance.Sharpness(t_map)
t_map_sharp = enhancer2.enhance(1.3)
hd_regional = t_map_sharp.resize((1200, 1480), Image.Resampling.LANCZOS)
hd_regional.save(os.path.join(out_dir, "xfarm-satellite-regional-hd.jpg"), quality=95)
print("Created xfarm-satellite-regional-hd.jpg")

# 3. Plot N2 High Detail Aerial Photo
n2_path = os.path.join(uploaded_dir, "media_1793815046920_b3a9a29c.png")
n2_im = Image.open(n2_path)
# Crop the top map area showing Plot N2
n2_map = n2_im.crop((44, 98, 742, 515)).convert("RGB")
enhancer3 = ImageEnhance.Sharpness(n2_map)
n2_map_sharp = enhancer3.enhance(1.4)
hd_n2 = n2_map_sharp.resize((1200, 720), Image.Resampling.LANCZOS)
hd_n2.save(os.path.join(out_dir, "xfarm-plot-n2-hd.jpg"), quality=95)
print("Created xfarm-plot-n2-hd.jpg")

# 4. Generate NDVI false-color heatmap version
# Convert green channel to bright infrared/NDVI color ramp
r, g, b = hd_desktop.split()
# High vegetation in green channel -> map to NDVI (yellow to dark green)
ndvi_im = Image.merge("RGB", (b, g, r)) # false color IR
enhancer4 = ImageEnhance.Color(ndvi_im)
ndvi_enhanced = enhancer4.enhance(1.8)
ndvi_enhanced.save(os.path.join(out_dir, "xfarm-ndvi-hd.jpg"), quality=95)
print("Created xfarm-ndvi-hd.jpg")
