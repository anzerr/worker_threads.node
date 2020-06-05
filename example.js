
const {Executors} = require('./index.js');

let pool = Executors.singleThreadPool();

const buffer = new SharedArrayBuffer(16);

pool.submit(async (d) => {
	new Int32Array(d)[0] = 42;
	return {'cat': 10};
}, buffer).then((res) => {
	console.log('sumbit1', res);
	return Promise.all([
		pool.submit(async (d) => {
			const b = Buffer.from(d);
			const path = require('path');
			b.write(path.resolve(process.cwd()));
		}, buffer).then((result) => console.log('1', result)),
		pool.submit(async (d) => {
			return Buffer.from(d)[0];
		}, buffer).then((result) => console.log('2', result)),
		pool.submit(async (d) => {
			return d.data.toString();
		}, {data: 'egg'}).then((result) => console.log('3', result))
	]);
}).then(() => {
	return pool.close();
}).catch((e) => {
	console.log(e);
	return pool.close();
}).then(() => {
	console.log('done', Buffer.from(buffer).toString());
});
