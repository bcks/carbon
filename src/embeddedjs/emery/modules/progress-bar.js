/**
 * Progress bar stub
 *
 * A thin bar spanning the full width at the very bottom edge of the screen.
 * Filled proportion is driven by the configured source in `main.js`.
 *
 * Supported config:
 *   source: "battery"  - fill from battery percentage
 *   any other value     - show an empty bar
 *
 * @module modules/progress-bar
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

import { colors } from "assets";
import { observeBattery } from "modules/battery-observer";

class ProgressBarBehavior extends Behavior {
	onCreate(port, data) {
		this.data = data;
		this.progress = 0;

		if (this.data?.source === "battery") {
			this.unobserve = observeBattery((sample) => {
				this.setProgress(port, sample.percent / 100);
			});
		}
	}

	/** Call with a value 0–1 to update the bar without a full redraw. */
	setProgress(port, value) {
		this.progress = Math.max(0, Math.min(1, value));
		port.invalidate();
	}

	onUndisplaying(port) {
		if (this.unobserve) {
			this.unobserve();
			this.unobserve = null;
		}
	}

	onDraw(port, x, y, w, h) {
		// Track
		port.fillColor(colors.progressTrack, 0, 0, w, h);
		// Fill
		const fillW = Math.round(w * this.progress);
		if (fillW > 0) {
			port.fillColor(colors.progressFill, 0, 0, fillW, h);
		}
	}
}

// Absolute overlay anchored to the bottom of the screen.
const ProgressBar = Port.template($ => ({
	bottom: 0, left: 0, right: 0,
	height: 4, // stub height
	Behavior: ProgressBarBehavior,
}));

export default ProgressBar;
