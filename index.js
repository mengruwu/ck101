var http = require('http');
var express = require('express');
var request = require("request");
var cheerio = require("cheerio");
var socket_io = require('socket.io');
var fs = require("fs");
var app = express();

var httpServer = http.createServer(app);
httpServer.listen(process.env.PORT || 5000);


app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  	response.render('pages/index');
});
/*
app.listen(app.get('port'), function() {
  	console.log('Node app is running on port', app.get('port'));
});

*/

var options = { 
	method	: 'GET',
  	url		: 'http://ck101.com/forum-3581-1.html',
};
var img = [];
	
var io = socket_io.listen(httpServer);



io.sockets.on('connection', function(socket){
    
    request(options, function (error, response, body) {
	  	if (error) throw new Error(error);

	  	var $ = cheerio.load(body);
	  	var result = [];
	  	var titles = $('div.blockTitle a');

	  	for (var i = 0; i < titles.length; i++) {
	  		result.push(titles.eq(i).attr('href'));
	  	}

	  	//fs.writeFileSync("result.json",JSON.stringify(result));
	  	for (var i = 0; i < result.length; i++) {
	  		//console.log(result[i]);
	  		request({url:result[i], method: 'GET'}, function (err, res, body) {
	  			if(err) throw new Error(error);
	  			$ = cheerio.load(body);
	  			var titles = $('img.zoom');
	  			for (var i = 0; i < titles.length; i++) {
	  				//console.log(titles.eq(i).attr('file'));
	  				//var a = document.createElement("a");
	  				socket.emit('c', { url: result[0], src : titles.eq(i).attr('file')}); // 發送資料
	  			}
	  		});
	  	}
	  	//console.log(body);
	});
});



