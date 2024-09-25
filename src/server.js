import express from 'express'
import http from 'http'
import cors from 'cors'
import { Server } from 'socket.io'
import mongoose from 'mongoose'
import 'dotenv/config'
import Data from '../models/schemas.js'

const port = process.env.PORT || 4000;
const app = express();
app.use(cors());
const server = http.createServer(app);

// const corsOptions = {
//   origin: '*',
//   credentials: true,
//   optionSuccessStatus: 200
// }

mongoose.connect(process.env.DB_URI)
.then(console.log('DB connected!'))
.catch(err => console.log(err))

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
  },
});


io.on('connection', async(socket) => {
  console.log('a user connected');

  socket.on('request_data', async() => {
    const query = await Data.find({ id: 'skibidi69' }).exec()
    socket.emit('server_update', query);
  })

  socket.on('check_if_active', async(instancename, callback) => {
    const query = await Data.find({ id: instancename }).exec()
    callback(query);
  })

  socket.on('create_instance', async(instancename) => {
    await new Data({id:instancename}).save();
  })

  socket.on('join_instance', async(instancename, callback) => {
    const currentData = await Data.findOne({id: instancename})
    socket.join(instancename);
    callback(currentData);
    console.log('added user to room ' + instancename);
  })

  socket.on('update_data', async(instancename, data) => {
    const updatedData = await Data.findOneAndUpdate({id: instancename}, data, {new: true});
    socket.to(instancename).emit('server_update', updatedData);
  })

  socket.on('hey_listen', () => {
    console.log("i'm awake")
  })

  socket.on('disconnect', () => {
    // on dc check to see how many remaining connections 
    // wait this doesn't work how i want it to
    // need to check how many sockets are in a room?
    // so i need to create an array that stores all the connections
    // that get added to a room?

  })
});


server.listen(port, ()=> {
  console.log(`Server is running on port ${port}`)
});
