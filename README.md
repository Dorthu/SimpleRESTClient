# SimpleRESTClient

Tired of using curl for testing your RESTful services?  Me too.  That's why this is here.

# How do I use it?

Clone this repo and open index.html - the ReST should take care of itself.

### Q: That's way too much work!

A: How about loading it on [my site](http://webapps.dorthugames.com/SimpleRESTClient/index.html) instead?

# How it Works

Ajax, basically.

# CORS

Since this is ajax, your server must [enable CORS](http://enable-cors.org/).  It's as simple as setting a few headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Max-Age: 1728000
Access-Control-Allow-Headers: *
```

There are others that might be important for you as well.

## I can't modify the server!

Yikes, that sucks.  I made this for testing my own projects, so it was never really a problem.