module.exports = function(RED) {
    "use strict";

    const isNumber = require('is-number');

    function countdown(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.config = config;

        // Local variables
        var ticker = null;
        var ticks = -1;
        var timeout = parseInt(node.config.timer);

        var stopMsg = {};

        this.status({ fill: "red", shape: "dot", text: "Stopped: " + timeout });

        function startTimer() {
            timeout = timeout || parseInt(node.config.timer);
            ticks = timeout;

            node.status({
                fill: "green", shape: "dot", text: "Running: " + ticks
            });

            // Timer Message
            var msg = {}
            msg.payload = RED.util.evaluateNodeProperty(node.config.payloadTimerStart, node.config.payloadTimerStartType, node); 
            if (node.config.topic !== '') {
                msg.topic = node.config.topic;
            }

            // only send stop msg if type is not equal "send nothing" option
            if (node.config.payloadTimerStartType !== "nul") {
                node.send([msg, null]);
            }


            if (!ticker) {
                ticker = setInterval(function() { node.emit("TIX"); }, 1000);
            }
        }

        function stopTimer(onReset = false) {
            node.status({
                fill: "red", shape: "dot", text: "Stopped: " + timeout
            });

            // Timer Message
            var msg = {}

            if (node.config.payloadTimerStopType === 'msg') {
                msg = stopMsg;
            } else {
                msg.payload = RED.util.evaluateNodeProperty(node.config.payloadTimerStop, node.config.payloadTimerStopType, node); 
            }
            
            if (node.config.topic !== '') {
                msg.topic = node.config.topic;
            }

            var remainingTicksMsg = { "payload": 0 };

            // only send stop msg if type is not equal "send nothing" option
            if (node.config.payloadTimerStopType == "nul") {
                node.send([null, remainingTicksMsg]);
            } else {
                if (node.config.outputOnReset) {
                    node.send([msg, remainingTicksMsg]);
                } else {
                    if (onReset) {
                        node.send([null, remainingTicksMsg]);
                    } else {
                        node.send([msg, remainingTicksMsg]);
                    }
                }
            }

            endTicker();
        }

        function endTicker() {
            if (ticker) {
                clearInterval(ticker);
                ticker = null;
            }

            ticks = -1;
        }

        node.on("TIX", function() {
            if (ticks > 1) {
                ticks--;

                var remainingTicksMsg = { "payload": ticks };
                node.send([null, remainingTicksMsg]);
        
                node.status({
                    fill: "green", shape: "dot", text: "Running: " + ticks
                });

            } else if (ticks == 1){
                stopTimer();

                ticks = 0;

            } else {
                // Do nothing
            }
        });

        node.on("input", function (msg) {
            if (msg.topic === "control") {
                if (isNumber(msg.payload) && msg.payload > 1) {
                    timeout = Math.ceil(msg.payload);

                    if (ticker) {
                        // countdown is running
                        if (node.config.setTimeToNewWhileRunning) {
                            ticks = msg.payload;
                            node.status({
                                fill: "green", shape: "dot", text: "Running: "+ timeout
                            });
                        }
                    } else {
                        // countdown is stopped
                        if (node.config.startCountdownOnControlMessage) {
                            startTimer();
                        } else {
                            node.status({
                                fill: "red", shape: "dot", text: "Stopped: "+ timeout
                            });
                        }
             
                    }
                } else {
                    // do nothing
                }
            } else {
                // if payload type of stop message is msg, store it in stopMsg var
                if (node.config.payloadTimerStopType === 'msg') {
                    var prop = RED.util.evaluateNodeProperty(node.config.payloadTimerStop, node.config.payloadTimerStopType, node);
                    if(msg.hasOwnProperty(prop)) {
                        stopMsg = {
                            "payload": msg[prop]
                        };
                    } else {
                        node.warn("Property not set correctly! Input Message does not have property: " + prop);
                        stopMsg = {
                            "payload": prop
                        };
                    }
                }

                if (msg.payload === false || msg.payload === 0) {
                    stopTimer(true);
                } else {
                    if (ticker) {
                        if (node.config.resetWhileRunning) {
                            endTicker();
                            startTimer();
                        }
                    } else {
                        startTimer();
                    }
                }
            }
        });

        node.on("close", function() {
            if (ticker) {
                clearInterval(ticker);
            }
        });
    }
    RED.nodes.registerType("countdown", countdown);
}
