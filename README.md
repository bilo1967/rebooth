# ReBooth

## Disclaimer

This code is still full of commented parts and debugging instructions and needs to be cleaned up. Also, some of the internal documentation is still in Italian and needs to be translated. Use it at your own risk. We do not take any responsibility for any kind of damage it might cause. That said, once you meet the prerequisites and edit the configuration files accordingly, ReBooth should work as is.

## What is ReBooth and how it works

ReBooth (which stands for _Remote Booth_) is a [WebRTC](https://webrtc.org/) based platform for conference interpreter training. The system connects a teacher and a group of students (about 6/7; the exact number of students depends on the hardware quality and the teacher's connection).

There's a single audio/video webrtc connection between the teacher and each student (the connection topology is star shaped). The teacher can communicate one-way to the whole class (class call) or individually talk with each student (intercom). Students can communicate each other only via chat, with text messages transparently routed by the teacher using the webrtc data channel. Audio and binary files, on the other hand, are exchanged using a web server.

To reduce the risk of compromising student activity, ReBooth:
1) Sends the entire audio file to the student's browser before the teacher starts the session or exam. This allows the student to listen to the audio file in its original audio quality, without being affected by any connection problems or drops.
2) Records the student's audio with two separate procedures: on the one hand, it records the audio streaming the teacher receives on their computer and, on the other, it records the student's audio locally on their computer and then sends this audio to the server where ReBooth is hosted.
3) Students can save their recordings and eventually send them to the teacher by other means.

## Prerequisites

- A [PeerJS server](https://github.com/peers/peerjs-server);
- One or more STUN servers; you may use a free existing one or setup your own (e.g. [CoTURN](https://github.com/coturn/coturn)).
- One or more TURN servers; you may buy access to an existing one or setup your own (e.g. [CoTURN](https://github.com/coturn/coturn)). You may try without a TURN server but users behind a symmetrical NAT won't be able to use ReBooth.
- A web server supporting PHP (≥ 5.5), HTTPS and URL rewriting to host your ReBooth installation. Here I refer to Apache but any other modern web server should be fine.
- A writeable directory on this server to store recordings and temporary data.
- A SMTP server (to send invitations).
- A PHP authentication script to restrict access only to users allowed by your organization: you'll likely have to write your own.

## Configuration and authentication module

There are two configuration files you have to set up:
- [config/config.js](config/config.js) for the javascript code running on your browser
- [config/config.inc.php](config/config.inc.php) for the PHP scripts running on the server

You'll also need to write your PHP own authentication module.

_ReBooth_ is meant to be used within your organization and to authenticate users via your infrastructure. Some examples are provided but no authentication mechanism is actually implemented: you'll have to write your authentication module by your own. In this module you will implement an authentication function accepting a username a a password as parameters which returns _true_ if the authentication succeeds, _false_ otherwise. The module file has to be placed be in the [auth](auth) directory, where you'll find a few examples you may adapt for your needs. The authentication module file and function name are then set in the [config/config.inc.php](config/config.inc.php) file. 

This is an example dummy authentication module accepting any valid email address as username and 'apriti sesamo' as password.
```php
<?php
    function dummyAuth($user, $password) {
        return (filter_var($user, FILTER_VALIDATE_EMAIL) && $password == 'apriti sesamo');
    }
?>
```
