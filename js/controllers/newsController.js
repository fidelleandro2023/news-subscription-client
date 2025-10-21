// News Controller for News Subscription App
(function() {
    'use strict';

    angular.module('newsSubscriptionApp')
        .controller('NewsController', NewsController)
        .controller('NewsDetailController', NewsDetailController);

    // ==================== NEWS LIST CONTROLLER ====================
    
    NewsController.$inject = ['$scope', '$location', '$routeParams', 'ApiService', 'NewsCategoryResource'];
    function NewsController($scope, $location, $routeParams, ApiService, NewsCategoryResource) {
        var vm = this;
        
        // ViewModel properties
        vm.news = [];
        vm.categories = [];
        vm.currentPage = 1;
        vm.totalPages = 1;
        vm.totalItems = 0;
        vm.itemsPerPage = 10;
        vm.loading = false;
        vm.error = null;
        vm.searchQuery = '';
        vm.selectedCategory = null;
        vm.sortBy = 'created_at';
        vm.sortOrder = 'desc';
        
        // ViewModel methods
        vm.loadNews = loadNews;
        vm.loadCategories = loadCategories;
        vm.searchNews = searchNews;
        vm.filterByCategory = filterByCategory;
        vm.clearFilters = clearFilters;
        vm.goToPage = goToPage;
        vm.goToNewsDetail = goToNewsDetail;
        vm.formatDate = formatDate;
        vm.truncateText = truncateText;
        vm.getCategoryName = getCategoryName;
        vm.getCategoryColor = getCategoryColor;
        
        // Initialize controller
        init();

        function init() {
            // Get query parameters from URL
            vm.currentPage = parseInt($routeParams.page) || 1;
            vm.searchQuery = $routeParams.search || '';
            vm.selectedCategory = $routeParams.category ? parseInt($routeParams.category) : null;
            
            loadCategories();
            loadNews();
        }

        /**
         * Load news with current filters and pagination
         */
        function loadNews() {
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
            
            if (vm.selectedCategory) {
                params.category_id = vm.selectedCategory;
            }
            
            ApiService.getNews(params)
                .then(function(response) {
                    vm.news = response.data || [];
                    vm.currentPage = response.current_page || 1;
                    vm.totalPages = response.last_page || 1;
                    vm.totalItems = response.total || 0;
                    vm.itemsPerPage = response.per_page || 10;
                })
                .catch(function(error) {
                    vm.error = error.message || 'Error al cargar las noticias';
                    console.error('Error loading news:', error);
                })
                .finally(function() {
                    vm.loading = false;
                });
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
         * Search news by query
         */
        function searchNews() {
            vm.currentPage = 1;
            updateUrl();
            loadNews();
        }

        /**
         * Filter news by category
         * @param {number} categoryId - Category ID
         */
        function filterByCategory(categoryId) {
            vm.selectedCategory = categoryId;
            vm.currentPage = 1;
            updateUrl();
            loadNews();
        }

        /**
         * Clear all filters
         */
        function clearFilters() {
            vm.searchQuery = '';
            vm.selectedCategory = null;
            vm.currentPage = 1;
            updateUrl();
            loadNews();
        }

        /**
         * Go to specific page
         * @param {number} page - Page number
         */
        function goToPage(page) {
            if (page >= 1 && page <= vm.totalPages) {
                vm.currentPage = page;
                updateUrl();
                loadNews();
            }
        }

        /**
         * Navigate to news detail page
         * @param {number} newsId - News ID
         */
        function goToNewsDetail(newsId) {
            $location.path('/news/' + newsId);
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
            
            if (vm.selectedCategory) {
                params.category = vm.selectedCategory;
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
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            
            return date.toLocaleDateString('es-ES', options);
        }

        /**
         * Truncate text to specified length
         * @param {string} text - Text to truncate
         * @param {number} length - Maximum length
         * @returns {string} Truncated text
         */
        function truncateText(text, length) {
            if (!text) return '';
            
            length = length || 150;
            
            if (text.length <= length) {
                return text;
            }
            
            return text.substring(0, length) + '...';
        }

        /**
         * Get category name by ID
         * @param {number} categoryId - Category ID
         * @returns {string} Category name
         */
        function getCategoryName(categoryId) {
            var category = vm.categories.find(function(cat) {
                return cat.id === categoryId;
            });
            
            return category ? category.name : 'Sin categoría';
        }

        /**
         * Get category color class
         * @param {number} categoryId - Category ID
         * @returns {string} CSS class for category color
         */
        function getCategoryColor(categoryId) {
            var colors = ['primary', 'success', 'info', 'warning', 'danger'];
            return colors[categoryId % colors.length];
        }
    }

    // ==================== NEWS DETAIL CONTROLLER ====================
    
    NewsDetailController.$inject = ['$scope', '$routeParams', '$location', 'ApiService'];
    function NewsDetailController($scope, $routeParams, $location, ApiService) {
        var vm = this;
        
        // ViewModel properties
        vm.news = null;
        vm.loading = false;
        vm.error = null;
        vm.newsId = parseInt($routeParams.id);
        
        // ViewModel methods
        vm.loadNewsDetail = loadNewsDetail;
        vm.goBack = goBack;
        vm.formatDate = formatDate;
        vm.shareNews = shareNews;
        
        // Initialize controller
        init();

        function init() {
            if (vm.newsId) {
                loadNewsDetail();
            } else {
                vm.error = 'ID de noticia no válido';
            }
        }

        /**
         * Load news detail by ID
         */
        function loadNewsDetail() {
            vm.loading = true;
            vm.error = null;
            
            ApiService.getNewsById(vm.newsId)
                .then(function(response) {
                    vm.news = response.data || response;
                })
                .catch(function(error) {
                    vm.error = error.message || 'Error al cargar la noticia';
                    console.error('Error loading news detail:', error);
                })
                .finally(function() {
                    vm.loading = false;
                });
        }

        /**
         * Go back to news list
         */
        function goBack() {
            $location.path('/news');
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
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            
            return date.toLocaleDateString('es-ES', options);
        }

        /**
         * Share news (placeholder for social sharing)
         * @param {string} platform - Social platform
         */
        function shareNews(platform) {
            if (!vm.news) return;
            
            var url = encodeURIComponent(window.location.href);
            var title = encodeURIComponent(vm.news.title);
            var shareUrl = '';
            
            switch (platform) {
                case 'facebook':
                    shareUrl = 'https://www.facebook.com/sharer/sharer.php?u=' + url;
                    break;
                case 'twitter':
                    shareUrl = 'https://twitter.com/intent/tweet?url=' + url + '&text=' + title;
                    break;
                case 'linkedin':
                    shareUrl = 'https://www.linkedin.com/sharing/share-offsite/?url=' + url;
                    break;
                case 'whatsapp':
                    shareUrl = 'https://wa.me/?text=' + title + ' ' + url;
                    break;
                default:
                    // Copy to clipboard
                    if (navigator.clipboard) {
                        navigator.clipboard.writeText(window.location.href);
                        alert('Enlace copiado al portapapeles');
                    }
                    return;
            }
            
            if (shareUrl) {
                window.open(shareUrl, '_blank', 'width=600,height=400');
            }
        }
    }

})();