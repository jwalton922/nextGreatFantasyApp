'use strict';

/**
 * @ngdoc function
 * @name nextGreatFantasyAppApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the nextGreatFantasyAppApp
 */
angular.module('nextGreatFantasyAppApp')
        .controller('HomeCtrl', ["$scope", "$location", "$log", "$http", "UserService", "YahooParser", function ($scope, $location, $log, $http, UserService, YahooParser) {
                $scope.fantasyGames = [];
                $scope.fantasyTeams = {};
                $scope.ws = null;
                $scope.gamesReceived = 0;
                $scope.teamsReceived = 0;
                
                
                $scope.requestReadOfFantasyData = function () {
                    $log.log("requestReadOfFantasyData called");
                    $scope.ws.send({data: "readFantasyData"});
                }

                $scope.initWebSocket = function () {
                    var host = location.origin.replace(/^http/, 'ws');
                    $log.log("Host: " + host);
                    $scope.ws = new WebSocket(host);
                    $scope.ws.onmessage = function (event) {
                        $log.log("Web socket onmessage: " + angular.toJson(event));

                        var data = eval("(" + event.data + ")");
                        
                        if (data.type === "game") {
                            $scope.fantasyGames.push(data.game);
                            $scope.gamesReceived++;
                            $scope.$apply();
                        } else if (data.type === "team") {
                            var teamData = data.team;
                            if (teamData) {
                                for (var teamIndex = 0; teamIndex < teamData.length; teamIndex++) {
                                    $log.log("team logo url: "+teamData[teamIndex].logo.team_logo.url)
                                    var team = teamData[teamIndex];
                                    $scope.fantasyTeams[team.team_key] = team;
                                    $scope.teamsReceived++;
                                }
                                $scope.$apply();
                            }
                        } else if(data.type === "seasonData"){
                            $log.log("Web socket match data: ", data);
                            var season = data.seasonData;
                            $log.log("Parsed seasonData: ",season);
                            var team_key = season.team_key;
                            $log.log("Season data is for team: "+team_key);
                            if($scope.fantasyTeams[team_key]){
                                $scope.fantasyTeams[team_key].seasonData = season;
                                $scope.$apply();
                            } else {
                                $log.log("Could not find team for: "+team_key);
                            }
                        }
                    };

                    $scope.ws.onopen = function (event) {
                        $log.log("Websocket onopen called: ", event);
                        //$scope.ws.send({messagee: "onopen..."});
                    };

                    $scope.ws.onclose = function (event) {
                        $log.log("Websocket onclose called: ", event);
                    };
                }
                $scope.initWebSocket();
                $scope.userObj = UserService.getUser();
                $log.log("User obj", $scope.userObj);


                $scope.queryParams = $location.search();
                $log.log("page query params: ",$scope.queryParams);
                if($scope.queryParams.readData){
                    $scope.requestReadOfFantasyData();
                }
            }]);