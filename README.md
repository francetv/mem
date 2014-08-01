Minimalist event manager
=========

This module defines a minimalist event manager


Installation
--------------
This library has been declined in a bower component so in order to use it just add it to your project's bower.json dependencies :

```json
"dependencies": {
    ...
    "mem": "git@gitlab.ftven.net:player/mem.git"
    ...
}
```

How to use it
--------------

This library implements [UMD](http://bob.yexley.net/umd-javascript-that-runs-anywhere/), so you can import it with AMD or browser globals

```javascript
require(['bower_components/mem/mem', ...], function (mem, ...) {
    ...
});
```

or

```html
<script type="text/javascript" src="./bower_components/mem/mem.js" />
```

