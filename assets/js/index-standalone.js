// ==================== INDEX.HTML STANDALONE JAVASCRIPT ====================
// Complete standalone JavaScript for index.html - No external dependencies

// Common utilities are loaded separately in HTML

// ==================== INDEX-SPECIFIC FUNCTIONS ====================

// Fetch data from API
async function fetchData(contentType, page = 1, limit = 25, options = {}) {
  console.log(' [INDEX] fetchData called:', { contentType, page, limit, options });
  try {
    let url;
    if (options.search) {
      if (contentType === 'showall') {
        url = `${ISLAMIC_HOUSE_API_BASE}?action=search&search=${encodeURIComponent(options.search)}&page=${page}`;
      } else {
        url = `${ISLAMIC_HOUSE_API_BASE}?action=search&search=${encodeURIComponent(options.search)}&category=${contentType}&page=${page}`;
      }
      console.log(' [INDEX] Search URL:', url);
    } else {
      url = buildApiUrl(contentType, page, limit);
      console.log(' [INDEX] Content URL:', url);
    }
    
    console.log('🌐 [INDEX] Making API request to:', url);
    const data = await safeFetch(url);
    console.log('📥 [INDEX] API response:', data);
    
    if (contentType === 'showall' && !options.search) {
      console.log('📊 [INDEX] Loading books by default instead of categories');
      // Load books by default when showing all content
      const booksUrl = buildApiUrl('books', page, limit);
      console.log('📚 [INDEX] Books URL:', booksUrl);
      const booksData = await safeFetch(booksUrl);
      console.log('📥 [INDEX] Books response:', booksData);
      
      return {
        success: true,
        data: booksData.data || [],
        pagination: {
          current_page: booksData.pagination?.current_page || page,
          total_pages: booksData.pagination?.total_pages || 1,
          total_items: booksData.pagination?.total_items || 0
        }
      };
    } else {
      console.log('✅ [INDEX] Returning content data, items:', data.data?.length || 0);
      return {
        success: true,
        data: data.data || [],
        pagination: {
          current_page: data.pagination?.current_page || page,
          total_pages: data.pagination?.total_pages || 1,
          total_items: data.pagination?.total_items || 0
        }
      };
    }
  } catch (error) {
    console.error(' [INDEX] Error in fetchData:', error);
    throw error;
  }
}

// Navigate to page
function navigateToPage(page) {
  AppState.activeNav = page;
  closeMobileMenu();
  
  localStorage.setItem('currentNavigationState', JSON.stringify({
    activeNav: page,
    currentPage: AppState.currentPage,
    currentCategory: AppState.currentCategory,
    timestamp: Date.now(),
    pageType: 'index'
  }));
  
  document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.page === AppState.activeNav) {
      link.classList.add('active');
    }
  });
  
  renderContent();
}

// Main content rendering function
function renderContent() {
  console.log('🎨 [INDEX] renderContent called');
  const mainContent = document.getElementById('mainContent');
  
  if (!mainContent) {
    console.error('❌ [INDEX] mainContent element not found!');
    return;
  }
  
  console.log('✅ [INDEX] mainContent element found');
  console.log('📊 [INDEX] AppState.currentData:', AppState.currentData);
  console.log('📊 [INDEX] AppState.activeNav:', AppState.activeNav);
  
  if (!AppState.currentData || AppState.currentData.length === 0) {
    console.log('⚠️ [INDEX] No data to render');
    mainContent.innerHTML = '<div class="no-results"><p>لا توجد نتائج</p></div>';
    return;
  }
  
  console.log('📊 [INDEX] Rendering', AppState.currentData.length, 'items for nav:', AppState.activeNav);

  switch (AppState.activeNav) {
    case 'home':
      renderHomeContent();
      break;
    case 'search':
      renderSearchResults();
      break;
    case 'favorites':
      renderFavoritesContent();
      break;
    case 'categories':
      renderCategoriesPage();
      break;
    default:
      renderCategoryContent();
  }
}

// Render home content
function renderHomeContent() {
  console.log('🏠 [INDEX] renderHomeContent called');
  const mainContent = document.getElementById('mainContent');
  
  if (!mainContent) {
    console.error('❌ [INDEX] mainContent not found in renderHomeContent');
    return;
  }
  
  console.log('🎨 [INDEX] Generating cards HTML for', AppState.currentData.length, 'items');
  
  let cardsHTML = '';
  if (AppState.showingCategories) {
    // Render category cards
    console.log('📊 [INDEX] Rendering category cards');
    cardsHTML = AppState.currentData.map(category => renderCategoryCard(category)).join('');
  } else {
    // Render content cards
    console.log('📝 [INDEX] Rendering content cards');
    cardsHTML = AppState.currentData.map(item => renderContentCard(item)).join('');
  }
  
  console.log('📝 [INDEX] Setting mainContent innerHTML');
  mainContent.innerHTML = `
    <div class="content-section">
      <div class="content-header">
        <h1 class="content-title">أحدث المحتوى</h1>
        <p class="content-subtitle">استكشف أحدث الكتب والمقالات والفتاوى والمحاضرات الإسلامية</p>
      </div>
      ${renderCategoryFilters()}
      <div class="content-grid">
        ${cardsHTML}
      </div>
      ${renderPagination(AppState.currentPage, AppState.totalPages, AppState.totalItems, 'loadPage')}
    </div>
  `;
  console.log('✅ [INDEX] Home content rendered successfully');
}

// Render search results
function renderSearchResults() {
  const mainContent = document.getElementById('mainContent');
  const cardsHTML = AppState.searchResults.map(item => renderContentCard(item)).join('');
  
  mainContent.innerHTML = `
    <div class="search-results-header">
      <h2>نتائج البحث عن: "${AppState.searchQuery}"</h2>
      <p>تم العثور على ${AppState.searchTotalItems} نتيجة</p>
    </div>
    <div class="content-grid">
      ${cardsHTML}
    </div>
    ${renderPagination(AppState.searchCurrentPage, AppState.searchTotalPages, AppState.searchTotalItems, 'loadSearchPage')}
  `;
}

// Render category filters
function renderCategoryFilters() {
  return `
    <div class="category-filters-container">
      <button onclick="filterByType('showall')" class="btn text-sm lg:text-base btn-outline">
        الكل
      </button>
      <button onclick="filterByType('books')" class="btn text-sm lg:text-base btn-outline">
        الكتب
      </button>
      <button onclick="filterByType('fatwa')" class="btn text-sm lg:text-base btn-outline">
        الفتاوى
      </button>
      <button onclick="filterByType('audios')" class="btn text-sm lg:text-base btn-outline">
        الصوتيات
      </button>
      <button onclick="filterByType('hadith')" class="btn text-sm lg:text-base btn-outline">
        الأحاديث
      </button>
      <button onclick="filterByType('ibn-taymiyyah')" class="btn text-sm lg:text-base btn-primary">
        الشيخ ابن تيمية
      </button>
    </div>
  `;
}

// Render category card
function renderCategoryCard(category) {
  if (!category || !category.name) return '';
  
  const displayName = getArabicCategoryName(category.name);
  const count = category.count || 0;
  const iconClass = getCategoryIcon(category.name);
  
  return `
    <div class="category-card" onclick="filterByType('${category.name}')">
      <div class="category-icon">
        <i class="${iconClass}"></i>
      </div>
      <div class="category-info">
        <h3 class="category-title">${displayName}</h3>
        <p class="category-count">${count} عنصر</p>
      </div>
      <div class="category-arrow">
        <i class="fas fa-chevron-left"></i>
      </div>
    </div>
  `;
}

// Get Arabic category names
function getArabicCategoryName(categoryName) {
  const arabicNames = {
    'books': 'الكتب',
    'articles': 'المقالات', 
    'fatwa': 'الفتاوى',
    'audios': 'الصوتيات',
    'videos': 'المرئيات',
    'hadith': 'الأحاديث',
    'videos_ulamah': 'فيديوهات العلماء',
    'quran_recitations': 'تلاوات القرآن',
    'ibn-taymiyyah': 'ابن تيمية'
  };
  return arabicNames[categoryName] || categoryName;
}

// Get category icons
function getCategoryIcon(categoryName) {
  const icons = {
    'books': 'fas fa-book',
    'articles': 'fas fa-newspaper',
    'fatwa': 'fas fa-gavel',
    'audios': 'fas fa-volume-up',
    'videos': 'fas fa-play-circle',
    'hadith': 'fas fa-bookmark',
    'videos_ulamah': 'fas fa-video',
    'quran_recitations': 'fas fa-quran',
    'ibn-taymiyyah': 'fas fa-user-graduate'
  };
  return icons[categoryName] || 'fas fa-folder';
}

// Render content card
function renderContentCard(item) {
  if (!item || !item.id) return '';
  
  const isFavorited = AppState.favorites.includes(item.id.toString());
  const favoriteClass = isFavorited ? 'favorited' : '';
  const itemType = item.type || item.category || 'books';
  const typeDisplayName = getTypeDisplayName(itemType);
  const typeClass = `type-${itemType}`;
  
  // Format date
  const currentDate = new Date().toLocaleDateString('ar-SA');
  
  // Common header
  const cardHeader = `
    <div class="flex justify-between items-start mb-3">
      <span class="content-type-badge ${typeClass}">${typeDisplayName}</span>
      <button onclick="toggleFavoriteById('${item.id}')" class="btn-icon favorite-btn ${favoriteClass}" title="${isFavorited ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}">
        <svg class="w-5 h-5" fill="${isFavorited ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
        </svg>
      </button>
    </div>
  `;
  
  // Common title
  const cardTitle = `
    <div class="mb-4">
      <h4 class="text-lg font-bold text-gray-800 leading-tight line-clamp-2 arabic-text">
        ${item.title || item.name || 'بدون عنوان'}
      </h4>
    </div>
  `;
  
  // Common footer
  const cardFooter = `
    <div class="flex justify-between items-center text-xs lg:text-sm text-gray-500 mt-3">
      ${item.author ? `<div class="text-sm text-emerald-600 font-semibold mb-2">${item.author}</div>` : '<span></span>'}
      <span>${item.date || currentDate}</span>
    </div>
  `;
  
  // Render based on content type
  switch (itemType) {
    case 'fatwas':
    case 'fatwa':
      return renderFatwaCard(item, cardHeader, cardTitle, cardFooter);
    
    case 'audios':
      return renderAudioCard(item, cardHeader, cardTitle, cardFooter);
    
    case 'hadith':
      return renderHadithCard(item, cardHeader, cardTitle, cardFooter);
    
    case 'ibn-taymiyyah':
      return renderIbnTaymiyyahCard(item, cardHeader, cardTitle, cardFooter);
    
    default:
      return renderBookCard(item, cardHeader, cardTitle, cardFooter);
  }
}

// Render fatwa card
function renderFatwaCard(item, cardHeader, cardTitle, cardFooter) {
  const question = item.question || item.description || '';
  const answer = item.answer || item.content || '';
  const audioLink = item.audio_link || item.download_link || item.url || '';
  const mufti = item.mufti || '';
  
  // Generate attachment links
  const attachmentLinks = generateAttachmentLinks(item);
  
  const fatwaContent = `
    <div class="fatwa-content mb-4">
      ${question ? `
        <div class="question-text text-emerald-800 font-semibold mb-3 p-3 bg-emerald-50 rounded-lg border-r-4 border-emerald-500">
          <strong>السؤال:</strong><br>
          ${question}
        </div>
      ` : ''}
      
      ${answer ? `
        <div class="answer-text text-gray-700 mb-4 p-3 bg-gray-50 rounded-lg border-r-4 border-gray-400">
          <strong>الجواب:</strong><br>
          <div class="answer-content max-h-32 overflow-y-auto">
            ${answer.length > 200 ? answer.substring(0, 200) + '...' : answer}
            ${answer.length > 200 ? `
              <button onclick="expandText(this, \`${answer.replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/\\/g, '\\\\')}\`)" class="read-more-btn mr-2 text-gray-600 underline">
                ...المزيد
              </button>
            ` : ''}
          </div>
          
          ${audioLink ? `
            <div class="attachments-grid mb-4 mt-3" id="fatwa-audio-btn">
              <button onclick="handleMediaClick('${audioLink}', '${item.title || item.name}', 'MP3')" class="attachment-link audio-link">
                <span>MP3</span>
                <span class="text-xs opacity-75">(غير محدد)</span>
              </button>
            </div>
          ` : ''}
        </div>
      ` : ''}
      
      <div class="flex justify-between items-center text-xs lg:text-sm text-gray-500 mt-3">
        ${mufti ? `
          <div class="text-sm text-emerald-600 font-semibold mb-2">
            ${mufti}
          </div>
        ` : '<div></div>'}
        <span>${item.date || new Date().toLocaleDateString('ar-SA')}</span>
      </div>
    </div>
    
    ${attachmentLinks}
  `;
  
  return `<div class="card fade-in">${cardHeader}${cardTitle}${fatwaContent}</div>`;
}

// Render audio card
function renderAudioCard(item, cardHeader, cardTitle, cardFooter) {
  const description = item.description || '';
  
  // Parse attachments from the attachments column
  let audioButtons = '';
  if (item.attachments) {
    try {
      const attachments = JSON.parse(item.attachments);
      if (Array.isArray(attachments) && attachments.length > 0) {
        audioButtons = `
          <div class="attachments-grid mb-4">
            ${attachments.map(attachment => `
              <button onclick="handleMediaClick('${attachment.url}', '${item.title || item.name}', 'MP3')" class="attachment-link">
                <span>MP3</span>
                <span class="text-xs opacity-75">(${attachment.size || 'غير محدد'})</span>
              </button>
            `).join('')}
          </div>
        `;
      }
    } catch (e) {
      // If parsing fails, fall back to single attachment
      const attachmentLinks = generateAttachmentLinks(item);
      audioButtons = attachmentLinks;
    }
  } else {
    // Fall back to generateAttachmentLinks if no attachments column
    const attachmentLinks = generateAttachmentLinks(item);
    audioButtons = attachmentLinks;
  }
  
  const audioContent = `
    <div class="audio-content mb-4">
      ${description ? `
        <div class="description-text text-gray-700 mb-3 p-3 bg-purple-50 rounded-lg border-r-4 border-purple-500">
          <strong>الوصف:</strong><br>
          ${description}
        </div>
      ` : ''}
      
      ${audioButtons}
    </div>
  `;
  
  return `<div class="card fade-in">${cardHeader}${cardTitle}${audioContent}${cardFooter}</div>`;
}

// Render hadith card
function renderHadithCard(item, cardHeader, cardTitle, cardFooter) {
  const hadithText = item.hadith || '';
  const rawi = item.rawi || '';
  const mohdith = item.mohdith || '';
  const book = item.book || '';
  const numberOrPage = item.numberOrPage || item.number_or_page || '';
  const grade = item.grade || '';
  const sharh = item.sharh || '';
  
  const hadithContent = `
    <div class="hadith-content mb-4">
      ${hadithText ? `
        <div class="hadith-text text-blue-800 font-semibold mb-4 p-4 bg-blue-50 rounded-lg border-r-4 border-blue-500">
          <strong>الحديث:</strong><br>
          <div class="hadith-main-text max-h-40 overflow-y-auto" style="line-height: 1.9; padding: 8px 0;">
            ${hadithText.length > 200 ? hadithText.substring(0, 200) + '...' : hadithText}
            ${hadithText.length > 200 ? `
              <button onclick="expandText(this, \`${hadithText.replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/\\/g, '\\\\')}\`)" class="read-more-btn mr-2 text-blue-600 underline">
                ...المزيد
              </button>
            ` : ''}
          </div>
        </div>
      ` : ''}
      
      ${sharh ? `
        <div class="sharh-text text-gray-700 mb-4 p-3 bg-gray-50 rounded-lg border-r-4 border-gray-400">
          <strong>الشرح:</strong><br>
          <div class="sharh-content max-h-32 overflow-y-auto">
            ${sharh.length > 200 ? sharh.substring(0, 200) + '...' : sharh}
            ${sharh.length > 200 ? `
              <button onclick="expandText(this, \`${sharh.replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/\\/g, '\\\\')}\`)" class="read-more-btn mr-2 text-gray-600 underline">
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
          ${rawi ? `<div class="flex flex-col"><strong class="text-amber-700">الراوي:</strong> <span class="mt-1 text-gray-600">${rawi}</span></div>` : ''}
          ${mohdith ? `<div class="flex flex-col"><strong class="text-amber-700">المحدث:</strong> <span class="mt-1 text-gray-600">${mohdith}</span></div>` : ''}
          ${book ? `<div class="flex flex-col"><strong class="text-amber-700">الكتاب:</strong> <span class="mt-1 text-gray-600">${book}</span></div>` : ''}
          ${numberOrPage ? `<div class="flex flex-col"><strong class="text-amber-700">رقم الصفحة:</strong> <span class="mt-1 text-gray-600">${numberOrPage}</span></div>` : ''}
          ${grade ? `<div class="flex flex-col"><strong class="text-amber-700">الدرجة:</strong> <span class="mt-1 text-gray-600">${grade}</span></div>` : ''}
          ${sharh ? `<div class="flex flex-col"><strong class="text-amber-700">الشرح متوفر:</strong> <span class="mt-1 text-gray-600">نعم</span></div>` : ''}
          ${item.id ? `<div class="flex flex-col"><strong class="text-amber-700">رقم الحديث:</strong> <span class="mt-1 text-gray-600">${item.id}</span></div>` : ''}
        </div>
      </div>
      
      ${generateAttachmentLinks(item)}
    </div>
  `;
  
  return `<div class="card fade-in hadith-card">${cardHeader}${cardTitle}${hadithContent}${cardFooter}</div>`;
}

// Render Ibn Taymiyyah card
function renderIbnTaymiyyahCard(item, cardHeader, cardTitle, cardFooter) {
  const attachmentLinks = generateAttachmentLinks(item);
  
  const ibnTaymiyyahContent = `
    <div class="ibn-taymiyyah-info mb-4">
      <div class="text-emerald-800 font-semibold mb-2 p-3 bg-emerald-50 rounded-lg border-r-4 border-emerald-500">
        <strong>من مؤلفات الشيخ ابن تيمية رحمه الله</strong>
      </div>
      
      ${attachmentLinks}
    </div>
  `;
  
  return `<div class="card fade-in">${cardHeader}${cardTitle}${ibnTaymiyyahContent}${cardFooter}</div>`;
}

// Render book card (default)
function renderBookCard(item, cardHeader, cardTitle, cardFooter) {
  const details = [];
  
  if (item.author) details.push(`<div><strong>المؤلف:</strong> ${item.author}</div>`);
  if (item.researcher_supervisor) details.push(`<div><strong>المشرف البحثي:</strong> ${item.researcher_supervisor}</div>`);
  if (item.publisher) details.push(`<div><strong>الناشر:</strong> ${item.publisher}</div>`);
  if (item.city || item.publication_country) {
    const location = [item.publication_country, item.city].filter(Boolean).join(' - ');
    if (location) details.push(`<div><strong>البلد:</strong> ${location}</div>`);
  }
  if (item.main_category) details.push(`<div><strong>التصنيف الرئيسي:</strong> ${item.main_category}</div>`);
  if (item.parts) details.push(`<div><strong>الأجزاء:</strong> ${item.parts}</div>`);
  if (item.parts_count) details.push(`<div><strong>عدد الأجزاء:</strong> ${item.parts_count}</div>`);
  if (item.section_books_count) details.push(`<div><strong>عدد الكتب في القسم:</strong> ${item.section_books_count}</div>`);
  if (item.format) details.push(`<div><strong>الصيغة:</strong> ${item.format}</div>`);
  if (item.size_bytes) {
    const sizeMB = (item.size_bytes / (1024 * 1024)).toFixed(2);
    details.push(`<div><strong>الحجم:</strong> ${sizeMB} ميجابايت</div>`);
  }
  
  const bookDetails = details.length > 0 ? `
    <div class="book-details mt-3">
      <h5 class="font-bold mb-2 text-emerald-700">تفاصيل الكتاب</h5>
      <div class="text-gray-600 mb-4 arabic-text leading-relaxed line-clamp-3 text-sm lg:text-base">
        ${details.join('')}
      </div>
    </div>
  ` : '';
  
  const links = [];
  if (item.download_link) {
    const ext = item.download_link.split('.').pop().toUpperCase();
    links.push(`<button onclick="window.open('${item.download_link}', '_blank')" class="attachment-link">
      <span>${ext}</span>
      <span class="text-xs opacity-75">(تحميل)</span>
    </button>`);
  }
  if (item.alternative_link && item.alternative_link !== item.download_link) {
    const ext = item.alternative_link.split('.').pop().toUpperCase();
    links.push(`<button onclick="window.open('${item.alternative_link}', '_blank')" class="attachment-link">
      <span>${ext}</span>
      <span class="text-xs opacity-75">(رابط بديل)</span>
    </button>`);
  }
  
  const attachments = links.length > 0 ? `
    <div class="attachments-grid mb-3">
      ${links.join('')}
    </div>
  ` : '';
  
  return `<div class="card fade-in">${cardHeader}${cardTitle}${bookDetails}${attachments}${cardFooter}</div>`;
}

// Handle media click
function handleMediaClick(url, title, type) {
  if (url) {
    window.open(url, '_blank');
  }
}

// Expand text content
function expandText(element, fullText) {
  const contentDiv = element.closest('.answer-content, .hadith-main-text, .sharh-content');
  if (contentDiv) {
    contentDiv.innerHTML = fullText;
    // Force maintain original height and enable scroll
    contentDiv.style.maxHeight = contentDiv.style.maxHeight || '8rem'; // 32 * 0.25rem = 8rem
    contentDiv.style.overflowY = 'auto';
  }
}

// Helper function to get type display name
function getTypeDisplayName(type) {
  const typeMap = {
    'books': 'كتاب',
    'articles': 'مقال', 
    'fatwa': 'فتوى',
    'fatwas': 'فتوى',
    'audios': 'صوتي',
    'videos': 'مرئي',
    'hadith': 'حديث',
    'videos_ulamah': 'مرئي',
    'quran_recitations': 'تلاوة',
    'ibn-taymiyyah': 'ابن تيمية'
  };
  return typeMap[type] || type;
}

// Generate attachment links for any content type
function generateAttachmentLinks(item) {
  const attachments = [];
  
  // Check for various download link fields
  const downloadLink = item.download_link || item.url || item.link || item.file_url;
  const alternativeLink = item.alternative_link || item.alt_url;
  
  if (downloadLink) {
    const extension = getFileExtension(downloadLink);
    const fileSize = item.size_bytes ? `(${(item.size_bytes / (1024 * 1024)).toFixed(1)} MB)` : '(تحميل)';
    
    attachments.push({
      url: downloadLink,
      extension: extension,
      size: fileSize,
      title: item.title || item.name || 'تحميل'
    });
  }
  
  if (alternativeLink && alternativeLink !== downloadLink) {
    const extension = getFileExtension(alternativeLink);
    const fileSize = item.alternative_size_bytes ? `(${(item.alternative_size_bytes / (1024 * 1024)).toFixed(1)} MB)` : '(تحميل)';
    
    attachments.push({
      url: alternativeLink,
      extension: extension,
      size: fileSize,
      title: item.title || item.name || 'تحميل بديل'
    });
  }
  
  if (attachments.length === 0) {
    return '';
  }
  
  return `
    <div class="attachments-grid mb-3">
      ${attachments.map(attachment => `
        <button onclick="window.open('${attachment.url}', '_blank')" class="attachment-link">
          <span>${attachment.extension}</span>
          <span class="text-xs opacity-75">${attachment.size}</span>
        </button>
      `).join('')}
    </div>
  `;
}

// Helper function to get file extension from URL
function getFileExtension(url) {
  if (!url) return 'FILE';
  const extension = url.split('.').pop().toUpperCase();
  return extension.length <= 4 ? extension : 'FILE';
}

// Render pagination
function renderPagination(currentPage, totalPages, totalItems, onPageClick) {
  if (totalPages <= 1) return '';
  
  let pagesHTML = '';
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  
  for (let i = startPage; i <= endPage; i++) {
    pagesHTML += `
      <button onclick="${onPageClick}(${i})" class="pagination-number ${currentPage === i ? 'active' : ''}">
        ${i}
      </button>
    `;
  }
  
  return `
    <div class="pagination-container">
      <div class="pagination-info">
        عرض ${totalItems} عنصر في ${renderCategoryFilters()}
      </div>
      <div class="pagination-controls">
        <button onclick="${onPageClick}(1)" ${currentPage === 1 ? 'disabled' : ''} class="pagination-btn">
          الأولى
        </button>
        <button onclick="${onPageClick}(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''} class="pagination-btn">
          السابقة
        </button>
        
        <div class="pagination-pages">
          ${pagesHTML}
        </div>

        <button onclick="${onPageClick}(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''} class="pagination-btn">
          التالية
        </button>
        <button onclick="${onPageClick}(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''} class="pagination-btn">
          الأخيرة
        </button>
      </div>
    </div>
  `;
}

// Toggle favorite by ID
function toggleFavoriteById(id) {
  const idStr = id.toString();
  let item = null;
  
  if (AppState.currentData && AppState.currentData.length > 0) {
    item = AppState.currentData.find(dataItem => dataItem.id.toString() === idStr);
  }
  
  if (!item && AppState.searchResults && AppState.searchResults.length > 0) {
    item = AppState.searchResults.find(dataItem => dataItem.id.toString() === idStr);
  }
  
  if (!item && AppState.favoritesData && AppState.favoritesData[idStr]) {
    item = AppState.favoritesData[idStr];
  }
  
  if (!item) {
    console.error('Item not found for ID:', id);
    return;
  }
  
  toggleFavorite(id, item);
}

// Toggle favorite
function toggleFavorite(id, item) {
  const idStr = id.toString();
  const index = AppState.favorites.indexOf(idStr);
  
  let newFavorites, newFavoritesData;
  let isFavorited;
  
  if (index === -1) {
    newFavorites = [...AppState.favorites, idStr];
    newFavoritesData = { ...AppState.favoritesData, [idStr]: item };
    isFavorited = true;
    showNotification('تم إضافة العنصر إلى المفضلة', 'success');
  } else {
    newFavorites = AppState.favorites.filter((_, i) => i !== index);
    const { [idStr]: removed, ...rest } = AppState.favoritesData;
    newFavoritesData = rest;
    isFavorited = false;
    showNotification('تم إزالة العنصر من المفضلة', 'success');
  }
  
  AppState.favorites = newFavorites;
  AppState.favoritesData = newFavoritesData;
  
  localStorage.setItem('islamicFavorites', JSON.stringify(newFavorites));
  localStorage.setItem('islamicFavoritesData', JSON.stringify(newFavoritesData));
  
  syncFavoritesCounter();
  
  const button = event.target.closest('.favorite-btn');
  if (button) {
    const svg = button.querySelector('svg');
    
    if (isFavorited) {
      button.classList.add('favorited');
      if (svg) svg.setAttribute('fill', 'currentColor');
      button.title = 'إزالة من المفضلة';
    } else {
      button.classList.remove('favorited');
      if (svg) svg.setAttribute('fill', 'none');
      button.title = 'إضافة للمفضلة';
    }
  }
}

// Load page
async function loadPage(pageNumber) {
  console.log('📖 [INDEX] loadPage called with pageNumber:', pageNumber);
  console.log('📊 [INDEX] Current AppState.totalPages:', AppState.totalPages);
  
  // Allow first page load even if totalPages is 0 (initial state)
  if (pageNumber < 1 || (AppState.totalPages > 0 && pageNumber > AppState.totalPages)) {
    console.warn('⚠️ [INDEX] Invalid page number:', pageNumber, 'totalPages:', AppState.totalPages);
    return;
  }
  
  console.log('✅ [INDEX] Page number validation passed, continuing...');
  
  try {
    console.log('⏳ [INDEX] Setting loading state...');
    setLoading(true);
    
    const currentType = AppState.currentCategory || 'showall';
    console.log('🔄 [INDEX] Fetching data for type:', currentType, 'page:', pageNumber);
    const data = await fetchData(currentType, pageNumber);
    
    if (data) {
      console.log('✅ [INDEX] Data received, updating AppState...');
      console.log('📊 [INDEX] Data structure:', data);
      
      // Handle content data structure
      if (data.data) {
        AppState.currentData = data.data;
        AppState.totalPages = data.pagination?.total_pages || 1;
        AppState.totalItems = data.pagination?.total_items || 0;
        AppState.showingCategories = false;
        console.log('📚 [INDEX] Loaded content items:', AppState.currentData.length);
      } else {
        console.warn('⚠️ [INDEX] No data received');
        AppState.currentData = [];
        AppState.totalPages = 1;
        AppState.totalItems = 0;
        AppState.showingCategories = false;
      }
      
      AppState.currentPage = pageNumber;
      
      console.log('📊 [INDEX] Updated AppState:', {
        currentData: AppState.currentData?.length || 0,
        totalPages: AppState.totalPages,
        totalItems: AppState.totalItems,
        currentPage: AppState.currentPage,
        showingCategories: AppState.showingCategories
      });
      
      console.log('🎨 [INDEX] Calling renderContent...');
      renderContent();
    } else {
      console.error('❌ [INDEX] No data received');
    }
  } catch (error) {
    console.error('💥 [INDEX] Error loading page:', error);
    showError('خطأ في تحميل الصفحة');
  }
  console.log('✅ [INDEX] Setting loading state to false');
  setLoading(false);
}

// Perform search
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
    const data = await fetchData('showall', page, 25, { search: searchQuery });
    
    if (data && data.data) {
      AppState.searchResults = data.data;
      AppState.searchTotalPages = data.pagination?.total_pages || 1;
      AppState.searchTotalItems = data.pagination?.total_items || 0;
      AppState.searchCurrentPage = page;
      AppState.activeNav = 'search';
      
      setLoading(false);
      navigateToPage('search');
    }
  } catch (error) {
    console.error('Search error:', error);
    showError('خطأ في البحث');
  }
}

// Load search page
function loadSearchPage(pageNumber) {
  if (pageNumber < 1 || pageNumber > AppState.searchTotalPages) return;
  performSearch(pageNumber, AppState.searchQuery);
}

// Render categories page
function renderCategoriesPage() {
  const mainContent = document.getElementById('mainContent');
  if (!mainContent) return;
  
  mainContent.innerHTML = `
    <div class="categories-page">
      <h2>التصنيفات</h2>
      <div class="categories-grid">
        <div class="category-card" onclick="filterByType('books')" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);">
          <div class="category-icon">📚</div>
          <h3>الكتب</h3>
          <p>مجموعة شاملة من الكتب الإسلامية</p>
        </div>
        <div class="category-card" onclick="filterByType('articles')" style="background: linear-gradient(135deg, #10b981, #059669);">
          <div class="category-icon">📄</div>
          <h3>المقالات</h3>
          <p>مقالات ودراسات إسلامية</p>
        </div>
        <div class="category-card" onclick="filterByType('fatwa')" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed);">
          <div class="category-icon">⚖️</div>
          <h3>الفتاوى</h3>
          <p>فتاوى العلماء المعتبرين</p>
        </div>
        <div class="category-card" onclick="filterByType('audios')" style="background: linear-gradient(135deg, #ef4444, #dc2626);">
          <div class="category-icon">🎵</div>
          <h3>الصوتيات</h3>
          <p>محاضرات ودروس صوتية</p>
        </div>
        <div class="category-card" onclick="filterByType('videos')" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
          <div class="category-icon">🎥</div>
          <h3>المرئيات</h3>
          <p>محاضرات ودروس مرئية</p>
        </div>
      </div>
    </div>
  `;
}

// Filter by type
async function filterByType(type) {
  console.log('🔍 [INDEX] filterByType called with type:', type);
  AppState.currentCategory = type;
  AppState.currentPage = 1;
  AppState.activeNav = 'home'; // Stay on home page with filtered content
  
  try {
    setLoading(true);
    const data = await fetchData(type, 1);
    
    if (data && data.data) {
      AppState.currentData = data.data;
      AppState.totalPages = data.pagination?.total_pages || 1;
      AppState.totalItems = data.pagination?.total_items || 0;
      AppState.showingCategories = false;
      
      console.log('🔍 [INDEX] Filtered content loaded:', {
        type: type,
        itemsCount: AppState.currentData.length,
        totalPages: AppState.totalPages
      });
      
      renderContent();
    } else {
      console.warn('⚠️ [INDEX] No data received for filter:', type);
      AppState.currentData = [];
      AppState.totalPages = 1;
      AppState.totalItems = 0;
      renderContent();
    }
  } catch (error) {
    console.error('💥 [INDEX] Error filtering by type:', error);
    showError('خطأ في تحميل البيانات');
  }
  setLoading(false);
}

// Render favorites content
function renderFavoritesContent() {
  const mainContent = document.getElementById('mainContent');
  if (!mainContent) return;
  
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
  const favoritesHTML = favoriteItems.map(item => renderContentCard(item)).join('');
  
  mainContent.innerHTML = `
    <div class="favorites-page">
      <h2>المفضلة (${favoriteItems.length})</h2>
      <div class="content-grid">
        ${favoritesHTML}
      </div>
    </div>
  `;
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
  console.log(' [INDEX] DOMContentLoaded - Index page initialized');
  
  // Check for pending filter from localStorage
  const pendingFilter = localStorage.getItem('pendingFilter');
  if (pendingFilter) {
    console.log(' [INDEX] Found pending filter:', pendingFilter);
    localStorage.removeItem('pendingFilter');
    setTimeout(() => {
      console.log(' [INDEX] Applying pending filter:', pendingFilter);
      filterByType(pendingFilter);
    }, 500);
    return;
  }
  
  // Setup search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    console.log(' [INDEX] Search input found, adding event listener');
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        console.log(' [INDEX] Search triggered:', e.target.value);
        performSearch();
      }
    });
  } else {
    console.warn(' [INDEX] Search input not found');
  }
  
  // Load initial content
  console.log(' [INDEX] Loading initial content (page 1)');
  loadPage(1);
});

// Global exports
window.AppState = AppState;
window.navigateToPage = navigateToPage;
window.performSearch = performSearch;
window.loadPage = loadPage;
window.loadSearchPage = loadSearchPage;
window.toggleFavoriteById = toggleFavoriteById;
window.filterByType = filterByType;
window.renderCategoriesPage = renderCategoriesPage;
window.handleMediaClick = handleMediaClick;
window.renderContentCard = renderContentCard;
window.expandText = expandText;
