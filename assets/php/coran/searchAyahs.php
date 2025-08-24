<?php
// Search Ayahs API - Para búsqueda global de ayahs en el Corán
require_once __DIR__ . '/../../../config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Arabic text normalization functions
function removeHarakat($text) {
    if (empty($text)) return '';
    
    $normalized = $text;
    
    // Remove all Arabic diacritical marks (harakat) - comprehensive range
    $normalized = preg_replace('/[\x{064B}-\x{065F}\x{0670}\x{06D6}-\x{06ED}\x{08D4}-\x{08E1}\x{08E3}-\x{08FF}]/u', '', $normalized);
    
    // Remove tatweel (kashida)
    $normalized = preg_replace('/\x{0640}/u', '', $normalized);
    
    // Remove hamza above/below and other combining marks
    $normalized = preg_replace('/[\x{0654}\x{0655}\x{0656}\x{0657}\x{0658}\x{0659}\x{065A}\x{065B}\x{065C}\x{065D}\x{065E}]/u', '', $normalized);
    
    // Remove zero-width characters
    $normalized = preg_replace('/[\x{200B}\x{200C}\x{200D}\x{200E}\x{200F}\x{FEFF}]/u', '', $normalized);
    
    // Remove extra spaces and normalize whitespace
    $normalized = preg_replace('/\s+/u', ' ', trim($normalized));
    
    return $normalized;
}

function normalizeArabicForSearch($text) {
    if (empty($text)) return '';
    
    $normalized = mb_strtolower($text, 'UTF-8');
    
    // Remove harakat and diacritics first
    $normalized = removeHarakat($normalized);
    
    // Character mapping for comprehensive normalization using actual Unicode characters
    $arabicNormalizationMap = [
        // Alif variants
        'آ' => 'ا', // alif with madda
        'أ' => 'ا', // alif with hamza above
        'إ' => 'ا', // alif with hamza below
        'ٱ' => 'ا', // alif wasla
        
        // Yaa variants
        'ى' => 'ي', // alif maksura
        'ئ' => 'ي', // yaa with hamza
        
        // Waw variants
        'ؤ' => 'و', // waw with hamza
        
        // Taa variants
        'ة' => 'ه', // taa marbuta
        
        // Remove hamza
        'ء' => '', // standalone hamza
        
        // Normalize lam-alif ligature
        'ﻻ' => 'لا',
        'ﻼ' => 'لا',
    ];
    
    // Apply character mapping
    foreach ($arabicNormalizationMap as $original => $replacement) {
        $normalized = str_replace($original, $replacement, $normalized);
    }
    
    return $normalized;
}

// cleanText function is defined in config.php


// Get search query
$query = isset($_GET['q']) ? trim($_GET['q']) : '';

// Test endpoint for normalization
if (isset($_GET['test']) && $_GET['test'] === 'normalize') {
    $testText = isset($_GET['text']) ? $_GET['text'] : 'وَخَلَقَ';
    $normalized = normalizeArabicForSearch($testText);
    echo json_encode([
        'original' => $testText,
        'normalized' => $normalized,
        'test_query' => 'وخلق',
        'test_normalized' => normalizeArabicForSearch('وخلق'),
        'match' => strpos($normalized, normalizeArabicForSearch('وخلق')) !== false
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    // Validate query
    if (empty($query) || strlen($query) < 2) {
        throw new Exception('Query debe tener al menos 2 caracteres');
    }
    
    // Try to use database first, fallback to static data
    $results = [];
    $useDatabase = false;
    
    if (file_exists('../../../config.php')) {
        try {
            require_once '../../../config.php';
            $db = getDB();
            
            // Test if ayahs table exists
            $stmt = $db->query("SHOW TABLES LIKE 'ayahs'");
            if ($stmt && $stmt->rowCount() > 0) {
                $useDatabase = true;
                
                // Normalize the search query for Arabic text
                $normalizedQuery = normalizeArabicForSearch($query);
                
                // Get all ayahs first, then filter in PHP for exact word matching
                $searchQuery = "
                    SELECT 
                        a.surah_number,
                        a.ayah_number,
                        a.text_ar,
                        a.text_en,
                        a.text_es,
                        s.name_ar as surah_name,
                        s.name_en as surah_name_en,
                        s.type as surah_type
                    FROM ayahs a
                    INNER JOIN surah_info s ON a.surah_number = s.number
                    ORDER BY a.surah_number ASC, a.ayah_number ASC
                ";
                
                $stmt = $db->prepare($searchQuery);
                $stmt->execute();
                
                $dbResults = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                // Process results with exact word matching and Arabic normalization
                foreach ($dbResults as $result) {
                    $normalizedTextAr = normalizeArabicForSearch($result['text_ar']);
                    $normalizedTextEn = mb_strtolower($result['text_en'], 'UTF-8');
                    $normalizedTextEs = mb_strtolower($result['text_es'], 'UTF-8');
                    $queryLower = mb_strtolower($query, 'UTF-8');
                    
                    // For Arabic: Check if the normalized query exists as a complete word in the normalized text
                    $arabicMatch = false;
                    if (!empty($normalizedQuery)) {
                        // Split text into words and check for exact match
                        $words = preg_split('/\s+/u', $normalizedTextAr);
                        foreach ($words as $word) {
                            // Remove punctuation and check exact match
                            $cleanWord = preg_replace('/[^\p{Arabic}\p{N}]/u', '', $word);
                            if ($cleanWord === $normalizedQuery) {
                                $arabicMatch = true;
                                break;
                            }
                        }
                    }
                    
                    // For English and Spanish: Check exact word match
                    $englishMatch = false;
                    $spanishMatch = false;
                    
                    if (!empty($queryLower) && !preg_match('/[\p{Arabic}]/u', $query)) {
                        // English word boundary search
                        if (preg_match('/\b' . preg_quote($queryLower, '/') . '\b/i', $normalizedTextEn)) {
                            $englishMatch = true;
                        }
                        // Spanish word boundary search
                        if (preg_match('/\b' . preg_quote($queryLower, '/') . '\b/i', $normalizedTextEs)) {
                            $spanishMatch = true;
                        }
                    }
                    
                    // Debug logging for first few results
                    if (count($results) < 3) {
                        error_log("DEBUG - Original query: '$query'");
                        error_log("DEBUG - Normalized query: '$normalizedQuery'");
                        error_log("DEBUG - Original text: '{$result['text_ar']}'");
                        error_log("DEBUG - Normalized text: '$normalizedTextAr'");
                        error_log("DEBUG - Arabic match: " . ($arabicMatch ? 'TRUE' : 'FALSE'));
                        error_log("DEBUG - English match: " . ($englishMatch ? 'TRUE' : 'FALSE'));
                        error_log("DEBUG - Spanish match: " . ($spanishMatch ? 'TRUE' : 'FALSE'));
                    }
                    
                    // Only include results with exact word matches
                    if ($arabicMatch || $englishMatch || $spanishMatch) {
                        $results[] = [
                            'surah_number' => (int)$result['surah_number'],
                            'ayah_number' => (int)$result['ayah_number'],
                            'text' => cleanText($result['text_ar']),
                            'text_en' => cleanText($result['text_en']),
                            'text_es' => cleanText($result['text_es']),
                            'surah_name' => cleanText($result['surah_name']),
                            'surah_name_en' => cleanText($result['surah_name_en']),
                            'surah_type' => cleanText($result['surah_type'])
                        ];
                    }
                    
                    // Limit results to 50
                    if (count($results) >= 50) {
                        break;
                    }
                }
            }
        } catch (Exception $dbError) {
            error_log("Database error in searchAyahs: " . $dbError->getMessage());
            $useDatabase = false;
        }
    }
    
    if (!$useDatabase) {
        // Fallback: Use expanded static data
        $staticAyahs = [
            // Al-Fatiha
            [
                'surah_number' => 1, 'ayah_number' => 1,
                'text_ar' => 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
                'text_en' => 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
                'text_es' => 'En el nombre de Alá, el Compasivo, el Misericordioso.',
                'surah_name' => 'الفاتحة', 'surah_name_en' => 'Al-Fatiha', 'surah_type' => 'مكية'
            ],
            [
                'surah_number' => 1, 'ayah_number' => 2,
                'text_ar' => 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
                'text_en' => '[All] praise is [due] to Allah, Lord of the worlds',
                'text_es' => 'Las alabanzas a Alá, Señor del universo.',
                'surah_name' => 'الفاتحة', 'surah_name_en' => 'Al-Fatiha', 'surah_type' => 'مكية'
            ],
            [
                'surah_number' => 1, 'ayah_number' => 3,
                'text_ar' => 'الرَّحْمَٰنِ الرَّحِيمِ',
                'text_en' => 'The Entirely Merciful, the Especially Merciful',
                'text_es' => 'El Compasivo, el Misericordioso',
                'surah_name' => 'الفاتحة', 'surah_name_en' => 'Al-Fatiha', 'surah_type' => 'مكية'
            ],
            [
                'surah_number' => 1, 'ayah_number' => 4,
                'text_ar' => 'مَالِكِ يَوْمِ الدِّينِ',
                'text_en' => 'Sovereign of the Day of Recompense',
                'text_es' => 'Soberano del Día del Juicio',
                'surah_name' => 'الفاتحة', 'surah_name_en' => 'Al-Fatiha', 'surah_type' => 'مكية'
            ],
            [
                'surah_number' => 1, 'ayah_number' => 5,
                'text_ar' => 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
                'text_en' => 'It is You we worship and You we ask for help',
                'text_es' => 'Solo a Ti adoramos y solo de Ti imploramos ayuda',
                'surah_name' => 'الفاتحة', 'surah_name_en' => 'Al-Fatiha', 'surah_type' => 'مكية'
            ],
            [
                'surah_number' => 1, 'ayah_number' => 6,
                'text_ar' => 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
                'text_en' => 'Guide us to the straight path',
                'text_es' => 'Guíanos por el sendero recto',
                'surah_name' => 'الفاتحة', 'surah_name_en' => 'Al-Fatiha', 'surah_type' => 'مكية'
            ],
            [
                'surah_number' => 1, 'ayah_number' => 7,
                'text_ar' => 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
                'text_en' => 'The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray',
                'text_es' => 'el sendero de quienes has colmado de gracias, no el de quienes has castigado ni el de los extraviados',
                'surah_name' => 'الفاتحة', 'surah_name_en' => 'Al-Fatiha', 'surah_type' => 'مكية'
            ],
            // Al-Baqarah
            [
                'surah_number' => 2, 'ayah_number' => 1,
                'text_ar' => 'الم',
                'text_en' => 'Alif, Lam, Meem',
                'text_es' => 'Alif, Lam, Mim',
                'surah_name' => 'البقرة', 'surah_name_en' => 'Al-Baqarah', 'surah_type' => 'مدنية'
            ],
            [
                'surah_number' => 2, 'ayah_number' => 2,
                'text_ar' => 'ذَٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ هُدًى لِّلْمُتَّقِينَ',
                'text_en' => 'This is the Book about which there is no doubt, a guidance for those conscious of Allah',
                'text_es' => 'Este es el Libro en el que no hay duda, una guía para los temerosos de Alá',
                'surah_name' => 'البقرة', 'surah_name_en' => 'Al-Baqarah', 'surah_type' => 'مدنية'
            ],
            [
                'surah_number' => 2, 'ayah_number' => 255,
                'text_ar' => 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ',
                'text_en' => 'Allah - there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep. To Him belongs whatever is in the heavens and whatever is on the earth. Who is it that can intercede with Him except by His permission?',
                'text_es' => 'Alá, no hay más dios que Él, el Viviente, el Subsistente. Ni la somnolencia ni el sueño se apoderan de Él. Suyo es lo que está en los cielos y en la Tierra.',
                'surah_name' => 'البقرة', 'surah_name_en' => 'Al-Baqarah', 'surah_type' => 'مدنية'
            ],
            // Al-Ikhlas
            [
                'surah_number' => 112, 'ayah_number' => 1,
                'text_ar' => 'قُلْ هُوَ اللَّهُ أَحَدٌ',
                'text_en' => 'Say, "He is Allah, [who is] One',
                'text_es' => 'Di: "Él es Alá, Uno',
                'surah_name' => 'الإخلاص', 'surah_name_en' => 'Al-Ikhlas', 'surah_type' => 'مكية'
            ],
            [
                'surah_number' => 112, 'ayah_number' => 2,
                'text_ar' => 'اللَّهُ الصَّمَدُ',
                'text_en' => 'Allah, the Eternal Refuge',
                'text_es' => 'Alá, el Eterno',
                'surah_name' => 'الإخلاص', 'surah_name_en' => 'Al-Ikhlas', 'surah_type' => 'مكية'
            ],
            [
                'surah_number' => 112, 'ayah_number' => 3,
                'text_ar' => 'لَمْ يَلِدْ وَلَمْ يُولَدْ',
                'text_en' => 'He neither begets nor is born',
                'text_es' => 'No engendra ni es engendrado',
                'surah_name' => 'الإخلاص', 'surah_name_en' => 'Al-Ikhlas', 'surah_type' => 'مكية'
            ],
            [
                'surah_number' => 112, 'ayah_number' => 4,
                'text_ar' => 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
                'text_en' => 'Nor is there to Him any equivalent',
                'text_es' => 'y no hay nadie que se Le parezca',
                'surah_name' => 'الإخلاص', 'surah_name_en' => 'Al-Ikhlas', 'surah_type' => 'مكية'
            ],
            // Al-Falaq
            [
                'surah_number' => 113, 'ayah_number' => 1,
                'text_ar' => 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ',
                'text_en' => 'Say, "I seek refuge in the Lord of daybreak',
                'text_es' => 'Di: "Me refugio en el Señor del alba',
                'surah_name' => 'الفلق', 'surah_name_en' => 'Al-Falaq', 'surah_type' => 'مكية'
            ],
            // An-Nas
            [
                'surah_number' => 114, 'ayah_number' => 1,
                'text_ar' => 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ',
                'text_en' => 'Say, "I seek refuge in the Lord of mankind',
                'text_es' => 'Di: "Me refugio en el Señor de los hombres',
                'surah_name' => 'الناس', 'surah_name_en' => 'An-Nas', 'surah_type' => 'مكية'
            ],
            // Additional test ayahs for testing harakat functionality
            [
                'surah_number' => 2, 'ayah_number' => 30,
                'text_ar' => 'وَإِذْ قَالَ رَبُّكَ لِلْمَلَائِكَةِ إِنِّي جَاعِلٌ فِي الْأَرْضِ خَلِيفَةً قَالُوا أَتَجْعَلُ فِيهَا مَن يُفْسِدُ فِيهَا وَيَسْفِكُ الدِّمَاءَ وَنَحْنُ نُسَبِّحُ بِحَمْدِكَ وَنُقَدِّسُ لَكَ قَالَ إِنِّي أَعْلَمُ مَا لَا تَعْلَمُونَ',
                'text_en' => 'And [mention, O Muhammad], when your Lord said to the angels, "Indeed, I will make upon the earth a successive authority." They said, "Will You place upon it one who causes corruption therein and sheds blood, while we declare Your praise and sanctify You?" Allah said, "Indeed, I know that which you do not know."',
                'text_es' => 'Y cuando tu Señor dijo a los ángeles: "Voy a poner un sucesor en la tierra", dijeron: "¿Vas a poner en ella a quien haga corrupción en ella y derrame sangre, mientras nosotros proclamamos Tu gloria y Te santificamos?" Dijo: "Ciertamente, Yo sé lo que vosotros no sabéis"',
                'surah_name' => 'البقرة', 'surah_name_en' => 'Al-Baqarah', 'surah_type' => 'مدنية'
            ],
            [
                'surah_number' => 15, 'ayah_number' => 26,
                'text_ar' => 'وَلَقَدْ خَلَقْنَا الْإِنسَانَ مِن صَلْصَالٍ مِّنْ حَمَإٍ مَّسْنُونٍ',
                'text_en' => 'And We created man from clay of black mud altered',
                'text_es' => 'Hemos creado al hombre de arcilla, de barro maleable',
                'surah_name' => 'الحجر', 'surah_name_en' => 'Al-Hijr', 'surah_type' => 'مكية'
            ],
            [
                'surah_number' => 21, 'ayah_number' => 30,
                'text_ar' => 'أَوَلَمْ يَرَ الَّذِينَ كَفَرُوا أَنَّ السَّمَاوَاتِ وَالْأَرْضَ كَانَتَا رَتْقًا فَفَتَقْنَاهُمَا وَجَعَلْنَا مِنَ الْمَاءِ كُلَّ شَيْءٍ حَيٍّ أَفَلَا يُؤْمِنُونَ',
                'text_en' => 'Have those who disbelieved not considered that the heavens and the earth were a joined entity, and We separated them and made from water every living thing? Then will they not believe?',
                'text_es' => '¿No han visto los incrédulos que los cielos y la tierra estaban unidos y los separamos, e hicimos del agua toda cosa viviente? ¿No van a creer?',
                'surah_name' => 'الأنبياء', 'surah_name_en' => 'Al-Anbiya', 'surah_type' => 'مكية'
            ],
            [
                'surah_number' => 25, 'ayah_number' => 54,
                'text_ar' => 'وَهُوَ الَّذِي خَلَقَ مِنَ الْمَاءِ بَشَرًا فَجَعَلَهُ نَسَبًا وَصِهْرًا وَكَانَ رَبُّكَ قَدِيرًا',
                'text_en' => 'And it is He who has created from water a human being and made him [a relative by] lineage and marriage. And ever is your Lord competent.',
                'text_es' => 'Él es Quien ha creado de agua un ser humano y ha hecho de él parientes consanguíneos y políticos. Tu Señor es Omnipotente.',
                'surah_name' => 'الفرقان', 'surah_name_en' => 'Al-Furqan', 'surah_type' => 'مكية'
            ],
            // Additional ayahs with وخلق for testing
            [
                'surah_number' => 96, 'ayah_number' => 2,
                'text_ar' => 'خَلَقَ الْإِنسَانَ مِنْ عَلَقٍ',
                'text_en' => 'Created man from a clinging substance.',
                'text_es' => 'Ha creado al hombre de un coágulo.',
                'surah_name' => 'العلق', 'surah_name_en' => 'Al-Alaq', 'surah_type' => 'مكية'
            ],
            [
                'surah_number' => 76, 'ayah_number' => 2,
                'text_ar' => 'إِنَّا خَلَقْنَا الْإِنسَانَ مِن نُّطْفَةٍ أَمْشَاجٍ نَّبْتَلِيهِ فَجَعَلْنَاهُ سَمِيعًا بَصِيرًا',
                'text_en' => 'Indeed, We created man from a sperm-drop mixture that We may try him; and We made him hearing and seeing.',
                'text_es' => 'Ciertamente hemos creado al hombre de una gota de esperma mezclada para ponerlo a prueba, y le hemos dado oído y vista.',
                'surah_name' => 'الإنسان', 'surah_name_en' => 'Al-Insan', 'surah_type' => 'مدنية'
            ],
            [
                'surah_number' => 36, 'ayah_number' => 36,
                'text_ar' => 'سُبْحَانَ الَّذِي خَلَقَ الْأَزْوَاجَ كُلَّهَا مِمَّا تُنبِتُ الْأَرْضُ وَمِنْ أَنفُسِهِمْ وَمِمَّا لَا يَعْلَمُونَ',
                'text_en' => 'Exalted is He who created all pairs - from what the earth grows and from themselves and from that which they do not know.',
                'text_es' => 'Glorificado sea Quien ha creado todas las parejas de lo que produce la tierra, de ellos mismos y de lo que no conocen.',
                'surah_name' => 'يس', 'surah_name_en' => 'Ya-Sin', 'surah_type' => 'مكية'
            ],
            [
                'surah_number' => 3, 'ayah_number' => 59,
                'text_ar' => 'إِنَّ مَثَلَ عِيسَىٰ عِندَ اللَّهِ كَمَثَلِ آدَمَ خَلَقَهُ مِن تُرَابٍ ثُمَّ قَالَ لَهُ كُن فَيَكُونُ',
                'text_en' => 'Indeed, the example of Jesus to Allah is like that of Adam. He created him from dust; then He said to him, "Be," and he was.',
                'text_es' => 'Para Alá, Jesús es semejante a Adán, a quien creó de tierra y a quien dijo: "¡Sé!", y fue.',
                'surah_name' => 'آل عمران', 'surah_name_en' => 'Ali Imran', 'surah_type' => 'مدنية'
            ],
            [
                'surah_number' => 6, 'ayah_number' => 2,
                'text_ar' => 'هُوَ الَّذِي خَلَقَكُم مِّن طِينٍ ثُمَّ قَضَىٰ أَجَلًا وَأَجَلٌ مُّسَمًّى عِندَهُ ثُمَّ أَنتُمْ تَمْتَرُونَ',
                'text_en' => 'It is He who created you from clay and then decreed a term and a specified time [known] to Him; then [still] you are in dispute.',
                'text_es' => 'Él es Quien os ha creado de arcilla y luego ha decretado un plazo -un plazo fijo, que sólo Él conoce-, y, a pesar de ello, dudáis.',
                'surah_name' => 'الأنعام', 'surah_name_en' => 'Al-Anam', 'surah_type' => 'مكية'
            ],
            [
                'surah_number' => 7, 'ayah_number' => 12,
                'text_ar' => 'قَالَ مَا مَنَعَكَ أَلَّا تَسْجُدَ إِذْ أَمَرْتُكَ قَالَ أَنَا خَيْرٌ مِّنْهُ خَلَقْتَنِي مِن نَّارٍ وَخَلَقْتَهُ مِن طِينٍ',
                'text_en' => '[Allah] said, "What prevented you from prostrating when I commanded you?" [Satan] said, "I am better than him. You created me from fire and created him from clay."',
                'text_es' => 'Dijo: "¿Qué te ha impedido prosternarte cuando te lo he ordenado?" Dijo: "Yo soy mejor que él. A mí me has creado de fuego, mientras que a él le has creado de arcilla".',
                'surah_name' => 'الأعراف', 'surah_name_en' => 'Al-Araf', 'surah_type' => 'مكية'
            ],
            // Test ayah specifically with وَخَلَقَ for harakat testing
            [
                'surah_number' => 51, 'ayah_number' => 56,
                'text_ar' => 'وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ',
                'text_en' => 'And I did not create the jinn and mankind except to worship Me.',
                'text_es' => 'No he creado a los genios y a los hombres sino para que Me adoren.',
                'surah_name' => 'الذاريات', 'surah_name_en' => 'Adh-Dhariyat', 'surah_type' => 'مكية'
            ],
            // Ayah with وَخَلَقَ as separate word for exact testing
            [
                'surah_number' => 999, 'ayah_number' => 1,
                'text_ar' => 'وَخَلَقَ اللَّهُ كُلَّ شَيْءٍ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ وَكِيلٌ',
                'text_en' => 'And Allah created everything, and He is, over all things, a Guardian.',
                'text_es' => 'Y Alá creó todas las cosas, y Él es, sobre todas las cosas, un Guardián.',
                'surah_name' => 'اختبار', 'surah_name_en' => 'Test', 'surah_type' => 'test'
            ],
            [
                'surah_number' => 30, 'ayah_number' => 8,
                'text_ar' => 'أَوَلَمْ يَتَفَكَّرُوا فِي أَنفُسِهِم مَّا خَلَقَ اللَّهُ السَّمَاوَاتِ وَالْأَرْضَ وَمَا بَيْنَهُمَا إِلَّا بِالْحَقِّ وَأَجَلٍ مُّسَمًّى وَإِنَّ كَثِيرًا مِّنَ النَّاسِ بِلِقَاءِ رَبِّهِمْ لَكَافِرُونَ',
                'text_en' => 'Do they not contemplate within themselves? Allah has not created the heavens and the earth and what is between them except in truth and for a specified term.',
                'text_es' => '¿Es que no reflexionan en sí mismos? Alá no ha creado los cielos, la tierra y lo que entre ellos está sino con un fin verdadero y por un plazo determinado.',
                'surah_name' => 'الروم', 'surah_name_en' => 'Ar-Rum', 'surah_type' => 'مكية'
            ],
            [
                'surah_number' => 16, 'ayah_number' => 78,
                'text_ar' => 'وَاللَّهُ أَخْرَجَكُم مِّن بُطُونِ أُمَّهَاتِكُمْ لَا تَعْلَمُونَ شَيْئًا وَجَعَلَ لَكُمُ السَّمْعَ وَالْأَبْصَارَ وَالْأَفْئِدَةَ لَعَلَّكُمْ تَشْكُرُونَ',
                'text_en' => 'And Allah extracted you from the wombs of your mothers not knowing a thing, and He made for you hearing and vision and intellect that perhaps you would be grateful.',
                'text_es' => 'Alá os ha sacado del seno de vuestras madres sin que supierais nada y os ha dado el oído, la vista y el intelecto. Quizás, así, seáis agradecidos.',
                'surah_name' => 'النحل', 'surah_name_en' => 'An-Nahl', 'surah_type' => 'مكية'
            ],
            [
                'surah_number' => 67, 'ayah_number' => 2,
                'text_ar' => 'الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا وَهُوَ الْعَزِيزُ الْغَفُورُ',
                'text_en' => '[He] who created death and life to test you [as to] which of you is best in deed - and He is the Exalted in Might, the Forgiving -',
                'text_es' => 'Quien ha creado la muerte y la vida para probaros, para ver quién de vosotros es el que mejor obra. Y Él es el Poderoso, el Indulgente.',
                'surah_name' => 'الملك', 'surah_name_en' => 'Al-Mulk', 'surah_type' => 'مكية'
            ],
            [
                'surah_number' => 11, 'ayah_number' => 7,
                'text_ar' => 'وَهُوَ الَّذِي خَلَقَ السَّمَاوَاتِ وَالْأَرْضَ فِي سِتَّةِ أَيَّامٍ وَكَانَ عَرْشُهُ عَلَى الْمَاءِ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا وَلَئِن قُلْتَ إِنَّكُم مَّبْعُوثُونَ مِن بَعْدِ الْمَوْتِ لَيَقُولَنَّ الَّذِينَ كَفَرُوا إِنْ هَٰذَا إِلَّا سِحْرٌ مُّبِينٌ',
                'text_en' => 'And it is He who created the heavens and the earth in six days - and His Throne had been upon water - that He might test you as to which of you is best in deed.',
                'text_es' => 'Él es Quien ha creado los cielos y la tierra en seis días. Su Trono estaba sobre el agua, para probaros, para ver quién de vosotros es el que mejor obra.',
                'surah_name' => 'هود', 'surah_name_en' => 'Hud', 'surah_type' => 'مكية'
            ]
        ];
        
        // Filter ayahs based on search query with exact word matching and Arabic normalization
        $normalizedQuery = normalizeArabicForSearch($query);
        $queryLower = mb_strtolower($query, 'UTF-8');
        
        foreach ($staticAyahs as $ayah) {
            $normalizedTextAr = normalizeArabicForSearch($ayah['text_ar']);
            $textEnLower = mb_strtolower($ayah['text_en'], 'UTF-8');
            $textEsLower = mb_strtolower($ayah['text_es'], 'UTF-8');
            
            // For Arabic: Check exact word match
            $arabicMatch = false;
            if (!empty($normalizedQuery)) {
                $words = preg_split('/\s+/u', $normalizedTextAr);
                foreach ($words as $word) {
                    $cleanWord = preg_replace('/[^\p{Arabic}\p{N}]/u', '', $word);
                    if ($cleanWord === $normalizedQuery) {
                        $arabicMatch = true;
                        break;
                    }
                }
            }
            
            // For English and Spanish: Check exact word match
            $englishMatch = false;
            $spanishMatch = false;
            
            if (!empty($queryLower) && !preg_match('/[\p{Arabic}]/u', $query)) {
                if (preg_match('/\b' . preg_quote($queryLower, '/') . '\b/i', $textEnLower)) {
                    $englishMatch = true;
                }
                if (preg_match('/\b' . preg_quote($queryLower, '/') . '\b/i', $textEsLower)) {
                    $spanishMatch = true;
                }
            }
            
            if ($arabicMatch || $englishMatch || $spanishMatch) {
                $results[] = [
                    'surah_number' => $ayah['surah_number'],
                    'ayah_number' => $ayah['ayah_number'],
                    'text' => $ayah['text_ar'],
                    'text_en' => $ayah['text_en'],
                    'text_es' => $ayah['text_es'],
                    'surah_name' => $ayah['surah_name'],
                    'surah_name_en' => $ayah['surah_name_en'],
                    'surah_type' => $ayah['surah_type']
                ];
            }
        }
    }
    
    // Return results
    echo json_encode([
        'success' => true,
        'query' => $query,
        'normalized_query' => normalizeArabicForSearch($query),
        'total_results' => count($results),
        'results' => $results,
        'source' => $useDatabase ? 'database' : 'static',
        'debug' => [
            'database_available' => $useDatabase,
            'original_query' => $query,
            'normalized_query' => normalizeArabicForSearch($query)
        ]
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'error' => true,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

?>