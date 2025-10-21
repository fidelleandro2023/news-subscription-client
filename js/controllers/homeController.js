// Home Controller
angular.module('newsSubscriptionApp')
    .controller('HomeController', ['$scope', 'ApiService', '$location', function($scope, ApiService, $location) {
        var vm = this;
        
        // Initialize properties
        vm.loading = true;
        vm.error = null;
        vm.recentNews = [];
        vm.categories = [];
        vm.subscriptionEmail = '';
        vm.subscriptionLoading = false;
        vm.subscriptionMessage = '';
        
        // Modal subscription properties
        vm.modalSubscriptionEmail = '';
        vm.modalSubscriptionName = '';
        vm.modalSubscriptionLoading = false;
        vm.modalSubscriptionMessage = '';
        
        vm.stats = {
            totalNews: 0,
            totalCategories: 0,
            totalSubscriptions: 0
        };
        
        // Initialize controller
        vm.init = function() {
            vm.loadRecentNews();
            vm.loadCategories();
            vm.loadStats();
        };
        
        // Load recent news
        vm.loadRecentNews = function() {
            ApiService.getNews({ limit: 6, page: 1 })
                .then(function(response) {
                    vm.recentNews = response.data.data || response.data;
                    vm.stats.totalNews = response.data.total || vm.recentNews.length;
                })
                .catch(function(error) {
                    console.error('Error loading recent news:', error);
                    vm.error = 'Error al cargar las noticias recientes';
                })
                .finally(function() {
                    vm.loading = false;
                });
        };
        
        // Load categories
        vm.loadCategories = function() {
            ApiService.getNewsCategories()
                .then(function(response) {
                    vm.categories = response.data.data || response.data;
                    vm.stats.totalCategories = vm.categories.length;
                })
                .catch(function(error) {
                    console.error('Error loading categories:', error);
                });
        };
        
        // Load statistics
        vm.loadStats = function() {
            // Load subscriptions count
            ApiService.getSubscriptions({ limit: 1 })
                .then(function(response) {
                    vm.stats.totalSubscriptions = response.data.total || 0;
                })
                .catch(function(error) {
                    console.error('Error loading subscriptions stats:', error);
                });
        };
        
        // Navigate to news
        vm.goToNews = function() {
            $location.path('/news');
        };
        
        // Navigate to subscriptions
        vm.goToSubscriptions = function() {
            $location.path('/subscriptions');
        };
        
        // Navigate to subscription form
        vm.goToSubscriptionForm = function() {
            $location.path('/subscriptions/new');
        };
        
        // Navigate to news by category
        vm.goToNewsByCategory = function(categoryId) {
            $location.path('/news').search('category', categoryId);
        };
        
        // Navigate to news detail
        vm.goToNewsDetail = function(newsId) {
            $location.path('/news/' + newsId);
        };
        
        // Format date
        vm.formatDate = function(dateString) {
            if (!dateString) return '';
            
            var date = new Date(dateString);
            var options = { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            
            return date.toLocaleDateString('es-ES', options);
        };
        
        // Truncate text
        vm.truncateText = function(text, maxLength) {
            if (!text) return '';
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength) + '...';
        };
        
        // Get category color class
        vm.getCategoryColorClass = function(categoryName) {
            if (!categoryName) return 'badge-secondary';
            
            var colors = {
                'tecnología': 'badge-primary',
                'deportes': 'badge-success',
                'política': 'badge-danger',
                'entretenimiento': 'badge-warning',
                'ciencia': 'badge-info',
                'salud': 'badge-light',
                'economía': 'badge-dark'
            };
            
            var key = categoryName.toLowerCase();
            return colors[key] || 'badge-secondary';
        };
        
        // Retry loading
        vm.retry = function() {
            vm.loading = true;
            vm.error = null;
            vm.init();
        };
        
        // Quick subscription
        vm.quickSubscribe = function() {
            if (!vm.subscriptionEmail) {
                vm.subscriptionMessage = 'Por favor ingresa tu correo electrónico';
                return;
            }
            
            if (!vm.isValidEmail(vm.subscriptionEmail)) {
                vm.subscriptionMessage = 'Por favor ingresa un correo electrónico válido';
                return;
            }
            
            vm.subscriptionLoading = true;
            vm.subscriptionMessage = '';
            
            var subscriptionData = {
                name: 'Usuario Suscriptor', // Nombre por defecto para suscripción rápida
                email: vm.subscriptionEmail,
                categories: [] // Suscripción a todas las categorías por defecto
            };
            
            ApiService.createSubscription(subscriptionData)
                .then(function(response) {
                    vm.subscriptionMessage = '¡Suscripción exitosa! Revisa tu correo para confirmar.';
                    vm.subscriptionEmail = '';
                    // Actualizar estadísticas
                    vm.loadStats();
                })
                .catch(function(error) {
                    console.error('Error creating subscription:', error);
                    if (error.data && error.data.message) {
                        vm.subscriptionMessage = error.data.message;
                    } else {
                        vm.subscriptionMessage = 'Error al procesar la suscripción. Inténtalo de nuevo.';
                    }
                })
                .finally(function() {
                    vm.subscriptionLoading = false;
                });
        };
        
        // Validate email
        vm.isValidEmail = function(email) {
            var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        };
        
        // Open subscription modal
        vm.openSubscriptionModal = function() {
            // Reset modal form
            vm.modalSubscriptionEmail = '';
            vm.modalSubscriptionName = '';
            vm.modalSubscriptionMessage = '';
            vm.modalSubscriptionLoading = false;
            
            // Open modal using Bootstrap 5 native API
            var modalElement = document.getElementById('subscriptionModal');
            if (modalElement) {
                var modal = new bootstrap.Modal(modalElement);
                modal.show();
            }
        };
        
        // Close subscription modal
        vm.closeSubscriptionModal = function() {
            var modalElement = document.getElementById('subscriptionModal');
            if (modalElement) {
                var modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                }
            }
            // Reset form
            vm.modalSubscriptionEmail = '';
            vm.modalSubscriptionName = '';
            vm.modalSubscriptionMessage = '';
            vm.modalSubscriptionLoading = false;
        };
        
        // Subscribe from modal
        vm.subscribeFromModal = function() {
            console.log('=== SUBSCRIPTION FUNCTION CALLED ===');
            console.log('Email input:', vm.modalSubscriptionEmail);
            console.log('Name input:', vm.modalSubscriptionName);
            
            if (!vm.modalSubscriptionEmail) {
                console.log('No email provided');
                vm.modalSubscriptionMessage = 'Por favor ingresa tu correo electrónico.';
                return;
            }
            
            // Validar formato de email
            var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(vm.modalSubscriptionEmail)) {
                console.log('Invalid email format');
                vm.modalSubscriptionMessage = 'Por favor ingresa un correo electrónico válido.';
                return;
            }
            
            console.log('Starting subscription process...');
            vm.modalSubscriptionLoading = true;
            vm.modalSubscriptionMessage = '';
            
            var subscriptionData = {
                name: vm.modalSubscriptionName || 'Usuario Suscriptor',
                email: vm.modalSubscriptionEmail,
                categories: [] // Suscripción a todas las categorías por defecto
            };
            
            console.log('Subscription data:', subscriptionData);
            console.log('About to call ApiService.createSubscription...');
            
            ApiService.createSubscription(subscriptionData)
                .then(function(response) {
                    console.log('=== SUBSCRIPTION SUCCESS ===');
                    console.log('Response:', response);
                    console.log('Setting success message...');
                    vm.modalSubscriptionMessage = '¡Suscripción exitosa! Revisa tu correo para confirmar.';
                    console.log('Message set to:', vm.modalSubscriptionMessage);
                    
                    // Actualizar estadísticas
                    vm.loadStats();
                    
                    // Cerrar modal después de 3 segundos para dar tiempo a leer el mensaje
                    setTimeout(function() {
                        console.log('Closing modal after 3 seconds...');
                        var modalElement = document.getElementById('subscriptionModal');
                        if (modalElement) {
                            var modal = bootstrap.Modal.getInstance(modalElement);
                            if (modal) {
                                modal.hide();
                            }
                        }
                        // Resetear formulario
                        vm.modalSubscriptionEmail = '';
                        vm.modalSubscriptionName = '';
                        vm.modalSubscriptionMessage = '';
                        $scope.$apply();
                    }, 3000);
                })
                .catch(function(error) {
                    console.log('=== SUBSCRIPTION ERROR ===');
                    console.error('Error creating subscription:', error);
                    if (error.data && error.data.message) {
                        vm.modalSubscriptionMessage = error.data.message;
                    } else {
                        vm.modalSubscriptionMessage = 'Error al procesar la suscripción. Inténtalo de nuevo.';
                    }
                })
                .finally(function() {
                    console.log('=== SUBSCRIPTION FINALLY ===');
                    vm.modalSubscriptionLoading = false;
                });
        };
        
        // Initialize on load
        vm.init();
    }]);