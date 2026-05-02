/**
 * Battery observer
 *
 * Shared, lazy battery sensor manager for widgets and features that need the
 * current battery sample. The underlying Battery sensor is created only when
 * the first observer subscribes, and is closed as soon as the last observer
 * unsubscribes.
 *
 * This keeps the runtime cost at zero when no battery-driven feature is
 * active, while still allowing multiple consumers to share one sensor.
 *
 * @module modules/battery-observer
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

import Battery from "embedded:sensor/Battery";

let sensor = null;
let sample = null;
const observers = [];

function publish(nextSample) {
	sample = nextSample;
	observers.slice().forEach(observer => observer(nextSample));
}

function start() {
	if (sensor)
		return;

	sensor = new Battery({
		onSample() {
			publish(this.sample());
		},
	});

	publish(sensor.sample());
}

function stop() {
	if (!sensor)
		return;

	sensor.close();
	sensor = null;
	sample = null;
}

export function observeBattery(observer) {
	if (observers.indexOf(observer) < 0)
		observers.push(observer);

	start();

	if (sample)
		observer(sample);

	return function unobserveBattery() {
		const index = observers.indexOf(observer);
		if (index >= 0)
			observers.splice(index, 1);

		if (!observers.length)
			stop();
	};
}

export function getBatterySample() {
	return sample;
}
