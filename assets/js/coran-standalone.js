// ==================== CORAN.HTML STANDALONE JAVASCRIPT ====================
// Complete standalone JavaScript for coran.html - No external dependencies

// Common utilities are loaded separately in HTML

// ==================== CORAN-SPECIFIC STATE ====================
const CoranState = {
  surahs: [],
  isLoading: false,
  activeNav: 'coran'
};

// ==================== CORAN-SPECIFIC FUNCTIONS ====================

// Load surah data from database via PHP API
async function loadSurahData() {
  try {
    const response = await fetch('assets/php/coran/cardsSurah.php');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.message || 'Error loading surah data');
    }
    
    CoranState.surahData = data;
    return data;
  } catch (error) {
    console.error('Error loading surah data:', error);
    // Fallback data
    CoranState.surahData = [
      { number: 1, name_ar: "الفاتحة", name_en: "Al-Fatiha", type: "مكية", ayahs_totales: 7, revelation_order: 5 },
      { number: 2, name_ar: "البقرة", name_en: "Al-Baqarah", type: "مدنية", ayahs_totales: 286, revelation_order: 87 }
    ];
    return CoranState.surahData;
  }
}

// Render surah grid
function renderSurahGrid() {
  const container = document.getElementById('container');
  if (!container) return;
  
  if (CoranState.surahs.length === 0) {
    container.innerHTML = `
      <div class="no-content">
        <h3>لا توجد سور متاحة</h3>
        <p>لم يتم العثور على بيانات السور</p>
      </div>
    `;
    return;
  }
  
  const surahsHTML = CoranState.surahs.map((surah, index) => renderSurahCard(surah, index)).join('');
  container.innerHTML = surahsHTML;
}

// Convert number to Arabic-Indic numerals
function toArabicNumerals(num) {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().replace(/[0-9]/g, (digit) => arabicNumerals[parseInt(digit)]);
}

// Format surah number with zero padding
function formatSurahNumber(num) {
  return num.toString().padStart(3, '0');
}

// Render surah card
function renderSurahCard(surah, index = 0) {
  if (!surah) return '';
  
  const arabicNumber = toArabicNumerals(surah.number);
  const arabicAyahCount = toArabicNumerals(surah.ayahs_totales);
  const formattedNumber = formatSurahNumber(surah.number);
  const animationDelay = (index * 0.1).toFixed(1);
  
  return `
    <a href="lectura.html?surah=${surah.number}" class="card fade-in" data-surah="${formattedNumber}" style="animation-delay: ${animationDelay}s; opacity: 1; pointer-events: auto;">
      <div class="number">
        <span>${arabicNumber}</span>
      </div>
      <div class="info">
        <div class="name_ar" style="text-align: center;">${surah.name_ar}</div>
        <div class="details" style="text-align: right;">
          <span class="type">${surah.type}</span>
          <span class="ayahs_totales">${arabicAyahCount} آية</span>
        </div>
      </div>
    </a>
  `;
}

// Open surah
function openSurah(surahNumber) {
  console.log(`Opening surah ${surahNumber}`);
  // Implementation for opening surah details
}

// Read surah - Navigate to lectura.html with surah parameter
function readSurah(surahNumber) {
  console.log(`Reading surah ${surahNumber}`);
  window.location.href = `lectura.html?surah=${surahNumber}`;
}

// Listen to surah
function listenSurah(surahNumber) {
  console.log(`Listening to surah ${surahNumber}`);
  // Implementation for listening to surah
}

// Navigation functions for coran.html
function navigateToPage(page) {
  AppState.activeNav = page;
  closeMobileMenu();
  
  // Save navigation state for categories and favorites (same as sabio.html behavior)
  if (page === 'categories' || page === 'favorites') {
    console.log(`💾 Saving navigation state for ${page} - will restore on reload`);
    localStorage.setItem('currentNavigationState', JSON.stringify({
      activeNav: page,
      timestamp: Date.now(),
      pageType: 'coran'
    }));
  } else {
    localStorage.removeItem('currentNavigationState');
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
  const hero = document.querySelector('.hero');
  const surahGrid = document.getElementById('surahGrid');
  
  if (!mainContent) return;
  
  switch (AppState.activeNav) {
    case 'categories':
      // Hide Coran elements
      if (hero) hero.style.display = 'none';
      if (surahGrid) surahGrid.style.display = 'none';
      
      mainContent.style.display = 'block';
      renderCategoriesPage();
      break;
      
    case 'favorites':
      // Hide Coran elements  
      if (hero) hero.style.display = 'none';
      if (surahGrid) surahGrid.style.display = 'none';
      
      mainContent.style.display = 'block';
      renderFavoritesPage();
      break;
      
    default:
      // Show Coran elements
      if (hero) hero.style.display = 'block';
      if (surahGrid) surahGrid.style.display = 'block';
      mainContent.style.display = 'none';
  }
}

// Render categories page
function renderCategoriesPage() {
  const mainContent = document.getElementById('mainContent');
  if (!mainContent) return;
  
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

// Render favorite card
function renderFavoriteCard(item) {
  if (!item || !item.id) return '';
  
  return `
    <div class="content-card" data-id="${item.id}">
      <div class="card-header">
        <div class="card-type">${getTypeDisplayName(item.type || item.category)}</div>
        <button class="favorite-btn favorited" onclick="removeFavorite('${item.id}')" title="إزالة من المفضلة">
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

// Remove favorite
function removeFavorite(itemId) {
  const idStr = itemId.toString();
  const index = AppState.favorites.indexOf(idStr);
  
  if (index > -1) {
    AppState.favorites.splice(index, 1);
    delete AppState.favoritesData[idStr];
    
    localStorage.setItem('islamicFavorites', JSON.stringify(AppState.favorites));
    localStorage.setItem('islamicFavoritesData', JSON.stringify(AppState.favoritesData));
    
    syncFavoritesCounter();
    showNotification('تم إزالة العنصر من المفضلة', 'success');
    
    // Re-render favorites page
    renderFavoritesPage();
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

// Initialize coran page
document.addEventListener('DOMContentLoaded', function() {
  console.log('Coran page initialized');
  
  // Sync favorites counter
  syncFavoritesCounter();
  
  // Check if user has seen the search mode indicator before
  const hasSeenIndicator = localStorage.getItem('coranSearchModeIndicatorSeen');
  const searchModeIndicator = document.getElementById('searchModeIndicator');
  
  if (hasSeenIndicator === 'true' && searchModeIndicator) {
    searchModeIndicator.style.display = 'none';
  }
  
  // Load surah data from database
  loadSurahData().then(data => {
    CoranState.surahData = data; // Store for search functionality
    renderSurahGrid();
  });

  // Check for saved navigation state and restore it
  const savedNavState = JSON.parse(localStorage.getItem('currentNavigationState') || 'null');
  if (savedNavState && savedNavState.pageType === 'coran' && (savedNavState.activeNav === 'categories' || savedNavState.activeNav === 'favorites')) {
    console.log('🔄 Restoring navigation state:', savedNavState.activeNav);
    
    setTimeout(() => {
      navigateToPage(savedNavState.activeNav);
    }, 500);
    return;
  }
  
  // Load Quran data for main page
  loadSurahData().then(data => {
    CoranState.surahs = data;
    CoranState.surahData = data; // Store for search functionality
    renderSurahGrid();
  });
  
  // Add real-time search functionality
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    // Add input event listener for real-time search
    searchInput.addEventListener('input', function(e) {
      const query = e.target.value.trim();
      
      // Debounce search to avoid too many API calls
      clearTimeout(searchInput.searchTimeout);
      searchInput.searchTimeout = setTimeout(() => {
        if (query.length === 0) {
          // Show all surahs when search is empty
          cleanupAyahSearchElements();
          restoreOriginalHeader();
          const container = document.getElementById('container');
          if (container) {
            container.className = 'surah-grid';
            container.style.cssText = '';
          }
          CoranState.surahs = CoranState.surahData || [];
          renderSurahGrid();
        } else if (query.length >= 1) {
          // Perform search when at least 1 character is typed
          performCoranSearch();
        }
      }, 300); // 300ms delay
    });
    
    // Also keep Enter key functionality
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(searchInput.searchTimeout);
        performCoranSearch();
      }
    });
  }
});

// Load ayahs for a specific surah from database via PHP API
async function loadAyahs(surahNumber) {
  try {
    const response = await fetch(`assets/php/coran/ayahs.php?surah=${surahNumber}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.message || 'Error loading ayahs');
    }
    
    return data || [];
  } catch (error) {
    console.error(`Error loading ayahs for surah ${surahNumber}:`, error);
    return [];
  }
}

// Search mode state
let currentSearchMode = 'surah'; // Default to surah mode

// Toggle search mode functionality
function toggleSearchMode() {
    console.log('🔄 toggleSearchMode called, current mode:', currentSearchMode);
    
    const toggleBtn = document.getElementById('modeToggleBtn');
    const toggleText = document.getElementById('modeToggleText');
    const searchInput = document.getElementById('searchInput');
    const toggleIcon = toggleBtn?.querySelector('svg path');
    const searchModeIndicator = document.getElementById('searchModeIndicator');
    
    if (!toggleBtn || !toggleText || !searchInput || !toggleIcon) {
        console.error('❌ Missing elements:', { toggleBtn, toggleText, searchInput, toggleIcon });
        return;
    }
    
    // Hide the search mode indicator after first click and save to localStorage
    if (searchModeIndicator) {
        searchModeIndicator.style.display = 'none';
        localStorage.setItem('coranSearchModeIndicatorSeen', 'true');
    }
    
    if (currentSearchMode === 'surah') {
        // Switch to ayah mode
        currentSearchMode = 'ayah';
        toggleText.textContent = 'البحث في الآيات';
        searchInput.placeholder = 'ابحث في آيات القرآن الكريم...';
        
        // Change icon to ayah icon
        toggleIcon.setAttribute('d', 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z');
        
        console.log('✅ Switched to Ayah search mode');
    } else {
        // Switch to surah mode
        currentSearchMode = 'surah';
        toggleText.textContent = 'البحث في السور';
        searchInput.placeholder = 'ابحث عن سورة بالاسم أو الرقم...';
        
        // Change icon to surah icon
        toggleIcon.setAttribute('d', 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253');
        
        console.log('✅ Switched to Surah search mode');
    }
    
    // Clear search input when switching modes
    searchInput.value = '';
    
    // Add visual feedback
    toggleBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        toggleBtn.style.transform = '';
    }, 150);
}

// Search functionality
function performCoranSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    
    if (!query) {
        console.log('⚠️ Empty search query - showing all surahs');
        // Clean up all ayah search related elements and styles
        cleanupAyahSearchElements();
        // Restore original header and show all surahs
        restoreOriginalHeader();
        // Reset container to show surah cards properly
        const container = document.getElementById('container');
        if (container) {
            container.className = 'surah-grid';
            container.style.cssText = '';
        }
        filteredSurahData = [...surahData];
        renderSurahCards();
        return;
    }
    
    console.log(`🔍 Performing ${currentSearchMode} search for: "${query}"`);
    
    if (currentSearchMode === 'surah') {
        // Restore original header for surah search
        restoreOriginalHeader();
        // Reset container to show surah cards properly
        const container = document.getElementById('container');
        if (container) {
            container.className = 'surah-grid';
            container.style.cssText = '';
        }
        searchSurah(query);
    } else {
        searchAyah(query);
    }
}

// Search in surahs with exact number matching
function searchSurah(query) {
    if (!CoranState.surahData) {
        console.log('⚠️ No surah data available');
        return;
    }
    
    const searchQuery = query.toLowerCase().trim();
    
    CoranState.surahs = CoranState.surahData.filter(surah => {
        // Exact number match only
        const surahNumberStr = surah.number.toString();
        if (/^\d+$/.test(query)) {
            return surahNumberStr === query;
        }
        
        // Name search (Arabic and English)
        const arabicMatch = surah.name_ar && surah.name_ar.includes(query);
        const englishMatch = surah.name_en && surah.name_en.toLowerCase().includes(searchQuery);
        
        return arabicMatch || englishMatch;
    });
    
    console.log(`Found ${CoranState.surahs.length} surahs matching "${query}"`);
    renderSurahGrid();
}

// Search in ayahs
async function searchAyah(query) {
    try {
        console.log(`🔍 Searching ayahs for: "${query}"`);
        
        const container = document.getElementById('container');
        if (container) {
            container.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>جاري البحث في الآيات...</p>
                </div>
            `;
        }
        
        const response = await fetch(`assets/php/coran/ayahs.php?search=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.message || 'Error searching ayahs');
        }
        
        console.log(`📄 Found ${data.length || 0} ayahs matching "${query}"`);
        renderAyahSearchResults(data, query);
        
    } catch (error) {
        console.error('Error searching ayahs:', error);
        const container = document.getElementById('container');
        if (container) {
            container.innerHTML = `
                <div class="no-content">
                    <h3>خطأ في البحث</h3>
                    <p>حدث خطأ أثناء البحث في الآيات: ${error.message}</p>
                    <button onclick="showAllSurahs()" class="btn btn-primary mt-4">
                        العودة لقائمة السور
                    </button>
                </div>
            `;
        }
    }
}

// Render ayah search results with improved styling to match the image
function renderAyahSearchResults(ayahs, searchQuery) {
    const container = document.getElementById('container');
    if (!container) return;
    
    // Replace the main page header with green search results header
    replaceMainHeaderWithSearchHeader(ayahs.length || 0, searchQuery);
    
    if (!ayahs || ayahs.length === 0) {
        // Don't show "no results" message, just empty container
        container.innerHTML = '';
        return;
    }
    
    
    const ayahsHTML = ayahs.map((ayah, index) => {
        const animationDelay = (index * 0.1).toFixed(1);
        const surahName = getSurahNameByNumber(ayah.surah_number);
        
        return `
            <div class="ayah-result-card" style="
                background: white;
                border-radius: 12px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                border: 1px solid #e5e7eb;
                animation: fadeInUp ${animationDelay}s ease-out forwards;
                opacity: 0;
                transform: translateY(20px);
                width: 100% !important;
                max-width: none !important;
                position: relative;
                display: block;
                box-sizing: border-box;
                margin-left: 0;
                margin-right: 0;
            ">
                <!-- Card Header Section -->
                <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 1rem; border-bottom: 1px solid #e5e7eb; margin-bottom: 1.5rem;">
                    <!-- Right side: Surah name and info -->
                    <div style="text-align: right;">
                        <div style="color: #10b981; font-size: 1rem; font-weight: 600; margin-bottom: 0.25rem;">
                            ${surahName}
                        </div>
                        <div style="color: #6b7280; font-size: 0.875rem;">
                            ${getSurahAyahCount(ayah.surah_number)} آية • ${getSurahType(ayah.surah_number)}
                        </div>
                    </div>
                    
                    <!-- Left side: Ayah number -->
                    <div style="background: #10b981; color: white; padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 1rem; font-weight: 600; min-width: 3rem; text-align: center;">
                        ${toArabicNumerals(ayah.number)}
                    </div>
                </div>
                
                <!-- Main content area -->
                <div>
                    <!-- Ayah text in Arabic -->
                    <div style="
                        text-align: right;
                        line-height: 2.2;
                        font-size: 1.25rem;
                        font-family: 'Amiri', serif;
                        color: #1f2937;
                        margin-bottom: 1rem;
                        padding: 0;
                    ">
                        ${highlightSearchTerm(ayah.text, searchQuery)}
                    </div>
                    
                    <!-- English Translation -->
                    <div style="
                        text-align: left;
                        line-height: 1.6;
                        font-size: 0.9rem;
                        color: #6b7280;
                        margin-bottom: 0.75rem;
                        padding: 1rem;
                        background: #f9fafb;
                        border-left: 3px solid #d1d5db;
                        font-style: italic;
                    ">
                        ${ayah.text_en || 'English translation not available'}
                    </div>
                    
                    <!-- Spanish Translation -->
                    <div style="
                        text-align: left;
                        line-height: 1.6;
                        font-size: 0.9rem;
                        color: #6b7280;
                        margin-bottom: 1.5rem;
                        padding: 1rem;
                        background: #f9fafb;
                        border-left: 3px solid #d1d5db;
                        font-style: italic;
                    ">
                        ${ayah.text_es || 'Traducción en español no disponible'}
                    </div>
                    
                    <!-- Action buttons -->
                    <div style="display: flex; align-items: center; margin-top: 1.5rem; gap: 0.75rem;">
                        <button onclick="goToSurah(${ayah.surah_number})" style="
                            background: #374151;
                            color: white;
                            border: none;
                            padding: 0.5rem 1.25rem;
                            border-radius: 6px;
                            font-size: 0.875rem;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            font-weight: 500;
                        " onmouseover="this.style.background='#111827'" onmouseout="this.style.background='#374151'">
                            الذهاب إلى السورة
                        </button>
                        <button onclick="goToAyah(${ayah.surah_number}, ${ayah.number})" style="
                            background: #10b981;
                            color: white;
                            border: none;
                            padding: 0.5rem 1.25rem;
                            border-radius: 6px;
                            font-size: 0.875rem;
                            cursor: pointer;
                            transition: all 0.3s ease;
                            font-weight: 500;
                        " onmouseover="this.style.background='#059669'" onmouseout="this.style.background='#10b981'">
                            الذهاب إلى الآية
                        </button>
                    </div>
                </div>
                
                <!-- Right border accent -->
                <div style="position: absolute; top: 0; right: 0; width: 4px; height: 100%; background: #10b981; border-radius: 0 12px 12px 0;"></div>
            </div>
        `;
    }).join('');
    
    // Remove any grid classes and ensure full width container
    container.className = '';
    container.style.cssText = 'width: 100% !important; max-width: none !important; display: block; padding: 0; margin: 0;';
    
    container.innerHTML = ayahsHTML;
    
    // Add CSS animation keyframes if not already added
    if (!document.getElementById('ayah-animations')) {
        const style = document.createElement('style');
        style.id = 'ayah-animations';
        style.textContent = `
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .ayah-result-card mark {
                background: #fef3c7;
                color: #92400e;
                padding: 0.125rem 0.25rem;
                border-radius: 3px;
                font-weight: 600;
            }
            
            .ayah-result-card {
                border-right: 4px solid #10b981 !important;
            }
        `;
        document.head.appendChild(style);
    }
}

// Highlight search term in text
function highlightSearchTerm(text, searchTerm) {
    if (!searchTerm || searchTerm.length < 2) return text;
    
    const normalizedText = normalizeArabicText(text);
    const normalizedSearchTerm = normalizeArabicText(searchTerm);
    
    // Find position in normalized text
    const searchIndex = normalizedText.indexOf(normalizedSearchTerm);
    if (searchIndex === -1) return text;
    
    // Map normalized position back to original text with harakat
    let originalStartIndex = 0;
    let normalizedCharCount = 0;
    
    // Find start position in original text
    for (let i = 0; i < text.length && normalizedCharCount < searchIndex; i++) {
        const char = text[i];
        // If character is not a diacritic/harakat/special mark, count it
        if (!/[\u064B-\u0652\u0670\u0640\u06D6-\u06ED\u06F0-\u06FF\u08A0-\u08FF\u200B-\u200F\u202A-\u202E]/.test(char)) {
            normalizedCharCount++;
        }
        if (normalizedCharCount < searchIndex) {
            originalStartIndex = i + 1;
        }
    }
    
    // Find end position in original text
    let originalEndIndex = originalStartIndex;
    let matchedNormalizedChars = 0;
    
    for (let i = originalStartIndex; i < text.length && matchedNormalizedChars < normalizedSearchTerm.length; i++) {
        const char = text[i];
        // If character is not a diacritic/harakat/special mark, count it
        if (!/[\u064B-\u0652\u0670\u0640\u06D6-\u06ED\u06F0-\u06FF\u08A0-\u08FF\u200B-\u200F\u202A-\u202E]/.test(char)) {
            matchedNormalizedChars++;
        }
        originalEndIndex = i + 1;
    }
    
    // Extract the matched portion from original text (preserving harakat)
    const matchedText = text.substring(originalStartIndex, originalEndIndex);
    
    // Replace with highlighted version
    return text.substring(0, originalStartIndex) + 
           `<mark style="background-color: #fef08a; color: #92400e; padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-weight: 500;">${matchedText}</mark>` + 
           text.substring(originalEndIndex);
}

// Simple Arabic text normalization for Quranic text search
function normalizeArabicText(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text
        // Remove all diacritics and special marks
        .replace(/[\u064B-\u0652]/g, '') // Remove Arabic diacritics
        .replace(/[\u0653-\u065F]/g, '') // Remove additional diacritics
        .replace(/[\u0670]/g, '') // Remove superscript alif
        .replace(/[\u06D6-\u06ED]/g, '') // Remove Quranic marks
        .replace(/[\u0640]/g, '') // Remove tatweel
        .replace(/[\u200B-\u200F\u202A-\u202E]/g, '') // Remove zero-width chars
        
        // Basic letter normalization
        .replace(/[آأإٱ]/g, 'ا') // All alif variations to basic alif
        .replace(/[ىئ]/g, 'ي') // Yaa variations
        .replace(/ة/g, 'ه') // Taa marboota to haa
        .replace(/ؤ/g, 'و') // Waw with hamza
        
        // Clean up spaces and case
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

// Get surah name by number
function getSurahNameByNumber(surahNumber) {
    const surahNames = {
        1: 'الفاتحة', 2: 'البقرة', 3: 'آل عمران', 4: 'النساء', 5: 'المائدة',
        6: 'الأنعام', 7: 'الأعراف', 8: 'الأنفال', 9: 'التوبة', 10: 'يونس',
        11: 'هود', 12: 'يوسف', 13: 'الرعد', 14: 'إبراهيم', 15: 'الحجر',
        16: 'النحل', 17: 'الإسراء', 18: 'الكهف', 19: 'مريم', 20: 'طه',
        21: 'الأنبياء', 22: 'الحج', 23: 'المؤمنون', 24: 'النور', 25: 'الفرقان',
        26: 'الشعراء', 27: 'النمل', 28: 'القصص', 29: 'العنكبوت', 30: 'الروم',
        31: 'لقمان', 32: 'السجدة', 33: 'الأحزاب', 34: 'سبأ', 35: 'فاطر',
        36: 'يس', 37: 'الصافات', 38: 'ص', 39: 'الزمر', 40: 'غافر',
        41: 'فصلت', 42: 'الشورى', 43: 'الزخرف', 44: 'الدخان', 45: 'الجاثية',
        46: 'الأحقاف', 47: 'محمد', 48: 'الفتح', 49: 'الحجرات', 50: 'ق',
        51: 'الذاريات', 52: 'الطور', 53: 'النجم', 54: 'القمر', 55: 'الرحمن',
        56: 'الواقعة', 57: 'الحديد', 58: 'المجادلة', 59: 'الحشر', 60: 'الممتحنة',
        61: 'الصف', 62: 'الجمعة', 63: 'المنافقون', 64: 'التغابن', 65: 'الطلاق',
        66: 'التحريم', 67: 'الملك', 68: 'القلم', 69: 'الحاقة', 70: 'المعارج',
        71: 'نوح', 72: 'الجن', 73: 'المزمل', 74: 'المدثر', 75: 'القيامة',
        76: 'الإنسان', 77: 'المرسلات', 78: 'النبأ', 79: 'النازعات', 80: 'عبس',
        81: 'التكوير', 82: 'الانفطار', 83: 'المطففين', 84: 'الانشقاق', 85: 'البروج',
        86: 'الطارق', 87: 'الأعلى', 88: 'الغاشية', 89: 'الفجر', 90: 'البلد',
        91: 'الشمس', 92: 'الليل', 93: 'الضحى', 94: 'الشرح', 95: 'التين',
        96: 'العلق', 97: 'القدر', 98: 'البينة', 99: 'الزلزلة', 100: 'العاديات',
        101: 'القارعة', 102: 'التكاثر', 103: 'العصر', 104: 'الهمزة', 105: 'الفيل',
        106: 'قريش', 107: 'الماعون', 108: 'الكوثر', 109: 'الكافرون', 110: 'النصر',
        111: 'المسد', 112: 'الإخلاص', 113: 'الفلق', 114: 'الناس'
    };
    
    return surahNames[surahNumber] || `سورة رقم ${surahNumber}`;
}

// Get surah type (Makki/Madani)
function getSurahType(surahNumber) {
    const makkiSurahs = [1,6,7,10,11,12,13,14,15,16,17,18,19,20,21,23,25,26,27,28,29,30,31,32,34,35,36,37,38,39,40,41,42,43,44,45,46,50,51,52,53,54,56,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,100,101,102,103,104,105,106,107,108,109,111,112,113,114];
    return makkiSurahs.includes(surahNumber) ? 'مكية' : 'مدنية';
}

// Get surah ayah count
function getSurahAyahCount(surahNumber) {
    const ayahCounts = {
        1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
        11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135,
        21: 112, 22: 78, 23: 118, 24: 64, 25: 77, 26: 227, 27: 93, 28: 88, 29: 69, 30: 60,
        31: 34, 32: 30, 33: 73, 34: 54, 35: 45, 36: 83, 37: 182, 38: 88, 39: 75, 40: 85,
        41: 54, 42: 53, 43: 89, 44: 59, 45: 37, 46: 35, 47: 38, 48: 29, 49: 18, 50: 45,
        51: 60, 52: 49, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29, 58: 22, 59: 24, 60: 13,
        61: 14, 62: 11, 63: 11, 64: 18, 65: 12, 66: 12, 67: 30, 68: 52, 69: 52, 70: 44,
        71: 28, 72: 28, 73: 20, 74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42,
        81: 29, 82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20,
        91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11,
        101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3,
        111: 5, 112: 4, 113: 5, 114: 6
    };
    return toArabicNumerals(ayahCounts[surahNumber] || 0);
}

// Replace main header with search results header
function replaceMainHeaderWithSearchHeader(resultCount, searchQuery) {
    const mainHeader = document.querySelector('.mb-8.text-center');
    if (mainHeader) {
        mainHeader.innerHTML = `
            <div class="search-results-header" style="text-align: center; margin-bottom: 2rem; padding: 2rem 1rem; background: #f8fffe; border-radius: 0;">
                <h2 style="margin: 0 0 0.75rem 0; font-size: 1.75rem; font-weight: 700; color: #1f2937;">نتائج البحث في الآيات</h2>
                <p style="margin: 0 0 1.5rem 0; color: #10b981; font-size: 1rem;">البحث عن "${searchQuery}" - وُجد ${toArabicNumerals(resultCount)} آية</p>
                <button onclick="showAllSurahs()" style="background: #374151; border: none; color: white; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; transition: 0.3s; font-size: 0.875rem; font-weight: 500;" onmouseover="this.style.background='#111827'" onmouseout="this.style.background='#374151'">
                    العودة لقائمة السور
                </button>
            </div>
        `;
    }
}

// Function to restore original header
function restoreOriginalHeader() {
    const mainHeader = document.querySelector('.mb-8.text-center');
    if (mainHeader) {
        mainHeader.innerHTML = `
            <h1 class="text-3xl font-bold text-gray-800 mb-2">فهرس السور</h1>
            <p class="text-gray-600">اختر السورة التي تريد قراءتها</p>
        `;
        // Remove any search-specific classes
        mainHeader.classList.remove('search-results-header');
    }
}

// Navigate to surah beginning
function goToSurah(surahNumber) {
    window.location.href = `lectura.html?surah=${surahNumber}`;
}

// Navigate to specific ayah with highlight
function goToAyah(surahNumber, ayahNumber) {
    window.location.href = `lectura.html?surah=${surahNumber}&ayah=${ayahNumber}&highlight=true`;
}

// Clean up all ayah search related elements and styles
function cleanupAyahSearchElements() {
    // Remove any ayah search result cards
    const ayahCards = document.querySelectorAll('.ayah-result-card');
    ayahCards.forEach(card => card.remove());
    
    // Remove ayah search animations CSS if exists
    const ayahAnimations = document.getElementById('ayah-animations');
    if (ayahAnimations) {
        ayahAnimations.remove();
    }
    
    // Remove any search results headers that might be lingering
    const searchHeaders = document.querySelectorAll('.search-results-header');
    searchHeaders.forEach(header => {
        if (header.parentElement !== document.querySelector('.mb-8.text-center')) {
            header.remove();
        }
    });
    
    // Remove any no-content divs
    const noContentDivs = document.querySelectorAll('.no-content');
    noContentDivs.forEach(div => div.remove());
    
    // Clear any inline styles that might have been applied to body or other elements
    document.body.style.removeProperty('overflow');
    
    // Reset any modified elements back to their original state
    const container = document.getElementById('container');
    if (container) {
        // Remove any ayah-specific classes or styles
        container.classList.remove('ayah-search-container');
        container.style.removeProperty('padding');
        container.style.removeProperty('margin');
    }
    
    // Force restore the original header immediately
    restoreOriginalHeader();
}

// Show all surahs function
function showAllSurahs() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
        clearTimeout(searchInput.searchTimeout);
    }
    
    // Clean up all ayah search related elements
    cleanupAyahSearchElements();
    
    // Reset to surah mode
    currentSearchMode = 'surah';
    const toggleText = document.getElementById('modeToggleText');
    if (toggleText) {
        toggleText.textContent = 'البحث في السور';
    }
    
    // Restore original header
    restoreOriginalHeader();
    
    // Reset container to show surah cards properly
    const container = document.getElementById('container');
    if (container) {
        container.className = 'surah-grid';
        container.style.cssText = '';
    }
    
    // Show all surahs
    CoranState.surahs = CoranState.surahData || [];
    renderSurahGrid();
}

// Global exports
window.CoranState = CoranState;
window.loadSurahData = loadSurahData;
window.loadAyahs = loadAyahs;
window.openSurah = openSurah;
window.renderSurahGrid = renderSurahGrid;
window.toggleSearchMode = toggleSearchMode;
window.performCoranSearch = performCoranSearch;
window.searchSurah = searchSurah;
window.searchAyah = searchAyah;
window.renderAyahSearchResults = renderAyahSearchResults;
window.showAllSurahs = showAllSurahs;
window.highlightSearchTerm = highlightSearchTerm;
window.goToSurah = goToSurah;
window.goToAyah = goToAyah;
window.cleanupAyahSearchElements = cleanupAyahSearchElements;
