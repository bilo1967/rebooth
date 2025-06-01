// This should work either on Chrome and Firefox


/*
const mimeTypes = [
      "video/webm",
      "audio/webm",
      "audio/wav",
      "audio/mp3",
      "video/mpeg",
      "video/webm;codecs=vp8",
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8.0",
      "video/webm;codecs=vp9.0",
      "video/webm;codecs=h264",
      "video/webm;codecs=H264",
      "video/webm;codecs=avc1",
      "video/webm;codecs=daala",
      "video/webm;codecs=vp8,opus",
      "video/WEBM;codecs=VP8,OPUS",
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,vp9,opus",
      "video/webm;codecs=h264,opus",
      "video/webm;codecs=h264,vp9,opus",
      "video/x-matroska;codecs=avc1",
      "audio/webm;codecs=opus",
      "audio/basic",
      "audio/ogg",
      "audio/x-wav",
      "audio/mpeg",
      "audio/mp4",
      "audio/amr",
      "audio/flac",
      "audio/3gpp",
      "audio/3gpp2",
      "audio/x-midi",
      "audio/x-matroska",
      "audio/aac",
      "audio/mp2t",
      "video/mpeg",
      "video/mp4",
      "video/quicktime",
      "video/x-raw-yuv",
      "video/ogg",
      "video/3gpp",
      "video/3gpp2",
      "video/mp2t",
      "video/avi",
      "video/x-matroska",
];
*/



// Module constants
const DEFAULT_MIME_TYPE = 'audio/webm';        // By default we get only audio
const DEFAULT_AUDIO_BITS_PER_SECOND = 64000;
const DEFAULT_AUDIO_BITRATE_MODE = 'variable';


class MyRecorder {

    mediaRecorder  = null;
    mediaStream    = null;
    objectURL      = null;
    recordedChunks = [];
    getBlobOnStop  = null;
    type           = null;

    // if no getBlobOnStop callback is passed, then the stop() method will
    // return a promise with the recorded blob and an objectURL to download it
   
    constructor(stream, getBlobOnStop = null, type = DEFAULT_MIME_TYPE) {
        
        if (!(stream instanceof MediaStream)) throw Error("stream is not a MediaStream");

        // console.log(stream.getAudioTracks()[0].getSettings());

        // Normalizzazione del parametro 'type'
        let mimeType, audioBitsPerSecond, audioBitrateMode;

        if (typeof type === 'string') {
            // Caso 1: type è una stringa (solo mimeType)
            mimeType = type;
            audioBitsPerSecond = DEFAULT_AUDIO_BITS_PER_SECOND;
            audioBitrateMode = DEFAULT_AUDIO_BITRATE_MODE;
        } else if (typeof type === 'object' && type !== null) {
            // Caso 2: type è un oggetto (configurazione completa)
            mimeType = type.mimeType || DEFAULT_MIME_TYPE;
            audioBitsPerSecond = type.audioBitsPerSecond ?? DEFAULT_AUDIO_BITS_PER_SECOND;
            audioBitrateMode = type.audioBitrateMode ?? DEFAULT_AUDIO_BITRATE_MODE;
        } else {
            throw new Error("Invalid type parameter: must be string or object");
        }        

        // Verifica supporto del codec
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            throw new Error(`Unsupported media type: ${mimeType}`);
        }        

        if (getBlobOnStop != null && typeof getBlobOnStop !== 'function') throw Error("getBlobOnStop is not a function");

        this.getBlobOnStop = getBlobOnStop;
        this.type = {
            mimeType,
            audioBitsPerSecond,
            audioBitrateMode,
        };        

        this.initializeStream(stream);

    }
    
    initializeStream(stream) {
        
        // If audio only is required and the argument stream has a video track, 
        // we create another MediaStream getting only the first audio track.
        // Otherwise we use the original stream
        if (this.type.mimeType.startsWith('audio') && stream.getVideoTracks().length > 0) {
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
            this.mediaRecorder.onstop = async () => {
                this.getBlobOnStop(new Blob(this.recordedChunks, this.type));
            }
        }
        
        // We add a chunk of data to our buffer whenever available
        this.mediaRecorder.ondataavailable = (v) => {
            if (v.data.size > 0) {
                this.recordedChunks.push(v.data);
            }
        };   

        // Event listener for track ended events
        stream.getTracks().forEach(track => {
            track.onended = this.handleTrackEnded.bind(this);
        });        
    }
    
    

    

    // This method has to be called when some track is stopped or replaced
    // in the stream (device change, device disconnection, etc.) to update
    // the stream while keeping existing data.
    replaceStream(newStream) {
    
        if (!this.mediaRecorder || this.mediaRecorder.state != 'recording') return;
    
        // Unset onstop handler since we're forcing a stop and want to resume
        if (this.getBlobOnStop) {
            this.mediaRecorder.onstop = null;
        }

        // Stop current recorder
        this.mediaRecorder.stop();    
        
        // Initialize new track
        this.initializeStream(newStream);

        // Start new recorder
        this.mediaRecorder.start();

    }
    
    // Logic to handle track ended if necessary
    handleTrackEnded(event) {
        console.warn("MediaStreamTrack ended (recorder status: " + this.mediaRecorder.state + "): ", event);
        // ...
    } 
   

    stop() {
        console.log("MyRecorder: STOP");
        return new Promise((resolve, reject) => {
            if (!(this.mediaRecorder instanceof MediaRecorder)) {
                reject('MediaRecorder is not set');
            } else if (this.mediaRecorder.state !== 'recording') {
                reject('not recording');
            } else if (this.getBlobOnStop) {
                this.mediaRecorder.requestData();
                this.mediaRecorder.stop();
                reject("You set a callback. Use the callback function to get your blob.");
            }   

            // When calling stop() on a MediaRecorder, it may or may not
            // automatically flush the final chunk of recorded data depending
            // on the browser and timing.
            // To ensure we always get the final piece of the recording,
            // we call mediaRecorder.requestData() just before stopping.
            // However, we also need to safely capture that final data chunk.
            // To avoid data duplication or race conditions, we use a 
            // temporary buffer (localChunks) and temporary event listeners,
            // which we remove as soon as we receive the 'stop' event.

            // Make a copy of the current recorded data into a temporary buffer
            // This avoids modifying the main this.recordedChunks array directly
            const localChunks = [...this.recordedChunks];

            // Temporary handler for the 'dataavailable' event
            // It will catch the final chunk emitted after requestData()
            const handleData = (e) => {
                if (e.data && e.data.size > 0) {
                    localChunks.push(e.data); // Add the new chunk to our local buffer
                }
            };

            // Temporary handler for the 'stop' event
            // This is called after the recorder has been stopped and all data is collected
            const handleStop = () => {
                // Remove the temporary event listeners to avoid memory leaks
                this.mediaRecorder.removeEventListener('dataavailable', handleData);
                this.mediaRecorder.removeEventListener('stop', handleStop);

                // Create a Blob from all collected chunks
                const mediaBlob = new Blob(localChunks, this.type);

                // Create an object URL for downloading or playback
                const mediaURL = URL.createObjectURL(mediaBlob);

                // Resolve the promise with the blob and URL
                resolve({ mediaBlob, mediaURL });
            };

            // Attach the temporary event listeners
            this.mediaRecorder.addEventListener('dataavailable', handleData);
            this.mediaRecorder.addEventListener('stop', handleStop);

            // Explicitly request any remaining data chunk from the encoder
            this.mediaRecorder.requestData();

            // Now stop the recording; this will trigger the 'stop' event
            this.mediaRecorder.stop();
         
            
/*            
            // Logica precedente
            
            this.mediaRecorder.onstop = async () => {
                const mediaBlob = new Blob(this.recordedChunks, this.type);
                const mediaURL = URL.createObjectURL(mediaBlob);
                resolve({ mediaBlob, mediaURL });
            };

            this.mediaRecorder.requestData();
            this.mediaRecorder.stop();
*/
        });
    }

    get status() {
        return (this.mediaRecorder instanceof MediaRecorder) ? this.mediaRecorder.state : null;
    }

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
    
    
    //
    // Download (again) available data 
    //
    // Blob and the relative objectURL are available to the stop() promise
    // and to the getBlobOnStop() callback, but in case there's need to 
    // get it again, here is a shortcut
    //
    download() {
        if ((this.mediaRecorder instanceof MediaRecorder) && this.mediaRecorder.state === 'inactive') {
            const mediaBlob = new Blob(this.recordedChunks, this.type);
            const mediaURL = URL.createObjectURL(mediaBlob);
            return { mediaBlob, mediaURL };
        } else {
            return null;
        }
    }    
}



export default MyRecorder;

// Global loading, if this is not included by a module
if (typeof window !== 'undefined' && !window.MyRecorder) {
    window.MyRecorder = MyRecorder;
}
