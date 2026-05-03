/**
 * Gabbro top widget bar
 *
 * Extends WidgetBar with a two-row layout that spans the full screen width.
 * The circular display clips bar corners naturally; no explicit inset needed.
 *
 * Row layout (5 slots total):
 *   Row 1 (2 slots, ~1/3 screen width, centered): slot 0 | slot 1
 *   Row 2 (3 slots, ~1/2 screen width, centered): slot 2 | slot 3 | slot 4
 *
 * The rows are horizontally centered with insets sized to keep content
 * within the visible circle at the top of the screen.
 *
 * @module modules/top-widget-bar
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

import {
	skins,
	styles,
} from "assets";
import WidgetBar from "modules/widget-bar";

const TopWidgetBarTemplate = Column.template($ => ({
	Behavior: $.controller.constructor.Behavior,
	skin: skins.topBar,
	style: styles.topBarIcons,
	contents: [
		Row($, {
			anchor: "TOP_ROW",
			height: Math.floor($.height / 2),
			left: Math.floor(screen.width / 3),
			right: Math.floor(screen.width / 3),
		}),
		Row($, {
			anchor: "BOTTOM_ROW",
			height: Math.floor($.height / 2),
			left: Math.floor(screen.width / 6),
			right: Math.floor(screen.width / 6),
		}),
	],
}));

class TopWidgetBar extends WidgetBar {
	getIconStyle(slotAlign = "center") {
		return styles.topBarIcons;
	}

	getTextStyle(slotAlign = "center") {
		return styles.topBarText;
	}

	get Template() { return TopWidgetBarTemplate; }

	renderSlots(container, slots) {
		const slotW = Math.floor(screen.width / 3);
		const slotH = Math.floor(container.height / 2);
		const list = slots ?? [];

		// Requested order: #1 bottom-left, #2 top-center, #3 bottom-right.
		this.makeSlot(list[1], container.TOP_ROW, slotW, slotH, "center", 1);
		this.makeSlot(list[0], container.BOTTOM_ROW, slotW, slotH, "left", 0);
		this.makeSlot(list[2], container.BOTTOM_ROW, slotW, slotH, "right", 2);
	}
}

Object.freeze(TopWidgetBar);

export default TopWidgetBar;
