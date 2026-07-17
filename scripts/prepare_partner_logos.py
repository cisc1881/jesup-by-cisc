#!/usr/bin/env python3
"""Normalize official partner logos without redrawing or altering their brand artwork."""

from pathlib import Path
import sys

from PIL import Image


CANVAS = (1200, 600)
MAX_ART = (1080, 480)


def visible_bounds(image: Image.Image):
    alpha = image.getchannel("A")
    return alpha.getbbox()


def normalize_logo(source: Path, destination: Path):
    image = Image.open(source).convert("RGBA")
    bounds = visible_bounds(image)
    if bounds:
        image = image.crop(bounds)

    scale = min(MAX_ART[0] / image.width, MAX_ART[1] / image.height)
    size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    image = image.resize(size, Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", CANVAS, (0, 0, 0, 0))
    position = ((CANVAS[0] - image.width) // 2, (CANVAS[1] - image.height) // 2)
    canvas.alpha_composite(image, position)
    destination.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(destination, format="PNG", optimize=True)


def main():
    if len(sys.argv) != 3:
        raise SystemExit("Usage: prepare_partner_logos.py <input-directory> <output-directory>")

    source_dir = Path(sys.argv[1]).expanduser().resolve()
    output_dir = Path(sys.argv[2]).expanduser().resolve()
    files = sorted(source_dir.glob("*.png"))
    if not files:
        raise SystemExit(f"No PNG files found in {source_dir}")

    for source in files:
        destination = output_dir / source.name
        normalize_logo(source, destination)
        print(f"[PREPARED] {source.name} -> {destination.name}")

    print(f"\nPrepared {len(files)} logos at {CANVAS[0]} × {CANVAS[1]} px.")


if __name__ == "__main__":
    main()
