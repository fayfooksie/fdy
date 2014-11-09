fdy is a simple, effortless file server with nifty features such as URL rewriting (see [fdy.replace](#fdyreplaceregex-string)), file directory listing (can be disabled), and file manipulation (see [fdy.handle](#fdyhandlepath-callback))

##do it
```javascript
var fdy=require("fdy");
fdy.listen(4444);
```
##settings
- `fdy.cache=3600;` change cache (default `3600`)
- `fdy.index=true;` allow directory listing (default `true`)
- `fdy.directory="./public";` change root file directory (default `"./public"`)

####fdy.on(event, callback)
- `event` String (currently only `"request"`)
- `callback` Function(request, response)

####fdy.hide(regex)
Hide certain file and name patterns from directory listing (if enabled). <strike>Unlike `replace`, `redirect`, and `forbidden`, only accepts one pattern (use something like `/a|b|c/` for multiple).</strike> As of 1.0.5 works just the same.
- `regex` RegExp | String

####fdy.replace(regex, string)
Make changes to path before handling (i.e. `/forum/1/2` → `/forum`).
- `regex` RegExp | String
- `string` String (Function would also work, as it is a regular `replace`)

####fdy.redirect(regex, string)
Serve 302 to specified path (i.e. `/blog` → `http://external.blog/`).
- `regex` RegExp | String
- `string` String

####fdy.forbidden(regex, files)
Serve 403 from specified path (if directory, also excludes files by default).
- `regex` RegExp | String
- `files` Boolean (`true` to allow direct file requests such as images)

####fdy.handle(path, callback)
Manipulate select data before sending it. The first argument determines what requests a handle applies to based on url.
- `path` String
- `callback` Function(request, response, data)

Example usage (**app.js**)
```javascript
quotes={
	foo: "bar"
	};
fdy.replace(/^\/quote\/\w+$/, "/quote/");
fdy.handle("/quote/"/, function(request, response, data) {
	var	name=request.url.substring(7);
	response.end(data
		.replace(/{{author}}/, name)
		.replace(/{{quote}}/, quotes[name]||"unknown author")
		);
	});
```
and **index.html**
```html
<blockquote>
	{{quote}} -- {{author}}
</blockquote>
```

##Pages
Currently supports `403`, `404` and `DIR` -- point to files to serve for 403, 404, and directory pages. Grabs from public `fdy.directory` since any external files (such as stylesheets) would have to be public as well (obviously).
```javascript
fdy.hide("pages");
fdy.set("403", "pages/forbidden.html");
fdy.set("404", "pages/not-found.html");
fdy.set("DIR", "pages/directory.html");
```
**directory.html** -- the directory page uses a special format since its content is dynamic.
```html
<title>$title</title>
<table width="100%">
	<tr>
		<th width="70%">file</th>
		<th width="10%">size</th>
		<th width="20%">last updated</td>
	</tr>
	{{<tr>
		<td><a href="$fileurl">$filename</a></td>
		<td>$filesize</td>
		<td>$filedate</td>
	</tr>}}
</table>
```
##Where'd the dynamic file feature go?
<strike>I wasn't using it and I doubt anyone else was. I jumped from 0.0.3 to 1.0.0 to represent the change since it pretty much defeats the original purpose of fdy. I plan to add an event one could use to emulate that behavior again in the future.</strike> See [fdy.handle](#fdyhandlepath-callback).
