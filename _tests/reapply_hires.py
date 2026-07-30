#!/usr/bin/env python3
"""Перегенерирует public/uploads/*.jpg из оригиналов _temp_photos/menu_items/
в 1400px (было 900px) для более чёткого отображения на HiDPI."""
import os, sys
from PIL import Image, ImageOps
sys.path.insert(0, "_tests")
from photo_map import MAPPING

SRC = "_temp_photos/menu_items"
DST = "public/uploads"
MAX = 1400
Q = 88

before = 0
after = 0
for menu_id, (p4, _c) in MAPPING.items():
    src = f"{SRC}/520A{p4}.jpg"
    dst = f"{DST}/{menu_id}.jpg"
    if not os.path.exists(src):
        print(f"skip {menu_id}: no {src}")
        continue
    old = os.path.getsize(dst) if os.path.exists(dst) else 0
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    im.thumbnail((MAX, MAX), Image.LANCZOS)
    im.save(dst, "JPEG", quality=Q, optimize=True, progressive=True)
    new = os.path.getsize(dst)
    before += old
    after += new
print(f"\nбыло: {before//1024} KB | стало: {after//1024} KB | {len(MAPPING)} фото")
