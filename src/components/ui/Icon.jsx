/*
 * Line icons from the Tabang v2 design (tb-icons.js in the Claude Design
 * project), drawn inline so no icon package or extra request is needed.
 * Each entry is a list of shapes: a string is a path, ["c", cx, cy, r] a
 * circle, ["cd", ...] a dashed circle, ["r", x, y, w, h, rx] a rectangle.
 */
const PATHS = {
  home: ["m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", "M9 22V12h6v10"],
  waves: [
    "M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1",
    "M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1",
    "M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1",
  ],
  lifebuoy: [
    ["c", 12, 12, 10],
    ["c", 12, 12, 4],
    "m4.93 4.93 4.24 4.24",
    "m14.83 9.17 4.24-4.24",
    "m14.83 14.83 4.24 4.24",
    "m9.17 14.83-4.24 4.24",
  ],
  phone: [
    "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
  ],
  file: [
    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
    "M14 2v6h6",
    "M16 13H8",
    "M16 17H8",
  ],
  menu: ["M4 6h16", "M4 12h16", "M4 18h16"],
  x: ["M18 6 6 18", "m6 6 12 12"],
  chevR: ["m9 18 6-6-6-6"],
  chevL: ["m15 18-6-6 6-6"],
  chevD: ["m6 9 6 6 6-6"],
  arrowR: ["M5 12h14", "m12 5 7 7-7 7"],
  pin: ["M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z", ["c", 12, 10, 3]],
  camera: [
    "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",
    ["c", 12, 13, 3],
  ],
  alert: [
    "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z",
    "M12 9v4",
    "M12 17h.01",
  ],
  check: ["M20 6 9 17l-5-5"],
  checkCircle: [["c", 12, 12, 10], "m9 12 2 2 4-4"],
  xCircle: [["c", 12, 12, 10], "m15 9-6 6", "m9 9 6 6"],
  circleDashed: [["cd", 12, 12, 9]],
  wifiOff: [
    "M12 20h.01",
    "M8.5 16.43a5 5 0 0 1 7 0",
    "M5 12.86a10 10 0 0 1 5.17-2.69",
    "M19 12.86a10 10 0 0 0-2-1.52",
    "M2 8.82a15 15 0 0 1 4.18-2.64",
    "M22 8.82a15 15 0 0 0-11.29-3.76",
    "m2 2 20 20",
  ],
  user: ["M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", ["c", 12, 7, 4]],
  shield: [
    "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
    "m9 12 2 2 4-4",
  ],
  shieldX: [
    "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
    "m14.5 9.5-5 5",
    "m9.5 9.5 5 5",
  ],
  megaphone: ["m3 11 18-5v12L3 14v-3z", "M11.6 16.8a3 3 0 1 1-5.8-1.6"],
  grid: [
    ["r", 3, 3, 7, 7, 1],
    ["r", 14, 3, 7, 7, 1],
    ["r", 14, 14, 7, 7, 1],
    ["r", 3, 14, 7, 7, 1],
  ],
  list: [
    "M8 6h13",
    "M8 12h13",
    "M8 18h13",
    "M3 6h.01",
    "M3 12h.01",
    "M3 18h.01",
  ],
  clock: [["c", 12, 12, 10], "M12 6v6l4 2"],
  eye: ["M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z", ["c", 12, 12, 3]],
  logout: [
    "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",
    "m16 17 5-5-5-5",
    "M21 12H9",
  ],
  crosshair: [["c", 12, 12, 8], "M22 12h-4", "M6 12H2", "M12 6V2", "M12 22v-4"],
  image: [
    ["r", 3, 3, 18, 18, 2],
    ["c", 9, 9, 2],
    "m21 15-3.09-3.09a2 2 0 0 0-2.83 0L6 21",
  ],
  idcard: [
    ["r", 2, 5, 20, 14, 2],
    ["c", 8, 11, 2],
    "M5 16.5c.6-1.2 1.7-2 3-2s2.4.8 3 2",
    "M14 10h5",
    "M14 14h4",
  ],
  device: [["r", 5, 2, 14, 20, 2], "M12 18h.01"],
  loader: ["M21 12a9 9 0 1 1-6.22-8.56"],
  info: [["c", 12, 12, 10], "M12 16v-4", "M12 8h.01"],
  help: [
    ["c", 12, 12, 10],
    "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",
    "M12 17h.01",
  ],
  nav: ["M3 11 22 2l-9 19-2-8-8-2z"],
  send: ["m22 2-7 20-4-9-9-4Z", "M22 2 11 13"],
  building: [
    "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z",
    "M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2",
    "M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2",
    "M10 6h4",
    "M10 10h4",
    "M10 14h4",
    "M10 18h4",
  ],
  aid: [["r", 3, 3, 18, 18, 2], "M12 8v8", "M8 12h8"],
};

function Shape({ shape }) {
  if (typeof shape === "string") {
    return <path d={shape} />;
  }

  const [type, ...values] = shape;

  if (type === "c") {
    const [cx, cy, r] = values;

    return <circle cx={cx} cy={cy} r={r} />;
  }

  if (type === "cd") {
    const [cx, cy, r] = values;

    return <circle cx={cx} cy={cy} r={r} strokeDasharray="3 3" />;
  }

  const [x, y, width, height, rx] = values;

  return <rect height={height} rx={rx} width={width} x={x} y={y} />;
}

/** Decorative: the text next to an icon always carries the meaning. */
export default function Icon({ name, className = "" }) {
  const shapes = PATHS[name];

  if (!shapes) {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      className={`icon ${className}`.trim()}
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {shapes.map((shape, index) => (
        <Shape key={index} shape={shape} />
      ))}
    </svg>
  );
}
