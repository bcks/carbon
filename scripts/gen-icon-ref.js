#!/usr/bin/env node
"use strict";

/**
 * Generates ICONS.md — a human-readable reference table of icon names and
 * Unicode codepoints — from src/embeddedjs/assets/icons.icomoon.json.
 *
 * Run via: npm run gen-icon-ref
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

const { readFileSync, writeFileSync } = require("fs");
const { join } = require("path");

const ROOT = join(__dirname, "..");
const SRC  = join(ROOT, "src/embeddedjs/assets/icons.icomoon.json");
const OUT  = join(ROOT, "ICONS.md");

const { glyphs } = JSON.parse(readFileSync(SRC, "utf8"));

const rows = glyphs
	.map(g => {
		const name = g.extras.name;
		const hex  = g.extras.codePoint.toString(16).toUpperCase().padStart(4, "0");
		return `| \`${name}\` | \`U+${hex}\` | \`\\u${hex}\` |`;
	})
	.join("\n");

const output = `\
# Icon Reference

Generated from \`src/embeddedjs/assets/icons.icomoon.json\` — do not edit by hand.
Run \`npm run gen-icon-ref\` to regenerate after updating the icon set.

| Name | Codepoint | String literal |
|---|---|---|
${rows}
`;

writeFileSync(OUT, output, "utf8");
console.log(`Generated ${glyphs.length} icons → ICONS.md`);
