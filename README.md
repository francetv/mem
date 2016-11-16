Minimalist event manager
=========

This module defines a minimalist event manager

Reminder
--------------

Update the package.json main file when all the packages that require this one will be in CommonJS too
"main": "mem.min.js" -> "main": "./src/mem.js"

Installation
--------------
This library has been declined in a npm module so in order to use it just add it to your project's package.json dependencies :

```json
"dependencies": {
    ...
    "mem": "https://github.com/francetv/mem.git"
    ...
}
```

How to use it
--------------

This library implements AMD so in order to import it follow this :

```javascript
require.config({
    ...
    paths: {
        'mem': './bower_components/mem/mem.min.js'
    }
})
require(['mem', ...], function (mem, ...) {
    ...
});
```

