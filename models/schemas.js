import mongoose from "mongoose";

const Schema = mongoose.Schema;

const dataSchema = new Schema({
  id: { type: String, required: true },
  match1p1name: { type: String, default: "" },
  match1p1deck: { type: String, default: "" },
  match1p1decklist: { type: Array, default: [] },
  match1p1life: { type: Number, default: 20 },
  match1p1record: { type: String, default: "" },
  match1p1gameswon: { type: Number, default: 0 },
  match1p2name: { type: String, default: "" },
  match1p2deck: { type: String, default: "" },
  match1p2life: { type: Number, default: 20 },
  match1p2decklist: { type: Array, default: [] },
  match1p2record: { type: String, default: "" },
  match1p2gameswon: { type: Number, default: 0 },
  match2p1name: { type: String, default: "" },
  match2p1deck: { type: String, default: "" },
  match2p1decklist: { type: Array, default: [] },
  match2p1life: { type: Number, default: 20 },
  match2p1record: { type: String, default: "" },
  match2p1gameswon: { type: Number, default: 0 },
  match2p2name: { type: String, default: "" },
  match2p2deck: { type: String, default: "" },
  match2p2life: { type: Number, default: 20 },
  match2p2decklist: { type: Array, default: [] },
  match2p2record: { type: String, default: "" },
  match2p2gameswon: { type: Number, default: 0 },
  match3p1name: { type: String, default: "" },
  match3p1deck: { type: String, default: "" },
  match3p1decklist: { type: Array, default: [] },
  match3p1life: { type: Number, default: 20 },
  match3p1record: { type: String, default: "" },
  match3p1gameswon: { type: Number, default: 0 },
  match3p2name: { type: String, default: "" },
  match3p2deck: { type: String, default: "" },
  match3p2life: { type: Number, default: 20 },
  match3p2decklist: { type: Array, default: [] },
  match3p2record: { type: String, default: "" },
  match3p2gameswon: { type: Number, default: 0 },
  event: { type: String, default: "" },
  format: { type: String, default: "Premodern" },
  commentators: { type: String, default: "" },
  round: { type: String, default: "" },
  spicerackRoundId: { type: Number, default: 0 },
  cardimage: {
    type: String,
    default:
      "https://cards.scryfall.io/png/front/c/a/ca367f49-0f4a-4b7f-8104-851893fbcd8a.png?1562937711",
  },
  match1timerExpiry: { type: Date, default: null },
  match2timerExpiry: { type: Date, default: null },
  match3timerExpiry: { type: Date, default: null },
  match1timerIsRunning: { type: Boolean, default: false },
  match2timerIsRunning: { type: Boolean, default: false },
  match3timerIsRunning: { type: Boolean, default: false },
});

const Data = mongoose.model("Data", dataSchema, "data");

export default Data;
