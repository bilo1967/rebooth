"use strict";


// Debug WebRTC on Chrome: chrome://webrtc-internals/
// Debug WebRTC on Firefox: about:webrtc

// const isRelay = dataConnection.peerConnection.currentLocalDescription.sdp.includes('typ relay');
// const isRelay = mediaConnection.peerConnection.currentLocalDescription.sdp.includes('typ relay');


const AppName              = 'ReBooth';
const AppVersion           = '0.10.0';
const AppAuthor            = 'Gabriele Carioli';
const AppContributors      = 'Nicoletta Spinolo';
const AppCompany           = 'Department of Interpretation and Translation at the University of Bologna';
const AppAuthorShort       = 'G. Carioli';
const AppContributorsShort = 'N. Spinolo';
const AppCompanyShort      = 'D.I.T. at the University of Bologna';
const AppGitHub            = 'https://github.com/bilo1967/reBooth';

var teacherVideoBW = 0; // Max video upstream bandwidth per connection
var teacherAudioBW = 0; // Max audio upstream bandwidth per connection
var teacherVRes    = 0; // Max vertical upstream resolution
var studentVideoBW = 0; // Max upstream bandwidth per connection
var studentAudioBW = 0; // Max upstream bandwidth per connection
var studentVRes    = 0; // Max vertical upstream resolution

setBandwidthProfile();  // Set defaults

class Connection {

    userId        = null;
    userName      = null;
    pin           = null;
    peer          = null;
    mediaStream   = null;
    videoElement  = null;
    mediaRecorder = null;
    
    constructor(config) {
        
        this.userId        = null;
        this.userName      = null;
                          
        this.peer          = null;
                          
        this.mediaStream   = null; 
        this.videoElement  = null;
        this.onError       = null;
        this.mediaRecorder = null;
        
        
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
            if (DebugLevel >= 2) console.log("You're trying to log with username '" + userName + " having id " + this.userId);
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
            if (DebugLevel >= 3) console.log("this.peer.on [id=" + this.userId + "]");
            //this.connected = true;
            if (typeof this.onLogonOk === 'function') this.onLogonOk(id);
        });
        
        this.peer.on('close', () => { 
            if (DebugLevel >= 3) console.log("this.peer.close event");
// GESTIRE CHIUSURA DELLA CONNESSIONE
        });
        
        
        this.peer.on('disconneted', () => { 
            if (DebugLevel >= 3) console.log("We have been disconnected by the signaling server but existing connections should still be alive. Trying to reconnect.");
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

        if (DebugLevel >= 3) {
            console.log("Logs from error() parsing routine here:");
            console.log('----------------------------------------');
            console.log("type: " + err.type);
            console.log("msg:" + err.msg);
            console.log("cause: " + err.cause);
            console.log("retry: " + err.retry);
            console.log('----------------------------------------');
        }
        
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
    
    static validatePin(pin) {
        return (/^[0-9]+$/.test(pin));
    }
    
    static validateEmail(mail) {
        return (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/.test(mail));
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
    
    onBoothConnect     = function(pin, who) { if (DebugLevel >= 2) console.log("User " + who + " (pin: " + pin + ") is connected" ); };
    onBoothConnected   = function(pin, who) { if (DebugLevel >= 2) console.log("User " + who + " (pin: " + pin + ") has completed the connection" ); };
    onBoothDisconnect  = function(pin, who) { if (DebugLevel >= 2) console.log("User " + who + " (pin: " + pin + ") has disconnected"); };
    onDataDataReceived = function(pin, who, data) { if (DebugLevel >= 3) console.log("Data from user " + who + " (pin: " + pin + "):", data);}
    
    onBoothICEConnected = (pin, who) => {};
    onBoothICEDisconnected = (pin, who) => {};
    
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
                
                this.audioCtx = config.boothsGainNode.context;
                this.boothsGainNode = config.boothsGainNode;
                
            }
            
            // Handle ICE events
            if (typeof config.onBoothICEConnected === 'function') this.onBoothICEConnected = config.onBoothICEConnected;
            if (typeof config.onBoothICEDisconnected === 'function') this.onBoothICEDisconnected = config.onBoothICEDisconnected;
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
        
        if (DebugLevel >= 3) console.log('Unsharing screen');

        // Stop the tracks in current screenshare stream to actually stop screensharing
        if (this.sharingScreen()) {
            this.screenShareStream.getTracks().forEach(track => track.stop());
        }
        
        this.forEachConnectedBooth(booth => {
            if (DebugLevel >= 3) console.log("Closing screen share stream for " + booth.pin);
            
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
            if (DebugLevel >= 3) console.log("Sending screen share stream to booth " + booth.pin);
            booth.screenShareConnection = this.peer.call(booth.peer,  this.screenShareStream);
        } else {
            if (!this.sharingScreen() && DebugLevel >= 3) console.log("Not sharing - no need to send a stream");
            if (!this.isBoothConnected(pin) && DebugLevel >= 3) console.log("It seems like boot " + pin + " is not connected");
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
        if (DebugLevel >= 2) console.log("UNmute booth " + pin);
        found.unmute();
    }

    muteBooth(pin) {
        let found = this.booths[pin];
        if (found === 'undefined') return false;
        if (DebugLevel >= 2) console.log("mute booth " + pin);
        found.mute();
    }
    
    
    muteAllBooths() {
        this.forEachBooth(booth => {
            if (DebugLevel >= 2) console.log("mute booth " + booth.pin);
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
            if (DebugLevel >= 2) console.log("Sending " + (v ? "mute" : "unmute") + " teacher command to booth " + booth.pin);
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
        if (DebugLevel >= 2) console.log("Notify logoff to all connected booths");
        this.sendToAll({system: {value: 'logoff'}});
        
        setTimeout(() => {
            // Disconnect all connected booths
            this.forEachConnectedBooth(booth => {
                if (DebugLevel >= 2) console.log("Disconnecting booth " + booth.pin);
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
            
            if (DebugLevel >= 2) console.log("Incoming connection from '" + who + "' using pin '" + pin + "'");
            
            
            // We handle the actual PeerJS connection here
            // Data connection is handled BEFORE media connection
            // The booth starts the media connection only aftet the
            // media connection has been established
            c.on('open', () => {
                if (DebugLevel >= 2) console.log("Data connection established with peer " + c.peer + " identified by:", c.metadata);

                let found = this.booths[pin];
                
                // Pin not found (invalid pin)
                if (found === undefined) {
                    if (DebugLevel >= 2) console.log('pin ' + pin + ' not found');
                    c.send({system: {value: "connection refused", description: "pin not found"}});
                    setTimeout(() => {c.close();}, 1000);
                    if (typeof onErr === 'function') onErr('pin ' + pin + ' not found');
                    return;
                }
                
               
                // Busy
                if (found.dataConnection) {
                    if (DebugLevel >= 2) console.log('pin ' + pin + ' already logged');
                    c.send({system: {value: "connection refused", description: "pin already logged"}});
                    setTimeout(() => {c.close();}, 1000);
                    if (typeof onErr === 'function') onErr('pin ' + pin + ' already logged');
                    return;
                }
               
                // Someone is media-connected using another peer
                if (found.peer != null && found.peer != c.peer) {
                    if (DebugLevel >= 2) console.log('data connection and media connection peer differs');
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
                    if (DebugLevel >= 2) console.log('Connection closed by booth ' + pin);
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
                            if (DebugLevel >= 2) console.log('Booth ' + pin + ' has terminated the call');
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


            if (DebugLevel >= 2) console.log("Media call from a possible booth received: pin="+pin+", who="+who+", dataPeer="+dataPeer);

            let found = this.booths[pin];            


            // Pin not found (invalid pin)
            if (found === undefined) {
                if (DebugLevel >= 2) console.log('pin ' + pin + ' not found');
                c.close();
                return;
            }
            
            // Busy
            if (found.mediaConnection) {
                if (DebugLevel >= 2) console.log('pin ' + pin + ' already logged');   
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
                if (DebugLevel >= 2) console.log(e.msg);
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
                
                found.connect(stream);
       
            });
            
            found.mediaConnection.on('error', (err) => {
                console.warn("Booth[" + found.pin + "]: remote media connection has received an error: ", err);
                if (typeof this.onError === 'function') this.onError(err);
            });
            
            found.mediaConnection.on('close', () => {
                if (DebugLevel >= 2) console.log("Booth[" + found.pin + "]: Remote media stream has been closed"); 
            });              
            
            found.mediaConnection.on('iceStateChanged', (e) => {
                switch(e) {
                case 'new':
                case 'checking':
                    break;
                case 'connected':
                    this.onBoothICEConnected(found.pin, found.who);
                    break;
                case 'disconnected':
                    this.onBoothICEDisconnected(found.pin, found.who);
                    break;
                case 'closed':
                    break;
                case 'failed':
                    break;
                }
                if (DebugLevel >= 2) console.log("ICE event: booth[" + found.pin + "] ICE connection state is now " + e);
            });
            
            found.mediaConnection.answer(this.mediaStream);
            
        });
    }
    
    startBoothBroadcast(pin) {
        
        let found = this.booths[pin];
        
        if (!this.mediaStream || found === 'undefined' || !found.connected()) return false;
        

        // mix teacher's audio with selected booth's audio
        var mySource = this.audioCtx.createMediaStreamSource(this.mediaStream);
        var boothSource = this.audioCtx.createMediaStreamSource(found.mediaStream);
        var mixedAudioDest = audioCtx.createMediaStreamDestination();
        mySource.connect(mixedAudioDest);
        boothSource.connect(mixedAudioDest);
        
        // Now that we have a mixed audio stream, we need to create a new stream
        // with the mixed audio track and the teacher's video track
        
        var mixedMediaStream = new MediaStream();
        mixedMediaStream.addTrack(mixedAudioDest.stream.getAudioTracks()[0]);
        mixedMediaStream.addTrack(this.mediaStream.getVideoTracks()[0]);
        
        this.forEachConnectedBooth(booth => {
            if (booth.pin == pin) return;
            
            if (booth.mediaConnection.open) {
                replaceStreamInMediaConnection(booth.mediaConnection, mixedMediaStream);
                reduceOutstreamBandwidth(
                    booth.mediaConnection,
                    teacherVideoBW,
                    teacherVRes,
                    teacherAudioBW
                );                
            }
        });        
            
            
    }
    stopBoothBroadcast() {
        this.setMediaStream(this.mediaStream);
    }

    setMediaStream(stream) {

        if (DebugLevel >= 2) console.log("Setting or replacing local stream");
        
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
        
        if (DebugLevel >= 2) console.log('Received local stream.');
        
        // If a different video or audio device has been selected, we need
        // to replace these tracks in streams to to connected peers, also; 
        
        this.forEachConnectedBooth(booth => {
            if (DebugLevel >= 3) console.log("Media device(s) changed: replacing stream for booth " + booth.pin + ".");
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
    mediaRecorder         = null;
    teacherMuted          = true;    
    registry              = {};   // Used to store misc. values
//  audioBlob             = null;
//  localMediaStreamCopy  = null;
    
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
      
        this.mediaRecorder = new MyRecorder(this.mediaStream, null, {mimeType: 'audio/webm', audioBitsPerSecond: RecordingAudioSampleRate, });


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
                console.warn("No booths gain node");
                
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
        this.teacherMuted = true;

        // Student could disconnect from booth while 
        // a recording session is still in progress
        if (this.recorderStatus == 'inactive') this.mediaRecorder = null;
        
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
    
    isTeacherMuted() {
        return this.teacherMuted;
    }
    
    muteTeacher(v = true) {
        if (!this.connected) return false;    
        if (v) {
            this.send({system: {value: 'mute teacher'}});
            this.teacherMuted = true;
        } else {
            this.send({system: {value: 'unmute teacher'}});    
            this.teacherMuted = false;
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
        if (!this.mediaRecorder) {
            console.warn("Booth " + this.pin + " recorder is not initialized.");
            return false;
        }
        
        if (DebugLevel >= 2) console.log("Booth " + this.pin + " starts recording.");
        
        this.mediaRecorder.clear();
        this.mediaRecorder.start();
        
        return true;
    }

    stopRecording() {
        if (!this.mediaRecorder) {
            return new Promise((resolve, reject) => { resolve({mediaURL: null, mediaBlob: null, pin: null}); });
        } else {
            return this.mediaRecorder.stop().then((r) => {
                return new Promise(resolve => {
                    resolve( { mediaURL: r.mediaURL, mediaBlob: r.mediaBlob, pin: this.pin });
                });
            });
        }
    }
    
    get recorderStatus() {
        if (DebugLevel >= 2) console.log("Getting recorder status of booth " + this.pin);                
        if (!this.mediaRecorder) {
            console.warn("Booth " + this.pin + " recorder is not initialized");
            return null;
        }
        if (DebugLevel >= 2) console.log("Recorder status of booth " + this.pin + " is " + this.mediaRecorder.status);

        return this.mediaRecorder.status;
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
    mediaRecorder            = null;
         
    // Callbacks
    onTeacherMuted      = function(data)   { if (DebugLevel >= 2) console.log("Muting teacher's audio");}
    onTeacherUnmuted    = function(data)   { if (DebugLevel >= 2) console.log("Unmuting teacher's audio");}
    onDataReceived      = function(data)   { if (DebugLevel >= 2) console.log("Data received");}
    onConnect           = function()       { if (DebugLevel >= 2) console.log("Connected");}
    onDisconnect        = function()       { if (DebugLevel >= 2) console.log("Disconnected");}
    onScreenShareStream = function(stream) { if (DebugLevel >= 2) console.log("Screen share stream received"); }
    onScreenShareClose  = function()       { if (DebugLevel >= 2) console.log("Screen share stream has been closed"); }

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
                if (DebugLevel >= 2) console.log('Teacher has shared his/her screen');
                if (typeof this.onScreenShareStream === 'function') this.onScreenShareStream(stream);
            });

            c.on('close', () => {
                if (DebugLevel >= 2) console.log('Teacher has unshared his/her screen');
                if (typeof this.onScreenShareClose === 'function') this.onScreenShareClose();
            });
            

        });
    }
    
    
    send(data) {
        
        if (this.dataConnection && this.dataConnection.open) this.dataConnection.send(data);
    }    
    

    hangup() {
        if (DebugLevel >= 2) console.log('Logging off');
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

        if (DebugLevel >= 2) console.log("Calling teacher " + teacherUserName + (classCode ? ":" + classCode : "") + " (id: " + teacherId + ") using pin " + pin);
        if (DebugLevel >= 3) console.log("this.userName=" + this.userName);

        this.dataConnection = this.peer.connect(teacherId, { 
            metadata: {pin: pin, userName: this.userName, dataPeer: this.peer.peer}, 
            reliable: true, 
            serialization: 'binary', 
        });
        
        
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
                
                if (DebugLevel >= 2) console.log("Student is receiving stream" /*, stream*/);
                
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
                console.warn("[Student] remote media connection has received an error: " + e);
                if (typeof this.onError === 'function') this.onError(e);                
            });
            
            this.mediaConnection.on('close', () => {
                if (DebugLevel >= 2) console.log("[Student] remote media connection has been closed"); 
                me.teacherVideoElement.srcObject = null;
            });     
            
        }


        this.dataConnection.on('open', () => {
            if (DebugLevel >= 2) console.log("Data connection established");
            
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
                        console.warn("Connection refused" + err);
                        if (typeof this.onDataCallFail === 'function') this.onDataCallFail(err);
                        this.hangup();
                        break;
                    case 'connection accepted':
                        if (DebugLevel >= 2) console.log("Data connection accepted and established");
                        if (typeof this.onDataCallOk === 'function') this.onDataCallOk(teacherUserName);
                        handleMediaConnection(); // <=== MEDIA CONNECTION HERE!!!
                        
                        break;
                    case 'logoff':
                        if (DebugLevel >= 2) console.log("Teacher is logging off - session closed");
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
                    if (DebugLevel >= 2) console.log('Teacher has unshared his/her screen');
                    if (typeof this.onScreenShareClose === 'function') this.onScreenShareClose();
                }
                // CALLBACK PER LA GESTIONE DEL PROTOCOLLO?
                if (typeof this.onDataReceived === 'function') this.onDataReceived(data);                
            });
            
            this.dataConnection.on('close', () => {
                if (DebugLevel >= 2) console.log("[Student] remote data connection has been closed"); 
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
                if (DebugLevel >= 2) console.log("[Student] remote data connection has received an error: " + e);
                if (typeof this.onError === 'function') this.onError(e);
            });
            
        });

    }


    setMediaStream(stream) {

        if (DebugLevel >= 2) console.log("Setting or replacing local stream");
        
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

        if (this.mediaRecorder && this.mediaRecorder.status  == 'recording') {
            if (DebugLevel >= 2) console.log("Media device(s) changed: replacing stream in recorder (recording).");
            this.mediaRecorder.replaceStream(stream);
        }         
        
        this.mediaStream = stream;

        this.videoElement.onloadedmetadata = (e) => {
            this.videoElement.play();
            this.videoElement.muted = true;
        }
        
        // If a different video or audio device has been selected, we need
        // to replace these tracks in streams to to connected peers, also; 
        if (this.mediaConnection && this.mediaConnection.open) {
            if (DebugLevel >= 2) console.log("Media device(s) changed: replacing stream in teacher's connection.");
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



//
// This class implements a multimedia stream that can be used as
// a 'service' video track in a WebRTC connection that requires 
// a webcam when it is not available. This is achieved by streaming
// the contents of a canvas element (canvas.captureStream)
// The canvas contains 3 textual elements: an emoji, a message and
// a clock.
//
// var camera = new FakeWebcam({
//     width:   320,      // logical width of the canvas
//     height:  200,      // logical heigth of the canvas  
//     message: "Hello",  // message to be displayed
//     emoji:   "",       // emoji placed over the message (default: Face Screaming In Fear)
//     mirror:  false,    // canvas must be mirrored (default=false)
//     fps:     2,        // frames per second - it's basically a clock so the default is 1
//     onStart: () => {}, // callback function fired when the method "start" is issued
//     onStop:  () => {}, // callback function fired when the method "stop" is issued
// });
//
// navigator.mediaDevices.getUserMedia({audio: true}).then((stream) => {
//     camera.start("No webcam available");
//     stream.addTrack(camera.track);
//     return stream;
// }).then((stream) => { ... })
//
// Note: 
// This is how to capture a stream from a canvas and send it via WebRTC (e.g. to replace a webcam)
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/captureStream
// 
class FakeWebcam {

    canvas = null;
    timer = null;
    canvasCtx = null;
    timerResolution = 1000;

    _stream = null;
    _track = null;
    
    _started = false;
    
    message = 'Unavailable webcam';
    defaultMessage = 'Unavailable webcam';
    // emoji = String.fromCodePoint(0x1F631); // Can also be an array of emojis
    emoji = [
        '😳', '🙄', '😕', '🤨', 
        '🤔', '🤭', '🙂', '😐',
        '😏', '😴', '😴', '😮',
        '😲', '😲', '😊', '😶',
        '😃', '😑', '😏', '😒',
        '😬', '😨'
    ];    
    emojiIndex = 0; // if emoji is an array we need an index to keep track of last one
    w = 288;
    h = 216;
    fps = 1;
    mirror = false;
    background = 'rgba(196,174,173,1)';
    color = 'white';
    
    
    onStart = (m) => {};
    onStop = (m) => {};
    
    constructor(options = {}) {
        
        if (options.width !== undefined) this.w = options.width;
        if (options.height !== undefined) this.h = options.height;
        if (options.message !== undefined) this.message = options.message;
        if (options.emoji !== undefined) this.emoji = options.emoji;
        if (options.mirror !== undefined) this.mirror = options.mirror;
        if (options.color !== undefined) this.color = options.color;
        if (options.background !== undefined) this.background = options.background;
        if (typeof options.onStart === 'function') this.onStart = options.onStart;
        if (typeof options.onStop === 'function') this.onStop = options.onStop;
        if (options.fps !== undefined) {
            this.fps = parseFloat(options.fps); 
        }

        this.canvas = document.createElement('canvas');
        
        // Fix blurred text problem by scaling the canvas size to the true display pixel ratio
        let scale =  window.devicePixelRatio; 
        this.canvas.hidden = true;
        
        this.canvas.style.width = this.w + "px";
        this.canvas.style.height = this.h + "px";
        this.canvas.width = scale * this.w;
        this.canvas.height = scale * this.h;
        
        this.canvasCtx = this.canvas.getContext('2d');

        if (this.mirror) {
            this.canvasCtx.translate(this.canvas.width, 0);
            this.canvasCtx.scale(-1, 1);
        }
    }
    
    start(msg = null) {
        if (this._started) return;
        this._started = true;
        
        document.body.appendChild(this.canvas);
        if (msg !== null) this.message = msg;
        
        // Start animation
        // This is a low fps animation but anyway we use a requestAnimationFrame
        this.timer = setInterval(() => requestAnimationFrame(this.draw), this.timerResolution);

        this.onStart(msg);
        
        this._stream = this.canvas.captureStream(this.fps);
        this._track = this._stream.getVideoTracks()[0];
    }

    stop() {

        if (! this._started) return;
        this._started = false;    

        this.message = this.defaultMessage;
        if (this.timer) clearInterval(this.timer);
        if (this.canvas && document.body.contains(this.canvas)) document.body.removeChild(this.canvas);
        this.onStop();
    }
    
    get stream() {
        return this._stream;
    }

    get track() {
        return this._track;
    }

    draw = () => {
        
        const h = this.canvas.height, 
              w = this.canvas.width,
              th = h / 6;
        
        let now = new Date(),
            time = String('00' + now.getHours()).slice(-2) + ':' +
                   String('00' + now.getMinutes()).slice(-2) + ':' +
                   String('00' + now.getSeconds()).slice(-2);

        this.canvasCtx.clearRect(0, 0, w, h);
       
        this.canvasCtx.fillStyle = this.background;
        this.canvasCtx.fillRect(0, 0, w, h);
        
        this.canvasCtx.lineWidth = 0;
        this.canvasCtx.fillStyle = this.color;
        this.canvasCtx.textBaseline = 'middle';
        this.canvasCtx.textAlign = 'center';

        // Draw current time
        this.canvasCtx.font = th + 'px Helvetica';
        this.canvasCtx.fillText(time, w / 2, h / 2 + 1.5 * th);
        
        // Draw message
        if (this.message) {
            let fs = 2 * th / 3 + 1;
            do {
              fs = fs - 0.5;
              this.canvasCtx.font = fs + 'px Helvetica';  
            } while (this.canvasCtx.measureText(this.message).width > w - 10);
            this.canvasCtx.fillText(this.message, w / 2, h / 2 + 0.5 * th);
        }
        
        // Draw emoji
        this.canvasCtx.font = 2 * th + 'px Helvetica';
        let e = "";
        if (Array.isArray(this.emoji)) {
            if (Math.random() < 0.25) this.emojiIndex = Math.floor(Math.random() * this.emoji.length);
            e = this.emoji[ this.emojiIndex ];
        } else {
            e = this.emoji;
        }
        this.canvasCtx.fillText(e, w / 2, h / 2 - th);
    }
}

var fakeWebcam = null;

function initFakeWebcam(options = {}) {
    console.log("Init fake webcam");
    fakeWebcam = new FakeWebcam(options);
}

function updateFakeWebcam(options = {}) {
    if (options.message !== undefined) fakeWebcam.message = options.message;
    if (options.emoji !== undefined) fakeWebcam.emoji = options.emoji;
    if (options.color !== undefined) fakeWebcam.color = options.color;
    if (options.background !== undefined) fakeWebcam.background = options.background;
};



//function setUserMediaConstraints(onOk = null, onError = null) {
    
function setUserMediaConstraints({onOk, onError, noWebcamMessage}) {    

    
    if (window.stream) {
        window.stream.getTracks().forEach(track => {
            track.stop();
        });
    }
    
    const videoSource = $('#select-video-source').val();
    const audioSource = $('#select-audio-source').val();

  
    var constraints = LocalMediaConstraints;


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

    if (DebugLevel >= 3) console.log("Device constraints: " + JSON.stringify(constraints));


    navigator.mediaDevices.getUserMedia(constraints)
        .then(
            (s) => {
                
                // Promise fulfilled
                fakeWebcam.stop();

                //if (fakeTrack) fakeTrack.stop();
                //fakeTrack = null;

                return gotLocalMediaStream(s);
            },
            (err) => {

                // The required constraints were not accepted. If the problem depends on
                // the webcam, we will try to replace its stream with a bogus one 
                // (from a canvas element) and continue.


                // If the error is not related to the webcam (video) we propagate the error
                if (! (err.message.includes('video') || err.message.includes('not found')  )) throw err;
                
                
                // We now try to get a stream requiring only microphone
                let audioOnly = { audio: constraints.audio };
                
                
                navigator.mediaDevices.getUserMedia(audioOnly).then((stream) => {

                    let t = noWebcamMessage;
                    if (videoSource) {
                        t = $('#select-video-source option:selected').text().match(/^[^()]+/)[0].trim();
                        
                        t = t + ' unavailable';
                    }

                    fakeWebcam.start(t);
                    stream.addTrack(fakeWebcam.track);
                    
                    gotLocalMediaStream(stream);
                })
                
                onError(err.name, err.message);
                return false;
            }
        ).then((s) => { 
            if (typeof s == 'boolean') return;
            if (typeof onOk === 'function') onOk(constraints); 
            return s;
        }).catch((err) => {

            console.log("PASSO DI QUI");

            
            handleLocalMediaStreamError(err);  
            if (typeof onError === 'function') {
                onError(err.name, err.message);
            } 
        });
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
    if (DebugLevel >= 3) console.log('Bandwidth settings: vb:'+vb+'bps, vh:'+vh+'px, ab:'+ab+'bps');
    
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
            if (DebugLevel >= 2) console.log("Unknown track type: " + sender.track.kind, settings);    
            return;
        }
        
        
        sender.setParameters(parameters).then(() => {
            if (DebugLevel >= 3) console.log("Upstream bandwidth successfully reduced");
        }).catch(e => {
            console.warn(e);
            console.warn("Can't set parameters", parameters);
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

    if (DebugLevel >= 3) console.log("Replacing stream in media conection to [peer:" + conn.peer +  "]");

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
                if (DebugLevel >= 3) console.log('Replaced ' + track.kind + ' track.');
            } else {
                if (DebugLevel >= 2) console.log('No ' + track.kind + ' track found.');
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
