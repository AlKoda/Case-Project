#!/usr/bin/env node
/**
 * End-to-end play tests.
 *
 *     npm install playwright        # once; the game itself needs nothing
 *     node tools/playtest.mjs       # run every scenario
 *     node tools/playtest.mjs board undo
 *
 * `tools/check_project.py` checks that the build is coherent. This checks that
 * it is playable: that a night can actually be played from the title screen to
 * a verdict, that the wall pins and ties and undoes, and that none of it throws.
 *
 * Playwright is a development dependency and is deliberately not required by
 * anything else — the game is still a static site with no build step and no
 * runtime dependencies. If Playwright is missing this exits cleanly and says so,
 * so it is safe to wire into a hook that may run on a machine without it.
 *
 * Each scenario gets a fresh page and a seeded save, so they can run in any
 * order and a failure in one cannot cascade into the next.
 */

import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** A save with the scene of the crime already searched. */
const seeded = (over = {}) => ({
  version: 5,
  startedAt: Date.now(),
  scene: null,
  line: 0,
  exhibits: ["pocket-watch", "stair-bulb", "shawl-bead", "umbrella", "ledger", "switchboard-log"],
  proven: [],
  flags: {},
  completed: ["scene:stairs"],
  backlog: [],
  accusation: null,
  board: { pins: {}, strings: [], notes: {}, nextNote: 1 },
  ...over,
});

/* ------------------------------------------------------------ harness */

let failures = 0;
let checks = 0;

function check(label, pass, detail = "") {
  checks += 1;
  if (!pass) failures += 1;
  const mark = pass ? "  ok  " : "  FAIL";
  console.log(`${mark} ${label}${detail ? `  (${detail})` : ""}`);
}

async function freePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => resolve(port));
    });
  });
}

async function serve(port) {
  const proc = spawn("python3", ["-m", "http.server", String(port)], {
    cwd: ROOT,
    stdio: "ignore",
  });
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/index.html`);
      if (response.ok) return proc;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  proc.kill();
  throw new Error("the static server did not come up");
}

/** Launch Chromium, tolerating an environment that pins its own build. */
async function launch(chromium) {
  try {
    return await chromium.launch();
  } catch (error) {
    const pinned = process.env.CHROMIUM_PATH;
    if (!pinned) throw error;
    return chromium.launch({ executablePath: pinned });
  }
}

/* ------------------------------------------------------------- helpers */

function driver(page, base) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  return {
    sleep,

    /** Load the game with a seeded save and resume into it. */
    async resume(save = seeded()) {
      await page.goto(base, { waitUntil: "networkidle" });
      await page.evaluate((s) => localStorage.setItem("case-board/al-manar", JSON.stringify(s)), save);
      await page.reload({ waitUntil: "networkidle" });
      await sleep(400);
      await page.locator(".btn", { hasText: "Resume" }).click();
      await sleep(900);
      // Most legacy scenarios exercise the evidence wall. It now lives one
      // step beyond the field map, so enter it explicitly.
      await page.locator(".field-nav__item", { hasText: "Case board" }).click();
      await sleep(500);
    },

    /** Click through dialogue until `selector` appears, or the scene ends. */
    async until(selector, limit = 90) {
      for (let i = 0; i < limit; i += 1) {
        if (await page.locator(selector).count()) return true;
        if (selector === ".wall" && await page.locator(".map-screen").count()) {
          await page.locator(".field-nav__item", { hasText: "Case board" }).click();
          await sleep(400);
          continue;
        }
        if (!(await page.locator(".vn").count())) return false;
        await page.locator(".vn").click({ position: { x: 800, y: 250 } }).catch(() => {});
        await sleep(150);
      }
      return false;
    },

    async choose(text) {
      const option = page.locator(".vn__choice", { hasText: text }).first();
      if (!(await option.count())) return false;
      await option.click();
      await sleep(300);
      return true;
    },

    /** Open a person's interview from their card on the wall. */
    async question(name) {
      await page.locator(".chip", { hasText: name }).first().click();
      await page.locator(".tray__back").waitFor({ timeout: 8000 });
      await page.locator(".tray .btn", { hasText: "Question" }).first().click();
      await sleep(1000);
    },

    save: () => page.evaluate(() => JSON.parse(localStorage.getItem("case-board/al-manar"))),
  };
}

/* ----------------------------------------------------------- scenarios */

const scenarios = {
  /** The field hub exposes every room and its occupants without hiding tools. */
  async map(page, base) {
    const d = driver(page, base);
    await page.goto(base, { waitUntil: "networkidle" });
    await page.evaluate((s) => localStorage.setItem("case-board/al-manar", JSON.stringify(s)), seeded());
    await page.reload({ waitUntil: "networkidle" });
    await d.sleep(400);
    await page.locator(".btn", { hasText: "Resume" }).click();
    await d.sleep(700);

    check("the field map shows all destinations", (await page.locator(".map-pin").count()) === 6);
    await page.locator(".map-pin", { hasText: "Room 312" }).click();
    check("selecting a room reveals its witness", await page.locator(".location-person", { hasText: "Sharif" }).count() === 1);
    check("field tools stay available", (await page.locator(".field-nav__item").count()) === 4);
  },

  /** Title to verdict, the whole night, taking every exhibit on the way. */
  async playthrough(page, base) {
    const d = driver(page, base);
    await page.goto(base, { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });
    await d.sleep(500);

    check("title screen names the case", (await page.locator(".title__name").textContent()) === "Al-Manar");
    await page.locator(".btn--major").click();
    await d.sleep(700);

    await d.until(".vn__choices.is-open");
    for (const want of ["pockets", "so dark", "stair rail", "lobby cupboard"]) {
      if (await d.choose(want)) await d.until(".vn__choices.is-open");
    }
    await d.choose("Enough");
    await d.sleep(400);
    await d.until(".wall", 20);
    await d.sleep(800);

    const state = await d.save();
    check("all four scene exhibits collected", state.exhibits.length === 4, state.exhibits.join(", "));
    check("the wall is reachable", (await page.locator(".wall").count()) === 1);

    await d.question("Dr. Ayman Sharif");
    await d.until(".vn__choices.is-open");
    check("the interview opens on the right person",
      (await page.locator(".vn__name").textContent()) === "Dr. Ayman Sharif");

    await d.choose("finding him");
    await d.until(".vn__choices.is-open");
    await d.choose("two-fourteen");
    await d.until(".vn__tray.is-open");
    await page.locator(".vn__exhibit", { hasText: "watch" }).first().click();
    await d.sleep(500);
    await d.until(".vn__choices.is-open");
    check("pressing with the watch breaks his time of death",
      (await d.save()).proven.includes("sharif-time-of-death"));

    await d.choose("leave it there");
    await d.sleep(400);
    await d.until(".wall", 20);
    await page.locator(".btn", { hasText: "Name a suspect" }).click();
    await d.sleep(600);
    check("three suspects can be named", (await page.locator(".accuse__card").count()) === 3);

    await page.locator(".accuse__card", { hasText: "Sharif" }).click();
    await d.sleep(800);
    check("naming the killer charges him",
      (await page.locator(".verdict__stamp").textContent()).includes("Charged"));
  },

  /** Pin, place on the timeline, tie a string. */
  async board(page, base) {
    const d = driver(page, base);
    await d.resume();

    check("the tray offers everything found so far", (await page.locator(".chip").count()) >= 13);
    check("the timeline is drawn", (await page.locator(".band__tick").count()) === 7);

    const chip = await page.locator(".chip").first().boundingBox();
    const wall = await page.locator(".wall").boundingBox();
    await page.mouse.move(chip.x + chip.width / 2, chip.y + chip.height / 2);
    await page.mouse.down();
    await page.mouse.move(wall.x + wall.width * 0.3, wall.y + wall.height * 0.3, { steps: 20 });
    await page.mouse.up();
    await d.sleep(400);
    check("dragging from the tray pins a card", (await page.locator(".pin").count()) === 1);

    const next = await page.locator(".chip").first().boundingBox();
    await page.mouse.move(next.x + next.width / 2, next.y + next.height / 2);
    await page.mouse.down();
    await page.mouse.move(wall.x + wall.width * 0.55, wall.y + wall.height * 0.9, { steps: 20 });
    await page.mouse.up();
    await d.sleep(400);
    check("dropping on the timeline gives the card a time",
      (await page.locator(".pin.is-timed").count()) === 1,
      await page.locator(".pin__clock").first().textContent());

    for (let i = 0; i < 3; i += 1) {
      await page.locator(".chip__pin").first().click();
      await d.sleep(180);
    }
    check("the keyboard path pins without a drag", (await page.locator(".pin").count()) === 5);

    await page.locator(".pin").first().click();
    await d.sleep(300);
    await page.locator(".tray .btn", { hasText: "Run string" }).click();
    await d.sleep(200);
    await page.locator(".pin").nth(2).click();
    await d.sleep(400);
    check("a string can be tied between two cards", (await page.locator("path.string").count()) === 1);

    const pins = await page.evaluate(() => {
      const w = document.querySelector(".wall").getBoundingClientRect();
      return [...document.querySelectorAll(".pin")].filter((n) => {
        const r = n.getBoundingClientRect();
        return r.left < w.left - 2 || r.right > w.right + 2 || r.top < w.top - 2 || r.bottom > w.bottom + 2;
      }).length;
    });
    check("no card hangs off the cork", pins === 0, `${pins} spilling`);
  },

  /** Every change to the wall can be taken back. */
  async undo(page, base) {
    const d = driver(page, base);
    await d.resume();
    const undoBtn = page.locator("button.btn--small", { hasText: "Undo" }).first();

    check("undo starts disabled", await undoBtn.isDisabled());
    for (let i = 0; i < 4; i += 1) {
      await page.locator(".chip__pin").first().click();
      await d.sleep(180);
    }
    check("four cards pinned", (await page.locator(".pin").count()) === 4);

    await undoBtn.click();
    await d.sleep(300);
    check("undo takes back a pin", (await page.locator(".pin").count()) === 3);

    await page.locator("button.btn--small", { hasText: "Clear wall" }).click();
    await d.sleep(300);
    check("clearing empties the wall", (await page.locator(".pin").count()) === 0);
    await undoBtn.click();
    await d.sleep(300);
    check("undo restores a cleared wall", (await page.locator(".pin").count()) === 3);

    await page.keyboard.press("Control+z");
    await d.sleep(300);
    check("ctrl+z works too", (await page.locator(".pin").count()) === 2);

    for (let i = 0; i < 14; i += 1) {
      if (await undoBtn.isDisabled()) break;
      await undoBtn.click();
      await d.sleep(100);
    }
    check("running out of history disables undo rather than throwing", await undoBtn.isDisabled());
  },

  /** Leaving the stairs early must not strand an exhibit. */
  async stairs(page, base) {
    const d = driver(page, base);
    await d.resume(seeded({ exhibits: ["pocket-watch"] }));
    const back = page.locator("button", { hasText: "Back to the stairs" });
    check("the wall notices an unexamined scene", (await back.count()) === 1);

    await back.click();
    await d.sleep(1100);
    await d.until(".vn__choices.is-open");
    const options = await page.$$eval(".vn__choice-text", (ns) => ns.map((n) => n.textContent));
    check("returning offers exactly what was missed", options.length === 4, options.length + " choices");

    await d.resume();
    check("and says nothing once the scene is exhausted",
      (await page.locator("button", { hasText: "Back to the stairs" }).count()) === 0);
  },

  /** The accusation reports how strong the file actually is. */
  async accusation(page, base) {
    const d = driver(page, base);

    const open = async (proven) => {
      await d.resume(seeded({ proven }));
      await page.locator(".btn", { hasText: "Name a suspect" }).click();
      await d.sleep(600);
      return page.locator(".accuse__gauge").textContent();
    };

    check("naming on nothing is called a guess", (await open([])).includes("guess"));
    check("a thin file says so", (await open(["lawati-stairs"])).includes("stands up"));
    const full = await open(["sharif-saw-blood", "sharif-slept-through", "sharif-time-of-death"]);
    check("three broken statements read as a case", full.includes("That is a case"));

    const proofs = await page.$$eval(".accuse__proof", (ns) => ns.map((n) => n.textContent));
    check("proof is counted per suspect", proofs.some((p) => p.startsWith("3 broken")), proofs.join(" / "));
  },

  /** Witnesses are questioned like anyone else, and cannot be accused. */
  async witness(page, base) {
    const d = driver(page, base);
    await d.resume();
    check("all seven people can be questioned",
      (await page.locator(".chip--witness, .chip--suspect").count()) === 7);

    await d.question("Majid Al-Kindi");
    await d.until(".vn__choices.is-open");
    await d.choose("brought you down");
    await d.until(".vn__choices.is-open");
    await d.choose("What did you find");
    await d.until(".vn__choices.is-open");
    await d.choose("light on these stairs");
    await d.until(".vn__tray.is-open");
    check("a witness can be pressed with an exhibit", (await page.locator(".vn__exhibit").count()) === 6);

    await page.locator(".vn__exhibit", { hasText: "Bulb" }).first().click();
    await d.sleep(500);
    await d.until(".vn__choices.is-open");
    const flags = (await d.save()).flags;
    check("pressing a witness opens a better answer", Boolean(flags.bulbWasTurned));
    check("but proves no contradiction against them", (await d.save()).proven.length === 0);
  },

  /** Questioned people are marked, and pinned cards describe themselves. */
  async marking(page, base) {
    const d = driver(page, base);
    await d.resume();
    check("nobody is marked before any interview", (await page.locator(".chip.is-done").count()) === 0);

    await d.question("Badriya Al-Hinai");
    await d.until(".vn__choices.is-open");
    await d.choose("Thank you");
    await d.sleep(500);
    await d.until(".wall", 25);
    await d.sleep(700);
    check("the person you questioned is marked", (await page.locator(".chip.is-done").count()) === 1);

    await page.locator(".chip__pin").first().click();
    await d.sleep(250);
    await page.locator(".chip__pin").first().click();
    await d.sleep(250);
    const label = await page.locator(".pin").first().getAttribute("aria-label");
    check("a pinned card describes itself", Boolean(label && label.length > 10), label);

    await page.locator(".pin").first().click();
    await d.sleep(250);
    await page.locator(".tray .btn", { hasText: "Run string" }).click();
    await d.sleep(200);
    await page.locator(".pin").nth(1).click();
    await d.sleep(400);
    const tied = await page.locator(".pin").first().getAttribute("aria-label");
    check("and says what it is tied to", /Tied to/.test(tied || ""), tied);
  },

  /** The log holds everything said, and the keyboard drives the stage. */
  async log(page, base) {
    const d = driver(page, base);
    await d.resume();
    await d.question("Badriya Al-Hinai");
    await d.until(".vn__choices.is-open");

    const before = await page.locator(".vn__backlog-line").count();
    check("lines are recorded as they are spoken", before > 0, `${before} lines`);

    await page.locator(".vn__chip", { hasText: "Log" }).click();
    await d.sleep(350);
    check("the log opens", await page.locator(".vn__backlog.is-open").isVisible());
    const named = await page.locator(".vn__backlog-line b").first().textContent();
    check("the log attributes lines to a speaker", Boolean(named), named);

    await page.keyboard.press("Escape");
    await d.sleep(300);
    check("escape closes it", (await page.locator(".vn__backlog.is-open").count()) === 0);

    // Space should advance dialogue exactly like a click.
    await d.choose("through your night");
    await d.sleep(600);
    const seen = await page.locator(".vn__backlog-line").count();
    await page.keyboard.press("Space");
    await d.sleep(500);
    await page.keyboard.press("Space");
    await d.sleep(600);
    check("space advances the scene", (await page.locator(".vn__backlog-line").count()) > seen);
  },

  /** The wall stays usable when the screen does not. */
  async responsive(page, base, browser) {
    const d = driver(page, base);
    const sizes = [["desktop", 1440, 900], ["tablet", 900, 1000], ["phone", 420, 860]];
    const save = seeded({
      board: {
        pins: {
          "ex:pocket-watch": { x: 0.32, y: 0.3, at: null },
          "ex:stair-bulb": { x: 0.55, y: 0.42, at: null },
          "who:sharif": { x: 0.7, y: 0.28, at: null },
          "ex:umbrella": { x: 0.62, y: 0.675, at: 120 },
        },
        strings: [{ a: "ex:pocket-watch", b: "who:sharif" }],
        notes: {},
        nextNote: 1,
      },
    });

    for (const [label, width, height] of sizes) {
      const sized = await browser.newPage({ viewport: { width, height } });
      const sd = driver(sized, base);
      await sd.resume(save);
      const spill = await sized.evaluate(() => {
        const w = document.querySelector(".wall").getBoundingClientRect();
        return [...document.querySelectorAll(".pin")].filter((n) => {
          const r = n.getBoundingClientRect();
          return r.left < w.left - 2 || r.right > w.right + 2 || r.top < w.top - 2 || r.bottom > w.bottom + 2;
        }).length;
      });
      const overflows = await sized.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      check(`${label}: cards stay on the cork`, spill === 0, `${spill} spilling`);
      check(`${label}: the page does not scroll sideways`, !overflows);
      await sized.close();
    }
    void d;
  },
};

/* ---------------------------------------------------------------- main */

async function main() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.log("Playwright is not installed, so the play tests were skipped.");
    console.log("  npm install playwright");
    return;
  }

  const wanted = process.argv.slice(2);
  const names = wanted.length ? wanted : Object.keys(scenarios);
  const unknown = names.filter((name) => !scenarios[name]);
  if (unknown.length) {
    console.error(`Unknown scenario(s): ${unknown.join(", ")}`);
    console.error(`Available: ${Object.keys(scenarios).join(", ")}`);
    process.exit(1);
  }

  const port = await freePort();
  const server = await serve(port);
  const base = `http://127.0.0.1:${port}/`;
  const browser = await launch(chromium);

  try {
    for (const name of names) {
      console.log(`\n${name}`);
      const page = await browser.newPage({ viewport: { width: 1500, height: 940 } });
      const thrown = [];
      page.on("pageerror", (error) => thrown.push(error.message));
      page.on("console", (message) => {
        // Manifest probing deliberately requests files that may not exist.
        if (message.type() === "error" && !/404|Failed to load resource/.test(message.text())) {
          thrown.push(message.text());
        }
      });
      try {
        await scenarios[name](page, base, browser);
      } catch (error) {
        check(`${name} ran to completion`, false, String(error.message).split("\n")[0]);
      }
      check("nothing threw", thrown.length === 0, thrown.slice(0, 2).join(" | "));
      await page.close();
    }
  } finally {
    await browser.close();
    server.kill();
  }

  console.log(`\n${checks - failures}/${checks} checks passed`);
  if (failures) process.exit(1);
}

main();
