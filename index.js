//load modules
var	fs=require("fs"),
	http=require("http");
var	jht=require("jht"),
	mime=require("./mime.json"),
	type=require("./type.json");

//setup variables
var	_GET={},
	_GETx={},
	_POST={},
	events={},
	headers={},
	hiddens={},
	replace=[],
	redirect={},
	redirects=[],
	forbidden={},
	forbiddens=[],
	pages={
		"400": "400 Bad Request",
		"403": "403 Forbidden",
		"404": "404 Not Found",
		"DIR": "<table width=\"100%\">\
					<thead>\
						<tr>\
							<th>File</th>\
							<th>Size</th>\
							<th>Modified</th>\
						</tr>\
					</thead>\
					<tbody>\
						{each files}\
							<tr>\
								<td><a href=\"{path}\">{name}</a></td>\
								<td>{size}</td>\
								<td>{date}</td>\
							</tr>\
						{/each}\
					</tbody>\
				</table>"
		};

//setup server
var	server=http.createServer(function(request, response) {
	if(events.request) {
		events.request(request);
		}
	if(request.url[0]!=="/") {
		response.destroy();
		}
	else {
		var	path=request.url.split(/\?/),
			query=path[1]||"";
		path=path[0];
		try {
			path=decodeURI(path);
			if(/\\/.test(path)) {
				throw 1;
				}
			}
		catch(error) {
			response.writeHead(400, {
				"Content-Type": "text/html"
				});
			response.write(pages["400"]);
			response.end();
			return;
			}
		if(redirect[path]) {
			response.writeHead(302, {
				"Location": redirect[path]
				});
			response.end();
			}
		else if(forbidden[path]) {
			response.writeHead(403, {
				"Content-Type": "text/html"
				});
			response.write(pages["403"]);
			response.end();
			}
		else {
			var	opath=path;
			for(var i=replace.length; i; i-=2) {
				path=path.replace(replace[i-2], replace[i-1]);
				}
			for(var i=redirects.length; i; i-=2) {
				if(redirects[i-2].test(path)) {
					response.writeHead(302, {
						"Location": redirects[i-1]
						});
					response.end();
					return;
					}
				}
			for(var i=forbiddens.length; i--;) {
				if(forbiddens[i].test(path)) {
					response.writeHead(403, {
						"Content-Type": "text/html"
						});
					response.write(pages["403"]);
					response.end();
					return;
					}
				}
			if(request.method==="POST") {
				if(_POST[path]) {
					if(query) {
						_POST[path](request, response, query);
						}
					else {
						request.on("data", function(data) {
							query+=data;
							});
						request.on("end", function() {
							_POST[path](request, response, query);
							});
						}
					}
				else {
					response.writeHead(404);
					response.end();
					}
				}
			else {
				if(_GETx[path]) {
					_GETx[path](request, response, query);
					}
				else {
					var	_path="./public"+path;
					fs.stat(_path, function(error, stats) {
						if(error) {
							response.setHeader("Content-Type", "text/html");
							response.writeHead(404, headers["text/html"]);
							response.write(pages["404"]);
							response.end();
							}
						else if((stats.mode&0xf000)===0x4000) {
							if(path[path.length-1]==="/") {
								response.setHeader("Content-Type", "text/html");
								fs.stat(_path+"index.html", function(error, stats) {
									if(error) {
										fs.readdir(_path, function(error, files) {
											response.writeHead(200, headers["text/html"]);
											statchain(_path, path, files, 0, [{
												dir: 1,
												name: "../",
												path: "../",
												size: "-",
												date: "-"
												}], [], response);
											});
										}
									else {
										response.setHeader("Last-Modified", stats.mtime)
										response.writeHead(200, headers["text/html"]);
										if(request.method!=="HEAD") {
											fs.readFile(_path+"index.html", function(error, data) {
												if(_GET[path]) {
													_GET[path](request, response, data.toString(), query);
													}
												else {
													response.write(data);
													response.end();
													}
												});
											}
										}
									});
								}
							else {
								response.writeHead(302, {
									"Location": query?
										opath+"/?"+query:
										opath+"/"
									});
								response.end();
								}
							}
						else {
							var	type=mime[path.replace(/.+\./, "")],
								lmod=request.headers["if-modified-since"];
							if(lmod && new Date(lmod) >= stats.mtime) {
								response.writeHead(304, headers[type]);
								response.end();
								}
							else {
								response.setHeader("Content-Type", type);
								response.setHeader("Last-Modified", stats.mtime);
								response.writeHead(200, headers[type]);
								if(request.method!=="HEAD") {
									fs.readFile(_path, function(error, data) {
										if(_GET[path]) {
											_GET[path](query, response, data.toString());
											}
										else {
											response.write(data);
											response.end();
											}
										});
									}
								}
							}
						});
					}
				}
			}
		}
	});

//define methods
function parse(query) {
	var	object={};
	query=query.split(/\&|=/);
	try {
		for(var i=0; i<query.length; i+=2) {
			object[decodeURIComponent(query[i])]=decodeURIComponent(query[i+1]);
			}
		return object;
		}
	catch(error) {
		return null;
		}
	};
function sizef(size) {
	if(size>1073741824) {
		return (size/1073741824).toFixed(2)+" GB";
		}
	if(size>1048576) {
		return (size/1048576).toFixed(2)+" MB";
		}
	return (size/1024).toFixed(2)+" KB";
	};
function statchain(_path, path, files, index, rdirs, rfiles, response) {
	if(index<files.length) {
		if(files[index].length>1 && !hiddens[files[index]]) {
			fs.stat(_path+files[index], function(error, stats) {
				if(!error) {
					if((stats.mode&0xf000)===0x4000) {
						rdirs.push({
							dir: 1,
							path: encodeURI(files[index])+"/",
							name: files[index]+"/",
							size: "-",
							date: "-"
							});
						}
					else {
						rfiles.push({
							dir: 0,
							path: encodeURI(files[index]),
							name: files[index],
							size: sizef(stats.size),
							date: stats.mtime.toDateString()
							});
						}
					}
				statchain(_path, path, files, index+1, rdirs, rfiles, response);
				});
			}
		else {
			statchain(_path, path, files, index+1, rdirs, rfiles, response);
			}
		}
	else {
		response.write(
			jht.parse(jht.compress(pages["DIR"]), {
				path: path,
				files: rdirs.concat(rfiles)
				})
			);
		response.end();
		}
	};

//export module
module.exports={
	jht: jht,
	parse: parse,
	listen: function(port) {
		server.listen(port);
		},
	page: function(name, path) {
		pages[name]=fs.readFileSync("./public"+path, "utf-8");
		},
	header: function(ct, data) {
		if(type[ct]) {
			ct=type[ct];
			for(var i=ct.length, key; i--;) {
				headers[mime[ct[i]]]=data;
				}
			}
		else {
			headers[ct]=data;
			}
		},
	on: function(event, callback) {
		events[event]=callback;
		},
	handle: function(method, path, callback, exists) {
		if(method==="POST") {
			_POST[path]=callback;
			}
		else if(exists) {
			_GET[path]=callback;
			}
		else {
			_GETx[path]=callback;
			}
		},
	hide: function(path) {
		hiddens[path]=1;
		},
	replace: function(regex, to) {
		replace.push(regex, to);
		},
	redirect: function(from, to) {
		if(from.constructor===String) {
			redirect[from]=to;
			}
		else {
			redirects.push(from, to);
			}
		},
	forbidden: function(path) {
		if(path.constructor===String) {
			forbidden[path]=1;
			}
		else {
			forbiddens.push(path);
			}
		}
	};