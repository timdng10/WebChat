

var ws = new WebSocket('ws://' + window.location.hostname + ':3001');

ws.onopen = function(){
  //ws.send('connected');
}

ws.onmessage = function (event) {
  let data = JSON.parse(event.data);

  switch (data.msgtype) {
    case 'offer':
      answer(data.description);
      break;
    case 'answer':
      recieveAnswer(data.description);
      break;
    case 'icecandidate':
      addIceCandidate(data.candidate);
      break;
    default:
      console.error('Unrecognized type: ' + data.msgtype)
  }
}

///////////////
const configuration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302'
    }
  ]
};
let peerConnection = new RTCPeerConnection(configuration);

function hasUserMedia() {
   //check if the browser supports the WebRTC
   return !!(navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mediaDevices ||
      navigator.mozGetUserMedia);
}

if (hasUserMedia()) {
   //enabling video and audio channels
   if(navigator.mediaDevices){
     navigator.mediaDevices.getUserMedia({ video: false, audio: true })
     .then(function (stream) {
        for (const track of stream.getTracks()) {
          peerConnection.addTrack(track, stream);
        }

     })
     .catch(function (err) {});
   }
} else {
   alert("WebRTC is not supported");
}

let inboundStream = null;

peerConnection.ontrack = (event) => {
  let audio = document.querySelector('audio');

  if (event.streams && event.streams[0]) {
    audio.srcObject = event.streams[0];
  } else {
    if (!inboundStream) {
      inboundStream = new MediaStream();
      audio.srcObject = inboundStream;
    }
    inboundStream.addTrack(event.track, event.streams[0]);
  }
}

peerConnection.onicecandidate = function(event){
  ws.send(JSON.stringify({msgtype: 'icecandidate', candidate: event.candidate}));
}


peerConnection.ondatachannel = function(event) {
  receiveChannel = event.channel;
  receiveChannel.onerror = (event) => {console.log("Ooops...error:", error)};
  receiveChannel.onmessage = (event) => {console.log('Message: ' + event.data)};
  receiveChannel.onclose = (event) => {console.log("data channel is closed")};
  receiveChannel.onopen = (event) => {console.log("data channel is opened")};
}

peerConnection.onnegotiationneeded = function(){
    console.log('Renegotiating WEEE')
};


let channel = peerConnection.createDataChannel('messaging-channel', {});

async function offer(){
  await peerConnection.createOffer().then(function(description) {
    peerConnection.setLocalDescription(description);
    ws.send(JSON.stringify({msgtype: 'offer', description: description}));
  })
}

async function answer(description){
  peerConnection.setRemoteDescription(description);

  await peerConnection.createAnswer().then(function(description) {
    peerConnection.setLocalDescription(description);
    ws.send(JSON.stringify({msgtype: 'answer', description: description}));
  })
}

function addIceCandidate(iceCan){
  if(iceCan && iceCan.candidate){
    peerConnection.addIceCandidate( iceCan )
  }

}

async function recieveAnswer(description){
  await peerConnection.setRemoteDescription(description);
}

const sendOffer = document.getElementById('sendOffer');

sendOffer.addEventListener('click', async function(){
  await offer()
});
