var connect = require('connect'),
	serveStatic = require('serve-static'),
	port = 5000; //http port to listen on

var app = connect();
app.use(serveStatic(__dirname, {'index': 'preview.htm'}));
app.listen(port);
console.log('Listening on ' + port + '...');