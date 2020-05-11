# node-red-contrib-countdown

A simple countdown node. Starts countdown on any input. Immediatly ends countdown on payload "false" or "0".
Sends a configurable payload on start and end of countdown on output 1 and remainining time in seconds on output 2 (while running). 
      
Countdown time can be set dynamically by using a Message with topic set to "control" and a number as payload (number of seconds to count down).


Loosely based on prior work by Neil Cherry: https://github.com/linuxha/node-red-contrib-mytimeout