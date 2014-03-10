//
//  Simple node.js http server for development
//
var connect = require('connect'),
	serveStatic = require('serve-static'),
	port = 5000; //http port to listen on

var app = connect();
app.use(serveStatic(__dirname, {'index': 'preview.htm'})); //default page
app.listen(port);
console.log('Listening on ' + port + '...');