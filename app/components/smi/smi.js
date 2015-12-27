/**
 * Created by Samuel on 20/12/2015.
 */

angular.module('mibBrowser.smi', [])
.service('smiManager', ['$rootScope', '$http', '$q', 'apiServer', function($rootScope, $http, $q, apiServer) {
    var endpoint = null;
    var update = false;
    var moduleCount;

    function connect() {
        $http.get(`http://${apiServer}/_api/smimanager`)
        .then(function (response) {
            endpoint = 'http://' + apiServer + '/_api/smimanager/' + response.data.id;
        })
    }

    function compileModule(source) {
        var defer = $q.defer();

        if(endpoint === null) {
            defer.reject();
        } else {
            $http.put(endpoint + '/compile', {source})
            .then(function (response) {
                if (response.status === 200) {
                    defer.resolve(response.module);
                    moduleCount++;
                } else {
                    defer.reject();
                }
            });
        }

        return defer.promise;
    }

    function loadModule(module) {
        var defer = $q.defer();

        if(endpoint === null) {
            defer.reject();
        } else {
            $http.put(`${endpoint}/load/${module}`, {})
            .then(function (response) {
                if (response.status === 200) {
                    defer.resolve(response.data.module);
                    moduleCount++;
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
                defer.resolve(response.data.rootNodes)
            });
        }

        return defer.promise;
    }

    function getNode(oid) {
        var defer = $q.defer();

        if(endpoint === null) {
            defer.reject();
        } else {
            $http.get(`${endpoint}/objects/${oid}`)
            .then(function (response) {
                if (response.status === 200) {
                    defer.resolve(response.data.node)
                }
            });
        }

        return defer.promise;
    }

    /*
    This function is a bit longer because it creates a WeakMap from the oids passed in.
    This is done so that the caller can easily check if a given oid was found or not.
     */
    function getNodes(oids) {
        var defer = $q.defer();

        if(endpoint === null) {
            defer.reject();
        } else {
            $http.put(`${endpoint}/nodes/bulk`, {oids})
            .then(function (response) {
                if (response.status === 200) {
                    var nodeMap = new WeakMap();
                    var nodes = response.data.nodes;

                    (function buildMap(oidIter, nodeIter) {
                        var nextOid = oidIter.next();
                        var nextNode = nodeIter.next();

                        if(nextOid.done || nextNode.done) {
                            if (!nextOid.done || !nextNode.done) {
                                throw new Error('size mismatch')
                            }
                            return;
                        }

                        nodeMap.set(nextOid.value[1], nextNode.value[1]);

                        buildMap(oidIter, nodeIter);
                    })(oids.entries(), nodes.entries());

                    defer.resolve(nodeMap)
                }
            });
        }

        return defer.promise;
    }

    function getObject(oid) {
        var defer = $q.defer();

        if(endpoint === null) {
            defer.reject();
        } else {
            $http.get(`${endpoint}/objects/${oid}`)
            .then(function (response) {
                if (response.status === 200) {
                    defer.resolve(response.data.object)
                }
            });
        }
    }

    function doUpdate(arg) {
        if(arg) {
            update = !update;
        }

        return update;
    }

    return {
        connect,
        compileModule,
        loadModule,
        getRootNodes,
        getNode,
        getNodes,
        getObject,
        doUpdate
    };
}])
.service('smiModules', ['$http', '$q', 'apiServer', function($http, $q, apiServer) {
    var endpoint = `http://${apiServer}/_api/modules`;
    var modules = null;

    function getModules() {
        var defer = $q.defer();

        if(modules) {
            defer.resolve(modules)
        }

        $http.get(endpoint)
        .then(function (response) {
            if (response.status === 200) {
                modules = response.data.modules;
                defer.resolve(modules);
            }
        });

        return defer.promise
    }

    return {
        getModules
    }
}])
.value('apiServer', 'localhost:1337');
