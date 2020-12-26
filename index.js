const express = require("express");
const tmi = require("tmi.js");
var axios = require("axios");
const app = express();

var USERNAME = Dietze_;
var oauthtoken = oauth:xxxx-AAAAA-BBBBB;
var Bearertoken = xxxxx-xxxxx-xxxxx-xxxx;
var playerTempElo = 0;

app.get("/", function(request, response) {
  response.sendFile(__dirname + "/views/index.html");
});
let listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});

let options = {
  options: {
    debug: false
  },
  connection: {
    cluster: "aws",
    reconnect: true
  },
  identity: {
    username: USERNAME,
    password: oauthtoken
  },
  channels: ["Dietze_"]
};

let client = new tmi.client(options);
client.connect();


client.on("connected", (address, port) => {
  console.log(`Connected to ${address}:${port}`);
});


client.on("chat", (channel, userstate, commandMessage, self) => {
  var conditions = ["!last"];
  conditions.forEach(condi => {
    if (commandMessage.split(" ")[0].includes(condi)) {
      getlast(channel, userstate["display-name"]);
    }
  });
});

client.on("chat", (channel, userstate, commandMessage, self) => {
  var conditions = ["!stats"];
  conditions.forEach(condi => {
    if (commandMessage.split(" ")[0].includes(condi)) {
      getStats(channel, userstate["display-name"])
    }
  });
});

client.on("chat", (channel, userstate, commandMessage, self) => {
  var conditions = ["!live"];
  conditions.forEach(condi => {
    if (commandMessage.split(" ")[0].includes(condi)) {
      getLiveMatch(channel, userstate["display-name"])
    }
  });
});

client.on("chat", (channel, userstate, commandMessage, self) => {
  var conditions = ["!cmd", "!commands", "!faceit"];
  conditions.forEach(condi => {
    if (commandMessage.split(" ")[0].includes(condi)) {
      client.say(channel, `/me @` + userstate["display-name"] + " You can use these Faceitcommands !last, !live, !stats, !rank");
    }
  });
});






async function getlast(chan, user) {
  await axios
    .get(
      "https://api.faceit.com/stats/v1/stats/time/users/62d12eaa-b0a6-4f8e-a1b9-c0c742d95cb1/games/csgo?size=1",
    )
    .then(response => {
      if (response.status !== 200) {
        var isNull = true;
      } else {
        var last = response.data[0];
        if (user == "Dietze_" && last.matchId == lastmatchid) return;
        var lastmatchid = last.matchId;
        var won = last.teamId == last.i2 ? "WON" : "LOSS";
        client.say(
          chan,
          `/me @` +
            user +
            ` last map ` +
            won +
            ` Map: ` +
            last.i1 +
            `. Score: ` +
            last.i18 +
            ` Kills: ` +
            last.i6 +
            ` Assists: ` +
            last.i7 +
            ` Deaths: ` +
            last.i8 +
            ` HS: ` +
            last.c4 +
            `%`
        );
      }
    })
    .catch(function(error) {});
}

async function getStats(chan, user) {
  await axios
    .get(
      "https://api.faceit.com/stats/v1/stats/time/users/62d12eaa-b0a6-4f8e-a1b9-c0c742d95cb1/games/csgo",
    )
    .then(response => {
      if (response.status !== 200) {
        var isNull = true;
      } else {  
        var length = 20;
        var test = response.data;
        if (test.length == 0)
			    return;
        var kills = 0, avgKills= 0, HS = 0, avgHs = 0,  divid = 0, KD = 0, avgKD = 0, KR = 0, avgKR = 0;
        for (var i = 0; i < length; i++) {
          if (test[i].gameMode !== '5v5') {
            length = length + 1;
          } else {
            divid = divid + 1;
            kills = parseInt(test[i].i6) + kills;
            HS = parseInt(test[i].c4 * 100) + HS;
            KD = parseInt(test[i].c2 * 100) + KD;
            KR = parseInt(test[i].c3 * 100) + KR;
          }
        }
        avgKills = Math.round(kills / divid);
        avgHs = Math.round(HS / divid / 100);
        avgKD = (KD / divid / 100).toFixed(2);
        avgKR = (KR / divid / 100).toFixed(2);

        client.say(
          chan,
          `/me @` +
            user +
            ` Here are the stats of the last 20 matches: Avg. Kills: ` +
            avgKills +
            ` - Avg. HS%: ` +
            avgHs +
            `% - Avg. K/D: ` +
            avgKD +
            ` - Avg. K/R: ` +
            avgKR
        );
      }
    })
    .catch(function(error) {});
}


async function getLiveMatch(chan, user) {
  await axios
    .get(
      "https://api.faceit.com/match/v1/matches/groupByState?userId=62d12eaa-b0a6-4f8e-a1b9-c0c742d95cb1",
    )
    .then(async response => {
      if (response.status !== 200) {
        var isNull = true;
      } else {  
        var length = 20;
        var test = response.data;
        if (Object.keys(test.payload).length == 0) {
          client.say(chan, `/me @` + user + ` Currently no faceitmatch is played`);
          return;
        }
        var e = "62d12eaa-b0a6-4f8e-a1b9-c0c742d95cb1";
        
        let names = Object.getOwnPropertyNames(test.payload)
        var r = test.payload[names[0]][0];
        var ownFactionNumber = checkForValue(r.teams.faction1, e) ? 2 : 1;
        var enemyFactionNumber = 1 == ownFactionNumber ? 2 : 1
        
        var teamname1 = r.teams["faction" + ownFactionNumber].name;
		    var teamname2 = r.teams["faction" + enemyFactionNumber].name;
        var playerOwnElo = 0;
        var playerEnemyElo = 0;
        var ownTeamAVGElo = 0;
        var enemyTeamAVGElo = 0;
        var winElo = 0;
        var lossElo = 0;
        
        
        for (let e = 0; e < r.teams["faction" + ownFactionNumber].roster.length; e++){
          await getEloFromPlayer(r.teams["faction" + ownFactionNumber].roster[e].id);
          playerOwnElo += playerTempElo;
        }
        
        for (let e = 0; e < r.teams["faction" + enemyFactionNumber].roster.length; e++) {
          await getEloFromPlayer(r.teams["faction" + enemyFactionNumber].roster[e].id), 
          playerEnemyElo += playerTempElo;
        }
                
        ownTeamAVGElo = Math.floor(playerOwnElo / r.teams["faction" + ownFactionNumber].roster.length);
        enemyTeamAVGElo = Math.floor(playerEnemyElo / r.teams["faction" + enemyFactionNumber].roster.length);
        winElo = calculateRatingChange(ownTeamAVGElo, enemyTeamAVGElo);
        lossElo = 50 - winElo;
        
        
        
        
        var link = "https://www.faceit.com/de/csgo/room/" + test.payload[names[0]][0].id;
			    
        client.say(
          chan,
          `/me @` +
            user + `, ` + teamname1 + ` vs ` + teamname2 + ` - AVG. ELO: `+ ownTeamAVGElo + ` Win Elo: ` + winElo + ` - Loss Elo: ` + lossElo + ` AVG. ELO: `+ enemyTeamAVGElo);
      }
    })
    .catch(function(error) {});
}

async function getEloFromPlayer(e) {
  var isNull = 0;
    await axios
        .get("https://open.faceit.com/data/v4/players/" + e, { headers: { Authorization: "Bearer " + Bearertoken } })
        .then((e) => {
            200 !== e.status
                ? (isNull = !0)
                : (playerTempElo = e.data.games.csgo.faceit_elo);
        })
        .catch(function (e) {}); 
}

function checkForValue(e, a) {
    for (let t = 0; t < e.roster.length; t++) if (e.roster[t].id === a) return !0;
    return !1;
}

function calculateRatingChange(e, a) {
    var t, r;
    return (r = a - e), (t = 1 / (1 + Math.pow(10, r / 400))), Math.round(50 * (1 - t));
}
