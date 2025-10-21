// API Service for News Subscription App
(function() {
    'use strict';

    angular.module('newsSubscriptionApp')
        .factory('ApiService', ApiService);

    ApiService.$inject = ['$http', '$q'];
    function ApiService($http, $q) {
        
        // Base URL de la API
        var API_BASE_URL = 'http://127.0.0.1:8000/api/v1';
        
        var service = {
            // News methods
            getNews: getNews,
            getNewsById: getNewsById,
            getNewsByCategory: getNewsByCategory,
            
            // News Categories methods
            getNewsCategories: getNewsCategories,
            
            // Subscription methods
            getSubscriptions: getSubscriptions,
            createSubscription: createSubscription,
            updateSubscription: updateSubscription,
            deleteSubscription: deleteSubscription,
            unsubscribe: unsubscribe,
            
            // Utility methods
            handleError: handleError
        };

        return service;

        // ==================== NEWS METHODS ====================
        
        /**
         * Get all news with pagination
         * @param {Object} params - Query parameters (page, per_page, category, search)
         * @returns {Promise}
         */
        function getNews(params) {
            var config = {
                method: 'GET',
                url: API_BASE_URL + '/news',
                params: params || {}
            };
            
            return $http(config)
                .then(function(response) {
                    return response.data;
                })
                .catch(handleError);
        }

        /**
         * Get news by ID
         * @param {number} id - News ID
         * @returns {Promise}
         */
        function getNewsById(id) {
            var config = {
                method: 'GET',
                url: API_BASE_URL + '/news/' + id
            };
            
            return $http(config)
                .then(function(response) {
                    return response.data;
                })
                .catch(handleError);
        }

        /**
         * Get news by category
         * @param {number} categoryId - Category ID
         * @param {Object} params - Additional parameters
         * @returns {Promise}
         */
        function getNewsByCategory(categoryId, params) {
            var config = {
                method: 'GET',
                url: API_BASE_URL + '/news',
                params: angular.extend({ category: categoryId }, params || {})
            };
            
            return $http(config)
                .then(function(response) {
                    return response.data;
                })
                .catch(handleError);
        }

        // ==================== NEWS CATEGORIES METHODS ====================
        
        /**
         * Get all news categories
         * @returns {Promise}
         */
        function getNewsCategories() {
            var config = {
                method: 'GET',
                url: API_BASE_URL + '/categories'
            };
            
            return $http(config)
                .then(function(response) {
                    return response.data;
                })
                .catch(handleError);
        }

        // ==================== SUBSCRIPTION METHODS ====================
        
        /**
         * Get all subscriptions with pagination
         * @param {Object} params - Query parameters
         * @returns {Promise}
         */
        function getSubscriptions(params) {
            var config = {
                method: 'GET',
                url: API_BASE_URL + '/subscriptions',
                params: params || {}
            };
            
            return $http(config)
                .then(function(response) {
                    return response.data;
                })
                .catch(handleError);
        }

        /**
         * Create a new subscription
         * @param {Object} subscriptionData - Subscription data
         * @returns {Promise}
         */
        function createSubscription(subscriptionData) {
            var config = {
                method: 'POST',
                url: API_BASE_URL + '/subscriptions',
                data: subscriptionData
            };
            
            return $http(config)
                .then(function(response) {
                    return response.data;
                })
                .catch(handleError);
        }

        /**
         * Update a subscription
         * @param {number} id - Subscription ID
         * @param {Object} subscriptionData - Updated subscription data
         * @returns {Promise}
         */
        function updateSubscription(id, subscriptionData) {
            var config = {
                method: 'PUT',
                url: API_BASE_URL + '/subscriptions/' + id,
                data: subscriptionData
            };
            
            return $http(config)
                .then(function(response) {
                    return response.data;
                })
                .catch(handleError);
        }

        /**
         * Delete a subscription
         * @param {number} id - Subscription ID
         * @returns {Promise}
         */
        function deleteSubscription(id) {
            var config = {
                method: 'DELETE',
                url: API_BASE_URL + '/subscriptions/' + id
            };
            
            return $http(config)
                .then(function(response) {
                    return response.data;
                })
                .catch(handleError);
        }

        /**
         * Unsubscribe using token or email
         * @param {Object} data - Unsubscribe data (token or email)
         * @returns {Promise}
         */
        function unsubscribe(data) {
            var config = {
                method: 'POST',
                url: API_BASE_URL + '/subscriptions/' + (data.id || 'unsubscribe') + '/unsubscribe',
                data: data
            };
            
            return $http(config)
                .then(function(response) {
                    return response.data;
                })
                .catch(handleError);
        }

        // ==================== UTILITY METHODS ====================
        
        /**
         * Handle HTTP errors
         * @param {Object} error - HTTP error response
         * @returns {Promise}
         */
        function handleError(error) {
            var errorMessage = 'Ha ocurrido un error desconocido';
            
            if (error.data) {
                if (error.data.message) {
                    errorMessage = error.data.message;
                } else if (error.data.error) {
                    errorMessage = error.data.error;
                } else if (typeof error.data === 'string') {
                    errorMessage = error.data;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            // Log error for debugging
            console.error('API Error:', error);
            
            return $q.reject({
                status: error.status || 0,
                message: errorMessage,
                data: error.data
            });
        }
    }

    // ==================== RESOURCE FACTORIES ====================
    
    // News Resource Factory
    angular.module('newsSubscriptionApp')
        .factory('NewsResource', NewsResource);

    NewsResource.$inject = ['$resource'];
    function NewsResource($resource) {
        return $resource('http://127.0.0.1:8000/api/v1/news/:id', { id: '@id' }, {
            'query': { 
                method: 'GET', 
                isArray: false,
                transformResponse: function(data) {
                    return angular.fromJson(data);
                }
            },
            'get': { 
                method: 'GET',
                transformResponse: function(data) {
                    var response = angular.fromJson(data);
                    return response.data || response;
                }
            },
            'save': { method: 'POST' },
            'update': { method: 'PUT' },
            'delete': { method: 'DELETE' }
        });
    }

    // Subscription Resource Factory
    angular.module('newsSubscriptionApp')
        .factory('SubscriptionResource', SubscriptionResource);

    SubscriptionResource.$inject = ['$resource'];
    function SubscriptionResource($resource) {
        return $resource('http://127.0.0.1:8000/api/v1/subscriptions/:id', { id: '@id' }, {
            'query': { 
                method: 'GET', 
                isArray: false,
                transformResponse: function(data) {
                    return angular.fromJson(data);
                }
            },
            'get': { 
                method: 'GET',
                transformResponse: function(data) {
                    var response = angular.fromJson(data);
                    return response.data || response;
                }
            },
            'save': { method: 'POST' },
            'update': { method: 'PUT' },
            'delete': { method: 'DELETE' },
            'unsubscribe': {
                method: 'POST',
                url: 'http://127.0.0.1:8000/api/v1/subscriptions/:id/unsubscribe'
            }
        });
    }

    // News Categories Resource Factory
    angular.module('newsSubscriptionApp')
        .factory('NewsCategoryResource', NewsCategoryResource);

    NewsCategoryResource.$inject = ['$resource'];
    function NewsCategoryResource($resource) {
        return $resource('http://127.0.0.1:8000/api/v1/categories/:id', { id: '@id' }, {
            'query': { 
                method: 'GET', 
                isArray: false,
                transformResponse: function(data) {
                    var response = angular.fromJson(data);
                    return response.data || response;
                }
            },
            'get': { method: 'GET' }
        });
    }

})();