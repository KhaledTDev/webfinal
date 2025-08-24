<?php
// Incluir configuración de base de datos
require_once '../../../config.php';

$surahNumber = isset($_GET['surah']) ? intval($_GET['surah']) : 1;

try {
    // Obtener conexión a la base de datos
    $db = getDB();
    
    // Consulta para obtener información de la surah desde surah_info
    $surahQuery = "SELECT number, name_ar, name_en, type, ayahs_totales 
                   FROM surah_info 
                   WHERE number = :surah_number";
    
    $surahStmt = $db->prepare($surahQuery);
    $surahStmt->bindParam(':surah_number', $surahNumber, PDO::PARAM_INT);
    $surahStmt->execute();
    
    $surahData = $surahStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$surahData) {
        throw new Exception("Surah $surahNumber no encontrada en la base de datos");
    }
    
    // Consulta para obtener todas las ayahs de la surah desde la tabla ayahs
    $ayahsQuery = "SELECT ayah_number, text_ar, text_en, text_es 
                   FROM ayahs 
                   WHERE surah_number = :surah_number 
                   ORDER BY ayah_number ASC";
    
    $ayahsStmt = $db->prepare($ayahsQuery);
    $ayahsStmt->bindParam(':surah_number', $surahNumber, PDO::PARAM_INT);
    $ayahsStmt->execute();
    
    $ayahsData = $ayahsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convertir tipos de datos y limpiar texto
    foreach ($ayahsData as &$ayah) {
        $ayah['ayah_number'] = (int)$ayah['ayah_number'];
        $ayah['text_ar'] = cleanText($ayah['text_ar']);
        $ayah['text_en'] = cleanText($ayah['text_en']);
        $ayah['text_es'] = cleanText($ayah['text_es']);
    }
    
    // Verificar que tenemos ayahs
    if (empty($ayahsData)) {
        throw new Exception("No se encontraron ayahs para la surah $surahNumber");
    }
    
    // Información completa de la surah
    $surahInfo = [
        'surah_number' => (int)$surahData['number'],
        'name_ar' => cleanText($surahData['name_ar']),
        'name_en' => cleanText($surahData['name_en']),
        'type' => cleanText($surahData['type']),
        'total_ayahs' => (int)$surahData['ayahs_totales'],
        'ayahs' => $ayahsData
    ];
    
    echo json_encode($surahInfo, JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    // En caso de error, devolver respuesta de error
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => 'Error al obtener datos de ayahs: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>