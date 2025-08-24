<?php
// sabio_loader.php - Script para cargar contenido dinámico de sabios
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar solicitudes OPTIONS para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $action = $_GET['action'] ?? '';
    $sabio = $_GET['sabio'] ?? '';
    $category = $_GET['category'] ?? '';

    error_log("Sabio Loader: action=$action, sabio=$sabio, category=$category");

    switch ($action) {
        case 'get_sabios':
            echo json_encode(getSabiosList());
            break;
            
        case 'get_sabio_info':
            if (empty($sabio)) {
                throw new Exception('Nombre del sabio requerido');
            }
            echo json_encode(getSabioInfo($sabio));
            break;
            
        case 'get_sabio_content':
            if (empty($sabio) || empty($category)) {
                throw new Exception('Sabio y categoría requeridos');
            }
            echo json_encode(getSabioContent($sabio, $category));
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

/**
 * Obtener lista de todos los sabios disponibles
 */
function getSabiosList() {
    $sabiosDir = __DIR__ . '/../sabios/';
    
    if (!is_dir($sabiosDir)) {
        throw new Exception('Directorio de sabios no encontrado');
    }
    
    $sabios = [];
    $directories = scandir($sabiosDir);
    
    foreach ($directories as $dir) {
        if ($dir === '.' || $dir === '..') {
            continue;
        }
        
        $fullPath = $sabiosDir . $dir;
        if (is_dir($fullPath)) {
            $sabios[] = [
                'name' => $dir,
                'display_name' => $dir,
                'path' => $fullPath
            ];
        }
    }
    
    return [
        'success' => true,
        'data' => $sabios
    ];
}

/**
 * Obtener información completa de un sabio específico
 */
function getSabioInfo($sabioName) {
    $sabioDir = __DIR__ . '/../sabios/' . $sabioName . '/';
    
    if (!is_dir($sabioDir)) {
        throw new Exception('Sabio no encontrado: ' . $sabioName);
    }
    
    // Buscar imagen del sabio
    $imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    $sabioImage = null;
    
    foreach ($imageExtensions as $ext) {
        $imagePath = $sabioDir . strtolower(str_replace(' ', '', $sabioName)) . '.' . $ext;
        if (file_exists($imagePath)) {
            $sabioImage = 'assets/sabios/' . $sabioName . '/' . basename($imagePath);
            break;
        }
        
        // Buscar cualquier imagen en el directorio
        $files = glob($sabioDir . '*.' . $ext);
        if (!empty($files)) {
            $sabioImage = 'assets/sabios/' . $sabioName . '/' . basename($files[0]);
            break;
        }
    }
    
    // Contar archivos en cada subdirectorio
    $categories = ['duruz', 'firak', 'pdf'];
    $stats = [
        'total_audio' => 0,
        'total_pdf' => 0,
        'categories' => []
    ];
    
    foreach ($categories as $category) {
        $categoryDir = $sabioDir . $category . '/';
        $count = 0;
        
        if (is_dir($categoryDir)) {
            $files = scandir($categoryDir);
            foreach ($files as $file) {
                if ($file === '.' || $file === '..') {
                    continue;
                }
                
                $filePath = $categoryDir . $file;
                if (is_file($filePath)) {
                    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
                    
                    if ($category === 'pdf' && $ext === 'pdf') {
                        $count++;
                        $stats['total_pdf']++;
                    } elseif (($category === 'duruz' || $category === 'firak') && 
                             in_array($ext, ['mp3', 'wav', 'ogg', 'mp4', 'mpeg'])) {
                        $count++;
                        $stats['total_audio']++;
                    }
                }
            }
        }
        
        $stats['categories'][$category] = $count;
    }
    
    return [
        'success' => true,
        'data' => [
            'name' => $sabioName,
            'image' => $sabioImage,
            'stats' => $stats
        ]
    ];
}

/**
 * Obtener contenido específico de una categoría del sabio
 */
function getSabioContent($sabioName, $category) {
    $categoryDir = __DIR__ . '/../sabios/' . $sabioName . '/' . $category . '/';
    
    if (!is_dir($categoryDir)) {
        throw new Exception("Categoría '$category' no encontrada para el sabio '$sabioName'");
    }
    
    $files = [];
    $allowedExtensions = [];
    
    // Definir extensiones permitidas según la categoría
    if ($category === 'pdf') {
        $allowedExtensions = ['pdf'];
    } else {
        $allowedExtensions = ['mp3', 'wav', 'ogg', 'mp4', 'mpeg'];
    }
    
    $scanFiles = scandir($categoryDir);
    
    foreach ($scanFiles as $file) {
        if ($file === '.' || $file === '..') {
            continue;
        }
        
        $filePath = $categoryDir . $file;
        if (is_file($filePath)) {
            $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
            
            if (in_array($ext, $allowedExtensions)) {
                $fileSize = filesize($filePath);
                $fileName = pathinfo($file, PATHINFO_FILENAME);
                
                $files[] = [
                    'name' => $fileName,
                    'filename' => $file,
                    'path' => 'assets/sabios/' . $sabioName . '/' . $category . '/' . $file,
                    'size' => $fileSize,
                    'extension' => $ext,
                    'type' => $category === 'pdf' ? 'document' : 'audio',
                    'source' => 'folder'
                ];
            }
        }
    }
    
    // HÍBRIDO: Para الشيخ ابن باز en categoría PDF, agregar libros de la base de datos
    if ($sabioName === 'الشيخ ابن باز' && $category === 'pdf') {
        try {
            $databaseBooks = getIbnBazBooksFromDatabase();
            $files = array_merge($files, $databaseBooks);
        } catch (Exception $e) {
            error_log("Error loading Ibn Baz books from database: " . $e->getMessage());
            // Continuar con solo los archivos de carpeta si hay error en BD
        }
    }
    
    // Ordenar archivos por nombre
    usort($files, function($a, $b) {
        return strcmp($a['name'], $b['name']);
    });
    
    return [
        'success' => true,
        'data' => [
            'sabio' => $sabioName,
            'category' => $category,
            'files' => $files,
            'total' => count($files)
        ]
    ];
}

/**
 * Obtener libros de Ibn Baz desde la base de datos
 */
function getIbnBazBooksFromDatabase() {
    require_once __DIR__ . '/../../config.php';
    
    try {
        $db = getDB();
        
        // Verificar si la tabla existe
        $checkTable = $db->query("SHOW TABLES LIKE 'books_ibn_baz'");
        if ($checkTable->rowCount() == 0) {
            // Crear la tabla si no existe
            createIbnBazTable($db);
        }
        
        $stmt = $db->prepare("SELECT id, title, pdf_name, pdf_link FROM books_ibn_baz ORDER BY title ASC");
        $stmt->execute();
        $books = $stmt->fetchAll();
        
        // Transformar los datos al formato esperado
        $formattedBooks = [];
        foreach ($books as $book) {
            $formattedBooks[] = [
                'name' => cleanText($book['title']),
                'filename' => $book['pdf_name'],
                'path' => $book['pdf_link'],
                'size' => 0, // Tamaño no disponible para libros de BD
                'extension' => 'pdf',
                'type' => 'document',
                'source' => 'database' // Identificar que viene de la BD
            ];
        }
        
        return $formattedBooks;
        
    } catch (Exception $e) {
        error_log("Error getting Ibn Baz books from database: " . $e->getMessage());
        return []; // Retornar array vacío en caso de error
    }
}

/**
 * Crear la tabla books_ibn_baz si no existe
 */
function createIbnBazTable($db) {
    $sql = "CREATE TABLE IF NOT EXISTS books_ibn_baz (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(500) NOT NULL,
        pdf_name VARCHAR(255) NOT NULL,
        pdf_link TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $db->exec($sql);
    
    // Insertar algunos datos de ejemplo si la tabla está vacía
    $checkData = $db->query("SELECT COUNT(*) as count FROM books_ibn_baz");
    $count = $checkData->fetch()['count'];
    
    if ($count == 0) {
        insertSampleIbnBazBooks($db);
    }
}

/**
 * Insertar datos de ejemplo para Ibn Baz
 */
function insertSampleIbnBazBooks($db) {
    $sampleBooks = [
        [
            'title' => 'فتاوى نور على الدرب - المجلد الأول',
            'pdf_name' => 'fatawa_noor_vol1.pdf',
            'pdf_link' => 'https://example.com/books/fatawa_noor_vol1.pdf'
        ],
        [
            'title' => 'فتاوى نور على الدرب - المجلد الثاني',
            'pdf_name' => 'fatawa_noor_vol2.pdf',
            'pdf_link' => 'https://example.com/books/fatawa_noor_vol2.pdf'
        ],
        [
            'title' => 'العقيدة الصحيحة وما يضادها',
            'pdf_name' => 'aqeeda_saheeha.pdf',
            'pdf_link' => 'https://example.com/books/aqeeda_saheeha.pdf'
        ],
        [
            'title' => 'الدروس المهمة لعامة الأمة',
            'pdf_name' => 'duroos_muhimma.pdf',
            'pdf_link' => 'https://example.com/books/duroos_muhimma.pdf'
        ],
        [
            'title' => 'التحذير من البدع',
            'pdf_name' => 'tahtheer_bida.pdf',
            'pdf_link' => 'https://example.com/books/tahtheer_bida.pdf'
        ]
    ];
    
    $stmt = $db->prepare("INSERT INTO books_ibn_baz (title, pdf_name, pdf_link) VALUES (?, ?, ?)");
    
    foreach ($sampleBooks as $book) {
        $stmt->execute([$book['title'], $book['pdf_name'], $book['pdf_link']]);
    }
}
?>