/**
 * Created by Samuel on 20/12/2015.
 */

angular.module('mibBrowser.smi')

.service('manager', ['$http', '$q', 'apiServer', function($http, $q, apiServer) {
    var endpoint = null;

    function connect() {
        $http.get('/_api/smimanager')
        .then(function (response) {
            endpoint = 'http://' + apiServer + '/_api/smimanager/' + response.id;
        })
    }

    function compileMib(source) {
        var defer = $q.defer();

        if(endpoint === null) {
            defer.reject();
        } else {
            $http.post(endpoint + '/compile', {source: source})
            .then(function (response) {
                if (response.success) {
                    defer.resolve();
                } else {
                    defer.reject();
                }
            });
        }

        return defer.promise;
    }

    function getRootNodes() {
        var defer = $q.defer();

        if(endpoint === null) {
            defer.reject();
        } else {
            $http.get(endpoint + '/rootNodes')
            .then(function (response) {
                defer.resolve(response)
            });
        }

        return defer.promise;
    }

    function getNode(oid) {
        var defer = $q.defer();

        if(endpoint === null) {
            defer.reject();
        } else {
            $http.get(endpoint + '/nodes/' + oid)
            .then(function (response) {
                defer.resolve(response)
            })
        }

        return defer.promise;
    }
}])
.value('apiServer', 'localhost:1337');
