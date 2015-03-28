fdy is a simple, effortless file server with nifty features such as URL rewriting (see [fdy.replace](#fdyreplaceregex-string)), file directory listing, and file manipulation (see [fdy.handle](#fdyhandlepath-callback))

##do it

```javascript
var fdy=require("fdy");
fdy.listen(80);
```

##Settings

Settings including `cache`, `index`, and `directory` were removed as of 2.0.0. Directory now defaults to `./public`

####fdy.on(event, callback)

Handle events. Currently the only event is `"request"`.

- `event` String
- `callback` Function(request, response)

####fdy.header(type, header)

Set headers for specific file mimetypes (ex. `text/plain`) or general types (ex. `text/*`).

- `type` String
- `header` Object

```javascript
fdy.header("image/*", {
    "Cache-Control": "max-age=3600"
    });
```

####fdy.hide(path)

<strike>As of 0.0.1, only allows a single RegExp
<br>As of 1.0.5, functions similarly to `replace`</strike>
<br>As of 2.0.0 (current), only accepts specific path or file names

- `path` String

####fdy.replace(regex, string)

Make changes to path before handling (i.e. `/js/` → `/files/js/`).

- `regex` RegExp | String
- `string` String (Function would also work, as it is a regular `replace`)

####fdy.redirect(regex, string)

Serve 302 to specified path (i.e. `/blog/` → `http://external.blog/`).

- `regex` RegExp | String
- `string` String

####fdy.forbidden(regex, files)

Serve 403 from specified path (if directory, also excludes files by default).

- `regex` RegExp | String
- `files` Boolean (`true` to allow direct file requests such as images)

####fdy.handle(path, callback[, exists])

Manipulate select data before sending it. The first argument determines what requests a handle applies to based on url.

`exists` (default `false`) determines whether a file is expected to already exist (enabling the `data` field in the callback). If false or undefined, the handle is called without loading the file.

- `path` String
- `callback` Function(request, response[, data], query)

##Pages

Currently supports `403`, `404` and `DIR` -- point to files to serve for respective pages. Grabs from `./public` since any external files (such as stylesheets) would have to be public as well.

**app.js**
```javascript
fdy.hide("pages");
fdy.page("403", "pages/forbidden.html");
fdy.page("404", "pages/not-found.html");
fdy.page("DIR", "pages/directory.html");
```

**directory.html**
<br>The directory page uses a special [jht](https://github.com/fooffie/jht) format since its content is dynamic.
```html
<title>index of {path}</title>
<table width="100%">
    <thead>
        <tr>
            <th>File</th>
            <th>Size</th>
            <th>Modified</th>
        </tr>
    </thead>
    <tbody>
        {each files}
            <tr>
                <td><a href="{path}">{name}</a></td>
                <td>{size}</td>
                <td>{date}</td>
            </tr>
        {/each}
    </tbody>
</table>
```

##Help, stuff broke!

There have been significant changes with each update and for the sake of moving forward backwards compatibility has not been a huge concern. You can use a previous version or just rename a few functions in your code (i.e. `fdy.set` became `fdy.page`). Your biggest burden is probably going to be updating your custom `DIR` template if you have one, and for that I apologize.