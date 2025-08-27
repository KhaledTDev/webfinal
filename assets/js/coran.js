// Coran Page JavaScript - Cards Interface for Surah Selection
// Maintains consistency with existing project structure

// Global state for coran page
let surahData = [];
let filteredSurahData = [];
let currentSearchMode = 'surah'; // Default to surah mode

// Arabic number conversion
const arabicNumbers = {
    0: '٠', 1: '١', 2: '٢', 3: '٣', 4: '٤',
    5: '٥', 6: '٦', 7: '٧', 8: '٨', 9: '٩'
};

// Reverse mapping for Arabic to English conversion
const englishNumbers = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
};

function convertToArabic(num) {
    return num.toString().split('').map(digit => arabicNumbers[digit]).join('');
}

function convertArabicToEnglish(arabicNum) {
    return arabicNum.toString().split('').map(digit => englishNumbers[digit] || digit).join('');
}

// Toggle search mode functionality
function toggleSearchMode() {
    console.log('🔄 toggleSearchMode called, current mode:', currentSearchMode);
    
    const toggleBtn = document.getElementById('modeToggleBtn');
    const toggleText = document.getElementById('modeToggleText');
    const searchInput = document.getElementById('searchInput');
    const toggleIcon = toggleBtn?.querySelector('svg path');
    
    console.log('🔍 Elements found:', { 
        toggleBtn: !!toggleBtn, 
        toggleText: !!toggleText, 
        searchInput: !!searchInput, 
        toggleIcon: !!toggleIcon 
    });
    
    if (!toggleBtn || !toggleText || !searchInput || !toggleIcon) {
        console.error('❌ Missing elements:', { toggleBtn, toggleText, searchInput, toggleIcon });
        return;
    }
    
    console.log('🔄 Before toggle - Text:', toggleText.textContent, 'Mode:', currentSearchMode);
    
    if (currentSearchMode === 'surah') {
        // Switch to ayah mode
        currentSearchMode = 'ayah';
        toggleText.textContent = 'البحث في الآيات';
        searchInput.placeholder = 'ابحث في آيات القرآن الكريم...';
        
        // Change icon to ayah icon
        toggleIcon.setAttribute('d', 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z');
        
        console.log('✅ Switched to Ayah search mode');
        console.log('🔍 New text should be: البحث في الآيات');
        console.log('🔍 New placeholder should be: ابحث في آيات القرآن الكريم...');
    } else {
        // Switch to surah mode
        currentSearchMode = 'surah';
        toggleText.textContent = 'البحث في السور';
        searchInput.placeholder = 'ابحث عن سورة بالاسم أو الرقم...';
        
        // Change icon to surah icon
        toggleIcon.setAttribute('d', 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253');
        
        console.log('✅ Switched to Surah search mode');
        console.log('🔍 New text should be: البحث في السور');
        console.log('🔍 New placeholder should be: ابحث عن سورة بالاسم أو الرقم...');
    }
    
    console.log('🔍 After toggle - Text:', toggleText.textContent, 'Mode:', currentSearchMode);
    console.log('🔍 After toggle - Placeholder:', searchInput.placeholder);
    
    // Clear search input when switching modes
    searchInput.value = '';
    
    // Add visual feedback
    toggleBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        toggleBtn.style.transform = '';
    }, 150);
}

// Make function globally available
window.toggleSearchMode = toggleSearchMode;

// Test function to verify button functionality
function testToggle() {
    console.log('🧪 Testing toggle functionality...');
    const btn = document.getElementById('modeToggleBtn');
    if (btn) {
        console.log('✅ Button found, simulating click...');
        toggleSearchMode();
    } else {
        console.error('❌ Button not found!');
    }
}

// Make test function available
window.testToggle = testToggle;

// Initialize toggle functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, initializing toggle functionality...');
    
    // Verify elements exist
    const toggleBtn = document.getElementById('modeToggleBtn');
    const toggleText = document.getElementById('modeToggleText');
    const searchInput = document.getElementById('searchInput');
    
    if (toggleBtn && toggleText && searchInput) {
        console.log('✅ All toggle elements found');
        
        // Add click event listener as backup
        toggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🖱️ Button clicked via event listener');
            console.log('🔄 Current mode before toggle:', currentSearchMode);
            
            // Direct toggle implementation
            const toggleText = document.getElementById('modeToggleText');
            const searchInput = document.getElementById('searchInput');
            const toggleIcon = toggleBtn.querySelector('svg path');
            
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
            
            console.log('🔄 After toggle - Mode:', currentSearchMode);
            console.log('🔄 After toggle - Text:', toggleText.textContent);
            console.log('🔄 After toggle - Placeholder:', searchInput.placeholder);
            
            // Clear search input when switching modes
            searchInput.value = '';
            
            // Add visual feedback
            toggleBtn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                toggleBtn.style.transform = '';
            }, 150);
        });
        
        console.log('✅ Event listener added to toggle button');
    } else {
        console.error('❌ Missing toggle elements:', { toggleBtn, toggleText, searchInput });
    }
});

// Coran-specific search function
function performCoranSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    
    if (!query) {
        console.log('⚠️ Empty search query - showing all surahs');
        // Show all surahs when search is empty
        filteredSurahData = [...surahData];
        renderSurahCards();
        return;
    }
    
    console.log(`🔍 Performing ${currentSearchMode} search for: "${query}"`);
    
    if (currentSearchMode === 'surah') {
        searchSurah(query);
    } else {
        searchAyah(query);
    }
}

// Make function globally available
window.performCoranSearch = performCoranSearch;

// Search in surahs - IMPROVED VERSION with exact number matching
function searchSurah(query = null) {
    const searchQuery = query || document.getElementById('searchInput').value.trim();
    
    if (!searchQuery) {
        console.log('⚠️ Empty surah search query - showing all surahs');
        filteredSurahData = [...surahData];
        renderSurahCards();
        return;
    }
    
    console.log(`🔍 Searching surahs for: "${searchQuery}"`);
    
    // Convert Arabic numbers to English for number search
    const englishQuery = convertArabicToEnglish(searchQuery);
    const queryLower = searchQuery.toLowerCase();
    const queryTrimmed = searchQuery.trim();
    
    filteredSurahData = surahData.filter(surah => {
        // Search by number - support both Arabic and English numbers
        let numberMatch = false;
        const surahNumberStr = surah.number.toString();
        const surahNumberArabic = convertToArabic(surah.number);
        
        // EXACT match for numbers only - no partial matching
        if (/^\d+$/.test(englishQuery) || /^[٠-٩]+$/.test(queryTrimmed)) {
            numberMatch = surahNumberStr === englishQuery || 
                         surahNumberArabic === queryTrimmed ||
                         surahNumberStr === queryTrimmed;
        }
        
        // Search by name (Arabic) - improved flexible matching
        let arabicNameMatch = false;
        if (surah.name_ar) {
            // Remove diacritics and normalize for better matching
            const cleanArabicName = surah.name_ar
                .replace(/[\u064B-\u0652\u0670\u0640]/g, '') // Remove diacritics
                .replace(/أ|إ|آ/g, 'ا') // Normalize alif variations
                .replace(/ة/g, 'ه'); // Normalize taa marbuta
                
            const cleanSearchQuery = queryTrimmed
                .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
                .replace(/أ|إ|آ/g, 'ا')
                .replace(/ة/g, 'ه');
            
            // Check for exact match, partial match, and word boundaries
            arabicNameMatch = cleanArabicName.includes(cleanSearchQuery) ||
                             surah.name_ar.includes(queryTrimmed) ||
                             cleanArabicName === cleanSearchQuery ||
                             cleanArabicName.startsWith(cleanSearchQuery);
        }
        
        // Search by English name - case insensitive with partial matching
        let englishNameMatch = false;
        if (surah.name_en) {
            const englishNameLower = surah.name_en.toLowerCase();
            englishNameMatch = englishNameLower.includes(queryLower) ||
                              englishNameLower.startsWith(queryLower) ||
                              englishNameLower === queryLower;
        }
        
        // Search by common surah names and aliases
        let aliasMatch = false;
        const commonNames = {
            // Full names
            'الفاتحة': 1, 'فاتحة': 1, 'البقرة': 2, 'بقرة': 2, 'آل عمران': 3, 'عمران': 3,
            'النساء': 4, 'نساء': 4, 'المائدة': 5, 'مائدة': 5, 'الأنعام': 6, 'أنعام': 6,
            'الأعراف': 7, 'أعراف': 7, 'الأنفال': 8, 'أنفال': 8, 'التوبة': 9, 'توبة': 9,
            'يونس': 10, 'هود': 11, 'يوسف': 12, 'الرعد': 13, 'رعد': 13,
            'إبراهيم': 14, 'ابراهيم': 14, 'الحجر': 15, 'حجر': 15, 'النحل': 16, 'نحل': 16,
            'الإسراء': 17, 'إسراء': 17, 'اسراء': 17, 'الكهف': 18, 'كهف': 18,
            'مريم': 19, 'طه': 20, 'الأنبياء': 21, 'أنبياء': 21, 'انبياء': 21,
            'الحج': 22, 'حج': 22, 'المؤمنون': 23, 'مؤمنون': 23, 'النور': 24, 'نور': 24,
            'الفرقان': 25, 'فرقان': 25, 'الشعراء': 26, 'شعراء': 26, 'النمل': 27, 'نمل': 27,
            'القصص': 28, 'قصص': 28, 'العنكبوت': 29, 'عنكبوت': 29, 'الروم': 30, 'روم': 30,
            'لقمان': 31, 'السجدة': 32, 'سجدة': 32, 'الأحزاب': 33, 'أحزاب': 33, 'احزاب': 33,
            'سبأ': 34, 'سبا': 34, 'فاطر': 35, 'يس': 36, 'ياسين': 36,
            'الصافات': 37, 'صافات': 37, 'ص': 38, 'الزمر': 39, 'زمر': 39,
            'غافر': 40, 'المؤمن': 40, 'مؤمن': 40, 'فصلت': 41, 'الشورى': 42, 'شورى': 42,
            'الزخرف': 43, 'زخرف': 43, 'الدخان': 44, 'دخان': 44, 'الجاثية': 45, 'جاثية': 45,
            'الأحقاف': 46, 'أحقاف': 46, 'احقاف': 46, 'محمد': 47, 'الفتح': 48, 'فتح': 48,
            'الحجرات': 49, 'حجرات': 49, 'ق': 50, 'قاف': 50, 'الذاريات': 51, 'ذاريات': 51,
            'الطور': 52, 'طور': 52, 'النجم': 53, 'نجم': 53, 'القمر': 54, 'قمر': 54,
            'الرحمن': 55, 'رحمن': 55, 'الواقعة': 56, 'واقعة': 56, 'الحديد': 57, 'حديد': 57,
            'المجادلة': 58, 'مجادلة': 58, 'الحشر': 59, 'حشر': 59, 'الممتحنة': 60, 'ممتحنة': 60,
            'الصف': 61, 'صف': 61, 'الجمعة': 62, 'جمعة': 62, 'المنافقون': 63, 'منافقون': 63,
            'التغابن': 64, 'تغابن': 64, 'الطلاق': 65, 'طلاق': 65, 'التحريم': 66, 'تحريم': 66,
            'الملك': 67, 'ملك': 67, 'القلم': 68, 'قلم': 68, 'الحاقة': 69, 'حاقة': 69,
            'المعارج': 70, 'معارج': 70, 'نوح': 71, 'الجن': 72, 'جن': 72,
            'المزمل': 73, 'مزمل': 73, 'المدثر': 74, 'مدثر': 74, 'القيامة': 75, 'قيامة': 75,
            'الإنسان': 76, 'إنسان': 76, 'انسان': 76, 'الدهر': 76, 'دهر': 76,
            'المرسلات': 77, 'مرسلات': 77, 'النبأ': 78, 'نبأ': 78, 'النازعات': 79, 'نازعات': 79,
            'عبس': 80, 'التكوير': 81, 'تكوير': 81, 'الانفطار': 82, 'انفطار': 82,
            'المطففين': 83, 'مطففين': 83, 'الانشقاق': 84, 'انشقاق': 84, 'البروج': 85, 'بروج': 85,
            'الطارق': 86, 'طارق': 86, 'الأعلى': 87, 'أعلى': 87, 'اعلى': 87,
            'الغاشية': 88, 'غاشية': 88, 'الفجر': 89, 'فجر': 89, 'البلد': 90, 'بلد': 90,
            'الشمس': 91, 'شمس': 91, 'الليل': 92, 'ليل': 92, 'الضحى': 93, 'ضحى': 93,
            'الشرح': 94, 'شرح': 94, 'الانشراح': 94, 'انشراح': 94, 'التين': 95, 'تين': 95,
            'العلق': 96, 'علق': 96, 'اقرأ': 96, 'القدر': 97, 'قدر': 97,
            'البينة': 98, 'بينة': 98, 'الزلزلة': 99, 'زلزلة': 99, 'العاديات': 100, 'عاديات': 100,
            'القارعة': 101, 'قارعة': 101, 'التكاثر': 102, 'تكاثر': 102, 'العصر': 103, 'عصر': 103,
            'الهمزة': 104, 'همزة': 104, 'الفيل': 105, 'فيل': 105, 'قريش': 106,
            'الماعون': 107, 'ماعون': 107, 'الكوثر': 108, 'كوثر': 108, 'الكافرون': 109, 'كافرون': 109,
            'النصر': 110, 'نصر': 110, 'المسد': 111, 'مسد': 111, 'تبت': 111,
            'الإخلاص': 112, 'إخلاص': 112, 'اخلاص': 112, 'الفلق': 113, 'فلق': 113,
            'الناس': 114, 'ناس': 114,
            // English names
            'fatiha': 1, 'baqara': 2, 'baqarah': 2, 'imran': 3, 'nisa': 4, 'maidah': 5,
            'anam': 6, 'araf': 7, 'anfal': 8, 'tawba': 9, 'yunus': 10, 'hud': 11,
            'yusuf': 12, 'rad': 13, 'ibrahim': 14, 'hijr': 15, 'nahl': 16, 'isra': 17,
            'kahf': 18, 'maryam': 19, 'taha': 20, 'anbiya': 21, 'hajj': 22, 'muminun': 23,
            'nur': 24, 'furqan': 25, 'shuara': 26, 'naml': 27, 'qasas': 28, 'ankabut': 29,
            'rum': 30, 'luqman': 31, 'sajda': 32, 'ahzab': 33, 'saba': 34, 'fatir': 35,
            'yasin': 36, 'saffat': 37, 'sad': 38, 'zumar': 39, 'ghafir': 40, 'fussilat': 41,
            'shura': 42, 'zukhruf': 43, 'dukhan': 44, 'jathiya': 45, 'ahqaf': 46, 'muhammad': 47,
            'fath': 48, 'hujurat': 49, 'qaf': 50, 'dhariyat': 51, 'tur': 52, 'najm': 53,
            'qamar': 54, 'rahman': 55, 'waqia': 56, 'hadid': 57, 'mujadila': 58, 'hashr': 59,
            'mumtahana': 60, 'saff': 61, 'jumua': 62, 'munafiqun': 63, 'taghabun': 64, 'talaq': 65,
            'tahrim': 66, 'mulk': 67, 'qalam': 68, 'haqqa': 69, 'maarij': 70, 'nuh': 71,
            'jinn': 72, 'muzzammil': 73, 'muddaththir': 74, 'qiyama': 75, 'insan': 76, 'mursalat': 77,
            'naba': 78, 'naziat': 79, 'abasa': 80, 'takwir': 81, 'infitar': 82, 'mutaffifin': 83,
            'inshiqaq': 84, 'buruj': 85, 'tariq': 86, 'ala': 87, 'ghashiya': 88, 'fajr': 89,
            'balad': 90, 'shams': 91, 'layl': 92, 'duha': 93, 'sharh': 94, 'tin': 95,
            'alaq': 96, 'qadr': 97, 'bayyina': 98, 'zalzala': 99, 'adiyat': 100, 'qaria': 101,
            'takathur': 102, 'asr': 103, 'humaza': 104, 'fil': 105, 'quraysh': 106, 'maun': 107,
            'kawthar': 108, 'kafirun': 109, 'nasr': 110, 'masad': 111, 'ikhlas': 112, 'falaq': 113,
            'nas': 114
        };
        
        // Check common names and aliases
        for (const [alias, number] of Object.entries(commonNames)) {
            if ((alias === queryTrimmed || alias === queryLower) && number === surah.number) {
                aliasMatch = true;
                break;
            }
            // Partial matching for longer names
            if (alias.length > 3 && (alias.includes(queryTrimmed) || alias.includes(queryLower)) && number === surah.number) {
                aliasMatch = true;
                break;
            }
        }
        
        const result = numberMatch || arabicNameMatch || englishNameMatch || aliasMatch;
        
        if (result) {
            console.log(`✅ Match found: Surah ${surah.number} (${surah.name_ar}) - number:${numberMatch}, arabic:${arabicNameMatch}, english:${englishNameMatch}, alias:${aliasMatch}`);
        }
        
        return result;
    });
    
    console.log(`📊 Found ${filteredSurahData.length} matching surahs for "${searchQuery}"`);
    renderSurahCards();
    
    // Show results message if no matches
    if (filteredSurahData.length === 0) {
        const container = document.getElementById('container');
        if (container) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="text-6xl mb-4">🔍</div>
                    <h3 class="text-xl font-bold text-gray-600 mb-2">لا توجد نتائج</h3>
                    <p class="text-gray-500 mb-4">لم يتم العثور على سور تطابق البحث "${searchQuery}"</p>
                    <button onclick="clearSearch()" class="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                        مسح البحث
                    </button>
                </div>
            `;
        }
    }
}

// Search in ayahs - FIXED API IMPLEMENTATION
async function searchAyah(query = null) {
    const searchQuery = query || document.getElementById('searchInput').value.trim();
    
    if (!searchQuery) {
        console.log('⚠️ Empty ayah search query');
        return;
    }
    
    console.log(`🔍 Searching ayahs for: "${searchQuery}"`);
    
    try {
        showLoading(true);
        
        // Use the ayahs.php endpoint with search parameter
        const response = await fetch(`assets/php/coran/ayahs.php?search=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.message || 'Error searching ayahs');
        }
        
        console.log(`📄 Found ${data.length || 0} ayahs matching "${searchQuery}"`);
        
        // Render ayah search results
        renderAyahSearchResults(data, searchQuery);
        
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
    } finally {
        showLoading(false);
    }
}

// Mobile menu functions (inherited from app.js)
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
async function loadSurahData() {
    try {
        showLoading(true);
        
        const response = await fetch('assets/php/coran/cardsSurah.php');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Check if response contains error
        if (data.error) {
            throw new Error(data.message || 'Error desconocido del servidor');
        }
        
        surahData = data;
        filteredSurahData = [...data];
        
        console.log(`Loaded ${data.length} surahs from database`);
        renderSurahCards();
        
    } catch (error) {
        console.error('Error loading surah data:', error);
        showError('حدث خطأ في تحميل بيانات السور. يرجى المحاولة مرة أخرى.');
    } finally {
        showLoading(false);
    }
}

// Render surah cards
function renderSurahCards() {
    const container = document.getElementById('container');
    if (!container) return;
    
    if (filteredSurahData.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-6xl mb-4">📖</div>
                <h3 class="text-xl font-bold text-gray-600 mb-2">لا توجد نتائج</h3>
                <p class="text-gray-500">لم يتم العثور على سور تطابق البحث</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    filteredSurahData.forEach((surah, index) => {
        const formattedNumber = String(surah.number).padStart(3, '0');
        const arabicNumber = convertToArabic(surah.number);
        
        const card = document.createElement('a');
        card.href = `lectura.html?surah=${surah.number}`;
        card.classList.add('card', 'fade-in');
        card.dataset.surah = formattedNumber;
        card.style.animationDelay = `${index * 0.1}s`;
        
        // Add click event for better UX
        card.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToSurah(surah.number);
        });
        
        card.innerHTML = `
            <div class="number">
                <span>${arabicNumber}</span>
            </div>
            <div class="info">
                <div class="name_ar" style="text-align: center;">${surah.name_ar}</div>
                <div class="details" style="text-align: right;">
                    <span class="type">${surah.type}</span>
                    <span class="ayahs_totales">${convertToArabic(surah.ayahs_totales)} آية</span>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Navigate to surah reading page
function navigateToSurah(surahNumber) {
    // Add loading state to the clicked card
    const clickedCard = document.querySelector(`[data-surah="${String(surahNumber).padStart(3, '0')}"]`);
    if (clickedCard) {
        clickedCard.style.opacity = '0.6';
        clickedCard.style.pointerEvents = 'none';
        
        // Restore clickability after a short delay in case navigation fails
        setTimeout(() => {
            clickedCard.style.opacity = '1';
            clickedCard.style.pointerEvents = 'auto';
        }, 3000);
    }
    
    // Navigate to reading page
    window.location.href = `lectura.html?surah=${surahNumber}`;
}

// Global search state
let searchMode = 'surah'; // 'surah' or 'ayah'
let ayahSearchResults = [];


// Render ayah search results - REAL IMPLEMENTATION
function renderAyahSearchResults(results, query) {
    const mainContent = document.getElementById('mainContent');
    if (!mainContent) return;
    
    if (!results || results.length === 0) {
        mainContent.innerHTML = `
            <section class="container mx-auto px-4 py-8">
                <div class="text-center mb-8">
                    <h2 class="text-2xl lg:text-3xl font-bold text-emerald-900 mb-4">نتائج البحث في الآيات</h2>
                    <p class="text-emerald-700">البحث عن: "${query}"</p>
                </div>
                <div class="text-center py-12">
                    <div class="text-6xl mb-4">🔍</div>
                    <h3 class="text-xl font-bold text-gray-600 mb-2">لا توجد نتائج</h3>
                    <p class="text-gray-500 mb-4">لم يتم العثور على آيات تطابق البحث "${query}"</p>
                    <button onclick="showAllSurahs()" class="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                        العودة لقائمة السور
                    </button>
                </div>
            </section>
        `;
        return;
    }
    
    const ayahCards = results.map((ayah, index) => {
        // Highlight search term in text
        const highlightedArabic = highlightSearchTerm(ayah.text, query);
        const highlightedEnglish = ayah.text_en ? highlightSearchTerm(ayah.text_en, query) : '';
        const highlightedSpanish = ayah.text_es ? highlightSearchTerm(ayah.text_es, query) : '';
        
        return `
            <div class="ayah-result-card bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 mb-6 fade-in" style="animation-delay: ${index * 0.1}s">
                <div class="ayah-result-header flex justify-between items-start mb-4">
                    <div class="surah-info">
                        <h3 class="text-lg font-bold text-emerald-900">${ayah.surah_name}</h3>
                        <p class="text-sm text-gray-600">${ayah.surah_type} - الآية ${convertToArabic(ayah.ayah_number)}</p>
                    </div>
                    <div class="ayah-number bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold">
                        ${convertToArabic(ayah.ayah_number)}
                    </div>
                </div>
                
                <div class="ayah-text space-y-3">
                    <div class="arabic-text text-right text-xl leading-relaxed" style="font-family: 'Amiri', serif;">
                        ${highlightedArabic}
                    </div>
                    
                    ${highlightedEnglish ? `
                        <div class="translation-en text-left text-gray-700 italic" style="direction: ltr;">
                            ${highlightedEnglish}
                        </div>
                    ` : ''}
                    
                    ${highlightedSpanish ? `
                        <div class="translation-es text-left text-gray-600" style="direction: ltr;">
                            ${highlightedSpanish}
                        </div>
                    ` : ''}
                </div>
                
                <div class="ayah-actions mt-4 flex gap-2">
                    <button onclick="navigateToAyah(${ayah.surah_number}, ${ayah.ayah_number})" 
                            class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm">
                        اذهب إلى الآية
                    </button>
                    <button onclick="navigateToSurah(${ayah.surah_number})" 
                            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm">
                        اذهب إلى السورة
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    mainContent.innerHTML = `
        <section class="container mx-auto px-4 py-8">
            <div class="text-center mb-8">
                <h2 class="text-2xl lg:text-3xl font-bold text-emerald-900 mb-4">نتائج البحث في الآيات</h2>
                <p class="text-emerald-700">البحث عن: "${query}" - وُجدت ${results.length} آية</p>
                <button onclick="showAllSurahs()" class="mt-4 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors" style="margin-top:10px;">
                    العودة لقائمة السور
                </button>
            </div>
            
            <div class="space-y-6">
                ${ayahCards}
            </div>
        </section>
    `;
}

// Enhanced highlight search term in text - optimized for Arabic diacritics matching
function highlightSearchTerm(text, searchTerm) {
    if (!text || !searchTerm) {
        console.log('❌ highlightSearchTerm: Missing text or searchTerm', { text: !!text, searchTerm });
        return text;
    }
    
    console.log('🔍 highlightSearchTerm called:', { searchTerm, textLength: text.length });
    
    // Clean and normalize the search term for better Arabic matching
    const cleanSearchTerm = searchTerm.trim()
        .replace(/[\u064B-\u0652\u0670\u0640]/g, '') // Remove diacritics and tatweel
        .replace(/أ|إ|آ/g, 'ا') // Normalize alif variations
        .replace(/ة/g, 'ه') // Normalize taa marbuta
        .replace(/ى/g, 'ي'); // Normalize alif maksura
    
    console.log('🧹 Cleaned search term:', cleanSearchTerm);
    
    // Create a flexible pattern that matches the search term with optional diacritics
    const createFlexiblePattern = (term) => {
        return term
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex chars
            .split('')
            .map(char => {
                if (/[\u0600-\u06FF]/.test(char)) {
                    // For Arabic characters, allow optional diacritics between and after
                    return `${char}[\\u064B-\\u0652\\u0670\\u0640]*`;
                }
                return char;
            })
            .join('[\\u064B-\\u0652\\u0670\\u0640]*'); // Allow diacritics between all characters
    };
    
    // Create the flexible pattern
    const flexiblePattern = createFlexiblePattern(cleanSearchTerm);
    console.log('🎯 Flexible pattern:', flexiblePattern);
    
    let highlightedText = text;
    let matchFound = false;
    
    try {
        // Use the flexible pattern to find matches in the original text
        const flexRegex = new RegExp(`(${flexiblePattern})`, 'gi');
        const matches = text.match(flexRegex);
        
        if (matches && matches.length > 0) {
            console.log('✅ Matches found:', matches);
            
            // Replace each match with highlighted version
            matches.forEach(match => {
                const escapedMatch = match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const matchRegex = new RegExp(escapedMatch, 'g');
                highlightedText = highlightedText.replace(matchRegex, 
                    `<span style="background-color: #fef08a; color: #a16207; padding: 2px 4px; border-radius: 4px; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">${match}</span>`
                );
            });
            
            matchFound = true;
            console.log('✅ Flexible pattern match found and highlighted');
        }
        
        // Fallback: Try exact match if flexible pattern didn't work
        if (!matchFound) {
            const exactPattern = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            if (exactPattern.test(text)) {
                highlightedText = highlightedText.replace(exactPattern, 
                    '<span style="background-color: #fef08a; color: #a16207; padding: 2px 4px; border-radius: 4px; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">$1</span>'
                );
                matchFound = true;
                console.log('✅ Exact match found and highlighted');
            }
        }
        
        // Additional fallback: Try word boundary matching
        if (!matchFound) {
            const wordPattern = new RegExp(`(\\S*${cleanSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\S*)`, 'gi');
            const wordMatches = text.match(wordPattern);
            
            if (wordMatches && wordMatches.length > 0) {
                wordMatches.forEach(match => {
                    const escapedMatch = match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const matchRegex = new RegExp(escapedMatch, 'g');
                    highlightedText = highlightedText.replace(matchRegex, 
                        `<span style="background-color: #fef08a; color: #a16207; padding: 2px 4px; border-radius: 4px; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">${match}</span>`
                    );
                });
                matchFound = true;
                console.log('✅ Word boundary match found and highlighted');
            }
        }
        
    } catch (error) {
        console.error('❌ Error in highlighting:', error);
        // Return original text if there's an error
        return text;
    }
    
    if (matchFound) {
        console.log('🎯 Highlighting applied successfully');
        console.log('📝 Result preview:', highlightedText.substring(0, 100) + '...');
    } else {
        console.log('❌ No matches found for highlighting');
        console.log('🔍 Search term:', searchTerm);
        console.log('🔍 Clean term:', cleanSearchTerm);
        console.log('📝 Text preview:', text.substring(0, 100) + '...');
    }
    
    return highlightedText;
}

// Navigate to specific ayah
function navigateToAyah(surahNumber, ayahNumber) {
    console.log(`🧭 Navigating to Surah ${surahNumber}, Ayah ${ayahNumber}`);
    window.location.href = `lectura.html?surah=${surahNumber}&ayah=${ayahNumber}`;
}

// Show all surahs function
function showAllSurahs() {
    // Clear search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Reset to surah mode
    currentSearchMode = 'surah';
    const toggleText = document.getElementById('modeToggleText');
    const toggleIcon = document.getElementById('modeToggleBtn')?.querySelector('svg path');
    
    if (toggleText) {
        toggleText.textContent = 'البحث في السور';
    }
    if (searchInput) {
        searchInput.placeholder = 'ابحث عن سورة بالاسم أو الرقم...';
    }
    if (toggleIcon) {
        toggleIcon.setAttribute('d', 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253');
    }
    
    // Show all surahs
    filteredSurahData = [...surahData];
    
    // Render main surah view
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.innerHTML = `
            <section class="container mx-auto px-4 py-8">
                <div class="mb-8 text-center">
                    <h2 class="text-2xl lg:text-3xl font-bold text-emerald-900 mb-4">فهرس السور</h2>
                    <p class="text-emerald-700">اختر السورة التي تريد قراءتها</p>
                </div>
                <div id="container" class="surah-grid">
                    <!-- Cards will be loaded here by JavaScript -->
                </div>
            </section>
        `;
    }
    
    // Render surah cards
    renderSurahCards();
}


// Highlight search term in text
function highlightSearchTerm(text, searchTerm) {
    if (!text || !searchTerm) return text;
    
    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

// Escape special regex characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Navigate to specific ayah
function navigateToAyah(surahNumber, ayahNumber) {
    console.log(`🧭 Navigating to Surah ${surahNumber}, Ayah ${ayahNumber}`);
    window.location.href = `lectura.html?surah=${surahNumber}&ayah=${ayahNumber}`;
}

// Toggle search mode
function toggleSearchMode(mode) {
    searchMode = mode;
    const surahBtn = document.getElementById('searchModeSurah');
    const ayahBtn = document.getElementById('searchModeAyah');
    const searchInput = document.getElementById('surahSearchInput');
    
    if (surahBtn && ayahBtn && searchInput) {
        if (mode === 'surah') {
            surahBtn.classList.add('active');
            ayahBtn.classList.remove('active');
            searchInput.placeholder = 'ابحث عن سورة بالاسم أو الرقم...';
        } else {
            ayahBtn.classList.add('active');
            surahBtn.classList.remove('active');
            searchInput.placeholder = 'ابحث في آيات القرآن الكريم...';
        }
    }
    
    // Clear current search
    clearSearch();
}

// Clear search function - IMPROVED VERSION
function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Reset search mode to surah if it was in ayah mode
    if (currentSearchMode === 'ayah') {
        currentSearchMode = 'surah';
        const toggleText = document.getElementById('modeToggleText');
        const toggleIcon = document.getElementById('modeToggleBtn')?.querySelector('svg path');
        
        if (toggleText) {
            toggleText.textContent = 'البحث في السور';
        }
        if (searchInput) {
            searchInput.placeholder = 'ابحث عن سورة بالاسم أو الرقم...';
        }
        if (toggleIcon) {
            toggleIcon.setAttribute('d', 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253');
        }
    }
    
    // Show all surahs
    showAllSurahs();
}

// Search on Enter key - REMOVED (handled in main DOMContentLoaded)
// This was causing duplicate event listeners

// Show/hide loading state
function showLoading(show) {
    const loadingState = document.getElementById('loadingState');
    const container = document.getElementById('container');
    
    if (loadingState) {
        loadingState.style.display = show ? 'block' : 'none';
    }
    
    if (container) {
        container.style.display = show ? 'none' : 'grid';
    }
}

// Show error message
function showError(message) {
    const container = document.getElementById('container');
    if (container) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <div class="text-6xl mb-4">❌</div>
                <h3 class="text-xl font-bold text-red-600 mb-2">خطأ</h3>
                <p class="text-gray-600 mb-4">${message}</p>
                <button onclick="loadSurahData()" class="btn btn-primary">
                    إعادة المحاولة
                </button>
            </div>
        `;
    }
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeMobileMenu();
    }
});

// Initialize favorites counter
function initializeFavoritesCounter() {
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favorites');
    let favorites = [];
    
    if (savedFavorites) {
        try {
            favorites = JSON.parse(savedFavorites);
        } catch (e) {
            console.error('Error loading favorites:', e);
            favorites = [];
        }
    }
    
    // Initialize AppState
    if (!window.AppState) {
        window.AppState = {};
    }
    window.AppState.favorites = favorites;
    
    // Update counter with current count
    const favoritesCountElement = document.getElementById('favoritesCount');
    if (favoritesCountElement) {
        favoritesCountElement.textContent = favorites.length;
        console.log(`🔢 Updated favorites counter to: ${favorites.length}`);
    } else {
        console.warn('❌ favoritesCount element not found');
    }
}

// Reset all card states to ensure clickability
function resetCardStates() {
    document.querySelectorAll('.card').forEach(card => {
        card.style.opacity = '1';
        card.style.pointerEvents = 'auto';
    });
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Coran page loaded');
    
    // Check for saved navigation state FIRST - before loading surah data
    const savedNavState = localStorage.getItem('coranNavState');
    console.log('🔍 DEBUGGING: Checking for coran navigation state...');
    console.log('🔍 savedNavState:', savedNavState);
    
    // Clear old navigation state to prevent conflicts
    localStorage.removeItem('coranNavigationState');
    
    if (savedNavState) {
        try {
            const navState = JSON.parse(savedNavState);
            const timeDiff = Date.now() - navState.timestamp;
            
            console.log('🔍 DEBUGGING: Found saved navigation state:', navState);
            console.log('🔍 Time difference (minutes):', timeDiff / 60000);
            
            // Only restore if less than 1 hour old and matches current page type
            if (timeDiff < 3600000 && navState.pageType === 'coran') {
                console.log(`🔄 ✅ RESTORING coran navigation state: ${navState.page}`);
                
                // DON'T load surah data - go directly to navigation
                if (navState.page === 'categories') {
                    setTimeout(() => {
                        navigateToPage('categories');
                    }, 500);
                    return; // Exit early, don't load surah data
                }
            } else {
                console.log('🚫 Navigation state expired or invalid, clearing...');
                localStorage.removeItem('coranNavState');
            }
        } catch (error) {
            console.error('❌ Error parsing navigation state:', error);
            localStorage.removeItem('coranNavState');
        }
    }
    
    // Only load surah data if we're staying in main coran page
    console.log('🔍 No navigation state found - loading main coran page');
    loadSurahData();
    initializeFavoritesCounter();
    
    // Reset card states when returning to page
    setTimeout(resetCardStates, 100);
    
    // Listen for favorites updates
    document.addEventListener('favoritesUpdated', function() {
        initializeFavoritesCounter();
    });
    
    // Add Enter key support for search - OVERRIDE app.js behavior
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        // Remove any existing event listeners from app.js
        searchInput.removeEventListener('keypress', window.performSearch);
        
        // Add our specific coran search handler
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                performCoranSearch();
            }
        });
        
        // Also handle input changes to show all surahs when empty
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            if (query === '') {
                // Show all surahs when search is cleared
                filteredSurahData = [...surahData];
                renderSurahCards();
            }
        });
    }
    
    // Handle navigation from other pages
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery) {
        if (searchInput) {
            searchInput.value = searchQuery;
            // Wait for data to load then search
            setTimeout(() => {
                performCoranSearch();
            }, 1000);
        }
    }
});

// Utility function for navigation (compatibility with app.js)
function navigateToPage(page) {
    console.log(`🧭 Navigating to: ${page}`);
    
    // Hide ALL coran-specific elements when navigating away - COMPLETE VERSION
    const coranHero = document.querySelector('.coran-hero');
    const heroSection = document.querySelector('.hero'); // Complete hero section
    const surahGrid = document.querySelector('.surah-grid');
    const searchContainer = document.querySelector('.search-container');
    const mainContent = document.querySelector('#mainContent');
    const heroContent = document.querySelector('.hero-content');
    const statsContainer = document.querySelector('.stats-container');
    const container = document.querySelector('.container'); // Main container with search
    
    if (page !== 'home' && page !== 'coran') {
        console.log('🙈 Hiding ALL coran-specific elements for navigation to:', page);
        
        // Hide the complete hero section (green background with stats)
        if (heroSection) {
            heroSection.style.display = 'none';
            console.log('✅ Hidden complete hero section');
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
        if (surahGrid) {
            surahGrid.style.display = 'none';
            console.log('✅ Hidden surah-grid');
        }
        if (searchContainer) {
            searchContainer.style.display = 'none';
            console.log('✅ Hidden search-container');
        }
        if (mainContent) {
            mainContent.style.display = 'none';
            console.log('✅ Hidden main content');
        }
        
        // Create or show content container for navigation
        let contentContainer = document.querySelector('#navigationContent');
        if (!contentContainer) {
            contentContainer = document.createElement('div');
            contentContainer.id = 'navigationContent';
            contentContainer.className = 'container mx-auto px-4 py-8';
            contentContainer.style.minHeight = '60vh';
            contentContainer.style.paddingTop = '2rem';
            // Insert after navigation
            const nav = document.querySelector('.nav-header');
            if (nav && nav.nextSibling) {
                nav.parentNode.insertBefore(contentContainer, nav.nextSibling);
            } else {
                document.body.appendChild(contentContainer);
            }
            console.log('✅ Created navigation content container');
        }
        contentContainer.style.display = 'block';
    } else {
        console.log('👁️ Showing coran-specific elements for:', page);
        
        // Show all coran elements when returning to home/coran
        if (heroSection) {
            heroSection.style.display = 'block';
            console.log('✅ Shown complete hero section');
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
        if (surahGrid) {
            surahGrid.style.display = 'block';
            console.log('✅ Shown surah-grid');
        }
        if (searchContainer) {
            searchContainer.style.display = 'block';
            console.log('✅ Shown search-container');
        }
        if (mainContent) {
            mainContent.style.display = 'block';
            console.log('✅ Shown main content');
        }
        
        const contentContainer = document.querySelector('#navigationContent');
        if (contentContainer) {
            contentContainer.style.display = 'none';
            console.log('✅ Hidden navigation content container');
        }
    }
    
    // SAVE navigation state using sabio.js style - JSON with timestamp and pageType
    if (page === 'categories') {
        console.log(`💾 SAVING navigation state for ${page} - will restore on reload`);
        const navState = {
            page: page,
            pageType: 'coran',
            timestamp: Date.now()
        };
        localStorage.setItem('coranNavState', JSON.stringify(navState));
        console.log('🔍 DEBUGGING: Saved navigation state:', navState);
    } else {
        // Clear navigation state for other pages
        localStorage.removeItem('coranNavState');
        localStorage.removeItem('coranNavigationState'); // Clear old format too
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

// Toggle surah favorite function - IMPROVED VERSION
function toggleSurahFavorite(surahNumber, nameAr, type, ayahsTotal) {
    console.log(`❤️ Toggling favorite for Surah ${surahNumber}: ${nameAr}`);
    
    // Initialize AppState if not available
    if (!window.AppState) {
        window.AppState = { favorites: [] };
    }
    if (!window.AppState.favorites) {
        window.AppState.favorites = [];
    }
    
    // Load current favorites from localStorage to ensure consistency
    const savedFavorites = localStorage.getItem('favorites');
    let favorites = [];
    if (savedFavorites) {
        try {
            favorites = JSON.parse(savedFavorites);
        } catch (e) {
            console.error('Error parsing favorites:', e);
            favorites = [];
        }
    }
    
    const surahId = `surah_${surahNumber}`;
    const existingIndex = favorites.findIndex(fav => fav.id === surahId);
    
    if (existingIndex > -1) {
        // Remove from favorites
        favorites.splice(existingIndex, 1);
        console.log(`🗑️ Removed Surah ${surahNumber} from favorites`);
        
        // Show notification
        if (window.showNotification) {
            window.showNotification('تم حذف السورة من المفضلة', 'success');
        }
    } else {
        // Add to favorites
        const favoriteItem = {
            id: surahId,
            title: nameAr,
            description: `سورة ${nameAr} - ${type} - ${ayahsTotal} آية`,
            type: 'quran',
            category: 'surah',
            surah_number: surahNumber,
            surah_name: nameAr,
            surah_type: type,
            ayahs_count: ayahsTotal,
            source: 'coran.html',
            date: new Date().toISOString().split('T')[0],
            favorites: 1
        };
        
        favorites.push(favoriteItem);
        console.log(`❤️ Added Surah ${surahNumber} to favorites`);
        
        // Show notification
        if (window.showNotification) {
            window.showNotification('تم إضافة السورة للمفضلة', 'success');
        }
    }
    
    // Save to localStorage and update AppState
    localStorage.setItem('favorites', JSON.stringify(favorites));
    window.AppState.favorites = favorites;
    
    // Update favorites counter
    if (window.syncFavoritesCounter) {
        window.syncFavoritesCounter();
    }
    
    // Update the favorites count display immediately
    const favoritesCountElement = document.getElementById('favoritesCount');
    if (favoritesCountElement) {
        favoritesCountElement.textContent = favorites.length;
    }
    
    // Re-render the surah cards to update display
    renderSurahCards();
    
    // Trigger custom event for other components
    document.dispatchEvent(new CustomEvent('favoritesUpdated', { 
        detail: { count: favorites.length, favorites: favorites } 
    }));
}

// Render ayah search results
function renderAyahSearchResults(ayahs, searchQuery) {
    const container = document.getElementById('container');
    if (!container) return;
    
    if (!ayahs || ayahs.length === 0) {
        container.innerHTML = `
            <div class="no-content">
                <h3>لا توجد نتائج</h3>
                <p>لم يتم العثور على آيات تحتوي على "${searchQuery}"</p>
                <button onclick="showAllSurahs()" class="btn btn-primary mt-4">
                    العودة لقائمة السور
                </button>
            </div>
        `;
        return;
    }
    
    const ayahsHTML = ayahs.map((ayah, index) => {
        const animationDelay = (index * 0.1).toFixed(1);
        return `
            <div class="ayah-result fade-in" style="animation-delay: ${animationDelay}s; opacity: 1;">
                <div class="ayah-header">
                    <span class="surah-info">سورة ${getSurahName(ayah.surah_number)} - الآية ${convertToArabic(ayah.number)}</span>
                </div>
                <div class="ayah-text">
                    ${highlightSearchTerm(ayah.text, searchQuery)}
                </div>
                <div class="ayah-actions">
                    <button onclick="readSurah(${ayah.surah_number})" class="btn btn-secondary">
                        اقرأ السورة كاملة
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = `
        <div class="search-results-header">
            <h3>نتائج البحث في الآيات</h3>
            <p>تم العثور على ${convertToArabic(ayahs.length)} آية تحتوي على "${searchQuery}"</p>
            <button onclick="showAllSurahs()" class="btn btn-outline">
                العودة لقائمة السور
            </button>
        </div>
        ${ayahsHTML}
    `;
}

// Get surah name by number
function getSurahName(surahNumber) {
    const surah = surahData.find(s => s.number === surahNumber);
    return surah ? surah.name_ar : `رقم ${surahNumber}`;
}

// Highlight search term in text
function highlightSearchTerm(text, searchTerm) {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// Show all surahs function
function showAllSurahs() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Reset to surah mode
    currentSearchMode = 'surah';
    const toggleText = document.getElementById('modeToggleText');
    if (toggleText) {
        toggleText.textContent = 'البحث في السور';
    }
    
    // Show all surahs
    filteredSurahData = [...surahData];
    renderSurahCards();
}

// Clear search function
function clearSearch() {
    showAllSurahs();
}

// Show loading function
function showLoading(show) {
    const container = document.getElementById('container');
    if (!container) return;
    
    if (show) {
        container.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>جاري البحث...</p>
            </div>
        `;
    }
}

// Export functions for global access
window.searchSurah = searchSurah;
window.searchAyah = searchAyah;
window.toggleSearchMode = toggleSearchMode;
window.showAllSurahs = showAllSurahs;
window.clearSearch = clearSearch;
window.renderAyahSearchResults = renderAyahSearchResults;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.navigateToPage = navigateToPage;
window.toggleSurahFavorite = toggleSurahFavorite;
window.filterByTypeAndNavigate = filterByTypeAndNavigate;
window.removeFavorite = removeFavorite;
window.performCoranSearch = performCoranSearch;