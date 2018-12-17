
const Pool = require('./src/pool.js');

module.exports = {
	Executors: {
		threadPool: (n = 1) => {
			return new Pool(n);
		},

		singleThreadPool: () => {
			return new Pool(1);
		}
	}
};
