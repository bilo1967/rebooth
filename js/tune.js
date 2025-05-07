/**
 * Class representing a tune (audio effect) that can be pre-loaded and
 * then played (and stopped) more times, as needed.
 *
 * It uses the Web Audio API for precise control over audio playback.
 *
 * @class 
 */

class Tune {
    /**
     * Create a Tune.
     * @param {string} tunePath - The path to the audio file.
     * @param {boolean} [loop=false] - Whether the audio should loop.
     */    
    buffer = null;
    sourceNode = null; // To keep track of the currently playing node
    
    constructor(tunePath, loop = false) {
        
        this.tunePath = tunePath;
        this.loop = loop;

        this.buffer = null;
        this.sourceNode = null; 
        
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.mediaStreamDestination = this.ctx.createMediaStreamDestination();
        this.gainNode = this.ctx.createGain();
        this.gainNode.connect(this.mediaStreamDestination);
        
        this.audioElement = new Audio();
        this.audioElement.srcObject = this.mediaStreamDestination.stream;
        //this.audioElement.autoplay = true;
        
        

        this.promise = new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            req.responseType = "arraybuffer";

            req.onload = () => {
                this.ctx.decodeAudioData(req.response, (buffer) => {
                    this.buffer = buffer;
                    resolve(this);
                }, (error) => {
                    reject("Error while decoding sound effect " + tunePath + ": " + error);
                });
            };

            req.onerror = () => {
                reject("Error while loading sound effect " + tunePath);
            };

            req.open("GET", tunePath, true);
            req.send();
        });
    }

    /**
     * Play the loaded audio.
     * @returns {Promise} - A promise which is fullfilled if the sound starts playing, rejected otherwise.
     */
    play(sinkId = false) {
        return new Promise(  (res, rej) => {
            if (this.buffer) {
                this.sourceNode = this.ctx.createBufferSource();
                this.sourceNode.buffer = this.buffer;
                this.sourceNode.connect(this.gainNode);
                this.sourceNode.loop = this.loop;
                this.sourceNode.start();
                if (sinkId !== false) {
                    if (sinkId == null || sinkId == '') sinkId = 'default';
                    this.audioElement.setSinkId(sinkId).then(() => {
                        this.audioElement.play();
                        res();
                    }).catch((error) => {
                        console.log('Error setting sink ID:', error);
                        rej(error);
                    });
                } else {
                    this.audioElement.play();
                    res();
                }
            } else {
                console.log("Audio buffer is not yet loaded.");
                rej("Audio buffer is not yet loaded.");
            }
        });
    }

    /**
     * Stop the currently playing audio.
     * @returns {boolean} - True if the audio was stopped successfully, false if no audio was playing.
     */
    stop() {
        if (this.sourceNode) {
            this.sourceNode.stop();
            this.sourceNode.disconnect();
            this.sourceNode = null;
            return true;
        } else {
            console.log("Tune: no audio is currently playing.");
            return false;
        }
    }

    /**
     * Set the volume of the audio.
     * @param {number} value - The volume level (0.0 to 1.0).
     */
    set volume(value) {
        this.gainNode.gain.value = value;
    }
}