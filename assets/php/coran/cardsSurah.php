<?php
// Fallback data for surahs when database is not available
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

try {
    // Try to include configuration and use database if available
    if (file_exists('../../../config.php')) {
        require_once '../../../config.php';
        
        try {
            $db = getDB();
            
            // Try to get data from database
            $query = "SELECT number, name_ar, name_en, type, ayahs_totales, revelation_order 
                      FROM surah_info 
                      ORDER BY number ASC";
            
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            $surahData = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (!empty($surahData)) {
                // Database data found, process it
                foreach ($surahData as &$surah) {
                    $surah['number'] = (int)$surah['number'];
                    $surah['ayahs_totales'] = (int)$surah['ayahs_totales'];
                    $surah['revelation_order'] = (int)$surah['revelation_order'];
                    
                    if (function_exists('cleanText')) {
                        $surah['name_ar'] = cleanText($surah['name_ar']);
                        $surah['name_en'] = cleanText($surah['name_en']);
                        $surah['type'] = cleanText($surah['type']);
                    }
                }
                
                echo json_encode($surahData, JSON_UNESCAPED_UNICODE);
                exit;
            }
        } catch (Exception $dbError) {
            // Database connection failed, will use fallback data
            error_log("Database error: " . $dbError->getMessage());
        }
    }
    
    // Fallback: Use static surah data
    $surahData = [
        ["number" => 1, "name_ar" => "الفاتحة", "name_en" => "Al-Fatiha", "type" => "مكية", "ayahs_totales" => 7, "revelation_order" => 5],
        ["number" => 2, "name_ar" => "البقرة", "name_en" => "Al-Baqarah", "type" => "مدنية", "ayahs_totales" => 286, "revelation_order" => 87],
        ["number" => 3, "name_ar" => "آل عمران", "name_en" => "Aal-E-Imran", "type" => "مدنية", "ayahs_totales" => 200, "revelation_order" => 89],
        ["number" => 4, "name_ar" => "النساء", "name_en" => "An-Nisa", "type" => "مدنية", "ayahs_totales" => 176, "revelation_order" => 92],
        ["number" => 5, "name_ar" => "المائدة", "name_en" => "Al-Maidah", "type" => "مدنية", "ayahs_totales" => 120, "revelation_order" => 112],
        ["number" => 6, "name_ar" => "الأنعام", "name_en" => "Al-An'am", "type" => "مكية", "ayahs_totales" => 165, "revelation_order" => 55],
        ["number" => 7, "name_ar" => "الأعراف", "name_en" => "Al-A'raf", "type" => "مكية", "ayahs_totales" => 206, "revelation_order" => 39],
        ["number" => 8, "name_ar" => "الأنفال", "name_en" => "Al-Anfal", "type" => "مدنية", "ayahs_totales" => 75, "revelation_order" => 88],
        ["number" => 9, "name_ar" => "التوبة", "name_en" => "At-Tawbah", "type" => "مدنية", "ayahs_totales" => 129, "revelation_order" => 113],
        ["number" => 10, "name_ar" => "يونس", "name_en" => "Yunus", "type" => "مكية", "ayahs_totales" => 109, "revelation_order" => 51],
        ["number" => 11, "name_ar" => "هود", "name_en" => "Hud", "type" => "مكية", "ayahs_totales" => 123, "revelation_order" => 52],
        ["number" => 12, "name_ar" => "يوسف", "name_en" => "Yusuf", "type" => "مكية", "ayahs_totales" => 111, "revelation_order" => 53],
        ["number" => 13, "name_ar" => "الرعد", "name_en" => "Ar-Ra'd", "type" => "مدنية", "ayahs_totales" => 43, "revelation_order" => 96],
        ["number" => 14, "name_ar" => "إبراهيم", "name_en" => "Ibrahim", "type" => "مكية", "ayahs_totales" => 52, "revelation_order" => 72],
        ["number" => 15, "name_ar" => "الحجر", "name_en" => "Al-Hijr", "type" => "مكية", "ayahs_totales" => 99, "revelation_order" => 54],
        ["number" => 16, "name_ar" => "النحل", "name_en" => "An-Nahl", "type" => "مكية", "ayahs_totales" => 128, "revelation_order" => 70],
        ["number" => 17, "name_ar" => "الإسراء", "name_en" => "Al-Isra", "type" => "مكية", "ayahs_totales" => 111, "revelation_order" => 50],
        ["number" => 18, "name_ar" => "الكهف", "name_en" => "Al-Kahf", "type" => "مكية", "ayahs_totales" => 110, "revelation_order" => 69],
        ["number" => 19, "name_ar" => "مريم", "name_en" => "Maryam", "type" => "مكية", "ayahs_totales" => 98, "revelation_order" => 44],
        ["number" => 20, "name_ar" => "طه", "name_en" => "Taha", "type" => "مكية", "ayahs_totales" => 135, "revelation_order" => 45],
        ["number" => 21, "name_ar" => "الأنبياء", "name_en" => "Al-Anbiya", "type" => "مكية", "ayahs_totales" => 112, "revelation_order" => 73],
        ["number" => 22, "name_ar" => "الحج", "name_en" => "Al-Hajj", "type" => "مدنية", "ayahs_totales" => 78, "revelation_order" => 103],
        ["number" => 23, "name_ar" => "المؤمنون", "name_en" => "Al-Mu'minun", "type" => "مكية", "ayahs_totales" => 118, "revelation_order" => 74],
        ["number" => 24, "name_ar" => "النور", "name_en" => "An-Nur", "type" => "مدنية", "ayahs_totales" => 64, "revelation_order" => 102],
        ["number" => 25, "name_ar" => "الفرقان", "name_en" => "Al-Furqan", "type" => "مكية", "ayahs_totales" => 77, "revelation_order" => 42],
        ["number" => 26, "name_ar" => "الشعراء", "name_en" => "Ash-Shu'ara", "type" => "مكية", "ayahs_totales" => 227, "revelation_order" => 47],
        ["number" => 27, "name_ar" => "النمل", "name_en" => "An-Naml", "type" => "مكية", "ayahs_totales" => 93, "revelation_order" => 48],
        ["number" => 28, "name_ar" => "القصص", "name_en" => "Al-Qasas", "type" => "مكية", "ayahs_totales" => 88, "revelation_order" => 49],
        ["number" => 29, "name_ar" => "العنكبوت", "name_en" => "Al-Ankabut", "type" => "مكية", "ayahs_totales" => 69, "revelation_order" => 85],
        ["number" => 30, "name_ar" => "الروم", "name_en" => "Ar-Rum", "type" => "مكية", "ayahs_totales" => 60, "revelation_order" => 84],
        ["number" => 31, "name_ar" => "لقمان", "name_en" => "Luqman", "type" => "مكية", "ayahs_totales" => 34, "revelation_order" => 57],
        ["number" => 32, "name_ar" => "السجدة", "name_en" => "As-Sajdah", "type" => "مكية", "ayahs_totales" => 30, "revelation_order" => 75],
        ["number" => 33, "name_ar" => "الأحزاب", "name_en" => "Al-Ahzab", "type" => "مدنية", "ayahs_totales" => 73, "revelation_order" => 90],
        ["number" => 34, "name_ar" => "سبأ", "name_en" => "Saba", "type" => "مكية", "ayahs_totales" => 54, "revelation_order" => 58],
        ["number" => 35, "name_ar" => "فاطر", "name_en" => "Fatir", "type" => "مكية", "ayahs_totales" => 45, "revelation_order" => 43],
        ["number" => 36, "name_ar" => "يس", "name_en" => "Ya-Sin", "type" => "مكية", "ayahs_totales" => 83, "revelation_order" => 41],
        ["number" => 37, "name_ar" => "الصافات", "name_en" => "As-Saffat", "type" => "مكية", "ayahs_totales" => 182, "revelation_order" => 56],
        ["number" => 38, "name_ar" => "ص", "name_en" => "Sad", "type" => "مكية", "ayahs_totales" => 88, "revelation_order" => 38],
        ["number" => 39, "name_ar" => "الزمر", "name_en" => "Az-Zumar", "type" => "مكية", "ayahs_totales" => 75, "revelation_order" => 59],
        ["number" => 40, "name_ar" => "غافر", "name_en" => "Ghafir", "type" => "مكية", "ayahs_totales" => 85, "revelation_order" => 60],
        ["number" => 41, "name_ar" => "فصلت", "name_en" => "Fussilat", "type" => "مكية", "ayahs_totales" => 54, "revelation_order" => 61],
        ["number" => 42, "name_ar" => "الشورى", "name_en" => "Ash-Shuraa", "type" => "مكية", "ayahs_totales" => 53, "revelation_order" => 62],
        ["number" => 43, "name_ar" => "الزخرف", "name_en" => "Az-Zukhruf", "type" => "مكية", "ayahs_totales" => 89, "revelation_order" => 63],
        ["number" => 44, "name_ar" => "الدخان", "name_en" => "Ad-Dukhan", "type" => "مكية", "ayahs_totales" => 59, "revelation_order" => 64],
        ["number" => 45, "name_ar" => "الجاثية", "name_en" => "Al-Jathiyah", "type" => "مكية", "ayahs_totales" => 37, "revelation_order" => 65],
        ["number" => 46, "name_ar" => "الأحقاف", "name_en" => "Al-Ahqaf", "type" => "مكية", "ayahs_totales" => 35, "revelation_order" => 66],
        ["number" => 47, "name_ar" => "محمد", "name_en" => "Muhammad", "type" => "مدنية", "ayahs_totales" => 38, "revelation_order" => 95],
        ["number" => 48, "name_ar" => "الفتح", "name_en" => "Al-Fath", "type" => "مدنية", "ayahs_totales" => 29, "revelation_order" => 111],
        ["number" => 49, "name_ar" => "الحجرات", "name_en" => "Al-Hujurat", "type" => "مدنية", "ayahs_totales" => 18, "revelation_order" => 106],
        ["number" => 50, "name_ar" => "ق", "name_en" => "Qaf", "type" => "مكية", "ayahs_totales" => 45, "revelation_order" => 34],
        ["number" => 51, "name_ar" => "الذاريات", "name_en" => "Adh-Dhariyat", "type" => "مكية", "ayahs_totales" => 60, "revelation_order" => 67],
        ["number" => 52, "name_ar" => "الطور", "name_en" => "At-Tur", "type" => "مكية", "ayahs_totales" => 49, "revelation_order" => 76],
        ["number" => 53, "name_ar" => "النجم", "name_en" => "An-Najm", "type" => "مكية", "ayahs_totales" => 62, "revelation_order" => 23],
        ["number" => 54, "name_ar" => "القمر", "name_en" => "Al-Qamar", "type" => "مكية", "ayahs_totales" => 55, "revelation_order" => 37],
        ["number" => 55, "name_ar" => "الرحمن", "name_en" => "Ar-Rahman", "type" => "مدنية", "ayahs_totales" => 78, "revelation_order" => 97],
        ["number" => 56, "name_ar" => "الواقعة", "name_en" => "Al-Waqiah", "type" => "مكية", "ayahs_totales" => 96, "revelation_order" => 46],
        ["number" => 57, "name_ar" => "الحديد", "name_en" => "Al-Hadid", "type" => "مدنية", "ayahs_totales" => 29, "revelation_order" => 94],
        ["number" => 58, "name_ar" => "المجادلة", "name_en" => "Al-Mujadila", "type" => "مدنية", "ayahs_totales" => 22, "revelation_order" => 105],
        ["number" => 59, "name_ar" => "الحشر", "name_en" => "Al-Hashr", "type" => "مدنية", "ayahs_totales" => 24, "revelation_order" => 101],
        ["number" => 60, "name_ar" => "الممتحنة", "name_en" => "Al-Mumtahanah", "type" => "مدنية", "ayahs_totales" => 13, "revelation_order" => 91],
        ["number" => 61, "name_ar" => "الصف", "name_en" => "As-Saf", "type" => "مدنية", "ayahs_totales" => 14, "revelation_order" => 109],
        ["number" => 62, "name_ar" => "الجمعة", "name_en" => "Al-Jumuah", "type" => "مدنية", "ayahs_totales" => 11, "revelation_order" => 110],
        ["number" => 63, "name_ar" => "المنافقون", "name_en" => "Al-Munafiqun", "type" => "مدنية", "ayahs_totales" => 11, "revelation_order" => 104],
        ["number" => 64, "name_ar" => "التغابن", "name_en" => "At-Taghabun", "type" => "مدنية", "ayahs_totales" => 18, "revelation_order" => 108],
        ["number" => 65, "name_ar" => "الطلاق", "name_en" => "At-Talaq", "type" => "مدنية", "ayahs_totales" => 12, "revelation_order" => 99],
        ["number" => 66, "name_ar" => "التحريم", "name_en" => "At-Tahrim", "type" => "مدنية", "ayahs_totales" => 12, "revelation_order" => 107],
        ["number" => 67, "name_ar" => "الملك", "name_en" => "Al-Mulk", "type" => "مكية", "ayahs_totales" => 30, "revelation_order" => 77],
        ["number" => 68, "name_ar" => "القلم", "name_en" => "Al-Qalam", "type" => "مكية", "ayahs_totales" => 52, "revelation_order" => 2],
        ["number" => 69, "name_ar" => "الحاقة", "name_en" => "Al-Haqqah", "type" => "مكية", "ayahs_totales" => 52, "revelation_order" => 78],
        ["number" => 70, "name_ar" => "المعارج", "name_en" => "Al-Maarij", "type" => "مكية", "ayahs_totales" => 44, "revelation_order" => 79],
        ["number" => 71, "name_ar" => "نوح", "name_en" => "Nuh", "type" => "مكية", "ayahs_totales" => 28, "revelation_order" => 71],
        ["number" => 72, "name_ar" => "الجن", "name_en" => "Al-Jinn", "type" => "مكية", "ayahs_totales" => 28, "revelation_order" => 40],
        ["number" => 73, "name_ar" => "المزمل", "name_en" => "Al-Muzzammil", "type" => "مكية", "ayahs_totales" => 20, "revelation_order" => 3],
        ["number" => 74, "name_ar" => "المدثر", "name_en" => "Al-Muddaththir", "type" => "مكية", "ayahs_totales" => 56, "revelation_order" => 4],
        ["number" => 75, "name_ar" => "القيامة", "name_en" => "Al-Qiyamah", "type" => "مكية", "ayahs_totales" => 40, "revelation_order" => 31],
        ["number" => 76, "name_ar" => "الإنسان", "name_en" => "Al-Insan", "type" => "مدنية", "ayahs_totales" => 31, "revelation_order" => 98],
        ["number" => 77, "name_ar" => "المرسلات", "name_en" => "Al-Mursalat", "type" => "مكية", "ayahs_totales" => 50, "revelation_order" => 33],
        ["number" => 78, "name_ar" => "النبأ", "name_en" => "An-Naba", "type" => "مكية", "ayahs_totales" => 40, "revelation_order" => 80],
        ["number" => 79, "name_ar" => "النازعات", "name_en" => "An-Naziat", "type" => "مكية", "ayahs_totales" => 46, "revelation_order" => 81],
        ["number" => 80, "name_ar" => "عبس", "name_en" => "Abasa", "type" => "مكية", "ayahs_totales" => 42, "revelation_order" => 24],
        ["number" => 81, "name_ar" => "التكوير", "name_en" => "At-Takwir", "type" => "مكية", "ayahs_totales" => 29, "revelation_order" => 7],
        ["number" => 82, "name_ar" => "الانفطار", "name_en" => "Al-Infitar", "type" => "مكية", "ayahs_totales" => 19, "revelation_order" => 82],
        ["number" => 83, "name_ar" => "المطففين", "name_en" => "Al-Mutaffifin", "type" => "مكية", "ayahs_totales" => 36, "revelation_order" => 86],
        ["number" => 84, "name_ar" => "الانشقاق", "name_en" => "Al-Inshiqaq", "type" => "مكية", "ayahs_totales" => 25, "revelation_order" => 83],
        ["number" => 85, "name_ar" => "البروج", "name_en" => "Al-Buruj", "type" => "مكية", "ayahs_totales" => 22, "revelation_order" => 27],
        ["number" => 86, "name_ar" => "الطارق", "name_en" => "At-Tariq", "type" => "مكية", "ayahs_totales" => 17, "revelation_order" => 36],
        ["number" => 87, "name_ar" => "الأعلى", "name_en" => "Al-Ala", "type" => "مكية", "ayahs_totales" => 19, "revelation_order" => 8],
        ["number" => 88, "name_ar" => "الغاشية", "name_en" => "Al-Ghashiyah", "type" => "مكية", "ayahs_totales" => 26, "revelation_order" => 68],
        ["number" => 89, "name_ar" => "الفجر", "name_en" => "Al-Fajr", "type" => "مكية", "ayahs_totales" => 30, "revelation_order" => 10],
        ["number" => 90, "name_ar" => "البلد", "name_en" => "Al-Balad", "type" => "مكية", "ayahs_totales" => 20, "revelation_order" => 35],
        ["number" => 91, "name_ar" => "الشمس", "name_en" => "Ash-Shams", "type" => "مكية", "ayahs_totales" => 15, "revelation_order" => 26],
        ["number" => 92, "name_ar" => "الليل", "name_en" => "Al-Layl", "type" => "مكية", "ayahs_totales" => 21, "revelation_order" => 9],
        ["number" => 93, "name_ar" => "الضحى", "name_en" => "Ad-Duhaa", "type" => "مكية", "ayahs_totales" => 11, "revelation_order" => 11],
        ["number" => 94, "name_ar" => "الشرح", "name_en" => "Ash-Sharh", "type" => "مكية", "ayahs_totales" => 8, "revelation_order" => 12],
        ["number" => 95, "name_ar" => "التين", "name_en" => "At-Tin", "type" => "مكية", "ayahs_totales" => 8, "revelation_order" => 28],
        ["number" => 96, "name_ar" => "العلق", "name_en" => "Al-Alaq", "type" => "مكية", "ayahs_totales" => 19, "revelation_order" => 1],
        ["number" => 97, "name_ar" => "القدر", "name_en" => "Al-Qadr", "type" => "مكية", "ayahs_totales" => 5, "revelation_order" => 25],
        ["number" => 98, "name_ar" => "البينة", "name_en" => "Al-Bayyinah", "type" => "مدنية", "ayahs_totales" => 8, "revelation_order" => 100],
        ["number" => 99, "name_ar" => "الزلزلة", "name_en" => "Az-Zalzalah", "type" => "مدنية", "ayahs_totales" => 8, "revelation_order" => 93],
        ["number" => 100, "name_ar" => "العاديات", "name_en" => "Al-Adiyat", "type" => "مكية", "ayahs_totales" => 11, "revelation_order" => 14],
        ["number" => 101, "name_ar" => "القارعة", "name_en" => "Al-Qariah", "type" => "مكية", "ayahs_totales" => 11, "revelation_order" => 30],
        ["number" => 102, "name_ar" => "التكاثر", "name_en" => "At-Takathur", "type" => "مكية", "ayahs_totales" => 8, "revelation_order" => 16],
        ["number" => 103, "name_ar" => "العصر", "name_en" => "Al-Asr", "type" => "مكية", "ayahs_totales" => 3, "revelation_order" => 13],
        ["number" => 104, "name_ar" => "الهمزة", "name_en" => "Al-Humazah", "type" => "مكية", "ayahs_totales" => 9, "revelation_order" => 32],
        ["number" => 105, "name_ar" => "الفيل", "name_en" => "Al-Fil", "type" => "مكية", "ayahs_totales" => 5, "revelation_order" => 19],
        ["number" => 106, "name_ar" => "قريش", "name_en" => "Quraysh", "type" => "مكية", "ayahs_totales" => 4, "revelation_order" => 29],
        ["number" => 107, "name_ar" => "الماعون", "name_en" => "Al-Maun", "type" => "مكية", "ayahs_totales" => 7, "revelation_order" => 17],
        ["number" => 108, "name_ar" => "الكوثر", "name_en" => "Al-Kawthar", "type" => "مكية", "ayahs_totales" => 3, "revelation_order" => 15],
        ["number" => 109, "name_ar" => "الكافرون", "name_en" => "Al-Kafirun", "type" => "مكية", "ayahs_totales" => 6, "revelation_order" => 18],
        ["number" => 110, "name_ar" => "النصر", "name_en" => "An-Nasr", "type" => "مدنية", "ayahs_totales" => 3, "revelation_order" => 114],
        ["number" => 111, "name_ar" => "المسد", "name_en" => "Al-Masad", "type" => "مكية", "ayahs_totales" => 5, "revelation_order" => 6],
        ["number" => 112, "name_ar" => "الإخلاص", "name_en" => "Al-Ikhlas", "type" => "مكية", "ayahs_totales" => 4, "revelation_order" => 22],
        ["number" => 113, "name_ar" => "الفلق", "name_en" => "Al-Falaq", "type" => "مكية", "ayahs_totales" => 5, "revelation_order" => 20],
        ["number" => 114, "name_ar" => "الناس", "name_en" => "An-Nas", "type" => "مكية", "ayahs_totales" => 6, "revelation_order" => 21]
    ];
    
    echo json_encode($surahData, JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => 'Error al obtener datos de suras: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>