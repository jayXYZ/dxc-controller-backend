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
    const query = await Data.findOne({ id: 'skibidi69' }).exec()
    socket.emit('server_update', query);
  })

  socket.on('update_data', async(data) => {
    const updatedData = await Data.findOneAndUpdate({id: 'skibidi69'}, data, {new: true});
    io.emit('server_update', updatedData);
  })

  socket.on('increment_games_won', async(playerindex) => {
    const query = await Data.findOne({ id: 'skibidi69' }).exec()
    let payload = (playerindex === 0) ? { p1gameswon: query.p1gameswon + 1 } : { p2gameswon: query.p2gameswon + 1 }
    const updatedData = await Data.findOneAndUpdate({id: 'skibidi69'}, payload, {new: true});
    io.emit('server_update', updatedData);
  })

  socket.on('disconnect', () => {
    console.log('user disconnected');
  })
});


server.listen(port, ()=> {
  console.log(`Server is running on port ${port}`)
});
