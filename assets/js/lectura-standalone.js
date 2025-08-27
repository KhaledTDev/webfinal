// ==================== LECTURA.HTML STANDALONE JAVASCRIPT ====================
// Complete standalone JavaScript for lectura.html - No external dependencies

// Common utilities are loaded separately in HTML

// ==================== LECTURA-SPECIFIC STATE ====================
const LecturaState = {
  currentBook: null,
  currentPage: 1,
  totalPages: 0,
  isLoading: false,
  activeNav: 'lectura',
  currentSurah: null
};

// ==================== LECTURA-SPECIFIC FUNCTIONS ====================

// Set loading state for lectura page
function setLoading(loading) {
  LecturaState.isLoading = loading;
  const loadingState = document.getElementById('loadingState');
  const ayahsContainer = document.getElementById('ayahsContainer');
  
  if (loadingState) {
    loadingState.style.display = loading ? 'block' : 'none';
  }
  
  if (ayahsContainer && loading) {
    ayahsContainer.style.display = 'none';
  } else if (ayahsContainer && !loading) {
    ayahsContainer.style.display = 'block';
  }
}

// Show error message
function showError(message) {
  const errorState = document.getElementById('errorState');
  if (errorState) {
    errorState.style.display = 'block';
    const errorMessage = errorState.querySelector('p');
    if (errorMessage) {
      errorMessage.textContent = message;
    }
  }
  
  // Hide loading state
  const loadingState = document.getElementById('loadingState');
  if (loadingState) {
    loadingState.style.display = 'none';
  }
}

// Load ayahs from database via PHP API
async function loadAyahs(surahNumber = null, page = 1, limit = 25) {
  try {
    setLoading(true);
    
    let url = 'assets/php/coran/ayahs.php';
    if (surahNumber) {
      url += `?surah=${surahNumber}`;
    } else {
      url += `?page=${page}&limit=${limit}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.message || 'Error loading ayahs');
    }
    
    return data || [];
  } catch (error) {
    console.error('Error loading ayahs:', error);
    showError('خطأ في تحميل الآيات');
    return [];
  } finally {
    setLoading(false);
  }
}

// Render ayahs reader
function renderAyahsReader(ayahs = []) {
  const ayahsContainer = document.getElementById('ayahsContainer');
  if (!ayahsContainer) return;
  
  if (ayahs.length === 0) {
    ayahsContainer.innerHTML = `
      <div class="no-content">
        <h3>لا توجد آيات متاحة</h3>
        <p>لم يتم العثور على آيات للعرض</p>
      </div>
    `;
    return;
  }
  
  const ayahsHTML = ayahs.map((ayah, index) => `
    <div class="ayah" data-ayah-number="${ayah.number || ayah.ayah_number}" data-surah-number="${ayah.surah_number}" style="animation-delay: ${index * 0.1}s;">
      <div class="ayah-number">${ayah.number || ayah.ayah_number}</div>
      <div class="ayah-text">
        <div class="arabic-text">${ayah.text || ayah.text_ar}</div>
        ${ayah.text_en ? `<div class="translation english">${ayah.text_en}</div>` : ''}
        ${ayah.text_es ? `<div class="translation spanish">${ayah.text_es}</div>` : ''}
        <div class="tafsir-content show" id="tafsir-${ayah.number || ayah.ayah_number}">
          <div class="tafsir-text">اختر تفسيرًا لمشاهدة الشرح...</div>
        </div>
      </div>
      <div class="ayah-actions">
        <button class="action-btn tafsir-btn" onclick="toggleTafsir(${ayah.number || ayah.ayah_number})" title="عرض التفسير">
          📖
        </button>
      </div>
    </div>
  `).join('');
  
  ayahsContainer.innerHTML = ayahsHTML;
  ayahsContainer.style.display = 'block';
}

// Load specific surah ayahs
async function loadSurahAyahs(surahNumber, targetAyah = null, shouldHighlight = false) {
  LecturaState.currentSurah = surahNumber;
  const ayahs = await loadAyahs(surahNumber);
  if (ayahs.length > 0) {
    // Load surah info first
    await loadSurahInfo(surahNumber);
    renderAyahsReader(ayahs);
    // Apply Arabic as default language after rendering
    setTimeout(() => {
      toggleLanguage('ar');
      
      // Handle scroll to specific ayah if provided
      if (targetAyah && targetAyah > 0) {
        setTimeout(() => {
          scrollToAyah(targetAyah, shouldHighlight);
        }, 300);
      }
    }, 100);
    // Update navigation buttons
    updateNavigationButtons();
  }
}

// Load surah information
async function loadSurahInfo(surahNumber) {
  try {
    const response = await fetch(`assets/php/coran/cardsSurah.php`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const surahs = await response.json();
    const surah = surahs.find(s => s.number === surahNumber);
    
    if (surah) {
      updateSurahHeader(surah);
    }
  } catch (error) {
    console.error('Error loading surah info:', error);
  }
}

// Update surah header information
function updateSurahHeader(surah) {
  const surahNameAr = document.getElementById('surahNameAr');
  const surahNameEn = document.getElementById('surahNameEn');
  const surahType = document.getElementById('surahType');
  const ayahCount = document.getElementById('ayahCount');
  
  if (surahNameAr) surahNameAr.textContent = surah.name_ar || surah.arabic_name;
  if (surahNameEn) surahNameEn.textContent = surah.name_en || surah.english_name;
  if (surahType) surahType.textContent = surah.type === 'meccan' ? 'مكية' : 'مدنية';
  if (ayahCount) ayahCount.textContent = `${surah.ayahs_totales || surah.verses_count} آية`;
}

// Search ayahs by text
async function searchAyahs(searchText) {
  try {
    const response = await fetch(`assets/php/coran/searchAyahs.php?q=${encodeURIComponent(searchText)}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.message || 'Error searching ayahs');
    }
    
    return data || [];
  } catch (error) {
    console.error('Error searching ayahs:', error);
    showError('خطأ في البحث في الآيات');
    return [];
  }
}

// Navigation functions for lectura.html
function navigateToPage(page) {
  AppState.activeNav = page;
  closeMobileMenu();
  
  // Save navigation state for categories and favorites
  if (page === 'categories' || page === 'favorites') {
    localStorage.setItem('currentNavigationState', JSON.stringify({
      activeNav: page,
      timestamp: Date.now(),
      pageType: 'lectura'
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
  const bookReader = document.getElementById('bookReader');
  
  if (!mainContent) return;
  
  switch (AppState.activeNav) {
    case 'categories':
      // Hide book reader
      if (bookReader) bookReader.style.display = 'none';
      
      mainContent.style.display = 'block';
      renderCategoriesPage();
      break;
      
    case 'favorites':
      // Hide book reader
      if (bookReader) bookReader.style.display = 'none';
      
      mainContent.style.display = 'block';
      renderFavoritesPage();
      break;
      
    default:
      // Show book reader
      if (bookReader) bookReader.style.display = 'block';
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
        <button class="favorite-btn favorited" onclick="alert('وظيفة إزالة المفضلة غير متاحة في هذه الصفحة')" title="إزالة من المفضلة">
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

// Initialize lectura page
document.addEventListener('DOMContentLoaded', function() {
  console.log('Lectura page initialized');
  
  // Set Arabic as default language
  currentLanguage = 'ar';
  
  // Initialize language buttons
  updateLanguageButtons();
  
  // Load available tafsirs
  loadAvailableTafsirs();
  
  // Initialize font size
  updateFontSizeDisplay();
  applyFontSize();
  
  // Check for saved navigation state and restore it
  const savedNavState = JSON.parse(localStorage.getItem('currentNavigationState') || 'null');
  if (savedNavState && savedNavState.pageType === 'lectura' && (savedNavState.activeNav === 'categories' || savedNavState.activeNav === 'favorites')) {
    console.log('🔄 Restoring navigation state:', savedNavState.activeNav);
    
    setTimeout(() => {
      navigateToPage(savedNavState.activeNav);
    }, 500);
    return;
  }
  
  // Get surah ID from URL or load default ayahs
  const urlParams = new URLSearchParams(window.location.search);
  const surahId = urlParams.get('surah');
  const ayahNumber = urlParams.get('ayah');
  const shouldHighlight = urlParams.get('highlight') === 'true';
  
  if (surahId) {
    loadSurahAyahs(parseInt(surahId), parseInt(ayahNumber), shouldHighlight);
  } else {
    // Show ayahs reader with default content
    const ayahsContainer = document.getElementById('ayahsContainer');
    if (ayahsContainer) {
      ayahsContainer.innerHTML = `
        <div class="ayahs-selection">
          <h2>قارئ الآيات</h2>
          <p>اختر سورة للقراءة من صفحة القرآن الكريم</p>
          <a href="coran.html" class="btn btn-primary">العودة للقرآن</a>
        </div>
      `;
      ayahsContainer.style.display = 'block';
    }
  }
});

// ==================== LANGUAGE AND TAFSIR FUNCTIONS ====================

// Global variables
let currentLanguage = localStorage.getItem('quranLanguage') || 'ar';
let currentTafsir = localStorage.getItem('selectedTafsir') || '';
let currentFontSize = parseInt(localStorage.getItem('quranFontSize')) || 16;
let currentSearchResults = [];
let currentSearchIndex = 0;

// Toggle language display
function toggleLanguage(lang) {
  currentLanguage = lang;
  
  // Update button states
  updateLanguageButtons();
  
  // Show/hide tafsir group
  const tafsirGroup = document.querySelector('.tafsir-group');
  if (tafsirGroup) {
    if (lang === 'tafsir') {
      tafsirGroup.classList.add('show');
    } else {
      tafsirGroup.classList.remove('show');
    }
  }
  
  // Show/hide translations and tafsir
  document.querySelectorAll('.translation, .tafsir-content').forEach(element => {
    element.classList.remove('show');
  });
  
  if (lang === 'tafsir') {
    document.querySelectorAll('.tafsir-content').forEach(content => {
      content.classList.add('show');
    });
    // Load tafsir for all ayahs when tafsir is selected
    loadTafsirForAllAyahs();
  } else if (lang !== 'ar') {
    document.querySelectorAll(`.translation.${lang === 'en' ? 'english' : 'spanish'}`).forEach(translation => {
      translation.classList.add('show');
    });
  }
  
  // Save to localStorage
  localStorage.setItem('quranLanguage', lang);
}

// Update language button states
function updateLanguageButtons() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const activeBtn = document.getElementById(currentLanguage === 'ar' ? 'arBtn' : 
                                          currentLanguage === 'en' ? 'enBtn' : 
                                          currentLanguage === 'es' ? 'esBtn' : 'tafsirBtn');
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
}

// Toggle tafsir visibility
function toggleTafsir(ayahNumber = null) {
  if (currentLanguage === 'tafsir') {
    // Hide tafsir, show translations
    currentLanguage = localStorage.getItem('quranLanguage') || 'ar';
    if (currentLanguage === 'tafsir') currentLanguage = 'ar';
    toggleLanguage(currentLanguage);
  } else {
    // Show tafsir
    toggleLanguage('tafsir');
  }
}

// Select tafsir source
function selectTafsir(tafsirSource) {
  // Store selected tafsir
  localStorage.setItem('selectedTafsir', tafsirSource);
  
  // If tafsir is currently active, reload tafsir content
  if (currentLanguage === 'tafsir') {
    loadTafsirForAllAyahs();
  }
}

// Load tafsir for all visible ayahs
function loadTafsirForAllAyahs() {
  document.querySelectorAll('.ayah').forEach(ayahElement => {
    const ayahNumber = ayahElement.dataset.ayahNumber;
    const surahNumber = ayahElement.dataset.surahNumber;
    if (ayahNumber && surahNumber) {
      loadTafsirForAyah(ayahNumber, surahNumber);
    }
  });
}

// Load tafsir for specific ayah
async function loadTafsirForAyah(ayahNumber, surahNumber) {
  const selectedTafsir = localStorage.getItem('selectedTafsir') || 'tafsir_muyassar_ar';
  const tafsirContent = document.getElementById(`tafsir-${ayahNumber}`);
  
  if (!tafsirContent) return;
  
  try {
    // Create ayah identifier for tafsir API
    const ayahId = `${surahNumber}:${ayahNumber}`;
    
    const response = await fetch(`assets/php/coran/tafsir.php?action=get_tafsir&table=${selectedTafsir}&ayah=${ayahId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const tafsirTextElement = tafsirContent.querySelector('.tafsir-text');
    
    if (data.success && tafsirTextElement) {
      tafsirTextElement.textContent = data.text;
    } else if (tafsirTextElement) {
      tafsirTextElement.textContent = `تفسير الآية ${ayahNumber} من سورة ${surahNumber} - ${selectedTafsir}`;
    }
  } catch (error) {
    console.error('Error loading tafsir:', error);
    const tafsirTextElement = tafsirContent.querySelector('.tafsir-text');
    if (tafsirTextElement) {
      tafsirTextElement.textContent = 'خطأ في تحميل التفسير';
    }
  }
}

// ==================== TAFSIR MANAGEMENT FUNCTIONS ====================

// Load available tafsirs from API
async function loadAvailableTafsirs() {
  try {
    const response = await fetch('assets/php/coran/tafsir.php?action=get_available_tafsirs');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.success && data.tafsirs) {
      populateTafsirSelect(data.tafsirs);
    }
  } catch (error) {
    console.error('Error loading available tafsirs:', error);
    // Fallback to default tafsirs
    populateTafsirSelect(getDefaultTafsirs());
  }
}

// Populate tafsir select dropdown
function populateTafsirSelect(tafsirs) {
  const tafsirControls = document.querySelector('.tafsir-controls');
  if (!tafsirControls) return;
  
  const selectedTafsir = localStorage.getItem('selectedTafsir') || 'tafsir_muyassar_ar';
  
  const selectHTML = `
    <select class="tafsir-select" onchange="selectTafsir(this.value)" id="tafsirSelect">
      ${tafsirs.map(tafsir => `
        <option value="${tafsir.id}" ${tafsir.id === selectedTafsir ? 'selected' : ''}>
          ${tafsir.name}
        </option>
      `).join('')}
    </select>
  `;
  
  tafsirControls.innerHTML = selectHTML;
}

// Get default tafsirs as fallback
function getDefaultTafsirs() {
  return [
    {id: 'tafseer_al_baghawi_ar', name: 'تفسير البغوي'},
    {id: 'tafseer_al_qurtubi_ar', name: 'تفسير القرطبي'},
    {id: 'tafseer_al_saddi_ar', name: 'تفسير السدي'},
    {id: 'tafseer_assamese_abridged_explanation_of_the_quran_as', name: 'Assamese Tafsir'},
    {id: 'tafseer_bosnian_abridged_explanation_of_the_quran_bs', name: 'Bosnian Tafsir'},
    {id: 'tafseer_chinese_abridged_explanation_of_the_quran_zh', name: 'Chinese Tafsir'},
    {id: 'tafseer_english_al_mukhtasar_en', name: 'English Al-Mukhtasar'},
    {id: 'tafseer_french_abridged_explanation_of_the_quran_fr', name: 'French Tafsir'},
    {id: 'tafseer_italian_al_mukhtasar_in_interpreting_the_noble_quran_it', name: 'Italian Al-Mukhtasar'},
    {id: 'tafseer_japanese_abridged_explanation_of_the_quran_ja', name: 'Japanese Tafsir'},
    {id: 'tafseer_persian_al_mukhtasar_in_interpreting_the_noble_quran_fa', name: 'Persian Al-Mukhtasar'},
    {id: 'tafseer_russian_al_mukhtasar_ru', name: 'Russian Al-Mukhtasar'},
    {id: 'tafseer_spanish_abridged_explanation_of_the_quran_es', name: 'Spanish Tafsir'},
    {id: 'tafseer_tanwir_al_miqbas_ar', name: 'تنوير المقباس'},
    {id: 'tafsir_al_tabari_ar', name: 'تفسير الطبري'},
    {id: 'tafsir_al_wasit_ar', name: 'التفسير الوسيط'},
    {id: 'tafsir_ibn_kathir_ar', name: 'تفسير ابن كثير'},
    {id: 'tafsir_muyassar_ar', name: 'التفسير الميسر'}
  ];
}

// ==================== FONT SIZE FUNCTIONS ====================

// Increase font size
function increaseFontSize() {
  if (currentFontSize < 24) {
    currentFontSize += 2;
    applyFontSize();
    updateFontSizeDisplay();
    localStorage.setItem('quranFontSize', currentFontSize.toString());
  }
}

// Decrease font size
function decreaseFontSize() {
  if (currentFontSize > 12) {
    currentFontSize -= 2;
    applyFontSize();
    updateFontSizeDisplay();
    localStorage.setItem('quranFontSize', currentFontSize.toString());
  }
}

// Apply font size to text elements
function applyFontSize() {
  const style = document.getElementById('dynamicFontStyle') || document.createElement('style');
  style.id = 'dynamicFontStyle';
  
  style.textContent = `
    .arabic-text {
      font-size: ${currentFontSize + 4}px !important;
    }
    .translation {
      font-size: ${currentFontSize}px !important;
    }
    .tafsir-text {
      font-size: ${currentFontSize}px !important;
    }
  `;
  
  if (!document.head.contains(style)) {
    document.head.appendChild(style);
  }
}

// Update font size display
function updateFontSizeDisplay() {
  const fontSizeDisplay = document.getElementById('fontSizeDisplay');
  if (fontSizeDisplay) {
    let sizeText = 'متوسط';
    if (currentFontSize <= 14) sizeText = 'صغير';
    else if (currentFontSize >= 20) sizeText = 'كبير';
    
    fontSizeDisplay.textContent = sizeText;
  }
}

// ==================== NAVIGATION FUNCTIONS ====================

// Navigate to previous surah
function previousSurah() {
  if (LecturaState.currentSurah && LecturaState.currentSurah > 1) {
    const prevSurahNumber = LecturaState.currentSurah - 1;
    window.location.href = `lectura.html?surah=${prevSurahNumber}`;
  }
}

// Navigate to next surah
function nextSurah() {
  if (LecturaState.currentSurah && LecturaState.currentSurah < 114) {
    const nextSurahNumber = LecturaState.currentSurah + 1;
    window.location.href = `lectura.html?surah=${nextSurahNumber}`;
  }
}

// Go back to coran.html
function goBackToIndex() {
  window.location.href = 'coran.html';
}

// Update navigation button states
function updateNavigationButtons() {
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  if (prevBtn) {
    prevBtn.disabled = LecturaState.currentSurah <= 1;
    prevBtn.style.opacity = LecturaState.currentSurah <= 1 ? '0.5' : '1';
  }
  
  if (nextBtn) {
    nextBtn.disabled = LecturaState.currentSurah >= 114;
    nextBtn.style.opacity = LecturaState.currentSurah >= 114 ? '0.5' : '1';
  }
}

// Scroll to specific ayah and highlight if needed
function scrollToAyah(ayahNumber, shouldHighlight = false) {
  const ayahElement = document.querySelector(`[data-ayah-number="${ayahNumber}"]`);
  if (ayahElement) {
    // Scroll to the ayah
    ayahElement.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
    
    // Highlight if requested
    if (shouldHighlight) {
      setTimeout(() => {
        ayahElement.style.backgroundColor = '#fef08a';
        ayahElement.style.transition = 'background-color 0.5s ease';
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          ayahElement.style.backgroundColor = '';
        }, 3000);
      }, 500);
    }
  }
}

// Global exports
window.LecturaState = LecturaState;
window.loadSurahAyahs = loadSurahAyahs;
window.loadAyahs = loadAyahs;
window.renderAyahsReader = renderAyahsReader;
window.toggleLanguage = toggleLanguage;
window.updateFontSize = updateFontSize;
window.searchInCurrentSurah = searchInCurrentSurah;
window.navigateSearchResults = navigateSearchResults;
window.clearSearch = clearSearch;
window.highlightSearchTerm = highlightSearchTerm;
window.scrollToAyah = scrollToAyah;
window.updateLanguageButtons = updateLanguageButtons;
window.selectTafsir = selectTafsir;
window.loadSurahInfo = loadSurahInfo;
window.updateSurahHeader = updateSurahHeader;
window.previousSurah = previousSurah;
window.nextSurah = nextSurah;
window.goBackToIndex = goBackToIndex;
window.updateNavigationButtons = updateNavigationButtons;
window.loadAvailableTafsirs = loadAvailableTafsirs;
window.populateTafsirSelect = populateTafsirSelect;
window.increaseFontSize = increaseFontSize;
window.decreaseFontSize = decreaseFontSize;
window.applyFontSize = applyFontSize;
window.updateFontSizeDisplay = updateFontSizeDisplay;

// ==================== SEARCH FUNCTIONS ====================

// Comprehensive Arabic text normalization for Quranic text search
function normalizeArabicText(text) {
  if (!text) return '';
  
  console.log('🔤 Original text:', text.substring(0, 100) + '...');
  
  let normalized = text
    // === STEP 1: Normalize Unicode characters BEFORE removing diacritics ===
    
    // Normalize all Alif variations to basic Alif (ا)
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627') // آ أ إ ٱ → ا
    
    // Normalize all Yaa variations to basic Yaa (ي)
    .replace(/[\u0626\u0649]/g, '\u064A') // ئ ى → ي
    
    // Normalize Taa Marboota to Haa (ة → ه)
    .replace(/\u0629/g, '\u0647') // ة → ه
    
    // Normalize Waw with Hamza to basic Waw (ؤ → و)
    .replace(/\u0624/g, '\u0648') // ؤ → و
    
    // === STEP 2: Remove all diacritics and special marks ===
    .replace(/[\u064B-\u0652]/g, '') // Remove all Arabic diacritics (fatha, damma, kasra, etc.)
    .replace(/[\u0653-\u0655]/g, '') // Remove additional diacritics
    .replace(/[\u0656-\u065F]/g, '') // Remove more diacritics
    .replace(/[\u0670]/g, '') // Remove superscript alif
    .replace(/[\u06D6-\u06ED]/g, '') // Remove Quranic annotation marks
    .replace(/[\u06F0-\u06FF]/g, '') // Remove extended Arabic-Indic digits
    .replace(/[\u08A0-\u08FF]/g, '') // Remove additional Arabic characters
    .replace(/[\u0640]/g, '') // Remove tatweel (kashida)
    
    // === STEP 3: Normalize ligatures and special forms ===
    .replace(/[\uFE80-\uFEFF]/g, function(match) {
      // Convert Arabic presentation forms to basic forms
      const code = match.charCodeAt(0);
      // Lam-Alif ligatures
      if (code >= 0xFEFB && code <= 0xFEFC) return 'لا'; // ﻻ ﻼ
      if (code >= 0xFEF7 && code <= 0xFEF8) return 'لأ'; // ﻷ ﻸ
      if (code >= 0xFEF9 && code <= 0xFEFA) return 'لإ'; // ﻹ ﻺ
      if (code >= 0xFEF5 && code <= 0xFEF6) return 'لآ'; // ﻵ ﻶ
      
      // Map other presentation forms back to basic letters
      if (code >= 0xFE8D && code <= 0xFE8E) return 'ا'; // Alif forms
      if (code >= 0xFE8F && code <= 0xFE92) return 'ب'; // Baa forms
      if (code >= 0xFE93 && code <= 0xFE94) return 'ة'; // Taa marboota forms
      if (code >= 0xFE95 && code <= 0xFE98) return 'ت'; // Taa forms
      if (code >= 0xFE99 && code <= 0xFE9C) return 'ث'; // Thaa forms
      if (code >= 0xFE9D && code <= 0xFEA0) return 'ج'; // Jeem forms
      if (code >= 0xFEA1 && code <= 0xFEA4) return 'ح'; // Haa forms
      if (code >= 0xFEA5 && code <= 0xFEA8) return 'خ'; // Khaa forms
      if (code >= 0xFEA9 && code <= 0xFEAA) return 'د'; // Dal forms
      if (code >= 0xFEAB && code <= 0xFEAC) return 'ذ'; // Thal forms
      if (code >= 0xFEAD && code <= 0xFEAE) return 'ر'; // Raa forms
      if (code >= 0xFEAF && code <= 0xFEB0) return 'ز'; // Zay forms
      if (code >= 0xFEB1 && code <= 0xFEB4) return 'س'; // Seen forms
      if (code >= 0xFEB5 && code <= 0xFEB8) return 'ش'; // Sheen forms
      if (code >= 0xFEB9 && code <= 0xFEBC) return 'ص'; // Sad forms
      if (code >= 0xFEBD && code <= 0xFEC0) return 'ض'; // Dad forms
      if (code >= 0xFEC1 && code <= 0xFEC4) return 'ط'; // Taa forms
      if (code >= 0xFEC5 && code <= 0xFEC8) return 'ظ'; // Zaa forms
      if (code >= 0xFEC9 && code <= 0xFECC) return 'ع'; // Ain forms
      if (code >= 0xFECD && code <= 0xFED0) return 'غ'; // Ghain forms
      if (code >= 0xFED1 && code <= 0xFED4) return 'ف'; // Faa forms
      if (code >= 0xFED5 && code <= 0xFED8) return 'ق'; // Qaf forms
      if (code >= 0xFED9 && code <= 0xFEDC) return 'ك'; // Kaf forms
      if (code >= 0xFEDD && code <= 0xFEE0) return 'ل'; // Lam forms
      if (code >= 0xFEE1 && code <= 0xFEE4) return 'م'; // Meem forms
      if (code >= 0xFEE5 && code <= 0xFEE8) return 'ن'; // Noon forms
      if (code >= 0xFEE9 && code <= 0xFEEC) return 'ه'; // Haa forms
      if (code >= 0xFEED && code <= 0xFEF0) return 'و'; // Waw forms
      if (code >= 0xFEF1 && code <= 0xFEF4) return 'ي'; // Yaa forms
      
      return match; // Return original if no mapping found
    })
    
    // === STEP 4: Normalize specific Quranic variations ===
    .replace(/ٱ/g, 'ا') // Alif wasla to regular alif
    .replace(/ۖ/g, '') // Remove small high seen
    .replace(/ۗ/g, '') // Remove small high qaf
    .replace(/ۘ/g, '') // Remove small high noon ghunna
    .replace(/ۙ/g, '') // Remove small high waw
    .replace(/ۚ/g, '') // Remove small high yaa
    .replace(/ۛ/g, '') // Remove small high noon
    .replace(/ۜ/g, '') // Remove small high rounded zero
    
    // === STEP 5: Normalize specific word variations ===
    .replace(/صراط/g, 'صرط') // Normalize صراط to صرط (common Quranic variation)
    
    // === STEP 5: Final cleanup ===
    .replace(/[\u200B-\u200F\u202A-\u202E]/g, '') // Remove zero-width and direction characters
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim() // Remove leading/trailing spaces
    .toLowerCase(); // Convert to lowercase for case-insensitive matching
    
  console.log('🔤 After complete normalization:', normalized.substring(0, 100) + '...');
  
  return normalized;
}

// Search within current surah ayahs
function searchInCurrentSurah(searchTerm) {
  console.log('🔍 Starting search for:', searchTerm);
  
  if (!searchTerm || searchTerm.length < 2) {
    console.log('❌ Search term too short or empty');
    clearSearchHighlights();
    return [];
  }

  const normalizedSearchTerm = normalizeArabicText(searchTerm);
  console.log('🔤 Normalized search term:', normalizedSearchTerm);
  
  const ayahElements = document.querySelectorAll('.ayah');
  console.log('📖 Total ayahs to search:', ayahElements.length);
  
  const results = [];

  // Create a combined text of all ayahs for cross-ayah searching
  const allAyahsText = Array.from(ayahElements).map(ayah => {
    const arabicTextElement = ayah.querySelector('.arabic-text');
    return arabicTextElement ? arabicTextElement.textContent : '';
  }).join(' ');
  
  const normalizedAllText = normalizeArabicText(allAyahsText);
  console.log('📝 Combined text length:', allAyahsText.length);
  console.log('🔤 Normalized combined text preview:', normalizedAllText.substring(0, 200) + '...');
  
  const foundInCombined = normalizedAllText.includes(normalizedSearchTerm);
  console.log('🎯 Search term found in combined text:', foundInCombined);
  
  // If search term is found in combined text, search individual ayahs
  if (foundInCombined) {
    ayahElements.forEach((ayahElement, index) => {
      const arabicTextElement = ayahElement.querySelector('.arabic-text');
      if (arabicTextElement) {
        const arabicText = arabicTextElement.textContent;
        const normalizedArabicText = normalizeArabicText(arabicText);
        
        // Check if the complete search term or all individual words are in this ayah
        const searchWords = normalizedSearchTerm.split(' ').filter(word => word.length > 1);
        console.log(`📋 Ayah ${index + 1} - Search words:`, searchWords);
        
        // First check if the complete phrase exists
        const hasCompletePhrase = normalizedArabicText.includes(normalizedSearchTerm);
        console.log(`📋 Ayah ${index + 1} - Complete phrase match:`, hasCompletePhrase);
        
        // If not, check if all individual words exist (for partial matches)
        const hasAllWords = searchWords.length > 0 && searchWords.every(word => {
          const wordFound = normalizedArabicText.includes(word);
          console.log(`  📋 Ayah ${index + 1} - Word "${word}" found:`, wordFound);
          return wordFound;
        });
        console.log(`📋 Ayah ${index + 1} - All words match:`, hasAllWords);
        
        if (hasCompletePhrase || hasAllWords) {
          console.log(`✅ Ayah ${index + 1} - MATCH FOUND!`);
          results.push({
            element: ayahElement,
            ayahNumber: ayahElement.getAttribute('data-ayah-number'),
            text: arabicText,
            index: index,
            normalizedText: normalizedArabicText,
            normalizedSearchTerm: normalizedSearchTerm
          });
        } else {
          console.log(`❌ Ayah ${index + 1} - No match`);
        }
      }
    });
  } else {
    console.log('❌ Search term not found in combined text - skipping individual ayah search');
  }

  console.log('🎯 Total search results found:', results.length);
  return results;
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
    originalEndIndex = i;
  }
  
  // Create highlighted text preserving harakat
  const before = text.substring(0, originalStartIndex);
  const match = text.substring(originalStartIndex, originalEndIndex + 1);
  const after = text.substring(originalEndIndex + 1);
  
  return before + `<span class="search-highlight">${match}</span>` + after;
}

// Clear all search highlights
function clearSearchHighlights() {
  // Remove search result classes
  document.querySelectorAll('.ayah').forEach(ayah => {
    ayah.classList.remove('search-result-highlight', 'current-search-match');
  });
  
  // Remove highlight spans
  document.querySelectorAll('.arabic-text').forEach(element => {
    const text = element.textContent;
    element.innerHTML = text;
  });
  
  // Hide search navigation
  hideSearchNavigation();
  
  currentSearchResults = [];
  currentSearchIndex = 0;
}

// Show search navigation UI
function showSearchNavigation(searchTerm, currentIndex, totalResults) {
  let searchNav = document.querySelector('.search-nav-content');
  
  if (!searchNav) {
    // Always create as floating element in bottom-right corner
    const body = document.body;
    if (body) {
      searchNav = document.createElement('div');
      searchNav.className = 'search-nav-content search-nav-floating';
      body.appendChild(searchNav);
    }
  }
  
  if (searchNav) {
    // Always use floating version design
    searchNav.innerHTML = `
      <div class="search-nav-info">
        <div class="search-match-count">${currentIndex + 1} / ${totalResults}</div>
        <div class="search-query">${searchTerm}</div>
      </div>
      <div class="search-nav-buttons">
        <button onclick="navigateToNextMatch()" class="nav-btn next-btn" title="النتيجة التالية">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </button>
        <button onclick="clearAyahSearch()" class="nav-btn close-btn" title="إغلاق البحث">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    `;
    searchNav.style.display = 'flex';
  }
}

// Hide search navigation UI
function hideSearchNavigation() {
  const searchNav = document.querySelector('.search-nav-content');
  if (searchNav) {
    searchNav.remove();
  }
}

// Update search navigation info
function updateSearchNavigation() {
  const searchInput = document.getElementById('ayahSearchInput');
  const searchTerm = searchInput ? searchInput.value.trim() : '';
  
  if (currentSearchResults.length > 0) {
    showSearchNavigation(searchTerm, currentSearchIndex, currentSearchResults.length);
  } else {
    hideSearchNavigation();
  }
}

// Handle ayah search
function handleAyahSearch() {
  console.log('🚀 handleAyahSearch called');
  
  const searchInput = document.getElementById('ayahSearchInput');
  if (!searchInput) {
    console.log('❌ Search input element not found');
    return;
  }
  
  const searchTerm = searchInput.value.trim();
  console.log('🔍 Search term from input:', searchTerm);
  
  if (!searchTerm || searchTerm.length < 2) {
    console.log('❌ Search term too short, clearing highlights');
    clearSearchHighlights();
    return;
  }
  
  // Clear previous highlights
  clearSearchHighlights();
  
  // Search in current surah
  currentSearchResults = searchInCurrentSurah(searchTerm);
  
  if (currentSearchResults.length === 0) {
    // No results found
    searchInput.style.borderColor = '#ef4444';
    setTimeout(() => {
      searchInput.style.borderColor = '';
    }, 2000);
    return;
  }
  
  // Highlight all results
  currentSearchResults.forEach((result, index) => {
    result.element.classList.add('search-result-highlight');
    
    // Highlight the search term in the text
    const arabicTextElement = result.element.querySelector('.arabic-text');
    if (arabicTextElement) {
      arabicTextElement.innerHTML = highlightSearchTerm(arabicTextElement.textContent, searchTerm);
    }
  });
  
  // Mark first result as current and scroll to it
  currentSearchIndex = 0;
  const firstResult = currentSearchResults[0];
  firstResult.element.classList.add('current-search-match');
  
  // Scroll to the result
  firstResult.element.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
  
  // Show search navigation if multiple results
  updateSearchNavigation();
  
  // Update search input style
  searchInput.style.borderColor = '#10b981';
}

// Handle search input keyup
function handleAyahSearchInput(event) {
  if (event.key === 'Enter') {
    handleAyahSearch();
  } else if (event.key === 'Escape') {
    clearAyahSearch();
  }
}

// Clear ayah search
function clearAyahSearch() {
  const searchInput = document.getElementById('ayahSearchInput');
  if (searchInput) {
    searchInput.value = '';
    searchInput.style.borderColor = '';
  }
  clearSearchHighlights();
}

// Navigate to next search result
function nextSearchResult() {
  if (currentSearchResults.length === 0) return;
  
  // Remove current highlight
  currentSearchResults[currentSearchIndex].element.classList.remove('current-search-match');
  
  // Move to next result
  currentSearchIndex = (currentSearchIndex + 1) % currentSearchResults.length;
  
  // Highlight new current result
  const currentResult = currentSearchResults[currentSearchIndex];
  currentResult.element.classList.add('current-search-match');
  
  // Scroll to result
  currentResult.element.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
  
  // Update navigation info
  updateSearchNavigation();
}

// Navigate to next match (alias for nextSearchResult)
function navigateToNextMatch() {
  nextSearchResult();
}

// Navigate to previous search result
function previousSearchResult() {
  if (currentSearchResults.length === 0) return;
  
  // Remove current highlight
  currentSearchResults[currentSearchIndex].element.classList.remove('current-search-match');
  
  // Move to previous result
  currentSearchIndex = currentSearchIndex === 0 ? currentSearchResults.length - 1 : currentSearchIndex - 1;
  
  // Highlight new current result
  const currentResult = currentSearchResults[currentSearchIndex];
  currentResult.element.classList.add('current-search-match');
  
  // Scroll to result
  currentResult.element.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
  
  // Update navigation info
  updateSearchNavigation();
}

// Export search functions to window
window.handleAyahSearch = handleAyahSearch;
window.handleAyahSearchInput = handleAyahSearchInput;
window.clearAyahSearch = clearAyahSearch;
window.nextSearchResult = nextSearchResult;
window.previousSearchResult = previousSearchResult;
window.navigateToNextMatch = navigateToNextMatch;
