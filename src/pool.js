
const {MessageChannel, Worker} = require('worker_threads'),
	util = require('./util.js'),
	ENUM = require('./enum.js');

class Pool {

	TIMEOUT = (1000 * 60);

	constructor(num, options) {
		this._worker = [];
		this.__worker = [];
		this._queue = [];
		for (let i = 0; i < num; i++) {
			let w = new Worker(util.code, {...options, eval: true});
			this._worker.push(w);
			this.__worker.push(w);
		}
		this.cache = [];
		this.think = setInterval(() => {
			const out = [], now = Date.now();
			for (const i in this.cache) {
				if (this.cache[i] && this.cache[i].timeout > now) {
					out.push(this.cache[i]);
				}
			}
			this.cache = out;
		}, Pool.TIMEOUT);
	}

	getFn(fn) {
		for (const i in this.cache) {
			if (this.cache[i].fn === fn) {
				this.cache[i].timeout = Date.now() + Pool.TIMEOUT;
				return this.cache[i].serialize;
			}
		}
		const serialize = util.serialize(fn);
		this.cache.push({
			timeout: Date.now() + Pool.TIMEOUT,
			fn,
			serialize
		});
		return serialize;
	}

	submit(fn, data) {
		return new Promise((resolve, reject) => {
			this._queue.push({fn: fn, data: data, resolve: resolve, reject: reject});
			this.executeNext();
		});
	}

	executeNext() {
		if (this._queue.length > 0 && this._worker.length > 0) {
			const {fn, data, resolve, reject} = this._queue.shift();
			const worker = this._worker.shift();
			const rawData = {};

			if (typeof data === 'object') {
				Object.entries(data).forEach(([key, value]) => {
					if (value instanceof SharedArrayBuffer) {
						rawData[key] = value;
						delete data.key;
					}
				});
			}

			const channel = new MessageChannel();
			channel.port2.on('message', ({action, payload}) => {
				if (action === ENUM.RESULT || action === ENUM.ERROR) {
					this._worker.push(worker);
					channel.port1.close();
					channel.port2.close();
					this.executeNext();
					if (action === ENUM.RESULT) {
						resolve(util.deserialize(payload.result));
					} else {
						const e = util.deserialize(payload.result);
						e.message = payload.msg;
						reject(e);
					}
				}
			});

			worker.postMessage({
				action: ENUM.RUN,
				payload: {
					data: (data instanceof SharedArrayBuffer || !data ? data : util.serialize(data)) || {},
					port: channel.port1,
					rawData: rawData,
					runnable: this.getFn(fn)
				}
			}, [channel.port1]);
		}
	}

	close() {
		let wait = [];
		for (let i in this.__worker) {
			wait.push(this.__worker[i].terminate());
		}
		clearImmediate(this.think);
		return Promise.all(wait);
	}

}

module.exports = Pool;
