/**
 * Battery widget
 *
 * Displays a battery icon reflecting the current charge level and charging
 * state.  Listens for `watch.battery` updates via `onBatteryChanged`.
 *
 * @todo Implement battery percentage text option (requires font with % glyph, or custom text layout).
 *
 * @module widgets/battery
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

import { IconLabel,
	battery, batteryCharging, batteryFull, batteryMedium, batteryLow, batteryWarning,
} from "modules/icons";

function batteryIcon(state) {
	if (state.charging)     return batteryCharging;
	if (state.percent > 80) return batteryFull;
	if (state.percent > 40) return batteryMedium;
	if (state.percent > 20) return batteryLow;
	return batteryWarning;
}

class BatteryBehavior extends Behavior {
	onCreate(label, data) {
		label.string = batteryIcon(watch.battery);
		watch.battery.addEventListener("change", (e) => {
			label.string = batteryIcon(e);
		});
	}
}

const BatteryWidget = IconLabel.template($ => ({
	Behavior: BatteryBehavior,
	string: battery,
}));

export default BatteryWidget;
