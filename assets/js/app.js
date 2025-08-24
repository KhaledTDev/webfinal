// Islamic Content Directory - Vanilla JavaScript Version
// Migrated from React to Vanilla JS - No dependencies required

// ==================== GLOBAL STATE MANAGEMENT ====================
const AppState = {
  // Data state
  currentData: [],
  allData: [],
  favorites: JSON.parse(localStorage.getItem('islamicFavorites') || '[]'),
  favoritesData: JSON.parse(localStorage.getItem('islamicFavoritesData') || '{}'),
  searchQuery: '',
  currentCategory: 'showall',
  currentFilter: 'showall', // Agregado
  
  // Pagination state
  totalPages: 0,
  totalItems: 0,
  currentPage: 1,
  searchResults: [],
  searchTotalPages: 0,
  searchTotalItems: 0,
  searchCurrentPage: 1,
  
  // UI state
  isLoading: false,
  activeNav: 'home',
  searchFilters: {
    type: 'showall',
    sortBy: 'date',
    sortOrder: 'desc'
  },
  mobileMenuOpen: false,
  
  // Audio Player State
  audioQueue: [],
  currentAudioIndex: -1,
  isPlaying: false,
  isShuffled: false,
  isRepeating: false,
  audioPlayerVisible: false,
  queueVisible: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  
  // Video Player State
  videoPlayerVisible: false,
  currentVideo: { url: '', title: '' }
};

// ==================== API CONFIGURATION ====================
const ISLAMIC_HOUSE_API_BASE = './api.php';
const CORS_PROXY = ''; // Can be added if CORS becomes an issue
const itemsPerPage = 25;

// ==================== UTILITY FUNCTIONS ====================

// Build API URL
function buildApiUrl(contentType, page = 1, limit = 25, lang = 'ar', locale = 'ar') {
  // Mapear tipos de contenido para el nuevo sistema PHP
  const TYPE_MAPPINGS = {
    'books': 'books',
    'articles': 'articles',
    'fatwa': 'fatwa',
    'audios': 'audios',
    'videos': 'videos',
    'hadith': 'hadith',
    'videos_ulamah': 'videos_ulamah'
  };
  
  const action = contentType === 'showall' ? 'search' : 'items';
  const category = TYPE_MAPPINGS[contentType] || contentType;
  
  if (action === 'search') {
    return `${ISLAMIC_HOUSE_API_BASE}?action=search&page=${page}`;
  } else {
    return `${ISLAMIC_HOUSE_API_BASE}?action=items&category=${category}&page=${page}`;
  }
}

// Enhanced fetch with retry logic
async function safeFetch(url, options = {}, retries = 3) {
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    cache: 'no-cache',
    ...options
  };

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, defaultOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed:`, error.message);
      
      if (i === retries - 1) throw error;
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}

// Local storage utilities
function saveToLocalStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Could not save to localStorage:', error);
  }
}

function loadFromLocalStorage(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn('Could not load from localStorage:', error);
    return defaultValue;
  }
}

// Get Arabic type name
function getArabicType(type) {
  const ARABIC_TYPE_NAMES = {
    'books': 'كتاب',
    'articles': 'مقال',
    'fatwa': 'فتوى',
    'audios': 'صوتي',
    'videos': 'مرئي',
    'hadith': 'حديث',
    'videos_ulamah': 'فيديو علماء',
    'quran_recitations': 'تلاوة قرآن',
    'ibn-taymiyyah': 'ابن تيمية'
  };
  return ARABIC_TYPE_NAMES[type] || type;
}

// Note: getFileIcon function removed to prevent text duplication in attachment buttons

// Check if media file
function isMediaFile(extension) {
  const audioFormats = ['MP3', 'M4A', 'WAV', 'AAC'];
  const videoFormats = ['MP4', 'AVI', 'MOV', 'WMV'];
  const ext = extension.toUpperCase();
  return audioFormats.includes(ext) || videoFormats.includes(ext);
}

// Format date
function formatDate(dateString) {
    try {
        let date = new Date(dateString);
        
        if (isNaN(date.getTime())) {
            date = new Date();
        }
        
        const islamicDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
        }).format(date);
        
        return `تاريخ الإضافة: ${islamicDate.replace(/\s/g, '‏/')}`;
    } catch {
        const today = new Date();
        const islamicToday = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
        }).format(today);
        
        return `تاريخ الإضافة: ${islamicToday.replace(/\s/g, '‏/')}`;
    }
}

// Show error message
function showError(message) {
  console.error('Error:', message);
  alert(message);
}

// Format time for audio player
function formatTime(time) {
  if (!time || isNaN(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Fetch data from API
async function fetchData(contentType, page = 1, limit = 25, options = {}) {
  try {
    let url;
    
    // Manejar diferentes tipos de solicitudes
    if (options.search !== undefined) {
      // Búsqueda con categoría específica o global
      if (contentType === 'showall') {
        url = `${ISLAMIC_HOUSE_API_BASE}?action=search&search=${encodeURIComponent(options.search)}&page=${page}`;
      } else {
        url = `${ISLAMIC_HOUSE_API_BASE}?action=search&search=${encodeURIComponent(options.search)}&category=${contentType}&page=${page}`;
      }
    } else if (contentType === 'showall') {
      // Obtener estadísticas para mostrar todas las categorías
      url = `${ISLAMIC_HOUSE_API_BASE}?action=stats`;
    } else if (contentType === 'search') {
      // Búsqueda directa (usado para showall con contenido)
      url = `${ISLAMIC_HOUSE_API_BASE}?action=search&search=${encodeURIComponent(options.search || '')}&page=${page}`;
    } else {
      // Obtener items de una categoría específica
      url = `${ISLAMIC_HOUSE_API_BASE}?action=items&category=${contentType}&page=${page}`;
    }
    
    console.log('Fetching from URL:', url);
    const data = await safeFetch(url);
    console.log('API Response:', data);
    
    if (contentType === 'showall' && options.search === undefined) {
      // Para estadísticas, devolver en formato especial
      return {
        data: [],
        links: { current_page: 1, pages_number: 1, total_items: data.data.total_items },
        stats: data.data.categories
      };
    } else {
      // Para categorías específicas, búsquedas, o contenido de showall
      return {
        data: data.data || [],
        pagination: {
          current_page: data.pagination?.current_page || page,
          total_pages: data.pagination?.total_pages || 1,
          total_items: data.pagination?.total_items || 0
        }
      };
    }
  } catch (error) {
    console.error('Error in fetchData:', error);
    throw error;
  }
}

// ==================== DATA LOADING FUNCTIONS ====================

// Load home page data
async function loadHomePage() {
  try {
    setLoading(true);
    
    // Cargar estadísticas y categorías disponibles
    const [statsData, categoriesData] = await Promise.all([
      fetchData('showall', 1, 25), // Esto ahora devuelve estadísticas
      loadAvailableCategories()
    ]);
    
    if (statsData && statsData.stats) {
      // Actualizar estado con estadísticas
      AppState.totalItems = statsData.links?.total_items || 0;
      AppState.currentData = [];
      AppState.totalPages = 1;
      AppState.currentPage = 1;
      AppState.stats = statsData.stats;
      AppState.availableCategories = categoriesData;
      
      console.log(`Loaded stats: ${AppState.totalItems} total items`);
      console.log('Available categories:', AppState.availableCategories);
      
      updateStatsDisplay();
      renderContent(); // Cambiar de renderHomeContent a renderContent
      
      // Cargar contenido por defecto (showall)
      await filterByType('showall');
    } else {
      throw new Error('Failed to load statistics from database');
    }
  } catch (error) {
    console.error('Error loading home page:', error);
    showError('خطأ في تحميل البيانات من قاعدة البيانات');
  }
  setLoading(false);
}

// Cargar categorías disponibles desde la base de datos
async function loadAvailableCategories() {
  try {
    const response = await safeFetch(`${ISLAMIC_HOUSE_API_BASE}?action=categories`);
    
    if (response && response.success) {
      return response.data;
    } else {
      throw new Error('Failed to load categories');
    }
  } catch (error) {
    console.error('Error loading categories:', error);
    // Devolver categorías por defecto si falla
    return [
      { name: 'books', display_name: 'الكتب', count: 0 },
      { name: 'articles', display_name: 'المقالات', count: 0 },
      { name: 'fatwa', display_name: 'الفتاوى', count: 0 },
      { name: 'audios', display_name: 'الصوتيات', count: 0 },
      { name: 'videos', display_name: 'المرئيات', count: 0 },
      { name: 'videos_ulamah', display_name: 'فيديوهات دعويه', count: 0 }
    ];
  }
}

// Renderizar contenido de inicio con estadísticas
function renderHomeContent() {
  const contentContainer = document.getElementById('content-grid');
  if (!contentContainer) return;
  
  const stats = AppState.stats || {};
  const categories = AppState.availableCategories || [];
  
  // Crear HTML para mostrar estadísticas por categoría
  const categoryCards = categories.map(category => {
    const count = stats[category.name] || 0;
    const arabicNames = {
      'books': 'الكتب',
      'articles': 'المقالات',
      'fatwa': 'الفتاوى',
      'audios': 'الصوتيات',
      'videos': 'المرئيات',
      'hadith': 'الأحاديث',
      'videos_ulamah': 'فيديوهات دعويه'
    };
    
    return `
      <div class="category-card" onclick="loadCategoryContent('${category.name}')">
        <div class="category-icon">
          <i class="fas fa-${getCategoryIcon(category.name)}"></i>
        </div>
        <div class="category-info">
          <h3>${arabicNames[category.name] || category.display_name}</h3>
          <p class="category-count">${count.toLocaleString()} عنصر</p>
        </div>
        <div class="category-arrow">
          <i class="fas fa-chevron-left"></i>
        </div>
      </div>
    `;
  }).join('');
  
  contentContainer.innerHTML = `
    <div class="home-content">
      <div class="welcome-section">
        <h2>مرحباً بك في مكتبة الإسلام</h2>
        <p>اكتشف مجموعة واسعة من المحتوى الإسلامي من الكتب والمقالات والفتاوى والصوتيات والمرئيات</p>
        <div class="total-stats">
          <div class="stat-item">
            <span class="stat-number">${AppState.totalItems.toLocaleString()}</span>
            <span class="stat-label">إجمالي العناصر</span>
          </div>
        </div>
      </div>
      
      <div class="categories-grid">
        ${categoryCards}
      </div>
    </div>
  `;
}

// Obtener icono para cada categoría
function getCategoryIcon(category) {
  const icons = {
    'books': 'book-open',
    'articles': 'document-text',
    'fatwa': 'balance-scale',
    'audios': 'volume-up',
    'videos': 'play',
    'hadith': 'bookmark-circle',
    'videos_ulamah': 'video'
  };
  return icons[category] || 'file-alt';
}

// Cargar contenido de una categoría específica
async function loadCategoryContent(category) {
  try {
    setLoading(true);
    AppState.currentCategory = category;
    AppState.currentPage = 1;
    
    // Caso especial para 'showall' - cargar contenido de todas las categorías
    if (category === 'showall') {
      const data = await fetchData('showall', 1, 25, { search: '' });
      
      if (data && data.data) {
        AppState.currentData = data.data;
        AppState.totalPages = data.pagination?.total_pages || 1;
        AppState.totalItems = data.pagination?.total_items || 0;
        
        console.log(`Loaded ${data.data.length} items from all categories`);
        updateStatsDisplay();
        renderContent();
        
        // Actualizar navegación
        updateActiveNavigation(category);
      } else {
        throw new Error('Failed to load all categories data');
      }
    } else {
      // Categoría específica
      const data = await fetchData(category, 1, 25);
      
      if (data && data.data) {
        AppState.currentData = data.data;
        AppState.totalPages = data.pagination?.total_pages || 1;
        AppState.totalItems = data.pagination?.total_items || 0;
        
        console.log(`Loaded ${data.data.length} items from category: ${category}`);
        updateStatsDisplay();
        renderContent();
        
        // Actualizar navegación
        updateActiveNavigation(category);
      } else {
        throw new Error(`Failed to load ${category} data`);
      }
    }
  } catch (error) {
    console.error(`Error loading ${category}:`, error);
    showError(`خطأ في تحميل ${category}`);
  }
  setLoading(false);
}

// Cache content for search
async function cacheContentForSearch() {
  try {
    console.log('Caching content for search...');
    const types = ['books', 'articles', 'fatwa', 'audios', 'videos', 'hadith', 'videos_ulamah', 'quran_recitations'];
    let cachedData = [];
    
    // Check if we have recent cached data
    const existingCache = loadFromLocalStorage('search_cache');
    const cacheAge = existingCache ? Date.now() - existingCache.timestamp : Infinity;
    const cacheValid = cacheAge < 30 * 60 * 1000; // 30 minutes
    
    if (cacheValid && existingCache.data.length > 0) {
      console.log('Using existing search cache');
      AppState.allData = existingCache.data;
      return;
    }
    
    // Obtener datos de cada categoría individualmente
    for (const type of types) {
      try {
        console.log(`Caching ${type}...`);
        const data = await fetchData(type, 1, 50); // Obtener más elementos por categoría
        if (data && data.data && Array.isArray(data.data)) {
          cachedData = [...cachedData, ...data.data];
          console.log(`Cached ${data.data.length} items from ${type}`);
        }
      } catch (error) {
        console.warn(`Failed to cache ${type}:`, error);
        // Continue with other types
      }
    }
    
    // Remove duplicates based on ID
    const uniqueData = cachedData.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    );
    
    AppState.allData = uniqueData;
    
    // Save to local cache
    saveToLocalStorage('search_cache', {
      data: uniqueData,
      timestamp: Date.now()
    });
    
    console.log(`Cached ${uniqueData.length} items for search`);
  } catch (error) {
    console.warn('Could not cache content for search:', error);
    
    // Try to use old cache as fallback
    const fallbackCache = loadFromLocalStorage('search_cache');
    if (fallbackCache && fallbackCache.data.length > 0) {
      console.log('Using fallback search cache');
      AppState.allData = fallbackCache.data;
    }
  }
}

// ==================== UI STATE MANAGEMENT ====================

// Set loading state
function setLoading(loading) {
  AppState.isLoading = loading;
  renderContent();
}

// Update stats display
function updateStatsDisplay() {
  const elements = document.querySelectorAll('.stats-number');
  if (elements.length >= 3) {
    // Calcular total combinado de base de datos + API
    let totalCombined = AppState.totalItems;
    
    // Si tenemos información de fuentes separadas, sumarlas
    if (window.lastSourcesInfo) {
      const dbTotal = window.lastSourcesInfo.databaseTotal || 0;
      const apiTotal = window.lastSourcesInfo.apiTotal || 0;
      totalCombined = dbTotal + apiTotal;
    }
    
    elements[0].textContent = totalCombined.toLocaleString('ar');
    elements[1].textContent = AppState.totalPages.toLocaleString('ar');
    elements[2].textContent = AppState.favorites.length.toLocaleString('ar');
  }
}

// Toggle mobile menu
function toggleMobileMenu() {
  AppState.mobileMenuOpen = !AppState.mobileMenuOpen;
  const overlay = document.querySelector('.mobile-menu-overlay');
  const menu = document.querySelector('.mobile-menu');
  const hamburgerLines = document.querySelectorAll('.hamburger-line');
  
  if (AppState.mobileMenuOpen) {
    overlay.style.display = 'block';
    menu.style.display = 'block';
    hamburgerLines.forEach(line => line.classList.add('open'));
    document.body.style.overflow = 'hidden';
  } else {
    overlay.style.display = 'none';
    menu.style.display = 'none';
    hamburgerLines.forEach(line => line.classList.remove('open'));
    document.body.style.overflow = '';
  }
}

// Close mobile menu
function closeMobileMenu() {
  if (AppState.mobileMenuOpen) {
    toggleMobileMenu();
  }
}

// Navigate to page
function navigateToPage(page) {
  // IMPORTANTE: Verificar si estamos en sabio.html y hay una función específica
  if (window.location.pathname.includes('sabio.html') && window.SabioPageState) {
    console.log('🚫 App.js navigateToPage blocked - delegating to sabio.js');
    return; // No hacer nada, dejar que sabio.js maneje la navegación
  }
  
  AppState.activeNav = page;
  closeMobileMenu();
  
  // Save simple navigation state to localStorage for persistence on reload
  localStorage.setItem('currentNavigationState', JSON.stringify({
    activeNav: page,
    currentPage: AppState.currentPage,
    currentCategory: AppState.currentCategory,
    timestamp: Date.now(),
    pageType: 'index' // Indicate this is from index.html
  }));
  
  console.log(`🔄 Navigation state saved: ${page}`);
  
  // Update navigation active states
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.page === AppState.activeNav) {
      link.classList.add('active');
    }
  });
  
  renderContent();
}

// Update active navigation for category
function updateActiveNavigation(category) {
  // Para 'showall' y filtros de categoría, mantener en 'home'
  if (category === 'showall' || ['books', 'articles', 'fatwa', 'audios', 'videos', 'hadith', 'videos_ulamah', 'quran_recitations'].includes(category)) {
    AppState.activeNav = 'home';
  } else {
    AppState.activeNav = category;
  }
  
  // Update navigation active states
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.page === AppState.activeNav) {
      link.classList.add('active');
    }
  });
}

// ==================== FAVORITES MANAGEMENT ====================

// Global notification system for favorites
function showNotification(message, type = 'info') {
  // Remove any existing notifications
  const existingNotifications = document.querySelectorAll('.app-notification');
  existingNotifications.forEach(notification => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  });
  
  const notification = document.createElement('div');
  notification.className = `app-notification ${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : '#3b82f6'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-width: 300px;
    word-wrap: break-word;
    direction: rtl;
    text-align: right;
  `;
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 10);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Global function to sync favorites counter across all pages
function syncFavoritesCounter() {
  // Get current favorites count from localStorage (using 'favorites' key)
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  const favoritesCount = favorites.length;
  
  console.log(`🔄 Syncing favorites counter: ${favoritesCount} favorites found`);
  
  // Update specific favorites counter elements by ID
  const favoritesCountElement = document.getElementById('favoritesCount');
  if (favoritesCountElement) {
    favoritesCountElement.textContent = favoritesCount;
    console.log('✅ Updated favoritesCount element');
  }
  
  // Also update any stats-number elements that show favorites count (fallback)
  const statsElements = document.querySelectorAll('.stats-number');
  if (statsElements.length >= 3) {
    // The third stats-number element is typically the favorites counter
    statsElements[2].textContent = favoritesCount;
    console.log('✅ Updated third stats-number element (fallback)');
  }
  
  // Also update AppState if it exists
  if (window.AppState) {
    window.AppState.favorites = favorites;
  }
  
  // Trigger custom event for other pages to listen to
  window.dispatchEvent(new CustomEvent('favoritesUpdated', { 
    detail: { count: favoritesCount, favorites: favorites } 
  }));
  
  document.dispatchEvent(new CustomEvent('favoritesUpdated', { 
    detail: { count: favoritesCount, favorites: favorites } 
  }));
}

// Toggle favorite by ID (looks up item data from current data or favorites)
function toggleFavoriteById(id) {
  const idStr = id.toString();
  let item = null;
  
  // First try to find the item in current data
  if (AppState.currentData && AppState.currentData.length > 0) {
    item = AppState.currentData.find(dataItem => dataItem.id.toString() === idStr);
  }
  
  // If not found in current data, try search results
  if (!item && AppState.searchResults && AppState.searchResults.length > 0) {
    item = AppState.searchResults.find(dataItem => dataItem.id.toString() === idStr);
  }
  
  // If still not found, try favorites data
  if (!item && AppState.favoritesData && AppState.favoritesData[idStr]) {
    item = AppState.favoritesData[idStr];
  }
  
  if (!item) {
    console.error('Item not found for ID:', id);
    return;
  }
  
  // Call the original toggleFavorite function
  toggleFavorite(id, item);
}

// Toggle favorite
function toggleFavorite(id, item) {
  const idStr = id.toString();
  const index = AppState.favorites.indexOf(idStr);
  
  let newFavorites, newFavoritesData;
  let isFavorited;
  
  if (index === -1) {
    // Agregar a favoritos
    newFavorites = [...AppState.favorites, idStr];
    newFavoritesData = { ...AppState.favoritesData, [idStr]: item };
    isFavorited = true;
  } else {
    // Quitar de favoritos
    newFavorites = AppState.favorites.filter((_, i) => i !== index);
    const { [idStr]: removed, ...rest } = AppState.favoritesData;
    newFavoritesData = rest;
    isFavorited = false;
  }
  
  AppState.favorites = newFavorites;
  AppState.favoritesData = newFavoritesData;
  
  localStorage.setItem('islamicFavorites', JSON.stringify(newFavorites));
  localStorage.setItem('islamicFavoritesData', JSON.stringify(newFavoritesData));
  
  // Show notification
  const itemName = item.title || item.name || 'العنصر';
  const message = isFavorited ? `تم إضافة "${itemName}" للمفضلة` : `تم حذف "${itemName}" من المفضلة`;
  showNotification(message, isFavorited ? 'success' : 'info');
  
  // Re-render if we're on favorites page
  if (AppState.activeNav === 'favorites') {
    renderContent();
  }
  
  // Update stats
  updateStatsDisplay();
  
  // Sync favorites counter globally
  syncFavoritesCounter();
  
  // Actualizar visualmente el botón que se acaba de hacer clic
  const button = event.target.closest('.favorite-btn');
  if (button) {
    const svg = button.querySelector('svg');
    
    if (isFavorited) {
      button.classList.add('favorited');
      if (svg) {
        svg.setAttribute('fill', 'currentColor');
      }
      button.title = 'إزالة من المفضلة';
    } else {
      button.classList.remove('favorited');
      if (svg) {
        svg.setAttribute('fill', 'none');
      }
      button.title = 'إضافة للمفضلة';
    }
  }
}

// ==================== MEDIA PLAYER FUNCTIONS ====================

// Handle media click
function handleMediaClick(url, title, type) {
  if (type.toLowerCase().includes('mp3') || type.toLowerCase().includes('audio')) {
    addToAudioQueue({ url, title, type });
  } else if (type.toLowerCase().includes('mp4') || type.toLowerCase().includes('video')) {
    AppState.currentVideo = { url, title };
    AppState.videoPlayerVisible = true;
    showVideoPlayer();
  } else if (type.toLowerCase().includes('pdf') || type.toLowerCase().includes('document')) {
    // Handle PDF and document files
    let finalUrl = url;
    
    // Convert Google Drive view links to direct links
    if (url.includes('drive.google.com/file/d/') && url.includes('/view')) {
      const fileId = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileId && fileId[1]) {
        finalUrl = `https://drive.google.com/file/d/${fileId[1]}/preview`;
      }
    }
    
    // Open PDF in new tab
    window.open(finalUrl, '_blank');
  } else {
    // For any other file types, try to open in new tab
    window.open(url, '_blank');
  }
}

// Audio player functions
function addToAudioQueue(audioItem) {
  const existingIndex = AppState.audioQueue.findIndex(item => item.url === audioItem.url);
  let newQueue = AppState.audioQueue;
  let shouldPlayNew = false;
  
  if (existingIndex === -1) {
    // Agregar nuevo audio a la cola
    newQueue = [...AppState.audioQueue, audioItem];
    AppState.audioQueue = newQueue;
    shouldPlayNew = true;
  } else {
    // Si ya existe, reproducirlo
    shouldPlayNew = true;
  }
  
  // Pausar el audio actual si está reproduciéndose
  const audioElement = document.getElementById('audioElement');
  if (audioElement && AppState.isPlaying) {
    audioElement.pause();
  }
  
  // Establecer el índice del nuevo audio a reproducir
  const newIndex = existingIndex === -1 ? newQueue.length - 1 : existingIndex;
  AppState.currentAudioIndex = newIndex;
  
  // Reproducir el nuevo audio
  if (shouldPlayNew) {
    loadCurrentTrack();
  }
  
  AppState.audioPlayerVisible = true;
  showAudioPlayer();
  updateQueueDisplay();
}

function togglePlayPause() {
  const audioElement = document.getElementById('audioElement');
  if (audioElement && AppState.currentAudioIndex !== -1) {
    if (AppState.isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play().catch(e => console.error('Error playing audio:', e));
    }
  }
}

function playPrevious() {
  if (AppState.audioQueue.length === 0) return;
  
  let prevIndex;
  if (AppState.isShuffled) {
    prevIndex = Math.floor(Math.random() * AppState.audioQueue.length);
  } else {
    prevIndex = AppState.currentAudioIndex > 0 ? AppState.currentAudioIndex - 1 : AppState.audioQueue.length - 1;
  }
  
  AppState.currentAudioIndex = prevIndex;
  AppState.currentTime = 0;
  loadCurrentTrack();
}

function playNext() {
  if (AppState.audioQueue.length === 0) return;
  
  let nextIndex;
  if (AppState.isShuffled) {
    nextIndex = Math.floor(Math.random() * AppState.audioQueue.length);
  } else {
    nextIndex = AppState.currentAudioIndex < AppState.audioQueue.length - 1 ? AppState.currentAudioIndex + 1 : 0;
  }
  
  AppState.currentAudioIndex = nextIndex;
  AppState.currentTime = 0;
  loadCurrentTrack();
}

function loadCurrentTrack() {
  const audioElement = document.getElementById('audioElement');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const currentTrack = AppState.audioQueue[AppState.currentAudioIndex];
  
  if (audioElement && currentTrack) {
    // Mostrar animación de carga en el botón de play
    if (playPauseBtn) {
      playPauseBtn.innerHTML = `
        <div class="audio-loader-dots">
          <div></div>
          <div></div>
          <div></div>
        </div>
      `;
      playPauseBtn.title = 'جاري التحميل...';
    }
    
    audioElement.src = currentTrack.url;
    document.getElementById('audioTitle').textContent = currentTrack.title;
    
    // Cargar y reproducir automáticamente
    audioElement.load();
    
    // Reproducir cuando esté listo
    const playWhenReady = () => {
      audioElement.play()
        .then(() => {
          console.log('Audio reproducido automáticamente');
        })
        .catch(error => {
          console.error('Error al reproducir audio automáticamente:', error);
          // Si falla la reproducción automática, restaurar el botón de play
          if (playPauseBtn) {
            playPauseBtn.innerHTML = `
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/>
              </svg>
            `;
            playPauseBtn.title = 'تشغيل';
          }
        });
    };
    
    // Escuchar cuando los metadatos estén cargados para reproducir
    audioElement.addEventListener('loadedmetadata', playWhenReady, { once: true });
    
    // Fallback: si ya tiene metadatos cargados, reproducir inmediatamente
    if (audioElement.readyState >= 1) {
      playWhenReady();
    }
    
    updateQueueDisplay();
  }
}

function toggleShuffle() {
  AppState.isShuffled = !AppState.isShuffled;
  const shuffleBtn = document.getElementById('shuffleBtn');
  shuffleBtn.classList.toggle('active', AppState.isShuffled);
}

function toggleRepeat() {
  AppState.isRepeating = !AppState.isRepeating;
  const repeatBtn = document.getElementById('repeatBtn');
  repeatBtn.classList.toggle('active', AppState.isRepeating);
}

function toggleQueue() {
  AppState.queueVisible = !AppState.queueVisible;
  const queueModal = document.getElementById('audioQueueModal');
  const queueBtn = document.getElementById('queueBtn');
  
  queueModal.style.display = AppState.queueVisible ? 'block' : 'none';
  queueBtn.classList.toggle('active', AppState.queueVisible);
  
  if (AppState.queueVisible) {
    updateQueueDisplay();
  }
}

function clearQueue() {
  AppState.audioQueue = [];
  AppState.currentAudioIndex = -1;
  AppState.audioPlayerVisible = false;
  AppState.queueVisible = false;
  closeAudioPlayer();
}

function closeAudioPlayer() {
  AppState.audioPlayerVisible = false;
  AppState.queueVisible = false;
  const audioElement = document.getElementById('audioElement');
  if (audioElement) {
    audioElement.pause();
  }
  document.getElementById('audioPlayerContainer').style.display = 'none';
  document.getElementById('audioQueueModal').style.display = 'none';
  document.body.classList.remove('audio-player-active');
}

function showAudioPlayer() {
  document.getElementById('audioPlayerContainer').style.display = 'block';
  document.body.classList.add('audio-player-active');
  loadCurrentTrack();
}

function updateQueueDisplay() {
  const queueList = document.getElementById('queueList');
  const queueCounter = document.getElementById('queueCounter');
  const queueItemCount = document.getElementById('queueItemCount');
  
  queueCounter.textContent = AppState.audioQueue.length;
  queueItemCount.textContent = AppState.audioQueue.length;
  
  queueList.innerHTML = '';
  
  AppState.audioQueue.forEach((item, index) => {
    const queueItem = document.createElement('div');
    queueItem.className = `queue-item ${index === AppState.currentAudioIndex ? 'active' : ''}`;
    queueItem.onclick = () => playFromQueue(index);
    
    queueItem.innerHTML = `
      <div class="queue-item-icon">
        ${index === AppState.currentAudioIndex && AppState.isPlaying ? 
          '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M6 4a1 1 0 00-1 1v10a1 1 0 001 1h2a1 1 0 001-1V5a1 1 0 00-1-1H6zM12 4a1 1 0 00-1 1v10a1 1 0 001 1h2a1 1 0 001-1V5a1 1 0 00-1-1h-2z" clip-rule="evenodd"/></svg>' :
          '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/></svg>'
        }
      </div>
      <div class="queue-item-content">
        <div class="queue-item-title">${item.title}</div>
        <div class="queue-item-type">ملف صوتي</div>
      </div>
      <button onclick="event.stopPropagation(); removeFromQueue(${index})" class="queue-item-remove" title="إزالة من القائمة">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
      </button>
    `;
    
    queueList.appendChild(queueItem);
  });
}

function playFromQueue(index) {
  AppState.currentAudioIndex = index;
  AppState.currentTime = 0;
  AppState.queueVisible = false;
  document.getElementById('audioQueueModal').style.display = 'none';
  loadCurrentTrack();
  
  const audioElement = document.getElementById('audioElement');
  if (audioElement) {
    audioElement.play().catch(e => console.error('Error playing audio:', e));
  }
}

function removeFromQueue(index) {
  const newQueue = AppState.audioQueue.filter((_, i) => i !== index);
  AppState.audioQueue = newQueue;
  
  if (index === AppState.currentAudioIndex) {
    if (newQueue.length === 0) {
      AppState.currentAudioIndex = -1;
      AppState.audioPlayerVisible = false;
      closeAudioPlayer();
    } else {
      const newIndex = Math.min(AppState.currentAudioIndex, newQueue.length - 1);
      AppState.currentAudioIndex = newIndex;
      loadCurrentTrack();
    }
  } else if (index < AppState.currentAudioIndex) {
    AppState.currentAudioIndex = AppState.currentAudioIndex - 1;
  }
  
  updateQueueDisplay();
}

// Video player functions
function showVideoPlayer() {
  const modal = document.getElementById('videoPlayerModal');
  const videoElement = document.getElementById('videoElement');
  const videoIframe = document.getElementById('videoIframe');
  const titleElement = document.getElementById('videoTitle');
  
  const url = AppState.currentVideo.url;
  
  // Check if it's a YouTube URL (embed or watch)
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    // Use iframe for YouTube videos
    videoElement.style.display = 'none';
    videoIframe.style.display = 'block';
    videoIframe.src = url;
    console.log('🎥 Playing YouTube video in iframe:', url);
  } else {
    // Use video element for direct video files
    videoIframe.style.display = 'none';
    videoElement.style.display = 'block';
    videoElement.src = url;
    console.log('🎥 Playing direct video file:', url);
  }
  
  modal.style.display = 'flex';
  titleElement.textContent = AppState.currentVideo.title;
  document.body.style.overflow = 'hidden';
}

function closeVideoPlayer() {
  AppState.videoPlayerVisible = false;
  const modal = document.getElementById('videoPlayerModal');
  const videoElement = document.getElementById('videoElement');
  const videoIframe = document.getElementById('videoIframe');
  
  modal.style.display = 'none';
  
  // Clean up video element
  if (videoElement) {
    videoElement.pause();
    videoElement.src = '';
  }
  
  // Clean up iframe
  if (videoIframe) {
    videoIframe.src = '';
  }
  
  document.body.style.overflow = '';
}

// ==================== FILTERING AND SEARCH ====================

// Filter by type - Using API only
async function filterByType(type) {
  const filterStartTime = Date.now();
  AppState.currentCategory = type;
  AppState.currentFilter = type;
  
  console.log(`Filtering by type: ${type}`);
  
  try {
    setLoading(true);
    AppState.currentPage = 1;
    
    // Load data directly from API
    let data;
    if (type === 'showall') {
      // Para 'showall', cargar contenido de todas las categorías mezclado
      // Usar búsqueda global con término vacío para obtener contenido variado
      data = await fetchData('search', 1, AppState.itemsPerPage, { search: '' });
    } else {
      data = await fetchData(type, 1, AppState.itemsPerPage);
    }
    
    console.log('Filter Response:', data);
    
    if (data && data.data) {
      AppState.currentData = data.data;
      
      if (type === 'showall') {
        AppState.totalPages = data.pagination?.total_pages || 1;
        AppState.totalItems = data.pagination?.total_items || 0;
      } else {
        AppState.totalPages = data.pagination?.total_pages || 1;
        AppState.totalItems = data.pagination?.total_items || 0;
      }
      
      AppState.currentPage = 1;
      
      console.log(`Filter ${type} completed in`, Date.now() - filterStartTime, 'ms');
      updateStatsDisplay();
      renderContent();
      
      // Actualizar navegación activa
      updateActiveNavigation(type);
    } else {
      console.error('Filter failed:', data?.error || 'No data received');
      showError('فشل في تحميل البيانات من API');
    }
  } catch (error) {
    console.error('Error loading content:', error);
    
    // Try to load from cache first
    const cachedData = loadFromLocalStorage(`category_${type}_cache`);
    if (cachedData && cachedData.data.length > 0) {
      AppState.currentData = cachedData.data;
      AppState.totalPages = cachedData.totalPages;
      AppState.totalItems = cachedData.totalItems;
      renderContent();
      showError('تم تحميل البيانات من الذاكرة المحلية');
    } else if (type === 'showall') {
      // Use fallback data for main page
      console.log('🔄 Using fallback data for main page content...');
      const fallbackData = generateFallbackContent();
      AppState.currentData = fallbackData.data;
      AppState.totalPages = fallbackData.totalPages;
      AppState.totalItems = fallbackData.totalItems;
      AppState.currentPage = 1;
      renderContent();
      console.log('✅ Loaded fallback content with', fallbackData.data.length, 'items');
    } else {
      showError('خطأ في تحميل البيانات');
    }
  }
  
  setLoading(false);
}

// Enhanced search with debouncing and category filtering
let searchDebounceTimer = null;

// Debounced search input handler
function handleSearchInput() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;
  
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    const query = searchInput.value.trim();
    if (query.length >= 2) {
      performSearch(1, query);
    } else if (query.length === 0) {
      navigateToPage('home');
    }
  }, 300);
}

// Enhanced perform search with proper category filtering
async function performSearch(page = 1, customQuery = null) {
  const searchInput = document.getElementById('searchInput');
  const searchQuery = customQuery || (searchInput ? searchInput.value.trim() : '');
  
  if (!searchQuery) {
    navigateToPage('home');
    return;
  }
  
  AppState.searchQuery = searchQuery;
  setLoading(true);
  
  try {
    console.log(`🔍 Searching for "${searchQuery}" in category "${AppState.currentCategory}" on page ${page}...`);
    
    // Determine search category based on current context
    let searchCategory = AppState.currentCategory;
    
    // Handle special categories and ensure proper API category mapping
    const categoryMappings = {
      'showall': 'showall',
      'books': 'books',
      'articles': 'articles', 
      'fatwa': 'fatwa',
      'audios': 'audios',
      'videos': 'videos',
      'hadith': 'hadith',
      'videos_ulamah': 'videos_ulamah',
      'quran_recitations': 'quran_recitations'
    };
    
    // Debug current category
    console.log(`🔍 Current category for search: "${AppState.currentCategory}"`);
    console.log(`🔍 Available mappings:`, Object.keys(categoryMappings));
    
    // If current category is not in mappings, default to showall
    if (!categoryMappings[searchCategory]) {
      console.log(`⚠️ Unknown category "${searchCategory}", defaulting to showall`);
      searchCategory = 'showall';
    }
    
    console.log(`📂 Final search category: ${searchCategory}`);
    
    // Perform API search with proper category filtering
    const data = await fetchData(searchCategory, page, 25, { search: searchQuery });
    console.log('🔍 Search Response:', data);
    
    if (data && data.data) {
      // Update search states
      AppState.searchResults = data.data;
      AppState.searchTotalItems = data.pagination?.total_items || data.data.length;
      AppState.searchTotalPages = data.pagination?.total_pages || 1;
      AppState.searchCurrentPage = page;
      AppState.activeNav = 'search';
      
      console.log(`✅ Found ${data.data.length} results from API (${AppState.searchTotalItems} total)`);
      console.log('🔍 Search results set:', AppState.searchResults);
      console.log('🔍 AppState after search:', {
        searchResults: AppState.searchResults?.length,
        searchTotalItems: AppState.searchTotalItems,
        activeNav: AppState.activeNav
      });
      
      setLoading(false);
      navigateToPage('search');
    } else {
      throw new Error('Search failed - no data received');
    }
  } catch (error) {
    console.error('❌ Search error:', error);
    
    // Enhanced fallback to local search with category filtering
    console.log('🔄 Falling back to enhanced local search...');
    await performLocalSearch(searchQuery, page);
  }
}

// Arabic text normalization function
function normalizeArabicText(text) {
  if (!text) return '';
  
  return text
    // Remove diacritics (tashkeel)
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    // Normalize different forms of alef
    .replace(/[\u0622\u0623\u0625]/g, '\u0627')
    // Normalize teh marbuta and heh
    .replace(/\u0629/g, '\u0647')
    // Normalize different forms of yeh
    .replace(/[\u064A\u0649]/g, '\u064A')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Enhanced local search with category filtering and Arabic normalization
async function performLocalSearch(searchQuery, page = 1) {
  const lowerQuery = searchQuery.toLowerCase();
  const normalizedQuery = normalizeArabicText(searchQuery);
  let searchData = AppState.allData.length > 0 ? AppState.allData : AppState.currentData;
  
  // If no cached data, try to fetch some
  if (searchData.length === 0) {
    try {
      await cacheContentForSearch();
      searchData = AppState.allData;
    } catch (error) {
      console.warn('Could not load data for local search:', error);
    }
  }
  
  // Apply category filtering first
  let categoryFilteredData = searchData;
  if (AppState.currentCategory && AppState.currentCategory !== 'showall') {
    categoryFilteredData = searchData.filter(item => {
      // Handle different category name variations
      const itemType = item.type || item.category || '';
      const currentCat = AppState.currentCategory;
      
      // Direct match
      if (itemType === currentCat) return true;
      
      // Handle plural/singular variations
      const categoryVariations = {
        'books': ['book', 'books'],
        'articles': ['article', 'articles'],
        'fatwa': ['fatwa', 'fatwas'],
        'audios': ['audio', 'audios'],
        'videos': ['video', 'videos'],
        'hadith': ['hadith', 'hadiths'],
        'videos_ulamah': ['videos_ulamah', 'video_ulamah']
      };
      
      const variations = categoryVariations[currentCat] || [currentCat];
      return variations.includes(itemType);
    });
    
    console.log(`📂 Category filter: ${AppState.currentCategory} - ${categoryFilteredData.length}/${searchData.length} items`);
  }
  
  // Apply text search filtering with Arabic normalization
  const filteredData = categoryFilteredData.filter(item => {
    // Search in title (both regular and normalized)
    const titleMatch = item.title && (
      item.title.toLowerCase().includes(lowerQuery) ||
      normalizeArabicText(item.title).includes(normalizedQuery)
    );
    
    // Search in description (both regular and normalized)
    const descMatch = item.description && (
      item.description.toLowerCase().includes(lowerQuery) ||
      normalizeArabicText(item.description).includes(normalizedQuery)
    );
    
    // Search in author names (both regular and normalized)
    const authorMatch = item.prepared_by && item.prepared_by.some(author => 
      author.title && (
        author.title.toLowerCase().includes(lowerQuery) ||
        normalizeArabicText(author.title).includes(normalizedQuery)
      )
    );
    
    // Search in additional fields for specific content types
    let additionalMatch = false;
    
    // For hadith: enhanced search with Arabic normalization
    if (item.type === 'hadith') {
      additionalMatch = (
        (item.hadith && (
          item.hadith.toLowerCase().includes(lowerQuery) ||
          normalizeArabicText(item.hadith).includes(normalizedQuery)
        )) ||
        (item.rawi && (
          item.rawi.toLowerCase().includes(lowerQuery) ||
          normalizeArabicText(item.rawi).includes(normalizedQuery)
        )) ||
        (item.mohdith && (
          item.mohdith.toLowerCase().includes(lowerQuery) ||
          normalizeArabicText(item.mohdith).includes(normalizedQuery)
        )) ||
        (item.book && (
          item.book.toLowerCase().includes(lowerQuery) ||
          normalizeArabicText(item.book).includes(normalizedQuery)
        ))
      );
    }
    
    // For fatwa: enhanced search with Arabic normalization
    if (item.type === 'fatwa') {
      additionalMatch = (
        (item.question && (
          item.question.toLowerCase().includes(lowerQuery) ||
          normalizeArabicText(item.question).includes(normalizedQuery)
        )) ||
        (item.answer && (
          item.answer.toLowerCase().includes(lowerQuery) ||
          normalizeArabicText(item.answer).includes(normalizedQuery)
        ))
      );
    }
    
    return titleMatch || descMatch || authorMatch || additionalMatch;
  });
  
  // Calculate pagination
  const itemsPerPage = 25;
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);
  
  // Update search states
  AppState.searchResults = paginatedData;
  AppState.searchTotalItems = totalItems;
  AppState.searchTotalPages = totalPages;
  AppState.searchCurrentPage = page;
  AppState.activeNav = 'search';
  
  console.log(`🔍 Local search completed: ${totalItems} results found (showing ${paginatedData.length})`);
  
  setLoading(false);
  navigateToPage('search');
}
  
async function loadPage(pageNumber) {
  if (pageNumber < 1 || pageNumber > AppState.totalPages) return;
  
  try {
    setLoading(true);
    
    let data;
    
    if (AppState.searchQuery) {
      // Search mode
      data = await performSearch(AppState.searchQuery, pageNumber);
      
      if (data && data.data) {
        AppState.currentData = data.data;
        AppState.currentPage = pageNumber;
        AppState.totalPages = data.links?.pages_number || 1;
        AppState.totalItems = data.links?.total_items || 0;
        
        console.log(`Loaded page ${pageNumber} with ${data.data.length} items from search`);
        updateStatsDisplay();
        renderContent();
      } else {
        throw new Error('Failed to load search results');
      }
    } else {
      const currentType = AppState.currentFilter || 'showall';
      
      if (currentType === 'showall') {
        // Para "الكل" (Todo), intentar cargar contenido real o usar fallback
        console.log('Loading page', pageNumber, 'for "الكل" section');
        
        try {
          // Intentar cargar desde la API
          const data = await fetchData('search', pageNumber, AppState.itemsPerPage, { search: '' });
          
          if (data && data.data && data.data.length > 0) {
            AppState.currentData = data.data;
            AppState.currentPage = pageNumber;
            AppState.totalPages = data.pagination?.total_pages || 1;
            AppState.totalItems = data.pagination?.total_items || 0;
            
            console.log(`Loaded page ${pageNumber} with ${data.data.length} items from API`);
            updateStatsDisplay();
            renderContent();
            scrollToContentGrid();
          } else {
            throw new Error('No data from API');
          }
        } catch (error) {
          console.log('API failed, using fallback data for pagination');
          
          // Usar datos de fallback con paginación simulada
          const fallbackData = generateFallbackContent();
          const itemsPerPage = AppState.itemsPerPage || 25;
          const startIndex = (pageNumber - 1) * itemsPerPage;
          const endIndex = startIndex + itemsPerPage;
          
          // Simular datos para la página solicitada
          const pageData = fallbackData.data.slice(0, Math.min(itemsPerPage, fallbackData.data.length));
          
          AppState.currentData = pageData;
          AppState.currentPage = pageNumber;
          AppState.totalPages = fallbackData.totalPages;
          AppState.totalItems = fallbackData.totalItems;
          
          console.log(`Loaded fallback page ${pageNumber} with ${pageData.length} items`);
          updateStatsDisplay();
          renderContent();
          scrollToContentGrid();
        }
      } else {
        // Load specific category from API
        data = await fetchData(currentType, pageNumber, AppState.itemsPerPage);
        
        if (data && data.data) {
          AppState.currentData = data.data;
          AppState.currentPage = pageNumber;
          AppState.totalPages = data.pagination?.total_pages || 1;
          AppState.totalItems = data.pagination?.total_items || 0;
          
          console.log(`Loaded page ${pageNumber} with ${data.data.length} items from ${currentType}`);
          updateStatsDisplay();
          renderContent();
          scrollToContentGrid();
        } else {
          throw new Error(`Failed to load ${currentType} data`);
        }
      }
    }
  } catch (error) {
    console.error('Error loading page:', error);
    showError('خطأ في تحميل الصفحة من API');
  }
  setLoading(false);
}

// Navigation functions
function goToNextPage() {
  if (AppState.currentPage < AppState.totalPages) {
    loadPage(AppState.currentPage + 1);
  }
}

function goToPrevPage() {
  if (AppState.currentPage > 1) {
    loadPage(AppState.currentPage - 1);
  }
}

function goToFirstPage() {
  loadPage(1);
}

function goToLastPage() {
  loadPage(AppState.totalPages);
}

// Search pagination functions
function loadSearchPage(pageNumber) {
  if (pageNumber < 1 || pageNumber > AppState.searchTotalPages || pageNumber === AppState.searchCurrentPage) return;
  performSearch(pageNumber);
}

function goToNextSearchPage() {
  if (AppState.searchCurrentPage < AppState.searchTotalPages) {
    loadSearchPage(AppState.searchCurrentPage + 1);
  }
}

function goToPrevSearchPage() {
  if (AppState.searchCurrentPage > 1) {
    loadSearchPage(AppState.searchCurrentPage - 1);
  }
}

function goToFirstSearchPage() {
  loadSearchPage(1);
}

function goToLastSearchPage() {
  loadSearchPage(AppState.searchTotalPages);
}

// ==================== CONTENT RENDERING ====================

// Render content card
function renderContentCard(item, highlightQuery = null) {
    const isFavorited = AppState.favorites.includes(item.id.toString());
    const typeClass = `type-${item.type}`;
    const arabicType = getArabicType(item.type);
    const isBook = item.type === 'books';
    const isFatwa = item.type === 'fatwa';
    const isHadith = item.type === 'hadith';
    const isVideosUlamah = item.type === 'videos_ulamah';
    const isQuranRecitation = item.type === 'quran_recitations';
    const isIbnTaymiyyah = item.type === 'ibn-taymiyyah';

    // Función para escapar HTML y preservar saltos de línea
    const escapeHtml = (text) => {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replace(/\n/g, "<br>");
    };

    // Función para formatear la fecha
    const formatDateSafe = (dateString) => {
        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? '' : date.toLocaleDateString('ar-EG');
        } catch {
            return '';
        }
    };

    // Mostrar contenido según el tipo
    let mediaHTML = '';
    let contentHTML = '';
    let detailsHTML = '';

    if (isBook) {
        // Código para libros
        const downloadButtons = [];
        
        if (item.download_link) {
            const extension = item.download_link.split('.').pop().toUpperCase();
            downloadButtons.push(`
                <button onclick="window.open('${escapeHtml(item.download_link)}', '_blank')" class="attachment-link">
                    <span>${extension}</span>
                    <span class="text-xs opacity-75">(تحميل)</span>
                </button>
            `);
        }
        
        if (item.alternative_link) {
            const altExtension = item.alternative_link.split('.').pop().toUpperCase();
            downloadButtons.push(`
                <button onclick="window.open('${escapeHtml(item.alternative_link)}', '_blank')" class="attachment-link">
                    <span>${altExtension}</span>
                    <span class="text-xs opacity-75">(رابط بديل)</span>
                </button>
            `);
        }
        
        mediaHTML = downloadButtons.length > 0 
            ? `<div class="attachments-grid mb-3">${downloadButtons.join('')}</div>`
            : '';

        const details = [];
        
        if (item.author) details.push(`<div><strong>المؤلف:</strong> ${escapeHtml(item.author)}</div>`);
        if (item.researcher_supervisor) details.push(`<div><strong>المشرف البحثي:</strong> ${escapeHtml(item.researcher_supervisor)}</div>`);
        if (item.publisher) details.push(`<div><strong>الناشر:</strong> ${escapeHtml(item.publisher)}</div>`);
        if (item.publication_country) details.push(`<div><strong>البلد:</strong> ${escapeHtml(item.publication_country)}${item.city ? ` - ${escapeHtml(item.city)}` : ''}</div>`);
        if (item.main_category) details.push(`<div><strong>التصنيف الرئيسي:</strong> ${escapeHtml(item.main_category)}</div>`);
        if (item.sub_category) details.push(`<div><strong>التصنيف الفرعي:</strong> ${escapeHtml(item.sub_category)}</div>`);
        if (item.parts) details.push(`<div><strong>الأجزاء:</strong> ${escapeHtml(item.parts)}</div>`);
        if (item.parts_count) details.push(`<div><strong>عدد الأجزاء:</strong> ${escapeHtml(item.parts_count)}</div>`);
        if (item.section_books_count) details.push(`<div><strong>عدد الكتب في القسم:</strong> ${escapeHtml(item.section_books_count)}</div>`);
        if (item.pages) details.push(`<div><strong>الصفحات:</strong> ${escapeHtml(item.pages)}</div>`);
        if (item.format) details.push(`<div><strong>الصيغة:</strong> ${escapeHtml(item.format)}</div>`);
        if (item.size_bytes) {
            const sizeMB = (item.size_bytes / (1024 * 1024)).toFixed(2);
            details.push(`<div><strong>الحجم:</strong> ${sizeMB} ميجابايت</div>`);
        }

        detailsHTML = details.length > 0 ? `
            <div class="book-details mt-3">
                <h5 class="font-bold mb-2 text-emerald-700">تفاصيل الكتاب</h5>
                <div class="text-gray-600 mb-4 arabic-text leading-relaxed line-clamp-3 text-sm lg:text-base">
                    ${details.join('')}
                    ${item.topics ? `<div class="mt-2"><strong>المواضيع:</strong> ${escapeHtml(item.topics)}</div>` : ''}
                </div>
            </div>
        ` : '';

        contentHTML = '';
    } else if (isFatwa) {
        // Código específico para fatwas
        console.log('🔍 FATWA DEBUG - Full item object:', item);
        
        // Check for audio in fatwa - only use the 'audio' column
        let audioButtonHTML = '';
        
        console.log('🎵 FATWA DEBUG - Checking audio column:', {
            audio: item.audio,
            audioType: typeof item.audio,
            audioValue: item.audio
        });
        
        // Only show button if audio column has a valid value
        if (item.audio && item.audio.trim() !== '' && item.audio !== null && item.audio !== 'null' && item.audio !== ':') {
            const audioUrl = item.audio;
            const audioSize = item.audio_size || 'غير محدد';
            
            console.log('🎵 FATWA DEBUG - Using audio URL directly:', audioUrl);
            
            audioButtonHTML = `
                <div class="attachments-grid mb-4 mt-3" id="fatwa-audio-btn">
                    <button
                        onclick="handleMediaClick('${escapeHtml(audioUrl)}', '${escapeHtml(item.title)}', 'MP3')"
                        class="attachment-link audio-link"
                    >
                        <span>MP3</span>
                        <span class="text-xs opacity-75">(${audioSize})</span>
                    </button>
                </div>
            `;
            console.log('✅ FATWA DEBUG - Generated audio button for:', audioUrl);
        } else {
            console.log('⚠️ FATWA DEBUG - No audio in column "audio" - no button will be shown');
        }
        
        // Set mediaHTML to empty since we're embedding the button in content
        mediaHTML = '';

        const fullQuestion = item.question || 'لا يوجد نص للسؤال';
        const fullAnswer = item.answer || 'لا يوجد نص للإجابة';
        const showReadMore = fullQuestion.length > 150 || fullAnswer.length > 300;

        contentHTML = `
            <div class="fatwa-content mb-4">
                <div class="question-text text-emerald-800 font-semibold mb-3 p-3 bg-emerald-50 rounded-lg border-r-4 border-emerald-500">
                    <strong>السؤال:</strong><br>
                    ${escapeHtml(fullQuestion.length > 150 ? fullQuestion.substring(0, 150) : fullQuestion)}
                    ${fullQuestion.length > 150 ? `
                        <button onclick="this.parentElement.innerHTML = this.parentElement.innerHTML.replace(this.outerHTML, '') + decodeURI('${encodeURI(escapeHtml(fullQuestion))}')" 
                                class="read-more-btn mr-2 text-emerald-600 underline">
                            ...المزيد
                        </button>
                    ` : ''}
                </div>
                <div class="answer-text text-gray-700 mb-4 p-3 bg-gray-50 rounded-lg border-r-4 border-gray-400">
                    <strong>الجواب:</strong><br>
                    <div class="answer-content">
                        ${escapeHtml(fullAnswer.length > 300 ? fullAnswer.substring(0, 300) : fullAnswer)}
                        ${fullAnswer.length > 300 ? `
                            <button onclick="
                                const answerDiv = this.closest('.answer-content');
                                const audioButton = this.closest('.answer-text').querySelector('#fatwa-audio-btn');
                                answerDiv.innerHTML = decodeURI('${encodeURI(escapeHtml(fullAnswer))}');
                                if (audioButton) {
                                    answerDiv.appendChild(audioButton);
                                }
                            " class="read-more-btn mr-2 text-gray-600 underline">
                                ...المزيد
                            </button>
                        ` : ''}
                    </div>
                    ${audioButtonHTML}
                </div>
            </div>
        `;
    } else if (isHadith) {
        // Código específico para hadith
        console.log('🔍 HADITH DEBUG - Full item object:', item);
        
        // Set mediaHTML to empty since we're embedding everything in content
        mediaHTML = '';

        const fullHadith = item.hadith || 'لا يوجد نص للحديث';
        const fullSharh = item.sharh || '';
        const showReadMore = fullHadith.length > 200 || (fullSharh && fullSharh.length > 200);

        contentHTML = `
            <div class="hadith-content mb-4">
                <div class="hadith-text text-blue-800 font-semibold mb-4 p-4 bg-blue-50 rounded-lg border-r-4 border-blue-500">
                    <strong>الحديث:</strong><br>
                    <div class="hadith-main-text overflow-y-auto" style="line-height: 1.9; height: 140px; padding: 8px 0;">
                        ${escapeHtml(fullHadith.length > 200 ? fullHadith.substring(0, 200) : fullHadith)}
                        ${fullHadith.length > 200 ? `
                            <button onclick="
                                const hadithDiv = this.closest('.hadith-main-text');
                                hadithDiv.innerHTML = decodeURI('${encodeURI(escapeHtml(fullHadith))}');
                            " class="read-more-btn mr-2 text-blue-600 underline">
                                ...المزيد
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                ${fullSharh ? `
                <div class="sharh-text text-gray-700 mb-4 p-4 bg-gray-50 rounded-lg border-r-4 border-gray-400">
                    <strong>الشرح:</strong><br>
                    <div class="sharh-content overflow-y-auto" style="line-height: 1.7; height: 120px; padding: 8px 0;">
                        ${escapeHtml(fullSharh.length > 200 ? fullSharh.substring(0, 200) : fullSharh)}
                        ${fullSharh.length > 200 ? `
                            <button onclick="
                                const sharhDiv = this.closest('.sharh-content');
                                sharhDiv.innerHTML = decodeURI('${encodeURI(escapeHtml(fullSharh))}');
                            " class="read-more-btn mr-2 text-gray-600 underline">
                                ...المزيد
                            </button>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
                
                <div class="hadith-metadata bg-amber-50 p-4 rounded-lg border border-amber-200 mt-3">
                    <div class="mb-2">
                        <h5 class="text-sm font-bold text-amber-800 mb-3">معلومات الحديث:</h5>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        ${item.rawi ? `<div class="flex flex-col"><strong class="text-amber-700">الراوي:</strong> <span class="mt-1">${escapeHtml(item.rawi)}</span></div>` : ''}
                        ${item.mohdith ? `<div class="flex flex-col"><strong class="text-amber-700">المحدث:</strong> <span class="mt-1">${escapeHtml(item.mohdith)}</span></div>` : ''}
                        ${item.book ? `<div class="flex flex-col"><strong class="text-amber-700">الكتاب:</strong> <span class="mt-1">${escapeHtml(item.book)}</span></div>` : ''}
                        ${item.numberOrPage ? `<div class="flex flex-col"><strong class="text-amber-700">الصفحة/الرقم:</strong> <span class="mt-1">${escapeHtml(item.numberOrPage)}</span></div>` : ''}
                        ${item.grade ? `<div class="flex flex-col"><strong class="text-amber-700">الدرجة:</strong> <span class="mt-1 font-semibold text-amber-800 bg-amber-100 px-2 py-1 rounded">${escapeHtml(item.grade)}</span></div>` : ''}
                        ${item.created_at ? `<div class="flex flex-col"><strong class="text-amber-700">تاريخ الإضافة:</strong> <span class="mt-1 text-gray-600">${formatDate(item.created_at)}</span></div>` : ''}
                    </div>
                </div>
            </div>
        `;
    } else if (isVideosUlamah) {
        // Videos Ulamah usa el mismo procesamiento que videos normales
        console.log('🎥 Videos Ulamah Debug:', {
            item: item,
            hasAttachments: !!(item.attachments && item.attachments.length > 0),
            attachments: item.attachments,
            attachmentsType: typeof item.attachments,
            iframe: item.iframe,
            allKeys: Object.keys(item)
        });
        
        // Create video buttons from attachments (processed by API from videos_json and Iframes_json)
        let videoButtons = [];
        
        console.log('🎬 VIDEOS ULAMAH DEBUG - playlist_title:', item.playlist_title);
        console.log('🎬 VIDEOS ULAMAH DEBUG - videos_json:', item.videos_json);
        console.log('🎬 VIDEOS ULAMAH DEBUG - iframes_json:', item.iframes_json);
        console.log('🎬 VIDEOS ULAMAH DEBUG - attachments:', item.attachments);
        console.log('🎬 VIDEOS ULAMAH DEBUG - attachments type:', typeof item.attachments);
        console.log('🎬 VIDEOS ULAMAH DEBUG - attachments length:', item.attachments ? item.attachments.length : 'undefined');
        
        if (item.attachments && Array.isArray(item.attachments) && item.attachments.length > 0) {
            // Show first few videos as buttons (limit to 6 to avoid overwhelming the UI)
            const videosToShow = item.attachments.slice(0, 6);
            videoButtons = videosToShow.map((video, index) => {
                const videoNumber = index + 1;
                const videoTitle = video.title || `فيديو ${videoNumber}`;
                // Check if this is a placeholder video (no real URL)
                const isPlaceholder = video.placeholder || video.url === '#';
                const clickHandler = isPlaceholder 
                    ? `alert('${escapeHtml(videoTitle)}\\n\\nهذا الفيديو غير متاح حالياً - لا يوجد رابط في قاعدة البيانات')`
                    : `handleMediaClick('${escapeHtml(video.url)}', '${escapeHtml(videoTitle)}', 'VIDEO')`;
                
                return `
                    <button
                        onclick="${clickHandler}"
                        class="attachment-link video-link ${isPlaceholder ? 'placeholder-video' : ''}"
                        title="${escapeHtml(videoTitle)}"
                        ${isPlaceholder ? 'style="opacity: 0.6; cursor: help;"' : ''}
                    >
                        <span>فيديو ${videoNumber}</span>
                        <span class="text-xs opacity-75">${isPlaceholder ? '(غير متاح)' : '(مشاهدة)'}</span>
                    </button>
                `;
            });
            
            // Add "more" button if there are more than 6 videos
            if (item.attachments.length > 6) {
                const remainingVideos = item.attachments.slice(6);
                const remainingButtonsHtml = remainingVideos.map((video, index) => {
                    const videoNumber = index + 7; // Start from video 7 since we showed 1-6
                    const videoTitle = video.title || `فيديو ${videoNumber}`;
                    // Check if this is a placeholder video (no real URL)
                    const isPlaceholder = video.placeholder || video.url === '#';
                    const clickHandler = isPlaceholder 
                        ? `alert('${escapeHtml(videoTitle)}\\n\\nهذا الفيديو غير متاح حالياً - لا يوجد رابط في قاعدة البيانات')`
                        : `handleMediaClick('${escapeHtml(video.url)}', '${escapeHtml(videoTitle)}', 'VIDEO')`;
                    
                    return `
                        <button
                            onclick="${clickHandler}"
                            class="attachment-link video-link ${isPlaceholder ? 'placeholder-video' : ''}"
                            style="display: none;${isPlaceholder ? ' opacity: 0.6; cursor: help;' : ''}"
                            data-video-extra="true"
                            title="${escapeHtml(videoTitle)}"
                        >
                            <span>فيديو ${videoNumber}</span>
                            <span class="text-xs opacity-75">${isPlaceholder ? '(غير متاح)' : '(مشاهدة)'}</span>
                        </button>
                    `;
                }).join('');
                
                videoButtons.push(remainingButtonsHtml);
                videoButtons.push(`
                    <button
                        onclick="showMoreVideos(this)"
                        class="attachment-link"
                        style="opacity: 0.7;"
                        data-show-more="true"
                    >
                        <span>+${item.attachments.length - 6} فيديو</span>
                        <span class="text-xs opacity-75">(المزيد)</span>
                    </button>
                `);
            }
        } else {
            // Fallback if no videos are available
            console.log('⚠️ No hay videos disponibles en attachments');
            videoButtons.push(`
                <div class="text-center p-4 bg-gray-50 rounded-lg">
                    <span class="text-gray-500">لا توجد فيديوهات متاحة</span>
                </div>
            `);
        }
        
        mediaHTML = videoButtons.length > 0 
            ? `<div class="attachments-grid mb-4">${videoButtons.join('')}</div>`
            : '';
        
        // Show playlist title as content
        contentHTML = `
            <div class="playlist-info mb-4">
                <div class="text-purple-800 font-semibold mb-2 p-3 bg-purple-50 rounded-lg border-r-4 border-purple-500">
                    <strong>قائمة التشغيل:</strong> ${escapeHtml(item.playlist_title || item.title || 'بدون عنوان')}
                </div>
                ${item.attachments && item.attachments.length > 0 ? `
                    <div class="text-gray-700 mb-2 p-2 bg-gray-50 rounded-lg">
                        <strong>عدد الفيديوهات:</strong> ${item.attachments.length} فيديو
                    </div>
                ` : ''}
            </div>
        `;
        
        detailsHTML = '';
    } else if (isQuranRecitation) {
        // Código específico para recitaciones del Corán
        console.log('🕌 QURAN RECITATION DEBUG - Full item object:', item);
        
        // Parse mp3_urls JSON array
        let audioButtons = [];
        if (item.mp3_urls) {
            try {
                const mp3Urls = typeof item.mp3_urls === 'string' ? JSON.parse(item.mp3_urls) : item.mp3_urls;
                if (Array.isArray(mp3Urls) && mp3Urls.length > 0) {
                    // Show first few audio files as buttons (limit to 4 to avoid overwhelming the UI)
                    const urlsToShow = mp3Urls.slice(0, 4);
                    audioButtons = urlsToShow.map((url, index) => {
                        const suraNumber = index + 1;
                        return `
                            <button
                                onclick="handleMediaClick('${escapeHtml(url)}', '${escapeHtml(item.reciter_name)} - سورة ${suraNumber}', 'MP3')"
                                class="attachment-link audio-link"
                            >
                                <span>سورة ${suraNumber}</span>
                                <span class="text-xs opacity-75">(MP3)</span>
                            </button>
                        `;
                    });
                    
                    // Add "more" button if there are more than 4 suras
                    if (mp3Urls.length > 4) {
                        const remainingSuras = mp3Urls.slice(4);
                        const remainingButtonsHtml = remainingSuras.map((url, index) => {
                            const suraNumber = index + 5; // Start from sura 5 since we showed 1-4
                            return `
                                <button
                                    onclick="handleMediaClick('${escapeHtml(url)}', '${escapeHtml(item.reciter_name)} - سورة ${suraNumber}', 'MP3')"
                                    class="attachment-link audio-link"
                                    style="display: none;"
                                    data-sura-extra="true"
                                >
                                    <span>سورة ${suraNumber}</span>
                                    <span class="text-xs opacity-75">(MP3)</span>
                                </button>
                            `;
                        }).join('');
                        
                        audioButtons.push(remainingButtonsHtml);
                        audioButtons.push(`
                            <button
                                onclick="showMoreSuras(this)"
                                class="attachment-link"
                                style="opacity: 0.7;"
                                data-show-more="true"
                            >
                                <span>+${mp3Urls.length - 4} سور</span>
                                <span class="text-xs opacity-75">(المزيد)</span>
                            </button>
                        `);
                    }
                }
            } catch (e) {
                console.error('Error parsing mp3_urls:', e);
            }
        }
        
        mediaHTML = audioButtons.length > 0 
            ? `<div class="attachments-grid mb-4">${audioButtons.join('')}</div>`
            : '';
        
        // Content for Quran recitations
        contentHTML = `
            <div class="quran-recitation-info mb-4">
                <div class="text-emerald-800 font-semibold mb-2 p-3 bg-emerald-50 rounded-lg border-r-4 border-emerald-500">
                    <strong>القارئ:</strong> ${escapeHtml(item.reciter_name || 'غير محدد')}
                </div>
                ${item.total_surahs ? `
                    <div class="text-gray-700 mb-2 p-2 bg-gray-50 rounded-lg">
                        <strong>عدد السور:</strong> ${escapeHtml(item.total_surahs)} سورة
                    </div>
                ` : ''}
            </div>
        `;
        
        detailsHTML = '';
    } else if (isIbnTaymiyyah) {
        // Código específico para Ibn Taymiyyah
        mediaHTML = item.attachments && item.attachments.length > 0 
            ? item.attachments.map((attachment, idx) => `
                <button
                    onclick="handleMediaClick('${escapeHtml(attachment.url)}', '${escapeHtml(item.name || item.title)}', '${escapeHtml(attachment.extension_type)}')"
                    class="attachment-link"
                >
                    <span>${attachment.extension_type}</span>
                    <span class="text-xs opacity-75">(${attachment.size})</span>
                </button>
            `).join('')
            : '';
        
        mediaHTML = mediaHTML ? `<div class="attachments-grid mb-4">${mediaHTML}</div>` : '';
        
        contentHTML = `
            <div class="ibn-taymiyyah-info mb-4">
                <div class="text-emerald-800 font-semibold mb-2 p-3 bg-emerald-50 rounded-lg border-r-4 border-emerald-500">
                    <strong>من مؤلفات الشيخ ابن تيمية رحمه الله</strong>
                </div>
                <p class="text-gray-700 text-sm leading-relaxed">
                    كتاب من المؤلفات القيمة لشيخ الإسلام ابن تيمية، أحد أعلام الأمة الإسلامية وعلمائها المجددين.
                </p>
            </div>
        `;
        
        detailsHTML = '';
    } else {
        // Código para otros tipos de contenido (articles, audios, videos)
        mediaHTML = item.attachments && item.attachments.length > 0 
            ? item.attachments.map((attachment, idx) => `
                <button
                    onclick="handleMediaClick('${escapeHtml(attachment.url)}', '${escapeHtml(item.title)}', '${escapeHtml(attachment.extension_type)}')"
                    class="attachment-link"
                >
                    <span>${attachment.extension_type}</span>
                    <span class="text-xs opacity-75">(${attachment.size})</span>
                </button>
            `).join('')
            : '';
        
        mediaHTML = mediaHTML ? `<div class="attachments-grid mb-4">${mediaHTML}</div>` : '';
        
        contentHTML = `
            <p class="text-gray-600 mb-4 arabic-text leading-relaxed line-clamp-3 text-sm lg:text-base">
                ${escapeHtml(item.description || 'لا يوجد وصف متاح')}
            </p>
        `;
    }
    
    // Mostrar autores/preparadores para no-libros y no-fatwas y no-hadith y no-quran_recitations
    // Para videos_ulamah, mostrar el título en lugar de prepared_by
    const authorsHTML = !isBook && !isFatwa && !isHadith && !isQuranRecitation
        ? `<div class="mb-3">
             <p class="text-sm text-emerald-600 font-semibold">
               ${isVideosUlamah 
                 ? escapeHtml(item.title || 'Sin título') 
                 : (item.prepared_by 
                   ? (Array.isArray(item.prepared_by) 
                     ? item.prepared_by.map(author => escapeHtml(author.title || author)).join(' • ')
                     : escapeHtml(item.prepared_by))
                   : '')
               }
             </p>
           </div>`
        : '';

    return `
        <div class="card fade-in ${isHadith ? 'hadith-card' : ''}">
            <div class="flex justify-between items-start mb-3">
                <span class="content-type-badge ${typeClass}">${arabicType}</span>
                <button 
                    onclick="toggleFavoriteById('${item.id}')"
                    class="btn-icon favorite-btn ${isFavorited ? 'favorited' : ''}"
                    title="${isFavorited ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}"
                >
                    <svg class="w-5 h-5" fill="${isFavorited ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                    </svg>
                </button>
            </div>

            <!-- Card Title -->
            <div class="mb-4">
                <h4 class="text-lg font-bold text-gray-800 leading-tight line-clamp-2 arabic-text">
                    ${escapeHtml(isIbnTaymiyyah ? (item.name || item.title || 'كتاب من مؤلفات الشيخ ابن تيمية') : (item.title || item.name || 'بدون عنوان'))}
                </h4>
            </div>

            ${contentHTML}
            ${authorsHTML}
            ${detailsHTML}
            ${mediaHTML}

            <div class="flex justify-between items-center text-xs lg:text-sm text-gray-500 mt-3">
                ${isFatwa && item.mufti ? `
                    <div class="text-sm text-emerald-600 font-semibold mb-2">
                        ${escapeHtml(item.mufti)}
                    </div>
                ` : !isBook && !isFatwa && !isHadith && item.num_attachments ? `
                    <span class="inline-flex items-center gap-1">
                        <svg class="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
                        </svg>
                        ${item.num_attachments} مرفق
                    </span>
                ` : '<span></span>'}
                
                <span>${formatDateSafe(item.add_date || item.pub_date || '')}</span>
            </div>
        </div>
    `;
}

// Render pagination
function renderPagination(currentPage, totalPages, totalItems, onPageClick) {
  if (totalPages <= 1) return '';
  
  let pagesHTML = '';
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  
  for (let i = startPage; i <= endPage; i++) {
    pagesHTML += `
      <button
        onclick="${onPageClick}(${i})"
        class="pagination-number ${currentPage === i ? 'active' : ''}"
      >
        ${i}
      </button>
    `;
  }
  
  return `
    <div class="pagination-container">
      <div class="pagination-info">
        <span>صفحة ${currentPage} من ${totalPages} (${totalItems.toLocaleString('ar')} ${totalItems === AppState.searchTotalItems ? 'نتيجة' : 'عنصر'})</span>
      </div>
      
      <div class="pagination-controls">
        <button 
          onclick="${onPageClick}(1)"
          ${currentPage === 1 ? 'disabled' : ''}
          class="pagination-btn"
        >
          الأولى
        </button>
        
        <button 
          onclick="${onPageClick}(${currentPage - 1})"
          ${currentPage === 1 ? 'disabled' : ''}
          class="pagination-btn"
        >
          السابقة
        </button>
        
        <div class="pagination-pages">
          ${pagesHTML}
        </div>

        <button 
          onclick="${onPageClick}(${currentPage + 1})"
          ${currentPage === totalPages ? 'disabled' : ''}
          class="pagination-btn"
        >
          التالية
        </button>
        
        <button 
          onclick="${onPageClick}(${totalPages})"
          ${currentPage === totalPages ? 'disabled' : ''}
          class="pagination-btn"
        >
          الأخيرة
        </button>
      </div>
    </div>
  `;
}

// Main content rendering function
function renderContent() {
  // IMPORTANTE: Verificar si estamos en sabio.html y hay contenido específico de sabio
  if (window.location.pathname.includes('sabio.html') && window.SabioPageState) {
    console.log('🚫 App.js renderContent blocked - sabio.html has priority');
    return; // No renderizar contenido de app.js en sabio.html
  }
  
  const mainContent = document.getElementById('mainContent');
  
  if (AppState.isLoading) {
    mainContent.innerHTML = `
      <div class="loader">
        <div class="spinner"></div>
      </div>
    `;
    return;
  }

  switch (AppState.activeNav) {
    case 'search':
      if (!AppState.searchQuery.trim()) {
        AppState.activeNav = 'home';
        renderContent();
        return;
      }
      
      // Fix: Check if we have search results properly
      let searchCardsHTML = '';
      console.log('🔍 Search render debug:', {
        searchResults: AppState.searchResults,
        searchResultsLength: AppState.searchResults?.length,
        searchTotalItems: AppState.searchTotalItems,
        searchQuery: AppState.searchQuery
      });
      
      if (AppState.searchResults && AppState.searchResults.length > 0) {
        searchCardsHTML = AppState.searchResults.map(item => renderContentCard(item, AppState.searchQuery)).join('');
        console.log('✅ Rendering search results cards');
      } else if (AppState.searchTotalItems === 0) {
        searchCardsHTML = '<div class="col-span-full text-center py-8 text-gray-500">لا توجد نتائج للبحث</div>';
        console.log('⚠️ No search results found');
      } else if (AppState.searchTotalItems > 0 && (!AppState.searchResults || AppState.searchResults.length === 0)) {
        // We have total items but no results array - this is the bug
        searchCardsHTML = '<div class="col-span-full text-center py-8 text-orange-500">خطأ في تحميل النتائج. يرجى المحاولة مرة أخرى.</div>';
        console.error('❌ Search results mismatch: totalItems > 0 but no results array');
      } else {
        // True loading state
        searchCardsHTML = '<div class="col-span-full text-center py-8 text-gray-500">جاري التحميل...</div>';
        console.log('🔄 Loading search results...');
      }
      
      // Solo mostrar paginación si hay más de 25 resultados
      const showPagination = AppState.searchTotalItems > 25;
      const paginationHTML = showPagination 
        ? renderPagination(AppState.searchCurrentPage, AppState.searchTotalPages, AppState.searchTotalItems, 'loadSearchPage')
        : '';
      
      mainContent.innerHTML = `
        <section class="container mx-auto px-4 py-8">
          <div class="mb-8">
            <h3 class="text-2xl lg:text-3xl font-bold text-emerald-900 mb-2">نتائج البحث</h3>
            <p class="text-emerald-700">تم العثور على ${AppState.searchTotalItems || 0} نتيجة للبحث عن "${AppState.searchQuery}"</p>
            ${showPagination ? `<p class="text-sm text-emerald-600 mt-1">الصفحة ${AppState.searchCurrentPage} من ${AppState.searchTotalPages}</p>` : ''}
          </div>
          
          <div class="content-grid">
            ${searchCardsHTML}
          </div>
          
          ${paginationHTML}
        </section>
      `;
      break;

    case 'favorites':
      const favoriteItems = AppState.favorites.map(id => AppState.favoritesData[id]).filter(Boolean);
      
      if (favoriteItems.length === 0) {
        mainContent.innerHTML = `
          <section class="container mx-auto px-4 py-12 text-center">
            <div class="max-w-md mx-auto">
              <div class="text-4xl lg:text-6xl mb-6"></div>
              <h2 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">لا توجد مفضلة</h2>
              <p class="text-gray-600 mb-8 text-sm lg:text-base">لم تقم بإضافة أي محتوى إلى المفضلة بعد</p>
              <button onclick="navigateToPage('home')" class="btn btn-primary">
                تصفح المحتوى
              </button>
            </div>
          </section>
        `;
      } else {
        const favoriteCardsHTML = favoriteItems.map(item => renderContentCard(item)).join('');
        
        mainContent.innerHTML = `
          <section class="container mx-auto px-4 py-8 lg:py-12">
            <div class="mb-8 text-center">
              <h2 class="text-2xl lg:text-3xl font-bold text-emerald-900 mb-4">مفضلاتي</h2>
              <p class="text-emerald-700 text-sm lg:text-base">لديك ${AppState.favorites.length} عنصر في المفضلة</p>
            </div>

            <div class="content-grid">
              ${favoriteCardsHTML}
            </div>
          </section>
        `;
      }
      break;

    case 'categories':
      // Use unified categories implementation from sabio.js
      if (window.renderCategoriesPage) {
        window.renderCategoriesPage();
      } else {
        // Fallback if sabio.js not loaded
        mainContent.innerHTML = `
          <section class="container mx-auto px-4 py-8">
            <div class="text-center mb-12">
              <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">التصنيفات</h1>
              <p class="text-gray-600 text-lg">جار تحميل التصنيفات...</p>
            </div>
          </section>
        `;
      }
      break;

    default: // home
      // Mejorar la lógica de carga para evitar estado de "carga infinita"
      let contentCardsHTML;
      if (AppState.currentData.length > 0) {
        contentCardsHTML = AppState.currentData.map(item => renderContentCard(item)).join('');
      } else if (AppState.isLoading) {
        contentCardsHTML = '<div class="col-span-full text-center py-8 text-gray-500">جار تحميل المحتوى...</div>';
      } else {
        // Si no está cargando y no hay datos, mostrar mensaje de error
        contentCardsHTML = `
          <div class="col-span-full text-center py-8">
            <div class="text-gray-500 mb-4">لا يمكن تحميل المحتوى حالياً</div>
            <button onclick="loadHomePage()" class="btn btn-primary">إعادة المحاولة</button>
          </div>
        `;
      }
      
      const categoryFiltersHTML = ['showall', 'books', 'fatwa', 'audios', 'hadith', 'ibn-taymiyyah'].map((type) => `
        <button 
          onclick="filterByType('${type}')" 
          class="btn text-sm lg:text-base ${AppState.currentCategory === type ? 'btn-primary' : 'btn-outline'}"
        >
          ${type === 'showall' ? 'الكل' : 
           type === 'books' ? 'الكتب' : 
           type === 'articles' ? 'المقالات' : 
           type === 'fatwa' ? 'الفتاوى' : 
           type === 'audios' ? 'الصوتيات' : 
           type === 'videos' ? 'المرئيات' : 
           type === 'hadith' ? 'الأحاديث' : 
           type === 'ibn-taymiyyah' ? 'الشيخ ابن تيمية' : 
           type === 'quran_recitations' ? 'استماع القرآن' : 'فيديوهات دعويه'}
        </button>
      `).join('');

      mainContent.innerHTML = `
        <div class="hero islamic-pattern">
          <div class="container mx-auto px-4 text-center">
            <p class="text-lg md:text-xl lg:text-2xl mb-8 opacity-90">المكتبة الشاملة للمحتوى الإسلامي</p>
            <div class="stats-container">
              <div class="stats-card bg-white/10 backdrop-blur-sm border-white/20">
                <div class="stats-number text-white">${AppState.totalItems.toLocaleString('ar')}</div>
                <div class="stats-label text-white/80">إجمالي المواد</div>
              </div>
              <div class="stats-card bg-white/10 backdrop-blur-sm border-white/20">
                <div class="stats-number text-white">${AppState.totalPages.toLocaleString('ar')}</div>
                <div class="stats-label text-white/80">صفحة</div>
              </div>
              <div class="stats-card bg-white/10 backdrop-blur-sm border-white/20">
                <div class="stats-number text-white">${AppState.favorites.length.toLocaleString('ar')}</div>
                <div class="stats-label text-white/80">المفضلة</div>
              </div>
            </div>
          </div>
        </div>

        <section class="container mx-auto px-4 py-8 lg:py-12">
          <div class="content-header">
            <div class="mb-8">
              <h3 class="text-2xl lg:text-3xl font-bold text-emerald-900 mb-4 calligraphy">أحدث المحتوى</h3>
              <p class="text-emerald-700 text-sm lg:text-base">استكشف أحدث الكتب والمقالات والفتاوى والمحاضرات الإسلامية</p>
            </div>

            <div class="category-filters-container">
              ${categoryFiltersHTML}
            </div>
          </div>

          <div class="content-grid">
            ${contentCardsHTML}
          </div>

          ${renderPagination(AppState.currentPage, AppState.totalPages, AppState.totalItems, 'loadPage')}
        </section>
      `;
      break;
  }
  
  // Reinitialize mega menu after content rendering to ensure hover functionality works
  // This is necessary because renderContent() can replace DOM elements and lose event listeners
  setTimeout(() => {
    initializeMegaMenu();
  }, 100);
}

// ==================== FALLBACK DATA ====================

// Generate fallback content for main page when API is not available
function generateFallbackContent() {
  const fallbackItems = [
    {
      id: 'fb_1',
      title: 'كتاب التوحيد',
      author: 'الشيخ محمد بن عبد الوهاب',
      category: 'books',
      type: 'pdf',
      description: 'كتاب مهم في بيان التوحيد وأقسامه',
      url: '#',
      thumbnail: 'assets/images/book-placeholder.jpg',
      date: '2024-01-15',
      views: 1250,
      favorites: 89
    },
    {
      id: 'fb_2', 
      title: 'محاضرة عن الصلاة',
      author: 'الشيخ ابن باز',
      category: 'audios',
      type: 'audio',
      description: 'محاضرة مفيدة عن أحكام الصلاة وآدابها',
      url: '#',
      duration: '45:30',
      date: '2024-01-10',
      views: 2100,
      favorites: 156
    },
    {
      id: 'fb_3',
      title: 'فتوى في الزكاة',
      author: 'اللجنة الدائمة',
      category: 'fatwa',
      type: 'text',
      description: 'فتوى مهمة حول أحكام زكاة المال',
      url: '#',
      date: '2024-01-08',
      views: 890,
      favorites: 67
    },
    {
      id: 'fb_4',
      title: 'مقال عن الحج',
      author: 'الشيخ الألباني',
      category: 'articles',
      type: 'text',
      description: 'مقال شامل عن مناسك الحج وأحكامه',
      url: '#',
      date: '2024-01-05',
      views: 1580,
      favorites: 123
    },
    {
      id: 'fb_5',
      title: 'شرح الأربعين النووية',
      author: 'الشيخ ابن عثيمين',
      category: 'books',
      type: 'pdf',
      description: 'شرح مفصل للأحاديث الأربعين النووية',
      url: '#',
      thumbnail: 'assets/images/book-placeholder.jpg',
      date: '2024-01-03',
      views: 3200,
      favorites: 245
    },
    {
      id: 'fb_6',
      title: 'درس في العقيدة',
      author: 'الشيخ صالح الفوزان',
      category: 'audios',
      type: 'audio',
      description: 'درس مهم في أصول العقيدة الإسلامية',
      url: '#',
      duration: '38:15',
      date: '2024-01-01',
      views: 1890,
      favorites: 134
    }
  ];
  
  // Simulate pagination
  const itemsPerPage = AppState.itemsPerPage || 25;
  const totalItems = 150; // Simulate total items
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  return {
    data: fallbackItems,
    totalPages: totalPages,
    totalItems: totalItems,
    currentPage: 1
  };
}

// ==================== HELPER FUNCTIONS ====================

// Scroll to top of content grid on pagination
function scrollToContentGrid() {
  // Add small delay to ensure DOM is rendered
  setTimeout(() => {
    // Try to find the content grid first
    let targetElement = document.querySelector('.content-grid');
    
    if (!targetElement) {
      // Fallback to main content container
      targetElement = document.getElementById('mainContent');
    }
    
    if (!targetElement) {
      // Last fallback to App container
      targetElement = document.querySelector('.App');
    }
    
    if (targetElement) {
      const offsetTop = targetElement.offsetTop - 20; // 20px margin from top
      window.scrollTo({
        top: Math.max(0, offsetTop), // Ensure we don't scroll to negative position
        behavior: 'smooth'
      });
      console.log('📜 Scrolled to:', targetElement.className || targetElement.id || 'content area');
    } else {
      // Ultimate fallback: scroll to top of page
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      console.log('📜 Scrolled to top of page (fallback)');
    }
  }, 100); // 100ms delay to allow DOM rendering
}

function clearAllFavorites() {
  if (confirm('هل أنت متأكد من حذف جميع المفضلة؟')) {
    AppState.favorites = [];
    AppState.favoritesData = {};
    localStorage.setItem('islamicFavorites', JSON.stringify([]));
    localStorage.setItem('islamicFavoritesData', JSON.stringify({}));
    renderContent();
    updateStatsDisplay();
  }
}

// ==================== EVENT LISTENERS ====================

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing Islamic Content App...');
  
  // Remove audio-player-active class on page load to prevent white space after footer
  document.body.classList.remove('audio-player-active');
  console.log('Removed audio-player-active class on page load');
  
  // Enhanced search functionality with debouncing
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    // Add input event listener for debounced search
    searchInput.addEventListener('input', handleSearchInput);
    
    // Keep Enter key functionality
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(searchDebounceTimer);
        performSearch();
      }
    });
  }
  
  // Audio player event listeners
  const audioElement = document.getElementById('audioElement');
  const audioProgress = document.getElementById('audioProgress');
  const volumeSlider = document.getElementById('volumeSlider');
  const playPauseBtn = document.getElementById('playPauseBtn');
  
  audioElement.addEventListener('timeupdate', function() {
    AppState.currentTime = audioElement.currentTime;
    audioProgress.value = audioElement.currentTime;
    document.getElementById('audioSubtitle').textContent = 
      `${formatTime(AppState.currentTime)} / ${formatTime(AppState.duration)}`;
  });
  
  audioElement.addEventListener('loadedmetadata', function() {
    AppState.duration = audioElement.duration;
    audioProgress.max = audioElement.duration;
    document.getElementById('audioSubtitle').textContent = 
      `${formatTime(AppState.currentTime)} / ${formatTime(AppState.duration)}`;
  });
  
  audioElement.addEventListener('ended', function() {
    if (AppState.isRepeating) {
      audioElement.currentTime = 0;
      audioElement.play().catch(e => console.error('Error replaying audio:', e));
    } else {
      playNext();
    }
  });
  
  audioElement.addEventListener('play', function() {
    AppState.isPlaying = true;
    playPauseBtn.innerHTML = `
      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M6 4a1 1 0 00-1 1v10a1 1 0 001 1h2a1 1 0 001-1V5a1 1 0 00-1-1H6zM12 4a1 1 0 00-1 1v10a1 1 0 001 1h2a1 1 0 001-1V5a1 1 0 00-1-1h-2z" clip-rule="evenodd"/>
      </svg>
    `;
    playPauseBtn.title = 'إيقاف';
  });
  
  audioElement.addEventListener('pause', function() {
    AppState.isPlaying = false;
    playPauseBtn.innerHTML = `
      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/>
      </svg>
    `;
    playPauseBtn.title = 'تشغيل';
  });
  
  audioProgress.addEventListener('input', function() {
    const newTime = audioProgress.value;
    audioElement.currentTime = newTime;
    AppState.currentTime = newTime;
  });
  
  volumeSlider.addEventListener('input', function() {
    const newVolume = volumeSlider.value;
    AppState.volume = newVolume;
    audioElement.volume = newVolume;
  });
  
  // Close modals when clicking outside
  window.addEventListener('click', function(event) {
    const videoModal = document.getElementById('videoPlayerModal');
    if (event.target === videoModal) {
      closeVideoPlayer();
    }
  });
  
  // Check for pending filter from sabio.html
  const pendingFilter = localStorage.getItem('pendingFilter');
  if (pendingFilter) {
    console.log(`🔄 Found pending filter from sabio.html: ${pendingFilter}`);
    localStorage.removeItem('pendingFilter'); // Clear the pending filter
    
    // Apply the filter after a short delay to ensure DOM is ready
    setTimeout(() => {
      filterByType(pendingFilter);
      // Update navigation to show we're on home with filter applied
      AppState.activeNav = 'home';
      document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === 'home') {
          link.classList.add('active');
        }
      });
    }, 500);
  } else {
    // Check for saved navigation state
    const savedNavState = localStorage.getItem('currentNavigationState');
    if (savedNavState) {
      try {
        const navState = JSON.parse(savedNavState);
        const timeDiff = Date.now() - navState.timestamp;
        
        // Only restore state if it's less than 1 hour old
        if (timeDiff < 3600000) {
          console.log(`🔄 Restoring navigation state: ${navState.activeNav}`);
          AppState.activeNav = navState.activeNav;
          AppState.currentPage = navState.currentPage || 1;
          AppState.currentCategory = navState.currentCategory || 'showall';
          
          // Update navigation UI
          document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === AppState.activeNav) {
              link.classList.add('active');
            }
          });
          
          // Load appropriate content based on saved state
          if (navState.activeNav === 'favorites') {
            renderContent();
          } else if (navState.activeNav === 'categories') {
            renderContent();
          } else {
            // For home or other states, load home page normally
            loadHomePage();
          }
          
          return; // Exit early, don't run loadHomePage
        } else {
          // Clear old state
          localStorage.removeItem('currentNavigationState');
        }
      } catch (e) {
        console.error('Error parsing saved navigation state:', e);
        localStorage.removeItem('currentNavigationState');
      }
    }
    
    // Initialize app normally if no valid saved state
    loadHomePage();
  }
  
  cacheContentForSearch();
  
  // Initialize mega menu
  initializeMegaMenu();
});

// ==================== GLOBAL FUNCTION EXPORTS ====================

// Global mega menu initialization for all pages
window.initializeMegaMenu = initializeMegaMenu;

// Initialize mega menu on all pages when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure all elements are rendered
    setTimeout(() => {
      if (document.getElementById('sabiosMenuTrigger') && document.getElementById('sabiosMegaMenu')) {
        console.log('🔧 Initializing mega menu for current page...');
        initializeMegaMenu();
      }
    }, 200);
  });
} else {
  // DOM already loaded
  setTimeout(() => {
    if (document.getElementById('sabiosMenuTrigger') && document.getElementById('sabiosMegaMenu')) {
      console.log('🔧 Initializing mega menu for current page (DOM already loaded)...');
      initializeMegaMenu();
    }
  }, 200);
}

// Function to clear navigation state (useful for returning to default state)
function clearNavigationState() {
  localStorage.removeItem('currentNavigationState');
  console.log('🗑️ Navigation state cleared');
}

// Making functions available globally for onclick handlers
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.navigateToPage = navigateToPage;
window.clearNavigationState = clearNavigationState;
window.performSearch = performSearch;
window.toggleFavorite = toggleFavorite;
window.toggleFavoriteById = toggleFavoriteById;
window.showNotification = showNotification;
window.syncFavoritesCounter = syncFavoritesCounter;
window.handleMediaClick = handleMediaClick;
window.filterByType = filterByType;
window.loadPage = loadPage;
window.loadSearchPage = loadSearchPage;
window.togglePlayPause = togglePlayPause;
window.playPrevious = playPrevious;
window.playNext = playNext;
window.toggleShuffle = toggleShuffle;
window.toggleRepeat = toggleRepeat;
window.toggleQueue = toggleQueue;
window.clearQueue = clearQueue;
window.closeAudioPlayer = closeAudioPlayer;
window.playFromQueue = playFromQueue;
window.removeFromQueue = removeFromQueue;
window.showVideoPlayer = showVideoPlayer;
window.closeVideoPlayer = closeVideoPlayer;
window.clearAllFavorites = clearAllFavorites;

// ==================== MEGA MENU SABIOS FUNCTIONS ====================

// Global state for mega menu
let sabiosMegaMenuOpen = false;
let allSabiosList = []; // Cache de todos los sabios para búsqueda

// Load sabios list for mega menu
async function loadSabiosList() {
  try {
    const response = await fetch('assets/php/sabio_loader.php?action=get_sabios');
    const data = await response.json();
    
    if (data.success) {
      allSabiosList = data.data; // Guardar en cache
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to load sabios list');
    }
  } catch (error) {
    console.error('Error loading sabios list:', error);
    return [];
  }
}

// Función de búsqueda en el mega menú
function searchSabiosInMegaMenu(query) {
  const searchTerm = query.toLowerCase().trim();
  
  if (!searchTerm) {
    return allSabiosList; // Mostrar todos si no hay término de búsqueda
  }
  
  return allSabiosList.filter(sabio => 
    sabio.name.toLowerCase().includes(searchTerm)
  );
}

// Renderizar sabios en el mega menú
function renderSabiosInMegaMenu(sabiosList) {
  const megaMenuGrid = document.getElementById('sabiosGrid');
  if (!megaMenuGrid) return;
  
  megaMenuGrid.innerHTML = '';
  
  if (sabiosList.length === 0) {
    megaMenuGrid.innerHTML = '<div class="text-center text-gray-500 py-4">لا توجد نتائج للبحث</div>';
    return;
  }
  
  sabiosList.forEach(sabio => {
    const firstLetter = sabio.name.charAt(0);
    
    const sabioElement = document.createElement('a');
    sabioElement.href = '#';
    sabioElement.className = 'sabio-item';
    sabioElement.onclick = (e) => {
      e.preventDefault();
      navigateToSabio(sabio.name);
    };
    
    // Verificar si hay imagen disponible (simulación)
    const hasImage = sabio.image && sabio.image !== '';
    
    sabioElement.innerHTML = `
      <div class="sabio-avatar">
        ${hasImage ? 
          `<img src="${sabio.image}" alt="${sabio.name}">
           <span class="initial-letter" style="display: none;">${firstLetter}</span>` :
          `<span class="initial-letter">${firstLetter}</span>`
        }
      </div>
      <div class="sabio-info">
        <div class="sabio-name">${sabio.name}</div>
        <div class="sabio-stats">${sabio.total_files || 0} ملف</div>
      </div>
    `;
    
    megaMenuGrid.appendChild(sabioElement);
  });
}

// Load sabios for mega menu
async function loadSabiosForMegaMenu() {
  console.log('Loading sabios for mega menu...');
  try {
    // Try to fetch from API first
    let sabiosWithInfo = [];
    
    try {
      console.log('Attempting to fetch sabios from API...');
      const response = await safeFetch('./assets/php/sabio_loader.php?action=get_sabios');
      if (response && response.success) {
        console.log('API response successful, loading sabios:', response.data.length);
        const sabios = response.data;
        
        // Load detailed info for each sabio to get their images
        sabiosWithInfo = await Promise.all(
          sabios.map(async (sabio) => {
            try {
              const infoResponse = await safeFetch(`./assets/php/sabio_loader.php?action=get_sabio_info&sabio=${encodeURIComponent(sabio.name)}`);
              if (infoResponse && infoResponse.success) {
                return {
                  ...sabio,
                  image: infoResponse.data.image,
                  stats: infoResponse.data.stats
                };
              }
              return sabio;
            } catch (error) {
              console.warn(`Failed to load info for ${sabio.name}`);
              return sabio;
            }
          })
        );
      }
    } catch (apiError) {
      console.warn('API failed, using fallback data:', apiError);
      
      // Use fallback mock data if API fails
      sabiosWithInfo = [
        { name: 'الشيخ محمد صالح المنجد', display_name: 'الشيخ محمد صالح المنجد', stats: { total_audio: 150, total_pdf: 45 }, image: null },
        { name: 'الشيخ عبد العزيز بن باز', display_name: 'الشيخ عبد العزيز بن باز', stats: { total_audio: 200, total_pdf: 80 }, image: null },
        { name: 'الشيخ محمد بن عثيمين', display_name: 'الشيخ محمد بن عثيمين', stats: { total_audio: 300, total_pdf: 120 }, image: null },
        { name: 'الشيخ عبد الله بن جبرين', display_name: 'الشيخ عبد الله بن جبرين', stats: { total_audio: 180, total_pdf: 60 }, image: null },
        { name: 'الشيخ صالح الفوزان', display_name: 'الشيخ صالح الفوزان', stats: { total_audio: 250, total_pdf: 90 }, image: null },
        { name: 'الشيخ عبد الرحمن السديس', display_name: 'الشيخ عبد الرحمن السديس', stats: { total_audio: 120, total_pdf: 30 }, image: null },
        { name: 'الشيخ سعد الغامدي', display_name: 'الشيخ سعد الغامدي', stats: { total_audio: 100, total_pdf: 25 }, image: null },
        { name: 'الشيخ مشاري العفاسي', display_name: 'الشيخ مشاري العفاسي', stats: { total_audio: 80, total_pdf: 20 }, image: null },
        { name: 'الشيخ ناصر القطامي', display_name: 'الشيخ ناصر القطامي', stats: { total_audio: 90, total_pdf: 15 }, image: null },
        { name: 'الشيخ أحمد العجمي', display_name: 'الشيخ أحمد العجمي', stats: { total_audio: 110, total_pdf: 35 }, image: null },
        { name: 'الشيخ عبد الباسط عبد الصمد', display_name: 'الشيخ عبد الباسط عبد الصمد', stats: { total_audio: 75, total_pdf: 10 }, image: null },
        { name: 'الشيخ محمود خليل الحصري', display_name: 'الشيخ محمود خليل الحصري', stats: { total_audio: 85, total_pdf: 12 }, image: null },
        { name: 'الشيخ علي الحذيفي', display_name: 'الشيخ علي الحذيفي', stats: { total_audio: 95, total_pdf: 18 }, image: null },
        { name: 'الشيخ سعود الشريم', display_name: 'الشيخ سعود الشريم', stats: { total_audio: 105, total_pdf: 22 }, image: null },
        { name: 'الشيخ ماهر المعيقلي', display_name: 'الشيخ ماهر المعيقلي', stats: { total_audio: 70, total_pdf: 8 }, image: null }
      ];
      console.log('Using fallback data with', sabiosWithInfo.length, 'sabios');
    }
    
    const sabiosGrid = document.getElementById('sabiosGrid');
    const mobileSabiosSubmenu = document.getElementById('mobileSabiosSubmenu');
    
    if (sabiosGrid && sabiosWithInfo.length > 0) {
      sabiosGrid.innerHTML = sabiosWithInfo.map(sabio => {
        const avatarContent = sabio.image 
          ? `<img src="${sabio.image}" alt="${sabio.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">`
          : '';
        
        const initialLetter = `<span class="initial-letter" ${sabio.image ? 'style="display:none"' : ''}>${sabio.name.charAt(0)}</span>`;
        
        const totalFiles = sabio.stats ? (sabio.stats.total_audio + sabio.stats.total_pdf) : 0;
        const statsText = totalFiles > 0 ? `${totalFiles} ملف` : 'عالم إسلامي';
        
        return `
          <a href="#" class="sabio-item" onclick="selectSabio('${sabio.name}')">
            <div class="sabio-avatar">
              ${avatarContent}
              ${initialLetter}
            </div>
            <div class="sabio-info">
              <div class="sabio-name">${sabio.name}</div>
              <div class="sabio-stats">${statsText}</div>
            </div>
          </a>
        `;
      }).join('');
    }
    
    if (mobileSabiosSubmenu && sabiosWithInfo.length > 0) {
      // Add search input at the beginning of mobile submenu
      const searchHTML = `
        <div class="mega-menu-search mobile-sabios-search" style="margin-bottom: 1rem; padding: 0 1rem;">
          <input type="text" id="mobileSabiosSearchInput" placeholder="بحث عن عالم أو داعية..." autocomplete="off" style="width: 100%; padding: 0.75rem 2.5rem 0.75rem 1rem; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 0.875rem; background: white; direction: rtl; text-align: right;">
          <div class="mega-menu-search-icon" style="position: absolute; left: 1.75rem; top: 50%; transform: translateY(-50%); color: #6b7280; pointer-events: none; z-index: 1;">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
        </div>
      `;
      
      const sabiosListHTML = sabiosWithInfo.map(sabio => {
        const avatarContent = sabio.image 
          ? `<img src="${sabio.image}" alt="${sabio.name}" loading="lazy" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">`
          : '';
        
        const initialLetter = `<span ${sabio.image ? 'style="display:none"' : ''}>${sabio.name.charAt(0)}</span>`;
        
        return `
          <a href="#" class="mobile-sabio-item" onclick="selectSabio('${sabio.name}')">
            <div class="mobile-sabio-avatar">
              ${avatarContent}
              ${initialLetter}
            </div>
            <span class="mobile-sabio-name">${sabio.name}</span>
          </a>
        `;
      }).join('');
      
      // Combine search and sabios list
      mobileSabiosSubmenu.innerHTML = searchHTML + sabiosListHTML;
      
      // Add search functionality for mobile submenu
      const mobileSearchInput = document.getElementById('mobileSabiosSearchInput');
      if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', function() {
          const searchTerm = this.value.toLowerCase().trim();
          const sabioItems = mobileSabiosSubmenu.querySelectorAll('.mobile-sabio-item');
          
          sabioItems.forEach(item => {
            const sabioName = item.querySelector('.mobile-sabio-name').textContent.toLowerCase();
            if (sabioName.includes(searchTerm)) {
              item.style.display = 'flex';
            } else {
              item.style.display = 'none';
            }
          });
        });
      }
    }
  } catch (error) {
    console.error('Error loading sabios:', error);
  }
}

// Function to show mega menu - MOVED OUTSIDE initializeMegaMenu
function showMegaMenu() {
  const sabiosMegaMenu = document.getElementById('sabiosMegaMenu');
  const sabiosMenuTrigger = document.getElementById('sabiosMenuTrigger');
  
  if (sabiosMegaMenu && sabiosMenuTrigger) {
    // Position mega menu correctly
    const triggerRect = sabiosMenuTrigger.getBoundingClientRect();
    sabiosMegaMenu.style.top = (triggerRect.bottom + 5) + 'px';
    
    sabiosMegaMenu.classList.add('show');
    sabiosMenuTrigger.classList.add('active');
    document.body.classList.add('mega-menu-open');
  }
}

// Function to hide mega menu - MOVED OUTSIDE initializeMegaMenu
function hideMegaMenu() {
  const sabiosMegaMenu = document.getElementById('sabiosMegaMenu');
  const sabiosMenuTrigger = document.getElementById('sabiosMenuTrigger');
  
  if (sabiosMegaMenu && sabiosMenuTrigger) {
    sabiosMegaMenu.classList.remove('show');
    sabiosMenuTrigger.classList.remove('active');
    document.body.classList.remove('mega-menu-open');
  }
}

// Initialize mega menu
async function initializeMegaMenu() {
  console.log('Initializing mega menu...');
  
  // Load sabios with images and stats
  await loadSabiosForMegaMenu();
  
  // Setup mega menu toggle
  const sabiosMenuTrigger = document.getElementById('sabiosMenuTrigger');
  const sabiosMegaMenu = document.getElementById('sabiosMegaMenu');
  const searchInput = document.getElementById('sabiosSearchInput');
  
  if (sabiosMenuTrigger && sabiosMegaMenu) {
    let hoverTimeout;
    const megaMenuContainer = sabiosMenuTrigger.closest('.mega-menu-container');
    
    // Click functionality (toggle)
    sabiosMenuTrigger.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const isVisible = sabiosMegaMenu.classList.contains('show');
      
      if (isVisible) {
        hideMegaMenu();
      } else {
        showMegaMenu();
        // Focus search input when menu opens via click
        setTimeout(() => {
          if (searchInput) {
            searchInput.focus();
          }
        }, 100);
      }
    });
    
    // Hover functionality
    if (megaMenuContainer) {
      megaMenuContainer.addEventListener('mouseenter', function() {
        clearTimeout(hoverTimeout);
        showMegaMenu();
      });
      
      megaMenuContainer.addEventListener('mouseleave', function() {
        // Minimal delay to prevent flickering when moving between elements
        hoverTimeout = setTimeout(() => {
          hideMegaMenu();
        }, 50);
      });
      
      // Keep menu open when hovering over the mega menu itself
      sabiosMegaMenu.addEventListener('mouseenter', function() {
        clearTimeout(hoverTimeout);
      });
      
      sabiosMegaMenu.addEventListener('mouseleave', function() {
        // Instant close when leaving mega menu area
        hideMegaMenu();
      });
    }
    
    // Close mega menu when clicking outside
    document.addEventListener('click', function(e) {
      if (!sabiosMenuTrigger.contains(e.target) && !sabiosMegaMenu.contains(e.target)) {
        hideMegaMenu();
      }
    });
    
    // Reposition mega menu on window resize
    window.addEventListener('resize', function() {
      if (sabiosMegaMenu.classList.contains('show')) {
        updateMegaMenuPosition();
      }
    });
  }
  
  // Setup search functionality
  if (searchInput) {
    let allSabios = []; // Store original list
    
    // Store original sabios list after loading
    const sabiosGrid = document.getElementById('sabiosGrid');
    if (sabiosGrid) {
      // Get all sabio items after they're loaded
      setTimeout(() => {
        allSabios = Array.from(sabiosGrid.querySelectorAll('.sabio-item')).map(item => ({
          element: item.cloneNode(true),
          name: item.querySelector('.sabio-name').textContent.toLowerCase(),
          stats: item.querySelector('.sabio-stats').textContent.toLowerCase()
        }));
      }, 500);
    }
    
    searchInput.addEventListener('input', function(e) {
      const searchTerm = e.target.value.toLowerCase().trim();
      
      if (!sabiosGrid || allSabios.length === 0) return;
      
      if (searchTerm === '') {
        // Show all sabios
        sabiosGrid.innerHTML = allSabios.map(sabio => sabio.element.outerHTML).join('');
      } else {
        // Filter sabios based on search term
        const filteredSabios = allSabios.filter(sabio => 
          sabio.name.includes(searchTerm) || sabio.stats.includes(searchTerm)
        );
        
        if (filteredSabios.length > 0) {
          sabiosGrid.innerHTML = filteredSabios.map(sabio => sabio.element.outerHTML).join('');
        } else {
          sabiosGrid.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #6b7280;">
              <p>لا توجد نتائج للبحث عن "${searchTerm}"</p>
            </div>
          `;
        }
      }
    });
    
    // Clear search when menu closes
    document.addEventListener('click', function(e) {
      if (!sabiosMenuTrigger.contains(e.target) && !sabiosMegaMenu.contains(e.target)) {
        searchInput.value = '';
        if (sabiosGrid && allSabios.length > 0) {
          sabiosGrid.innerHTML = allSabios.map(sabio => sabio.element.outerHTML).join('');
        }
      }
    });
  }
}

// Toggle mega menu
function toggleMegaMenu() {
  sabiosMegaMenuOpen = !sabiosMegaMenuOpen;
  const megaMenu = document.getElementById('sabiosMegaMenu');
  const trigger = document.getElementById('sabiosMenuTrigger');
  
  if (sabiosMegaMenuOpen) {
    megaMenu.classList.add('show');
    trigger.classList.add('active');
  } else {
    megaMenu.classList.remove('show');
    trigger.classList.remove('active');
  }
}

// Close mega menu
function closeMegaMenu() {
  if (sabiosMegaMenuOpen) {
    sabiosMegaMenuOpen = false;
    const megaMenu = document.getElementById('sabiosMegaMenu');
    const trigger = document.getElementById('sabiosMenuTrigger');
    
    megaMenu.classList.remove('show');
    trigger.classList.remove('active');
  }
}

// Toggle mobile sabios menu
function toggleMobileSabiosMenu() {
  const submenu = document.getElementById('mobileSabiosSubmenu');
  const menuLink = document.getElementById('mobileSabiosMenu');
  
  if (submenu.style.display === 'none' || submenu.style.display === '') {
    submenu.style.display = 'block';
    menuLink.classList.add('expanded');
  } else {
    submenu.style.display = 'none';
    menuLink.classList.remove('expanded');
  }
}

// Navigate to sabio page
function navigateToSabio(sabioName) {
  // Close menus
  closeMegaMenu();
  closeMobileMenu();
  
  // Store selected sabio in localStorage for sabio.html (backup)
  localStorage.setItem('selectedSabio', sabioName);
  
  // IMPORTANT: Clear navigation state to ensure we go to sabio main content, not favorites/categories
  localStorage.removeItem('sabioNavState');
  localStorage.removeItem('currentNavigationState');
  console.log('🗑️ Cleared navigation state before navigating to sabio');
  
  // Navigate to sabio.html with sabio name in URL parameters
  window.location.href = `sabio.html?sabio=${encodeURIComponent(sabioName)}`;
}

// Remove this duplicate event listener - it's already handled in initializeMegaMenu

// Select sabio function
function selectSabio(sabioName) {
  console.log('Selected sabio:', sabioName);
  localStorage.setItem('selectedSabio', sabioName);
  
  // IMPORTANT: Clear navigation state to ensure we go to sabio main content, not favorites/categories
  localStorage.removeItem('sabioNavState');
  localStorage.removeItem('currentNavigationState');
  console.log('🗑️ Cleared navigation state before selecting sabio');
  
  window.location.href = `sabio.html?sabio=${encodeURIComponent(sabioName)}`;
}

// Function to show more suras in Quran recitation cards
function showMoreSuras(button) {
  const container = button.closest('.attachments-grid');
  const hiddenSuras = container.querySelectorAll('[data-sura-extra="true"]');
  const moreButton = container.querySelector('[data-show-more="true"]');
  
  // Show all hidden suras
  hiddenSuras.forEach(sura => {
    sura.style.display = 'block';
    sura.classList.add('fade-in');
  });
  
  // Hide the "more" button
  if (moreButton) {
    moreButton.style.display = 'none';
  }
}

// Function to show more videos in videos_ulamah cards
function showMoreVideos(button) {
  const container = button.closest('.attachments-grid');
  const hiddenVideos = container.querySelectorAll('[data-video-extra="true"]');
  const moreButton = container.querySelector('[data-show-more="true"]');
  
  // Show all hidden videos
  hiddenVideos.forEach(video => {
    video.style.display = 'block';
    video.classList.add('fade-in');
  });
  
  // Hide the "more" button
  if (moreButton) {
    moreButton.style.display = 'none';
  }
}

// Render categories page with new category cards
function renderCategoriesPage() {
  const mainContent = document.getElementById('mainContent');
  if (!mainContent) return;
  
  // Categories that were moved from main filters
  const categoriesData = [
    {
      key: 'articles',
      name: 'المقالات',
      description: 'مجموعة شاملة من المقالات الإسلامية',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
      color: 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
    },
    {
      key: 'videos',
      name: 'المرئيات',
      description: 'مقاطع فيديو تعليمية ودعوية',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/></svg>',
      color: 'linear-gradient(135deg, #ec4899, #be185d)'
    },
    {
      key: 'videos_ulamah',
      name: 'فيديوهات العلماء',
      description: 'محاضرات ودروس العلماء والدعاة',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/></svg>',
      color: 'linear-gradient(135deg, #7c3aed, #5b21b6)'
    },
    {
      key: 'quran_recitations',
      name: 'تلاوات القرآن',
      description: 'تلاوات مختارة من القرآن الكريم',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/><path d="M17.5 10.5c.88 0 1.73.09 2.5.26V9.24c-.79-.15-1.64-.24-2.5-.24-1.7 0-3.24.29-4.5.83v1.66c1.13-.64 2.7-.99 4.5-.99z"/><path d="M13 12.49v1.66c1.13-.64 2.7-.99 4.5-.99.88 0 1.73.09 2.5.26V11.9c-.79-.15-1.64-.24-2.5-.24-1.7 0-3.24.29-4.5.83z"/><path d="M17.5 14.33c-1.7 0-3.24.29-4.5.83v1.66c1.13-.64 2.7-.99 4.5-.99.88 0 1.73.09 2.5.26v-1.52c-.79-.15-1.64-.24-2.5-.24z"/></svg>',
      color: 'linear-gradient(135deg, #059669, #047857)'
    }
  ];
  
  const categoriesHTML = `
    <div class="categories-page-container">
      <div class="categories-hero">
        <div class="container">
          <h1 class="categories-title">التصنيفات</h1>
          <p class="categories-subtitle">استكشف المحتوى الإسلامي حسب التصنيفات المختلفة</p>
        </div>
      </div>
      
      <div class="container">
        <div class="categories-grid-enhanced">
          ${categoriesData.map(category => `
            <div class="category-card-enhanced" onclick="filterByType('${category.key}')" style="--category-color: ${category.color}">
              <div class="category-card-header">
                <div class="category-icon-enhanced">${category.icon}</div>
                <div class="category-badge">جديد</div>
              </div>
              <div class="category-card-content">
                <h3 class="category-name">${category.name}</h3>
                <p class="category-description">${category.description}</p>
              </div>
              <div class="category-card-footer">
                <div class="category-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                  </svg>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  
  mainContent.innerHTML = categoriesHTML;
  AppState.activeNav = 'categories';
  updateActiveNavigation('categories');
}

// Make functions globally available
window.toggleMegaMenu = toggleMegaMenu;
window.closeMegaMenu = closeMegaMenu;
window.toggleMobileSabiosMenu = toggleMobileSabiosMenu;
window.showMoreSuras = showMoreSuras;
window.showMoreVideos = showMoreVideos;
window.renderCategoriesPage = renderCategoriesPage;

// Export additional functions needed for navigation
window.showMegaMenu = showMegaMenu;
window.hideMegaMenu = hideMegaMenu;
window.loadSabiosForMegaMenu = loadSabiosForMegaMenu;
window.navigateToSabio = navigateToSabio;
window.selectSabio = selectSabio;
