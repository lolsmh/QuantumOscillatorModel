var theCanvas = document.getElementById("theCanvas");
var theContext = theCanvas.getContext("2d");
var pauseButton = document.getElementById("pauseButton");
var speedSlider = document.getElementById("speedSlider");
var realImag = document.getElementById("realImag");
var alphaSlider = document.getElementById("alphaSlider");
var alphaReadout = document.getElementById("alphaReadout");
var textArray = function() {
    var result = new Array()
    for (var i = 0; i < 8; i++) {
        result.push({ number: document.getElementById(`${i}n`), phase: document.getElementById(`${i}p`) })
    }
    return result
}()

var iMax = theCanvas.width
var pxPerX = 60
var clockSpaceFraction = 0.25
var clockRadiusFraction = 0.45
var psi = {re:(new Array(iMax+1)), im:(new Array(iMax+1))}
var nMax = 7
var eigenPsi = new Array(nMax+1)
var amplitude = new Array(nMax+1)
var phase = new Array(nMax+1)
var nColors = 360
var phaseColor = new Array(nColors+1)
var running = true
var mouseIsDown = false
var mouseClock
var isSecondDisplayMode = false
var energyLevelColorArray = ["#FF7F50", "#DC143C", "#9400D3", "#228B22", "#FFFAF0", "#20B2AA", "#FFB6C1", "#FFA500"]

theCanvas.addEventListener('mousedown', mouseDown, false)
document.body.addEventListener('mousemove', mouseMove, false)
document.body.addEventListener('mouseup', mouseUp, false)
theCanvas.addEventListener('touchstart', mouseDown, false)
document.body.addEventListener('touchmove', mouseMove, false)
document.body.addEventListener('touchend', mouseUp, false)

init();
nextFrame();

function init() {
    for (var n=0; n<=nMax; n++) {
        eigenPsi[n] = new Array(iMax+1)
    }
    for (var i=0; i<=iMax; i++) {
        var x = (i - iMax/2) / pxPerX
        eigenPsi[0][i] = Math.exp(-x*x/2)
        eigenPsi[1][i] = Math.sqrt(2) * x * eigenPsi[0][i]
        eigenPsi[2][i] = (1/Math.sqrt(2)) * (2*x*x - 1) * eigenPsi[0][i]
        eigenPsi[3][i] = (1/Math.sqrt(3)) * (2*x*x*x - 3*x) * eigenPsi[0][i]
        eigenPsi[4][i] = (1/Math.sqrt(24)) * (4*x*x*x*x - 12*x*x + 3) * eigenPsi[0][i]
        eigenPsi[5][i] = (1/Math.sqrt(60)) * (4*x*x*x*x*x - 20*x*x*x + 15*x) * eigenPsi[0][i]
        eigenPsi[6][i] = (1/Math.sqrt(720)) * (8*x*x*x*x*x*x - 60*x*x*x*x + 90*x*x - 15) * eigenPsi[0][i]
        eigenPsi[7][i] = (1/Math.sqrt(36*70)) * (8*x*x*x*x*x*x*x - 84*x*x*x*x*x + 210*x*x*x - 105*x) * eigenPsi[0][i]
    }
    // Initialize amplitudes and phases:
    for (var n=0; n<=nMax; n++) {
        amplitude[n] = 0;
        phase[n] = 0;
    }
    amplitude[0] = 1/Math.sqrt(2);
    amplitude[1] = 1/Math.sqrt(2);
    // Initialize array of colors to represent phases:
    for (var c=0; c<=nColors; c++) {
        phaseColor[c] = "#ffffff";
    }
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
        var clockCenterX = clockSpaceHeight * (mouseClock + 0.5);	// relative to left of canvas
        var clockCenterY = theCanvas.height - clockSpaceHeight*0.5;	// relative to top of canvas
        var relX = e.pageX - theCanvas.offsetLeft - clockCenterX;
        var relY = clockCenterY - (e.pageY - theCanvas.offsetTop) ;	// measured up from clock center
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

function mouseMove(e) {
}

function mouseUp(e) {
    mouseIsDown = false;
}

function paintCanvas() {
    theContext.fillStyle = "black";
    theContext.fillRect(0, 0, theCanvas.width, theCanvas.height);
    
    var baselineY, pxPerY;

    if (isSecondDisplayMode) {
        const num = 8
        for(var k = 0; k < num; k++) {
            theContext.strokeStyle = "gray";
            theContext.lineWidth = 1;
            baselineY = theCanvas.height * (1 - clockSpaceFraction) / 8 * (num - k);
            pxPerY = baselineY * 0.9;
            theContext.beginPath();
            theContext.moveTo(0, baselineY);
            theContext.lineTo(theCanvas.width, baselineY);
            theContext.stroke();
            theContext.lineWidth = 2;
            for(var index = 0; index < 8; index++) {
                amplitude[index] = index === k ? 1/Math.sqrt(2) / 8 : 0
            }
            buildPsi()
            theContext.beginPath();
            theContext.moveTo(0, baselineY - psi.re[0]*pxPerY);
            for (var i=1; i<=iMax; i++) {
                theContext.lineTo(i, baselineY - psi.re[i]*pxPerY);
            }
            theContext.strokeStyle = energyLevelColorArray[k];
            theContext.stroke();
            theContext.fillStyle = 'white';
            theContext.font = '20px san-serif';
            theContext.fillText(`n = ${k}`, 6, baselineY - 10);
        }
        baselineY = theCanvas.height * (1 - clockSpaceFraction / 2);
        theContext.beginPath();
        theContext.moveTo(0, baselineY - 0.5 * 1/(520 / 4) * (0 - theCanvas.width / 2) * (0 - theCanvas.width / 2));
        for (var i=1; i<=iMax; i++) {
            theContext.lineTo(i, baselineY - 0.5 * 1/(520 / 4) * (i - theCanvas.width / 2) * (i - theCanvas.width / 2));
        }
        theContext.strokeStyle = "#00FFFF";
        theContext.stroke();

    } else {
        if (realImag.checked) {
            baselineY = theCanvas.height * (1 - clockSpaceFraction) / 2;
            pxPerY = baselineY * 0.9;
            theContext.strokeStyle = "gray";
            theContext.lineWidth = 1;
            theContext.beginPath();
            theContext.moveTo(0, baselineY);
            theContext.lineTo(theCanvas.width, baselineY);
            theContext.stroke();
    
            theContext.lineWidth = 2;
    
            // Plot the real part of psi:
            theContext.beginPath();
            theContext.moveTo(0, baselineY - psi.re[0]*pxPerY);
            for (var i=1; i<=iMax; i++) {
                theContext.lineTo(i, baselineY - psi.re[i]*pxPerY);
            }
            theContext.strokeStyle = "#ffc000";
            theContext.stroke();
    
            // Plot the imaginary part of psi:
            theContext.beginPath();
            theContext.moveTo(0, baselineY - psi.im[0]*pxPerY);
            for (var i=1; i<=iMax; i++) {
                theContext.lineTo(i, baselineY - psi.im[i]*pxPerY);
            }
            theContext.strokeStyle = "red";
            theContext.stroke();
    
        } else {	// "Mag/phase" is checked
    
            // Plot the probability distribution with phase as color:
            baselineY = theCanvas.height * (1 - clockSpaceFraction);
            pxPerY = baselineY * 0.55;
            theContext.lineWidth = 2;
            for (var i=0; i<=iMax; i++) {
                theContext.beginPath();
                theContext.moveTo(i, baselineY);
                theContext.lineTo(i, baselineY - pxPerY*(psi.re[i]*psi.re[i] + psi.im[i]*psi.im[i]));
                var localPhase = Math.atan2(psi.im[i], psi.re[i]);
                if (localPhase < 0) localPhase += 2*Math.PI;
                theContext.strokeStyle = phaseColor[Math.round(localPhase * nColors / (2*Math.PI))];
                theContext.stroke();
            }
        }
        var phasorSpace = theCanvas.height * clockSpaceFraction;
        var clockRadius = phasorSpace * clockRadiusFraction;
        for (var n=0; n<=nMax; n++) {
            theContext.strokeStyle = "gray";
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
            textArray[n].number.textContent = `n = ${n}`
            if (amplitude[n] != 0) {
                textArray[n].phase.textContent = `p = ${Math.round(phase[n] * 100) / 100}`
            } else {
                textArray[n].phase.textContent = `p = 0`
            }
        }
    }
}

function startStop() {
    running = !running;
    if (running) {
        pauseButton.innerHTML = "Пауза";
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

function normalizePsi() {
    var norm2 = 0;
    for (var n=0; n<=nMax; n++) {
        norm2 += amplitude[n] * amplitude[n];
    }
    if (norm2 > 0) {
        for (var n=0; n<=nMax; n++) {
            amplitude[n] /= Math.sqrt(norm2);
        }
        buildPsi();
        paintCanvas();
    }
}

function coherent() {
    var alphaMag = Number(alphaSlider.value);
    var nFact = 1;
    for (var n=0; n<=nMax; n++) {
        if (n > 0) nFact *= n;
        amplitude[n] = Math.pow(alphaMag, n) / Math.sqrt(nFact);
        phase[n] = 0;
    }
    normalizePsi();
}

function adjustAlpha() {
    alphaReadout.innerHTML = Number(alphaSlider.value).toFixed(1);
}

function changeDisplayMode() {
    isSecondDisplayMode = !isSecondDisplayMode
    if (!isSecondDisplayMode) {
        for(var index = 0; index < 8; index++) {
            amplitude[index] = 0
        }
        amplitude[0] = 1/Math.sqrt(2)
    }
    buildPsi();
    paintCanvas()
}