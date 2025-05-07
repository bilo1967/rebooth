<?php
define('CHUNK_SIZE', 1024*1024); // Size (in bytes) of tiles chunk

// Read a file and display its content chunk by chunk
function readfile_chunked($filename, $retbytes = TRUE) {
    $buffer = '';
    $cnt    = 0;
    $handle = fopen($filename, 'rb');

    if ($handle === false) {
        return false;
    }

    while (!feof($handle)) {
        $buffer = fread($handle, CHUNK_SIZE);
        echo $buffer;
        ob_flush();
        flush();

        if ($retbytes) {
            $cnt += strlen($buffer);
        }
    }

    $status = fclose($handle);

    if ($retbytes && $status) {
        return $cnt; // return num. bytes delivered like readfile() does.
    }

    return $status;
}

function valid_filename($filename) {
    
    if (strlen($filename) > 255) { // no mb_* since we check bytes
        return false;
    }

    if (false !== strpbrk($filename, '|\'\\?*&<";:>+[]=/')) {
        return false;
    }

    return true;
}

?>
