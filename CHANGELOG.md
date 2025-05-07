## [v0.9.0]
Media files are now loaded via XMLHttpRequest instead of Fetch (see new MediaFetcher class in utils.js).  
Implemented loading completion percentage.  
Booths now download files only if actually necessary.  
If a webcam cannot be used (or if none is detected) a replacement video stream showing a clock is sent to the other peer. In this way it is possible to participate to the class even without a webcam (see FakeWebcam class in rebooth.js).

## [v0.8.6]
Improved device detection (new device and device removal detection).

## [v0.8.5]
The sound effect file paths have been parametrised.  
PeerJS library does not allow to send big files via data channel in JSON mode: booths snapshots are now done on teacher side. This feature has been flagged for removal.  
15 character limit for the name showed in the chat has been removed.

## [v0.8.4]
Improvements to the chat system (the most visible is the emoji picker).  
More tooltips have been added.  
Minor code cleanup.  
Removed unneeded javascript library.

## [v0.8.3]
Many minor fixes.
File manager content syncronization between concurrent sessions.  
Regression fixed on session timeout handling.

## [v0.8.2]
Enhanced session timeout 

## [v0.8.1]
Debug messages can now be logged to server (no need to collect them from teacher and booths)

## [v0.8.0]
In "class call" mode it is now possible to talk to a single booth and to broadcast its audio to the others. A single booth can talk at a time but everybody now can listen to it.

## [v0.7.3]
Class call mode is now displayed also on each single booth.  
When a booth connects after the class has actually started now can see if the class call mode is active or if the teacher is talking to someone.

## [v0.7.2]
The vumeter code used to visually check if the microphone is working has been rewrittend and added to the instructor setup panel, also.

## [v0.7.1]
Chat display code has been rewritten.  
Minor bug fixes.  
Minor file manager interface changes.

## [v0.7.0]
Introduced video media support.

## [v0.6.6]
Audio feedback when sims/cons are over.

## [v0.6.5]
Source audio overboost option in configuration panel for booths.

## [v0.6.4]
Introduced optional "double track" recording on booth's recorder (player audio track on R channel, booth audio on L channel). This feature is disabled by default and can be enabled (at run time) in the audio device configuration panel by the instructor.

## [v0.6.3]
Added booths volume slider to the instructor interface.  
Volume overboost option for audio file player for instructor and booth.  
Volume overboost option for booth audio for instructor.
Added credits page.

## [v0.6.2]
Introduced the "split audio" feature. The instructor can now hear booth on one channel of his/her headphone and the floor audio on the other. This feature is disabled by default and can be enabled (at run time) in the audio device configuration panel by the instructor.

## [v0.6.1]
Initial GitHub release
