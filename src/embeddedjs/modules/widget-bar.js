/**
 * WidgetBar base class
 *
 * A Row template that renders an ordered list of widget slots.  Each entry in
 * `$.slots` is either a slot descriptor `{ name, config }` or `null` (spacer).
 *
 *   name   — widget module name, no path prefix (e.g. `"battery"`).  The
 *             `"widgets/"` prefix is added here so callers cannot inject an
 *             arbitrary module path.
 *   config — passed as instance data to the widget template constructor.
 *
 * Modules are loaded on demand with `importNow()` so unused widgets never
 * occupy memory.
 *
 * Platform files extend this by supplying `height`, optional `skin`, and
 * `slots` (mapped from the app-level `widgetConfig`).  Pass `slotWidth` to
 * override the default per-slot width.
 *
 * @module widget-bar
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

const DEFAULT_SLOT_WIDTH = 40;

/**
 * Builds a single fixed-width slot wrapping an on-demand-loaded widget.
 * Returns a plain spacer Content when `spec` is null.
 *
 * NOTE: Uses `Column` (not `Content`) as the wrapper because `Content` is a
 * leaf node in Piu and silently ignores a `contents` array.
 */
function makeSlot(spec, slotWidth, height) {
	if (!spec) {
		return Content(null, { width: slotWidth, height });
	}
	const Widget = importNow("widgets/" + spec.name).default;
	return Column(null, {
		width: slotWidth, height,
		contents: [ Widget(spec?.config ?? null, {}) ],
	});
}

/**
 * Maps a slots array to Piu content objects.
 *
 * Exported so platform-specific bar templates can call it directly from their
 * own template functions.  Piu template chaining passes the ORIGINAL data `$`
 * to every function in the chain, so a derived template cannot feed new
 * values into a base template's function — each platform bar must therefore
 * own its `contents` computation rather than relying on WidgetBar's.
 *
 * @param {Array}  slots      Array of `{ name, config } | null` descriptors.
 * @param {number} slotWidth  Pixel width of each slot.
 * @param {number} height     Pixel height of each slot.
 * @returns {Array}  Array of Piu Content objects ready for a `contents:` key.
 */
export function makeSlots(slots, slotWidth, height) {
	return (slots || []).map(spec =>
		makeSlot(spec, slotWidth || DEFAULT_SLOT_WIDTH, height)
	);
}

/**
 * Generic WidgetBar template.  Works when called with data shaped as
 * `{ slots, slotWidth, height }`.  Platform bars extend this only if they
 * pass the right data shape; otherwise use `makeSlots` directly.
 */
export const WidgetBar = Row.template($ => ({
	height: $.height,
	contents: makeSlots($.slots, $.slotWidth, $.height),
}));
