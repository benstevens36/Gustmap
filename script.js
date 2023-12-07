console.log("Script loaded. Setting up OpenCV check...");

let video, canvasOutput, canvasContext, cap, prvs, next;

function initializeOpenCVObjects() {
    try {
        cap = new cv.VideoCapture(video);
        prvs = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC1);
        next = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC1);
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
                console.log("Camera metadata loaded, setting canvas size...");
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

cv['onRuntimeInitialized'] = onOpenCVReady;

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded and parsed.");
    if (!cv || !cv.imread) {
        console.error("OpenCV is not ready or not loaded.");
    }
});

function processVideo() {
    try {
        // Update the canvas size to match the video size each frame
        canvasOutput.width = video.videoWidth;
        canvasOutput.height = video.videoHeight;

        // Create new matrices with the updated dimensions
        let frame2 = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC4);
        let next = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC1);

        // Read the current frame from the video
        cap.read(frame2);

        // Convert to grayscale
        cv.cvtColor(frame2, next, cv.COLOR_RGBA2GRAY);

        // Calculate optical flow
        let flow = new cv.Mat();
        cv.calcOpticalFlowFarneback(prvs, next, flow, 0.5, 3, 15, 3, 5, 1.2, 0);

        // Draw the optical flow arrows
        for (let y = 0; y < video.videoHeight; y += 20) {
            for (let x = 0; x < video.videoWidth; x += 20) {
                let idx = (y * video.videoWidth + x) * 2;
                let u = flow.data32F[idx];
                let v = flow.data32F[idx + 1];
                if (Math.abs(u) > 2 || Math.abs(v) > 2) {
                    drawArrow(canvasContext, x, y, x + u, y + v);
                }
            }
        }

        // Update previous frame and clean up
        prvs.delete();
        prvs = next.clone();
        frame2.delete();
        flow.delete();

        // Request next frame processing
        requestAnimationFrame(processVideo);
    } catch (err) {
        console.error("Error processing video frame: ", err);
    }
}


function drawArrow(context, fromX, fromY, toX, toY) {
    var headLength = 10; // length of head in pixels
    var dx = toX - fromX;
    var dy = toY - fromY;
    var angle = Math.atan2(dy, dx);
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
