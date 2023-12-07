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
  const gridRows = 10;
  const gridCols = 10;

  video.addEventListener('play', function() {
    function step() {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      let currentFrameData = context.getImageData(0, 0, canvas.width, canvas.height);

      if (lastFrameData) {
        const cellWidth = canvas.width / gridCols;
        const cellHeight = canvas.height / gridRows;

        for (let row = 0; row < gridRows; row++) {
          for (let col = 0; col < gridCols; col++) {
            let xMovement = 0;
            let yMovement = 0;
            let count = 0;

            for (let y = Math.floor(row * cellHeight); y < (row + 1) * cellHeight; y++) {
              for (let x = Math.floor(col * cellWidth); x < (col + 1) * cellWidth; x++) {
                let index = (y * canvas.width + x) * 4;
                let diff = Math.abs(currentFrameData.data[index] - lastFrameData.data[index]);

                if (diff > 30) { // Motion threshold
                  xMovement += (currentFrameData.data[index] - lastFrameData.data[index]);
                  yMovement += (currentFrameData.data[index + 1] - lastFrameData.data[index + 1]);
                  count++;
                }
              }
            }

            if (count > 0) {
              let avgXMovement = xMovement / count;
              let avgYMovement = yMovement / count;

              drawArrow(context, (col + 0.5) * cellWidth, (row + 0.5) * cellHeight, avgXMovement, avgYMovement);
            }
          }
        }
      }

      lastFrameData = currentFrameData;
      if (!video.paused && !video.ended) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  });
}

function drawArrow(ctx, x, y, dx, dy) {
  const arrowLength = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + arrowLength * Math.cos(angle), y + arrowLength * Math.sin(angle));
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Drawing the arrowhead
  ctx.lineTo(x + arrowLength * Math.cos(angle) - 5 * Math.cos(angle - Math.PI / 6), y + arrowLength * Math.sin(angle) - 5 * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(x + arrowLength * Math.cos(angle), y + arrowLength * Math.sin(angle));
  ctx.lineTo(x + arrowLength * Math.cos(angle) - 5 * Math.cos(angle + Math.PI / 6), y + arrowLength * Math.sin(angle) - 5 * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}

window.onload = startCamera;
