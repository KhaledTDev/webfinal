<?php
// Demo Search Ayahs API - Para demostración con datos estáticos
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Get search query
$query = isset($_GET['q']) ? trim($_GET['q']) : '';

try {
    // Validate query
    if (empty($query) || strlen($query) < 2) {
        throw new Exception('Query debe tener al menos 2 caracteres');
    }
    
    // Demo data - some sample ayahs with الله
    $demoAyahs = [
        [
            'surah_number' => 1,
            'ayah_number' => 1,
            'text_ar' => 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
            'text_en' => 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
            'text_es' => 'En el nombre de Alá, el Compasivo, el Misericordioso.',
            'surah_name' => 'الفاتحة',
            'surah_name_en' => 'Al-Fatiha',
            'surah_type' => 'مكية'
        ],
        [
            'surah_number' => 1,
            'ayah_number' => 2,
            'text_ar' => 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
            'text_en' => '[All] praise is [due] to Allah, Lord of the worlds',
            'text_es' => 'Las alabanzas a Alá, Señor del universo.',
            'surah_name' => 'الفاتحة',
            'surah_name_en' => 'Al-Fatiha',
            'surah_type' => 'مكية'
        ],
        [
            'surah_number' => 2,
            'ayah_number' => 1,
            'text_ar' => 'الم ذَٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ هُدًى لِّلْمُتَّقِينَ',
            'text_en' => 'Alif, Lam, Meem. This is the Book about which there is no doubt, a guidance for those conscious of Allah',
            'text_es' => 'Alif, Lam, Mim. Este es el Libro en el que no hay duda, una guía para los temerosos de Alá',
            'surah_name' => 'البقرة',
            'surah_name_en' => 'Al-Baqarah',
            'surah_type' => 'مدنية'
        ],
        [
            'surah_number' => 112,
            'ayah_number' => 1,
            'text_ar' => 'قُلْ هُوَ اللَّهُ أَحَدٌ',
            'text_en' => 'Say, "He is Allah, [who is] One',
            'text_es' => 'Di: "Él es Alá, Uno',
            'surah_name' => 'الإخلاص',
            'surah_name_en' => 'Al-Ikhlas',
            'surah_type' => 'مكية'
        ],
        [
            'surah_number' => 112,
            'ayah_number' => 2,
            'text_ar' => 'اللَّهُ الصَّمَدُ',
            'text_en' => 'Allah, the Eternal Refuge',
            'text_es' => 'Alá, el Eterno',
            'surah_name' => 'الإخلاص',
            'surah_name_en' => 'Al-Ikhlas',
            'surah_type' => 'مكية'
        ]
    ];
    
    // Filter ayahs based on search query
    $matchingAyahs = [];
    $queryLower = mb_strtolower($query);
    
    foreach ($demoAyahs as $ayah) {
        $textArLower = mb_strtolower($ayah['text_ar']);
        $textEnLower = mb_strtolower($ayah['text_en']);
        $textEsLower = mb_strtolower($ayah['text_es']);
        
        if (strpos($textArLower, $queryLower) !== false || 
            strpos($textEnLower, $queryLower) !== false || 
            strpos($textEsLower, $queryLower) !== false) {
            $matchingAyahs[] = [
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
    
    // Return results
    echo json_encode([
        'success' => true,
        'query' => $query,
        'total_results' => count($matchingAyahs),
        'results' => $matchingAyahs
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'error' => true,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>