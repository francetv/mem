Minimalist event manager
=========

This module defines a minimalist event manager

Mem API is minimalist: on, off and trigger. That's all you need.

Mem will handle some special events:
- **error**: mem will catch errors from mem event listeners and trigger an error event on itself. If no listener is attached to mem's error event, this will lead to a native error.
- **orphan_event**: if mem triggers an event without any listener, a "orphan_event" event will be triggered on mem.
- **event_tracked**: The first time any listener is attached to an event
- **event_untracked**: Whenever all listeners are removed from an event


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
