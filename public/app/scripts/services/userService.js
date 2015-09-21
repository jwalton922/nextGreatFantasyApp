'use strict';

angular.module('nextGreatFantasyAppApp')
        .service('UserService', [function () {
            var userObj = null;
            return {
                setUser : function(user){
                    userObj = user;
                },
                getUser : function(){
                    return userObj;
                }
            };
}]);