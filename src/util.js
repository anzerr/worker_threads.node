
const ENUM = require('./enum.js'),
	{EOL} = require('os');

const code = `
const {parentPort} = require('worker_threads'),
	{EOL} = require('os'),
	util = {
		deserialize: (serializedThing, knownClasses = []) => {
			// eslint-disable-next-line no-new-func
			const evalFn = new Function(...knownClasses.map((t) => t.name), \`"use strict";\${EOL}return (\${serializedThing});\`);
			return evalFn(...knownClasses);
		},
	
		serialize: (fn) => {
			try {
				return JSON.stringify(fn);
			} catch(e) {
				return fn.toString();
			}
		}
	};

parentPort.on('message', ({action, payload}) => {
	if (action === ${ENUM.RUN}) {
		try {
			const hydratedData = payload.data && (payload.data instanceof SharedArrayBuffer ? payload.data : Object.assign(JSON.parse(payload.data), payload.rawData));
			util.deserialize(payload.runnable)(hydratedData).then((result) => {
				payload.port.postMessage({
					action: ${ENUM.RESULT},
					payload: {result: result? util.serialize(result) : null}
				});
			}).catch((e) => {
				payload.port.postMessage({
					action: ${ENUM.ERROR},
					payload: {result: util.serialize(e), msg: e.message, error: true}
				});
			});
		} catch (e) {
			payload.port.postMessage({
				action: ${ENUM.ERROR},
				payload: {result: util.serialize(e), msg: e.message, error: true}
			});
		}
	}
});
`;

module.exports = {

	code: code,

	deserialize: (data) => {
		try {
			return JSON.parse(data);
		} catch (e) {
			return data;
		}
	},

	serialize: (fn) => {
		return typeof fn === 'function' ?  fn.toString() : JSON.stringify(fn);
	}

};
