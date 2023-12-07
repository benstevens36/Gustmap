document.addEventListener("DOMContentLoaded", function () {
    let video = document.getElementById("cameraFeed");
    let canvasOutput = document.getElementById("canvasOutput");
    let canvasContext = canvasOutput.getContext("2d");

    let cap, frame1, prvs, next;

    function onOpenCVReady() {
        cap = new cv.VideoCapture(video);
        frame1 = new cv.Mat(video.height, video.width, cv.CV_8UC4);
        prvs = new cv.Mat();
        next = new cv.Mat();
        startCamera();
    }

    function checkOpenCVInitialization() {
        if (cv && cv.imread) {
            onOpenCVReady();
        } else {
            setTimeout(checkOpenCVInitialization, 50);
        }
    }

    setTimeout(checkOpenCVInitialization, 50);

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
                console.error("An error occurred while accessing the camera: " + err);
            });
    }

    function drawArrow(context, fromX, fromY, toX, toY, color) {
        var headLength = 10; // length of head in pixels
        var dx = toX - fromX;
        var dy = toY - fromY;
        var angle = Math.atan2(dy, dx);
        context.strokeStyle = color;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(fromX, fromY);
        context.lineTo(toX, toY);
        context.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
        context.moveTo(toX, toY);
        context.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
        context.stroke();
    }

    function processVideo() {
        let frame2 = new cv.Mat(video.height, video.width, cv.CV_8UC4);
        cap.read(frame2);
        cv.cvtColor(frame2, next, cv.COLOR_RGBA2GRAY);

        let flow = new cv.Mat();
        cv.calcOpticalFlowFarneback(prvs, next, flow, 0.5, 3, 15, 3, 5, 1.2, 0);

        canvasContext.clearRect(0, 0, video.width, video.height);
        canvasContext.drawImage(video, 0, 0, video.width, video.height);

        // Increase the spacing to reduce the number of arrows
        for (let y = 0; y < video.height; y += 40) {
            for (let x = 0; x < video.width; x += 40) {
                let idx = (y * video.width + x) * 2;
                let u = flow.data32F[idx];
                let v = flow.data32F[idx + 1];
                if (u > 2 || v > 2) {
                    drawArrow(canvasContext, x, y, x + u, y + v, 'red');
                }
            }
        }

        next.copyTo(prvs);
        frame2.delete();
        flow.delete();
        requestAnimationFrame(processVideo);
    }
});
