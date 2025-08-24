// Lectura Page JavaScript - Quran Reading Interface
// For displaying ayahs of selected surah - FIXED VERSION

// Global state for lectura page
let currentSurah = null;
let currentSurahData = null;
let currentLanguage = 'ar';
let currentFontSize = 'medium';
let currentTafsir = 'tafsir_muyassar_ar'; // Default tafsir
let availableTafsirs = [];
let targetAyah = null; // For navigation to specific ayah

// Get surah number from URL
function getSurahNumberFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return parseInt(urlParams.get('surah')) || 1;
}

// Get target ayah number from URL
function getTargetAyahFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const ayah = urlParams.get('ayah');
    return ayah ? parseInt(ayah) : null;
}

// Mobile menu functions
function toggleMobileMenu() {
    const overlay = document.querySelector('.mobile-menu-overlay');
    const menu = document.querySelector('.mobile-menu');
    const hamburgerLines = document.querySelectorAll('.hamburger-line');
    
    const isOpen = overlay.style.display === 'block';
    
    if (!isOpen) {
        overlay.style.display = 'block';
        menu.style.display = 'block';
        hamburgerLines.forEach(line => line.classList.add('open'));
        document.body.style.overflow = 'hidden';
    } else {
        closeMobileMenu();
    }
}

function closeMobileMenu() {
    const overlay = document.querySelector('.mobile-menu-overlay');
    const menu = document.querySelector('.mobile-menu');
    const hamburgerLines = document.querySelectorAll('.hamburger-line');
    
    overlay.style.display = 'none';
    menu.style.display = 'none';
    hamburgerLines.forEach(line => line.classList.remove('open'));
    document.body.style.overflow = '';
}

// Load surah data from database via PHP endpoint
async function loadSurah(surahNumber = null) {
    try {
        showLoading(true);
        hideError();
        
        const surahNum = surahNumber || currentSurah || getSurahNumberFromUrl();
        currentSurah = surahNum;
        
        // Get target ayah for navigation
        if (!targetAyah) {
            targetAyah = getTargetAyahFromUrl();
        }
        
        console.log(`Loading surah ${surahNum} from database...`);
        if (targetAyah) {
            console.log(`Will navigate to ayah ${targetAyah}`);
        }
        
        const response = await fetch(`assets/php/coran/ayahsSurah.php?surah=${surahNum}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Check if response contains error
        if (data.error) {
            throw new Error(data.message || 'Error desconocido del servidor');
        }
        
        currentSurahData = data;
        
        console.log(`Loaded surah ${data.name_ar} with ${data.total_ayahs} ayahs from database`);
        
        updateSurahHeader(data);
        renderAyahs(data.ayahs);
        updatePageTitle(data);
        updateNavigationButtons();
        
        // Navigate to specific ayah if specified
        if (targetAyah) {
            setTimeout(() => {
                scrollToAyah(targetAyah);
                highlightAyah(targetAyah);
                targetAyah = null; // Reset after use
            }, 500);
        }
        
    } catch (error) {
        console.error('Error loading surah:', error);
        showError();
    } finally {
        showLoading(false);
    }
}

// Update surah header information
function updateSurahHeader(surahData) {
    document.getElementById('surahNameAr').textContent = surahData.name_ar;
    document.getElementById('surahNameEn').textContent = surahData.name_en;
    document.getElementById('surahType').textContent = surahData.type;
    document.getElementById('ayahCount').textContent = `${surahData.total_ayahs} آية`;
}

// Update page title
function updatePageTitle(surahData) {
    const title = `${surahData.name_ar} - القرآن الكريم`;
    document.title = title;
    document.getElementById('pageTitle').textContent = title;
}

// Render ayahs - FIXED VERSION
function renderAyahs(ayahs) {
    const container = document.getElementById('ayahsContainer');
    const bismillah = document.getElementById('bismillah');
    
    if (!container) return;
    
    // Hide Bismillah for Al-Fatiha (1) and At-Tawbah (9)
    // Convert to number to handle both string and number comparisons
    const surahNum = parseInt(currentSurah);
    if (surahNum === 1 || surahNum === 9) {
        console.log('❌ Hiding Bismillah for surah', currentSurah, '(parsed:', surahNum, ')');
        bismillah.style.display = 'none';
    } else {
        console.log('✅ Showing Bismillah for surah', currentSurah, '(parsed:', surahNum, ')');
        bismillah.style.display = 'block';
    }
    
    // CLEAR CONTAINER COMPLETELY to prevent duplicates
    container.innerHTML = '';
    
    // Process ayahs - remove any ayah that starts with bismillah text to avoid duplication
    const processedAyahs = [];
    const seenAyahNumbers = new Set();
    
    ayahs.forEach(ayah => {
        // Skip if we already processed this ayah number
        if (seenAyahNumbers.has(ayah.ayah_number)) {
            console.warn(`Duplicate ayah number ${ayah.ayah_number} detected, skipping...`);
            return;
        }
        
        // Check if this ayah contains bismillah text
        const isBismillah = ayah.text_ar && ayah.text_ar.includes('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ');
        
        // Skip bismillah ayahs since we show bismillah separately
        if (!isBismillah) {
            processedAyahs.push(ayah);
            seenAyahNumbers.add(ayah.ayah_number);
        }
    });
    
    console.log(`Rendering ${processedAyahs.length} ayahs (filtered from ${ayahs.length} original ayahs)`);
    
    // Render each ayah once
    processedAyahs.forEach((ayah, index) => {
        const ayahElement = document.createElement('div');
        ayahElement.classList.add('ayah');
        ayahElement.style.animationDelay = `${index * 0.1}s`;
        ayahElement.dataset.ayahNumber = ayah.ayah_number;
        ayahElement.dataset.surahNumber = currentSurah;
        
        ayahElement.innerHTML = `
            <div class="ayah-number">${ayah.ayah_number}</div>
            <div class="ayah-text">
                <div class="arabic-text">${ayah.text_ar}</div>
                <div class="translation english ${currentLanguage === 'en' ? 'show' : ''}">${ayah.text_en || 'Translation not available'}</div>
                <div class="translation spanish ${currentLanguage === 'es' ? 'show' : ''}">${ayah.text_es || 'Traducción no disponible'}</div>
                <div class="tafsir-content ${currentLanguage === 'tafsir' ? 'show' : ''}" id="tafsir-${ayah.ayah_number}">
                    <div class="tafsir-text">اختر تفسيرًا لمشاهدة الشرح...</div>
                </div>
            </div>
            <div class="ayah-actions">
                <button class="action-btn tafsir-btn" onclick="toggleTafsir(${ayah.ayah_number})" title="عرض التفسير">
                    📖
                </button>
            </div>
        `;
        
        container.appendChild(ayahElement);
    });
    
    // Apply current font size
    applyFontSize(currentFontSize);
    
    // Update favorite button states
    updateAyahFavoriteButtons();
}

// Load available tafsirs
async function loadAvailableTafsirs() {
    try {
        const response = await fetch('assets/php/coran/tafsir.php?action=get_available_tafsirs');
        const data = await response.json();
        
        if (data.success) {
            availableTafsirs = data.tafsirs;
            renderTafsirSelector();
        }
    } catch (error) {
        console.error('Error loading tafsirs:', error);
    }
}

// Render tafsir selector
function renderTafsirSelector() {
    const tafsirControls = document.querySelector('.tafsir-controls');
    if (!tafsirControls) return;
    
    const selectHTML = `
        <select class="tafsir-select" onchange="selectTafsir(this.value)" id="tafsirSelect">
            ${availableTafsirs.map(tafsir => 
                `<option value="${tafsir.id}" ${currentTafsir === tafsir.id ? 'selected' : ''}>${tafsir.name}</option>`
            ).join('')}
        </select>
    `;
    
    tafsirControls.innerHTML = selectHTML;
}

// Select tafsir
function selectTafsir(tafsirId) {
    currentTafsir = tafsirId;
    
    // Update select value
    const tafsirSelect = document.getElementById('tafsirSelect');
    if (tafsirSelect) {
        tafsirSelect.value = tafsirId;
    }
    
    // Save to localStorage
    localStorage.setItem('selectedTafsir', tafsirId);
    
    // If tafsir is visible, reload current tafsir content
    if (currentLanguage === 'tafsir') {
        document.querySelectorAll('.ayah').forEach(ayahElement => {
            const ayahNumber = ayahElement.dataset.ayahNumber;
            if (ayahNumber) {
                loadTafsirForAyah(ayahNumber);
            }
        });
    }
}

// Toggle tafsir visibility
function toggleTafsir(ayahNumber = null) {
    if (currentLanguage === 'tafsir') {
        // Hide tafsir, show translations
        currentLanguage = localStorage.getItem('quranLanguage') || 'ar';
        document.querySelectorAll('.tafsir-content').forEach(content => {
            content.classList.remove('show');
        });
        updateLanguageButtons();
    } else {
        // Show tafsir
        currentLanguage = 'tafsir';
        document.querySelectorAll('.translation').forEach(translation => {
            translation.classList.remove('show');
        });
        document.querySelectorAll('.tafsir-content').forEach(content => {
            content.classList.add('show');
        });
        
        // Load tafsir for all ayahs
        document.querySelectorAll('.ayah').forEach(ayahElement => {
            const ayahNum = ayahElement.dataset.ayahNumber;
            if (ayahNum) {
                loadTafsirForAyah(ayahNum);
            }
        });
        
        updateLanguageButtons();
    }
}

// Load tafsir for specific ayah
async function loadTafsirForAyah(ayahNumber) {
    try {
        const ayahReference = `${currentSurah}:${ayahNumber}`;
        const response = await fetch(`assets/php/coran/tafsir.php?action=get_tafsir&table=${currentTafsir}&ayah=${ayahReference}`);
        const data = await response.json();
        
        const tafsirElement = document.getElementById(`tafsir-${ayahNumber}`);
        if (tafsirElement) {
            const tafsirText = tafsirElement.querySelector('.tafsir-text');
            if (data.success && data.text) {
                tafsirText.innerHTML = data.text;
            } else {
                tafsirText.textContent = 'لا يوجد تفسير متاح لهذه الآية في المصدر المحدد.';
            }
        }
    } catch (error) {
        console.error('Error loading tafsir:', error);
        const tafsirElement = document.getElementById(`tafsir-${ayahNumber}`);
        if (tafsirElement) {
            const tafsirText = tafsirElement.querySelector('.tafsir-text');
            tafsirText.textContent = 'حدث خطأ في تحميل التفسير.';
        }
    }
}

// Update language buttons to include tafsir
function updateLanguageButtons() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (currentLanguage === 'tafsir') {
        document.getElementById('tafsirBtn')?.classList.add('active');
    } else {
        document.getElementById(`${currentLanguage}Btn`)?.classList.add('active');
    }
}

// Navigation functions
function goBackToIndex() {
    window.location.href = 'coran.html';
}

function previousSurah() {
    if (currentSurah > 1) {
        const newSurah = currentSurah - 1;
        window.location.href = `lectura.html?surah=${newSurah}`;
    }
}

function nextSurah() {
    if (currentSurah < 114) {
        const newSurah = currentSurah + 1;
        window.location.href = `lectura.html?surah=${newSurah}`;
    }
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) {
        prevBtn.disabled = currentSurah <= 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentSurah >= 114;
    }
}

// Font size control
function increaseFontSize() {
    const sizes = ['small', 'medium', 'large', 'xlarge'];
    const currentIndex = sizes.indexOf(currentFontSize);
    if (currentIndex < sizes.length - 1) {
        currentFontSize = sizes[currentIndex + 1];
        applyFontSize(currentFontSize);
        updateFontSizeDisplay();
    }
}

function decreaseFontSize() {
    const sizes = ['small', 'medium', 'large', 'xlarge'];
    const currentIndex = sizes.indexOf(currentFontSize);
    if (currentIndex > 0) {
        currentFontSize = sizes[currentIndex - 1];
        applyFontSize(currentFontSize);
        updateFontSizeDisplay();
    }
}

function applyFontSize(size) {
    const body = document.body;
    
    // Remove all font size classes
    body.classList.remove('font-small', 'font-medium', 'font-large', 'font-xlarge');
    
    // Add current font size class
    body.classList.add(`font-${size}`);
    
    // Save to localStorage
    localStorage.setItem('quranFontSize', size);
}

function updateFontSizeDisplay() {
    const display = document.getElementById('fontSizeDisplay');
    const sizeNames = {
        'small': 'صغير',
        'medium': 'متوسط',
        'large': 'كبير',
        'xlarge': 'كبير جداً'
    };
    
    if (display) {
        display.textContent = sizeNames[currentFontSize] || 'متوسط';
    }
}

// Language control
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
        // Load tafsir for all visible ayahs
        document.querySelectorAll('.ayah').forEach(ayahElement => {
            const ayahNumber = ayahElement.dataset.ayahNumber;
            if (ayahNumber) {
                loadTafsirForAyah(ayahNumber);
            }
        });
    } else if (lang !== 'ar') {
        document.querySelectorAll(`.translation.${lang === 'en' ? 'english' : 'spanish'}`).forEach(translation => {
            translation.classList.add('show');
        });
    }
    
    // Save to localStorage
    localStorage.setItem('quranLanguage', lang);
}

// Show/hide loading state
function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    const mainContent = document.getElementById('ayahsContainer');
    
    if (loadingState) {
        loadingState.style.display = show ? 'block' : 'none';
    }
    
    if (mainContent) {
        mainContent.style.display = show ? 'none' : 'block';
    }
}

// Show/hide error state
function showError() {
    const errorState = document.getElementById('errorState');
    const loadingState = document.getElementById('loadingState');
    const mainContent = document.getElementById('ayahsContainer');
    
    if (errorState) {
        errorState.style.display = 'block';
    }
    
    if (loadingState) {
        loadingState.style.display = 'none';
    }
    
    if (mainContent) {
        mainContent.style.display = 'none';
    }
}

function hideError() {
    const errorState = document.getElementById('errorState');
    if (errorState) {
        errorState.style.display = 'none';
    }
}

// Load user preferences
function loadUserPreferences() {
    // Load font size preference
    const savedFontSize = localStorage.getItem('quranFontSize');
    if (savedFontSize && ['small', 'medium', 'large', 'xlarge'].includes(savedFontSize)) {
        currentFontSize = savedFontSize;
        applyFontSize(currentFontSize);
        updateFontSizeDisplay();
    }
    
    // Load language preference
    const savedLanguage = localStorage.getItem('quranLanguage');
    if (savedLanguage && ['ar', 'en', 'es', 'tafsir'].includes(savedLanguage)) {
        currentLanguage = savedLanguage;
        toggleLanguage(savedLanguage);
    }
    
    // Load tafsir preference
    const savedTafsir = localStorage.getItem('selectedTafsir');
    if (savedTafsir) {
        currentTafsir = savedTafsir;
    }
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeMobileMenu();
    } else if (e.key === 'ArrowLeft' && !e.ctrlKey) {
        nextSurah();
    } else if (e.key === 'ArrowRight' && !e.ctrlKey) {
        previousSurah();
    } else if (e.key === 'Home' && e.ctrlKey) {
        goBackToIndex();
    }
});

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Lectura page loaded - Fixed version');
    
    // Load user preferences
    loadUserPreferences();
    
    // Load available tafsirs
    loadAvailableTafsirs();
    
    // Load surah data
    loadSurah();
    
    // Check for saved navigation state and clear it (prevent reload return)
    const savedNavState = localStorage.getItem('lecturaNavigationState');
    if (savedNavState) {
        console.log(`🚫 Clearing navigation state: ${savedNavState} - will NOT restore`);
        localStorage.removeItem('lecturaNavigationState');
    }
    console.log('🔍 savedNavState: null - staying in main lectura page');
    
    // Setup event listeners
    const searchInput = document.getElementById('surahSearchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchAyahs(); // Call the search function
            }
        });
    }
});

// Search function for ayahs - NEW IMPLEMENTATION
function searchAyahs() {
    const searchInput = document.getElementById('surahSearchInput');
    if (!searchInput) {
        console.warn('Search input not found');
        return;
    }
    
    const query = searchInput.value.trim().toLowerCase();
    console.log(`🔍 Searching for: "${query}"`);
    
    if (!currentSurahData || !currentSurahData.ayahs) {
        console.warn('No surah data available for search');
        return;
    }
    
    if (!query) {
        // If empty search, show all ayahs
        renderAyahs(currentSurahData.ayahs);
        return;
    }
    
    // Filter ayahs based on search query
    const filteredAyahs = currentSurahData.ayahs.filter(ayah => {
        const arabicText = ayah.text_ar ? ayah.text_ar.toLowerCase() : '';
        const englishText = ayah.text_en ? ayah.text_en.toLowerCase() : '';
        const spanishText = ayah.text_es ? ayah.text_es.toLowerCase() : '';
        const numberMatch = ayah.ayah_number ? ayah.ayah_number.toString().includes(query) : false;
        
        return arabicText.includes(query) || 
               englishText.includes(query) || 
               spanishText.includes(query) ||
               numberMatch;
    });
    
    console.log(`📄 Found ${filteredAyahs.length} ayahs matching "${query}"`);
    
    if (filteredAyahs.length === 0) {
        // Show no results message
        const ayahsContainer = document.getElementById('ayahsContainer');
        if (ayahsContainer) {
            ayahsContainer.innerHTML = `
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">🔍</div>
                    <h3 class="text-xl font-bold text-gray-600 mb-2">لا توجد نتائج</h3>
                    <p class="text-gray-500 mb-4">لم يتم العثور على آيات تطابق البحث "${query}"</p>
                    <button onclick="clearAyahSearch()" class="btn btn-primary">
                        مسح البحث
                    </button>
                </div>
            `;
        }
    } else {
        renderAyahs(filteredAyahs);
    }
}

// Clear search function
function clearAyahSearch() {
    const searchInput = document.getElementById('surahSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    if (currentSurahData && currentSurahData.ayahs) {
        renderAyahs(currentSurahData.ayahs);
    }
}

// Make functions globally available
window.searchAyahs = searchAyahs;
window.clearAyahSearch = clearAyahSearch;

// Export functions for global access
window.loadSurah = loadSurah;
window.goBackToIndex = goBackToIndex;
window.previousSurah = previousSurah;
window.nextSurah = nextSurah;
window.increaseFontSize = increaseFontSize;
window.decreaseFontSize = decreaseFontSize;
window.toggleLanguage = toggleLanguage;
window.toggleTafsir = toggleTafsir;
window.selectTafsir = selectTafsir;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;

// Navigation function for lectura page
function navigateToPage(page) {
    console.log(`🧭 Navigating to: ${page}`);
    
    // Hide ALL lectura-specific elements when navigating away - FIXED VERSION
    const heroDiv = document.querySelector('.hero'); // Add generic hero div
    const coranHero = document.querySelector('.coran-hero'); // Add coran-hero
    const surahHeader = document.querySelector('.surah-header');
    const readingControls = document.querySelector('.reading-controls');
    const ayahsContainer = document.querySelector('.ayahs-container');
    const bismillah = document.querySelector('#bismillah');
    const mainContent = document.querySelector('#mainContent');
    const heroContent = document.querySelector('.hero-content'); // Add hero content
    const statsContainer = document.querySelector('.stats-container'); // Add stats container
    
    if (page !== 'home' && page !== 'lectura') {
        console.log('🙈 Hiding lectura-specific elements for navigation to:', page);
        
        // Hide all lectura page elements - IMPROVED
        if (heroDiv) {
            heroDiv.style.display = 'none';
            console.log('✅ Hidden hero div');
        }
        if (coranHero) {
            coranHero.style.display = 'none';
            console.log('✅ Hidden coran-hero');
        }
        if (heroContent) {
            heroContent.style.display = 'none';
            console.log('✅ Hidden hero-content');
        }
        if (statsContainer) {
            statsContainer.style.display = 'none';
            console.log('✅ Hidden stats-container');
        }
        if (surahHeader) {
            surahHeader.style.display = 'none';
            console.log('✅ Hidden surah-header');
        }
        if (readingControls) {
            readingControls.style.display = 'none';
            console.log('✅ Hidden reading-controls');
        }
        if (ayahsContainer) {
            ayahsContainer.style.display = 'none';
            console.log('✅ Hidden ayahs-container');
        }
        if (bismillah) {
            bismillah.style.display = 'none';
            console.log('✅ Hidden bismillah');
        }
        
        // Create or show content container for navigation
        let contentContainer = document.querySelector('#navigationContent');
        if (!contentContainer) {
            contentContainer = document.createElement('div');
            contentContainer.id = 'navigationContent';
            contentContainer.className = 'container mx-auto px-4 py-8';
            if (mainContent) {
                mainContent.appendChild(contentContainer);
            } else {
                document.body.appendChild(contentContainer);
            }
        }
        contentContainer.style.display = 'block';
    } else {
        // Show lectura elements when returning to home/lectura - IMPROVED
        if (heroDiv) {
            heroDiv.style.display = 'block';
            console.log('✅ Shown hero div');
        }
        if (coranHero) {
            coranHero.style.display = 'block';
            console.log('✅ Shown coran-hero');
        }
        if (heroContent) {
            heroContent.style.display = 'block';
            console.log('✅ Shown hero-content');
        }
        if (statsContainer) {
            statsContainer.style.display = 'block';
            console.log('✅ Shown stats-container');
        }
        if (surahHeader) surahHeader.style.display = 'block';
        if (readingControls) readingControls.style.display = 'block';
        if (ayahsContainer) ayahsContainer.style.display = 'block';
        const contentContainer = document.querySelector('#navigationContent');
        if (contentContainer) contentContainer.style.display = 'none';
    }
    
    // Do NOT save navigation state for reload persistence (opposite behavior from index.html)
    if (page === 'favorites' || page === 'categories') {
        console.log(`🚫 NOT saving navigation state for ${page} - will prevent reload return`);
        localStorage.removeItem('lecturaNavigationState'); // Ensure it's cleared
    }
    
    switch (page) {
        case 'home':
            window.location.href = 'index.html';
            break;
        case 'categories':
            // Use the global renderCategoriesPage function if available
            if (window.renderCategoriesPage) {
                window.renderCategoriesPage();
            } else {
                window.location.href = 'index.html#categories';
            }
            break;
        case 'favorites':
            // Use the global renderFavoritesPage function if available
            if (window.renderFavoritesPage) {
                window.renderFavoritesPage();
            } else {
                window.location.href = 'index.html#favorites';
            }
            break;
        default:
            console.log('Unknown page:', page);
    }
}

window.navigateToPage = navigateToPage;

// Ayah favorites functionality
function toggleAyahFavorite(surahNumber, ayahNumber) {
    console.log(`🔄 Toggling favorite for ayah ${surahNumber}:${ayahNumber}`);
    
    // Initialize AppState if needed
    if (!window.AppState) {
        window.AppState = { favorites: [] };
    }
    
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favorites');
    let favorites = [];
    if (savedFavorites) {
        try {
            favorites = JSON.parse(savedFavorites);
        } catch (e) {
            console.error('Error parsing favorites:', e);
        }
    }
    
    // Create ayah item object
    const ayahId = `ayah_${surahNumber}_${ayahNumber}`;
    const existingIndex = favorites.findIndex(item => item.id === ayahId);
    
    if (existingIndex > -1) {
        // Remove from favorites
        favorites.splice(existingIndex, 1);
        console.log(`❌ Removed ayah ${surahNumber}:${ayahNumber} from favorites`);
        
        // Show notification
        if (window.showNotification) {
            window.showNotification('تم حذف الآية من المفضلة', 'success');
        }
    } else {
        // Get ayah data
        const ayahElement = document.querySelector(`[data-ayah-number="${ayahNumber}"]`);
        if (!ayahElement) return;
        
        const arabicText = ayahElement.querySelector('.arabic-text')?.textContent || '';
        const englishText = ayahElement.querySelector('.translation.english')?.textContent || '';
        
        // Get surah name from header
        const surahNameAr = document.getElementById('surahNameAr')?.textContent || `سورة ${surahNumber}`;
        const surahNameEn = document.getElementById('surahNameEn')?.textContent || `Surah ${surahNumber}`;
        
        // Create ayah favorite item
        const ayahItem = {
            id: ayahId,
            type: 'ayah',
            category: 'quran',
            title: `${surahNameAr} - آية ${ayahNumber}`,
            description: arabicText.substring(0, 100) + (arabicText.length > 100 ? '...' : ''),
            content: arabicText,
            translation_en: englishText,
            surah_number: parseInt(surahNumber),
            ayah_number: parseInt(ayahNumber),
            surah_name_ar: surahNameAr,
            surah_name_en: surahNameEn,
            source: 'lectura.html',
            date_added: new Date().toISOString()
        };
        
        // Add to favorites
        favorites.push(ayahItem);
        console.log(`✅ Added ayah ${surahNumber}:${ayahNumber} to favorites`);
        
        // Show notification
        if (window.showNotification) {
            window.showNotification('تم إضافة الآية للمفضلة', 'success');
        }
    }
    
    // Save to localStorage and AppState
    localStorage.setItem('favorites', JSON.stringify(favorites));
    window.AppState.favorites = favorites;
    
    // Update button states
    updateAyahFavoriteButtons();
    
    // Trigger favorites updated event
    document.dispatchEvent(new CustomEvent('favoritesUpdated'));
    
    // Sync favorites counter if function exists
    if (window.syncFavoritesCounter) {
        window.syncFavoritesCounter();
    }
}

// Update favorite button states
function updateAyahFavoriteButtons() {
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favorites');
    let favorites = [];
    if (savedFavorites) {
        try {
            favorites = JSON.parse(savedFavorites);
        } catch (e) {
            console.error('Error parsing favorites:', e);
        }
    }
    
    // Update all ayah favorite buttons
    document.querySelectorAll('.ayah').forEach(ayahElement => {
        const ayahNumber = ayahElement.dataset.ayahNumber;
        const surahNumber = ayahElement.dataset.surahNumber;
        const ayahId = `ayah_${surahNumber}_${ayahNumber}`;
        
    });
}

// ==================== AYAH SEARCH FUNCTIONALITY ====================

// Global search state
let searchMatches = [];
let currentMatchIndex = 0;
let currentSearchQuery = '';

// Comprehensive Arabic text normalization function
function removeHarakat(text) {
    if (!text) return '';
    
    let normalized = text;
    
    // Remove all Arabic diacritical marks (harakat) - comprehensive range
    normalized = normalized.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u08D4-\u08E1\u08E3-\u08FF]/g, '');
    
    // Remove tatweel (kashida)
    normalized = normalized.replace(/\u0640/g, '');
    
    // Remove hamza above/below and other combining marks
    normalized = normalized.replace(/[\u0654\u0655\u0656\u0657\u0658\u0659\u065A\u065B\u065C\u065D\u065E]/g, '');
    
    // Normalize different forms of alif
    normalized = normalized.replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627'); // أ إ آ ٱ → ا
    
    // Normalize alif maksura and yaa
    normalized = normalized.replace(/[\u0649\u064A]/g, '\u064A'); // ى → ي
    
    // Normalize taa marbuta and haa
    normalized = normalized.replace(/\u0629/g, '\u0647'); // ة → ه
    
    // Normalize hamza forms
    normalized = normalized.replace(/[\u0621]/g, ''); // Remove standalone hamza
    
    // Normalize waw hamza
    normalized = normalized.replace(/\u0624/g, '\u0648'); // ؤ → و
    
    // Normalize yaa hamza
    normalized = normalized.replace(/\u0626/g, '\u064A'); // ئ → ي
    
    // Remove zero-width characters
    normalized = normalized.replace(/[\u200B\u200C\u200D\u200E\u200F\uFEFF]/g, '');
    
    // Remove extra spaces and normalize whitespace
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized;
}

// Advanced Arabic normalization with character mapping
function normalizeArabicAdvanced(text) {
    if (!text) return '';
    
    // Character mapping for comprehensive normalization
    const arabicNormalizationMap = {
        // Alif variants
        '\u0622': '\u0627', // آ → ا (alif with madda)
        '\u0623': '\u0627', // أ → ا (alif with hamza above)
        '\u0625': '\u0627', // إ → ا (alif with hamza below)
        '\u0671': '\u0627', // ٱ → ا (alif wasla)
        
        // Yaa variants
        '\u0649': '\u064A', // ى → ي (alif maksura)
        '\u0626': '\u064A', // ئ → ي (yaa with hamza)
        
        // Waw variants
        '\u0624': '\u0648', // ؤ → و (waw with hamza)
        
        // Taa variants
        '\u0629': '\u0647', // ة → ه (taa marbuta)
        
        // Remove hamza
        '\u0621': '', // ء → '' (standalone hamza)
        
        // Normalize lam-alif ligature
        '\uFEFB': '\u0644\u0627', // ﻻ → لا
        '\uFEFC': '\u0644\u0627', // ﻼ → لا
    };
    
    let normalized = text.toLowerCase();
    
    // Apply character mapping
    for (const [original, replacement] of Object.entries(arabicNormalizationMap)) {
        normalized = normalized.replace(new RegExp(original, 'g'), replacement);
    }
    
    // Remove harakat and diacritics
    normalized = removeHarakat(normalized);
    
    return normalized;
}

// Function to normalize Arabic text for search
function normalizeArabicForSearch(text) {
    if (!text) return '';
    return normalizeArabicAdvanced(text);
}

// Search ayahs within current surah
function searchAyahsInSurah(query) {
    if (!currentSurahData || !currentSurahData.ayahs) {
        console.warn('No surah data available for search');
        return;
    }
    
    const searchQuery = query.toLowerCase().trim();
    if (!searchQuery || searchQuery.length < 2) {
        clearAyahSearch();
        return;
    }
    
    console.log(`🔍 Searching ayahs in surah ${currentSurah} for: "${searchQuery}"`);
    
    // Filter ayahs based on search query
    const matchingAyahs = currentSurahData.ayahs.filter(ayah => {
        // Normalize Arabic text for search (remove harakat)
        const textAr = normalizeArabicForSearch(ayah.text_ar);
        const textEn = ayah.text_en ? ayah.text_en.toLowerCase() : '';
        const textEs = ayah.text_es ? ayah.text_es.toLowerCase() : '';
        
        // Normalize search query for Arabic
        const normalizedQuery = normalizeArabicForSearch(searchQuery);
        
        // Debug logging for all ayahs to find matches
        const isMatch = textAr.includes(normalizedQuery) || textEn.includes(searchQuery) || textEs.includes(searchQuery);
        if (isMatch || ayah.ayah_number <= 3) {
            console.log(`🔍 Debug Ayah ${ayah.ayah_number}:`);
            console.log(`   Original: "${ayah.text_ar}"`);
            console.log(`   Normalized: "${textAr}"`);
            console.log(`   Query: "${searchQuery}" → "${normalizedQuery}"`);
            console.log(`   Match: ${isMatch}`);
            if (isMatch) {
                console.log(`   ✅ FOUND MATCH in ayah ${ayah.ayah_number}`);
            }
        }
        
        // Search in Arabic (without harakat), English, and Spanish
        return textAr.includes(normalizedQuery) || 
               textEn.includes(searchQuery) || 
               textEs.includes(searchQuery);
    });
    
    console.log(`📄 Found ${matchingAyahs.length} ayahs matching "${searchQuery}"`);
    console.log(`🔍 Original query: "${searchQuery}"`);
    console.log(`🔍 Normalized query: "${normalizeArabicForSearch(searchQuery)}"`);
    
    // Show character codes for debugging
    console.log('🔍 Query character codes:', searchQuery.split('').map(c => `${c}(${c.charCodeAt(0).toString(16)})`).join(' '));
    console.log('🔍 Normalized character codes:', normalizeArabicForSearch(searchQuery).split('').map(c => `${c}(${c.charCodeAt(0).toString(16)})`).join(' '));
    
    // Update search state
    searchMatches = matchingAyahs;
    currentMatchIndex = 0;
    currentSearchQuery = searchQuery;
    
    if (matchingAyahs.length === 0) {
        showNoResultsMessage(searchQuery);
        return;
    }
    
    // Highlight matching ayahs and scroll to first match
    highlightSearchResults(matchingAyahs, searchQuery);
    scrollToCurrentMatch();
    showNavigationButton();
}

// Highlight search results in the ayahs
function highlightSearchResults(matchingAyahs, searchQuery) {
    // Clear previous highlights
    clearSearchHighlights();
    
    // Highlight matching ayahs
    matchingAyahs.forEach((ayah, index) => {
        const ayahElement = document.querySelector(`[data-ayah-number="${ayah.ayah_number}"]`);
        if (ayahElement) {
            ayahElement.classList.add('search-result-highlight');
            
            // Add current match class to first result
            if (index === 0) {
                ayahElement.classList.add('current-search-match');
            }
            
            // Highlight the search term in the text
            const arabicText = ayahElement.querySelector('.arabic-text');
            const englishText = ayahElement.querySelector('.translation.english');
            const spanishText = ayahElement.querySelector('.translation.spanish');
            
            if (arabicText) {
                arabicText.innerHTML = highlightSearchTerm(ayah.text_ar, searchQuery);
            }
            if (englishText) {
                englishText.innerHTML = highlightSearchTerm(ayah.text_en, searchQuery);
            }
            if (spanishText) {
                spanishText.innerHTML = highlightSearchTerm(ayah.text_es, searchQuery);
            }
        }
    });
}

// Show navigation button for multiple matches
function showNavigationButton() {
    if (searchMatches.length <= 1) {
        hideNavigationButton();
        return;
    }
    
    let navButton = document.getElementById('searchNavButton');
    
    if (!navButton) {
        navButton = document.createElement('div');
        navButton.id = 'searchNavButton';
        navButton.className = 'search-nav-button';
        document.body.appendChild(navButton);
    }
    
    navButton.innerHTML = `
        <div class="search-nav-content">
            <div class="search-nav-info">
                <span class="search-match-count">${currentMatchIndex + 1} / ${searchMatches.length}</span>
                <span class="search-query">"${currentSearchQuery}"</span>
            </div>
            <div class="search-nav-buttons">
                <button onclick="navigateToNextMatch()" class="nav-btn next-btn" title="النتيجة التالية">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                    </svg>
                </button>
                <button onclick="clearAyahSearch()" class="nav-btn close-btn" title="إغلاق البحث">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        </div>
    `;
    
    navButton.style.display = 'block';
}

// Show no results message
function showNoResultsMessage(searchQuery) {
    // Show temporary notification instead of panel
    if (window.showNotification) {
        window.showNotification(`لم يتم العثور على آيات تحتوي على "${searchQuery}" في هذه السورة`, 'info');
    } else {
        alert(`لم يتم العثور على آيات تحتوي على "${searchQuery}" في هذه السورة`);
    }
    
    // Clear search input
    const searchInput = document.getElementById('ayahSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }
}

// Clear ayah search
function clearAyahSearch() {
    // Clear search state
    searchMatches = [];
    currentMatchIndex = 0;
    currentSearchQuery = '';
    
    // Clear highlights
    clearSearchHighlights();
    
    // Restore original text without highlights
    if (currentSurahData && currentSurahData.ayahs) {
        currentSurahData.ayahs.forEach(ayah => {
            const ayahElement = document.querySelector(`[data-ayah-number="${ayah.ayah_number}"]`);
            if (ayahElement) {
                const arabicText = ayahElement.querySelector('.arabic-text');
                const englishText = ayahElement.querySelector('.translation.english');
                const spanishText = ayahElement.querySelector('.translation.spanish');
                
                if (arabicText) arabicText.innerHTML = ayah.text_ar;
                if (englishText) englishText.innerHTML = ayah.text_en || '';
                if (spanishText) spanishText.innerHTML = ayah.text_es || '';
            }
        });
    }
    
    // Hide navigation button
    hideNavigationButton();
    
    // Clear search input
    const searchInput = document.getElementById('ayahSearchInput');
    if (searchInput) {
        searchInput.value = '';
    }
}

// Clear search highlights
function clearSearchHighlights() {
    document.querySelectorAll('.search-result-highlight').forEach(el => {
        el.classList.remove('search-result-highlight');
    });
    document.querySelectorAll('.current-search-match').forEach(el => {
        el.classList.remove('current-search-match');
    });
}

// Hide navigation button
function hideNavigationButton() {
    const navButton = document.getElementById('searchNavButton');
    if (navButton) {
        navButton.style.display = 'none';
    }
}

// Navigate to next search match
function navigateToNextMatch() {
    if (searchMatches.length === 0) return;
    
    // Remove current match highlight
    document.querySelectorAll('.current-search-match').forEach(el => {
        el.classList.remove('current-search-match');
    });
    
    // Move to next match (cycle back to start if at end)
    currentMatchIndex = (currentMatchIndex + 1) % searchMatches.length;
    
    // Scroll to and highlight current match
    scrollToCurrentMatch();
    
    // Update navigation button
    updateNavigationButton();
}

// Scroll to current match
function scrollToCurrentMatch() {
    if (searchMatches.length === 0 || currentMatchIndex >= searchMatches.length) return;
    
    const currentMatch = searchMatches[currentMatchIndex];
    const ayahElement = document.querySelector(`[data-ayah-number="${currentMatch.ayah_number}"]`);
    
    if (ayahElement) {
        // Add current match highlight
        ayahElement.classList.add('current-search-match');
        
        // Scroll to ayah
        ayahElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
    }
}

// Update navigation button content
function updateNavigationButton() {
    const navButton = document.getElementById('searchNavButton');
    if (navButton) {
        const matchCount = navButton.querySelector('.search-match-count');
        if (matchCount) {
            matchCount.textContent = `${currentMatchIndex + 1} / ${searchMatches.length}`;
        }
    }
}

// Scroll to specific ayah
function scrollToAyah(ayahNumber) {
    const ayahElement = document.querySelector(`[data-ayah-number="${ayahNumber}"]`);
    if (ayahElement) {
        ayahElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        
        // Highlight temporarily
        ayahElement.classList.add('ayah-highlight');
        setTimeout(() => {
            ayahElement.classList.remove('ayah-highlight');
        }, 3000);
    }
}

// Highlight specific ayah (for navigation from search)
function highlightAyah(ayahNumber) {
    const ayahElement = document.querySelector(`[data-ayah-number="${ayahNumber}"]`);
    if (ayahElement) {
        ayahElement.classList.add('ayah-target-highlight');
        setTimeout(() => {
            ayahElement.classList.remove('ayah-target-highlight');
        }, 5000);
    }
}

// Highlight search term in text
function highlightSearchTerm(text, searchTerm) {
    if (!text || !searchTerm) return text || '';
    
    // For Arabic text, we need special handling for harakat
    const isArabicText = /[\u0600-\u06FF]/.test(text);
    
    if (isArabicText) {
        // Normalize both text and search term for Arabic
        const normalizedText = normalizeArabicForSearch(text);
        const normalizedSearchTerm = normalizeArabicForSearch(searchTerm);
        
        if (!normalizedSearchTerm) return text;
        
        // Find matches in normalized text
        const regex = new RegExp(`(${escapeRegExp(normalizedSearchTerm)})`, 'gi');
        let highlightedText = text;
        
        // For Arabic text, use a simpler approach that works better with normalization
        const matches = [];
        let match;
        const normalizedRegex = new RegExp(escapeRegExp(normalizedSearchTerm), 'gi');
        
        while ((match = normalizedRegex.exec(normalizedText)) !== null) {
            matches.push({
                start: match.index,
                end: match.index + match[0].length,
                text: match[0]
            });
        }
        
        // Apply highlights from end to start to preserve indices
        for (let i = matches.length - 1; i >= 0; i--) {
            const matchInfo = matches[i];
            // Find corresponding position in original text
            let originalStart = 0;
            let normalizedPos = 0;
            
            // Map normalized position back to original text position
            for (let j = 0; j < text.length && normalizedPos < matchInfo.start; j++) {
                const char = text[j];
                // Skip harakat, tatweel, and other diacritical marks
                if (!/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u0654\u0655]/.test(char)) {
                    // Check if this character would be normalized differently
                    const normalizedChar = removeHarakat(char);
                    if (normalizedChar === char || normalizedChar.length > 0) {
                        normalizedPos++;
                    }
                }
                originalStart = j + 1;
            }
            
            let originalEnd = originalStart;
            let matchLength = 0;
            
            for (let j = originalStart; j < text.length && matchLength < normalizedSearchTerm.length; j++) {
                const char = text[j];
                if (!/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u0654\u0655]/.test(char)) {
                    const normalizedChar = removeHarakat(char);
                    if (normalizedChar === char || normalizedChar.length > 0) {
                        matchLength++;
                    }
                }
                originalEnd = j + 1;
            }
            
            const originalMatch = text.substring(originalStart, originalEnd);
            highlightedText = highlightedText.substring(0, originalStart) + 
                            `<mark class="search-highlight">${originalMatch}</mark>` + 
                            highlightedText.substring(originalEnd);
        }
        
        return highlightedText;
    } else {
        // For non-Arabic text, use simple regex highlighting
        const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
        return text.replace(regex, '<mark class="search-highlight">$1</mark>');
    }
}

// Escape special regex characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Make functions globally available
window.toggleAyahFavorite = toggleAyahFavorite;
window.updateAyahFavoriteButtons = updateAyahFavoriteButtons;
window.searchAyahsInSurah = searchAyahsInSurah;
window.clearAyahSearch = clearAyahSearch;
window.scrollToAyah = scrollToAyah;
window.navigateToNextMatch = navigateToNextMatch;
window.clearSearchHighlights = clearSearchHighlights;
window.hideNavigationButton = hideNavigationButton;
window.removeHarakat = removeHarakat;
window.normalizeArabicForSearch = normalizeArabicForSearch;
window.normalizeArabicAdvanced = normalizeArabicAdvanced;

// ==================== SEARCH EVENT HANDLERS ====================

// Handle ayah search input
function handleAyahSearchInput(event) {
    if (event.key === 'Enter') {
        handleAyahSearch();
    } else {
        // Clear search if input is empty
        const query = event.target.value.trim();
        if (query === '') {
            clearAyahSearch();
        }
    }
}

// Handle ayah search button click
function handleAyahSearch() {
    const searchInput = document.getElementById('ayahSearchInput');
    if (searchInput) {
        const query = searchInput.value.trim();
        if (query.length >= 2) {
            searchAyahsInSurah(query);
        } else if (query === '') {
            clearAyahSearch();
        }
    }
}

// Make search handlers globally available
window.handleAyahSearchInput = handleAyahSearchInput;
window.handleAyahSearch = handleAyahSearch;