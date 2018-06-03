var fs = require('fs');

const options = {};
options.port = parseInt(process.env.PORT || '8551');

if (process.env.SSL_KEY && process.env.SSL_CRT ) {
  options.https = {
    key: fs.readFileSync(process.env.SSL_KEY, 'utf8'),
    cert: fs.readFileSync(process.env.SSL_CRT, 'utf8')
  };

  require('total.js').https('release', options);
} else {
  require('total.js').http('release', options);
}


