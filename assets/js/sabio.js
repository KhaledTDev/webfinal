// sabio.js - JavaScript específico para la página sabio.html
// PRIORIDAD ABSOLUTA - Este script controla sabio.html

// Flag para indicar que sabio.js está en control (solo en sabio.html)
window.SABIO_PAGE_ACTIVE = window.location.pathname.includes('sabio.html');

// Estado global para la página del sabio
const SabioPageState = {
  selectedSabio: null,
  sabioInfo: null,
  activeCategory: 'all', // Categoría "Todo" activa por defecto
  currentContent: [],
  appJsInitialized: false,
  activeNav: null // Track navigation state (favorites, categories, home)
};

// Función para prevenir que app.js interfiera con sabio.html
// PERMITIR: search, audio manager, y funciones de navegación esenciales
function preventAppJsInterference() {
  console.log('Setting up sabio.js priority - blocking app.js category/content functions but allowing navigation');
  
  // BLOQUEAR: Funciones de contenido y categorías de app.js
  if (window.loadHomePage) {
    const originalLoadHomePage = window.loadHomePage;
    window.loadHomePage = function() {
      if (window.SABIO_PAGE_ACTIVE) {
        console.log('BLOCKED: app.js loadHomePage on sabio.html');
        return;
      }
      return originalLoadHomePage.apply(this, arguments);
    };
  }
  
  if (window.renderHomeContent) {
    const originalRenderHomeContent = window.renderHomeContent;
    window.renderHomeContent = function() {
      if (window.SABIO_PAGE_ACTIVE) {
        console.log('BLOCKED: app.js renderHomeContent on sabio.html');
        return;
      }
      return originalRenderHomeContent.apply(this, arguments);
    };
  }
  
  if (window.renderContent) {
    const originalRenderContent = window.renderContent;
    window.renderContent = function() {
      if (window.SABIO_PAGE_ACTIVE) {
        // Permitir renderContent para páginas específicas de navegación
        const activeNav = window.AppState ? window.AppState.activeNav : null;
        console.log(`DEBUG: AppState exists: ${!!window.AppState}, activeNav: ${activeNav}`);
        
        if (activeNav === 'categories' || activeNav === 'favorites') {
          console.log(`✅ ALLOWED: app.js renderContent for navigation page: ${activeNav}`);
          return originalRenderContent.apply(this, arguments);
        }
        
        // También permitir si no hay AppState (para compatibilidad)
        if (!window.AppState) {
          console.log('⚠️ AppState not found, allowing renderContent for compatibility');
          return originalRenderContent.apply(this, arguments);
        }
        
        console.log(`BLOCKED: app.js renderContent on sabio.html (activeNav: ${activeNav})`);
        return;
      }
      return originalRenderContent.apply(this, arguments);
    };
  }
  
  // BLOQUEAR: Funciones de categorías de app.js
  if (window.loadCategoryContent) {
    const originalLoadCategoryContent = window.loadCategoryContent;
    window.loadCategoryContent = function() {
      if (window.SABIO_PAGE_ACTIVE) {
        console.log('BLOCKED: app.js loadCategoryContent on sabio.html - using sabio.js version');
        return;
      }
      return originalLoadCategoryContent.apply(this, arguments);
    };
  }
  
  if (window.filterByType) {
    const originalFilterByType = window.filterByType;
    window.filterByType = function() {
      if (window.SABIO_PAGE_ACTIVE) {
        console.log('BLOCKED: app.js filterByType on sabio.html');
        return;
      }
      return originalFilterByType.apply(this, arguments);
    };
  }
  
  if (window.renderContentCard) {
    const originalRenderContentCard = window.renderContentCard;
    window.renderContentCard = function() {
      if (window.SABIO_PAGE_ACTIVE) {
        // Allow renderContentCard for favorites rendering
        const stack = new Error().stack;
        if (stack && (stack.includes('renderFavoriteCards') || stack.includes('renderFavoritesPage'))) {
          console.log('✅ ALLOWED: app.js renderContentCard for favorites rendering');
          return originalRenderContentCard.apply(this, arguments);
        }
        
        // Also allow if we're in favorites navigation context
        if (window.SabioPageState && window.SabioPageState.activeNav === 'favorites') {
          console.log('✅ ALLOWED: app.js renderContentCard for favorites navigation');
          return originalRenderContentCard.apply(this, arguments);
        }
        
        console.log('BLOCKED: app.js renderContentCard on sabio.html - using sabio.js version');
        return;
      }
      return originalRenderContentCard.apply(this, arguments);
    };
  }
  
  // PERMITIR EXPLÍCITAMENTE: Funciones de navegación esenciales
  console.log('✅ ALLOWED: Navigation functions from app.js:');
  
  // Permitir funciones de menú móvil
  if (window.toggleMobileMenu) {
    console.log('  - toggleMobileMenu (mobile menu)');
  }
  if (window.closeMobileMenu) {
    console.log('  - closeMobileMenu (mobile menu)');
  }
  
  // Permitir funciones de búsqueda
  if (window.performSearch) {
    console.log('  - performSearch (search functionality)');
  }
  
  // Permitir funciones de reproductor de audio
  if (window.handleMediaClick) {
    console.log('  - handleMediaClick (audio player)');
  }
  if (window.togglePlayPause) {
    console.log('  - togglePlayPause (audio player)');
  }
  if (window.playNext) {
    console.log('  - playNext (audio player)');
  }
  if (window.playPrevious) {
    console.log('  - playPrevious (audio player)');
  }
  if (window.toggleQueue) {
    console.log('  - toggleQueue (audio player)');
  }
  if (window.clearQueue) {
    console.log('  - clearQueue (audio player)');
  }
  if (window.closeAudioPlayer) {
    console.log('  - closeAudioPlayer (audio player)');
  }
  
  // Permitir funciones de favoritos (si las necesitamos)
  if (window.toggleFavorite) {
    console.log('  - toggleFavorite (favorites system)');
  }
  
  // Permitir funciones de video
  if (window.showVideoPlayer) {
    console.log('  - showVideoPlayer (video player)');
  }
  if (window.closeVideoPlayer) {
    console.log('  - closeVideoPlayer (video player)');
  }
  
  // Permitir funciones del mega menú de sabios
  if (window.toggleMegaMenu) {
    console.log('  - toggleMegaMenu (sabios mega menu)');
  }
  if (window.closeMegaMenu) {
    console.log('  - closeMegaMenu (sabios mega menu)');
  }
  if (window.navigateToSabio) {
    console.log('  - navigateToSabio (sabio navigation)');
  }
  
  console.log('❌ BLOCKED: Content rendering and category functions from app.js');
}

// Función para obtener información del sabio
async function loadSabioInfo(sabioName) {
  console.log(`Loading sabio info for: "${sabioName}"`);
  console.log(`🔍 Sabio name details:`, {
    original: sabioName,
    encoded: encodeURIComponent(sabioName),
    length: sabioName.length,
    charCodes: sabioName.split('').map(c => c.charCodeAt(0))
  });
  
  try {
    const url = `assets/php/sabio_loader.php?action=get_sabio_info&sabio=${encodeURIComponent(sabioName)}`;
    console.log(`📡 Fetching sabio info URL: ${url}`);
    
    const response = await fetch(url);
    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log(`📡 Raw response text:`, responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('❌ Response text that failed to parse:', responseText);
      throw new Error('Invalid JSON response from server');
    }
    
    console.log('📦 Parsed sabio info response:', data);
    
    if (data.success) {
      console.log('✅ Sabio info loaded successfully:');
      console.log('Sabio name:', data.data.name);
      console.log('🖼️ Image:', data.data.image);
      console.log('Stats:', data.data.stats);
      console.log('Categories count:', data.data.stats.categories);
      
      // Verificar si las categorías tienen archivos
      Object.entries(data.data.stats.categories).forEach(([category, count]) => {
        if (count > 0) {
          console.log(`✅ Category "${category}" has ${count} files`);
        } else {
          console.warn(`⚠️ Category "${category}" has NO files (count: ${count})`);
        }
      });
      
      return data.data;
    } else {
      console.error('❌ PHP returned error:', data.message || data.error);
      throw new Error(data.message || data.error || 'Failed to load sabio info');
    }
  } catch (error) {
    console.error('💥 Error loading sabio info:', error);
    console.log('🔄 Using fallback sabio data for testing...');
    
    // FALLBACK DATA para pruebas
    const fallbackData = {
      name: sabioName,
      image: null,
      stats: {
        total_audio: 38,
        total_pdf: 5,
        categories: {
          duruz: 30,
          firak: 8,
          pdf: 5
        }
      }
    };
    
    console.log('✅ Using fallback sabio data:', fallbackData);
    return fallbackData;
  }
}

// Función para obtener contenido del sabio por categoría
async function loadSabioContent(sabioName, category) {
  console.log(`Loading content for sabio: "${sabioName}", category: "${category}"`);
  
  try {
    const url = `assets/php/sabio_loader.php?action=get_sabio_content&sabio=${encodeURIComponent(sabioName)}&category=${encodeURIComponent(category)}`;
    console.log(`📡 Fetching URL: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('📦 Raw response from PHP:', data);
    
    if (data.success) {
      console.log(`✅ Successfully loaded ${data.data.total} files for category "${category}"`);
      console.log('Files data:', data.data.files);
      return data.data;
    } else {
      console.error('❌ PHP returned error:', data.message);
      throw new Error(data.message || 'Failed to load sabio content');
    }
  } catch (error) {
    console.error('💥 Error loading sabio content:', error);
    console.log('🔄 Using fallback content data for testing...');
    
    // FALLBACK DATA para pruebas
    const fallbackFiles = {
      duruz: [
        { name: 'درس في التوحيد الأول', filename: 'lesson1.mp3', path: '#', size: 5000000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في التوحيد الثاني', filename: 'lesson2.mp3', path: '#', size: 6000000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في الصلاة', filename: 'lesson3.mp3', path: '#', size: 4500000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في الزكاة الأول', filename: 'lesson4.mp3', path: '#', size: 5500000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في الزكاة الثاني', filename: 'lesson5.mp3', path: '#', size: 6200000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في الصيام الأول', filename: 'lesson6.mp3', path: '#', size: 4800000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في الصيام الثاني', filename: 'lesson7.mp3', path: '#', size: 5200000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في الحج الأول', filename: 'lesson8.mp3', path: '#', size: 6800000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في الحج الثاني', filename: 'lesson9.mp3', path: '#', size: 5900000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في الحج الثالث', filename: 'lesson10.mp3', path: '#', size: 6100000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في الطهارة الأول', filename: 'lesson11.mp3', path: '#', size: 4700000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في الطهارة الثاني', filename: 'lesson12.mp3', path: '#', size: 5300000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في الطهارة الثالث', filename: 'lesson13.mp3', path: '#', size: 5800000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في الوضوء الأول', filename: 'lesson14.mp3', path: '#', size: 4400000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في الوضوء الثاني', filename: 'lesson15.mp3', path: '#', size: 4900000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في الغسل الأول', filename: 'lesson16.mp3', path: '#', size: 5600000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في الغسل الثاني', filename: 'lesson17.mp3', path: '#', size: 5100000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في التيمم', filename: 'lesson18.mp3', path: '#', size: 4600000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في أحكام المياه', filename: 'lesson19.mp3', path: '#', size: 5400000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في النجاسات', filename: 'lesson20.mp3', path: '#', size: 4300000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في أوقات الصلاة', filename: 'lesson21.mp3', path: '#', size: 5700000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في القبلة', filename: 'lesson22.mp3', path: '#', size: 4200000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في الأذان', filename: 'lesson23.mp3', path: '#', size: 4800000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في الإقامة', filename: 'lesson24.mp3', path: '#', size: 3900000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في شروط الصلاة', filename: 'lesson25.mp3', path: '#', size: 6300000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في أركان الصلاة الأول', filename: 'lesson26.mp3', path: '#', size: 5500000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في أركان الصلاة الثاني', filename: 'lesson27.mp3', path: '#', size: 5800000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في واجبات الصلاة', filename: 'lesson28.mp3', path: '#', size: 5200000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في سنن الصلاة', filename: 'lesson29.mp3', path: '#', size: 4700000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' },
        { name: 'درس في مكروهات الصلاة', filename: 'lesson30.mp3', path: '#', size: 4500000, extension: 'mp3', type: 'audio', categoryLabel: 'دروس' }
      ],
      firak: [
        { name: 'الرد على الخوارج الأول', filename: 'firak1.mp3', path: '#', size: 7000000, extension: 'mp3', type: 'audio', categoryLabel: 'فرق' },
        { name: 'الرد على المعتزلة', filename: 'firak2.mp3', path: '#', size: 5500000, extension: 'mp3', type: 'audio', categoryLabel: 'فرق' },
        { name: 'الرد على الأشاعرة الأول', filename: 'firak3.mp3', path: '#', size: 6800000, extension: 'mp3', type: 'audio', categoryLabel: 'فرق' },
        { name: 'الرد على الأشاعرة الثاني', filename: 'firak4.mp3', path: '#', size: 6200000, extension: 'mp3', type: 'audio', categoryLabel: 'فرق' },
        { name: 'الرد على الماتريدية', filename: 'firak5.mp3', path: '#', size: 5900000, extension: 'mp3', type: 'audio', categoryLabel: 'فرق' },
        { name: 'الرد على الجهمية', filename: 'firak6.mp3', path: '#', size: 6400000, extension: 'mp3', type: 'audio', categoryLabel: 'فرق' },
        { name: 'الرد على القدرية', filename: 'firak7.mp3', path: '#', size: 5800000, extension: 'mp3', type: 'audio', categoryLabel: 'فرق' },
        { name: 'الرد على المرجئة', filename: 'firak8.mp3', path: '#', size: 6100000, extension: 'mp3', type: 'audio', categoryLabel: 'فرق' }
      ],
      pdf: [
        { name: 'كتاب التوحيد', filename: 'book1.pdf', path: '#', size: 2000000, extension: 'pdf', type: 'document', categoryLabel: 'كتاب' },
        { name: 'كتاب كشف الشبهات', filename: 'book2.pdf', path: '#', size: 1800000, extension: 'pdf', type: 'document', categoryLabel: 'كتاب' },
        { name: 'كتاب الأصول الثلاثة', filename: 'book3.pdf', path: '#', size: 1200000, extension: 'pdf', type: 'document', categoryLabel: 'كتاب' },
        { name: 'كتاب القواعد الأربع', filename: 'book4.pdf', path: '#', size: 900000, extension: 'pdf', type: 'document', categoryLabel: 'كتاب' },
        { name: 'كتاب العقيدة الواسطية', filename: 'book5.pdf', path: '#', size: 2200000, extension: 'pdf', type: 'document', categoryLabel: 'كتاب' }
      ]
    };
    
    const categoryFiles = fallbackFiles[category] || [];
    const fallbackData = {
      sabio: sabioName,
      category: category,
      files: categoryFiles,
      total: categoryFiles.length
    };
    
    console.log('✅ Using fallback content data:', fallbackData);
    return fallbackData;
  }
}

// Renderizar la información principal del sabio
function renderSabioHero(sabioInfo) {
  if (!sabioInfo) return '';
  
  const totalFiles = sabioInfo.stats.total_audio + sabioInfo.stats.total_pdf;
  
  // Calcular estadísticas adicionales para que sea idéntico a index.html
  const totalCategories = Object.keys(sabioInfo.stats.categories || {}).length;
  // Get actual favorites count from localStorage
  const favorites = JSON.parse(localStorage.getItem('islamicFavorites') || '[]');
  const favoritesCount = favorites.length;
  
  return `
    <div class="hero islamic-pattern">
      <div class="container mx-auto px-4 text-center">
        ${sabioInfo.image ? `
          <div class="mb-6">
            <img src="${sabioInfo.image}" alt="${sabioInfo.name}" 
                 class="sabio-image w-32 h-32 md:w-48 md:h-48 rounded-full mx-auto border-4 border-white shadow-lg object-cover">
          </div>
        ` : ''}
        
        <h2 class="text-3xl md:text-4xl lg:text-6xl font-bold mb-6 calligraphy">
          ${sabioInfo.name}
        </h2>
        <p class="text-lg md:text-xl lg:text-2xl mb-8 opacity-90">محتوى شامل من العالم والداعية</p>
        
        <!-- Stats container dinámico según categoría -->
        <div class="stats-container">
          <div class="stats-card bg-white/10 backdrop-blur-sm border-white/20">
            <div class="stats-number text-white" id="sabio-stats-items">${totalFiles.toLocaleString('ar')}</div>
            <div class="stats-label text-white/80" id="sabio-stats-label">إجمالي المواد</div>
          </div>
          <div class="stats-card bg-white/10 backdrop-blur-sm border-white/20">
            <div class="stats-number text-white" id="sabio-stats-pages">${Math.ceil(totalFiles / SabioPagination.itemsPerPage).toLocaleString('ar')}</div>
            <div class="stats-label text-white/80">صفحة</div>
          </div>
          <div class="stats-card bg-white/10 backdrop-blur-sm border-white/20">
            <div class="stats-number text-white" id="sabio-stats-favorites">${favoritesCount.toLocaleString('ar')}</div>
            <div class="stats-label text-white/80">المفضلة</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Renderizar أزرار التصنيفات
function renderCategoryButtons(sabioInfo) {
  if (!sabioInfo) return '';
  
  const totalFiles = sabioInfo.stats.total_audio + sabioInfo.stats.total_pdf;
  
  const categories = [
    { key: 'all', label: 'الكل', icon: '', count: totalFiles }, // Categoría "Todo" por defecto
    { key: 'duruz', label: 'دروس', icon: '' },
    { key: 'firak', label: 'فرق', icon: '' },
    { key: 'pdf', label: 'كتاب', icon: '' }
  ];
  
  return categories.map(category => {
    // Para la categoría "all", usar el conteo total; para otras, usar el conteo específico
    const count = category.key === 'all' ? category.count : (sabioInfo.stats.categories[category.key] || 0);
    const isActive = SabioPageState.activeCategory === category.key;
    
    // Si el conteo es 0, ocultar completamente el botón
    if (count === 0) {
      return `
        <button 
          data-category="${category.key}"
          class="category-btn btn btn-outline text-lg px-6 py-3"
          style="display: none;"
          disabled
        >
          <span class="ml-2">${category.icon}</span>
          ${category.label}
        </button>
      `;
    }
    
    return `
      <button 
        data-category="${category.key}"
        class="category-btn btn ${isActive ? 'btn-primary' : 'btn-outline'} text-lg px-6 py-3"
      >
        <span class="ml-2">${category.icon}</span>
        ${category.label}
      </button>
    `;
  }).join('');
}

// SISTEMA DE PAGINACIÓN PARA SABIO.JS
const SabioPagination = {
  itemsPerPage: 25,
  currentPage: 1,
  totalPages: 1,
  totalItems: 0
};

// Función de paginación (copiada de app.js)
function renderSabioPagination(currentPage, totalPages, totalItems, onPageClick) {
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
        <span>صفحة ${currentPage} من ${totalPages} (${totalItems.toLocaleString('ar')} عنصر)</span>
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

// Función para desplazarse al comienzo del contenido
function scrollToContentTop() {
  console.log('📜 Scrolling to content top');
  
  // Priorizar contentSection para posicionamiento perfecto
  const contentSection = document.getElementById('contentSection');
  const containerElement = document.querySelector('.container.mx-auto');
  const mainContent = document.getElementById('mainContent');
  
  if (contentSection) {
    // Posicionamiento perfecto en contentSection
    const rect = contentSection.getBoundingClientRect();
    const offsetTop = window.pageYOffset + rect.top - 20; // 20px de margen superior perfecto
    
    window.scrollTo({
      top: Math.max(0, offsetTop), // Asegurar que no sea negativo
      behavior: 'smooth'
    });
    console.log('✅ Scrolled perfectly to contentSection');
  } else if (containerElement) {
    // Fallback: usar container con offset mínimo
    const rect = containerElement.getBoundingClientRect();
    const offsetTop = window.pageYOffset + rect.top - 10;
    
    window.scrollTo({
      top: Math.max(0, offsetTop),
      behavior: 'smooth'
    });
    console.log('✅ Scrolled to container position');
  } else {
    // Fallback final: scroll al top de la página
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    console.log('⚠️ ContentSection not found, scrolled to page top');
  }
}

// Función para navegar a página específica
function loadSabioPage(pageNumber) {
  console.log(`loadSabioPage called with pageNumber: ${pageNumber}`);
  console.log(`Current pagination state:`, {
    currentPage: SabioPagination.currentPage,
    totalPages: SabioPagination.totalPages,
    totalItems: SabioPagination.totalItems
  });
  
  // Validar número de página
  if (pageNumber < 1 || pageNumber > SabioPagination.totalPages) {
    console.warn(`⚠️ Invalid page number: ${pageNumber}. Valid range: 1-${SabioPagination.totalPages}`);
    return;
  }
  
  // Actualizar página actual ANTES de cargar contenido
  SabioPagination.currentPage = pageNumber;
  console.log(`✅ Page set to: ${pageNumber}`);
  
  // Si ya tenemos el contenido cargado, solo re-renderizar con la nueva página
  if (SabioPageState.currentContent && SabioPageState.currentContent.files) {
    console.log(`🔄 Re-rendering existing content for page ${pageNumber}`);
    renderSabioContent();
    // Desplazarse al comienzo de las cards después del re-renderizado
    scrollToContentTop();
  } else {
    console.log(`📡 Loading content for page ${pageNumber}`);
    // Recargar contenido con paginación
    sabioLoadCategoryContent(SabioPageState.activeCategory);
    // El scroll se manejará después de que se complete la carga
  }
}

// Renderizar tarjetas de contenido con paginación
function renderContentCards(contentData) {
  if (!contentData || !contentData.files || contentData.files.length === 0) {
    return `
      <div class="text-center py-8 text-gray-500">
        <div class="text-6xl mb-4">📂</div>
        <h3 class="text-xl font-semibold mb-2">لا يوجد محتوى متاح</h3>
        <p>لا توجد ملفات في هذا التصنيف</p>
      </div>
    `;
  }
  
  // Implementar paginación
  const totalFiles = contentData.files.length;
  const totalPages = Math.ceil(totalFiles / SabioPagination.itemsPerPage);
  const startIndex = (SabioPagination.currentPage - 1) * SabioPagination.itemsPerPage;
  const endIndex = startIndex + SabioPagination.itemsPerPage;
  const paginatedFiles = contentData.files.slice(startIndex, endIndex);
  
  // Actualizar estado de paginación
  SabioPagination.totalPages = totalPages;
  SabioPagination.totalItems = totalFiles;

  const cardsHTML = paginatedFiles.map(file => {
    const isAudio = file.type === 'audio';
    const isPdf = file.type === 'document';
    
    // Mostrar etiqueta de categoría solo en vista "all"
    const categoryBadge = contentData.category === 'all' && file.categoryLabel ? 
      `<div class="mb-3">
         <p class="text-sm text-emerald-600 font-semibold">${file.categoryLabel}</p>
       </div>` : '';
    
    // Usar la misma estructura que app.js
    const mediaHTML = `
      <div class="attachments-grid mb-4">
        <button
          onclick="handleFileClick('${file.path}', '${file.name}', '${file.extension}', '${file.type}')"
          class="attachment-link ${isAudio ? 'audio-link' : ''}"
        >
          <span>${isAudio ? 'صوتي' : 'ملف'}</span>
          <span>${file.extension.toUpperCase()}</span>
          <span class="text-xs opacity-75">(${isAudio ? 'استماع' : 'تحميل'})</span>
        </button>
      </div>
    `;
    
    const contentHTML = `
      <p class="text-gray-600 mb-4 arabic-text leading-relaxed line-clamp-3 text-sm lg:text-base">
        ${file.name}
      </p>
    `;
    
    return `
      <div class="card fade-in">
        <div class="flex justify-between items-start mb-3">
          <span class="content-type-badge ${isAudio ? 'type-audios' : 'type-books'}">
            ${isAudio ? 'صوتي' : 'كتاب'}
          </span>
          <button onclick="toggleSabioFavorite('${file.path}', '${file.name}')" class="btn-icon favorite-btn ${isSabioItemFavorited(file.path) ? 'favorited' : ''}" title="${isSabioItemFavorited(file.path) ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}" style="${isSabioItemFavorited(file.path) ? 'color: #ef4444;' : ''}">
            <svg class="w-5 h-5" fill="${isSabioItemFavorited(file.path) ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
          </button>
        </div>

        <h4 class="text-lg font-bold text-gray-900 mb-2 arabic-text leading-relaxed">
          ${file.name}
        </h4>

        ${contentHTML}
        ${categoryBadge}
        ${mediaHTML}

        <div class="flex justify-between items-center text-xs lg:text-sm text-gray-500 mt-3">
          <span class="inline-flex items-center gap-1">
            <svg class="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
            </svg>
            ${formatFileSize(file.size)}
          </span>
          <span>${file.categoryLabel || ''}</span>
        </div>
      </div>
    `;
  }).join('');
  
  // Renderizar paginación si hay más de una página
  const paginationHTML = totalPages > 1 ? renderSabioPagination(SabioPagination.currentPage, totalPages, totalFiles, 'loadSabioPage') : '';
  
  // Grid responsive: 2 en móvil, 3 en tablet y desktop
  return `
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4 lg:gap-6 mt-6" style="margin-top:25px">
      ${cardsHTML}
    </div>
    ${paginationHTML}
  `;
}

// Sistema de favoritos para sabio.html (idéntico a index.html)
function toggleSabioFavorite(filePath, fileName) {
  console.log('🔥 SABIO.JS: toggleSabioFavorite called for:', fileName);
  
  // Determinar tipo de archivo
  const isAudio = filePath.includes('.mp3') || filePath.includes('.wav') || filePath.includes('.m4a');
  const isPdf = filePath.includes('.pdf');
  
  // Crear objeto item completo similar al de index.html
  const item = {
    id: filePath, // Usar filePath como ID único
    title: fileName,
    url: filePath,
    download_link: filePath,
    type: isAudio ? 'audios' : (isPdf ? 'books' : 'document'),
    category: isAudio ? 'audios' : 'books',
    author: SabioPageState.selectedSabio || 'غير محدد',
    description: `محتوى من ${SabioPageState.selectedSabio || 'الشيخ'} - ${fileName}`,
    date: new Date().toISOString().split('T')[0], // تاريخ اليوم
    views: 0,
    favorites: 0,
    // معلومات إضافية للصوتيات
    ...(isAudio && {
      audio: filePath,
      duration: 'غير محدد'
    }),
    // معلومات إضافية للكتب
    ...(isPdf && {
      pages: 'غير محدد',
      format: 'PDF',
      publisher: 'بيت الإسلام'
    }),
    // إضافة attachments للحصول على أزرار التحميل/التشغيل
    attachments: [{
      url: filePath,
      extension_type: isAudio ? 'MP3' : (isPdf ? 'PDF' : 'FILE'),
      size: 'غير محدد'
    }],
    // معلومات الشيخ
    sabio_name: SabioPageState.selectedSabio,
    sabio_category: SabioPageState.activeCategory,
    source: 'sabio_page' // للتمييز أن هذا من صفحة الشيخ
  };
  
  // Usar el sistema de localStorage idéntico a index.html
  const favorites = JSON.parse(localStorage.getItem('islamicFavorites') || '[]');
  const favoritesData = JSON.parse(localStorage.getItem('islamicFavoritesData') || '{}');
  
  const idStr = filePath.toString();
  const index = favorites.indexOf(idStr);
  
  let newFavorites, newFavoritesData;
  let isFavorited;
  
  if (index === -1) {
    // Agregar a favoritos
    newFavorites = [...favorites, idStr];
    newFavoritesData = { ...favoritesData, [idStr]: item };
    isFavorited = true;
    console.log(`Added "${fileName}" to favorites`);
  } else {
    // Quitar de favoritos
    newFavorites = favorites.filter((_, i) => i !== index);
    const { [idStr]: removed, ...rest } = favoritesData;
    newFavoritesData = rest;
    isFavorited = false;
    console.log(`💔 Removed "${fileName}" from favorites`);
  }
  
  // Guardar en localStorage (idéntico a index.html)
  localStorage.setItem('islamicFavorites', JSON.stringify(newFavorites));
  localStorage.setItem('islamicFavoritesData', JSON.stringify(newFavoritesData));
  
  // Actualizar visualmente el botón que se acaba de hacer clic
  const button = event.target.closest('.favorite-btn');
  if (button) {
    const svg = button.querySelector('svg');
    
    if (isFavorited) {
      button.classList.add('favorited');
      button.style.color = '#ef4444'; // Color rojo para favorito
      if (svg) {
        svg.setAttribute('fill', 'currentColor');
      }
      button.title = 'إزالة من المفضلة';
    } else {
      button.classList.remove('favorited');
      button.style.color = ''; // Restaurar color original
      if (svg) {
        svg.setAttribute('fill', 'none');
      }
      button.title = 'إضافة للمفضلة';
    }
  }
  
  // Actualizar contador de favoritos globalmente
  updateGlobalFavoritesCount();
  
  // Mostrar mensaje de confirmación
  const message = isFavorited ? `تم إضافة "${fileName}" للمفضلة` : `تم حذف "${fileName}" من المفضلة`;
  
  // Use global notification system if available, otherwise fallback to sabio-specific
  if (typeof window.showNotification === 'function') {
    window.showNotification(message, isFavorited ? 'success' : 'info');
  } else {
    showSabioNotification(message, isFavorited ? 'success' : 'info');
  }
  
  // Sync favorites counter globally
  if (typeof window.syncFavoritesCounter === 'function') {
    window.syncFavoritesCounter();
  }
}

// Manejar click en archivos
function handleFileClick(filePath, fileName, extension, fileType) {
  if (fileType === 'audio') {
    // Usar el sistema de audio player existente
    if (window.handleMediaClick) {
      window.handleMediaClick(filePath, fileName, extension);
    } else {
      // Fallback: reproducir directamente
      const audio = new Audio(filePath);
      audio.play().catch(e => console.error('Error playing audio:', e));
    }
  } else {
    // Para PDFs, abrir en nueva ventana
    window.open(filePath, '_blank');
  }
}

// Formatear tamaño de archivo
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Sincronizar AppState con datos de sabio para evitar conflictos
function syncAppStateWithSabio() {
  if (window.AppState && SabioPageState.sabioInfo) {
    const totalFiles = SabioPageState.sabioInfo.stats.total_audio + SabioPageState.sabioInfo.stats.total_pdf;
    const totalPages = Math.ceil(totalFiles / SabioPagination.itemsPerPage);
    const favorites = JSON.parse(localStorage.getItem('islamicFavorites') || '[]');
    
    // Sincronizar AppState con datos correctos de sabio
    window.AppState.totalItems = totalFiles;
    window.AppState.totalPages = totalPages;
    window.AppState.favorites = favorites;
    
    console.log(`🔄 Synced AppState with sabio data: ${totalFiles} items, ${totalPages} pages, ${favorites.length} favorites`);
  }
}

// Actualizar estadísticas dinámicamente según categoría activa y contenido real
function updateSabioStatsDisplay() {
  const activeCategory = SabioPageState.activeCategory;
  const favoritesCount = window.AppState ? window.AppState.favorites.length : 0;
  
  console.log(`🔍 DEBUG updateSabioStatsDisplay: activeCategory="${activeCategory}"`);
  console.log(`🔍 DEBUG currentContent:`, SabioPageState.currentContent);
  
  // Calcular conteos según el contenido real cargado
  let itemCount = 0, label;
  
  if (SabioPageState.currentContent && SabioPageState.currentContent.files) {
    itemCount = SabioPageState.currentContent.files.length;
    console.log(`🔍 DEBUG: Found ${itemCount} files in currentContent`);
  } else {
    console.log(`🔍 DEBUG: No currentContent or files found`);
  }
  
  // Establecer etiqueta según la categoría
  switch (activeCategory) {
    case 'all':
      label = 'إجمالي المواد';
      break;
    case 'duruz':
      label = 'دروس';
      break;
    case 'firak':
      label = 'فرق';
      break;
    case 'pdf':
      label = 'كتب';
      break;
    default:
      label = 'مواد';
  }
  
  const totalPages = Math.ceil(itemCount / SabioPagination.itemsPerPage);
  
  console.log(`🔍 DEBUG: itemCount=${itemCount}, totalPages=${totalPages}, label="${label}"`);
  
  // Actualizar elementos específicos por ID
  const itemsElement = document.getElementById('sabio-stats-items');
  const pagesElement = document.getElementById('sabio-stats-pages');
  const favoritesElement = document.getElementById('sabio-stats-favorites');
  const labelElement = document.getElementById('sabio-stats-label');
  
  if (itemsElement) {
    itemsElement.textContent = itemCount.toLocaleString('ar');
    console.log(`✅ Updated items: ${itemCount}`);
  }
  if (pagesElement) {
    pagesElement.textContent = totalPages.toLocaleString('ar');
    console.log(`✅ Updated pages: ${totalPages}`);
  }
  if (favoritesElement) {
    favoritesElement.textContent = favoritesCount.toLocaleString('ar');
    console.log(`✅ Updated favorites: ${favoritesCount}`);
  }
  if (labelElement) {
    labelElement.textContent = label;
    console.log(`✅ Updated label: ${label}`);
  }
  
  console.log(`📊 Stats updated for category "${activeCategory}": ${itemCount} items, ${totalPages} pages, ${favoritesCount} favorites`);
}

// Función global para actualizar contadores de favoritos en todas las páginas
function updateGlobalFavoritesCount() {
  const favorites = JSON.parse(localStorage.getItem('islamicFavorites') || '[]');
  const favoritesCount = favorites.length;
  
  // Actualizar contadores en sabio.html
  updateSabioStatsDisplay();
  
  // IMPORTANTE: Solo actualizar contadores de app.js si NO estamos en sabio.html
  // Esto evita que app.js sobrescriba los contadores correctos de sabio con valores 0
  if (window.updateStatsDisplay && !window.location.pathname.includes('sabio.html')) {
    window.updateStatsDisplay();
  } else if (window.location.pathname.includes('sabio.html')) {
    console.log('🚫 Skipping app.js updateStatsDisplay in sabio.html to prevent counter reset');
  }
  
  console.log(`🌍 Global favorites count updated: ${favoritesCount}`);
}

// Función para mostrar notificaciones (similar a index.html)
function showSabioNotification(message, type = 'info') {
  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.className = `sabio-notification ${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : '#3b82f6'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-size: 14px;
    max-width: 300px;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Animar entrada
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 10);
  
  // Remover después de 3 segundos
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Función para verificar si un item está en favoritos
function isSabioItemFavorited(filePath) {
  const favorites = JSON.parse(localStorage.getItem('islamicFavorites') || '[]');
  return favorites.includes(filePath.toString());
}

// Cargar contenido de una categoría específica - FUNCIÓN ESPECÍFICA DE SABIO.JS
async function sabioLoadCategoryContent(category) {
  console.log('🔥 SABIO.JS FUNCTION: sabioLoadCategoryContent called');
  return await loadCategoryContentInternal(category);
}

// Función interna para cargar contenido (renombrada para evitar conflictos)
async function loadCategoryContentInternal(category) {
  console.log('🚨 FUNCTION START: loadCategoryContent called with category:', category);
  console.log('🚨 FUNCTION START: typeof category:', typeof category);
  console.log('🚨 FUNCTION START: SabioPageState exists:', !!SabioPageState);
  
  console.log(`Loading category content: "${category}"`);
  console.log('SabioPageState debug:');
  console.log('  - selectedSabio:', SabioPageState.selectedSabio);
  console.log('  - sabioInfo:', SabioPageState.sabioInfo ? 'exists' : 'null');
  console.log('  - activeCategory:', SabioPageState.activeCategory);
  console.log('  - localStorage sabio:', localStorage.getItem('selectedSabio'));
  
  // Reset pagination SOLO cuando cambia la categoría (no en navegación de páginas)
  if (SabioPageState.activeCategory !== category) {
    console.log(`🔄 Category changed from "${SabioPageState.activeCategory}" to "${category}" - resetting pagination`);
    SabioPagination.currentPage = 1;
  } else {
    console.log(`Same category "${category}" - keeping current page: ${SabioPagination.currentPage}`);
  }
  
  if (!SabioPageState.selectedSabio) {
    console.error('❌ No sabio selected in SabioPageState');
    console.log('🔧 Attempting to recover from localStorage...');
    const sabioFromStorage = localStorage.getItem('selectedSabio');
    if (sabioFromStorage) {
      console.log(`🔄 Recovering sabio from localStorage: "${sabioFromStorage}"`);
      SabioPageState.selectedSabio = sabioFromStorage;
    } else {
      console.error('❌ No sabio found in localStorage either!');
      return;
    }
  }
  
  console.log(`Using sabio: "${SabioPageState.selectedSabio}"`);
  console.log(`Proceeding with category: "${category}"`);
  
  // Verificar que tenemos la información del sabio
  if (!SabioPageState.sabioInfo) {
    console.warn('⚠️ sabioInfo is missing, this might cause issues');
  }
  
  SabioPageState.activeCategory = category;
  console.log(`🏷️ Active category set to: "${category}"`);
  
  // Actualizar estadísticas según la nueva categoría
  updateSabioStatsDisplay();
  
  // Actualizar botones de categoría visualmente
  const categoryButtons = document.querySelectorAll('.category-btn');
  categoryButtons.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.category === category) {
      btn.classList.add('active');
    }
  });
  
  const contentSection = document.getElementById('contentSection');
  if (contentSection) {
    contentSection.innerHTML = `
      <div class="loading-spinner text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        <p class="mt-4 text-emerald-700">جاري التحميل...</p>
      </div>
    `;
  }
  
  try {
    let contentData;
    
    if (category === 'all') {
      console.log('📂 Loading ALL categories content');
      // Para "all", cargar contenido de todas las categorías
      const categories = ['duruz', 'firak', 'pdf'];
      const allFiles = [];
      
      for (const cat of categories) {
        try {
          const catData = await loadSabioContent(SabioPageState.selectedSabio, cat);
          if (catData && catData.files && catData.files.length > 0) {
            // Agregar categoría a cada archivo para identificación
            catData.files.forEach(file => {
              file.category = cat;
              file.categoryLabel = cat === 'duruz' ? 'دروس' : cat === 'firak' ? 'فرق' : 'كتاب';
            });
            allFiles.push(...catData.files);
          }
        } catch (error) {
          console.warn(`Warning: Could not load category "${cat}":`, error);
        }
      }
      
      contentData = {
        sabio: SabioPageState.selectedSabio,
        category: 'all',
        files: allFiles,
        total: allFiles.length
      };
      
      console.log(`✅ Loaded ${allFiles.length} total files from all categories`);
    } else {
      console.log(`Loading specific category: "${category}"`);
      contentData = await loadSabioContent(SabioPageState.selectedSabio, category);
    }
    
    SabioPageState.currentContent = contentData;
    
    // Actualizar estadísticas con el contenido real cargado
    updateSabioStatsDisplay();
    
    // Renderizar contenido
    renderSabioContent();
  } catch (error) {
    console.error('Error loading category content:', error);
    if (contentSection) {
      contentSection.innerHTML = `
        <div class="text-center py-8 text-red-500">
          خطأ في تحميل المحتوى
        </div>
      `;
    }
  }
}

// Inicializar la página del sabio
async function initializeSabioPage() {
  console.log('🚀 Initializing Sabio Page...');
  
  // Obtener el sabio seleccionado de localStorage
  const selectedSabio = localStorage.getItem('selectedSabio');
  console.log('Selected sabio from localStorage:', selectedSabio);
  
  if (!selectedSabio) {
    console.error('❌ No sabio selected in localStorage, redirecting to index.html');
    // Para debugging, vamos a establecer un sabio por defecto en lugar de redirigir
    const defaultSabio = 'sheik ibn baz';
    console.log(`🔧 Setting default sabio: "${defaultSabio}" for testing`);
    localStorage.setItem('selectedSabio', defaultSabio);
    // window.location.href = 'index.html';
    // return;
  }
  
  SabioPageState.selectedSabio = selectedSabio;
  
  // Cargar información del sabio
  const sabioInfo = await loadSabioInfo(selectedSabio);
  
  if (!sabioInfo) {
    // Mostrar error si no se puede cargar la información
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="container mx-auto px-4 py-12 text-center">
          <h2 class="text-2xl font-bold text-red-600 mb-4">خطأ في التحميل</h2>
          <p class="text-gray-600 mb-8">لا يمكن تحميل معلومات "${selectedSabio}"</p>
          <button onclick="window.location.href='index.html'" class="btn btn-primary">
            العودة للرئيسية
          </button>
        </div>
      `;
    }
    return;
  }
  
  SabioPageState.sabioInfo = sabioInfo;
  
  // Renderizar الصفحة
  renderSabioContent();
  
  // Actualizar título de la página
  document.title = `${selectedSabio} - بيت الإسلام`;
  
  // Configurar protección del DOM
  setupDOMProtection();
  
  // Cargar automáticamente la categoría "all" por defecto
  console.log('🚀 Auto-loading default category: "all"');
  sabioLoadCategoryContent('all');
}

function renderSabioContent() {
  const mainContent = document.getElementById('mainContent');
  if (!mainContent) {
    console.error('Main content container not found');
    return;
  }

  // FORZAR limpieza del contenido previo de app.js
  mainContent.innerHTML = '';
  
  // Asegurar que el estado de sabio tenga prioridad
  window.SABIO_PAGE_ACTIVE = true;

  if (!SabioPageState.sabioInfo) {
    mainContent.innerHTML = `
      <div class="error-container">
        <div class="error-message">
          <h2>خطأ في تحميل البيانات</h2>
          <p>لم يتم العثور على معلومات الشيخ المطلوب</p>
          <button onclick="window.location.reload()" class="retry-btn">إعادة المحاولة</button>
        </div>
      </div>
    `;
    return;
  }

  const heroSection = renderSabioHero(SabioPageState.sabioInfo);
  const categoryButtons = renderCategoryButtons(SabioPageState.sabioInfo);
  
  // Mejorar la lógica de renderizado de contenido
  let contentCards;
  if (SabioPageState.currentContent && SabioPageState.currentContent.files && SabioPageState.currentContent.files.length > 0) {
    contentCards = renderContentCards(SabioPageState.currentContent);
  } else {
    // Mostrar mensaje de carga mientras se obtiene el contenido
    contentCards = `
      <div class="loading-container text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        <p class="mt-4 text-emerald-700">جاري تحميل المحتوى...</p>
      </div>
    `;
  }

  // RENDERIZADO FORZADO - sobrescribir cualquier contenido previo
  mainContent.innerHTML = `
    ${heroSection}
    <div class="container mx-auto px-4 py-8">
      ${categoryButtons}
      <div id="contentSection" class="mt-8">
        ${contentCards}
      </div>
    </div>
  `;

  // Actualizar navegación activa
  if (SabioPageState.activeCategory) {
    const activeBtn = document.querySelector(`[data-category="${SabioPageState.activeCategory}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
      activeBtn.classList.remove('btn-outline');
    }
  }
  
  console.log('✅ Sabio content rendered successfully');
  
  // Actualizar estadísticas después del renderizado
  setTimeout(() => {
    updateSabioStatsDisplay();
  }, 50);
  
  // IMPORTANTE: Configurar event listeners DESPUÉS de renderizar
  setTimeout(() => {
    setupCategoryEventListeners();
  }, 100); // Breve delay para asegurar que el DOM se haya actualizado
  
  // Si estamos en una página diferente a la 1, hacer scroll al contenido
  // (esto maneja el caso cuando se carga contenido nuevo via paginación)
  if (SabioPagination.currentPage > 1) {
    setTimeout(() => {
      scrollToContentTop();
    }, 200); // Delay adicional para asegurar que el renderizado esté completo
  }
}

// ...

// Listen for favorites updates from other pages
window.addEventListener('favoritesUpdated', function(event) {
  const { count, favorites } = event.detail;
  
  // Update favorites count in stats display
  const statsElements = document.querySelectorAll('.stats-number');
  if (statsElements.length >= 3) {
    statsElements[2].textContent = count.toLocaleString('ar');
  }
});

// Event listeners - PRIORIDAD ABSOLUTA (solo en sabio.html)
document.addEventListener('DOMContentLoaded', function() {
  // Solo ejecutar la lógica completa de sabio.js en sabio.html
  if (!window.SABIO_PAGE_ACTIVE) {
    console.log('🚀 Sabio.js loaded in index.html - providing categories functionality only');
    return; // Exit early, don't run sabio-specific initialization
  }
  
  console.log('🚀 Sabio.js DOMContentLoaded - PRIORITY CONTROL');
  
  // Configurar protección del DOM
  setupDOMProtection();
  
  // Prevenir interferencia de app.js
  preventAppJsInterference();
  
  // Check for saved navigation state and restore it (same behavior as index.html)
  const savedNavState = localStorage.getItem('sabioNavState');
  console.log('🔍 DEBUGGING: Checking for sabio navigation state...');
  console.log('🔍 savedNavState:', savedNavState);
  
  // Clear old complex navigation state to prevent conflicts
  localStorage.removeItem('currentNavigationState');
  
  if (savedNavState) {
    try {
      const navState = JSON.parse(savedNavState);
      const timeDiff = Date.now() - navState.timestamp;
      
      console.log('🔍 DEBUGGING: Found saved navigation state:', navState);
      console.log('🔍 Time difference (minutes):', timeDiff / 60000);
      
      // Only restore if less than 1 hour old and matches current page type
      if (timeDiff < 3600000 && navState.pageType === 'sabio') {
        console.log(`🔄 ✅ RESTORING sabio navigation state: ${navState.page}`);
        
        // Update navigation UI
        document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
          link.classList.remove('active');
          if (link.dataset.page === navState.page) {
            link.classList.add('active');
          }
        });
        
        // Handle different navigation states
        if (navState.page === 'favorites') {
          // Load sabio info first, then show favorites
          initializeSabioPageNormally(() => {
            setTimeout(() => {
              renderFavoritesPage();
            }, 500);
          });
        } else if (navState.page === 'categories') {
          // Load sabio info first, then show categories
          initializeSabioPageNormally(() => {
            setTimeout(() => {
              renderCategoriesPage();
            }, 500);
          });
        } else {
          // For home or other states, initialize sabio page normally
          initializeSabioPageNormally();
        }
        
        // Clear the saved state since we've used it
        localStorage.removeItem('sabioNavState');
        
        return; // Exit early, don't run normal initialization
      } else {
        // Clear old state
        localStorage.removeItem('sabioNavState');
      }
    } catch (e) {
      console.error('Error parsing saved navigation state:', e);
      localStorage.removeItem('sabioNavState');
    }
  }
  
  // Normal initialization if no valid saved state
  initializeSabioPageNormally();
  
  console.log('✅ Sabio.js initialization complete');
});

// Function to handle normal sabio page initialization
function initializeSabioPageNormally(callback) {
  // Obtener el nombre del sabio de la URL
  const urlParams = new URLSearchParams(window.location.search);
  let sabioName = urlParams.get('sabio');
  
  // Si no está en la URL, intentar obtenerlo de localStorage (respaldo)
  if (!sabioName) {
    sabioName = localStorage.getItem('selectedSabio');
    console.log(`🔄 No sabio in URL, trying localStorage: ${sabioName}`);
    
    // Si encontramos el sabio en localStorage, actualizar la URL
    if (sabioName) {
      const newUrl = `${window.location.pathname}?sabio=${encodeURIComponent(sabioName)}`;
      window.history.replaceState({}, '', newUrl);
      console.log(`🔄 Updated URL with sabio parameter: ${newUrl}`);
    }
  }
  
  if (sabioName) {
    console.log(`📖 Loading sabio: "${sabioName}"`);
    
    SabioPageState.selectedSabio = sabioName;
    
    // Cargar información y contenido del sabio
    loadSabioInfo(sabioName).then(sabioInfo => {
      if (sabioInfo) {
        SabioPageState.sabioInfo = sabioInfo;
        console.log('✅ Sabio info saved to SabioPageState:', SabioPageState.sabioInfo);
        
        // Ejecutar callback si se proporciona
        if (callback) {
          callback();
          return;
        }
        
        // Cargar contenido inicial (categoría "Todo") después de cargar la info
        renderSabioContent();
        setTimeout(() => {
          loadCategoryContentInternal('all');
        }, 200);
      } else {
        console.error('❌ Failed to load sabio info');
      }
    }).catch(error => {
      console.error('❌ Error loading sabio info:', error);
    });
  } else {
    console.error('❌ No sabio name found in URL or localStorage');
    // Redirigir a la página principal si no hay sabio especificado
    window.location.href = 'index.html';
  }
  
  // Inicializar características compatibles de app.js
  setTimeout(() => {
    initializeCompatibleAppJsFeatures();
  }, 100);
  
  // Configurar event listeners después del renderizado inicial
  setTimeout(() => {
    setupCategoryEventListeners();
  }, 500);
  
  // Limpiar cualquier interferencia adicional de app.js
  setTimeout(() => {
    cleanupAppJsInterference();
  }, 1000);
}

// Función para inicializar SOLO las características compatibles de app.js
// PERMITIDO: search, audio manager, y navegación esencial
function initializeCompatibleAppJsFeatures() {
  console.log('Initializing allowed app.js features: search + audio manager + navigation');
  
  // PERMITIR: Funcionalidades del reproductor de audio
  if (window.AppState && window.AppState.audioQueue !== undefined) {
    console.log('✅ ALLOWED: Audio player functionality from app.js');
    
    // Asegurar que las funciones de audio estén disponibles
    if (window.handleMediaClick) {
      console.log('  - handleMediaClick available');
    }
    if (window.togglePlayPause) {
      console.log('  - togglePlayPause available');
    }
    if (window.playNext) {
      console.log('  - playNext available');
    }
    if (window.playPrevious) {
      console.log('  - playPrevious available');
    }
    if (window.toggleQueue) {
      console.log('  - toggleQueue available');
    }
    if (window.clearQueue) {
      console.log('  - clearQueue available');
    }
  }
  
  // IMPLEMENTAR: Sistema de búsqueda dedicado para sabio.html
  initializeSabioSearch();
  console.log('✅ IMPLEMENTED: Dedicated search system for sabio.html');
  
  // PERMITIR: Funcionalidades de navegación esenciales
  if (window.toggleMobileMenu) {
    console.log('✅ ALLOWED: Mobile menu functionality from app.js');
  }
  if (window.closeMobileMenu) {
    console.log('✅ ALLOWED: Close mobile menu functionality from app.js');
  }
  
  // PERMITIR: Funcionalidades del mega menú de sabios
  if (window.toggleMegaMenu) {
    console.log('✅ ALLOWED: Sabios mega menu functionality from app.js');
  }
  if (window.closeMegaMenu) {
    console.log('✅ ALLOWED: Close sabios mega menu functionality from app.js');
  }
  if (window.navigateToSabio) {
    console.log('✅ ALLOWED: Navigate to sabio functionality from app.js');
  }
  
  // PERMITIR: Funcionalidades de favoritos (para compatibilidad)
  if (window.toggleFavorite) {
    console.log('✅ ALLOWED: Favorites functionality from app.js');
  }
  
  // PERMITIR: Funcionalidades de video
  if (window.showVideoPlayer) {
    console.log('✅ ALLOWED: Video player functionality from app.js');
  }
  if (window.closeVideoPlayer) {
    console.log('✅ ALLOWED: Close video player functionality from app.js');
  }
  
  console.log('❌ BLOCKED: Only content rendering and category filtering functions');
}

// Función navigateToPage específica para sabio.html - override app.js version
function navigateToPage(page) {
  console.log(`🧭 Sabio.js navigateToPage called with: "${page}"`);
  
  // Cerrar menú móvil si está abierto
  if (window.closeMobileMenu) {
    window.closeMobileMenu();
  }
  
  // IMPORTANTE: Guardar estado de navegación para todas las páginas (igual que index.html)
  const simpleState = {
    page: page,
    timestamp: Date.now(),
    pageType: 'sabio'
  };
  
  localStorage.setItem('sabioNavState', JSON.stringify(simpleState));
  console.log(`🔄 Sabio navigation state saved: ${page}`);
  
  // Actualizar estados de navegación activa
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.page === page) {
      link.classList.add('active');
    }
  });
  
  // Manejar diferentes páginas
  switch (page) {
    case 'categories':
      console.log('🏷️ Showing categories page in sabio.html');
      SabioPageState.activeNav = 'categories';
      renderCategoriesPage();
      break;
    case 'favorites':
      console.log('🔥 Showing favorites page in sabio.html');
      SabioPageState.activeNav = 'favorites';
      renderFavoritesPage();
      break;
    case 'home':
    default:
      console.log('Returning to sabio main content');
      SabioPageState.activeNav = 'home';
      // Limpiar estado de navegación al volver a home
      localStorage.removeItem('sabioNavState');
      localStorage.removeItem('currentNavigationState');
      console.log('🗑️ Navigation states cleared - returning to sabio main content');
      
      // Asegurar que tenemos la información del sabio antes de renderizar
      if (!SabioPageState.sabioInfo && SabioPageState.selectedSabio) {
        console.log('🔄 Reloading sabio info before rendering content...');
        loadSabioInfo(SabioPageState.selectedSabio).then(sabioInfo => {
          if (sabioInfo) {
            SabioPageState.sabioInfo = sabioInfo;
            renderSabioContent();
            // Cargar contenido por defecto
            setTimeout(() => {
              loadCategoryContentInternal('all');
            }, 100);
          }
        });
      } else {
        renderSabioContent();
        // Asegurar que se carga el contenido
        setTimeout(() => {
          if (!SabioPageState.currentContent || !SabioPageState.currentContent.files) {
            console.log('🔄 No content found, loading default category...');
            loadCategoryContentInternal('all');
          }
        }, 100);
      }
      break;
  }
}

// Renderizar página de categorías similar a index.html
function renderCategoriesPage() {
  const mainContent = document.getElementById('mainContent');
  if (!mainContent) return;
  
  // Limpiar contenido previo
  mainContent.innerHTML = '';
  
  // Definir categorías disponibles (similar a app.js)
  const categories = [
    {
      key: 'books',
      name: 'الكتب',
      icon: '',
      color: 'from-blue-500 to-blue-600',
      description: 'مجموعة شاملة من الكتب الإسلامية'
    },
    {
      key: 'articles', 
      name: 'المقالات',
      icon: '',
      color: 'from-green-500 to-green-600',
      description: 'مقالات ودراسات إسلامية متنوعة'
    },
    {
      key: 'fatwa',
      name: 'الفتاوى',
      icon: '⚖️',
      color: 'from-purple-500 to-purple-600', 
      description: 'فتاوى شرعية من علماء معتبرين'
    },
    {
      key: 'audios',
      name: 'الصوتيات',
      icon: '',
      color: 'from-red-500 to-red-600',
      description: 'محاضرات ودروس صوتية'
    },
    {
      key: 'videos',
      name: 'المرئيات', 
      icon: '',
      color: 'from-yellow-500 to-yellow-600',
      description: 'محاضرات ودروس مرئية'
    },
    {
      key: 'videos_ulamah',
      name: 'فيديوهات دعويه', 
      icon: '',
      color: 'from-purple-500 to-purple-600',
      description: 'فيديوهات ومحاضرات العلماء'
    }
  ];
  
  const categoriesHTML = categories.map(category => `
    <div 
      class="category-card bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 p-6 text-center"
      onclick="filterByTypeAndNavigate('${category.key}')"
    >
      <div class="category-icon bg-gradient-to-br ${category.color} text-white mx-auto mb-4 w-12 h-12 lg:w-16 lg:h-16 rounded-full flex items-center justify-center text-xl lg:text-2xl">
        ${category.icon}
      </div>
      <h3 class="text-sm lg:text-xl font-bold text-gray-900 mb-2">${category.name}</h3>
      <p class="text-gray-600 text-xs lg:text-sm">${category.description}</p>
    </div>
  `).join('');
  
  mainContent.innerHTML = `
    <section class="container mx-auto px-4 py-8">
      <div class="text-center mb-12">
        <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">التصنيفات</h1>
        <p class="text-gray-600 text-lg">اختر التصنيف الذي تريد استكشافه</p>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
        ${categoriesHTML}
      </div>
    </section>
  `;
}

// Función para filtrar por tipo y navegar (funciona en ambas páginas)
function filterByTypeAndNavigate(type) {
  console.log(`Filtering by type: ${type} and navigating to home`);
  
  // Detectar en qué página estamos
  const currentPage = window.location.pathname;
  
  if (currentPage.includes('sabio.html')) {
    // Si estamos en sabio.html, redirigir a index.html con el filtro aplicado
    localStorage.setItem('pendingFilter', type);
    window.location.href = 'index.html';
  } else {
    // Si estamos en index.html, aplicar el filtro directamente
    if (window.filterByType) {
      window.filterByType(type);
      if (window.navigateToPage) {
        window.navigateToPage('home');
      }
    } else {
      // Fallback: guardar filtro y recargar
      localStorage.setItem('pendingFilter', type);
      window.location.reload();
    }
  }
}

// Function to remove favorite with smooth animation
function removeFavoriteWithAnimation(itemId, itemName) {
  const cardElement = document.getElementById(`favorite-card-${itemId}`);
  
  if (cardElement) {
    // Add fade-out animation
    cardElement.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
    cardElement.style.opacity = '0';
    cardElement.style.transform = 'translateX(-20px)';
    
    // Wait for animation to complete, then remove from favorites
    setTimeout(() => {
      removeFavoriteFromPage(itemId, itemName);
    }, 300);
  } else {
    // Fallback if card element not found
    removeFavoriteFromPage(itemId, itemName);
  }
}

// ==================== SABIO SEARCH SYSTEM ====================

// Search state for sabio.html
const SabioSearchState = {
  searchQuery: '',
  searchResults: [],
  searchTotalItems: 0,
  searchTotalPages: 0,
  searchCurrentPage: 1,
  isSearching: false,
  searchDebounceTimer: null
};

// Initialize sabio search system
function initializeSabioSearch() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) {
    console.warn('Search input not found in sabio.html');
    return;
  }
  
  // Add debounced search input handler
  searchInput.addEventListener('input', handleSabioSearchInput);
  
  // Add Enter key handler
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(SabioSearchState.searchDebounceTimer);
      performSabioSearch();
    }
  });
  
  // Add search button handler if exists
  const searchBtn = document.querySelector('.search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      clearTimeout(SabioSearchState.searchDebounceTimer);
      performSabioSearch();
    });
  }
  
  console.log('🔍 Sabio search system initialized');
}

// Debounced search input handler for sabio
function handleSabioSearchInput() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;
  
  clearTimeout(SabioSearchState.searchDebounceTimer);
  SabioSearchState.searchDebounceTimer = setTimeout(() => {
    const query = searchInput.value.trim();
    if (query.length >= 2) {
      performSabioSearch(1, query);
    } else if (query.length === 0) {
      clearSabioSearch();
    }
  }, 300);
}

// Main sabio search function
async function performSabioSearch(page = 1, customQuery = null) {
  const searchInput = document.getElementById('searchInput');
  const searchQuery = customQuery || (searchInput ? searchInput.value.trim() : '');
  
  if (!searchQuery) {
    clearSabioSearch();
    return;
  }
  
  SabioSearchState.searchQuery = searchQuery;
  SabioSearchState.isSearching = true;
  
  console.log(`🔍 Sabio search: "${searchQuery}" in category "${SabioPageState.activeCategory}" on page ${page}`);
  
  // Show loading state
  showSabioSearchLoading();
  
  try {
    // Get current sabio name for filtering - with fallback
    let currentSabio = SabioPageState.currentSabio;
    
    // If currentSabio is not set, try to get it from URL or localStorage
    if (!currentSabio) {
      const urlParams = new URLSearchParams(window.location.search);
      currentSabio = urlParams.get('sabio');
      
      if (!currentSabio) {
        currentSabio = localStorage.getItem('currentSabio');
      }
      
      // If still not found, try to extract from page title or use default
      if (!currentSabio) {
        const pageTitle = document.title;
        if (pageTitle.includes('الشيخ')) {
          currentSabio = pageTitle.split(' - ')[0];
        } else {
          currentSabio = 'الشيخ';
        }
      }
      
      // Update the state
      SabioPageState.currentSabio = currentSabio;
      console.log(`🔧 Fixed missing sabio name: ${currentSabio}`);
    }
    
    console.log(`👨‍🏫 Searching in sabio: ${currentSabio}`);
    
    // Perform search within current sabio's content
    const searchResults = await searchInSabioContent(searchQuery, currentSabio, SabioPageState.activeCategory, page);
    
    // Validate search results
    if (!searchResults || typeof searchResults !== 'object') {
      throw new Error('Invalid search results format');
    }
    
    // Update search state
    SabioSearchState.searchResults = searchResults.data || [];
    SabioSearchState.searchTotalItems = searchResults.totalItems || 0;
    SabioSearchState.searchTotalPages = searchResults.totalPages || 1;
    SabioSearchState.searchCurrentPage = page;
    
    console.log(`✅ Sabio search completed: ${SabioSearchState.searchTotalItems} results found`);
    
    // Display search results
    displaySabioSearchResults();
    
  } catch (error) {
    console.error('❌ Sabio search error:', error);
    const errorMessage = error.message || 'حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.';
    showSabioSearchError(errorMessage);
  } finally {
    SabioSearchState.isSearching = false;
  }
}

// Search within sabio content with category filtering
async function searchInSabioContent(query, sabioName, category, page = 1) {
  const lowerQuery = query.toLowerCase();
  const itemsPerPage = 12;
  
  console.log(`🔍 searchInSabioContent called with:`, { query, sabioName, category, page });
  
  // Get all sabio content data
  let allSabioData = [];
  
  // Try to get from current loaded data first
  if (SabioPageState.currentData && SabioPageState.currentData.length > 0) {
    allSabioData = SabioPageState.currentData;
    console.log(`📁 Using current loaded data: ${allSabioData.length} items`);
  } else {
    // Load all categories for comprehensive search
    console.log(`📁 Loading data for comprehensive search...`);
    try {
      // Check if loadSabioData function exists
      if (typeof loadSabioData !== 'function') {
        console.error('loadSabioData function not found');
        throw new Error('loadSabioData function not available');
      }
      
      const categories = ['الكل', 'دروس', 'فرق', 'كتاب'];
      for (const cat of categories) {
        if (cat === 'الكل') continue;
        console.log(`📂 Loading category: ${cat}`);
        const data = await loadSabioData(sabioName, cat);
        if (data && data.length > 0) {
          allSabioData = allSabioData.concat(data);
          console.log(`✅ Loaded ${data.length} items from ${cat}`);
        }
      }
    } catch (error) {
      console.error('Error loading sabio data for search:', error);
      // Try to use any available data from SabioPageState
      if (SabioPageState.allData && SabioPageState.allData.length > 0) {
        allSabioData = SabioPageState.allData;
        console.log(`🔄 Using fallback data: ${allSabioData.length} items`);
      } else {
        throw new Error('لا توجد بيانات متاحة للبحث');
      }
    }
  }
  
  console.log(`📁 Total data available for search: ${allSabioData.length} items`);
  
  // Apply category filtering first if not "الكل"
  let categoryFilteredData = allSabioData;
  if (category && category !== 'الكل') {
    categoryFilteredData = allSabioData.filter(item => {
      const itemCategory = item.category || item.type || '';
      return itemCategory.toLowerCase().includes(category.toLowerCase()) || 
             category.toLowerCase().includes(itemCategory.toLowerCase());
    });
    
    console.log(`📂 Category filter "${category}": ${categoryFilteredData.length}/${allSabioData.length} items`);
  }
  
  // Apply text search filtering
  const filteredData = categoryFilteredData.filter(item => {
    // Search in title
    const titleMatch = item.title && item.title.toLowerCase().includes(lowerQuery);
    
    // Search in description
    const descMatch = item.description && item.description.toLowerCase().includes(lowerQuery);
    
    // Search in file name
    const fileMatch = item.file && item.file.toLowerCase().includes(lowerQuery);
    
    // Search in category
    const categoryMatch = item.category && item.category.toLowerCase().includes(lowerQuery);
    
    // Search in additional metadata
    const metaMatch = (
      (item.duration && item.duration.toLowerCase().includes(lowerQuery)) ||
      (item.size && item.size.toLowerCase().includes(lowerQuery)) ||
      (item.format && item.format.toLowerCase().includes(lowerQuery))
    );
    
    return titleMatch || descMatch || fileMatch || categoryMatch || metaMatch;
  });
  
  // Calculate pagination
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);
  
  return {
    data: paginatedData,
    totalItems: totalItems,
    totalPages: totalPages,
    currentPage: page
  };
}

// Display sabio search results
function displaySabioSearchResults() {
  const mainContent = document.getElementById('mainContent');
  if (!mainContent) return;
  
  const { searchResults, searchTotalItems, searchCurrentPage, searchTotalPages, searchQuery } = SabioSearchState;
  
  if (searchResults.length === 0) {
    showSabioSearchNoResults();
    return;
  }
  
  // Create search results HTML
  const resultsHTML = `
    <div class="search-results-container">
      <div class="container mx-auto px-4 py-8">
        <div class="search-results-header mb-6">
          <h3 class="text-2xl lg:text-3xl font-bold text-emerald-900 mb-2">نتائج البحث في ${SabioPageState.currentSabio}</h3>
          <p class="text-emerald-700 mb-2">تم العثور على ${searchTotalItems} نتيجة للبحث عن "${searchQuery}"</p>
          <p class="text-sm text-gray-600">التصنيف: ${SabioPageState.activeCategory}</p>
          <button onclick="clearSabioSearch()" class="mt-2 text-emerald-600 hover:text-emerald-800 text-sm">
            ← العودة إلى ${SabioPageState.currentSabio}
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${searchResults.map(item => renderSabioSearchCard(item)).join('')}
        </div>
        
        ${searchTotalPages > 1 ? renderSabioSearchPagination() : ''}
      </div>
    </div>
  `;
  
  mainContent.innerHTML = resultsHTML;
  
  // Update page state to search mode
  SabioPageState.isInSearchMode = true;
}

// Render individual search result card
function renderSabioSearchCard(item) {
  const isAudio = item.file && item.file.toLowerCase().includes('.mp3');
  const isPDF = item.file && item.file.toLowerCase().includes('.pdf');
  const isFavorited = localStorage.getItem('islamicFavorites')?.includes(item.id) || false;
  
  return `
    <div class="sabio-card bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6">
      <div class="flex justify-between items-start mb-4">
        <span class="inline-block px-3 py-1 text-xs font-semibold rounded-full ${
          isAudio ? 'bg-blue-100 text-blue-800' : 
          isPDF ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
        }">
          ${item.category || (isAudio ? 'صوتي' : isPDF ? 'ملف' : 'محتوى')}
        </span>
        <button 
          class="favorite-btn ${isFavorited ? 'favorited' : ''}" 
          onclick="toggleSabioFavorite('${item.id}', '${item.title}', this)"
          title="${isFavorited ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}"
        >
          <svg class="w-5 h-5" fill="${isFavorited ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
          </svg>
        </button>
      </div>
      
      <h4 class="text-lg font-bold text-gray-900 mb-3 arabic-text leading-relaxed">
        ${highlightSearchTerms(item.title, SabioSearchState.searchQuery)}
      </h4>
      
      ${item.description ? `
        <p class="text-gray-600 mb-4 arabic-text leading-relaxed text-sm">
          ${highlightSearchTerms(item.description, SabioSearchState.searchQuery)}
        </p>
      ` : ''}
      
      <div class="flex justify-between items-center text-xs text-gray-500 mb-4">
        ${item.duration ? `<span>المدة: ${item.duration}</span>` : ''}
        ${item.size ? `<span>الحجم: ${item.size}</span>` : ''}
      </div>
      
      <div class="flex gap-2">
        ${isAudio ? `
          <button 
            onclick="playAudioFromSabio('${item.file}', '${item.title}')"
            class="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm"
          >
            ▶ تشغيل
          </button>
        ` : ''}
        
        ${item.file ? `
          <button 
            onclick="downloadSabioFile('${item.file}', '${item.title}')"
            class="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            تحميل
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

// Highlight search terms in text
function highlightSearchTerms(text, query) {
  if (!query || !text) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
}

// Render search pagination
function renderSabioSearchPagination() {
  const { searchCurrentPage, searchTotalPages } = SabioSearchState;
  
  if (searchTotalPages <= 1) return '';
  
  const prevPage = searchCurrentPage > 1 ? searchCurrentPage - 1 : null;
  const nextPage = searchCurrentPage < searchTotalPages ? searchCurrentPage + 1 : null;
  
  return `
    <div class="flex justify-center items-center mt-8 gap-4">
      ${prevPage ? `
        <button 
          onclick="performSabioSearch(${prevPage})"
          class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          ← السابق
        </button>
      ` : ''}
      
      <span class="text-gray-600">
        صفحة ${searchCurrentPage} من ${searchTotalPages}
      </span>
      
      ${nextPage ? `
        <button 
          onclick="performSabioSearch(${nextPage})"
          class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          التالي →
        </button>
      ` : ''}
    </div>
  `;
}

// Show loading state for search
function showSabioSearchLoading() {
  const mainContent = document.getElementById('mainContent');
  if (!mainContent) return;
  
  mainContent.innerHTML = `
    <div class="loading-container">
      <div class="container mx-auto px-4 py-12 text-center">
        <div class="loading-spinner mb-4"></div>
        <p class="text-gray-600">جاري البحث في ${SabioPageState.currentSabio}...</p>
      </div>
    </div>
  `;
}

// Show no results state
function showSabioSearchNoResults() {
  const mainContent = document.getElementById('mainContent');
  if (!mainContent) return;
  
  mainContent.innerHTML = `
    <div class="no-results-container">
      <div class="container mx-auto px-4 py-12 text-center">
        <div class="text-4xl lg:text-6xl mb-6">🔍</div>
        <h2 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">لا توجد نتائج</h2>
        <p class="text-gray-600 mb-8">
          لم نتمكن من العثور على نتائج للبحث عن "${SabioSearchState.searchQuery}" في ${SabioPageState.currentSabio}
        </p>
        <div class="search-suggestions mb-8">
          <h3 class="text-lg font-semibold mb-4">اقتراحات للبحث:</h3>
          <ul class="text-gray-600 space-y-2">
            <li>• تأكد من صحة الكلمات المكتوبة</li>
            <li>• جرب استخدام كلمات مفتاحية مختلفة</li>
            <li>• ابحث في تصنيف "الكل" للحصول على نتائج أوسع</li>
            <li>• جرب البحث في علماء آخرين</li>
          </ul>
        </div>
        <button 
          onclick="clearSabioSearch()" 
          class="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          العودة إلى ${SabioPageState.currentSabio}
        </button>
      </div>
    </div>
  `;
}

// Show search error
function showSabioSearchError(message) {
  const mainContent = document.getElementById('mainContent');
  if (!mainContent) return;
  
  mainContent.innerHTML = `
    <div class="error-container">
      <div class="container mx-auto px-4 py-12 text-center">
        <div class="text-4xl lg:text-6xl mb-6">⚠️</div>
        <h2 class="text-2xl lg:text-3xl font-bold text-red-600 mb-4">خطأ في البحث</h2>
        <p class="text-gray-600 mb-8">${message}</p>
        <div class="flex gap-4 justify-center">
          <button 
            onclick="performSabioSearch()" 
            class="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            إعادة المحاولة
          </button>
          <button 
            onclick="clearSabioSearch()" 
            class="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            العودة إلى ${SabioPageState.currentSabio || 'الصفحة الرئيسية'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// Clear sabio search and return to normal view
function clearSabioSearch() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = '';
  }
  
  // Reset search state
  SabioSearchState.searchQuery = '';
  SabioSearchState.searchResults = [];
  SabioSearchState.searchTotalItems = 0;
  SabioSearchState.searchTotalPages = 0;
  SabioSearchState.searchCurrentPage = 1;
  SabioSearchState.isSearching = false;
  
  // Clear search timer
  clearTimeout(SabioSearchState.searchDebounceTimer);
  
  // Return to normal sabio view
  SabioPageState.isInSearchMode = false;
  
  // Reload current category content
  loadCategoryContentInternal(SabioPageState.currentSabio, SabioPageState.activeCategory);
  
  console.log('🔍 Sabio search cleared, returned to normal view');
}

// Make search functions globally available
window.performSabioSearch = performSabioSearch;
window.clearSabioSearch = clearSabioSearch;
window.highlightSearchTerms = highlightSearchTerms;

// Function to remove favorite from favorites page and re-render
function removeFavoriteFromPage(itemId, itemName) {
  // Get the full item data from localStorage
  const favoritesData = JSON.parse(localStorage.getItem('islamicFavoritesData') || '{}');
  const item = favoritesData[itemId.toString()];
  
  if (!item) {
    console.error('Item not found in favorites data:', itemId);
    return;
  }
  
  // Use the global toggleFavorite function if available
  if (typeof window.toggleFavorite === 'function') {
    // Call the global toggle function
    window.toggleFavorite(itemId, item);
    
    // Re-render the favorites page after a short delay to allow the toggle to complete
    setTimeout(() => {
      renderFavoritesPage();
    }, 100);
  } else {
    // Fallback: manually remove from localStorage and re-render
    const favorites = JSON.parse(localStorage.getItem('islamicFavorites') || '[]');
    
    const idStr = itemId.toString();
    const index = favorites.indexOf(idStr);
    
    if (index !== -1) {
      // Remove from favorites
      const newFavorites = favorites.filter((_, i) => i !== index);
      const { [idStr]: removed, ...newFavoritesData } = favoritesData;
      
      // Update localStorage
      localStorage.setItem('islamicFavorites', JSON.stringify(newFavorites));
      localStorage.setItem('islamicFavoritesData', JSON.stringify(newFavoritesData));
      
      // Show notification
      const message = `تم حذف "${itemName}" من المفضلة`;
      
      if (typeof window.showNotification === 'function') {
        window.showNotification(message, 'info');
      } else if (typeof showSabioNotification === 'function') {
        showSabioNotification(message, 'info');
      }
      
      // Sync favorites counter globally
      if (typeof window.syncFavoritesCounter === 'function') {
        window.syncFavoritesCounter();
      }
      
      // Re-render the favorites page
      renderFavoritesPage();
    }
  }
}

// Test function to debug favorites
function testFavorites() {
  console.log('=== TESTING FAVORITES ===');
  const favorites = JSON.parse(localStorage.getItem('islamicFavorites') || '[]');
  const favoritesData = JSON.parse(localStorage.getItem('islamicFavoritesData') || '{}');
  console.log('Raw favorites:', favorites);
  console.log('Raw favoritesData:', favoritesData);
  console.log('AppState exists:', !!window.AppState);
  if (window.AppState) {
    console.log('AppState.favorites:', window.AppState.favorites);
    console.log('AppState.favoritesData:', window.AppState.favoritesData);
  }
  console.log('=== END TEST ===');
}

// Make test function globally available
window.testFavorites = testFavorites;

// Function to render favorite cards directly
function renderFavoriteCards(items) {
  console.log('🎨 renderFavoriteCards called with', items.length, 'items');
  const mainContent = document.getElementById('mainContent');
  if (!mainContent) {
    console.log('❌ mainContent not found in renderFavoriteCards');
    return;
  }
  
  let favoriteCardsHTML = '';
  
  // Use global renderContentCard if available
  if (window.renderContentCard && typeof window.renderContentCard === 'function') {
    console.log('✅ Using window.renderContentCard for direct rendering');
    favoriteCardsHTML = items.map(item => window.renderContentCard(item)).join('');
  } else {
    console.log('⚠️ window.renderContentCard not available, using fallback');
    // Fallback rendering
    favoriteCardsHTML = items.map(item => {
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
      
      const typeClass = `type-${item.type}`;
      const typeName = item.type === 'audios' ? 'صوتي' : (item.type === 'books' ? 'كتاب' : (item.type === 'fatwa' ? 'فتوى' : 'محتوى'));
      
      return `
        <div class="card fade-in" id="favorite-card-${item.id}">
          <div class="flex justify-between items-start mb-3">
            <span class="content-type-badge ${typeClass}">${typeName}</span>
            <button onclick="removeFavoriteWithAnimation('${item.id}', '${escapeHtml(item.title || item.name || 'العنصر')}')" class="btn-icon favorite-btn favorited" title="إزالة من المفضلة" style="color: #ef4444;">
              <svg class="w-5 h-5" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
            </button>
          </div>
          <h4 class="text-lg font-bold text-gray-900 mb-2 arabic-text leading-relaxed">${escapeHtml(item.title || item.name || 'بدون عنوان')}</h4>
          <p class="text-gray-600 mb-4 arabic-text leading-relaxed line-clamp-3 text-sm lg:text-base">${escapeHtml(item.description || '')}</p>
          ${item.author ? `<p class="text-sm text-emerald-600 font-semibold mb-3">${escapeHtml(item.author)}</p>` : ''}
        </div>
      `;
    }).join('');
  }
  
  // Render the cards directly without any header
  mainContent.innerHTML = `
    <section class="container mx-auto px-4 py-8 lg:py-12">
      <div class="content-grid">
        ${favoriteCardsHTML}
      </div>
    </section>
  `;
  
  console.log('✅ Favorite cards rendered successfully');
}

// Renderizar página de favoritos (idéntico a index.html)
function renderFavoritesPage() {
  console.log('🚀 renderFavoritesPage called');
  const mainContent = document.getElementById('mainContent');
  if (!mainContent) {
    console.log('❌ mainContent not found');
    return;
  }
  
  // Limpiar contenido previo
  mainContent.innerHTML = '';
  
  // Create minimal AppState if it doesn't exist (for compatibility with app.js functions)
  if (!window.AppState) {
    console.log('🔧 Creating minimal AppState for favorites compatibility');
    window.AppState = {
      favorites: [],
      favoritesData: {},
      activeNav: 'favorites'
    };
  }
  
  // Force refresh AppState favorites with localStorage data
  const storedFavorites = JSON.parse(localStorage.getItem('islamicFavorites') || '[]');
  const storedFavoritesData = JSON.parse(localStorage.getItem('islamicFavoritesData') || '{}');
  window.AppState.favorites = storedFavorites;
  window.AppState.favoritesData = storedFavoritesData;
  window.AppState.activeNav = 'favorites';
  
  console.log('🔄 Refreshed AppState with localStorage data');
  console.log('🔥 DEBUG: SabioPageState.activeNav =', SabioPageState.activeNav);
  console.log('🔥 DEBUG: AppState.activeNav =', window.AppState.activeNav);
  
  // Obtener favoritos desde localStorage (idéntico a index.html)
  const favorites = JSON.parse(localStorage.getItem('islamicFavorites') || '[]');
  const favoritesData = JSON.parse(localStorage.getItem('islamicFavoritesData') || '{}');
  const favoriteItems = favorites.map(id => favoritesData[id]).filter(Boolean);
  
  console.log('DEBUG: Favorites data:');
  console.log('- favorites array:', favorites);
  console.log('- favorites array length:', favorites.length);
  console.log('- favoritesData object:', favoritesData);
  console.log('- favoritesData keys:', Object.keys(favoritesData));
  
  // Debug the mapping process
  console.log('DEBUG: Mapping process:');
  favorites.forEach((id, index) => {
    console.log(`- favorites[${index}] = "${id}" -> favoritesData["${id}"] =`, favoritesData[id]);
  });
  
  console.log('- favoriteItems after mapping:', favoriteItems);
  console.log(`Rendering favorites page with ${favoriteItems.length} items`);
  
  // Force check: if we have favorites in localStorage but favoriteItems is empty, there's a mapping issue
  if (favorites.length > 0 && favoriteItems.length === 0) {
    console.log('⚠️ MAPPING ISSUE: Have favorites but favoriteItems is empty');
    console.log('Attempting to fix by using raw favorites data...');
    
    // Try to reconstruct favoriteItems from available data
    const reconstructedItems = [];
    favorites.forEach(id => {
      if (favoritesData[id]) {
        reconstructedItems.push(favoritesData[id]);
      } else {
        console.log(`Missing data for favorite ID: ${id}`);
      }
    });
    
    if (reconstructedItems.length > 0) {
      console.log('✅ Successfully reconstructed favorites:', reconstructedItems);
      // Force render with reconstructed items
      renderFavoriteCards(reconstructedItems);
      return;
    }
  }
  
  if (favoriteItems.length === 0) {
    console.log('DEBUG: Showing empty state because favoriteItems.length === 0');
    // Mostrar mensaje cuando no hay favoritos (idéntico a index.html)
    mainContent.innerHTML = `
      <section class="container mx-auto px-4 py-12 text-center">
        <div class="max-w-md mx-auto">
          <div class="text-4xl lg:text-6xl mb-6">مفضلة</div>
          <h2 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">لا توجد مفضلة</h2>
          <p class="text-gray-600 mb-8 text-sm lg:text-base">لم تقم بإضافة أي محتوى إلى المفضلة بعد</p>
          <button onclick="renderSabioContent()" class="btn btn-primary">
            العودة لمحتوى الشيخ
          </button>
        </div>
      </section>
    `;
  } else {
    console.log('DEBUG: Found favorites, proceeding to render');
    console.log('DEBUG: Rendering favorites with items:', favoriteItems);
    
    // Try to use AppState favorites if available (like index.html does)
    let finalFavoriteItems = favoriteItems;
    if (window.AppState && window.AppState.favorites && window.AppState.favoritesData) {
      console.log('DEBUG: Using AppState favorites data');
      const appStateFavorites = window.AppState.favorites;
      const appStateFavoritesData = window.AppState.favoritesData;
      finalFavoriteItems = appStateFavorites.map(id => appStateFavoritesData[id]).filter(Boolean);
      console.log('DEBUG: AppState favoriteItems:', finalFavoriteItems);
    }
    
    // Use the dedicated renderFavoriteCards function
    renderFavoriteCards(finalFavoriteItems);
    return; // Exit here after rendering
  }
}

// Function to clear navigation state (same as app.js)
function clearNavigationState() {
  localStorage.removeItem('currentNavigationState');
  console.log('🗑️ Sabio navigation state cleared');
}

// Hacer funciones disponibles globalmente para compatibilidad
window.loadCategoryContent = sabioLoadCategoryContent; // Usar la función específica de sabio.js
window.sabioLoadCategoryContent = sabioLoadCategoryContent; // También disponible con nombre específico
window.handleFileClick = handleFileClick;
window.toggleSabioFavorite = toggleSabioFavorite;
window.isSabioItemFavorited = isSabioItemFavorited;
window.formatFileSize = formatFileSize;
window.navigateToPage = navigateToPage; // Override app.js version for sabio.html
window.clearNavigationState = clearNavigationState;
window.filterByTypeAndNavigate = filterByTypeAndNavigate; // Función para filtrar y navegar
window.renderCategoriesPage = renderCategoriesPage; // Unified categories page for both index.html and sabio.html
window.removeFavoriteWithAnimation = removeFavoriteWithAnimation; // Function to remove favorites with animation
window.removeFavoriteFromPage = removeFavoriteFromPage; // Function to remove favorites from page
window.syncAppStateWithSabio = syncAppStateWithSabio; // Function to sync AppState with sabio data
window.updateSabioStatsDisplay = updateSabioStatsDisplay; // Function to update sabio stats display

// Función adicional para limpiar interferencias de app.js
function cleanupAppJsInterference() {
  // Limpiar cualquier contenido residual de app.js
  const mainContent = document.getElementById('mainContent');
  if (mainContent && mainContent.innerHTML.includes('home-stats')) {
    console.log('Cleaning up app.js interference...');
    mainContent.innerHTML = '';
  }
}

// Observador para detectar cambios no deseados en el DOM
function setupDOMProtection() {
  const mainContent = document.getElementById('mainContent');
  if (!mainContent) return;
  
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (window.SABIO_PAGE_ACTIVE && mutation.type === 'childList') {
        // Si detectamos contenido de app.js, lo limpiamos
        const addedNodes = Array.from(mutation.addedNodes);
        addedNodes.forEach(node => {
          if (node.nodeType === 1 && (node.classList?.contains('home-stats') || node.querySelector?.('.home-stats'))) {
            console.log('Preventing app.js content injection');
            node.remove();
          }
        });
      }
    });
  });
  
  observer.observe(mainContent, {
    childList: true,
    subtree: true
  });
}

// Configurar event listeners para botones de categoría DESPUÉS del renderizado
function setupCategoryEventListeners() {
  console.log('🔧 Setting up category event listeners...');
  
  // Buscar todos los botones de categoría
  const categoryButtons = document.querySelectorAll('.category-btn');
  console.log(`Found ${categoryButtons.length} category buttons`);
  
  categoryButtons.forEach((button, index) => {
    const category = button.dataset.category;
    console.log(`🔘 Setting up listener for button ${index + 1}: "${category}"`);
    
    // Remover listeners previos para evitar duplicados
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    // Agregar nuevo listener
    newButton.addEventListener('click', async function(e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation(); // IMPORTANTE: Prevenir otros event listeners
      
      console.log(`💆 Category button clicked: "${category}"`);
      console.log('🚫 Preventing app.js event listeners from firing');
      
      // Actualizar botones visualmente inmediatamente
      document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-outline');
      });
      newButton.classList.remove('btn-outline');
      newButton.classList.add('btn-primary');
      
      try {
        console.log(`🚀 About to call SABIO loadCategoryContent("${category}")`);
        // Llamar EXPLÍCITAMENTE a la función de sabio.js (NO la de app.js)
        await sabioLoadCategoryContent(category);
        console.log(`✅ SABIO loadCategoryContent("${category}") called successfully`);
      } catch (error) {
        console.error(`💥 Error calling SABIO loadCategoryContent("${category}"):`, error);
        console.error('Stack trace:', error.stack);
      }
      
      return false; // Prevenir cualquier propagación adicional
    }, true); // Usar capture phase para ejecutar ANTES que app.js
  });
  
  if (categoryButtons.length === 0) {
    console.warn('⚠️ No category buttons found! Buttons may not be rendered yet.');
    // Intentar nuevamente después de un breve retraso
    setTimeout(setupCategoryEventListeners, 500);
  } else {
    console.log(`✅ Successfully set up ${categoryButtons.length} category event listeners`);
  }
}

// Override toggleFavoriteById in sabio.html favorites page to use animation
function createSabioToggleFavoriteById() {
  const originalToggleFavoriteById = window.toggleFavoriteById;
  
  return function(id) {
    // Check if we're in favorites page in sabio.html
    if (window.location.pathname.includes('sabio.html') && 
        SabioPageState.activeNav === 'favorites') {
      
      // Get item name for notification
      const favoritesData = JSON.parse(localStorage.getItem('islamicFavoritesData') || '{}');
      const item = favoritesData[id.toString()];
      const itemName = item ? (item.title || item.name || 'العنصر') : 'العنصر';
      
      // Use our animated removal function
      removeFavoriteWithAnimation(id, itemName);
    } else {
      // Use original function for other cases
      if (originalToggleFavoriteById) {
        originalToggleFavoriteById(id);
      }
    }
  };
}

// CRITICAL: Override app.js navigateToPage function after app.js loads (only in sabio.html)
// This ensures sabio.html uses the correct navigation function with NO state saving for favorites/categories
setTimeout(() => {
  // Only override functions in sabio.html
  if (window.location.pathname.includes('sabio.html')) {
    console.log('🚀 Sabio.js: Overriding functions in sabio.html');
    
    // Override toggleFavoriteById to use animation in favorites page
    if (window.toggleFavoriteById) {
      window.toggleFavoriteById = createSabioToggleFavoriteById();
      console.log('✅ Overrode toggleFavoriteById with animated version for sabio.html');
    }
    
    // Store original function if it exists
    const originalNavigateToPage = window.navigateToPage;
    
    // Override with sabio-specific version that NEVER saves state for favorites/categories
    window.navigateToPage = function(page) {
      console.log(`🧭 Sabio.js navigateToPage OVERRIDE called with: "${page}"`);
      
      // Cerrar menú móvil si está abierto
      if (window.closeMobileMenu) {
        window.closeMobileMenu();
      }
      
      // IMPORTANTE: Guardar estado de navegación para todas las páginas (igual que index.html)
      const simpleState = {
        page: page,
        timestamp: Date.now(),
        pageType: 'sabio'
      };
      
      localStorage.setItem('sabioNavState', JSON.stringify(simpleState));
      console.log(`🔄 Sabio navigation state saved: ${page}`);
      
      // Actualizar estados de navegación activa
      document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
          link.classList.add('active');
        }
      });
      
      // Manejar diferentes páginas
      switch (page) {
        case 'categories':
          console.log('🏷️ Showing categories page in sabio.html');
          SabioPageState.activeNav = 'categories';
          renderCategoriesPage();
          // Reinitialize mega menu after rendering categories
          setTimeout(() => {
            if (window.initializeMegaMenu) {
              window.initializeMegaMenu();
            }
          }, 100);
          break;
        case 'favorites':
          console.log('🔥 Showing favorites page in sabio.html');
          SabioPageState.activeNav = 'favorites';
          console.log('🔥 Set SabioPageState.activeNav to:', SabioPageState.activeNav);
          renderFavoritesPage();
          // Reinitialize mega menu after rendering favorites
          setTimeout(() => {
            if (window.initializeMegaMenu) {
              window.initializeMegaMenu();
            }
          }, 100);
          break;
        case 'home':
          console.log('🏠 Returning to sabio home page');
          SabioPageState.activeNav = 'home';
          clearNavigationState();
          loadCategoryContentInternal('all');
          break;
        default:
          console.log(`⚠️ Unknown page: ${page}, defaulting to home`);
          SabioPageState.activeNav = 'home';
          clearNavigationState();
          loadCategoryContentInternal('all');
      }
    };
    console.log('✅ Sabio.js navigateToPage function override installed');
  } else {
    console.log('🚀 Sabio.js: Not overriding functions in index.html');
  }
}, 500); // Increased delay to ensure app.js loads first