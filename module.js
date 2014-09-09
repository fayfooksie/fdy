var	fs=require("fs"),
	url=require("url"),
	mime=require("mime"),
	http=require("http");
var	fdy={
	fs: fs,
	temp: {},
	templates: {
		"404": "404 Not Found",
		"DIR": "<$links$>"
		},
	listen: function(port) {
		http.createServer(function(request, response) {
			var	_url=url.parse("./public"+request.url),
				path=decodeURIComponent(_url.pathname);
			fs.exists(path, function(exists) {
				if(!exists) {
					response.writeHead(404, {
						"Content-Type": "text/html"
						});
					response.write(fdy.templates["404"]);
					response.end();
					return;
					}
				if(fs.statSync(path).isDirectory()) {
					path+="/index.html";
					}
				fs.readFile(path, "binary", function(error, file) {
					if(error) {
						if(request.url[request.url.length-1]!=="/") {
							response.writeHead(302, {
								"Location": request.url+"/"
								});
							response.end();
							return;
							}
						path=decodeURIComponent(_url.pathname);
						response.writeHead(200, {
								"Content-Type": "text/html"
								});
						var	stats=null,
							doc_fil="",
							doc_dir="",
							files=fs.readdirSync(path);
						for(var i=0; i<files.length; ++i) {
							stats=fs.statSync(path+files[i]);
							if(stats.isDirectory()) {
								files[i]+="/";
								doc_dir+="<tr>\
									<td><a href='"+files[i]+"'>"+files[i]+"</a>\
									<td>-</td>\
									<td>"+stats.mtime.toDateString()+"</td></tr>";
								continue;
								}
							doc_fil+="<tr>\
								<td><a href='"+files[i]+"'>"+files[i]+"</a>\
								<td>"+(stats.size/1e3).toFixed(2)+" KB</td>\
								<td>"+stats.mtime.toDateString()+"</td></tr>";
							}
						response.write(fdy.templates["DIR"]
							.replace(/<\$title\$>/, request.url)
							.replace(/<\$links\$>/, doc_dir+doc_fil)
							);
						response.end();
						return;
						}
					path=mime.lookup(path);
					if(/\.dy\.\w*$/.test(_url.pathname)) {
						file=file.replace(/<\$([^\$]+)\$>/g, function(match, code) {
							return eval(code);
							});
						}
					response.writeHead(200, {
						"Content-Type": path
						});
					response.write(file, "binary");
					response.end();
					});
				});
			}).listen(port);
		}
	};
module.exports=fdy;