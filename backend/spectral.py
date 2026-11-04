"""Transparent satellite indicators, not soil-moisture measurements."""

import io
import numpy as np


def normalized_difference(a, b):
    denominator = a + b
    return np.divide(
        a - b,
        denominator,
        out=np.full_like(a, np.nan, dtype="float32"),
        where=np.abs(denominator) > 1e-6,
    )


def reflectance(values, metadata):
    """Apply each source asset's published radiometry; preserve missing data."""
    if "scale" not in metadata or "offset" not in metadata:
        raise ValueError("Radiometric scale/offset unavailable.")
    return np.where(
        values == metadata.get("nodata", 0),
        np.nan,
        values * metadata["scale"] + metadata["offset"],
    )


def render_indicator(item, bbox, product, sampling):
    import rasterio
    from rasterio.warp import transform_bounds, reproject, Resampling
    from rasterio.transform import from_bounds
    from PIL import Image
    from .range_reader import RangeReader

    w, s, e, n = bbox
    if not (0 < e - w <= 1 and 0 < n - s <= 1):
        raise ValueError("Extent too large.")
    if product not in ("ndwi", "ndmi"):
        raise ValueError("Unknown indicator.")
    width = min(1600, max(16, int((e - w) * 111000 / sampling)))
    height = min(1600, max(16, int((n - s) * 111000 / sampling)))

    def read(name):
        asset = item["assets"][name]
        url = asset["href"]
        if not url.startswith("https://sentinel-cogs.s3.us-west-2.amazonaws.com/"):
            raise ValueError("Unexpected asset host.")
        target = np.zeros((height, width), dtype="float32")
        with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR"):
            with rasterio.open(
                "image.tif", opener=lambda path, mode="rb": RangeReader(url)
            ) as src:
                window = src.window(*transform_bounds("EPSG:4326", src.crs, *bbox))
                method = Resampling.nearest if name == "scl" else Resampling.bilinear
                data = src.read(
                    1,
                    window=window,
                    boundless=True,
                    fill_value=0,
                    out_shape=(height, width),
                    resampling=method,
                )
                from affine import Affine

                source_transform = src.window_transform(window) * Affine.scale(
                    window.width / width, window.height / height
                )
                reproject(
                    data,
                    target,
                    src_transform=source_transform,
                    src_crs=src.crs,
                    dst_transform=from_bounds(*bbox, width, height),
                    dst_crs="EPSG:4326",
                    resampling=Resampling.nearest
                    if name == "scl"
                    else Resampling.bilinear,
                )
        if name == "scl":
            return target
        metadata = asset["raster:bands"][0]
        return reflectance(target, metadata)

    first = read("green" if product == "ndwi" else "nir")
    second = read("nir" if product == "ndwi" else "swir16")
    scl = read("scl")
    index = normalized_difference(first, second)
    valid = np.isfinite(index) & ~np.isin(scl, [0, 1, 3, 8, 9, 10, 11])
    positions = [-1, 0, 0.2, 1] if product == "ndwi" else [-1, -0.2, 0.2, 1]
    colors = np.array(
        [[155, 110, 65], [225, 225, 188], [80, 188, 211], [5, 75, 160]]
        if product == "ndwi"
        else [[160, 90, 40], [216, 180, 121], [155, 194, 117], [22, 105, 64]]
    )
    rgba = np.zeros((height, width, 4), dtype="uint8")
    for c in range(3):
        rgba[:, :, c] = np.interp(np.nan_to_num(index), positions, colors[:, c]).astype(
            "uint8"
        )
    rgba[:, :, 3] = np.where(valid, 220, 0)
    out = io.BytesIO()
    Image.fromarray(rgba).save(out, format="PNG")
    return out.getvalue()
