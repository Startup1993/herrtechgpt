-- Generated: seed module_videos from Wistia matching
-- Auto-matched: 152 videos, manual overrides: 4

-- Clear existing seeds (safe because user hasn't added videos yet)
DELETE FROM public.module_videos;

-- === Module: claude (3 videos) ===
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'zh37bstbuy', 'HT Claude Aufsetzen', 1, 745 FROM public.course_modules WHERE slug = 'claude';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '4qw1a3luip', 'HT MCP', 2, 645 FROM public.course_modules WHERE slug = 'claude';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '34kt327vre', 'HT MCP 2', 3, 645 FROM public.course_modules WHERE slug = 'claude';

-- === Module: einfach-starten (1 videos) ===
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'w7vi114g8i', 'Einfach mal machen! 🚀', 1, 713 FROM public.course_modules WHERE slug = 'einfach-starten';

-- === Module: ki-agenten (21 videos) ===
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '9fjx7g6n7b', 'Automatisieren-fuer-Einsteiger-esv2-88p-bg-10p', 1, 801 FROM public.course_modules WHERE slug = 'ki-agenten';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '79edhvakor', 'Automatisierter Youtube Kanal mit KI 2', 2, 1166 FROM public.course_modules WHERE slug = 'ki-agenten';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'u91f1tkbfc', 'Automatisierungs Agentur Aufbau mit Felix - 2025_07_31 16_44 CEST - Recording', 3, 4689 FROM public.course_modules WHERE slug = 'ki-agenten';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'zoaqzumgja', 'Call - Automatisierung mit KI Agenten', 4, 4972 FROM public.course_modules WHERE slug = 'ki-agenten';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'umdsce8iz8', 'HT Video Creator', 5, 0 FROM public.course_modules WHERE slug = 'ki-agenten';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'gejb8dm04e', 'KI Agenten Call - 2025_07_01 15_44 CEST - Recording', 6, 6108 FROM public.course_modules WHERE slug = 'ki-agenten';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'bgldj8xxu3', 'KI Agenten Live Call - 2025_12_18 15_40 CET - Recording', 7, 5152 FROM public.course_modules WHERE slug = 'ki-agenten';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'snux31ipzf', 'KI Agenten Live Call - 2026_02_16 15_49 CET - Recording', 8, 7879 FROM public.course_modules WHERE slug = 'ki-agenten';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '8u6805wyxt', 'KI Agentur Aufbau mit Felix 🥳 - 2025_10_01 16_44 CEST - Recording', 9, 5348 FROM public.course_modules WHERE slug = 'ki-agenten';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'pmxmu5bzrc', 'KI Agentur aufbauen mit der Automation Legende Felix  - 2026_03_04 16_54 CET - Recording', 10, 4341 FROM public.course_modules WHERE slug = 'ki-agenten';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'tv91fv728v', 'KI Automatisierung - 2026_03_25 15_52 CET - Recording', 11, 5991 FROM public.course_modules WHERE slug = 'ki-agenten';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'bnizatosm1', 'make_17_Auto_Lead_Verarbeitung', 12, 1173 FROM public.course_modules WHERE slug = 'ki-agenten';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '7ak5azpuhh', 'n8n-auto-selfie-videos-v1', 13, 1120 FROM public.course_modules WHERE slug = 'ki-agenten';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'npx2e6vx6p', 'n8n-auto-selfie-videos-v1_1', 14, 1120 FROM public.course_modules WHERE slug = 'ki-agenten';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'f455gpiks5', 'n8n-autocontent-v1', 15, 1365 FROM public.course_modules WHERE slug = 'ki-agenten';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'bd7oyb4m0x', 'n8n_Intro+Newsletter_1-start', 16, 127 FROM public.course_modules WHERE slug = 'ki-agenten';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'e7drmae081', 'n8n_Intro+Newsletter_3-why', 17, 160 FROM public.course_modules WHERE slug = 'ki-agenten';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'wd2k0ztden', 'n8n_Intro+Newsletter_4-how', 18, 120 FROM public.course_modules WHERE slug = 'ki-agenten';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'ih927w1zul', 'n8n_Intro+Newsletter_5-hacks', 19, 61 FROM public.course_modules WHERE slug = 'ki-agenten';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '36atozxjnb', 'n8n_Intro+Newsletter_6-tutorial', 20, 413 FROM public.course_modules WHERE slug = 'ki-agenten';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '86gxudamoe', 'n8n_Intro+Newsletter_7-outro', 21, 63 FROM public.course_modules WHERE slug = 'ki-agenten';

-- === Module: ki-content-erstellung (12 videos) ===
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '1m7921ojri', '01 - Die Vorteile von KI Influencer & KI Content', 1, 2208 FROM public.course_modules WHERE slug = 'ki-content-erstellung';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'tetuyp9rci', '02 - KI Influencer & KI Content erstellen', 2, 171 FROM public.course_modules WHERE slug = 'ki-content-erstellung';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'areke39nhd', '03- KI Influencer & KI Content erstellen', 3, 1472 FROM public.course_modules WHERE slug = 'ki-content-erstellung';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'wyj2q5n3x0', '04 - Die KI Video Generierung', 4, 829 FROM public.course_modules WHERE slug = 'ki-content-erstellung';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'a0edyx4px2', '05 - KI Visuals erstellen', 5, 694 FROM public.course_modules WHERE slug = 'ki-content-erstellung';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'i26t15dt6t', '06 - Das Drehbuch: KI Storytelling at its finest', 6, 2034 FROM public.course_modules WHERE slug = 'ki-content-erstellung';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'pcei207wk4', 'Automatisierte KI-Content-Erstellung', 7, 349 FROM public.course_modules WHERE slug = 'ki-content-erstellung';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'jjclk7x0iu', 'KI Influencer Kurs_NEU', 8, 1978 FROM public.course_modules WHERE slug = 'ki-content-erstellung';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '83wdm5ns53', 'Perfekte Klone & Avatare erstellen - 2025_06_03 15_51 CEST - Recording', 9, 11426 FROM public.course_modules WHERE slug = 'ki-content-erstellung';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '9gco8pzsnv', 'Skool 3D Avatare', 10, 0 FROM public.course_modules WHERE slug = 'ki-content-erstellung';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'omi393rvzf', 'Vollautomatisierte Social Media Posts erstellen 🚀', 11, 668 FROM public.course_modules WHERE slug = 'ki-content-erstellung';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'x81z0t7crv', 'Vollautomatisierte Social Media Videos', 12, 893 FROM public.course_modules WHERE slug = 'ki-content-erstellung';

-- === Module: ki-marketing-course (8 videos) ===
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'ki2hrtz63s', '01 - Intro', 1, 0 FROM public.course_modules WHERE slug = 'ki-marketing-course';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'pa21so3f93', '02 - Einzigartiges KI Marketing', 2, 1016 FROM public.course_modules WHERE slug = 'ki-marketing-course';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'i42d1vzzzg', '03 - Marketing Strategie mit KI', 3, 2560 FROM public.course_modules WHERE slug = 'ki-marketing-course';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 's030zb029h', '04 - Deine (KI) Brand', 4, 1644 FROM public.course_modules WHERE slug = 'ki-marketing-course';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '2uva0xd5ks', '05 - Algorithmus verstehen', 5, 2743 FROM public.course_modules WHERE slug = 'ki-marketing-course';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'a3bybnadqm', '06 - Das virale Skript und die Hook (!)', 6, 2462 FROM public.course_modules WHERE slug = 'ki-marketing-course';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'ony45b9ktb', 'Masterclass_Intro_v1', 7, 209 FROM public.course_modules WHERE slug = 'ki-marketing-course';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'jwzw3uvjla', 'Bonus: Kreativität finden', 8, 996 FROM public.course_modules WHERE slug = 'ki-marketing-course';

-- === Module: ki-musik (11 videos) ===
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'dzwstl5i8o', '1 - Einführung und Text mit ChatGPT', 1, 0 FROM public.course_modules WHERE slug = 'ki-musik';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'arkbwj1rse', '2 - Rap - und erste Schritte mit Suno AI', 2, 817 FROM public.course_modules WHERE slug = 'ki-musik';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'iaqdvaxzqr', '3- House', 3, 1387 FROM public.course_modules WHERE slug = 'ki-musik';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '5gf0ptjht3', '4- Schlager- Ein Song für Mutti', 4, 629 FROM public.course_modules WHERE slug = 'ki-musik';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'e4kgecifxs', '5 - kurze songs für social Media', 5, 882 FROM public.course_modules WHERE slug = 'ki-musik';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '4g9xcuz3mx', 'KI Musik - 07.11.2025', 6, 4132 FROM public.course_modules WHERE slug = 'ki-musik';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'key46z7be7', 'Live Call - Steffen KI Musik - 2025_08_26 16_51 CEST - Recording', 7, 5171 FROM public.course_modules WHERE slug = 'ki-musik';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '2myw5jzv6m', 'Musik Promotion Live Call - 2026_01_21 16_51 CET - Recording', 8, 5074 FROM public.course_modules WHERE slug = 'ki-musik';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'bbzobtprbs', 'Viral Erfolg mit KI-Musik_ Strategien für Künstler', 9, 1670 FROM public.course_modules WHERE slug = 'ki-musik';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'fayoax6znl', 'Bonus - KI Musik', 10, 524 FROM public.course_modules WHERE slug = 'ki-musik';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'xnsx919zgf', 'Bonus - Swing und Jazz', 11, 337 FROM public.course_modules WHERE slug = 'ki-musik';

-- === Module: ki-seo (1 videos) ===
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'de9ktjd2eb', 'KI und SEO-Automatisierung: Ein neuer Ansatz 🚀 | Loom', 1, 1120 FROM public.course_modules WHERE slug = 'ki-seo';

-- === Module: ki-telefonie (3 videos) ===
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 's0hps33db6', 'KI Telefonie Live Call mit Daniel von Fonio - 2025_12_15 17_52 CET - Recording', 1, 4582 FROM public.course_modules WHERE slug = 'ki-telefonie';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'mtiv4m4utg', 'KI Telefonie mit Daniel von Fonio - 2025_07_10 16_55 CEST - Recording', 2, 3979 FROM public.course_modules WHERE slug = 'ki-telefonie';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '9h9srpllzi', 'Live Call KI Telefonie - 2025_05_26 16_28 CEST - Recording', 3, 4356 FROM public.course_modules WHERE slug = 'ki-telefonie';

-- === Module: ki-toolboard (6 videos) ===
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'eoowp03rev', 'ChatGPT - 27 April 2025', 1, 1489 FROM public.course_modules WHERE slug = 'ki-toolboard';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'pse5r148cs', 'Die besten KI-Tools für euch! 🚀', 2, 1379 FROM public.course_modules WHERE slug = 'ki-toolboard';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'plll1dyhji', 'Plattform Tutorial', 3, 174 FROM public.course_modules WHERE slug = 'ki-toolboard';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'l8oz23u62i', 'herrtech-skool-atlas-teil1', 4, 503 FROM public.course_modules WHERE slug = 'ki-toolboard';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '4lgvr6myev', 'herrtech-skool-atlas-teil2', 5, 318 FROM public.course_modules WHERE slug = 'ki-toolboard';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'v2uohx4zm7', 'herrtech-skool-atlas-teil3', 6, 436 FROM public.course_modules WHERE slug = 'ki-toolboard';

-- === Module: ki-vertrieb (29 videos) ===
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'gdtrbk5yxx', '1) Sales und KI - Einführung', 1, 532 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'n38b89ne35', '2) Laserfokus auf Leadgenerierung', 2, 1047 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'vfhrchji80', '3) Erfolgreiche Telefonakquise', 3, 2100 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 't3e52tonut', '4.1) E-Mail Marketing Strategien 📧', 4, 964 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'tw16uc8zwu', '4.2) Kunden finden mit LinkedIn', 5, 1302 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'u9yezgzue5', '4.3) DATEN EXPORTIEREN MIT PHANTOMBUSTER', 6, 671 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'i3li8tgnjr', '4.4) Datendownload mit Waalaxy (1) (1)', 7, 1128 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '44ckq7qzac', '4.5) Vergleich von E-Mail-Finder-Tools 📧', 8, 1443 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'rzmxuzkdhv', '4.6) E-Mail-Akquise mit Reply IO und Valaxie 🚀', 9, 1439 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'lub9pu6wam', '5.0) Strategien für Kaltakquise auf LinkedIn', 10, 1157 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'lec0lvmtgt', '5.1) Strategien für erfolgreiche LinkedIn-Kampagnen', 11, 1253 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '5x4uo1da2m', '5.2) Trigify', 12, 346 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'dhjm7i4sec', '6) Kunden überzeugen', 13, 2536 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'k27rvc9455', '7) Den Sack zumachen', 14, 1872 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '9cctf6juz0', 'Der perfekte Sales Funnel - 2025_10_24 16_45 CEST - Recording', 15, 5407 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'v113faclea', 'KI Email & Linkedin Automatisierung - 2025_06_11 14_50 CEST - Recording', 16, 8102 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '7o1hr71xft', 'KI Vertrieb - 2026_02_13 15_54 CET - Recording', 17, 3706 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'fonz4sc9ff', 'KI Vertrieb Automatisierung - 12.11.2025', 18, 4516 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'dmvcykoevx', 'KI Vertrieb mit Steffen - 2025_10_16 17_49 CEST - Recording', 19, 7472 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'i4ylzupbqk', 'KI Vertriebs Call - 2025_05_07 16_46 CEST - Recording', 20, 6631 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'wf0wvbujn4', 'Linkedin Automation_Ansprache - 2025_12_22 16_39 CET - Recording', 21, 5039 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'phd1ub2f7f', 'Linkedin Viral - Nadine Rippler - 2026_01_08 17_53 CET - Recording', 22, 7411 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '0aoy40t20r', 'Live Call - Sales Mails Outbound - 2025_07_24 16_44 CEST - Recording', 23, 3357 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'eazt0guklj', 'Sales Funnel Call mit Nico - 2026_01_29 16_47 CET - Recording', 24, 5386 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '4pwi2tr905', 'Sales Funnel Live Call mit Nico - 2025_12_04 17_44 CET - Recording', 25, 8810 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'lq7qtfqdnx', 'Skool_Sales Funnel_Komplett', 26, 4302 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '8m3fqp5uvl', 'Von der Kaltakquise bis zum Lead - 2025_09_18 15_54 CEST - Recording', 27, 4916 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'mmjf73mzwo', 'n8n-Kaltakquise', 28, 1456 FROM public.course_modules WHERE slug = 'ki-vertrieb';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'edznz6ge0t', 'n8n-Kaltakquise-v2', 29, 1464 FROM public.course_modules WHERE slug = 'ki-vertrieb';

-- === Module: live-calls (31 videos) ===
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'k9hjh38x2r', '2. Live Call', 1, 7184 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'mwucztdexr', 'Account_Business Model Roasting - 2025_10_13 16_56 CEST - Recording', 2, 10470 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'pztnd2tukw', 'Ads Call - KI Club - 2026_01_26 17_41 CET - Recording', 3, 6217 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '59gdjkhb0e', 'Calvin Hollywood kommt in den KI Club 🤩 - 2026_03_23 16_46 CET - Recording', 4, 4496 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'y0on6z0sr5', 'Community Business aufbauen & KI Marketing dafür machen  - 2025_11_20 17_21 CET - Recording', 5, 3750 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'p37t2t3ljd', 'Content & Account Roasting mit der Social Media Legende Franz Wegner - 2025_11_18 17_54 CET - Recording', 6, 6730 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'r71ra7q32e', 'Einzigartiger KI Content & KI Influencer - 2025_07_18 15_44 CEST - Recording', 7, 9581 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'pfw5yuq5za', 'Einzigartiger KI Content & KI Influencer - 2025_07_18 15_44 CEST - Recording 2', 8, 8785 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'qoqr1lbbwv', 'KI Content Call - 2026_03_12 16_41 CET - Recording', 9, 28747 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'yjk7wlmbbj', 'KI Content Erstellung - 2025_12_09 17_11 CET - Recording', 10, 10485 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'i6ts7va5ti', 'KI Content Erstellung - 2026_02_05 16_43 CET - Recording', 11, 8746 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'tnsbjxxjkt', 'KI Content Q&A Aufzeichnung', 12, 7923 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'te2txrvc3j', 'KI Content erstellen - Live Call - 2025_04_30 15_55 CEST - Recording', 13, 7465 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'mc1x0y5bh2', 'KI Live Call - 2025_07_03 16_52 CEST - Recording', 14, 7159 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'vdv1y9cyyb', 'KI Live Call mit Flo - 2025_06_05 16_47 CEST - Recording', 15, 8066 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '3yxgro99be', 'KI Plattform bauen & vermarkten - 2026_04_08 16_47 CEST - Recording', 16, 5083 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'mzj4r2ke3c', 'KI Strategie - Live Call - 2025_09_26 15_47 CEST - Recording', 17, 6635 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '9c3hsglgyp', 'KI Vision - 2025_10_22 16_58 CEST - Recording', 18, 7954 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'p12l0miawe', 'KI Vision_KI Strategie - 2026_03_10 17_10 CET - Recording', 19, 7297 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'ggv8iduiif', 'KI Vision_KI Strategie - 2026_04_16 17_40 CEST - Recording', 20, 8745 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'iazgeoejv3', 'KI Vision_Strategie - 2025_11_28 17_51 CET - Recording', 21, 8253 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'p5y87enjxl', 'KI Vision_Strategie Call - 2026_02_02 17_50 CET - Recording', 22, 6406 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'j7elvsaa54', 'LIVE SPEZIAL - Franz Wegner kommt in den KI Club - 2026_02_23 17_56 CET - Recording', 23, 5252 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'w2oo2he5jp', 'LIVE SPEZIAL mit Sarah Rojewski 🥳 - 2026_03_31 17_44 CEST - Recording', 24, 4693 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '09ufhuvn7x', 'Live Call - Doing!', 25, 8288 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'vsmporm6lb', 'Live Call - mit Flo - 2025_05_28 15_49 CEST - Recording', 26, 5036 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'tpuu1n65h7', 'Live Call mit Flo - 2025_06_20 15_52 CEST - Recording', 27, 5693 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'o6bl0lg02j', 'Live Call mit Flo 🔥 - 2025_06_27 17_47 CEST - Recording', 28, 8758 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'v3v4968jzs', 'Live Call 🤩 - 2025_05_08 14_13 CEST - Recording', 29, 6782 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'bfu37cyi1q', 'Live Call_ Automatisierung - 2025_04_24 15_56 CEST - Recording', 30, 7500 FROM public.course_modules WHERE slug = 'live-calls';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'yts79obeu8', 'Skool Community langfristig aufbauen - mit Mr. Skool - 2025_09_03 16_45 CEST - Recording', 31, 5994 FROM public.course_modules WHERE slug = 'live-calls';

-- === Module: passives-einkommen (6 videos) ===
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'su8dctvvr7', 'Passives Einkommen mit KI - 2025_07_21 16_41 CEST - Recording', 1, 5769 FROM public.course_modules WHERE slug = 'passives-einkommen';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '5danrtwgdh', 'Passives Einkommen mit KI - 2025_10_07 16_50 CEST - Recording', 2, 7538 FROM public.course_modules WHERE slug = 'passives-einkommen';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '39ysd9oqyl', 'Passives Einkommen mit KI - 2025_12_12 16_51 CET - Recording', 3, 11188 FROM public.course_modules WHERE slug = 'passives-einkommen';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '8tf3dcbonp', 'Passives Einkommen mit KI - 2026_02_18 16_50 CET - Recording', 4, 6439 FROM public.course_modules WHERE slug = 'passives-einkommen';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'uwfb4li1oa', 'Passives Einkommen mit KI - 2026_04_01 16_42 CEST - Recording', 5, 5756 FROM public.course_modules WHERE slug = 'passives-einkommen';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'w2wnsiuqca', 'Passives Einkommen mit KI_ Möglichkeiten und Strategien', 6, 1641 FROM public.course_modules WHERE slug = 'passives-einkommen';

-- === Module: prompt-legende (1 videos) ===
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'plofhshwli', 'Die Kunst des Promptings', 1, 998 FROM public.course_modules WHERE slug = 'prompt-legende';

-- === Module: rechtliche-grenzen (3 videos) ===
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'q0fixcj78b', 'KI & Recht - 2025_11_24 17_51 CET - Recording', 1, 6038 FROM public.course_modules WHERE slug = 'rechtliche-grenzen';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'l39m8pyav8', 'KI & Recht mit Boris - 2025_08_13 16_51 CEST - Recording', 2, 5420 FROM public.course_modules WHERE slug = 'rechtliche-grenzen';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '3thohhw2iw', 'Rechtliche Grenzen von KI', 3, 861 FROM public.course_modules WHERE slug = 'rechtliche-grenzen';

-- === Module: sora-2 (6 videos) ===
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'tyt6fzcazp', 'Konsistente Charaktere in SORA_SKOOL', 1, 717 FROM public.course_modules WHERE slug = 'sora-2';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'g3l3w59mkh', 'SUPER VIRAL MIT KI! - 2026_03_19 17_48 CET - Recording', 2, 8788 FROM public.course_modules WHERE slug = 'sora-2';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'cvlnu9gf6n', 'Super viral mit KI - 2025_12_01 17_30 CET - Recording', 3, 8250 FROM public.course_modules WHERE slug = 'sora-2';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '9etgvd0qoz', 'Super viral mit KI - 2026_02_10 17_41 CET - Recording', 4, 8314 FROM public.course_modules WHERE slug = 'sora-2';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '039tbiqxpg', 'Viral-mit-Sora2-v1', 5, 635 FROM public.course_modules WHERE slug = 'sora-2';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'yecbgy7vn7', 'sora2+cameo-de-2', 6, 217 FROM public.course_modules WHERE slug = 'sora-2';

-- === Module: veo3 (8 videos) ===
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '8ftb0fko2h', 'Die Zukunft des Content Creation mit VO3_ Chancen und Strategien', 1, 1719 FROM public.course_modules WHERE slug = 'veo3';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'f33ulzue83', 'Lipsync mit VEO3_Skool', 2, 779 FROM public.course_modules WHERE slug = 'veo3';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '28ru5k53qu', 'Skool_VEO3_Prompting', 3, 1442 FROM public.course_modules WHERE slug = 'veo3';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'nlxer2t5ot', 'Skool_VEO3_konkretes Beispiel', 4, 890 FROM public.course_modules WHERE slug = 'veo3';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'm6p8u4w0py', 'Veo3_Sora2_Livecall', 5, 5224 FROM public.course_modules WHERE slug = 'veo3';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'i02youkxnt', 'Viral gehen mit Veo 3 - 2025_09_10 16_44 CEST - Recording', 6, 3613 FROM public.course_modules WHERE slug = 'veo3';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'ba67fkv1qj', 'n8n-Veo3-Agent-Video-v1', 7, 1067 FROM public.course_modules WHERE slug = 'veo3';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'ziqf43kiav', 'n8n-Veo3-Agent-Video-v2', 8, 1067 FROM public.course_modules WHERE slug = 'veo3';

-- === Module: viraler-content (6 videos) ===
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'hili1jsgvo', 'Content-Strategien und Automatisierung (1)', 1, 1781 FROM public.course_modules WHERE slug = 'viraler-content';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'x9abyhr3hq', 'Das virale Skript - mit Flo - 2025_07_07 17_45 CEST - Recording', 2, 8077 FROM public.course_modules WHERE slug = 'viraler-content';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'qa17gob1di', 'Live Call - Das virale Skript - 2025_05_23 16_55 CEST - Recording', 3, 8040 FROM public.course_modules WHERE slug = 'viraler-content';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 'd84n3xb68b', 'Live Call_ Die Hook - 2025_05_13 16_54 CEST - Recording', 4, 6227 FROM public.course_modules WHERE slug = 'viraler-content';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, '0vaua8z7s3', 'Viral gehen mit KI - Use Case Mr. Techno - 2025_08_20 16_36 CEST - Recording', 5, 7051 FROM public.course_modules WHERE slug = 'viraler-content';
INSERT INTO public.module_videos (module_id, wistia_hashed_id, title, sort_order, duration_seconds) SELECT id, 't6hqoqniw5', 'Viral gehen_Account Roasting - 2025_09_29 16_21 CEST - Recording', 6, 10168 FROM public.course_modules WHERE slug = 'viraler-content';

-- Total: 156 videos inserted