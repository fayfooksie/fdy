##do it
    var fdy=require("fdy");
    fdy.listen(1234);

##templates
currently only `404` and `DIR`

    fdy.fs.readFile("./public/404.html", "binary", function(error, file) {
        if(!error) fdy.templates["404"]=file;
        });

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
