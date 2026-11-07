/**
 * EcrioX Diwali Wishes Maker - Multilingual & Smart Wishes Database
 * Supports 10 Indian Languages and Smart Wish Generation by Recipient & Tone.
 */

window.DIWALI_DATA = (function () {
  'use strict';

  // 1. Multilingual Greetings Database (10 Languages)
  const LANGUAGES = {
    en: {
      name: 'English',
      native: 'English',
      title: 'Happy Diwali',
      defaultSender: 'With warm wishes,',
      wishes: [
        'May the divine light of Diwali bring peace, prosperity, health and boundless happiness to you and your loved ones.',
        'May this festival of lights illuminate your life with joy, success, and endless new opportunities. Have a blessed and sparkling Diwali!',
        'Wishing you a Diwali that brings good fortune, radiant health, and cherished moments with family and friends.',
        'May every diya that burns tonight whisper sweet messages of peace, prosperity, and love into your home. Happy Diwali!',
        'May the gleaming diyas of Diwali illuminate your path towards progress, prosperity, and limitless joy.'
      ]
    },
    ta: {
      name: 'Tamil',
      native: 'தமிழ்',
      title: 'இனிய தீபாவளி நல்வாழ்த்துகள்',
      defaultSender: 'அன்புடன்,',
      wishes: [
        'உங்கள் வாழ்வில் ஒளியும் மகிழ்ச்சியும் செல்வமும் என்றும் நிறைந்திருக்க இனிய தீபாவளி நல்வாழ்த்துகள்!',
        'இந்த தீபாவளித் திருநாள் உங்கள் குடும்பத்தில் அன்பையும் அமைதியையும் மகிழ்ச்சியையும் கொண்டு வரட்டும்!',
        'தீபங்களின் ஒளி போல உங்கள் வாழ்வு பிரகாசிக்கட்டும்! உங்களுக்கும் உங்கள் குடும்பத்தினருக்கும் இனிய தீபாவளி வாழ்த்துகள்!',
        'இருளை நீக்கி ஒளி தரும் இந்த நன்னாளில், உங்கள் எண்ணங்கள் யாவும் ஈடேறி வாழ்வு சிறக்க வாழ்த்துகிறோம்!',
        'லட்சுமி கடாட்சமும் ஆனந்தமும் உங்கள் இல்லத்தில் பொங்கட்டும். மகிழ்ச்சியான தீபாவளி நல்வாழ்த்துகள்!'
      ]
    },
    hi: {
      name: 'Hindi',
      native: 'हिन्दी',
      title: 'दीपावली की हार्दिक शुभकामनाएं',
      defaultSender: 'सप्रेम,',
      wishes: [
        'दीयों की रोशनी से जगमगाता आपका संसार हो, महालक्ष्मी का सदा आपके घर में वास हो। शुभ दीपावली!',
        'आपको और आपके सपरिवार को पावन पर्व दीपावली की हार्दिक एवं मंगलमय शुभकामनाएं!',
        'सुख, समृद्धि, शांति और उत्तम स्वास्थ्य आपके जीवन में सदा बनी रहे। दीपावली की बहुत-बहुत बधाई!',
        'दीप जलते रहें, मन खिलते रहें, इस पावन अवसर पर सबके गिले-शिकवे मिटते रहें। शुभ दीपावली!',
        'माँ लक्ष्मी की कृपा से आपके घर में रिद्धि-सिद्धि और अपार खुशियों का आगमन हो। मंगलमय दीपोत्सव!'
      ]
    },
    te: {
      name: 'Telugu',
      native: 'తెలుగు',
      title: 'దీపావళి శుభాకాంక్షలు',
      defaultSender: 'ప్రేమతో,',
      wishes: [
        'మీ ఇంట్లో దీపాల కాంతులు, లక్ష్మీదేవి కటాక్షం నిండాలని కోరుకుంటూ దీపావళి శుభాకాంక్షలు!',
        'ఈ దీపావళి మీ జీవితంలో సరికొత్త వెలుగులు నింపి సంతోషాన్ని ఇవ్వాలని మనసారా కోరుకుంటున్నాను.',
        'మీకు మరియు మీ కుటుంబ సభ్యులకు ఆనందకరమైన మరియు ఐశ్వర్యవంతమైన దీపావళి శుభాకాంక్షలు!',
        'చీకట్లను పారద్రోలి వెలుగులు నింపే ఈ దీపాల పండుగ మీ ఇంట శాంతి, సిరులు కురిపించాలి.',
        'దీపాల కాంతి మీ జీవితంలోని ప్రతి అడుగును విజయవంతం చేయాలని కోరుకుంటూ పర్వదిన శుభాకాంక్షలు!'
      ]
    },
    ml: {
      name: 'Malayalam',
      native: 'മലയാളം',
      title: 'ദീപാവലി ആശംസകൾ',
      defaultSender: 'സ്നേഹത്തോടെ,',
      wishes: [
        'നിങ്ങൾക്കും കുടുംബത്തിനും സന്തോഷവും സമൃദ്ധിയും നിറഞ്ഞ ദീപാവലി ആശംസകൾ നേരുന്നു!',
        'ദീപങ്ങളുടെ ഈ പുണ്യദിനത്തിൽ നിങ്ങളുടെ ജീവിതത്തിൽ എപ്പോഴും സന്തോഷവും ശാന്തിയും നിറയട്ടെ.',
        'ഐശ്വര്യത്തിന്റെയും നന്മയുടെയും വെളിച്ചം നിങ്ങളുടെ ഭവനങ്ങളിൽ നിറയട്ടെ. ശുഭ ദീപാവലി!',
        'ഹൃദയം നിറഞ്ഞ സ്നേഹത്തോടെ നിങ്ങൾക്കും പ്രിയപ്പെട്ടവർക്കും സന്തോഷം നിറഞ്ഞ ദീപാവലി ആശംസകൾ!',
        'വിജയത്തിന്റെയും സമൃദ്ധിയുടെയും പുത്തൻ നാളുകൾ സമ്മാനിക്കാൻ ഈ ദീപാവലിക്ക് കഴിയട്ടെ.'
      ]
    },
    kn: {
      name: 'Kannada',
      native: 'ಕನ್ನಡ',
      title: 'ದೀಪಾವಳಿ ಹಬ್ಬದ ಹಾರ್ದಿಕ ಶುಭಾಶಯಗಳು',
      defaultSender: 'ಪ್ರೀತಿಯಿಂದ,',
      wishes: [
        'ದೀಪಗಳ ಹಬ್ಬ ದೀಪಾವಳಿಯು ನಿಮ್ಮ ಬಾಳಿನಲ್ಲಿ ಸಂತೋಷ, ನೆಮ್ಮದಿ ಮತ್ತು ಸಮೃದ್ಧಿ ತರಲಿ ಎಂದು ಹಾರೈಸುತ್ತೇನೆ.',
        'ನಿಮಗೂ ಹಾಗೂ ನಿಮ್ಮ ಕುಟುಂಬದವರಿಗೂ ದೀಪಾವಳಿ ಹಬ್ಬದ ಪ್ರೀತಿಪೂರ್ವಕ ಶುಭಾಶಯಗಳು!',
        'ಲಕ್ಷ್ಮೀ ದೇವಿಯ ಕೃಪೆಯು ಸದಾ ನಿಮ್ಮ ಮೇಲಿರಲಿ, ನಿಮ್ಮ ಮನೆ ಸದಾ ನಗು-ಸಂತೋಷದಿಂದ ತುಂಬಿರಲಿ.',
        'ಬೆಳಕಿನ ಹಬ್ಬವು ನಿಮ್ಮ ಬದುಕಿನ ಕತ್ತಲೆಯನ್ನು ದೂರಮಾಡಿ ಉಜ್ವಲ ಭವಿಷ್ಯವನ್ನು ಕರುಣಿಸಲಿ.',
        'ಆರೋಗ್ಯ, ಐಶ್ವರ್ಯ ಮತ್ತು ಕೀರ್ತಿ ನಿಮ್ಮದಾಗಲಿ ಎಂದು ಹಾರೈಸುತ್ತಾ ಶುಭ ದೀಪಾವಳಿ!'
      ]
    },
    bn: {
      name: 'Bengali',
      native: 'বাংলা',
      title: 'শুভ দীপাবলির আন্তরিক শুভেচ্ছা',
      defaultSender: 'ভালোবাসা সহ,',
      wishes: [
        'দীপাবলির পবিত্র আলো আপনার এবং আপনার পরিবারের জীবন সুখ, শান্তি ও সমৃদ্ধিতে ভরিয়ে তুলুক।',
        'মা লক্ষ্মীর আশীর্বাদে আপনার গৃহে সৌভাগ্য ও আনন্দের বন্যা বয়ে যাক। শুভ দীপাবলি!',
        'এই আলোর উৎসব আপনার জীবনে নতুন আশা, নতুন উদ্যম ও অনন্ত সাফল্য নিয়ে আসুক।',
        'প্রদীপের মধুর আলোয় দূর হোক সব অন্ধকার। আপনি ও আপনার পরিবারকে জানাই আন্তরিক শুভেচ্ছা!',
        'আনন্দময় দীপাবলি ও ধনতেরাসের আন্তরিক প্রীতি ও ভালোবাসা জানাই আপনাকে ও আপনার পরিজনকে।'
      ]
    },
    mr: {
      name: 'Marathi',
      native: 'मराठी',
      title: 'दिवाळीच्या हार्दिक शुभेच्छा',
      defaultSender: 'स्नेहपूर्वक,',
      wishes: [
        'दीपावलीच्या या मंगलमयी पर्वावर आपले जीवन सुख, समृद्धी आणि आनंदाने उजळून निघो!',
        'तुम्हाला व तुमच्या संपूर्ण परिवाराला दीपावलीच्या मनापासून हार्दिक व मंगलमय शुभेच्छा!',
        'रांगोळीचे रंग आणि दिव्यांचा प्रकाश तुमच्या घरात अखंड लक्ष्मी व सुख घेऊन येवो. शुभ दीपावली!',
        'आनंदाची उधळण, मांगल्याची चाहूल घेऊन येणाऱ्या दीपोत्सवाच्या हार्दिक शुभेच्छा!',
        'माता लक्ष्मीची कृपा आपल्यावर सदैव राहो, हीच ईश्वराकडे प्रार्थना. दिवाळीच्या हार्दिक शुभेच्छा!'
      ]
    },
    gu: {
      name: 'Gujarati',
      native: 'ગુજરાતી',
      title: 'દિવાળીની હાર્દિક શુભકામનાઓ',
      defaultSender: 'સ્નેહપૂર્વક,',
      wishes: [
        'દિવાળીના પાવન પર્વે આપના જીવનમાં સુખ, શાંતિ, સમૃદ્ધિ અને ઉત્તમ સ્વાસ્થ્યની પ્રાપ્તિ થાય!',
        'તમને અને તમારા સમગ્ર પરિવારને દીપોત્સવ પર્વની હૃદયપૂર્વકની શુભકામનાઓ!',
        'મા લક્ષ્મીજીની કૃપા આપના પર સદાય વરસતી રહે અને આપનું જીવન દીપકની જેમ ઝળહળતું રહે.',
        'સુખ, સમૃદ્ધિ અને આનંદથી છલકાય આપનો પરિવાર. દિવાળીની ખૂબ ખૂબ શુભેચ્છાઓ!',
        'આ નવા વર્ષે અને દિવાળીએ આપના બધા સપના સાકાર થાય તેવી મંગલ કામનાઓ.'
      ]
    },
    pa: {
      name: 'Punjabi',
      native: 'ਪੰਜਾਬੀ',
      title: 'ਦਿਵਾਲੀ ਦੀਆਂ ਲੱਖ ਲੱਖ ਵਧਾਈਆਂ',
      defaultSender: 'ਪਿਆਰ ਸਹਿਤ,',
      wishes: [
        'ਦੀਵਾਲੀ ਦਾ ਇਹ ਪਵਿੱਤਰ ਤਿਉਹਾਰ ਤੁਹਾਡੇ ਜੀਵਨ ਵਿੱਚ ਸੁੱਖ, ਸ਼ਾਂਤੀ ਅਤੇ ਤਰੱਕੀ ਲੈ ਕੇ ਆਵੇ।',
        'ਤੁਹਾਨੂੰ ਅਤੇ ਤੁਹਾਡੇ ਪਰਿਵਾਰ ਨੂੰ ਦੀਵਾਲੀ ਦੀਆਂ ਬਹੁਤ ਬਹੁਤ ਮੁਬਾਰਕਾਂ ਅਤੇ ਸ਼ੁੱਭਕਾਮਨਾਵਾਂ!',
        'ਰੱਬ ਕਰੇ ਦੀਵਿਆਂ ਦੀ ਰੌਸ਼ਨੀ ਤੁਹਾਡੀ ਜ਼ਿੰਦਗੀ ਦੇ ਹਰ ਹਨੇਰੇ ਨੂੰ ਮਿਟਾ ਦੇਵੇ। ਸ਼ੁੱਭ ਦੀਵਾਲੀ!',
        'ਮਾਤਾ ਲਕਸ਼ਮੀ ਜੀ ਦੀ ਕ੍ਰਿਪਾ ਸਦਕਾ ਤੁਹਾਡੇ ਘਰ ਹਮੇਸ਼ਾ ਬਰਕਤ ਅਤੇ ਖੁਸ਼ੀਆਂ ਬਣੀਆਂ ਰਹਿਣ।',
        'ਪਿਆਰ ਅਤੇ ਖੁਸ਼ੀਆਂ ਨਾਲ ਭਰੀ ਇਹ ਦੀਵਾਲੀ ਤੁਹਾਡੇ ਲਈ ਸਭ ਤੋਂ ਯਾਦਗਾਰ ਸਾਬਤ ਹੋਵੇ।'
      ]
    }
  };

  // 2. Smart Wish Generator Database (By Recipient & Tone)
  const SMART_WISHES = {
    friend: {
      emotional: [
        'No matter how far we are, the warmth of our friendship shines brighter than any Diwali diya. Happy Diwali, my dearest friend!',
        'Thank you for being the brightest light in my life through all the dark days. Wishing you endless happiness this Diwali.',
        'May this Diwali renew our bond and bring moments of laughter that we will cherish for years to come.'
      ],
      heartwarming: [
        'May your home be filled with sweets, your heart with joy, and your life with true friends like us. Happy Diwali!',
        'Sending you the warmest Diwali hugs across the miles. May your festive season be sparkling and sweet!',
        'May the light of a million diyas guide you to success and keep that wonderful smile on your face forever.'
      ],
      funny: [
        'May your Diwali be as bright as your phone screen at 2 AM and your calories as nonexistent as my self-control around Kaju Katli!',
        'Wishing you a Diwali with maximum sweets, zero firecracker burns, and unlimited gifts from relatives who don’t ask about your marriage plans!',
        'Happy Diwali! May your bank balance explode with green like a 1000-wala ladi!'
      ],
      traditional: [
        'May the sacred diyas illuminate your home and Lord Ganesha bless you with wisdom, luck and good health.',
        'Wishing you and your respected family a divine, auspicious, and peaceful Deepavali celebration.',
        'May the divine blessings of Goddess Lakshmi shower upon your family this Diwali and throughout the year.'
      ],
      professional: [
        'Wishing you a very Happy Diwali! May this festival of lights bring prosperity and success in all your endeavors.',
        'May this festive season open new doors of achievements and continued triumphs for you. Happy Diwali, my friend!'
      ],
      short: [
        'Sparkle, shine, and celebrate! Wishing you a dazzling Happy Diwali, friend!',
        'Happy Diwali! May joy, laughter, and sweets surround you all week.',
        'Wishing you light, love, and endless happiness this Diwali!'
      ],
      inspirational: [
        'Just as a single diya pierces through dense darkness, may your inner brilliance conquer all challenges. Happy Diwali!',
        'May this festival of lights spark fresh ambitions and fuel your journey to greatness. Shine on!'
      ]
    },
    parents: {
      emotional: [
        'Mom and Dad, you have been the eternal light guiding my life through every storm. Wishing you long life, health, and a blessed Diwali.',
        'Every happy memory of Diwali begins with your love and sacrifices. Thank you for making our home a sanctuary of light. Happy Diwali!',
        'To the greatest parents in the world: may Goddess Lakshmi shower you with peace, contentment, and vibrant health.'
      ],
      heartwarming: [
        'Wishing the sweetest, most loving parents a Diwali as warm and comforting as your hugs. Happy Diwali Mom & Dad!',
        'May God bless you with sound health, endless peace, and joy that never fades. Happy Diwali to the pillars of our family.'
      ],
      traditional: [
        'सादर चरण स्पर्श। भगवान गणेश और माँ लक्ष्मी आप पर अपनी असीम कृपा सदा बनाए रखें। शुभ दीपावली माता-पिता जी।',
        'Seeking your blessings on this sacred festival of lights. May your lives be filled with divinity and peace.'
      ],
      short: [
        'Happy Diwali to my dearest parents! Wishing you health, peace, and eternal joy.',
        'Dearest Mom & Dad, wishing you a sparkling, peaceful, and blessed Diwali!'
      ],
      inspirational: [
        'Your wisdom and unconditional love shine brighter than any festival of lights. Thank you for inspiring us every day. Happy Diwali!'
      ]
    },
    spouse: {
      emotional: [
        'With you in my life, every day feels like Diwali. You are the eternal flame that brightens my soul. Happy Diwali, my love.',
        'I do not need fireworks when your smile lights up my entire universe. Wishing you a magical and romantic Diwali.'
      ],
      heartwarming: [
        'Happy Diwali to the one who makes my life sweeter than any festive mithai and brighter than a thousand diyas!',
        'May our love continue to glow with the warmth and purity of holy Diwali lights. Happy Diwali, darling.'
      ],
      funny: [
        'Happy Diwali to my favorite sparkler! Thanks for lighting up my world and only occasionally blowing your fuse at me!',
        'May your Diwali be peaceful and may you let me pick the TV remote at least once during this holiday!'
      ],
      short: [
        'Happy Diwali to the light of my life! Love you endlessly.',
        'You make my life sparkle every day. Happy Diwali, my love!'
      ]
    },
    sibling: {
      emotional: [
        'From sharing Diwali sweets as kids to celebrating life together today, you will always be my favorite blessing. Happy Diwali!',
        'Distance cannot dim the spark of our childhood memories. Missing our noisy Diwali celebrations! Happy Diwali, dear brother/sister.'
      ],
      funny: [
        'Happy Diwali! Remember, the biggest box of Soan Papdi is reserved for you because that’s what siblings are for!',
        'Wishing a very Happy Diwali to the sibling who stole my firecrackers and ate all the Besan Laddoos! Have a blast!',
        'May this Diwali give you the wisdom to return the clothes you borrowed from me without asking!'
      ],
      heartwarming: [
        'No Diwali is complete without reminiscing our laughter and mischief. Wishing you a year full of achievements and joy!'
      ],
      short: [
        'Happy Diwali to my partner-in-crime! Stay blessed and sparkle always.',
        'Wishing you a super fun, sweet, and rock-solid Diwali, sibling!'
      ]
    },
    colleague: {
      professional: [
        'Wishing you and your family a joyous Diwali and a prosperous year ahead filled with professional milestones and well-deserved success.',
        'Happy Diwali! Thank you for being a wonderful teammate. May this festive season bring renewed energy and great achievements.',
        'Warmest Diwali greetings to you. May the coming quarter and year bring immense growth and fruitful collaborations.'
      ],
      heartwarming: [
        'May this Diwali bring a perfect work-life balance, sweet festive moments, and a prosperous year for your entire family.',
        'Happy Diwali! It is a pleasure working alongside you. Wishing you and your loved ones peaceful festivities.'
      ],
      short: [
        'Happy Diwali! Wishing you success, good health, and joyful celebrations.',
        'Warm Diwali wishes to you and your family! Have a sparkling holiday.'
      ]
    },
    boss: {
      professional: [
        'Respected Sir/Ma’am, wishing you and your family a very Happy Diwali filled with good health, peace, and remarkable prosperity.',
        'May this festival of lights illuminate new avenues of leadership and success for our organization under your visionary guidance. Happy Diwali!',
        'Warm festive greetings to you. Thank you for your continued mentorship, inspiration, and support throughout the year.'
      ],
      traditional: [
        'May the auspicious festival of Diwali bring prosperity, good fortune, and everlasting peace to your family and home.'
      ],
      short: [
        'Wishing you and your family a prosperous and Happy Diwali!',
        'Warm Diwali greetings to you, Sir/Ma’am. Wishing you happiness and great health.'
      ]
    },
    teacher: {
      emotional: [
        'Just as a diya dispels darkness, your teachings have illuminated my mind and guided my destiny. Wishing you a blessed Diwali, dear Teacher.',
        'Knowledge is the truest light in this world, and you gifted that light to me. Happy Diwali to my revered mentor.'
      ],
      traditional: [
        'Respected Teacher, seeking your blessings on this sacred festival of lights. May God grant you long life and happiness.',
        'Warmest Diwali greetings to the one who lit the flame of curiosity and wisdom in our hearts.'
      ],
      short: [
        'Happy Diwali, respected Teacher! Thank you for guiding us with knowledge and patience.'
      ]
    },
    customer: {
      professional: [
        'Dear valued customer, thank you for your trust and partnership. May this Diwali bring immense joy, success, and prosperity to your business and family.',
        'Wishing you a sparkling Diwali! We are grateful for your association and look forward to illuminating new milestones together in the coming year.',
        'Warmest greetings of the festive season. May the festival of lights bring good fortune and thriving growth to you.'
      ],
      short: [
        'Happy Diwali from all of us! Thank you for being an esteemed part of our journey.',
        'Wishing our valued patron a prosperous and joyous Diwali celebration!'
      ]
    },
    everyone: {
      traditional: [
        'May the holy light of Deepavali fill your home with wealth, fortune, and peaceful serenity. Happy Diwali to all!',
        'Shubh Deepavali! May Goddess Mahalakshmi and Lord Ganesha bless every corner of your life with divine grace.',
        'Let us celebrate the victory of light over darkness and good over evil. Have an auspicious and holy Diwali!'
      ],
      heartwarming: [
        'May the lights of Diwali guide you through every challenge and fill your days with harmony, health, and happiness.',
        'Wishing every home warmth, every heart peace, and every life prosperity this festival of lights.',
        'May your life be as colorful, shimmering, and joyful as the lights of Diwali!'
      ],
      inspirational: [
        'Be like the diya that lights up the world without asking for anything in return. Spread kindness and joy this Diwali.',
        'Let this Diwali be a reminder that no matter how deep the darkness, a single flicker of light can triumph. Happy Diwali!'
      ],
      short: [
        'Happy Diwali! May your festive season be sparkling with joy and sweet memories.',
        'Wishing you and your family a safe, peaceful, and blessed festival of lights!',
        'Light, laughter, and lots of sweets! Have a wonderful Diwali!'
      ]
    }
  };

  // 3. Twenty (20) Professionally Curated Templates Metadata
  const TEMPLATES = [
    {
      id: 'royal-gold',
      name: 'Royal Gold Diwali',
      category: 'luxury',
      bgType: 'gradient',
      colors: { bg1: '#070b19', bg2: '#0f172a', accent: '#ffd700', text: '#ffffff', secondary: '#f1c40f' },
      borderStyle: 'mandala-ornate',
      diyaStyle: 'brass-golden',
      description: 'Regal midnight navy and pure metallic gold ornate mandala motifs.'
    },
    {
      id: 'traditional-indian',
      name: 'Traditional Indian',
      category: 'traditional',
      bgType: 'gradient',
      colors: { bg1: '#3b0000', bg2: '#800000', accent: '#f59e0b', text: '#fffbeb', secondary: '#fbbf24' },
      borderStyle: 'marigold-toran',
      diyaStyle: 'earthen-terracotta',
      description: 'Warm auspicious vermilion, marigold garlands, and handcrafted earthen diya.'
    },
    {
      id: 'luxury-black-gold',
      name: 'Luxury Black & Gold',
      category: 'luxury',
      bgType: 'radial',
      colors: { bg1: '#000000', bg2: '#1a1405', accent: '#d4af37', text: '#ffffff', secondary: '#f6e58d' },
      borderStyle: 'geometric-art-deco',
      diyaStyle: 'floating-gold-flame',
      description: 'Midnight obsidian backdrop with radiant foil geometric filigree and stardust.'
    },
    {
      id: 'glowing-diyas',
      name: 'Glowing Diyas',
      category: 'traditional',
      bgType: 'gradient',
      colors: { bg1: '#1c0a00', bg2: '#3d1600', accent: '#ff9f1a', text: '#fff4e6', secondary: '#ffb142' },
      borderStyle: 'ambient-bokeh',
      diyaStyle: 'row-of-diyas',
      description: 'Deep warm amber twilight with a luminous foreground cluster of oil lamps.'
    },
    {
      id: 'rangoli-celebration',
      name: 'Rangoli Celebration',
      category: 'traditional',
      bgType: 'gradient',
      colors: { bg1: '#1a002c', bg2: '#4a0072', accent: '#00e5ff', text: '#ffffff', secondary: '#ffea00' },
      borderStyle: 'intricate-rangoli',
      diyaStyle: 'peacock-diya',
      description: 'Vibrant royal magenta background with symmetrical multicolour kolam centerpiece.'
    },
    {
      id: 'colorful-fireworks',
      name: 'Colorful Fireworks',
      category: 'friends',
      bgType: 'gradient',
      colors: { bg1: '#05051a', bg2: '#120f38', accent: '#ff007f', text: '#ffffff', secondary: '#00f2fe' },
      borderStyle: 'sparkler-glow',
      diyaStyle: 'sparkler-cluster',
      description: 'Midnight sky with dazzling multi-colored pyrotechnics and crackling sparkles.'
    },
    {
      id: 'lakshmi-divine',
      name: 'Divine Mahalakshmi',
      category: 'traditional',
      bgType: 'radial',
      colors: { bg1: '#4a0000', bg2: '#7f0000', accent: '#ffd700', text: '#fff9e6', secondary: '#ffaa00' },
      borderStyle: 'golden-lotus',
      diyaStyle: 'sacred-deepam',
      description: 'Sacred golden lotus pedestal, radiant aura, and auspicious coin shower.'
    },
    {
      id: 'modern-minimal',
      name: 'Modern Minimal',
      category: 'modern',
      bgType: 'solid',
      colors: { bg1: '#18181b', bg2: '#27272a', accent: '#e4d00a', text: '#fafafa', secondary: '#a1a1aa' },
      borderStyle: 'thin-frame',
      diyaStyle: 'minimal-vector',
      description: 'Clean Scandinavian typography, minimalist thin-line Diya silhouette, matte slate.'
    },
    {
      id: 'floral-diwali',
      name: 'Floral Festive',
      category: 'family',
      bgType: 'gradient',
      colors: { bg1: '#062615', bg2: '#0f4d2a', accent: '#f59e0b', text: '#ecfdf5', secondary: '#fbbf24' },
      borderStyle: 'marigold-jasmine',
      diyaStyle: 'brass-urli',
      description: 'Rich emerald canvas framed by fresh marigold and white jasmine floral festoons.'
    },
    {
      id: 'corporate-gold',
      name: 'Corporate Executive',
      category: 'professional',
      bgType: 'gradient',
      colors: { bg1: '#0b132b', bg2: '#1c2541', accent: '#c69214', text: '#ffffff', secondary: '#e0b034' },
      borderStyle: 'corporate-pinstripe',
      diyaStyle: 'executive-glow',
      description: 'Deep navy executive backdrop with refined gold pinstripes and formal greeting.'
    },
    {
      id: 'family-warmth',
      name: 'Family Hearth',
      category: 'family',
      bgType: 'gradient',
      colors: { bg1: '#261205', bg2: '#4a230a', accent: '#f59e0b', text: '#fff8eb', secondary: '#fcd34d' },
      borderStyle: 'home-threshold',
      diyaStyle: 'family-diyas',
      description: 'Warm glowing amber lights, traditional threshold toran, and heartfelt blessings.'
    },
    {
      id: 'friends-forever',
      name: 'Friends Forever',
      category: 'friends',
      bgType: 'gradient',
      colors: { bg1: '#2b0938', bg2: '#581c87', accent: '#f43f5e', text: '#ffffff', secondary: '#38bdf8' },
      borderStyle: 'festive-confetti',
      diyaStyle: 'neon-spark',
      description: 'Electric violet to royal fuchsia gradient, energetic confetti, and light ribbons.'
    },
    {
      id: 'cute-cartoon',
      name: 'Joyful Sparks',
      category: 'friends',
      bgType: 'gradient',
      colors: { bg1: '#7c2d12', bg2: '#c2410c', accent: '#fef08a', text: '#ffffff', secondary: '#fed7aa' },
      borderStyle: 'playful-bubbles',
      diyaStyle: 'smiling-diya',
      description: 'Cheerful orange backdrop with cute smiling little Diya character and sweet sparkles.'
    },
    {
      id: 'traditional-tamil',
      name: 'Tamil Traditional',
      category: 'traditional',
      bgType: 'gradient',
      colors: { bg1: '#450a0a', bg2: '#831843', accent: '#fde047', text: '#ffffff', secondary: '#fbbf24' },
      borderStyle: 'temple-gopuram',
      diyaStyle: 'kuthu-vilakku',
      description: 'Temple gopuram silhouette, auspicious kumkum red, and traditional Tamil motifs.'
    },
    {
      id: 'kerala-festive',
      name: 'Kerala Nilavilakku',
      category: 'traditional',
      bgType: 'gradient',
      colors: { bg1: '#141414', bg2: '#2a2416', accent: '#d4af37', text: '#fffdf5', secondary: '#f1c40f' },
      borderStyle: 'kasavu-gold-border',
      diyaStyle: 'nilavilakku-lamp',
      description: 'Kasavu ivory and gold weave border with traditional 5-wick brass Nilavilakku lamp.'
    },
    {
      id: 'north-indian-rajasthani',
      name: 'Rajasthani Jharokha',
      category: 'traditional',
      bgType: 'gradient',
      colors: { bg1: '#310a24', bg2: '#60123f', accent: '#facc15', text: '#fffbeb', secondary: '#f59e0b' },
      borderStyle: 'rajasthani-arch',
      diyaStyle: 'carved-stone-diya',
      description: 'Royal Rajputana palace jharokha arch, paisley filigree, and imperial carmine gold.'
    },
    {
      id: 'purple-gold',
      name: 'Imperial Purple',
      category: 'luxury',
      bgType: 'gradient',
      colors: { bg1: '#1b0a2a', bg2: '#38144f', accent: '#ffd700', text: '#fbf7ff', secondary: '#f4c430' },
      borderStyle: 'brocade-filigree',
      diyaStyle: 'floating-jewel-diya',
      description: 'Royal amethyst purple velvet background with glittering gold brocade filigree.'
    },
    {
      id: 'red-gold',
      name: 'Crimson Vermilion',
      category: 'traditional',
      bgType: 'radial',
      colors: { bg1: '#540808', bg2: '#800c0c', accent: '#fde047', text: '#ffffff', secondary: '#ea580c' },
      borderStyle: 'mandala-corner',
      diyaStyle: 'auspicious-diya',
      description: 'Classic auspicious bridal crimson with ornate golden foil mandala and center Diya.'
    },
    {
      id: 'white-gold',
      name: 'Pearl & Gold',
      category: 'modern',
      bgType: 'gradient',
      colors: { bg1: '#18181b', bg2: '#27272a', accent: '#d4af37', text: '#fcfcfc', secondary: '#e5e5e5' },
      borderStyle: 'marble-gold-inlay',
      diyaStyle: 'sculpted-gold',
      description: 'Dark pearl textured canvas with embossed gold foil borders and clean starbursts.'
    },
    {
      id: 'futuristic-cyber-diwali',
      name: 'Cyberpunk Digital Lights',
      category: 'modern',
      bgType: 'gradient',
      colors: { bg1: '#030712', bg2: '#0b132b', accent: '#00f5d4', text: '#ffffff', secondary: '#ffd166' },
      borderStyle: 'circuit-neon',
      diyaStyle: 'hologram-diya',
      description: 'Cyberpunk dark grid with glowing cyan and gold neon circuit lines forming a digital Diya.'
    }
  ];

  // Helper function to generate wish
  function generateWishes(recipient, tone) {
    recipient = recipient || 'everyone';
    tone = tone || 'heartwarming';

    const recData = SMART_WISHES[recipient] || SMART_WISHES.everyone;
    let list = recData[tone];

    if (!list || list.length === 0) {
      // Fallback across tones
      const allForRec = Object.values(recData).flat();
      if (allForRec.length > 0) {
        list = allForRec;
      } else {
        list = SMART_WISHES.everyone.heartwarming;
      }
    }

    return list;
  }

  return {
    LANGUAGES,
    TEMPLATES,
    SMART_WISHES,
    generateWishes
  };
})();
