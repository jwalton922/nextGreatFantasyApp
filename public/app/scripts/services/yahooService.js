'use strict';

angular.module('nextGreatFantasyAppApp')
        .service('YahooParser', [function () {

                return {
                    getTeamData: function (yahooTeamData) {
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
                            console.log("teamInfo: " + angular.toJson(teamInfo, true));
                            for (var teamInfoKey in teamInfo) {
                                console.log("teamInfo key: " + teamInfoKey + "=" + teamInfo[teamInfoKey]);
                            }
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
                    },
                    getSeasonMatchData: function (yahooMatchData) {
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
                            console.log("Comaparing match winner: " + matchup.winner_team_key + " to player team: " + team_key);
                            if (matchup.winner_team_key === team_key) {
                                won = true;
                                seasonData.wins++;
                            } else {
                                seasonData.losses++;
                            }
                            match.won = won;
                            for (var matchup_team_key in matchup["0"].teams) {
                                var matchup_team_data = matchup["0"].teams[matchup_team_key];
                                console.log("Trying to parse points from: " + angular.toJson(matchup_team_data));
                                if (!matchup_team_data.team) {
                                    continue;
                                }
                                var team_id = matchup_team_data.team[0][0].team_key;
                                var this_team_points = matchup_team_data.team[1].team_points.total;
                                var this_team_proj_points = matchup_team_data.team[1].team_projected_points.total;
                                console.log("Team " + team_id + " scored: " + this_team_points + " projected to score: " + this_team_proj_points);
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
                };
            }]);