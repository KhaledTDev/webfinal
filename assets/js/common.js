// ==================== COMMON UTILITIES FOR ALL PAGES ====================
// Shared functions and utilities used across multiple pages

// ==================== GLOBAL STATE MANAGEMENT ====================
const AppState = {
  // Data state
  currentData: [],
  allData: [],
  favorites: JSON.parse(localStorage.getItem('islamicFavorites') || '[]'),
  favoritesData: JSON.parse(localStorage.getItem('islamicFavoritesData') || '{}'),
  searchQuery: '',
  currentCategory: 'showall',
  currentFilter: 'showall',
  
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
const CORS_PROXY = '';
const itemsPerPage = 25;

// ==================== UTILITY FUNCTIONS ====================

// Build API URL
function buildApiUrl(contentType, page = 1, limit = 25, lang = 'ar', locale = 'ar') {
  const TYPE_MAPPINGS = {
    'books': 'books',
    'articles': 'articles',
    'fatwa': 'fatwa',
    'audios': 'audios',
    'videos': 'videos',
    'hadith': 'hadith',
    'videos_ulamah': 'videos_ulamah',
    'quran': 'quran',
    'poster': 'poster',
    'cards': 'cards',
    'ibn-taymiyyah': 'ibn-taymiyyah',
    'showall': 'showall'
  };
  
  const mappedType = TYPE_MAPPINGS[contentType] || contentType;
  
  if (mappedType === 'showall') {
    return `${ISLAMIC_HOUSE_API_BASE}?action=categories`;
  }
  
  return `${ISLAMIC_HOUSE_API_BASE}?action=items&category=${mappedType}&page=${page}&limit=${limit}`;
}

// Enhanced fetch with retry logic
async function safeFetch(url, options = {}, retries = 3) {
  console.log('🌐 [COMMON] safeFetch called with URL:', url);
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
      console.log(`🔄 [COMMON] Fetch attempt ${i + 1}/${retries}`);
      const response = await fetch(url, defaultOptions);
      console.log('📡 [COMMON] Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ [COMMON] Data received successfully:', data);
      return data;
    } catch (error) {
      console.warn(`⚠️ [COMMON] Fetch attempt ${i + 1} failed:`, error);
      if (i === retries - 1) {
        console.error('💥 [COMMON] All fetch attempts failed:', error);
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
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

// Arabic text normalization
function normalizeArabicText(text) {
  if (!text) return '';
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[ء]/g, '')
    .replace(/[ًٌٍَُِّْ]/g, '');
}

// Format time for audio player
function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Show error message
function showError(message) {
  console.error('❌ [COMMON] Error:', message);
  alert(message);
}

// Set loading state
function setLoading(loading) {
  console.log('⏳ [COMMON] Setting loading state to:', loading);
  AppState.isLoading = loading;
  
  // Update loading indicators
  const loadingElements = document.querySelectorAll('.loading-spinner, .loading-overlay');
  loadingElements.forEach(element => {
    if (loading) {
      element.style.display = 'block';
    } else {
      element.style.display = 'none';
    }
  });
}

// ==================== MOBILE MENU FUNCTIONS ====================

// Toggle mobile menu
function toggleMobileMenu() {
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuOverlay = document.querySelector('.mobile-menu-overlay');
  const hamburgerBtn = document.querySelector('.hamburger-btn');
  
  if (!mobileMenu) return;
  
  AppState.mobileMenuOpen = !AppState.mobileMenuOpen;
  
  if (AppState.mobileMenuOpen) {
    mobileMenu.style.display = 'block';
    if (mobileMenuOverlay) mobileMenuOverlay.style.display = 'block';
    if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
      mobileMenu.classList.add('show');
      if (mobileMenuOverlay) mobileMenuOverlay.classList.add('show');
    }, 10);
  } else {
    mobileMenu.classList.remove('show');
    if (mobileMenuOverlay) mobileMenuOverlay.classList.remove('show');
    if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    
    setTimeout(() => {
      mobileMenu.style.display = 'none';
      if (mobileMenuOverlay) mobileMenuOverlay.style.display = 'none';
    }, 300);
  }
}

// Close mobile menu
function closeMobileMenu() {
  if (AppState.mobileMenuOpen) {
    toggleMobileMenu();
  }
}

// ==================== FAVORITES SYSTEM ====================

// Global function to sync favorites counter across all pages
function syncFavoritesCounter() {
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  const favoritesCount = favorites.length;
  
  console.log(`🔄 Syncing favorites counter: ${favoritesCount} favorites found`);
  
  // Update specific favorites counter elements by ID
  const favoritesCountElement = document.getElementById('favoritesCount');
  if (favoritesCountElement) {
    favoritesCountElement.textContent = favoritesCount;
  }
  
  // Update all stats-number elements (fallback)
  const statsElements = document.querySelectorAll('.stats-number');
  if (statsElements.length >= 3) {
    statsElements[2].textContent = favoritesCount;
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
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
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

// ==================== MEGA MENU FUNCTIONS ====================

// Function to show mega menu
function showMegaMenu() {
  const sabiosMegaMenu = document.getElementById('sabiosMegaMenu');
  const sabiosMenuTrigger = document.getElementById('sabiosMenuTrigger');
  
  if (sabiosMegaMenu && sabiosMenuTrigger) {
    const triggerRect = sabiosMenuTrigger.getBoundingClientRect();
    sabiosMegaMenu.style.top = (triggerRect.bottom + 5) + 'px';
    
    sabiosMegaMenu.classList.add('show');
    sabiosMenuTrigger.classList.add('active');
    document.body.classList.add('mega-menu-open');
  }
}

// Function to hide mega menu
function hideMegaMenu() {
  const sabiosMegaMenu = document.getElementById('sabiosMegaMenu');
  const sabiosMenuTrigger = document.getElementById('sabiosMenuTrigger');
  
  if (sabiosMegaMenu && sabiosMenuTrigger) {
    sabiosMegaMenu.classList.remove('show');
    sabiosMenuTrigger.classList.remove('active');
    document.body.classList.remove('mega-menu-open');
  }
}

// Toggle mega menu
function toggleMegaMenu() {
  const sabiosMegaMenu = document.getElementById('sabiosMegaMenu');
  if (sabiosMegaMenu && sabiosMegaMenu.classList.contains('show')) {
    hideMegaMenu();
  } else {
    showMegaMenu();
  }
}

// Close mega menu
function closeMegaMenu() {
  hideMegaMenu();
}

// Navigate to sabio page
function navigateToSabio(sabioName) {
  window.location.href = `sabio.html?sabio=${encodeURIComponent(sabioName)}`;
}

// Select sabio (for mega menu)
function selectSabio(sabioName) {
  navigateToSabio(sabioName);
  closeMegaMenu();
}

// ==================== GLOBAL EXPORTS ====================

// Make functions globally available
window.AppState = AppState;
window.safeFetch = safeFetch;
window.saveToLocalStorage = saveToLocalStorage;
window.loadFromLocalStorage = loadFromLocalStorage;
window.normalizeArabicText = normalizeArabicText;
window.formatTime = formatTime;
window.showError = showError;
window.setLoading = setLoading;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.syncFavoritesCounter = syncFavoritesCounter;
window.showNotification = showNotification;
window.showMegaMenu = showMegaMenu;
window.hideMegaMenu = hideMegaMenu;
window.toggleMegaMenu = toggleMegaMenu;
window.closeMegaMenu = closeMegaMenu;
window.navigateToSabio = navigateToSabio;
window.selectSabio = selectSabio;

// Initialize favorites counter on page load
document.addEventListener('DOMContentLoaded', function() {
  syncFavoritesCounter();
  
  // Listen for favorites updates from other pages
  window.addEventListener('favoritesUpdated', function(event) {
    console.log('🔄 Received favorites update event:', event.detail);
  });
});
