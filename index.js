const Promise = require('bluebird');
const restify = require('restify');
const request = Promise.promisifyAll(require('request'));
const addressParser = require('hk-address-parser-lib');


async function searchAddress(req, res, next) {
  const { address, lang } = req.query;
  const addresses = await addressParser.parse(address);

  const language = lang && lang.toLowerCase() === 'zh_hk' ? addressParser.Address.LANG_ZH : addressParser.Address.LANG_EN;
  const results = addresses.map(address => {
    const components = {};
    const coordinate = address.coordinate();
    address.components(language).forEach(function (component) {
      components[component.key] = component.translatedValue;
    });

    return {
      full_address: address.fullAddress(language),
      coordinate: {
        lat: parseFloat(coordinate.lat),
        lng: parseFloat(coordinate.lng),
      },
      data_source: address.dataSource(),
      elements: components,
    }
  });


  res.send({
    success: true,
    data: {
      search_string: address,
      results,
    }
  });
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
  logger.debug(err.message);
  logger.debug(err.stack);
  err.toJSON = function customToJSON() {
    return {
      success: false,
      error_code: err.code || ERROR_SERVER_EXCEPTION,
      error_message: err.message,
    };
  };
  err.toString = function customToString() {
    return {
      success: false,
      error_code: err.code || ERROR_SERVER_EXCEPTION,
      error_message: 'Internal Server Error',
    };
  };
  return callback();
});


/**
 *
 * @api {get} /search Search the address
 * @apiName Search
 * @apiVersion  1.0.0
 * @apiHeader (Session) {String} auth-account-id Logged in User's Id
 * @apiHeader {String} authorization Logged in User's Id
 * @apiSuccess {String} data.search_string name of the user
 * @apiSuccess {String} data.results the result set
 * @apiParam {String="zh_hk", "en_us"} lang the language for the results
 * @apiParam {String} address the address to lookup
 */
server.get('/search', asyncMiddleware(searchAddress));

server.listen(80, function () {
  console.log('%s listening at %s', server.name, server.url);
});