/**
 * EcrioX Typing Arena - Comprehensive Passages Database
 * Supports English (General, Literature, Quotes), Numbers, Punctuation,
 * Difficult Words, Programming Snippets (JS, Python, C++, Verilog, HTML/CSS),
 * Kids Stories, and Global Languages (Hindi, Tamil, Spanish, French, German).
 */

(function () {
  'use strict';

  const PASSAGES = {
    // 1. General English Passages
    english: [
      "The sun had barely risen over the horizon when the first travelers began their long journey across the valley. Gentle morning mist drifted through the tall pine trees, carrying the fresh scent of mountain air and damp earth. Every step brought them closer to the winding river that had nourished this land for centuries.",
      "Curiosity is the engine of human achievement. When we ask questions about how the world works, we open doors to unexpected discoveries. From ancient astronomers mapping the stars to modern engineers building quantum computers, the desire to explore has always driven progress forward.",
      "Reading allows you to travel through space and time without ever leaving your chair. In the pages of a book, you can walk through the busy streets of ancient Rome, climb towering Himalayan peaks, or imagine distant galaxies that have not yet been named. A curious mind is never truly alone.",
      "The quiet library smelled of aged paper, polished oak, and quiet contemplation. Rows of towering shelves held the collective wisdom of generations, waiting patiently for eager hands to turn their pages. Knowledge, once discovered, becomes a lantern that guides future generations.",
      "Efficiency in typing is not just about raw finger speed; it is about rhythm, muscle memory, and calmness under pressure. When your hands move smoothly across the keyboard, words flow from your mind to the screen like water over river stones, effortless and continuous.",
      "The forest came alive as twilight approached. Nocturnal owls softly stirred in the branches of the ancient cedar, while fireflies blinked across the clearing like wandering stars. In the distance, the soothing murmur of a mountain brook completed the symphony of nature."
    ],

    // 2. Numbers & Financial
    numbers: [
      "Invoice #84920 processed on 12/04/2026: Subtotal $4,850.75, Tax 8.25% ($400.19), Shipping $45.00, Grand Total $5,295.94. Account balance: $128,490.50 with 3.45% annual yield.",
      "Global network throughput measured at 10,485.60 Mbps with a 99.98% uptime SLA. Server cluster 12 responded in 14.8 ms, while node 07 logged 2,400 active sessions across 192.168.1.104.",
      "In the fiscal year 2025-2026, renewable energy generation rose by 27.8%, accounting for 4,890 gigawatt-hours. Operating margins expanded from 14.2% to 19.65%, yielding $842,100,000 net.",
      "Coordinates recorded: Latitude 37.7749 N, Longitude -122.4194 W. Elevation 52.4 meters above sea level. Barometric pressure 1013.25 hPa, temperature 21.5 C, humidity 64.8%."
    ],

    // 3. Punctuation & Complex Symbols
    punctuation: [
      "\"Success isn't about how much money you make,\" the mentor said; \"it's about the difference you make in people's lives!\" (Do you agree? Consider: passion, purpose, & persistence.)",
      "Wait—did you hear that? The professor whispered: \"Every formula [see Eq. 4.2(a)] requires balance: without equilibrium, kinetic energy (E_k) cannot equal potential energy (U).\"",
      "\"Don't panic!\" shouted the navigator; \"Keep the rudder steady (at exactly 45 degrees), watch the northern star, and whatever happens—never lose faith!\" Can we reach shore by dawn? Yes; we must.",
      "The report concluded: \"Three factors—climate, geography, and governance (specifically policy transparency)—determine long-term civic resilience; however, public trust remains paramount.\""
    ],

    // 4. Difficult & Frequently Misspelled Words
    difficult: [
      "definitely accommodate embarrass hierarchy surveillance liaison fluorescent questionnaire vacuum rhythm amateur privilege conscientious guarantee occurrence rhythm millennium supersedes maneuver reconnaissance entrepreneur silhouette rendezvous catastrophe idiosyncrasy",
      "bureaucracy acquiesce connoisseur paraphernalia mischievous supersede prerequisite kaleidoscope serendipity quintessence camouflage phlegmatic blasphemy exhilaration reminiscence conscientious idiosyncrasy",
      "indispensable pronunciation maintenance playwright drunkenness supersede questionnaire embarrassment harass miscellaneous hypocrisy surveillance accommodate millennium cemetery noticeable"
    ],

    // 5. Programming Snippets
    programming: {
      javascript: [
        "async function fetchUserData(userId) {\n  try {\n    const response = await fetch(`/api/users/${userId}`);\n    if (!response.ok) throw new Error('HTTP error');\n    const data = await response.json();\n    return data.filter(item => item.isActive);\n  } catch (error) {\n    console.error('Fetch failed:', error.message);\n    return null;\n  }\n}",
        "const debounce = (func, waitMs) => {\n  let timeoutId = null;\n  return (...args) => {\n    clearTimeout(timeoutId);\n    timeoutId = setTimeout(() => func(...args), waitMs);\n  };\n};"
      ],
      python: [
        "def quick_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quick_sort(left) + middle + quick_sort(right)",
        "class DataPipeline:\n    def __init__(self, batch_size=64):\n        self.batch_size = batch_size\n        self.processed_count = 0\n\n    def process_stream(self, records):\n        for i in range(0, len(records), self.batch_size):\n            yield records[i:i + self.batch_size]\n            self.processed_count += len(records[i:i + self.batch_size])"
      ],
      cpp: [
        "template <typename T>\nclass CircularBuffer {\nprivate:\n    std::vector<T> buffer;\n    size_t head = 0;\n    size_t tail = 0;\n    size_t max_size;\npublic:\n    CircularBuffer(size_t size) : max_size(size), buffer(size) {}\n    void push(T item) {\n        buffer[head] = item;\n        head = (head + 1) % max_size;\n    }\n};",
        "#include <iostream>\n#include <vector>\n#include <algorithm>\n\nint main() {\n    std::vector<int> numbers = {5, 2, 9, 1, 7};\n    std::sort(numbers.begin(), numbers.end());\n    for (const auto& num : numbers) {\n        std::cout << num << \" \";\n    }\n    return 0;\n}"
      ],
      verilog: [
        "module counter_4bit (\n    input wire clk,\n    input wire reset_n,\n    input wire enable,\n    output reg [3:0] count\n);\n    always @(posedge clk or negedge reset_n) begin\n        if (!reset_n)\n            count <= 4'b0000;\n        else if (enable)\n            count <= count + 1'b1;\n    end\nendmodule",
        "module d_flip_flop (\n    input wire clk,\n    input wire d,\n    output reg q\n);\n    always @(posedge clk) begin\n        q <= d;\n    end\nendmodule"
      ],
      html_css: [
        "<div class=\"card-container\">\n  <header class=\"card-header\">\n    <h3 class=\"title\">Dashboard Overview</h3>\n    <span class=\"badge active\">Online</span>\n  </header>\n  <main class=\"card-body\">\n    <p>System operational with zero latency.</p>\n  </main>\n</div>",
        ".flex-center {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 1.5rem;\n  border-radius: 0.5rem;\n  transition: all 0.3s ease-in-out;\n}"
      ]
    },

    // 6. Kids Friendly Passages (Simple words & positive stories)
    kids: [
      "The little brown puppy loved to run across the green grass. He chased a bright yellow ball until his paws grew tired. Then he sat beside his best friend and drank cool, fresh water from his blue bowl.",
      "High up in the blue sky, a fluffy white cloud floated over the tall hills. It waved at the birds flying past and watched children play games in the sunny park below.",
      "The brave little turtle decided to climb to the top of the hill. Step by step, slow and steady, he kept moving forward. When he reached the summit, he saw the most wonderful rainbow in the world.",
      "Once upon a time, a magical star fell into a friendly garden. Every night, the garden flowers glowed with sweet, gentle colors that made all the forest animals smile with happiness."
    ],

    // 7. Global Languages
    languages: {
      hindi: [
        "समय का पहिया कभी नहीं रुकता। जो व्यक्ति समय का सदुपयोग करता है, सफलता उसके कदम चूमती है। जीवन में धैर्य और परिश्रम ही सच्ची विजय का मार्ग प्रशस्त करते हैं।",
        "सच्ची मित्रता जीवन का अनमोल वरदान है। अच्छे मित्र सुख और दुख दोनों में समान रूप से साथ खड़े रहते हैं। विश्वास और समर्पण से ही रिश्ते प्रगाढ़ होते हैं।",
        "प्रकृति हमें निस्वार्थ भाव से देना सिखाती है। नदियां अपना जल स्वयं नहीं पीतीं और वृक्ष अपने फल स्वयं नहीं खाते। परोपकार ही मानव जीवन का सर्वोच्च धर्म है।"
      ],
      tamil: [
        "முயற்சி திருவினையாக்கும் என்பது பெரியோர் வாக்கு. விடாமுயற்சியும் தன்னம்பிக்கையும் உள்ள மனிதனுக்கு எட்டாத தூரம் எதுவும் இல்லை. கடின உழைப்பே முன்னேற்றத்திற்கான திறவுகோல்.",
        "கல்வி கரையில கற்பவர் நாள்சில. கற்க கசடற கற்பவை கற்றபின் நிற்க அதற்குத் தக என்று வள்ளுவர் குறள் நமக்கு நல்வழிகாட்டுகிறது. அறிவே மனிதனின் சிறந்த அணிகலன்.",
        "அன்பும் அமைதியும் நிறைந்த வாழ்க்கை மனிதனை முழுமையாக்குகிறது. இயற்கையோடு இணைந்து வாழும் பொழுது மனம் தூய்மையும் சாந்தியும் பெறுகிறது."
      ],
      spanish: [
        "La paciencia es la clave que abre todas las puertas del exito. Cuando trabajas con dedicacion y perseverancia, cada pequeno esfuerzo diario se transforma en grandes logros que inspiran a otros.",
        "El amanecer sobre las montanas trajo consigo una brisa fresca que despertaba a todo el valle. Los senderos estaban cubiertos de flores silvestres y el murmullo del rio cantaba en la distancia."
      ],
      french: [
        "Le voyage de mille lieues commence toujours par un premier pas. Avec la volonte, la patience et le travail constant, aucun obstacle ne peut arreter un esprit determine a reussir.",
        "La douce lumiere du matin traversait les feuilles dorées de la foret. Le silence etait seulement interrompu par le chant melodieux d'un oiseau saluant l'arrivee d'un nouveau jour."
      ],
      german: [
        "Uebung macht den Meister. Wer taeglich mit Geduld und Freude seine Faehigkeiten verbessert, wird mit Sicherheit grosse Erfolge erzielen. Der Weg ist das Ziel auf jeder Reise.",
        "Die kuehle Morgenluft wehte sanft ueber die weiten Wiesen der Berge. Jeder Schritt brachte neue Energie und Ruhe fuer die kommenden Aufgaben des Tages."
      ]
    }
  };

  function getPassage(category = 'english', subcategory = null) {
    if (category === 'programming') {
      const lang = subcategory || 'javascript';
      const list = PASSAGES.programming[lang] || PASSAGES.programming.javascript;
      return list[Math.floor(Math.random() * list.length)];
    }
    if (category === 'languages') {
      const lang = subcategory || 'hindi';
      const list = PASSAGES.languages[lang] || PASSAGES.english;
      return list[Math.floor(Math.random() * list.length)];
    }
    const list = PASSAGES[category] || PASSAGES.english;
    return list[Math.floor(Math.random() * list.length)];
  }

  window.ECRIOX_PASSAGES = {
    PASSAGES,
    getPassage
  };
})();
