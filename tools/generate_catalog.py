#!/usr/bin/env python3
"""Membuat js/catalog.js dari isi assets/cars/ (pola: merk_tipe_tahun[_n].ext)."""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CARS = ROOT / "assets" / "cars"
OUT = ROOT / "js" / "catalog.js"
PAT = re.compile(r"^([a-z0-9-]+)_([a-z0-9-]+)_(\d{4})(?:_(\d+))?\.(png|jpe?g|webp|avif)$", re.I)

names = {"brands": {}, "types": {}}
if (CARS / "names.json").exists():
    names.update(json.loads((CARS / "names.json").read_text(encoding="utf-8")))

pretty = lambda s: s.replace("-", " ").title()
groups = {}
for f in sorted(CARS.iterdir()):
    if f.suffix.lower() not in (".png", ".jpg", ".jpeg", ".webp", ".avif"):
        continue
    m = PAT.match(f.name)
    if not m:
        print(f"LEWATI (nama tidak sesuai pola): {f.name}", file=sys.stderr)
        continue
    brand, typ, year, idx, _ = m.groups()
    key = (brand.lower(), typ.lower(), int(year))
    groups.setdefault(key, []).append((int(idx or 1), f.name))

catalog = []
for (b, t, y), files in sorted(groups.items()):
    catalog.append({
        "brand": names["brands"].get(b, pretty(b)), "brandKey": b.replace("-", "_"),
        "type": names["types"].get(t, pretty(t)), "typeKey": t.replace("-", "_"),
        "year": y, "images": [n for _, n in sorted(files)],
    })

OUT.write_text("// Dibuat otomatis oleh tools/generate_catalog.py — jangan edit manual.\n"
               "window.KARMADA_CATALOG = " + json.dumps(catalog, indent=1, ensure_ascii=False) + ";\n",
               encoding="utf-8")
print(f"{len(catalog)} kombinasi, {sum(len(c['images']) for c in catalog)} foto -> {OUT.relative_to(ROOT)}")
