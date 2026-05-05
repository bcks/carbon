/**
 * AppMessage observer base
 *
 * Centralizes a single pebble/message Message instance and provides:
 * - shared readable/writable/suspend observer registration
 * - a LazyObserver-based base class for AppMessage-driven feature observers
 *
 * @module modules/app-message-observer
 */

import Message from "pebble/message";
import LazyObserver from "modules/lazy-observer";

export default class AppMessageObserver extends LazyObserver {
	static #keys = Object.freeze([
		"WEATHER_REQUEST",
		"WEATHER_TEMP",
		"WEATHER_TEMP_LOW",
		"WEATHER_TEMP_HIGH",
		"WEATHER_TEMP_HOURLY_0",
		"WEATHER_TEMP_HOURLY_1",
		"WEATHER_TEMP_HOURLY_2",
		"WEATHER_CODE",
		"WEATHER_PRECIP_0",
		"WEATHER_PRECIP_1",
		"WEATHER_PRECIP_2",
		"WEATHER_SUNRISE",
		"WEATHER_SUNSET",
		"WEATHER_ERROR",
		"HEALTH_STEPS",
		"HEART_RATE_BPM",
	]);
	static #input = 1024;
	static #output = 256;
	static #message = null;
	static #messageWritable = false;
	static #readableObservers = [];
	static #writableObservers = [];
	static #suspendObservers = [];

	static _ensureAppMessage() {
		if (this.#message)
			return;

		this.#message = new Message({
			keys: this.#keys,
			input: this.#input,
			output: this.#output,
			onReadable() {
				const data = AppMessageObserver.#message.read();
				if (!data)
					return;
				for (let i = 0; i < AppMessageObserver.#readableObservers.length; i++)
					AppMessageObserver.#readableObservers[i](data);
			},
			onWritable() {
				AppMessageObserver.#messageWritable = true;
				for (let i = 0; i < AppMessageObserver.#writableObservers.length; i++)
					AppMessageObserver.#writableObservers[i](true);
			},
			onSuspend() {
				AppMessageObserver.#messageWritable = false;
				for (let i = 0; i < AppMessageObserver.#suspendObservers.length; i++)
					AppMessageObserver.#suspendObservers[i](true);
			},
		});
	}

	static observeReadable(callback) {
		AppMessageObserver._ensureAppMessage();
		this.#readableObservers.push(callback);
		return () => {
			const index = AppMessageObserver.#readableObservers.indexOf(callback);
			if (index >= 0)
				AppMessageObserver.#readableObservers.splice(index, 1);
		};
	}

	static observeWritable(callback) {
		AppMessageObserver._ensureAppMessage();
		this.#writableObservers.push(callback);
		if (this.#messageWritable)
			callback(true);
		return () => {
			const index = AppMessageObserver.#writableObservers.indexOf(callback);
			if (index >= 0)
				AppMessageObserver.#writableObservers.splice(index, 1);
		};
	}

	static observeSuspend(callback) {
		AppMessageObserver._ensureAppMessage();
		this.#suspendObservers.push(callback);
		return () => {
			const index = AppMessageObserver.#suspendObservers.indexOf(callback);
			if (index >= 0)
				AppMessageObserver.#suspendObservers.splice(index, 1);
		};
	}

	static write(payload) {
		AppMessageObserver._ensureAppMessage();
		this.#message.write(payload);
	}

	constructor() {
		super();
		this.messageWritable = false;
		this.unobserveReadable = null;
		this.unobserveWritable = null;
		this.unobserveSuspend = null;
	}

	onStart() {
		if (!this.unobserveReadable) {
			this.unobserveReadable = AppMessageObserver.observeReadable((data) => this.onReadableMessage(data));
			this.unobserveWritable = AppMessageObserver.observeWritable(() => {
				this.messageWritable = true;
				this.onWritableMessage();
			});
			this.unobserveSuspend = AppMessageObserver.observeSuspend(() => {
				this.messageWritable = false;
				this.onSuspendMessage();
			});
		}
	}

	onStop() {
		if (this.unobserveReadable) {
			this.unobserveReadable();
			this.unobserveReadable = null;
		}
		if (this.unobserveWritable) {
			this.unobserveWritable();
			this.unobserveWritable = null;
		}
		if (this.unobserveSuspend) {
			this.unobserveSuspend();
			this.unobserveSuspend = null;
		}
		this.messageWritable = false;
	}

	onReadableMessage(data) {}
	onWritableMessage() {}
	onSuspendMessage() {}

	writeMessage(payload) {
		AppMessageObserver.write(payload);
	}
}

Object.freeze(AppMessageObserver);
