"""Pisahkan logo-mark.png menjadi tiga helai daun (untuk animasi layar pembuka).

Cara kerja: alpha dikikis sampai batang penghubung putus, tiap helai yang tersisa
diberi label, lalu semua piksel logo dibagikan ke helai terdekat (BFS multi-sumber)
sehingga batang ikut ke daun terdekat. Hasil disimpan seukuran kanvas asli agar
ketiga lapisan bisa ditumpuk tepat di posisi yang sama.

Pemakaian: python scripts/pisah-daun.py public/img/logo-mark.png public/img
"""
import sys
from collections import deque
from PIL import Image, ImageFilter

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA')
w, h = im.size
alpha = im.getchannel('A')
solid = [[alpha.getpixel((x, y)) > 40 for x in range(w)] for y in range(h)]

# Kikis sampai tepat tiga komponen besar (batang tipis putus lebih dulu daripada daun).
for size in (5, 7, 9, 11, 13, 15, 17, 19, 21):
    eroded = alpha.filter(ImageFilter.MinFilter(size))
    core = [[eroded.getpixel((x, y)) > 40 for x in range(w)] for y in range(h)]
    label = [[0] * w for _ in range(h)]
    sizes = []
    for y in range(h):
        for x in range(w):
            if core[y][x] and not label[y][x]:
                n = len(sizes) + 1
                q = deque([(x, y)])
                label[y][x] = n
                count = 0
                while q:
                    cx, cy = q.popleft()
                    count += 1
                    for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                        if 0 <= nx < w and 0 <= ny < h and core[ny][nx] and not label[ny][nx]:
                            label[ny][nx] = n
                            q.append((nx, ny))
                sizes.append(count)
    big = [i + 1 for i, c in enumerate(sizes) if c > 300]
    if len(big) == 3:
        break
else:
    sys.exit(f'Gagal memisahkan tiga daun (komponen: {sizes})')

# Buang komponen kecil, lalu tumbuhkan label ke seluruh piksel logo.
keep = {b: i for i, b in enumerate(big)}
owner = [[-1] * w for _ in range(h)]
q = deque()
for y in range(h):
    for x in range(w):
        if label[y][x] in keep:
            owner[y][x] = keep[label[y][x]]
            q.append((x, y))
while q:
    cx, cy = q.popleft()
    for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
        if 0 <= nx < w and 0 <= ny < h and owner[ny][nx] == -1 and alpha.getpixel((nx, ny)) > 0:
            owner[ny][nx] = owner[cy][cx]
            q.append((nx, ny))

# Urutkan helai dari kiri ke kanan berdasarkan pusat massanya: kiri, atas, kanan.
cent = []
for i in range(3):
    pts = [(x, y) for y in range(h) for x in range(w) if owner[y][x] == i]
    cent.append((sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts), i))
order = [c[2] for c in sorted(cent)]

px = im.load()
for rank, i in enumerate(order, start=1):
    leaf = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    lp = leaf.load()
    for y in range(h):
        for x in range(w):
            if owner[y][x] == i:
                lp[x, y] = px[x, y]
    leaf.save(f'{out}/leaf-{rank}.png', optimize=True)
    c = next(c for c in cent if c[2] == i)
    print(f'leaf-{rank}.png pusat=({c[0]:.0f},{c[1]:.0f})')
