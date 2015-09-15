'use strict';

/**
 * @ngdoc function
 * @name nextGreatFantasyAppApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the nextGreatFantasyAppApp
 */
angular.module('nextGreatFantasyAppApp')
  .controller('MainCtrl', function ($scope, $location) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
    
    $scope.queryParams = $location.search();
    
    
  });
