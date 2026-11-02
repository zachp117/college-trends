/**
 * Save a recharts chart as a PNG with its title, legend, source line and the
 * College Trends wordmark, so a downloaded image stands on its own when shared.
 *
 * The chart's SVG is cloned with the site font embedded (an SVG drawn into a
 * canvas can't see the page's @font-face rules), then drawn at 2x onto a white
 * canvas together with the text, which canvas draws with the loaded page font.
 */

export interface ExportLegendItem {
  label: string;
  color: string;
}

export interface ExportOptions {
  /** Element that contains the chart's <svg class="recharts-surface">. */
  container: HTMLElement;
  title: string;
  subtitle?: string;
  legend?: ExportLegendItem[];
  /** File name without extension. */
  filename: string;
}

const FONT = '"Schibsted Grotesk", system-ui, -apple-system, sans-serif';
const INK = '#0f172a'; // slate-900
const MUTED = '#64748b'; // slate-500
const SCALE = 2;
const SOURCE = 'Source: U.S. Department of Education College Scorecard · collegetrends.io';
const PAD = 32;
// Inline wordmark: viewBox 713.29 x 93.6. 20px tall = 152px wide (min 110px).
const LOGO_H = 20;
const LOGO_W = (LOGO_H * 713.29) / 93.6;

let fontCss: Promise<string> | null = null;

async function toDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

/** @font-face rules with the font files inlined, fetched once per page. */
function embeddedFontCss(): Promise<string> {
  fontCss ??= Promise.all(
    [400, 600].map(async (w) => {
      const data = await toDataUrl(`/fonts/schibsted-grotesk-${w}.woff2`);
      return `@font-face{font-family:"Schibsted Grotesk";font-weight:${w};src:url(${data}) format("woff2")}`;
    }),
  )
    .then((rules) => rules.join(''))
    .catch(() => '');
  return fontCss;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not draw the chart image'));
    img.src = src;
  });
}

/** Break text into lines that fit `width` at the context's current font. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

async function chartSvgUrl(svg: SVGSVGElement, width: number, height: number): Promise<string> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  // Hover artifacts don't belong in the saved image.
  clone.querySelectorAll('.recharts-tooltip-cursor, .recharts-active-dot').forEach((n) => n.remove());
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = `${await embeddedFontCss()} text{font-family:${FONT}}`;
  clone.insertBefore(style, clone.firstChild);
  const xml = new XMLSerializer().serializeToString(clone);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
}

export async function downloadChartPng(opts: ExportOptions): Promise<void> {
  const svg = opts.container.querySelector<SVGSVGElement>('svg.recharts-surface');
  if (!svg) throw new Error('No chart to save');
  const box = svg.getBoundingClientRect();
  const chartW = Math.round(box.width);
  const chartH = Math.round(box.height);

  await Promise.all([
    document.fonts.load(`600 22px "Schibsted Grotesk"`),
    document.fonts.load(`400 14px "Schibsted Grotesk"`),
  ]).catch(() => undefined);

  const [chart, logo] = await Promise.all([
    chartSvgUrl(svg, chartW, chartH).then(loadImage),
    loadImage('/brand/college-trends-inline-ink.svg').catch(() => null),
  ]);

  const width = Math.max(chartW, 560) + PAD * 2;
  const inner = width - PAD * 2;
  const measure = document.createElement('canvas').getContext('2d')!;

  // Lay out text first to know the canvas height.
  measure.font = `600 22px ${FONT}`;
  const titleLines = wrap(measure, opts.title, inner);
  measure.font = `400 14px ${FONT}`;
  const subLines = opts.subtitle ? wrap(measure, opts.subtitle, inner) : [];
  measure.font = `400 13px ${FONT}`;
  const legendRows: ExportLegendItem[][] = [];
  if (opts.legend?.length) {
    let row: ExportLegendItem[] = [];
    let used = 0;
    for (const item of opts.legend) {
      const w = 12 + 6 + measure.measureText(item.label).width + 18;
      if (used + w > inner && row.length) {
        legendRows.push(row);
        row = [];
        used = 0;
      }
      row.push(item);
      used += w;
    }
    legendRows.push(row);
  }

  const titleH = titleLines.length * 28;
  const subH = subLines.length ? 6 + subLines.length * 20 : 0;
  const legendH = legendRows.length ? 14 + legendRows.length * 22 : 0;
  measure.font = `400 12px ${FONT}`;
  const sourceW = measure.measureText(SOURCE).width;
  // The wordmark sits beside the source line when it fits, otherwise below it.
  const logoBeside = sourceW + 24 + LOGO_W <= inner;
  const footerH = 24 + (logoBeside ? LOGO_H : 18 + 14 + LOGO_H);
  const height = PAD + titleH + subH + legendH + 16 + chartH + footerH + PAD;

  const canvas = document.createElement('canvas');
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.textBaseline = 'top';

  let y = PAD;
  ctx.fillStyle = INK;
  ctx.font = `600 22px ${FONT}`;
  for (const l of titleLines) {
    ctx.fillText(l, PAD, y);
    y += 28;
  }
  if (subLines.length) {
    y += 6;
    ctx.fillStyle = MUTED;
    ctx.font = `400 14px ${FONT}`;
    for (const l of subLines) {
      ctx.fillText(l, PAD, y);
      y += 20;
    }
  }
  if (legendRows.length) {
    y += 14;
    ctx.font = `400 13px ${FONT}`;
    for (const row of legendRows) {
      let x = PAD;
      for (const item of row) {
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.roundRect(x, y + 2, 12, 12, 3);
        ctx.fill();
        ctx.fillStyle = INK;
        ctx.fillText(item.label, x + 18, y + 1);
        x += 12 + 6 + ctx.measureText(item.label).width + 18;
      }
      y += 22;
    }
  }
  y += 16;
  ctx.drawImage(chart, PAD, y, chartW, chartH);
  y += chartH + 24;

  ctx.fillStyle = MUTED;
  ctx.font = `400 12px ${FONT}`;
  ctx.fillText(SOURCE, PAD, y + 4);
  if (logo) {
    if (logoBeside) ctx.drawImage(logo, width - PAD - LOGO_W, y, LOGO_W, LOGO_H);
    else ctx.drawImage(logo, PAD, y + 18 + 14, LOGO_W, LOGO_H);
  }

  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
  if (!blob) throw new Error('Could not create the image');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${opts.filename}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
