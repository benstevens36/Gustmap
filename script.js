let video, canvasOutput, canvasContext, cap, frame1, prvs, next, hsv, flow, mag, ang, hsv0, hsv1, hsv2, hsvVec;

function onOpenCVReady() {
    video = document.getElementById("cameraFeed");
    canvasOutput = document.getElementById("canvasOutput");
    canvasContext = canvasOutput.getContext("2d");

    cap = new cv.VideoCapture(video);
    frame1 = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    prvs = new cv.Mat(video.height, video.width, cv.CV_8UC1);
    hsv = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    flow = new cv.Mat(video.height, video.width, cv.CV_32FC2);
    mag = new cv.Mat(video.height, video.width, cv.CV_32FC1);
    ang = new cv.Mat(video.height, video.width, cv.CV_32FC1);
    hsv0 = new cv.Mat(video.height, video.width, cv.CV_8UC1);
    hsv1 = new cv.Mat(video.height, video.width, cv.CV_8UC1, new cv.Scalar(255));
    hsv2 = new cv.Mat(video.height, video.width, cv.CV_8UC1);
    hsvVec = new cv.MatVector();
    hsvVec.push_back(hsv0); hsvVec.push_back(hsv1); hsvVec.push_back(hsv2);
    next = new cv.Mat(video.height, video.width, cv.CV_8UC1);

    startCamera();
}

function checkOpenCvReady() {
    if (cv && cv.imread) {
        onOpenCVReady();
    } else {
        console.log("Waiting for OpenCV to be ready...");
        setTimeout(checkOpenCvReady, 50);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    checkOpenCvReady();
});

function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function (stream) {
            video.srcObject = stream;
            video.onloadedmetadata = function (e) {
                video.play();
                cap.read(frame1);
                cv.cvtColor(frame1, prvs, cv.COLOR_RGBA2GRAY);
                frame1.delete();
                requestAnimationFrame(processVideo);
            };
        })
        .catch(function (err) {
            console.error("An error occurred: " + err);
        });
}

function processVideo() {
    try {
        let frame2 = new cv.Mat(video.height, video.width, cv.CV_8UC4);
        cap.read(frame2);
        cv.cvtColor(frame2, next, cv.COLOR_RGBA2GRAY);

        cv.calcOpticalFlowFarneback(prvs, next, flow, 0.5, 3, 15, 3, 5, 1.2, 0);
        cv.split(flow, hsvVec);
        let u = hsvVec.get(0);
        let v = hsvVec.get(1);
        cv.cartToPolar(u, v, mag, ang);
        u.delete(); v.delete();
        
        ang.convertTo(hsv0, cv.CV_8UC1, 180 / Math.PI / 2);
        cv.normalize(mag, hsv2, 0, 255, cv.NORM_MINMAX, cv.CV_8UC1);
        
        hsvVec = new cv.MatVector();
        hsvVec.push_back(hsv0); 
        hsvVec.push_back(hsv1); 
        hsvVec.push_back(hsv2);

        cv.merge(hsvVec, hsv);
        cv.cvtColor(hsv, frame2, cv.COLOR_HSV2RGB);

        cv.imshow('canvasOutput', frame2);

        next.copyTo(prvs);
        frame2.delete();
        requestAnimationFrame(processVideo);
    } catch (err) {
        console.error("Error in processVideo: ", err);
    }
}
