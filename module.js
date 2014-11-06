var	fs=require("fs"),
	mime=require("mime"),
	http=require("http");
var	cache={},
	events={},
	hidden=null,
	replaces=[],
	redirects=[],
	forbiddens=[],
	handles=[];
var	fdy={
	fs: fs,
	temp: {},
	templates: {
		"403": "403 Forbidden",
		"404": "404 Not Found",
		"DIR": "<table width=\"100%\">{{<tr>"
			+"<td><a href=\"$fileurl\">$filename</a></td>"
			+"<td>$filesize</td>"
			+"<td>$filedate</td>"
			+"</tr>}}</table>"
		},
	cache: 3600,
	index: true,
	server: null,
	directory: "./public",
	on: function(event, callback) {
		events[event]=callback;
		},
	set: function(key, url) {
		fdy.fs.readFile(fdy.directory+"/"+url, "binary", function(error, file) {
			if(error) {
				console.error(error.stack);
				return; 
				}
			fdy.templates[key]=file;
			});
		},
	hide: function(regex) {
		hidden=regex;
		},
	replace: function(regex, string) {
		replaces.push(regex, string);
		},
	redirect: function(regex, string) {
		if(regex.constructor===String) {
			redirects[regex]=string;
			}
		else {
			redirects.push(regex, string);
			}
		},
	redirects: {},
	forbidden: function(regex, files) {
		if(regex.constructor===String) {
			forbiddens[regex]=1;
			}
		else {
			forbiddens.push(regex, !files);
			}
		},
	forbiddens: {},
	handle: function(regex, callback) {
		if(regex.constructor===String) {
			regex=new RegExp("^"+regex
				.replace(/\./g, "\\.")
				.replace(/\?/g, "\\?")
				);
			}
		handles.push(regex, callback);
		},
	listen: function(port) {
		fdy.server=http.createServer(function(request, response) {
			if(events.request) {
				events.request.call(fdy, request, response);
				}
			var	url=request.url.split(/\?/)[0],
				path=decodeURIComponent(url),
				noindex=/\?\/$/.test(request.url);
			for(var i=0; i<replaces.length; i+=2) {
				path=path.replace(replaces[i], replaces[i+1]);
				}
			if(redirects[path]) {
				response.writeHead(302, {
					"Location": redirects[path]
					});
				response.end();
				return;
				}
			for(var i=0; i<redirects.length; i+=2) {
				if(redirects[i].test(path)) {
					response.writeHead(302, {
						"Location": path.replace(redirects[i], redirects[i+1])
						});
					response.end();
					return;
					}
				}
			if(forbiddens[path]) {
				response.writeHead(403, {
					"Content-Type": "text/html"
					});
				response.end(fdy.templates["403"]);
				return;
				}
			for(var i=0; i<forbiddens.length; i+=2) {
				if(forbiddens[i].test(path)) {
					if(forbiddens[i+1] || !/\.\w+$/.test(path)) {
						response.writeHead(403, {
							"Content-Type": "text/html"
							});
						response.end(fdy.templates["403"]);
						return;
						}
					}
				}
			if(!noindex && cache[path]) {
				response.writeHead(200, {
					"Content-Type": cache[path].type
					});
				if(cache[path].handle) {
					cache[path].handle(request, response, cache[path].file);
					}
				else {
					response.end(cache[path].file, "binary");
					}
				cache[path].timer._idleStart=Date.now();
				return;
				}
			var	pathf=fdy.directory+path;
			fs.exists(pathf, function(exists) {
				if(!exists) {
					response.writeHead(404, {
						"Content-Type": "text/html"
						});
					response.end(fdy.templates["404"]);
					return;
					}
				if(fs.statSync(pathf).isDirectory()) {
					if(!noindex) {
						pathf+="index.html";
						}
					}
				else {
					noindex=false;
					}
				fs.readFile(pathf, "binary", function(error, file) {
					if(error || noindex) {
						if(url[url.length-1]!=="/") {
							response.writeHead(302, {
								"Location": url+"/"
								});
							response.end();
							return;
							}
						if(!fdy.index) {
							response.writeHead(403, {
								"Content-Type": "text/html"
								});
							response.end(fdy.templates["403"]);
							return;
							}
						function fmtFileSize(size) {
							if(size>1073741824) {
								return (size/1073741824).toFixed(2)+" GB";
								}
							if(size>1048576) {
								return (size/1048576).toFixed(2)+" MB";
								}
							return (size/1024).toFixed(2)+" KB";
							};
						response.writeHead(200, {
								"Content-Type": "text/html"
								});
						pathf=fdy.directory+path;
						var	stats=null,
							fmt=fdy.templates.DIR
								.match(/{{([^]+?)}}/)[1],
							doc_files="",
							doc_dirs=fmt
								.replace(/\$fileurl|\$filename/g, "../")
								.replace(/\$filesize|\$filedate/g, "-"),
							files=fs.readdirSync(pathf);
						for(var i=0, j; i<files.length; ++i) {
							if(hidden && hidden.test(opath+files[i])) {
								continue;
								}
							stats=fs.statSync(pathf+files[i]);
							if(stats.isDirectory()) {
								doc_dirs+=fmt
									.replace(/\$fileurl/, encodeURIComponent(files[i])+"/")
									.replace(/\$filename/, files[i]+"/")
									.replace(/\$filesize/, "-")
									.replace(/\$filedate/, stats.mtime.toDateString());
								continue;
								}
							doc_files+=fmt
								.replace(/\$fileurl/, encodeURIComponent(files[i]))
								.replace(/\$filename/, files[i])
								.replace(/\$filesize/, fmtFileSize(stats.size))
								.replace(/\$filedate/, stats.mtime.toDateString());
							}
						response.end(fdy.templates.DIR
							.replace(/\$title/, request.url)
							.replace(/{{[^]+?}}/, doc_dirs+doc_files)
							);
						return;
						}
					cache[path]={
						file: file,
						type: mime.lookup(pathf),
						timer: setTimeout(function() {
							delete cache[path];
							}, fdy.cache*1000)
						};
					response.writeHead(200, {
						"Content-Type": cache[path].type
						});
					for(var i=0; i<handles.length; i+=2) {
						if(handles[i].test(url)) {
							cache[path].handle=handles[i+1];
							handles[i+1](request, response, cache[path].file);
							return;
							}
						}
					response.end(cache[path].file, "binary");
					});
				});
			}).listen(port);
		return fdy;
		}
	};
module.exports=fdy;
