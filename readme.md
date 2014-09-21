##do it
	var fdy=require("fdy");
	fdy.listen(4444);
	// fdy.directory="./public"; //default

##templates
currently only `404` and `DIR`

	// fdy.load(template, location[, ignoreDirectory]);
	fdy.load("404", "example-404.html");
	fdy.load("DIR", "example-dir.html");

**example-dir.html**

	<title>{{~request.url}}</title>
	<table width="100%">
		<tr>
			<th width="75%">File</th>
			<th width="10%">Size</th> 
			<th width="15%">Modified</th>
		</tr>
		{{~dirrows}}
	</table>

##dynamic files
any `filename.dy.ext` is treated as a dynamic file where anything wrapped in `{{~ ... }}` is executed

**example.dy.html**

	<title>random number</title>
	<body>
		<script src="example.dy.js"></script>
		<p>{{~Math.random()}}</p>
	</body>

**example.dy.js**

	document.write("{{~[
		"hey",
		"hello",
		"alright"
		][Math.floor(Math.random()*3)]}}");

##customize
`fdy.cache` is a number (in seconds) for cached file duration (default `3600`)

`fdy.directory` is a string for the parent directory to serve files from (default `"./public"`)

`fdy.dy` and `fdy.dytag` are regular expressions matching dynamic file extensions and executable code wrapping respectively

	// filename.dynamic.ext
	fdy.dy=/\.dynamic\.\w+$/;

	// <!-- ... -->
	fdy.dytag=/<\!\-\-(.+?)\-\->/g;
