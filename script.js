console.log("Script loaded. Setting up OpenCV check...");

let video, canvasOutput, canvasContext, cap, frame1, prvs, next, hsv, flow, mag, ang, hsv0, hsv1, hsv2, hsvVec;

function onOpenCVReady() {
    console.log("OpenCV.js is ready.");

    video = document.getElementById("cameraFeed");
    canvasOutput = document.getElementById("canvasOutput");
    canvasContext = canvasOutput.getContext("2d");

    if (!video || !canvasOutput) {
        console.error("HTML elements not found.");
        return;
    }

    try {
        cap = new cv.VideoCapture(video);
        frame1 = new cv.Mat(video.height, video.width, cv.CV_8UC4);
        prvs = new cv.Mat(video.height, video.width, cv.CV_8UC1);
        next = new cv.Mat(video.height, video.width, cv.CV_8UC1);
        startCamera();
    } catch (error) {
        console.error("Error during OpenCV objects initialization: ", error);
    }
}

function checkOpenCvReady() {
    if (cv && cv.imread) {
        console.log("Checking if OpenCV is ready...");
        onOpenCVReady();
    } else {
        console.log("Waiting for OpenCV.js to be ready...");
        setTimeout(checkOpenCvReady, 50);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded and parsed.");
    checkOpenCvReady();
});

function startCamera() {
    console.log("Attempting to start camera...");
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function (stream) {
            console.log("Camera feed started.");
            video.srcObject = stream;
            video.onloadedmetadata = function (e) {
                console.log("Camera metadata loaded, starting video...");
                video.play();
                cap.read(frame1);
                cv.cvtColor(frame1, prvs, cv.COLOR_RGBA2GRAY);
                frame1.delete();
                requestAnimationFrame(processVideo);
            };
        })
        .catch(function (err) {
            console.error("An error occurred while accessing the camera: ", err);
        });
}

function processVideo() {
    try {
        console.log("Processing video frame...");
        let frame2 = new cv.Mat(video.height, video.width, cv.CV_8UC4);
        cap.read(frame2);
        cv.cvtColor(frame2, next, cv.COLOR_RGBA2GRAY);

        // Initialize additional OpenCV objects here
        // ...

        next.copyTo(prvs);
        frame2.delete();
        requestAnimationFrame(processVideo);
    } catch (err) {
        console.error("Error processing video frame: ", err);
    }
}
