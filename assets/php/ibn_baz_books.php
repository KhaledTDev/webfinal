<?php
// ibn_baz_books.php - Endpoint específico para cargar libros de Ibn Baz desde base de datos
require_once '../../config.php';

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
    
    switch ($action) {
        case 'get_ibn_baz_books':
            echo json_encode(getIbnBazBooks());
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
 * Obtener libros de Ibn Baz desde la base de datos
 */
function getIbnBazBooks() {
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
        
        // Transformar los datos al formato esperado por el frontend
        $formattedBooks = [];
        foreach ($books as $book) {
            $formattedBooks[] = [
                'id' => $book['id'],
                'name' => cleanText($book['title']),
                'filename' => $book['pdf_name'],
                'path' => $book['pdf_link'],
                'size' => 0, // Tamaño no disponible para libros de BD
                'extension' => 'pdf',
                'type' => 'document',
                'source' => 'database' // Identificar que viene de la BD
            ];
        }
        
        return [
            'success' => true,
            'data' => [
                'books' => $formattedBooks,
                'total' => count($formattedBooks)
            ]
        ];
        
    } catch (Exception $e) {
        error_log("Error getting Ibn Baz books: " . $e->getMessage());
        throw new Exception('Error al obtener libros de Ibn Baz: ' . $e->getMessage());
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
