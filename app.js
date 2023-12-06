const createError = require(`http-errors`);
const express = require(`express`);
const path = require(`path`);
const cookieParser = require(`cookie-parser`);
const bodyParser = require(`body-parser`);
const rb = require(`@flexsolver/flexrb`);
const app = express();

const cors = require(`cors`);

app.use(bodyParser.json({ limit: `500mb` }));
app.use(bodyParser.urlencoded({ limit: `500mb`, extended: true, parameterLimit: 50000 }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, `public`)));
app.use(cors({ exposedHeaders: 'Content-Disposition' }));

const session = require('express-session');

// const scheduler = require(`./controllers/scheduler_helper/scheduler`);
// scheduler.wipeAllSchedulersAndRestart();
const DEBUGGING = typeof v8debug === `object` || /--debug|--inspect/.test(process.execArgv.join(` `));
console.debug = function () {
	if (DEBUGGING) {
		console.log.apply(this, arguments);
	}
};

app.use(
	session({
		secret: 'keyboard cat',
		saveUninitialized: false, // only save upon assigning attribute
		rolling: true, //every call will renew it
		resave: false,
		cookie: {
			expires: 10 * 1000,
		},
	}),
);
const storage = require('node-persist');
initStorage();
async function initStorage() {
	await storage.init({
		logging: false,
		expiredInterval: 2 * 60 * 1000, // run every 2 minutes remove expired items
	});
}

function logResponseBody(req, res, next) {
	if (req.method !== `GET` && req.body) {
		var oldWrite = res.write,
			oldEnd = res.end;
		var chunks = [];
		res.write = function (chunk) {
			chunks.push(chunk);
			oldWrite.apply(res, arguments);
		};
		res.end = async function (chunk) {
			if (req.path.includes(`excel`)) {
				oldEnd.apply(res, arguments);
				return;
			}
			try {
				if (chunk) chunks.push(chunk);
				var body = Buffer.concat(chunks).toString(`utf8`);
				const user = req.user;
				const dao = buildDao(req, body, user);

				if (dao.method_url.includes(`POST -> /admin/login`)) {
					dao.req = '{}';
				}
				req.insertId > 0 ? (dao.id = req.insertId) : delete dao.id;
				oldEnd.apply(res, arguments);
			} catch (err) {
				oldEnd.apply(res, arguments);
			}
		};
	}
	next();
	function buildDao(req, resBody, user) {
		const dao = {
			method_url: `${req.method} -> ${req.originalUrl}`,
			req: JSON.stringify(req.body),
			res: resBody,
			admin_id: user ? user.id : null,
			admin_name: user ? user.name : '',
		};
		return dao;
	}
}

app.use((req, res, next) => {
	next();
});

app.use(logResponseBody);

require(`./route_paths/0. check`)(app);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	console.log(`${req.method} -> ${req.originalUrl} is not a proper route!`);
	next(createError(404));
});

// error handler
app.use(async function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	const status = err.status || 500;
	res.status(status);
	let response;
	if (err.sql) {
		response = rb.buildError(err.message, status, { sql: err.sql });
	} else {
		response = rb.buildError(err.message, status, err);
	}
	res.json(response);
});

module.exports = { app: app };
