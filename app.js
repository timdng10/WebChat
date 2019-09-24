var express = require('express');
var path = require('path');
var WebSocketServer = require('ws').Server


var app = express();
var wss = new WebSocketServer({port: 3001});

const port = 3000;

// view engine setup
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res, next){
  res.sendFile('./views/index.html', {"root": __dirname});
});


var openConnections = {};
var openConnectionsCounter = 0;
wss.on('connection', function (ws) {

  openConnections[openConnectionsCounter] = ws;
  ws.currentID = openConnectionsCounter;
  openConnectionsCounter++;

  ws.on('message', function(message) {

    for(x in openConnections){
      if(x != this.currentID){
        openConnections[x].send(message);
      }
    }
  });

  ws.on('close', function(){
    console.log('websocket connection closed');
    delete openConnections[this.currentID]
  })

});

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
