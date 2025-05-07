<?php

/*
 * Dummy auth module
 * 
 * Anyone with a formally valid email address a fixed password is accepted
 * You shoundn't definitely use this under production
 */

function dummyAuth($user, $password) {
    
    return (filter_var($user, FILTER_VALIDATE_EMAIL) && $password == 'apriti sesamo');
}

?>
