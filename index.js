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

var urls = [];
var io = socket_io.listen(httpServer);
io.sockets.on('connection', function(socket){
	request('http://ck101.com/forum-3581-1.html', function (err, res, body) {
		if (err) throw new Error(err);
		var $ = cheerio.load(body);
		$('a.s.xst').each(function () {
			var url = $(this).attr('href');
			urls.push(url);
		});
		for (var i = 0; i < urls.length; i++) {
			var url = urls[i];
			(function(url){
				request(url, function (err, res, body) {
					if (err) throw new Error(err);
					var $ = cheerio.load(body);
					$('div.mbn img').each(function (index, element) {
						var imgurl = $(this).attr('file');
						socket.emit('putImg',{'url' : url , 'src':imgurl});
						if (index >= 8) { console.log(index); return false;}
					});
				});	
			})(url);
		}
	});	  		
});



