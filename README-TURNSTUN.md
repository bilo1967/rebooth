#### eturnal STUN/TURN server ####

[eturnal](https://eturnal.net/) is a clean, scalable STUN and TURN server, available either for Unix-like operating systems and Microsoft Windows. 

You can either build it from source or install the binary packages you can find on [https://eturnal.net/](https://eturnal.net/).

Here is an example `/etc/eturnal.yml` configuration file for the eturnal TURN/STUN server.

```yml
eturnal:
  # Default settings are omitted

  # Shared secret for deriving temporary TURN credentials (default: $RANDOM):
  secret: "this is a secret"

  # The server's public IPv4 address (default: autodetected):
  relay_ipv4_addr: "10.0.1.7"

  # In this example, the server is listening on port 443, which may 
  # mitigate firewall problems with some particularly security 
  # restrictive institutions
  listen:
    -
      ip: "10.0.1.7"
      port: 443
      transport: udp
    -
      ip: "10.0.1.7"
      port: 443
      transport: auto     # tcp o tls

  # TLS certificate and key files.  They *MUST* be readable by 'eturnal'
  # user. This can be a problem with LetsEncrypt generated private key,
  # which are readable only by root. 
  # I suggest to add a crontab line to copy cert+key once a day and to
  # correctly set permissions.
  tls_crt_file: /opt/eturnal/tls/fullchain.pem
  tls_key_file: /opt/eturnal/tls/privkey.pem

  # Reject TURN relaying to the following addresses/networks:
  blacklist_peers:
    - recommended           # Expands to various addresses/networks recommended

  #
  # Logging configuration:
  #
   
  log_level: info           # critical | error | warning | notice | info | debug
  log_rotate_size: 10485760 # 10 MiB (default: unlimited, i.e., no rotation).
  log_rotate_count: 10      # Keep 10 rotated log files.

  modules:
    mod_log_stun: {}        # Log STUN queries (in addition to TURN sessions).

  # Realm
  realm: your.doma.in       # Change to your realm/domain

  # Some user here...
  credentials:
    intrain: apassword
    rebooth: anotherpassword
```

#### CoTURN STUN/TURN server

CoTURN is a well known and stable STUN/TURN server and is present in almost any linux server distribution. On Ubuntu, you can install it with:

```bash
sudo apt install coturn
```

Here is an example `/etc/turnserver.conf` configuration file for the CoTURN server.

```cnf
# No connections on plain text port
# Connect only through TLS/TCP and DTLS/UDP port
no-tcp
no-udp

# TLS/DTLS port
tls-listening-port=5349

# Listening address
listening-ip=10.0.1.8

# Use fingerprints in the TURN messages.
# You may comment this line
fingerprint

# Use long-term credential mechanism
lt-cred-mech

# Some credentials here..
user=ditlab:apassword
user=rebooth:anotherpassword

# Realm. Change to yours
realm=your.doma.in 

# Path to certificate and private key
cert=/etc/letsencrypt/live/your.doma.in/fullchain.pem
pkey=/etc/letsencrypt/live/your.doma.in/privkey.pem

# Allowed OpenSSL cipher list for TLS/DTLS connections.
# Default value is "DEFAULT".
cipher-list="DEFAULT"

# Log output to system log (syslog).
syslog
# You may want to comment the previous line and log to file
# log-file=/var/tmp/turn.log

# Mobility with ICE (MICE) specs support
mobility

# The server runs with this user and group
proc-user=turnserver
proc-group=turnserver

# CLI access password
cli-password=onemorepassword
```
