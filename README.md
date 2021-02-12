# reBooth

## Disclaimer:

The code is still full of commented parts and debugging instructions and needs to be cleaned up. Also, some of the internal documentation is still in Italian and needs to be translated. Use it at your own risk. We do not take any responsibility for any kind of damage it might cause. That said, once you meet the prerequisites, rebooth should work as is.

## Prerequisites:

- a [PeerJS server](https://github.com/peers/peerjs-server);
- one or more STUN servers; you may use a free existing one or setup your own (e.g. [CoTURN](https://github.com/coturn/coturn));
- one or more TURN servers; you may buy access to an existing one or setup your own (e.g. [CoTURN](https://github.com/coturn/coturn));
- a SMTP server (to send invitations);
- a web server with PHP (≥ 5.5) and HTTPS to host your rebooth implementation (here I refer to Apache but any other server supporting PHP, HTTPS and URL rewriting should be fine);
- a writeable directory on this server to store recordings and temporary data;
- a PHP authentication module (you'll have to write your own).


## Configuration and authentication module:

There are two configuration files you have to set up:
- [config/config.js](config/config.js) for the javascript code running on your browser
- [config/config.inc.php](config/config.inc.php) for the PHP scripts running on the server

You'll also need to write your PHP own authentication module.

### Authentication module

_reBooth_ is meant to be used within your organization and to authenticate users via your infrastructure. Some examples are provided but no authentication mechanism is actually implemented: you'll have to write your authentication module by your own. In this module you will implement an authentication function accepting a username a a password as parameters which returns _true_ if the authentication succeeds, _false_ otherwise. The module file has to be placed be in the [auth](auth) directory, where you'll find a few examples you may adapt for your needs. The authentication module file and function name are then set in the [config/config.inc.php](config/config.inc.php) file. 

This is an example dummy authentication module accepting any valid email address as username and 'apriti sesamo' as password.
```php
<?php
    function dummyAuth($user, $password) {
        return (filter_var($user, FILTER_VALIDATE_EMAIL) && $password == 'apriti sesamo');
    }
?>
```
