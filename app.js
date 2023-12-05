// app.js

function startCamera() {
    navigator.mediaDevices
      .getUserMedia({ video: true })
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
    let historyLength = 4; // Number of frames to consider for averaging
    let motionRadius = 2; // Radius for enlarging motion regions

    video.addEventListener('play', function() {
      function step() {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        let currentFrameData = context.getImageData(0, 0, canvas.width, canvas.height);

        // Dimming the background
        for (let i = 0; i < currentFrameData.data.length; i += 4) {
          currentFrameData.data[i] *= 0.7;     // R
          currentFrameData.data[i + 1] *= 0.7; // G
          currentFrameData.data[i + 2] *= 0.7; // B
        }

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
          for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
              let sumDiff = 0;
              for (let j = 0; j < frameDifferences.length; j++) {
                let index = (y * canvas.width + x) * 4;
                sumDiff += frameDifferences[j].data[index];
              }
              let avgDiff = sumDiff / frameDifferences.length;

              // Simple thresholding to identify motion
              if (avgDiff > 30) { // Adjust this threshold as needed
                // Color the pixels around the current pixel
                for (let dy = -motionRadius; dy <= motionRadius; dy++) {
                  for (let dx = -motionRadius; dx <= motionRadius; dx++) {
                    if (x + dx >= 0 && x + dx < canvas.width && y + dy >= 0 && y + dy < canvas.height) {
                      let motionIndex = ((y + dy) * canvas.width + (x + dx)) * 4;
                      motionFrameData.data[motionIndex] = 255;     // R
                      motionFrameData.data[motionIndex + 1] = 0;   // G
                      motionFrameData.data[motionIndex + 2] = 0;   // B
                      motionFrameData.data[motionIndex + 3] = 150; // A (increased opacity)
                    }
                  }
                }
              }
            }
          }

          // Draw the dimmed original video
          context.putImageData(currentFrameData, 0, 0);
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
