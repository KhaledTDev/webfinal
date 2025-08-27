<?php
// Configurar headers HTTP
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once 'config.php';

// Manejar solicitudes OPTIONS para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // error_log("API called with action: " . ($_GET['action'] ?? 'none'));
    
    // Try to get database connection with error handling
    try {
        $db = getDB();
        // error_log("Database connection successful");
    } catch (Exception $dbError) {
        // error_log("Database connection failed: " . $dbError->getMessage());
        
        // Return error response for database connection failure
        http_response_code(503);
        echo json_encode([
            'success' => false,
            'error' => 'Database connection failed',
            'message' => 'El servicio no está disponible temporalmente. Por favor, inténtelo más tarde.'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
    
    $action = $_GET['action'] ?? '';
    $category = $_GET['category'] ?? '';
    $page = max(1, intval($_GET['page'] ?? 1));
    $search = $_GET['search'] ?? '';
    $id = $_GET['id'] ?? '';

    // error_log("Processing action: $action, category: $category, page: $page");

    switch ($action) {
        case 'categories':
            $result = getCategories($db);
            // error_log("Categories result: " . json_encode($result));
            echo json_encode($result);
            break;
            
        case 'items':
            // error_log("Getting items for category: $category");
            $result = getItems($db, $category, $page, $search);
            // error_log("Items result count: " . count($result['data'] ?? []));
            
            // Usar flags especiales para manejar UTF-8 problemático
            $json = json_encode($result, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE | JSON_PARTIAL_OUTPUT_ON_ERROR);
            if ($json === false) {
                error_log("JSON encode error: " . json_last_error_msg());
                
                // Último recurso: devolver datos básicos sin procesar
                $basicResult = [
                    'success' => true,
                    'data' => [],
                    'pagination' => $result['pagination'] ?? []
                ];
                echo json_encode($basicResult);
            } else {
                echo $json;
            }
            break;
            
        case 'item':
            $result = getItemById($db, $category, $id);
            echo json_encode($result);
            break;
            
        case 'stats':
            $result = getStats($db);
            error_log("Stats result: " . json_encode($result));
            echo json_encode($result);
            break;
            
        case 'search':
            error_log("Searching with term: '$search', page: $page");
            $result = searchItems($db, $search, $page);
            error_log("Search result count: " . count($result['data'] ?? []));
            
            // Usar flags especiales para manejar UTF-8 problemático
            $json = json_encode($result, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE | JSON_PARTIAL_OUTPUT_ON_ERROR);
            if ($json === false) {
                error_log("JSON encode error in search: " . json_last_error_msg());
                
                // Último recurso: devolver datos básicos sin procesar
                $basicResult = [
                    'success' => true,
                    'data' => [],
                    'pagination' => $result['pagination'] ?? []
                ];
                echo json_encode($basicResult);
            } else {
                echo $json;
            }
            break;
            
        default:
            throw new Exception('Acción no válida');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => $e->getMessage()
    ]);
}

// Función para obtener categorías disponibles
function getCategories($db) {
    $categories = [];
    $tables = ['books', 'articles', 'fatwa', 'audios', 'videos', 'hadith', 'videos_ulamah', 'quran_recitations', 'ibn-taymiyyah'];
    
    foreach ($tables as $table) {
        try {
            // Map hadith category to hadiz table
            $tableName = ($table === 'hadith') ? 'hadiz' : $table;
            
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM `$tableName`");
            $stmt->execute();
            $result = $stmt->fetch();
            
            if ($result['count'] > 0) {
                $categories[] = [
                    'name' => $table,
                    'display_name' => ucfirst($table),
                    'count' => $result['count']
                ];
            }
        } catch (Exception $e) {
            // Tabla no existe, continuar
            continue;
        }
    }
    
    return [
        'success' => true,
        'data' => $categories
    ];
}

// Función para obtener items de una categoría
function getItems($db, $category, $page, $search = '') {
    if (empty($category)) {
        throw new Exception('Categoría requerida');
    }
    
    $validCategories = ['books', 'articles', 'fatwa', 'fatwas', 'audios', 'videos', 'hadith', 'videos_ulamah', 'quran_recitations', 'ibn-taymiyyah'];
    if (!in_array($category, $validCategories)) {
        throw new Exception('Categoría no válida');
    }
    
    // Map category names to table names
    $tableName = $category;
    if ($category === 'hadith') {
        $tableName = 'hadiz';
    } elseif ($category === 'fatwas') {
        $tableName = 'fatwa';
    }
    
    $offset = ($page - 1) * ITEMS_PER_PAGE;
    $baseQuery = "FROM `$tableName` WHERE 1=1";
    $params = [];
    
    // Configurar búsqueda según categoría
    if (!empty($search)) {
        if ($category === 'books') {
            $baseQuery .= " AND (name LIKE :search OR topics LIKE :search OR author LIKE :search)";
        } elseif ($category === 'fatwa' || $category === 'fatwas') {
            $baseQuery .= " AND (title LIKE :search OR question LIKE :search OR answer LIKE :search OR mufti LIKE :search)";
        } elseif ($category === 'hadith') {
            $baseQuery .= " AND (hadith LIKE :search OR rawi LIKE :search OR mohdith LIKE :search OR book LIKE :search OR grade LIKE :search OR sharh LIKE :search)";
        } elseif ($category === 'videos_ulamah') {
            $baseQuery .= " AND (title LIKE :search OR description LIKE :search OR channel_name LIKE :search)";
        } elseif ($category === 'quran_recitations') {
            $baseQuery .= " AND (reciter_name LIKE :search)";
        } elseif ($category === 'ibn-taymiyyah') {
            $baseQuery .= " AND (name LIKE :search OR link LIKE :search)";
        } else {
            $baseQuery .= " AND (title LIKE :search OR description LIKE :search OR prepared_by LIKE :search)";
        }
        $params[':search'] = '%' . $search . '%';
    }
    
    // Configurar campo de ordenación según categoría
    if ($category === 'books' || $category === 'fatwa' || $category === 'fatwas' || $category === 'hadith' || $category === 'videos_ulamah' || $category === 'quran_recitations' || $category === 'ibn-taymiyyah') {
        $orderField = 'id';
    } else {
        $orderField = 'extracted_at';
    }
    
    // Contar total
    $countStmt = $db->prepare("SELECT COUNT(*) as total $baseQuery");
    $countStmt->execute($params);
    $total = $countStmt->fetch()['total'];
    
    // Obtener items
    $query = "SELECT * $baseQuery ORDER BY $orderField DESC LIMIT :limit OFFSET :offset";
    $stmt = $db->prepare($query);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', ITEMS_PER_PAGE, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $items = $stmt->fetchAll();
    
    // Procesar items
    $processedItems = array_map(function($item) use ($category) {
        return processItem($item, $category);
    }, $items);
    
    return [
        'success' => true,
        'data' => $processedItems,
        'pagination' => [
            'current_page' => $page,
            'total_pages' => ceil($total / ITEMS_PER_PAGE),
            'total_items' => $total,
            'items_per_page' => ITEMS_PER_PAGE
        ]
    ];
}

// Función para obtener un item específico por ID
function getItemById($db, $category, $id) {
    if (empty($category) || empty($id)) {
        throw new Exception('Categoría e ID requeridos');
    }
    
    // Validar categoría
    $validCategories = ['books', 'articles', 'fatwa', 'audios', 'videos', 'hadith', 'ibn-taymiyyah'];
    if (!in_array($category, $validCategories)) {
        throw new Exception('Categoría no válida');
    }
    
    // Map hadith category to hadiz table
    $tableName = ($category === 'hadith') ? 'hadiz' : $category;
    
    $stmt = $db->prepare("SELECT * FROM `$tableName` WHERE id = :id");
    $stmt->bindValue(':id', $id);
    $stmt->execute();
    
    $item = $stmt->fetch();
    
    if (!$item) {
        throw new Exception('Item no encontrado');
    }
    
    return [
        'success' => true,
        'data' => processItem($item)
    ];
}

// Función para obtener estadísticas
function getStats($db) {
    $stats = [];
    $tables = ['books', 'articles', 'fatwa', 'audios', 'videos', 'hadith', 'videos_ulamah', 'quran_recitations', 'ibn-taymiyyah'];
    $total = 0;
    
    foreach ($tables as $table) {
        try {
            $stmt = $db->prepare("SELECT COUNT(*) as count FROM `$table`");
            $stmt->execute();
            $result = $stmt->fetch();
            
            $count = $result['count'];
            $stats[$table] = $count;
            $total += $count;
        } catch (Exception $e) {
            $stats[$table] = 0;
        }
    }
    
    return [
        'success' => true,
        'data' => [
            'total_items' => $total,
            'categories' => $stats
        ]
    ];
}

// Function to normalize Arabic text for search
function normalizeArabicText($text) {
    if (empty($text)) return $text;
    
    // Remove diacritics (tashkeel)
    $text = preg_replace('/[\x{064B}-\x{065F}\x{0670}\x{06D6}-\x{06ED}]/u', '', $text);
    
    // Normalize different forms of letters
    $replacements = [
        '/[\x{0622}\x{0623}\x{0625}]/u' => '\x{0627}', // أ، آ، إ -> ا
        '/[\x{0629}]/u' => '\x{0647}',                    // ة -> ه
        '/[\x{064A}\x{0649}]/u' => '\x{064A}',          // ى -> ي
    ];
    
    foreach ($replacements as $pattern => $replacement) {
        $text = preg_replace($pattern, $replacement, $text);
    }
    
    return $text;
}

// Función para búsqueda global
function searchItems($db, $search, $page) {
    // Si no hay término de búsqueda, devolver elementos de todas las categorías
    $isEmptySearch = empty($search);
    
    // Normalize search term for Arabic text
    $normalizedSearch = $isEmptySearch ? '' : normalizeArabicText($search);
    
    $offset = ($page - 1) * ITEMS_PER_PAGE;
    $results = [];
    $total = 0;
    
    $tables = ['books', 'articles', 'fatwa', 'audios', 'videos', 'hadith', 'videos_ulamah', 'quran_recitations', 'ibn-taymiyyah'];
    
    foreach ($tables as $table) {
        try {
            // Map hadith category to hadiz table
            $tableName = ($table === 'hadith') ? 'hadiz' : $table;
            
            if ($isEmptySearch) {
                // Sin término de búsqueda, obtener todos los elementos
                $countStmt = $db->prepare("SELECT COUNT(*) as count FROM `$tableName`");
                $countStmt->execute();
                $tableTotal = $countStmt->fetch()['count'];
                $total += $tableTotal;
                
                // Determinar campo de ordenación según la tabla
                $orderField = ($table === 'books' || $table === 'hadith') ? 'id' : 'extracted_at';
                
                // Obtener algunos resultados de esta tabla
                $stmt = $db->prepare("
                    SELECT *, '$table' as category 
                    FROM `$tableName` 
                    ORDER BY $orderField DESC 
                    LIMIT 10
                ");
                $stmt->execute();
            } else {
                // Con término de búsqueda
                if ($table === 'books') {
                    $countStmt = $db->prepare("
                        SELECT COUNT(*) as count 
                        FROM `$table` 
                        WHERE name LIKE :search 
                           OR topics LIKE :search 
                           OR author LIKE :search
                           OR name LIKE :normalized_search 
                           OR topics LIKE :normalized_search 
                           OR author LIKE :normalized_search
                    ");
                } elseif ($table === 'fatwa') {
                    $countStmt = $db->prepare("
                        SELECT COUNT(*) as count 
                        FROM `$tableName` 
                        WHERE title LIKE :search 
                           OR question LIKE :search 
                           OR answer LIKE :search
                           OR mufti LIKE :search
                           OR title LIKE :normalized_search 
                           OR question LIKE :normalized_search 
                           OR answer LIKE :normalized_search
                           OR mufti LIKE :normalized_search
                    ");
                } elseif ($table === 'hadith') {
                    $countStmt = $db->prepare("
                        SELECT COUNT(*) as count 
                        FROM `$tableName` 
                        WHERE hadith LIKE :search 
                           OR rawi LIKE :search 
                           OR mohdith LIKE :search
                           OR book LIKE :search
                           OR grade LIKE :search
                           OR sharh LIKE :search
                           OR hadith LIKE :normalized_search 
                           OR rawi LIKE :normalized_search 
                           OR mohdith LIKE :normalized_search
                           OR book LIKE :normalized_search
                           OR grade LIKE :normalized_search
                           OR sharh LIKE :normalized_search
                    ");
                } elseif ($table === 'ibn-taymiyyah') {
                    $countStmt = $db->prepare("
                        SELECT COUNT(*) as count 
                        FROM `$tableName` 
                        WHERE name LIKE :search 
                           OR link LIKE :search
                           OR name LIKE :normalized_search
                    ");
                } elseif ($table === 'videos_ulamah') {
                    $countStmt = $db->prepare("
                        SELECT COUNT(*) as count 
                        FROM `$tableName` 
                        WHERE playlist_title LIKE :search 
                           OR videos_json LIKE :search
                           OR playlist_title LIKE :normalized_search 
                           OR videos_json LIKE :normalized_search
                    ");
                } else {
                    $countStmt = $db->prepare("
                        SELECT COUNT(*) as count 
                        FROM `$tableName` 
                        WHERE title LIKE :search 
                           OR description LIKE :search 
                           OR prepared_by LIKE :search
                           OR title LIKE :normalized_search 
                           OR description LIKE :normalized_search 
                           OR prepared_by LIKE :normalized_search
                    ");
                }
                $countStmt->bindValue(':search', '%' . $search . '%');
                if (!$isEmptySearch) {
                    $countStmt->bindValue(':normalized_search', '%' . $normalizedSearch . '%');
                }
                $countStmt->execute();
                $tableTotal = $countStmt->fetch()['count'];
                $total += $tableTotal;
                
                // Determinar campo de ordenación según la tabla
                $orderField = ($table === 'books' || $table === 'hadith') ? 'id' : 'extracted_at';
                
                // Obtener algunos resultados de esta tabla
                if ($table === 'books') {
                    $stmt = $db->prepare("
                        SELECT *, '$table' as category 
                        FROM `$tableName` 
                        WHERE name LIKE :search 
                           OR topics LIKE :search 
                           OR author LIKE :search
                           OR name LIKE :normalized_search 
                           OR topics LIKE :normalized_search 
                           OR author LIKE :normalized_search
                        ORDER BY $orderField DESC 
                        LIMIT 10
                    ");
                } elseif ($table === 'fatwa') {
                    $stmt = $db->prepare("
                        SELECT *, '$table' as category 
                        FROM `$tableName` 
                        WHERE title LIKE :search 
                           OR question LIKE :search 
                           OR answer LIKE :search
                           OR mufti LIKE :search
                           OR title LIKE :normalized_search 
                           OR question LIKE :normalized_search 
                           OR answer LIKE :normalized_search
                           OR mufti LIKE :normalized_search
                        ORDER BY $orderField DESC 
                        LIMIT 10
                    ");
                } elseif ($table === 'hadith') {
                    $stmt = $db->prepare("
                        SELECT *, '$table' as category 
                        FROM `$tableName` 
                        WHERE hadith LIKE :search 
                           OR rawi LIKE :search 
                           OR mohdith LIKE :search
                           OR book LIKE :search
                           OR grade LIKE :search
                           OR sharh LIKE :search
                           OR hadith LIKE :normalized_search 
                           OR rawi LIKE :normalized_search 
                           OR mohdith LIKE :normalized_search
                           OR book LIKE :normalized_search
                           OR grade LIKE :normalized_search
                           OR sharh LIKE :normalized_search
                        ORDER BY $orderField DESC 
                        LIMIT 10
                    ");
                } elseif ($table === 'ibn-taymiyyah') {
                    $stmt = $db->prepare("
                        SELECT *, '$table' as category 
                        FROM `$tableName` 
                        WHERE name LIKE :search 
                           OR link LIKE :search
                           OR name LIKE :normalized_search
                        ORDER BY $orderField DESC 
                        LIMIT 10
                    ");
                } elseif ($table === 'videos_ulamah') {
                    $stmt = $db->prepare("
                        SELECT *, '$table' as category 
                        FROM `$tableName` 
                        WHERE playlist_title LIKE :search 
                           OR videos_json LIKE :search
                           OR playlist_title LIKE :normalized_search 
                           OR videos_json LIKE :normalized_search
                        ORDER BY $orderField DESC 
                        LIMIT 10
                    ");
                } else {
                    $stmt = $db->prepare("
                        SELECT *, '$table' as category 
                        FROM `$tableName` 
                        WHERE title LIKE :search 
                           OR description LIKE :search 
                           OR prepared_by LIKE :search
                           OR title LIKE :normalized_search 
                           OR description LIKE :normalized_search 
                           OR prepared_by LIKE :normalized_search
                        ORDER BY $orderField DESC 
                        LIMIT 10
                    ");
                }
                $stmt->bindValue(':search', '%' . $search . '%');
                if (!$isEmptySearch) {
                    $stmt->bindValue(':normalized_search', '%' . $normalizedSearch . '%');
                }
                $stmt->execute();
            }
            
            $tableResults = $stmt->fetchAll();
            foreach ($tableResults as $item) {
                $results[] = processItem($item, $table);
            }
            
        } catch (Exception $e) {
            continue;
        }
    }
    
    // Ordenar por fecha y paginar
    usort($results, function($a, $b) {
        // Para libros, ordenar por ID (o el campo que prefieras)
        if ($a['type'] === 'books' || $b['type'] === 'books') {
            return $b['id'] - $a['id'];
        }
        // Para otros tipos, intentar ordenar por extracted_at si existe
        $dateA = strtotime($a['extracted_at'] ?? 0);
        $dateB = strtotime($b['extracted_at'] ?? 0);
        return $dateB - $dateA;
    });
    
    $paginatedResults = array_slice($results, $offset, ITEMS_PER_PAGE);
    
    return [
        'success' => true,
        'data' => $paginatedResults,
        'pagination' => [
            'current_page' => $page,
            'total_pages' => ceil($total / ITEMS_PER_PAGE),
            'total_items' => $total,
            'items_per_page' => ITEMS_PER_PAGE
        ]
    ];
}

// Función para procesar un item
function processItem($item, $category = null) {
    $processed = [];
    
    // Procesamiento especial para la tabla books
    if ($category === 'books') {
        $bookFields = [
            'id', 'name', 'author', 'open_file', 'pages', 'files', 'parts',
            'researcher_supervisor', 'publisher', 'publication_country', 'city',
            'main_category', 'sub_category', 'topics', 'download_link',
            'alternative_link', 'section_books_count', 'parts_count', 'size_bytes', 'format'
        ];
        
        foreach ($bookFields as $field) {
            $processed[$field] = isset($item[$field]) ? cleanText($item[$field]) : null;
        }
        
        // Campos adicionales para compatibilidad
        $processed['title'] = $processed['name'] ?? '';
        $processed['description'] = $processed['topics'] ?? '';
        $processed['prepared_by'] = $processed['author'] ?? '';
        
    } 
    // Procesamiento especial para la tabla fatwa
    elseif ($category === 'fatwa') {
        $fatwaFields = ['id', 'title', 'question', 'answer', 'audio', 'mufti'];
        
        foreach ($fatwaFields as $field) {
            $processed[$field] = isset($item[$field]) ? cleanText($item[$field]) : null;
        }
        
        // Campos adicionales para compatibilidad
        $processed['description'] = $processed['answer'] ?? '';
        $processed['prepared_by'] = $processed['mufti'] ?? '';
        
    } 
    // Procesamiento especial para la tabla hadith (que usa tabla hadiz)
    elseif ($category === 'hadith') {
        $hadithFields = ['id', 'hadith', 'rawi', 'mohdith', 'book', 'numberOrPage', 'grade', 'sharh', 'created_at'];
        
        foreach ($hadithFields as $field) {
            if (isset($item[$field])) {
                // Procesamiento más robusto para hadith
                $value = $item[$field];
                if (is_string($value)) {
                    // Limpiar caracteres problemáticos de manera más agresiva
                    $value = @mb_convert_encoding($value, 'UTF-8', 'UTF-8');
                    if ($value === false) {
                        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $item[$field]);
                    }
                    $processed[$field] = $value;
                } else {
                    $processed[$field] = $value;
                }
            } else {
                $processed[$field] = null;
            }
        }
        
        // Campos adicionales para compatibilidad - con verificación de seguridad
        $processed['title'] = !empty($processed['hadith']) ? mb_substr($processed['hadith'], 0, 100) : '';
        $processed['description'] = !empty($processed['sharh']) ? mb_substr($processed['sharh'], 0, 200) : '';
        $processed['prepared_by'] = $processed['rawi'] ?? '';
        
    } 
    // Procesamiento especial para ibn-taymiyyah
    elseif ($category === 'ibn-taymiyyah') {
        $ibnTaymiyyahFields = ['id', 'name', 'link', 'created_at'];
        
        foreach ($ibnTaymiyyahFields as $field) {
            $processed[$field] = isset($item[$field]) ? cleanText($item[$field]) : null;
        }
        
        // Campos adicionales para compatibilidad - usar el nombre real del libro
        $processed['title'] = $processed['name'] ?? '';
        $processed['description'] = $processed['name'] ?? 'كتاب من مؤلفات الشيخ ابن تيمية';
        $processed['prepared_by'] = 'الشيخ ابن تيمية';
        $processed['author'] = 'الشيخ ابن تيمية';
        
        // Create attachment for the link
        if (!empty($processed['link'])) {
            $processed['attachments'] = [[
                'url' => $processed['link'],
                'extension_type' => 'PDF',
                'size' => 'تحميل الكتاب',
                'title' => $processed['name'] ?? 'كتاب'
            ]];
        } else {
            $processed['attachments'] = [];
        }
        
    } 
    // Procesamiento especial para videos_ulamah (nueva estructura con playlist_title, videos_json, Iframes_json)
    elseif ($category === 'videos_ulamah') {
        error_log("Videos Ulamah - Processing item with keys: " . implode(', ', array_keys($item)));
        error_log("Videos Ulamah - playlist_title: " . ($item['playlist_title'] ?? 'NULL'));
        error_log("Videos Ulamah - videos_json: " . substr($item['videos_json'] ?? 'NULL', 0, 100));
        error_log("Videos Ulamah - Iframes_json: " . substr($item['Iframes_json'] ?? 'NULL', 0, 100));
        
        foreach ($item as $key => $value) {
            switch ($key) {
                case 'playlist_title':
                    $processed[$key] = cleanText($value);
                    // Use playlist_title as the main title for display
                    $processed['title'] = cleanText($value);
                    break;
                    
                case 'videos_json':
                    // Parse JSON array of video titles
                    if (!empty($value)) {
                        $videoTitles = json_decode($value, true);
                        if (json_last_error() === JSON_ERROR_NONE && is_array($videoTitles)) {
                            $processed['videos_json'] = $videoTitles;
                        } else {
                            $processed['videos_json'] = [];
                            error_log("Videos Ulamah - Error parsing videos_json: " . json_last_error_msg());
                        }
                    } else {
                        $processed['videos_json'] = [];
                    }
                    break;
                    
                case 'iframes_json':
                    // Parse JSON array of iframe HTML
                    if (!empty($value)) {
                        $iframes = json_decode($value, true);
                        if (json_last_error() === JSON_ERROR_NONE && is_array($iframes)) {
                            $processed['iframes_json'] = $iframes;
                            
                            // Create attachments array from iframes for compatibility
                            $attachments = [];
                            foreach ($iframes as $index => $iframe) {
                                // Extract URL from iframe src attribute
                                if (preg_match('/src=["\']([^"\']+)["\']/', $iframe, $matches)) {
                                    $videoUrl = $matches[1];
                                    $videoTitle = isset($processed['videos_json'][$index]) ? $processed['videos_json'][$index] : "فيديو " . ($index + 1);
                                    $attachments[] = [
                                        'url' => $videoUrl,
                                        'extension_type' => 'VIDEO',
                                        'size' => 'Ver Video',
                                        'title' => $videoTitle,
                                        'iframe' => $iframe
                                    ];
                                }
                            }
                            $processed['attachments'] = $attachments;
                            error_log("Videos Ulamah - Created " . count($attachments) . " video attachments from iframes");
                        } else {
                            $processed['iframes_json'] = [];
                            $processed['attachments'] = [];
                            error_log("Videos Ulamah - Error parsing iframes_json: " . json_last_error_msg());
                        }
                    } else {
                        $processed['iframes_json'] = [];
                        $processed['attachments'] = [];
                    }
                    break;
                    
                case 'iframe':
                    // FALLBACK: Support old structure with single iframe column
                    $processed[$key] = cleanText($value);
                    
                    // If no attachments were created from Iframes_json, try to create from single iframe
                    if (empty($processed['attachments']) && !empty($value)) {
                        if (preg_match('/src=["\']([^"\']+)["\']/', $value, $matches)) {
                            $videoUrl = $matches[1];
                            $processed['attachments'] = [[
                                'url' => $videoUrl,
                                'extension_type' => 'VIDEO',
                                'size' => 'Ver Video',
                                'title' => $processed['title'] ?? 'فيديو',
                                'iframe' => $value
                            ]];
                            error_log("Videos Ulamah - FALLBACK: Created attachment from single iframe");
                        } else {
                            $processed['attachments'] = [];
                            error_log("Videos Ulamah - FALLBACK: Could not extract URL from iframe");
                        }
                    }
                    break;
                    
                default:
                    if (is_string($value)) {
                        $cleaned = @iconv('UTF-8', 'UTF-8//IGNORE', $value);
                        if ($cleaned === false) {
                            $cleaned = filter_var($value, FILTER_UNSAFE_RAW, FILTER_FLAG_STRIP_LOW | FILTER_FLAG_STRIP_HIGH);
                            $cleaned = preg_replace('/[\x00-\x1F\x7F-\xFF]/', '', $cleaned);
                        }
                        $processed[$key] = $cleaned;
                    } else {
                        $processed[$key] = $value;
                    }
                    break;
            }
        }
        
        // Usar channel_name como prepared_by para compatibilidad
        $processed['prepared_by'] = $processed['channel_name'] ?? '';
        
        // FALLBACK: Si no hay attachments creados desde Iframes_json, crear desde videos_json solamente
        if (empty($processed['attachments']) && !empty($processed['videos_json'])) {
            $attachments = [];
            foreach ($processed['videos_json'] as $index => $videoTitle) {
                $attachments[] = [
                    'url' => '#', // Placeholder URL since we don't have iframes
                    'extension_type' => 'VIDEO',
                    'size' => 'Ver Video',
                    'title' => $videoTitle,
                    'iframe' => null,
                    'placeholder' => true // Mark as placeholder
                ];
            }
            $processed['attachments'] = $attachments;
            error_log("Videos Ulamah - FALLBACK: Created " . count($attachments) . " placeholder attachments from videos_json only");
        }
        
    } 
    // Procesamiento para otras tablas (articles, audios, videos)
    else {
        foreach ($item as $key => $value) {
            switch ($key) {
                case 'description':
                case 'localized_name':
                case 'prepared_by':
                case 'translators':
                case 'add_date':
                case 'pub_date':
                case 'title':
                    $processed[$key] = cleanText($value);
                    break;
                    
                case 'attachments':
                    $attachments = json_decode($value, true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($attachments)) {
                        $processed[$key] = $attachments;
                    } else {
                        $processed[$key] = [];
                    }
                    break;
                    
                default:
                    if (is_string($value)) {
                        $cleaned = @iconv('UTF-8', 'UTF-8//IGNORE', $value);
                        if ($cleaned === false) {
                            $cleaned = filter_var($value, FILTER_UNSAFE_RAW, FILTER_FLAG_STRIP_LOW | FILTER_FLAG_STRIP_HIGH);
                            $cleaned = preg_replace('/[\x00-\x1F\x7F-\xFF]/', '', $cleaned);
                        }
                        $processed[$key] = $cleaned;
                    } else {
                        $processed[$key] = $value;
                    }
                    break;
            }
        }
    }
    
    // Procesamiento común para todos los tipos de items
    if (isset($processed['description'])) {
        $processed['description_short'] = truncateDescription($processed['description']);
    }
    
    // Agregar el tipo/categoría del item
    if ($category) {
        $processed['type'] = $category;
    }
    
    // Manejo especial para campos de fecha
    if (!isset($processed['add_date'])) {
        if (isset($item['created_at'])) {
            $processed['add_date'] = $item['created_at'];
        } elseif (isset($item['pub_date'])) {
            $processed['add_date'] = $item['pub_date'];
        } else {
            $processed['add_date'] = date('Y-m-d H:i:s');
        }
    }
    
    return $processed;
}