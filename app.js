// app.js

function startCamera() {
  const constraints = {
    video: {
      facingMode: 'user'  // You can specify preferred video height
    }
  };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      let video = document.getElementById("cameraFeed");
      video.srcObject = stream;
      processCameraFeed();
    })
    .catch((err) => {
      console.error("Error accessing the camera: ", err);
    });
}

  
  function processCameraFeed() {
    let video = document.getElementById("cameraFeed");
    let canvas = document.getElementById("processedFeed");
    let context = canvas.getContext("2d");
  
    let lastFrameData = null;
    let frameDifferences = []; // Store the last 5 frames of differences
    let historyLength = 8; // Number of frames to consider for averaging
  
    video.addEventListener('play', function() {
      function step() {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
  
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        let currentFrameData = context.getImageData(0, 0, canvas.width, canvas.height);
  
        if (lastFrameData) {
          let frameDifference = context.createImageData(canvas.width, canvas.height);
  
          // Calculate the difference in pixel values for the current frame
          for (let i = 0; i < currentFrameData.data.length; i += 4) {
            let diff = Math.abs(currentFrameData.data[i] - lastFrameData.data[i]) +
                       Math.abs(currentFrameData.data[i+1] - lastFrameData.data[i+1]) +
                       Math.abs(currentFrameData.data[i+2] - lastFrameData.data[i+2]);
            frameDifference.data[i] = diff;
            frameDifference.data[i+1] = diff;
            frameDifference.data[i+2] = diff;
            frameDifference.data[i+3] = 255;
          }
  
          frameDifferences.push(frameDifference);
          if (frameDifferences.length > historyLength) {
            frameDifferences.shift();
          }
  
          let motionFrameData = context.createImageData(canvas.width, canvas.height);
  
          // Calculate average difference over the history
          for (let i = 0; i < motionFrameData.data.length; i += 4) {
            let sumDiff = 0;
            for (let j = 0; j < frameDifferences.length; j++) {
              sumDiff += frameDifferences[j].data[i];
            }
            let avgDiff = sumDiff / frameDifferences.length;
  
            // Simple thresholding to identify motion
            if (avgDiff > 30) { // Adjust this threshold as needed
              motionFrameData.data[i] = 255;   // R
              motionFrameData.data[i+1] = 0;   // G
              motionFrameData.data[i+2] = 0;   // B
              motionFrameData.data[i+3] = 100; // A (transparency)
            }
          }
  
          // Draw the original video
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          // Overlay the motion regions
          context.putImageData(motionFrameData, 0, 0);
        }
  
        lastFrameData = currentFrameData;
  
        if (!video.paused && !video.ended) {
          requestAnimationFrame(step);
        }
      }
      requestAnimationFrame(step);
    });
  }
  
  window.onload = startCamera;
  
