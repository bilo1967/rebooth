"use strict";


// Debug WebRTC on Chrome: chrome://webrtc-internals/
// Debug WebRTC on Firefox: about:webrtc

// const isRelay = dataConnection.peerConnection.currentLocalDescription.sdp.includes('typ relay');
// const isRelay = mediaConnection.peerConnection.currentLocalDescription.sdp.includes('typ relay');


const AppName         = 'ReBooth';
const AppVersion      = '0.6.2';
const AppAuthor       = 'Gabriele Carioli';
const AppContributors = 'Nicoletta Spinolo';
const AppCompany      = 'Department of Interpretation and Translation at the University of Bologna'


var teacherVideoBW = 0; // Max video upstream bandwidth per connection
var teacherAudioBW = 0; // Max audio upstream bandwidth per connection
var teacherVRes    = 0; // Max vertical upstream resolution
var studentVideoBW = 0; // Max upstream bandwidth per connection
var studentAudioBW = 0; // Max upstream bandwidth per connection
var studentVRes    = 0; // Max vertical upstream resolution
setBandwidthProfile();  // Set defaults


class Connection {
    userId         = null;
    userName       = null;
    pin            = null;
    peer           = null;
    mediaStream    = null;
    videoElement   = null;
    audioRecorder  = null;
    
    constructor(config) {
        
        this.userId         = null;
        this.userName       = null;
                           
        this.peer           = null;
                           
        this.mediaStream    = null; 
        this.videoElement   = null;
        this.onError        = null;
        this.audioRecorder  = null;
        
        
        if (typeof config === 'object') {
            for (var k in config) {
                this[k] = config[k];
            }        
        }
        
        if (! 'srcObject' in this.videoElement) throw Error('invalid videoElement');
        
        // We are using the media source of the video element
        // In derived classes we will define a setMediaStream 
        // method to set/replace this stream
        this.mediaStream = this.videoElement.srcObject;
    }
    
    
    // Connect to PeerJS server
    logon(userName = null, onOk = null, onFail = null) {
        
        if (typeof onOk === 'function') this.onLogonOk = onOk;
        if (typeof onFail === 'function') this.onLogonFail = onFail;
        
        if (userName != null) {
            this.userName = userName;
            this.userId = userName.toLowerCase().hash64();
            console.log("You're trying to log with username '" + userName + " having id " + this.userId);
        }
        
        this.peer = new Peer(
            this.userId,
            PeerJSConfig, 
            {
                metadata: {
                    pin: this.pin,
                    userName: this.userName,
                } 
            }
        );
        
        
// GESTIONE DEGLI ERRORI
        this.peer.on('error', (err) => { 
        
            // Error parsing here
            let e = this.error(err);
            if (e.cause == 'connect' && typeof this.onLogonFail === 'function') {
                this.onLogonFail(e);
                return;
            }
            if (e.cause == 'datacall' && typeof this.onDataCallFail === 'function') {
                this.onDataCallFail(e);
                return;
            }
            if (e.cause == 'mediacall' && typeof this.onMediaCallFail === 'function') {
                this.onMediaCallFail(e);
                return;
            }
            
            if (typeof this.onError === 'function') this.onError(e); // Catches all
            //this.connected = false;
// GESTIRE DISTRUZIONE DEL PEER, dove serve
        });
        
        this.peer.on('open', (id) => { 
            if (this.userId == null) this.userId = id;
            console.log("this.peer.on [id=" + this.userId + "]");
            //this.connected = true;
            if (typeof this.onLogonOk === 'function') this.onLogonOk(id);
        });
        
        this.peer.on('close', () => { 
            console.log("this.peer.close event");
// GESTIRE CHIUSURA DELLA CONNESSIONE
        });
        
        
        this.peer.on('disconneted', () => { 
            console.log("We have been disconnected by the signaling server but existing connections should still be alive. Trying to reconnect.");
            setTimeout(() => {this.peer.reconnect();}, 1000);
        });
        
    }
    
    error(err) {
        
        //let msg = null;
        //let level = null;
        //let retry = false;
        
        if (! 'type' in err) return err
        
        err.retry = false;
        switch(err.type) {
        case 'invalid-key': // fatal
            err.msg = "An invalid key has been supplied to the signaling server.";
            err.cause = "server";
            break;
        case 'server-error': // fatal
            err.msg = "Can't reach the signaling server. Try again later.";
            err.retry = true;
            err.cause = "network";
            break;              
        case 'network':
            err.msg = "Lost or cannot establish a connection to the signalling server. Try again later.";
            err.cause = "network";
            err.retry = true;
            break;
        case 'ssl-unavailable': // fatal
            err.msg = "Can't establish an encrypted connection (server certificate expired?)";
            err.cause = "network";
            break;
        case 'socket-error': // fatal
            err.msg = "Network error. Try again later.";
            err.retry = true;
            err.cause = "network";
            break;
        case 'socket-closed': // fatal
            err.msg = "Communication closed unexpectedly";
            err.retry = true;
            err.cause = "network";
            break;
        case 'unavailable-id':
            err.msg = "The username you supplied is already taken. Please, use a different one.";
            err.retry = true;
            err.cause = "connect";
            break;
        case 'peer-unavailable':
            err.msg = "The teacher ID you're trying to connect to doesn't exist or most likely isn't connected yet.";
            err.retry = true;
            err.cause = "datacall";
            break;
        case 'invalid-id': // fatal
            err.msg = "Username contains invalid characters";
            err.cause = "connect";
            err.retry = true;
            break;
        case 'disconnected':
            err.msg = "You've already disconnected this peer from the server and can no longer make any new connections on it";
            err.cause = "connect";
            break;
        case 'browser-incompatible': // fatal
            err.msg = "Your browser is not compatible with this application.";
            err.cause = "browser";
            break;
        default:
            // Not a PeerJS error
            break;
        }

        console.log("Logs from error() parsing routine here:");
        console.log('----------------------------------------');
        console.log("type: " + err.type);
        console.log("msg:" + err.msg);
        console.log("cause: " + err.cause);
        console.log("retry: " + err.retry);
        console.log('----------------------------------------');
        
        return err;
    }
    

    
    destroy() {
        if (this.peer) this.peer.destroy();
        if (this.peer) this.peer.destroy();

        var keys = Object.keys(this);

        for (var key in keys) {
            if (this.hasOwnProperty(key)) {
                this[key] = null;
            }
        }
        
    }
    
};




//
// In order to have the booths on a separate audio channel we need to re-route
// the audio flows using the Web Audio API. The audio will then be muted on each
// booth video element and the each stream will be connected/disconnected as a
// MediaStreamSource to an appropriate single gain node.
// Connecting/disconnecting to/from this gain node is equivalent to mute/unmute
// the video elent.
// We need to pass this gain node to the class constructor
//
// Note that a gain node can be created from an audio context, which otherwise
// can be started only if a UI element has been clicked
//
// If no gain node is passed to the constructor, booth audio won't be routed
// 
class Teacher extends Connection {
    
    booths             = [];
    
    muted              = true;
    
    onBoothConnect     = function(pin, who) { console.log("User " + who + " (pin: " + pin + ") is connected" ); };
    onBoothConnected   = function(pin, who) { console.log("User " + who + " (pin: " + pin + ") has completed the connection" ); };
    onBoothDisconnect  = function(pin, who) { console.log("User " + who + " (pin: " + pin + ") has disconnected"); };
    onDataDataReceived = function(pin, who, data) { console.log("Data from user " + who + " (pin: " + pin + "):", data);}
    
    screenShareStream  = null;

    audioCtx           = null;
    boothsGainNode     = null;


    // booths parameter: [ {pin: ..., videoElement: ... }, ...]
    constructor(config, booths) {
        
        super(config);
        
        if (typeof config === 'object') {
            if (typeof config.onBoothConnect === 'function') this.onBoothConnect = config.onBoothConnect;
            if (typeof config.onBoothConnected === 'function') this.onBoothConnected = config.onBoothConnected;
            if (typeof config.onBoothDisconnect === 'function') this.onBoothDisconnect = config.onBoothDisconnect;
            if (typeof config.onDataReceived === 'function') this.onDataReceived = config.onDataReceived;
            if (typeof config.muted !== 'undefined') this.muted = config.muted;
            if (typeof config.boothsGainNode !== 'undefined' && config.boothsGainNode != null) {
                if (! config.boothsGainNode instanceof GainNode) throw 'Invalid destination gain node';
                if (! 'context' in config.boothsGainNode ) throw 'No context in supplied gain node';
                
                this.boothsGainNode = config.boothsGainNode;
            }
        }        
        
        //if (this.userName == null) throw "userName parameter is missing";
        //this.userId = config.userName.hash64();
        
        if (!Array.isArray(booths)) throw "Parameter booths is missing or is not an Array";
        
        booths.forEach(e => {
            if (e) this.booths[e.pin] = new Booth(e.pin, e.videoElement, this.boothsGainNode);
        });
        
    }

    getBooth(pin) {
        let found = this.booths[pin];
        return found ? found : null;
    }
    
    addBooth(pin, videoElement) {
        let found = this.booths[pin];
        if (found) return null;
        
        this.booths[pin] = new Booth(pin, videoElement, this.boothsGainNode);
        
    }
    
    // we want to be able to iterate this.booths
    forEachConnectedBooth(f, mediaconnnected = false) { 
        if (typeof f !== 'function') throw Error("You must supply a function to forEachConnectedBooth");
        for (const pin in this.booths) {
            const booth = this.booths[pin];
            if (booth.connected(mediaconnnected)) f(booth);
        }
    }

    sharingScreen() {
        if (!this.screenShareStream) return false;
        
        return this.screenShareStream.getTracks()[0].readyState == 'live';
    }
    
    unshareScreen() {
        
        console.log('Unsharing screen');

        // Stop the tracks in current screenshare stream to actually stop screensharing
        if (this.sharingScreen()) {
            this.screenShareStream.getTracks().forEach(track => track.stop());
        }
        
        this.forEachConnectedBooth(booth => {
            console.log("Closing screen share stream for " + booth.pin);
            
            // Ugly workaround because PeerJS mediaConnection.on('close', ...)
            // event handler doesn't work well (does it work at all?)
            booth.send({unshareScreen: {value: true}});  
            
            if (booth.screenShareConnection && booth.screenShareConnection.open) {
                booth.screenShareConnection.close();
                booth.screenShareConnection = null;
            }
        }, true);
        this.screenShareStream = null;
    }
    
    shareScreen(stream, pin) {
        this.screenShareStream = stream;
        this.forEachConnectedBooth(booth => {
            this.shareScreenToBooth(booth.pin);
        }, true);
    }
    
    shareScreenToBooth(pin) {
        if (this.isBoothConnected(pin) && this.sharingScreen()) {
            let booth = this.getBooth(pin);
            console.log("Sending screen share stream to booth " + booth.pin);
            booth.screenShareConnection = this.peer.call(booth.peer,  this.screenShareStream);
        } else {
            if (!this.sharingScreen()) console.log("Not sharing - no need to send a stream");
            if (!this.isBoothConnected(pin)) console.log("It seems like boot " + pin + " is not connected");
        }
    }

    
    // we want to be able to iterate this.booths
    forEachBooth(f) { 
        if (typeof f !== 'function') throw Error("You must supply a function to forEachBooth");
        for (const pin in this.booths) {
            f(this.booths[pin]);
        }
    };
    

    isBoothMuted(pin) {
        let found = this.booths[pin];
        if (found === 'undefined') return null;
        return found.isMuted();
    }

    unmuteBooth(pin) {
        let found = this.booths[pin];
        if (found === 'undefined') return false;
        console.log("UNmute booth " + pin);
        found.unmute();
    }

    muteBooth(pin) {
        let found = this.booths[pin];
        if (found === 'undefined') return false;
        console.log("mute booth " + pin);
        found.mute();
    }
    
    
    muteAllBooths() {
        this.forEachBooth(booth => {
            console.log("mute booth " + booth.pin);
            booth.mute();
        });
    }
    
    muteSelfForBooth(pin) {
        let found = this.booths[pin];
        if (found) found.muteTeacher();
        
    }
    unmuteSelfForBooth(pin) {
        let found = this.booths[pin];
        if (found) found.unmuteTeacher();
    }

    muteSelf(v = true) {
        this.forEachConnectedBooth(booth => {
            console.log("Sending " + (v ? "mute" : "unmute") + "Teacher command to booth " + booth.pin);
            booth.muteTeacher(v);
        });
        this.muted = v;
    }
    unmuteSelf() {
        this.muteSelf(false);
    }
    selfMuted() {
        return this.muted;
    }
    
    send(pin, data) {
        let found = this.booths[pin];

        if (found === 'undefined') return false;
        
        // Data connection is enough to send data
        if (found.dataConnection && found.dataConnection.open) found.send(data);
    }
    
    sendToAll(data) {
        this.forEachConnectedBooth(booth => {
            booth.send(data);
        });
    }
    
    startRecording(pin) {
        let found = this.booths[pin];
        if (found === 'undefined') return false;

        return found.startRecording();
    }

    stopRecording(pin) {
        let found = this.booths[pin];
        if (found === 'undefined') return false;
        
        return found.stopRecording();
    }
    
    
    // Values:
    //   'recording', 'paused', 'inactive' if booth is connected
    //   null otherwise
    recorderStatus(pin) {
        let found = this.booths[pin];
        if (found === 'undefined') return null;
        return this.booths[pin].recorderStatus;
    }
    

    logoff() {
        console.log("Notify logoff to all connected booths");
        this.sendToAll({system: {value: 'logoff'}});
        
        setTimeout(() => {
            // Disconnect all connected booths
            this.forEachConnectedBooth(booth => {
                console.log("Disconnecting booth " + booth.pin);
                booth.disconnect();
            });            
            super.destroy();
        }, 500);
    }


    connected() {
        let c = 0;
        for (const pin in this.booths) {
            if (this.booths[pin].connected()) c++
        }

        return c > 0;
    }

    isBoothConnected(pin) {
        let found = this.booths[pin];
        if (found === 'undefined') return false;
        
        return found.connected();
    }
    
    
    
    logon(userName, classCode = "", onOk = null, onError = null) {
        
        classCode = classCode.trim();

        super.logon(userName+classCode, onOk, onError);
        
        this.peer.on('connection', (c) => {
            
            let pin = c.metadata.pin;
            let who = c.metadata.userName;
            let dataPeer = c.metadata.dataPeer;
            
            console.log("Incoming connection from '" + who + "' using pin '" + pin + "'");
            
            
            // We handle the actual PeerJS connection here
            // Data connection is handled BEFORE media connection
            // The booth starts the media connection only aftet the
            // media connection has been established
            c.on('open', () => {
                console.log("Data connection established with peer " + c.peer + " identified by:", c.metadata);

                let found = this.booths[pin];
                
                // Pin not found (invalid pin)
                if (found === undefined) {
                    console.log('pin ' + pin + ' not found');
                    c.send({system: {value: "connection refused", description: "pin not found"}});
                    setTimeout(() => {c.close();}, 1000);
                    if (typeof onErr === 'function') onErr('pin ' + pin + ' not found');
                    return;
                }
                
               
                // Busy
                if (found.dataConnection) {
                    console.log('pin ' + pin + ' already logged');
                    c.send({system: {value: "connection refused", description: "pin already logged"}});
                    setTimeout(() => {c.close();}, 1000);
                    if (typeof onErr === 'function') onErr('pin ' + pin + ' already logged');
                    return;
                }
               
                // Someone is media-connected using another peer
                if (found.peer != null && found.peer != c.peer) {
                    console.log('data connection and media connection peer differs');
                    c.send({system: {value: "connection refused", description: "data connection and media connection peer differs"}});
                    setTimeout(() => {c.close();}, 1000);
                    if (typeof onErr === 'function') onErr('data connection and media connection peer differs');
                    return;
                }
                
                // Connection is accepted
                found.dataConnection = c;
                found.peer = dataPeer;
                found.who = who;
                
                c.send({system: {value: "connection accepted"}});
                
                // Tell the booth if the teacher is muted or not
                
//console.log("selfMuted: " + this.selfMuted());
                found.muteTeacher(this.selfMuted());
                
                if (typeof this.onBoothConnect === 'function') this.onBoothConnect(pin, who);
                
                c.on('close', () => {
                    console.log('Connection closed by booth ' + pin);
                    found.disconnect();
                    if (typeof this.onBoothDisconnect === 'function') this.onBoothDisconnect(pin, who);
                });      

                c.on('data', (data) => {
                    
                    if (DebugLevel >= 3) console.log("Incoming data from '" + who + "' (" + pin + ")", data);

                    if (data.system) {
                        switch (data.system.value) {
                        case 'acknowledged':
                            if (typeof this.onBoothConnected === 'function') this.onBoothConnected(pin, who);
                            break;
                        case 'hangup':
                            console.log('Booth ' + pin + ' has terminated the call');
                            found.disconnect();
                            //if (typeof this.onBoothDisconnect === 'function') this.onBoothDisconnect(pin, who);
                            break;
                        default:
                            break;
                        }
                    }
                    if (typeof this.onDataReceived === 'function') this.onDataReceived(pin, who, data);
                    
                });
               
               
            });
            
        });


        this.peer.on('call', (c) => {


            let pin = c.metadata.pin;
            let who = c.metadata.userName;
            let dataPeer = c.metadata.dataPeer;


            console.log("Media call from a possible booth received: pin="+pin+", who="+who+", dataPeer="+dataPeer);

            let found = this.booths[pin];            


            // Pin not found (invalid pin)
            if (found === undefined) {
                console.log('pin ' + pin + ' not found');
                c.close();
                return;
            }
            
            // Busy
            if (found.mediaConnection) {
                console.log('pin ' + pin + ' already logged');   
                c.close();
                return;
            }

            // Someone is media-connected using another peer
            if (found.peer != null && found.peer != dataPeer) {
                const e = {
                     type: 'mediaConnection error',
                     msg: 'data connection and media connection peer differs. Booth peer is ' + found.peer + " while incoming media connection peer is " + dataPeer,
                     cause: 'connect',
                     retry: true
                };
                console.log(e.msg);
                //if (typeof this.onError === "function") this.onError(e);
/*                
                c.close();
                return;
*/                
            }
            
            
            found.mediaConnection = c;
            
            // Called once for each track in the stream, so it's ok that it is
            // called two times: 1 for audio track + 1 for video track
            found.mediaConnection.on('stream', (stream) => {
                
// HA SENSO ASSOCIARE DUE VOLTE L'ELEMENTO VIDEO ALLO STESSO STREAM?                
// ??????? =>   if (stream.id == found.mediaConnection.localStream.id) return;
                found.connect(stream);
       
            });
            
            found.mediaConnection.on('error', (err) => {
                console.log("Booth[" + found.pin + "]: remote media connection has received an error: ", err);
                if (typeof this.onError === 'function') this.onError(err);
            });
            
            found.mediaConnection.on('close', () => {
                console.log("Booth[" + found.pin + "]: Remote media stream has been closed"); 
            });              
            
            
            found.mediaConnection.answer(this.mediaStream);
            
        });
    }
    


    setMediaStream(stream) {

        console.log("Setting or replacing local stream");
        
        let micEnabled = true;
        let camEnabled = true;
        if (this.mediaStream) {
            // Save current microphone and camera status
            micEnabled = isAudioEnabled(this.mediaStream);
            if (micEnabled === null) micEnabled = true;
            camEnabled = isVideoEnabled(this.mediaStream) !== false;
        }        
//      window.stream = stream; // make stream available to console
        
        this.videoElement.srcObject = stream;
        this.mediaStream = stream;
        
        this.videoElement.onloadedmetadata = (e) => {
            this.videoElement.play();
            this.videoElement.muted = true;
        }
        
        console.log('Received local stream.');
        
        // If a different video or audio device has been selected, we need
        // to replace these tracks in streams to to connected peers, also; 
        
        this.forEachConnectedBooth(booth => {
            console.log("Media device(s) changed: replacing stream for booth " + booth.pin + ".");
            if (booth.mediaConnection.open) {
                replaceStreamInMediaConnection(booth.mediaConnection, stream);
                reduceOutstreamBandwidth(
                    booth.mediaConnection,
                    teacherVideoBW,
                    teacherVRes,
                    teacherAudioBW
                );                
            }
        });
        
        // Restore local microphone and camera status
        enableAudio(this.mediaStream, micEnabled);
        enableVideo(this.mediaStream, camEnabled);    
    }

};


//
// The booths gain node needs to be passed to the class constructor
// 
class Booth {
    pin                   = null;
    videoElement          = null;
    mediaStream           = null;    
    mediaConnection       = null;
    dataConnection        = null;
    screenShareConnection = null;
    peer                  = null;    
    audioRecorder         = null;
    registry              = {};   // Used to store misc. values
//  audioBlob             = null;
//  localMediaStreamCopy  = null;
    
//  audioSource         = null;    
//  audioCtx            = null;

    // Web Audio API related fields 
    boothsGainNode        = null;
    audioCtx              = null;
    audioSource           = null;   // mute => disconnect, unmute => connect(boothsGainNode)
    audioSourceConnected  = false;  // muted =>  return !this.audioSourceConnected
    
    
    constructor(pin, videoElement , gainNode = null) {
        if (! 'srcObject' in videoElement) throw 'invalid video element';
        if (! pin) throw 'invalid pin';
        //if (! 'baseLatency' in audioCtx ) throw 'invalid audio context';
        //if (! audioCtx instanceof AudioContext) throw 'invalid audio context';
        
        
        if (gainNode != null) {
            if (! gainNode instanceof GainNode) throw 'Invalid destination gain node';
            if (! 'context' in gainNode ) throw 'No context in gain node';

            // Save gain node to a property and get audio context from gain node
            this.boothsGainNode = gainNode;
            this.audioCtx = gainNode.context;
        } else {
            this.boothsGainNode = null;
            this.audioCtx = null;
        }
         
        this.pin = pin;

        this.videoElement = videoElement;
    }

    dataConnected() {
        return this.dataConnection && this.dataConnection.open;
    }

    mediaConnected() {
        return this.mediaConnection && this.mediaConnection.open;
    }


    // A media connection is not always needed...
    connected(media = false) {
        return this.dataConnected() && (!media || media && this.mediaConnected());
    }
    
    
    
    
    connect(stream) {

        if (! stream instanceof  MediaStream) throw Error("stream is not a MediaStream");
        
        this.peer = this.mediaConnection.peer;


        this.videoElement.muted = true;

        this.videoElement.srcObject = stream;
        this.mediaStream = stream;
      
        this.audioRecorder = new MyRecorder(this.mediaStream, null, {mimeType: 'audio/webm'});


        // When a booth joins the class it is muted by default
        this.videoElement.onloadedmetadata = (e) => {
            
            if (this.boothsGainNode) {
                if (this.audioSource instanceof MediaStreamAudioSourceNode) {
                    this.audioSource.disconnect();
                    this.audioSource = null;
                }
                this.audioSource = audioCtx.createMediaStreamSource(stream);
                this.audioSource.disconnect();
                this.audioSourceConnected = false;
            } else {
                console.log("No booths gain node");
                
            }
            
            this.videoElement.play();
// ====================>
            reduceOutstreamBandwidth(
                this.mediaConnection,
                teacherVideoBW,
                teacherVRes,
                teacherAudioBW);              
// ====================>                
        }          
    }
    
    disconnect() {
        
        this.videoElement.srcObject = null;
        this.mediaStream = null;
        this.peer = null;

        // Student could disconnect from booth while 
        // a recording session is still in progress
        if (this.recorderStatus == 'inactive') this.audioRecorder = null;
        
//      this.audioSource = null;
        
        if (this.dataConnection && this.dataConnection.open) this.dataConnection.close();        
        if (this.mediaConnection && this.mediaConnection.open) this.mediaConnection.close();
         
        setTimeout(() => {
            this.mediaConnection = null;
            this.dataConnection  = null;
        }, 0);
        
    }    

    mute() {
        if (this.boothsGainNode != null && this.audioSource != null) {
            this.audioSource.disconnect(); 
            this.audioSourceConnected = false;
        } else {
            this.videoElement.muted = true;
        }
    }

    unmute() {
        if (this.boothsGainNode != null && this.audioSource != null) {
            this.audioSource.connect(this.boothsGainNode); 
            this.audioSourceConnected = true;
        } else {
            this.videoElement.muted = false;
        }
    }

    isMuted() {
        if (!this.connected) 
            return null;
        else
            return (this.boothsGainNode != null  && this.audioSource != null) ?
                (!this.audioSourceConnected) : this.videoElement.muted;
    }
    
    muteTeacher(v = true) {
        if (!this.connected) return false;    
        if (v) {
            this.send({system: {value: 'mute teacher'}});
        } else {
            this.send({system: {value: 'unmute teacher'}});    
        }
        return true;
        
    }
    unmuteTeacher() {
        return this.muteTeacher(false);
    }
    
    
    
    send(data) {
        if (this.dataConnection && this.dataConnection.open) this.dataConnection.send(data);
    }
    
    startRecording() {
        if (!this.audioRecorder) {
            console.log("Booth " + this.pin + " recorder is not initialized.");
            return false;
        }
        
        console.log("Booth " + this.pin + " starts recording.");
        
        this.audioRecorder.clear();
        this.audioRecorder.start();
        
        return true;
    }

    stopRecording() {
        if (!this.audioRecorder) {
            return new Promise((resolve, reject) => { resolve({mediaURL: null, mediaBlob: null, pin: null}); });
        } else {
            return this.audioRecorder.stop().then((r) => {
                return new Promise(resolve => {
                    resolve( { mediaURL: r.mediaURL, mediaBlob: r.mediaBlob, pin: this.pin });
                });
            });
        }
    }
    
    get recorderStatus() {
        if (DebugMode) console.log("Getting recorder status of booth " + this.pin);                
        if (!this.audioRecorder) {
            console.log("Booth " + this.pin + " recorder is not initialized");
            return null;
        }
        if (DebugMode) console.log("Recorder status of booth " + this.pin + " is " + this.audioRecorder.status);

        return this.audioRecorder.status;
    }
    
}






class Student extends Connection {
    
    pin                      = null;
    dataConnection           = null;
    mediaConnection          = null;
    screenConnection         = null;    
    teacherVideoElement      = null;
    teacherMediaStream       = null;
    teacherMuted             = false;
         
    // Callbacks
    onTeacherMuted      = function(data)   { console.log("Muting teacher's audio");}
    onTeacherUnmuted    = function(data)   { console.log("Unmuting teacher's audio");}
    onDataReceived      = function(data)   { console.log("Data received: ", data);}
    onConnect           = function()       { console.log("Connected");}
    onDisconnect        = function()       { console.log("Disconnected");}
    onScreenShareStream = function(stream) { console.log("Screen share stream received", stream); }
    onScreenShareClose  = function()       { console.log("Screen share stream has been closed"); }

    connected() {
        return this.dataConnection && 
               this.dataConnection.open &&
               this.mediaConnection && 
               this.dataConnection.open;
    }

    constructor(config) {
        super(config);
        
        if (typeof config === 'object') {
            if (typeof config.onDataReceived === 'function') this.onDataReceived = config.onDataReceived;
            if (typeof config.onTeacherMuted === 'function') this.onTeacherMuted = config.onTeacherMuted;
            if (typeof config.onTeacherUnmuted === 'function') this.onTeacherUnmuted = config.onTeacherUnmuted;
            if (typeof config.onDisconnect === 'function') this.onDisconnect = config.onDisconnect;
            if (typeof config.onConnect === 'function') this.onConnect = config.onConnect;
            if (typeof config.onScreenShareStream === 'function') this.onScreenShareStream = config.onScreenShareStream;
            if (typeof config.onScreenShareClose === 'function') this.onScreenShareClose = config.onScreenShareClose;            
        }        
        
        
        if (typeof config.teacherVideoElement == 'undefined') {
            throw('teacherVideoElement is undefined');
        }
        if (! 'srcObject' in config.teacherVideoElement) throw Error('invalid teacherVideoElement');
        
        this.teacherVideoElement = config.teacherVideoElement;
        this.dataConnection   = null;
        this.mediaConnection  = null;
        this.screenConnection  = null;
        this.audioRecorder  = null;

    }
    
    logon(userName, onOk = null, onFail = null) {
        
        // We are a booth and we log on the peerjs server without a real user name
        // because we want to have a random ID to be sure we can quickly reconnect
        // when connection drops
        super.logon(null, onOk, onFail);

        me.userName = userName;
        

        //
        // Student can receive screeen share streams...
        //
        this.peer.on('call', (c) => {
            const meta = c.options.metadata; // Who's connecting
            
            // Validate the caller
            // if (meta.bla) {
            // 
            // }
            
            this.screenConnection = c;
            
            c.answer(null);
            
            c.on('stream', (stream) => {
                console.log('Teacher has shared his/her screen');
                if (typeof this.onScreenShareStream === 'function') this.onScreenShareStream(stream);
            });

            c.on('close', () => {
                console.log('Teacher has unshared his/her screen');
                if (typeof this.onScreenShareClose === 'function') this.onScreenShareClose();
            });
            

        });
    }
    
    
    send(data) {
        
        if (this.dataConnection && this.dataConnection.open) this.dataConnection.send(data);
    }    
    

    hangup() {
        console.log('Logging off');
        this.dataConnection.send({system: {value: 'hangup'}});
        
        this.teacherVideoElement.srcObject = null;
        
        setTimeout(() => {
            if (this.dataConnection && this.dataConnection.open) this.dataConnection.close();
            if (this.mediaConnection && this.mediaConnection.open) this.mediaConnection.close();
            if (this.screenConnection && this.screenConnection.open) this.screenConnection.close();
            this.dataConnection = null;
            this.mediaConnection = null;
            this.screenConnection  = null;
        }, 250);
    }
    
    
    
    call(teacherUserName, classCode = "", pin, onDataOk = null, onDataFail = null, onMediaOk = null, onMediaFail = null) {
        
        if (typeof onDataOk === 'function')    this.onDataCallOk    = onDataOk;
        if (typeof onDataFail === 'function')  this.onDataCallFail  = onDataFail;
        if (typeof onMediaOk === 'function')   this.onMediaCallOk   = onMediaOk;
        if (typeof onMediaFail === 'function') this.onMediaCallFail = onMediaFail;
        
        classCode = classCode.trim();

        let teacherId = (teacherUserName + classCode).toLowerCase().hash64();
        
        
        // N.B. this.mediaStream is set externally of this class 
        // by the gotLocalMediaStream function
        if (this.mediaStream == null) {
            let e = {
                type: 'media connection',
                msg:   "Can't access your webcam or headset: maybe they're already in use?",
                retry: false,
                cause: 'mediacall'
            };
            if (typeof this.onError === 'function') this.onError(e);               
            
            return;
        }

        console.log("Calling teacher " + teacherUserName + (classCode ? ":" + classCode : "") + " (id: " + teacherId + ") using pin " + pin);
        console.log("this.userName=" + this.userName);

        this.dataConnection = this.peer.connect(teacherId, { metadata: {pin: pin, userName: this.userName, dataPeer: this.peer.peer}, reliable: true, });
        
        
        //
        // We handle the media connection only after the data 
        // connection has been established and accepted
        // 
        var handleMediaConnection = () => {

            this.mediaConnection = this.peer.call(
                teacherId, this.mediaStream, 
                { metadata: {pin: pin, userName: this.userName, dataPeer: this.dataConnection.peer}
            });

            
            // Receive a stream
            // Called once for each track in the stream, so it's ok that it is
            // called two times: 1 for audio track + 1 for video track
            this.mediaConnection.on('stream', (stream) => {
                
console.log("Receiving stream", stream);
                
                reduceOutstreamBandwidth(
                    this.mediaConnection,
                    studentVideoBW,
                    studentVRes,
                    studentAudioBW);
                
                this.teacherVideoElement.srcObject = stream;
                this.teacherMediaStream = stream;

                this.teacherVideoElement.onloadedmetadata = (e) => {
                    this.teacherVideoElement.muted = this.teacherMuted;
                    this.teacherVideoElement.play();
                    if (this.teacherMuted) {
                        if (typeof this.onTeacherMuted === 'function') this.onTeacherMuted();
                    } else {
                        if (typeof this.onTeacherUnmuted === 'function') this.onTeacherUnmuted();    
                    }
                    
                    if (typeof this.onMediaCallOk === 'function') {
                        this.onMediaCallOk(stream);
                    }
                }
                
                // Notify the teacher that the media connection has been fully completed
                this.dataConnection.send({system: {value: "acknowledged"}}); // <==== Ack
            });

            this.mediaConnection.on('error', (err) => {
                let e = {
                    type: 'media connection',
                    name: err.name,
                    msg: err.message,
                    retry: false,
                    cause: 'mediacall'
                };
                console.log("[Student] remote media connection has received an error: " + e);
                if (typeof this.onError === 'function') this.onError(e);                
            });
            
            this.mediaConnection.on('close', () => {
                console.log("[Student] remote media connection has been closed"); 
                me.teacherVideoElement.srcObject = null;
            });     
            
        }


        this.dataConnection.on('open', () => {
            console.log("Data connection established");
            
            if (typeof this.onConnect === 'function') this.onConnect();
            
            this.dataConnection.on('data', (data) => {
            
//              console.log("Received data:", data);
                
                if (data.system != null) {
                    let err = null;
                    switch (data.system.value) {
                    case 'connection refused':
                        err = {
                            type: 'connection-rejected',
                            msg: "Error, connection has been rejected: " + data.system.description,
                            retry: true,
                            cause: 'connect',
                        };
                        console.log("Connection refused" + err);
                        if (typeof this.onDataCallFail === 'function') this.onDataCallFail(err);
                        this.hangup();
                        break;
                    case 'connection accepted':
                        console.log("Data connection accepted and established");
                        if (typeof this.onDataCallOk === 'function') this.onDataCallOk(teacherUserName);
                        handleMediaConnection(); // <=== MEDIA CONNECTION HERE!!!
                        
                        break;
                    case 'logoff':
                        console.log("Teacher is logging off - session closed");
                        this.hangup();
                        break;
                    case 'mute teacher':
                        this.teacherMuted = true;
                        this.teacherVideoElement.muted = true;
                        if (typeof this.onTeacherMuted === 'function') this.onTeacherMuted();
                        break;
                    case 'unmute teacher':
                        this.teacherMuted = false;
                        this.teacherVideoElement.muted = false;
                        if (typeof this.onTeacherUnmuted === 'function') this.onTeacherUnmuted();
                        break;
                    
                    default:
                        break;
                    }
                } else if (data.unshareScreen != null) {
                    // Catches the workaround-message for the mediaConnection close event
                    console.log('Teacher has unshared his/her screen');
                    if (typeof this.onScreenShareClose === 'function') this.onScreenShareClose();
                }
                // CALLBACK PER LA GESTIONE DEL PROTOCOLLO?
                if (typeof this.onDataReceived === 'function') this.onDataReceived(data);                
            });
            
            this.dataConnection.on('close', () => {
                console.log("[Student] remote data connection has been closed"); 
                if (typeof this.onDisconnect === 'function') this.onDisconnect();
            });

            this.dataConnection.on('error', (err) => {
                let e = {
                    type: 'data connection',
                    name: err.name,
                    msg: err.message,
                    retry: false,
                    cause: 'data connection'
                };
                console.log("[Student] remote data connection has received an error: " + e);
                if (typeof this.onError === 'function') this.onError(e);
            });
            
        });

    }


    setMediaStream(stream) {

        console.log("Setting or replacing local stream");
    
        
        let micEnabled = true;
        let camEnabled = true;
        if (this.mediaStream) {
            // Save current microphone and camera status
            micEnabled = isAudioEnabled(this.mediaStream);
            if (micEnabled === null) micEnabled = true;
            camEnabled = isVideoEnabled(this.mediaStream) !== false;
        }
    
    //  window.stream = stream; // make stream available to console
        
        this.videoElement.srcObject = stream;
        this.mediaStream = stream;
        
        this.videoElement.onloadedmetadata = (e) => {
            this.videoElement.play();
            this.videoElement.muted = true;
        }
        
        // If a different video or audio device has been selected, we need
        // to replace these tracks in streams to to connected peers, also; 
        if (this.mediaConnection && this.mediaConnection.open) {
            console.log("Media device(s) changed: replacing stream in teacher's connection.");
            replaceStreamInMediaConnection(this.mediaConnection, stream);
            
            reduceOutstreamBandwidth(
                this.mediaConnection,
                studentVideoBW,
                studentVRes,
                studentAudioBW
            );
        }
    
        // Restore local microphone and camera status
        enableAudio(this.mediaStream, micEnabled);
        enableVideo(this.mediaStream, camEnabled); 
    }    
}

function validateEmail(mail) {
    return (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(mail));
}


function setUserMediaConstraints() {

  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });
  }
  const videoSource = $('#select-video-source').val();
  const audioSource = $('#select-audio-source').val();

// console.log("Selected video source: " + videoSource);
// console.log("Selected audio source: " + audioSource);
  
  
  var constraints = LocalCameraConstraints;


  //if (constraints.video == true && videoSource) constraints.video = {};
  //if (constraints.audio == true && audioSource) constraints.audio = {};
  
  if (audioSource) {
      if (constraints.audio == true) constraints.audio = {};
      constraints.audio.deviceId = {exact: audioSource};
  }
  if (videoSource) {
      if (constraints.video == true) constraints.video = {};
      constraints.video.deviceId = {exact: videoSource};
  }
  

  //constraints.video.deviceId = videoSource ? {exact: videoSource} : undefined;
  //constraints.audio.deviceId = audioSource ? {exact: audioSource} : undefined;

  console.log("Device constraints: " + JSON.stringify(constraints));

  navigator.mediaDevices.getUserMedia(constraints)
           .then(gotLocalMediaStream)
           .then(gotDevices)
           .catch(handleLocalMediaStreamError);

}

// Handles error by logging a message to the console.
function handleLocalMediaStreamError(error) {
  console.error(`navigator.getUserMedia error: ${error.toString()}.`);
}


// const pc = booth.mediaConnection.peerConnection;
function reduceOutstreamBandwidth(mediaConnection, vb, vh, ab) {
    

    // let b = 96000;
    // let h = 120;
    // const pc = booth.mediaConnection.peerConnection;
    // vb = 65536;
    // vh = 60;
    // ab = 65536;
    console.log('Bandwidth settings: vb:'+vb+'bps, vh:'+vh+'px, ab:'+ab+'bps');
    
    const pc = mediaConnection.peerConnection;
    
    pc.getSenders().forEach(sender => {
        
        var parameters = sender.getParameters();

        const settings = sender.track.getSettings();
        
        if (!parameters.encodings) {
            parameters.encodings = [{}];
        }

        if (sender.track.kind == 'video') {

            if (vb === 'unlimited') {
                delete parameters.encodings[0].maxBitrate;
            } else {
                parameters.encodings[0].maxBitrate = vb;
            }            
            
            const ratio = sender.track.getSettings().height / vh;
            if (!isNaN(ratio) && ratio >= 1) {
                    parameters.encodings[0].scaleResolutionDownBy = Math.max(ratio, 1);
            }
            
        } else if (sender.track.kind == 'audio') {
            
            if (ab === 'unlimited') {
                delete parameters.encodings[0].maxBitrate;
            } else {
                parameters.encodings[0].maxBitrate = ab;
            }            
            
        } else {
            console.log("Unknown track type: " + sender.track.kind, settings);    
            return;
        }
        
        sender.setParameters(parameters).then(() => {
            console.log("Upstream bandwidth successfully reduced");
        }).catch(e => {
            console.error(e);
            console.log("ERR", parameters);
        });
    });
    
    return;
}



// Il a different video or audio device has been selected we need
// to replace these tracks in streams to connected peers, also;
// and we need to do it ayncronously.
// Call this function passing the media connection and the new
// stream

function replaceStreamInMediaConnection(conn, stream) {
    
    if (!conn || typeof conn !== 'object' || !conn.open) return false;
    if (!stream || typeof stream !== 'object') return false;

    console.log("Replacing stream in media conection to [peer:" + conn.peer +  "]");

//  console.log("V: " + stream.getVideoTracks().length);    
//  console.log("A: " + stream.getAudioTracks().length);    
   
    let pc = conn.peerConnection;
    let tracks = [ stream.getVideoTracks()[0], stream.getAudioTracks()[0] ];
    
    (function() { 
        tracks.forEach((track) => {
            
            var sender = pc.getSenders().find((s) => {
                return s.track.kind == track.kind;
            });
               
            if (sender) {
                track.enabled = sender.track.enabled; // Preserve enabled status of track
                sender.replaceTrack(track); // Replace track
                console.log('Replaced ' + track.kind + ' track.');
            } else {
                console.log('No ' + track.kind + ' track found.');
            }
        });
    }) ();
    
    return true;
}








function isVideoEnabled(stream) {
    if (! stream instanceof  MediaStream) throw Error("not a MediaStream");
    return stream.getVideoTracks()[0].enabled;
}

function isAudioEnabled(stream) {
    if (! stream instanceof  MediaStream) throw Error("not a MediaStream");
    return stream.getAudioTracks()[0].enabled;
}

function enableVideo(stream, v) {
    if (! stream instanceof  MediaStream) throw Error("not a MediaStream");
    
    const tracks = stream.getAudioTracks();
    // if stream has reference to track
    if (tracks[0]) {
        tracks[0].enabled = v;
        return v;
    }
    return null;
}

function enableAudio(stream, v) {
    if (! stream instanceof  MediaStream) throw Error("not a MediaStream");
    
    const tracks = stream.getVideoTracks();
    // if stream has reference to track
    if (tracks[0]) {
        tracks[0].enabled = v;
        return v;
    }
    return null;
}

function toggleAudio(stream) {
    if (! stream instanceof  MediaStream) throw Error("not a MediaStream");
    
    const tracks = stream.getAudioTracks();
    // if stream has reference to track
    if (tracks[0]) {
        tracks[0].enabled = !tracks[0].enabled;
        return tracks[0].enabled;
    }
    return null;
}

function toggleVideo(stream) {
    if (! stream instanceof  MediaStream) throw Error("not a MediaStream");
    
    const tracks = stream.getVideoTracks();
    // if stream has reference to track
    if (tracks[0]) {
        tracks[0].enabled = !tracks[0].enabled;
        return tracks[0].enabled;
    }
    return null;
}


function setBandwidthProfile(profile = 'low') {
    
    if (!BandwidthProfiles[profile]) profile = 'low';
    
    teacherVideoBW = BandwidthProfiles[profile].TeacherVideoBW;
    teacherAudioBW = BandwidthProfiles[profile].TeacherAudioBW;
    teacherVRes    = BandwidthProfiles[profile].TeacherVRes;    
    studentVideoBW = BandwidthProfiles[profile].StudentVideoBW;
    studentAudioBW = BandwidthProfiles[profile].StudentAudioBW;
    studentVRes    = BandwidthProfiles[profile].StudentVRes;
}
