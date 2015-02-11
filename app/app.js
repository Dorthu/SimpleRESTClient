'use strict';

// Declare app level module which depends on views, and components
angular.module('SimpleRESTClient', [
  'ngRoute'
])

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

.controller("RequestCtrl", function($scope) {

        $scope.headers = [{'name':'Accept','value':'application/json'}];

        $scope.addHeader = function() {
            $scope.headers.push({'name':'','value':''});
        };

        $scope.showEm = function() { alert($scope.headers[$scope.headers.length-1].name);};

        $scope.requestBody = [{'type':'keyval', 'key':'example', 'value':'value'}];

        $scope.requestURL = "";
        $scope.requestMethod="GET";

        $scope.serializeJSONRep = function(jsonRep, ret) {

            for(var x=0; x<jsonRep.length; x++) {
                if(jsonRep[x]['type']=='keyval')
                    ret[jsonRep[x]['key']] = jsonRep[x]['value'];
                else if(jsonRep[x]['type']=='arval')
                    ret.push(jsonRep[x]['value'])
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

        $scope.sendRequest = function() {

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
                success: function(data) {
                    alert(data);
                    console.log(data);
                }
            };

            if(headers)
                request['headers'] = headers;
            if(data)
                request['data'] = data;

            console.log(request);

            $.ajax(request)
                .done(function() {
                    ///alert("Success");
                });

        };
    })

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
                }

                $scope.addRequestArray = function () {
                    $scope.json.push({'type': 'obj', 'objType':'arr', 'key':'array', 'obj': [{'type': 'arval', 'value': 'value'}]});
                }

                $scope.removeRequestPair = function(index) {
                        $scope.json.splice(index, 1);

                        if($scope.parent && $scope.json.length < 1)
                        {
                            $scope.parent.splice($scope.parent.indexOf($scope.json), 1);
                        }
                }

            },
            compile: function(element) {
                console.log("Calling compole function");
                return RecursionHelper.compile(element);    ////something about a link function
            }
        };
    })
;
