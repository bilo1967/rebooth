/*
 * Adapted from: https://simplycalc.com/crc32-source.php
 *
 * Simple usage:
 *
 * let crc1 = crc32("any string");
 * let crc2 = crc32(anyArrayBuffer); // an arrayBuffer
 * 
 * $('#file-input').on('change', (e) => {
 *     const file = e.target.files[0];
 *     const blob = new Blob([ file ], { type: file.type });
 *     blob.arrayBuffer().then(buf => {
 *         let crc = crc32(buf);
 *         ...
 *     });
 * });
 *
 */

const DefaultPolynomial = 0x04C11DB7;
const ReversedPolynomial = crc32_reverse(DefaultPolynomial);

const crc32 = (data) => { 
    return typeof data == 'string' ? crc32_compute_string(null, data) : crc32_compute_buffer(null, data);
}

function crc32_generate(reversedPolynomial) {

    if (!reversedPolynomial) reversedPolynomial = ReversedPolynomial 

    var table = new Array();
    var i, j, n;

    for (i = 0; i < 256; i++) {
        n = i;
        for (j = 8; j > 0; j--) {
            if ((n & 1) == 1) {
                n = (n >>> 1) ^ reversedPolynomial;
            } else {
                n = n >>> 1;
            }
        }
        table[i] = n;
    }

    return table;
}

function crc32_initial() {
    return 0xFFFFFFFF;
}

function crc32_add_byte(table, crc, byte) {
    crc = (crc >>> 8) ^ table[(byte) ^ (crc & 0x000000FF)];
    return crc;
}

function crc32_final(crc) {
    crc = ~crc;
    crc = (crc < 0) ? (0xFFFFFFFF + crc + 1) : crc;
    return crc;
}

function crc32_compute_string(reversedPolynomial, str) {

    if (!reversedPolynomial) reversedPolynomial = ReversedPolynomial 

    var table = crc32_generate(reversedPolynomial);
    var crc = 0;
    var i;

    crc = crc32_initial();

    for (i = 0; i < str.length; i++) {
        crc = crc32_add_byte(table, crc, str.charCodeAt(i));
    }

    crc = crc32_final(crc);
    return crc;
}



function crc32_compute_buffer(reversedPolynomial, data) {

    if (!reversedPolynomial) reversedPolynomial = ReversedPolynomial 

    var dataView = new DataView(data);
    var table = crc32_generate(reversedPolynomial);
    var crc = 0;
    var i;

    crc = crc32_initial();

    for (i = 0; i < dataView.byteLength; i++) {
        crc = crc32_add_byte(table, crc, dataView.getUint8(i));
    }

    crc = crc32_final(crc);
    return crc;
}

function crc32_reverse(polynomial) {
    var reversedPolynomial = 0;

    for (i = 0; i < 32; i++) {
        reversedPolynomial = reversedPolynomial << 1;
        reversedPolynomial = reversedPolynomial | ((polynomial >>> i) & 1);
    }

    return reversedPolynomial;
}