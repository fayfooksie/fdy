var	fs=require("fs"),
	mime=require("mime"),
	http=require("http");
var	cache={},
	events={},
	hidden={},
	hiddens=[],
	replaces=[],
	redirect={},
	redirects=[],
	forbidden={},
	forbiddens=[],
	handle={},
	handles=[];
var	fdy={
	fs: fs,
	temp: {},
	pages: {
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
		fs.readFile(fdy.directory+"/"+url, "binary", function(error, file) {
			if(error) {
				console.error(error.stack);
				}
			else {
				fdy.pages[key]=file;
				}
			});
		},
	hide: function(regex) {
		if(regex.constructor===String) {
			hidden[regex]=1;
			}
		else {
			hiddens.push(regex);
			}
		},
	replace: function(regex, string) {
		replaces.push(regex, string);
		},
	redirect: function(regex, string) {
		if(regex.constructor===String) {
			redirect[regex]=string;
			}
		else {
			redirects.push(regex, string);
			}
		},
	forbidden: function(regex, files) {
		if(regex.constructor===String) {
			forbidden[regex]=1;
			}
		else {
			forbiddens.push(regex, !files);
			}
		},
	handle: function(regex, callback) {
		handles.push(regex, callback);
		},
	listen: function(port) {
		if(fdy.cache) {
			fdy.cache*=1000;
			setInterval(function() {
				var	now=Date.now();
				for(var path in cache) {
					if(cache[path].expire>now) {
						delete cache[path];
						}
					}
				}, 60000);
			}
		fdy.server=http.createServer(function(request, response) {
			if(events.request) {
				events.request.call(fdy, request, response);
				}
			var	url=request.url.split(/\?/)[0],
				path=decodeURIComponent(url),
				noindex=request.url[request.url.length-1]==="/"
					&&request.url[request.url.length-2]==="?";
			for(var i=0; i<replaces.length; i+=2) {
				path=path.replace(replaces[i], replaces[i+1]);
				}
			if(redirect[path]) {
				response.writeHead(302, {
					"Location": redirect[path]
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
			if(forbidden[path]) {
				response.writeHead(403, {
					"Content-Type": "text/html"
					});
				response.end(fdy.pages["403"]);
				return;
				}
			for(var i=0; i<forbiddens.length; i+=2) {
				if(forbiddens[i].test(path)) {
					if(forbiddens[i+1] || !/\.\w+$/.test(path)) {
						response.writeHead(403, {
							"Content-Type": "text/html"
							});
						response.end(fdy.pages["403"]);
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
				cache[path].expire=Date.now()+fdy.cache;
				return;
				}
			var	pathf=fdy.directory+path;
			fs.exists(pathf, function(exists) {
				if(!exists) {
					response.writeHead(404, {
						"Content-Type": "text/html"
						});
					response.end(fdy.pages["404"]);
					return;
					}
				fs.stat(pathf, function(error, stats) {
					if(stats.isDirectory()) {
						pathf+="index.html"
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
								response.end(fdy.pages["403"]);
								return;
								}
							response.writeHead(200, {
									"Content-Type": "text/html"
									});
							pathf=fdy.directory+path;
							var	fmt=fdy.pages.DIR
									.match(/{{([^]+?)}}/)[1],
								doc_files="",
								doc_dirs=fmt
									.replace(/\$fileurl|\$filename/g, "../")
									.replace(/\$filesize|\$filedate/g, "-");
							fs.readdir(pathf, function(error, files) {
								function fsize(size) {
									if(size>1073741824) {
										return (size/1073741824).toFixed(2)+" GB";
										}
									if(size>1048576) {
										return (size/1048576).toFixed(2)+" MB";
										}
									return (size/1024).toFixed(2)+" KB";
									};
								function fstat(fname) {
									fs.stat(pathf+fname, function(error, stats) {
										if(stats.isDirectory()) {
											doc_dirs+=fmt
												.replace(/\$fileurl/, encodeURIComponent(fname)+"/")
												.replace(/\$filename/, fname+"/")
												.replace(/\$filesize/, "-")
												.replace(/\$filedate/, stats.mtime.toDateString());
											}
										else {
											doc_files+=fmt
												.replace(/\$fileurl/, encodeURIComponent(fname))
												.replace(/\$filename/, fname)
												.replace(/\$filesize/, fsize(stats.size))
												.replace(/\$filedate/, stats.mtime.toDateString());
											}
										if(!--rem) {
											response.end(fdy.pages.DIR
												.replace(/\$title/, request.url)
												.replace(/{{[^]+?}}/, doc_dirs+doc_files)
												);
											}
										});
									};
								fileloop:
								for(var i=0, j, f, rem=files.length; i<files.length; ++i) {
									f=path+files[i];
									if(hidden[f]) {
										--rem;
										continue;
										}
									for(j=0; j<hiddens.length; ++j) {
										if(hiddens[j].test(f)) {
											--rem;
											continue fileloop;
											}
										}
									fstat(files[i]);
									}
								});
							return;
							}
						response.writeHead(200, {
							"Content-Type": mime.lookup(pathf)
							});
						if(fdy.cache) {
							cache[path]={
								file: file,
								type: response._header["Content-Type"],
								expire: Date.now()+fdy.cache
								};
							}
						for(var i=0; i<handles.length; i+=2) {
							if(handles[i]===path) {
								if(fdy.cache) {
									cache[path].handle=handles[i+1];
									}
								handles[i+1](request, response, file);
								return;
								}
							}
						response.end(file, "binary");
						});
					});
				});
			}).listen(port);
		}
	};
module.exports=fdy;
