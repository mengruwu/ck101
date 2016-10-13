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
var newesturl;

var io = socket_io.listen(httpServer);
io.sockets.on('connection', function(socket){
	socket.on('newpage',function(data){
		//console.log(data.pages);
		if ( data.sorts == 'ck101' ) {
			request('http://ck101.com/forum-'+data.url+'-'+data.pages+'.html', function (err, res, body) {
				if (err) throw new Error(err);
				var $ = cheerio.load(body);
				$('a.s.xst').each(function () {
					var url = $(this).attr('href');
					urls.push(url);
				});
				//console.log('['+urls.length+']');
				for (var i = 0; i < urls.length; i++) {
					var url = urls[i];
					(function(url){
						request(url, function (err, res, body) {
							if (err) throw new Error(err);
							var $ = cheerio.load(body);
							var imgurls = [];
							$('.mbn img').each(function (index, element) {
								if (index >= 5) {return false;}
								var imgurl = $(this).attr('file');
								if (imgurl!=null)imgurls.push(imgurl);
							});
							if (imgurls.length==0) {
								$('td.t_f img').each(function (index, element) {
									if (index >= 5) {return false;}
									var imgurl = $(this).attr('file');
									if (imgurl != null)imgurls.push(imgurl);
								});
							}
							if(imgurls.length >= 3)socket.emit('putImg',{'url' : url , 'src':imgurls});
							imgurls = [];
						});	
					})(url);
				}
				urls = [];
			});	
		}
		else if ( data.sorts == 'ptt' ) {
			var ptturl;
			if(data.pages == 1)ptturl = 'https://www.ptt.cc/bbs/Beauty/index.html';
			else ptturl = newesturl;
			request(ptturl, function (err, res, body) {
				if (err) throw new Error(err);
				var $ = cheerio.load(body);
				$('div.btn-group-paging a').each(function (index, element) {
					var url = $(this).attr('href');
					if(index == 1) newesturl = 'https://www.ptt.cc'+url;
				});

				$('div.title a').each(function () {
					var url = $(this).attr('href');
					urls.push(url);
				});

				for (var i = 0; i < urls.length; i++)  {
					var url = 'https://www.ptt.cc'+urls[i];
					(function(url){
						request(url, function (err, res, body) {
							if (err) throw new Error(err);
							var $ = cheerio.load(body);
							var imgurls = [];
							$('div.richcontent img').each(function (index, element) {
								if (index >= 5) {return false;}
								var imgurl = $(this).attr('src');
								if (imgurl != null)imgurls.push(imgurl);
							});
							if(imgurls.length >= 2){
								socket.emit('putImg',{'url' : url , 'src':imgurls});
							}
							imgurls = [];
						});	
					})(url);
				}
				urls = [];
			});
		}  
	});		
});



