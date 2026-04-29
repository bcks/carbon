/**
 * Gabbro (Pebble Round 2) render — builds the Application contents tree.
 *
 * All Piu construction for the gabbro platform lives here.  Layout geometry
 * is imported from "layout" (pure constants, no circular dependency risk).
 *
 * ProgressBar is placed FIRST in the array so it renders behind the Column.
 *
 * @module render
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

import layout from "layout";
import ClockLabel from "modules/clock";
import DateLabel from "modules/date-label";
import TopWidgetBar from "modules/top-widget-bar";
import BottomWidgetBar from "modules/bottom-widget-bar";
import PrecipGraph from "modules/precip-graph";
import ProgressBar from "modules/progress-bar";

//
// Clock centering
//

// Measured combined height of ClockLabel + DateLabel with current fonts.
// Increase to move the clock up (reduces TIME_OFFSET).
const CLOCK_BLOCK_H = 150;
const TIME_OFFSET   = Math.max(0, Math.floor((layout.center.height - CLOCK_BLOCK_H) / 2));
// Negative top pulls the date label up into the clock's descender space.
const DATE_OFFSET   = -8;

//
// Application contents
//

/**
 * Returns the Application contents array for the gabbro platform.
 * Arc ProgressBar overlay is placed before the Column so it draws behind.
 *
 * @param {object} $ - Piu template data (widgetConfig) passed from Application.
 * @returns {Array} Piu content array.
 */
export function getContents($) {
	return [
		// Arc progress bar: full-screen Port overlay, drawn behind everything.
		ProgressBar($, {}),
		Column($, {
			top: 0, bottom: 0, left: 0, right: 0,
			contents: [
				// Top widget bar (stub — arc-chord layout TBD)
				TopWidgetBar($, {}),
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
				// Bottom widget bar (stub)
				BottomWidgetBar($, {}),
			],
		}),
	];
}
