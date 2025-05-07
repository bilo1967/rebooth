# ReBooth

## Disclaimer

This code is still full of commented parts and debugging instructions and needs to be cleaned up. Also, some of the internal documentation is still in Italian and needs to be translated. Use it at your own risk. We do not take any responsibility for any kind of damage it might cause. That said, once you meet the prerequisites and edit the configuration files accordingly, ReBooth should work as is. Please, read the License section below before downloading ReBooth.

## What is ReBooth and how it works

ReBooth (which stands for _Remote Booth_) is a [WebRTC](https://webrtc.org/) based platform for conference interpreter training, conceived and developed for the Department of Interpretation and Translation (DIT) at the University of Bologna by Gabriele Carioli and Nicoletta Spinolo.

The system connects an instructor and a small group of students (up to 10/12 depending on the hardware quality and the instructor's bandwidth, expecially upstream).

ReBooth WebRTC connections are peer-to-peer and not peer-to-server (no SFU/MCU). There's a single audio/video WebRTC connection between the instructor and each student (the connection topology is star shaped). The instructor can individually talk with each student ("talk to booth") or communicate one-way with the whole class (class call mode). In _class call_ mode the instructor can talk to a booth, whose audio is broadcasted to the other booths (each booth can talk at a time). Students can communicate each other only via chat, with text messages transparently routed by the instructor using the WebRTC data channel. Media and binary files, on the other hand, are exchanged using a web server.

To reduce the risk of compromising student activity, ReBooth:
1) Sends the entire media file to the student's browser before the instructor starts the session or exam. This allows the student to listen to the media file in its original quality, without being affected by any connection problems or drops.
2) Records the student's audio with two separate procedures: on the one hand, it records the audio streaming the instructor receives on their computer and, on the other, it records the student's audio locally on their computer and then sends this audio to the server where ReBooth is hosted.
3) Students can save their recordings and eventually send them to the instructor by other means.

## Prerequisites

- A working [PeerJS server](https://github.com/peers/peerjs-server). See [README-PEERJS.md](/README-PEERJS.md) for a hint.
- One or more STUN servers; you may use a free existing one or setup your own (e.g. [CoTURN](https://github.com/coturn/coturn)).
- One or more TURN servers; you may buy access to an existing one or set up your own (e.g. [CoTURN](https://github.com/coturn/coturn)). You may try without a TURN server but users behind a symmetrical NAT (and in general depending on their router and firewall setup) won't be able to use ReBooth.
- A web server supporting PHP (≥ 5.5, with modules php-zip and php-mbstring enabled), HTTPS and URL rewriting to host your ReBooth installation. Here I refer to Apache but any other modern web server should be fine.
- A writeable directory on this server to store recordings and temporary data.
- A SMTP server to send invitations (optional but recommended  ).
- A PHP authentication script to restrict access only to users allowed by your organization: you'll likely have to write your own.


Having a [PeerJS server](https://github.com/peers/peerjs-server) is mandatory. The PeerJS server lets users find each other by keeping track of their connections. It basically just stores IP addresses of connected users and a hash of their usernames. 
No peer-to-peer data is routed through the server, which acts only as a connection broker. Therefore it generates very low network traffic and workload for your hardware and infrastructure.
The authors of PeerJS offer free access to their PeerJS server, but many people use it and you may find it busy: you'll likely need to deploy your own. See [README-PEERJS.md](/README-PEERJS.md) for a quick start guide.

STUN, TURN (and ICE) are a set of IETF standard protocols for negotiating traversing NATs when establishing peer-to-peer communication sessions. WebRTC and other VoIP stacks implement support for ICE to improve the reliability of IP communications. The PeerJS library used by ReBooth makes it's ICE (Interactive Connectivity Establishment) implementation by coordinating STUN and TURN to make a connection between hosts. A host uses Session Traversal Utilities for NAT (STUN) to discover its public IP address when it is located behind a NAT/Firewall. When this host wants to receive an incoming connection from another party, it provides this public IP address as a possible location where it can receive a connection. If the NAT/Firewall still won't allow the two hosts to connect directly, they make a connection to a server implementing Traversal Using Relay around NAT (TURN), which will relay media between the two parties. 

A STUN server may be enough for testing purposes but you'll definitely also need a TURN server in a production environment.

You can find plenty of free STUN servers. Google provides at least a dozen for free and a few of them are already configured in `config.js` (see below). A TURN server, on the other hand, may have a heavy bandwidth impact on your infrastructure. You may find a free one but it will likely have strong bandwidth restrictions, making it a non viable solution. You need either a commercial TURN service or to set up your own. [CoTURN](https://github.com/coturn/coturn) is an excellent open source TURN (and STUN) implementation, available on most linux distributions.

If you setup your own STUN, TURN or PeerJS server, be sure that their ports are not blocked by your firewall for inbound connections (expecially PeerJS which may not use a standard port). Also, verify that you can access those ports from your location.

Once you have your working PeerJS server and access to at least a STUN and a TURN server, you can download the ReBooth webroot from GitHub, set up the configuration files and have your ReBooth installation served by a webserver.

## Installation

Create a webroot directory and deploy rebooth into it.
Create the rebooth data directory and give the web server write permissions onto it.

```bash
[you@localhost ~]$ sudo mkdir /var/www/virtualhosts/your_site_webroot
[you@localhost ~]$ cd /var/www/virtualhosts/your_site_webroot
[you@localhost ~]$ sudo git clone https://github.com/bilo1967/rebooth.git .
[you@localhost ~]$ sudo mkdir /var/www/data/your_data_dir
[you@localhost ~]$ sudo chown www-data /var/www/data/your_data_dir
```

Then configure your web server so that it will serve your rebooth webroot directory as https://your.site/ (or whatever).

URL rewriting must be also enabled so that the extension for php scripts and html pages is removed. See [.htaccess](.htaccess) file.


## Upgrading

Basically you need to get the new version of ReBooth from GitHub (just do a ```git clone https://github.com/bilo1967/rebooth.git``` in a temporary directory) and replace everything on your webroot except your configuration files (always check for additions or changes), authentication scripts, and any images you may have replaced or customized. Always make a backup copy of your webroot before trying an upgrade.


## Configuration and authentication module

There are two configuration files you have to set up:
- [config/config.js](config/config.js) for the javascript code running on your browser
- [config/config.inc.php](config/config.inc.php) for the PHP scripts running on the server

You will also need to write your PHP own authentication module.

### config.js

Here you basically just have to configure the javascript access to your PeerJS, STUN and TURN servers.
```js
const PeerJSConfig = {
    host:   'your.peerjs.server', // your peerjs server address
    port:   9443,                 // your peerjs server port
    path:   '/',                  // your peerjs path
    secure: true,                 // your peerjs server uses SSL?
    
    // You may use a STUN-only configuration for testing purposes but if you need
    // to actually reach (mostly) everyone you definitely need also a TURN server...
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
//          { urls: 'turn:numb.viagenie.ca', username: 'webrtc@live.com', credential: 'muazkh'},
//          { urls: 'turn:0.peerjs.com:3478', username: 'peerjs', credential: 'peerjsp' },
        ]
    },
};
```
At the moment you can leave any other setting as is.

In the provided configuration file there are public STUN servers but no TURN server so, depending on user's router and firewall setup, it might not always be possible to connect to ReBooth.


### config.inc.php

ReBooth needs:
* a SMPT server to send email invitations to students;
* a few info to correctly generate these invitations;
* a directory writable by the web server to store instructor's media files, student's recordings and temporary stuff;
* private and public key for Google Captcha v2 (optional);
* instructions on how to access your authentication mudule (see next section).

All of these settings must be implemented in the [config/config.inc.php](config/config.inc.php) file. See the comments on the file itself for details.


### Authentication module

_ReBooth_ is meant to be used within your organization and to authenticate users via your infrastructure. Some examples are provided but no authentication mechanism is actually implemented: you will have to write your authentication module by your own. In this module you will implement an authentication function accepting a username and a password as parameters which returns _true_ if the authentication succeeds, _false_ otherwise. The module file has to be placed be in the [auth](auth) directory, where you'll find a few examples that you may adapt to your needs. The authentication module file and function name are then set in the [config/config.inc.php](config/config.inc.php) file. 

This is an example dummy authentication module accepting any valid email address as username and 'apriti sesamo' as password.
```php
<?php
    function dummyAuth($user, $password) {
        return (filter_var($user, FILTER_VALIDATE_EMAIL) && $password == 'apriti sesamo');
    }
?>
```

In the [auth directory](/auth) there are a couple of example modules with radius and imap authentication. You may adapt them to fit your needs by setting the value of a few constants at the beginning of each module.

There's also a [guest-auth.inc.php](auth/guest-auth.inc.php) authentication module wich implements a basic local authentication system. Credentials are retrieved from a JSON file which is stored into the data directory and managed using a command line [helper php script located in the bin directory](bin/guest.php). Run the script without parameters to get help. Users can be added, deleted, modified. For each of them it is possible to set a username, a password and an account expiry (in days).

In this case you would set something like this into your config.inc.php file:

```php
    "auth_module"               => 'guest-auth.inc.php',
    "auth_function"             => 'guestAuth',
    "auth_description"          => 'Insert your credentials to log in',
    "auth_username_placeholder" => 'type your username',
    "auth_password_placeholder" => 'type your password',
```

You may combine modules to implement a cascade authentication system. See [auth/local-auth.inc.php](auth/local-auth.inc.php) as an example.


## License

ReBooth is available under the [GNU Affero General Public v3](https://www.gnu.org/licenses/agpl-3.0.html) License. 

In brief, this program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as  published by the Free Software Foundation, either version 3 of the  License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but **WITHOUT ANY WARRANTY**; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the [GNU Affero General Public License](https://www.gnu.org/licenses/agpl-3.0.html) for more details.

Documentation is available under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) license. 

ReBooth uses several third-party frameworks, components, libraries and resources:
* [PeerJS](https://peerjs.com/">https://peerjs.com/)
* [JQuery](https://jquery.com/">https://jquery.com/)
* [Bootstrap 4](https://getbootstrap.com/)
* [Toastr](https://codeseven.github.io/toastr/)
* [BootBox JS](http://bootboxjs.com/)
* [JsZip](https://stuk.github.io/jszip/)
* [Animate.css](https://github.com/animate-css/animate.css)
* [FontAwesome](https://fontawesome.com/)
* [Code snippets from WebRTC Samples](https://webrtc.github.io/samples/)
* [PHP Mailer](https://github.com/PHPMailer/PHPMailer)
* [JSCookie](https://github.com/js-cookie/js-cookie)
* [Moment JS](https://momentjs.com/)
