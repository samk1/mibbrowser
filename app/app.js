'use strict';

// Declare app level module which depends on views, and components
angular.module('mibBrowser', [
  'mibBrowser.smiService'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/view1'});
}]);
