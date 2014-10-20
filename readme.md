##do it
```javascript
var fdy=require("fdy");
fdy.listen(4444);
```
##settings
`fdy.cache=3600;` change cache
`fdy.directory="./public";` change root file directory

####fdy.on(event, callback)
- `event` String (currently only `"request"`)
- `callback` Function(request, response)

####fdy.replace(regex, string)
Make changes to path before handling
- `regex` RegExp | String
- `string` String

####fdy.redirect(regex, string)
Serve 302 to specified path
- `regex` RegExp | String
- `string` String

####fdy.forbidden(regex, files)
Serve 403 from specified path (including files by default)
- `regex` RegExp | String
- `files` Boolean (`true` to allow direct file requests)

##templates
currently supports `403`, `404` and `DIR`
```javascript
fdy.set("403", "pages/forbidden.html");
fdy.set("404", "pages/not-found.html");
fdy.set("DIR", "pages/directory.html");
```
**directory.html**
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
##where'd the dynamic file feature go?
I wasn't using it and I doubt anyone else was. I jumped from 0.0.3 to 1.0.0 to represent the change since it pretty much defeats the original purpose of fdy. I plan to add an event one could use to emulate that behavior again in the future.
