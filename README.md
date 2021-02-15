# ReBooth

## Disclaimer

This code is still full of commented parts and debugging instructions and needs to be cleaned up. Also, some of the internal documentation is still in Italian and needs to be translated. Use it at your own risk. We do not take any responsibility for any kind of damage it might cause. That said, once you meet the prerequisites and edit the configuration files accordingly, ReBooth should work as is. Please, read the License section below before downloading ReBooth.

## What is ReBooth and how it works

ReBooth (which stands for _Remote Booth_) is a [WebRTC](https://webrtc.org/) based platform for conference interpreter training. The system connects a teacher and a small group of students (up to 7/8 depending on the hardware quality and the teacher's bandwidth, expecially upstream).

ReBooth WebRTC connections are peer-to-peer and not peer-to-server (no SFU/MCU). There's a single audio/video webrtc connection between the teacher and each student (the connection topology is star shaped). The teacher can communicate one-way to the whole class (class call) or individually talk with each student (intercom). Students can communicate each other only via chat, with text messages transparently routed by the teacher using the webrtc data channel. Audio and binary files, on the other hand, are exchanged using a web server.

To reduce the risk of compromising student activity, ReBooth:
1) Sends the entire audio file to the student's browser before the teacher starts the session or exam. This allows the student to listen to the audio file in its original audio quality, without being affected by any connection problems or drops.
2) Records the student's audio with two separate procedures: on the one hand, it records the audio streaming the teacher receives on their computer and, on the other, it records the student's audio locally on their computer and then sends this audio to the server where ReBooth is hosted.
3) Students can save their recordings and eventually send them to the teacher by other means.

## Prerequisites

- A working [PeerJS server](https://github.com/peers/peerjs-server).
- One or more STUN servers; you may use a free existing one or setup your own (e.g. [CoTURN](https://github.com/coturn/coturn)).
- One or more TURN servers; you may buy access to an existing one or setup your own (e.g. [CoTURN](https://github.com/coturn/coturn)). You may try without a TURN server but users behind a symmetrical NAT won't be able to use ReBooth.
- A web server supporting PHP (≥ 5.5), HTTPS and URL rewriting to host your ReBooth installation. Here I refer to Apache but any other modern web server should be fine.
- A writeable directory on this server to store recordings and temporary data.
- A SMTP server (to send invitations).
- A PHP authentication script to restrict access only to users allowed by your organization: you'll likely have to write your own.

The PeerJS server setting is mandatory. The PeerJS server is used to keep track of active connections. It generates very low network traffic and workload for your server. The authors of PeerJS offer free access to their one, but many people use it and you may find it busy. You may have to set up your own ([https://github.com/peers/peerjs-server](https://github.com/peers/peerjs-server)). 

STUN, TURN (and ICE) are a set of IETF standard protocols for negotiating traversing NATs when establishing peer-to-peer communication sessions. WebRTC and other VoIP stacks implement support for ICE to improve the reliability of IP communications. The PeerJS library used by ReBooth makes it's ICE (Interactive Connectivity Establishment) implementation by coordinating STUN and TURN to make a connection between hosts. A host uses Session Traversal Utilities for NAT (STUN) to discover its public IP address when it is located behind a NAT/Firewall. When this host wants to receive an incoming connection from another party, it provides this public IP address as a possible location where it can receive a connection. If the NAT/Firewall still won't allow the two hosts to connect directly, they make a connection to a server implementing Traversal Using Relay around NAT (TURN), which will relay media between the two parties. 

A STUN server may be enough for testing purposes but you'll definitely need also a TURN server in a production environment.

You can find plenty of free STUN servers. Google provides at least a dozen for free and a few of them are already configured in `config.js` (see below). A TURN server, on the other hand, may have a heavy bandwidth impact on your infrastructure. You may find a free one but it will likely have strong bandwidth restrictions, making it a non viable solution. You need either a commercial TURN service or to set up your own. [CoTURN](https://github.com/coturn/coturn) is an excellent open source TURN (and STUN) implementation, available on most linux distributions.


## Configuration and authentication module

There are two configuration files you have to set up:
- [config/config.js](config/config.js) for the javascript code running on your browser
- [config/config.inc.php](config/config.inc.php) for the PHP scripts running on the server

You'll also need to write your PHP own authentication module.

### config.js

Here you've basically to configure just the javascript access to your PeerJS, STUN and TURN servers.
```js
const PeerJSConfig = {
    host:   'your.peerjs.server', // your peerjs server address
    port:   9443,                 // your peerjs server port
    path:   '/',                  // your peerjs path
    secure: true,                 // your peerjs server uses SSL?
    
    // You may use stun only for testing purposes but if you need to
    // actually reach everyone you definitely need a TURN server...
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


### config.inc.php

ReBooth needs:
1. a SMPT server to send email invitations to students;
1. a few info to correctly generate these invitations;
1. a directory writable by the web server to store teacher's audio files, student's recordings and temporary stuff;
1. private and public key for Google Captcha v2 (optional);
1. instructions on how to access your authentication mudule (see next section).

All of these settings must be done in the [config/config.inc.php](config/config.inc.php) file. See the comments on the file itself for details.


### authentication module

_ReBooth_ is meant to be used within your organization and to authenticate users via your infrastructure. Some examples are provided but no authentication mechanism is actually implemented: you'll have to write your authentication module by your own. In this module you will implement an authentication function accepting a username a a password as parameters which returns _true_ if the authentication succeeds, _false_ otherwise. The module file has to be placed be in the [auth](auth) directory, where you'll find a few examples you may adapt for your needs. The authentication module file and function name are then set in the [config/config.inc.php](config/config.inc.php) file. 

This is an example dummy authentication module accepting any valid email address as username and 'apriti sesamo' as password.
```php
<?php
    function dummyAuth($user, $password) {
        return (filter_var($user, FILTER_VALIDATE_EMAIL) && $password == 'apriti sesamo');
    }
?>
```

## License

ReBooth is available under the [GNU Affero General Public v3](https://www.gnu.org/licenses/agpl-3.0.html) License. Documentation is available under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) license. 

In brief, this program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as  published by the Free Software Foundation, either version 3 of the  License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but **WITHOUT ANY WARRANTY**; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the [GNU Affero General Public License](https://www.gnu.org/licenses/agpl-3.0.html) for more details.

ReBooth uses several third-party frameworks, libraries and resources:
* [PeerJS](https://peerjs.com/">https://peerjs.com/)
* [JQuery](https://jquery.com/">https://jquery.com/)
* [Bootstrap 4](https://getbootstrap.com/)
* [BootBox JS](http://bootboxjs.com/)
* [JsZip](https://stuk.github.io/jszip/)
* [Moment JS](https://momentjs.com/)
* [Animate.css](https://github.com/animate-css/animate.css)
* [FontAwesome](https://fontawesome.com/)
* [Code snippets from WebRTC Samples](https://webrtc.github.io/samples/)
* [Pure PHP Radius Class](http://developer.sysco.ch/php/)
* [PHP Mailer](https://github.com/PHPMailer/PHPMailer(

