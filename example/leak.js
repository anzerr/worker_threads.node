
const {Executors} = require('../index.js');

const pool = Executors.threadPool(4);

let i = 0;
setInterval(() => {
	const v = i++;
	// had a problem that left the MessageChannel open
	pool.submit(async (d) => {
		return {[d[0]]: d[1]};
	}, ['cat', v]).then((res) => {
		if (res.cat !== v) {
			console.log('wrong data', res);
		}
	});
}, 1);
