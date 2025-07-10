## [v0.10.1]
Revised and cleaned HTML structure of both student and teacher interface for better responsiveness. The video feed of students now completely fills the booth layout, which is more compact. The page resizing algorithm has been simplified. 

Fixed a bug when starting/joining the class was denied for credential clashes. Now a dialog box explicitly reports the error.

Now the vertical sliders are implemented with the new standard features.

## [v0.10.0]
Upload percentage: as the booths upload recordings to the server, an indicator appears in the teacher's application showing the upload percentage, booth by booth.

Recording indicator: when the booths are recording, the blue header of the active booths turns red in the teacher's application. The indicator only appears during actual recording. For example, in a consecutive recording, the booths "turn red" only after the song has been played, when recording starts.

Confirmation request for booth disconnection: when the student clicks on "leave" a confirmation is now requested, indicating that any recording in progress would be lost.

Improved management of timeouts (idle timeout and upload timeout): now, if the upload of the recording to the server does not proceed, due to network congestion problems, i.e. when no data is transferred in a certain time (idle timeout) the student application stops the upload and reports the problem to the teacher's desk, who can then request a new upload by clicking on the orange diskette. Previously, this functionality was only enabled if the entire upload took longer than a certain time (upload timeout). 
The idle timeout is set to 8 seconds and the upload timeout to 5 minutes. Thus, the transfer is stopped if it does not take place within 5 minutes, or if no data is transferred in 8 seconds.

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
