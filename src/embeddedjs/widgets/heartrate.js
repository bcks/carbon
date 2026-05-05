/**
 * Heart-rate widget
 *
 * Displays current heart rate from modules/health-observer as BPM.
 * Renders nothing while no valid value is available.
 *
 * @module widgets/heartrate
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

import Widget from "modules/widget";
import { getHeartRateBpm, onHealthUpdate } from "modules/health-observer";
import { styles } from "assets";

function formatHeartRate(value) {
	if (value <= 0)
		return "";
	return `${ value }`;
}

class HeartRateBehavior extends Behavior {
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
		const bpm = getHeartRateBpm();
		const text = formatHeartRate(bpm);
		if (this.iconLabel)
			this.iconLabel.string = text.length > 0 ? "\uF02E" : "";
		if (this.textLabel)
			this.textLabel.string = text;
	}
}

const HeartRateTemplate = Row.template($ => ({
	Behavior: HeartRateBehavior,
	contents: [
		Label($, {
			width: 20,
			style: $.iconStyle ?? styles.topBarText,
			string: "",
		}),
		Label($, {
			width: 28,
			style: $.textStyle ?? styles.topBarText,
			string: "",
		}),
	],
}));

class HeartRateWidget extends Widget {
	static get Behavior() { return HeartRateBehavior; }
	get Template() { return HeartRateTemplate; }
}

Object.freeze(HeartRateWidget);
export default HeartRateWidget;
