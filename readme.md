##do it
    var fdy=require("fdy");
    fdy.listen(1234);

##templates
currently only `404` and `DIR`

    fdy.fs.readFile("./public/404.html", "binary", function(error, file) {
        if(!error) fdy.templates["404"]=file;
        });

**example-dir.html**

    <title><$request.url$></title>
    <table width="100%">
        <tr>
            <th width="75%">File</th>
            <th width="10%">Size</th> 
            <th width="15%">Modified</th>
        </tr>
        <$dirrows$>
    </table>

##dynamic files
any `filename.dy.ext` is treated as a dynamic file where anything wrapped in `<$...$>` is executed

**example.dy.html**

    <title>random number</title>
    <body>
        <script src="example.dy.js"></script>
        <p><$Math.random()$></p>
    </body>

**example.dy.js**

    document.write("<$[
        "hey",
        "hello",
        "alright"
        ][Math.floor(Math.random()*3)]$>");

##change regex
`fdy.dy` and `fdy.dytag` match dynamic files and wrapping, respectively

    // filename.dynamic.ext
    fdy.dy=/\.dynamic\.\w*$/;

    // <!-- ... -->
    fdy.dytag=/<\!\-\-(.*?)\-\->/g;
