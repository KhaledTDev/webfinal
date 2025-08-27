// Lectura Page JavaScript - Dedicated script for lectura.html only
// No dependencies on other JS files except common.js

// Global state for lectura page
let currentSurah = null;
let ayahsData = [];
let currentAyah = 1;
let isPlaying = false;
let currentAudio = null;

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Lectura page loaded - standalone version');
    
    // Get surah number from URL
    const urlParams = new URLSearchParams(window.location.search);
    const surahNumber = urlParams.get('surah');
    
    if (surahNumber) {
        loadSurahContent(parseInt(surahNumber));
    } else {
        showError('لم يتم تحديد رقم السورة');
    }
    
    // Initialize navigation
    initializeNavigation();
});

// Load surah content
async function loadSurahContent(surahNumber) {
    try {
        showLoading(true);
        
        // Load surah info
        const surahResponse = await fetchAPI(`assets/php/coran/cardsSurah.php`);
        const surahInfo = surahResponse.find(s => s.number === surahNumber);
        
        if (!surahInfo) {
            throw new Error('السورة غير موجودة');
        }
        
        currentSurah = surahInfo;
        
        // Load ayahs
        const ayahsResponse = await fetchAPI(`assets/php/coran/ayahs.php?surah=${surahNumber}`);
        ayahsData = ayahsResponse;
        
        renderSurahContent();
        
    } catch (error) {
        console.error('Error loading surah:', error);
        showError('حدث خطأ في تحميل السورة. يرجى المحاولة مرة أخرى.');
    } finally {
        showLoading(false);
    }
}

// Render surah content
function renderSurahContent() {
    if (!currentSurah || !ayahsData.length) return;
    
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;
    
    // Update page title
    document.title = `${currentSurah.name_ar} - القرآن الكريم - بيت الإسلام`;
    
    // Render content
    mainContent.innerHTML = `
        <div class="surah-header">
            <div class="surah-info">
                <h1 class="surah-name">${currentSurah.name_ar}</h1>
                <div class="surah-meta">
                    <span class="surah-number">السورة رقم ${currentSurah.number}</span>
                    <span class="surah-type">${currentSurah.type}</span>
                    <span class="ayahs-count">${currentSurah.ayahs_totales} آية</span>
                </div>
            </div>
            
            <div class="surah-controls">
                <button class="control-btn" onclick="toggleAudioPlayback()">
                    <svg class="play-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                    <span>تشغيل</span>
                </button>
                
                <button class="control-btn" onclick="goToSurahList()">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                    <span>العودة للفهرس</span>
                </button>
            </div>
        </div>
        
        <div class="ayahs-container">
            ${renderAyahs()}
        </div>
        
        <div class="navigation-controls">
            ${renderNavigationControls()}
        </div>
    `;
}

// Render ayahs
function renderAyahs() {
    return ayahsData.map((ayah, index) => `
        <div class="ayah-container" data-ayah="${ayah.number}">
            <div class="ayah-number">${convertToArabic(ayah.number)}</div>
            <div class="ayah-text">${ayah.text}</div>
            <div class="ayah-controls">
                <button class="ayah-btn" onclick="playAyah(${ayah.number})">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                </button>
                <button class="ayah-btn" onclick="copyAyah(${ayah.number})">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

// Render navigation controls
function renderNavigationControls() {
    const prevSurah = currentSurah.number > 1 ? currentSurah.number - 1 : null;
    const nextSurah = currentSurah.number < 114 ? currentSurah.number + 1 : null;
    
    return `
        <div class="surah-navigation">
            ${prevSurah ? `
                <button class="nav-btn prev" onclick="navigateToSurah(${prevSurah})">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                    </svg>
                    <span>السورة السابقة</span>
                </button>
            ` : ''}
            
            ${nextSurah ? `
                <button class="nav-btn next" onclick="navigateToSurah(${nextSurah})">
                    <span>السورة التالية</span>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                    </svg>
                </button>
            ` : ''}
        </div>
    `;
}

// Initialize navigation
function initializeNavigation() {
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
}

// Audio functions
function toggleAudioPlayback() {
    if (isPlaying) {
        pauseAudio();
    } else {
        playFullSurah();
    }
}

function playFullSurah() {
    // Implementation for playing full surah
    console.log('Playing full surah:', currentSurah.number);
    isPlaying = true;
    updatePlayButton();
}

function playAyah(ayahNumber) {
    // Implementation for playing specific ayah
    console.log('Playing ayah:', ayahNumber);
}

function pauseAudio() {
    if (currentAudio) {
        currentAudio.pause();
    }
    isPlaying = false;
    updatePlayButton();
}

function updatePlayButton() {
    const playBtn = document.querySelector('.surah-controls .control-btn');
    if (playBtn) {
        const icon = playBtn.querySelector('.play-icon path');
        const text = playBtn.querySelector('span');
        
        if (isPlaying) {
            icon.setAttribute('d', 'M6 19h4V5H6v14zm8-14v14h4V5h-4z'); // Pause icon
            text.textContent = 'إيقاف';
        } else {
            icon.setAttribute('d', 'M8 5v14l11-7z'); // Play icon
            text.textContent = 'تشغيل';
        }
    }
}

// Utility functions
function convertToArabic(num) {
    const arabicNumbers = {
        0: '٠', 1: '١', 2: '٢', 3: '٣', 4: '٤',
        5: '٥', 6: '٦', 7: '٧', 8: '٨', 9: '٩'
    };
    return num.toString().split('').map(digit => arabicNumbers[digit]).join('');
}

function copyAyah(ayahNumber) {
    const ayah = ayahsData.find(a => a.number === ayahNumber);
    if (ayah) {
        navigator.clipboard.writeText(ayah.text).then(() => {
            showNotification('تم نسخ الآية', 'success');
        }).catch(() => {
            showNotification('فشل في نسخ الآية', 'error');
        });
    }
}

function navigateToSurah(surahNumber) {
    window.location.href = `lectura.html?surah=${surahNumber}`;
}

function goToSurahList() {
    window.location.href = 'coran.html';
}

// Export functions to global scope
window.toggleAudioPlayback = toggleAudioPlayback;
window.playAyah = playAyah;
window.copyAyah = copyAyah;
window.navigateToSurah = navigateToSurah;
window.goToSurahList = goToSurahList;
