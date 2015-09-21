'use strict';

/**
 * @ngdoc function
 * @name nextGreatFantasyAppApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the nextGreatFantasyAppApp
 */
angular.module('nextGreatFantasyAppApp')
        .controller('HomeCtrl', ["$scope", "$location", "$log", "$http", "UserService", function ($scope, $location, $log, $http, UserService) {

                $scope.userObj = UserService.getUser();
                $log.log("User obj", $scope.userObj);


                $scope.queryParams = $location.search();


            }]);