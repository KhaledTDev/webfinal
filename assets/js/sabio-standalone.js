// ==================== SABIO.HTML STANDALONE JAVASCRIPT ====================
// Complete standalone JavaScript for sabio.html - No external dependencies

// Common utilities are loaded separately in HTML

// ==================== SABIO-SPECIFIC STATE ====================
const SabioPageState = {
  activeCategory: 'الكل',
  activeSabio: null,
  sabioData: null,
  sabioStats: null,
  currentContent: [],
  isLoading: false
};

const SabioPagination = {
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 12
};

// ==================== SABIO-SPECIFIC FUNCTIONS ====================

// Load sabio content
async function loadSabioContent(sabioName) {
  try {
    setLoading(true);
    
    const response = await safeFetch(`./assets/php/sabio_loader.php?action=get_sabio_info&sabio=${encodeURIComponent(sabioName)}`);
    
    if (response && response.success) {
      SabioPageState.sabioData = response.data;
      SabioPageState.sabioStats = response.data.stats;
      SabioPageState.activeSabio = sabioName;
      
      renderSabioHeader();
      renderCategoryButtons();
      loadCategoryContentInternal('الكل');
    } else {
      throw new Error('Failed to load sabio data');
    }
  } catch (error) {
    console.error('Error loading sabio:', error);
    showError('خطأ في تحميل بيانات العالم');
  }
  setLoading(false);
}

// Render sabio header
function renderSabioHeader() {
  const headerContainer = document.getElementById('sabioHeader');
  if (!headerContainer || !SabioPageState.sabioData) return;
  
  const sabio = SabioPageState.sabioData;
  const stats = SabioPageState.sabioStats || {};
  
  headerContainer.innerHTML = `
    <div class="sabio-hero">
      <div class="sabio-avatar">
        ${sabio.image ? 
          `<img src="${sabio.image}" alt="${sabio.name}" loading="lazy">` : 
          `<div class="avatar-placeholder">${sabio.name.charAt(0)}</div>`
        }
      </div>
      <div class="sabio-info">
        <h1 class="sabio-name">${sabio.name}</h1>
        <p class="sabio-description">${sabio.description || 'عالم إسلامي معاصر'}</p>
        <div class="sabio-stats">
          <div class="stat-item">
            <span class="stat-number">${stats.total_audio || 0}</span>
            <span class="stat-label">صوتيات</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${stats.total_pdf || 0}</span>
            <span class="stat-label">كتب</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${(stats.total_audio || 0) + (stats.total_pdf || 0)}</span>
            <span class="stat-label">إجمالي</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Render category buttons
function renderCategoryButtons() {
  const buttonsContainer = document.getElementById('categoryButtons');
  if (!buttonsContainer || !SabioPageState.sabioStats) return;
  
  const stats = SabioPageState.sabioStats;
  const categories = [
    { key: 'الكل', label: 'الكل', count: (stats.total_audio || 0) + (stats.total_pdf || 0) },
    { key: 'دروس', label: 'دروس', count: stats.duruz || 0 },
    { key: 'فرق', label: 'فرق', count: stats.firak || 0 },
    { key: 'كتاب', label: 'كتب', count: stats.total_pdf || 0 }
  ];
  
  const buttonsHTML = categories.map(category => {
    if (category.count === 0) {
      return ''; // Hide buttons with 0 count
    }
    
    const isActive = SabioPageState.activeCategory === category.key;
    return `
      <button class="category-btn ${isActive ? 'active' : ''}" 
              onclick="loadCategoryContentInternal('${category.key}')"
              data-category="${category.key}">
        ${category.label} (${category.count})
      </button>
    `;
  }).join('');
  
  buttonsContainer.innerHTML = buttonsHTML;
}

// Load category content
async function loadCategoryContentInternal(category) {
  if (!SabioPageState.activeSabio) return;
  
  try {
    setLoading(true);
    
    // Reset pagination only when category changes
    if (SabioPageState.activeCategory !== category) {
      console.log(`Category changed from "${SabioPageState.activeCategory}" to "${category}" - resetting pagination`);
      SabioPagination.currentPage = 1;
    } else {
      console.log(`Same category "${category}" - keeping current page: ${SabioPagination.currentPage}`);
    }
    
    SabioPageState.activeCategory = category;
    
    const response = await safeFetch(`./assets/php/sabio_loader.php?action=get_sabio_content&sabio=${encodeURIComponent(SabioPageState.activeSabio)}&category=${encodeURIComponent(category)}&page=${SabioPagination.currentPage}&limit=${SabioPagination.itemsPerPage}`);
    
    if (response && response.success) {
      SabioPageState.currentContent = response.data.items || [];
      SabioPagination.totalPages = response.data.pagination?.total_pages || 1;
      SabioPagination.totalItems = response.data.pagination?.total_items || 0;
      
      renderSabioContent();
      renderSabioPagination();
      renderCategoryButtons(); // Update active state
    } else {
      throw new Error('Failed to load category content');
    }
  } catch (error) {
    console.error('Error loading category content:', error);
    showError('خطأ في تحميل المحتوى');
  }
  setLoading(false);
}

// Render sabio content
function renderSabioContent() {
  const contentContainer = document.getElementById('sabioContent');
  if (!contentContainer) return;
  
  if (SabioPageState.isLoading) {
    contentContainer.innerHTML = `<div class="loader"><div class="spinner"></div></div>`;
    return;
  }
  
  if (SabioPageState.currentContent.length === 0) {
    contentContainer.innerHTML = `
      <div class="no-content">
        <div class="no-content-icon">📚</div>
        <h3>لا يوجد محتوى</h3>
        <p>لا يوجد محتوى في هذا القسم حالياً</p>
      </div>
    `;
    return;
  }
  
  const cardsHTML = SabioPageState.currentContent.map(item => renderSabioCard(item)).join('');
  
  contentContainer.innerHTML = `
    <div class="sabio-content-grid">
      ${cardsHTML}
    </div>
  `;
}

// Render sabio card
function renderSabioCard(item) {
  if (!item) return '';
  
  const isFavorited = AppState.favorites.includes(item.id?.toString());
  const favoriteClass = isFavorited ? 'favorited' : '';
  
  return `
    <div class="sabio-card" data-id="${item.id}">
      <div class="card-header">
        <div class="card-type">${item.type === 'audio' ? 'صوتي' : 'ملف'}</div>
        <button class="favorite-btn ${favoriteClass}" onclick="toggleSabioFavorite('${item.id}', this)" title="${isFavorited ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}">
          <svg class="w-5 h-5" fill="${isFavorited ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
        </button>
      </div>
      
      <div class="card-content">
        <h3 class="card-title">${item.title || item.name || 'بدون عنوان'}</h3>
        ${item.description ? `<p class="card-description">${item.description}</p>` : ''}
        
        <div class="card-meta">
          ${item.duration ? `<span class="meta-item">المدة: ${item.duration}</span>` : ''}
          ${item.size ? `<span class="meta-item">الحجم: ${item.size}</span>` : ''}
        </div>
      </div>
      
      <div class="card-actions">
        ${item.url ? `<a href="${item.url}" target="_blank" class="btn btn-primary">عرض</a>` : ''}
        ${item.download_url ? `<a href="${item.download_url}" class="btn btn-secondary">تحميل</a>` : ''}
      </div>
    </div>
  `;
}

// Toggle sabio favorite
function toggleSabioFavorite(itemId, buttonElement) {
  const item = SabioPageState.currentContent.find(i => i.id?.toString() === itemId?.toString());
  if (!item) return;
  
  // Create enhanced item object for favorites
  const enhancedItem = {
    id: item.id,
    title: item.title || item.name,
    description: item.description || `محتوى من ${SabioPageState.activeSabio}`,
    author: SabioPageState.activeSabio,
    date: item.date || new Date().toISOString().split('T')[0],
    views: item.views || 0,
    favorites: item.favorites || 0,
    download_link: item.url || item.download_url,
    type: item.type === 'audio' ? 'audios' : 'books',
    category: item.type === 'audio' ? 'audios' : 'books',
    sabio_name: SabioPageState.activeSabio,
    sabio_category: SabioPageState.activeCategory,
    source: 'sabio',
    // Audio-specific fields
    ...(item.type === 'audio' && {
      audio: item.url,
      duration: item.duration
    }),
    // PDF-specific fields
    ...(item.type !== 'audio' && {
      pages: item.pages || 0,
      format: 'PDF',
      publisher: item.publisher || ''
    })
  };
  
  const idStr = itemId.toString();
  const index = AppState.favorites.indexOf(idStr);
  
  let isFavorited;
  if (index === -1) {
    AppState.favorites.push(idStr);
    AppState.favoritesData[idStr] = enhancedItem;
    isFavorited = true;
    showNotification('تم إضافة العنصر إلى المفضلة', 'success');
  } else {
    AppState.favorites.splice(index, 1);
    delete AppState.favoritesData[idStr];
    isFavorited = false;
    showNotification('تم إزالة العنصر من المفضلة', 'success');
  }
  
  localStorage.setItem('islamicFavorites', JSON.stringify(AppState.favorites));
  localStorage.setItem('islamicFavoritesData', JSON.stringify(AppState.favoritesData));
  
  syncFavoritesCounter();
  
  // Update button appearance
  const svg = buttonElement.querySelector('svg');
  if (isFavorited) {
    buttonElement.classList.add('favorited');
    if (svg) svg.setAttribute('fill', 'currentColor');
    buttonElement.title = 'إزالة من المفضلة';
  } else {
    buttonElement.classList.remove('favorited');
    if (svg) svg.setAttribute('fill', 'none');
    buttonElement.title = 'إضافة للمفضلة';
  }
}

// Render sabio pagination
function renderSabioPagination() {
  const paginationContainer = document.getElementById('sabioPagination');
  if (!paginationContainer || SabioPagination.totalPages <= 1) {
    if (paginationContainer) paginationContainer.innerHTML = '';
    return;
  }
  
  let pagesHTML = '';
  const startPage = Math.max(1, SabioPagination.currentPage - 2);
  const endPage = Math.min(SabioPagination.totalPages, SabioPagination.currentPage + 2);
  
  for (let i = startPage; i <= endPage; i++) {
    pagesHTML += `
      <button onclick="loadSabioPage(${i})" class="pagination-number ${SabioPagination.currentPage === i ? 'active' : ''}">
        ${i}
      </button>
    `;
  }
  
  paginationContainer.innerHTML = `
    <div class="pagination-container">
      <div class="pagination-info">
        عرض ${SabioPagination.totalItems} عنصر في ${SabioPagination.totalPages} صفحة
      </div>
      <div class="pagination-controls">
        <button onclick="loadSabioPage(1)" ${SabioPagination.currentPage === 1 ? 'disabled' : ''} class="pagination-btn">
          الأولى
        </button>
        <button onclick="loadSabioPage(${SabioPagination.currentPage - 1})" ${SabioPagination.currentPage === 1 ? 'disabled' : ''} class="pagination-btn">
          السابقة
        </button>
        
        <div class="pagination-pages">
          ${pagesHTML}
        </div>

        <button onclick="loadSabioPage(${SabioPagination.currentPage + 1})" ${SabioPagination.currentPage === SabioPagination.totalPages ? 'disabled' : ''} class="pagination-btn">
          التالية
        </button>
        <button onclick="loadSabioPage(${SabioPagination.totalPages})" ${SabioPagination.currentPage === SabioPagination.totalPages ? 'disabled' : ''} class="pagination-btn">
          الأخيرة
        </button>
      </div>
    </div>
  `;
}

// Load sabio page
function loadSabioPage(pageNumber) {
  if (pageNumber < 1 || pageNumber > SabioPagination.totalPages) return;
  
  SabioPagination.currentPage = pageNumber;
  renderSabioContent(); // Re-render existing content
  renderSabioPagination(); // Update pagination
}

// Navigation functions for sabio.html
function navigateToPage(page) {
  AppState.activeNav = page;
  closeMobileMenu();
  
  // Save navigation state (opposite behavior from index.html)
  if (page === 'favorites' || page === 'categories') {
    console.log(`🚫 NOT saving navigation state for ${page} - will prevent reload return`);
    localStorage.removeItem('currentNavigationState');
  } else {
    localStorage.setItem('currentNavigationState', JSON.stringify({
      activeNav: page,
      timestamp: Date.now(),
      pageType: 'sabio'
    }));
  }
  
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.page === AppState.activeNav) {
      link.classList.add('active');
    }
  });
  
  renderNavigationContent();
}

// Render navigation content
function renderNavigationContent() {
  const mainContent = document.getElementById('mainContent');
  if (!mainContent) return;
  
  switch (AppState.activeNav) {
    case 'categories':
      renderCategoriesPage();
      break;
    case 'favorites':
      renderFavoritesPage();
      break;
    default:
      // Return to sabio content
      mainContent.style.display = 'none';
      document.getElementById('sabioHeader')?.style.setProperty('display', 'block');
      document.getElementById('categoryButtons')?.style.setProperty('display', 'flex');
      document.getElementById('sabioContent')?.style.setProperty('display', 'block');
      document.getElementById('sabioPagination')?.style.setProperty('display', 'block');
  }
}

// Render categories page
function renderCategoriesPage() {
  const mainContent = document.getElementById('mainContent');
  if (!mainContent) return;
  
  // Hide sabio-specific elements
  document.getElementById('sabioHeader')?.style.setProperty('display', 'none');
  document.getElementById('categoryButtons')?.style.setProperty('display', 'none');
  document.getElementById('sabioContent')?.style.setProperty('display', 'none');
  document.getElementById('sabioPagination')?.style.setProperty('display', 'none');
  
  mainContent.style.display = 'block';
  mainContent.innerHTML = `
    <div class="categories-page">
      <h2>التصنيفات</h2>
      <div class="categories-grid">
        <div class="category-card" onclick="filterByTypeAndNavigate('books')">
          <div class="category-icon">📚</div>
          <h3>الكتب</h3>
          <p>مجموعة من الكتب الإسلامية</p>
        </div>
        <div class="category-card" onclick="filterByTypeAndNavigate('articles')">
          <div class="category-icon">📄</div>
          <h3>المقالات</h3>
          <p>مقالات ودراسات إسلامية</p>
        </div>
        <div class="category-card" onclick="filterByTypeAndNavigate('fatwa')">
          <div class="category-icon">⚖️</div>
          <h3>الفتاوى</h3>
          <p>فتاوى العلماء المعتبرين</p>
        </div>
        <div class="category-card" onclick="filterByTypeAndNavigate('audios')">
          <div class="category-icon">🎵</div>
          <h3>الصوتيات</h3>
          <p>محاضرات ودروس صوتية</p>
        </div>
        <div class="category-card" onclick="filterByTypeAndNavigate('videos')">
          <div class="category-icon">🎥</div>
          <h3>المرئيات</h3>
          <p>محاضرات ودروس مرئية</p>
        </div>
      </div>
    </div>
  `;
}

// Filter by type and navigate to index.html
function filterByTypeAndNavigate(type) {
  localStorage.setItem('pendingFilter', type);
  window.location.href = 'index.html';
}

// Render favorites page
function renderFavoritesPage() {
  const mainContent = document.getElementById('mainContent');
  if (!mainContent) return;
  
  // Hide sabio-specific elements
  document.getElementById('sabioHeader')?.style.setProperty('display', 'none');
  document.getElementById('categoryButtons')?.style.setProperty('display', 'none');
  document.getElementById('sabioContent')?.style.setProperty('display', 'none');
  document.getElementById('sabioPagination')?.style.setProperty('display', 'none');
  
  mainContent.style.display = 'block';
  
  // Refresh AppState with localStorage data
  AppState.favorites = JSON.parse(localStorage.getItem('islamicFavorites') || '[]');
  AppState.favoritesData = JSON.parse(localStorage.getItem('islamicFavoritesData') || '{}');
  
  if (AppState.favorites.length === 0) {
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
  
  const favoriteItems = AppState.favorites.map(id => AppState.favoritesData[id]).filter(Boolean);
  const favoritesHTML = favoriteItems.map(item => renderFavoriteCard(item)).join('');
  
  mainContent.innerHTML = `
    <div class="favorites-page">
      <h2>المفضلة (${favoriteItems.length})</h2>
      <div class="content-grid">
        ${favoritesHTML}
      </div>
    </div>
  `;
}

// Render favorite card with animation removal
function renderFavoriteCard(item) {
  if (!item || !item.id) return '';
  
  return `
    <div class="content-card" data-id="${item.id}" id="favorite-card-${item.id}">
      <div class="card-header">
        <div class="card-type">${getTypeDisplayName(item.type || item.category)}</div>
        <button class="favorite-btn favorited" onclick="removeFavoriteWithAnimation('${item.id}')" title="إزالة من المفضلة">
          <svg class="w-5 h-5" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
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
        ${item.url || item.download_link ? `<a href="${item.url || item.download_link}" target="_blank" class="btn btn-primary">عرض</a>` : ''}
      </div>
    </div>
  `;
}

// Remove favorite with animation
function removeFavoriteWithAnimation(itemId) {
  const card = document.getElementById(`favorite-card-${itemId}`);
  if (card) {
    card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    card.style.opacity = '0';
    card.style.transform = 'translateX(-20px)';
    
    setTimeout(() => {
      // Remove from favorites
      const idStr = itemId.toString();
      const index = AppState.favorites.indexOf(idStr);
      if (index > -1) {
        AppState.favorites.splice(index, 1);
        delete AppState.favoritesData[idStr];
        
        localStorage.setItem('islamicFavorites', JSON.stringify(AppState.favorites));
        localStorage.setItem('islamicFavoritesData', JSON.stringify(AppState.favoritesData));
        
        syncFavoritesCounter();
        showNotification('تم إزالة العنصر من المفضلة', 'success');
      }
      
      // Remove card from DOM
      if (card.parentNode) {
        card.parentNode.removeChild(card);
      }
      
      // Check if no favorites left
      if (AppState.favorites.length === 0) {
        renderFavoritesPage();
      }
    }, 300);
  }
}

// Get type display name
function getTypeDisplayName(type) {
  const typeNames = {
    'books': 'الكتب',
    'articles': 'المقالات',
    'fatwa': 'الفتاوى',
    'audios': 'الصوتيات',
    'videos': 'المرئيات',
    'hadith': 'الأحاديث'
  };
  return typeNames[type] || type || 'محتوى';
}

// Initialize sabio page
document.addEventListener('DOMContentLoaded', function() {
  console.log('Sabio page initialized');
  
  // Check for saved navigation state and clear it (opposite behavior)
  const savedNavState = JSON.parse(localStorage.getItem('currentNavigationState') || 'null');
  if (savedNavState && (savedNavState.activeNav === 'categories' || savedNavState.activeNav === 'favorites')) {
    console.log('🔍 savedNavState:', savedNavState);
    console.log('🚫 Clearing navigation state - will return to main sabio page');
    localStorage.removeItem('currentNavigationState');
  }
  
  // Get sabio name from URL
  const urlParams = new URLSearchParams(window.location.search);
  const sabioName = urlParams.get('sabio');
  
  if (sabioName) {
    loadSabioContent(decodeURIComponent(sabioName));
  } else {
    showError('لم يتم تحديد العالم');
  }
});

// Global exports
window.SabioPageState = SabioPageState;
window.loadSabioContent = loadSabioContent;
window.loadCategoryContentInternal = loadCategoryContentInternal;
window.loadSabioPage = loadSabioPage;
window.toggleSabioFavorite = toggleSabioFavorite;
window.navigateToPage = navigateToPage;
window.filterByTypeAndNavigate = filterByTypeAndNavigate;
window.removeFavoriteWithAnimation = removeFavoriteWithAnimation;
