'use strict';

// Declare app level module which depends on views, and components
angular.module('mibBrowser', ['ngRoute', 'mibBrowser.smi'])
.controller('moduleController', ['smiManager', 'smiModules', '$scope', function (smiManager, smiModules, $scope) {
    $scope.showIetfModules = true;
    $scope.showUserModules = false;
    smiModules.getModules().then(
        function (modules) {
            $scope.ietfModules = [];
            modules.forEach(function (moduleName) {
                $scope.ietfModules.push({
                    name: moduleName,
                    compiled: false
                });
            });
        }
    );

    smiManager.connect();

    $scope.loadModule = function (module) {
        smiManager.loadModule(module.name)
        .then(function () {
            module.compiled = true;
            smiManager.doUpdate(true);
        });
    }
}])
.controller('objectController', ['smiManager', '$scope', function (smiManager, $scope) {
    var nodes = new Map();
    var nodeSerial = 0;

    // I feel like all this stuff should be in a service
    $scope.addNode = function (node) {
        var nodeId = nodeSerial++;
        nodes.set(nodeId, node);
        return nodeId;
    };

    $scope.getNode = function (nodeId) {
        return nodes.get(nodeId)
    };

    $scope.clearNodes = function () {
        nodeSerial = 0;
        nodes.clear();
    };

    $scope.doUpdate = smiManager.doUpdate;
}])
.directive('mibNodeTree', ['smiManager', '$compile', function (smiManager, $compile) {
    function link(scope, element) {
        // the doUpdate() function belongs to the smiManager
        // whenever some other controller calls it with an argument the tree will be wiped
        scope.$watch('doUpdate()', function () {
            // retrieve the root nodes
            smiManager.getRootNodes()
            .then(function (rootNodes) {
                // remove everything from the list
                element.empty();

                // wipe all the nodes from the controller
                // seems a bit wasteful
                scope.clearNodes();

                // create root node list element
                var rootNodeList = angular.element('<ul></ul>');

                rootNodes.forEach(function (rootNode) {
                    var nodeId = scope.addNode(rootNode);
                    var nodeElm = angular.element(
                        `<li mib-node mib-node-id="${nodeId}"></li>`
                    );
                    $compile(nodeElm)(scope);
                    rootNodeList.append(nodeElm);
                });

                element.append(rootNodeList);
            })
        })
    }

    return {link}
}])
.directive('mibNode', ['smiManager', '$compile', function (smiManager, $compile) {
    function link(scope, element, attrs) {
        var nodeId = parseInt(attrs.mibNodeId);
        var node = scope.getNode(nodeId);
        var loaded = false;
        var subNodeList, expandNodeBtn, shrinkNodeBtn;

        // set up this node's OID
        if (node.parent) {
            node.oid = node.parent.oid.slice();
            node.oid.push(node.descriptor);
        } else {
            node.oid = [ node.descriptor ];
        }

        // create the shrink and expand buttons and add them to the element
        expandNodeBtn = angular.element('<i class="fa fa-chevron-right expand-node-btn"></i>')
            .on('click', expandNode);
        element.append(expandNodeBtn);

        shrinkNodeBtn = angular.element('<i class="fa fa-chevron-down shrink-node-btn"></i>')
            .on('click', shrinkNode)
            .css('display', 'none');
        element.append(shrinkNodeBtn);

        // add the text container to the element
        element.append(
            angular.element('<span></span>')
            .text(`${node.descriptor}${node.idenitifier ? `(${node.identifier})` : ''}`)
        );

        // create the sub node list but hide it
        subNodeList = angular.element('<ul></ul>');
        subNodeList.css('display', 'none');
        element.append(subNodeList);

        // function for loading the sub nodes
        function buildSubNodeList() {
            var childOids = [];

            // build the child oids
            node.childDescriptors.forEach(function (d) {
                var childOid = node.oid.slice();
                childOid.push(d);
                childOids.push(childOid);
            });

            // retrieve the child nodes and add them to the sub-node list
            smiManager.getNodes(childOids)
                .then(function(nodeMap) {
                    childOids.forEach(function(oid) {
                        var childNode = nodeMap.get(oid);
                        var nodeId = scope.addNode(childNode);
                        var li = angular.element(`<li mib-node mib-node-id="${nodeId}"></li>`);

                        childNode.parent = node;
                        $compile(li)(scope);
                        subNodeList.append(li);
                    });

                    element.append(subNodeList);

                    // the sub nodes are now loaded
                    loaded = true;
                });
        }

        function expandNode() {
            // the first time the node is expanded the sub node list will need to be loaded
            if (!loaded) {
                buildSubNodeList();
            }

            // after sub nodes are loaded, just show/hide the node list
            expandNodeBtn.css('display', 'none');
            shrinkNodeBtn.css('display', 'initial');
            subNodeList.css('display', 'initial');
        }

        function shrinkNode() {
            // opposite of expand
            expandNodeBtn.css('display', 'initial');
            shrinkNodeBtn.css('display', 'node');
            subNodeList.css('display', 'none');
        }
    }

    return {link}
}])
.config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/view1'});
}]);
