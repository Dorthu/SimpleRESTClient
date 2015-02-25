'use strict';

// Declare app level module which depends on views, and components
angular.module('SimpleRESTClient', [
  'ngRoute'
])

/*
    Helper classes
 */
///source: http://stackoverflow.com/questions/14430655/recursion-in-angular-directives
.factory('RecursionHelper', ['$compile', function($compile){
    return {
        /**
         * Manually compiles the element, fixing the recursion loop.
         * @param element
         * @param [link] A post-link function, or an object with function(s) registered via pre and post properties.
         * @returns An object containing the linking functions.
         */
        compile: function(element, link){
            console.log("Compiling "+element);

            // Normalize the link parameter
            if(angular.isFunction(link)){
                link = { post: link };
            }

            // Break the recursion loop by removing the contents
            var contents = element.contents().remove();
            var compiledContents;
            return {
                pre: (link && link.pre) ? link.pre : null,
                /**
                 * Compiles and re-adds the contents
                 */
                post: function(scope, element){
                    // Compile the contents
                    if(!compiledContents){
                        compiledContents = $compile(contents);
                    }
                    // Re-add the compiled contents to the element
                    compiledContents(scope, function(clone){
                        element.append(clone);
                    });

                    // Call the post-linking function, if any
                    if(link && link.post){
                        link.post.apply(null, arguments);
                    }
                }
            };
        }
    };
}])

.directive('enterAware', function() {
        return function(scope, element, attrs) {

            ///popups break these modifiers, since these events don't fire when the alert has focus
            scope.modifiers = [];

            element.bind("keydown keypress", function(event) {
                if(event.which==13) ///enter
                {
                    alert(scope.modifiers);
                    event.preventDefault();
                }
                if(event.which==16 || event.which==17 || event.which==18 || event.which==224)
                {
                    scope.modifiers.push(event.which);
                }
            });

            element.bind("keyup", function(event) {
                if(event.which==16 || event.which==17 || event.which==18 || event.which==224)
                {
                    var removeIndex = scope.modifiers.indexOf(event.which);
                    scope.modifiers.splice(removeIndex, 1);
                }
            });
        };
    })

/*
    Logic classes
 */
.controller("RequestCtrl", ['$scope', '$rootScope', function($scope, $rootScope) {

        $scope.headers = [{'name':'Accept','value':'application/json', 'pinned': 1}];

        $scope.addHeader = function() {
            $scope.headers.push({'name':'','value':'', 'pinned': 0});
        };

        $scope.showEm = function() { alert($scope.headers[$scope.headers.length-1].name);};

        $scope.requestBody  = [{'type':'keyval', 'key':'example', 'value':'value'}];

        $scope.requestURL = "";
        $scope.requestMethod="GET";

        ///hide the loader
        $('#loader-fill').hide();

        $scope.togglePinnedHeader = function(index) {
            console.log($scope.headers[index]);
            $scope.headers[index]['pinned'] = $scope.headers[index]['pinned']==1 ? 0 : 1;
        };

        $scope.removeHeader = function(index) {
            $scope.headers.splice(index, 1);
        };

        $scope.clearHeaders = function() {
            console.log('Clearing headers..');
            var pinnedHeaders = [];
            for(var x=0; x < $scope.headers.length; x++) {
                var header = $scope.headers[x];
                console.log(header);
                if(header['pinned'])
                    pinnedHeaders.push(header);
            }

            $scope.headers = pinnedHeaders;
        };

        $scope.newRequest = function() {
            $scope.requestBody = [];
            $scope.clearHeaders();
        };

        $scope.serializeJSONRep = function(jsonRep, ret) {

            for(var x=0; x<jsonRep.length; x++) {
                if(jsonRep[x]['type']=='keyval')
                    ret[jsonRep[x]['key']] = jsonRep[x]['value'];
                else if(jsonRep[x]['type']=='arval')
                    ret.push(jsonRep[x]['value']);
                else if(jsonRep[x]['type']=='obj') {
                    var add;
                    if (jsonRep[x]['objType'] == 'dict')
                        add = $scope.serializeJSONRep(jsonRep[x]['obj'], {});
                    else
                        add = $scope.serializeJSONRep(jsonRep[x]['obj'], []);

                    if(ret.isArray)
                        ret.push(add);
                    else
                        ret[jsonRep[x]['key']] = add;
                }
            }

            return ret;
        };

        ///loads from history
        $scope.$on('loadFromHistory', function(event, requestRep, headers) {
            $scope.requestBody = requestRep;
            $scope.headers = headers;
        });

        $scope.sendRequest = function() {

            $('#loader-fill').show();

            var headers = {};
            var data = {};
            for(var x=0; x < $scope.headers.length; x++) {
                headers[$scope.headers[x]['name']] = $scope.headers[x]['value'];
            }

            data = $scope.serializeJSONRep($scope.requestBody, {});

            console.log(headers);
            console.log(data);

            var request = {
                type: $scope.requestMethod,
                url: $scope.requestURL,
                success: function(data, textStatus, rq) {
                    //alert(data);
                    request.response = data;

                    try {
                        request.responseData = $.parseJSON(data);
                    }
                    catch (err) {
                        request.responseData = {};
                        console.log("Unable to parse response "+data);
                    }

                    request.responseHeaders=rq.getAllResponseHeaders();

                    $rootScope.response = data;
                    $rootScope.$emit("gotResponse", data, request.responseHeaders);
                    console.log(data);
                    console.log(request);
                }
            };

            if(headers)
                request['headers'] = headers;
            if(data)
                request['data'] = data;

            console.log(request);

            var requestHistory = {
                'name':'Request '+$rootScope.history.length,
                'request': request,
                'headers': $.extend(true, [], $scope.headers),
                'jsonRep': $.extend(true, [], $scope.requestBody)
            };
            $rootScope.history.push(requestHistory);

            console.log(requestHistory);
            console.log($scope.requestBody);

            $.ajax(request)
                .done(function() {
                    $scope.newRequest();
                    $('#loader-fill').hide();
                });

        };
    }])

.controller("ResponseController", ['$scope', '$rootScope', function($scope, $rootScope) {

        $scope.response = "{}";
        $scope.responseHeaders = "..";

        $rootScope.$on('gotResponse', function(event, data, headers) {
            $scope.response = data;
            $scope.responseHeaders = headers;
            $scope.$apply();
        });

    }])

.directive("jsonTemplate", function(RecursionHelper) {
        return {
            restrict: 'E',
            scope: {
                json: '=json',
                parent: '=parent',
                objType: '=objType'
            },
            templateUrl: 'partials/json_section.html',
            controller: function($scope, $element) {

                $scope.opening_char = '{';
                $scope.closing_char = '}';

                if($scope.objType=='arr')
                {
                    $scope.opening_char = '[';
                    $scope.closing_char = ']';
                }

                $scope.addRequestPair = function () {
                    console.log($scope.json);
                    if($scope.objType=='arr')
                        $scope.json.push({'type': 'arval', 'value': 'value'});
                    else
                        $scope.json.push({'type': 'keyval', 'key': 'newKey', 'value': ''});
                };

                $scope.addRequestObject = function () {
                    $scope.json.push({'type': 'obj', 'objType':'dict', 'key':'object', 'obj': [{'type': 'keyval', 'key': 'example', 'value': 'value'}]});
                };

                $scope.addRequestArray = function () {
                    $scope.json.push({'type': 'obj', 'objType':'arr', 'key':'array', 'obj': [{'type': 'arval', 'value': 'value'}]});
                };

                $scope.removeRequestPair = function(index) {
                        $scope.json.splice(index, 1);

                        if($scope.parent && $scope.json.length < 1)
                        {
                            $scope.parent.splice($scope.parent.indexOf($scope.json), 1);
                        }
                };

            },
            compile: function(element) {
                console.log("Calling compole function");
                return RecursionHelper.compile(element);    ////something about a link function
            }
        };
    })

.directive("requestHistory", ['$rootScope', function($rootScope) {
        return {
            restrict: 'E',
            scope: {

            },
            templateUrl: 'partials/request_history.html',
            controller: function($scope, $element) {

                $rootScope.history = [];
                $scope.history = $rootScope.history;

                $scope.chooseHistory = function(index) {
                   /// alert($rootScope.history[index]['request']);
                    console.log($rootScope.history[index]);
                    $rootScope.$broadcast('loadFromHistory', $rootScope.history[index]['jsonRep'], $rootScope.history[index]['headers']);
                    console.log('Called emit');
                };

            }
        };
    }])

.directive("viewTabs", ['$rootScope', function($rootScope) {
        return {
            restrict: 'E',
            scope: {

            },
            templateUrl: 'partials/view_tab.html',
            controller: function($scope, $element) {

                $scope.selected = 0;

                $scope.select = function(index) {
                    $scope.selected = index;
                    $scope.$apply();
                };

                $rootScope.$on('gotResponse', function(event, data) {
                    $scope.select(1);
                });

                $rootScope.$on('showRequest', function(event) {
                    $scope.select(0);
                });
            }
        };
    }])
;
