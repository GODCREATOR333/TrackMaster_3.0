const videoElement = document.getElementById('video-element');


navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
  .then(stream => {
    videoElement.srcObject = stream;
    videoElement.play();
  })
  .catch(error => console.error(error));
