var exports = module.exports = {};
var rp = require('request-promise');
var MongoClient = require('mongodb').MongoClient
        , assert = require('assert');
var mongoDb = null;
var url = process.env.MONGOLAB_URI;
MongoClient.connect(url, function (err, db) {
    assert.equal(null, err);
    mongoDb = db;
});
function getAccessToken(user) {
    return user.grant.response.access_token;
}

function getAccessTokenSecret(user) {
    return user.grant.response.access_secret;
}

function stringToJson(string) {
    var retValue = string;
    if (typeof string === "string") {
        retValue = eval("(" + string + ")");
    }

    return retValue;
}

function getTeamData(yahooTeamData) {
    var team = null;

    if (yahooTeamData.game[1].teams.length < 2) {
        return team;
    }

    var gameInfo = yahooTeamData.game[0];
    var teams = [];
    for (var key in yahooTeamData.game[1].teams) {
        team = {};
        team.season = gameInfo.season;
        team.game_key = gameInfo.game_key;
        if (!yahooTeamData.game[1].teams[key].team) {
            continue;
        }
        var teamInfo = yahooTeamData.game[1].teams[key].team[0];
        if (!teamInfo) {
            console.log("Skipping teamInfo form key: " + i);
            continue;
        }
        //console.log("teamInfo: " + angular.toJson(teamInfo, true));
//        for (var teamInfoKey in teamInfo) {
//            console.log("teamInfo key: " + teamInfoKey + "=" + teamInfo[teamInfoKey]);
//        }
        team.team_key = teamInfo[0].team_key;
        team.id = teamInfo[1].team_id;
        team.name = teamInfo[2].name;
        team.url = teamInfo[4].url;
        team.logo = teamInfo[5].team_logos[0];
        team.number_of_moves = teamInfo[9].number_of_moves;
        team.number_of_trades = teamInfo[10].number_of_trades;
        teams.push(team);
    }
    return teams;
}

function getSeasonMatchData(yahooMatchData) {
    var seasonData = {};
    seasonData.wins = 0;
    seasonData.losses = 0;
    seasonData.pointDelta = 0;
    seasonData.projectedDifference = 0;
    seasonData.projectedAgainstDifference = 0;
    seasonData.place;

    var matches = [];
    if (!yahooMatchData.fantasy_content || yahooMatchData.fantasy_content.team.length < 2) {
        return seasonData;
    }
    var teamArray = yahooMatchData.fantasy_content.team;
    if (teamArray[1].exceptions && teamArray[1].exceptions.length > 0) {
        return matches;
    }

    var team_key = teamArray[0][0].team_key;
    seasonData.team_key = team_key;
    var matchups = teamArray[1].matchups;
    for (var matchup_key in matchups) {
        //console.log("Found: "+matchup_key+" key = "+angular.toJson(matchups[matchup_key]));
        var matchup = matchups[matchup_key].matchup;
        if (!matchup) {
            console.log("matchup undefined for key: " + matchup_key);
            continue;
        }
//                            console.log("matchup",matchup);
        var match = {};
        var won = false;
        //console.log("Parsing points from matchup: "+angular.toJson(matchup,true));
        //console.log("Comaparing match winner: " + matchup.winner_team_key + " to player team: " + team_key);
        if (matchup.winner_team_key === team_key) {
            won = true;
            seasonData.wins++;
        } else {
            seasonData.losses++;
        }
        match.won = won;
        for (var matchup_team_key in matchup["0"].teams) {
            var matchup_team_data = matchup["0"].teams[matchup_team_key];
            //console.log("Trying to parse points from: " + angular.toJson(matchup_team_data));
            if (!matchup_team_data.team) {
                continue;
            }
            var team_id = matchup_team_data.team[0][0].team_key;
            var this_team_points = matchup_team_data.team[1].team_points.total;
            var this_team_proj_points = matchup_team_data.team[1].team_projected_points.total;
            //console.log("Team " + team_id + " scored: " + this_team_points + " projected to score: " + this_team_proj_points);
            if (team_id === team_key) {
                match.points = this_team_points;
                match.projected_points = this_team_proj_points;
            } else {
                match.points_against = this_team_points;
                match.projected_points_against = this_team_proj_points;
            }
        }
        seasonData.pointDelta += (match.points - match.points_against);
        seasonData.projectedDifference += (match.points - match.projected_points);
        seasonData.projectedAgainstDifference += (match.points_against - match.projected_points_against);
        matches.push(match);
    }

    seasonData.matches = matches;
    return seasonData;
}

/**
 * according to yahoo, a NFL game, means a fantasy league
 * @param {type} user
 * @returns {undefined}
 */
function getNflGames(user) {
    console.log("getNflGames called for user: " + JSON.stringify(user));
    var access_token = getAccessToken(user);
    var url = 'https://fantasysports.yahooapis.com/fantasy/v2/games;game_codes=nfl?format=json&oauth_version="1.0"';
    url += "&access_token=" + access_token;
    console.log("url=" + url);
    return rp.get(url);
}

function getTeams(user, game_key) {
    var access_token = getAccessToken(user);
    var url = 'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=' + game_key + '/teams?format=json&oauth_version="1.0"';
    url += "&access_token=" + access_token;
    return rp.get(url);
}

function getMatches(user, team_key) {
    var access_token = getAccessToken(user);
    var url = 'https://fantasysports.yahooapis.com/fantasy/v2/team/' + team_key + '/matchups?format=json&oauth_version="1.0"';
    url += "&access_token=" + access_token;
    return rp.get(url);
}

exports.getAndStoreFantasyFootballData = function (user, db, response) {
    console.log("getAndStoreFantasyFootballData called");
    if (!user || !user.grant) {
        console.error("User is undefined");
        return;
    }

    getNflGames(user).then(function (gamesBody) {
        var gamesBodyJson = stringToJson(gamesBody);
        var games = gamesBodyJson.fantasy_content.games;
        for (var game in games) {
            if (!games[game].game) {
                continue;
            }
            var game_key = games[game].game[0].game_key;
            console.log("Found game key: " + game_key + " for user: " + user.username);
            getTeams(user, game_key).then(function (teamsBody) {
                var teamsBodyJson = stringToJson(teamsBody);
                console.log("Teams body json: " + JSON.stringify(teamsBodyJson));
                for (var user_key in teamsBodyJson.fantasy_content.users) {
                    var teamUserObj = teamsBodyJson.fantasy_content.users[user_key];
                    if (!teamUserObj.user) {
                        continue;
                    }
                    console.log("teamUserObj: " + JSON.stringify(teamUserObj));
                    for (var game_key in teamUserObj.user[1].games) {
                        var teamGameObj = teamUserObj.user[1].games[game_key];
                        if (!teamGameObj.game) {
                            console.log("\n\nCould not find teams for obj: " + JSON.stringify(teamGameObj));
                            continue;
                        }
                        console.log("teamGameObj: " + JSON.stringify(teamGameObj));
                        for (var team_key in teamGameObj.game[1].teams) {
                            var teamObj = teamGameObj.game[1].teams[team_key];
                            console.log("teamObj: " + JSON.stringify(teamObj));
                            if (!teamObj.team || !teamObj.team[0] || !teamObj.team[0][0]) {
                                continue;
                            }
                            var yahoo_team_key = teamObj.team[0][0].team_key;
                            console.log("yahoo_team_key: " + yahoo_team_key);
                            getMatches(user, yahoo_team_key).then(function (matchesBody) {
                                var matchesBodyJson = stringToJson(matchesBody);
                                var matches_team_key;
                                if (matchesBodyJson.fantasy_content.team[0][0].team_key) {
                                    matches_team_key = matchesBodyJson.fantasy_content.team[0][0].team_key;
                                    var matchesCollection = mongoDb.collection("matches");
                                    console.log("inserting matches for user: " + user.username + " team_key: " + matches_team_key);
                                    matchesCollection.updateOne({username: user.username, team_key: matches_team_key}, {$set: {rawMatches: matchesBodyJson}}, {upsert: true}, function (err, r) {
                                        console.log("Error updating matches? " + err);
                                        console.log("result: " + JSON.stringify(r));

                                    });
                                } else {
                                    console.log("Coudld not find team key from matches response");
                                }



                            });
                        }

                    }
                }

            });
        }
    });

    response.json({finished: true});
}

exports.wsReadFantasyData = function (user, db, ws) {
    console.log("getAndStoreFantasyFootballData called");
    if (!user || !user.grant) {
        console.error("User is undefined");
        return;
    }

    getNflGames(user).then(function (gamesBody) {
        var gamesBodyJson = stringToJson(gamesBody);
        var games = gamesBodyJson.fantasy_content.games;
        for (var game in games) {
            if (!games[game].game) {
                continue;
            }
            ws.send(JSON.stringify({"type": "game", game: games[game]}));
            var game_key = games[game].game[0].game_key;
            console.log("Found game key: " + game_key + " for user: " + user.username);
            getTeams(user, game_key).then(function (teamsBody) {
                var teamsBodyJson = stringToJson(teamsBody);
                console.log("Teams body json: " + JSON.stringify(teamsBodyJson));
                for (var user_key in teamsBodyJson.fantasy_content.users) {
                    var teamUserObj = teamsBodyJson.fantasy_content.users[user_key];
                    if (!teamUserObj.user) {
                        continue;
                    }
                    //console.log("teamUserObj: " + JSON.stringify(teamUserObj));
                    for (var team_game_key in teamUserObj.user[1].games) {
                        var teamGameObj = teamUserObj.user[1].games[team_game_key];
                        if (!teamGameObj.game) {
                            console.log("\n\nCould not find teams for obj: " + JSON.stringify(teamGameObj));
                            continue;
                        }
                        var parsedTeam = getTeamData(teamGameObj);
                        //console.log("teamGameObj: " + JSON.stringify(parsedTeam));
                        ws.send(JSON.stringify({"type": "team", team: parsedTeam}));
                        var teamCollection = mongoDb.collection("teams");
                        teamCollection.updateOne({username: user.username}, {$set: {team: parsedTeam}}, {upsert: true}, function (err, r) {
                            console.log("Error upserting team? " + err); 
                            console.log("result: "+JSON.stringify(r));
                        });
                        for (var team_key in teamGameObj.game[1].teams) {
                            var teamObj = teamGameObj.game[1].teams[team_key];
                            //console.log("teamObj: " + JSON.stringify(teamObj));
                            if (!teamObj.team || !teamObj.team[0] || !teamObj.team[0][0]) {
                                continue;
                            }
                            var yahoo_team_key = teamObj.team[0][0].team_key;
                            //console.log("yahoo_team_key: " + yahoo_team_key);
                            getMatches(user, yahoo_team_key).then(function (matchesBody) {
                                var matchesBodyJson = stringToJson(matchesBody);
                                var matches_team_key;
                                if (matchesBodyJson.fantasy_content.team[0][0].team_key) {
                                    var seasonData = getSeasonMatchData(matchesBodyJson);
                                    if (!seasonData.team_key) {
                                        return;
                                    }
                                    ws.send(JSON.stringify({type: "seasonData", seasonData: seasonData, team_key: matchesBodyJson.fantasy_content.team[0][0].team_key}));
                                    matches_team_key = matchesBodyJson.fantasy_content.team[0][0].team_key;
                                    var seasonCollection = mongoDb.collection("seasons");
                                    console.log("inserting seasondata for user: " + user.username + " team_key: " + matches_team_key);
                                    seasonCollection.updateOne({username: user.username, team_key: matches_team_key}, {$set: {seasonData: seasonData}}, {upsert: true}, function (err, r) {
                                        console.log("Error updating seasons? " + err);
                                        console.log("result: " + JSON.stringify(r));

                                    });
                                } else {
                                    console.log("Coudld not find team key from matches response");
                                }



                            });
                        }

                    }
                }

            });
        }
    });


}