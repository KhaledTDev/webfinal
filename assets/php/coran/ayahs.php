<?php
// Ayahs API - Get ayahs for a specific surah from database
// Load config without cleanText function to avoid redeclaration
require_once '../../../config.php';

// Set JSON headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Check if this is a search request
    $searchQuery = isset($_GET['search']) ? trim($_GET['search']) : null;
    $surahNumber = isset($_GET['surah']) ? (int)$_GET['surah'] : null;
    
    if ($searchQuery) {
        // Handle search in ayahs
        searchInAyahs($searchQuery);
        exit();
    }
    
    if (!$surahNumber || $surahNumber < 1 || $surahNumber > 114) {
        throw new Exception('رقم السورة غير صحيح');
    }
    
    // Get database connection
    $db = getDB();
    
    // Query to get ayahs from the 'ayahs' table
    $query = "SELECT 
                ayah_number as number,
                text_ar as text,
                text_en,
                text_es,
                surah_number
              FROM ayahs 
              WHERE surah_number = :surah_number 
              ORDER BY ayah_number ASC";
    
    try {
        $stmt = $db->prepare($query);
        $stmt->bindParam(':surah_number', $surahNumber, PDO::PARAM_INT);
        $stmt->execute();
        
        $ayahs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        // If query fails, use static data as fallback
        $ayahs = [];
    }
    
    if (empty($ayahs)) {
        // Final fallback: Use static data for testing
        $ayahs = getStaticAyahs($surahNumber);
    }
    
    // Clean and format ayahs
    $formattedAyahs = [];
    foreach ($ayahs as $ayah) {
        $formattedAyahs[] = [
            'number' => (int)$ayah['number'],
            'text' => cleanAyahText($ayah['text'] ?? ''),
            'text_en' => $ayah['text_en'] ?? '',
            'text_es' => $ayah['text_es'] ?? '',
            'surah_number' => (int)($ayah['surah_number'] ?? $surahNumber),
            'juz_number' => (int)($ayah['juz_number'] ?? 0),
            'hizb_number' => (int)($ayah['hizb_number'] ?? 0),
            'rub_number' => (int)($ayah['rub_number'] ?? 0)
        ];
    }
    
    // Return JSON response
    echo json_encode($formattedAyahs, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

// Static fallback data for testing
function getStaticAyahs($surahNumber) {
    $staticData = [
        1 => [ // Al-Fatiha
            ['number' => 1, 'text' => 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'],
            ['number' => 2, 'text' => 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ'],
            ['number' => 3, 'text' => 'الرَّحْمَٰنِ الرَّحِيمِ'],
            ['number' => 4, 'text' => 'مَالِكِ يَوْمِ الدِّينِ'],
            ['number' => 5, 'text' => 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ'],
            ['number' => 6, 'text' => 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ'],
            ['number' => 7, 'text' => 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ']
        ],
        112 => [ // Al-Ikhlas
            ['number' => 1, 'text' => 'قُلْ هُوَ اللَّهُ أَحَدٌ'],
            ['number' => 2, 'text' => 'اللَّهُ الصَّمَدُ'],
            ['number' => 3, 'text' => 'لَمْ يَلِدْ وَلَمْ يُولَدْ'],
            ['number' => 4, 'text' => 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ']
        ],
        113 => [ // Al-Falaq
            ['number' => 1, 'text' => 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ'],
            ['number' => 2, 'text' => 'مِن شَرِّ مَا خَلَقَ'],
            ['number' => 3, 'text' => 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ'],
            ['number' => 4, 'text' => 'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ'],
            ['number' => 5, 'text' => 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ']
        ],
        114 => [ // An-Nas
            ['number' => 1, 'text' => 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ'],
            ['number' => 2, 'text' => 'مَلِكِ النَّاسِ'],
            ['number' => 3, 'text' => 'إِلَٰهِ النَّاسِ'],
            ['number' => 4, 'text' => 'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ'],
            ['number' => 5, 'text' => 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ'],
            ['number' => 6, 'text' => 'مِنَ الْجِنَّةِ وَالنَّاسِ']
        ]
    ];
    
    return $staticData[$surahNumber] ?? [
        ['number' => 1, 'text' => 'آيات هذه السورة غير متوفرة حالياً']
    ];
}

// Normalize Arabic text for search
function normalizeArabicForSearch($text) {
    if (empty($text)) return '';
    
    return preg_replace([
        '/[\x{064B}-\x{0652}]/u',     // Remove diacritics
        '/[\x{0653}-\x{065F}]/u',     // Remove additional diacritics
        '/[\x{0670}]/u',              // Remove superscript alif
        '/[\x{06D6}-\x{06ED}]/u',     // Remove Quranic marks
        '/[\x{0640}]/u',              // Remove tatweel
        '/[\x{200B}-\x{200F}\x{202A}-\x{202E}]/u', // Remove zero-width chars
        '/[آأإٱ]/u',                   // All alif variations to basic alif
        '/[ىئ]/u',                    // Yaa variations
        '/ة/u',                       // Taa marboota to haa
        '/ؤ/u',                       // Waw with hamza
        '/\s+/',                      // Multiple spaces to single
    ], [
        '', '', '', '', '', '',
        'ا', 'ي', 'ه', 'و', ' '
    ], trim(mb_strtolower($text, 'UTF-8')));
}

// Search in ayahs function
function searchInAyahs($query) {
    try {
        $db = getDB();
        
        // Normalize the search query
        $normalizedQuery = normalizeArabicForSearch($query);
        
        // Get all ayahs and search in PHP for better normalization control
        $sql = "SELECT 
                    ayah_number as number,
                    text_ar as text,
                    text_en,
                    text_es,
                    surah_number
                FROM ayahs 
                ORDER BY surah_number ASC, ayah_number ASC";
        
        $stmt = $db->prepare($sql);
        $stmt->execute();
        
        $allAyahs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Filter results using normalized text comparison
        $results = [];
        foreach ($allAyahs as $ayah) {
            $normalizedAyahText = normalizeArabicForSearch($ayah['text']);
            
            // Check if normalized query is contained in normalized ayah text
            if (strpos($normalizedAyahText, $normalizedQuery) !== false) {
                $results[] = $ayah;
                
                // Limit results to prevent too many matches
                if (count($results) >= 50) {
                    break;
                }
            }
        }
        
        // Format results
        $formattedResults = [];
        foreach ($results as $ayah) {
            $formattedResults[] = [
                'number' => (int)$ayah['number'],
                'text' => cleanAyahText($ayah['text'] ?? ''),
                'text_en' => $ayah['text_en'] ?? '',
                'text_es' => $ayah['text_es'] ?? '',
                'surah_number' => (int)$ayah['surah_number']
            ];
        }
        
        echo json_encode($formattedResults, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'error' => true,
            'message' => 'خطأ في البحث: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
    }
}

// Clean text function (local version to avoid conflicts)
function cleanAyahText($text) {
    if (empty($text)) return '';
    
    // Convert to string if not already
    $text = (string)$text;
    
    // If it's JSON, decode it
    $decoded = json_decode($text, true);
    if (json_last_error() === JSON_ERROR_NONE && is_string($decoded)) {
        $text = $decoded;
    }
    
    // Clean HTML tags and ensure UTF-8
    $text = strip_tags($text);
    $text = @iconv('UTF-8', 'UTF-8//IGNORE', $text) ?: $text;
    
    return trim($text);
}
?>
