import mongoose from 'mongoose'

const Schema = mongoose.Schema

const dataSchema = new Schema({
    id: {type:String, required:true},
    p1name: {type:String, default:''},
    p1deck: {type:String, default:''},
    p1life: {type:Number, default:20},
    p1record: {type:String, default:''},
    p1gameswon: {type:Number, default:0},
    p2name: {type:String, default:''},
    p2deck: {type:String, default:''},
    p2life: {type:Number, default:20},
    p2deck: {type:String, default:''},
    p2record: {type:String, default:''},
    p2gameswon: {type:Number, default:0},
    event: {type:String, default:''},
    format: {type:String, default:'Premodern'},
    commentators: {type:String, default:''},
    round: {type:String, default:''},
    cardimage: {type:String, default:'https://cards.scryfall.io/png/front/c/a/ca367f49-0f4a-4b7f-8104-851893fbcd8a.png?1562937711'},
    timerExpiry: {type:Date, default:null},
    timerIsRunning: {type:Boolean, default:false}
})

const Data = mongoose.model('Data', dataSchema, 'data')

export default Data