"""Bounded HTTP range I/O for public COGs; GDAL never owns the network socket."""

import io
import httpx


class RangeReader(io.RawIOBase):
    def __init__(self, url):
        self.client = httpx.Client(timeout=15, follow_redirects=True)
        self.url = url
        self.position = 0
        self.blocks = {}
        self.block_size = 262144
        r = self.client.get(url, headers={"Range": "bytes=0-0"})
        r.raise_for_status()
        if r.status_code != 206:
            raise OSError("Server does not support bounded range reads.")
        self.size = int(r.headers["content-range"].split("/")[-1])

    def readable(self):
        return True

    def seekable(self):
        return True

    def tell(self):
        return self.position

    def seek(self, offset, whence=0):
        self.position = (
            0 if whence == 0 else self.position if whence == 1 else self.size
        ) + offset
        return self.position

    def read(self, size=-1):
        if size < 0:
            size = self.size - self.position
        if size > 16000000:
            raise OSError("Unbounded COG download refused.")
        end = min(self.size, self.position + size)
        parts = []
        while self.position < end:
            block = self.position // self.block_size
            if block not in self.blocks:
                start = block * self.block_size
                r = self.client.get(
                    self.url,
                    headers={
                        "Range": f"bytes={start}-{min(self.size - 1, start + self.block_size - 1)}"
                    },
                )
                r.raise_for_status()
                if r.status_code != 206:
                    raise OSError("Range response required.")
                self.blocks[block] = r.content
            data = self.blocks[block]
            offset = self.position % self.block_size
            n = min(end - self.position, len(data) - offset)
            if n <= 0:
                break
            parts.append(data[offset : offset + n])
            self.position += n
        return b"".join(parts)

    def close(self):
        self.client.close()
        super().close()
