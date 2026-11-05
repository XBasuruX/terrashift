from PIL import Image
import os

uploaded_dir = r"C:\Users\dhamn\.gemini\antigravity\brain\97427297-7445-4b64-8937-1fc87255169a\.user_uploaded"
public_images_dir = r"c:\Users\dhamn\Downloads\NASA\public\images"
os.makedirs(public_images_dir, exist_ok=True)

# 1. Extract from Desktop image (media_1793814980578_ddec1ff3.png)
desktop_path = os.path.join(uploaded_dir, "media_1793814980578_ddec1ff3.png")
if os.path.exists(desktop_path):
    d_im = Image.open(desktop_path)
    # The screen in desktop image is roughly:
    # x: 115 (just past left sidebar) to 900
    # y: 53 (just below header) to 535 (above bottom bar)
    # Let's crop the pure satellite map area
    # Note: in desktop image:
    # x=115 is past the left icon dock
    # y=53 is below the header
    # x=900 is right edge of screen
    # y=535 is bottom of map before bottom strip
    screen_crop = d_im.crop((116, 54, 902, 532))
    # Convert RGBA to RGB with white/neutral bg if needed
    rgb_desktop = Image.new("RGB", screen_crop.size, (255, 255, 255))
    if screen_crop.mode == "RGBA":
        rgb_desktop.paste(screen_crop, mask=screen_crop.split()[3])
    else:
        rgb_desktop = screen_crop
    
    # Save as high-quality JPEG
    rgb_desktop.save(os.path.join(public_images_dir, "xfarm-sat-desktop.jpg"), quality=95)
    print("Saved xfarm-sat-desktop.jpg:", rgb_desktop.size)

# 2. Extract from Tablet image (media_1793815006600_0f29235a.jpg)
tablet_path = os.path.join(uploaded_dir, "media_1793815006600_0f29235a.jpg")
if os.path.exists(tablet_path):
    t_im = Image.open(tablet_path)
    # Tablet map area: x from ~44 to ~740, y from ~105 to ~965
    tablet_map = t_im.crop((44, 106, 742, 965))
    tablet_map.save(os.path.join(public_images_dir, "xfarm-sat-regional.jpg"), quality=95)
    print("Saved xfarm-sat-regional.jpg:", tablet_map.size)

# 3. Extract Plot N2 Detail (media_1793815039668_951d6f76.png)
plot_path = os.path.join(uploaded_dir, "media_1793815039668_951d6f76.png")
if os.path.exists(plot_path):
    p_im = Image.open(plot_path)
    # Plot N2 satellite map is in the top half
    plot_map = p_im.crop((44, 150, 742, 515))
    rgb_plot = Image.new("RGB", plot_map.size, (255, 255, 255))
    if plot_map.mode == "RGBA":
        rgb_plot.paste(plot_map, mask=plot_map.split()[3])
    else:
        rgb_plot = plot_map
    rgb_plot.save(os.path.join(public_images_dir, "xfarm-plot-n2-sat.jpg"), quality=95)
    print("Saved xfarm-plot-n2-sat.jpg:", rgb_plot.size)
