
### `Intro`
Test to understand how the new 'worker_threads' works with SharedArrayBuffer.

#### `Install`
``` bash
npm install --save git+https://github.com/anzerr/worker_threads.node.git
```

### `Example`

``` javascript
const {Executors} = require('thread.node');

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

```

