#!/usr/bin/env node
// fallow-ignore-file unused-file

/**
 * Converts 16×16 pixel-art PNG files to SVG.
 *
 * Each non-transparent pixel becomes a 1×1 <rect>. Adjacent same-color pixels
 * on the same row are merged into wider rects to keep output compact.
 *
 * Usage:
 *   node scripts/png-to-svg.mjs <input-dir> [output-dir]
 *
 * Default output-dir is a sibling directory with an "svg" suffix.
 */

import { PNG } from "pngjs";
import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";

const INPUT_DIR = process.argv[2];
const OUTPUT_DIR = process.argv[3] ?? INPUT_DIR.replace(/\/+$/, "") + "Svg";

/** Run-length encode consecutive same-color pixels on a single row. */
function encodeRow(data, width, y) {
  const runs = [];
  let startX = null;
  let currentColor = null;

  for (let x = 0; x < width; x++) {
    const idx = (y * width + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];

    if (a > 0) {
      const hex = rgbToHex(r, g, b);
      if (hex === currentColor) {
        // extend current run
      } else {
        if (startX !== null) {
          runs.push({ x: startX, y, w: x - startX, color: currentColor });
        }
        startX = x;
        currentColor = hex;
      }
    } else {
      if (startX !== null) {
        runs.push({ x: startX, y, w: x - startX, color: currentColor });
        startX = null;
        currentColor = null;
      }
    }
  }
  // flush trailing run
  if (startX !== null) {
    runs.push({ x: startX, y, w: width - startX, color: currentColor });
  }

  return runs;
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}

function pngToSvg(pngData) {
  return new Promise((resolve, reject) => {
    const png = new PNG({ filterType: 4 });
    png.on("parsed", function () {
      const w = this.width;
      const h = this.height;
      const allRuns = [];
      for (let y = 0; y < h; y++) {
        allRuns.push(...encodeRow(this.data, w, y));
      }

      // Group runs by color to reduce markup
      const byColor = new Map();
      for (const run of allRuns) {
        if (!byColor.has(run.color)) {
          byColor.set(run.color, []);
        }
        byColor.get(run.color).push(run);
      }

      // Generate SVG content
      const rects = [];
      for (const [color, runs] of byColor) {
        // Merge vertically adjacent runs of same color, width, and x
        const merged = mergeRuns(runs);
        for (const r of merged) {
          rects.push(
            `  <rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${color}"/>`,
          );
        }
      }

      const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" shape-rendering="crispEdges">\n` +
        rects.join("\n") +
        `\n</svg>\n`;

      resolve(svg);
    });
    png.on("error", reject);
    png.end(pngData);
  });
}

/** Merge vertically adjacent runs of same x, width, and color into taller rects. */
function mergeRuns(runs) {
  if (runs.length === 0) return [];

  // Sort by y then x
  runs.sort((a, b) => a.y - b.y || a.x - b.x);

  // Group into columns (same x, w, color) and merge vertical gaps
  const groups = new Map();
  for (const r of runs) {
    const key = `${r.x}|${r.w}|${r.color}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }

  const merged = [];
  for (const [, group] of groups) {
    group.sort((a, b) => a.y - b.y);
    let current = { ...group[0], h: 1 };

    for (let i = 1; i < group.length; i++) {
      const next = group[i];
      if (next.y === current.y + current.h) {
        // Extend downward
        current.h++;
      } else {
        merged.push(current);
        current = { ...next, h: 1 };
      }
    }
    merged.push(current);
  }

  return merged;
}

// ── Main ────────────────────────────────────────────────────────────────

const pngFiles = readdirSync(INPUT_DIR).filter(
  (f) => extname(f).toLowerCase() === ".png",
);

console.log(`Found ${pngFiles.length} PNG files in ${INPUT_DIR}`);
mkdirSync(OUTPUT_DIR, { recursive: true });

let converted = 0;
let errors = 0;

for (const file of pngFiles) {
  const inputPath = join(INPUT_DIR, file);
  const outputPath = join(OUTPUT_DIR, file.replace(/\.png$/i, ".svg"));

  try {
    const pngData = readFileSync(inputPath);
    const svg = await pngToSvg(pngData);
    writeFileSync(outputPath, svg, "utf-8");
    converted++;
    if (converted % 20 === 0) {
      console.log(`  ${converted}/${pngFiles.length}...`);
    }
  } catch (err) {
    console.error(`  ERROR ${file}: ${err.message}`);
    errors++;
  }
}

console.log(`\nDone: ${converted} converted, ${errors} errors → ${OUTPUT_DIR}`);
