/*
*   Cose da provare:
*   caricare il MediaStream di una webcam in un tag video,
*   usare un altro mediastream come fonte, 
*/


// const mimeType = { 'type' : 'audio/ogg; codecs=opus' } ; 


// This should work always, either for Chrome and for Firefox
// by default we get only audio
const mimeType = {mimeType: 'audio/webm'};

class MyRecorder {

    mediaRecorder  = null;
    mediaStream    = null;
    objectURL      = null;
    recordedChunks = [];
    getBlobOnStop  = null;
    type           = null;
    
    
    // if no getBlobOnStop callback is passed, then the stop() method will
    // return a promise with the recorded blob and an objectURL to download it
    constructor(stream, getBlobOnStop = null, type = mimeType) {
        if (! stream instanceof  MediaStream) throw Error("stream is not a MediaStream");
        if(! 'mimeType' in type) throw Error("Wrong mime type");
        if (getBlobOnStop != null && typeof getBlobOnStop !== 'function') throw Error("getBlobOnStop is not a function");
        
        this.getBlobOnStop = getBlobOnStop;
        this.type = type;

        // If audio only is required and the argument stream has a video track, 
        // we create another MediaStream getting only the first audio track.
        // Otherwise we use the original stream
        if (type.mimeType.startsWith('audio') && stream.getVideoTracks().length > 0) {
            // Audio only
            this.mediaStream = new MediaStream();
            this.mediaStream.addTrack(stream.getAudioTracks()[0]);
        } else {
            // Whatever
            this.mediaStream = stream;            
        }
        
        this.mediaRecorder = new MediaRecorder(this.mediaStream, this.type);
        
        // If we have a callback the onstop event is handled here
        // Otherwise it's handled in the stop() method to resolve
        // the promise
        if (this.getBlobOnStop) {
            this.mediaRecorder.onstop = () => {
                this.getBlobOnStop(new Blob(this.recordedChunks, this.type));
            }
        }

        // We add a chunk of data to our buffer whenever available
        this.mediaRecorder.ondataavailable = (v) => {
            if (v.data.size > 0) {
                this.recordedChunks.push(v.data);
            }
        };

    }


    stop() {

        // if a callback has been set we just request all data and stop
        // the recorder and the callback will be fired when everything
        // is ready. Otherwise we return a Promise which will be resolved
        // when the blob is ready and that will then return the blob itself
        // and an objectURL to it

        return new Promise((resolve, reject) => {
        
            if (! this.mediaRecorder instanceof MediaRecorder) {
                reject('MediaRecorder is not set');
            } else if (this.mediaRecorder.state !== 'recording') {
                reject('not recording');
            } else if (this.getBlobOnStop) {
                this.mediaRecorder.requestData(); // svuota il buffer
                this.mediaRecorder.stop();
                reject("A callback has been set and the promise is broken - use the callback function to get your blob");
            } else {
            
                this.mediaRecorder.onstop = () => {
                    const mediaBlob = new Blob(this.recordedChunks, this.type);
                    const mediaURL =  URL.createObjectURL(mediaBlob);
                    resolve({ mediaBlob, mediaURL });
                };                
            
                this.mediaRecorder.requestData(); // svuota il buffer
                this.mediaRecorder.stop();
            }
        });
    }
    
    
    // Status of the recorder. It can be 'recording', 'paused', 'inactive'
    // or null, if it has not been initialized for some reason
    get status() {
        return (this.mediaRecorder instanceof MediaRecorder) ? this.mediaRecorder.state : null;
    }
    
    // You can set an error handler
    set onError(f) {
        if (typeof f === 'function' && this.mediaRecorder instanceof MediaRecorder) {
            this.mediaRecorder.onerror = f;
        }
        
    }
    
    
    clear() {
        if (this.mediaRecorder.state === 'inactive') {
            this.recordedChunks = [];
        }
    }
    
    start() {
        if (this.mediaRecorder.state === 'inactive') {
            this.mediaRecorder.start();
        }
    }
    
    pause() {
        if (this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.pause();
        }
    }

    resume() {
        if (this.mediaRecorder.state === 'paused') {
            this.mediaRecorder.resume();
        }
    }
}
