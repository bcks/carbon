/**
 * Health data module
 *
 * Receives step count and heart rate from the C layer via AppMessage
 * (C → phone relay → watch JS). The C layer sends health values through
 * AppMessage outbox to pkjs, and pkjs relays them back so this module can
 * receive them via the embedded:network/message channel.
 *
 * @module modules/health-observer
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

import AppMessageObserver from "modules/app-message-observer";

class HealthObserver extends AppMessageObserver {
	stepsToday = -1;
	heartRateBpm = -1;

	onReadableMessage(data) {
		let changed = false;

		const steps = data.get("HEALTH_STEPS");
		if (steps !== undefined && steps >= 0) {
			this.stepsToday = steps;
			changed = true;
		}

		const heartRate = data.get("HEART_RATE_BPM");
		if (heartRate !== undefined) {
			if (heartRate > 0)
				this.heartRateBpm = heartRate;
			else
				this.heartRateBpm = -1;
			changed = true;
		}

		if (!changed)
			return;

		this.publish({
			stepsToday: this.stepsToday,
			heartRateBpm: this.heartRateBpm,
		});
	}

	onStop() {
		super.onStop();
		this.stepsToday = -1;
		this.heartRateBpm = -1;
	}
}

const healthObserver = new HealthObserver();

function getStepCountToday() {
	return healthObserver.stepsToday;
}

function getHeartRateBpm() {
	return healthObserver.heartRateBpm;
}

// Subscribe to health updates. Callback receives { stepsToday, heartRateBpm }.
function onHealthUpdate(callback) {
	return healthObserver.observe(callback);
}

export { getStepCountToday, getHeartRateBpm, onHealthUpdate };
