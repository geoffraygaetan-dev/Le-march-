const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const dir = path.join(__dirname, "..", "public", "icons");
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function drawIcon(png, size) {
  const green = { r: 45, g: 138, b: 78 };
  const cream = { r: 253, g: 246, b: 236 };
  const cx = size / 2;
  const cy = size * 0.5;
  const r = size * 0.22;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      let use = cream;
      const dx = (x - cx) / r;
      const dy = (y - cy) / r;
      const inBasket = dy >= -0.3 && dy <= 0.5 && dx * dx + dy * dy <= 1.2;
      const inHandle = dy >= -0.9 && dy <= -0.2 && dx * dx + (dy + 0.5) * (dy + 0.5) <= 0.35;
      if (inBasket || inHandle) use = green;
      png.data[idx] = use.r;
      png.data[idx + 1] = use.g;
      png.data[idx + 2] = use.b;
      png.data[idx + 3] = 255;
    }
  }
}

function writePng(size) {
  return new Promise((resolve, reject) => {
    const png = new PNG({ width: size, height: size });
    drawIcon(png, size);
    const out = path.join(dir, `icon-${size}.png`);
    png
      .pack()
      .pipe(fs.createWriteStream(out))
      .on("finish", () => {
        console.log(`Écrit public/icons/icon-${size}.png`);
        resolve();
      })
      .on("error", reject);
  });
}

Promise.all([writePng(192), writePng(512)]).catch((err) => {
  console.error(err);
  process.exit(1);
});
