// News Subscription App - AngularJS 1.7
(function() {
    'use strict';

    // Define the main module
    angular.module('newsSubscriptionApp', ['ngRoute', 'ngResource'])
        .config(configFunction)
        .controller('MainController', MainController)
        .run(runFunction);

    // Configuration
    configFunction.$inject = ['$routeProvider', '$locationProvider', '$httpProvider'];
    function configFunction($routeProvider, $locationProvider, $httpProvider) {
        
        // Configure routes
        $routeProvider
            .when('/', {
                templateUrl: 'views/home.html',
                controller: 'HomeController',
                controllerAs: 'vm'
            })
            .when('/news', {
                templateUrl: 'views/news.html',
                controller: 'NewsController',
                controllerAs: 'vm'
            })
            .when('/news/:id', {
                templateUrl: 'views/news-detail.html',
                controller: 'NewsDetailController',
                controllerAs: 'vm'
            })
            .when('/subscriptions', {
                templateUrl: 'views/subscriptions.html',
                controller: 'SubscriptionController',
                controllerAs: 'vm'
            })
            .otherwise({
                redirectTo: '/'
            });

        // Configure HTTP interceptor for API calls
        $httpProvider.interceptors.push('httpInterceptor');
        
        // Disable HTML5 mode to use hash-based routing
        $locationProvider.hashPrefix('');
        
        // Configure CORS
        $httpProvider.defaults.useXDomain = true;
        delete $httpProvider.defaults.headers.common['X-Requested-With'];
    }

    // Main Controller
    MainController.$inject = ['$scope', '$location'];
    function MainController($scope, $location) {
        var vm = this;
        
        // Initialize variables
        $scope.loading = false;
        $scope.alert = {
            show: false,
            type: 'info',
            message: '',
            icon: 'fa-info-circle'
        };

        // Methods
        $scope.showAlert = showAlert;
        $scope.closeAlert = closeAlert;
        $scope.isActive = isActive;

        // Show alert message
        function showAlert(type, message) {
            $scope.alert = {
                show: true,
                type: type,
                message: message,
                icon: getAlertIcon(type)
            };

            // Auto-hide after 5 seconds
            setTimeout(function() {
                $scope.$apply(function() {
                    $scope.closeAlert();
                });
            }, 5000);
        }

        // Close alert
        function closeAlert() {
            $scope.alert.show = false;
        }

        // Get alert icon based on type
        function getAlertIcon(type) {
            switch(type) {
                case 'success': return 'fa-check-circle';
                case 'danger': return 'fa-exclamation-circle';
                case 'warning': return 'fa-exclamation-triangle';
                default: return 'fa-info-circle';
            }
        }

        // Check if current route is active
        function isActive(route) {
            return route === $location.path();
        }
    }

    // Run function
    runFunction.$inject = ['$rootScope', '$location'];
    function runFunction($rootScope, $location) {
        
        // Handle route change start
        $rootScope.$on('$routeChangeStart', function(event, next, current) {
            $rootScope.loading = true;
        });

        // Handle route change success
        $rootScope.$on('$routeChangeSuccess', function(event, current, previous) {
            $rootScope.loading = false;
        });

        // Handle route change error
        $rootScope.$on('$routeChangeError', function(event, current, previous, rejection) {
            $rootScope.loading = false;
            console.error('Route change error:', rejection);
        });
    }

    // HTTP Interceptor
    angular.module('newsSubscriptionApp')
        .factory('httpInterceptor', httpInterceptor);

    httpInterceptor.$inject = ['$q', '$rootScope'];
    function httpInterceptor($q, $rootScope) {
        return {
            request: function(config) {
                // Add loading indicator
                $rootScope.loading = true;
                
                // Add API base URL if not already present and not a template request
                if (config.url.indexOf('http') !== 0 && 
                    !config.url.startsWith('views/') && 
                    !config.url.endsWith('.html')) {
                    config.url = 'http://localhost:8000/api/v1' + config.url;
                }
                
                // Add headers
                config.headers = config.headers || {};
                config.headers['Content-Type'] = 'application/json';
                config.headers['Accept'] = 'application/json';
                
                return config;
            },
            
            response: function(response) {
                $rootScope.loading = false;
                return response;
            },
            
            responseError: function(rejection) {
                $rootScope.loading = false;
                
                // Handle different error types
                var errorMessage = 'Ha ocurrido un error';
                
                if (rejection.status === 0) {
                    errorMessage = 'No se puede conectar con el servidor';
                } else if (rejection.status === 404) {
                    errorMessage = 'Recurso no encontrado';
                } else if (rejection.status === 500) {
                    errorMessage = 'Error interno del servidor';
                } else if (rejection.data && rejection.data.message) {
                    errorMessage = rejection.data.message;
                }
                
                // Broadcast error event
                $rootScope.$broadcast('httpError', {
                    status: rejection.status,
                    message: errorMessage
                });
                
                return $q.reject(rejection);
            }
        };
    }

})();