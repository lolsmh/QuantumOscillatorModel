var theCanvas = document.getElementById("theCanvas");
var theContext = theCanvas.getContext("2d");
var pauseButton = document.getElementById("pauseButton");
var speedSlider = document.getElementById("speedSlider");
var realImag = document.getElementById("realImag");

var iMax = theCanvas.width;
var pxPerX = 60;
var clockSpaceFraction = 0.25;
var clockRadiusFraction = 0.45;
var psi = {re:(new Array(iMax+1)), im:(new Array(iMax+1))}
var nMax = 7;
var eigenPsi = new Array(nMax+1);
var amplitude = new Array(nMax+1);
var phase = new Array(nMax+1);
var nColors = 360;
var phaseColor = new Array(nColors+1);
var running = true;
var mouseIsDown = false;
var mouseClock;

theCanvas.addEventListener('mousedown', mouseDown, false);


init();
nextFrame();

function init() {
    for (var n=0; n<=nMax; n++) {
        eigenPsi[n] = new Array(iMax+1);
    }
    for (var i=0; i<=iMax; i++) {
        var x = (i - iMax/2) / pxPerX;
        eigenPsi[0][i] = Math.exp(-x*x/2);
        eigenPsi[1][i] = Math.sqrt(2) * x * eigenPsi[0][i];
        eigenPsi[2][i] = (1/Math.sqrt(2)) * (2*Math.pow(x, 2) - 1) * eigenPsi[0][i];
        eigenPsi[3][i] = (1/Math.sqrt(3)) * (2*Math.pow(x, 3) - 3*x) * eigenPsi[0][i];
        eigenPsi[4][i] = (1/Math.sqrt(24)) * (4*Math.pow(x, 4) - 12*x*x + 3) * eigenPsi[0][i];
        eigenPsi[5][i] = (1/Math.sqrt(60)) * (4*Math.pow(x, 5) - 20*x*x*x + 15*x) * eigenPsi[0][i];
        eigenPsi[6][i] = (1/Math.sqrt(720)) * (8*Math.pow(x, 6) - 60*x*x*x*x + 90*x*x - 15) * eigenPsi[0][i];
        eigenPsi[7][i] = (1/Math.sqrt(36*70)) * (8*Math.pow(x, 7) - 84*x*x*x*x*x + 210*x*x*x - 105*x) * eigenPsi[0][i];
    }
    for (var n=0; n<=nMax; n++) {
        amplitude[n] = 0;
        phase[n] = 0;
    }
    amplitude[0] = 1/Math.sqrt(2);
    amplitude[1] = 1/Math.sqrt(2);
}

function nextFrame() {
    for (var n=0; n<=nMax; n++) {
        phase[n] -= (n+0.5) * Number(speedSlider.value);
        if (phase[n] < 0) phase[n] += 2*Math.PI;
    }
    buildPsi();
    paintCanvas();
    if (running) window.setTimeout(nextFrame, 1000/30);
}

function buildPsi() {
    for (var i=0; i<=iMax; i++) {
        psi.re[i] = 0;
        psi.im[i] = 0;
    }
    for (var n=0; n<=nMax; n++) {
        var realPart = amplitude[n] * Math.cos(phase[n]);
        var imagPart = amplitude[n] * Math.sin(phase[n]);
        for (var i=0; i<=iMax; i++) {
            psi.re[i] += realPart * eigenPsi[n][i];
            psi.im[i] += imagPart * eigenPsi[n][i];
        }
    }
}

function mouseDown(e) {
    var clockSpaceHeight = theCanvas.height * clockSpaceFraction;
    var clockPixelRadius = clockSpaceHeight * clockRadiusFraction;
    if (e.pageY-theCanvas.offsetTop > theCanvas.height - clockSpaceHeight) {
        mouseClock = Math.floor((e.pageX - theCanvas.offsetLeft) / clockSpaceHeight);
        var clockCenterX = clockSpaceHeight * (mouseClock + 0.5);
        var clockCenterY = theCanvas.height - clockSpaceHeight*0.5;
        var relX = e.pageX - theCanvas.offsetLeft - clockCenterX;
        var relY = clockCenterY - (e.pageY - theCanvas.offsetTop);
        var pixelDistance2 = relX*relX + relY*relY;
        if (pixelDistance2 <= clockPixelRadius*clockPixelRadius) {
            e.preventDefault();
            mouseIsDown = true;
            amplitude[mouseClock] = Math.sqrt(pixelDistance2) / clockPixelRadius;
            phase[mouseClock] = Math.atan2(relY, relX);
            if (phase[mouseClock] < 0) phase[mouseClock] += 2*Math.PI;
            buildPsi();
            paintCanvas();
        }
    }
}


function paintCanvas() {
    theContext.fillStyle = "black";
    theContext.fillRect(0, 0, theCanvas.width, theCanvas.height);
    
    var baselineY, pxPerY;
    baselineY = theCanvas.height * (1 - clockSpaceFraction) / 2;
    pxPerY = baselineY * 0.9;

    theContext.strokeStyle = "gray";
    theContext.lineWidth = 1;
    theContext.beginPath();
    theContext.moveTo(0, baselineY);
    theContext.lineTo(theCanvas.width, baselineY);
    theContext.stroke();

    theContext.lineWidth = 2;

    theContext.beginPath();
    theContext.moveTo(0, baselineY - psi.re[0]*pxPerY);
    for (var i=1; i<=iMax; i++) {
        theContext.lineTo(i, baselineY - psi.re[i]*pxPerY);
    }
    theContext.strokeStyle = "#ffc000";
    theContext.stroke();

    theContext.beginPath();
    theContext.moveTo(0, baselineY - psi.im[0]*pxPerY);
    for (var i=1; i<=iMax; i++) {
        theContext.lineTo(i, baselineY - psi.im[i]*pxPerY);
    }
    theContext.strokeStyle = "#ff0000";
    theContext.stroke();

    var phasorSpace = theCanvas.height * clockSpaceFraction;
    var clockRadius = 50;
    for (var n=0; n<=nMax; n++) {
        theContext.strokeStyle = "white";
        theContext.lineWidth = 1;
        theContext.beginPath();
        var centerX = (n+0.5)*phasorSpace;
        var centerY = theCanvas.height - 0.5*phasorSpace;
        theContext.arc(centerX, centerY, clockRadius, 0, 2*Math.PI);
        theContext.stroke();
        theContext.beginPath();
        theContext.moveTo(centerX, centerY);
        var clockHandX = centerX + clockRadius*amplitude[n]*Math.cos(phase[n]);
        var clockHandY = centerY - clockRadius*amplitude[n]*Math.sin(phase[n]);
        theContext.lineTo(clockHandX, clockHandY);
        theContext.strokeStyle = phaseColor[Math.round(phase[n] * nColors / (2*Math.PI))];
        theContext.lineWidth = 3;
        theContext.stroke();
    }
}

function startStop() {
    running = !running;
    if (running) {
        pauseButton.innerHTML = "Стоп";
        nextFrame();
    } else {
        pauseButton.innerHTML = "Пуск";
    }
}

function zero() {
    for (var n=0; n<=nMax; n++) {
        amplitude[n] = 0;
    }
    buildPsi();
    paintCanvas();
}


