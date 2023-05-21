document.addEventListener("DOMContentLoaded", function () {
    const videoElement = document.getElementById("video");
    const playButton = document.getElementById("play-button");
    const timeElement = document.getElementById("time");
    const scoreElement = document.getElementById("score");
  
    playButton.addEventListener("click", function () {
      // Access webcam
      if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(function (stream) {
            videoElement.srcObject = stream;
  
            // Start the timer
            let secondsRemaining = 60;
            const timerInterval = setInterval(function () {
              secondsRemaining--;
              timeElement.textContent = formatTime(secondsRemaining);
  
              if (secondsRemaining <= 0) {
                clearInterval(timerInterval);
                endGame();
              }
            }, 1000);
          })
          .catch(function (error) {
            console.log("Error accessing webcam: ", error);
          });
      } else {
        console.log("getUserMedia not supported");
      }
    });
  
    function formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    }
  
    function endGame() {
      // Stop accessing webcam and video
      const stream = videoElement.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(function (track) {
        track.stop();
      });
  
      // Animate game over message and score
      timeElement.classList.add("game-over-animation");
      scoreElement.classList.add("game-over-animation");
      timeElement.textContent = "Game Over";
      scoreElement.textContent = "Score: 100"; // Replace with your actual score
    }
  });
  