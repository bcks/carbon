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

The XS virtual machine heap is configured in `src/c/mdbl.c` via three fixed-size pools. Think of each as a separate memory bucket: you tell the engine exactly how large each bucket is before it starts, and they cannot grow.

| Pool | Current size | What lives here |
|---|---|---|
| `CARBON_SLOT_SIZE` | 40 960 bytes | Every JS variable binding, object property, and module namespace entry (16 bytes each) |
| `CARBON_CHUNK_SIZE` | 20 480 bytes | String content, arrays, object literals, module bytecode, `Style`/`Skin` objects |
| `CARBON_STACK_SIZE` | 6 144 bytes | Call-stack frames |

All three pools are carved out of the Pebble app heap (~131 KB on emery) before any JavaScript runs. Their combined size must stay under roughly 75 KB, or the Pebble OS itself runs out of heap and the app crashes on startup.

**Making pools too large is just as fatal as making them too small.** If slot + chunk + stack > ~75 KB, you'll see startup crashes even with perfectly valid JavaScript.

### Troubleshooting

#### `fxAbort memory full` on startup

This crash fires before any of your app code runs and is almost always a VM pool sizing problem. The error message alone doesn't tell you which pool is at fault — use the patterns below:

**If the crash happens before `Found mod "pebble.moddable.tech"` appears in the log:**
The slot pool is probably too large — slot + chunk + stack together exceed the Pebble heap. Reduce `CARBON_SLOT_SIZE`.

**If `Found mod` appears but the crash follows immediately:**
The chunk pool is too small to hold all the module bytecode and startup allocations (`new Style(...)`, `new Skin(...)`, template closures). Increase `CARBON_CHUNK_SIZE`.

**If the crash only appears after adding new widget modules:**
Widget modules run their top-level code at startup even before they render. Each `new Style(...)` or `new Skin(...)` at module scope costs chunk space. Always import the pre-built shared instances from `assets.js` rather than creating your own inside a widget file.

**To get exact numbers:** build with `npm run build:dev` (enables `ALLOY_INSTRUMENTATION`) and look for `instruments key: ...` log lines. They report `Slot used`, `Chunk used`, `Stack used`, and `System bytes free` every second. Compare each "used" value against its pool size constant.

#### `fxAbort stack overflow`

The call-stack pool is exhausted. Usually caused by deeply nested Piu template evaluation or accidental recursion. Increase `CARBON_STACK_SIZE`.

#### `fxMapArchive failed`

This crash happens before any JavaScript runs. XS tries to map the compiled `.xsa` archive into memory before initialising module namespaces; if the VM pools are so large that the Pebble heap is already exhausted by the time the map step runs, it fails with no further detail. Treat it identically to `fxAbort memory full` — reduce `CARBON_SLOT_SIZE` first, then check total pool usage.

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

#### Build environment: settings.json

If `npm run build` fails with `json.decoder.JSONDecodeError: Expecting value`, the Pebble SDK config file has been zeroed out (for some reason?). Fix with:

```sh
echo '{}' > ~/Library/Application\ Support/Pebble\ SDK/settings.json
```

---

## License

[GPL-3.0](LICENSE)
