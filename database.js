// Database state layer for Pen Pal platform
const DB_KEY = 'penpal_exchange_db';

const defaultDatabase = {
  schools: [
    { 
      id: 'school_1', 
      name: 'Leicester High School', 
      country: 'United Kingdom', 
      city: 'Leicester', 
      language: 'en', 
      code: 'LEI-UK',
      description: "Leicester High School is an independent girls' school located in Leicester, UK. Established in 1906, we provide a warm, nurturing environment that fosters academic excellence, confidence, and international cooperation. Our students are encouraged to be independent thinkers and global citizens.",
      photoUrl: "assets/leicester_campus.jpg",
      logoUrl: "assets/leicester_logo.jpg"
    },
    { 
      id: 'school_2', 
      name: 'Goethe-Gymnasium', 
      country: 'Germany', 
      city: 'Munich', 
      language: 'de', 
      code: 'GOE-DE',
      description: "Goethe-Gymnasium is a mixed, state-supported academic high school (Gymnasium) located in Munich, Germany. We focus on modern languages, science, and international cultural exchanges. We are proud to partner with schools globally to foster bilingual learning and friendships.",
      photoUrl: "assets/goethe_campus.png",
      logoUrl: "assets/goethe_logo.png"
    },
    { 
      id: 'school_3', 
      name: 'Lycée Saint-Exupéry', 
      country: 'France', 
      city: 'Lyon', 
      language: 'fr', 
      code: 'LYC-FR',
      description: "Lycée Saint-Exupéry is a historic high school in Lyon, France. We specialize in international studies, literature, and art history.",
      photoUrl: "",
      logoUrl: ""
    }
  ],
  students: [
    // UK Students (All female for Leicester High School)
    { id: 'stud_1', name: 'Harriet Potter', email: 'harriet@leicesterhigh.edu', age: 14, gender: 'Female', yearGroup: 'Year 9', schoolId: 'school_1', language: 'en', active: true, matchStatus: 'matched', activityLevel: 'High', invitationStatus: 'Active', personalBiog: "Hi! I'm Harriet. I love drawing, playing tennis, and learning languages. I live in Leicester with my family.", pendingBiog: "", personalBiogStatus: "Approved" },
    { id: 'stud_2', name: 'Emily Watson', email: 'emily@leicesterhigh.edu', age: 13, gender: 'Female', yearGroup: 'Year 8', schoolId: 'school_1', language: 'en', active: true, matchStatus: 'matched', activityLevel: 'Medium', invitationStatus: 'Active', personalBiog: "", pendingBiog: "I love baking chocolate chip cookies and reading mystery novels.", personalBiogStatus: "Pending" },
    { id: 'stud_3', name: 'Jessica Smith', email: 'jessica@leicesterhigh.edu', age: 14, gender: 'Female', yearGroup: 'Year 9', schoolId: 'school_1', language: 'en', active: true, matchStatus: 'matched', activityLevel: 'Medium', invitationStatus: 'Active', personalBiog: "", pendingBiog: "", personalBiogStatus: "None" },
    { id: 'stud_4', name: 'Chloe Jones', email: 'chloe@leicesterhigh.edu', age: 13, gender: 'Female', yearGroup: 'Year 8', schoolId: 'school_1', language: 'en', active: true, matchStatus: 'matched', activityLevel: 'Low', invitationStatus: 'Active', personalBiog: "", pendingBiog: "", personalBiogStatus: "None" },
    { id: 'stud_5', name: 'Tabitha Brown', email: 'tabitha@leicesterhigh.edu', age: 14, gender: 'Female', yearGroup: 'Year 9', schoolId: 'school_1', language: 'en', active: false, matchStatus: 'unmatched', activityLevel: 'None', invitationStatus: 'Invited', personalBiog: "", pendingBiog: "", personalBiogStatus: "None" },
    { id: 'stud_6', name: 'Sophia Taylor', email: 'sophia@leicesterhigh.edu', age: 15, gender: 'Female', yearGroup: 'Year 10', schoolId: 'school_1', language: 'en', active: false, matchStatus: 'unmatched', activityLevel: 'None', invitationStatus: 'Invited', personalBiog: "", pendingBiog: "", personalBiogStatus: "None" },

    // German Students (Mixed school)
    { id: 'stud_7', name: 'Lukas Schmidt', email: 'lukas@goethe.edu', age: 14, gender: 'Male', yearGroup: 'Klasse 9', schoolId: 'school_2', language: 'de', active: true, matchStatus: 'matched', activityLevel: 'High', invitationStatus: 'Active', personalBiog: "Hallo! Ich bin Lukas. Ich spiele gerne Fußball und zocke Minecraft. Ich freue mich auf den Austausch!", pendingBiog: "", personalBiogStatus: "Approved" },
    { id: 'stud_8', name: 'Hanna Müller', email: 'hanna@goethe.edu', age: 13, gender: 'Female', yearGroup: 'Klasse 8', schoolId: 'school_2', language: 'de', active: true, matchStatus: 'matched', activityLevel: 'High', invitationStatus: 'Active', personalBiog: "", pendingBiog: "", personalBiogStatus: "None" },
    { id: 'stud_9', name: 'Jonas Wagner', email: 'jonas@goethe.edu', age: 14, gender: 'Male', yearGroup: 'Klasse 9', schoolId: 'school_2', language: 'de', active: true, matchStatus: 'matched', activityLevel: 'Medium', invitationStatus: 'Active', personalBiog: "", pendingBiog: "", personalBiogStatus: "None" },
    { id: 'stud_10', name: 'Mia Fischer', email: 'mia@goethe.edu', age: 13, gender: 'Female', yearGroup: 'Klasse 8', schoolId: 'school_2', language: 'de', active: true, matchStatus: 'matched', activityLevel: 'Low', invitationStatus: 'Active', personalBiog: "", pendingBiog: "", personalBiogStatus: "None" },
    { id: 'stud_11', name: 'Sophie Weber', email: 'sophie@goethe.edu', age: 13, gender: 'Female', yearGroup: 'Klasse 8', schoolId: 'school_2', language: 'de', active: false, matchStatus: 'unmatched', activityLevel: 'None', invitationStatus: 'Invited', personalBiog: "", pendingBiog: "", personalBiogStatus: "None" },
    { id: 'stud_12', name: 'Leon Becker', email: 'leon@goethe.edu', age: 15, gender: 'Male', yearGroup: 'Klasse 10', schoolId: 'school_2', language: 'de', active: false, matchStatus: 'proposed', activityLevel: 'None', invitationStatus: 'Invited', personalBiog: "", pendingBiog: "", personalBiogStatus: "None" }
  ],
  matches: [
    { id: 'match_1', type: '1-to-1', studentIds: ['stud_1', 'stud_7'], active: true, status: 'Active', createdAt: '2026-05-10T10:00:00Z', paused: false },
    { id: 'match_2', type: '1-to-1', studentIds: ['stud_2', 'stud_8'], active: true, status: 'Active', createdAt: '2026-05-12T11:30:00Z', paused: false },
    { id: 'match_3', type: '1-to-1', studentIds: ['stud_3', 'stud_9'], active: true, status: 'Active', createdAt: '2026-05-15T09:15:00Z', paused: false },
    { id: 'match_4', type: '1-to-1', studentIds: ['stud_4', 'stud_10'], active: true, status: 'Active', createdAt: '2026-05-16T14:20:00Z', paused: false },
    { id: 'match_5', type: '1-to-1', studentIds: [null, 'stud_12'], active: false, status: 'Proposed', proposedBySchoolId: 'school_2', pendingApprovalFromSchoolId: 'school_1', createdAt: '2026-06-20T10:00:00Z', paused: false }
  ],
  messages: [
    // Harriet and Lukas
    { id: 'msg_1', matchId: 'match_1', senderId: 'stud_1', text: "Hello Lukas! I am Harriet from Leicester. I'm excited to be your pen pal. Do you like football?", translation: "Hallo Lukas! Ich bin Harriet aus Leicester. Ich freue mich, deine Brieffreundin zu sein. Magst du Fußball?", timestamp: '2026-05-10T14:30:00Z', read: true, flagged: false },
    { id: 'msg_2', matchId: 'match_1', senderId: 'stud_7', text: "Hallo Harriet! Yes, I love football. I support Bayern Munich. What about you?", translation: "Hallo Harriet! Ja, ich liebe Fußball. Ich unterstütze Bayern München. Und du?", timestamp: '2026-05-11T09:12:00Z', read: true, flagged: false },
    { id: 'msg_3', matchId: 'match_1', senderId: 'stud_1', text: "Nice! I support Leicester City FC. We should chat about the matches. I also enjoy playing video games.", translation: "Schön! Ich unterstütze Leicester City FC. Wir sollten uns über die Spiele unterhalten. Ich spiele auch gerne Videospiele.", timestamp: '2026-05-12T16:45:00Z', read: true, flagged: false },
    { id: 'msg_4', matchId: 'match_1', senderId: 'stud_7', text: "I play Minecraft and FIFA. Do you have a favorite school subject?", translation: "Ich play Minecraft und FIFA. Hast du ein Lieblingsfach in der Schule?", timestamp: '2026-05-13T10:05:00Z', read: false, flagged: false },

    // Emily and Hanna
    { id: 'msg_5', matchId: 'match_2', senderId: 'stud_2', text: "Hi Hanna! How is the weather in Munich? Here in Leicester it is raining again!", translation: "Hallo Hanna! Wie ist das Wetter in München? Hier in Leicester regnet es schon wieder!", timestamp: '2026-05-12T12:00:00Z', read: true, flagged: false },
    { id: 'msg_6', matchId: 'match_2', senderId: 'stud_8', text: "Hallo Emily! Here it is sunny today. We are going to the park. What do you do in your free time?", translation: "Hallo Emily! Hier ist es heute sonnig. Wir gehen in den Park. Was machst du in deiner Freizeit?", timestamp: '2026-05-13T15:20:00Z', read: true, flagged: false },

    // Jessica and Jonas - with a flagged message
    { id: 'msg_7', matchId: 'match_3', senderId: 'stud_3', text: "Hey Jonas, what are you doing this weekend?", translation: "Hey Jonas, was makst du dieses Wochenende?", timestamp: '2026-06-18T10:00:00Z', read: true, flagged: false },
    { id: 'msg_8', matchId: 'match_3', senderId: 'stud_9', text: "Hey Jessica, I am staying home. Hey, can you give me your phone number? Let's meet up in secret sometime!", translation: "Hey Jessica, ich bleibe zu Hause. Du, kannst du mir deine Handynummer geben? Lass uns mal heimlich treffen!", timestamp: '2026-06-19T11:05:00Z', read: true, flagged: true, flagReason: 'Contains sensitive terms: "phone number", "meet up in secret"' },
    { id: 'msg_9', matchId: 'match_1', senderId: 'stud_7', text: "Can you send me your email address so we can chat on Skype?", translation: "Kannst du mir deine E-Mail-Adresse schicken, damit wir über Skype chatten können?", timestamp: '2026-05-15T10:00:00Z', read: true, flagged: false },
    { id: 'msg_10', matchId: 'match_2', senderId: 'stud_2', text: "Lass uns morgen heimlich treffen!", translation: "Let's meet up in secret tomorrow!", timestamp: '2026-06-01T15:30:00Z', read: true, flagged: false }
  ],
  articles: [
    {
      id: 'art_1',
      title: 'Afternoon Tea in England',
      content: 'In England, Afternoon Tea is a very old tradition. It started in the 1840s. Usually, we drink black tea with milk and eat scones with clotted cream and jam, sandwich fingers (like cucumber or egg), and sweet cakes. It is very delicious! We usually do this around 4 PM to bridge the gap between lunch and dinner.',
      authorId: 'stud_2',
      schoolId: 'school_1',
      status: 'Approved',
      submittedAt: '2026-05-20T14:00:00Z',
      reviewedBy: 'Teacher Mrs. Smith',
      reviewedAt: '2026-05-21T09:00:00Z',
      language: 'en',
      likes: 8,
      photoUrl: 'assets/afternoon_tea.png'
    },
    {
      id: 'art_2',
      title: 'Traditional German Brezeln',
      content: 'Hello everyone! I want to tell you about Brezeln (pretzels) from Bavaria. They are made of dough, shaped into a knot, dipped in lye water, and sprinkled with coarse salt before baking. They are crispy on the outside and soft inside. We eat them with butter, cheese, or white sausage (Weißwurst) for breakfast. You can buy them in every bakery!',
      authorId: 'stud_7',
      schoolId: 'school_2',
      status: 'Pending',
      submittedAt: '2026-06-20T15:30:00Z',
      language: 'de',
      likes: 0,
      photoUrl: 'assets/brezeln.png'
    }
  ],
  news: [
    { id: 'news_1', title: 'Welcome to the 2026 Exchange!', content: 'We are thrilled to launch this exchange program between Leicester High School and Goethe-Gymnasium. Please remember to respect your pen pal and follow the safety guidelines. Have fun learning new languages and sharing traditions!', postedBy: 'Teacher Mrs. Smith', schoolId: 'school_1', timestamp: '2026-05-01T08:00:00Z' },
    { id: 'news_2', title: 'Summer Cultural Festival Coming Up!', content: 'Next month, we will celebrate our annual Cultural Sharing Week. Get ready to write articles about your local festivals and share them with the partner school!', postedBy: 'Teacher Herr Wagner', schoolId: 'school_2', timestamp: '2026-06-15T09:00:00Z' }
  ],
  flags: [
    { id: 'flag_1', messageId: 'msg_8', status: 'Pending', flaggedAt: '2026-06-19T11:05:00Z', reviewedBy: null, reviewedAt: null, actionTaken: null },
    { id: 'flag_2', messageId: 'msg_9', status: 'Resolved', flaggedAt: '2026-05-15T10:00:00Z', reviewedBy: 'Teacher Mrs. Smith', reviewedAt: '2026-05-15T14:20:00Z', actionTaken: 'Dismissed' },
    { id: 'flag_3', messageId: 'msg_10', status: 'Resolved', flaggedAt: '2026-06-01T15:30:00Z', reviewedBy: 'Teacher Mrs. Smith', reviewedAt: '2026-06-02T09:00:00Z', actionTaken: 'Resumed Conversation' }
  ],
  auditLogs: [
    { id: 'log_1', timestamp: '2026-05-10T10:00:00Z', action: 'Match Created', details: 'Harriet Potter matched with Lukas Schmidt.', user: 'Teacher Mrs. Smith' },
    { id: 'log_2', timestamp: '2026-05-21T09:00:00Z', action: 'Article Approved', details: 'Approved article "Afternoon Tea in England" by Emily Watson.', user: 'Teacher Mrs. Smith' },
    { id: 'log_3', timestamp: '2026-06-19T11:05:00Z', action: 'Auto Safeguard Flag', details: 'Message 8 flagged for sensitive keywords.', user: 'System' }
  ],
  settings: {
    flaggedKeywords: ['phone number', 'address', 'meet up', 'whatsapp', 'instagram', 'secret', 'treffen', 'handynummer', 'adresse', 'heimlich'],
    languages: ['en', 'de'],
    attachmentsEnabled: false,
    translationEnabled: true
  },
  coordinators: [
    { id: 'coord_1', name: 'Mrs. Smith', email: 'smith@leicesterhigh.edu', schoolId: 'school_1', isSchoolAdmin: true, bio: "Languages coordinator at Leicester High School. I have been teaching English and German for 12 years." },
    { id: 'coord_2', name: 'Herr Wagner', email: 'wagner@goethe.edu', schoolId: 'school_2', isSchoolAdmin: false, bio: "Coordinator for international exchanges at Goethe-Gymnasium. Passionate about linking students globally." },
    { id: 'coord_3', name: 'M. Dupont', email: 'dupont@lycee.edu', schoolId: 'school_3', isSchoolAdmin: true, bio: "Enseignant de langues au Lycée Saint-Exupéry à Lyon. Passionné par l'échange culturel et linguistique." }
  ],
  schoolRequests: [
    { id: 'req_1', name: 'Oakridge Academy', country: 'United Kingdom', city: 'London', language: 'en', code: 'OAK-UK', coordinatorName: 'Mr. David Green', coordinatorEmail: 'david@oakridge.edu', status: 'Pending', requestedAt: '2026-06-21T09:00:00Z' }
  ],
  coordinatorMessages: [
    { id: 'cmsg_1', senderId: 'coord_2', receiverId: 'coord_1', text: "Hello Mrs. Smith, I have approved the exchange proposals from our side. Looking forward to our students connecting!", timestamp: '2026-06-20T10:00:00Z', read: true },
    { id: 'cmsg_2', senderId: 'coord_1', receiverId: 'coord_2', text: "Wonderful, Herr Wagner! I will review and match them today. Let me know if you have any questions.", timestamp: '2026-06-20T10:30:00Z', read: true }
  ],
  projects: [
    {
      id: 'proj_1',
      title: 'Our Cultural Traditions',
      brief: 'Compare and write about the traditional foods and celebrations in our countries. Gather materials, write sections together, and publish for approval.',
      creatorSchoolId: 'school_1',
      targetSchoolId: 'school_2',
      creatorSchoolStudentIds: ['stud_1', 'stud_2'],
      targetSchoolStudentIds: ['stud_7', 'stud_8'],
      status: 'Active',
      creatorSchoolApproved: false,
      targetSchoolApproved: false,
      slides: [
        {
          id: 'slide_1',
          layout: 'split',
          title: 'A Taste of Two Cultures',
          content: 'In this project, we explore the rich traditions of afternoon tea in England and traditional Brezeln in Bavaria. We want to find out how our families celebrate and share food together.',
          photoUrl: '',
          author: 'Harriet Potter',
          editableByOthers: true
        },
        {
          id: 'slide_2',
          layout: 'text-only',
          title: 'Tea vs. Pretzels',
          content: 'We found many interesting details about how tea is served at 4 PM in Leicester High School, while in Goethe-Gymnasium, Brezeln are eaten for breakfast with white sausages. Our team had fun sharing these ideas!',
          author: 'Lukas Schmidt',
          editableByOthers: true
        }
      ],
      createdAt: '2026-06-18T10:00:00Z'
    }
  ],
  projectMessages: [
    { id: 'pmsg_1', projectId: 'proj_1', senderId: 'stud_1', senderName: 'Harriet Potter', text: 'Hi everyone! Excited to work on this cultural group project together.', timestamp: '2026-06-18T11:00:00Z' },
    { id: 'pmsg_2', projectId: 'proj_1', senderId: 'stud_7', senderName: 'Lukas Schmidt', text: 'Hallo Harriet! Me too. Let\'s write about afternoon tea and pretzels.', timestamp: '2026-06-18T11:15:00Z' }
  ],
  schoolConnections: [
    { id: 'conn_1', fromSchoolId: 'school_1', toSchoolId: 'school_2', status: 'Connected', connectedAt: '2026-05-10T10:00:00Z', requestMessage: 'Seeded connection', requestorBio: 'System Seed' }
  ],
  staffStudentMessages: []
};

class LocalDB {
  constructor() {
    this.cachedData = null;
    this.init();
  }

  init() {
    let data = null;
    try {
      data = JSON.parse(localStorage.getItem(DB_KEY));
    } catch (e) {}

    const hasOldName = data && data.schools && data.schools.some(s => s.id === 'school_1' && (s.name.includes('Oakridge') || s.city.includes('London')));
    const isMissingTables = data && (!data.coordinators || !data.schoolRequests);
    const isMissingPhotos = data && data.articles && data.articles.some(a => a.id === 'art_1' && !a.photoUrl);
    const isMissingBiog = data && data.students && data.students.some(s => s.personalBiogStatus === undefined);
    const isMissingResolvedFlags = data && data.flags && data.flags.length < 3;
    const isOldProposedMatchSeed = data && data.matches && data.matches.some(m => m.id === 'match_5' && m.studentIds[0] !== null);
    const isMissingCoordMessages = data && !data.coordinatorMessages;
    const isMissingProjects = data && (!data.projects || !data.projectMessages);
    const isMissingConnections = data && (!data.schoolConnections || !data.coordinators || data.coordinators.length < 3);

    if (!data || hasOldName || isMissingTables || isMissingPhotos || isMissingBiog || isMissingResolvedFlags || isOldProposedMatchSeed || isMissingCoordMessages || isMissingProjects || isMissingConnections) {
      localStorage.setItem(DB_KEY, JSON.stringify(defaultDatabase));
      this.cachedData = defaultDatabase;
    } else {
      this.cachedData = data;
    }
  }

  get() {
    if (this.cachedData) return this.cachedData;
    const raw = localStorage.getItem(DB_KEY);
    this.cachedData = raw ? JSON.parse(raw) : defaultDatabase;
    return this.cachedData;
  }

  save(data) {
    this.cachedData = data;
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  }

  reset() {
    localStorage.setItem(DB_KEY, JSON.stringify(defaultDatabase));
    this.cachedData = defaultDatabase;
    return defaultDatabase;
  }

  getTable(name) {
    const data = this.get();
    return data[name] || [];
  }

  saveTable(name, list) {
    const data = this.get();
    data[name] = list;
    this.save(data);
  }

  // Helper getters
  getStudents() { return this.getTable('students'); }
  getStudent(id) { return this.getStudents().find(s => s.id === id); }
  getSchools() { return this.getTable('schools'); }
  getSchool(id) { return this.getSchools().find(s => s.id === id); }
  getMatches() { return this.getTable('matches'); }
  getMessages() { return this.getTable('messages'); }
  getArticles() { return this.getTable('articles'); }
  getNews() { return this.getTable('news'); }
  getFlags() { return this.getTable('flags'); }
  getAuditLogs() { return this.getTable('auditLogs'); }
  getSettings() { return this.get().settings; }
  getCoordinators() { return this.getTable('coordinators'); }
  getCoordinator(id) { return this.getCoordinators().find(c => c.id === id); }
  getSchoolRequests() { return this.getTable('schoolRequests'); }
  getSchoolRequest(id) { return this.getSchoolRequests().find(r => r.id === id); }
  getCoordinatorMessages() { return this.getTable('coordinatorMessages'); }
  getProjects() { return this.getTable('projects'); }
  getProject(id) { return this.getProjects().find(p => p.id === id); }
  getProjectMessages() { return this.getTable('projectMessages'); }
  getSchoolConnections() { return this.getTable('schoolConnections'); }
  getStaffStudentMessages() { return this.getTable('staffStudentMessages'); }
  addSchoolConnection(conn) {
    const list = this.getSchoolConnections();
    const newConn = {
      id: 'conn_' + Date.now(),
      status: 'Pending',
      createdAt: new Date().toISOString(),
      ...conn
    };
    list.push(newConn);
    this.saveTable('schoolConnections', list);
    return newConn;
  }
  updateSchoolConnection(id, updates) {
    const list = this.getSchoolConnections();
    const index = list.findIndex(c => c.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      this.saveTable('schoolConnections', list);
    }
  }
  deleteSchoolConnection(id) {
    const list = this.getSchoolConnections().filter(c => c.id !== id);
    this.saveTable('schoolConnections', list);
  }
  updateCoordinator(id, updates) {
    const list = this.getCoordinators();
    const index = list.findIndex(c => c.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      this.saveTable('coordinators', list);
    }
  }

  // Action helpers
  addSchoolRequest(req) {
    const list = this.getSchoolRequests();
    const newReq = {
      id: 'req_' + Date.now(),
      status: 'Pending',
      requestedAt: new Date().toISOString(),
      ...req
    };
    list.push(newReq);
    this.saveTable('schoolRequests', list);
    this.addLog('School Request Submitted', `Coordinator ${req.coordinatorName} requested registration for ${req.name}.`, 'System');
    return newReq;
  }

  approveSchoolRequest(requestId, reviewer) {
    const requests = this.getSchoolRequests();
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex !== -1) {
      const req = requests[reqIndex];
      req.status = 'Approved';
      this.saveTable('schoolRequests', requests);

      // Create new school
      const schools = this.getSchools();
      const newSchoolId = 'school_' + Date.now();
      const newSchool = {
        id: newSchoolId,
        name: req.name,
        country: req.country,
        city: req.city,
        language: req.language,
        code: req.code,
        description: `${req.name} is a newly registered partner school in ${req.city}, ${req.country}.`,
        photoUrl: '',
        logoUrl: ''
      };
      schools.push(newSchool);
      this.saveTable('schools', schools);

      // Create coordinator account with isSchoolAdmin: true
      const coordinators = this.getCoordinators();
      const newCoord = {
        id: 'coord_' + Date.now(),
        name: req.coordinatorName,
        email: req.coordinatorEmail,
        schoolId: newSchoolId,
        isSchoolAdmin: true
      };
      coordinators.push(newCoord);
      this.saveTable('coordinators', coordinators);

      this.addLog('School Request Approved', `Approved and registered ${req.name} (Code: ${req.code}). Assigned admin rights to coordinator ${req.coordinatorName}.`, reviewer);
      return newSchool;
    }
  }

  declineSchoolRequest(requestId, reviewer) {
    const requests = this.getSchoolRequests();
    const reqIndex = requests.findIndex(r => r.id === requestId);
    if (reqIndex !== -1) {
      const req = requests[reqIndex];
      req.status = 'Declined';
      this.saveTable('schoolRequests', requests);
      this.addLog('School Request Declined', `Declined school registration for ${req.name} requested by ${req.coordinatorName}.`, reviewer);
    }
  }

  toggleCoordinatorAdmin(coordinatorId, reviewer) {
    const coordinators = this.getCoordinators();
    const index = coordinators.findIndex(c => c.id === coordinatorId);
    if (index !== -1) {
      coordinators[index].isSchoolAdmin = !coordinators[index].isSchoolAdmin;
      this.saveTable('coordinators', coordinators);
      const state = coordinators[index].isSchoolAdmin ? 'Granted' : 'Revoked';
      this.addLog('Coordinator Admin Toggled', `${state} School Admin rights for coordinator ${coordinators[index].name}.`, reviewer);
    }
  }

  // Action helpers
  addStudent(student) {
    const list = this.getStudents();
    list.push(student);
    this.saveTable('students', list);
    this.addLog('Student Added', `${student.name} (${student.email}) added to roster.`, 'Teacher / Coordinator');
  }

  updateStudent(id, updates) {
    const list = this.getStudents();
    const index = list.findIndex(s => s.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      this.saveTable('students', list);
    }
  }

  submitStudentBiog(studentId, biogText) {
    const student = this.getStudent(studentId);
    this.updateStudent(studentId, {
      pendingBiog: biogText,
      personalBiogStatus: 'Pending'
    });
    this.addLog('Biography Submitted', `Student ${student ? student.name : studentId} submitted a biography for review.`, 'Student');
  }

  approveStudentBiog(studentId, reviewerName) {
    const student = this.getStudent(studentId);
    if (student) {
      this.updateStudent(studentId, {
        personalBiog: student.pendingBiog,
        pendingBiog: '',
        personalBiogStatus: 'Approved'
      });
      this.addLog('Biography Approved', `Approved biography for student ${student.name}.`, reviewerName);
    }
  }

  rejectStudentBiog(studentId, reviewerName) {
    const student = this.getStudent(studentId);
    if (student) {
      this.updateStudent(studentId, {
        pendingBiog: '',
        personalBiogStatus: 'Rejected'
      });
      this.addLog('Biography Rejected', `Rejected biography for student ${student.name}.`, reviewerName);
    }
  }

  updateSchool(id, updates) {
    const list = this.getSchools();
    const index = list.findIndex(s => s.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      this.saveTable('schools', list);
      this.addLog('School Profile Updated', `Updated school profile details for ${list[index].name}.`, 'Teacher');
    }
  }

  createMatch(type, studentIds) {
    const matches = this.getMatches();
    const newMatch = {
      id: 'match_' + Date.now(),
      type,
      studentIds,
      active: true,
      status: 'Active',
      createdAt: new Date().toISOString(),
      paused: false
    };
    matches.push(newMatch);
    this.saveTable('matches', matches);

    // Update students match status
    studentIds.forEach(id => {
      this.updateStudent(id, { matchStatus: 'matched' });
    });

    const names = studentIds.map(id => this.getStudent(id)?.name || id).join(' & ');
    this.addLog('Match Created', `Created a ${type} match between: ${names}.`, 'Teacher');
    return newMatch;
  }

  proposeMatch(type, studentIds, proposedBySchoolId, pendingApprovalFromSchoolId) {
    const matches = this.getMatches();
    const newMatch = {
      id: 'match_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      type,
      studentIds,
      active: false,
      status: 'Proposed',
      proposedBySchoolId,
      pendingApprovalFromSchoolId,
      createdAt: new Date().toISOString(),
      paused: false
    };
    matches.push(newMatch);
    this.saveTable('matches', matches);

    // Update students match status to proposed
    studentIds.forEach(id => {
      if (id) {
        this.updateStudent(id, { matchStatus: 'proposed' });
      }
    });

    const names = studentIds.filter(id => id).map(id => this.getStudent(id)?.name || id).join(' & ');
    this.addLog('Match Proposed', `Proposed a ${type} match for student: ${names}.`, 'Teacher');
    return newMatch;
  }

  confirmMatch(matchId, assignedStudentId, reviewerName) {
    const matches = this.getMatches();
    const match = matches.find(m => m.id === matchId);
    if (match) {
      // Find the unassigned (null) slot in studentIds and assign the student
      if (assignedStudentId && !match.studentIds.includes(assignedStudentId)) {
        const nullIdx = match.studentIds.indexOf(null);
        if (nullIdx !== -1) {
          match.studentIds[nullIdx] = assignedStudentId;
        } else {
          match.studentIds.push(assignedStudentId);
        }
      }
      match.active = true;
      match.status = 'Active';
      this.saveTable('matches', matches);

      // Update students match status to matched
      match.studentIds.forEach(id => {
        if (id) {
          this.updateStudent(id, { matchStatus: 'matched' });
        }
      });

      const names = match.studentIds.map(id => this.getStudent(id)?.name || id).join(' & ');
      this.addLog('Match Confirmed', `Confirmed match suggestion between: ${names}.`, reviewerName);
    }
  }

  declineMatch(matchId, reviewerName) {
    const matches = this.getMatches();
    const matchIndex = matches.findIndex(m => m.id === matchId);
    if (matchIndex !== -1) {
      const match = matches[matchIndex];
      
      // Remove match request
      matches.splice(matchIndex, 1);
      this.saveTable('matches', matches);

      // Update students status based on remaining matches/proposals
      match.studentIds.forEach(id => {
        if (id) {
          const studentMatches = matches.filter(m => m.studentIds.includes(id));
          const hasActive = studentMatches.some(m => m.active);
          const hasProposed = studentMatches.some(m => !m.active && m.status === 'Proposed');
          if (hasActive) {
            this.updateStudent(id, { matchStatus: 'matched' });
          } else if (hasProposed) {
            this.updateStudent(id, { matchStatus: 'proposed' });
          } else {
            this.updateStudent(id, { matchStatus: 'unmatched' });
          }
        }
      });
      
      const names = match.studentIds.filter(id => id).map(id => this.getStudent(id)?.name || id).join(' & ');
      this.addLog('Match Declined/Withdrawn', `Declined/Withdrawn match proposal for: ${names || 'student'}.`, reviewerName);
    }
  }

  pauseMatch(matchId, paused) {
    const matches = this.getMatches();
    const index = matches.findIndex(m => m.id === matchId);
    if (index !== -1) {
      matches[index].paused = paused;
      this.saveTable('matches', matches);
      const studentNames = matches[index].studentIds.map(id => this.getStudent(id)?.name).join(' & ');
      this.addLog(paused ? 'Match Paused' : 'Match Resumed', `Conversation between ${studentNames} ${paused ? 'paused' : 'resumed'}.`, 'Teacher');
    }
  }

  deleteMatch(matchId) {
    const matches = this.getMatches();
    const match = matches.find(m => m.id === matchId);
    if (match) {
      match.active = false;
      this.saveTable('matches', matches);

      // Update student matching status based on remaining active matches/proposals
      match.studentIds.forEach(id => {
        if (id) {
          const remainingMatches = matches.filter(m => m.studentIds.includes(id));
          const hasActive = remainingMatches.some(m => m.active);
          const hasProposed = remainingMatches.some(m => !m.active && m.status === 'Proposed');
          if (hasActive) {
            this.updateStudent(id, { matchStatus: 'matched' });
          } else if (hasProposed) {
            this.updateStudent(id, { matchStatus: 'proposed' });
          } else {
            this.updateStudent(id, { matchStatus: 'unmatched' });
          }
        }
      });
      
      const studentNames = match.studentIds.map(id => this.getStudent(id)?.name).join(' & ');
      this.addLog('Match Removed', `Archived match between ${studentNames}.`, 'Teacher');
    }
  }

  addMessage(matchId, senderId, text, translation = '') {
    const messages = this.getMessages();
    const settings = this.getSettings();
    
    // Check flags
    let flagged = false;
    let flagReason = '';
    const lowerText = text.toLowerCase();
    const triggeredKeywords = settings.flaggedKeywords.filter(keyword => lowerText.includes(keyword.toLowerCase()));
    
    if (triggeredKeywords.length > 0) {
      flagged = true;
      flagReason = `Contains sensitive terms: "${triggeredKeywords.join('", "')}"`;
    }

    const newMsg = {
      id: 'msg_' + Date.now(),
      matchId,
      senderId,
      text,
      translation,
      timestamp: new Date().toISOString(),
      read: false,
      flagged,
      flagReason
    };

    messages.push(newMsg);
    this.saveTable('messages', messages);

    // Update sender activity level
    const student = this.getStudent(senderId);
    if (student) {
      this.updateStudent(senderId, { activityLevel: 'High' });
    }

    if (flagged) {
      // Create flag entry
      const flags = this.getFlags();
      const newFlag = {
        id: 'flag_' + Date.now(),
        messageId: newMsg.id,
        status: 'Pending',
        flaggedAt: new Date().toISOString(),
        reviewedBy: null,
        reviewedAt: null,
        actionTaken: null
      };
      flags.push(newFlag);
      this.saveTable('flags', flags);
      
      // Auto-pause match for safety
      this.pauseMatch(matchId, true);
      this.addLog('Auto Safeguard Flag', `Message by ${student?.name || senderId} flagged and chat paused. Reason: ${flagReason}`, 'System');
    }

    return newMsg;
  }

  addArticle(article) {
    const list = this.getArticles();
    const newArt = {
      id: 'art_' + Date.now(),
      likes: 0,
      submittedAt: new Date().toISOString(),
      status: 'Pending',
      ...article
    };
    list.push(newArt);
    this.saveTable('articles', list);
    const author = this.getStudent(article.authorId);
    this.addLog('Article Submitted', `Article "${article.title}" submitted by ${author?.name || 'Student'}.`, 'System');
    return newArt;
  }

  reviewArticle(id, status, reviewer, feedback = '') {
    const list = this.getArticles();
    const index = list.findIndex(a => a.id === id);
    if (index !== -1) {
      list[index].status = status;
      list[index].reviewedBy = reviewer;
      list[index].reviewedAt = new Date().toISOString();
      if (feedback) {
        list[index].feedback = feedback;
      }
      this.saveTable('articles', list);
      this.addLog('Article Reviewed', `Article "${list[index].title}" reviewed: ${status}.`, reviewer);
    }
  }

  getSchoolsForFlag(flag) {
    if (flag.projectId && !flag.messageId) {
      const proj = this.getProjects().find(p => p.id === flag.projectId);
      if (proj) {
        return { schoolId1: proj.creatorSchoolId, schoolId2: proj.targetSchoolId };
      }
    }
    const msg = this.getMessages().find(m => m.id === flag.messageId);
    if (!msg) return { schoolId1: null, schoolId2: null };

    let schoolId1 = null;
    let schoolId2 = null;

    if (msg.matchId) {
      const match = this.getMatches().find(m => m.id === msg.matchId);
      if (match) {
        const stud0 = this.getStudent(match.studentIds[0]);
        const stud1 = this.getStudent(match.studentIds[1]);
        schoolId1 = stud0?.schoolId;
        schoolId2 = stud1?.schoolId;
      }
    } else if (msg.projectId) {
      const proj = this.getProjects().find(p => p.id === msg.projectId);
      if (proj) {
        schoolId1 = proj.creatorSchoolId;
        schoolId2 = proj.targetSchoolId;
      }
    }

    if (!schoolId1) {
      const sender = this.getStudent(msg.senderId);
      schoolId1 = sender?.schoolId;
    }

    return { schoolId1, schoolId2 };
  }

  getFlagResolutions(flag) {
    if (!flag.resolutions) {
      flag.resolutions = {};
    }
    
    const { schoolId1, schoolId2 } = this.getSchoolsForFlag(flag);
    
    // Legacy migration fallback
    if (flag.status === 'Resolved' && Object.keys(flag.resolutions).length === 0) {
      let reviewerSchoolId = schoolId1;
      if (flag.reviewedBy) {
        const coord = this.getCoordinators().find(c => c.name === flag.reviewedBy || `Teacher ${c.name}` === flag.reviewedBy);
        if (coord) {
          reviewerSchoolId = coord.schoolId;
        }
      }
      if (reviewerSchoolId) {
        flag.resolutions[reviewerSchoolId] = {
          status: 'Resolved',
          reviewedBy: flag.reviewedBy,
          reviewedAt: flag.reviewedAt,
          actionTaken: flag.actionTaken,
          resolutionNotes: flag.resolutionNotes || ''
        };
      }
    }
    
    if (schoolId1 && !flag.resolutions[schoolId1]) {
      flag.resolutions[schoolId1] = {
        status: 'Pending',
        reviewedBy: null,
        reviewedAt: null,
        actionTaken: null,
        resolutionNotes: ''
      };
    }
    if (schoolId2 && !flag.resolutions[schoolId2] && schoolId2 !== schoolId1) {
      flag.resolutions[schoolId2] = {
        status: 'Pending',
        reviewedBy: null,
        reviewedAt: null,
        actionTaken: null,
        resolutionNotes: ''
      };
    }
    
    return flag.resolutions;
  }

  resolveFlag(flagId, reviewer, actionTaken, resolutionNotes = '') {
    let schoolId = 'school_1';
    const coord = this.getCoordinators().find(c => c.name === reviewer || `Teacher ${c.name}` === reviewer);
    if (coord) {
      schoolId = coord.schoolId;
    }
    this.resolveFlagForSchool(flagId, schoolId, reviewer, actionTaken, resolutionNotes);
  }

  resolveFlagForSchool(flagId, schoolId, reviewer, actionTaken, resolutionNotes = '') {
    const flags = this.getFlags();
    const fIdx = flags.findIndex(f => f.id === flagId);
    if (fIdx !== -1) {
      const flag = flags[fIdx];
      const resolutions = this.getFlagResolutions(flag);
      
      resolutions[schoolId] = {
        status: 'Resolved',
        reviewedBy: reviewer,
        reviewedAt: new Date().toISOString(),
        actionTaken: actionTaken,
        resolutionNotes: resolutionNotes
      };
      
      flag.resolutions = resolutions;
      
      // Determine overall flag status: if all schools involved resolved it, status is Resolved, else Pending
      const { schoolId1, schoolId2 } = this.getSchoolsForFlag(flag);
      const sids = [schoolId1, schoolId2].filter(Boolean);
      const allResolved = sids.every(sid => resolutions[sid] && resolutions[sid].status === 'Resolved');
      
      flag.status = allResolved ? 'Resolved' : 'Pending';
      
      // Update top-level legacy fields for backwards compatibility/simplicity
      flag.reviewedBy = reviewer;
      flag.reviewedAt = new Date().toISOString();
      flag.actionTaken = actionTaken;
      flag.resolutionNotes = resolutionNotes;
      
      this.saveTable('flags', flags);
      
      // Unflag message if all schools resolved it
      if (allResolved && flag.messageId) {
        const msgs = this.getMessages();
        const mIdx = msgs.findIndex(m => m.id === flag.messageId);
        if (mIdx !== -1) {
          msgs[mIdx].flagged = false;
          this.saveTable('messages', msgs);
        }
      }
      
      this.addLog('Flag Resolved', `Safeguarding flag resolved for school ${schoolId} by ${reviewer}. Action: ${actionTaken}`, reviewer);
    }
  }

  addNews(newsItem) {
    const list = this.getNews();
    const item = {
      id: 'news_' + Date.now(),
      timestamp: new Date().toISOString(),
      ...newsItem
    };
    list.push(item);
    this.saveTable('news', list);
    this.addLog('News Posted', `Teacher news announcement: "${newsItem.title}".`, newsItem.postedBy);
  }

  deleteNews(id) {
    const list = this.getNews().filter(n => n.id !== id);
    this.saveTable('news', list);
  }

  addLog(action, details, user) {
    const list = this.getAuditLogs();
    const log = {
      id: 'log_' + Date.now(),
      timestamp: new Date().toISOString(),
      action,
      details,
      user
    };
    list.push(log);
    this.saveTable('auditLogs', list);
  }
  
  saveSettings(newSettings) {
    const data = this.get();
    data.settings = { ...data.settings, ...newSettings };
    this.save(data);
    this.addLog('Settings Updated', `System configuration modified.`, 'Admin');
  }
  
  addCoordinatorMessage(senderId, receiverId, text) {
    const list = this.getCoordinatorMessages();
    const newMsg = {
      id: 'cmsg_' + Date.now(),
      senderId,
      receiverId,
      text,
      timestamp: new Date().toISOString(),
      read: false
    };
    list.push(newMsg);
    this.saveTable('coordinatorMessages', list);
    return newMsg;
  }

  addProject(proj) {
    const list = this.getProjects();
    const newProj = {
      id: 'proj_' + Date.now(),
      creatorSchoolApproved: false,
      targetSchoolApproved: false,
      slides: [
        {
          id: 'slide_' + Date.now(),
          layout: 'split',
          title: '',
          content: '',
          photoUrl: '',
          author: ''
        }
      ],
      createdAt: new Date().toISOString(),
      ...proj
    };
    list.push(newProj);
    this.saveTable('projects', list);
    this.addLog('Project Created', `Project "${proj.title}" launched.`, 'Teacher');
    return newProj;
  }

  updateProject(id, updates) {
    const list = this.getProjects();
    const index = list.findIndex(p => p.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      this.saveTable('projects', list);
    }
  }

  deleteProject(id) {
    let list = this.getProjects();
    list = list.filter(p => p.id !== id);
    this.saveTable('projects', list);

    // Cascade delete project messages
    let msgs = this.getProjectMessages();
    msgs = msgs.filter(m => m.projectId !== id);
    this.saveTable('projectMessages', msgs);

    // Cascade delete project flags
    let flags = this.getFlags();
    flags = flags.filter(f => f.projectId !== id);
    this.saveTable('flags', flags);
  }

  addProjectMessage(projectId, senderId, senderName, text) {
    const list = this.getProjectMessages();
    const newMsg = {
      id: 'pmsg_' + Date.now(),
      projectId,
      senderId,
      senderName,
      text,
      timestamp: new Date().toISOString()
    };
    list.push(newMsg);
    this.saveTable('projectMessages', list);
    return newMsg;
  }

  authorizeProject(projectId, coordinatorId, status) {
    const project = this.getProject(projectId);
    if (!project) return;
    const coord = this.getCoordinator(coordinatorId);
    const coordName = coord ? coord.name : 'Teacher';
    const schoolId = coord ? coord.schoolId : '';

    if (project.creatorSchoolId === schoolId) {
      project.creatorSchoolApproved = status;
    } else if (project.targetSchoolId === schoolId) {
      project.targetSchoolApproved = status;
    }

    if (project.creatorSchoolApproved && project.targetSchoolApproved) {
      project.status = 'Published';
      // Dynamically post a news item that the project is published!
      this.addNews({
        title: `Project Published: ${project.title}`,
        content: `A collaborative project brief and presentation has been approved and published by coordinators.`,
        postedBy: coordName,
        schoolId: project.creatorSchoolId
      });
      this.addLog('Project Published', `Project "${project.title}" published with authorization from both schools.`, 'System');
    } else {
      project.status = 'PendingPublish';
      this.addLog('Project Authorized', `Project "${project.title}" authorized by ${coordName}.`, coordName);
    }
    
    this.updateProject(projectId, project);
  }
}

window.db = new LocalDB();
