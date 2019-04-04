const Promise = require('bluebird');
const restify = require('restify');
const request = Promise.promisifyAll(require('request'));
const restifyErrors = require('restify-errors');
let token = null;

async function authorize() {
  const response = await request.postAsync('https://api.kintohub.com/authorize', {
    json: {
      clientId: '',
      clientSecret: ''
    }
  })
  if (response.statusCode === 200 &&
    response.body.data.token) {
    token = response.body.data.token;
  }

}

async function callKinto(url) {
  return request.getAsync(url, {
    headers: {
      'Kinto-Authorization': `Bearer ${token}`
    }
  });
}

async function handleURL(req, res, next) {
  const url = ` https://api.kintohub.com/addressparser-api/${req.url}`;


  let response = await callKinto(url);

  if (response.statusCode === 403) {
    await authorize();
    response = await callKinto(url);
  }

  if (response.statusCode !== 200) {
    // Something went wrong
    return next(new restifyErrors.UnauthorizedError());
  }

  res.send(JSON.parse(response.body));
  next();
}

const asyncMiddleware = (fn) => {
  return (req, res, next) => {
    return fn(req, res, next).catch(error => {
      console.error(error);
      next(error);
    })
  }
}

const server = restify.createServer();

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());
// Catch the errors and format the response
server.on('restifyError', (req, res, err, callback) => {
  console.log(err.message);
  console.log(err.stack);
  err.toJSON = function customToJSON() {
    return {
      success: false,
      error_code: err.code,
      error_message: err.message,
    };
  };
  err.toString = function customToString() {
    return 'Internal Server Error'
  };
  return callback();
});

server.get('/*', asyncMiddleware(handleURL));

server.listen(8080, function () {
  console.log('%s listening at %s', server.name, server.url);
});