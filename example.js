
const {Executors} = require('./index.js');

let pool = Executors.singleThreadPool();

const buffer = new SharedArrayBuffer(16);

pool.submit(async (d) => (new Int32Array(d)[0] = 42), buffer).then(() => {
	return pool.submit(async (d) => new Int32Array(d)[0], buffer);
}).then((result) => {
	console.log(result);
	return pool.close();
}).then(() => {
	console.log('done');
});
