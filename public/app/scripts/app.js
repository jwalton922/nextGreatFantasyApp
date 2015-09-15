'use strict';

/**
 * @ngdoc overview
 * @name nextGreatFantasyAppApp
 * @description
 * # nextGreatFantasyAppApp
 *
 * Main module of the application.
 */
angular
  .module('nextGreatFantasyAppApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: '/app/views/main.html',
        controller: 'MainCtrl'
      })
      .when('/about', {
        templateUrl: '/app/views/about.html',
        controller: 'AboutCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
