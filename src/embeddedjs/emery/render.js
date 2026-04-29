/**
 * Emery (Pebble Time 2) render — builds the Application contents tree.
 *
 * All Piu construction for the emery platform lives here.  Layout geometry
 * is imported from "layout" (pure constants, no circular dependency risk).
 *
 * @module render
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

import assets from "assets";
import layout from "layout";
import ClockLabel from "modules/clock";
import DateLabel from "modules/date-label";
import PrecipGraph from "modules/precip-graph";
import ProgressBar from "modules/progress-bar";
import BatteryWidget from "widgets/battery";
import BluetoothWidget from "widgets/bluetooth";

//
// Slot geometry
//

// 4 equal-width slots across the full bar width.
const SLOT_WIDTH = Math.floor(screen.width / 4);

const topBarSkin = new Skin(assets.skins.topBar);

//
// Clock centering
//

// Measured combined height of ClockLabel + DateLabel with current fonts.
// Increase to move the clock up (reduces TIME_OFFSET).
const CLOCK_BLOCK_H = 140;
const TIME_OFFSET   = Math.max(0, Math.floor((layout.center.height - CLOCK_BLOCK_H) / 2));
// Negative top pulls the date label up into the clock's descender space.
const DATE_OFFSET   = -8;

//
// Application contents
//

/**
 * Returns the Application contents array for the emery platform.
 * Single full-height Column; ProgressBar is the last child.
 *
 * @param {object} $ - Piu template data (widgetConfig) passed from Application.
 * @returns {Array} Piu content array.
 */
export function getContents($) {
	return [
		Column($, {
			top: 0, bottom: 0, left: 0, right: 0,
			contents: [
				// Top widget bar
				Row(null, {
					height: layout.topBar.height, left: 0, right: 0,
					skin: topBarSkin,
					contents: [
						Column(null, { width: SLOT_WIDTH, height: layout.topBar.height, contents: [ BatteryWidget(null, {}) ] }),
						Column(null, { width: SLOT_WIDTH, height: layout.topBar.height, contents: [ BluetoothWidget(null, {}) ] }),
						Content(null, { width: SLOT_WIDTH, height: layout.topBar.height }),
						Content(null, { width: SLOT_WIDTH, height: layout.topBar.height }),
					],
				}),
				// Precipitation graph
				PrecipGraph($, {}),
				// Clock + date
				Column($, {
					height: layout.center.height, left: 0, right: 0,
					contents: [
						Column(null, {
							top: TIME_OFFSET, left: 0, right: 0,
							contents: [
								ClockLabel(null, { left: 0, right: 0 }),
								DateLabel(null,  { top: DATE_OFFSET, left: 0, right: 0 }),
							],
						}),
					],
				}),
				// Bottom widget bar
				Row(null, {
					height: layout.bottomBar.height, left: 0, right: 0,
					contents: [
						Content(null, { width: SLOT_WIDTH, height: layout.bottomBar.height }),
						Content(null, { width: SLOT_WIDTH, height: layout.bottomBar.height }),
						Content(null, { width: SLOT_WIDTH, height: layout.bottomBar.height }),
						Content(null, { width: SLOT_WIDTH, height: layout.bottomBar.height }),
					],
				}),
				// Progress bar
				ProgressBar($, {}),
			],
		}),
	];
}
