const DietzeSteamID = "76561198257065483";
const RisqzSteamID = "76561198158626038";

const Bearertoken="AAAAAA-BBBBBBBBB-CCCCCCCCC",
const USERNAME = "Dietze_"
const oauthToken = "AAAAAA-BBBBBBBBB-CCCCCCCCC"

var playerTempElo, FaceitID, wrongSteam, steamId1, FaceitUsername;

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
    password: oauthToken
  },
  channels: ["risqz_", "Dietze_"]
};

let client = new tmi.client(options);
client.connect();


client.on("connected", (address, port) => {
  console.log(`Connected to ${address}:${port}`);
});


client.on("chat", (channel, userstate, commandMessage, self) => {
  if (commandMessage.split(" ")[1] !== undefined){
    var SteamID = commandMessage.split(" ")[1];
    wrongSteam = false;
  } else {
    switch(channel){
      case '#dietze_':
        SteamID = DietzeSteamID;
        break;
      case '#risqz_':
        SteamID = RisqzSteamID;
        break;
      default:
        break;
    }
    wrongSteam = false;
  }
  trySwitch(commandMessage.split(" ")[0], SteamID, channel, userstate);
});

async function trySwitch(message, SteamID, channel, userstate){
	switch(message){
		case '!last':
		  await getlast(channel, userstate["display-name"], SteamID);
		  break;
		case '!stats':
		  await getStats(channel, userstate["display-name"], SteamID);
		  break;
		case '!live':
		  await getLiveMatch(channel, userstate["display-name"], SteamID);
		  break;
		case '!rank':
		case '!elo':
		  await getElo(channel, userstate["display-name"], SteamID);
		  break;
		case '!cmd':
		case '!commands':
		case '!faceit':
		  client.say(channel, `@` + userstate["display-name"] + " You can use these Faceitcommands !last, !live, !stats, !rank");
		  break;
		default:
		  break;
	}
}


async function getSteamID(steamId){
  await axios
  .get(
  "http://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=60348E7D7110FDE289CD9B00D5DDA891&vanityurl=" + steamId,
  ).then(response => {
    if (response.status !== 200) {
        return;
    } else {
      	steamId1 = response.data.response.steamid;
    }  
  })
  .catch(function(error) {});
}

  
  

async function getGuid(steamId){
  if(!/\d/.test(steamId)){
    await getSteamID(steamId);
  } else {
    steamId1 = steamId;
  }
  await axios
  .get(
  "https://api.faceit.com/search/v1?limit=5&query=" + steamId1,
  ).then(response => {
    if (response.status !== 200) {
        return;
    } else {  
        var results = response.data.payload.players.results;
      
      	if(results.length == 0){ 
            wrongSteam = true;
            return null;
        }
      
        let defaultIndex = results.length - 1;
        FaceitUsername = false;
        FaceitID = false;
      
        results.forEach((user, index) => {
         if (user.games.length > 0) {
              user.games.forEach((game) => {
                  if (game.name == 'csgo') {
                    FaceitUsername = results[index].nickname;
                    FaceitID = results[index].guid;
                  }
              })
            }
        });
    }  
  })
  .catch(function(error) {});
}


async function getElo(chan, user, SteamID){
  await getGuid(SteamID)
  if(wrongSteam == true){
    client.say(chan, `@` + user + ` No Faceitaccount found`);
    return;
  }
  await axios
  .get(
  "http://api.satont.ru/faceit?nick=" + FaceitUsername,
  ).then(response => {
    if (response.status !== 200) {
        var isNull = true;
      } else {
        client.say(
          chan,
          `@` + user +
          ` FACEIT LVL: ` + response.data.lvl +
          ` ELO: ` + response.data.elo
        );
      }
  })
  .catch(function(error) {});
}

async function getlast(chan, user, SteamID) {
    await getGuid(SteamID)
  if(wrongSteam == true){
    client.say(chan, `@` + user + ` No Faceitaccount found`);
    return;
  }
  await axios
    .get(
      "https://api.faceit.com/stats/v1/stats/time/users/" + FaceitID + "/games/csgo?size=1",
    )
    .then(response => {
      if (response.status !== 200) {
        var isNull = true;
      } else {
        var last = response.data[0];
        if (user == "Dietze_" && last.matchId == lastmatchid) return;
        var lastmatchid = last.matchId;
        
        var won = last.teamId == last.i2 ? "WON" : "LOST";
        client.say(
          chan,
          `@` + user +
          ` last map ` + won +
          ` Map: ` + last.i1 +
          `. Score: ` + last.i18 +
          ` Kills: ` + last.i6 +
          ` Assists: ` + last.i7 +
          ` Deaths: ` + last.i8 +
          ` HS: ` + last.c4 + `%`
        ); 
      }
    })
    .catch(function(error) {});
}

async function getStats(chan, user, SteamID) {
  await getGuid(SteamID)
  if(wrongSteam == true){
    client.say(chan, `@` + user + ` No Faceitaccount found`);
    return;
  }
  await axios
    .get(
      "https://api.faceit.com/stats/v1/stats/time/users/" + FaceitID + "/games/csgo",
    )
    .then(response => {
      if (response.status !== 200) {
        var isNull = true;
      } else {  
        length = 20;
        var test = response.data;
        if (test.length == 0)
			    return;
        
        if (test.length <=20){
          length = test.length;
        }
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
          `@` + user +
          ` Here are the stats of the last ` + divid + ` matches: Avg. Kills: ` + avgKills +
          ` - Avg. HS%: ` + avgHs +
          `% - Avg. K/D: ` + avgKD +
          ` - Avg. K/R: ` + avgKR
        );
      }
    })
    .catch(function(error) {});
}


async function getLiveMatch(chan, user, SteamID) {
  await getGuid(SteamID)
  if(wrongSteam == true){
    client.say(chan, `@` + user + ` Inspected user: ` + FaceitUsername + ` No Faceitaccount found`);
    return;
  }
  await axios
    .get(
      "https://api.faceit.com/match/v1/matches/groupByState?userId=" + FaceitID,
    )
    .then(async response => {
      if (response.status !== 200) {
        var isNull = true;
      } else {  
        var length = 20;
        var test = response.data;
        if (Object.keys(test.payload).length == 0) {
          client.say(chan, `@` + user + ` Currently no faceitmatch is played`);
          return;
        }
                
        let names = Object.getOwnPropertyNames(test.payload)
        var r = test.payload[names[0]][0];
        var ownFactionNumber = checkForValue(r.teams.faction1, FaceitID) ? 1 : 2;
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
          `@` + user + `, ` +
         teamname1 + ` vs ` + teamname2 + ` - AVG. ELO: `+ ownTeamAVGElo + ` Win Elo: ` + winElo + ` - Loss Elo: ` + lossElo + ` AVG. ELO: `+ enemyTeamAVGElo + ` LobbyLink: ` + link);
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
