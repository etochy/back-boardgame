const Room = require('./Room');

// Require the framework and instantiate it
const fastify = require('fastify')({ logger: true });

//Websocket
fastify.register(require('fastify-websocket'),
  {
    errorHandler: function (error, conn /* SocketStream */, req /* FastifyRequest */, reply /* FastifyReply */) {
      // Do stuff
      // destroy/close connection
      conn.destroy(error)
    },
    options: {
      maxPayload: 1048576, // we set the maximum allowed messages size to 1 MiB (1024 bytes * 1024 bytes)
      clientTracking: true,
      verifyClient: function (info, next) {
        const reg = /\/websocket\/.*/
        const idRoom = info.req.url.substring(11, info.req.url.length);
        if (info.req.url.match(reg) && rooms.has(idRoom)) {
          return next(true) // the connection is allowed
        } else {
          return next(false) // the connection is not allowed
        }
      }
    }
  })

// Salles
var rooms = new Map();

// Declare a route
fastify.get('/', async (request, reply) => {
  return { hello: 'world' }
})

// Get Rooms
fastify.get('/rooms', async (request, reply) => {
  let ret = [];
  rooms.forEach(r => {
    ret.push(r.getRoom());
  })
  return { ret }
})

// Create a room
fastify.post('/rooms/create', async (request, reply) => {
  let creator = request.body.creator;
  let name = request.body.name;
  let password = request.body.password;
  let maxSize = request.body.maxSize;

  let newRoom = new Room(creator, name, password, maxSize);
  rooms.set(newRoom.roomID, newRoom);
  return newRoom.getRoom();
})

// Join Room
fastify.put('/rooms/:id', async (request, reply) => {
  let id = request.params.id;
  let password = request.body ? request.body.password : "";
  let user = request.body ? request.body.user : null;
  if (rooms.has(id) && user) {
    let retJoin = rooms.get(id).joinRoom(user, password);
    if (retJoin) {
      return reply.status(200).send("Now connect to websocket");
    } else {
      return reply.status(400).send("Error while joining the room");
    }
  } else {
    return reply.status(400).send("Room does not exist or username not existing");
  }
})

// Delete a room
fastify.delete('/rooms/:id', async (request, reply) => {
  let id = request.params.id;
  let password = request.body ? request.body.password : "";
  if (rooms.has(id) && rooms.get(id).password === password) {
    rooms.get(id).sendData("Suppression Salle");
    rooms.delete(id);
    return reply.status(204).send();
  } else {
    return reply.status(404).send();
  }
})


// Connect to websocket
fastify.get("/websocket/:id",
  { websocket: true },
  (connection, req) => {
    // manage the connection
    const { socket } = connection;
    const idRoom = req.url.substring(11, req.url.length);

    const room = rooms.get(idRoom);
    room.clientWebSocketJoin(socket);

    room.sendData();

    // send a message to the client as response (TEST PURPOSE)
    socket.on('message', function (message) {
      fastify.log.info(`Received message: ${message}`)
      room.sendData(message.toString());
    });

    // Remove client from socket array in room
    socket.on('close', function(message){
      fastify.log.info(`Close Websocket: ${message}`)
      room.clientWebSocketLeave(socket);
    })
  })


// Run the server!
const start = async () => {
  try {
    await fastify.listen(3000)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()