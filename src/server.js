import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import mongoose from "mongoose";
import "dotenv/config";
import Data from "../models/schemas.js";

const port = process.env.PORT || 4000;
const app = express();
app.use(cors());
const server = http.createServer(app);
const databaseObject = { id: "skibidi69" };

// const corsOptions = {
//   origin: '*',
//   credentials: true,
//   optionSuccessStatus: 200
// }

const roundStart = {
  match1p1name: "",
  match1p1deck: "",
  match1p1decklist: [],
  match1p1life: 20,
  match1p1record: "",
  match1p1gameswon: 0,
  match1p2name: "",
  match1p2deck: "",
  match1p2decklist: [],
  match1p2life: 20,
  match1p2record: "",
  match1p2gameswon: 0,
  match2p1name: "",
  match2p1deck: "",
  match2p1decklist: [],
  match2p1life: 20,
  match2p1record: "",
  match2p1gameswon: 0,
  match2p2name: "",
  match2p2deck: "",
  match2p2decklist: [],
  match2p2life: 20,
  match2p2record: "",
  match2p2gameswon: 0,
};

mongoose
  .connect(process.env.DB_URI)
  .then(console.log("DB connected!"))
  .catch((err) => console.log(err));

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "https://duresscrew.netlify.app",
      "https://dxc-lifeapp.netlify.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", async (socket) => {
  console.log("a user connected");

  socket.on("request_data", async () => {
    const query = await Data.findOne(databaseObject).exec();
    socket.emit("server_update", query);
  });

  socket.on("update_data", async (data) => {
    const updatedData = await Data.findOneAndUpdate(databaseObject, data, {
      new: true,
    });
    io.emit("server_update", updatedData);
  });

  socket.on("increment_games_won", async (matchId, playerindex) => {
    const query = await Data.findOne(databaseObject).exec();
    let payload =
      playerindex === 0
        ? { [`${matchId}p1gameswon`]: query[`${matchId}p1gameswon`] + 1 }
        : { [`${matchId}p2gameswon`]: query[`${matchId}p2gameswon`] + 1 };
    const updatedData = await Data.findOneAndUpdate(databaseObject, payload, {
      new: true,
    });
    io.emit("server_update", updatedData);
  });

  socket.on("spicerack_fetch", async (tournamentId) => {
    try {
      const response = await fetch(
        `https://api.spicerack.gg/api/v1/magic-events/${tournamentId}`,
        {
          headers: {
            "X-API-Key": process.env.SPICERACK_API_KEY,
          },
        }
      );
      const jsonData = await response.json();
      io.emit(
        "all_feature_matches",
        getAllFeatureMatches(jsonData.tournament_phases)
      );
      await parseSpicerackData(jsonData);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("get_decklists", async ([...deckIds], callback) => {
    const decklists = await Promise.all(
      deckIds.map((deckId) => getPlayerDeck(deckId))
    );
    callback(decklists);
  });

  socket.on(
    "submit_feature_match",
    async (matchId, featureMatchSelected, playerSwapNeeded) => {
      const query = await Data.findOne(databaseObject).exec();
      if (
        query[`${matchId}p1name`] === featureMatchSelected[0] ||
        query[`${matchId}p2name`] === featureMatchSelected[0]
      ) {
        // The correct match is on the correct table
        if (playerSwapNeeded) {
          // Swap player 1 and player 2
          await swapPlayers(matchId, query);
        }
        return;
      } else {
        // The match is on the wrong table
        // Swap the match to the correct table
        const otherMatch = getOtherMatch(matchId);

        if (
          query[`${otherMatch}p1name`] === featureMatchSelected[0] ||
          query[`${otherMatch}p2name`] === featureMatchSelected[0]
        ) {
          const updatedData = await Data.findOneAndUpdate(
            databaseObject,
            {
              [`${otherMatch}p1name`]: playerSwapNeeded
                ? query[`${matchId}p2name`]
                : query[`${matchId}p1name`],
              [`${otherMatch}p1deck`]: playerSwapNeeded
                ? query[`${matchId}p2deck`]
                : query[`${matchId}p1deck`],
              [`${otherMatch}p1decklist`]: playerSwapNeeded
                ? query[`${matchId}p2decklist`]
                : query[`${matchId}p1decklist`],
              [`${otherMatch}p2name`]: playerSwapNeeded
                ? query[`${matchId}p1name`]
                : query[`${matchId}p2name`],
              [`${otherMatch}p2deck`]: playerSwapNeeded
                ? query[`${matchId}p1deck`]
                : query[`${matchId}p2deck`],
              [`${otherMatch}p2decklist`]: playerSwapNeeded
                ? query[`${matchId}p1decklist`]
                : query[`${matchId}p2decklist`],
              [`${matchId}p1name`]: query[`${otherMatch}p1name`],
              [`${matchId}p1deck`]: query[`${otherMatch}p1deck`],
              [`${matchId}p1decklist`]: query[`${otherMatch}p1decklist`],
              [`${matchId}p2name`]: query[`${otherMatch}p2name`],
              [`${matchId}p2deck`]: query[`${otherMatch}p2deck`],
              [`${matchId}p2decklist`]: query[`${otherMatch}p2decklist`],
            },
            {
              new: true,
            }
          );
          io.emit("server_update", updatedData);
        } else {
          io.emit("feature_match_error", "Chosen feature match not found.");
        }
      }
    }
  );

  socket.on("begin_timer", async (matchId) => {
    const updatedData = await Data.findOneAndUpdate(
      databaseObject,
      {
        [`${matchId}timerIsRunning`]: true,
        [`${matchId}timerExpiry`]: new Date(Date.now() + 3000000),
      },
      {
        new: true,
      }
    );
    io.emit("server_update", updatedData);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

async function parseSpicerackData(data) {
  // Get current match data
  const query = await Data.findOne(databaseObject).exec();
  // Get current round
  const currentRound = getCurrentRound(data.tournament_phases);

  if (!currentRound) {
    return;
  }

  // Update round id and emit update with empty match data if it's a new round
  if (currentRound.id > query.spicerackRoundId) {
    io.emit("new_round", currentRound.id);
    const updatedData = await Data.findOneAndUpdate(
      databaseObject,
      { ...roundStart, spicerackRoundId: currentRound.id },
      {
        new: true,
      }
    );
    io.emit("server_update", updatedData);
  }

  // Get current round feature matches
  const currentRoundFeatureMatches =
    getCurrentRoundFeatureMatches(currentRound);

  // Return if no feature matches yet
  if (currentRoundFeatureMatches.length === 0) {
    return;
  }
  let updateFlag = false;
  let match1info = {};
  let match2info = {};

  // Check if match 1 is empty
  if (query.match1p1name === "") {
    if (currentRoundFeatureMatches.length > 0) {
      updateFlag = true;
      const match1player1Deck = await getPlayerDeck(
        currentRoundFeatureMatches[0].player_match_relationships[0]
          .user_event_status.decklist
      );
      const match1player2Deck = await getPlayerDeck(
        currentRoundFeatureMatches[0].player_match_relationships[1]
          .user_event_status.decklist
      );
      match1info = {
        match1p1name:
          currentRoundFeatureMatches[0].player_match_relationships[0]
            .user_event_status.user.best_identifier,
        match1p1deck: match1player1Deck.deckname,
        match1p1decklist: match1player1Deck.decklist,
        match1p2name:
          currentRoundFeatureMatches[0].player_match_relationships[1]
            .user_event_status.user.best_identifier,
        match1p2deck: match1player2Deck.deckname,
        match1p2decklist: match1player2Deck.decklist,
      };
      io.emit(
        "new_feature_match",
        match1info.match1p1name,
        match1info.match1p1deck,
        match1info.match1p2name,
        match1info.match1p2deck
      );
    }
  }

  // Check if match 2 is empty
  if (query.match2p1name === "") {
    if (currentRoundFeatureMatches.length > 1) {
      updateFlag = true;
      // Get match that isn't already in match 1
      const match = currentRoundFeatureMatches.find(
        (match) =>
          match.player_match_relationships[0].user_event_status.user
            .best_identifier !== query.match1p1name &&
          match.player_match_relationships[0].user_event_status.user
            .best_identifier !== query.match1p2name &&
          match.player_match_relationships[0].user_event_status.user
            .best_identifier !== match1info.match1p1name &&
          match.player_match_relationships[0].user_event_status.user
            .best_identifier !== match1info.match1p2name
      );
      const match2player1Deck = await getPlayerDeck(
        match.player_match_relationships[0].user_event_status.decklist
      );
      const match2player2Deck = await getPlayerDeck(
        match.player_match_relationships[1].user_event_status.decklist
      );
      match2info = {
        match2p1name:
          match.player_match_relationships[0].user_event_status.user
            .best_identifier,
        match2p1deck: match2player1Deck.deckname,
        match2p1decklist: match2player1Deck.decklist,
        match2p2name:
          match.player_match_relationships[1].user_event_status.user
            .best_identifier,
        match2p2deck: match2player2Deck.deckname,
        match2p2decklist: match2player2Deck.decklist,
      };
      io.emit(
        "new_feature_match",
        match2info.match2p1name,
        match2info.match2p1deck,
        match2info.match2p2name,
        match2info.match2p2deck
      );
    }
  }

  // Update match data and emit update if there are changes
  if (updateFlag) {
    const updatedData = await Data.findOneAndUpdate(
      databaseObject,
      {
        ...match1info,
        ...match2info,
      },
      {
        new: true,
      }
    );
    io.emit("server_update", updatedData);
  }
}

function getCurrentRound(tournamentPhases) {
  const currentPhase = tournamentPhases.find(
    (phase) => phase.status === "IN_PROGRESS" || phase.status === "UPCOMING"
  );
  if (!currentPhase) {
    return;
  }
  const currentRound = currentPhase.rounds.find(
    (round) => round.status === "IN_PROGRESS" || round.status === "UPCOMING"
  );
  if (!currentRound) {
    return;
  }
  return currentRound;
}

function getCurrentRoundFeatureMatches(currentRound) {
  const currentRoundFeatureMatches = currentRound.matches.filter(
    (match) => match.is_feature_match === true
  );
  return currentRoundFeatureMatches;
}

function getAllFeatureMatches(tournamentPhases) {
  const allFeatureMatches = tournamentPhases.flatMap((phase) =>
    phase.rounds.flatMap((round) =>
      round.matches.filter((match) => match.is_feature_match === true)
    )
  );
  return allFeatureMatches;
}

async function getPlayerDeck(deckId) {
  const response = await fetch(
    `https://api.spicerack.gg/api/v1/decklists/${deckId}`,
    {
      headers: {
        "X-API-Key": process.env.SPICERACK_API_KEY,
      },
    }
  );
  const jsonData = await response.json();
  return {
    deckname: jsonData.name,
    decklist: jsonData.plaintext_list,
  };
}

function getOtherMatch(matchId) {
  return matchId.endsWith("1")
    ? matchId.slice(0, -1) + "2"
    : matchId.slice(0, -1) + "1";
}

async function swapPlayers(matchId, query) {
  const updatedData = await Data.findOneAndUpdate(
    databaseObject,
    {
      [`${matchId}p1name`]: query[`${matchId}p2name`],
      [`${matchId}p1deck`]: query[`${matchId}p2deck`],
      [`${matchId}p1decklist`]: query[`${matchId}p2decklist`],
      [`${matchId}p2name`]: query[`${matchId}p1name`],
      [`${matchId}p2deck`]: query[`${matchId}p1deck`],
      [`${matchId}p2decklist`]: query[`${matchId}p1decklist`],
    },
    {
      new: true,
    }
  );
  io.emit("server_update", updatedData);
}
