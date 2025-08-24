<?php
// Test data for demonstration purposes
// This simulates the database structure that the user has

// Sample surah info data
$surahInfoData = [
    ['number' => 1, 'name_ar' => 'الفاتحة', 'name_en' => 'Al-Fatiha', 'type' => 'مكية', 'ayahs_totales' => 7],
    ['number' => 2, 'name_ar' => 'البقرة', 'name_en' => 'Al-Baqarah', 'type' => 'مدنية', 'ayahs_totales' => 286],
    ['number' => 9, 'name_ar' => 'التوبة', 'name_en' => 'At-Tawbah', 'type' => 'مدنية', 'ayahs_totales' => 129],
];

// Sample ayahs data - Al-Fatiha
$ayahsData = [
    1 => [
        ['ayah_number' => 1, 'text_ar' => 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 'text_en' => 'In the name of Allah, the Entirely Merciful, the Especially Merciful.', 'text_es' => 'En el nombre de Alá, el Compasivo, el Misericordioso.'],
        ['ayah_number' => 2, 'text_ar' => 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', 'text_en' => '[All] praise is [due] to Allah, Lord of the worlds -', 'text_es' => 'Las alabanzas a Alá, Señor del universo.'],
        ['ayah_number' => 3, 'text_ar' => 'الرَّحْمَٰنِ الرَّحِيمِ', 'text_en' => 'The Entirely Merciful, the Especially Merciful,', 'text_es' => 'El Compasivo, el Misericordioso.'],
        ['ayah_number' => 4, 'text_ar' => 'مَالِكِ يَوْمِ الدِّينِ', 'text_en' => 'Sovereign of the Day of Recompense.', 'text_es' => 'Soberano del Día del Juicio.'],
        ['ayah_number' => 5, 'text_ar' => 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', 'text_en' => 'It is You we worship and You we ask for help.', 'text_es' => 'Solo a Ti adoramos y solo de Ti imploramos ayuda.'],
        ['ayah_number' => 6, 'text_ar' => 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', 'text_en' => 'Guide us to the straight path -', 'text_es' => 'Guíanos por el sendero recto.'],
        ['ayah_number' => 7, 'text_ar' => 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', 'text_en' => 'The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.', 'text_es' => 'el sendero de quienes has colmado de gracias, no el de los que son motivo de ira, ni el de los extraviados.'],
    ],
    9 => [
        ['ayah_number' => 1, 'text_ar' => 'بَرَاءَةٌ مِّنَ اللَّهِ وَرَسُولِهِ إِلَى الَّذِينَ عَاهَدتُّم مِّنَ الْمُشْرِكِينَ', 'text_en' => '[This is a declaration of] disassociation, from Allah and His Messenger, to those with whom you had made a treaty among the polytheists.', 'text_es' => '[Esta es una declaración de] desasociación, de Allah y Su Mensajero, hacia aquellos con quienes habían hecho un tratado entre los politeístas.'],
        ['ayah_number' => 2, 'text_ar' => 'فَسِيحُوا فِي الْأَرْضِ أَرْبَعَةَ أَشْهُرٍ وَاعْلَمُوا أَنَّكُمْ غَيْرُ مُعْجِزِي اللَّهِ', 'text_en' => 'So as long as they are upright toward you, be upright toward them.', 'text_es' => 'Mientras sean rectos contigo, sé recto con ellos.'],
    ]
];

// Sample tafsir data
$tafsirData = [
    'tafsir_muyassar_ar' => [
        '1:1' => 'أبتدئ قراءتي باسم الله مستعينا به، (الله) علم على الرب -تبارك وتعالى- المعبود بحق دون سواه، وهو أخص أسماء الله تعالى، ولا يطلق على غيره سبحانه وتعالى. (الرحمن) ذو الرحمة العامة الذي وسعت رحمته جميع الخلق، (الرحيم) بالمؤمنين، وهما اسمان من أسماء الله تعالى.',
        '1:2' => 'الحمد لله حمدًا كثيرًا طيبًا مباركًا فيه، والشكر له سبحانه؛ فهو المستحق للحمد والثناء؛ لما له من صفات الجلال والجمال والكمال، وله سبحانه نِعَمٌ لا تُعَدُّ ولا تُحصى، وهو المالك لجميع المخلوقات، والمتصرف فيها بلا منازع، فهو ربها وخالقها ورازقها ومدبر أمورها.',
        '1:3' => 'الرحمن: بجميع خلقه، الرحيم: بالمؤمنين خاصة، وهما صفتان مشتقتان من الرحمة.',
        '1:4' => 'وهو وحده مالك يوم القيامة، وهو يوم الجزاء الذي يجازي الله فيه الخلائق بأعمالهم، فيثيب المحسنين، ويعاقب المسيئين.',
        '1:5' => 'إياك -يا ربنا- نعبد وحدك لا شريك لك، وإياك وحدك نستعين على عبادتك وعلى أمور ديننا ودنيانا، ولا نعبد سواك، ولا نتوكل إلا عليك، فأنت وحدك المستحق للعبادة والاستعانة.',
        '1:6' => 'دُلَّنا، وأرشدنا، ووفقنا إلى الطريق المستقيم، وثبتنا عليه حتى نلقاك، وهو الإسلام، أو القرآن الذي لا عوج فيه.',
        '1:7' => 'طريق الذين أنعمت عليهم من النبيين والصديقين والشهداء والصالحين، فهؤلاء أهل الهداية والاستقامة، ولا تجعلنا ممن سلك طريق المغضوب عليهم، الذين عرفوا الحق ولم يعملوا به، وهم اليهود ومن كان على شاكلتهم، والضالين، وهم الذين لم يهتدوا، فضلوا الطريق، وهم النصارى ومن اتبع سنتهم. وفي هذا الدعاء شفاء لقلوب المؤمنين، وهدى ورحمة.',
        '9:1' => 'هذه براءة من الله ورسوله، أي: إعلان عام بانتهاء جميع العهود بين المسلمين والمشركين الذين نقضوا عهودهم.',
        '9:2' => 'فسيحوا في الأرض مدة أربعة أشهر آمنين، ثم احذروا نقمة الله، واعلموا أنكم لا تعجزون الله هربًا منه، ولا تفوتونه.',
    ],
    'tafsir_ibn_kathir_ar' => [
        '1:1' => 'يُستحب لمن أراد أن يقرأ القرآن أن يستعيذ أولا، ثم يقول: بسم الله الرحمن الرحيم. وقد روي عن جماعة من السلف أنهم قالوا: كل أمر ذي بال لا يبدأ فيه ببسم الله الرحمن الرحيم فهو أقطع.',
        '1:2' => 'الحمد لله: أي الثناء على الله بصفاته التي كلها أوصاف كمال، وبنعمه الظاهرة والباطنة، الدينية والدنيوية، وفي ضمنه الحمد لله رب العالمين.',
        '1:3' => 'وهما اسمان مشتقان من الرحمة على وجه المبالغة، ورحمن أشد مبالغة من رحيم، والرحمن اسم مختص بالله تعالى، أما رحيم فيطلق على غيره.',
        '1:4' => 'أي المالك المتصرف في يوم الدين، وهو يوم الجزاء والحساب، وإنما أضيف الملك إلى ذلك اليوم؛ لأنه لا يدعي أحد هنالك شيئا، ولا يتكلم أحد إلا بإذنه.',
        '1:5' => 'أي إياك نعبد وحدك لا شريك لك، وإياك نستعين على العبادة وغيرها من أمورنا، وقدم العبادة على الاستعانة من باب تقديم العام على الخاص.',
        '1:6' => 'أي أرشدنا إلى الصراط المستقيم، وهو الدين الحق، وثبتنا عليه حتى نلقاك.',
        '1:7' => 'وهو صراط الذين أنعم الله عليهم من النبيين والصديقين والشهداء والصالحين، وليس صراط المغضوب عليهم وهم من عرف الحق فلم يتبعه كاليهود، ولا الضالين وهم من فقدوا العلم فضلوا كالنصارى.',
    ]
];

// Function to get surah info by number
function getSurahInfo($number) {
    global $surahInfoData;
    foreach ($surahInfoData as $surah) {
        if ($surah['number'] == $number) {
            return $surah;
        }
    }
    return null;
}

// Function to get ayahs by surah number
function getAyahs($surahNumber) {
    global $ayahsData;
    return $ayahsData[$surahNumber] ?? [];
}

// Function to get tafsir
function getTafsir($table, $ayah) {
    global $tafsirData;
    return $tafsirData[$table][$ayah] ?? null;
}
?>