#!/usr/bin/php
<?php
    /*
     * Use this php script via command line to handle guest-auth module accounts
     *
     * Example: php guest.php --list
     */

    require_once dirname(__FILE__) . "/../config/config.inc.php";

    function randomPwd() {
        $permitted_chars = '0123456789abcdefghijklmnopqrstuvwxyz';
        return substr(str_shuffle($permitted_chars), 0, 8);
    }


    $pwdfile = $CONFIG['data_path'] . "/rebooth.guests.json";

    $shortopts  = "u:p:e:dl";
//  $shortopts .= "r:";  // Required value
//  $shortopts .= "o::"; // Optional value
//  $shortopts .= "abc"; // These options do not accept values

    $longopts  = array(
        "user:",   // Required value
        "pass:",   // Required value
        "expiry:", // Required value
//      "opt::",   // Optional value
        "delete",  // No value
        "list"     // No value
    );
    $options = getopt($shortopts, $longopts);

    if (isset($options['user'])) $options['u'] = $options['user'];
    if (isset($options['pass'])) $options['p'] = $options['pass'];
    if (isset($options['expiry'])) $options['e'] = $options['expiry'];
    if (isset($options['delete'])) $options['d'] = true;
    if (isset($options['list'])) $options['l'] = true;

    $user =  isset($options['u']) ? strtolower($options['u']) : false;
    $pass =  isset($options['p']) ? $options['p'] : false;
    $expiry = isset($options['e']) ? time() + intval($options['e']) * 3600 * 24 : false;
    $delete = isset($options['d']);
    $list = isset($options['l']);

    $ok = $list && $delete == false ||
          $delete && $user && $list == false ||
          $user && ($pass || $expiry) && $delete == false && $list == false;

    if (!$ok) { 
        echo "Usage: " . basename($argv[0]) . " -u username -p password [-e days] " . PHP_EOL;
        echo "       (add or update guest info)" . PHP_EOL . PHP_EOL;
        echo "       " . basename($argv[0]) . " -d -u username" . PHP_EOL;
        echo "       (delete guest)" . PHP_EOL . PHP_EOL;
        echo "       " . basename($argv[0]) . " -l" . PHP_EOL;
        echo "       (list guests)" . PHP_EOL . PHP_EOL;
        echo "Options:" . PHP_EOL;
        echo "    -u username: specify username" . PHP_EOL;
        echo "    -p password: specify a password (unencrypted, use - to generate a random one)" . PHP_EOL;
        echo "    -e days: specify credentials expiry in days from now (default=7, 0=expire now)" . PHP_EOL;
        echo "    -d: delete guest specified by -u" . PHP_EOL;
        echo "    -l: list guests" . PHP_EOL;
        echo "    --user username: same as -u" . PHP_EOL;
        echo "    --pass password: same as -p" . PHP_EOL;
        echo "    --expiry days: same as -e" . PHP_EOL;
        echo "    --delete: same as -d" . PHP_EOL;
        echo "    --list: same as -l" . PHP_EOL;
        exit(1);
    }

    $content = @file_get_contents($pwdfile);

    $users = ($content == false) ? array() : json_decode($content, true);

    if ($list) {
        printf("%-40s %-5s %s". PHP_EOL, "GUEST", "PASS", "EXPIRY"); 
        foreach ($users as $u => $r) {
            $e = ($r['expiry'] <= time()) ? "expired" : date("Y-m-d H:i:s", $r['expiry']);
            $h = $r['hash'] ? "ok" : "unset";
            printf("%-40s %-5s %s". PHP_EOL, $u, $h, $e); 
        }
        exit(0);
    } else if ($delete) {
        if (isset($users[$user])) unset($users[$user]);
    } else {
        if (!isset($users[$user])) {
            $users[$user] = array('hash' => null, 'expiry' => time() + 7*24*3600);
        }
        if ($pass) {

            if ($pass == '-') {
                $pass = randomPwd();
                echo "u:$user p:$pass\n";
            }

            $users[$user]['hash'] = password_hash($pass, PASSWORD_DEFAULT);
        }
        if ($expiry) {
            $users[$user]['expiry'] = $expiry;
        }
    }

    //echo password_verify($pass, $hash);
    //echo "\n";

    file_put_contents($pwdfile, json_encode($users,  JSON_PRETTY_PRINT));

?>
