/**
 * Clock label
 *
 * @module clock
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

import { styles } from "assets";

/**
 * Clock label behavior.
 *
 * Listens for `onClockChanged` events and updates the label string with the new
 * time.
 *
 * @class
 */
class ClockBehavior extends Behavior {

	/**
	 * Update the label string with the new time.
	 *
	 * @param {Label} label The current label instance.
	 * @param {Date} date The new date object from the clock change event.
	 */
	onClockChanged(label, date) {
		const hours = date.getHours();
		const h = String(hours % 12 || 12);
		const m = String(date.getMinutes()).padStart(2, "0");
		label.string = `${h}:${m}`;
	}
}

const ClockLabel = Label.template($ => ({
	anchor: "CLOCK",
	Behavior: ClockBehavior,
	style: styles.time,
	string: "00:00",
}));

export default ClockLabel;
