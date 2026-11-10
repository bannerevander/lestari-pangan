"""Turn the ChatGPT logo render into transparent app assets (wordmark, leaf mark, favicon, app icon)."""
import sys
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
raw = Image.open(src).convert('RGBA')
# Source is partly transparent; flatten on white so one color-to-alpha pass handles both.
im = np.asarray(Image.alpha_composite(Image.new('RGBA', raw.size, 'white'), raw).convert('RGB')).astype(np.float32)

# Color-to-alpha against white: distance from white decides opacity.
diff = (255 - im).max(axis=2)
T = 110.0  # leaf highlight (~#90D080) still counts as fully opaque
alpha = np.clip(diff / T, 0, 1)
alpha[diff < 14] = 0  # drop faint JPEG-ish specks in the background
a = np.maximum(alpha, 1e-6)[..., None]
rgb = np.clip((im - 255 * (1 - a)) / a, 0, 255)  # un-blend edge pixels from white
rgba = np.dstack([rgb, alpha * 255]).astype(np.uint8)
img = Image.fromarray(rgba, 'RGBA')

def trim(i, pad=0):
    box = Image.fromarray((np.asarray(i)[..., 3] > 25).astype(np.uint8) * 255).getbbox()
    i = i.crop(box)
    if pad:
        c = Image.new('RGBA', (i.width + 2 * pad, i.height + 2 * pad), (0, 0, 0, 0))
        c.paste(i, (pad, pad))
        i = c
    return i

word = trim(img, 4)
# Leaf sits left of the lettering; the "L" starts around x=495 in the source.
leaf = trim(img.crop((0, 0, 485, img.height)))
assert word.width > 2 * word.height and leaf.width < leaf.height * 1.3, (word.size, leaf.size)

def square(i, size, pad_ratio, bg=None):
    s = max(i.size)
    side = int(s / (1 - 2 * pad_ratio))
    c = Image.new('RGBA', (side, side), bg or (0, 0, 0, 0))
    c.paste(i, ((side - i.width) // 2, (side - i.height) // 2), i)
    return c.resize((size, size), Image.LANCZOS)

word.resize((640, round(640 * word.height / word.width)), Image.LANCZOS).save(f'{out}/img/logo-lestari-pangan.png', optimize=True)
square(leaf, 256, 0.02).save(f'{out}/img/logo-mark.png', optimize=True)
square(leaf, 64, 0.04).save(f'{out}/favicon.png', optimize=True)
# App icon: leaf on the brand's soft green container, safe-zone padding for maskable crops.
square(leaf, 512, 0.2, (234, 245, 236, 255)).save(f'{out}/img/app-icon-512.png', optimize=True)
square(leaf, 180, 0.2, (234, 245, 236, 255)).save(f'{out}/apple-touch-icon.png', optimize=True)
print('word', word.size, 'leaf', leaf.size)
