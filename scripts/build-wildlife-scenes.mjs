import {
  access,
  mkdir,
  readFile,
  writeFile as writeRaw,
  copyFile,
} from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const writeFile = (file, content) =>
  writeRaw(file, content.replace(/[ \t]+$/gm, "").trimEnd() + "\n");

// Original vector artwork and seekable HyperFrames source. No downloaded art.
const project = path.resolve("videos/wildlife-wait");
const out = path.resolve("public/animations/wildlife");
await mkdir(path.join(project, "assets"), { recursive: true });
await mkdir(out, { recursive: true });
const require = createRequire(import.meta.url);
const gsapTarget = path.join(project, "assets/gsap.min.js");
if (process.env.FLUX_GSAP_SOURCE) {
  await copyFile(process.env.FLUX_GSAP_SOURCE, gsapTarget);
} else {
  await access(gsapTarget).catch(async () => {
    await copyFile(require.resolve("gsap/dist/gsap.min.js"), gsapTarget);
  });
}
await writeFile(gsapTarget, await readFile(gsapTarget, "utf8"));

const c = {
  ink: "#171722",
  sky: "#191925",
  far: "#28243e",
  hill: "#383052",
  violet: "#9873ff",
  lilac: "#c4b1ff",
  cream: "#f1e7dd",
  peach: "#e7ae95",
  teal: "#8bc5bb",
  water: "#353454",
};
const ellipse = (x, y, rx, ry, fill, extra = "") =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const circle = (x, y, r, fill, extra = "") =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const p = (d, fill, extra = "") => `<path d="${d}" fill="${fill}" ${extra}/>`;
const line = (d, color = c.lilac, width = 3) =>
  p(
    d,
    "none",
    `stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`,
  );
const group = (id, body, x = 0, y = 0) =>
  `<g transform="translate(${x} ${y})"><g id="${id}">${body}</g></g>`;
const eyes = (x, y, gap = 18) =>
  circle(x, y, 3.3, c.ink) + circle(x + gap, y, 3.3, c.ink);
const smile = (x, y) => line(`M${x} ${y}q6 6 12 0`, c.ink, 2);
const spark = (x, y, color = c.lilac) =>
  p(`M${x} ${y - 6}q0 6 6 6q-6 0-6 6q0-6-6-6q6 0 6-6`, color);
const leaf = (x, y, scale = 1, color = c.teal) =>
  `<g transform="translate(${x} ${y}) scale(${scale})">${p("M0 0Q-35-38 0-65Q35-38 0 0", color)}${line("M0 0V-48", c.hill, 2)}</g>`;
function sky(id, ocean = false, snow = false) {
  let stars = "";
  for (let i = 0; i < 22; i++) {
    const x = 38 + ((i * 137) % 700),
      y = 27 + ((i * 61) % 185);
    stars += circle(
      x,
      y,
      i % 4 === 0 ? 2 : 1,
      i % 3 === 0 ? c.lilac : "#706787",
    );
  }
  return `<rect width="768" height="432" fill="${c.sky}"/>${circle(603, 87, 56, "#242133")}${circle(603, 87, 36, c.lilac)}${circle(618, 74, 33, c.sky)}${stars}
  ${p("M0 268Q120 145 257 247Q396 121 532 237Q664 171 768 242V432H0Z", c.far)}
  ${p("M0 310Q139 238 300 296Q478 216 768 292V432H0Z", snow ? "#56516d" : c.hill)}
  ${p(ocean ? "M0 316Q180 302 384 323T768 316V432H0Z" : "M0 337Q190 301 397 333T768 333V432H0Z", snow ? "#b8adc9" : ocean ? c.water : "#292638")}
  ${ocean ? line("M0 354Q120 340 255 354T510 354T768 354", "#595274", 2) + line("M0 385Q120 371 255 385T510 385T768 385", "#595274", 2) : ""}
  ${!ocean && !snow ? [leaf(70, 370, 0.65, "#4c4465"), leaf(99, 377, 0.48, "#756190"), leaf(678, 366, 0.55, "#4c4465"), leaf(709, 382, 0.85, "#56466f")].join("") : ""}
  ${group(`${id}-twinkle`, spark(115, 94) + spark(382, 55) + spark(691, 156))}`;
}

function fox(id) {
  return (
    group(
      `${id}-tail`,
      p("M-45 9Q-115 9-116-48Q-64-48-39-6Z", c.peach) +
        p("M-116-48Q-97-48-81-39L-100-20Q-114-30-116-48", c.cream),
    ) +
    group(`${id}-leg-a`, p("M-34 19h16v35q-2 6-17 4Z", c.peach)) +
    group(`${id}-leg-b`, p("M17 19h16v35q-2 6-17 4Z", c.peach)) +
    ellipse(-3, 5, 55, 33, c.peach) +
    p("M-16 1Q10-4 30 14Q18 36-10 33Z", c.cream) +
    group(
      `${id}-head`,
      p("M15-32L16-76L44-53L70-74L80-32Q73 9 47 13Q18 3 15-32Z", c.peach) +
        p("M24-60L25-38L39-47Z", "#b77b82") +
        p("M65-59L56-46L72-39Z", "#b77b82") +
        p("M17-26L45-10L78-26Q71 4 47 13Q23 5 17-26", c.cream) +
        eyes(35, -29, 24) +
        circle(47, -10, 4, c.ink) +
        smile(41, -2),
    )
  );
}
function owl(id) {
  return (
    group(`${id}-wing-a`, ellipse(-39, 4, 20, 47, "#7d659f")) +
    group(`${id}-wing-b`, ellipse(39, 4, 20, 47, "#7d659f")) +
    ellipse(0, 5, 42, 57, c.lilac) +
    p("M-36-26L-38-61L-13-43L14-43L39-61L37-23", c.lilac) +
    ellipse(-17, -15, 22, 25, c.cream) +
    ellipse(17, -15, 22, 25, c.cream) +
    eyes(-17, -15, 34) +
    p("M-6-1H6L0 9Z", c.peach) +
    line("M-13 27l4 4m7-3 4 4m7-4 4 4", "#7d659f", 3) +
    line("M-16 57v8m32-8v8", c.peach, 6)
  );
}
function rabbit(id) {
  return (
    group(
      `${id}-ear-a`,
      ellipse(-8, -62, 12, 42, c.lilac) + ellipse(-8, -65, 5, 28, "#a58bc2"),
    ) +
    group(
      `${id}-ear-b`,
      ellipse(21, -62, 12, 42, c.lilac) + ellipse(21, -65, 5, 28, "#a58bc2"),
    ) +
    circle(-40, 15, 17, c.cream) +
    ellipse(-10, 18, 42, 39, c.lilac) +
    ellipse(-15, 47, 30, 11, c.cream) +
    ellipse(12, -20, 35, 32, c.lilac) +
    ellipse(17, -6, 21, 15, c.cream) +
    eyes(2, -26, 25) +
    p("M11-12h10l-5 7Z", c.peach) +
    smile(10, -1)
  );
}
function turtle(id, small = false) {
  return (
    group(
      `${id}-flipper`,
      ellipse(-28, 21, 24, 10, "#72a99f", 'transform="rotate(-25 -28 21)"'),
    ) +
    ellipse(23, 23, 24, 9, "#72a99f") +
    ellipse(-3, 0, 49, 33, c.teal) +
    p("M-42-5L-14-25L15-22L39-3L23 21L-13 25Z", "#538e8e") +
    line("M-14-25L-13 25M15-22L23 21M-42-5L39-3", "#81bab0", 2) +
    ellipse(52, 0, 23, 19, c.teal) +
    circle(60, -5, 3, c.ink) +
    smile(60, 3)
  );
}
function otter(id) {
  return (
    group(`${id}-tail`, p("M-52 19Q-103 6-110 25Q-83 46-44 36Z", "#a491bd")) +
    ellipse(-5, 15, 65, 31, "#a491bd") +
    ellipse(-2, 8, 40, 23, c.cream) +
    circle(56, -5, 30, "#a491bd") +
    circle(38, -26, 9, "#a491bd") +
    circle(77, -24, 9, "#a491bd") +
    ellipse(62, 4, 20, 14, c.cream) +
    eyes(48, -11, 22) +
    circle(61, 0, 4, c.ink) +
    smile(55, 10) +
    group(`${id}-paw`, ellipse(4, -9, 20, 10, "#a491bd"))
  );
}
function hedgehog(id) {
  return (
    p(
      "M-58 22L-66 4L-55-6L-59-23L-41-26L-36-45L-19-39L-6-54L7-42L26-47L32-30L49-25L44-8L56 6L42 26Z",
      "#77618f",
    ) +
    ellipse(-7, 15, 48, 27, c.peach) +
    p("M20-8Q44-11 66 13Q64 31 38 34L17 28Z", c.cream) +
    circle(64, 15, 4, c.ink) +
    circle(39, 8, 3, c.ink) +
    ellipse(-28, 39, 13, 7, c.peach) +
    ellipse(23, 39, 13, 7, c.peach) +
    line("M-39-12l5 8m13-22 5 7m11-21 5 7m13 1 5 7", "#b49cc3", 3)
  );
}
function whale(id, color = c.lilac) {
  return (
    group(
      `${id}-tail`,
      p(
        "M-68-3Q-106-47-127-30Q-126-9-100 1Q-126 12-116 33Q-85 27-67 6Z",
        color,
      ),
    ) +
    ellipse(0, 3, 82, 45, color) +
    p("M-67 17Q9 62 76 10Q69 47 9 49Q-45 48-67 17", c.cream) +
    group(`${id}-fin`, p("M-11 9Q-24 62 16 53Q32 34 16 11Z", "#8b75b3")) +
    circle(53, -2, 4, c.ink) +
    smile(61, 12)
  );
}
function deer(id) {
  return (
    group(`${id}-leg-a`, p("M-36 12h12v66h-12Z", c.peach)) +
    group(`${id}-leg-b`, p("M16 12h12v66H16Z", c.peach)) +
    ellipse(-4, 3, 53, 29, c.peach) +
    p("M15 0L30-57L49-58L45 18Z", c.peach) +
    ellipse(45, -56, 29, 21, c.peach) +
    ellipse(27, -80, 10, 22, c.peach, 'transform="rotate(-35 27 -80)"') +
    ellipse(58, -80, 10, 22, c.peach, 'transform="rotate(30 58 -80)"') +
    ellipse(63, -50, 17, 13, c.cream) +
    circle(75, -53, 4, c.ink) +
    circle(47, -60, 3, c.ink) +
    circle(-23, -4, 4, c.cream) +
    circle(-5, -10, 4, c.cream) +
    circle(8, 3, 4, c.cream) +
    p("M-52-5L-75-20L-64 6Z", c.cream)
  );
}
function penguin(id) {
  return (
    group(
      `${id}-wing`,
      ellipse(-35, 6, 13, 35, "#777092", 'transform="rotate(25 -35 6)"'),
    ) +
    ellipse(0, 0, 38, 57, "#777092") +
    ellipse(4, 12, 27, 39, c.cream) +
    circle(0, -35, 30, "#777092") +
    ellipse(2, -27, 24, 20, c.cream) +
    eyes(-8, -31, 19) +
    p("M-3-23H13L5-12Z", c.peach) +
    ellipse(-17, 57, 16, 7, c.peach) +
    ellipse(19, 57, 16, 7, c.peach) +
    p("M-34-8Q4 3 35-7L34 7Q-1 17-37 6Z", c.violet) +
    p("M20 2L43 33L28 39L10 9Z", c.violet)
  );
}

const stories = [
  {
    id: "fox-firefly",
    title: "Fox & the firefly",
    description:
      "A curious fox follows a little light through the moonlit woods.",
    body: (id) =>
      sky(id) +
      ellipse(355, 333, 91, 11, "#211f2f") +
      group(`${id}-animal`, fox(id), 300, 271) +
      group(
        `${id}-light`,
        circle(0, 0, 13, "#514563") +
          circle(0, 0, 5, "#e8d6a3") +
          ellipse(-7, -6, 7, 3, c.cream) +
          ellipse(7, -6, 7, 3, c.cream),
        467,
        213,
      ),
    motion: (id, t) => `
    tl.to('#${id}-light',{x:76,y:-46,duration:2,ease:'sine.inOut'},${t});
    tl.to('#${id}-animal',{x:94,duration:2.7,ease:'power1.inOut'},${t + 0.8});
    tl.to('#${id}-leg-a',{rotation:16,transformOrigin:'50% 0%',duration:.22,yoyo:true,repeat:9},${t + 0.8});
    tl.to('#${id}-leg-b',{rotation:-16,transformOrigin:'50% 0%',duration:.22,yoyo:true,repeat:9},${t + 0.8});
    tl.to('#${id}-light',{x:-34,y:-7,duration:2.3,ease:'sine.inOut'},${t + 2});
    tl.to('#${id}-head',{rotation:-16,transformOrigin:'50% 80%',duration:.7,yoyo:true,repeat:1},${t + 4.1});
    tl.to('#${id}-animal',{y:-45,duration:.45,ease:'power2.out',yoyo:true,repeat:1},${t + 5.5});
    tl.to('#${id}-light',{x:23,y:-58,duration:2,ease:'sine.inOut'},${t + 5.4});
    tl.to('#${id}-tail',{rotation:12,transformOrigin:'90% 60%',duration:.8,yoyo:true,repeat:10},${t});
    tl.to('#${id}-light',{x:0,y:0,duration:2.5,ease:'sine.inOut'},${t + 7.5});
    tl.to('#${id}-animal',{x:0,duration:2.3,ease:'sine.inOut'},${t + 7.7});`,
  },
  {
    id: "owl-moon",
    title: "Owl's moonlit flight",
    description: "A little owl leaves its branch for a moonlit adventure.",
    body: (id) =>
      sky(id) +
      line("M110 301Q275 283 386 295", "#716080", 12) +
      line("M185 296l-27-20", "#716080", 7) +
      group(`${id}-animal`, owl(id), 260, 226),
    motion: (id, t) => `
    tl.to('#${id}-animal',{y:-9,duration:.5,yoyo:true,repeat:3},${t});
    tl.to('#${id}-animal',{x:265,y:-70,duration:3,ease:'power2.inOut'},${t + 2});
    tl.to('#${id}-wing-a',{rotation:75,transformOrigin:'80% 10%',duration:.22,yoyo:true,repeat:22},${t + 2});
    tl.to('#${id}-wing-b',{rotation:-75,transformOrigin:'20% 10%',duration:.22,yoyo:true,repeat:22},${t + 2});
    tl.to('#${id}-animal',{x:310,y:-90,duration:1.7,ease:'sine.inOut'},${t + 5});
    tl.to('#${id}-animal',{x:0,y:0,duration:3.3,ease:'power2.inOut'},${t + 6.7});`,
  },
  {
    id: "rabbit-carrot",
    title: "A very lucky rabbit",
    description: "One determined rabbit finds the perfect midnight snack.",
    body: (id) =>
      sky(id) +
      ellipse(439, 334, 31, 8, "#171722") +
      group(
        `${id}-carrot`,
        p("M-12 0H12L0 52Z", c.peach) +
          line("M0 0l-14-21M0 0v-27M0 0l15-19", c.teal, 6),
        439,
        314,
      ) +
      group(`${id}-animal`, rabbit(id), 307, 280),
    motion: (id, t) => `
    tl.to('#${id}-animal',{x:67,duration:1.2,ease:'sine.inOut'},${t + 0.7});
    tl.to('#${id}-animal',{y:-30,duration:.3,yoyo:true,repeat:3,ease:'power1.out'},${t + 0.7});
    tl.to('#${id}-ear-a',{rotation:-20,transformOrigin:'50% 100%',duration:.7,yoyo:true,repeat:1},${t + 2});
    tl.to('#${id}-animal',{rotation:12,transformOrigin:'50% 100%',duration:.8},${t + 3});
    tl.to('#${id}-carrot',{y:-68,rotation:-20,duration:1.2,ease:'back.out(1.6)'},${t + 3.5});
    tl.to('#${id}-animal',{rotation:0,y:-24,duration:.4,ease:'power2.out',yoyo:true,repeat:1},${t + 4.5});
    tl.to('#${id}-ear-b',{rotation:15,transformOrigin:'50% 100%',duration:.6,yoyo:true,repeat:3},${t + 5.5});
    tl.to('#${id}-carrot',{y:0,rotation:0,duration:1.6,ease:'sine.inOut'},${t + 8.4});
    tl.to('#${id}-animal',{x:0,duration:1.6,ease:'sine.inOut'},${t + 8.4});`,
  },
  {
    id: "turtle-tide",
    title: "Together to the tide",
    description: "A turtle leads a tiny hatchling toward the gentle sea.",
    body: (id) =>
      sky(id, true) +
      p("M0 330Q220 275 465 343L530 432H0Z", "#6a5b72") +
      group(`${id}-animal`, turtle(id), 275, 310) +
      `<g transform="translate(148 338) scale(.45)"><g id="${id}-baby">${turtle(`${id}-baby`)}</g></g>` +
      group(
        `${id}-wave`,
        line("M510 340q80-18 160 0", "#8d85aa", 3) +
          line("M550 362q50-10 105 0", "#8d85aa", 2),
      ),
    motion: (id, t) => `
    tl.to('#${id}-animal',{x:240,y:25,duration:6,ease:'sine.inOut'},${t + 0.5});
    tl.to('#${id}-baby',{x:520,y:42,duration:6.4,ease:'sine.inOut'},${t + 1});
    tl.to('#${id}-flipper',{rotation:24,transformOrigin:'80% 40%',duration:.5,yoyo:true,repeat:12},${t});
    tl.to('#${id}-baby-flipper',{rotation:28,transformOrigin:'80% 40%',duration:.4,yoyo:true,repeat:16},${t});
    tl.to('#${id}-wave',{x:-20,y:4,duration:1.2,yoyo:true,repeat:7,ease:'sine.inOut'},${t});
    tl.to('#${id}-animal',{x:0,y:0,duration:2.5,ease:'sine.inOut'},${t + 7.5});
    tl.to('#${id}-baby',{x:0,y:0,duration:2.5,ease:'sine.inOut'},${t + 7.5});`,
  },
  {
    id: "otter-shell",
    title: "Otter's little treasure",
    description: "A floating otter discovers a tiny shell worth keeping.",
    body: (id) =>
      sky(id, true) +
      group(
        `${id}-ripple`,
        ellipse(375, 324, 132, 15, "#45405e") +
          line("M240 327q135 30 270 0", "#655777", 2),
      ) +
      group(`${id}-animal`, otter(id), 365, 297) +
      group(
        `${id}-shell`,
        p("M-18 0Q-23-33-8-25Q0-42 8-25Q25-33 18 0Z", c.peach) +
          line("M0-27V0M-11-18L-5 0M11-18L5 0", "#ad7c86", 2),
        366,
        276,
      ),
    motion: (id, t) => `
    tl.to('#${id}-animal',{y:-8,rotation:3,transformOrigin:'50% 50%',duration:1.25,yoyo:true,repeat:7,ease:'sine.inOut'},${t});
    tl.to('#${id}-shell',{y:-9,duration:1.25,yoyo:true,repeat:7,ease:'sine.inOut'},${t});
    tl.to('#${id}-paw',{rotation:-28,transformOrigin:'80% 50%',duration:1.2,yoyo:true,repeat:1},${t + 2});
    tl.to('#${id}-shell',{rotation:360,transformOrigin:'50% 60%',duration:2,ease:'power2.inOut'},${t + 4});
    tl.to('#${id}-ripple',{scaleX:1.1,transformOrigin:'50% 50%',duration:1.5,yoyo:true,repeat:5,ease:'sine.inOut'},${t});
    tl.to('#${id}-tail',{rotation:-8,transformOrigin:'100% 50%',duration:.9,yoyo:true,repeat:9},${t});`,
  },
  {
    id: "hedgehog-rain",
    title: "A leaf for a rainy day",
    description: "A resourceful hedgehog turns a fallen leaf into an umbrella.",
    body: (id) =>
      sky(id) +
      group(`${id}-animal`, hedgehog(id), 360, 293) +
      group(`${id}-leaf`, leaf(0, 0, 1.1, c.teal), 428, 257) +
      Array.from({ length: 15 }, (_, i) =>
        group(
          `${id}-rain-${i}`,
          line("M0 0l-5 15", "#807598", 2),
          100 + i * 42,
          40 + ((i * 41) % 170),
        ),
      ).join(""),
    motion: (id, t) => `
    tl.to('#${id}-leaf',{x:-70,y:-42,rotation:-23,transformOrigin:'50% 100%',duration:2,ease:'power2.inOut'},${t + 0.5});
    tl.to('#${id}-animal',{x:-27,duration:1.5,ease:'sine.inOut'},${t + 1});
    tl.to('#${id}-leaf',{rotation:-17,duration:1,yoyo:true,repeat:5,ease:'sine.inOut'},${t + 2.5});
    ${Array.from({ length: 15 }, (_, i) => `tl.fromTo('#${id}-rain-${i}',{y:0,opacity:0},{y:130,opacity:.8,duration:.8,repeat:10,ease:'none'},${t + (i % 5) * 0.15});`).join("")}
    tl.to('#${id}-leaf',{x:0,y:0,rotation:0,duration:1.5,ease:'sine.inOut'},${t + 8.5});
    tl.to('#${id}-animal',{x:0,duration:1.5,ease:'sine.inOut'},${t + 8.5});`,
  },
  {
    id: "whale-bubbles",
    title: "A whale of a little tale",
    description:
      "A whale and its calf send a trail of bubbles toward the stars.",
    body: (id) =>
      sky(id, true) +
      group(`${id}-animal`, whale(id), 420, 270) +
      `<g transform="translate(213 329) scale(.48)"><g id="${id}-baby">${whale(`${id}-baby`, c.teal)}</g></g>` +
      Array.from({ length: 6 }, (_, i) =>
        group(
          `${id}-bubble-${i}`,
          circle(
            0,
            0,
            5 + i * 2,
            "none",
            `stroke="${c.lilac}" stroke-width="2"`,
          ),
          460 + (i % 3) * 24,
          221,
        ),
      ).join(""),
    motion: (id, t) => `
    tl.to('#${id}-animal',{y:-17,x:25,duration:2,yoyo:true,repeat:4,ease:'sine.inOut'},${t});
    tl.to('#${id}-baby',{y:-32,x:35,duration:1.6,yoyo:true,repeat:5,ease:'sine.inOut'},${t});
    tl.to('#${id}-tail',{rotation:15,transformOrigin:'100% 50%',duration:1,yoyo:true,repeat:9,ease:'sine.inOut'},${t});
    tl.to('#${id}-fin',{rotation:-20,transformOrigin:'50% 0%',duration:1.2,yoyo:true,repeat:7},${t});
    ${Array.from({ length: 6 }, (_, i) => `tl.fromTo('#${id}-bubble-${i}',{y:0,opacity:0,scale:.4},{y:-120,opacity:.7,scale:1.3,duration:2,repeat:3,ease:'sine.out'},${t + i * 0.3});`).join("")}`,
  },
  {
    id: "deer-butterfly",
    title: "An unexpected friend",
    description: "A shy deer pauses to greet a wandering butterfly.",
    body: (id) =>
      sky(id) +
      group(`${id}-animal`, deer(id), 340, 263) +
      group(
        `${id}-butterfly`,
        group(`${id}-wing-a`, ellipse(-8, 0, 9, 14, c.peach)) +
          group(`${id}-wing-b`, ellipse(8, 0, 9, 14, c.lilac)) +
          ellipse(0, 1, 2, 10, c.ink),
        514,
        196,
      ) +
      leaf(217, 354, 0.4, c.teal) +
      leaf(547, 355, 0.45, c.teal),
    motion: (id, t) => `
    tl.to('#${id}-butterfly',{x:-79,y:-48,duration:2,ease:'sine.inOut'},${t});
    tl.to('#${id}-butterfly',{x:-133,y:14,duration:2.5,ease:'sine.inOut'},${t + 2});
    tl.to('#${id}-wing-a',{scaleX:.2,transformOrigin:'100% 50%',duration:.17,yoyo:true,repeat:56},${t});
    tl.to('#${id}-wing-b',{scaleX:.2,transformOrigin:'0% 50%',duration:.17,yoyo:true,repeat:56},${t});
    tl.to('#${id}-animal',{rotation:-6,transformOrigin:'50% 100%',duration:1.2,yoyo:true,repeat:1},${t + 4});
    tl.to('#${id}-butterfly',{x:-53,y:-38,duration:2,ease:'sine.inOut'},${t + 5});
    tl.to('#${id}-butterfly',{x:0,y:0,duration:3,ease:'sine.inOut'},${t + 7});`,
  },
  {
    id: "penguin-friends",
    title: "Slide into a friendship",
    description: "A little penguin slides across the ice to meet a friend.",
    body: (id) =>
      sky(id, false, true) +
      ellipse(402, 347, 186, 16, "#8d83a3") +
      group(`${id}-animal`, penguin(id), 238, 280) +
      group(`${id}-friend`, penguin(`${id}-friend`), 513, 280) +
      spark(380, 205, c.cream),
    motion: (id, t) => `
    tl.to('#${id}-animal',{rotation:18,transformOrigin:'50% 100%',duration:.7,ease:'power1.inOut'},${t + 0.3});
    tl.to('#${id}-animal',{x:182,duration:2.8,ease:'power2.inOut'},${t + 1});
    tl.to('#${id}-animal',{rotation:0,duration:.6,ease:'back.out(2)'},${t + 3.8});
    tl.to('#${id}-friend-wing',{rotation:-80,transformOrigin:'60% 0%',duration:.45,yoyo:true,repeat:5},${t + 3});
    tl.to('#${id}-animal',{y:-18,duration:.3,yoyo:true,repeat:3},${t + 5.2});
    tl.to('#${id}-friend',{y:-18,duration:.3,yoyo:true,repeat:3},${t + 5.4});
    tl.to('#${id}-animal',{x:0,duration:2.5,ease:'sine.inOut'},${t + 7.5});`,
  },
];

const scenes = stories
  .map(
    (s, i) =>
      `<section id="scene-${s.id}" class="clip" data-start="${i * 10}" data-duration="10" data-track-index="0"><svg viewBox="0 0 768 432" xmlns="http://www.w3.org/2000/svg" aria-label="${s.description}">${s.body(s.id)}</svg></section>`,
  )
  .join("\n");
const motion = stories
  .map(
    (s, i) =>
      s.motion(s.id, i * 10) +
      `\ntl.to('#${s.id}-twinkle',{opacity:.25,duration:1.25,yoyo:true,repeat:7,ease:'sine.inOut'},${i * 10});`,
  )
  .join("\n");
await writeFile(
  path.join(project, "index.html"),
  `<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Flux — little wildlife stories</title><script src="assets/gsap.min.js"></script><style>*{box-sizing:border-box}html,body{margin:0;width:768px;height:432px;overflow:hidden;background:${c.sky}}#root{position:relative;width:100%;height:100%;overflow:hidden}.clip{position:absolute;inset:0}.clip svg{display:block;width:100%;height:100%}</style></head><body><div id="root" data-composition-id="wildlife" data-width="768" data-height="432" data-duration="90">${scenes}</div><script>const tl=gsap.timeline({paused:true});${motion}\nwindow.__timelines['wildlife']=tl;</script></body></html>`,
);
await writeFile(
  path.join(project, "stories.json"),
  JSON.stringify(
    stories.map(({ id, title, description }, i) => ({
      id,
      title,
      description,
      start: i * 10,
      duration: 10,
    })),
    null,
    2,
  ) + "\n",
);
for (const s of stories) {
  await writeFile(
    path.join(out, `${s.id}.svg`),
    `<svg viewBox="0 0 768 432" xmlns="http://www.w3.org/2000/svg">${s.body(s.id)}</svg>`,
  );
}
console.log(
  `Built ${stories.length} original wildlife scenes and poster illustrations.`,
);
