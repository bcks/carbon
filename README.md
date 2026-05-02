# Carbon [WORK IN PROGRESS]

A feature-rich, highly configurable Pebble watchface for **Pebble Time 2** and **Pebble Round 2**, built with the [Alloy](https://developer.repebble.com/guides/alloy/) JavaScript framework.

Features a 24-hour precipitation probability graph, modular widget slots, configurable date/time formats, and live weather via the free [Open-Meteo](https://open-meteo.com) API.

Inspired by [Graphite](https://github.com/stefanheule/graphite) by Stefan Heule.

---

## Development

### Prerequisites

- [Pebble SDK](https://developer.repebble.com/sdk/) (includes the `pebble` CLI tool)
- [Node.js](https://nodejs.org) (for PKJS dependencies)

### Install dependencies

```sh
npm install
```

### Build & run in emulator

There are two build modes:

| Script | Description |
|---|---|
| `npm run build` | Release build — no instrumentation logging |
| `npm run build:dev` | Development build — enables Alloy instrumentation logging via `ALLOY_INSTRUMENTATION=1` |
| `npm run build-run:emery` | Dev build + launch in Pebble Time 2 emulator with logs |
| `npm run build-run:gabbro` | Dev build + launch in Pebble Round 2 emulator with logs |

To run a release build in the emulator without rebuilding:

```sh
# Pebble Time 2 (rectangular, 200×228)
pebble install --emulator emery --logs

# Pebble Round 2 (circular, 260×260)
pebble install --emulator gabbro --logs
```

The `ALLOY_INSTRUMENTATION` flag is consumed by `wscript` (the Waf build script) and passed to the C compiler as `-DALLOY_INSTRUMENTATION=1`, which enables `kModdableCreationFlagLogInstrumentation` in `src/c/mdbl.c`. This causes the XS virtual machine to emit heap usage statistics over the Pebble log output on startup.

### Install on your device

If you want to be able to run the watchface on your device, you'll also want to log in with GitHub after installing the Pebble SDK:

```sh
pebble login
```

This will enable the `device` npm script:

```sh
npm run device
```

### Project Structure

```
scripts/           # Utility scripts (e.g. icon reference generation)
src/
  embeddedjs/      # Watch-side JavaScript (runs on device)
    assets/        # Fonts and other static resources
    modules/       # Shared non-widget modules (icons, weather, settings, etc.)
    widgets/       # Modular widget components
    main.js        # Entry point
    assets.js      # Shared asset config (fonts, skins, styles)
  pkjs/
    index.js       # Phone-side proxy + Clay settings init
    config.js      # Clay settings configuration
```

### Icons

Icons are included as a custom font generated from [IcoMoon](https://icomoon.io/). The `src/embeddedjs/assets/icons.icomoon.json` file can be imported into IcoMoon to edit the icon set. When icons are added, removed, or rearranged, the font must be re-exported from IcoMoon (with font family set to "IcoMoon"), and both the TTF and the JSON selection file must be replaced.

Move the downloaded TTF font file to `src/embeddedjs/assets/IcoMoon-Regular.ttf` (the `-Regular` suffix is important!) and the JSON selection file to `src/embeddedjs/assets/icons.icomoon.json`, then regenerate the reference table:

```sh
npm run gen-icon-ref
```

This regenerates `ICONS.md` — a human-readable lookup table of icon names and their Unicode codepoints. Consult it whenever you need to use an icon.

`src/embeddedjs/modules/icons.js` exports the `IconLabel` template — a `Label` with the icon font style pre-applied. Use the codepoint string directly on the `string` property:

```js
import { IconLabel } from "modules/icons";

// In a template:
const Widget = IconLabel.template($ => ({ string: "\uF346" })); // battery

// Or at runtime:
label.string = "\uF38E"; // battery-charging
```

Because codepoints are plain string *values* rather than property *key names*, they consume no XSA symbol table slots. I wanted to use ligature substitution to make things easier, but the font is compiled to a monochrome bitmap at build time; ligature substitution is not available on device.

### XS VM Memory (`src/c/mdbl.c`)

The XS virtual machine heap is configured in `src/c/mdbl.c` via `ModdableCreationRecord`:

| Pool | Size | Purpose |
|---|---|---|
| `slot` | 32 768 bytes (2 048 slots × 16 B) | Object property bindings, module namespaces |
| `chunk` | 16 384 bytes | Variable-size heap allocations (strings, arrays) |
| `stack` | 8 192 bytes | Call stack frames |

**Why `slot` is larger than the SDK default (8 192 bytes):** During startup the XS runtime initializes every prelinked module namespace simultaneously before any JavaScript runs. This burst requires roughly 2 048 slots even before `main.js` executes. The default 512-slot budget caused an immediate OOM crash (`Chunk allocation: failed` — misleadingly reported as a chunk error, but caused by slot exhaustion). Setting `slot = 32768` gives comfortable headroom; the emery platform has ~192 KB heap and reports ~57 KB still free after all allocations.

### Troubleshooting

#### Module specifiers must exactly match manifest keys

The Moddable/mcrun build does **not** validate import specifiers at compile time. Mismatches only surface at runtime as `SyntaxError: import default not found` (module found but no default export) or a silent failure.

**Rule:** The string in `import X from "..."` must exactly match a key in
`src/embeddedjs/manifest.json` under `modules`.

There are two ways a module can be declared:

```jsonc
// manifest.json
{
  "modules": {
    // Named key — import from "icons", NOT "modules/icons"
    "example": "./modules/example",

    // Named key with wildcard — import from "modules/clock", NOT "clock"
	"modules/*": "./modules/*",

    // Wildcard array — import specifier is the path stripped of "./" and ".js"
    // e.g. "./assets" → import from "assets"
    "*": [
      "./main",
      "./assets"
    ]
  }
}
```

When in doubt, grep the manifest for the key and make sure your import string matches it literally.

#### `fxMapArchive failed`

At runtime (not compile time) you may see:

```
fxMapArchive failed
```

This is a hard crash with no further detail. The cause is [being investigted](https://github.com/Moddable-OpenSource/moddable/discussions/1602#discussioncomment-16782642), but it's likely due to insufficient temporary memory.

#### Build environment: settings.json

If `npm run build` fails with `json.decoder.JSONDecodeError: Expecting value`, the Pebble SDK config file has been zeroed out (for some reason?). Fix with:

```sh
echo '{}' > ~/Library/Application\ Support/Pebble\ SDK/settings.json
```

---

## License

[GPL-3.0](LICENSE)
