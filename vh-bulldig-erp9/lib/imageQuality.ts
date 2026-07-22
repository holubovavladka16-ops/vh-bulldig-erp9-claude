export interface ImageQualityResult {
  ok: boolean;
  width: number;
  height: number;
  brightness: number; // 0-255
  blurScore: number; // vyšší = ostřejší
  issues: string[];
}

const MIN_WIDTH = 900;
const MIN_HEIGHT = 1200;
const MIN_BRIGHTNESS = 60;
const MAX_BRIGHTNESS = 235;
const MIN_BLUR_SCORE = 15;

export async function assessImageQuality(file: File): Promise<ImageQualityResult> {
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 800 / img.width);
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const gray = new Float32Array(width * height);

  let sum = 0;
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    gray[i] = lum;
    sum += lum;
  }
  const brightness = sum / (width * height);

  // Jednoduchá Laplaceova varianční metrika ostrosti (proxy pro rozmazání).
  let lapSum = 0;
  let lapSumSq = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const lap =
        4 * gray[idx] - gray[idx - 1] - gray[idx + 1] - gray[idx - width] - gray[idx + width];
      lapSum += lap;
      lapSumSq += lap * lap;
      count++;
    }
  }
  const lapMean = lapSum / count;
  const blurScore = Math.sqrt(lapSumSq / count - lapMean * lapMean);

  const issues: string[] = [];
  if (img.width < MIN_WIDTH || img.height < MIN_HEIGHT) issues.push("nízké rozlišení fotografie");
  if (brightness < MIN_BRIGHTNESS) issues.push("fotografie je příliš tmavá");
  if (brightness > MAX_BRIGHTNESS) issues.push("fotografie je příliš přesvětlená");
  if (blurScore < MIN_BLUR_SCORE) issues.push("fotografie je pravděpodobně rozmazaná");

  return {
    ok: issues.length === 0,
    width: img.width,
    height: img.height,
    brightness: Math.round(brightness),
    blurScore: Math.round(blurScore * 10) / 10,
    issues,
  };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

export const LOW_QUALITY_MESSAGE = "Formulář není dostatečně čitelný. Pořiďte prosím novou fotografii.";
