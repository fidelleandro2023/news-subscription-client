// Subscription Controller for News Subscription App
(function() {
    'use strict';

    angular.module('newsSubscriptionApp')
        .controller('SubscriptionController', SubscriptionController)
        .controller('SubscriptionFormController', SubscriptionFormController)
        .controller('UnsubscribeController', UnsubscribeController);

    // ==================== SUBSCRIPTION LIST CONTROLLER ====================
    
    SubscriptionController.$inject = ['$scope', '$location', '$routeParams', 'ApiService', 'SubscriptionResource'];
    function SubscriptionController($scope, $location, $routeParams, ApiService, SubscriptionResource) {
        var vm = this;
        
        // ViewModel properties
        vm.subscriptions = [];
        vm.currentPage = 1;
        vm.totalPages = 1;
        vm.totalItems = 0;
        vm.itemsPerPage = 10;
        vm.loading = false;
        vm.error = null;
        vm.searchQuery = '';
        vm.sortBy = 'created_at';
        vm.sortOrder = 'desc';
        
        // ViewModel methods
        vm.loadSubscriptions = loadSubscriptions;
        vm.searchSubscriptions = searchSubscriptions;
        vm.goToPage = goToPage;
        vm.editSubscription = editSubscription;
        vm.deleteSubscription = deleteSubscription;
        vm.confirmDelete = confirmDelete;
        vm.formatDate = formatDate;
        vm.getStatusClass = getStatusClass;
        vm.getStatusText = getStatusText;
        
        // Initialize controller
        init();

        function init() {
            // Get query parameters from URL
            vm.currentPage = parseInt($routeParams.page) || 1;
            vm.searchQuery = $routeParams.search || '';
            
            loadSubscriptions();
        }

        /**
         * Load subscriptions with current filters and pagination
         */
        function loadSubscriptions() {
            vm.loading = true;
            vm.error = null;
            
            var params = {
                page: vm.currentPage,
                per_page: vm.itemsPerPage,
                sort_by: vm.sortBy,
                sort_order: vm.sortOrder
            };
            
            if (vm.searchQuery) {
                params.search = vm.searchQuery;
            }
            
            ApiService.getSubscriptions(params)
                .then(function(response) {
                    vm.subscriptions = response.data || [];
                    vm.currentPage = response.current_page || 1;
                    vm.totalPages = response.last_page || 1;
                    vm.totalItems = response.total || 0;
                    vm.itemsPerPage = response.per_page || 10;
                })
                .catch(function(error) {
                    vm.error = error.message || 'Error al cargar las suscripciones';
                    console.error('Error loading subscriptions:', error);
                })
                .finally(function() {
                    vm.loading = false;
                });
        }

        /**
         * Search subscriptions by query
         */
        function searchSubscriptions() {
            vm.currentPage = 1;
            updateUrl();
            loadSubscriptions();
        }

        /**
         * Go to specific page
         * @param {number} page - Page number
         */
        function goToPage(page) {
            if (page >= 1 && page <= vm.totalPages) {
                vm.currentPage = page;
                updateUrl();
                loadSubscriptions();
            }
        }

        /**
         * Edit subscription
         * @param {Object} subscription - Subscription to edit
         */
        function editSubscription(subscription) {
            $location.path('/subscriptions/edit/' + subscription.id);
        }

        /**
         * Confirm subscription deletion
         * @param {Object} subscription - Subscription to delete
         */
        function confirmDelete(subscription) {
            if (confirm('¿Estás seguro de que deseas eliminar esta suscripción?')) {
                deleteSubscription(subscription);
            }
        }

        /**
         * Delete subscription
         * @param {Object} subscription - Subscription to delete
         */
        function deleteSubscription(subscription) {
            vm.loading = true;
            
            ApiService.deleteSubscription(subscription.id)
                .then(function() {
                    // Remove from local array
                    var index = vm.subscriptions.indexOf(subscription);
                    if (index > -1) {
                        vm.subscriptions.splice(index, 1);
                    }
                    
                    // Show success message
                    $scope.$parent.showAlert('Suscripción eliminada exitosamente', 'success');
                    
                    // Reload if current page is empty
                    if (vm.subscriptions.length === 0 && vm.currentPage > 1) {
                        vm.currentPage--;
                        loadSubscriptions();
                    }
                })
                .catch(function(error) {
                    vm.error = error.message || 'Error al eliminar la suscripción';
                    $scope.$parent.showAlert(vm.error, 'danger');
                })
                .finally(function() {
                    vm.loading = false;
                });
        }

        /**
         * Update URL with current filters
         */
        function updateUrl() {
            var params = {};
            
            if (vm.currentPage > 1) {
                params.page = vm.currentPage;
            }
            
            if (vm.searchQuery) {
                params.search = vm.searchQuery;
            }
            
            $location.search(params);
        }

        /**
         * Format date for display
         * @param {string} dateString - Date string
         * @returns {string} Formatted date
         */
        function formatDate(dateString) {
            if (!dateString) return '';
            
            var date = new Date(dateString);
            var options = { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            
            return date.toLocaleDateString('es-ES', options);
        }

        /**
         * Get CSS class for subscription status
         * @param {boolean} isActive - Subscription status
         * @returns {string} CSS class
         */
        function getStatusClass(isActive) {
            return isActive ? 'badge-success' : 'badge-secondary';
        }

        /**
         * Get text for subscription status
         * @param {boolean} isActive - Subscription status
         * @returns {string} Status text
         */
        function getStatusText(isActive) {
            return isActive ? 'Activa' : 'Inactiva';
        }
    }

    // ==================== SUBSCRIPTION FORM CONTROLLER ====================
    
    SubscriptionFormController.$inject = ['$scope', '$location', '$routeParams', 'ApiService', 'NewsCategoryResource'];
    function SubscriptionFormController($scope, $location, $routeParams, ApiService, NewsCategoryResource) {
        var vm = this;
        
        // ViewModel properties
        vm.subscription = {
            email: '',
            news_category_id: null,
            is_active: true
        };
        vm.categories = [];
        vm.loading = false;
        vm.saving = false;
        vm.error = null;
        vm.isEdit = false;
        vm.subscriptionId = null;
        
        // Form validation
        vm.emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        
        // ViewModel methods
        vm.loadCategories = loadCategories;
        vm.loadSubscription = loadSubscription;
        vm.saveSubscription = saveSubscription;
        vm.cancel = cancel;
        vm.validateForm = validateForm;
        
        // Initialize controller
        init();

        function init() {
            vm.subscriptionId = $routeParams.id;
            vm.isEdit = !!vm.subscriptionId;
            
            loadCategories();
            
            if (vm.isEdit) {
                loadSubscription();
            }
        }

        /**
         * Load news categories
         */
        function loadCategories() {
            NewsCategoryResource.query().$promise
                .then(function(response) {
                    vm.categories = response.data || response || [];
                })
                .catch(function(error) {
                    console.error('Error loading categories:', error);
                });
        }

        /**
         * Load subscription for editing
         */
        function loadSubscription() {
            vm.loading = true;
            vm.error = null;
            
            SubscriptionResource.get({ id: vm.subscriptionId }).$promise
                .then(function(response) {
                    vm.subscription = response.data || response;
                })
                .catch(function(error) {
                    vm.error = error.message || 'Error al cargar la suscripción';
                    console.error('Error loading subscription:', error);
                })
                .finally(function() {
                    vm.loading = false;
                });
        }

        /**
         * Save subscription (create or update)
         */
        function saveSubscription() {
            if (!validateForm()) {
                return;
            }
            
            vm.saving = true;
            vm.error = null;
            
            var promise;
            
            if (vm.isEdit) {
                promise = ApiService.updateSubscription(vm.subscriptionId, vm.subscription);
            } else {
                promise = ApiService.createSubscription(vm.subscription);
            }
            
            promise
                .then(function(response) {
                    var message = vm.isEdit ? 
                        'Suscripción actualizada exitosamente' : 
                        'Suscripción creada exitosamente';
                    
                    $scope.$parent.showAlert(message, 'success');
                    $location.path('/subscriptions');
                })
                .catch(function(error) {
                    vm.error = error.message || 'Error al guardar la suscripción';
                    
                    // Handle validation errors
                    if (error.data && error.data.errors) {
                        var errors = [];
                        for (var field in error.data.errors) {
                            errors = errors.concat(error.data.errors[field]);
                        }
                        vm.error = errors.join(', ');
                    }
                    
                    $scope.$parent.showAlert(vm.error, 'danger');
                })
                .finally(function() {
                    vm.saving = false;
                });
        }

        /**
         * Cancel form and go back
         */
        function cancel() {
            $location.path('/subscriptions');
        }

        /**
         * Validate form data
         * @returns {boolean} Form validity
         */
        function validateForm() {
            vm.error = null;
            
            if (!vm.subscription.email) {
                vm.error = 'El email es requerido';
                return false;
            }
            
            if (!vm.emailPattern.test(vm.subscription.email)) {
                vm.error = 'El formato del email no es válido';
                return false;
            }
            
            if (!vm.subscription.news_category_id) {
                vm.error = 'La categoría es requerida';
                return false;
            }
            
            return true;
        }
    }

    // ==================== UNSUBSCRIBE CONTROLLER ====================
    
    UnsubscribeController.$inject = ['$scope', '$routeParams', '$location', 'ApiService'];
    function UnsubscribeController($scope, $routeParams, $location, ApiService) {
        var vm = this;
        
        // ViewModel properties
        vm.subscriptionId = $routeParams.id;
        vm.token = $routeParams.token;
        vm.loading = false;
        vm.success = false;
        vm.error = null;
        
        // ViewModel methods
        vm.unsubscribe = unsubscribe;
        vm.goHome = goHome;
        
        // Initialize controller
        init();

        function init() {
            if (vm.subscriptionId && vm.token) {
                unsubscribe();
            } else {
                vm.error = 'Parámetros de desuscripción inválidos';
            }
        }

        /**
         * Unsubscribe using token
         */
        function unsubscribe() {
            vm.loading = true;
            vm.error = null;
            
            ApiService.unsubscribe(vm.subscriptionId, vm.token)
                .then(function(response) {
                    vm.success = true;
                })
                .catch(function(error) {
                    vm.error = error.message || 'Error al procesar la desuscripción';
                    console.error('Error unsubscribing:', error);
                })
                .finally(function() {
                    vm.loading = false;
                });
        }

        /**
         * Go to home page
         */
        function goHome() {
            $location.path('/');
        }
    }

})();