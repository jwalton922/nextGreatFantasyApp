'use strict';

/**
 * @ngdoc function
 * @name nextGreatFantasyAppApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the nextGreatFantasyAppApp
 */
angular.module('nextGreatFantasyAppApp')
        .controller('MainCtrl', ["$scope","$location","$log","$http", "UserService",function ($scope, $location, $log, $http, UserService) {
                $scope.account = {email: "jwalton922@gmail.com", password: "password"};
                $scope.userObj = null;
                $scope.awesomeThings = [
                    'HTML5 Boilerplate',
                    'AngularJS',
                    'Karma'
                ];
                
                $scope.obbWsTestConnect = function(){
                     $scope.ws = new WebSocket("ws://localhost:8080/prospectorWs");
                    $scope.ws.onmessage = function (event) {
                        $log.log("Web socket onmessage: " + angular.toJson(event.data));                                                
                    };

                    $scope.ws.onopen = function (event) {
                        $log.log("Websocket onopen called: ", event);
                        $scope.ws.send("HELLO FROM THE CLIENT");
                        //$scope.ws.send({messagee: "onopen..."});
                    };

                    $scope.ws.onclose = function (event) {
                        $log.log("Websocket onclose called: ", event);
                    };
                }

                $scope.createAccount = function () {
                    console.log("Creating account called");
                    $log.log("Creating account with info", $scope.account);
                    $http.get("/register", {params: {username: $scope.account.email, password: $scope.account.password}}).success(function (xhr) {
                        $log.log("register success response: " + angular.toJson(xhr));
                        $location.path('/home');
                    }).error(function (xhr) {
                        $log.log("register error response: " + angular.toJson(xhr));
                    });
                }

                $scope.login = function () {
                    console.log("login called");
                    $log.log("Creating account with info", $scope.account);
                    $http.get("/login", {params: {username: $scope.account.email, password: $scope.account.password}}).success(function (xhr) {
                        $log.log("login success response: " + angular.toJson(xhr));
                        UserService.setUser(xhr);
                        $location.path('home');
                    }).error(function (xhr) {
                        $log.log("login error response: " + angular.toJson(xhr));
                    });
                }

                $scope.queryParams = $location.search();


            }]);
