var	fs=require("fs"),
	mime=require("mime"),
	http=require("http");
var	cache={},
	events={},
	hidden=null,
	replaces=[],
	redirects=[],
	forbiddens=[];
function regurl(regex) {
	if(regex.constructor===String) {
		regex=new RegExp((regex[0]==="/"?"^":"^/")+regex);
		}
	return regex;
	};
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
		replaces.push(regurl(regex), string);
		},
	replaces: replaces,
	redirect: function(regex, string) {
		redirects.push(regurl(regex), string);
		},
	redirects: redirects,
	forbidden: function(regex, files) {
		forbiddens.push(regurl(regex), !files);
		},
	forbiddens: forbiddens,
	listen: function(port) {
		fdy.server=http.createServer(function(request, response) {
			if(events.request) {
				events.request.call(fdy, request, response);
				}
			var	path=decodeURIComponent(request.url.split(/\?/)[0]),
				noindex=/\?\/$/.test(request.url);
			for(var i=0; i<replaces.length; i+=2) {
				path=path.replace(replaces[i], replaces[i+1]);
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
			path=fdy.directory+path;
			if(!noindex && cache[path] || cache[path+"index.html"]) {
				if(!cache[path]) {
					path+="index.html";
					}
				response.writeHead(200, {
					"Content-Type": cache[path].type
					});
				response.end(cache[path].file, "binary");
				cache[path].timer._idleStart=Date.now();
				return;
				}
			fs.exists(path, function(exists) {
				if(!exists) {
					response.writeHead(404, {
						"Content-Type": "text/html"
						});
					response.end(fdy.templates["404"]);
					return;
					}
				var	pathf=path;
				if(fs.statSync(path).isDirectory()) {
					if(!noindex) {
						pathf+="index.html";
						}
					}
				else {
					noindex=false;
					}
				fs.readFile(pathf, "binary", function(error, file) {
					if(error || noindex) {
						if(path[path.length-1]!=="/") {
							response.writeHead(302, {
								"Location": path.slice(fdy.directory.length)+"/"
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
						path=decodeURIComponent(path);
						response.writeHead(200, {
								"Content-Type": "text/html"
								});
						var	stats=null,
							fmt=fdy.templates.DIR
								.match(/{{([^]+?)}}/)[1],
							doc_files="",
							doc_dirs=fmt
								.replace(/\$fileurl|\$filename/g, "../")
								.replace(/\$filesize|\$filedate/g, "-"),
							files=fs.readdirSync(path),
							opath=path.substring(fdy.directory.length);
						for(var i=0, j; i<files.length; ++i) {
							if(hidden && hidden.test(opath+files[i])) {
								continue;
								}
							stats=fs.statSync(path+files[i]);
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
					cache[pathf]={
						file: file,
						type: mime.lookup(pathf),
						timer: setTimeout(function() {
							delete cache[pathf];
							}, fdy.cache*1000)
						};
					response.writeHead(200, {
						"Content-Type": cache[pathf].type
						});
					response.end(cache[pathf].file, "binary");
					});
				});
			}).listen(port);
		return fdy;
		}
	};
module.exports=fdy;
