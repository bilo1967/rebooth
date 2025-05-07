# How to setup a PeerJS server

You can setup your own PeerJS server, use an existing one or create a free test instance on some cloud services.

## Setup your own PeerJS server

Since PeerJS is not very efficient in handling encrypted connections, we want to handle SSL with Apache and route the wss traffic to our local PeerJS server listening for unencrypted ws on a TCP port (9000 in our example). This is an example setup for a PeerJS server (listening on localhost at port 9000) proxyed by an Apache virtual host handling SSL on an Ubuntu system where we're logged as the unprivileged user pippo. Both PeerJS server and Apache are running on the same server. We suppose we have a valid DNS host mypeerjs.host.tld for our peerjs server.

First of all we install and (manually) run the PeerJS server listening to ws protocol on localhost at port 9000
```bash
[pippo@localhost ~]$ sudo mkdir /opt/peerjs-server
[pippo@localhost ~]$ chown pippo /opt/peerjs-server 
[pippo@localhost ~]$ cd /opt/peerjs-server
[pippo@localhost ~]$ npm install peer
[pippo@localhost ~]$ node node_modules/peer/bin/peerjs --port 9000 --key peerjs --path / --proxied
Started PeerServer on ::, port: 9000, path: / (v. 0.6.1)
```
Now we need to configure an apache virtual host. This is our /etc/apache2/sites-available/mypeerjs.host.tld-le-ssl.conf file, enabling a virtual host for mypeerjs.host.tld on our web server. See [here](https://stackoverflow.com/questions/27526281/websockets-and-apache-proxy-how-to-configure-mod-proxy-wstunnel) for details about the Apache mod_rewrite black magic. We also have a valid SSL certificate obtained via letsencrypt.
```apache
<IfModule mod_ssl.c>
<VirtualHost *:443>
  ServerName mypeerjs.host.tld

  ProxyPreserveHost On
  ProxyRequests Off

  RewriteEngine On

  # Allow for upgrading to websockets (should work for Apache >= v2.2)
  #
  # The HTTP upgrade header can be used to upgrade an already established client/server
  # connection to a different protocol (over the same transport protocol). Here we want
  # to upgrade to to the websocket protocol (ws).
  #
  # (Apache rewrite flags:  P=proxy, NC=no-case-sensitive, L=last rule)

  # When socket.io wants to initiate a WebSocket connection, it sends an "upgrade: websocket"
  # request header that should be transferred to ws:// which will be handled by the PeerJS
  # server which is listening on port 9000 (or whatever you've set).
  RewriteCond %{HTTP:Upgrade} =websocket               [NC]
  RewriteRule /(.*)           ws://localhost:9000/$1   [P,L]

  # Quick and dirty: route anything else to port 9000 using HTTP
  RewriteCond %{HTTP:Upgrade} !=websocket [NC]
  RewriteRule /(.*)           http://localhost:9000/$1 [P,L]

  # Optional: route all traffic at / to port 9000
# ProxyPass "/" "http://localhost:9000/"
# ProxyPassReverse "/" "http://localhost:9000/"
# ProxyPass "/" "ws://localhost:9000/peerjs"
# ProxyPassReverse "/" "ws://localhost:9000/peerjs"

  SSLCertificateFile /etc/letsencrypt/live/mypeerjs.host.tld/fullchain.pem
  SSLCertificateKeyFile /etc/letsencrypt/live/mypeerjs.host.tld/privkey.pem
  Include /etc/letsencrypt/options-ssl-apache.conf
  
</VirtualHost>
</IfModule>
```
Once we've created this file we enable the needed apache modules, we enable the site and then reload apache.
```bash
[pippo@localhost ~]$ sudo a2enmod proxy
[pippo@localhost ~]$ sudo a2enmod proxy_http
[pippo@localhost ~]$ sudo a2enmod proxy_wstunnel
[pippo@localhost ~]$ sudo a2ensite mypeerjs.host.tld
[pippo@localhost ~]$ sudo systemctl reload apache2
```
The PeerJS server should now respond on standard port 443.
```bash
[pippo@localhost ~]$ wget -O /tmp/out.json https://mypeerjs.host.tld
[pippo@localhost ~]$ cat /tmp/out.json
{
  "name":"PeerJS Server",
  "description":"A server side element to broker connections between PeerJS clients.",
  "website":"https://peerjs.com/"
}
```
Now we can modify our [config/config.js](config/config.js) file to use our PeeJS server...

```javascript
...
// DITLab server
const PeerJSConfig = {
    secure: true,
    path: '/',
    host: 'mypeerjs.host.tld',
    port: 443, // <= TCP
    config: {
        'iceServers': [
            { urls: 'stun:stun.l.google.com:19302'  }, // <= UDP
            ...
```
Note that we've started the PeerJS server instance manually. In a production environment we should create a startup script to load it automatically at system start. For example, we could create the following `/lib/systemd/system/peerjs-server.service` file:
```ini
[Unit]
Description=PeerJS Server
After=network.target

[Service]
Type=simple
User=www-data
ExecStart=/usr/bin/node /opt/peerjs-server/node_modules/peer/bin/peerjs \
                        --timeout 2500 \
                        --port 9000 \
                        --key peerjs \
                        --path / \
                        --proxied
Restart=on-failure
KillSignal=SIGKILL

[Install]
WantedBy=multi-user.target
```
This way we can start/stop our PeerJS server with systemctl as any other server:
```bash
[pippo@localhost ~]$ # Start server
[pippo@localhost ~]$ sudo systemctl start peerjs-server
[pippo@localhost ~]$ # Watch server status
[pippo@localhost ~]$ sudo systemctl status peerjs-server
[pippo@localhost ~]$ # Stop server
[pippo@localhost ~]$ sudo systemctl stop peerjs-server
[pippo@localhost ~]$ # Enable server at system startup
[pippo@localhost ~]$ sudo systemctl enable peerjs-server
```
Anything in this appendix could be done much better. This is just a quick start guide for a PeerJS server.



## Use an existing PeerJS server or create a free test one on some cloud service

You may try the default PeerJS server, hoping it's not overloaded or over-quota. Just leave secure, path, host, port keys empty for PeerJSConfig in your [config.js](/config/config.js) file:
```js
...
const PeerJSConfig = {
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            ...
        }
    }
}

```
You can also easily create one using a free account on some cloud service, like Heroku. Just Google "deploy peerjs server on heroku" and follow the directions. Your peerjs server will be online in minutes (it will actually take longer to create the account than the server). I don't know what load you'll be able to handle for free, but it will definitely be good enough for a quick test.
