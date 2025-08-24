document.addEventListener('DOMContentLoaded', function () {
    const tafsirContainer = document.querySelector('.tafsir-container');
    const tafsirCloseBtn = document.querySelector('.tafsir-close-btn');
    const tafsirAyah = document.querySelector('.tafsir-ayah');
    const prevButton = document.querySelector('.prev-ayah');
    const nextButton = document.querySelector('.next-ayah');
    const tafsirContent = tafsirContainer.querySelector('.tafsir-content p');

    let currentItem = null;

    // Función para abrir el modal
    function openModal() {
        tafsirContainer.style.display = 'block';

        // Obtener la posición actual del usuario en la página
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const modalHeight = tafsirContainer.offsetHeight;

        // Calcular la posición vertical del modal
        const topPosition = scrollTop + (windowHeight / 2) - (modalHeight / 2);

        // Posicionar el modal en el centro vertical y horizontalmente
        tafsirContainer.style.top = `100px`;
        tafsirContainer.style.left = '50%';
        tafsirContainer.style.transform = 'translateX(-50%)';

        // Deshabilitar el scroll de la página principal
        document.body.style.overflow = 'hidden';

        updateButtons();
        loadTafsir();
    }

    // Función para cerrar el modal
    function closeModal() {
        tafsirContainer.style.display = 'none';
        // Restaurar el scroll de la página principal
        document.body.style.overflow = 'auto';
    }

    // Abrir el modal al hacer clic en el ícono de libro
    document.body.addEventListener('click', function (event) {
        if (event.target.classList.contains('fa-book-open')) {
            currentItem = event.target.closest('.item');
            if (!currentItem) return;

            const arabicTextElement = currentItem.querySelector('.arabic-text');
            if (!arabicTextElement) return;

            tafsirAyah.innerHTML = arabicTextElement.innerHTML;
            currentItem.appendChild(tafsirContainer);
            openModal();
        }
    });

    // Cerrar el modal al hacer clic en la "X"
    tafsirCloseBtn.addEventListener('click', closeModal);

    // Cerrar el modal al hacer clic fuera de él
    document.addEventListener('click', function (event) {
        if (tafsirContainer.style.display === 'block' && !tafsirContainer.contains(event.target) && !event.target.classList.contains('fa-book-open')) {
            closeModal();
        }
    });

    // Navegación entre ítems
    prevButton.addEventListener('click', function () {
        if (currentItem) {
            let prevItem = currentItem.previousElementSibling;
            if (prevItem && prevItem.classList.contains('item')) {
                currentItem = prevItem;
                tafsirAyah.innerHTML = currentItem.querySelector('.arabic-text').innerHTML;
                currentItem.appendChild(tafsirContainer);
                updateButtons();
                loadTafsir();
            }
        }
    });

    nextButton.addEventListener('click', function () {
        if (currentItem) {
            let nextItem = currentItem.nextElementSibling;
            if (nextItem && nextItem.classList.contains('item')) {
                currentItem = nextItem;
                tafsirAyah.innerHTML = currentItem.querySelector('.arabic-text').innerHTML;
                currentItem.appendChild(tafsirContainer);
                updateButtons();
                loadTafsir();
            }
        }
    });

    function updateButtons() {
        prevButton.style.visibility = currentItem.previousElementSibling && currentItem.previousElementSibling.classList.contains('item') ? 'visible' : 'hidden';
        nextButton.style.visibility = currentItem.nextElementSibling && currentItem.nextElementSibling.classList.contains('item') ? 'visible' : 'hidden';
    }

    function loadTafsir() {
        if (!currentItem) return;

        const ayahSpan = currentItem.querySelector('.icons span');
        if (!ayahSpan) return;

        let ayah = ayahSpan.textContent.trim();
        const activeTab = document.querySelector('.tafsir-tab.active');
        if (!activeTab) return;

        const tabla = activeTab.dataset.tabla;

        $.ajax({
            type: 'POST',
            url: '/assets/php/coran/tafsir.php',
            data: { tabla: tabla, ayah: ayah },
            dataType: 'json',
            success: function (data) {
                if (data && data.text) {
                    tafsirContent.textContent = data.text;
                } else {
                    tafsirContent.textContent = "No se encontró tafsir para este ayah.";
                }
            },
            error: function () {
                tafsirContent.textContent = "Error al obtener los datos.";
            },
        });
    }

    $('.tafsir-tab').click(function () {
        $('.tafsir-tab').removeClass('active');
        $(this).addClass('active');
        if (currentItem) {
            loadTafsir();
        }
    });
});