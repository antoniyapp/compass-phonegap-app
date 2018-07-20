// Service/Characteristics for TECO Vibration Wearable.
var VIB_SERVICE	       	= "713D0000-503E-4C75-BA94-3148F18D941E";
var VIB_CHARACTERISTIC	= "713D0003-503E-4C75-BA94-3148F18D941E";

// Start listening for deviceready event.
document.addEventListener('deviceready', onDeviceReady, false);

// The BLE device
var connectedDevice;
var scanTimeout;
var cycleInterval;
var alpha=new Object();

// TypedArray for data we want to send (4 bytes)
var data = new Uint8Array(4);


// Set status line when device is ready.
function onDeviceReady() {
}
function getCardinal(angle) {

    var directions = 8;

    var degree = 360 / directions;
    angle = angle + degree/2;

    if (angle >= 0 * degree && angle < 1 * degree)
        return "N";
    if (angle >= 1 * degree && angle < 2 * degree)
        return "NE";
    if (angle >= 2 * degree && angle < 3 * degree)
        return "E";
    if (angle >= 3 * degree && angle < 4 * degree)
        return "SE";
    if (angle >= 4 * degree && angle < 5 * degree)
        return "S";
    if (angle >= 5 * degree && angle < 6 * degree)
        return "SW";
    if (angle >= 6 * degree && angle < 7 * degree)
        return "W";
    if (angle >= 7 * degree && angle < 8 * degree)
        return "NW";

    return "N";
}
window.addEventListener("deviceorientation", handleOrientation, true);
function handleOrientation (event){
    alpha.degree = event.alpha;
    alpha.newCardinal=getCardinal(360-alpha.degree);
    // Do something
    if(alpha!==null) {

        $("#dataContainer").html(''+ Math.ceil(360-alpha.degree)+'&deg;');
    }
    $("#compassContainer").css({'transform' : 'rotate('+ alpha.degree +'deg)'});

}


// When scan button is clicked, check if BLE is enabled and available, then start BLE scan.
    function startBLEScan() {
    ble.isEnabled(bleEnabled, bleDisabled);
}

// Set status line when BLE is disabled or not available.
function bleDisabled() {
    $("#status").html("Enable Bluetooth first.").fadeIn();
    setTimeout(function(){$("#status").fadeOut()}, 1000);
}

// BLE is enabled, start scan for 10 seconds.
function bleEnabled() {

    // Set status line.
    $("#status").html("Scanning...").fadeIn();

    // Start scan with "device found"-callback.
    ble.scan([], 10, function(device) {
        // The success callback is called each time a peripheral is discovered. Scanning automatically stops after the specified number of seconds.
        if (device.id==="E8:F8:F1:7D:FC:5B") {
            $("#status").html("Connecting...").fadeIn();
            setTimeout(function(){$("#status").fadeOut()}, 1000);
            // If so, stop scan immediately and connect.
            ble.stopScan(stopSuccess, stopFailure);
            clearTimeout(scanTimeout);
            ble.connect(device.id, connectSuccess, connectFailure);
        } else {
            // Device is not one of our wearables. No action required.
        }
    }, function() {
        $("#status").html("Scan failed.").fadeIn();
        setTimeout(function(){$("#status").fadeOut()}, 1000);
    });

    // If device was not found after 10 seconds, stop scan.
    scanTimeout = setTimeout(stopBLEScan, 10000);
}

function stopSuccess(){}

function stopFailure(){}

// Callback for finished BLE scan.
function stopBLEScan(){
    $("#status").html("Scan finished.").fadeIn();
    setTimeout(function(){$("#status").fadeOut()}, 1000);
}

// Connection failed or connection lost. Set status accordingly.
function connectFailure(peripheral) {
    $("#status").html("Disconnected.").fadeIn();
    setTimeout(function(){$("#status").fadeOut()}, 1000);

    clearInterval(cycleInterval);
     $("#disconnectButtn").fadeOut();

}

// Callback for established connection.
function connectSuccess(device) {
    connectedDevice = device;

    // Print all device info to debug.
    console.log(JSON.stringify(device));
    $("#status").html("Connected!").fadeIn();
    setTimeout(function(){$("#status").fadeOut()}, 1000);
    $("#scanButton").fadeOut();
    $("#disconnectButtn").fadeIn();
    //get the cardinal direction and turn on motor according to it
    alpha.cardinal=getCardinal(360-alpha.degree);
    turnMotors(alpha.cardinal);
    // Initial state of the compas
    ble.writeWithoutResponse(connectedDevice.id, VIB_SERVICE, VIB_CHARACTERISTIC, data.buffer, writeDone, writeFailure);
    // Listen for changes in cardinal direction every 1 second
    cycleInterval = setInterval(onCardinalChange, 1000);
}
function turnMotors(dir) {
    //easy to customize by changing the number of directions you have

    if (dir==="N") //north
    {
        data[0] = 0xff;
        data[1] = 0x00;
        data[2] = 0x00;
        data[3] = 0x00;
        //alpha.cardinal='N';
    }
    if (dir==="NE"){ //ne
        data[0] = 0xff;
        data[1] = 0xff;
        data[2] = 0x00;
        data[3] = 0x00;
       // alpha.cardinal='NE';
    }

    if (dir==="E") { //e
        data[0] = 0x00;
        data[1] = 0xff;
        data[2] = 0x00;
        data[3] = 0x00;
       // alpha.cardinal='E';
    }
    if (dir==="SE") { //se
        data[0] = 0x00;
        data[1] = 0xff;
        data[2] = 0xff;
        data[3] = 0x00;
       // alpha.cardinal='SE';
    }
    if (dir==="S") { //s
        data[0] = 0x00;
        data[1] = 0x00;
        data[2] = 0xff;
        data[3] = 0x00;
       // alpha.cardinal='S';
    }
    if (dir==="SW") {//sw
        data[0] = 0x00;
        data[1] = 0x00;
        data[2] = 0xff;
        data[3] = 0xff;
       // alpha.cardinal='SW';
    }

    if (dir==="W") { //w
        data[0] = 0x00;
        data[1] = 0x00;
        data[2] = 0x00;
        data[3] = 0xff;
      //  alpha.cardinal='W';
    }
    if (dir==="NW") { //nw
        data[0] = 0xff;
        data[1] = 0x00;
        data[2] = 0x00;
        data[3] = 0xff;
     //   alpha.cardinal='NW';
    }
}
function onCardinalChange() {
    if(alpha.cardinal!=alpha.newCardinal){
        alpha.cardinal=alpha.newCardinal;
       turnMotors(alpha.cardinal);
        // Send byte array to wearable.
        ble.writeWithoutResponse(connectedDevice.id, VIB_SERVICE, VIB_CHARACTERISTIC, data.buffer, writeDone, writeFailure);
    }

}
// Callback when write is done.
function writeDone() {
}

// Callback when write fails.
function writeFailure() {
}
function disconnect() {
    ble.disconnect(connectedDevice.id, disconnectSuccess,disconnectFailure);
}
function disconnectSuccess() {
    $("#status").html("Disconnected successful.").fadeIn();
    setTimeout(function(){$("#status").fadeOut()}, 1000);
    $('#disconnectButtn').fadeOut();
    $("#scanButton").fadeIn();
    clearInterval(cycleInterval);

}
function disconnectFailure() {
    $("#status").html("Disconnection failure.").fadeIn();
    setTimeout(function(){$("#status").fadeOut()}, 1000);
}