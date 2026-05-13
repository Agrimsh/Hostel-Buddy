from PIL import Image

img_path = r'c:\Users\vanda\Downloads\Hostel-Buddy\login\frontend\public\spiderman-pixel.png'
img = Image.open(img_path).convert('RGBA')
width, height = img.size
pixels = img.load()

# Let's do a flood fill from the borders to remove the background.
# Since it's a grid, flood fill might not pass through dark grid lines if they reach the border.
# So instead, let's look at every pixel.
# Spiderman colors:
# Red: R is dominant
# Blue: B is dominant
# Black: all are low
# White: all are high
for y in range(height):
    for x in range(width):
        r, g, b, a = pixels[x, y]
        
        # Calculate color distances
        is_black = (r < 60 and g < 60 and b < 60)
        is_red = (r > 120 and g < 80 and b < 80)
        is_blue = (r < 80 and g < 120 and b > 150)
        is_white = (r > 200 and g > 200 and b > 200)
        
        # Grid lines are usually gray: r,g,b are similar and around 100-200.
        is_gray = abs(r - g) < 30 and abs(g - b) < 30 and abs(r - b) < 30 and not is_black and not is_white
        
        if is_gray:
            pixels[x, y] = (0, 0, 0, 0)
        # Also remove white if it's near the border (to remove background white, keep eyes)
        elif is_white:
            # If it's in the outer 20% of the image, it's background
            if x < width * 0.2 or x > width * 0.8 or y < height * 0.2 or y > height * 0.8:
                pixels[x, y] = (0, 0, 0, 0)

# Save the cleaned image
img.save(r'c:\Users\vanda\Downloads\Hostel-Buddy\login\frontend\public\spiderman-pixel-clean.png')
print('Cleaned image saved.')
