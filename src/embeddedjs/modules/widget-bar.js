/**
 * WidgetBar base class
 *
 * JavaScript class that builds an ordered list of widget slots for a bar
 * section of the watchface.  Each entry in the slots array passed to
 * `render()` is either a slot descriptor `{ name, config }` or `null`
 * (spacer).
 *
 *   name   — widget module name without path prefix (e.g. `"battery"`).
 *             The `"widgets/"` prefix is prepended here so callers cannot
 *             inject an arbitrary module path.
 *   config — passed as instance data to the widget template constructor.
 *
 * Widget modules are loaded on demand via `importNow()` so unused widgets
 * never occupy memory.
 *
 * Subclasses override `get Template()` to return a Piu template constructor
 * appropriate for the platform (e.g. a single Row for emery, a two-row
 * Column for gabbro).  Layout props such as height, skin, and style belong
 * in the subclass template rather than the constructor.
 *
 * The _makeSlot() helper instantiates a widget by calling
 * widget.Template(config, { width, height }) on the singleton exported by
 * each widget module.
 *
 * @module widget-bar
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

class WidgetBarBehavior extends Behavior {
	onCreate(container, data) {
		this.data = data;
	}

	onDisplaying(container) {
		console.log(`${this.constructor.name} onDisplaying with data:`, JSON.stringify(this.data));

		// Add widget slots to the container based on the provided data
		this.renderSlots(container, this.data ?? []);
	}
}

// Default container template for a widget bar (overridden by subclasses)
export const WidgetBarTemplate = Row.template($ => ({
	Behavior: $.constructor.Behavior,
	left: 0, right: 0, height: 24,
}));

class WidgetBar {

	static get Behavior() { return WidgetBarBehavior; }

	/**
	 * Returns the Piu template constructor for this bar.
	 * Subclasses override to provide their platform-specific layout.
	 * Called as: bar.Template(slots, {})
	 */
	get Template() { return WidgetBarTemplate; }

	renderSlots( container, slots ) {
		const slotW = Math.floor(container.width / 5); // Assuming 5 slots max
		const slotH = container.height;
		slots.forEach(spec => this.makeSlot(spec, container, slotW, slotH));
	}

	/**
	 * Builds a single slot from a descriptor, sizing it to slotW × slotH.
	 *
	 * @param   {object|null} spec    `{ name, config }` descriptor or null (spacer).
	 * @param   {Content}     container The parent container to add the slot to.
	 * @param   {number}      slotW   Slot width in pixels.
	 * @param   {number}      slotH   Slot height in pixels.
	 * @returns {Content}     Piu content for the slot.
	 */
	makeSlot(spec, container, slotW, slotH) {
		if (spec) {
			const Widget = importNow("widgets/" + spec.name).default;
			if ( Widget ) {
				const widget = new Widget(spec?.config);
				console.log(`WidgetBar: loading widget "${spec.name}" with config:`, spec.config);
				container.add(new widget.Template(widget, { width: slotW, height: slotH }));
			}
		}

		// Spacer slot (empty content)
		container.add(new Content(null, { width: slotW, height: slotH }));
	}
}

Object.freeze(WidgetBar);

export default WidgetBar;
