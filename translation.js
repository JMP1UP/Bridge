// Translation, phrasebook, and dictionary library for English <-> German

const UI_TRANSLATIONS = {
  en: {
    stud_dashboard: "Student Dashboard",
    stud_chat: "My Pen Pals",
    stud_culture: "My Articles",
    stud_settings: "Account Settings",
    teach_dashboard: "Staff Dashboard",
    teach_students: "Student List",
    teach_matching: "Matching Tool",
    teach_safeguarding: "Safeguarding Control",
    teach_editor: "Editorial Desk",
    teach_settings: "School Settings",
    admin_dashboard: "Platform Admin",
    admin_schools: "Schools Directory",
    admin_settings: "Global Settings",
    new_coord_onboarding: "Onboarding Portal",
    dashboard: "Student Dashboard",
    my_penpals: "My Pen Pals",
    news_feed: "School News Feed",
    submit_article: "Submit Culture Article",
    language_help: "Language Assistant",
    report_concern: "Report a Concern",
    account_settings: "Account Settings",
    teacher_dashboard: "Staff Dashboard",
    student_mgmt: "Student List",
    matching_tool: "Pen Pal Matching",
    safeguarding_hub: "Safeguarding Control",
    news_article_review: "Editorial Corner",
    global_settings: "System Configuration",
    admin_panel: "Platform Administration",
    write_reply: "Write a Message",
    send: "Send",
    translate: "Translate",
    translation_tip: "Translate to German",
    flagged_warning: "This conversation is currently paused by teachers for safeguarding review.",
    paused_status: "Paused",
    active_status: "Active",
    invite_student: "Invite Student",
    bulk_upload: "Bulk Upload",
    match_now: "Match Selected",
    pause_chat: "Pause Chat",
    resume_chat: "Resume Chat",
    resolve: "Resolve Flag",
    approve: "Approve",
    reject: "Reject",
    audits: "Audit Logs",
    schools: "Registered Schools",
    add_school: "Add School",
    sentence_starters: "Sentence Starters",
    vocab_builder: "Vocabulary Builder",
    writing_prompts: "Writing Prompts",
    current_partner: "Pen Pal Match",
    activity_level: "Activity Level",
    welcome_title_matched: "Your Pen Pal is",
    welcome_title_unmatched: "You don't have a pen pal match yet!",
    welcome_desc_unmatched: "Your languages teacher will match you with a student from a partner school shortly.",
    school_label: "School",
    age_label: "Age",
    year_group_label: "Year group",
    send_message_btn: "Send a Message",
    write_article_btn: "Write a Culture Article",
    welcome_subtitle_student: "Welcome, {name}! Connect with your cultural exchange partner.",
    matched_status: "Matched",
    awaiting_match_status: "Awaiting Match",
    by_author: "By",
    no_articles_submitted: "No articles submitted yet.",
    staff_messages: "Staff Messages",
    no_conversation: "No Conversation Selected",
    select_coordinator: "Select a coordinator from the list to start chatting.",
    active_exchanges_label: "Active Exchanges",
    paired_students_text: "{count} students connected",
    chat_history_label: "Chat History",
    messages_exchanged_text: "{count} messages exchanged",
    shared_publications_label: "Shared Publications",
    published_articles_text: "{count} articles published"
  },
  de: {
    stud_dashboard: "Schüler-Dashboard",
    stud_chat: "Meine Brieffreunde",
    stud_culture: "Meine Beiträge",
    stud_settings: "Kontoeinstellungen",
    teach_dashboard: "Lehrer-Dashboard",
    teach_students: "Schülerliste",
    teach_matching: "Brieffreund-Vermittlung",
    teach_safeguarding: "Jugendschutz-Zentrale",
    teach_editor: "Redaktionsecke",
    teach_settings: "Schuleinstellungen",
    admin_dashboard: "Plattform-Administration",
    admin_schools: "Schulen-Verzeichnis",
    admin_settings: "Systemkonfiguration",
    new_coord_onboarding: "Onboarding-Portal",
    dashboard: "Schüler-Dashboard",
    my_penpals: "Meine Brieffreunde",
    news_feed: "Schulnachrichten",
    submit_article: "Kulturbeitrag Einreichen",
    language_help: "Sprachassistent",
    report_concern: "Bedenken Melden",
    account_settings: "Kontoeinstellungen",
    teacher_dashboard: "Lehrer-Dashboard",
    student_mgmt: "Schülerliste",
    matching_tool: "Brieffreund-Vermittlung",
    safeguarding_hub: "Jugendschutz-Zentrale",
    news_article_review: "Redaktionsecke",
    global_settings: "Systemkonfiguration",
    admin_panel: "Plattform-Administration",
    write_reply: "Nachricht Schreiben",
    send: "Senden",
    translate: "Übersetzen",
    translation_tip: "Ins Englische übersetzen",
    flagged_warning: "Dieses Gespräch wurde von den Lehrkräften zur Sicherheitsüberprüfung pausiert.",
    paused_status: "Pausiert",
    active_status: "Aktiv",
    invite_student: "Schüler einladen",
    bulk_upload: "Massen-Upload",
    match_now: "Ausgewählte koppeln",
    pause_chat: "Chat pausieren",
    resume_chat: "Chat fortsetzen",
    resolve: "Meldung klären",
    approve: "Freigeben",
    reject: "Ablehnen",
    audits: "Aktivitätslogs",
    schools: "Registrierte Schulen",
    add_school: "Schule hinzufügen",
    sentence_starters: "Satzanfänge",
    vocab_builder: "Wortschatz-Helfer",
    writing_prompts: "Schreibimpulse",
    current_partner: "Brieffreund",
    unmatched: "Nicht gekoppelt",
    activity_level: "Aktivitätslevel",
    welcome_title_matched: "Dein Brieffreund ist",
    welcome_title_unmatched: "Du hast noch keinen Brieffreund!",
    welcome_desc_unmatched: "Deine Lehrkraft wird dich in Kürze mit einem Schüler einer Partnerschule koppeln.",
    school_label: "Schule",
    age_label: "Alter",
    year_group_label: "Jahrgangsstufe",
    send_message_btn: "Nachricht senden",
    write_article_btn: "Kulturbeitrag schreiben",
    welcome_subtitle_student: "Willkommen, {name}! Tausche dich mit deinem Brieffreund aus.",
    matched_status: "Gekoppelt",
    awaiting_match_status: "Warte auf Kopplung",
    by_author: "Von",
    no_articles_submitted: "Noch keine Beiträge eingereicht.",
    staff_messages: "Lehrer-Nachrichten",
    no_conversation: "Keine Unterhaltung ausgewählt",
    select_coordinator: "Wähle eine Lehrkraft aus der Liste aus, um einen Chat zu starten.",
    active_exchanges_label: "Aktive Kopplungen",
    paired_students_text: "{count} Schüler verbunden",
    chat_history_label: "Chat-Verlauf",
    messages_exchanged_text: "{count} Nachrichten ausgetauscht",
    shared_publications_label: "Gemeinsame Beiträge",
    published_articles_text: "{count} Beiträge veröffentlicht"
  }
};

const SENTENCE_STARTERS = [
  {
    category: "Greetings / Begrüßungen",
    en: "Hi! I am very happy to meet you.",
    de: "Hallo! Ich freue mich sehr, dich kennenzulernen."
  },
  {
    category: "Greetings / Begrüßungen",
    en: "How are you? I hope you are doing well.",
    de: "Wie geht es dir? Ich hoffe, es geht dir gut."
  },
  {
    category: "About Me / Über mich",
    en: "In my free time, I like to...",
    de: "In meiner Freizeit mag ich es, zu..."
  },
  {
    category: "About Me / Über mich",
    en: "My favorite school subject is...",
    de: "Mein Lieblingsfach in der Schule ist..."
  },
  {
    category: "About Me / Über mich",
    en: "I live in a town called...",
    de: "Ich wohne in einer Stadt namens..."
  },
  {
    category: "Cultural Exchange / Kulturaustausch",
    en: "What is your school like in Germany?",
    de: "Wie ist deine Schule in Deutschland?"
  },
  {
    category: "Cultural Exchange / Kulturaustausch",
    en: "For breakfast, we usually eat...",
    de: "Zum Frühstück essen wir normalerweise..."
  },
  {
    category: "Cultural Exchange / Kulturaustausch",
    en: "How do you celebrate Christmas in your country?",
    de: "Wie feiert ihr Weihnachten in eurem Land?"
  },
  {
    category: "Sign-offs / Verabschiedungen",
    en: "I hope to hear from you soon!",
    de: "Ich hoffe, bald von dir zu hören!"
  },
  {
    category: "Sign-offs / Verabschiedungen",
    en: "Take care and talk soon.",
    de: "Mach's gut und bis bald."
  }
];

const VOCABULARY_LIST = [
  { en: "the school", de: "die Schule", category: "School" },
  { en: "the teacher", de: "der Lehrer / die Lehrerin", category: "School" },
  { en: "the classroom", de: "das Klassenzimmer", category: "School" },
  { en: "the pen pal", de: "der Brieffreund / die Brieffreundin", category: "Exchange" },
  { en: "cultural exchange", de: "der Kulturaustausch", category: "Exchange" },
  { en: "the country", de: "das Land", category: "Exchange" },
  { en: "tradition", de: "die Tradition", category: "Culture" },
  { en: "festival", de: "das Fest / das Festival", category: "Culture" },
  { en: "food", de: "das Essen", category: "Culture" },
  { en: "hobbies", de: "die Hobbys", category: "Hobbies" },
  { en: "sports", de: "der Sport", category: "Hobbies" },
  { en: "music", de: "die Musik", category: "Hobbies" }
];

const WRITING_PROMPTS = [
  {
    title: "Introduce Yourself",
    en: "Tell your pen pal about your family, pets, and what you did last weekend.",
    de: "Erzähle deinem Brieffreund von deiner Familie, deinen Haustieren und was du letztes Wochenende gemacht hast."
  },
  {
    title: "A Typical School Day",
    en: "Describe your school timetable. What time do classes start and finish? What is lunch like?",
    de: "Beschreibe deinen Stundenplan. Wann beginnt und endet der Unterricht? Wie ist das Mittagessen?"
  },
  {
    title: "National Holidays",
    en: "Explain a holiday unique to your country. What do you wear, eat, and do?",
    de: "Erkläre einen Feiertag, der typisch für dein Land ist. Was zieht ihr an, was esst ihr und was macht ihr?"
  }
];

// Dictionary translations for simple phrases
const SIMPLE_DICTIONARY = {
  "hello": "hallo",
  "hallo": "hello",
  "football": "Fußball",
  "fußball": "football",
  "school": "Schule",
  "schule": "school",
  "friend": "Freund",
  "freund": "friend",
  "yes": "ja",
  "ja": "yes",
  "no": "nein",
  "nein": "no",
  "how are you": "wie geht es dir",
  "wie geht es dir": "how are you",
  "good morning": "guten Morgen",
  "guten morgen": "good morning",
  "goodbye": "auf Wiedersehen",
  "auf wiedersehen": "goodbye",
  "england": "England",
  "deutschland": "Germany",
  "germany": "Deutschland",
  "leicester": "Leicester",
  "munich": "München",
  "münchen": "Munich"
};

/**
 * Smart mock translation between English and German.
 * If there is a direct match in SENTENCE_STARTERS or SIMPLE_DICTIONARY, it uses it.
 * Otherwise, it performs word-by-word substitution where possible or returns a simulated translation.
 */
function mockTranslate(text, sourceLang, targetLang) {
  if (!text || text.trim() === "") return "";
  if (sourceLang === targetLang) return text;

  const cleanText = text.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"");
  
  // 1. Check dictionary exact match
  if (SIMPLE_DICTIONARY[cleanText]) {
    const matched = SIMPLE_DICTIONARY[cleanText];
    // Capitalize first letter if original had it
    return text[0] === text[0].toUpperCase() ? matched.charAt(0).toUpperCase() + matched.slice(1) : matched;
  }

  // 2. Check sentence starters match
  for (const starter of SENTENCE_STARTERS) {
    if (starter[sourceLang].toLowerCase().includes(cleanText) || cleanText.includes(starter[sourceLang].toLowerCase())) {
      return starter[targetLang];
    }
  }

  // 3. Simple translation heuristics
  // We can do word substitution or a smart mock translation
  let words = text.split(" ");
  let translatedWords = words.map(word => {
    let cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"");
    let punctuation = word.slice(cleanWord.length);
    if (SIMPLE_DICTIONARY[cleanWord]) {
      let trans = SIMPLE_DICTIONARY[cleanWord];
      // Keep capitalization
      if (word[0] === word[0].toUpperCase()) {
        trans = trans.charAt(0).toUpperCase() + trans.slice(1);
      }
      return trans + punctuation;
    }
    return word;
  });

  // Mock-simulate full translation by appending a signature if we couldn't translate most words
  let translatedString = translatedWords.join(" ");
  if (translatedString === text) {
    // If no words were translated, simulate a translation
    if (targetLang === 'de') {
      return `[Übersetzt: ${text} -> Guten Tag, hier ist die deutsche Übersetzung für Ihre Nachricht.]`;
    } else {
      return `[Translated: ${text} -> Good day, here is the English translation for your message.]`;
    }
  }

  return translatedString;
}

window.translator = {
  UI_TRANSLATIONS,
  SENTENCE_STARTERS,
  VOCABULARY_LIST,
  WRITING_PROMPTS,
  mockTranslate
};
