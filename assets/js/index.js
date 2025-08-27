// ==================== INDEX.HTML DEDICATED JAVASCRIPT ====================
// Complete standalone JavaScript for index.html - No external dependencies

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
const itemsPerPage = 25;

// ==================== UTILITY FUNCTIONS ====================

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
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.warn(`Fetch attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// Build API URL
function buildApiUrl(contentType, page = 1, limit = 25, lang = 'ar', locale = 'ar') {
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

// Show error message
function showError(message) {
  console.error('Error:', message);
  alert(message);
}

// Set loading state
function setLoading(loading) {
  AppState.isLoading = loading;
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

async function fetchContent(contentType = 'showall', page = 1) {
  try {
    IndexState.isLoading = true;
    showLoading(true);
    
    const url = buildApiUrl(contentType, page);
    const data = await fetchAPI(url);
    
    if (data.error) {
      throw new Error(data.message || 'Error del servidor');
    }
    
    // Filter out author/source metadata
    const filteredItems = (data.items || data || []).filter(item => {
      return item && 
             !['author', 'source'].includes(item.type) && 
             !['author', 'source'].includes(item.kind);
    });
    
    IndexState.currentData = filteredItems;
    IndexState.totalPages = data.totalPages || 1;
    IndexState.totalItems = data.totalItems || filteredItems.length;
    IndexState.currentPage = page;
    IndexState.currentCategory = contentType;
    
    if (contentType === 'showall') {
      IndexState.allData = filteredItems;
    }
    
    renderContent();
    renderPagination();
    
  } catch (error) {
    console.error('Error fetching content:', error);
    showError('حدث خطأ في تحميل المحتوى. يرجى المحاولة مرة أخرى.');
  } finally {
    IndexState.isLoading = false;
    showLoading(false);
  }
}

// ==================== SEARCH FUNCTIONS ====================
async function performSearch(query = null, page = 1) {
  const searchQuery = query || document.getElementById('searchInput')?.value?.trim() || '';
  
  if (!searchQuery) {
    IndexState.activeNav = 'home';
    await fetchContent('showall', 1);
    return;
  }
  
  try {
    IndexState.isLoading = true;
    IndexState.activeNav = 'search';
    showLoading(true);
    
    const response = await fetchAPI(`api.php?action=search&q=${encodeURIComponent(searchQuery)}&page=${page}`);
    
    if (response.error) {
      throw new Error(response.message || 'Error en la búsqueda');
    }
    
    // Filter search results
    const filteredResults = (response.items || response.results || []).filter(item => {
      return item && 
             !['author', 'source'].includes(item.type) && 
             !['author', 'source'].includes(item.kind);
    });
    
    IndexState.searchResults = filteredResults;
    IndexState.searchTotalPages = response.totalPages || 1;
    IndexState.searchTotalItems = response.totalItems || filteredResults.length;
    IndexState.searchCurrentPage = page;
    IndexState.searchQuery = searchQuery;
    
    renderSearchResults();
    renderSearchPagination();
    
  } catch (error) {
    console.error('Search error:', error);
    showError('حدث خطأ في البحث. يرجى المحاولة مرة أخرى.');
  } finally {
    IndexState.isLoading = false;
    showLoading(false);
  }
}

// ==================== RENDERING FUNCTIONS ====================
function renderContent() {
  const mainContent = document.getElementById('mainContent');
  if (!mainContent) return;
  
  if (IndexState.isLoading) {
    mainContent.innerHTML = `
      <div class="loader">
        <div class="spinner"></div>
      </div>
    `;
    return;
  }
  
  if (IndexState.currentData.length === 0) {
    mainContent.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">📚</div>
        <h3>لا توجد نتائج</h3>
        <p>لم يتم العثور على محتوى في هذا القسم</p>
      </div>
    `;
    return;
  }
  
  const cardsHTML = IndexState.currentData.map(item => renderContentCard(item)).join('');
  
  mainContent.innerHTML = `
    <div class="content-grid">
      ${cardsHTML}
    </div>
  `;
}

function renderSearchResults() {
  const mainContent = document.getElementById('mainContent');
  if (!mainContent) return;
  
  if (IndexState.searchResults.length === 0) {
    mainContent.innerHTML = `
      <div class="search-results-header">
        <h2>نتائج البحث عن: "${IndexState.searchQuery}"</h2>
        <p>لم يتم العثور على نتائج</p>
      </div>
    `;
    return;
  }
  
  const cardsHTML = IndexState.searchResults.map(item => renderContentCard(item)).join('');
  
  mainContent.innerHTML = `
    <div class="search-results-header">
      <h2>نتائج البحث عن: "${IndexState.searchQuery}"</h2>
      <p>تم العثور على ${IndexState.searchTotalItems} نتيجة</p>
    </div>
    <div class="content-grid">
      ${cardsHTML}
    </div>
  `;
}

function renderContentCard(item) {
  if (!item || !item.id) return '';
  
  const isFavorited = isInFavorites(item.id);
  const favoriteClass = isFavorited ? 'favorited' : '';
  
  return `
    <div class="content-card" data-id="${item.id}">
      <div class="card-header">
        <div class="card-type">${item.type || 'محتوى'}</div>
        <button class="favorite-btn ${favoriteClass}" onclick="toggleFavorite('${item.id}')">
          <svg class="heart-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </button>
      </div>
      
      <div class="card-content">
        <h3 class="card-title">${item.title || item.name || 'بدون عنوان'}</h3>
        
        ${item.description ? `<p class="card-description">${item.description}</p>` : ''}
        
        <div class="card-meta">
          ${item.author ? `<span class="meta-item">المؤلف: ${item.author}</span>` : ''}
          ${item.date ? `<span class="meta-item">التاريخ: ${item.date}</span>` : ''}
        </div>
      </div>
      
      <div class="card-actions">
        ${item.url ? `<a href="${item.url}" target="_blank" class="btn btn-primary">عرض</a>` : ''}
        ${item.download_url ? `<a href="${item.download_url}" class="btn btn-secondary">تحميل</a>` : ''}
      </div>
    </div>
  `;
}

function renderPagination() {
  const paginationContainer = document.getElementById('pagination');
  if (!paginationContainer || IndexState.totalPages <= 1) {
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }
  
  let paginationHTML = '';
  
  // Previous button
  if (IndexState.currentPage > 1) {
    paginationHTML += `<button class="pagination-btn" onclick="changePage(${IndexState.currentPage - 1})">السابق</button>`;
  }
  
  // Page numbers
  for (let i = 1; i <= Math.min(IndexState.totalPages, 10); i++) {
    const activeClass = i === IndexState.currentPage ? 'active' : '';
    paginationHTML += `<button class="pagination-btn ${activeClass}" onclick="changePage(${i})">${i}</button>`;
  }
  
  // Next button
  if (IndexState.currentPage < IndexState.totalPages) {
    paginationHTML += `<button class="pagination-btn" onclick="changePage(${IndexState.currentPage + 1})">التالي</button>`;
  }
  
  paginationContainer.innerHTML = paginationHTML;
}

function renderSearchPagination() {
  const paginationContainer = document.getElementById('searchPagination');
  if (!paginationContainer || IndexState.searchTotalPages <= 1) {
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }
  
  let paginationHTML = '';
  
  if (IndexState.searchCurrentPage > 1) {
    paginationHTML += `<button class="pagination-btn" onclick="searchPage(${IndexState.searchCurrentPage - 1})">السابق</button>`;
  }
  
  for (let i = 1; i <= Math.min(IndexState.searchTotalPages, 10); i++) {
    const activeClass = i === IndexState.searchCurrentPage ? 'active' : '';
    paginationHTML += `<button class="pagination-btn ${activeClass}" onclick="searchPage(${i})">${i}</button>`;
  }
  
  if (IndexState.searchCurrentPage < IndexState.searchTotalPages) {
    paginationHTML += `<button class="pagination-btn" onclick="searchPage(${IndexState.searchCurrentPage + 1})">التالي</button>`;
  }
  
  paginationContainer.innerHTML = paginationHTML;
}

// ==================== NAVIGATION FUNCTIONS ====================
function navigateToPage(page) {
  IndexState.activeNav = page;
  
  switch (page) {
    case 'home':
      fetchContent('showall', 1);
      break;
    case 'categories':
      renderCategoriesPage();
      break;
    case 'favorites':
      renderFavoritesPage();
      break;
    default:
      fetchContent(page, 1);
  }
}

function renderCategoriesPage() {
  const mainContent = document.getElementById('mainContent');
  if (!mainContent) return;
  
  mainContent.innerHTML = `
    <div class="categories-page">
      <h2>التصنيفات</h2>
      <div class="categories-grid">
        <div class="category-card" onclick="filterByType('books')">
          <div class="category-icon">📚</div>
          <h3>الكتب</h3>
          <p>مجموعة من الكتب الإسلامية</p>
        </div>
        <div class="category-card" onclick="filterByType('articles')">
          <div class="category-icon">📄</div>
          <h3>المقالات</h3>
          <p>مقالات ودراسات إسلامية</p>
        </div>
        <div class="category-card" onclick="filterByType('fatwa')">
          <div class="category-icon">⚖️</div>
          <h3>الفتاوى</h3>
          <p>فتاوى العلماء المعتبرين</p>
        </div>
        <div class="category-card" onclick="filterByType('audios')">
          <div class="category-icon">🎵</div>
          <h3>الصوتيات</h3>
          <p>محاضرات ودروس صوتية</p>
        </div>
        <div class="category-card" onclick="filterByType('videos')">
          <div class="category-icon">🎥</div>
          <h3>المرئيات</h3>
          <p>محاضرات ودروس مرئية</p>
        </div>
      </div>
    </div>
  `;
}

function renderFavoritesPage() {
  const favorites = getFavorites();
  const mainContent = document.getElementById('mainContent');
  if (!mainContent) return;
  
  if (favorites.length === 0) {
    mainContent.innerHTML = `
      <div class="favorites-page">
        <h2>المفضلة</h2>
        <div class="no-favorites">
          <div class="no-favorites-icon">💝</div>
          <h3>لا توجد مفضلات</h3>
          <p>لم تقم بإضافة أي محتوى إلى المفضلة بعد</p>
        </div>
      </div>
    `;
    return;
  }
  
  const favoritesHTML = favorites.map(item => renderContentCard(item)).join('');
  
  mainContent.innerHTML = `
    <div class="favorites-page">
      <h2>المفضلة (${favorites.length})</h2>
      <div class="content-grid">
        ${favoritesHTML}
      </div>
    </div>
  `;
}

// ==================== EVENT HANDLERS ====================
function changePage(page) {
  fetchContent(IndexState.currentCategory, page);
}

function searchPage(page) {
  performSearch(IndexState.searchQuery, page);
}

function filterByType(type) {
  IndexState.activeNav = type;
  fetchContent(type, 1);
}

function toggleFavorite(itemId) {
  const item = [...IndexState.currentData, ...IndexState.searchResults].find(i => i.id === itemId);
  if (!item) return;
  
  if (isInFavorites(itemId)) {
    removeFromFavorites(itemId);
    showNotification('تم إزالة العنصر من المفضلة', 'success');
  } else {
    addToFavorites(item);
    showNotification('تم إضافة العنصر إلى المفضلة', 'success');
  }
  
  // Update UI
  const favoriteBtn = document.querySelector(`[data-id="${itemId}"] .favorite-btn`);
  if (favoriteBtn) {
    favoriteBtn.classList.toggle('favorited');
  }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
  console.log('Index page loaded');
  
  // Initialize search functionality
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        performSearch();
      }
    });
  }
  
  // Initialize mega menu
  const megaMenuTrigger = document.getElementById('sabiosMenuTrigger');
  if (megaMenuTrigger) {
    megaMenuTrigger.addEventListener('mouseenter', showMegaMenu);
    megaMenuTrigger.addEventListener('click', function(e) {
      e.preventDefault();
      showMegaMenu();
    });
  }
  
  const megaMenu = document.getElementById('sabiosMegaMenu');
  if (megaMenu) {
    megaMenu.addEventListener('mouseleave', hideMegaMenu);
  }
  
  // Load initial content
  fetchContent('showall', 1);
});

// Export functions to global scope
window.IndexState = IndexState;
window.navigateToPage = navigateToPage;
window.performSearch = performSearch;
window.filterByType = filterByType;
window.toggleFavorite = toggleFavorite;
window.changePage = changePage;
window.searchPage = searchPage;
