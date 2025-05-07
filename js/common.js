//
// Common interface controls, functions and constants
//

const noSrc = "https://:0/"; 

//
// Writes messages to #log-board-item
//
function appendLog(message, cls="") {
    $("#log-board").append('<div class="log-board-item ' + cls + '">' + message + "</div>");
    $("#log-board").scrollToEnd();
    $("#log-board-container").scrollToEnd();
}

//
// load and update clock 
// references #date and #time divs
//

function loadClock() {
    updateClock();
    setInterval(() => requestAnimationFrame(updateClock), 1000);
}

function updateClock(){
    var months = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];
    var days = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ];
   
    var date = new Date();
   
    var hours = date.getHours();
    
    var minutes = date.getMinutes() < 10 
                  ? '0' + date.getMinutes() 
                  : date.getMinutes();
    
    //var seconds = date.getSeconds() < 10 
    //              ? '0' + date.getSeconds() 
    //              : date.getSeconds();
    
    var dayOfWeek = days[date.getDay()];
    //var month = months[date.getMonth()];
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var year = date.getFullYear();
    
    var dateString = dayOfWeek + ', ' + day + '/' + month + '/' + year;
    
    $('#date').text(dateString);
    $('#time').text(hours+":"+minutes);
} 


//
// Handle input devices setup success or failure (uses toastr)
//

function handleMediaSuccess(c) {

    var videoDeviceId = c.video.deviceId !== undefined ? c.video.deviceId.exact : 'default';
    var audioDeviceId = c.audio.deviceId !== undefined ? c.audio.deviceId.exact : 'default';
    
    var videoDeviceDescr = $("#select-video-source option:selected").text().replace(/ *\([0-9a-z]+:[0-9a-z]+\)$/i, '');
    var audioDeviceDescr = $("#select-audio-source option:selected").text().replace(/ *\([0-9a-z]+:[0-9a-z]+\)$/i, '');
    
    if (videoDeviceDescr == '') videoDeviceDescr = 'default';
    if (audioDeviceDescr == '') audioDeviceDescr = 'default';
    
    toastr.success(
        "Video device: &ldquo;" + videoDeviceDescr + "&rdquo;<br/>" +
        "Audio device: &ldquo;" + audioDeviceDescr + "&rdquo;",
        "Audio and video device successfully set",
         {positionClass: "toast-middle", timeOut: 2000}
    );

    if (DebugLevel >= 3) console.log(`${videoDeviceId}:[${videoDeviceDescr}] => ` + $("#select-video-source").val() );
    if (DebugLevel >= 3) console.log(`${audioDeviceId}:[${audioDeviceDescr}] => ` + $("#select-audio-source").val() );
    
    appendLog('Camera: ' + videoDeviceDescr, 'log-item-info');
    appendLog('Microphone: ' + audioDeviceDescr, 'log-item-info');
}


function handleMediaErrors(err, message) {
    var msg, dev;
    
    switch(err) {
    case 'NotAllowedError':
        bootbox.alert({
            centerVertical: true,
            title: "Error: you've denied the usage of your webcam or microphone",
            message: AppName + " will not work if you don't allow the usage of your webcam and microphone/headset.<br/>Please, check the address bar of your browser and click on the <i class=\"fas fa-lock\"></i> symbol if you're using Chrome or <i class=\"fas fa-video\"></i> if you're using Firefox and grant the usage of your webcam and microphone."
        });
        break;
    case 'AbortError':
    case 'NotReadableError':
    case 'OverconstrainedError':
        dev = message.includes('video') ? 'webcam' : (message.includes('audio') ? 'microphone' : 'device');
        msg = "The selected " + dev + " can't be used at this time or is not responding.";
        toastr.warning(msg + "<br/>" + AppName + " will not work properly without a webcam or microphone. Please, select another one.", "Warning", {positionClass: "toast-middle", timeOut: 5000} );
        appendLog(msg);
        break;

    default:
        console.warn("handleMediaErrors:", err, message);
        break;
    }
}


//
// Writes messages to the log board
// CSS is used to emphasize and better distinguish messages from various users
// Messages are written to #chat-board
// The #chat-text input box is cleared when the author is 
//

var lastWhoWroteToChat = "-";
var lastChatMessageId = 0;
var chatLastTimer = null;
function writeToChat(t, who = "") {

    who = who + ""; // Type casting
    
    t = anchorme({
        input: t, 
        options: { 
            attributes: {
                target: "_blank", 
                class: "chat-url",
            },
            truncate: 24,
            middleTruncation: false,
        }
    });

    const chatIdPrefix = 'chat-id-';

    if (who == "") $('#chat-text').val('');
    
    if (chatLastTimer) clearTimeout(chatLastTimer);
    
    var c = (who == "") ? "chat-me" : "chat-them";
    
    var whoText = "";
    if (who != lastWhoWroteToChat) {

        $('#' + chatIdPrefix + lastChatMessageId).addClass('chat-last');
        if (who != "") {
            whoText = '<span class="chat-who">' + who + ':</span>';
            c += " chat-first"
        }
    }
    
    if (who == 'teacher') c += " chat-teacher";
    
    lastWhoWroteToChat = who;
    lastChatMessageId++;
    
    var html = '<div class="hyphenate ' + c + '" id="' + chatIdPrefix + lastChatMessageId + '">' +
               whoText +
               t + '</div>'
               ;
    
    
    $("#chat-board").append(html);
    $("#chat-board").scrollToEnd();
    
    if (who != '') animateCSS('#' + chatIdPrefix + lastChatMessageId, "shakeX");
    
    // Close the last baloon after 30 sec
    if (who != "") {
        ((id) => {
            chatLastTimer = setTimeout(function() {
                $('#' + id).addClass('chat-last');
                lastWhoWroteToChat = "-";
            }, 30000);
                
        })( chatIdPrefix + lastChatMessageId );
    }
        
}



// Setup the VU-Meter

// This functions draws a bar vumeter for MediaStream stream on a canvas element elem
// options.bars: maximum bars on canvas
// options.barSepWidth: pixels separating each bar

function setVuMeter(stream, elem, options = {type: 'dbmeter', bars: 20, barSepWidth: 1 } ) {
    
    if (stream == null) return;

    if (! stream instanceof MediaStream) throw Error("stream is not a MediaStream");
    if (! elem instanceof HTMLCanvasElement) throw Error("elem parameter is not a canvas");
    
    if (typeof close === 'function') 

    // Check options consistency
    if (options.bars == 0) options.bars = 1
    
    var canvasCtx = elem.getContext("2d", {alpha: false});

    
    var audioCtx = new AudioContext();    

    var srcNode = audioCtx.createMediaStreamSource(stream); // create an audioctx source node from stream
    
    // Create an analyser to draw a waveform for audio input
    var analyser = audioCtx.createAnalyser();
    
    var bufferLength = 0;
    var dataArray = [];
    
    if (options.type == 'waveform') {
        analyser.fftSize = 2048;
        analyser.minDecibels = -90; 
        analyser.maxDecibels = -10;
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
    } else if (options.type == 'dbmeter') {
        //analyser.smoothingTimeConstant = .5;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -35;
        analyser.frequencyBinCount = 16;
        dataArray = new Uint8Array(1);
    } else {
        //analyser.smoothingTimeConstant = .5;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -35;
        analyser.frequencyBinCount = 16;
        dataArray = new Uint8Array(1);        
    }

    // Create a zero gain node to avoid audio feedback to headphones
    var zeroGain = audioCtx.createGain();
    zeroGain.gain.value = 0.0;
    
    // Create node chain 
    srcNode.connect(analyser);
    analyser.connect(zeroGain);
    zeroGain.connect(audioCtx.destination);


    // Common canvas and analyser values
    
    
    
    // Get canvas width and height
    const w = elem.width * window.devicePixelRatio;
    const h = elem.height * window.devicePixelRatio;
    
    elem.width = w;
    elem.height = h;
    
    // Compute vertical bar width
    const barWidth = Math.ceil( (w - (options.bars-1) * options.barSepWidth) / options.bars );
    
    // Shortcuts to decibel range
    const minD = analyser.minDecibels;
    const maxD = analyser.maxDecibels;
    const rangeD = maxD - minD;
    
    
    
    // Clear canvas
    canvasCtx.clearRect(0, 0, w, h);
    
    
    // Define draw function
    var draw = null;
    
    if (options.type == 'waveform') {

        //
        // waveform meter
        //
        
        const dx = 1.0 * w / bufferLength;

        draw = () => {

            var drawVisual = requestAnimationFrame(draw);

            analyser.getByteTimeDomainData(dataArray);

            canvasCtx.fillStyle = 'rgb(255, 255, 255)';
            canvasCtx.fillRect(0, 0, w, h);

            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
            canvasCtx.beginPath();
            
            var x = 0;
            
            for(var i = 0; i < bufferLength; i++) {
                var v = dataArray[i] / 128.0;
                var y = v * h/2;
        
                if(i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }
        
                x += dx;
            }
            
            canvasCtx.lineTo(w, h/2);
            canvasCtx.stroke();
        };
        

    } else if (options.type == 'dbmeter') {
        //
        // dB meter
        //

        const step = w / rangeD;
        
        
        draw = () => {
            var drawVisual = requestAnimationFrame(draw);

            analyser.getByteFrequencyData(dataArray);

            // clear canvas
            canvasCtx.fillStyle = 'rgb(240, 240, 240)'; 
            canvasCtx.fillRect(0, 0, w, h);
            

            var value = dataArray[0];
            var percent =  value / 255;
            var dB = minD + rangeD * percent; // If needed
            
            //var x = (dB - minD) * step;
            
            var x = percent * w;
            var n = Math.round(percent * options.bars);
            

            if (percent >= 0.9)
                canvasCtx.fillStyle = 'rgb(200,40,40)'; // draw in red when audio is loud
            else
                canvasCtx.fillStyle = 'rgb(40,40,150)'; // else draw in blude            
            
            for (var c = 0, i = 0; i < n; i++) {
                canvasCtx.fillRect(c, 0, barWidth - options.barSepWidth, h);
                c += barWidth + options.barSepWidth;
            }            
            
            canvasCtx.stroke();

        }
    } else {
        
        // Just display dBs
        
        draw = () => {
            var drawVisual = requestAnimationFrame(draw);

            analyser.getByteFrequencyData(dataArray);

            // clear canvas
            canvasCtx.fillStyle = 'rgb(250, 250, 250)';
            canvasCtx.fillRect(0, 0, w, h);
            // canvasCtx.clearRect(0, 0, w, h);
            

            var value = dataArray[0];
            var percent =  value / 255;
            var dB = minD + rangeD * percent; // If needed
            
            canvasCtx.font = "16px sans-serif"; 
            canvasCtx.textAlign = "center";
            canvasCtx.fillStyle = 'black';
            canvasCtx.fillText(parseFloat(dB).toFixed(1) + ' dB', w/2, h/2 + 6  );

            canvasCtx.stroke();
        }
    }
    draw();
    
    return () => {
        canvasCtx.clearRect(0, 0, w, h);
        audioCtx.close();
    };
}

// Sets the MediaStream as the video element src and draws a vumeter for it's audio
function gotLocalMediaStream(stream) {


    me.setMediaStream(stream);
    setVuMeter(stream, $("#vumeter").get(0));
    window.stream = stream;
    
    if (DebugLevel >= 3)  console.log("gotLocalMediaStream");
    
    // Pass argument to next element in promise chain
    //return navigator.mediaDevices.enumerateDevices();  
    return stream;
}

//refreshes the PHP session every t minutes (default=5)
function keepAliveSession(t = 5) {
    setInterval( function() {
        $.post('actions/keepalive.php');
    }, t * 60000); 
}

    
// Potrebbe non funzionare su Android?
    
//  var audioCtx = new AudioContext();
//  const MaxVolume = 1;
//  function bindMediaElementToGainNode(elem) {
//      var source = audioCtx.createMediaElementSource(elem);
//      elem.volume = 1/MaxVolume;
//      
//      // create a gain node
//      var gainNode = audioCtx.createGain();
//      gainNode.gain.value = MaxVolume; 
//      source.connect(gainNode);
//      
//      // connect the gain node to an output destination
//      gainNode.connect(audioCtx.destination);
//  }
//  bindMediaElementToGainNode($("#audio-player")[0]);