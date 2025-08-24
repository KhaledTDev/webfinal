<?php
// Incluir configuración de base de datos
require_once '../../../config.php';

// Headers CORS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $db = getDB();
    $action = $_GET['action'] ?? $_POST['action'] ?? '';
    
    switch ($action) {
        case 'get_available_tafsirs':
            // Obtener lista de tafsires disponibles
            $tafsirs = [
                ['id' => 'tafseer_al_baghawi_ar', 'name' => 'تفسير البغوي', 'lang' => 'ar'],
                ['id' => 'tafseer_al_qurtubi_ar', 'name' => 'تفسير القرطبي', 'lang' => 'ar'],
                ['id' => 'tafseer_al_saddi_ar', 'name' => 'تفسير السدي', 'lang' => 'ar'],
                ['id' => 'tafseer_assamese_abridged_explanation_of_the_quran_as', 'name' => 'Assamese Tafsir', 'lang' => 'as'],
                ['id' => 'tafseer_bosnian_abridged_explanation_of_the_quran_bs', 'name' => 'Bosnian Tafsir', 'lang' => 'bs'],
                ['id' => 'tafseer_chinese_abridged_explanation_of_the_quran_zh', 'name' => 'Chinese Tafsir', 'lang' => 'zh'],
                ['id' => 'tafseer_english_al_mukhtasar_en', 'name' => 'English Al-Mukhtasar', 'lang' => 'en'],
                ['id' => 'tafseer_french_abridged_explanation_of_the_quran_fr', 'name' => 'French Tafsir', 'lang' => 'fr'],
                ['id' => 'tafseer_italian_al_mukhtasar_in_interpreting_the_noble_quran_it', 'name' => 'Italian Al-Mukhtasar', 'lang' => 'it'],
                ['id' => 'tafseer_japanese_abridged_explanation_of_the_quran_ja', 'name' => 'Japanese Tafsir', 'lang' => 'ja'],
                ['id' => 'tafseer_persian_al_mukhtasar_in_interpreting_the_noble_quran_fa', 'name' => 'Persian Al-Mukhtasar', 'lang' => 'fa'],
                ['id' => 'tafseer_russian_al_mukhtasar_ru', 'name' => 'Russian Al-Mukhtasar', 'lang' => 'ru'],
                ['id' => 'tafseer_spanish_abridged_explanation_of_the_quran_es', 'name' => 'Spanish Tafsir', 'lang' => 'es'],
                ['id' => 'tafseer_tanwir_al_miqbas_ar', 'name' => 'تنوير المقباس', 'lang' => 'ar'],
                ['id' => 'tafsir_al_tabari_ar', 'name' => 'تفسير الطبري', 'lang' => 'ar'],
                ['id' => 'tafsir_al_wasit_ar', 'name' => 'التفسير الوسيط', 'lang' => 'ar'],
                ['id' => 'tafsir_ibn_kathir_ar', 'name' => 'تفسير ابن كثير', 'lang' => 'ar'],
                ['id' => 'tafsir_muyassar_ar', 'name' => 'التفسير الميسر', 'lang' => 'ar']
            ];
            
            echo json_encode([
                'success' => true,
                'tafsirs' => $tafsirs
            ]);
            break;
            
        case 'get_tafsir':
            $table = $_GET['table'] ?? $_POST['tabla'] ?? '';
            $ayah = $_GET['ayah'] ?? $_POST['ayah'] ?? '';
            
            if (empty($table) || empty($ayah)) {
                throw new Exception("Parámetros requeridos: table y ayah");
            }
            
            // Validar nombre de tabla para prevenir SQL injection
            $validTables = [
                'tafseer_al_baghawi_ar', 'tafseer_al_qurtubi_ar', 'tafseer_al_saddi_ar',
                'tafseer_assamese_abridged_explanation_of_the_quran_as',
                'tafseer_bosnian_abridged_explanation_of_the_quran_bs',
                'tafseer_chinese_abridged_explanation_of_the_quran_zh',
                'tafseer_english_al_mukhtasar_en',
                'tafseer_french_abridged_explanation_of_the_quran_fr',
                'tafseer_italian_al_mukhtasar_in_interpreting_the_noble_quran_it',
                'tafseer_japanese_abridged_explanation_of_the_quran_ja',
                'tafseer_persian_al_mukhtasar_in_interpreting_the_noble_quran_fa',
                'tafseer_russian_al_mukhtasar_ru',
                'tafseer_spanish_abridged_explanation_of_the_quran_es',
                'tafseer_tanwir_al_miqbas_ar',
                'tafsir_al_tabari_ar', 'tafsir_al_wasit_ar',
                'tafsir_ibn_kathir_ar', 'tafsir_muyassar_ar'
            ];
            
            if (!in_array($table, $validTables)) {
                throw new Exception("Tabla de tafsir no válida");
            }
            
            // Consulta para obtener el tafsir
            $query = "SELECT text FROM `$table` WHERE ayah = :ayah LIMIT 1";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':ayah', $ayah, PDO::PARAM_STR);
            $stmt->execute();
            
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                echo json_encode([
                    'success' => true,
                    'text' => cleanText($result['text'])
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'No se encontró tafsir para este ayah'
                ]);
            }
            break;
            
        default:
            throw new Exception('Acción no válida');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => true,
        'message' => $e->getMessage()
    ]);
}
?>