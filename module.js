var	fs=require("fs"),
	url=require("url"),
	mime=require("mime"),
	http=require("http");
var	cache={};
var	fdy={
	fs: fs,
	temp: {},
	templates: {
		"404": "404 Not Found",
		"DIR": "<table width='100%'><$links$></table>"
		},
	cache: 3600,
	server: null,
	dy: /\.dy\.\w*$/,
	dytag: /<\$(.*?)\$>/g,
	directory: "./public",
	set: function(key, url, directory) {
		if(directory!==false) {
			url=fdy.directory+"/"+url;
			}
		fdy.fs.readFile(url, "binary", function(error, file) {
			if(error) {
				console.error(error.stack);
				return; 
				}
			fdy.templates[key]=file;
			});
		},
	handle: function(url, response, cache) {
		var	file=cache.file;
		if(fdy.dy.test(url.pathname)) {
			file=file.replace(fdy.dytag, function(_, code) {
				return eval(code);
				});
			}
		response.writeHead(200, {
			"Content-Type": cache.type
			});
		response.write(file, "binary");
		response.end();
		},
	listen: function(port) {
		fdy.server=http.createServer(function(request, response) {
			var	_url=url.parse(fdy.directory+request.url),
				path=decodeURIComponent(_url.pathname);
			if(cache[path] || cache[path+"index.html"]) {
				if(!cache[path]) {
					path+="index.html";
					}
				fdy.handle(_url, response, cache[path]);
				cache[path].timer._idleStart=Date.now();
				return;
				}
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
					path+="index.html";
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
								<td>"+(stats.size/1000).toFixed(2)+" KB</td>\
								<td>"+stats.mtime.toDateString()+"</td></tr>";
							}
						var	dirrows=doc_dir+doc_fil;
						response.write(fdy.templates["DIR"]
							.replace(fdy.dytag, function(_, code) {
								return eval(code);
								})
							);
						response.end();
						return;
						}
					fdy.handle(_url, response, cache[path]={
						file: file,
						type: mime.lookup(path),
						timer: setTimeout(function() {
							delete cache[path];
							}, fdy.cache*1000)
						});
					});
				});
			}).listen(port);
		return fdy;
		}
	};
module.exports=fdy;