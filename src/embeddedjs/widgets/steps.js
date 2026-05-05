/**
 * Steps widget
 *
 * Displays today's step count alongside a footprints icon. Reads step data
 * via the Pebble HealthService C API (through modules/health-observer.js) and
 * refreshes
 * every minute via the `onClockChanged` event distributed by the Application.
 *
 * Returns -1 from the C side when health data is unavailable; the widget
 * renders nothing in that case so it occupies no visual space until data
 * becomes available.
 *
 * Config: (none currently)
 *
 * @module widgets/steps
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

import Widget from "modules/widget";
import { getStepCountToday, onHealthUpdate } from "modules/health-observer";
import { styles } from "assets";

function formatSteps(steps) {
	if (steps < 0)
		return "";
	if (steps >= 10000)
		return `${ Math.floor(steps / 1000) }k`;
	if (steps >= 1000)
		return `${ (steps / 1000).toFixed(1) }k`;
	return String(steps);
}

class StepsBehavior extends Behavior {
	onCreate(row, data) {
		this.data = data;
		this.iconLabel = null;
		this.textLabel = null;
	}

	onDisplaying(row) {
		this.iconLabel = row.first;
		this.textLabel = row.last;
		this.refresh();
		onHealthUpdate(() => this.refresh());
	}

	onUndisplaying(row) {
		this.iconLabel = null;
		this.textLabel = null;
	}

	onClockChanged(row) {
		this.refresh();
	}

	refresh() {
		const steps = getStepCountToday();
		const text = formatSteps(steps);
		if (this.iconLabel)
			this.iconLabel.string = text.length > 0 ? "\uF173" : "";
		if (this.textLabel)
			this.textLabel.string = text;
	}
}

const StepsTemplate = Row.template($ => ({
	Behavior: StepsBehavior,
	contents: [
		Label($, {
			width: 20,
			style: styles.topBarIcons,
			string: "",
		}),
		Label($, {
			width: 28,
			style: styles.topBarText,
			string: "",
		}),
	],
}));

class StepsWidget extends Widget {
	static get Behavior() { return StepsBehavior; }
	get Template() { return StepsTemplate; }
}

Object.freeze(StepsWidget);
export default StepsWidget;
