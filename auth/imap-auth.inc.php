<?php

const ServerString = "{your.imap.server.name:993/imap/ssl/novalidate-cert}";
const ImapOpenTimeout = 5; // seconds

function imapAuth($u, $p) {
      
    global $server_string;

    imap_timeout(IMAP_OPENTIMEOUT, ImapOpenTimeout);
    $mbox = @imap_open(
        ServerString,
        $u,
        $p,
        OP_HALFOPEN,                               // Do not open mailboxes
        1,                                         // Try once
        array("DISABLE_AUTHENTICATOR" => "GSSAPI") // Don't use GSSAPI
    );
  
    // Get rid of error messages
    imap_errors();
    imap_alerts();

    if ($mbox) {
        imap_close($mbox);
        $retval = true;
    } else {
        $retval = false;
    }
  
    return $retval;
}

?>
