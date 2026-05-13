from PIL import Image

img_path = r'c:\Users\vanda\Downloads\Hostel-Buddy\login\frontend\public\spiderman-pixel.png'
img = Image.open(img_path).convert('RGBA')
width, height = img.size
pixels = img.load()

# Define bounding box for the Spiderman to avoid clearing eyes
# The Spiderman is roughly in the center. Let's find the first non-background pixel.

# A simple flood-fill to remove the background:
# We will consider any pixel that is very bright (like white) or grayish (like grid lines) as background,
# EXCEPT if it's inside the bounding box of the head (the eyes).
# The head is roughly the top half of the character.

# Let's do this: any pixel that is very close to white or gray AND is part of the contiguous background.
def get_color_dist(c1, c2):
    return sum(abs(a - b) for a, b in zip(c1[:3], c2[:3]))

# Queue for flood fill
bg_pixels = set()
queue = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]

for x in range(width):
    queue.append((x, 0))
    queue.append((x, height-1))
for y in range(height):
    queue.append((0, y))
    queue.append((width-1, y))

# Convert to list and process
queue = list(set(queue))
visited = set(queue)

while queue:
    x, y = queue.pop(0)
    r, g, b, a = pixels[x, y]
    
    # Is it background-ish? White or gray.
    # Gray means r, g, b are close to each other.
    # White is r,g,b > 200.
    is_gray = abs(r-g) < 25 and abs(g-b) < 25 and abs(r-b) < 25 and r > 100
    
    if is_gray or (r > 200 and g > 200 and b > 200):
        bg_pixels.add((x, y))
        pixels[x, y] = (0, 0, 0, 0)
        
        # Add neighbors
        for dx, dy in [(1,0), (-1,0), (0,1), (0,-1)]:
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited:
                visited.add((nx, ny))
                queue.append((nx, ny))

img.save(r'c:\Users\vanda\Downloads\Hostel-Buddy\login\frontend\public\spiderman-pixel-clean.png')
print('Flood fill cleaned image saved.')
