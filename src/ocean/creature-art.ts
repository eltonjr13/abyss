import type { ShapeId } from "../types";

export const CREATURE_FRAMES = 8;
type Point = [number, number];

/** Palette-indexed pixel art. Geometry is rasterized once, never in the draw loop. */
class Pixels {
  readonly cells: string[][];
  constructor(readonly w = 48, readonly h = 32) {
    this.cells = Array.from({ length: h }, () => Array<string>(w).fill("."));
  }
  dot(x: number, y: number, color: number) {
    x = Math.round(x); y = Math.round(y);
    if (x >= 0 && x < this.w && y >= 0 && y < this.h) this.cells[y][x] = String(color);
  }
  line(x1: number, y1: number, x2: number, y2: number, color: number, width = 1) {
    const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1), 1);
    for (let t = 0; t <= steps; t++) {
      for (let i = 0; i < width; i++) this.dot(x1 + (x2 - x1) * t / steps, y1 + (y2 - y1) * t / steps + i, color);
    }
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, color = 1, shaded = true) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
        if (d <= 1) this.dot(x, y, shaded ? d > 0.86 ? 0 : y < cy - ry * 0.4 ? 3 : y > cy + ry * 0.4 ? 2 : color : color);
      }
    }
  }
  poly(points: Point[], color: number) {
    const minY = Math.max(0, Math.floor(Math.min(...points.map(p => p[1]))));
    const maxY = Math.min(this.h - 1, Math.ceil(Math.max(...points.map(p => p[1]))));
    for (let y = minY; y <= maxY; y++) {
      const cuts: number[] = [];
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const a = points[i], b = points[j];
        if ((a[1] > y) !== (b[1] > y)) cuts.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
      }
      cuts.sort((a, b) => a - b);
      for (let i = 0; i < cuts.length; i += 2) {
        for (let x = Math.ceil(cuts[i]); x <= cuts[i + 1]; x++) this.dot(x, y, color);
      }
    }
  }
  fin(points: Point[]) {
    this.poly(points, 0);
    const cx = points.reduce((n, p) => n + p[0], 0) / points.length;
    const cy = points.reduce((n, p) => n + p[1], 0) / points.length;
    this.poly(points.map(([x, y]) => [cx + (x - cx) * 0.78, cy + (y - cy) * 0.78]), 3);
    for (let i = 1; i < points.length; i++) this.line(cx, cy, points[i][0], points[i][1], 5);
  }
  eye(x: number, y: number) {
    this.ellipse(x, y, 2.5, 2.5, 3, false);
    this.ellipse(x + 0.5, y, 1.5, 1.5, 4, false);
    this.dot(x + 1, y - 1, 6);
  }
  rows() { return this.cells.map(row => row.join("")); }
}

export function creatureRows(shape: ShapeId, frame = 0, species = ""): string[] {
  frame = ((Math.floor(frame) % CREATURE_FRAMES) + CREATURE_FRAMES) % CREATURE_FRAMES;
  const phase = frame / CREATURE_FRAMES * Math.PI * 2;
  const beat = Math.sin(phase);
  const sway = Math.round(beat * 2);
  const p = new Pixels();
  if (species === "isopode-gigante") {
    for (let i = 0; i < 7; i++) {
      const x = 12 + i * 4, step = Math.sin(phase + i) * 2;
      p.line(x, 19, x - 2, 25 + step, 3);
      p.line(x, 25 + step, x + 2, 27 + step, 5);
    }
    p.ellipse(24, 15, 17, 9);
    for (let x = 12; x < 38; x += 4) { p.line(x, 8, x - 2, 22, 2); p.line(x + 1, 9, x - 1, 20, 3); }
    p.ellipse(39, 16, 5, 5); p.eye(40, 14);
    p.line(42, 17, 47, 12 + sway, 3); p.line(42, 19, 47, 21 + sway, 3);
    return p.rows();
  }
  if (species === "peixe-pelicano") {
    for (let x = 3; x < 28; x++) {
      const y = 17 + Math.sin(phase - x * 0.2) * (1 - x / 30) * 3;
      p.line(x, y, x, y + 2, 5); p.dot(x, y, 3);
    }
    p.poly([[21, 15], [30, 6], [43, 8], [40, 17], [44, 23], [27, 26]], 1);
    p.poly([[29, 12], [42, 10], [39, 17], [42, 22], [30, 21]], 4);
    p.line(30, 23, 43, 23, 3); p.eye(36, 8);
    return p.rows();
  }
  const fish = ["fish1", "fish2", "fish3", "clown", "angel", "lantern", "angler", "shark", "dolphin", "whale"].includes(shape);

  if (fish) {
    const large = shape === "whale";
    const sleek = ["fish3", "shark", "dolphin"].includes(shape);
    const tall = shape === "angel";
    const angler = shape === "angler";
    const cx = large ? 27 : 26, cy = 16;
    const rx = large ? 18 : sleek ? 16 : shape === "fish2" ? 13 : angler ? 12 : 11;
    const ry = tall ? 11 : sleek ? 5 : large ? 8 : shape === "fish1" ? 7 : 8;
    const tailX = cx - rx + 1;
    p.fin([[tailX + 2, 16], [3, 8 + sway], [5, 16], [3, 24 + sway], [tailX + 2, 18]]);
    p.fin([[cx - 7, cy - ry + 2], [cx + (sleek ? 0 : -5), Math.max(2, cy - ry - (large ? 2 : sleek ? 8 : 4))], [cx + 4, cy - ry + 2]]);
    if (tall) p.fin([[20, 20], [17, 30], [30, 23]]);
    p.ellipse(cx, cy, rx, ry);
    // Scale glints and a continuous lateral line give the body volume.
    for (let y = cy - ry + 3; y < cy + ry - 2; y += 3) {
      for (let x = cx - rx + 5; x < cx + rx - 4; x += 4) {
        if (p.cells[y]?.[x] === "1") p.dot(x + (y % 2), y, 5);
      }
    }
    p.line(cx - rx + 4, cy - 2, cx + rx - 4, cy - 2, 3);
    if (shape === "clown") {
      for (const x of [19, 27, 33]) {
        for (let y = 8; y <= 24; y++) {
          if (p.cells[y][x] !== "." && p.cells[y][x] !== "0") {
            p.dot(x - 1, y, 0); p.dot(x, y, 6); p.dot(x + 1, y, 6); p.dot(x + 2, y, 0);
          }
        }
      }
    }
    if (tall || species === "peixe-arqueiro") {
      for (let x = 18; x < 32; x += 4) {
        for (let y = 7; y < 25; y++) if (p.cells[y][x] === "1" || p.cells[y][x] === "5") p.dot(x, y, tall ? 3 : 2);
      }
    }
    if (species === "peixe-cirurgiao") {
      p.ellipse(24, 15, 7, 4, 2, false); p.ellipse(26, 15, 4, 2, 1, false);
    }
    if (species === "tubarao-leopardo" || species === "tubarao-baleia") {
      for (let x = 14; x < 38; x += 4) for (let y = 12; y < 20; y += 3) p.dot(x, y, species === "tubarao-baleia" ? 6 : 2);
    }
    p.fin([[cx + 1, cy + 1], [cx - 4 + sway, cy + ry + 5], [cx + 7, cy + 4]]);
    p.line(cx + rx - 9, cy - 1, cx + rx - 10, cy + 4, 5);
    if (shape === "shark") for (let x = 28; x < 33; x += 2) p.line(x, 15, x - 1, 19, 2);
    if (shape === "dolphin" || species === "tubarao-duende") p.fin([[36, 14], [47, 14], [43, 17], [35, 18]]);
    p.eye(cx + rx - 5, cy - 3);
    p.line(cx + rx - 3, cy + 2, cx + rx, cy + 1, 4);
    if (large) {
      p.line(21, 21, 41, 21, 3);
      for (let x = 27; x < 40; x += 3) p.line(x, 21, x + 2, 23, 5);
    }
    if (angler) {
      p.line(30, 8, 32, 3, 5); p.line(32, 3, 38, 2, 5); p.line(38, 2, 40, 6 + sway, 3);
      p.ellipse(40, 6 + sway, 2, 2, frame < 4 ? 6 : 3, false);
      p.ellipse(35, 20, 5, 4, 4, false);
      for (let x = 32; x < 40; x += 2) { p.dot(x, 18, 6); p.dot(x, 22, 3); }
    }
    if (shape === "lantern") for (let x = 19; x < 34; x += 3) p.dot(x, 22, frame < 4 ? 6 : 3);
    if (species === "peixe-tripode") {
      p.line(20, 22, 15, 30, 3); p.line(28, 22, 29, 30, 3); p.line(12, 18, 6, 30, 3);
    }
    return p.rows();
  }

  switch (shape) {
    case "eel": {
      for (let x = 3; x < 39; x++) {
        const y = 16 + Math.sin(x * 0.17 + phase) * (1 - x / 48) * 5;
        const r = 1 + x / 12;
        p.line(x, y - r - 2, x, y - r, 3);
        p.line(x, y - r, x, y + r, 1);
        p.dot(x, y + r, 2); p.dot(x, y - r, 0);
        if (species === "dragao-negro" && x % 3 === 0) p.dot(x, y + r - 1, 6);
      }
      p.ellipse(39, 16, 6, 5); p.eye(41, 14); p.line(41, 19, 45, 18, 4);
      break;
    }
    case "ray": case "manta": {
      p.line(24, 20, 20 + sway, 30, 5, 2);
      const lift = sway * 2;
      p.fin([[24, 8], [18, 11], [3, 4 + lift], [7, 19 - lift], [20, 24], [24, 20]]);
      p.fin([[24, 8], [30, 11], [45, 4 + lift], [41, 19 - lift], [28, 24], [24, 20]]);
      p.ellipse(24, 15, 5, 9); p.dot(21, 10, 4); p.dot(27, 10, 4);
      p.line(21, 6, 20, 3, 3); p.line(27, 6, 28, 3, 3);
      if (shape === "ray") for (let x = 10; x < 39; x += 5) { p.dot(x, 14, 6); p.dot(x + 2, 18, 3); }
      break;
    }
    case "turtle": {
      p.fin([[18, 12], [10, 4 + sway], [8, 9 + sway], [15, 17]]);
      p.fin([[27, 19], [36, 28 - sway], [28, 28 - sway], [23, 23]]);
      p.fin([[16, 21], [8, 25 - sway], [9, 21], [18, 17]]);
      p.ellipse(38, 14, 6, 4); p.line(5, 17, 13, 17, 5, 2);
      p.ellipse(24, 16, 13, 9); p.ellipse(24, 15, 9, 6, 5, false);
      p.poly([[24, 9], [29, 12], [29, 18], [24, 21], [19, 18], [19, 12]], 1);
      p.line(24, 9, 24, 21, 3); p.line(15, 15, 32, 15, 2); p.eye(40, 13);
      break;
    }
    case "jelly": case "octopus": case "squid": {
      const jelly = shape === "jelly", squid = shape === "squid";
      const top = jelly ? 14 : 17;
      for (let i = 0; i < (jelly ? 7 : 8); i++) {
        let last: Point = [15 + i * 3, top];
        for (let y = top + 1; y < 30 - (i % 3); y++) {
          const x = 15 + i * 3 + Math.sin(phase - (y - top) * 0.35 + i * 0.8) * (y - top) * 0.28;
          p.line(last[0], last[1], x, y, i % 2 ? 3 : 5, jelly ? 1 : 2);
          if (!jelly && y % 3 === 0) p.dot(x + 1, y, 6);
          last = [x, y];
        }
      }
      if (squid) { p.fin([[24, 2], [10, 17 + sway], [24, 12]]); p.fin([[24, 2], [38, 17 + sway], [24, 12]]); }
      if (species === "lula-vampiro") {
        p.poly([[14, 16], [12 + sway, 25], [20, 22], [24, 29], [28, 22], [37 + sway, 25], [34, 16]], 2);
        for (let x = 15; x < 35; x += 4) p.line(24, 17, x + sway, 25, 3);
      }
      p.ellipse(24, jelly ? 12 : 11, jelly ? 13 + beat : squid ? 6 : 9, jelly ? 8 - beat : 9);
      if (jelly) {
        p.line(12, 15, 36, 15, 3, 2);
        for (const x of [20, 27]) { p.ellipse(x, 11, 2, 2, 5, false); p.dot(x, 10, 6); }
      } else { p.eye(20, 15); p.eye(28, 15); }
      break;
    }
    case "seahorse": {
      p.fin([[21, 12], [13 + sway, 18], [22, 21]]);
      for (let i = 0; i < 20; i++) {
        const angle = i * 0.24;
        p.dot(22 + Math.cos(angle) * (5 - i * 0.18), 25 + Math.sin(angle) * (5 - i * 0.18), 3);
      }
      p.ellipse(25, 18, 5, 8); p.ellipse(26, 7, 5, 5);
      p.line(28, 8, 37, 9, 1, 3); p.line(34, 11, 37, 11, 0);
      for (let y = 12; y < 23; y += 3) p.line(24, y, 28, y + 1, 3);
      p.fin([[23, 6], [21, 2], [27, 4]]); p.eye(28, 6);
      break;
    }
    case "crab": case "shrimp": {
      const shrimp = shape === "shrimp";
      for (let i = 0; i < 4; i++) {
        const offset = Math.round(Math.sin(phase + i) * 2);
        for (const dir of [-1, 1]) {
          p.line(24 + dir * 8, 16 + i, 24 + dir * 15, 18 + i * 2 + offset, 5);
          p.line(24 + dir * 15, 18 + i * 2 + offset, 24 + dir * 18, 22 + i * 2 + offset, 3);
        }
      }
      if (shrimp) {
        p.ellipse(24, 16, 12, 5); p.ellipse(33, 13, 6, 5);
        for (let x = 14; x < 29; x += 3) p.line(x, 13, x - 1, 19, 2);
        p.line(35, 10, 44, 3 + sway, 3); p.line(36, 12, 46, 8 + sway, 3);
        p.fin([[13, 16], [4, 10], [5, 21]]); p.eye(35, 12);
      } else {
        for (const dir of [-1, 1]) {
          p.line(24 + dir * 9, 15, 24 + dir * 15, 10 + sway, 1, 2);
          p.ellipse(24 + dir * 16, 8 + sway, 5, 5); p.line(24 + dir * 16, 3 + sway, 24 + dir * 16, 7 + sway, 4);
          p.line(24 + dir * 4, 13, 24 + dir * 5, 7, 3); p.eye(24 + dir * 5, 7);
        }
        p.ellipse(24, 17, 11, 6); p.line(17, 15, 29, 15, 3);
      }
      break;
    }
    case "star": case "urchin": {
      const star = shape === "star";
      const count = star ? species === "estrela-girassol" ? 12 : 5 : 22;
      for (let i = 0; i < count; i++) {
        const a = i / count * Math.PI * 2 - Math.PI / 2;
        const x = 24 + Math.cos(a) * 14, y = 16 + Math.sin(a) * 14;
        if (star) p.fin([[24 + Math.cos(a - 0.7) * 5, 16 + Math.sin(a - 0.7) * 5], [x, y], [24 + Math.cos(a + 0.7) * 5, 16 + Math.sin(a + 0.7) * 5]]);
        else p.line(24, 16, x, y, i % 2 ? 3 : 5);
      }
      p.ellipse(24, 16, star ? 5 : 9, star ? 5 : 9);
      for (let x = 21; x < 29; x += 3) for (let y = 13; y < 20; y += 3) p.dot(x, y, 3);
      break;
    }
    case "coral": case "leaf": {
      if (species === "coral-cerebro") {
        p.ellipse(24, 18, 15, 10);
        for (let y = 12; y < 25; y += 4) for (let x = 13; x < 36; x++) p.dot(x, y + Math.round(Math.sin(x * 0.8)), 5);
      } else {
        for (let i = 0; i < 7; i++) {
          let last: Point = [24, 28];
          for (let y = 27; y > 5 + i % 3 * 3; y--) {
            const x = 24 + (i - 3) * (28 - y) * 0.22 + Math.sin(phase + y * 0.2 + i) * (28 - y) * 0.06;
            p.line(last[0], last[1], x, y, i % 2 ? 1 : 3, 2);
            if (y % 5 === 0 && species !== "anemona") p.line(x, y, x + (i < 3 ? -4 : 4), y - 3, 3);
            last = [x, y];
          }
        }
        p.ellipse(24, 28, 9, 2, 5, false);
      }
      break;
    }
    case "nautilus": case "oyster": {
      if (shape === "nautilus") {
        for (let i = 0; i < 5; i++) p.line(31, 20, 41 + sway, 17 + i * 2, 3);
        p.ellipse(23, 15, 12, 12);
        let last: Point = [23, 15];
        for (let i = 0; i < 65; i++) {
          const a = i * 0.16, r = i * 0.15;
          const point: Point = [23 + Math.cos(a) * r, 15 + Math.sin(a) * r];
          p.line(last[0], last[1], point[0], point[1], 5); last = point;
        }
        p.eye(35, 19);
      } else {
        p.ellipse(24, 21, 15, 7); p.ellipse(24, 13 - beat, 14, 7);
        for (let x = 13; x < 37; x += 3) p.line(24, 20, x, 9, 5);
        p.line(12, 19, 36, 19, 2); p.ellipse(25, 20, 3, 2, 6, false);
      }
      break;
    }
    case "otter": {
      p.fin([[13, 19], [4, 24 + sway], [5, 17]]);
      p.ellipse(24, 18, 14, 6); p.ellipse(36, 12, 7, 6);
      if (species !== "leao-marinho") p.ellipse(33, 7, 2, 2, 5, false);
      p.fin([[25, 18], [species === "leao-marinho" ? 15 : 20, 26 - sway], [29, 22]]);
      p.ellipse(40, 14, 5, 3, 3, false); p.eye(38, 10); p.dot(44, 13, 4);
      for (let y = 14; y < 17; y += 2) p.line(41, y, 47, y - 1, 5);
      break;
    }
    case "bird": {
      p.line(24, 20, 20, 29, 5); p.line(29, 20, 28, 29, 5);
      p.fin([[23, 15], [7, 8 + sway * 2], [13, 20], [28, 21]]);
      p.ellipse(26, 17, 9, 6); p.line(32, 14, 35, 8, 1, 3); p.ellipse(36, 7, 5, 4);
      p.fin([[39, 7], [47, 9], [39, 10]]); p.eye(37, 6);
      break;
    }
    case "unknown": {
      p.ellipse(24, 16, 13, 8); p.ellipse(26, 16, 9, 5, 2, false);
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6 + phase * 0.12;
        p.dot(24 + Math.cos(a) * (18 + beat), 16 + Math.sin(a) * (11 + beat), i % 3 ? 3 : 6);
      }
      p.line(20, 16, 32, 16, 6); break;
    }
  }
  return p.rows();
}
