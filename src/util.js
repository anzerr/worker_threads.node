
const ENUM = require('./enum.js'),
	{EOL} = require('os');

const code = `
const {parentPort} = require('worker_threads'),
	util = require('./src/util.js');

parentPort.on('message', ({action, payload}) => {
	if (action === ${ENUM.RUN}) {
		try {
			const hydratedData = payload.data && (payload.data instanceof SharedArrayBuffer ? payload.data : Object.assign(util.deserialize(payload.data), payload.rawData));
			util.deserialize(payload.runnable)(hydratedData).then((result) => {
				payload.port.postMessage({
					action: ${ENUM.RESULT},
					payload: {result: util.serialize(result)}
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

	deserialize: (serializedThing, knownClasses = []) => {
		// eslint-disable-next-line no-new-func
		const evalFn = new Function(...knownClasses.map((t) => t.name), `"use strict";${EOL}return (${serializedThing});`);
		return evalFn(...knownClasses);
	},

	serialize: (fn) => {
		return fn.toString();
	}
};
