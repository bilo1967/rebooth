/*
/*
*  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
*
*  Use of this source code is governed by a BSD-style license
*  that can be found in the LICENSE file in the root of the source
*  tree.
*/


var videoSelect       = null; // select box for video source devices
var audioInputSelect  = null; // select box for audio source devices
var audioOutputSelect = null; // select box for audio output devices

var selectors         = []; 

function setDeviceSelectors(s) {

    if (typeof s !== 'object') return null;
    
    selectors = [];
    
    if (typeof s.vs !== 'undefined') videoSelect       = s.vs;
    if (typeof s.as !== 'undefined') audioInputSelect  = s.as;
    if (typeof s.ao !== 'undefined') audioOutputSelect = s.ao;
    
    if (videoSelect != null) selectors.push(videoSelect);
    if (audioInputSelect != null) selectors.push(audioInputSelect);
    if (audioOutputSelect != null) selectors.push(audioOutputSelect);

    return true;
}


function gotDevices(deviceInfos) {


  // Handles being called several times to update labels. Preserve values.
  const values = selectors.map(select => select.value);
  
  selectors.forEach(select => {
      while (select.firstChild) {
          select.removeChild(select.firstChild);
      }
  });

  for (var i = 0; i < deviceInfos.length; i++) {

    const deviceInfo = deviceInfos[i];
    const option = document.createElement('option');

    option.value = deviceInfo.deviceId;
    
    console.log("Adding " + deviceInfo.kind + " device: " + deviceInfo.label + " with ID " + deviceInfo.deviceId);
    
    if (deviceInfo.kind === 'audioinput' && audioInputSelect != null) {
      option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
      audioInputSelect.appendChild(option);
    } else if (deviceInfo.kind === 'audiooutput' && audioOutputSelect != null) {
      option.text = deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
      audioOutputSelect.appendChild(option);
    } else if (deviceInfo.kind === 'videoinput'  && videoSelect != null) {
      option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
      videoSelect.appendChild(option);
    } else {
      //console.log('Some other kind of source/device: ', deviceInfo);
    }
  }
  selectors.forEach((select, selectorIndex) => {
    if (Array.prototype.slice.call(select.childNodes).some(n => n.value === values[selectorIndex])) {
      select.value = values[selectorIndex];
    }
  });
}

// Attach audio output device to video element using device/sink ID.
function attachSinkId(element, sinkId) {
  if (typeof element.sinkId !== 'undefined') {
    element.setSinkId(sinkId)
      .then(() => {
        console.log(`Success, audio output device attached: ${sinkId}`);
      })
      .catch(error => {
        let errorMessage = error;
        if (error.name === 'SecurityError') {
          errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
        }
        console.error(errorMessage);
        // Jump back to first output device in the list as it's the default.
        audioOutputSelect.selectedIndex = 0;
      });
  } else {
    console.warn('Browser does not support output device selection.');
  }
}

// Change audio destination of selected <video> or <audio> element
function changeAudioDestination(elem) {
  const audioDestination = audioOutputSelect.value;
  attachSinkId(elem, audioDestination);
}
