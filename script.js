console.log("Script loaded. Setting up OpenCV check...");

let video, canvasOutput, canvasContext, cap, prvs, next;

function onOpenCVReady() {
    console.log("OpenCV.js is ready.");
    initializeVideoStream();
}

function initializeVideoStream() {
    video = document.getElementById("cameraFeed");
    canvasOutput = document.getElementById("canvasOutput");
    canvasContext = canvasOutput.getContext("2d");

    if (!video || !canvasOutput) {
        console.error("HTML elements not found.");
        return;
    }

    const constraints = {
        video: {
            width: { max: 640 }, // Example resolution constraint
            height: { max: 480 }
        }
    };

    console.log("Attempting to start camera...");
    navigator.mediaDevices.getUserMedia(constraints)
        .then(function (stream) {
            console.log("Camera feed started.");
            video.srcObject = stream;
            video.onloadedmetadata = function (e) {
                console.log("Camera metadata loaded, starting video...");
                video.play();
                canvasOutput.width = video.videoWidth;
                canvasOutput.height = video.videoHeight;
                initializeOpenCVObjects();
            };
        })
        .catch(function (err) {
            console.error("An error occurred while accessing the camera: ", err);
        });
}


function initializeOpenCVObjects() {
    try {
        cap = new cv.VideoCapture(video);
        prvs = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC1);
        next = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC1);
        canvasOutput.width = video.videoWidth;   // Set canvas dimensions
        canvasOutput.height = video.videoHeight;
        console.log("OpenCV objects initialized with video dimensions: ", video.videoWidth, video.videoHeight);
        requestAnimationFrame(processVideo);
    } catch (error) {
        console.error("Error during OpenCV objects initialization: ", error);
    }
}

function processVideo() {
    try {
        console.log("Starting processVideo function...");

        let frame2 = new cv.Mat(video.height, video.width, cv.CV_8UC4);
        cap.read(frame2);

        if (frame2.empty()) {
            console.error("No frames grabbed.");
            frame2.delete();
            return;
        }

        let next = new cv.Mat(video.height, video.width, cv.CV_8UC1);
        cv.cvtColor(frame2, next, cv.COLOR_RGBA2GRAY);
        cv.imshow('canvasOutput', next);

        let flow = new cv.Mat();
        console.log("Calculating optical flow...");
        cv.calcOpticalFlowFarneback(prvs, next, flow, 0.5, 3, 15, 3, 5, 1.2, 0);

        for (let y = 0; y < video.height; y += 20) {
            for (let x = 0; x < video.width; x += 20) {
                let idx = (y * video.width + x) * 2;
                let u = flow.data32F[idx];
                let v = flow.data32F[idx + 1];
                if (Math.abs(u) > 2 || Math.abs(v) > 2) {
                    drawArrow(canvasContext, x, y, x + u, y + v);
                }
            }
        }

        hideLoadingMessage();
        prvs.delete();
        prvs = next.clone();
        frame2.delete();
        flow.delete();
        requestAnimationFrame(processVideo);
    } catch (err) {
        console.error("Error processing video frame: ", err);
    }
}

function hideLoadingMessage() {
    let loadingMessage = document.getElementById("loadingMessage");
    if (loadingMessage && loadingMessage.style.display !== "none") {
        console.log("Hiding loading message.");
        loadingMessage.style.display = "none";
    }
}


function drawArrow(context, fromX, fromY, toX, toY) {
    var dx = toX - fromX;
    var dy = toY - fromY;
    var angle = Math.atan2(dy, dx);
    var length = Math.sqrt(dx * dx + dy * dy);

    // Scale the head length based on the arrow length
    var headLength = length * 0.15; // Adjust the 0.15 factor to scale the arrow head

    // Ensure the head isn't too big or too small
    headLength = Math.max(headLength, 5); // Minimum size
    headLength = Math.min(headLength, 20); // Maximum size

    context.strokeStyle = 'red';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(fromX, fromY);
    context.lineTo(toX, toY);
    context.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    context.moveTo(toX, toY);
    context.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    context.stroke();
}


cv['onRuntimeInitialized'] = onOpenCVReady;

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded and parsed.");
    if (!cv || !cv.imread) {
        console.error("OpenCV is not ready or not loaded.");
    }
});
