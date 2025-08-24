document.addEventListener('DOMContentLoaded', function () {
  fetch('assets/php/coran/cardsSurah.php')
    .then((response) => response.json())
    .then((data) => {
      const container = document.getElementById('container');

      const arabicNumbers = {
        0: '٠',
        1: '١',
        2: '٢',
        3: '٣',
        4: '٤',
        5: '٥',
        6: '٦',
        7: '٧',
        8: '٨',
        9: '٩',
      };

      const convertToArabic = (num) => {
        return num
          .toString()
          .split('')
          .map((digit) => arabicNumbers[digit])
          .join('');
      };

      data.forEach((item) => {
        const formattedNumber = String(item.number).padStart(3, '0');
        const arabicNumber = convertToArabic(item.number);
        const surahLink = `lectura.html?surah=${item.number}`;

        const card = document.createElement('a');
        card.href = surahLink;
        card.classList.add('card');
        card.dataset.surah = formattedNumber;

        card.innerHTML = `
                    <div class="number"><span>${arabicNumber}</span></div>
                    <div class="info">
                        <div class="name_ar">${formattedNumber}</div>
                        <div class="details"><span class="type">${item.type}</span> • <span class="ayahs_totales">${item.ayahs_totales}</span></div>
                    </div>
                `;

        container.appendChild(card);
      });
    })
    .catch((error) => console.error('Error al obtener los datos:', error));
});