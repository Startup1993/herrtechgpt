-- Full Skool import v2: hierarchy + complete descriptions

-- Clear existing data
DELETE FROM public.module_videos;
DELETE FROM public.module_chapters;

-- Ensure all modules are published
UPDATE public.course_modules SET is_published = true;

INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'w7vi114g8i', 'Einfach starten - Der rote Faden zum Beginn!', '**Einfach mal machen! 🚀**

Was ist das Schlimmste, was passieren kann? 🤔  
Es floppt und niemand schaut es sich an. Perfekt, dann hat es wenigstens niemand gesehen! Es geht darum, einfach rauszuhauen und anzufangen. Es muss nicht sofort perfekt sein, der erste Schritt ist entscheidend! 💥

Viele denken, sie müssen perfekt sein, sich vor der Kamera zeigen oder dass der Algorithmus sie blockiert – **aber das sind nur Ausreden!** 🙅‍♂️🙅‍♀️

  
Der wahre Erfolg kommt nicht durch Perfektion, sondern durch **Durchhaltevermögen** und **Konsequenz**! 💪

**Meine ersten Videos?** Die waren alles andere als perfekt – aber hey, sie wurden mit der Zeit besser! Die Wahrheit ist: **Perfektionismus ist der größte Feind des Erfolgs.** Es geht darum, **einfach zu starten**! 🌟

Und wenn ihr sagt: „Ich will nicht vor der Kamera stehen!” Kein Problem! 🙌 Ihr könnt eure Videos mit KI erstellen – **faceless** ist auch möglich! In nur wenigen Minuten könnt ihr mit den richtigen KI-Tools wirklich coolen Content produzieren.

**Der schnelle Weg, wie ihr loslegen könnt:**

1️⃣ **Skripte mit ChatGPT erstellen:**  
Schreibt das Skript mit ChatGPT oder orientiert euch an viralen Hits, die gut in eurer Nische funktionieren. 🎯

2️⃣ **Video erstellen:**  
Dreht das Video selbst oder nutzt Tools wie Heygen/Adobe Express/Dreamina, um automatisch Videos aus Skripten zu erstellen. 🎥

3️⃣ **Schneiden:**  
Verwendet CapCut, TikTok oder DaVinci für den letzten Schliff eurer Videos. ✂️

4️⃣ **Posten & Weiter!**  
Teilt euren Content auf Social Media und wiederholt den Prozess. So verbessert ihr euch kontinuierlich und lernt durch Feedback! 📲

⚠️ **Denkt nicht zu viel nach!**  
Der Schlüssel ist, einfach zu **handeln** und **dranzubleiben**! Die größte Herausforderung für die meisten ist, sich nicht in der Technik zu verlieren, sondern **wirklich anzufangen**. Die Tools sind einfach, der Rest liegt an euch! 🔥

Ihr habt **1000 Chancen**, genau wie beim Lottospielen! 🎰 Postet 1000 Videos, um 1000 mal die Chance zu haben, viral zu gehen! Also nutzt diese Gelegenheit – **es ist kostenlos**!

**🚀 Let`s go - Die Challenge:**

**Erstellt 5 komplette Video-Skripte. Produziert & postet sie innerhalb der nächsten 7 Tage. 🦾**

Wie ihr dann noch weit krasseres Marketing herausholt, lernt ihr hier: [KI Marketing](https://www.skool.com/ki-marketing-club/classroom/dc0bc69b?md=bf8c08b6542848fdbef64c52a134739b)

Und wie ihr sensationellen Content mit KI erstellt, gibt es hier: [KI Content](https://www.skool.com/ki-marketing-club/classroom/962c4f29?md=f4cf0709bdd446988b18ee6648717664)

Die größte Herausforderung ist zu Beginn allerdings, sich nicht in den vielen Möglichkeiten zu verlieren. Viel zu oft sehe ich, dass Menschen sich in der Technik verzetteln und nie anfangen, wirklich Content zu produzieren.** Es geht nicht darum, alles perfekt zu machen, sondern darum, den ersten Schritt zu tun und konstant durchzuziehen. **🧨

**🛑 Disclaimer: Wenn ihr sagt: „Ich bin kein Content Creator!“ Keine Sorge!**

  
Dann ist für euch der **KI Vertrieb** oder **Automatisierung** erstmal relevant. Kein Problem, wir haben alles im KI Marketing Club:

➡️ **KI Vertrieb & Leads generieren**  
Schaut euch dazu dieses Kapitel an: [KI Vertrieb](https://www.skool.com/ki-marketing-club/classroom/02a3668d?md=34cccc11fc62460f849af1e7659eada4)

➡️ **Automatisierung für mehr Effizienz**  
Mehr dazu in Agenten & Automatisierungsbereich: [Automatisierung](https://www.skool.com/ki-marketing-club/classroom/f22ee9b4?md=0e51bb82501440ecbbbf8f0467dbd5e8)

Egal, was euer Ziel ist, der **KI Marketing Club** hat die Ressourcen, die ihr braucht, um durchzustarten! 

**🎯 WICHTIG: Schaut euch zunächst nur den Bereich an, der für euch am relevantesten ist und startet mit der Umsetzung!**', 1, 713 FROM public.course_modules WHERE slug = 'einfach-starten';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'ki2hrtz63s', '01 - KI Marketing Masterclass - Intro', 'Herzlich Willkommen zu meiner 1% KI Marketing Class! 

Egal wie du hierher gefunden hast – vermutlich hatte **Künstliche Intelligenz** ihre Finger im Spiel 😉  
Aber bevor du gleich Tools öffnest und Prompts ballerst: **Stopp.**

Denn bevor du KI nutzt, musst du **verstehen, was dich einzigartig macht.**  
Was dich viral macht. Was dich zur Marke macht.  
**KI ist kein Ersatz für Ideen – sondern der Verstärker deiner Vision.**

---

### 💡 **Worum geht’s in der Marketing Masterclass?**

  
Wir sprechen über **das Mindset, das dich von den 99 % unterscheidet**.  
Denn die meisten da draußen scrollen nur, kopieren andere, posten irgendwas auf Gut Glück –  
und wundern sich, warum **nichts passiert**.

Ich zeig dir, wie ich selbst 2023 von Null gestartet bin,  
wie ich als **Mr. Tech** in kürzester Zeit über **eine halbe Million Follower**,  
**hundert Millionen Views** und mehrere Einkommensquellen aufgebaut habe.  
Nicht mit Zufall. Sondern mit **Strategie, Persönlichkeit – und KI.**

---

### 🎬 **Was dich erwartet:**

✅ Wie du **KI-Content** mit Persönlichkeit kombinierst, um aus der Masse hervorzustechen. **Automatisiert mit Reichweite!**  
✅ Warum **Mindset + Positionierung** wichtiger sind als noch ein Prompt.   
✅ Wie meine Agentur Deutschlands erste **KI Influencerin „****[Emma](https://www.instagram.com/emmatravelsgermany/)****“** für die DZT gebaut hat und was du davon lernen kannst: Dein eigener KI Influencer, dein eigener Klon. Alles in Tutorials!  
✅ Wie wir für das **Uniklinikum Tübingen** einen [hochemotionalen Film](https://www.instagram.com/reel/DFdcahQtgOT/) **vollständig mit KI** produziert haben – ohne Schauspieler, ohne Drehteam. **Wie du das selbst machst? Zeigen wir dir!**  
✅ Warum viele Creator Content produzieren, der niemanden erreicht – und wie du das **radikal besser** machst. **Viral gehen war noch nie so einfach!**  
✅ Wie du von Anfang an die **richtigen Kontaktpunkte** für Umsatz schaffst – nicht nur Likes  
✅ Ein erster Blick auf **KI-gestützten Vertrieb**  
✅ Was rechtlich bei KI im Marketing zu beachten ist.

  
**✅ Und: Warum du hier gefordert wirst – keine Theorie, sondern Praxis!**', 1, 209 FROM public.course_modules WHERE slug = 'ki-marketing-course';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'pa21so3f93', '02 - Einzigartiges KI Marketing', '', 2, 1016 FROM public.course_modules WHERE slug = 'ki-marketing-course';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'i42d1vzzzg', '03 - Marketing Strategie mit KI', '', 3, 2560 FROM public.course_modules WHERE slug = 'ki-marketing-course';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 's030zb029h', '04 - Deine (KI) Brand', '', 4, 1644 FROM public.course_modules WHERE slug = 'ki-marketing-course';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '2uva0xd5ks', '05 - Algorithmus verstehen', '', 5, 2743 FROM public.course_modules WHERE slug = 'ki-marketing-course';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'a3bybnadqm', '06 - Das virale Skript und die Hook (!)', '', 6, 2462 FROM public.course_modules WHERE slug = 'ki-marketing-course';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'jwzw3uvjla', 'Bonus: Kreativität finden', '', 7, 996 FROM public.course_modules WHERE slug = 'ki-marketing-course';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', 'Bonus: Die besten Prompts in 2025 🤫', '', 8, 0 FROM public.course_modules WHERE slug = 'ki-marketing-course';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'jjclk7x0iu', 'UPDATE: KI Influencer & Content erstellen 🔥', '', 1, 1978 FROM public.course_modules WHERE slug = 'ki-content-erstellung';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'tyt6fzcazp', 'Sora 2 - konsistente Charaktere erstellen:', '', 2, 717 FROM public.course_modules WHERE slug = 'ki-content-erstellung';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '1m7921ojri', '01 - Die Vorteile von KI Influencer & KI Content', '', 3, 2208 FROM public.course_modules WHERE slug = 'ki-content-erstellung';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'tetuyp9rci', '02 - KI Influencer & KI Content erstellen', '', 4, 171 FROM public.course_modules WHERE slug = 'ki-content-erstellung';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'areke39nhd', '03- KI Influencer & KI Content erstellen', '', 5, 1472 FROM public.course_modules WHERE slug = 'ki-content-erstellung';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'wyj2q5n3x0', '04 - Die KI Video Generierung', '', 6, 829 FROM public.course_modules WHERE slug = 'ki-content-erstellung';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'a0edyx4px2', '05 - KI Visuals erstellen', '', 7, 694 FROM public.course_modules WHERE slug = 'ki-content-erstellung';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'i26t15dt6t', '06 - Das Drehbuch: KI Storytelling at its finest', '', 8, 2034 FROM public.course_modules WHERE slug = 'ki-content-erstellung';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'fayoax6znl', 'Bonus - KI Musik Intro 🎶', '', 9, 524 FROM public.course_modules WHERE slug = 'ki-content-erstellung';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', 'Bonus - Mit KI Musik viral gehen 🚀', '', 10, 0 FROM public.course_modules WHERE slug = 'ki-content-erstellung';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'wjosmv1n3r', 'Bonus - Before-After Transform Videos erstellen', '', 11, 31 FROM public.course_modules WHERE slug = 'ki-content-erstellung';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '9gco8pzsnv', 'Bonus - viraler TikTok Trend: süße KI Avatare', '', 12, 424 FROM public.course_modules WHERE slug = 'ki-content-erstellung';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'sfe5dg9v8x', 'Bonus - Immobilienvideos mit KI erstellen 🏠', '# 🏠 Immobilienvideos mit KI erstellen – In 4 einfachen Schritten!

Ihr habt sie wahrscheinlich schon gesehen – diese krassen Videos, wo ein leerer Rohbau-Raum Schritt für Schritt in einen luxuriösen, fertig eingerichteten Raum verwandelt wird. Mit atemberaubenden Kamerafahrten, perfektem Licht und professionellem Schnitt. Wir haben gerade solche Videos erstellt und zeigen euch, wie ihr genau das selbst machen könnt. Mit nur einem Custom GPT und zwei KI-Tools.

Kein Fotograf, kein Drehteam, kein Budget – nur pure KI-Power. 💪

## Das brauchst du:

**Custom GPT "Floor Transformation"** – Das Herzstück! Dieser Custom GPT generiert automatisch alle Prompts für deine Bilder und Videos. Du brauchst nur noch zu kopieren und einzufügen. Keine Geisteskraft nötig! 🧠 **🔗 GPT Link:** [https://chatgpt.com/g/g-695badc413488191a554711d7e9a9742-floor-transformation](https://chatgpt.com/g/g-695badc413488191a554711d7e9a9742-floor-transformation)**Nano Banana Pro** – Erstellt fotorealistische Bilder von Räumen in verschiedenen Baustadien. Von Rohbau bis zur fertigen Innenausstattung.**Veo3** – Verwandelt deine Bilder in beeindruckende Videoclips mit realistischen Kamerafahrten durch den Raum.**CapCut oder ein beliebiges Videoschnitt-Programm** – Schneidet alle Clips zusammen und erstellt dein finales Video. CapCut ist kostenlos und reicht vollkommen aus.

**Das war''s! Mit diesen vier Tools erstellst du professionelle Transformations-Videos, die viral gehen. 🚀**

## Schritt 1: Custom GPT "Floor Transformation" – Dein automatischer Prompt-Generator

Das ist der Secret Sauce! Der Custom GPT "Floor Transformation" schreibt automatisch alle Prompts für deine Bilder und Videos. Du musst nur noch kopieren und einfügen. Das spart dir Stunden!

**So funktioniert''s:**

1. Gehe direkt zum GPT: [https://chatgpt.com/g/g-695badc413488191a554711d7e9a9742-floor-transformation](https://chatgpt.com/g/g-695badc413488191a554711d7e9a9742-floor-transformation)
2. Oder: Gehe auf [https://chat.openai.com](https://chat.openai.com), klicke auf "GPTs erkunden" und suche nach "Floor Transformation"
3. Klicke auf "Start"

**Der GPT schlägt dir automatisch Optionen vor:**

Der GPT fragt dich nach der Art des Raums und schlägt dir automatisch mehrere Beispiele vor:

**Option 1:** Modernes Wohnzimmer mit Industrialcharme**Option 2**: Gemütliches Wohnzimmer mit Kamin**Option 3:** Luxuriöse Penthouse-Suite**Option 4**: Helles Schlafzimmer mit Balkon

Wähle die Option, die zu deinem Projekt passt, oder schlage eine eigene vor. In unserem Beispiel schreiben wir: Gemütliches Wohnzimmer.

![Screenshot 2026-01-22 at 4.25.26 PM.png](https://assets.skool.com/f/6a6dac89fb09458fa4ec8ffbcdfc8dd5/d187d193e24e4978afc981786266c187f914c9d8f1584e259bdf43b0b6b2c8ce-md.png)

**Der GPT generiert dir jetzt automatisch:**

**5 hochdetaillierte Bildprompts** für die verschiedenen Baustadien (Rohbau → Fertigstellung )**3 Videoprompts** für die Transformationen des Raumes in den verschiedenen Stadien

Alles ist bereits optimiert, detailliert und ready to go. Keine Geisteskraft nötig! 🎉

**Erwarteter Output:** Du erhältst zwei Blöcke:

`[BILDPROMPTS] `  
`Prompt 1: Leerer Rohbau-Raum mit nackten Wänden und Betonboden... Prompt 2: Raum mit Wänden, Elektrik und Rohrleitungen... Prompt 3: Raum mit Estrich und Bodenbelag... Prompt 4: Raum mit Wänden gestrichen und Fenster eingebaut... Prompt 5: Fertig eingerichteter Raum mit Möbeln und Dekoration...`

`[VIDEOPROMPTS] `  
`Prompt 1: Kamerafahrt durch den leeren Rohbau-Raum... Prompt 2: Kamerafahrt durch den Raum während der Bauphasen... Prompt 3: Kamerafahrt durch den fertig eingerichteten Raum...``

**Speichere diese Prompts in einem Dokument!** Du wirst sie gleich brauchen.

💡 **Pro-Tipp**: Der GPT generiert ultra-detaillierte Prompts, die speziell für Nano Banana Pro und Veo3 optimiert sind. Das ist 10x besser als wenn du die Prompts selbst schreiben würdest!  


## 🎨 Bonus: Der GPT ist dabei super flexibel – Erstelle Prompts für ALLES!

Der "Floor Transformation" Custom GPT ist nicht nur für Wohnzimmer gedacht. Du kannst ihn für beliebige Räume und Szenarien nutzen. Sag dem GPT einfach, was du genau brauchst, in welchem Stil und wofür – und du bekommst perfekte Prompts!

**Hier sind 4 komplett unterschiedliche Beispiele:**

### **Beispiel 1: Küchen-Renovierung (Innen)**

Du schreibst dem GPT:

`Ich möchte ein Video von einer Küchen-Renovierung erstellen. Vorher: Alte, dunkle Küche mit veralteten Geräten, alten Schränken, dunklem Boden Nachher: Moderne, helle Küche mit neuen Geräten, weißen Schränken, hellem Boden, großer Insel Bauschritte: Abriss alt → Rohbau → Elektrik & Wasser → Boden verlegen → Wände streichen → Schränke einbauen → Geräte installieren → Dekoration Zielgruppe: Hausbesitzer und Makler Stil: Modern, minimalistisch, hell, funktional Erstelle die Bild- und Videoprompts die ich dafür benötige.`

**Der GPT generiert automatisch:** Bildprompts für jeden Baustadium (alt → Rohbau → Elektrik → Boden → Wände → Schränke → fertig), Videoprompts für Kamerafahrten durch die Küche in jedem Stadium.

![Screenshot 2026-01-22 at 4.28.47 PM.png](https://assets.skool.com/f/6a6dac89fb09458fa4ec8ffbcdfc8dd5/f859fc7107bb415a9347c5b84df0f6b491fb9a4c8c9a4ec8ad8da0b8df89485e-md.png)

### **Beispiel 2: Bauplatz → Luxusvilla (Außen)**

Du schreibst dem GPT:

`Ich möchte ein Video von einem Bauprojekt erstellen. Vorher: Leerer Bauplatz in der Stadt mit Bäumen und Wiese Nachher: Fertige, moderne Luxusvilla mit Garten und Terrasse Bauschritte: Leerer Platz → Fundament → Rohbau Wände → Dach → Fenster & Türen → Außenfinish → fertige Villa mit Garten Zielgruppe: Investoren und Immobilien-Entwickler Stil: Modern, luxuriös, hochwertig, minimalistisch Erstelle die Bild- und Videoprompts die ich dafür benötige.`

**Der GPT generiert automatisch**: Bildprompts für alle Bauphasen (von leerem Platz bis fertige Villa), Videoprompts für Drohnen-ähnliche Kamerafahrten um die Villa herum in verschiedenen Baustadien.

### **Beispiel 3: Garten-Transformation (Außen)**

Du schreibst dem GPT:

`Ich möchte ein Video von einer Garten-Transformation erstellen. Vorher: Verwilderter, ungepflegter Garten mit Unkraut, alten Möbeln, kaputtem Zaun Nachher: Moderner, gepflegter Garten mit Terrasse, Pool, Loungebereich, neuer Bepflanzung Bauschritte: Verwilderter Zustand → Abriss & Rodung → Terrasse bauen → Pool bauen → Bepflanzung → Möbel & Dekoration Zielgruppe: Hausbesitzer und Landschaftsarchitekten Stil: Modern, minimalistisch, grün, entspannend Erstelle die Bild- und Videoprompts die ich dafür benötige.`

**Der GPT generiert automatisch:** Bildprompts für jeden Transformationsschritt (verwildert → leer → Terrasse → Pool → fertig), Videoprompts für Kamerafahrten durch den Garten in verschiedenen Stadien.

### **Beispiel 4: Laden-Umbau (Innen/Außen)**

Du schreibst dem GPT:

`Ich möchte ein Video von einem Laden-Umbau erstellen. Vorher: Alter, dunkler Laden mit veralteter Einrichtung, schmutzigen Fenstern, altem Schaufenster Nachher: Moderner, heller Shop mit neuem Design, großem Schaufenster, modernem Interieur, LED-Beleuchtung Bauschritte: Alter Zustand → Abriss Innenausstattung → Rohbau & Elektrik → Neuer Boden → Wände streichen → Schaufenster einbauen → Möbel & Dekoration → Eröffnung Zielgruppe: Einzelhandel und Shop-Owner Stil: Modern, minimalistisch, hell, einladend Erstelle die Bild- und Videoprompts die ich dafür benötige.`

**Der GPT generiert automatisch:** Bildprompts für alle Renovierungsphasen (alt → leer → Rohbau → Fertig), Videoprompts für Kamerafahrten durch den Laden und Außenaufnahmen des Schaufensters in verschiedenen Stadien.

### **🚀 Du kannst den GPT also für deine eigenen Ideen genauso gut verwenden:**

**Schritt 1**: Öffne den GPT: [https://chatgpt.com/g/g-695badc413488191a554711d7e9a9742-floor-transformation](https://chatgpt.com/g/g-695badc413488191a554711d7e9a9742-floor-transformation)

**Schritt 2**: Beschreibe dein Projekt so detailliert wie möglich:

Welcher Raum wird transformiert?Was ist der Vorher-Zustand?Was ist der Nachher-Zustand?Wer ist die Zielgruppe?Welcher Stil soll es sein?Welche Bauschritte sind wichtig?Gib zuletzt an, dass jetzt die Bild- und Videoprompts dafür generiert werden sollen.

**Schritt 3**: Der GPT generiert automatisch alle Prompts für dich

**Schritt 4**: Kopiere die Prompts und nutze sie in Nano Banana Pro und Veo3

**Das ist die Magie:** Du brauchst keine Geisteskraft, keine Prompt-Erfahrung, keine technischen Skills. Der GPT macht alles für dich! 🧠✨  


## Schritt 2: Nano Banana Pro – Fotorealistische Bilder für jeden Baustadium generieren

Jetzt wird''s visuell! Mit Nano Banana Pro erstellst du beeindruckende Bilder des Raums in verschiedenen Baustadien. Die Qualität ist so gut, dass viele Menschen denken, es sind echte Fotos.

**So funktioniert''s:**

1. Gehe auf [https://www.freepik.com/](https://www.freepik.com/) oder [https://gemini.google.com/app](https://gemini.google.com/app) um Nano Banana Pro zu verwenden und melde dich an
2. Klicke auf "Create Image" oder den "Image Generator" und wähle dort Nano Banana Pro aus
3. Kopiere den ersten Bildprompt vom GPT (z.B. "Leerer Rohbau-Raum mit nackten Wänden...") in das Eingabefeld
4. Klicke auf "Generate" und warte 30-60 Sekunden

![Screenshot 2026-01-22 at 4.30.01 PM.png](https://assets.skool.com/f/6a6dac89fb09458fa4ec8ffbcdfc8dd5/e47e004060af4d468e1ac3b2faad82079896e8bf28904616801613502feeaeca-md.png)

**Testen**: Nano Banana Pro erstellt dir ein fotorealistisches Bild. Wenn dir das Bild nicht gefällt, klicke auf "Regenerate" oder passe den Prompt leicht an.

**Erwarteter Output**: Du solltest ein hochqualitatives Bild des Raums in diesem Baustadium sehen. Speichere es als PNG oder JPG und benenne es aussagekräftig, z.B. raum_01_rohbau.png.

**Wiederhole diesen Prozess für alle 5 Bildprompts vom GPT. **

**Wichtig: **Lade immer das zuvor generierte Bild als Referenzbild mit hoch, damit derselbe Raum wiederverwendet wird und nicht ein komplett neuer Raum erstellt wird. Du solltest am Ende 5 hochwertige Bilder haben, die die verschiedenen Baustadien zeigen.

![Screenshot 2026-01-22 at 4.32.09 PM.png](https://assets.skool.com/f/6a6dac89fb09458fa4ec8ffbcdfc8dd5/6fa13ffffb1b49fb971bea0fa87a14219230cb383e514c1fbe0d67949c1087e6-md.png)

**Zeitaufwand**: Ca. 15-20 Minuten für alle Bilder.  


## Schritt 3: Veo3 – Dynamische Videoclips für jeden Baustadium generieren

Jetzt bringst du die Bilder in Bewegung! Mit Veo3 erstellst du beeindruckende Videoclips mit realistischen Kamerafahrten durch den Raum in den verschiedenen Baustadien.

**So funktioniert''s:**

1. Gehe auf [https://labs.google/fx/de/tools/flow](https://labs.google/fx/de/tools/flow) und melde dich an um VEO nutzen zu können
2. Klicke auf "Create Video" oder "New Project"
3. Klicke auf "Video aus Frames" und dein erstes Bild (z.B. raum_01_rohbau.png ) als Start- und dein zweites Bild als End-Frame hoch

![Screenshot 2026-01-22 at 4.34.26 PM.png](https://assets.skool.com/f/6a6dac89fb09458fa4ec8ffbcdfc8dd5/c6f236f92adb48f3813981acbf10ee2f124691a8023a41f98d2a1d89fe4f1808-md.png)

1. Warte, bis das Bild hochgeladen ist
2. Kopiere den entsprechenden Videoprompt vom GPT in das Textfeld. Der GPT hat diese bereits für Veo3 optimiert!

**Testen**: Klicke auf "Generate Video" und warte 1-2 Minuten. Veo3 erstellt dir einen professionellen Videoclip mit Bewegung und Kamerafahrt.

![Screenshot 2026-01-22 at 4.35.16 PM.png](https://assets.skool.com/f/6a6dac89fb09458fa4ec8ffbcdfc8dd5/c4c7a5c29de14e2fb5fe6f6cce2fc05f2ef4558569f443a4b3785409c6f45036-md.png)

**Erwarteter Output**: Du solltest einen 5-10 Sekunden langen Videoclip sehen, der dein Bild mit einer realistischen Kamerafahrt zum Leben erweckt. Speichere ihn als MP4 und benenne ihn aussagekräftig, z.B. raum_01_rohbau_kamerafahrt.mp4.

**Wiederhole diesen Prozess für alle 3 Videoprompts vom GPT. Du solltest am Ende 3 hochwertige Videoclips haben, die die Transformation zeigen.**

**Zeitaufwand**: Ca. 10-15 Minuten pro Clip, also insgesamt 30-45 Minuten.

💡 Die Videoprompts vom GPT sind bereits so spezifisch, dass Veo3 meist beim ersten Versuch ein perfektes Video generiert. Das ist die Magie des Custom GPT!  


## Schritt 4: Zusammenschneiden – Das finale Video erstellen

Jetzt kommt der letzte Schritt: Alle Clips zusammenfügen zu einem professionellen Transformations-Video. Wir nutzen hier CapCut, da es kostenlos und super einfach ist.

**So funktioniert''s:**

1. Gehe auf [https://www.capcut.com](https://www.capcut.com), registriere dich oder logge dich ein und klicke auf "Create a video"
2. Wähle das endsprechende Format ("9:16" für Instagram )

![Screenshot 2026-01-22 at 4.37.11 PM.png](https://assets.skool.com/f/6a6dac89fb09458fa4ec8ffbcdfc8dd5/aafe9c4658e24d749f715b563eb367a44da851a2f92d4fb19e24191e9bf8b421-md.png)

**Importiere deine Videoclips und Bilder:**

1. Klicke auf "Upload" oder "Import"
2. Wähle alle deine Videoclips und Bilder aus
3. Ziehe sie in die Timeline (unten auf dem Bildschirm) in der richtigen Reihenfolge

![Screenshot 2026-01-22 at 4.38.18 PM.png](https://assets.skool.com/f/6a6dac89fb09458fa4ec8ffbcdfc8dd5/b192966e84844a6687ea72c2b79e93821a8cf149a45241edb0b071dab4e77591-md.png)

**Füge Übergänge hinzu (falls nötig):**

Damit das Video professionell wirkt, füge zwischen den Clips Übergänge hinzu:

1. Klicke auf den Bereich zwischen zwei Clips
2. Wähle einen Übergang (z.B. "Fade", "Dissolve" oder "Slide")
3. Stelle die Übergangsdauer auf 0,5-1 Sekunde

![Screenshot 2026-01-22 at 4.38.42 PM.png](https://assets.skool.com/f/6a6dac89fb09458fa4ec8ffbcdfc8dd5/c5b2b4d0ac924880a3c4e5e70152b692e40267d56a22477abfd05da68bf92ae8.png)

**Füge Musik hinzu:**

Ein gutes Video braucht Musik! CapCut hat eine eingebaute Musikbibliothek:

1. Klicke auf "Music" oder "Audio"
2. Wähle eine passende Hintergrundmusik (z.B. "Modern", "Uplifting", "Corporate")
3. Ziehe die Musik in die Audio-Spur
4. Passe die Lautstärke an (sollte im Hintergrund sein, nicht zu laut)

Alternativ kannst du die Musik auch später in den Social Media Apps hinzufügen, oder deine eigene in CapCut hineinziehen.

![Screenshot 2026-01-22 at 4.39.32 PM.png](https://assets.skool.com/f/6a6dac89fb09458fa4ec8ffbcdfc8dd5/20b1b9a3f3d34a8da3e4e6c4439a2201f9b46d9f2cfe424fa35e05b14793574e-md.png)

**Exportiere das finale Video:**

1. Klicke auf "Export" oder "Download"
2. Wähle die Qualität: 1080p (Full HD) ist optimal
3. Klicke auf "Export"
4. Warte, bis das Video heruntergeladen ist

**Fertig! Du hast dein erstes professionelles Transformations-Video erstellt! 🎉**

**Zeitaufwand**: Ca. 20-30 Minuten.

**💡 Pro-Tipp:** Erstelle mehrere Versionen deines Videos mit unterschiedlichen Musikstücken und Schnittgeschwindigkeiten. Poste beide und schau, welche besser performt. Dann optimiere zukünftige Videos basierend auf diesen Erkenntnissen.  


## 💡 Tipps, Tricks & Pro-Tipps

### **Tipp 1: Der Custom GPT ist dein bester Freund**

Nutze den "Floor Transformation" Custom GPT nicht nur für Wohnzimmer. Du kannst ihn für beliebige Räume nutzen. Der GPT ist so mächtig, dass er automatisch die besten Prompts generiert. Das ist der Unterschied zwischen mittelmäßig und viral!

### **Tipp 2: Mehrere Varianten erstellen**

Du hast 2-3 Stunden Zeit? Erstelle 2-3 verschiedene Varianten desselben Videos:

**Variante 1:** Schnelles, dynamisches Video (für TikTok/Reels)**Variante 2:** Langsames, entspannendes Video (für YouTube)**Variante 3:** Mit Text-Overlays und Bauschritte-Labels

Warum? Weil verschiedene Plattformen verschiedene Formate brauchen, und du so deine Chancen auf Viralität maximierst.

### **Tipp 3: Nutze Trending Sounds**

Auf TikTok und Instagram Reels funktionieren Videos mit Trending Sounds besser. Schau, welche Sounds gerade viral gehen, und nutze sie in deinen Videos. Das erhöht deine Chancen auf Millionen von Views massiv!

### **Tipp 4: Optimiere für verschiedene Plattformen**

**YouTube:** 16:9 Format, 60+ Sekunden, detailliert**Instagram Reels:** 9:16 Format, 15-30 Sekunden, schnell geschnitten**TikTok:** 9:16 Format, 15-60 Sekunden, mit Trending Sounds**Facebook:** 16:9 oder 1:1 Format, mit Untertiteln

CapCut hat automatische Formate für alle Plattformen – nutze das!

### **Tipp 5: Text-Overlays für mehr Engagement**

Füge Text-Overlays hinzu, um mehr Engagement zu generieren:

"Rohbau""Elektrik & Leitungen""Bodenbelag""Fertig!""Jetzt besichtigen!"

Menschen lesen gerne Text, während sie Videos schauen. Das erhöht die Verweildauer!  
  


## ⚠️ Häufige Fehler (und wie du sie vermeidest)

### **Fehler 1:** Den GPT nicht richtig nutzen

**Problem**: Du gibst dem GPT zu wenig Informationen und bekommst mittelmäßige Prompts.

**Lösung**: Je detaillierter du dein Projekt beschreibst, desto bessere Prompts generiert der GPT. Lass dir Zeit bei diesem Schritt!

### Fehler 2: Unrealistische Erwartungen

**Problem**: Du erwartest, dass KI-generierte Bilder zu 100% perfekt sind.

**Lösung**: KI ist nicht perfekt. Manchmal brauchst du mehrere Versuche. Das ist normal! Nutze die Regenerate-Funktion und passe den Prompt an.

### Fehler 3: Zu lange Videos

**Problem**: Dein Video ist 5 Minuten lang und Menschen schauen nach 30 Sekunden weg.

**Lösung**: Halte Videos kurz und prägnant. 30-60 Sekunden ist ideal für Social Media. Alles über 2 Minuten verliert schnell an Aufmerksamkeit.

### Fehler 4: Schlechte Musik

**Problem**: Du nutzt urheberrechtlich geschützte Musik und dein Video wird gelöscht.

**Lösung**: Nutze nur lizenzfreie Musik von vertrauenswürdigen Plattformen wie CapCut, YouTube Audio Library oder Epidemic Sound.

### Fehler 5: Keine Call-to-Action

**Problem**: Dein Video ist schön, aber Menschen wissen nicht, was sie tun sollen.

**Lösung**: Füge am Ende einen klaren Call-to-Action hinzu: "Jetzt besichtigen!", "Link in Bio", "Kontaktiere uns!", etc.  
  


## 🎯 Wofür du diese Videos nutzen kannst – Und es geht über Renovierungen hinaus!

Dieser Videostil ist absolut vielseitig. Hier sind die besten Use Cases:

**🏠 Renovierungen & Umbauten:**

Makler-Marketing: Alte Räume → renoviert. Investoren-Pitches: Potenzial zeigen. Listing-Videos: Bevor & After für Verkaufsangebote. Renovierungs-Dokumentation.

**🏢 Interior Design & Architektur:**

Innenarchitekten: Alte Räume → modern designt. Möbelhäuser: Vorher-Nachher mit Einrichtung. Handwerksbetriebe: Showcase ihrer Arbeiten. Architektur-Portfolios: Visualisierung von Projekten.

**🏪 Retail & E-Commerce:**

Laden-Renovierungen: Alt → Modern. Produktplatzierungen: Raum ohne → mit Produkt. Store-Eröffnungen: Baustelle → fertiger Shop. Visual Merchandising.

**🚗 Automotive & Detailing:**

Auto-Detailing: Dreckiges Auto → glänzend. Restauration: Rostiger Oldtimer → Showroom-Zustand. Tuning-Shops: Vorher-Nachher Fahrzeuge.

**💼 B2B & Corporate:**

Office-Renovierungen: Alte Büros → modern. Fabrik-Modernisierungen: Alt → High-Tech. Workspace-Design: Transformation von Arbeitsräumen.

**💡 Pro-Tipp: Der Algorithmus liebt Transformations-Content! Egal in welcher Nische – diese Videos performen meist extrem gut, weil sie Aufmerksamkeit halten und eine klare Story erzählen. Nutze das! 🚀**  
  


## 🚀 Deine nächsten Schritte: Jetzt wird''s ernst!

Du hast alles gelernt, was du brauchst. Jetzt ist es Zeit, es selbst zu machen. Hier ist dein Action-Plan:

1. Sammle eine Raum-Idee, die du videografieren möchtest. Das kann eine Renovierung sein, ein Umbau, oder eine Innenausstattung.
2. Nutze den "Floor Transformation" Custom GPT, um die Prompts zu generieren. Speichere sie in einem Dokument.
3. Generiere die Bilder mit Nano Banana Pro. Speichere alle Bilder für die verschiedenen Baustadien.
4. Generiere die Videoclips mit Veo3. Speichere alle Videos.
5. Schneidet alles in CapCut zusammen. Exportiere dein finales Video.
6. Poste dein Video auf allen Plattformen. Nutze dabei relevante Hashtags: #Renovierung #Transformation #RoomMakeover #BeforeAfter #KI #AIVideo

## 🔥 Das ist dein Moment!

Du hast jetzt alles, was du brauchst, um professionelle Transformations-Videos zu erstellen. Mit dem Custom GPT ist es so einfach wie nie zuvor. Keine Geisteskraft nötig – nur kopieren und einfügen!

Die einzige Frage ist: Wirst du es machen?

Hier ist, was ich von dir erwarte:

✅ Diese Woche: Erstelle und Poste dein erstes Video nach diesem Tutorial.

✅ Bleib dran: Erstelle jede Woche ein weiteres Video und beobachte, wie deine Reichweite wächst.

**Und dann?** Teile dein Ergebnis in der Community! Poste einen Screenshot deiner Views, deiner Engagement-Rate, oder deiner Kommentare. **Ich will sehen, dass du es machst!**  
  


## 📞 Fragen? Probleme?

Wenn du Fragen hast oder nicht weiterkommst:

1. Poste in der Community: Wir und die Community helfen dir!
2. Schau die Video-Tutorials an: Im KI Marketing Club findest du Video-Tutorials zu jedem Tool.

## 🚀 Viel Erfolg!

Ich freue mich, deine Videos in der Community zu sehen. Mach dich bereit, und lass deine Reichweite explodieren!

LET’S GO!', 13, 35 FROM public.course_modules WHERE slug = 'ki-content-erstellung';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', 'Mini Bonus: Speed Ramp Transitions mit KI 🚤', '', 14, 0 FROM public.course_modules WHERE slug = 'ki-content-erstellung';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', 'Perfekte Seedance 2.0 Prompts ⭐️', 'Seedance 2.0 ist aktuell auf einem komplett anderen Level, wenn es um KI-Videos geht.

👉 Du kannst Szenen extrem genau steuern  
👉 Die KI hält sich sehr penibel an deine Vorgaben  
👉 Und genau das ist der Punkt:

**Dein Output ist nur so gut wie dein Prompt.**

Und hier kommt das Problem:  
Die meisten schreiben viel zu ungenau → und verschenken damit massiv Potenzial...und bares Geld! ❌

---

## 🔥 Lösung: Claude Skill (Gamechanger)

Wir haben euch dafür einen **Claude Skill gebaut**, der euch dabei hilft,  
**strukturierte, saubere und wirklich starke Seedance Prompts zu schreiben.**

👉 Du denkst nicht mehr „was soll ich schreiben?“  
👉 Du bekommst direkt eine klare Shot-Struktur  
👉 und deutlich bessere Ergebnisse

💥 Das Ding spart euch extrem viel Zeit und bringt euch schneller zu richtig guten Outputs.

---

## ⚙️ Installation

1. Skill-Datei runterladen
2. In Claude auf **Anpassen**
3. **Skills** auswählen
4. Auf **+** klicken
5. **Skill erstellen**
6. **Skill hochladen**
7. Datei auswählen

👉 Danach im Chat einfach "**/"** eingeben → Skill auswählen

---

## ⚠️ Wichtige Hinweise

👉 Claude schreibt oft erstmal auf Deutsch  
→ einfach sagen: „auf Englisch bitte“

👉 Nur das hier verwenden:  
**Shot 1 bis z. B. Shot 8 kopieren**

❌ Rest ignorieren  
✅ Nur die Shot-Struktur in Seedance einfügen

---

### ⬇️ HIER DER CLAUDE SKILL ⬇️', 1, 0 FROM public.course_modules WHERE slug = 'seedance';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', 'Videos von dir in Seedance 2.0?! 🔥', '', 2, 0 FROM public.course_modules WHERE slug = 'seedance';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', 'Meine Top Herr Tech Seedance Prompts 🎨', '', 3, 0 FROM public.course_modules WHERE slug = 'seedance';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', 'Vergiss ChatGPT. Hier kommt Claude.', '', 1, 0 FROM public.course_modules WHERE slug = 'claude';

DO $$
DECLARE
  v_module_id UUID;
  v_chapter_id UUID;
BEGIN
  SELECT id INTO v_module_id FROM public.course_modules WHERE slug = 'claude';

  INSERT INTO public.module_chapters (module_id, title, description, sort_order)
  VALUES (v_module_id, 'Claude Code', '', 1)
  RETURNING id INTO v_chapter_id;

  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'zh37bstbuy', '🤖 Claude Code aufsetzen', 'Was wäre, wenn Du ab heute keinen Entwickler mehr brauchst – und trotzdem alles bauen kannst, was Du willst? 🤯

(Den kompletten PDF-Guide findest du ganz unten ⬇️🤫)

---

🔥 Was ist Claude Code überhaupt?

Vergiss alles, was Du über KI-Tools bisher weißt.

Claude Code ist kein Chatbot. Claude Code ist dein KI-Mitarbeiter – der direkt auf deinem Rechner sitzt, deine Dateien kennt und einfach loslegt. Ohne Wartezeit, ohne 5-stellige Entwicklerrechnung. 💸

Stell dir vor, du hast einen super fähigen Praktikanten neben dir, der in normaler Sprache versteht was Du willst – er öffnet Dateien, liest PDFs, räumt den Desktop auf, sortiert Fotos, analysiert Excel-Tabellen, baut nebenbei eine Website. Und das Beste: Null Programmierkenntnisse nötig.

---

⚙️ So richtest Du es ein – die Desktop App

Anthropic hat im April 2026 eine komplett neue Desktop App released. Kein Terminal, kein Gefummel. Einfach App herunterladen und loslegen.

**Was Du brauchst:** Einen bezahlten Claude Plan (Pro ab ca. 20€/Monat) und 5 Minuten Zeit.

1️⃣ Desktop App herunterladen: [claude.com/download](http://claude.com/download) 

2️⃣ Installieren und starten 

3️⃣ Mit Claude-Konto anmelden – einmalig, dann nie wieder 

4️⃣ Oben auf den Tab **„Code"** klicken – das ist er 

5️⃣ Einen Ordner auswählen – Claude sieht nur was darin liegt, Du behältst die Kontrolle 

6️⃣ Fertig. Ab jetzt nur noch in normaler Sprache tippen.

**Nur Windows:** Einmalig Git installieren unter [git-scm.com/download/win](http://git-scm.com/download/win) – alles durchklicken, fertig.

---

🚀 Was Du damit machen kannst

📁 **Dateien & Ordner** – Desktop aufräumen, PDFs zusammenfassen, Rechnungen in Excel extrahieren, Fotos sortieren

📝 **Content** – Blog-Artikel, Newsletter, Instagram-Posts, Landing Pages, Präsentationen

⚙️ **Automatisieren** – Eigene Tools bauen, wiederkehrende Aufgaben automatisieren, Online-Tools anbinden

🔍 **Analyse** – Verkaufsdaten auswerten, Verträge prüfen, Meeting-Notizen zusammenfassen

Das ist nur ein Auszug. Alles was Du mit Dateien, Texten, Daten und Tools zu tun hast – Claude Code kann''s.

---

💡 Die wichtigsten Tipps für den Alltag

✅ Sei konkret: *„Räum meinen Desktop auf. Sortier Bilder in Bilder, PDFs in Dokumente. Lösch nichts."* 

✅ Iteriere einfach weiter: *„Nochmal – diesmal kürzer"* 

✅ Screenshot-Trick: Fehler? Screenshot ins Eingabefeld ziehen, „Fix das" schreiben – löst 9 von 10 Problemen sofort 

✅ [CLAUDE.md](http://CLAUDE.md) anlegen – Projektregeln einmal reinschreiben, Claude liest sie vor jeder Aufgabe automatisch 

✅ Playground-Ordner erstellen für die ersten Tests – da kann nichts kaputtgehen was wichtig ist

Und der wichtigste Tipp: Du musst nichts auswendig lernen. Beschreibe einfach was Du willst. Claude Code findet die Lösung.

---

🧠 Die wichtigste Erkenntnis

🚀 **Software ist kein limitierender Faktor mehr.**

Wer eine Idee hat, kann sie heute selbst umsetzen. Kein Entwickler-Team, keine Wartezeiten, keine Ausreden.

💥 Den kompletten Guide mit Action-Plan, Prompts zum direkten Loslegen und allen Schritten findet ihr im Anhang. Runterladen. Jetzt. Sofort. 👇', 1, 745);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, '34kt327vre', '🔌 CC – Connectors & MCP', '', 2, 645);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'MISSING___', '🎬 CC editiert meine Videos', '', 3, 0);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'MISSING___', '🎠 KI-Karussell-Generator', '', 4, 0);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'umdsce8iz8', '🎬 Herr Tech Video Creator', '', 5, 980);
END $$;


DO $$
DECLARE
  v_module_id UUID;
  v_chapter_id UUID;
BEGIN
  SELECT id INTO v_module_id FROM public.course_modules WHERE slug = 'claude';

  INSERT INTO public.module_chapters (module_id, title, description, sort_order)
  VALUES (v_module_id, 'Claude Cowork', '', 2)
  RETURNING id INTO v_chapter_id;

  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'MISSING___', '🖥️ Claude Cowork – Dein persönlicher Agent', '', 1, 0);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'MISSING___', '🗂️ Claude Cowork + Obsidian', '', 2, 0);
END $$;


DO $$
DECLARE
  v_module_id UUID;
  v_chapter_id UUID;
BEGIN
  SELECT id INTO v_module_id FROM public.course_modules WHERE slug = 'claude';

  INSERT INTO public.module_chapters (module_id, title, description, sort_order)
  VALUES (v_module_id, 'Claude Skills', '', 3)
  RETURNING id INTO v_chapter_id;

  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'MISSING___', '🧠 Claude Skills – Einmal kurz erklärt', '', 1, 0);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'MISSING___', '🧡 Flo`s Skills Sammlung', '', 2, 0);
END $$;

INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', '00 - Das KI Vertriebs Cheat Sheet 💶🛠️', '![1700810480584.jpeg](https://assets.skool.com/f/6a6dac89fb09458fa4ec8ffbcdfc8dd5/253480fbcba6478ab044d3d15f1543b1ff9a45b5deb34c93833fa16a2fdb98a6-md.jpg)

Bevor es ans Eingemachte geht: Hier im **PDF** findest du eine strukturierte Übersicht, wie du dir Schritt für Schritt ein **funktionierendes KI-Vertriebssystem** aufbaust. 💸

✅ Die 3 Kernschritte von Ansprache bis Conversion  
✅ Die wichtigsten KI Tools im Sales  
✅ Bonus-Tools für E-Mail, LinkedIn & Co.  
✅ Aktuelle Use Cases, an denen wir gerade arbeiten (z. B. GPT-Agent für Lead-Qualifizierung)

**Nutz die Power dieses einzigartigen KI Zeitalters! Das wird richtig, richtig groß! 🤯**

Hast du Bock? 🥳

**LET`S GO!!! 🦾**', 1, 0 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'gdtrbk5yxx', '01 - Sales und KI - Einführung', '', 2, 532 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'n38b89ne35', '02 - Laserfokus auf Leadgenerierung', '', 3, 1047 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'vfhrchji80', '03 - Erfolgreiche Telefonakquise', '', 4, 2100 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 't3e52tonut', '04 - E-Mail Marketing Strategien', '', 5, 964 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'tw16uc8zwu', '05 - Kunden finden mit LinkedIn', '', 6, 1302 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'u9yezgzue5', '06 - Daten exportieren mit Phantombuster', '', 7, 671 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'i3li8tgnjr', '07 - Datendownload mit Waalaxy', '', 8, 1128 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '44ckq7qzac', '08 - Vergleich von E-Mail-Finder-Tools', '', 9, 1443 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'rzmxuzkdhv', '09 - E-Mail-Akquise mit Reply IO und Valaxie', '', 10, 1439 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'lub9pu6wam', '10 - Strategien für Kaltakquise auf Linkedin', '', 11, 1157 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'lec0lvmtgt', '11 - Strategien für erfolgreiche Kampagnen', '', 12, 1253 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '5x4uo1da2m', '12 - Trigify', '', 13, 346 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'dhjm7i4sec', '13 - Kunden überzeugen', '', 14, 2536 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'k27rvc9455', '14 - Den Sack zumachen', '', 15, 1872 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', '15 - Das Sales Funnel Cheat Sheet', '', 16, 0 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'pcei207wk4', 'Das Wundertool Fonio', '## 📞 *„Nie wieder selber ans Telefon!“*

**Die Revolution im Kundenkontakt dank ****[Fonio.ai](http://Fonio.ai)**

Stell dir vor:  
Du gehst **nie wieder selbst ans Telefon** – und trotzdem werden deine Kunden **sofort bedient**, **Fragen beantwortet** und sogar **Verkäufe abgeschlossen**.

Genau das macht **[Fonio.ai](http://Fonio.ai)** möglich.  
Und das **in perfektem Deutsch**. 🇩🇪💥  
(Spoiler: Es ist das **erste Tool**, das wirklich natürlich & professionell klingt.)

---

### 🤖 Was Fonio für dich übernimmt:

✅ **Gespräche mit Kunden führen**  
✅ **Fragen beantworten – 24/7**  
✅ **Zugriff auf Kalender, CRM & Co.**  
✅ **Verkaufsgespräche führen & Links verschicken**  
✅ **Rabattcodes & individuelle Infos automatisiert senden**  
✅ **Termine vereinbaren – ohne dein Zutun**

**Und das Beste:**  
Du brauchst dafür **keine Technikkenntnisse** – es ist super simpel aufzusetzen!

---

### 💬 Probier’s jetzt live:

📞 **Ruf meinen persönlichen KI-Klon kostenlos an:**  
**+49 30 83795343**

Hör dir selbst an, wie gut das funktioniert.  
Und mit dem Code **„klon50“** bekommst du **50 € Rabatt**! 💸', 1, 349 FROM public.course_modules WHERE slug = 'ki-telefonie';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'plll1dyhji', 'Plattform Tutorial mit Daniel', '', 2, 174 FROM public.course_modules WHERE slug = 'ki-telefonie';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '3thohhw2iw', 'Rechtliche Grenzen von KI', '', 1, 861 FROM public.course_modules WHERE slug = 'rechtliche-grenzen';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'hili1jsgvo', 'Viralen Content finden & Content Automatisierung', '**🧠 *****1. Die Content-Krise: Warum die meisten keine Relevanz aufbauen***

Die meisten Creator haben nicht zu wenig Ideen.

Sie haben zu viele schlechte.

Oder sie posten ohne Strategie.

→ Ergebnis: **Keine Konsistenz, keine Reichweite, kein Umsatz.**

💥 Content zu finden ist keine Kunst – *wenn du weißt, wo du suchst.*

Und genau das schauen wir uns jetzt an.

** 🔍 *****2. Die 3 Wege, um viral-relevanten Content zu finden***

- ***A. Doomscrolling (Random)***

- Kann funktionieren

- Aber ist Glück und Zeitfresser

- Kein System = keine Skalierung

- ***B. Plattform-Suche (Smart)***

- TikTok/Youtube-Suche mit Filtern nutzen

- Auf „Likes“, „kommentiert“, „neu“ sortieren

- Stichwort + „last 7 days“ = Boom 💣

- ***C. GPT Task Automation (Next Level)***

- **[ChatGPT Tasks](https://chatgpt.com/tasks)** nutzen:

Hier zeige ich, wie du mit der neuen ChatGPT Funktion „Tasks“ automatisch jeden Morgen tagesaktuelle Ideen, aber auch virale Hits aus deiner Branche an deine Mail und dein Handy bekommst.

- Täglich morgens 3 virale Ideen + Skripte

- Option 1: „Was ist aktuell im KI-Trend?“

- Option 2: „Welche viralen Videos zu KI hatten in den letzten 14 Tagen die meiste Interaktion?“

    → Dazu direkt 3 Skriptversionen erstellen lassen

**🛠️ *****3. Vom Impuls zur Umsetzung – Contentproduktion automatisieren***

***Option 1: Selbst einsprechen (Schnell & Authentisch)***

- 20 € Amazon-Teleprompter

- Kein Schnitt, kein Aufwand

- Gutes Licht, ruhiger Hintergrund → fertig

- Optionale Caption-App: Captions (kostet, aber mega) oder direkt TikTok (kostenlos)

***Option 2: KI-Klon (Skalierbar & schnell)***

- **[Heygen](https://app.heygen.com/)**

- 2 Minuten Sprachaufnahme → Avatar

- Du gibst nur noch Text ein → 100 Videos in 1 Tag möglich

- Vorteil: Masse & Evergreen-Distribution

***Option 3: Eigener KI Influencer***

- Komplett eigener Avatar → kein Limit

- Kann in verschiedenen Sprachen posten

- Ideal für Brand-Aufbau

- Patrick zeigt den ganzen Prozess in seiner Club-Lektion (Anschauen!)

**📈 *****4. Viraler Content ≠ Zufall – es ist Mathe***

> Je mehr Videos du raushaust, desto höher deine Lottochance

> Jedes Video = 1 Ticket für Viralität, Leads, Sales

💡 Und mit KI kannst du 100+ Tickets pro Monat erstellen

→ OHNE Team

→ OHNE Kamera

→ OHNE Ausreden

**💥 *****5. Abschluss dieses Kapitels: Dein Content-System steht, wenn...***

✅ Du täglich 3 Ideen automatisch bekommst

✅ Du jede Hook in 5 Minuten in Video verwandelst

✅ Du  < 30 Minuten am Tag für Output brauchst

✅ Du 1 Avatar losschickst – aber wirkst wie ein ganzes Mediateam

**Abschluss-Gedanken:**

Denk daran: 1 Content Piece ist nicht eine Plattform, sondern 5!

🔥 Für schnelle Verteilung nutze **[Buffer](https://buffer.com/)**!', 1, 1781 FROM public.course_modules WHERE slug = 'viraler-content';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '8ftb0fko2h', 'Viral gehen mit Veo3 🥳', '', 1, 1719 FROM public.course_modules WHERE slug = 'veo3';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '28ru5k53qu', 'Perfekter Veo3 Content durch Prompting', '# Veo3 Prompting Masterclass

## 🚀 Das Geheimnis hinter 10 Millionen Views

WAHNSINN! In nur 2 Monaten von 0 auf über 50.000 Follower mit Mr. Techno - und das alles nur mit Veo3-Videos! 🔥

Die krassen Zahlen:

•📈 26.000 TikTok-Follower in 2 Monaten

•📱 25.300 Instagram-Follower

•🎯 **[10 Millionen Views bei diesem Video](https://www.tiktok.com/@mr.tchno/video/7538123729599991062)**

•⏱️ Maximal 10 Minuten pro Video (inklusive Ideenfindung!)

Und pssst....für Monetarisierung bei Mr. Tech sind Veo3 Videos auch Heaven (mehr dazu in den nächsten Kapiteln).

## 🎯 Die 7-Elemente-Formel für perfekte Veo3-Videos

Das ist die elementare Formel, die fast schon garantiert, dass eure Veo3-Videos eine sehr hohe Qualität haben! 💪

### 1. 🎨 Stil - Die visuelle DNA

•Cinematisch, ultra-realistisch, Comic, Manga - definiere den Look!

•Entscheidet über die Atmosphäre eures Videos

•Wichtig: Vorher festlegen, welchen Stil ihr wollt

### 2. 👤 Subjekt - Das Herzstück

•Nicht nur "ein Mann" - sondern detailliert beschreiben!

•Alter, Aussehen, Kleidung, Haarfarbe, Körperbau - alles definieren

•Warum? Sonst generiert die KI immer unterschiedliche Personen

### 3. 🎬 Aktion - Die Bewegung

•Was passiert genau im Video?

•Nicht nur statisch - sondern viel Bewegung reinbringen!

•Beispiel: Nicht nur "erklärt ein Konzept" → "erklärt ein Konzept mit Handgesten"

### 4. 🏢 Setting - Die Umgebung

•Muss zum Subjekt passen (Mann im Anzug → modernes Büro ✅)

•Wichtiger Trick: Wählt Settings, die schon oft gefilmt wurden

•Warum? Veo3 hat mehr Trainingsmaterial = bessere Ergebnisse

### 5. 📹 Technik & Kamera

•Kamera-Haltung: Handheld, statisch, Drohnenaufnahme?

•Beleuchtung: "Warm golden hour lighting" macht alles professioneller

•Gibt dem Video das gewisse Etwas! ✨

### 6. 😊 Emotionen - Die Seele des Videos

•Extreme Emotionen funktionieren am besten

•Angst, Freude, Trauer - Menschen reagieren auf Emotionen!

•Gesichtsausdrücke genau definieren

### 7. 🗣️ Sprache/Voice-Over

•Prompt bleibt auf Englisch - nur gesprochener Text auf Deutsch

•"Says in German:" + deutscher Text

•Wichtig: Deutscher Anteil muss gering bleiben

•Keine Sonderzeichen außer Punkt, Komma, Ausrufe-/Fragezeichen!

## ⚠️ 5 tödliche Prompting-Fehler

### ❌ Fehler 1: Zu vage sein

•Schlecht: "Ein Mann im Büro"

•Besser: Detaillierte Beschreibung aller 7 Elemente

### ❌ Fehler 2: Keine spezifischen Anweisungen

•Videos werden langweilig und generisch

•Lösung: Jedes Element genau definieren

### ❌ Fehler 3: Falsche Sprache

•Deutscher Text muss korrekt eingebunden werden

•Format: "Says in German: [deutscher Text]"

### ❌ Fehler 4: Sonderzeichen im Text

•Gedankenstriche (-) lassen die Person "stöhnen"

•Nur Punkt, Komma, !, ? verwenden

### ❌ Fehler 5: Unrealistische Settings

•Widersprüchliche Kombinationen vermeiden

•Auf bekannte Szenarien setzen

## 🔥 Fast vs. Quality: Der Qualitäts-Vergleich

ÜBERRASCHUNG! Fast Generation ist oft genauso gut wie Quality! 🤯

Die Vorteile von Fast:

•⚡ Wesentlich schneller

•💰 Viel günstiger (bei Ultra: unbegrenzt!)

•🎯 Teilweise sogar bessere Ergebnisse

Empfehlung: Nutzt Fast Generation - spart Zeit und Geld! 💪

## 🛠️ JSON-Prompts: Der Game-Changer

Was sind JSON-Prompts?

•Strukturierte Darstellung des normalen Prompts

•Aufgeteilt in: Szene, Visuelles, Kamera, Subjekt, Hintergrund, Beleuchtung, Audio

•Für Veo3 oft besser verständlich

Die Vorteile:

•🎯 Präzisere Ergebnisse

•✏️ Einfacher zu bearbeiten (einzelne Bereiche anpassen)

•🎬 Cinematischere Aufnahmen

•💎 Mehr Details und "Liebe" im Video

Wann nutzen?

•Besonders bei cinematischen Aufnahmen

•Wenn normale Prompts nicht die gewünschten Ergebnisse liefern

•Für professionellere Videos

## 📋 Der perfekte Workflow

### Schritt 1: Planung

•Alle 7 Elemente vor der Erstellung definieren

•Nicht alle selbst ausformulieren - KI nutzen!

### Schritt 2: Prompt-Erstellung

•Detailliert und ausführlich schreiben

•Englisch mit deutschen Textpassagen

•Bei Bedarf JSON-Format verwenden

### Schritt 3: Generierung

•Fast Generation wählen

•Hochformat (9:16) für Social Media

•Mehrere Varianten testen

### Schritt 4: Optimierung

•Metriken analysieren

•Erfolgreiche Elemente wiederholen

•Kontinuierlich verbessern

## 🎯 Pro-Tipps für maximalen Erfolg

### Format-Einstellungen:

•16:9 für Querformat

•9:16 für Hochformat (Social Media!)

•Anfangsbilder müssen im gleichen Format sein

### Modell-Auswahl:

•Veo3 Fast für die meisten Anwendungen

•Veo3 Quality nur bei speziellen Anforderungen

•Veo2 vermeiden (schlechtere Qualität)

### Video aus Frames:

•Anfangsbild hochladen für mehr Kontrolle

•Midjourney-Bilder im richtigen Format erstellen

•Konsistente Charaktere möglich

## 🚀 Dein Aktionsplan

### Sofort starten:

1.7-Elemente-Formel verinnerlichen

2.Ersten detaillierten Prompt schreiben

[3.Fast](http://3.Fast) Generation testen

4.JSON-Prompts ausprobieren

### Diese Woche:

1.10-20 Videos erstellen und testen

2.Erfolgreiche Prompts dokumentieren

3.Verschiedene Stile ausprobieren

4.Metriken verfolgen

### Diesen Monat:

1.Eigenen Stil entwickeln

2.Viral-Potenzial maximieren

3.Systematisch skalieren

[4.Community](http://4.Community) aufbauen

## 💡 Key Takeaways

✅ Detaillierte Prompts sind der Schlüssel zum Erfolg 

✅ Fast Generation reicht völlig aus 

✅ JSON-Prompts für cinematische Qualität 

✅ 7-Elemente-Formel garantiert bessere Ergebnisse 

✅ Kontinuierliches Testen und Optimieren

Remember: Mit der richtigen Prompting-Strategie könnt ihr planbar virale Videos erstellen! 🔥

LET''S GO! 🚀', 2, 1442 FROM public.course_modules WHERE slug = 'veo3';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'nlxer2t5ot', 'Der 5-Minuten-Produktions-Workflow', '', 3, 890 FROM public.course_modules WHERE slug = 'veo3';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'f33ulzue83', 'Lipsync mit VEO3 – sprechende KI Influencer', '', 4, 779 FROM public.course_modules WHERE slug = 'veo3';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '039tbiqxpg', 'Viral gehen mit Sora 2', '', 1, 635 FROM public.course_modules WHERE slug = 'sora-2';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'yecbgy7vn7', 'SETUP Tutorial: Sora 2 mit eigenem Gesicht nutzen', '# **🚀 So könnt ihr SORA2 mit eurem eigenen Gesicht nutzen (Cameo Funktion) – Das Setup Tutorial**

Sora 2 ist endlich da! Das KI-Tool von OpenAI, das aus Text beeindruckende Videos erstellt. 

**Aber das Beste: **Du kannst jetzt nicht nur normale KI-Videos erstellen, sondern auch **Videos mit deinem eigenen Gesicht produzieren** – dank der neuen Cameo-Funktion. Schau dir das [Instagram Video](https://www.instagram.com/p/DPwpTE0iK0k/) an. Ich bin zurück in den 90ern!

Oder [hier](https://www.instagram.com/reel/DPw2j2-iFMz/) als Olympiagewinner!  😂

![Bildschirmfoto 2025-10-14 um 10.24.38.png](https://assets.skool.com/f/6a6dac89fb09458fa4ec8ffbcdfc8dd5/2176feffc1c940b8a36095cfeab16da3d849d2d5adb745779deb9e8538c5c23a.png)

  
**Cameo** ist dein digitaler Zwilling, den du einmal aufnimmst und dann in beliebigen KI-generierten Szenen verwenden kannst. Stell dir vor: Du springst auf einem Wal durch die Wellen, tanzt auf einem Regenbogen oder surfst durch den Weltraum – alles mit deinem echten Gesicht!

**Das Problem**: Sora 2 ist offiziell in Deutschland noch nicht verfügbar. Aber mit dieser Anleitung umgehst du die Sperre und kannst sofort loslegen.

**👉 Hier geht''s direkt zu Sora 2**: [https://sora.chatgpt.com/](https://sora.chatgpt.com/)

**💬 Community-Beitrag mit Invite-Codes (Support & Austausch)**: [https://www.skool.com/ki-marketing-club/so-einfach-holt-ihr-euch-sora2-die-community-unterstutzt-sich](https://www.skool.com/ki-marketing-club/so-einfach-holt-ihr-euch-sora2-die-community-unterstutzt-sich)

**🤖 SORA 2 Prompt Assistant (Hilfe beim Erstellen von Prompts):** [https://chatgpt.com/g/g-68ecef2fc92481918d4996df6765189c-video-2-prompt-assistent](https://chatgpt.com/g/g-68ecef2fc92481918d4996df6765189c-video-2-prompt-assistent)

### **🧠 Schritt 1: Zugriff auf Sora aktivieren**

Gehe auf [https://sora.chatgpt.com/](https://sora.chatgpt.com/) Wenn du aus Deutschland bist, erscheint die Meldung: *"Sora is not available in Germany yet"*.

**So umgehst du die Sperre:**

Installiere einen VPN-Dienst (z.B. NordVPN – funktioniert sehr stabil)Kostenlose VPNs gehen theoretisch auch, kicken dich aber oft nach wenigen Minuten rausStelle den Standort auf **USA** oder **Kanada**Verbinde dich mit dem VPNLade die Sora-Seite neu

Jetzt sollte Sora verfügbar sein! Allerdings brauchst du noch einen **Invite-Code**, um tatsächlich reinzukommen.

### **🔑 Schritt 2: Invite-Code besorgen**

Sora 2 ist aktuell nur auf Einladung zugänglich. Jeder User, der bereits Zugriff hat, bekommt vier Invite-Codes, die er weitergeben kann.

**So kommst du an einen Code:**

Gehe auf diesen [Community-Beitrag.](https://www.skool.com/ki-marketing-club/so-einfach-holt-ihr-euch-sora2-die-community-unterstutzt-sich)Dort findest du verfügbare Invite-Codes von anderen MitgliedernFalls gerade keiner verfügbar ist, frage einfach in der Community nachSobald du selbst drin bist und deine eigenen Codes bekommst, teile sie mit der Community – so helfen wir uns gegenseitig!

Kopiere den Code, füge ihn auf der Sora-Seite ein und schon hast du Zugriff!

### **📱 Schritt 3: Die Sora-App aufs iPhone holen**

Der Browser-Zugang funktioniert, aber das wirklich Spannende passiert in der **iPhone-App** – denn nur dort kannst du dein eigenes **Cameo** erstellen. Das Problem: Die App ist noch nicht in Deutschland verfügbar.

**So installierst du die App trotzdem:**

1. Öffne den **App Store** auf deinem iPhone
2. Klicke oben auf dein **Profilbild → Name → Land oder Region ändern**
3. Wähle **USA** oder **Kanada**

**Wichtig**: Durch die Regionsänderung können aktive Abonnements beendet werden! Wenn du das vermeiden willst, erstelle einfach eine neue Apple-ID, melde dich von deiner aktuellen ab und mit der neuen an.

1. Klicke auf **Zustimmen**
2. Bei Zahlungsmethode wählst du "Keine"
3. Jetzt brauchst du eine US- oder Kanada-Adresse – google einfach "random USA address generator" und du bekommst eine zufällige Adresse mit PLZ und Telefonnummer
4. Gib die Daten ein und speichere

**Falls die App trotzdem nicht erscheint:**

Aktiviere den VPN auch auf deinem iPhone und wähle im VPN **United States** oder **Canada** als LandStelle sicher, dass du die **neueste iOS-Version** installiert hastSuche jetzt im App Store nach "**Sora**"Lade die App herunter

### **🎬 Schritt 4: Dein eigenes Cameo erstellen**

Jetzt kommt der coole Teil! **Cameo** ist dein digitaler Zwilling – eine KI-Version von dir, die du in beliebigen Videos verwenden kannst.

**So erstellst du dein Cameo:**

1. Öffne die Sora-App
2. Melde dich mit deinem OpenAI-Konto an
3. Klicke auf "**Cameo hinzufügen**"
4. Gib der App Zugriff auf **Kamera** und **Mikrofon**
5. Lies ein paar Zahlen vor, die dir angezeigt werden
6. Drehe deinen Kopf dabei leicht nach **links, rechts und oben**
7. Nach etwa einer Minute ist dein digitaler Zwilling fertig!

Falls das Ergebnis nicht perfekt ist, kannst du die Aufnahme einfach wiederholen.

**Freigabe-Einstellungen**: Du kannst wählen, wer dein Cameo verwenden darf:

**Nur du** (privat)**Freunde**, die du freigibst**Alle** (öffentlich – dann bist du wahrscheinlich in 24 Stunden ein Meme 😅)

### **💡 Schritt 5: Eigene KI-Videos mit Sora erstellen**

Jetzt bist du startklar! Du hast Zugriff auf Sora im Browser und in der App, und dein Cameo ist erstellt.

**So erstellst du Videos:**

- Lass den **VPN im Browser** aktiviert – sonst verlierst du den Zugriff
- Wähle dein **Cameo** aus, indem du den Namen erwähnst (z.B. @**herrtech**)
- Schreibe einen **Prompt** – also eine Beschreibung, was in deinem Video passieren soll

![Bildschirmfoto 2025-10-14 um 09.45.49.png](https://assets.skool.com/f/6a6dac89fb09458fa4ec8ffbcdfc8dd5/93f476ca34454a6bb7cdbeb93708ef6cdf4dc05de59c41dcae5660e6d47b9786-md.png)

- Ihr könnt jetzt mit mir anstellen, auf was ihr lustig seid (Feel free to post on social media! Ich re-share alles! 😂).
- Sora erstellt das Video automatisch mit dir als Hauptfigur

**Format-Optionen:**

**Hochformat** (9:16) für Instagram Reels und TikTok**Querformat** (16:9) für YouTube

**Beispiele für Prompts:**

"Ich springe auf einem Wal durch die Wellen und einen Regenbogen""Ich tanze auf einem Vulkan während er ausbricht""Ich surfe auf einer Pizza durch den Weltraum"

Die Möglichkeiten sind nahezu grenzenlos! Aktuell sind die Content-Regeln noch ziemlich locker – also nutze die Chance und erstelle so viel absurden, kreativen Content wie möglich, solange es geht!

### **💡 Probleme mit Prompts?**

Du weißt nicht, wie du gute Prompts schreibst? Kein Problem! Nutze unseren [SORA 2 Prompt Assistant](https://chatgpt.com/g/g-68ecef2fc92481918d4996df6765189c-video-2-prompt-assistent).

### **🎬 Bonus:**

Du kannst auch Videos von mir (Herr Tech) erstellen lassen! Tagge einfach **@herrtech** als Cameo und sage SORA 2, was ich machen soll. Fertig! 😂

### **🔥 Wichtige Hinweise**

**VPN-Nutzung**: Der VPN muss für den Browser-Zugang dauerhaft aktiviert bleiben. Sobald du ihn ausschaltest, verlierst du den Zugriff auf Sora.

**App Store-Region**: Das Ändern der Region kann bestehende Abos beenden. Erstelle im Zweifel eine separate Apple-ID für die USA/Kanada.

**Community-Suppor**t: Nutze den Community-Beitrag nicht nur, um Codes zu bekommen, sondern auch um deine eigenen Codes zu teilen. Gemeinsam kommen wir alle schneller rein!

**Cameo-Qualität**: Je besser deine Aufnahme (gutes Licht, klare Aussprache, ruhige Kopfbewegungen), desto besser wird dein digitaler Zwilling.

Jetzt hast du alles, was du brauchst, um mit Sora 2 durchzustarten. Viel Spaß beim Erstellen deiner eigenen KI-Videos!

**Let''s Go! 🚀**', 2, 217 FROM public.course_modules WHERE slug = 'sora-2';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', 'SORA 2 Wasserzeichen Entfernen: Alle Methoden 🤩', '', 3, 0 FROM public.course_modules WHERE slug = 'sora-2';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'tyt6fzcazp', 'Konsistente Charaktere in SORA 2 erstellen:', '', 4, 717 FROM public.course_modules WHERE slug = 'sora-2';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'jm86ytfwdb', 'KI Agenten & Business Automatisierung Part 1', '', 1, 2228 FROM public.course_modules WHERE slug = 'ki-agenten';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', 'Deine 1. 5 KI Mitarbeiter - in Minuten erstellt 🤯', '', 2, 0 FROM public.course_modules WHERE slug = 'ki-agenten';

DO $$
DECLARE
  v_module_id UUID;
  v_chapter_id UUID;
BEGIN
  SELECT id INTO v_module_id FROM public.course_modules WHERE slug = 'ki-agenten';

  INSERT INTO public.module_chapters (module_id, title, description, sort_order)
  VALUES (v_module_id, 'ChatGPT Atlas', '', 1)
  RETURNING id INTO v_chapter_id;

  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'l8oz23u62i', 'Lektion 1: Atlas Setup & die ersten 3 Use Cases', '', 1, 503);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, '4lgvr6myev', 'Lektion 2: Trends, Profil & Lead-Generierung', '', 2, 318);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'v2uohx4zm7', 'Lektion 3: Agent Mode & Fortgeschrittene Use Cases', '', 3, 436);
END $$;


DO $$
DECLARE
  v_module_id UUID;
  v_chapter_id UUID;
BEGIN
  SELECT id INTO v_module_id FROM public.course_modules WHERE slug = 'ki-agenten';

  INSERT INTO public.module_chapters (module_id, title, description, sort_order)
  VALUES (v_module_id, 'Guides', '', 2)
  RETURNING id INTO v_chapter_id;

  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'MISSING___', 'Der ultimative Einsteiger-Guide für n8n', '', 1, 0);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'MISSING___', 'In 30 Tagen zum KI-Agenten-Profi', '', 2, 0);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'MISSING___', '30-Tage KI-Plan für Selbstständige & Agenturen', '', 3, 0);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'MISSING___', 'Deine persönlichen Automations-Coaches', '', 4, 0);
END $$;


DO $$
DECLARE
  v_module_id UUID;
  v_chapter_id UUID;
BEGIN
  SELECT id INTO v_module_id FROM public.course_modules WHERE slug = 'ki-agenten';

  INSERT INTO public.module_chapters (module_id, title, description, sort_order)
  VALUES (v_module_id, 'n8n Automatisierung', '', 3)
  RETURNING id INTO v_chapter_id;

  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'bd7oyb4m0x', 'Segment 1: Was dich erwartet', '', 1, 127);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'dvodawl23s', 'Segment 2: Was du lernen wirst', '', 2, 41);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'e7drmae081', 'Segment 3: Wieso n8n verwenden', '', 3, 160);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'wd2k0ztden', 'Segment 4: Wie n8n verwenden', '', 4, 120);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'ih927w1zul', 'Segment 5: n8n Hacks', '', 5, 61);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, '36atozxjnb', 'Segment 6: Tutorial – Newsletter Ideensammler', '', 6, 413);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, '86gxudamoe', 'Segment 7: Outro & Community', '', 7, 63);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'MISSING___', '2000+ n8n Automationen - Die Workflow Sammlung', '', 8, 0);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'ziqf43kiav', 'Tutorial: n8n Veo3 Video Agent', '', 9, 1067);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'edznz6ge0t', 'Tutorial: n8n Kaltakquise auf Autopilot', '', 10, 1464);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'f455gpiks5', 'Tutorial: Automated Social-Media Product-Content', '', 11, 1365);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'npx2e6vx6p', 'Tutorial: Automated Selfie-Video Content', '⚠️ Warnung: Das ist das komplizierteste Kapitel in diesem Classroom! Zunächst bitte in die anderen n8n Kapitel einarbeiten. Sobald du alle 7 Intro-Segmente der n8n Automatisierung und am besten noch ein paar einfache Workflows umgesetzt hast, bist du READY FÜR DIESES KAPITEL! 🤩

# **Schriftliches Tutorial zur Automatisierten Social-Media Talking-Head-Video Erstellung mit Google Nano Banana und Veo3**

## **🎯 Was du in diesem Tutorial lernst**

**Dein persönlicher Talking-Head-Videogenerator auf Autopilot**

In diesem Tutorial für den KI Marketing Club bauen wir einen vollautomatischen n8n-Workflow, der aus einem einfachen Selfie und ein paar Stichworten professionelle Social-Media-Videos generiert. Wir zeigen dir Schritt für Schritt, wie du aus einer Notion-Datenbank heraus eine Person per KI in ein neues Setting versetzt, sie animierst und einen viralen Kurzclip mit passender Caption erstellst – und das für jedes Setting und jeden Videostil. Du benötigst nur noch die Prompts zu optimieren.

Am Ende dieses Tutorials hast du einen funktionierenden Autopiloten, der dir die aufwändige Content-Erstellung für Talking-Head Social-Media-Videos abnimmt.

**Das praktische Ziel**

Das Ziel ist es, einen intelligenten Workflow zu schaffen, der aus einer einfachen Idee ein fertiges, animiertes Talking-Head-Video erstellt. Stell dir vor, du könntest für jede deiner Ideen mit einem Klick ein kurzes, dynamisches Video von dir erstellen lassen, ohne selbst vor der Kamera stehen zu müssen – genau das bauen wir heute.

**Die KI-Integrationen, die du meistern wirst:**

**Notion als Steuerzentrale:** Lerne, wie du n8n mit Notion verbindest, um deine Content-Pipeline zu verwalten.**OpenAI/GPT für kreative Prompts & Skripte:** Wir nutzen ein Sprachmodell, um aus wenigen Stichworten detaillierte Anweisungen (Prompts) für die Bild- und Videogenerierung sowie fertige Instagram-Captions zu erstellen.**Google Gemini für die Bildbearbeitung:** Wir zeigen dir, wie du ein Selfie von dir, eine Figur, oder ein Objekt mit KI in eine völlig neue Umgebung integrierst.**Cloudinary als kostenlosen Medienserver:** Lade deine generierten Bilder auf einen schnellen Server, um sie für den nächsten Schritt verfügbar zu machen.**Fal.ai für die Videoerstellung:** Das Herzstück. Wir verwandeln unser KI-Bild in ein dynamisches Talking-Head-Video – inklusive lippensynchronem Dialog, Sound und Animationen.

## **🤔 Warum Selfie-Content automatisieren?**

**Die Revolution im Personal Branding**

Guter Social Media Content, besonders mit persönlicher Note, ist der Schlüssel zum Erfolg, aber er ist auch extrem zeitaufwändig. Jeden Tag neue Ideen finden, vor der Kamera stehen, Videos schneiden – das bindet enorme Ressourcen. Was wäre, wenn du diesen Prozess zu 80 % automatisieren könntest? Genau das ermöglicht die Kombination aus n8n und den neuesten KI-Modellen.

**Vom n8n-Anwender zum Automatisierungs-Profi**

Dieses Tutorial richtet sich an alle, die bereits erste Erfahrungen mit n8n gesammelt haben. Wir tauchen tief in die API-Integration von KI-Diensten ein und zeigen dir, wie du einen mehrstufigen Workflow aufbaust, der echte, nutzbare Ergebnisse liefert. Wenn du dich noch nicht mit n8n auseinander gesetzt hast, schaue dir unbedingt als erstes die ersten 7 n8n Intro Segmente an.

**WICHTIG**

Für 100 % viralen Content → manuell starten. Am besten: Erst Formate finden, die performen – anschließend kannst du diese automatisieren.

## **📋 Vorbereitung: Accounts & API-Schlüssel**

Bevor wir loslegen, benötigen wir Accounts und API-Zugänge für verschiedene Dienste. Nimm dir kurz Zeit, diese Schritte sorgfältig durchzugehen. Die benötigten Dienste sind dieselben wie im Produkt-Content-Workflow:

1. **Notion (Unsere Datenbank):****Kosten:** Kostenlos für unseren Anwendungsfall.**Schlüssel bekommen:**1. Logge dich in deinen Notion-Account ein.
   2. Gehe zu [www.notion.so/my-integrations](http://www.notion.so/my-integrations).
   3. Klicke auf den großen Button **"+ New integration"**.
   4. Gib ihr einen Namen (z.B. "n8n Workflow") und klicke "Submit".
   5. Auf der nächsten Seite siehst du deinen **"Internal Integration Token"**. Klicke auf "Show" und dann "Copy". **Diesen Schlüssel brauchen wir gleich in n8n.**
2. **OpenAI (Unser kreativer Texter):****Kosten:** Kostenpflichtig (Pay-as-you-go).**Schlüssel bekommen:** Wir gehen davon aus, dass du bereits einen OpenAI-Account und ein Credential in n8n hast. Falls nicht, sieh dir die ersten 7 n8n Segmente im Marketing Club an, wo die Grundlagen erklärt werden.
3. **Google Gemini (Unser Bild-Editor):****Kosten:** Kostenpflichtig (Pay-as-you-go).**Schlüssel bekommen:**1. Gehe zu [aistudio.google.com](https://aistudio.google.com/) und logge dich mit deinem Google-Account ein.
   2. Klicke links auf den Button **"< > API key"**.
   3. Im neuen Fenster klickst du auf **"Create API-Key"**.
   4. Dein API-Schlüssel wird angezeigt. **Kopiere ihn und bewahre ihn sicher auf.**
4. **Cloudinary (Unser Bild-Hoster):****Kosten:** Kostenlos für unser Volumen.**Schlüssel bekommen:**1. Erstelle einen kostenlosen Account auf [cloudinary.com](http://cloudinary.com/).
   2. Nach dem Login landest du im **Dashboard**.
   3. Hier kannst du unter API Keys einen API Key erstellen und du siehst direkt deine `Cloud Name`, `API Key` und `API Secret`. **Wir brauchen alle drei Werte.**
5. **[Fal.ai](http://Fal.ai)**** (Unser Video-Generator):****Kosten:** **Kostenpflichtig.** Du musst dein Konto mit Guthaben ("Credits") aufladen.**Schlüssel bekommen & Guthaben aufladen:**1. Registriere dich auf [fal.ai](http://fal.ai/).
   2. Gehe im Menü unter Manage zu **"Usage"**, füge eine Bezahlmethode unter Billing hinzu und lade dein Konto mit ein paar Dollar auf (z.B. 5$ oder 10$ für den Anfang). Ohne Guthaben funktioniert die API nicht!
   3. Gehe dann im Menü unter Manage zu **"API Keys"**.
   4. Klicke auf **"Create Key"**. Wähle als Typ **"API"**.
   5. Dein Schlüssel wird als `Key` angezeigt. **Diesen brauchen wir.**

Sobald du alle API-Schlüssel hast, fügen wir sie wenn wir im endsprechenden Node in n8n sind hinzu.

## **🛠️ Schritt 1: Notion-Datenbank einrichten**

Unsere Notion-Tabelle ist das Herzstück. Jede Zeile ist ein neuer Auftrag für ein Selfie-Video.

1. Erstelle eine neue, leere Datenbank in Notion (z.B. "Automated Selfie-Video Content").
2. **SEHR WICHTIG:** Verbinde die Datenbank mit deiner n8n-Integration. Klicke dafür oben rechts auf die drei Punkte `...` -> `+ Add connections` und wähle deine zuvor erstellte Notion-Integration aus. Bestätige mit "Confirm". Ohne diesen Schritt kann n8n nicht auf die Datenbank zugreifen!
3. Erstelle die folgenden Spalten. Die Namen sind wichtig für die spätere Zuordnung in n8n.

![Screenshot 2026-03-05 at 5.10.16 PM.png](https://assets.skool.com/f/6a6dac89fb09458fa4ec8ffbcdfc8dd5/b92354fd7f7443948bcda5e25ee399ec6f36b418894c4cd29a3e879806cbb501.png)

## **🛠️ Schritt 2: Der n8n-Workflow – Schritt für Schritt**

Jetzt bauen wir den Workflow in n8n. Die Struktur ist sehr ähnlich zum vorherigen Tutorial, aber die Details in den Nodes sind entscheidend.

### **Node 1: Schedule Trigger – Der Startschuss**

Dieser Node startet den Workflow regelmäßig.

**Node:** `Schedule Trigger`**Konfiguration:** `Hours`, Intervall `1` (oder 1 mal täglich, je nach Bedarf).

### **Node 2: Get a database page (Notion) – Aufträge abholen**

Dieser Node holt alle Zeilen aus Notion, die den Status "Create" haben.

**Node:** `Notion` → `Get a database page`**Konfiguration:****Credential:** Dein Notion-Credential.**Resource:** `Database Page`, **Operation:** `Get Many`.**Database:** Wähle deine "Automated Selfie-Video Content"-Datenbank.**Simplify:** Aktiviere den Schalter.**Filter (JSON):** Füge den folgenden Code ein, um nur aktive Aufträge mit dem Status “Create” zu holen:`{ `  
`"property": "Status", `  
`"status": { `  
`"equals": "Create"`  
`}`  
`}`

### **Node 3: Message a model (OpenAI) – Die kreativen Prompts & Texte**

Hier passiert die Magie. Wir generieren Bild-Prompt, Video-Prompt und Instagram-Caption in einem Schritt.

**Node:** `OpenAI` -> `Message a model`**Konfiguration:****Credential:** Dein OpenAI-Credential.**Operation**: Message a Model**Model:** `GPT-5` (oder ein anderes starkes Modell wie GPT-4o).**Prompt (Expression):****Wichtiger Hinweis:** Kopiere den vollständigen, detaillierten Prompt aus den bereitgestellten Unterlagen. Dieser ist exakt auf die Erstellung von Selfie-Videos zugeschnitten. Achte darauf, die Variablen `{{ ... }}` zu Prüfen und bei Bedarf korrekt aus dem Input-Bereich zu ziehen, um die Daten aus Notion (Videoskript, Setting etc.) zu verbinden. Wenn ein Feld anders benannt oder Beschrieben ist, kann das schon nötig sein.**Messages**:**Type**: Text**Role**: User**Prompt**: **Wichtiger Hinweis:** Kopiere den vollständigen, detaillierten Prompt. Dieser ist exakt auf die Erstellung von Selfie-Videos zugeschnitten. Achte darauf, die Variablen `{{ ... }}` zu Prüfen und bei Bedarf korrekt aus dem Input-Bereich zu ziehen, um die Daten aus Notion (Videoskript, Setting etc.) zu verbinden. Wenn ein Feld anders benannt oder Beschrieben ist, kann das schon nötig sein. Anschließend kannst du diesen Prompt für deine Bedürfnisse optimieren.`You are a Prompt Generator for an automated Selfie Talking-Head Video Content System inside n8n.``INPUT (from n8n):``Viral video script AND/OR viral video idea/description: "{{ $json.property_videoskript }}"``Additional information about setting / style / target audience / tone: "{{ $json.property_weitere_infos_zum_video_zur_caption }}"``Selfie reference image of the person.``The desired setting in which the selfie image should be placed: "{{ $json.property_setting }}"``TASK:``Generate EXACTLY THREE outputs based on the inputs:``A highly detailed IMAGE PROMPT (in English)``A VIDEO PROMPT including spoken dialogue (prompt in English, spoken text in German)``An optimized INSTAGRAM CAPTION (in German)``IMPORTANT GLOBAL RULES:``The uploaded selfie person is ALWAYS the main character.``The person’s identity, facial structure, proportions, hairstyle, and defining features must remain unchanged.``Do NOT invent additional people.``Do NOT change the person.``The person is only placed into a new setting and animated as a talking head.``No explanations.``No text outside the required JSON format.``If no duration or format is specified and no value is contained, use ``9:16`` for the format and 8s for the duration.``PROMPT 1 – IMAGE PROMPT (for Google Nano Banana Pro)``Purpose:``Create a highly detailed image generation prompt in English (6–8 full sentences) that integrates the uploaded selfie realistically into the desired setting.``Requirements:``The person must look exactly like in the selfie (face, proportions, expression preserved).``Clearly describe: environment, setting, atmosphere, lighting (source, direction, color temperature, shadows), camera type (shot type, perspective, focal length), depth of field, focus, framing and composition.``Optimized for {{ $json.property_format }} format.``Describe how the person is naturally positioned in the scene (pose, eye direction, subtle interaction with environment).``Style must match the provided input (e.g. cinematic, hyper-realistic, social media aesthetic, dramatic, clean studio, etc.).``Include quality descriptors: ultra-detailed, realistic skin texture, sharp focus, natural color grading.``No bullet points.``6–8 sentences only.``Written entirely in English.``PROMPT 2 – VIDEO PROMPT (Talking Head, 8 Seconds)``Purpose:``Create an animation and video generation prompt in English (6–8 sentences) that turns the generated image into an 8-second {{ $json.property_format }} talking-head video.``Requirements:``Explicitly state: {{ $json.property_format }} format.``Explicitly state: duration exactly {{ $json.property_dauer }} seconds.``The person must be naturally animated: realistic lip-sync, subtle head movement, blinking, minimal natural facial gestures.``Camera remains mostly stable (slight micro push-in or subtle handheld micro movement allowed).``In addition to facial animation, include subtle but noticeable foreground motion elements that support the message. Contextually relevant graphical elements, symbols, highlights, logos, or visual emphasis effects may dynamically appear, animate, scale, slide, glow, or pulse in sync with important spoken words. – there must be no numbers or words in the animated elements in the foreground!``These foreground elements must enhance clarity and energy without covering the face or distracting from the speaker. This will make the video much more lively. It can be fast-paced and stressful.``The background must be dynamically animated and contextually aligned with the spoken message. Visual elements in the background should react to or reinforce key words or themes from the dialogue (e.g. light shifts, motion elements, environmental changes, graphical overlays, particles, depth movement).``Foreground and background animations should feel modern, retro, social-media optimized, and visually engaging. – there must be no numbers or words in the animated elements in the foreground!``Include a clearly labeled spoken dialogue section written in German.``The spoken German text must:``Be optimized for {{ $json.property_dauer }} seconds.``Contain a strong hook + core message.``Be concise (approx. 18–28 words).``Sound natural when spoken.``If a viral script is provided → compress it to {{ $json.property_dauer }}.``If only an idea is provided → generate a short viral {{ $json.property_dauer }} script yourself (hook + value).``The spoken text must be clearly marked as:``Spoken Text (German): "..."``The rest of the prompt must be written in English.``Write explicitly that there must be no subtitles.``PROMPT 3 – INSTAGRAM CAPTION``Purpose:``Create a short, engaging Instagram caption in German.``Requirements:``1–2 short sentences OR 2 short bullet-style lines.``Strong hook or curiosity trigger.``Must match the video topic.``Include 1–3 fitting emojis.``Add EXACTLY 3 relevant hashtags.``If additional info suggests specific hashtags or tone → follow that.``Otherwise generate engaging, topic-relevant hashtags.``Entire caption must be written in German.``OUTPUT FORMAT (STRICTLY FOLLOW):``Return ONLY a valid JSON object.``No explanations.``No text outside the JSON.``JSON structure:``{ "prompt_image": "<English image prompt with 6–8 sentences>", "prompt_video": "<English video prompt with 6–8 sentences including Spoken Text (German): "...">", "caption_instagram": "<German caption including emojis and exactly 3 hashtags>" }`**Options -> Output Format:****Type:** `JSON Schema (recommended)`**Name**: my_schema**Schema (JSON):** Kopiere das folgende Schema. Es stellt sicher, dass wir alle drei benötigten Textteile im korrekten Format erhalten.`{``  "type": "object",``  "properties": {``    "prompt_image": {``      "type": "string",``      "description": "Highly detailed English image generation prompt (6–8 sentences, optimized for Google Nano Banana Pro)"``    },``    "prompt_video": {``      "type": "string",``      "description": "English video animation prompt (6–8 sentences) including a clearly labeled German spoken dialogue section formatted as: Spoken Text (German): \\"...\\""``    },``    "caption_instagram": {``      "type": "string",``      "description": "Short Instagram caption written in German, 1–2 sentences or short bullet style, including 1–3 emojis and exactly 3 hashtags"``    }``  },``  "required": [``    "prompt_image",``    "prompt_video",``    "caption_instagram"``  ],``  "additionalProperties": false``}`**Tipp:** Aktiviere unter "Settings" die Option **Retry On Fail** (3 Versuche). Das macht den Workflow robuster gegenüber gelegentlichen Server-Problemen bei OpenAI.

### **Node 4: HTTP Request – Selfie-Bild laden**

Wir holen das Selfie aus Notion als Binärdatei. Dieses Dateiformat benötigen wir für unseren nachfolgenden Gemini Node.

**Node:** `HTTP Request`**Konfiguration:****Method**: Get**URL (Expression):** Ziehe hier die URL aus dem `Selfie` Feld deines Notion-Nodes hinein: `{{ $(''Get a database page'').item.json.property_selfie[0] }}`**Options → Response:** `Response Format`: `File`, `Put Output in Field`: `image`.

### **Node 5: Edit an image (Google Gemini) – Bild-Magie**

Wir übergeben das Selfie und unseren Bild-Prompt an Gemini.

**Node:** `Google Gemini`: `Edit an image`**Konfiguration:****Credential**: Dein Gemini Credential**Ressource**: Image**Operation**: Edit Image**Model**: gemini-3-pro-image-preview – oder ein anderes neues Model**Prompt (Expression):** Ziehe hier den `prompt_image` aus dem Output des OpenAI-Nodes hinein: `{{ $(''Message a model'').item.json.output[0].content[0].text.prompt_image }}`**Images: Binary Field Name:** `image`

### **Node 6: Upload an asset... (Cloudinary) – Ab in die Cloud**

Das neue KI-Bild wird zu Cloudinary hochgeladen, um eine öffentliche URL zu erhalten, da ich in Fal AI eine Bild-URL übergeben muss.

**Node:** `Cloudinary`: `Upload an asset from file data`**Konfiguration:****Credential**: Dein Cloudinary Credential**Resource**: Upload**Operation**: Upload File**File**: edited (der Output vom Gemini-Node).**Resource Type**: Image

### **Node 7: HTTP Request (Fal AI) – Video bitte!**

Wir schicken die Bild-URL und den Video-Prompt an [Fal.ai](http://Fal.ai).

**Node:** `HTTP Request`**Konfiguration:****Method:** `POST`**URL:** `https://fal.run/fal-ai/veo3.1/image-to-video` (oder ein anderes Video-Tool. Du musst lediglich darauf achten, dass die Information in dem Format übergeben werden, wie es die jeweilige API benötigt. Das kannst du für die jeweiligen Modelle hier nachlesen: [https://fal.ai/models/fal-ai/veo3.1/image-to-video/api#schema-input](https://fal.ai/models/fal-ai/veo3.1/image-to-video/api#schema-input))**Send Headers:****Name**: `Authorization`**Value**: `Key DEIN_FAL_API_KEY`**Send Body:****Body Content Type**: JSON**Specify Body**: Using JSON**Body (JSON):** Füge den folgenden JSON-Code ein und stelle sicher, dass die Expressions auf die korrekten vorherigen Nodes verweisen:`{{``{``  prompt: $(''Message a model'').item.json.output[0].content[0].text.prompt_video,``  aspect_ratio: $(''Get many database pages'').item.json.property_format,``  duration: $(''Get many database pages'').item.json.property_dauer,``  resolution: "720p",``  generate_audio: true,``  auto_fix: true,``  image_urls: [ $json.secure_url ]``}``}}`

### **Node 8: Update a database page (Notion) – Aufräumen**

Zum Schluss aktualisieren wir die Zeile in Notion mit dem Videolink, der Caption und dem neuen Status.

**Node:** `Notion`: `Update a database page`**Konfiguration:****Resource**: Database Page**Operation**: Update**Database Page ID (Expression):** `{{ $(''Get a database page'').item.json.id }}`**Properties:****Status:** Setze den Wert auf `Done`.**Output Link:** Füge als URL-Expression ein: `{{ $(''HTTP Fal AI'').item.json.video.url }}`**Instagram Caption:** Füge als Text-Expression ein: `{{ $(''Message a model'').item.json.output[0].content[0].text.caption_instagram }}`

## **🚀 Fazit und nächste Schritte**

**Herzlichen Glückwunsch!** Du hast einen vollautomatischen Selfie-Video-Generator gebaut!

Dieser Workflow ist ein Game-Changer für Personal Branding. Du kannst ihn leicht anpassen:

**Andere Stile:** Modifiziere den Haupt-Prompt im OpenAI-Node, um andere visuelle Stile zu erzeugen (z.B. "Cartoon-Stil", "Vintage-Look").**Andere Plattformen:** Passe den OpenAI-Prompt an, um Captions für LinkedIn, TikTok oder X (Twitter) zu generieren.**Mehrstufige Videos:** Erstelle mehrere Zeilen in Notion, die aufeinander aufbauen, um längere Storys zu erzählen.

Jetzt bist du dran: **Speicher & Aktiviere deinen Workflow**, fülle deine Notion-Datenbank und sieh zu, wie die KI für dich Content erstellt!

**🚀 Let’s Go!**', 12, 1120);
END $$;


DO $$
DECLARE
  v_module_id UUID;
  v_chapter_id UUID;
BEGIN
  SELECT id INTO v_module_id FROM public.course_modules WHERE slug = 'ki-agenten';

  INSERT INTO public.module_chapters (module_id, title, description, sort_order)
  VALUES (v_module_id, 'make Automatisierung', '', 4)
  RETURNING id INTO v_chapter_id;

  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, '9fjx7g6n7b', 'Einstieg in die Automatisierung mit Make 🔥', '', 1, 801);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'omi393rvzf', 'Vollautomatisierter Social Media Account 🤯', '', 2, 668);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'x81z0t7crv', 'Vollautomatisierte Social Media Videos 🎬', '', 3, 893);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, '79edhvakor', '100% Automatisierter Youtube Kanal mit KI', '', 4, 1166);
  INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) VALUES (v_module_id, v_chapter_id, 'bnizatosm1', 'Automatische Lead-Verarbeitung', '', 5, 1173);
END $$;

INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'plofhshwli', 'Die Prompt Bibel', '# Download --> Scrolle runter

## 📘 Zusammenfassung: Die Prompt-Bibel von Herr Tech

**Was ist das?**  
Die Prompt-Bibel ist dein Praxis-Playbook für produktives Arbeiten mit ChatGPT – ohne Bullshit, ohne Rumprobieren, ohne Copy-Paste-Prompts von Reddit.

**Für wen ist das?**  
Für Marketer:innen, Creator, Selbstständige, Berater:innen und Unternehmer:innen, die mit KI nicht spielen, sondern abliefern wollen.

---

### 🔍 Das steckt drin:

✅ **Quickstart für sofortige Ergebnisse**  
Mit einem einzigen Prompt zu verwertbarem Output – in 3 Minuten.

✅ **Das R.I.D.E.-Framework**  
Die Formel, mit der du jeden Prompt so aufbaust, dass ChatGPT exakt weiß, was du willst – und dir Output liefert, der passt.

✅ **Der Universalprompt**  
Ein Masterprompt, mit dem du dir selbst perfekte Prompts bauen (lassen) kannst – Schritt für Schritt, ohne Grübeln.

✅ **Die Prompt-Bibliothek**  
Kategorien für jede Situation:  
Produkttexte, E-Mails, Social Media, Ads, SEO, Blogging, YouTube, Landingpages & Bild-KI (Midjourney).

✅ **Von Prompts zu Prozessen**  
Wie du aus einem Video 5 Inhalte machst – für Reels, LinkedIn, Newsletter, Carousel & Stories. Skalierbare Content-Systeme mit KI.

✅ **Bonus-Prompts**

**KI-Avatare aus echten Personen****SEO-Blogprompt für Google-Rankings****Projekt-Setup in ChatGPT für konstant besseren Output**

---

**Was du am Ende hast:**  
Einen Plan.  
Ein System.  
Und eine komplette Prompt-Sammlung, die dir Content, Ideen, Prozesse und Reichweite auf Knopfdruck liefert.

👉 Wenn du das PDF noch nicht hast, hol’s dir jetzt.  
👉 Wenn du’s schon hast: Fang mit Seite 1 an. Und dann nicht aufhören.

**Willkommen im Maschinenraum.**  
**#KIready**', 1, 998 FROM public.course_modules WHERE slug = 'prompt-legende';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', '1. So nutzt du dieses Playbook', '', 2, 0 FROM public.course_modules WHERE slug = 'prompt-legende';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', '2. Quickstart: In 3 Minuten zum Output', '', 3, 0 FROM public.course_modules WHERE slug = 'prompt-legende';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', '3. R.I.D.E. Framework', '', 4, 0 FROM public.course_modules WHERE slug = 'prompt-legende';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', '4. Der Herr Tech-Universalprompt', '', 5, 0 FROM public.course_modules WHERE slug = 'prompt-legende';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', '5. Die Prompt-Bibliothek', '', 6, 0 FROM public.course_modules WHERE slug = 'prompt-legende';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', '6. Von Prompts zur Skalierung', '', 7, 0 FROM public.course_modules WHERE slug = 'prompt-legende';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', 'Bonus 1: Prompts für KI Avatare', '', 8, 0 FROM public.course_modules WHERE slug = 'prompt-legende';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', 'Bonus 2: Blogprompt für SEO-Rankings', '', 9, 0 FROM public.course_modules WHERE slug = 'prompt-legende';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', 'Bonus 3: ChatGPT richtig füttern', '', 10, 0 FROM public.course_modules WHERE slug = 'prompt-legende';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', 'ChatGPT ist komplett verwirrt? 😵‍💫--> Neuer Chat', '', 11, 0 FROM public.course_modules WHERE slug = 'prompt-legende';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', 'Wieder direkte Antworten von ChatGPT bekommen!', '', 12, 0 FROM public.course_modules WHERE slug = 'prompt-legende';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', 'Der Prompt Engineering Guide von Google 🤩', '', 13, 0 FROM public.course_modules WHERE slug = 'prompt-legende';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'de9ktjd2eb', 'KI SEO', '# 🚀 SEO-Automatisierung mit KI - Game Changer Alert!

Herzlich Willkommen zu unserem neuesten KI Marketing Workflow!

Du denkst, SEO ist tot? Falsch gedacht! 😤 Aber bevor du wieder stundenlang Keywords recherchierst und Artikel schreibst: Stopp.

Denn während 99% der Marketer noch manuell arbeiten, automatisieren wir den kompletten SEO-Prozess. Was früher 8 Stunden gedauert hat? Jetzt 20 Minuten. Was früher ein Artikel pro Woche war? Jetzt mehrere pro Tag. KI ist nicht nur ein Tool – sondern dein SEO-Autopilot.

💡 Worum geht''s in diesem Workflow?

Wir sprechen über die SEO-Revolution, die gerade stattfindet. Denn die meisten da draußen nutzen KI als einfaches Werkzeug, kopieren Prompts, hoffen auf Glück – und wundern sich, warum ihre Artikel nicht ranken.

Ich zeig dir, wie du mit einem einzigen Prompt-System einen vollständigen, SEO-optimierten Blog-Artikel erstellst. Nicht mit Zufall. Sondern mit System, Strategie – und intelligenter KI-Automatisierung.

🎬 Was dich in diesem Video erwartet:

✅ Warum SEO trotz ChatGPT lebendiger denn je ist – und wie du das für dich nutzt. 68% aller Online-Erfahrungen beginnen mit Google!

✅ Die 4 SEO-Säulen, die wirklich funktionieren: Keywords, Content, Technik, Authority. Keine Theorie – pure Praxis!

✅ Der entscheidende Unterschied zwischen KI als Werkzeug vs. KI als System. Das verstehen nur die 1%!

✅ Live-Demo: Wie Manus aus einem einzigen Prompt einen 1650-Wörter SEO-Artikel erstellt – mit allen Meta-Daten, internen Links und perfekter Struktur. Copy-paste-fertig!

✅ Der 5-Schritte-Workflow für KI-automatisierte SEO: Von Zielgruppen-Analyse bis Performance-Tracking. Alles automatisiert!

✅ Warum Google und ChatGPT sich perfekt ergänzen – Entdeckungs-Maschine vs. Antwort-Maschine. Das musst du verstehen!

✅ Bonus: Wie du mit [Make.com](http://Make.com) die komplette Veröffentlichung automatisierst. Echte Skalierung auf dem nächsten Level!

✅ Der komplette Prompt, den du sofort nutzen kannst – kein Rätselraten, sondern sofortige Umsetzung!

✅ Und: Warum du nach diesem Video SEO nie wieder wie früher machst!

🔥 Das Ergebnis?

Statt 8 Stunden pro Artikel → 20 Minuten Statt 1 Artikel pro Woche → Mehrere pro Tag

Statt hoffen, dass es rankt → Wissen, dass es funktioniert

Während deine Konkurrenz noch Keywords recherchiert, hast du bereits 5 Artikel veröffentlicht. Während andere noch schreiben, optimierst du bereits die Performance. Während andere noch träumen, automatisierst du bereits.', 1, 1120 FROM public.course_modules WHERE slug = 'ki-seo';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'pse5r148cs', 'Das KI Toolboard 🦾', '**DAS HERR TECH KI TOOLBOARD**

Die wichtigsten Tools für virale Inhalte, Automatisierung & digitale Dominanz

**1. Ideengenerierung & Skripte**

– [Manus: ](https://manus.im/guest?guest=1)KI-Agent für parallele Aufgaben (5+ gleichzeitig)  
– [ChatGPT:](https://chatgpt.com/) Digitaler Assistent für Texte, Strategien und Automatisierung  
– [Prompt-Bibel:](https://chatgpt.com/g/g-6822e436192c81918c15c27c53672ef7-prompt-bibel-by-herr-tech) Strukturierte Prompts inkl. Ultra-Prompt, Hook-Generator, Content-Recycling  
– [Herr Tech Q&A:](https://chatgpt.com/g/g-WflWrkglr-herr-tech-q-a-community) Beantwortet alle Fragen rund um KI & Marketing, basiert auf Community- und Kurswissen  
– [Marketing Strategie Assistent:](https://chatgpt.com/g/g-67f0f64efe78819198887ff0cd339b9c-marketing-strategie-assistent) Zielgruppenanalyse, Positionierung, Funnel, Hook- und Contentstrategie  
– [Viraler Content Assistent: ](https://chatgpt.com/g/g-67f1391c47308191b80fb3890b366c8d-viraler-content-assistent)Erstellt passende Content-Ideen inkl. Caption, Hashtags, Titel & Videoaufbau  
– [Viraler Hook Assistent:](https://chatgpt.com/g/g-67f1570f0e448191ba1a3448bd0cd122-viraler-hook-assistent) Liefert emotionale und virale Hookzeilen mit Scroll-Stopp-Garantie

**2. Bilder & Visuals**  
– [Midjourney:](https://www.midjourney.com/home) Stilvolle, kreative Bildgenerierung mit hoher Qualität  
– [Nano Banana:](https://artlist.io/image-to-image-ai/nano-banana-pro) Ultrarealistische Bildgenerierung mit bester Qualität  
– [Reve:](https://reveai.org/) KI-Gesichter & Charaktere, kostenlos & einfach  
– [Freepik (Flux):](https://www.freepik.com/) Bilder austauschen, Gesichter trainieren  
– [Magnific AI:](https://magnific.ai/) Upscaling & Feinschliff, erzeugt realistischere Bilder  
– [Midjourney V6 GPT: ](https://chatgpt.com/g/g-5GgNWdBMI-image-creator-generator-mid-journey-v6)Bildideen & Prompts im Midjourney-Stil direkt im Chat  
– [Reve Prompt Generator:](https://chatgpt.com/g/g-67f21fa99de48191b774d95be480b5df-reve-prompt-generator) Perfekte Prompts für Bildgeneratoren, optimiert für Midjourney, DALL·E & Co.  
– [Freepik AI Image GPT:](https://chatgpt.com/g/g-67cfd959177081919755601e61af8c09-freepik-ai-image-creator-gpt) KI-Bilder & Assets für Thumbnails, Slides & Social Visuals  
– [Magnific AI Prompt GPT:](https://chatgpt.com/g/g-MqTQMv1cf-magnific-ai-mystic-2-5-prompt-generator) Ultra-realistische Prompts für Mystic 2.5

**3. Avatare & KI-Videos**  
– [Sora 2:  ](https://sora.chatgpt.com/explore)Ultra-realistische KI Videos mit (nahezu) Viralitätsgarantie (inkl. Soundeffekte/Voiceover)  
– [Fineshare:](https://www.fineshare.com/ai-video/sora-watermark-remover)[ ](https://sora.chatgpt.com/explore)Entfernt die Wasserzeichen bei Sora Videos  
– [Veo3:](https://deepmind.google/models/veo/) Text-to-Video & Image-to-Video auf Kino-Niveau (inkl. Soundeffekte/Voiceover)  
– [Heygen: ](https://www.heygen.com/)Video-Avatare mit Stimme & Look, perfekt für skalierbaren Content  
– [Kling AI:](https://klingai.com/global/) Realistische Animationen für cinematische Clips  
– [CapCut (Dreamina):](https://dreamina.capcut.com/) Einfache Lip-Sync-Videos, kostenlos  
– [Runway ML:](https://runwayml.com/) Deepfake-Level Mimik & Videoeffekte

**4. Videoschnitt & Shorts**  
– [CapCut: ](https://www.capcut.com/de-de)Allround-Editor für Mobil & Desktop, mit Effekten & Untertiteln  
– [DaVinci Resolve:](https://www.blackmagicdesign.com/de/products/davinciresolve) Profi-Videoschnitt & Color Grading  
– [Opus Clip: ](https://www.opus.pro/)Longform zu Shorts, ideal für YouTube & Podcasts  
– [Captions App:](https://www.captions.ai/) Automatisch generierte Untertitel für Social Videos  
– [Descript:](http://descript.com) Videos transkribieren & per Text editieren

**5. Stimme & Audio**  
– [ElevenLabs: ](https://elevenlabs.io/)Realistische KI-Stimmen, inkl. Klonen der eigenen Stimme  
– [Auphonic:](https://auphonic.com/) Audioqualität verbessern, Rauschen & Lautstärke ausgleichen  
– [Suno AI:](https://suno.com/home) KI-generierte Musik für Reels, Videos & Podcasts

**6. Präsentationen & Visualisierung**  
– [Gamma.app](http://Gamma.app): Präsentationen aus Stichpunkten erstellen  
– [Napkin.ai](http://Napkin.ai): Visualisierung & Diagramme fürs Business  
– [Lovable:](https://lovable.dev/) Baut mit einem Prompt deine Webseite

**7. Automatisierung & KI-Agenten**  
– [ManyChat: ](https://manychat.com/)Messenger-Automation für Instagram DMs & Funnels  
– [n8n.io: ](https://n8n.io/)Messenger-Automation für Instagram DMs & Funnels  
– [Make:](https://www.make.com/en) No-Code-Automatisierung, verbindet GPT mit Google Sheets & mehr  
– [Atlas:](https://chatgpt.com/de-DE/atlas/) Browser von OpenAI um Tasks zu automatisieren  
– [Zapier:](https://zapier.com/) Prozessautomatisierung mit riesigem App-Ökosystem  
– [TL;DV:](https://tldv.io/de/) Meeting-Zusammenfassungen inkl. Action Points  


**8. KI für Vertrieb & Lead-Gen**  
– [Clay:](https://www.clay.com/) Lead-Sourcing & CRM-Automation mit KI, baut personalisierte Outreach-Workflows  
– [Reply.io](http://Reply.io): Multichannel-Sales-Automatisierung via E-Mail, LinkedIn & SMS  
– [PhantomBuster: ](https://phantombuster.com/)Scraping & Outreach auf Social Media, ideal für Leads & Automatisierung  
– [Waalaxy:](https://www.waalaxy.com/de) LinkedIn-Prospecting & Lead-Nurturing mit Auto-DMs & E-Mail – ohne Tech-Wissen  
– [Fonio:](https://www.fonio.ai/) Automatisierte KI-Anrufe mit Kunden', 1, 1379 FROM public.course_modules WHERE slug = 'ki-toolboard';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'bbzobtprbs', 'Kapitel 0: Super viral mit KI Musik 🤖🎶', '## **⚠️ Bevor ihr in die Erstellung von KI Musik geht, unbedingt anschauen! ⚠️**

## 

### 🎯 1. Das Fundament: Marketing > Musikproduktion

•**Wichtiger Disclaimer**: Bevor du Musik produzierst, musst du die Marketing-Grundlagen verstehen! Schau dir zuerst die Kapitel im **[KI-Marketing-Kurs](https://www.skool.com/ki-marketing-club/classroom/dc0bc69b?md=bf8c08b6542848fdbef64c52a134739b)** an.

•**Das Ziel**: Virale Reichweite. Wenn du nur für dich Musik machst, super! Aber wenn du gehört werden willst, ist Strategie alles.

•**Das Problem**: Viele stecken Herzblut in die Musik, aber niemand hört sie, weil sie nicht verstehen, was die Leute wollen. 💔

### ❌ 2. Was die Leute NICHT wollen: Lange Videos

•**Die 3-Minuten-Falle**: Niemand schaut sich ein 3-minütiges Video von einem (noch) unbekannten Sänger an. Auch nicht mit tollen Animationen.

•**Dein Stolz vs. Realität**: Du bist stolz auf dein Werk, aber lange Videos sind am Anfang Zeitverschwendung. Mach sie für dich, aber nicht für die Reichweite.

### ✅ 3. Was die Leute WOLLEN: Kurze, knackige Inhalte

**•Die Plattformen**: Instagram, TikTok, YouTube Shorts sind deine Bühne. 🕺

**•Die Länge**: 7 bis 15 Sekunden! Je kürzer, desto besser. Die Leute sollen nicht wegklicken.

**•Das Tool:** SORA 2 (oder ähnliche) ist dein bester Freund. Es ist kostenlos und du kannst massenhaft Videos erstellen.

Schau dir **Mr. Techno** an. Maximal 15 Sekunden, eine Masse an Videos und 1 bis 2 Treffer machen schon den Unterschied: **50 Millionen organische Views in 30 Tagen! 🤯**

![Mr. Techno 50 Mio VIews.jpg](https://assets.skool.com/f/6a6dac89fb09458fa4ec8ffbcdfc8dd5/acc97cdfde424967b4d5dcebea557a19c2a654f3c9ce4203a831602e925a4b7b.jpg)

### 🎰 4. Die SORA 2 Strategie: Es ist ein Zahlenspiel!

**•Die 10x Formel:**

10x durchlaufen lassen

8x ist Quatsch dabei ❌

1x ist es gut 👍

1x ist es **HEAVEN**! ✨

**•Masse statt Perfektion**: Baller einfach raus! Du musst nicht auf das perfekte Video warten. Einer von zehn Versuchen wird zünden.

**•Beispiel Mr. Techno**: Er postet nicht nur seine viralen Hits. Im Hintergrund laufen unzählige Tests, die niemand sieht.

### 🎶 5. Die Musik-Formel: Was einen viralen Track ausmacht

**•Jeder Stil geht ab**: Es muss kein Hard-Techno sein. Das Beispiel "I RUN" (ein Taylor-Swift-artiger Song) ging mit 12 Mio. Streams viral.

•**Achtung**: Nutze keine Stimmen berühmter Sänger, sonst wirst du gesperrt! KI-Musik an sich ist aber erlaubt.

**•Die 3 goldenen Regeln für deinen Track:**

**1.💥 Ein kraftvoller Drop**: Der Höhepunkt muss sofort überzeugen.

**2.🔥 Eine kraftvolle Stelle**: Ein unvergesslicher Moment, der im Kopf bleibt.

**3.🚀 Die ersten 10 Sekunden**: Sie müssen knallen! Das ist deine Hook.

**•Dein Werkzeug**: Mit Suno kannst du genau das einfach erstellen.

### 🔄 6. Der virale Kreislauf: So wird dein Track groß

**1.Video erstellen:** Nutze die besten 10-15 Sekunden deines Tracks für ein witziges, überraschendes oder visuell starkes Video.

**2.Neugier wecken**: Die Leute hören den Song im Video und fragen: "Wie heißt der Track?" 🤔

**3.Link in Bio:** Du hast den Spotify-Link prominent in deiner Bio.

**4.Wachstum**: Die Leute klicken, hören, speichern. Dein Track wächst exponentiell. 📈

### 🏆 7. Pro-Tipp: Pre-Save Kampagnen

**•Das Tool:** Nutze **[Hyppedit](https://hypeddit.com/login)**, um einen Pre-Save-Link zu erstellen, bevor dein Track released wird.

**•Der Effekt:**

Fans speichern den Track vorab.

Am Release-Tag ist er automatisch in deren Playlists.

Das gibt dem Algorithmus vom ersten Tag an einen massiven Push! 🚀

### 👑 8. Die Core-Strategie: TÄGLICHER CONTENT

•**Content ist King**: Für neue Artists ist Content der größte Hebel, nicht die Musik selbst.

**•Deine Formate:** Schau, was bei anderen abgeht. Repliziere das! Das ist der Trick. Fertig.

•**Das Ziel:** Wiedererkennbarkeit und tägliche Präsenz aufbauen.

### 💸 9. Die goldene Regel: KEINE PAID ADS!

**•Organisch > Gekauft:** Bezahlte Werbung bringt dir nichts. Sie baut keine echte Community auf.

**•Investiere Zeit, kein Geld: **Deine Währung ist Zeit und Kreativität. Der Algorithmus belohnt echtes Engagement, keine gekauften Klicks.

### 🤯 10. Die Ausnahmen, die die Regel bestätigen

**•Ja, es gibt sie:** Artists wie [Farbwende](https://www.tiktok.com/@farbwende?lang=de-DE) oder [Neural Loop](https://www.tiktok.com/@neural.loop3?lang=de-DE) gehen mit langen Videos viral.

**• Warum?** Sie haben viel Zeit in deren Stil investiert. Das erfordert viel Zeit ohne Testen zu können, ob das überhaupt gut ankommt. Kann funktionieren. Meine Präferenz: Fail fast.

**•Für 99% **gilt: Halte dich an die Kurzvideo-Regel, bis du an diesem Punkt bist.

### 💥 11. EXECUTION: Baller raus, was das Zeug hält!

**•Ein Track ist kein Track:** Du brauchst Konsistenz.

**•Dein Rhythmus:**

Alle 2 Wochen: Ein neuer Release auf Spotify & Co.

Jeden Tag: Content, Content, Content.

Nicht entmutigen lassen: Wenn ein Track floppt – egal! Der nächste kommt bestimmt. Die Strategie ist, so hart es klingt: rausballern, rausballen, rausballen!

### 🏁 Dein Fahrplan zum Erfolg – ZUSAMMENFASSUNG

1.Verstehe dein Publikum (kurze Videos!)

2.Nutze SORA 2 (10x Formel)

3.Produziere mit Suno (Powerful Drops & erste 10s)

4.Erstelle 10-15 Sekunden Videos

5.Starte Pre-Save Kampagnen (Hyppedit)

6.Poste TÄGLICH Content

7.Verzichte auf Paid Ads

8.Release alle 2 Wochen einen neuen Track

9.Pack den Spotify-Link in deine Bio

10.COMMITTE DICH und ZIEH DURCH! 💪

**Jetzt ist die Zeit! Geh mit Steffen in die Erstellung und erobere die Charts! 🌟**', 1, 1670 FROM public.course_modules WHERE slug = 'ki-musik';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'dzwstl5i8o', 'Kapitel 1: Einführung und Texterstellung 🚀', '', 2, 782 FROM public.course_modules WHERE slug = 'ki-musik';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'arkbwj1rse', 'Kapitel 2: Rap und erste Schritte mit Suno AI 🎤', '', 3, 817 FROM public.course_modules WHERE slug = 'ki-musik';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'iaqdvaxzqr', 'Kapitel 3: House Music für die nächste Party 🏠', '', 4, 1387 FROM public.course_modules WHERE slug = 'ki-musik';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '5gf0ptjht3', 'Kapitel 4 - Schlager - Ein Song für Mutti 💝', '', 5, 629 FROM public.course_modules WHERE slug = 'ki-musik';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'e4kgecifxs', 'Kapitel 5 - Kurze Songs für Social Media 📱', '', 6, 882 FROM public.course_modules WHERE slug = 'ki-musik';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'xnsx919zgf', 'Bonus Kapitel - Swing und Jazz 🎷', '', 7, 337 FROM public.course_modules WHERE slug = 'ki-musik';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'w2wnsiuqca', 'Kapitel 1 - KI Monetarisierung 🏦', '## 🎯 Das große Ziel: Finanzielle Freiheit durch KI-Automatisierung

Passives Einkommen ist der Heilige Gral für jeden Selbstständigen und Unternehmer. In diesem Kapitel lernst du, wie du mit KI systematisch Einkommensströme aufbaust, die auch dann fließen, wenn du schläfst, im Urlaub bist oder dich anderen Projekten widmest.

Wichtiger Hinweis: Passives Einkommen bedeutet nicht "nichts tun". Am Anfang steht immer aktive Arbeit - aber mit KI kannst du Systeme schaffen, die sich selbst optimieren und skalieren.

## 🚀 Die aktuelle Marktlage: Warum JETZT der perfekte Zeitpunkt ist

### Markt-Fakten 2025:

•276 Milliarden Dollar globale KI-Investitionen

•70% Kosteneinsparung durch KI-Automatisierung möglich

•10x Produktivitätssteigerung in vielen Bereichen

•24/7 Verfügbarkeit ohne Pausen oder Urlaub

### Das Goldene Zeitfenster:

Der KI-Markt explodiert, aber die Anbieter kommen gerade erst aus den Löchern. Wer JETZT startet, hat einen 2-3 Jahre Vorsprung vor der Konkurrenz. Frühe Adopter dominieren ihre Märkte!

## 💰 Die Top-Strategien für passives Einkommen mit KI

### 1. 🎨 Starke Marken mit KI-Content

Das Konzept: KI erstellt konsistent hochwertigen Content, während du eine starke Marke aufbaust, die passiv verkauft.

Praktische Umsetzung:

•KI-generierte Social Media Posts 

•Automatisierte Blog-Artikel und SEO-Content

•KI-erstellte Videos und Thumbnails

•Personalisierte E-Mail-Kampagnen

### 2. 🤖 KI-Agenten als 24/7 Geldmaschinen

**Die 5 lukrativsten KI-Agent-Kategorien:**

Kommunikations-Agenten:

•24/7 Kundenservice und Live-Chat

•E-Mail-Support-Automatisierung

•Einsparpotential: 6.000-15.000€/Monat pro Unternehmen

Terminplanungs-Agenten:

•Automatische Terminvereinbarung und -verwaltung

•Kalender-Optimierung und Reminder

•Einsparpotential: 3.000-5.000€/Monat

Verkaufs-Agenten:

•Lead-Qualifizierung und Nachfassung

•Verkaufsgespräche und Upselling

•ROI: +25% Conversion-Rate

Support-Agenten:

•Technischer Support und Problemlösung

•FAQ-Automatisierung

•Reduzierung der Support-Tickets um 60-80%

Marketing-Agenten:

•Content-Erstellung und Social Media Management

•Lead-Generation und Nurturing

•Ersetzt 2-3 Vollzeit-Stellen

### 3. 🏆 Community-Goldmine ohne Reichweite

Der bewährte 3-Schritt-Prozess:

1.Bezahlte Werbung (KI-geskriptet): Zielgerichtete Ads erreichen deine perfekte Zielgruppe

2.Webinar (KI-Präsentation): Automatisierte Webinare mit KI-erstellten Inhalten

3.Community-Zugang verkaufen: Wiederkehrende Einnahmen durch Mitgliedschaften

Geheimnis: Du brauchst KEINE große Follower-Zahl! Mit bezahlten Ads erreichst du gezielt deine Zielgruppe.

### 4. 🛒 E-Commerce & TikTok Shop Revolution

TikTok Shop mit KI:

•KI erstellt virale Produktvideos automatisch

•Automatisierte Produktbeschreibungen und SEO

•KI-gesteuerte Influencer-Kooperationen

•Personalisierte Produktempfehlungen

Amazon FBA mit KI:

•Produktrecherche und Marktanalyse

•Automatisierte Listing-Optimierung

•KI-gesteuerte Preisstrategien

•Review-Management und Kundenservice

### 5. 💎 Affiliate Marketing 2.0

KI-gesteuerte Affiliate-Systeme:

•Automatisierte Content-Erstellung für Affiliate-Produkte

•Personalisierte Produktempfehlungen

•KI-optimierte Landing Pages

•Automatisierte E-Mail-Funnels

Erfolgsbeispiel: Unser Skool Affiliate-Programm läuft prächtig - regelmäßige 4-5-stellige Provisionsauszahlungen durch systematische KI-Automatisierung.

**[Hier](https://www.skool.com/communityaufbau/about?ref=b1463230fefa4fd6a483c586ecf66a7a)** kommt ihr bspw. in die Community von Calvin Hollywood. Für jeden Kauf bekomme ich eine Provision. Anfang der Woche musste der liebe Calvin wieder ein hübsches Sümchen zuschießen..😂

## 🎯 Weitere lukrative Use Cases

### Content-Monetarisierung:

•YouTube Automation: KI erstellt Skripte, Thumbnails und optimiert für Algorithmus

•Podcast-Imperium: Automatisierte Podcast-Produktion und -vermarktung

•Online-Kurse: KI erstellt Kursinhalte und optimiert Verkaufsprozesse

•Newsletter-Business: Automatisierte Newsletter mit personalisierten Inhalten

### Service-Automatisierung:

•Webdesign-Agentur: KI erstellt Websites, du verkaufst sie

•Social Media Management: KI übernimmt komplette Social Media Betreuung

•SEO-Services: Automatisierte SEO-Optimierung für Kunden

•Übersetzungsdienstleistungen: KI übersetzt, du kassierst

### Datenmonetarisierung:

•Marktforschung: KI analysiert Märkte und erstellt Reports

•Trend-Vorhersagen: KI identifiziert profitable Trends

•Personalisierte Beratung: KI erstellt individuelle Strategien

•Automatisierte Audits: KI prüft Websites, Prozesse, etc.

## ⚡ Quick-Start Strategien (30 Minuten Setup)

### Quick Win #1: Viraler Content-Post

1.KI-Tool öffnen (ChatGPT/Manus)

2.Viral-Post über KI-Monetarisierung schreiben lassen

3.Affiliate-Link integrieren

4.Auf allen Plattformen gleichzeitig posten

5.Tracking einrichten und optimieren

### Quick Win #2: Affiliate-Setup

1.Bei lukrativem Affiliate-Programm anmelden (40% Provision bspw. in meinem KI Club)

2.KI erstellt Werbe-Content automatisch

3.Landing Page mit KI optimieren

4.Erste Einnahmen innerhalb von 24-48h

### Quick Win #3: TikTok/YouTube Short

1.KI erstellt Script über KI-Tipps

2.KI generiert Titel und Beschreibung

3.Video produzieren (oder KI-generiert)

4.Viral gehen und Affiliate-Links in Bio

## 🛠️ Empfohlene Tools (alle kostenlos nutzbar)

### Content-Erstellung:

•ChatGPT/Manus: Für Texte und Strategien

•Canva: Für visuelle Gestaltung

•Buffer/Hootsuite: Für Multi-Platform Posting

•Google Analytics: Für Tracking und Optimierung

### KI-Agenten:

•Manus: Für komplexe Automatisierungen

•Make.com: Für Workflow-Automatisierung

•n8n: Für Prozess-Automatisierung

•Zapier: Für einfache Integrationen

### E-Commerce:

•Shopify + KI-Apps: Für automatisierte Shops

•TikTok Shop Creator Tools: Für virale Produktvideos

•Amazon Seller Tools: Für FBA-Optimierung

## 🎯 Deine nächsten Schritte

### Sofort umsetzbar (heute):

1.Wähle EINE Strategie aus diesem Kapitel

2.Starte mit einem 30-Minuten Quick Win

3.Dokumentiere deine ersten Ergebnisse

4.Skaliere das, was funktioniert

### Diese Woche:

1.Richte dein erstes KI-System ein

2.Teste verschiedene Ansätze

3.Optimiere basierend auf Daten

4.Baue deine erste Einkommensquelle auf

### Diesen Monat:

1.Diversifiziere deine Einkommensströme

2.Automatisiere wiederkehrende Prozesse

3.Skaliere erfolgreiche Systeme

4.Baue dein passives Einkommen systematisch aus

## 💡 Wichtige Erfolgsprinzipien

### Das Pareto-Prinzip:

80% deiner Ergebnisse kommen von 20% deiner Aktivitäten. Fokussiere dich auf die lukrativsten KI-Anwendungen.

### Start small, scale fast:

Beginne mit einem einfachen System und skaliere es, anstatt zu versuchen, alles auf einmal zu machen.

### Daten-driven Entscheidungen:

Lass KI deine Daten analysieren und Optimierungsvorschläge machen. Baue nur das aus, was messbar funktioniert.

### Community first:

Der Aufbau einer loyalen Community ist langfristig profitabler als jede andere Strategie.

## 🚨 Häufige Fehler vermeiden

❌ Zu viele Projekte gleichzeitig starten ✅ Fokussiere dich auf EINE Strategie bis sie läuft

❌ Perfektionismus statt Umsetzung ✅ Starte imperfekt und optimiere unterwegs

❌ KI als Allheilmittel sehen ✅ KI ist ein Werkzeug - die Strategie machst du

❌ Keine Erfolgsmessung ✅ Tracke alles und optimiere datenbasiert

Remember: Das Zeitfenster schließt sich schnell! Wer JETZT startet, hat 2-3 Jahre Vorsprung vor der Konkurrenz. Erfolgreiche Menschen handeln, während andere noch überlegen.

LET''S GO! 🚀', 1, 1641 FROM public.course_modules WHERE slug = 'passives-einkommen';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', 'tiktok Shop/Instagram Leitfaden 🦾💸', '', 2, 0 FROM public.course_modules WHERE slug = 'passives-einkommen';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', 'Intro in Prompting und die besten Prompts 🦾', '', 1, 0 FROM public.course_modules WHERE slug = 'community';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'xv5p3k5f86', 'Sprechende KI Videos in Minuten - free!', '', 2, 50 FROM public.course_modules WHERE slug = 'community';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'eoowp03rev', 'GPTs erstellen & damit Geld verdienen', '', 3, 1489 FROM public.course_modules WHERE slug = 'community';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', 'KI Toolboard: Die wichtigsten KI Tools für euch', '', 4, 0 FROM public.course_modules WHERE slug = 'community';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'huz1e7ikia', 'Aufzeichnung 1. Live Call 🦾', '', 1, 9395 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'k9hjh38x2r', 'Aufzeichnung 2. Live Call 🦾', '', 2, 7184 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'bfu37cyi1q', 'Aufzeichnung KI Automatisierung Live Call', '', 3, 7500 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '09ufhuvn7x', 'Aufzeichnung - Start doing 🦾', '', 4, 8288 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'te2txrvc3j', 'Content Explosion Call mit Patrick 🔥', '', 5, 7465 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'i4ylzupbqk', 'KI Vertriebs Call mit Steffen 🤩', '', 6, 6631 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'v3v4968jzs', 'Roasting & DOING!', '', 7, 6782 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'd84n3xb68b', 'Die Hook 🪝', '', 8, 6227 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'qa17gob1di', 'Live Call - Das virale Skript 🎥', '', 9, 8040 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '9h9srpllzi', 'Live Call - KI Telefonie', '', 10, 4356 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'vsmporm6lb', 'Live Call Roasting & Strategy', '', 11, 5036 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '83wdm5ns53', 'Live Call - KI Klone & Avatare', '', 12, 11426 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'vdv1y9cyyb', 'Live Call - Monetarisierung', '', 13, 8066 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'v113faclea', 'Live Call KI Mail Outbound', '', 14, 8102 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'tpuu1n65h7', 'Live Call - No Excuses!', '', 15, 5693 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'o6bl0lg02j', 'Live Call - KI Strategie', '', 16, 8758 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'gejb8dm04e', 'Live Call - KI Agenten, Make.com & n8n Einstieg', '', 17, 6108 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'mc1x0y5bh2', 'Live Call - die Hook', '', 18, 7159 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'x9abyhr3hq', 'Live Call - Viral gehen', '', 19, 8077 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'mtiv4m4utg', 'Live Call - KI Telefonie', '', 20, 3979 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'lq7qtfqdnx', 'Live Call - Sales Funnel', '', 21, 4302 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'pfw5yuq5za', 'Live Call - Unique KI Content & KI Influencer', '', 22, 8785 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'su8dctvvr7', 'Live Call - Passives Einkommen mit KI', '', 23, 5769 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '0aoy40t20r', 'Live Call - Mail Outbound mit KI', '', 24, 3357 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'u91f1tkbfc', 'Live Call - Autom.-Agentur Aufbau mit Felix', '', 25, 4689 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'tnsbjxxjkt', 'Live Call - Content Q&A mit Patrick 🎨', '', 26, 7923 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'l39m8pyav8', 'Live Call - KI & Recht mit Boris', '', 27, 5420 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '0vaua8z7s3', 'Live Call - Viral gehen mit KI - Mr. Techno', '', 28, 7051 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'key46z7be7', 'Live Call - KI Musik mit Steffen', '', 29, 5171 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'yts79obeu8', 'Live Call - Community Aufbau mit Mr. Skool', '', 30, 5994 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'i02youkxnt', 'Live Call -  Viral mit Veo3', '', 31, 3613 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '8m3fqp5uvl', 'Live Call - Von der Kaltakquise bis zum Lead', '', 32, 4916 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'mzj4r2ke3c', 'Live Call - KI Strategie', '', 33, 6635 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 't6hqoqniw5', 'Live Call - Viral gehen / Account roasting', '', 34, 10168 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '8u6805wyxt', 'Live Call - KI Agentur Aufbau mit Felix', '', 35, 5348 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '5danrtwgdh', 'Live Call - Passives Einkommen mit KI', '', 36, 7538 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'm6p8u4w0py', 'Live Call - Content mit Veo 3', '', 37, 5224 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'mwucztdexr', 'Live Call - Account/Business Model Roasting', '', 38, 10470 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'dmvcykoevx', 'Live Call - KI Vertrieb mit Steffen', '', 39, 7472 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '9c3hsglgyp', 'Live Call - KI Vision 2025', '', 40, 7954 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '9cctf6juz0', 'Live Call - Der perfekte Sales Funnel', '', 41, 5407 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', 'Live Call - Ultra viral gehen', '', 42, 0 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'MISSING___', 'Live Call - KI Content Erstellung (inkl. SORA)', '', 43, 0 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '4g9xcuz3mx', 'Live Call - KI Musik 07.11.', '', 44, 4132 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'fonz4sc9ff', 'Live Call - KI Vertrieb Automatisierung 12.11.', '', 45, 4516 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'zoaqzumgja', 'Live Call - Automatisierung KI Agenten 13.11.2025', '', 46, 4972 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'p37t2t3ljd', 'Live Call - Content & Account Roasting 18.11.2025', '', 47, 6730 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'y0on6z0sr5', 'Live Call - Community Business aufbauen 20.11.2025', '', 48, 3750 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'q0fixcj78b', 'Live Call - KI & Recht 24.11.2025', '', 49, 6038 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'iazgeoejv3', 'Live Call - KI Vision & Strategie 28.11.2025', '', 50, 8253 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'cvlnu9gf6n', 'Live Call - Super viral mit KI 01.12.2025', '', 51, 8250 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '4pwi2tr905', 'Live Call - Sales Funnel 04.12.2025', '', 52, 8810 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'yjk7wlmbbj', 'Live Call - KI Content Erstellung 10.12.2025', '', 53, 10485 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '39ysd9oqyl', 'Live Call - Passives Einkommen mit KI 12.12.2025', '', 54, 11188 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 's0hps33db6', 'Live Call - KI Telefonie 15.12.2025', '', 55, 4582 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'bgldj8xxu3', 'Live Call - KI Agenten 18.12.2025', '', 56, 5152 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'wf0wvbujn4', 'Live Call - Linkedin Automation - 22.12.2025', '', 57, 5039 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'phd1ub2f7f', 'Live Call -  Linkedin Viral 08.01.2026', '', 58, 7411 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '2myw5jzv6m', 'Live Call - Musik Promotion 21.01.2026', '', 59, 5074 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'pztnd2tukw', 'Live Call - Ads 26.01.2026', '', 60, 6217 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'eazt0guklj', 'Live Call - Sales Funnel 29.01.2026', '', 61, 5386 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'p5y87enjxl', 'Live Call - KI Vision 02.02.2026', '', 62, 6406 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'i6ts7va5ti', 'Live Call - KI Content Erstellung 05.02.2026', '', 63, 8746 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '9etgvd0qoz', 'Live Call - Super viral mit KI 10.02.2026', '', 64, 8314 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '7o1hr71xft', 'Live Call - KI Vertrieb 13.02.2026', '', 65, 3706 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'snux31ipzf', 'Live Call - KI Agenten 16.02.2026', '', 66, 7879 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '8tf3dcbonp', 'Live Call - Passives Einkommen 18.02.2026', '', 67, 6439 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'j7elvsaa54', 'Live Spezial - Franz Wegener 23.02.2026', '', 68, 5252 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'pmxmu5bzrc', 'Live Call - KI Automation mit Felix 04.03.2026', '', 69, 4341 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'p12l0miawe', 'Live Call - KI Vision 10.03.2026', '', 70, 7297 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'qoqr1lbbwv', 'Live Call - KI Content 12.03.2026', '', 71, 28747 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '82xjtfitj7', 'Live Call - Sales Funnel KI 17.03.2026', '', 72, 4557 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'g3l3w59mkh', 'Live Call - Viral mit KI 19.03.2026', '', 73, 8788 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '59gdjkhb0e', 'Live Call - Calvin Hollywood 23.03.2026', '', 74, 4496 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'tv91fv728v', 'Live Call - KI Automatisierung 25.03.2026', '', 75, 5991 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'w2oo2he5jp', 'Live Call - Sarah Rojewski 31.03.2026', '', 76, 4693 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'uwfb4li1oa', 'Live Call - Passives Einkommen mit KI 01.04.2026', '', 77, 5756 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, '3yxgro99be', 'Live Call - KI Plattform 08.04.2026', '## **🛠️ KI Plattform bauen & vermarkten – Live-Call Zusammenfassung**

🎤 Worum ging''s heute?

Jonas und Jakob haben live gezeigt, wie sie mit **Lovable, n8n und Claude** innerhalb von zwei Wochen eine vollständige KI-Plattform für die Immobilienbranche gebaut haben – ohne großes Entwickler-Team, ohne tiefen Coding-Hintergrund. 🏗️

---

🏠 Die Idee dahinter: EmoGPT für Immobilien

**Das Problem der Branche:** Virtuelles Homestaging kostet 3.000–5.000 € beim klassischen Anbieter. Makler haben Objekte, aber keine Reichweite. KI kann beides lösen – schnell und günstig.

**Die Lösung:** Eine Plattform mit zwei Kernprodukten:

1️⃣ **KI Bilder & Videos** – Virtuelles Staging, Renovierungsvisualisierungen, Outdoor-Staging, Roomtour-Videos, Vorher-Nachher-Transformationen

2️⃣ **Immo Coach** – KI-Assistent für Exposés, Social-Media-Posts, Immobilienanalysen, Kalkulationstools

👉 Alles in einer Oberfläche, statt fünf verschiedene Tools zu öffnen.

---

🆚 Lovable vs. Claude Code – wann was?

**Lovable:**

Kein Hosting-Setup nötig, direkt startenBesseres Design-Auge out of the boxSchnelleres AB-TestingIdeal für den Start und schnelle ValidierungCode ist jederzeit exportierbar → zu Claude Code übertragbar

**Claude Code:**

Mehr Kontrolle, weniger EinschränkungenKomplexe Datenbanklogik und APIs direkt integrierbarn8n teilweise ersetzbarFür Skalierung und komplexere Funktionen besser geeignet

👉 Empfehlung: **Mit Lovable starten, mit Claude Code skalieren** – kein entweder/oder.

---

🔁 Wie der Workflow hinter jedem Generator funktioniert

1. User lädt Bild + Beschreibung hoch → geht in Supabase
2. n8n-Webhook wird getriggert
3. ChatGPT/Claude analysiert das Bild und schreibt einen optimierten Prompt
4. Google Imagen generiert das Bild mit diesem Prompt
5. Bild wird in Cloudinary hochgeladen → Link zurück an die Plattform
6. User sieht das Ergebnis in Echtzeit

Für Videos: Start-Frame + End-Frame werden erst separat als Bilder erstellt, dann per [fal.ai](http://fal.ai) zum Video gerendert und zusammengeschnitten. 🎬

---

❌ Was sie beim nächsten Mal anders machen würden

**Zu viele Features auf einmal** → Lieber klein starten, erstes Feedback holen, dann erweitern.

**KI-Modelle zu früh festlegen** → Modelle ändern sich zu schnell. Plattformen wie [fal.ai](http://fal.ai) nutzen, die immer die neuesten Tools integrieren – so bleibt der Wechsel einfach.

**Credits-System zu spät eingeplant** → Abrechnung, Marge und Credit-Kalkulation gehören von Anfang an in den Plan. Im Nachhinein ist es aufwendig, überall nachzurüsten.

---

💰 Vermarktung: Was Reichweite wirklich bringt

Immotommy (2,5 Mio. Follower) + Herr Tech (700k Follower) = kaum noch Vermarktungsproblem.

Das Fazit: **Wenn Software kein limitierender Faktor mehr ist und Reichweite da ist, können Produkte in Wochen statt Monaten entstehen.** Die Kombination aus beiden macht den Unterschied.

---

🔑 Die wichtigsten Learnings aus dem Call

✅ Software ist kein limitierender Faktor mehr – jeder kann bauen 

✅ Immer das KI-Modell wählen, das für den Use Case optimiert ist 

✅ n8n-Grundverständnis aufbauen – nicht blind auf KI-Konnektoren verlassen 

✅ Nutzerdaten verlassen das System nicht – nur Prompts und IDs werden übergeben

✅ Schnell raus, Feedback holen, iterieren – nicht monatelang planen

---

🧠 Die wichtigste Erkenntnis

🚀 **Was früher Monate und ein ganzes Entwickler-Team brauchte, geht heute in zwei Wochen zu zweit.**

💥 Wer jetzt lernt, wie man Plattformen baut und vermarktet, sitzt in zwei Jahren an einem der wertvollsten Plätze im Markt.', 78, 5083 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, chapter_id, wistia_hashed_id, title, description, sort_order, duration_seconds) SELECT id, NULL, 'ggv8iduiif', 'Live Call - KI Vision 16.04.2026', '', 79, 8745 FROM public.course_modules WHERE slug = 'live-calls';
-- Total: 197 lessons, 7 chapters