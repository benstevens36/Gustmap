console.log("Script loaded. Setting up OpenCV check...");

let video, canvasOutput, canvasContext, cap, prvs, next;

function initializeOpenCVObjects() {
    try {
        cap = new cv.VideoCapture(video);
        prvs = new cv.Mat(video.height, video.width, cv.CV_8UC1);
        next = new cv.Mat(video.height, video.width, cv.CV_8UC1);
        console.log("OpenCV objects initialized");
        requestAnimationFrame(processVideo);
    } catch (error) {
        console.error("Error during OpenCV objects initialization: ", error);
    }
}

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

    console.log("Attempting to start camera...");
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function (stream) {
            console.log("Camera feed started.");
            video.srcObject = stream;
            video.onloadedmetadata = function (e) {
                console.log("Camera metadata loaded, starting video...");
                video.play();
                initializeOpenCVObjects();
            };
        })
        .catch(function (err) {
            console.error("An error occurred while accessing the camera: ", err);
        });
}

cv['onRuntimeInitialized'] = onOpenCVReady;

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded and parsed.");
    if (!cv || !cv.imread) {
        console.error("OpenCV is not ready or not loaded.");
    }
});

function processVideo() {
    try {
        console.log("Processing video frame...");
        let frame1 = new cv.Mat(video.height, video.width, cv.CV_8UC4);
        cap.read(frame1);
        cv.cvtColor(frame1, prvs, cv.COLOR_RGBA2GRAY);
        frame1.delete();
        // More OpenCV processing...
    } catch (err) {
        console.error("Error processing video frame: ", err);
    }
}
