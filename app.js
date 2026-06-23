// Custom alert system to replace ugly browser alerts with premium modal notifications
(function() {
  const nativeAlert = window.alert;
  window.alert = function(message) {
    // Create modern premium alert modal
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.style.zIndex = '10000';
    overlay.style.transition = 'opacity 0.2s ease-out';
    overlay.style.opacity = '1';

    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.maxWidth = '420px';
    content.style.textAlign = 'center';
    content.style.padding = '2rem';
    content.style.borderRadius = '24px';
    content.style.border = '1px solid var(--panel-border)';
    content.style.background = 'var(--bg-color)';
    content.style.boxShadow = '0 20px 50px rgba(0,0,0,0.5)';
    content.style.transform = 'translateY(0)';
    content.style.transition = 'transform 0.2s ease-out';

    // Determine icon based on message content
    let icon = '🌐';
    if (message.toLowerCase().includes('success') || message.toLowerCase().includes('approved') || message.toLowerCase().includes('confirmed') || message.toLowerCase().includes('registered')) {
      icon = '✅';
    } else if (message.toLowerCase().includes('warning') || message.toLowerCase().includes('safety') || message.toLowerCase().includes('paused') || message.toLowerCase().includes('concern') || message.toLowerCase().includes('flagged') || message.toLowerCase().includes('uncomfortable')) {
      icon = '🚨';
    } else if (message.toLowerCase().includes('copy') || message.toLowerCase().includes('copied') || message.toLowerCase().includes('link')) {
      icon = '📋';
    }

    content.innerHTML = `
      <div style="font-size: 2.75rem; margin-bottom: 1rem; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15));">${icon}</div>
      <h3 style="font-family: var(--font-title); font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.75rem;">System Notification</h3>
      <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.75rem; font-family: var(--font-body);">${message}</p>
      <div style="display: flex; justify-content: center;">
        <button class="btn btn-primary" style="padding: 0.65rem 2.5rem; min-width: 120px; border-radius: 10px; font-weight: 600;">Dismiss</button>
      </div>
    `;

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    const closeBtn = content.querySelector('button');
    closeBtn.focus();

    const closeAlert = () => {
      overlay.style.opacity = '0';
      content.style.transform = 'translateY(-20px)';
      setTimeout(() => {
        overlay.remove();
      }, 200);
    };

    closeBtn.addEventListener('click', closeAlert);
    
    // Close on pressing Escape or Enter
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        window.removeEventListener('keydown', handleKeyDown);
        closeAlert();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
  };
})();

// Application logic and coordinator for Pen Pal Platform

class App {
  constructor() {
    this.currentRole = 'student'; // 'student', 'teacher', 'admin'
    this.currentStudentId = 'stud_1'; // Harry Potter by default
    this.activeMatchId = null;
    this.activeProjectId = null;
    this.currentCoordinatorId = 'coord_1';
    this.interfaceLang = 'en';
    this.theme = 'dark';
    this.currentMatchingSubtab = 'pair';
    this.tempAssignments = {};
    this.selectedAssignMatchId = null;
    this.selectedAssignStudentId = null;
    this.onboardingSchoolsExpanded = false;
    this.activeCoordinatorId = null;
    this.currentProjArticlePhotoDataUrl = '';
    
    // Bind listeners
    window.addEventListener('DOMContentLoaded', () => this.init());
  }

  init() {
    this.isLoggedIn = false;

    // Populate login screen options
    this.populateLoginScreen();

    // Bind login buttons
    document.getElementById('login-student-btn').addEventListener('click', () => {
      const studentId = document.getElementById('login-student-select').value;
      if (studentId) this.loginAsStudent(studentId);
    });

    document.getElementById('login-staff-btn').addEventListener('click', () => {
      const role = document.getElementById('login-staff-select').value;
      if (role) this.loginAsStaff(role);
    });

    // Bind logout button
    document.getElementById('logout-btn').addEventListener('click', () => this.logout());

    // Setup tabs
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const tabId = link.getAttribute('data-tab');
        this.switchTab(tabId);
      });
    });

    // Theme Toggle
    document.getElementById('theme-toggle-btn').addEventListener('click', () => this.toggleTheme());
    
    // Localization
    const langSelect = document.getElementById('ui-lang-selector');
    langSelect.addEventListener('change', (e) => {
      this.setLanguage(e.target.value);
    });

    // Developer Panel role selectors
    document.querySelectorAll('.dev-role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.dev-role-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const role = btn.getAttribute('data-dev-role');
        const studentId = btn.getAttribute('data-dev-id');
        const coordId = btn.getAttribute('data-dev-coord-id');
        this.switchRole(role, studentId, coordId);
      });
    });

    // Collapse Developer console
    const devToggle = document.getElementById('dev-toggle-collapse');
    const devBody = document.getElementById('dev-panel-body');
    devToggle.addEventListener('click', () => {
      if (devBody.style.display === 'none') {
        devBody.style.display = 'flex';
        devToggle.textContent = 'Collapse ▲';
      } else {
        devBody.style.display = 'none';
        devToggle.textContent = 'Expand ▼';
      }
    });

    // Reset database action
    document.getElementById('dev-reset-db-btn').addEventListener('click', () => {
      window.db.reset();
      this.init();
      alert('Local Storage Database has been reset to defaults.');
    });

    // Article submit listener
    const artForm = document.getElementById('article-submission-form');
    artForm.addEventListener('submit', (e) => this.handleArticleSubmit(e));

    // Message sending listeners
    document.getElementById('chat-send-btn').addEventListener('click', () => this.sendMessage());
    document.getElementById('chat-textarea').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Coordinator messaging listeners
    const teachSendBtn = document.getElementById('teacher-chat-send-btn');
    const teachTextarea = document.getElementById('teacher-chat-textarea');
    if (teachSendBtn && teachTextarea) {
      teachSendBtn.addEventListener('click', () => this.sendTeacherMessage());
      teachTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendTeacherMessage();
        }
      });
    }

    // Translation helper draft compose
    document.getElementById('translate-compose-btn').addEventListener('click', () => this.draftTranslation());

    // Report safety concern form listener
    document.getElementById('student-report-btn').addEventListener('click', () => this.openModal('report-concern-modal'));
    document.getElementById('report-concern-form').addEventListener('submit', (e) => this.handleReportConcern(e));

    // Teacher Student roster actions
    document.getElementById('invite-student-btn').addEventListener('click', () => this.openInviteModal());
    document.getElementById('invite-student-form').addEventListener('submit', (e) => this.handleInviteStudent(e));
    
    // Bulk student upload roster actions
    document.getElementById('bulk-upload-btn').addEventListener('click', () => this.openBulkModal());
    document.getElementById('bulk-upload-form').addEventListener('submit', (e) => this.handleBulkUpload(e));

    // Teacher matching action
    document.getElementById('propose-match-btn').addEventListener('click', () => this.proposeMatch());
    document.getElementById('partner-school-select').addEventListener('change', () => this.updateSelectedPartnerSchoolInfo());

    // Teacher settings action
    document.getElementById('save-teacher-settings-btn').addEventListener('click', () => this.saveTeacherSettings());

    // School profile change & submit listeners
    const logoSelect = document.getElementById('school-logo-select');
    const logoPreview = document.getElementById('school-logo-preview');
    logoSelect.addEventListener('change', (e) => {
      logoPreview.src = e.target.value;
      logoPreview.style.display = e.target.value ? 'block' : 'none';
    });

    const photoSelect = document.getElementById('school-photo-select');
    const photoPreview = document.getElementById('school-photo-preview');
    photoSelect.addEventListener('change', (e) => {
      photoPreview.src = e.target.value;
      photoPreview.style.display = e.target.value ? 'block' : 'none';
    });

    const profileForm = document.getElementById('school-profile-form');
    profileForm.addEventListener('submit', (e) => this.handleSchoolProfileSubmit(e));

    // Confirm assignment button click listener
    document.getElementById('confirm-assign-btn').addEventListener('click', () => this.saveStudentAssignment());

    // Article photograph upload listener
    const artPhotoInput = document.getElementById('art-photo-input');
    const artPhotoPreview = document.getElementById('article-photo-preview');
    const artPhotoPlaceholder = document.getElementById('article-photo-placeholder');
    this.currentArticlePhotoDataUrl = '';
    artPhotoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 1.5 * 1024 * 1024) {
          alert('Image file is too large. Please select an image smaller than 1.5MB.');
          artPhotoInput.value = '';
          this.currentArticlePhotoDataUrl = '';
          artPhotoPreview.style.display = 'none';
          artPhotoPlaceholder.style.display = 'block';
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          this.currentArticlePhotoDataUrl = event.target.result;
          artPhotoPreview.src = event.target.result;
          artPhotoPreview.style.display = 'block';
          artPhotoPlaceholder.style.display = 'none';
        };
        reader.readAsDataURL(file);
      } else {
        this.currentArticlePhotoDataUrl = '';
        artPhotoPreview.style.display = 'none';
        artPhotoPlaceholder.style.display = 'block';
      }
    });

    // Admin register school action
    document.getElementById('admin-add-school-btn').addEventListener('click', () => this.openModal('add-school-modal'));
    document.getElementById('add-school-form').addEventListener('submit', (e) => this.handleAddSchool(e));

    // Onboarding school request form listener
    document.getElementById('request-school-registration-form').addEventListener('submit', (e) => this.handleSchoolRegistrationRequest(e));

    // Auto-generate school code ID on onboarding form
    const reqSchoolName = document.getElementById('req-school-name');
    const reqSchoolCountry = document.getElementById('req-school-country');
    const reqSchoolCode = document.getElementById('req-school-code');
    
    if (reqSchoolName && reqSchoolCountry && reqSchoolCode) {
      const updateGeneratedCode = () => {
        const name = reqSchoolName.value.trim();
        const country = reqSchoolCountry.value.trim();
        if (!name) {
          reqSchoolCode.value = '';
          return;
        }
        let code = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
        if (country) {
          const countryLower = country.toLowerCase().trim();
          let countryCode = '';
          if (countryLower === 'united kingdom' || countryLower === 'uk' || countryLower === 'england' || countryLower === 'britain') {
            countryCode = 'UK';
          } else if (countryLower === 'germany' || countryLower === 'deutschland' || countryLower === 'de') {
            countryCode = 'DE';
          } else if (countryLower === 'france' || countryLower === 'fr') {
            countryCode = 'FR';
          } else if (countryLower === 'spain' || countryLower === 'espana' || countryLower === 'es') {
            countryCode = 'ES';
          } else if (countryLower === 'united states' || countryLower === 'usa' || countryLower === 'us') {
            countryCode = 'US';
          } else {
            countryCode = country.replace(/[^a-zA-Z0-9]/g, '').substring(0, 2).toUpperCase();
          }
          if (countryCode) {
            code += '-' + countryCode;
          }
        }
        reqSchoolCode.value = code;
      };
      reqSchoolName.addEventListener('input', updateGeneratedCode);
      reqSchoolCountry.addEventListener('input', updateGeneratedCode);
    }

    // Approved schools directory search & expand listeners
    const onboardingSearch = document.getElementById('onboarding-school-search');
    if (onboardingSearch) {
      onboardingSearch.addEventListener('input', () => this.renderNewCoordinatorOnboarding());
    }

    const onboardingExpandBtn = document.getElementById('onboarding-schools-expand-btn');
    if (onboardingExpandBtn) {
      onboardingExpandBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.onboardingSchoolsExpanded = !this.onboardingSchoolsExpanded;
        onboardingExpandBtn.textContent = this.onboardingSchoolsExpanded ? 'Collapse List' : `Show All Schools`;
        this.renderNewCoordinatorOnboarding();
      });
    }

    // Language Help Writing Widget Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const helpPanelId = btn.getAttribute('data-help-tab');
        
        // Toggle active styling
        btn.parentElement.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Toggle subtabs
        document.querySelectorAll('.help-subtab').forEach(pane => pane.style.display = 'none');
        document.getElementById(helpPanelId).style.display = 'block';
      });
    });

    // Collaborative Project Listeners
    const projArtPhotoInput = document.getElementById('proj-art-photo-input');
    const projArtPhotoPreview = document.getElementById('proj-article-photo-preview');
    const projArtPhotoPlaceholder = document.getElementById('proj-article-photo-placeholder');
    if (projArtPhotoInput) {
      projArtPhotoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 1.5 * 1024 * 1024) {
            alert('Image file is too large. Please select an image smaller than 1.5MB.');
            projArtPhotoInput.value = '';
            this.currentProjArticlePhotoDataUrl = '';
            projArtPhotoPreview.style.display = 'none';
            projArtPhotoPlaceholder.style.display = 'block';
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            this.currentProjArticlePhotoDataUrl = event.target.result;
            projArtPhotoPreview.src = event.target.result;
            projArtPhotoPreview.style.display = 'block';
            projArtPhotoPlaceholder.style.display = 'none';
          };
          reader.readAsDataURL(file);
        } else {
          this.currentProjArticlePhotoDataUrl = '';
          projArtPhotoPreview.style.display = 'none';
          projArtPhotoPlaceholder.style.display = 'block';
        }
      });
    }

    const projSaveBtn = document.getElementById('proj-art-save-btn');
    if (projSaveBtn) {
      projSaveBtn.addEventListener('click', () => this.saveProjectArticleDraft());
    }

    const projPublishBtn = document.getElementById('proj-art-publish-btn');
    if (projPublishBtn) {
      projPublishBtn.addEventListener('click', () => this.publishProject());
    }

    const projSendBtn = document.getElementById('proj-chat-send-btn');
    const projChatTextarea = document.getElementById('proj-chat-textarea');
    if (projSendBtn && projChatTextarea) {
      projSendBtn.addEventListener('click', () => this.sendProjectChatMessage());
      projChatTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendProjectChatMessage();
        }
      });
    }

    const launchProjForm = document.getElementById('launch-project-form');
    if (launchProjForm) {
      launchProjForm.addEventListener('submit', (e) => this.handleProjectLaunch(e));
    }

    // Load UI data
    this.refreshUI();
  }

  getLoggedTeacher() {
    const coordinators = window.db.getCoordinators();
    return coordinators.find(c => c.id === this.currentCoordinatorId) || coordinators[0];
  }

  // Update current role user card
  updateUserBadge() {
    const nameEl = document.getElementById('current-user-name');
    const roleEl = document.getElementById('current-user-role');
    const avatarEl = document.getElementById('current-user-avatar');

    if (this.currentRole === 'student') {
      const stud = window.db.getStudent(this.currentStudentId);
      if (stud) {
        nameEl.textContent = stud.name;
        roleEl.textContent = `${stud.yearGroup} • ${window.db.getSchool(stud.schoolId)?.name}`;
        avatarEl.textContent = stud.name.split(' ').map(n => n[0]).join('');
      }
    } else if (this.currentRole === 'teacher') {
      const coordinators = window.db.getCoordinators();
      const coord = coordinators.find(c => c.id === this.currentCoordinatorId) || coordinators[0];
      const isAdmin = coord ? coord.isSchoolAdmin : false;
      const school = coord ? window.db.getSchool(coord.schoolId) : null;
      nameEl.textContent = coord ? coord.name : 'Mrs. Smith';
      roleEl.textContent = `Languages Coordinator ${isAdmin ? '• School Admin' : ''} (${school ? school.code : ''})`;
      avatarEl.textContent = coord ? coord.name.split(' ').map(n => n[0]).join('') : 'MS';
    } else if (this.currentRole === 'admin') {
      nameEl.textContent = 'System Admin';
      roleEl.textContent = 'Platform Administrator';
      avatarEl.textContent = 'AD';
    } else if (this.currentRole === 'new-coordinator') {
      nameEl.textContent = 'Unregistered Teacher';
      roleEl.textContent = 'Awaiting School Connect';
      avatarEl.textContent = 'UT';
    }
  }

  // Dynamic Navigation sidebars
  renderNavigation() {
    document.getElementById('student-nav').style.display = 'none';
    document.getElementById('teacher-nav').style.display = 'none';
    document.getElementById('admin-nav').style.display = 'none';
    document.getElementById('new-coordinator-nav').style.display = 'none';

    let defaultTab = '';
    if (this.currentRole === 'student') {
      document.getElementById('student-nav').style.display = 'flex';
      defaultTab = 'stud-dashboard';
    } else if (this.currentRole === 'teacher') {
      document.getElementById('teacher-nav').style.display = 'flex';
      defaultTab = 'teach-dashboard';
    } else if (this.currentRole === 'admin') {
      document.getElementById('admin-nav').style.display = 'flex';
      defaultTab = 'admin-dashboard';
    } else if (this.currentRole === 'new-coordinator') {
      document.getElementById('new-coordinator-nav').style.display = 'flex';
      defaultTab = 'new-coord-onboarding';
    }

    this.switchTab(defaultTab);
  }

  // Handle Tab switches
  switchTab(tabId) {
    // Hide all view panels
    document.querySelectorAll('.tab-view-panel').forEach(panel => {
      panel.style.display = 'none';
    });

    // Deactivate all sidebar nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });

    // Show active panel
    const targetPanel = document.getElementById(`view-${tabId}`);
    if (targetPanel) {
      targetPanel.style.display = 'block';
    }

    // Activate corresponding link
    const targetLink = document.querySelector(`.nav-link[data-tab="${tabId}"]`);
    if (targetLink) {
      targetLink.classList.add('active');
    }

    // Set page header title
    const titleEl = document.getElementById('view-title');
    const subtitleEl = document.getElementById('view-subtitle');

    const localizedTitle = window.translator.UI_TRANSLATIONS[this.interfaceLang][tabId.replace('-', '_')];
    titleEl.textContent = localizedTitle || tabId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    if (this.currentRole === 'student') {
      const student = window.db.getStudent(this.currentStudentId);
      const template = window.translator.UI_TRANSLATIONS[this.interfaceLang].welcome_subtitle_student || "Welcome, {name}! Connect with your cultural exchange partner.";
      subtitleEl.textContent = template.replace('{name}', student?.name || 'Student');
    } else if (this.currentRole === 'teacher') {
      subtitleEl.textContent = 'Staff Portal: Monitor safety, review student articles, and pair partners.';
    } else if (this.currentRole === 'admin') {
      subtitleEl.textContent = 'Platform Management Dashboard: Audit global actions and register schools.';
    } else if (this.currentRole === 'new-coordinator') {
      subtitleEl.textContent = 'Coordinator Onboarding: Connect your school to Bridge to participate.';
    }

    // Refresh dynamic views on switch
    this.refreshUI();
  }

  // Theme support toggle
  toggleTheme() {
    const btn = document.getElementById('theme-toggle-btn');
    if (this.theme === 'dark') {
      this.theme = 'light';
      document.documentElement.setAttribute('data-theme', 'light');
      btn.textContent = '☀️ Light Mode';
    } else {
      this.theme = 'dark';
      document.documentElement.removeAttribute('data-theme');
      btn.textContent = '🌙 Dark Mode';
    }
  }

  // Set Language for localization
  setLanguage(lang) {
    this.interfaceLang = lang;
    
    // Apply UI translation dictionary definitions
    document.querySelectorAll('[data-localize]').forEach(el => {
      const key = el.getAttribute('data-localize');
      if (window.translator.UI_TRANSLATIONS[lang] && window.translator.UI_TRANSLATIONS[lang][key]) {
        el.textContent = window.translator.UI_TRANSLATIONS[lang][key];
      }
    });

    // Update headings/labels
    this.switchTab(document.querySelector('.nav-link.active').getAttribute('data-tab'));
    
    this.refreshUI();
  }

  // Developer switches roles
  switchRole(role, studentId, coordId) {
    this.currentRole = role;
    if (studentId) {
      this.currentStudentId = studentId;
      // Auto-set translation language based on student origin
      const stud = window.db.getStudent(studentId);
      if (stud) {
        this.setLanguage(stud.language);
        document.getElementById('ui-lang-selector').value = stud.language;
      }
    } else {
      this.setLanguage('en');
      document.getElementById('ui-lang-selector').value = 'en';
    }
    
    if (role === 'teacher') {
      this.currentCoordinatorId = coordId || 'coord_1';
    }
    
    this.activeMatchId = null;
    this.activeProjectId = null;
    this.updateUserBadge();
    this.renderNavigation();
  }

  // Main UI refresh selector
  refreshUI() {
    if (!this.isLoggedIn) return;
    // Redraw based on role
    if (this.currentRole === 'student') {
      this.renderStudentDashboard();
      this.renderStudentChat();
      this.renderLanguageWidget();
      this.populateStudentSettings();
      this.renderStudentProjects();
    } else if (this.currentRole === 'teacher') {
      this.renderTeacherDashboard();
      this.renderStudentRoster();
      this.renderTeacherMatching();
      this.renderTeacherSafeguarding();
      this.renderTeacherEditorDesk();
      this.populateTeacherSettings();
      this.renderTeacherMessages();
      this.renderTeacherProjects();
    } else if (this.currentRole === 'admin') {
      this.renderAdminDashboard();
      this.renderAdminSchools();
    } else if (this.currentRole === 'new-coordinator') {
      this.renderNewCoordinatorOnboarding();
    }
  }

  // ================== STUDENT PORTAL RENDERERS ==================

  renderStudentDashboard() {
    const student = window.db.getStudent(this.currentStudentId);
    if (!student) return;

    // School Branding Banner Details
    const school = window.db.getSchool(student.schoolId);
    const bannerEl = document.getElementById('student-school-banner');
    const photoEl = document.getElementById('student-school-photo');
    const logoEl = document.getElementById('student-school-logo');
    const nameEl = document.getElementById('student-school-name');
    const locationEl = document.getElementById('student-school-location');

    if (school) {
      if (bannerEl) bannerEl.style.display = 'flex';
      
      if (photoEl) {
        if (school.photoUrl) {
          photoEl.style.backgroundImage = `url('${school.photoUrl}')`;
          photoEl.style.display = 'block';
        } else {
          photoEl.style.backgroundImage = 'none';
          photoEl.style.display = 'none';
        }
      }
      
      if (logoEl) {
        if (school.logoUrl) {
          logoEl.src = school.logoUrl;
          logoEl.style.display = 'block';
        } else {
          logoEl.src = '';
          logoEl.style.display = 'none';
        }
      }
      
      if (nameEl) nameEl.textContent = school.name;
      if (locationEl) locationEl.textContent = `${school.city}, ${school.country}`;
    } else {
      if (bannerEl) bannerEl.style.display = 'none';
    }

    // Welcome Card Content
    const welcomeContainer = document.getElementById('student-welcome-details');
    const badge = document.getElementById('student-match-badge');
    
    // Check pen pal matches
    const matches = window.db.getMatches().filter(m => m.active && m.studentIds.includes(student.id));
    
    const translations = window.translator.UI_TRANSLATIONS[this.interfaceLang];

    if (matches.length > 0) {
      const partnerId = matches[0].studentIds.find(id => id !== student.id);
      const partner = window.db.getStudent(partnerId);
      const school = window.db.getSchool(partner?.schoolId);
      
      badge.className = "badge badge-success";
      badge.textContent = translations.matched_status || "Matched";
      
      const titleText = `${translations.welcome_title_matched || "Your Pen Pal is"} <span class="clickable-partner-link" style="cursor: pointer; text-decoration: underline;" onclick="app.openStudentDetailModal('${partner?.id}')" title="Click to view partner profile">${partner?.name || 'Unknown'}</span>`;
      const schoolLabel = translations.school_label || "School";
      const ageLabel = translations.age_label || "Age";
      const yGroupLabel = translations.year_group_label || "Year group";
      const sendMsgBtnText = translations.send_message_btn || "Send a Message";

      // Calculate stats
      const allMatches = window.db.getMatches();
      const activeMatchesBetweenSchools = allMatches.filter(m => {
        if (!m.active) return false;
        const s0 = window.db.getStudent(m.studentIds[0]);
        const s1 = window.db.getStudent(m.studentIds[1]);
        return (s0 && s1) && (
          (s0.schoolId === 'school_1' && s1.schoolId === 'school_2') ||
          (s0.schoolId === 'school_2' && s1.schoolId === 'school_1')
        );
      });
      const pairedCount = activeMatchesBetweenSchools.length * 2;
      const msgCount = window.db.getMessages().filter(m => m.matchId === matches[0].id).length;
      const artCount = window.db.getArticles().filter(a => 
        a.status === 'Approved' && (a.schoolId === 'school_1' || a.schoolId === 'school_2')
      ).length;

      const pairedStudentsText = (translations.paired_students_text || "{count} active pen pals!").replace('{count}', pairedCount);
      
      const messagesExchangedText = msgCount === 1
        ? (translations.messages_exchanged_text_singular || "1 friendly message shared!")
        : (translations.messages_exchanged_text_plural || "{count} friendly messages shared!").replace('{count}', msgCount);
        
      const publishedArticlesText = artCount === 1
        ? (translations.published_articles_text_singular || "1 story published!")
        : (translations.published_articles_text_plural || "{count} stories published!").replace('{count}', artCount);

      const activeExchangesLabel = translations.active_exchanges_label || "Global Pen Pals";
      const chatHistoryLabel = translations.chat_history_label || "Our Chat Messages";
      const sharedPubsLabel = translations.shared_publications_label || "Cultural Discoveries";
      const engagementMetricsTitle = translations.engagement_metrics_title || "Our Exchange Journey";

      // Determine Friendly Level based on message count
      let connectionLevel = translations.level_getting_started || "Getting Started 🌱";
      let levelBadgeColor = "rgba(16, 185, 129, 0.15)";
      let levelTextColor = "#34d399";
      let levelBorderColor = "rgba(16, 185, 129, 0.25)";

      if (msgCount >= 20) {
        connectionLevel = translations.level_super_friends || "Super Friends! 💖";
        levelBadgeColor = "rgba(236, 72, 153, 0.15)";
        levelTextColor = "#f472b6";
        levelBorderColor = "rgba(236, 72, 153, 0.25)";
      } else if (msgCount >= 10) {
        connectionLevel = translations.level_great_penpals || "Great Pen Pals! 🌟";
        levelBadgeColor = "rgba(245, 158, 11, 0.15)";
        levelTextColor = "#fbbf24";
        levelBorderColor = "rgba(245, 158, 11, 0.25)";
      } else if (msgCount >= 3) {
        connectionLevel = translations.level_chatty_friends || "Chatty Friends! 💬";
        levelBadgeColor = "rgba(59, 130, 246, 0.15)";
        levelTextColor = "#60a5fa";
        levelBorderColor = "rgba(59, 130, 246, 0.25)";
      }

      welcomeContainer.innerHTML = `
        <div style="display: flex; gap: 1.5rem; align-items: center; margin-top: 1rem;">
          <div class="user-avatar" style="width: 60px; height: 60px; font-size: 1.5rem; cursor: pointer;" onclick="app.openStudentDetailModal('${partner?.id}')" title="Click to view partner profile">
            ${partner?.name.split(' ').map(n => n[0]).join('') || '?'}
          </div>
          <div>
            <h3>${titleText}</h3>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">🏫 ${schoolLabel}: <span class="clickable-school-link" onclick="app.openSchoolDetail('${school?.id}')">${school?.name}</span> (${school?.city}, ${school?.country})</p>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">🎂 ${ageLabel}: ${partner?.age} • ${yGroupLabel}: ${partner?.yearGroup}</p>
            <button class="btn btn-primary btn-small" style="margin-top: 0.5rem;" onclick="app.switchTab('stud-chat')">${sendMsgBtnText}</button>
          </div>
        </div>

        <!-- Exchange Engagement Metrics Grid -->
        <div style="margin-top: 1.75rem; border-top: 1px solid var(--panel-border); padding-top: 1.5rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;">
            <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); letter-spacing: 0.05em; margin: 0; text-transform: uppercase;">🚀 ${engagementMetricsTitle}</h4>
            <span style="font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 20px; background: ${levelBadgeColor}; color: ${levelTextColor}; border: 1px solid ${levelBorderColor};">${connectionLevel}</span>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.25rem;">
            <div class="student-metric-card card-cyan">
              <span class="student-metric-label">${activeExchangesLabel}</span>
              <span class="student-metric-value">${pairedCount}</span>
              <span class="student-metric-desc">${pairedStudentsText}</span>
              <span class="student-metric-watermark">🌍</span>
            </div>
            <div class="student-metric-card card-blue">
              <span class="student-metric-label">${chatHistoryLabel}</span>
              <span class="student-metric-value">${msgCount}</span>
              <span class="student-metric-desc">${messagesExchangedText}</span>
              <span class="student-metric-watermark">💬</span>
            </div>
            <div class="student-metric-card card-purple">
              <span class="student-metric-label">${sharedPubsLabel}</span>
              <span class="student-metric-value">${artCount}</span>
              <span class="student-metric-desc">${publishedArticlesText}</span>
              <span class="student-metric-watermark">✨</span>
            </div>
          </div>
        </div>
      `;
    } else {
      badge.className = "badge badge-warning";
      badge.textContent = translations.awaiting_match_status || "Awaiting Match";
      
      const noMatchTitle = translations.welcome_title_unmatched || "You don't have a pen pal match yet!";
      const noMatchDesc = translations.welcome_desc_unmatched || "Your languages teacher will match you with a student from a partner school shortly.";
      const writeArtBtnText = translations.write_article_btn || "Write a Culture Article";

      // Calculate global stats
      const allMatches = window.db.getMatches();
      const activeMatches = allMatches.filter(m => m.active);
      const pairedCount = activeMatches.length * 2;
      const artCount = window.db.getArticles().filter(a => a.status === 'Approved').length;

      const pairedStudentsText = (translations.paired_students_text || "{count} active pen pals!").replace('{count}', pairedCount);
      
      const publishedArticlesText = artCount === 1
        ? (translations.published_articles_text_singular || "1 story published!")
        : (translations.published_articles_text_plural || "{count} stories published!").replace('{count}', artCount);

      const activeExchangesLabel = translations.active_exchanges_label || "Global Pen Pals";
      const sharedPubsLabel = translations.shared_publications_label || "Cultural Discoveries";
      const globalStatisticsTitle = translations.global_statistics_title || "Bridge Community Stats";

      welcomeContainer.innerHTML = `
        <div style="margin-top: 1rem;">
          <h3>${noMatchTitle}</h3>
          <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 0.75rem;">${noMatchDesc}</p>
          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-secondary btn-small" onclick="app.switchTab('stud-culture')">${writeArtBtnText}</button>
          </div>
        </div>

        <!-- Global Engagement Metrics Grid -->
        <div style="margin-top: 1.75rem; border-top: 1px solid var(--panel-border); padding-top: 1.5rem;">
          <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); letter-spacing: 0.05em; margin-bottom: 1rem; text-transform: uppercase;">📊 ${globalStatisticsTitle}</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.25rem;">
            <div class="student-metric-card card-cyan">
              <span class="student-metric-label">${activeExchangesLabel}</span>
              <span class="student-metric-value">${pairedCount}</span>
              <span class="student-metric-desc">${pairedStudentsText}</span>
              <span class="student-metric-watermark">🌍</span>
            </div>
            <div class="student-metric-card card-purple">
              <span class="student-metric-label">${sharedPubsLabel}</span>
              <span class="student-metric-value">${artCount}</span>
              <span class="student-metric-desc">${publishedArticlesText}</span>
              <span class="student-metric-watermark">✨</span>
            </div>
          </div>
        </div>
      `;
    }

    // News Feed rendering
    const newsContainer = document.getElementById('student-news-feed');
    const news = window.db.getNews();
    
    newsContainer.innerHTML = '';
    news.forEach(item => {
      const card = document.createElement('div');
      card.className = 'panel news-card';
      card.style.padding = '1rem';
      card.style.background = 'rgba(255,255,255,0.01)';
      card.style.border = '1px solid var(--panel-border)';
      
      // Look up if this news item is for an article and has a photo
      let photoHtml = '';
      if (item.title.startsWith('Published: ')) {
        const artTitle = item.title.replace('Published: ', '').trim();
        const art = window.db.getArticles().find(a => a.title === artTitle);
        if (art && art.photoUrl) {
          photoHtml = `<img src="${art.photoUrl}" alt="${art.title} image" style="width: 100%; height: 140px; object-fit: cover; border-radius: 8px; margin-bottom: 0.75rem;">`;
        }
      }

      const translations = window.translator.UI_TRANSLATIONS[this.interfaceLang];
      const byAuthorText = translations.by_author || "By";
      card.innerHTML = `
        ${photoHtml}
        <h4 style="font-weight: 700; font-size: 1rem; margin-bottom: 0.25rem;">${item.title}</h4>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">${item.content}</p>
        <div class="news-card-meta">
          <span>${byAuthorText}: ${item.postedBy}</span>
          <span>${new Date(item.timestamp).toLocaleDateString()}</span>
        </div>
      `;
      newsContainer.appendChild(card);
    });

    // Submitted Articles status list
    const articlesContainer = document.getElementById('student-page-articles-list');
    const studentArticles = window.db.getArticles().filter(a => a.authorId === student.id);
    
    articlesContainer.innerHTML = '';
    if (studentArticles.length === 0) {
      const translations = window.translator.UI_TRANSLATIONS[this.interfaceLang];
      const noArticlesText = translations.no_articles_submitted || "No articles submitted yet.";
      articlesContainer.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 1rem;">${noArticlesText}</p>`;
    } else {
      studentArticles.forEach(art => {
        const item = document.createElement('div');
        item.style.padding = '0.75rem';
        item.style.background = 'rgba(255,255,255,0.02)';
        item.style.border = '1px solid var(--panel-border)';
        item.style.borderRadius = '8px';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.cursor = 'pointer';
        item.title = 'Click to read article';
        item.addEventListener('click', () => this.openStudentArticleDetail(art.id));
        
        let statusBadge = '';
        if (art.status === 'Approved') statusBadge = '<span class="badge badge-success">Approved</span>';
        else if (art.status === 'Pending') statusBadge = '<span class="badge badge-warning">Pending</span>';
        else statusBadge = '<span class="badge badge-danger">Rejected</span>';

        const photoHtml = art.photoUrl
          ? `<img src="${art.photoUrl}" alt="Article thumb" style="width: 36px; height: 36px; object-fit: cover; border-radius: 6px; margin-right: 0.75rem;">`
          : '<div style="width: 36px; height: 36px; background: rgba(0,0,0,0.15); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; margin-right: 0.75rem; color: var(--text-muted);">📷</div>';

        item.innerHTML = `
          <div style="display: flex; align-items: center;">
            ${photoHtml}
            <div>
              <h5 style="font-size: 0.85rem; font-weight: 600; margin: 0;">${art.title}</h5>
              <span style="font-size: 0.7rem; color: var(--text-muted);">${new Date(art.submittedAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div>${statusBadge}</div>
        `;
        articlesContainer.appendChild(item);
      });
    }
  }

  // Populate student account configuration
  populateStudentSettings() {
    const student = window.db.getStudent(this.currentStudentId);
    if (!student) return;

    document.getElementById('stud-setting-name').value = student.name;
    document.getElementById('stud-setting-school').value = window.db.getSchool(student.schoolId)?.name || 'Unknown';
    document.getElementById('stud-setting-email').value = student.email;

    // Biography fields
    const biogInput = document.getElementById('stud-setting-biog');
    const statusBanner = document.getElementById('stud-biog-status-banner');
    if (biogInput && statusBanner) {
      biogInput.value = student.pendingBiog || student.personalBiog || '';
      
      if (student.personalBiogStatus === 'Pending') {
        statusBanner.style.display = 'block';
        statusBanner.style.padding = '0.5rem 0.75rem';
        statusBanner.style.borderRadius = '6px';
        statusBanner.style.background = 'rgba(245, 158, 11, 0.1)';
        statusBanner.style.border = '1px solid rgba(245, 158, 11, 0.2)';
        statusBanner.style.color = '#fbbf24';
        statusBanner.textContent = '⏳ Biography pending teacher review. Partners will not see edits until approved.';
      } else if (student.personalBiogStatus === 'Approved') {
        statusBanner.style.display = 'block';
        statusBanner.style.padding = '0.5rem 0.75rem';
        statusBanner.style.borderRadius = '6px';
        statusBanner.style.background = 'rgba(16, 185, 129, 0.1)';
        statusBanner.style.border = '1px solid rgba(16, 185, 129, 0.2)';
        statusBanner.style.color = '#34d399';
        statusBanner.textContent = '✅ Biography approved and visible to your pen pal.';
      } else if (student.personalBiogStatus === 'Rejected') {
        statusBanner.style.display = 'block';
        statusBanner.style.padding = '0.5rem 0.75rem';
        statusBanner.style.borderRadius = '6px';
        statusBanner.style.background = 'rgba(239, 68, 68, 0.1)';
        statusBanner.style.border = '1px solid rgba(239, 68, 68, 0.2)';
        statusBanner.style.color = '#f87171';
        statusBanner.textContent = '❌ Biography declined by teacher. Please revise and resubmit.';
      } else {
        statusBanner.style.display = 'none';
      }
    }
  }

  saveStudentBiography() {
    const biogInput = document.getElementById('stud-setting-biog');
    if (!biogInput) return;
    const text = biogInput.value.trim();
    
    window.db.submitStudentBiog(this.currentStudentId, text);
    alert('Biography submitted successfully for teacher review.');
    this.refreshUI();
  }

  // Renders Student Chat messaging panels
  renderStudentChat() {
    const student = window.db.getStudent(this.currentStudentId);
    if (!student) return;

    const chatListContainer = document.getElementById('student-chat-list');
    const chatEmptyState = document.getElementById('chat-empty-state');
    const chatActiveState = document.getElementById('chat-active-state');

    // Get matches for this student
    const activeMatches = window.db.getMatches().filter(m => m.active && m.studentIds.includes(student.id));

    chatListContainer.innerHTML = '';
    if (activeMatches.length === 0) {
      chatListContainer.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted); padding: 1rem; text-align: center;">No matched pen pals yet.</p>`;
      chatEmptyState.style.display = 'flex';
      chatActiveState.style.display = 'none';
      return;
    }

    // Set first match as default if none selected
    if (!this.activeMatchId) {
      this.activeMatchId = activeMatches[0].id;
    }

    activeMatches.forEach(match => {
      const partnerId = match.studentIds.find(id => id !== student.id);
      const partner = window.db.getStudent(partnerId);
      const messages = window.db.getMessages().filter(m => m.matchId === match.id);
      const lastMsg = messages[messages.length - 1];

      const item = document.createElement('div');
      item.className = `chat-item ${this.activeMatchId === match.id ? 'active' : ''}`;
      
      let badgeStatus = '';
      if (match.paused) {
        badgeStatus = `<span class="badge badge-danger btn-small" style="font-size: 0.6rem; padding: 0.1rem 0.35rem;">Paused</span>`;
      }

      item.innerHTML = `
        <div class="user-avatar" style="width: 32px; height: 32px; font-size: 0.8rem;">
          ${partner?.name.split(' ').map(n => n[0]).join('') || '?'}
        </div>
        <div class="chat-item-meta">
          <div class="chat-item-name">
            <span>${partner?.name || 'Partner'}</span>
            ${badgeStatus}
          </div>
          <div class="chat-item-preview">${lastMsg ? lastMsg.text : 'Start chatting...'}</div>
        </div>
      `;

      item.addEventListener('click', () => {
        this.activeMatchId = match.id;
        this.renderStudentChat();
      });

      chatListContainer.appendChild(item);
    });

    // Render active chat
    const currentMatch = activeMatches.find(m => m.id === this.activeMatchId);
    if (currentMatch) {
      chatEmptyState.style.display = 'none';
      chatActiveState.style.display = 'flex';

      const partnerId = currentMatch.studentIds.find(id => id !== student.id);
      const partner = window.db.getStudent(partnerId);
      const partnerSchool = window.db.getSchool(partner?.schoolId);

      document.getElementById('chat-partner-avatar').textContent = partner?.name.split(' ').map(n => n[0]).join('') || '?';
      document.getElementById('chat-partner-name').textContent = partner?.name;
      document.getElementById('chat-partner-school').textContent = `${partnerSchool?.name} • ${partnerSchool?.country}`;

      // Paused Banner and composing settings
      const safetyBanner = document.getElementById('chat-safety-banner');
      const composeArea = document.getElementById('chat-compose-area');
      
      if (currentMatch.paused) {
        safetyBanner.style.display = 'flex';
        composeArea.style.opacity = '0.5';
        document.getElementById('chat-textarea').disabled = true;
        document.getElementById('chat-send-btn').disabled = true;
        document.getElementById('translate-compose-btn').disabled = true;
      } else {
        safetyBanner.style.display = 'none';
        composeArea.style.opacity = '1';
        document.getElementById('chat-textarea').disabled = false;
        document.getElementById('chat-send-btn').disabled = false;
        document.getElementById('translate-compose-btn').disabled = false;
      }

      // Populate Message Feed bubbles
      const feed = document.getElementById('chat-message-feed');
      feed.innerHTML = '';
      
      const messages = window.db.getMessages().filter(m => m.matchId === currentMatch.id);
      messages.forEach(msg => {
        const row = document.createElement('div');
        const isSent = msg.senderId === student.id;
        row.className = `message-row ${isSent ? 'sent' : 'received'}`;
        
        let transRow = '';
        if (msg.translation) {
          transRow = `<div class="message-translation">📝 ${msg.translation}</div>`;
        }

        let flaggedMarkup = '';
        if (msg.flagged) {
          flaggedMarkup = `<div style="font-size: 0.75rem; color: var(--danger); font-weight: bold; margin-top: 0.25rem;">[Flagged by SafeGuard: ${msg.flagReason}]</div>`;
        }

        row.innerHTML = `
          <div class="message-bubble">
            <div>${msg.text}</div>
            ${transRow}
          </div>
          ${flaggedMarkup}
          <div class="message-meta">
            ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        `;
        feed.appendChild(row);
      });

      // Auto-scroll feed to bottom
      feed.scrollTop = feed.scrollHeight;
    }
  }

  // Draft Translation button logic
  draftTranslation() {
    const textarea = document.getElementById('chat-textarea');
    const previewSpan = document.getElementById('compose-translation-preview');
    const student = window.db.getStudent(this.currentStudentId);
    
    if (!textarea.value || !student) return;

    const sourceLang = student.language;
    const targetLang = sourceLang === 'en' ? 'de' : 'en';

    const translated = window.translator.mockTranslate(textarea.value, sourceLang, targetLang);
    previewSpan.textContent = `Draft: ${translated}`;
    previewSpan.setAttribute('data-draft', translated);
  }

  // Send message implementation
  sendMessage() {
    const textarea = document.getElementById('chat-textarea');
    const previewSpan = document.getElementById('compose-translation-preview');
    
    if (!textarea.value.trim() || !this.activeMatchId) return;

    const student = window.db.getStudent(this.currentStudentId);
    const text = textarea.value.trim();
    const draftTranslation = previewSpan.getAttribute('data-draft') || '';

    // Save to DB
    window.db.addMessage(this.activeMatchId, student.id, text, draftTranslation);

    // Clean inputs
    textarea.value = '';
    previewSpan.textContent = '';
    previewSpan.removeAttribute('data-draft');

    // Reload UI
    this.refreshUI();
  }

  // Report safety concern form handler
  handleReportConcern(e) {
    e.preventDefault();
    const reason = document.getElementById('report-reason').value;
    const details = document.getElementById('report-details').value;
    const student = window.db.getStudent(this.currentStudentId);

    if (!this.activeMatchId || !student) return;

    // Set flag
    const messages = window.db.getMessages().filter(m => m.matchId === this.activeMatchId);
    const lastMsg = messages[messages.length - 1];
    
    // Create audit log and pause chat
    window.db.pauseMatch(this.activeMatchId, true);
    
    // Register safeguarding alert
    const flags = window.db.getFlags();
    const newFlag = {
      id: 'flag_' + Date.now(),
      messageId: lastMsg ? lastMsg.id : 'no_msg',
      status: 'Pending',
      flaggedAt: new Date().toISOString(),
      reason: reason,
      details: details,
      reportedBy: student.name,
      reviewedBy: null,
      reviewedAt: null,
      actionTaken: null
    };
    flags.push(newFlag);
    window.db.saveTable('flags', flags);
    window.db.addLog('Safeguarding Report', `Student ${student.name} flagged chat. Reason: ${reason}`, student.name);

    this.closeModal('report-concern-modal');
    document.getElementById('report-concern-form').reset();
    
    alert('Thank you for reporting this concern. Your teachers have been notified and the chat is paused until review.');
    
    this.refreshUI();
  }

  // Language Widget Renders
  renderLanguageWidget() {
    const startersContainer = document.getElementById('starters-container');
    const vocabContainer = document.getElementById('vocab-container');
    const promptsContainer = document.getElementById('prompts-container');

    // Populate sentence starters
    startersContainer.innerHTML = '';
    window.translator.SENTENCE_STARTERS.forEach(starter => {
      const item = document.createElement('div');
      item.className = 'starter-item';
      
      const studLang = window.db.getStudent(this.currentStudentId)?.language || 'en';
      const mainPhrase = starter[studLang];
      const translatePhrase = starter[studLang === 'en' ? 'de' : 'en'];

      item.innerHTML = `
        <div class="starter-cat">${starter.category}</div>
        <div class="starter-phrase">${mainPhrase}</div>
        <div class="starter-translation">${translatePhrase}</div>
      `;

      item.addEventListener('click', () => {
        const textarea = document.getElementById('chat-textarea');
        textarea.value += mainPhrase;
        textarea.focus();
        
        // Trigger auto translation preview
        const targetLang = studLang === 'en' ? 'de' : 'en';
        const previewSpan = document.getElementById('compose-translation-preview');
        previewSpan.textContent = `Draft: ${translatePhrase}`;
        previewSpan.setAttribute('data-draft', translatePhrase);
      });

      startersContainer.appendChild(item);
    });

    // Populate vocab lists
    vocabContainer.innerHTML = '';
    window.translator.VOCABULARY_LIST.forEach(vocab => {
      const item = document.createElement('div');
      item.className = 'vocab-item';
      item.innerHTML = `
        <span><strong>${vocab.en}</strong> = <em>${vocab.de}</em></span>
        <span class="vocab-tag">${vocab.category}</span>
      `;
      vocabContainer.appendChild(item);
    });

    // Populate prompts
    promptsContainer.innerHTML = '';
    window.translator.WRITING_PROMPTS.forEach(prompt => {
      const item = document.createElement('div');
      item.style.padding = '0.75rem';
      item.style.background = 'rgba(255,255,255,0.02)';
      item.style.border = '1px solid var(--panel-border)';
      item.style.borderRadius = '8px';
      item.style.fontSize = '0.85rem';
      
      const studLang = window.db.getStudent(this.currentStudentId)?.language || 'en';

      item.innerHTML = `
        <h4 style="font-weight: 700; color: var(--primary); margin-bottom: 0.25rem;">${prompt.title}</h4>
        <p>${prompt[studLang]}</p>
      `;
      promptsContainer.appendChild(item);
    });
  }

  // Handle article submission
  handleArticleSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('art-title').value.trim();
    const lang = document.getElementById('art-lang').value;
    const content = document.getElementById('art-content').value.trim();
    const photoUrl = this.currentArticlePhotoDataUrl || '';
    const student = window.db.getStudent(this.currentStudentId);

    if (!student) return;

    window.db.addArticle({
      title,
      content,
      language: lang,
      authorId: student.id,
      schoolId: student.schoolId,
      photoUrl
    });

    alert('Your article has been submitted for teacher review! Once approved, it will appear on the school news feeds.');
    document.getElementById('article-submission-form').reset();
    this.currentArticlePhotoDataUrl = '';
    
    // Reset photo preview element state
    document.getElementById('article-photo-preview').style.display = 'none';
    document.getElementById('article-photo-placeholder').style.display = 'block';
    
    this.showArticleForm(false);
    this.refreshUI();
  }


  // ================== TEACHER / STAFF PORTAL RENDERERS ==================

  renderTeacherDashboard() {
    const students = window.db.getStudents();
    const unmatched = students.filter(s => s.matchStatus === 'unmatched');
    const flags = window.db.getFlags().filter(f => f.status === 'Pending');
    const pendingArticles = window.db.getArticles().filter(a => a.status === 'Pending');
    const pendingBiogs = students.filter(s => s.personalBiogStatus === 'Pending');

    document.getElementById('stat-total-students').textContent = students.length;
    document.getElementById('stat-unmatched-students').textContent = unmatched.length;
    document.getElementById('stat-flagged-concerns').textContent = flags.length;
    document.getElementById('stat-pending-articles').textContent = pendingArticles.length + pendingBiogs.length;

    // Toggle red alert styling if there are unresolved flags
    const flagCard = document.getElementById('stat-flagged-card');
    const navAlertCount = document.getElementById('flagged-alert-count');
    
    if (flags.length > 0) {
      flagCard.style.background = 'rgba(239, 68, 68, 0.2)';
      flagCard.style.borderColor = 'var(--danger)';
      navAlertCount.style.display = 'inline-flex';
      navAlertCount.textContent = flags.length;
    } else {
      flagCard.style.background = 'var(--panel-bg)';
      flagCard.style.borderColor = 'var(--panel-border)';
      navAlertCount.style.display = 'none';
    }

    // Teasers listing
    const safeguardTeaser = document.getElementById('teacher-safeguarding-teaser');
    safeguardTeaser.innerHTML = '';
    
    if (flags.length === 0) {
      safeguardTeaser.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 1rem;">No safety concerns pending review.</p>`;
    } else {
      flags.slice(0, 3).forEach(flag => {
        const msg = window.db.getMessages().find(m => m.id === flag.messageId);
        const sender = msg ? window.db.getStudent(msg.senderId) : null;
        
        const item = document.createElement('div');
        item.style.padding = '0.75rem';
        item.style.background = 'rgba(239, 68, 68, 0.05)';
        item.style.border = '1px solid rgba(239, 68, 68, 0.15)';
        item.style.borderRadius = '8px';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        
        item.innerHTML = `
          <div>
            <h5 style="font-size: 0.85rem; font-weight: 600; color: #f87171;">Flagged Alert from ${sender ? sender.name : flag.reportedBy || 'Student'}</h5>
            <p style="font-size: 0.75rem; color: var(--text-secondary); max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">"${msg ? msg.text : flag.reason}"</p>
          </div>
          <button class="btn btn-danger btn-small" onclick="app.switchTab('teach-safeguarding')">Review</button>
        `;
        safeguardTeaser.appendChild(item);
      });
    }

    const articlesTeaser = document.getElementById('teacher-articles-teaser');
    articlesTeaser.innerHTML = '';
    
    if (pendingArticles.length === 0) {
      articlesTeaser.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 1rem;">No articles awaiting review.</p>`;
    } else {
      pendingArticles.slice(0, 3).forEach(art => {
        const author = window.db.getStudent(art.authorId);
        
        const item = document.createElement('div');
        item.style.padding = '0.75rem';
        item.style.background = 'rgba(255,255,255,0.02)';
        item.style.border = '1px solid var(--panel-border)';
        item.style.borderRadius = '8px';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        
        item.innerHTML = `
          <div>
            <h5 style="font-size: 0.85rem; font-weight: 600;">"${art.title}"</h5>
            <span style="font-size: 0.75rem; color: var(--text-secondary);">By ${author ? author.name : 'Student'}</span>
          </div>
          <button class="btn btn-secondary btn-small" onclick="app.switchTab('teach-editor')">Approve Desk</button>
        `;
        articlesTeaser.appendChild(item);
      });
    }
    
    this.renderTeacherSchoolSpotlight();
  }

  // Render own school details and linked partner school connections on staff dashboard
  renderTeacherSchoolSpotlight() {
    const teacher = this.getLoggedTeacher();
    const schoolId = teacher ? teacher.schoolId : 'school_1';
    const school = window.db.getSchool(schoolId);
    const container = document.getElementById('teacher-school-spotlight-content');
    if (!container || !school) return;

    // 1. Render Left Column: own school details
    const logoHtml = school.logoUrl 
      ? `<img src="${school.logoUrl}" alt="${school.name} logo" style="max-height: 48px; border-radius: 6px;">` 
      : '';
    const photoHtml = school.photoUrl 
      ? `<img src="${school.photoUrl}" alt="${school.name} campus" style="width: 100%; height: 150px; object-fit: cover; border-radius: 12px; margin-bottom: 0.75rem;">` 
      : '<div style="height: 150px; background: rgba(0,0,0,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--text-muted);">No campus photo added</div>';

    const leftCol = `
      <div style="display: flex; flex-direction: column;">
        ${photoHtml}
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-top: 0.5rem;">
          ${logoHtml}
          <div>
            <h4 style="font-weight: 700; font-size: 1.1rem; margin: 0; line-height: 1.2;">
              <span style="cursor: pointer; text-decoration: underline; color: var(--secondary);" onclick="app.openSchoolDetail('${school.id}')">${school.name}</span>
            </h4>
            <span style="font-size: 0.8rem; color: var(--text-secondary);">${school.city}, ${school.country}</span>
          </div>
        </div>
        <p style="font-size: 0.85rem; line-height: 1.5; color: var(--text-secondary); margin-top: 0.75rem; text-align: justify;">
          ${school.description || 'No school description provided yet.'}
        </p>
      </div>
    `;

    // 2. Render Right Column: Linked partner schools
    const students = window.db.getStudents();
    const myStudents = students.filter(s => s.schoolId === schoolId);
    const activeMatches = window.db.getMatches().filter(m => m.active && m.studentIds.some(id => myStudents.some(ms => ms.id === id)));
    
    const schoolCounts = {};
    activeMatches.forEach(m => {
      const partnerId = m.studentIds.find(id => !myStudents.some(ms => ms.id === id));
      const partner = students.find(s => s.id === partnerId);
      if (partner && partner.schoolId) {
        schoolCounts[partner.schoolId] = (schoolCounts[partner.schoolId] || 0) + 1;
      }
    });

    const linkedSchools = Object.keys(schoolCounts).map(id => {
      return {
        school: window.db.getSchool(id),
        count: schoolCounts[id]
      };
    }).filter(item => item.school !== undefined);

    let linksHtml = '';
    if (linkedSchools.length === 0) {
      linksHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; border: 1px dashed var(--panel-border); border-radius: 12px; padding: 2rem; color: var(--text-muted); text-align: center;">
          <span style="font-size: 2.25rem; margin-bottom: 0.5rem;">🔗</span>
          <h5 style="margin: 0; font-weight: 600;">No Linked Partner Schools</h5>
          <p style="font-size: 0.75rem; margin-top: 0.25rem;">Use the Matching Tool to pair students and establish international links.</p>
        </div>
      `;
    } else {
      linksHtml = `
        <div style="display: flex; flex-direction: column; gap: 1rem; height: 100%;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.25rem; border-bottom: 1px solid var(--panel-border); padding-bottom: 0.5rem;">
            Established Connections (${linkedSchools.length})
          </h4>
          <div style="display: flex; flex-direction: column; gap: 0.75rem; overflow-y: auto; max-height: 240px;">
            ${linkedSchools.map(item => {
              const partnerLogo = item.school.logoUrl 
                ? `<img src="${item.school.logoUrl}" alt="${item.school.name} logo" style="height: 36px; width: 36px; object-fit: contain; border-radius: 4px;">` 
                : '<div style="height: 36px; width: 36px; background: rgba(255,255,255,0.05); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;">🏫</div>';
              
              return `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: rgba(255,255,255,0.02); border: 1px solid var(--panel-border); border-radius: 12px; transition: all 0.2s;">
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    ${partnerLogo}
                    <div>
                      <h5 style="font-weight: 700; font-size: 0.9rem; margin: 0;">
                        <span style="cursor: pointer; text-decoration: underline; color: var(--secondary);" onclick="app.openSchoolDetail('${item.school.id}')">${item.school.name}</span>
                      </h5>
                      <span style="font-size: 0.75rem; color: var(--text-muted);">${item.school.city}, ${item.school.country}</span>
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="badge badge-info">${item.count} Linked Student${item.count > 1 ? 's' : ''}</span>
                    <span class="badge badge-success" style="font-size: 0.65rem;">Active Link</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      ${leftCol}
      <div style="display: flex; flex-direction: column; justify-content: flex-start;">
        ${linksHtml}
      </div>
    `;
  }

  // Renders teacher list of students
  renderStudentRoster() {
    const tbody = document.getElementById('student-roster-tbody');
    const teacher = this.getLoggedTeacher();
    const schoolId = teacher ? teacher.schoolId : 'school_1';
    const students = window.db.getStudents().filter(s => s.schoolId === schoolId);
    
    tbody.innerHTML = '';
    students.forEach(stud => {
      const school = window.db.getSchool(stud.schoolId);
      
      let statusBadge = '';
      if (stud.matchStatus === 'matched') statusBadge = '<span class="badge badge-success">Matched</span>';
      else statusBadge = '<span class="badge badge-warning">Unmatched</span>';

      let activeBadge = '';
      if (stud.invitationStatus === 'Active') activeBadge = '<span class="badge badge-success">Active</span>';
      else if (stud.invitationStatus === 'Archived') activeBadge = '<span class="badge badge-danger">Archived</span>';
      else activeBadge = '<span class="badge badge-info">Invited</span>';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="font-weight: 600;">${stud.name}<br><span style="font-size: 0.75rem; font-weight: normal; color: var(--text-secondary);">${stud.email}</span></td>
        <td>${stud.age} • ${stud.gender}</td>
        <td>${stud.yearGroup}<br><span style="font-size: 0.75rem; color: var(--text-muted);">${school ? school.name : 'Unknown'}</span></td>
        <td>${statusBadge}</td>
        <td>
          <span style="font-size: 0.8rem;">Engagement: <strong>${stud.activityLevel}</strong></span>
        </td>
        <td>${activeBadge}</td>
        <td>
          <button class="btn btn-secondary btn-small" onclick="app.simulateInviteResend('${stud.id}')" title="Resend Invite Code">Resend invite</button>
          <button class="btn btn-danger btn-small" onclick="app.removeStudentAccount('${stud.id}')">Archive</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  // Populate school assign dropdown menus
  openInviteModal() {
    const schoolSelect = document.getElementById('new-student-school');
    const schools = window.db.getSchools();
    
    schoolSelect.innerHTML = '';
    schools.forEach(school => {
      const option = document.createElement('option');
      option.value = school.id;
      option.textContent = `${school.name} (${school.country})`;
      schoolSelect.appendChild(option);
    });

    document.getElementById('invite-result-area').style.display = 'none';
    this.openModal('invite-student-modal');
  }

  // Populate school assign dropdown menus for bulk invite
  openBulkModal() {
    const schoolSelect = document.getElementById('bulk-school');
    const schools = window.db.getSchools();
    
    schoolSelect.innerHTML = '';
    schools.forEach(school => {
      const option = document.createElement('option');
      option.value = school.id;
      option.textContent = `${school.name} (${school.country})`;
      schoolSelect.appendChild(option);
    });

    this.openModal('bulk-upload-modal');
  }

  // Single invitation creation handler
  handleInviteStudent(e) {
    e.preventDefault();
    const name = document.getElementById('new-student-name').value;
    const email = document.getElementById('new-student-email').value;
    const age = parseInt(document.getElementById('new-student-age').value);
    const gender = document.getElementById('new-student-gender').value;
    const yearGroup = document.getElementById('new-student-year').value;
    const schoolId = document.getElementById('new-student-school').value;

    const school = window.db.getSchool(schoolId);
    
    // Add student
    const newStudent = {
      id: 'stud_' + Date.now(),
      name,
      email,
      age,
      gender,
      yearGroup,
      schoolId,
      language: school ? school.language : 'en',
      active: false,
      matchStatus: 'unmatched',
      activityLevel: 'None',
      invitationStatus: 'Invited'
    };

    window.db.addStudent(newStudent);

    // Show secure invite link results
    const inviteLink = `${window.location.origin}/signup?token=welcome_${newStudent.id}`;
    document.getElementById('invite-link-input').value = inviteLink;
    document.getElementById('invite-result-area').style.display = 'block';

    this.renderStudentRoster();
  }

  // Copy invitation link to clipboard
  copyInviteLink() {
    const input = document.getElementById('invite-link-input');
    input.select();
    input.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(input.value);
    alert('Copied secure sign-up link: ' + input.value);
  }

  // Process bulk invite upload paste lists
  handleBulkUpload(e) {
    e.preventDefault();
    const emailsText = document.getElementById('bulk-emails').value;
    const schoolId = document.getElementById('bulk-school').value;
    const school = window.db.getSchool(schoolId);

    // Split emails
    const emails = emailsText.split(/[,\n]/).map(em => em.trim()).filter(em => em.includes('@'));

    emails.forEach((email, index) => {
      // Create name guessing or dummy name
      const nameTag = email.split('@')[0].split(/[._-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      
      const newStudent = {
        id: 'stud_bulk_' + index + '_' + Date.now(),
        name: nameTag,
        email: email,
        age: 14,
        gender: 'Other',
        yearGroup: school?.language === 'de' ? 'Klasse 9' : 'Year 9',
        schoolId,
        language: school ? school.language : 'en',
        active: false,
        matchStatus: 'unmatched',
        activityLevel: 'None',
        invitationStatus: 'Invited'
      };
      window.db.addStudent(newStudent);
    });

    this.closeModal('bulk-upload-modal');
    document.getElementById('bulk-upload-form').reset();
    alert(`Successfully processed and invited ${emails.length} students! Welcome emails sent.`);
    this.refreshUI();
  }

  // Simulate invite code resend action
  simulateInviteResend(studentId) {
    const stud = window.db.getStudent(studentId);
    if (stud) {
      window.db.updateStudent(studentId, { invitationStatus: 'Invited' });
      window.db.addLog('Invitation Resent', `Resent sign-up email invitation to ${stud.name}.`, 'Teacher');
      this.refreshUI();
      alert(`Invitation link successfully resent to ${stud.email}`);
    }
  }

  // Archive / Delete student account
  removeStudentAccount(studentId) {
    const stud = window.db.getStudent(studentId);
    if (stud && confirm(`Are you sure you want to archive student account: ${stud.name}?`)) {
      window.db.updateStudent(studentId, { active: false, invitationStatus: 'Archived', matchStatus: 'unmatched' });
      
      // Cleanup matches
      const activeMatches = window.db.getMatches().filter(m => m.active && m.studentIds.includes(studentId));
      activeMatches.forEach(m => window.db.deleteMatch(m.id));

      window.db.addLog('Student Archived', `Archived account of student ${stud.name}.`, 'Teacher');
      this.refreshUI();
    }
  }

  updateSelectedPartnerSchoolInfo() {
    const schoolId = document.getElementById('partner-school-select').value;
    const nameEl = document.getElementById('partner-school-name');
    const metaEl = document.getElementById('partner-school-meta');
    const descEl = document.getElementById('partner-school-desc');
    const countEl = document.getElementById('partner-school-unmatched-count');

    if (!nameEl || !metaEl || !descEl || !countEl) return;

    const school = window.db.getSchool(schoolId);
    if (school) {
      nameEl.textContent = school.name;
      metaEl.textContent = `${school.country} • ${school.city}`;
      descEl.textContent = school.description || 'No description available for this school.';
      
      // Calculate unmatched students count
      const students = window.db.getStudents();
      const unmatchedCount = students.filter(s => s.schoolId === schoolId && s.matchStatus === 'unmatched').length;
      countEl.textContent = unmatchedCount;
    } else {
      nameEl.textContent = 'No School Selected';
      metaEl.textContent = '';
      descEl.textContent = 'Please choose a partner school from the dropdown to continue.';
      countEl.textContent = '0';
    }
  }

  // Renders matching dashboard lists
  renderTeacherMatching() {
    this.switchMatchingSubtab(this.currentMatchingSubtab || 'pair');
    this.renderMatchingMetrics();
    const colEn = document.getElementById('match-col-en');
    const students = window.db.getStudents();

    // Dynamic school ID
    const teacher = this.getLoggedTeacher();
    const schoolId = teacher ? teacher.schoolId : 'school_1';

    const myStudents = students.filter(s => s.schoolId === schoolId).sort((a, b) => {
      if (a.matchStatus === 'unmatched' && b.matchStatus !== 'unmatched') return -1;
      if (a.matchStatus !== 'unmatched' && b.matchStatus === 'unmatched') return 1;
      return a.name.localeCompare(b.name);
    });

    // Reset selection tracking variables
    this.selectedMatchEn = null;
    document.getElementById('propose-match-btn').disabled = true;

    colEn.innerHTML = '';
    myStudents.forEach(stud => {
      let statusBadge = '';
      if (stud.matchStatus === 'matched') statusBadge = '<span class="badge badge-success">Matched</span>';
      else if (stud.matchStatus === 'proposed') statusBadge = '<span class="badge badge-warning">Proposed</span>';
      else statusBadge = '<span class="badge badge-info">Unmatched</span>';

      const card = document.createElement('div');
      card.className = `match-card`;
      card.setAttribute('data-id', stud.id);
      
      card.innerHTML = `
        <div>
          <h4 style="font-weight:600; font-size: 0.9rem;">${stud.name} (${stud.age} y/o)</h4>
          <p style="font-size: 0.75rem; color: var(--text-secondary);">${stud.gender} • ${stud.yearGroup}</p>
        </div>
        <div>${statusBadge}</div>
      `;

      // If matched or proposed, make card unselectable
      if (stud.matchStatus === 'matched' || stud.matchStatus === 'proposed') {
        card.style.opacity = '0.5';
        card.style.cursor = 'not-allowed';
      } else {
        card.addEventListener('click', () => {
          colEn.querySelectorAll('.match-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          this.selectedMatchEn = stud.id;
          
          const partnerSchoolSelect = document.getElementById('partner-school-select');
          document.getElementById('propose-match-btn').disabled = !this.selectedMatchEn || !partnerSchoolSelect.value;
        });
      }

      colEn.appendChild(card);
    });

    // Populate partner school dropdown
    const partnerSelect = document.getElementById('partner-school-select');
    const previousVal = partnerSelect.value;
    partnerSelect.innerHTML = '';

    const schools = window.db.getSchools().filter(s => s.id !== schoolId);
    schools.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.country})`;
      partnerSelect.appendChild(opt);
    });

    if (previousVal && schools.some(s => s.id === previousVal)) {
      partnerSelect.value = previousVal;
    } else if (schools.length > 0) {
      partnerSelect.value = schools[0].id;
    }

    this.updateSelectedPartnerSchoolInfo();

    // Refresh proposals tables
    this.renderMatchProposals();
  }

  // Renders visual school metrics panel at the top of the Matching screen
  renderMatchingMetrics() {
    const summaryContainer = document.getElementById('matching-metrics-summary');
    if (!summaryContainer) return;

    const schools = window.db.getSchools();
    const students = window.db.getStudents();
    const matches = window.db.getMatches();

    const teacher = this.getLoggedTeacher();
    const ownSchoolId = teacher ? teacher.schoolId : 'school_1';
    const ownSchool = window.db.getSchool(ownSchoolId);
    if (!ownSchool) return;

    const myStudents = students.filter(s => s.schoolId === ownSchoolId);
    const totalMyStudents = myStudents.length;
    const matchedMyStudents = myStudents.filter(s => s.matchStatus === 'matched').length;
    const overallMatchRate = totalMyStudents > 0 ? Math.round((matchedMyStudents / totalMyStudents) * 100) : 0;
    const totalPendingProposals = matches.filter(m => !m.active && m.status === 'Proposed' && (m.proposedBySchoolId === ownSchoolId || m.pendingApprovalFromSchoolId === ownSchoolId)).length;

    // Build the grid
    let html = `<div class="matching-metrics-grid">`;

    // 1. Overview Card
    html += `
      <div class="metric-card overview-link" style="cursor: default;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; gap: 0.5rem;">
          <h4 style="font-family: var(--font-title); font-weight: 700; font-size: 0.95rem; margin: 0; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; max-width: 180px;">${ownSchool.name}</h4>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="info-icon-btn" onclick="event.stopPropagation(); app.openSchoolDetail('${ownSchool.id}')" title="View School Profile">ℹ️</span>
            <span style="font-size: 1.25rem;">📊</span>
          </div>
        </div>
        <div style="font-size: 1.5rem; font-weight: 800; font-family: var(--font-title); color: var(--accent); margin: 0.25rem 0;">
          ${overallMatchRate}% <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-secondary);">of students paired</span>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem; font-weight: 500;">
          ${matchedMyStudents} of ${totalMyStudents} students paired
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">
          ${totalPendingProposals} pending request${totalPendingProposals === 1 ? '' : 's'}
        </div>
        <div class="metric-progress-track">
          <div class="metric-progress-fill" style="width: 0%;" data-value="${overallMatchRate}%"></div>
        </div>
      </div>
    `;

    // 2. Partner Schools Cards
    const partnerSchools = schools.filter(s => s.id !== ownSchoolId);
    partnerSchools.forEach(partner => {
      // Active count
      const activeCount = matches.filter(m => {
        if (!m.active && m.status !== 'Active') return false;
        const s1 = students.find(s => s.id === m.studentIds[0]);
        const s2 = students.find(s => s.id === m.studentIds[1]);
        if (!s1 || !s2) return false;
        return (s1.schoolId === ownSchoolId && s2.schoolId === partner.id) ||
               (s1.schoolId === partner.id && s2.schoolId === ownSchoolId);
      }).length;

      // Pending count
      const pendingCount = matches.filter(m => {
        if (m.active || m.status === 'Active') return false;
        return (m.proposedBySchoolId === ownSchoolId && m.pendingApprovalFromSchoolId === partner.id) ||
               (m.proposedBySchoolId === partner.id && m.pendingApprovalFromSchoolId === ownSchoolId);
      }).length;

      let statusClass = 'inactive-link';
      let statusText = 'No Connection';
      let badgeStyle = 'background: rgba(255,255,255,0.05); color: var(--text-muted);';

      if (activeCount > 0) {
        statusClass = 'active-link';
        statusText = 'Active Link';
        badgeStyle = 'background: rgba(16, 185, 129, 0.12); color: var(--success);';
      } else if (pendingCount > 0) {
        statusClass = 'pending-link';
        statusText = 'Pending Proposal';
        badgeStyle = 'background: rgba(245, 158, 11, 0.12); color: var(--warning);';
      }

      const logoHtml = partner.logoUrl 
        ? `<img src="${partner.logoUrl}" alt="${partner.name}" style="height: 24px; width: 24px; object-fit: contain; border-radius: 4px;">`
        : `<div style="height: 24px; width: 24px; border-radius: 4px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 700;">${partner.name.split(' ').map(w => w[0]).join('').substring(0, 2)}</div>`;

      html += `
        <div class="metric-card ${statusClass}" onclick="app.selectPartnerSchool('${partner.id}')" title="Click to select this partner school">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; gap: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; max-width: 140px;">
              ${logoHtml}
              <h4 style="font-family: var(--font-title); font-weight: 700; font-size: 0.95rem; margin: 0; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden;">${partner.name}</h4>
            </div>
            <div style="display: flex; align-items: center; gap: 0.35rem; margin-left: auto;">
              <span class="info-icon-btn" onclick="event.stopPropagation(); app.openSchoolDetail('${partner.id}')" title="View School Profile">ℹ️</span>
              <span style="font-size: 0.65rem; font-weight: 600; padding: 0.15rem 0.45rem; border-radius: 6px; ${badgeStyle}">${statusText}</span>
            </div>
          </div>
          <div style="font-size: 1.5rem; font-weight: 800; font-family: var(--font-title); color: ${activeCount > 0 ? 'var(--success)' : 'var(--text-secondary)'}; margin: 0.25rem 0;">
            ${activeCount} <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-secondary);">active connection${activeCount === 1 ? '' : 's'}</span>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem; font-weight: 500;">
            ${pendingCount > 0 
              ? `<span style="color: var(--warning);">⚡ ${pendingCount} pending request${pendingCount === 1 ? '' : 's'}</span>` 
              : 'No pending requests'}
          </div>
        </div>
      `;
    });

    html += `</div>`;
    summaryContainer.innerHTML = html;

    // Trigger animation helper
    setTimeout(() => {
      summaryContainer.querySelectorAll('.metric-progress-fill').forEach(fill => {
        fill.style.width = fill.getAttribute('data-value');
      });
    }, 50);
  }

  // Interactive connection: clicking a partner card selects the school and highlights it
  selectPartnerSchool(schoolId) {
    const selectEl = document.getElementById('partner-school-select');
    if (!selectEl) return;
    
    // Switch to pair tab if we are on requests tab
    this.switchMatchingSubtab('pair');
    
    // Select the school
    selectEl.value = schoolId;
    
    // Trigger the update change
    this.updateSelectedPartnerSchoolInfo();
    
    // Highlight the card
    const cardEl = document.getElementById('partner-school-info-card');
    if (cardEl) {
      cardEl.classList.remove('pulse-highlight');
      // trigger reflow to restart animation
      void cardEl.offsetWidth;
      cardEl.classList.add('pulse-highlight');
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // Create proposed match from teacher portal
  proposeMatch() {
    if (!this.selectedMatchEn) return;
    const partnerSchoolId = document.getElementById('partner-school-select').value;
    if (!partnerSchoolId) return;

    const teacher = this.getLoggedTeacher();
    const ownSchoolId = teacher ? teacher.schoolId : 'school_1';

    // Send single-student proposed match, Leicester student is first slot, Goethe is second (null)
    const proposedStudentIds = [this.selectedMatchEn, null];
    
    window.db.proposeMatch('1-to-1', proposedStudentIds, ownSchoolId, partnerSchoolId);
    alert('Match proposal submitted! The target partner school coordinator has received the anonymized details and can assign a match.');
    
    this.selectedMatchEn = null;
    this.refreshUI();
  }

  confirmProposal(matchId) {
    const assignedStudentId = this.tempAssignments[matchId];
    if (!assignedStudentId) {
      alert('Please select a student from your school to assign to this match proposal.');
      return;
    }

    const teacher = this.getLoggedTeacher();
    const teacherName = teacher ? `Teacher ${teacher.name}` : 'Teacher Mrs. Smith';

    window.db.confirmMatch(matchId, assignedStudentId, teacherName);
    delete this.tempAssignments[matchId];
    alert('Match proposal approved! The pen pal link is now active and students can message each other.');
    this.refreshUI();
  }

  declineProposal(matchId) {
    if (confirm('Are you sure you want to decline/withdraw this match suggestion?')) {
      const teacher = this.getLoggedTeacher();
      const teacherName = teacher ? `Teacher ${teacher.name}` : 'Teacher Mrs. Smith';
      window.db.declineMatch(matchId, teacherName);
      if (this.tempAssignments[matchId]) {
        delete this.tempAssignments[matchId];
      }
      this.refreshUI();
    }
  }

  openAssignStudentModal(matchId) {
    this.selectedAssignMatchId = matchId;
    this.selectedAssignStudentId = this.tempAssignments[matchId] || null;

    const matches = window.db.getMatches();
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const teacher = this.getLoggedTeacher();
    const ownSchoolId = teacher ? teacher.schoolId : 'school_1';

    const partnerStudentId = match.studentIds.find(id => id && window.db.getStudent(id)?.schoolId !== ownSchoolId);
    const partnerStudent = partnerStudentId ? window.db.getStudent(partnerStudentId) : null;
    const partnerSchoolId = match.proposedBySchoolId !== ownSchoolId ? match.proposedBySchoolId : match.pendingApprovalFromSchoolId;
    const partnerSchool = window.db.getSchool(partnerSchoolId);

    const schoolName = partnerSchool ? partnerSchool.name : 'Exchange School';
    const age = partnerStudent ? `${partnerStudent.age} y/o` : 'Unknown';
    const gender = partnerStudent ? partnerStudent.gender : 'Unknown';
    const biog = partnerStudent ? (partnerStudent.personalBiog || 'No biography text available.') : 'No details available.';

    const proposerInfo = document.getElementById('assign-proposer-info');
    if (proposerInfo) {
      proposerInfo.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
          <div style="font-size: 2.25rem;">🇩🇪</div>
          <div>
            <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">${schoolName} Student</div>
            <div style="font-size: 0.95rem; font-weight: 600; color: var(--secondary);">${age} • ${gender}</div>
          </div>
        </div>
        <div style="font-size: 0.85rem; font-style: italic; background: rgba(0,0,0,0.2); padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary); margin-top: 0.5rem; line-height: 1.4;">
          "${biog}"
        </div>
      `;
    }

    const studentsListContainer = document.getElementById('assign-students-list');
    if (studentsListContainer) {
      studentsListContainer.innerHTML = '';
      
      const allLocalStudents = window.db.getStudents().filter(s => s.schoolId === ownSchoolId);
      
      const sortedStudents = [...allLocalStudents].sort((a, b) => {
        const aUnmatched = a.matchStatus === 'unmatched';
        const bUnmatched = b.matchStatus === 'unmatched';
        if (aUnmatched && !bUnmatched) return -1;
        if (!aUnmatched && bUnmatched) return 1;
        return 0;
      });

      if (sortedStudents.length === 0) {
        studentsListContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 1rem;">No local students found.</div>`;
      } else {
        sortedStudents.forEach(s => {
          const item = document.createElement('div');
          item.className = 'assign-student-item';
          item.setAttribute('data-student-id', s.id);
          
          let statusBadge = '';
          if (s.matchStatus === 'unmatched') {
            statusBadge = `<span class="badge" style="background: rgba(40, 167, 69, 0.15); color: #28a745; border: 1px solid rgba(40, 167, 69, 0.3);">Unmatched</span>`;
          } else if (s.matchStatus === 'proposed') {
            statusBadge = `<span class="badge" style="background: rgba(255, 193, 7, 0.15); color: #ffc107; border: 1px solid rgba(255, 193, 7, 0.3);">Proposed Match</span>`;
          } else if (s.matchStatus === 'matched') {
            statusBadge = `<span class="badge" style="background: rgba(23, 162, 184, 0.15); color: #17a2b8; border: 1px solid rgba(23, 162, 184, 0.3);">Matched</span>`;
          }

          const isSelected = this.selectedAssignStudentId === s.id;
          
          item.style.display = 'flex';
          item.style.justifyContent = 'space-between';
          item.style.alignItems = 'center';
          item.style.padding = '0.75rem 1rem';
          item.style.borderRadius = '8px';
          item.style.background = isSelected ? 'rgba(var(--secondary-rgb), 0.15)' : 'rgba(255,255,255,0.03)';
          item.style.border = isSelected ? '1px solid var(--secondary)' : '1px solid var(--panel-border)';
          item.style.boxShadow = isSelected ? '0 0 8px rgba(var(--secondary-rgb), 0.3)' : 'none';
          item.style.cursor = 'pointer';
          item.style.transition = 'all 0.2s ease';

          item.onmouseenter = () => {
            if (this.selectedAssignStudentId !== s.id) {
              item.style.background = 'rgba(255,255,255,0.08)';
              item.style.borderColor = 'var(--secondary)';
            }
          };
          item.onmouseleave = () => {
            if (this.selectedAssignStudentId !== s.id) {
              item.style.background = 'rgba(255,255,255,0.03)';
              item.style.borderColor = 'var(--panel-border)';
            }
          };

          item.innerHTML = `
            <div>
              <div style="font-weight: 700; color: var(--text-primary); font-size: 1rem;">${s.name}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">${s.age} y/o • ${s.gender}</div>
            </div>
            <div>
              ${statusBadge}
            </div>
          `;

          item.onclick = () => {
            this.selectedAssignStudentId = s.id;
            
            const allItems = studentsListContainer.querySelectorAll('.assign-student-item');
            allItems.forEach(el => {
              const elId = el.getAttribute('data-student-id');
              const isItemSel = elId === s.id;
              el.style.background = isItemSel ? 'rgba(var(--secondary-rgb), 0.15)' : 'rgba(255,255,255,0.03)';
              el.style.borderColor = isItemSel ? 'var(--secondary)' : 'var(--panel-border)';
              el.style.boxShadow = isItemSel ? '0 0 8px rgba(var(--secondary-rgb), 0.3)' : 'none';
            });

            const warning = document.getElementById('assign-disclaimer-warning');
            if (warning) {
              if (s.matchStatus !== 'unmatched') {
                warning.style.display = 'block';
              } else {
                warning.style.display = 'none';
              }
            }

            const confirmBtn = document.getElementById('confirm-assign-btn');
            if (confirmBtn) {
              confirmBtn.disabled = false;
            }
          };

          studentsListContainer.appendChild(item);
        });
      }
    }

    const warning = document.getElementById('assign-disclaimer-warning');
    if (warning) {
      if (this.selectedAssignStudentId) {
        const currentStud = window.db.getStudent(this.selectedAssignStudentId);
        if (currentStud && currentStud.matchStatus !== 'unmatched') {
          warning.style.display = 'block';
        } else {
          warning.style.display = 'none';
        }
      } else {
        warning.style.display = 'none';
      }
    }

    const confirmBtn = document.getElementById('confirm-assign-btn');
    if (confirmBtn) {
      confirmBtn.disabled = !this.selectedAssignStudentId;
    }

    this.openModal('assign-student-modal');
  }

  saveStudentAssignment() {
    if (this.selectedAssignMatchId && this.selectedAssignStudentId) {
      this.tempAssignments[this.selectedAssignMatchId] = this.selectedAssignStudentId;
      this.closeModal('assign-student-modal');
      this.refreshUI();
    }
  }

  renderMatchProposals() {
    const incomingTbody = document.getElementById('incoming-proposals-tbody');
    const sentTbody = document.getElementById('sent-proposals-tbody');
    
    if (!incomingTbody || !sentTbody) return;

    const matches = window.db.getMatches().filter(m => m.status === 'Proposed');

    incomingTbody.innerHTML = '';
    sentTbody.innerHTML = '';

    let hasIncoming = false;
    let hasSent = false;
    let incomingCount = 0;

    matches.forEach(match => {
      const myStudentId = match.studentIds.find(id => id && window.db.getStudent(id)?.schoolId === 'school_1');
      const partnerStudentId = match.studentIds.find(id => id && window.db.getStudent(id)?.schoolId !== 'school_1');
      const partnerStudent = partnerStudentId ? window.db.getStudent(partnerStudentId) : null;
      const partnerSchoolId = match.proposedBySchoolId !== 'school_1' ? match.proposedBySchoolId : match.pendingApprovalFromSchoolId;
      const partnerSchool = window.db.getSchool(partnerSchoolId);

      const dateStr = match.createdAt ? new Date(match.createdAt).toLocaleDateString() : 'N/A';

      if (match.pendingApprovalFromSchoolId === 'school_1') {
        hasIncoming = true;
        incomingCount++;

        const age = partnerStudent ? `${partnerStudent.age} y/o` : 'Unknown';
        const gender = partnerStudent ? partnerStudent.gender : 'Unknown';
        const biog = partnerStudent ? (partnerStudent.personalBiog || 'No biography text available.') : 'No details available.';
        const schoolName = partnerSchool ? partnerSchool.name : 'Exchange School';

        const assignedStudentId = this.tempAssignments[match.id];
        const assignedStudent = assignedStudentId ? window.db.getStudent(assignedStudentId) : null;

        let assignHtml = '';
        if (assignedStudent) {
          assignHtml = `
            <div style="display: flex; flex-direction: column; gap: 0.2rem; min-width: 160px;">
              <span style="font-weight: 700; font-size: 0.95rem; color: var(--secondary);">${assignedStudent.name}</span>
              <span style="font-size: 0.75rem; color: var(--text-muted);">${assignedStudent.age} y/o • ${assignedStudent.gender}</span>
              <a href="#" onclick="app.openAssignStudentModal('${match.id}'); return false;" style="font-size: 0.75rem; color: var(--text-muted); text-decoration: underline; margin-top: 0.15rem; display: inline-block;">Change Student</a>
            </div>
          `;
        } else {
          assignHtml = `
            <button class="btn btn-secondary btn-small" onclick="app.openAssignStudentModal('${match.id}')" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">Select Student...</button>
          `;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
          <td onclick="app.openAssignStudentModal('${match.id}')" style="cursor: pointer;" title="Click to assign local student">
            <div style="display: flex; flex-direction: column; gap: 0.25rem;">
              <div style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">${schoolName} Student</div>
              <div style="font-size: 0.95rem; font-weight: 600; color: var(--secondary); margin-bottom: 0.25rem;">${age} • ${gender}</div>
              <div style="font-size: 0.8rem; font-style: italic; background: rgba(255,255,255,0.05); padding: 0.5rem 0.75rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); color: var(--text-secondary); line-height: 1.4;">
                "${biog}"
              </div>
            </div>
          </td>
          <td>${assignHtml}</td>
          <td>${dateStr}</td>
          <td>
            <button class="btn btn-primary btn-small" ${!assignedStudent ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} onclick="app.confirmProposal('${match.id}')">Confirm Match</button>
            <button class="btn btn-secondary btn-small" onclick="app.declineProposal('${match.id}')" style="color:var(--danger); border-color:var(--danger);">Decline</button>
          </td>
        `;
        incomingTbody.appendChild(row);
      } else if (match.proposedBySchoolId === 'school_1') {
        hasSent = true;
        const myStudent = myStudentId ? window.db.getStudent(myStudentId) : null;

        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="font-weight: 600;">${myStudent ? myStudent.name : 'Unknown'}<br><span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">${myStudent?.gender} • ${myStudent?.age} y/o</span></td>
          <td>
            <div style="font-weight: 600;">${partnerSchool ? partnerSchool.name : 'Partner School'}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Awaiting Assignment</div>
          </td>
          <td>${dateStr}</td>
          <td><span class="badge badge-warning">Awaiting Partner Approval</span></td>
          <td>
            <button class="btn btn-secondary btn-small" onclick="app.declineProposal('${match.id}')" style="color:var(--danger); border-color:var(--danger);">Withdraw Suggestion</button>
          </td>
        `;
        sentTbody.appendChild(row);
      }
    });

    if (!hasIncoming) {
      incomingTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No incoming match requests awaiting approval.</td></tr>`;
    }
    if (!hasSent) {
      sentTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No sent suggestions pending.</td></tr>`;
    }

    const badge = document.getElementById('matching-requests-badge');
    if (badge) {
      if (incomingCount > 0) {
        badge.textContent = incomingCount;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  // Handle switching sub-tabs inside matching view
  switchMatchingSubtab(subtab) {
    this.currentMatchingSubtab = subtab;
    const pairBtn = document.getElementById('subtab-pair-btn');
    const reqBtn = document.getElementById('subtab-requests-btn');
    const pairDiv = document.getElementById('matching-subtab-pair');
    const reqDiv = document.getElementById('matching-subtab-requests');

    if (!pairBtn || !reqBtn || !pairDiv || !reqDiv) return;

    if (subtab === 'pair') {
      pairBtn.classList.add('active');
      reqBtn.classList.remove('active');
      pairDiv.style.display = 'block';
      reqDiv.style.display = 'none';
    } else {
      pairBtn.classList.remove('active');
      reqBtn.classList.add('active');
      pairDiv.style.display = 'none';
      reqDiv.style.display = 'block';
    }
  }

  // Renders safeguarding control table
  renderTeacherSafeguarding() {
    const tbody = document.getElementById('safeguarding-alerts-tbody');
    const flags = window.db.getFlags();

    tbody.innerHTML = '';
    if (flags.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No safeguarding alerts logged.</td></tr>`;
      return;
    }

    // Sort: Pending flags first, then by date descending
    const sortedFlags = [...flags].sort((a, b) => {
      if (a.status === 'Pending' && b.status !== 'Pending') return -1;
      if (a.status !== 'Pending' && b.status === 'Pending') return 1;
      return new Date(b.flaggedAt) - new Date(a.flaggedAt);
    });

    sortedFlags.forEach(flag => {
      const msg = window.db.getMessages().find(m => m.id === flag.messageId);
      const sender = msg ? window.db.getStudent(msg.senderId) : null;
      const match = msg ? window.db.getMatches().find(m => m.id === msg.matchId) : null;
      
      let statusBadge = '';
      if (flag.status === 'Pending') statusBadge = '<span class="badge badge-danger">Unresolved</span>';
      else statusBadge = '<span class="badge badge-success">Resolved</span>';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${new Date(flag.flaggedAt).toLocaleString()}</td>
        <td style="font-weight: 600;">
          ${sender ? sender.name : flag.reportedBy || 'Student'}<br>
          <span style="font-size: 0.75rem; font-weight: normal; color: var(--text-muted);">Match ID: ${match ? match.id : 'N/A'}</span>
        </td>
        <td>
          <strong style="color: var(--danger); font-size: 0.8rem;">Reason: ${flag.reason || msg?.flagReason || 'Triggered Keyword alert'}</strong>
          <div style="font-size: 0.85rem; font-style: italic; background: rgba(0,0,0,0.1); padding: 0.5rem; border-radius: 6px; margin-top: 0.25rem;">
            "${msg ? msg.text : 'N/A'}"
          </div>
        </td>
        <td>${statusBadge}</td>
        <td>
          ${flag.status === 'Pending' 
            ? `<button class="btn btn-danger btn-small" onclick="app.openResolveFlagModal('${flag.id}')">Review & Take Action</button>`
            : `<div style="display: flex; flex-direction: column; gap: 0.35rem;">
                 <span style="font-size: 0.75rem; color: var(--text-muted);">Resolved by:<br>${flag.reviewedBy}<br>Action: ${flag.actionTaken}</span>
                 <button class="btn btn-secondary btn-small" style="font-size: 0.7rem; padding: 0.2rem 0.4rem;" onclick="app.openResolveFlagModal('${flag.id}')">View Details</button>
               </div>`}
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  // Opens resolution Safeguarding detail modal
  openResolveFlagModal(flagId) {
    const flag = window.db.getFlags().find(f => f.id === flagId);
    if (!flag) return;

    const msg = window.db.getMessages().find(m => m.id === flag.messageId);
    const sender = msg ? window.db.getStudent(msg.senderId) : null;
    const match = msg ? window.db.getMatches().find(m => m.id === msg.matchId) : null;
    
    // Get chat context (last 4 messages before flagged one)
    let chatContextMarkup = '';
    if (match) {
      const matchMsgs = window.db.getMessages().filter(m => m.matchId === match.id);
      const flaggedIdx = matchMsgs.findIndex(m => m.id === msg.id);
      
      const contextStart = Math.max(0, flaggedIdx - 3);
      const contextMsgs = matchMsgs.slice(contextStart, flaggedIdx + 1);

      chatContextMarkup = contextMsgs.map(m => {
        const isFlagged = m.id === msg.id;
        const senderName = window.db.getStudent(m.senderId)?.name || 'Student';
        return `
          <div style="padding: 0.5rem 0.75rem; margin-bottom: 0.5rem; border-radius: 8px; font-size: 0.85rem; 
                      background: ${isFlagged ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)'};
                      border: ${isFlagged ? '1px solid var(--danger)' : '1px solid var(--panel-border)'}">
            <strong>${senderName}:</strong> ${m.text}
            ${m.translation ? `<div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem;">📝 ${m.translation}</div>` : ''}
            <div style="font-size: 0.65rem; text-align: right; color: var(--text-muted);">${new Date(m.timestamp).toLocaleTimeString()}</div>
          </div>
        `;
      }).join('');
    }

    let actionsMarkup = '';
    if (flag.status === 'Resolved') {
      actionsMarkup = `
        <div class="panel" style="padding: 1rem; border-color: rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.02); margin-top: 0.5rem;">
          <h4 style="font-size: 0.9rem; color: var(--success); font-weight: bold; margin-bottom: 0.5rem;">✔ Safeguarding Violation Resolved</h4>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0;">
            Resolved by <strong>${flag.reviewedBy}</strong> on <strong>${new Date(flag.reviewedAt).toLocaleString()}</strong>.
          </p>
          <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.35rem;">
            Action Taken: <span class="badge badge-success" style="font-size: 0.7rem; padding: 0.15rem 0.45rem;">${flag.actionTaken}</span>
          </p>
        </div>
        <div style="display: flex; justify-content: flex-end; margin-top: 1rem;">
          <button class="btn btn-secondary" onclick="app.closeModal('resolve-flag-modal')">Close</button>
        </div>
      `;
    } else {
      actionsMarkup = `
        <div>
          <h4 style="font-size: 0.9rem; margin-bottom: 0.5rem;">Review Actions Actionable:</h4>
          <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
            <button class="btn btn-secondary" onclick="app.closeModal('resolve-flag-modal')">Close</button>
            <button class="btn btn-secondary btn-danger" onclick="app.executeFlagAction('${flag.id}', 'Archived Conversation')">Archive Chat</button>
            <button class="btn btn-primary" onclick="app.executeFlagAction('${flag.id}', 'Resumed Conversation')">Resume Chat</button>
            <button class="btn btn-secondary" style="border-color: var(--success); color: var(--success);" onclick="app.executeFlagAction('${flag.id}', 'Dismissed')">Dismiss / Safe</button>
          </div>
        </div>
      `;
    }

    const container = document.getElementById('flag-detail-content');
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div>
          <span style="font-size: 0.8rem; color: var(--text-secondary);">Reported By: <strong>${flag.reportedBy || sender?.name || 'System'}</strong></span><br>
          <span style="font-size: 0.8rem; color: var(--text-secondary);">Alert Timestamp: <strong>${new Date(flag.flaggedAt).toLocaleString()}</strong></span>
        </div>
        
        <div class="panel" style="padding: 1rem; border-color: rgba(239, 68, 68, 0.3);">
          <h4 style="font-size: 0.9rem; color: var(--danger); font-weight: bold; margin-bottom: 0.5rem;">Flagged Violation Reason:</h4>
          <p style="font-size: 0.85rem; font-weight: 500;">${flag.reason || msg?.flagReason || 'Sensitive Keyword alert'}</p>
          ${flag.details ? `<p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.5rem; background: rgba(0,0,0,0.1); padding: 0.5rem; border-radius: 6px;">Details: ${flag.details}</p>` : ''}
        </div>

        <div>
          <h4 style="font-size: 0.9rem; margin-bottom: 0.5rem;">Recent Chat History context:</h4>
          <div style="max-height: 200px; overflow-y: auto; padding-right: 0.25rem;">
            ${chatContextMarkup || '<p style="font-size: 0.8rem; color: var(--text-muted);">No chat context loaded.</p>'}
          </div>
        </div>

        <hr style="border-top: 1px solid var(--panel-border);">

        ${actionsMarkup}
      </div>
    `;

    this.openModal('resolve-flag-modal');
  }

  // Teacher submits safeguarding resolution
  executeFlagAction(flagId, action) {
    const reviewer = this.currentRole === 'admin' ? 'System Admin' : 'Teacher Mrs. Smith';
    const flag = window.db.getFlags().find(f => f.id === flagId);
    
    if (flag) {
      window.db.resolveFlag(flagId, reviewer, action);
      
      const msg = window.db.getMessages().find(m => m.id === flag.messageId);
      if (msg) {
        if (action === 'Archived Conversation') {
          window.db.deleteMatch(msg.matchId);
        }
      }

      this.closeModal('resolve-flag-modal');
      this.refreshUI();
      alert(`Safeguarding issue resolved. Action registered: ${action}`);
    }
  }

  // Renders student article editorial desk submissions
  renderTeacherEditorDesk() {
    const container = document.getElementById('editorial-desk-list');
    if (!container) return;

    const articles = window.db.getArticles();
    const students = window.db.getStudents();
    const pendingBiogs = students.filter(s => s.personalBiogStatus === 'Pending');

    // Draw main structural wrapper for Articles and Biographies
    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
        <!-- Left Column: Articles Review -->
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          <h3 style="font-size: 1.1rem; font-weight: 700; border-bottom: 1px solid var(--panel-border); padding-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            📰 Student Articles Review
          </h3>
          <div id="editor-articles-sublist" style="display: flex; flex-direction: column; gap: 1rem;">
            <!-- Loaded below -->
          </div>
        </div>

        <!-- Right Column: Biographies Review -->
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          <h3 style="font-size: 1.1rem; font-weight: 700; border-bottom: 1px solid var(--panel-border); padding-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            👤 Biography Approvals
            ${pendingBiogs.length > 0 ? `<span class="badge badge-warning" style="font-size: 0.7rem; padding: 0.15rem 0.45rem; margin-left: 0.25rem;">${pendingBiogs.length} Pending</span>` : ''}
          </h3>
          <div id="editor-biogs-sublist" style="display: flex; flex-direction: column; gap: 1rem;">
            <!-- Loaded below -->
          </div>
        </div>
      </div>
    `;

    const articlesContainer = document.getElementById('editor-articles-sublist');
    const biogsContainer = document.getElementById('editor-biogs-sublist');

    // 1. Populate Articles
    if (articles.length === 0) {
      articlesContainer.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 1.5rem;">No articles in database.</p>`;
    } else {
      // Sort: Pending first, then by date descending
      const sortedArticles = [...articles].sort((a, b) => {
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (a.status !== 'Pending' && b.status === 'Pending') return 1;
        return new Date(b.submittedAt) - new Date(a.submittedAt);
      });

      sortedArticles.forEach(art => {
        const author = window.db.getStudent(art.authorId);
        const school = window.db.getSchool(art.schoolId);

        let statusBadge = '';
        if (art.status === 'Approved') statusBadge = '<span class="badge badge-success">Approved</span>';
        else if (art.status === 'Pending') statusBadge = '<span class="badge badge-warning">Awaiting Approval</span>';
        else statusBadge = '<span class="badge badge-danger">Rejected</span>';

        const card = document.createElement('div');
        card.className = 'panel';
        card.style.background = 'rgba(255,255,255,0.01)';
        card.style.border = '1px solid var(--panel-border)';
        card.style.padding = '1.25rem';
        
        let reviewActionsRow = '';
        if (art.status === 'Pending') {
          reviewActionsRow = `
            <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--panel-border);">
              <button class="btn btn-secondary btn-small" style="color: var(--danger); border-color: var(--danger);" onclick="app.executeArticleReview('${art.id}', 'Rejected')">Reject</button>
              <button class="btn btn-primary btn-small" onclick="app.executeArticleReview('${art.id}', 'Approved')">Approve & Publish</button>
            </div>
          `;
        } else {
          reviewActionsRow = `
            <div style="font-size: 0.75rem; text-align: right; color: var(--text-muted); margin-top: 1rem; border-top: 1px dashed var(--panel-border); padding-top: 0.5rem;">
              Reviewed by: ${art.reviewedBy} on ${new Date(art.reviewedAt).toLocaleDateString()}
            </div>
          `;
        }

        const photoHtml = art.photoUrl 
          ? `<img src="${art.photoUrl}" alt="${art.title} photo" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 0.75rem;">` 
          : '';

        card.innerHTML = `
          <div class="panel-header" style="margin-bottom: 0.5rem; align-items: flex-start;">
            <div>
              <h4 style="font-weight: 700; font-size: 0.95rem; margin: 0;">${art.title}</h4>
              <span style="font-size: 0.7rem; color: var(--text-secondary);">By ${author?.name || 'Student'} • ${school?.name} (${art.language.toUpperCase()})</span>
            </div>
            <div>${statusBadge}</div>
          </div>
          ${photoHtml}
          <p style="font-size: 0.8rem; background: rgba(0,0,0,0.05); padding: 0.75rem; border-radius: 6px; line-height: 1.5; margin: 0;">
            ${art.content}
          </p>
          ${reviewActionsRow}
        `;
        articlesContainer.appendChild(card);
      });
    }

    // 2. Populate Biographies Review
    if (pendingBiogs.length === 0) {
      biogsContainer.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 1.5rem;">No student biographies awaiting review.</p>`;
    } else {
      pendingBiogs.forEach(stud => {
        const school = window.db.getSchool(stud.schoolId);

        const card = document.createElement('div');
        card.className = 'panel';
        card.style.background = 'rgba(255,255,255,0.01)';
        card.style.border = '1px solid var(--panel-border)';
        card.style.padding = '1.25rem';

        const approvedBiogHtml = stud.personalBiog 
          ? `<div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem;"><strong>Current Approved Biography:</strong><br>"${stud.personalBiog}"</div>` 
          : '';

        card.innerHTML = `
          <div class="panel-header" style="margin-bottom: 0.5rem;">
            <div>
              <h4 style="font-weight: 700; font-size: 0.95rem; margin: 0;">${stud.name}</h4>
              <span style="font-size: 0.7rem; color: var(--text-secondary);">${stud.yearGroup} • ${school ? school.name : 'Unknown School'}</span>
            </div>
            <span class="badge badge-warning">Pending Review</span>
          </div>
          <div style="background: rgba(0,0,0,0.05); padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem;">
            ${approvedBiogHtml}
            <div style="font-size: 0.8rem; line-height: 1.5; color: var(--text-primary);">
              <strong>Submitted Biography:</strong><br>
              "${stud.pendingBiog}"
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem; justify-content: flex-end; border-top: 1px solid var(--panel-border); padding-top: 0.75rem;">
            <button class="btn btn-secondary btn-small" style="color: var(--danger); border-color: var(--danger);" onclick="app.executeBiographyReview('${stud.id}', 'Rejected')">Reject</button>
            <button class="btn btn-primary btn-small" onclick="app.executeBiographyReview('${stud.id}', 'Approved')">Approve</button>
          </div>
        `;
        biogsContainer.appendChild(card);
      });
    }
  }

  // Teacher submits biography review approval/rejection
  executeBiographyReview(studentId, status) {
    const reviewer = 'Teacher Mrs. Smith';
    if (status === 'Approved') {
      window.db.approveStudentBiog(studentId, reviewer);
    } else {
      window.db.rejectStudentBiog(studentId, reviewer);
    }

    this.refreshUI();
    alert(`Biography review submitted: ${status}`);
  }

  // Teacher submits article review approval/rejection
  executeArticleReview(id, status) {
    const reviewer = 'Teacher Mrs. Smith';
    window.db.reviewArticle(id, status, reviewer);
    
    // If approved, dynamically create a news announcement to students
    if (status === 'Approved') {
      const art = window.db.getArticles().find(a => a.id === id);
      const author = window.db.getStudent(art?.authorId);
      
      window.db.addNews({
        title: `Published: ${art?.title}`,
        content: `Read a new cultural article by student ${author ? author.name : 'Exchange Pen Pal'}: "${art?.content.slice(0, 100)}..."`,
        postedBy: reviewer,
        schoolId: art?.schoolId
      });
    }

    this.refreshUI();
    alert(`Article reviewed: ${status}`);
  }

  // Load teacher settings form
  populateTeacherSettings() {
    const settings = window.db.getSettings();
    document.getElementById('flagged-words-input').value = settings.flaggedKeywords.join(', ');
    document.getElementById('attachments-toggle').checked = settings.attachmentsEnabled;

    // Populate school profile
    // Under this role Mrs. Smith is coordinator for school_1
    const schoolId = 'school_1';
    const school = window.db.getSchool(schoolId);
    if (school) {
      document.getElementById('school-desc-input').value = school.description || '';
      
      const logoSelect = document.getElementById('school-logo-select');
      logoSelect.innerHTML = '';
      
      const logoNoneOpt = document.createElement('option');
      logoNoneOpt.value = '';
      logoNoneOpt.textContent = '[None]';
      logoSelect.appendChild(logoNoneOpt);

      if (schoolId === 'school_1') {
        const opt = document.createElement('option');
        opt.value = 'assets/leicester_logo.jpg';
        opt.textContent = 'Leicester High School Logo (Crest)';
        logoSelect.appendChild(opt);
      } else if (schoolId === 'school_2') {
        const opt = document.createElement('option');
        opt.value = 'assets/goethe_logo.png';
        opt.textContent = 'Goethe-Gymnasium Logo';
        logoSelect.appendChild(opt);
      }
      logoSelect.value = school.logoUrl || '';

      const logoPreview = document.getElementById('school-logo-preview');
      logoPreview.src = school.logoUrl || '';
      logoPreview.style.display = school.logoUrl ? 'block' : 'none';

      const photoSelect = document.getElementById('school-photo-select');
      photoSelect.innerHTML = '';

      const photoNoneOpt = document.createElement('option');
      photoNoneOpt.value = '';
      photoNoneOpt.textContent = '[None]';
      photoSelect.appendChild(photoNoneOpt);

      if (schoolId === 'school_1') {
        const opt = document.createElement('option');
        opt.value = 'assets/leicester_campus.jpg';
        opt.textContent = 'Leicester High School Campus';
        photoSelect.appendChild(opt);
      } else if (schoolId === 'school_2') {
        const opt = document.createElement('option');
        opt.value = 'assets/goethe_campus.png';
        opt.textContent = 'Goethe-Gymnasium Campus';
        photoSelect.appendChild(opt);
      }
      photoSelect.value = school.photoUrl || '';

      const photoPreview = document.getElementById('school-photo-preview');
      photoPreview.src = school.photoUrl || '';
      photoPreview.style.display = school.photoUrl ? 'block' : 'none';
    }
  }

  // Save teacher configuration preferences
  saveTeacherSettings() {
    const text = document.getElementById('flagged-words-input').value;
    const attachments = document.getElementById('attachments-toggle').checked;

    const keywords = text.split(',').map(k => k.trim()).filter(k => k.length > 0);
    
    window.db.saveSettings({
      flaggedKeywords: keywords,
      attachmentsEnabled: attachments
    });

    alert('Settings updated successfully! SafeGuard configuration updated.');
    this.refreshUI();
  }

  // Save teacher's school profile description, logo, and photo
  handleSchoolProfileSubmit(e) {
    e.preventDefault();
    const description = document.getElementById('school-desc-input').value.trim();
    const logoUrl = document.getElementById('school-logo-select').value;
    const photoUrl = document.getElementById('school-photo-select').value;

    const schoolId = 'school_1'; // Mrs. Smith's school
    window.db.updateSchool(schoolId, { description, logoUrl, photoUrl });

    alert('School profile updated successfully! Matches and exchange partner students will see the updated spotlight.');
    this.refreshUI();
  }




  // ================== ADMIN PORTAL RENDERERS ==================

  renderAdminDashboard() {
    const schools = window.db.getSchools();
    const audits = window.db.getAuditLogs();
    
    // Deduplicate countries
    const countries = new Set(schools.map(s => s.country));

    document.getElementById('admin-stat-schools').textContent = schools.length;
    document.getElementById('admin-stat-countries').textContent = countries.size;
    document.getElementById('admin-stat-audits').textContent = audits.length;

    // Renders audits logs
    const tbody = document.getElementById('admin-audit-tbody');
    tbody.innerHTML = '';
    
    // Last 10 audit logs descending
    const sortedAudits = [...audits].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
    
    sortedAudits.forEach(log => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="font-size: 0.75rem; color: var(--text-muted);">${new Date(log.timestamp).toLocaleString()}</td>
        <td style="font-weight: 600;">${log.action}</td>
        <td style="font-size: 0.8rem; color: var(--text-secondary);">${log.details}</td>
        <td><span class="badge badge-info">${log.user}</span></td>
      `;
      tbody.appendChild(row);
    });

    // Populate registration requests and safeguarding hub
    this.renderAdminRequests();
    this.renderAdminSafeguarding();
  }

  // Renders admin schools directory list
  renderAdminSchools() {
    const tbody = document.getElementById('admin-schools-tbody');
    const schools = window.db.getSchools();

    tbody.innerHTML = '';
    schools.forEach(school => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="font-weight: bold; color: var(--secondary); cursor: pointer; text-decoration: underline;" onclick="app.openSchoolDetail('${school.id}')">${school.code}</td>
        <td style="font-weight: 600; cursor: pointer; text-decoration: underline;" onclick="app.openSchoolDetail('${school.id}')">${school.name}</td>
        <td>${school.country}</td>
        <td>${school.city}</td>
        <td><span class="badge badge-info">${school.language.toUpperCase()}</span></td>
        <td><span class="badge badge-success">Operational</span></td>
      `;
      tbody.appendChild(row);
    });
  }

  // Handle register school form submit
  handleAddSchool(e) {
    e.preventDefault();
    const name = document.getElementById('new-school-name').value.trim();
    const country = document.getElementById('new-school-country').value.trim();
    const city = document.getElementById('new-school-city').value.trim();
    const lang = document.getElementById('new-school-lang').value;
    const code = document.getElementById('new-school-code').value.trim().toUpperCase();

    const schools = window.db.getSchools();
    
    // Check if code exists
    if (schools.some(s => s.code === code)) {
      alert(`A school with code ${code} is already registered!`);
      return;
    }

    schools.push({
      id: 'school_' + Date.now(),
      name,
      country,
      city,
      language: lang,
      code,
      description: `${name} is a partner school in ${city}, ${country}.`,
      photoUrl: '',
      logoUrl: ''
    });

    window.db.saveTable('schools', schools);
    window.db.addLog('School Registered', `Registered new school: ${name} (${code}) in ${country}.`, 'Admin');

    this.closeModal('add-school-modal');
    document.getElementById('add-school-form').reset();
    
    alert('Partner school registered successfully! Ready to invite teachers and students.');
    
    this.refreshUI();
  }

  // Renders the onboarding schools list in the coordinator onboarding portal
  renderNewCoordinatorOnboarding() {
    const listEl = document.getElementById('onboarding-schools-list');
    const expandBtn = document.getElementById('onboarding-schools-expand-btn');
    const searchInput = document.getElementById('onboarding-school-search');
    if (!listEl) return;

    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const schools = window.db.getSchools();
    const coordinators = window.db.getCoordinators();

    listEl.innerHTML = '';

    let displaySchools = [];

    if (query) {
      displaySchools = schools.filter(school => {
        const matchesSchool = school.name.toLowerCase().includes(query) ||
                              school.city.toLowerCase().includes(query) ||
                              school.country.toLowerCase().includes(query) ||
                              school.code.toLowerCase().includes(query);
         
        const schoolCoords = coordinators.filter(c => c.schoolId === school.id);
        const matchesCoord = schoolCoords.some(c => c.name.toLowerCase().includes(query));

        return matchesSchool || matchesCoord;
      });
      
      if (expandBtn) expandBtn.style.display = 'none';
    } else {
      const recentSchools = [...schools].reverse();
      
      if (recentSchools.length > 3) {
        if (expandBtn) {
          expandBtn.style.display = 'inline-block';
          expandBtn.textContent = this.onboardingSchoolsExpanded ? 'Collapse List' : `Show All Schools (${schools.length})`;
        }
        
        displaySchools = this.onboardingSchoolsExpanded ? recentSchools : recentSchools.slice(0, 3);
      } else {
        displaySchools = recentSchools;
        if (expandBtn) expandBtn.style.display = 'none';
      }
    }

    if (displaySchools.length === 0) {
      listEl.innerHTML = `<p style="font-size: 0.75rem; color: var(--text-muted); text-align: center; padding: 1rem 0;">No matching schools found.</p>`;
      return;
    }

    displaySchools.forEach(school => {
      const schoolCoords = coordinators.filter(c => c.schoolId === school.id);
      const coordNames = schoolCoords.length > 0 ? schoolCoords.map(c => c.name).join(', ') : 'None yet';

      const item = document.createElement('div');
      item.style.padding = '0.65rem 0.5rem';
      item.style.borderBottom = '1px solid var(--panel-border)';
      item.style.fontSize = '0.75rem';
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.transition = 'background 0.2s';
      
      item.onmouseenter = () => item.style.background = 'rgba(255, 255, 255, 0.02)';
      item.onmouseleave = () => item.style.background = 'transparent';

      item.innerHTML = `
        <div>
          <strong style="color: var(--text-primary); font-size: 0.85rem;">${school.name}</strong>
          <div style="color: var(--text-muted); font-size: 0.7rem; margin-top: 0.1rem;">${school.city}, ${school.country}</div>
          <div style="color: var(--secondary); font-size: 0.65rem; font-weight: 500; margin-top: 0.15rem;">Coordinator: ${coordNames}</div>
        </div>
        <span class="badge badge-info" style="font-size: 0.65rem; padding: 0.2rem 0.4rem; border-radius: 4px; background: rgba(6, 182, 212, 0.15); color: var(--secondary); border: 1px solid rgba(6, 182, 212, 0.3); font-weight: 600;">${school.code}</span>
      `;
      listEl.appendChild(item);
    });
  }

  // Form submit handler for coordinator requesting school registration
  handleSchoolRegistrationRequest(e) {
    e.preventDefault();
    const req = {
      name: document.getElementById('req-school-name').value.trim(),
      country: document.getElementById('req-school-country').value.trim(),
      city: document.getElementById('req-school-city').value.trim(),
      language: document.getElementById('req-school-lang').value,
      code: document.getElementById('req-school-code').value.trim().toUpperCase(),
      coordinatorName: document.getElementById('req-coord-name').value.trim(),
      coordinatorEmail: document.getElementById('req-coord-email').value.trim()
    };

    const schools = window.db.getSchools();
    if (schools.some(s => s.code === req.code)) {
      alert(`A school with code ${req.code} already exists on the platform. Please check the code or contact support.`);
      return;
    }

    const requests = window.db.getSchoolRequests();
    if (requests.some(r => r.code === req.code && r.status === 'Pending')) {
      alert(`A registration request for school code ${req.code} is already pending review.`);
      return;
    }

    window.db.addSchoolRequest(req);
    document.getElementById('request-school-registration-form').reset();
    alert('Your school registration request has been submitted successfully! The System Admin will review it shortly.');
    this.refreshUI();
  }

  // Renders the school requests list in the admin dashboard
  renderAdminRequests() {
    const tbody = document.getElementById('admin-requests-tbody');
    const requests = window.db.getSchoolRequests();
    
    tbody.innerHTML = '';
    if (requests.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No registration requests found.</td></tr>';
      return;
    }

    // Sort requests: Pending first, then by date descending
    const sortedRequests = [...requests].sort((a, b) => {
      if (a.status === 'Pending' && b.status !== 'Pending') return -1;
      if (a.status !== 'Pending' && b.status === 'Pending') return 1;
      return new Date(b.requestedAt) - new Date(a.requestedAt);
    });

    sortedRequests.forEach(req => {
      const dateStr = new Date(req.requestedAt).toLocaleDateString();
      const statusBadge = req.status === 'Pending' 
        ? '<span class="badge badge-warning">Pending</span>'
        : (req.status === 'Approved' ? '<span class="badge badge-success">Approved</span>' : '<span class="badge badge-danger">Declined</span>');

      const actionsMarkup = req.status === 'Pending'
        ? `<button class="btn btn-primary btn-small" onclick="app.executeSchoolRequestAction('${req.id}', 'approve')">Approve</button>
           <button class="btn btn-secondary btn-small" style="color: var(--danger); border-color: var(--danger);" onclick="app.executeSchoolRequestAction('${req.id}', 'decline')">Decline</button>`
        : `<span style="font-size: 0.75rem; color: var(--text-muted);">${req.status}</span>`;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${dateStr}</td>
        <td style="font-weight: 600;">${req.name}<br><span style="font-size: 0.75rem; font-weight: normal; color: var(--text-muted);">${req.code}</span></td>
        <td>${req.city}, ${req.country}</td>
        <td><span class="badge badge-info">${req.language.toUpperCase()}</span></td>
        <td><strong>${req.coordinatorName}</strong><br><span style="font-size: 0.75rem; color: var(--text-muted);">${req.coordinatorEmail}</span></td>
        <td>${statusBadge}</td>
        <td>${actionsMarkup}</td>
      `;
      tbody.appendChild(row);
    });
  }

  // Handler to approve/decline school registration request
  executeSchoolRequestAction(requestId, action) {
    const reviewer = 'System Admin';
    if (action === 'approve') {
      const newSchool = window.db.approveSchoolRequest(requestId, reviewer);
      if (newSchool) {
        alert(`School Registration Approved! ${newSchool.name} is now registered. The requesting coordinator has been granted School Admin rights.`);
      }
    } else if (action === 'decline') {
      window.db.declineSchoolRequest(requestId, reviewer);
      alert('School Registration Request declined.');
    }
    this.refreshUI();
  }

  // Renders global safeguarding alerts in the admin dashboard
  renderAdminSafeguarding() {
    const tbody = document.getElementById('admin-safeguarding-tbody');
    const flags = window.db.getFlags();

    tbody.innerHTML = '';
    if (flags.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No safeguarding alerts logged.</td></tr>`;
      return;
    }

    // Sort: Pending flags first, then by date descending
    const sortedFlags = [...flags].sort((a, b) => {
      if (a.status === 'Pending' && b.status !== 'Pending') return -1;
      if (a.status !== 'Pending' && b.status === 'Pending') return 1;
      return new Date(b.flaggedAt) - new Date(a.flaggedAt);
    });

    sortedFlags.forEach(flag => {
      const msg = window.db.getMessages().find(m => m.id === flag.messageId);
      const sender = msg ? window.db.getStudent(msg.senderId) : null;
      const school = sender ? window.db.getSchool(sender.schoolId) : null;
      
      let statusBadge = '';
      if (flag.status === 'Pending') statusBadge = '<span class="badge badge-danger">Unresolved</span>';
      else statusBadge = '<span class="badge badge-success">Resolved</span>';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${new Date(flag.flaggedAt).toLocaleString()}</td>
        <td style="font-weight: 600;">
          ${school ? school.name : 'Unknown School'}<br>
          <span style="font-size: 0.75rem; font-weight: normal; color: var(--text-muted);">Sender: ${sender ? sender.name : 'Unknown'}</span>
        </td>
        <td>
          <strong style="color: var(--danger); font-size: 0.8rem;">Reason: ${flag.reason || msg?.flagReason || 'Triggered Keyword alert'}</strong>
          <div style="font-size: 0.85rem; font-style: italic; background: rgba(0,0,0,0.1); padding: 0.5rem; border-radius: 6px; margin-top: 0.25rem;">
            "${msg ? msg.text : 'N/A'}"
          </div>
        </td>
        <td>${statusBadge}</td>
        <td>
          ${flag.status === 'Pending' 
            ? `<button class="btn btn-danger btn-small" onclick="app.openResolveFlagModal('${flag.id}')">Review & Take Action</button>`
            : `<div style="display: flex; flex-direction: column; gap: 0.35rem;">
                 <span style="font-size: 0.75rem; color: var(--text-muted);">Resolved by:<br>${flag.reviewedBy}<br>Action: ${flag.actionTaken}</span>
                 <button class="btn btn-secondary btn-small" style="font-size: 0.7rem; padding: 0.2rem 0.4rem;" onclick="app.openResolveFlagModal('${flag.id}')">View Details</button>
               </div>`}
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  // Opens detailed modal showing logo, campus photo, biography, registered coordinators (with admin rights toggling), and student roster
  openSchoolDetail(schoolId) {
    const school = window.db.getSchool(schoolId);
    if (!school) return;

    const students = window.db.getStudents().filter(s => s.schoolId === schoolId);
    const schoolCoords = window.db.getCoordinators().filter(c => c.schoolId === schoolId);
    
    const logoHtml = school.logoUrl 
      ? `<img src="${school.logoUrl}" alt="${school.name} logo" style="max-height: 50px; border-radius: 6px;">` 
      : '';
    const photoHtml = school.photoUrl 
      ? `<img src="${school.photoUrl}" alt="${school.name} campus" style="width: 100%; height: 160px; object-fit: cover; border-radius: 12px; margin-bottom: 0.5rem;">` 
      : '<div style="height: 160px; background: rgba(0,0,0,0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.85rem; border: 1px dashed var(--panel-border);">No campus photograph added</div>';

    // Renders coordinators/staff list with toggle controls
    let coordinatorsHtml = '';
    if (schoolCoords.length === 0) {
      coordinatorsHtml = '<p style="font-size: 0.8rem; color: var(--text-muted); font-style: italic; padding: 0.5rem 0;">No coordinators registered for this school.</p>';
    } else {
      coordinatorsHtml = `
        <div class="table-container" style="max-height: 150px; overflow-y: auto; margin-top: 0.5rem; border: 1px solid var(--panel-border); border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
            <thead>
              <tr style="background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--panel-border);">
                <th style="padding: 0.5rem; text-align: left;">Name</th>
                <th style="padding: 0.5rem; text-align: left;">Email</th>
                <th style="padding: 0.5rem; text-align: left;">Status</th>
                <th style="padding: 0.5rem; text-align: left;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${schoolCoords.map(c => {
                const adminBadge = c.isSchoolAdmin 
                  ? '<span class="badge badge-success" style="font-size: 0.65rem; padding: 0.15rem 0.45rem;">Admin</span>' 
                  : '<span class="badge badge-secondary" style="font-size: 0.65rem; padding: 0.15rem 0.45rem;">Staff</span>';
                
                const isSystemAdmin = this.currentRole === 'admin';
                const isOwnSchoolTeacher = this.currentRole === 'teacher' && schoolId === 'school_1';
                
                let actionsHtml = '';
                if (isSystemAdmin || isOwnSchoolTeacher) {
                  const btnLabel = c.isSchoolAdmin ? 'Revoke Admin' : 'Grant Admin';
                  const btnClass = c.isSchoolAdmin ? 'btn-secondary' : 'btn-primary';
                  actionsHtml = `<button class="btn ${btnClass} btn-small" style="font-size: 0.65rem; padding: 0.2rem 0.5rem;" onclick="app.toggleCoordinatorAdminInsideModal('${c.id}', '${schoolId}')">${btnLabel}</button>`;
                } else if (this.currentRole === 'teacher' && schoolId !== 'school_1') {
                  actionsHtml = `<button class="btn btn-primary btn-small" style="font-size: 0.65rem; padding: 0.2rem 0.5rem;" onclick="app.startCoordinatorChat('${c.id}')">💬 Message</button>`;
                }
                
                return `
                  <tr style="border-bottom: 1px solid var(--panel-border);">
                    <td style="padding: 0.5rem; font-weight: 600;">${c.name}</td>
                    <td style="padding: 0.5rem; color: var(--text-secondary);">${c.email}</td>
                    <td style="padding: 0.5rem;">${adminBadge}</td>
                    <td style="padding: 0.5rem;">
                      ${actionsHtml}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    let rosterHtml = '';
    if (students.length === 0) {
      rosterHtml = '<p style="font-size: 0.8rem; color: var(--text-muted); font-style: italic; padding: 0.5rem 0;">No students registered for this school.</p>';
    } else {
      rosterHtml = `
        <div class="table-container" style="max-height: 150px; overflow-y: auto; margin-top: 0.5rem; border: 1px solid var(--panel-border); border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
            <thead>
              <tr style="background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--panel-border);">
                <th style="padding: 0.5rem; text-align: left;">Name</th>
                <th style="padding: 0.5rem; text-align: left;">Email</th>
                <th style="padding: 0.5rem; text-align: left;">Age/Year</th>
                <th style="padding: 0.5rem; text-align: left;">Match Status</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(s => {
                const badgeClass = s.matchStatus === 'matched' ? 'badge-success' : (s.matchStatus === 'proposed' ? 'badge-warning' : 'badge-secondary');
                return `
                  <tr style="border-bottom: 1px solid var(--panel-border);">
                    <td style="padding: 0.5rem; font-weight: 600;">${s.name}</td>
                    <td style="padding: 0.5rem; color: var(--text-secondary);">${s.email}</td>
                    <td style="padding: 0.5rem;">Age ${s.age} (${s.yearGroup})</td>
                    <td style="padding: 0.5rem;"><span class="badge ${badgeClass}">${s.matchStatus}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    let coordinatorsSection = '';
    let rosterSection = '';
    if (this.currentRole !== 'student') {
      coordinatorsSection = `
        <div style="margin-top: 0.5rem; border-top: 1px dashed var(--panel-border); padding-top: 0.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <h5 style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin: 0;">Registered Coordinators (${schoolCoords.length})</h5>
            <button class="btn btn-secondary btn-small" onclick="document.getElementById('add-modal-coord-form-container').style.display = 'block'">+ Add Coordinator</button>
          </div>
          
          <!-- Add Coordinator Form (Hidden by default) -->
          <div id="add-modal-coord-form-container" style="display: none; background: rgba(0,0,0,0.15); padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem; border: 1px solid var(--panel-border);">
            <form onsubmit="app.addCoordinatorToSchool(event, '${school.id}')">
              <h6 style="font-size: 0.8rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--text-primary);">Add Coordinator Info</h6>
              <div class="form-group" style="margin-bottom: 0.5rem;">
                <input type="text" id="new-modal-coord-name" class="form-control" style="font-size: 0.75rem; padding: 0.35rem 0.65rem;" placeholder="Full Name" required>
              </div>
              <div class="form-group" style="margin-bottom: 0.5rem;">
                <input type="email" id="new-modal-coord-email" class="form-control" style="font-size: 0.75rem; padding: 0.35rem 0.65rem;" placeholder="Email Address" required>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                <label style="font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem;">
                  <input type="checkbox" id="new-modal-coord-admin"> Grant School Admin Rights
                </label>
                <div style="display: flex; gap: 0.5rem;">
                  <button type="button" class="btn btn-secondary btn-small" onclick="document.getElementById('add-modal-coord-form-container').style.display = 'none'">Cancel</button>
                  <button type="submit" class="btn btn-primary btn-small">Add</button>
                </div>
              </div>
            </form>
          </div>
          
          ${coordinatorsHtml}
        </div>
      `;

      const isSystemAdmin = this.currentRole === 'admin';
      const isOwnSchoolTeacher = this.currentRole === 'teacher' && schoolId === 'school_1';

      if (isSystemAdmin || isOwnSchoolTeacher) {
        rosterSection = `
          <div style="margin-top: 0.5rem; border-top: 1px dashed var(--panel-border); padding-top: 0.75rem;">
            <h5 style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem;">Student List (${students.length} Students)</h5>
            ${rosterHtml}
          </div>
        `;
      }
    }

    const container = document.getElementById('school-detail-content');
    container.innerHTML = `
      ${photoHtml}
      <div style="display: flex; align-items: center; gap: 1rem;">
        ${logoHtml}
        <div>
          <h4 style="font-weight: 700; font-size: 1.25rem; margin: 0; color: var(--text-primary);">${school.name}</h4>
          <span style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 500;">
            📍 ${school.city}, ${school.country} • Code: <strong style="color: var(--secondary);">${school.code}</strong>
          </span>
        </div>
      </div>

      <div class="panel" style="padding: 1rem; background: rgba(255,255,255,0.01); border-color: var(--panel-border); margin-top: 0.5rem;">
        <h5 style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">School Biography</h5>
        <p style="font-size: 0.85rem; line-height: 1.5; color: var(--text-secondary); margin: 0; text-align: justify;">
          ${school.description || 'No school description provided yet.'}
        </p>
      </div>

      ${coordinatorsSection}
      ${rosterSection}

      <div style="display: flex; justify-content: flex-end; margin-top: 1rem; border-top: 1px solid var(--panel-border); padding-top: 1rem;">
        <button class="btn btn-secondary" onclick="app.closeModal('school-detail-modal')">Close Details</button>
      </div>
    `;

    this.openModal('school-detail-modal');
  }

  // Opens the active partner's school details modal from the chat view
  openPartnerSchoolDetail() {
    const match = window.db.getMatches().find(m => m.id === this.activeMatchId);
    if (!match) return;
    const partnerId = match.studentIds.find(id => id !== this.currentStudentId);
    const partner = window.db.getStudent(partnerId);
    if (partner && partner.schoolId) {
      this.openSchoolDetail(partner.schoolId);
    }
  }

  // Opens the active partner's student details modal from the chat view
  openPartnerStudentDetail() {
    const match = window.db.getMatches().find(m => m.id === this.activeMatchId);
    if (!match) return;
    const partnerId = match.studentIds.find(id => id !== this.currentStudentId);
    if (partnerId) {
      this.openStudentDetailModal(partnerId);
    }
  }

  // Opens detailed student profile modal
  openStudentDetailModal(studentId) {
    const student = window.db.getStudent(studentId);
    if (!student) return;
    const school = window.db.getSchool(student.schoolId);
    
    const initials = student.name.split(' ').map(n => n[0]).join('');
    const biogToShow = student.personalBiogStatus === 'Approved' && student.personalBiog
      ? student.personalBiog
      : '<em>No biography shared yet.</em>';

    const container = document.getElementById('student-profile-content');
    if (!container) return;

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem; text-align: center; margin-top: 0.5rem;">
        <div class="user-avatar" style="width: 72px; height: 72px; font-size: 1.8rem; background: linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%);">
          ${initials}
        </div>
        <div>
          <h4 style="font-weight: 700; font-size: 1.35rem; margin: 0; color: var(--text-primary);">${student.name}</h4>
          <span class="badge badge-info" style="margin-top: 0.35rem;">Age ${student.age} • ${student.yearGroup}</span>
        </div>
      </div>

      <div class="panel" style="padding: 1rem; background: rgba(255,255,255,0.01); border-color: var(--panel-border);">
        <h5 style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">School Connection</h5>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="font-size: 1.5rem;">🏫</div>
          <div style="text-align: left;">
            <h6 style="margin: 0; font-size: 0.9rem; font-weight: 700;">
              <span class="clickable-school-link" style="text-decoration: underline; color: var(--secondary); cursor: pointer;" onclick="app.openSchoolDetailFromStudentModal('${student.schoolId}')">
                ${school ? school.name : 'Unknown School'}
              </span>
            </h6>
            <span style="font-size: 0.75rem; color: var(--text-secondary);">${school ? `${school.city}, ${school.country}` : ''}</span>
          </div>
        </div>
      </div>

      <div class="panel" style="padding: 1rem; background: rgba(255,255,255,0.01); border-color: var(--panel-border);">
        <h5 style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Personal Biography</h5>
        <p style="font-size: 0.85rem; line-height: 1.5; color: var(--text-secondary); margin: 0; text-align: justify; font-style: ${student.personalBiog ? 'normal' : 'italic'};">
          ${biogToShow}
        </p>
      </div>

      <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem; border-top: 1px solid var(--panel-border); padding-top: 1rem;">
        <button class="btn btn-secondary" onclick="app.closeModal('student-profile-modal')">Close Profile</button>
      </div>
    `;

    this.openModal('student-profile-modal');
  }

  // Opens school detail modal but closes student profile first to prevent overlay stack locks
  openSchoolDetailFromStudentModal(schoolId) {
    this.closeModal('student-profile-modal');
    setTimeout(() => {
      this.openSchoolDetail(schoolId);
    }, 150);
  }

  // Opens detailed student article modal
  openStudentArticleDetail(articleId) {
    const art = window.db.getArticles().find(a => a.id === articleId);
    if (!art) return;
    const author = window.db.getStudent(art.authorId);
    const school = window.db.getSchool(art.schoolId);

    const container = document.getElementById('article-detail-content');
    if (!container) return;

    let statusBadge = '';
    if (art.status === 'Approved') statusBadge = '<span class="badge badge-success">Approved</span>';
    else if (art.status === 'Pending') statusBadge = '<span class="badge badge-warning">Pending Review</span>';
    else statusBadge = '<span class="badge badge-danger">Rejected</span>';

    const photoHtml = art.photoUrl
      ? `<img src="${art.photoUrl}" alt="${art.title} photo" style="width: 100%; height: 200px; object-fit: cover; border-radius: 12px; margin-bottom: 0.5rem;">`
      : '';

    container.innerHTML = `
      ${photoHtml}
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
        <div>
          <h4 style="font-weight: 700; font-size: 1.25rem; margin: 0; color: var(--text-primary);">${art.title}</h4>
          <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 500;">
            By ${author ? author.name : 'Unknown Author'} • ${school ? school.name : 'Unknown School'} (${art.language.toUpperCase()})
          </span>
        </div>
        <div>${statusBadge}</div>
      </div>

      <div class="panel" style="padding: 1rem; background: rgba(255,255,255,0.01); border-color: var(--panel-border); margin-top: 0.5rem;">
        <p style="font-size: 0.9rem; line-height: 1.6; color: var(--text-secondary); margin: 0; text-align: justify; white-space: pre-wrap;">
          ${art.content}
        </p>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; border-top: 1px solid var(--panel-border); padding-top: 1rem;">
        <span style="font-size: 0.75rem; color: var(--text-muted);">Submitted on: ${new Date(art.submittedAt).toLocaleDateString()}</span>
        <button class="btn btn-secondary" onclick="app.closeModal('article-detail-modal')">Close Details</button>
      </div>
    `;

    this.openModal('article-detail-modal');
  }

  // Toggles admin status for coordinator from within the detail modal and keeps the modal open
  toggleCoordinatorAdminInsideModal(coordinatorId, schoolId) {
    const reviewer = 'System Admin';
    window.db.toggleCoordinatorAdmin(coordinatorId, reviewer);
    this.refreshUI();
    this.openSchoolDetail(schoolId);
  }

  // Adds a coordinator directly to a school from within the detail modal
  addCoordinatorToSchool(e, schoolId) {
    e.preventDefault();
    const name = document.getElementById('new-modal-coord-name').value.trim();
    const email = document.getElementById('new-modal-coord-email').value.trim();
    const isSchoolAdmin = document.getElementById('new-modal-coord-admin').checked;

    if (!name || !email) {
      alert('Please fill out all fields.');
      return;
    }

    const coordinators = window.db.getCoordinators();
    if (coordinators.some(c => c.email === email)) {
      alert('A coordinator with this email address is already registered on the platform.');
      return;
    }

    const newCoord = {
      id: 'coord_' + Date.now(),
      name,
      email,
      schoolId,
      isSchoolAdmin
    };

    coordinators.push(newCoord);
    window.db.saveTable('coordinators', coordinators);
    window.db.addLog('Coordinator Added', `Added coordinator ${name} (${email}) to school ${window.db.getSchool(schoolId)?.name}.`, 'System Admin');

    alert(`Coordinator ${name} added successfully!`);
    this.refreshUI();
    this.openSchoolDetail(schoolId);
  }

  // Toggles between the list of articles and the submission form on the My Articles page
  showArticleForm(show) {
    const listView = document.getElementById('articles-list-view');
    const formView = document.getElementById('articles-form-view');
    if (listView && formView) {
      if (show) {
        listView.style.display = 'none';
        formView.style.display = 'block';
      } else {
        listView.style.display = 'block';
        formView.style.display = 'none';
      }
    }
  }

  // Toggles collapsing/expanding the Writing Assistant panel below chat
  toggleLanguageAssistant() {
    const panel = document.getElementById('student-language-widget-panel');
    const btn = document.getElementById('toggle-assistant-btn');
    if (panel.style.display === 'none' || !panel.style.display) {
      panel.style.display = 'block';
      btn.classList.add('active');
      panel.scrollIntoView({ behavior: 'smooth' });
    } else {
      panel.style.display = 'none';
      btn.classList.remove('active');
    }
  }

  // ================== CORE UTILITY HELPERS ==================

  // Modal Open/Close helpers
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  }

  // ================== COORDINATOR CHAT PORTAL HELPERS ==================

  startCoordinatorChat(coordinatorId) {
    this.activeCoordinatorId = coordinatorId;
    this.closeModal('school-detail-modal');
    setTimeout(() => {
      this.switchTab('teach-messages');
    }, 150);
  }

  renderTeacherMessages() {
    const teacher = this.getLoggedTeacher();
    const myId = teacher ? teacher.id : 'coord_1';
    const coordinators = window.db.getCoordinators();
    const otherCoordinators = coordinators.filter(c => c.id !== myId);
    
    const chatListContainer = document.getElementById('teacher-chat-list');
    const chatEmptyState = document.getElementById('teacher-chat-empty-state');
    const chatActiveState = document.getElementById('teacher-chat-active-state');

    if (!chatListContainer || !chatEmptyState || !chatActiveState) return;

    chatListContainer.innerHTML = '';
    
    if (otherCoordinators.length === 0) {
      chatListContainer.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted); padding: 1rem; text-align: center;">No other coordinators found.</p>`;
      chatEmptyState.style.display = 'flex';
      chatActiveState.style.display = 'none';
      return;
    }

    // Set first partner as default if none active
    if (!this.activeCoordinatorId) {
      this.activeCoordinatorId = otherCoordinators[0].id;
    }

    otherCoordinators.forEach(coord => {
      const msgs = window.db.getCoordinatorMessages().filter(m => 
        (m.senderId === myId && m.receiverId === coord.id) || 
        (m.senderId === coord.id && m.receiverId === myId)
      );
      const lastMsg = msgs[msgs.length - 1];
      const school = window.db.getSchool(coord.schoolId);

      const item = document.createElement('div');
      item.className = `chat-item ${this.activeCoordinatorId === coord.id ? 'active' : ''}`;
      
      item.innerHTML = `
        <div class="user-avatar" style="width: 32px; height: 32px; font-size: 0.8rem; background: var(--accent);">
          ${coord.name.split(' ').map(n => n[0]).join('') || '?'}
        </div>
        <div class="chat-item-meta">
          <div class="chat-item-name">
            <span>${coord.name} (${school?.code || 'Staff'})</span>
          </div>
          <div class="chat-item-preview">${lastMsg ? lastMsg.text : 'Start chatting...'}</div>
        </div>
      `;

      item.addEventListener('click', () => {
        this.activeCoordinatorId = coord.id;
        this.renderTeacherMessages();
      });

      chatListContainer.appendChild(item);
    });

    const activeCoord = coordinators.find(c => c.id === this.activeCoordinatorId);
    if (activeCoord) {
      chatEmptyState.style.display = 'none';
      chatActiveState.style.display = 'flex';

      const partnerSchool = window.db.getSchool(activeCoord.schoolId);
      document.getElementById('teacher-chat-partner-avatar').textContent = activeCoord.name.split(' ').map(n => n[0]).join('') || '?';
      document.getElementById('teacher-chat-partner-name').textContent = activeCoord.name;
      document.getElementById('teacher-chat-partner-school').textContent = `${partnerSchool?.name} • ${partnerSchool?.country}`;

      // Render feed
      const feed = document.getElementById('teacher-chat-message-feed');
      feed.innerHTML = '';
      
      const msgs = window.db.getCoordinatorMessages().filter(m => 
        (m.senderId === myId && m.receiverId === activeCoord.id) || 
        (m.senderId === activeCoord.id && m.receiverId === myId)
      );

      msgs.forEach(msg => {
        const row = document.createElement('div');
        const isSent = msg.senderId === myId;
        row.className = `message-row ${isSent ? 'sent' : 'received'}`;
        
        row.innerHTML = `
          <div class="message-bubble">
            <div>${msg.text}</div>
          </div>
          <div class="message-meta">
            ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        `;
        feed.appendChild(row);
      });

      feed.scrollTop = feed.scrollHeight;
    }
  }

  sendTeacherMessage() {
    const textarea = document.getElementById('teacher-chat-textarea');
    if (!textarea || !textarea.value.trim() || !this.activeCoordinatorId) return;

    const teacher = this.getLoggedTeacher();
    const myId = teacher ? teacher.id : 'coord_1';
    const text = textarea.value.trim();

    window.db.addCoordinatorMessage(myId, this.activeCoordinatorId, text);
    textarea.value = '';
    this.renderTeacherMessages();
  }

  // ================== SHARED PROJECTS FEATURE METHODS ==================

  renderStudentProjects() {
    const student = window.db.getStudent(this.currentStudentId);
    if (!student) return;

    const chatListContainer = document.getElementById('student-project-list');
    const projectEmptyState = document.getElementById('project-empty-state');
    const projectActiveState = document.getElementById('project-active-state');

    if (!chatListContainer || !projectEmptyState || !projectActiveState) return;

    chatListContainer.innerHTML = '';

    const projects = window.db.getProjects().filter(p => 
      p.creatorSchoolStudentIds.includes(student.id) || 
      p.targetSchoolStudentIds.includes(student.id)
    );

    if (projects.length === 0) {
      chatListContainer.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted); padding: 1rem; text-align: center;">No projects found.</p>`;
      projectEmptyState.style.display = 'flex';
      projectActiveState.style.display = 'none';
      return;
    }

    // Set first project as default if none active or active not in list
    if (!this.activeProjectId || !projects.some(p => p.id === this.activeProjectId)) {
      this.activeProjectId = projects[0].id;
    }

    projects.forEach(project => {
      const messages = window.db.getProjectMessages().filter(m => m.projectId === project.id);
      const lastMsg = messages[messages.length - 1];

      const item = document.createElement('div');
      item.className = `chat-item ${this.activeProjectId === project.id ? 'active' : ''}`;

      let statusText = project.status;
      let badgeClass = 'badge-info';
      if (project.status === 'Published') {
        badgeClass = 'badge-success';
      } else if (project.status === 'PendingPublish' || project.status === 'Proposed') {
        badgeClass = 'badge-warning';
      }

      const badgeStatus = `<span class="badge ${badgeClass}" style="font-size: 0.6rem; padding: 0.1rem 0.35rem;">${statusText}</span>`;

      item.innerHTML = `
        <div class="user-avatar" style="width: 32px; height: 32px; font-size: 0.8rem; background: var(--accent); display: flex; align-items: center; justify-content: center;">
          📁
        </div>
        <div class="chat-item-meta">
          <div class="chat-item-name">
            <span>${project.title}</span>
            ${badgeStatus}
          </div>
          <div class="chat-item-preview">${lastMsg ? lastMsg.text : 'Start collaborating...'}</div>
        </div>
      `;

      item.addEventListener('click', () => {
        this.activeProjectId = project.id;
        // Load current photo URL to state when switching projects
        this.currentProjArticlePhotoDataUrl = project.articlePhotoUrl || '';
        // Reset input value to avoid leftover state
        const projArtPhotoInput = document.getElementById('proj-art-photo-input');
        if (projArtPhotoInput) projArtPhotoInput.value = '';
        this.renderStudentProjects();
        this.switchProjectSubtab('article');
      });

      chatListContainer.appendChild(item);
    });

    const activeProject = projects.find(p => p.id === this.activeProjectId);
    if (activeProject) {
      projectEmptyState.style.display = 'none';
      projectActiveState.style.display = 'flex';

      // Set Title
      document.getElementById('project-title').textContent = activeProject.title;

      // Resolve schools & members
      const creatorSchool = window.db.getSchool(activeProject.creatorSchoolId);
      const targetSchool = window.db.getSchool(activeProject.targetSchoolId);
      const schoolText = `${creatorSchool?.code || 'School 1'} & ${targetSchool?.code || 'School 2'}`;

      // Get member names
      const allStudentIds = [...activeProject.creatorSchoolStudentIds, ...activeProject.targetSchoolStudentIds];
      const memberNames = allStudentIds.map(sid => {
        const s = window.db.getStudent(sid);
        return s ? s.name : 'Unknown';
      }).join(', ');

      document.getElementById('project-meta').textContent = `${schoolText} • ${memberNames}`;

      // Status badge
      const badgeEl = document.getElementById('project-status-badge');
      badgeEl.textContent = activeProject.status;
      badgeEl.className = 'badge';
      if (activeProject.status === 'Published') {
        badgeEl.classList.add('badge-success');
      } else if (activeProject.status === 'PendingPublish' || activeProject.status === 'Proposed') {
        badgeEl.classList.add('badge-warning');
      } else {
        badgeEl.classList.add('badge-info');
      }

      // Brief
      document.getElementById('project-brief-text').textContent = activeProject.brief;

      // Article Title & Content
      const titleInput = document.getElementById('proj-art-title');
      const contentInput = document.getElementById('proj-art-content');
      const photoInput = document.getElementById('proj-art-photo-input');
      const saveBtn = document.getElementById('proj-art-save-btn');
      const publishBtn = document.getElementById('proj-art-publish-btn');
      const lastUpdatedEl = document.getElementById('proj-article-last-updated');

      if (titleInput && contentInput) {
        titleInput.value = activeProject.articleTitle || '';
        contentInput.value = activeProject.articleContent || '';

        const isReadOnly = activeProject.status === 'Published' || activeProject.status === 'PendingPublish';
        titleInput.readOnly = isReadOnly;
        contentInput.readOnly = isReadOnly;
        if (photoInput) photoInput.disabled = isReadOnly;
        if (saveBtn) saveBtn.disabled = isReadOnly;
        if (publishBtn) publishBtn.disabled = isReadOnly;

        if (isReadOnly) {
          if (saveBtn) saveBtn.style.opacity = '0.5';
          if (publishBtn) publishBtn.style.opacity = '0.5';
        } else {
          if (saveBtn) saveBtn.style.opacity = '1';
          if (publishBtn) publishBtn.style.opacity = '1';
        }
      }

      // Image preview
      const previewEl = document.getElementById('proj-article-photo-preview');
      const placeholderEl = document.getElementById('proj-article-photo-placeholder');
      if (previewEl && placeholderEl) {
        if (this.currentProjArticlePhotoDataUrl) {
          previewEl.src = this.currentProjArticlePhotoDataUrl;
          previewEl.style.display = 'block';
          placeholderEl.style.display = 'none';
        } else {
          previewEl.src = '';
          previewEl.style.display = 'none';
          placeholderEl.style.display = 'block';
        }
      }

      // Last updated info
      if (lastUpdatedEl) {
        if (activeProject.articleLastUpdatedAt) {
          const timeStr = new Date(activeProject.articleLastUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const dateStr = new Date(activeProject.articleLastUpdatedAt).toLocaleDateString();
          lastUpdatedEl.textContent = `Last updated by ${activeProject.articleLastUpdatedBy || 'system'} on ${dateStr} at ${timeStr}`;
        } else {
          lastUpdatedEl.textContent = 'Last updated: Not saved yet';
        }
      }

      // Chat Feed
      const feed = document.getElementById('proj-chat-message-feed');
      if (feed) {
        feed.innerHTML = '';
        const chatMsgs = window.db.getProjectMessages().filter(m => m.projectId === activeProject.id);

        chatMsgs.forEach(msg => {
          const row = document.createElement('div');
          const isSent = msg.senderId === student.id;
          row.className = `message-row ${isSent ? 'sent' : 'received'}`;

          let senderHeader = '';
          if (!isSent) {
            senderHeader = `<div class="message-sender" style="font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 0.2rem; font-weight: 600;">${msg.senderName}</div>`;
          }

          row.innerHTML = `
            ${senderHeader}
            <div class="message-bubble">
              <div>${msg.text}</div>
            </div>
            <div class="message-meta">
              ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          `;
          feed.appendChild(row);
        });

        feed.scrollTop = feed.scrollHeight;
      }

      // Keep current subtab active or default to article
      const activeSubtabBtn = document.querySelector('.project-subtab-nav .subtab-pill.active');
      const activeId = activeSubtabBtn ? activeSubtabBtn.id.replace('proj-subtab-', '') : 'article';
      this.switchProjectSubtab(activeId);
    }
  }

  saveProjectArticleDraft() {
    if (!this.activeProjectId) return;
    const project = window.db.getProject(this.activeProjectId);
    if (!project) return;

    const student = window.db.getStudent(this.currentStudentId);
    const titleInput = document.getElementById('proj-art-title');
    const contentInput = document.getElementById('proj-art-content');

    if (!titleInput || !contentInput) return;

    const updates = {
      articleTitle: titleInput.value.trim(),
      articleContent: contentInput.value.trim(),
      articlePhotoUrl: this.currentProjArticlePhotoDataUrl || '',
      articleLastUpdatedBy: student ? student.name : 'Student',
      articleLastUpdatedAt: new Date().toISOString()
    };

    window.db.updateProject(this.activeProjectId, updates);
    alert('Draft saved successfully!');
    this.renderStudentProjects();
  }

  publishProject() {
    if (!this.activeProjectId) return;
    const project = window.db.getProject(this.activeProjectId);
    if (!project) return;

    const titleInput = document.getElementById('proj-art-title');
    const contentInput = document.getElementById('proj-art-content');

    if (!titleInput || !contentInput) return;

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title || !content) {
      alert('Please write an article title and content before publishing.');
      return;
    }

    if (!confirm('Are you sure you want to publish this project? This will lock editing and submit it to both school coordinators for authorization.')) {
      return;
    }

    const student = window.db.getStudent(this.currentStudentId);
    const updates = {
      articleTitle: title,
      articleContent: content,
      articlePhotoUrl: this.currentProjArticlePhotoDataUrl || '',
      articleLastUpdatedBy: student ? student.name : 'Student',
      articleLastUpdatedAt: new Date().toISOString(),
      status: 'PendingPublish',
      creatorSchoolApproved: false,
      targetSchoolApproved: false
    };

    window.db.updateProject(this.activeProjectId, updates);

    // Add a system log message in the group chat
    window.db.addProjectMessage(
      this.activeProjectId,
      'system',
      'System',
      `${student ? student.name : 'A student'} submitted the project presentation for coordinator authorization.`
    );

    alert('Project submitted for authorization! Coordinators from both schools must approve before publication.');
    this.renderStudentProjects();
  }

  sendProjectChatMessage() {
    if (!this.activeProjectId) return;
    const textarea = document.getElementById('proj-chat-textarea');
    if (!textarea || !textarea.value.trim()) return;

    const student = window.db.getStudent(this.currentStudentId);
    if (!student) return;

    const text = textarea.value.trim();
    window.db.addProjectMessage(this.activeProjectId, student.id, student.name, text);
    textarea.value = '';
    this.renderStudentProjects();
  }

  renderTeacherProjects() {
    const teacher = this.getLoggedTeacher();
    if (!teacher) return;
    const schoolId = teacher.schoolId;

    // 1. Populate partner school select in Launch Project Form
    const partnerSchoolSelect = document.getElementById('launch-proj-school');
    if (partnerSchoolSelect) {
      partnerSchoolSelect.innerHTML = '';
      const schools = window.db.getSchools().filter(s => s.id !== schoolId);
      schools.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.name} (${s.city}, ${s.country})`;
        partnerSchoolSelect.appendChild(opt);
      });
    }

    // 2. Populate student checkbox list in Launch Project Form
    const launchStudentsList = document.getElementById('launch-proj-students-list');
    if (launchStudentsList) {
      launchStudentsList.innerHTML = '';
      const localStudents = window.db.getStudents().filter(s => s.schoolId === schoolId);
      if (localStudents.length === 0) {
        launchStudentsList.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted); padding: 0.5rem; display: block;">No students registered for your school.</span>`;
      } else {
        localStudents.forEach(s => {
          const div = document.createElement('div');
          div.style.display = 'flex';
          div.style.alignItems = 'center';
          div.style.gap = '0.5rem';
          div.style.padding = '0.2rem 0';
          div.innerHTML = `
            <input type="checkbox" name="launch-student" value="${s.id}" id="chk-launch-${s.id}" style="cursor: pointer;">
            <label for="chk-launch-${s.id}" style="font-size: 0.8rem; cursor: pointer; color: var(--text-primary); margin: 0;">
              ${s.name} (${s.age} y/o)
            </label>
          `;
          launchStudentsList.appendChild(div);
        });
      }
    }

    // 3. Populate Incoming Project Proposals
    const proposalsTbody = document.getElementById('teach-pending-projects-tbody');
    if (proposalsTbody) {
      proposalsTbody.innerHTML = '';
      const proposals = window.db.getProjects().filter(p => p.status === 'Proposed' && p.targetSchoolId === schoolId);
      
      if (proposals.length === 0) {
        proposalsTbody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
              No pending project proposals from partner schools.
            </td>
          </tr>
        `;
      } else {
        proposals.forEach(p => {
          const creatorSchool = window.db.getSchool(p.creatorSchoolId);
          const creatorStudents = p.creatorSchoolStudentIds.map(sid => window.db.getStudent(sid)?.name || 'Unknown').join(', ');
          
          const localStudents = window.db.getStudents().filter(s => s.schoolId === schoolId);
          let checkboxesHTML = '';
          if (localStudents.length === 0) {
            checkboxesHTML = `<span style="font-size: 0.75rem; color: var(--text-muted);">No local students available</span>`;
          } else {
            localStudents.forEach(s => {
              checkboxesHTML += `
                <div style="display: flex; align-items: center; gap: 0.35rem; padding: 0.15rem 0;">
                  <input type="checkbox" class="chk-accept-${p.id}" value="${s.id}" id="chk-acc-${p.id}-${s.id}" style="cursor: pointer;">
                  <label for="chk-acc-${p.id}-${s.id}" style="font-size: 0.75rem; cursor: pointer; color: var(--text-primary); margin: 0;">
                    ${s.name}
                  </label>
                </div>
              `;
            });
          }

          const tr = document.createElement('tr');
          tr.style.borderBottom = '1px solid var(--panel-border)';
          tr.innerHTML = `
            <td style="padding: 0.75rem; vertical-align: top;">
              <div style="font-weight: 700; color: var(--text-primary); font-size: 0.85rem;">${p.title}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem; line-height: 1.4; max-width: 250px;">
                ${p.brief}
              </div>
            </td>
            <td style="padding: 0.75rem; vertical-align: top;">
              <div style="font-weight: 600; color: var(--secondary); font-size: 0.8rem;">${creatorSchool?.name || 'Partner School'}</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.15rem;">
                Students: ${creatorStudents}
              </div>
            </td>
            <td style="padding: 0.75rem; vertical-align: top;">
              <div style="max-height: 100px; overflow-y: auto; border: 1px solid var(--panel-border); border-radius: 8px; padding: 0.4rem; background: rgba(0,0,0,0.15); width: 180px;">
                ${checkboxesHTML}
              </div>
            </td>
            <td style="padding: 0.75rem; vertical-align: middle;">
              <button class="btn btn-primary btn-small" onclick="app.acceptProject('${p.id}')" style="padding: 0.4rem 0.85rem; font-weight: 600; font-size: 0.75rem;">
                Accept Proposal
              </button>
            </td>
          `;
          proposalsTbody.appendChild(tr);
        });
      }
    }

    // 4. Populate Active & Published Projects
    const activeTbody = document.getElementById('teach-active-projects-tbody');
    if (activeTbody) {
      activeTbody.innerHTML = '';
      const activeProjects = window.db.getProjects().filter(p => 
        (p.creatorSchoolId === schoolId || p.targetSchoolId === schoolId) && p.status !== 'Proposed'
      );

      if (activeProjects.length === 0) {
        activeTbody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
              No active or published projects yet.
            </td>
          </tr>
        `;
      } else {
        activeProjects.forEach(p => {
          const creatorSchool = window.db.getSchool(p.creatorSchoolId);
          const targetSchool = window.db.getSchool(p.targetSchoolId);
          const cStudents = p.creatorSchoolStudentIds.map(sid => window.db.getStudent(sid)?.name || '').filter(Boolean).join(', ');
          const tStudents = p.targetSchoolStudentIds.map(sid => window.db.getStudent(sid)?.name || '').filter(Boolean).join(', ');

          const isMySchoolApproved = (p.creatorSchoolId === schoolId) ? p.creatorSchoolApproved : p.targetSchoolApproved;
          const isPendingAction = p.status === 'PendingPublish' && !isMySchoolApproved;

          let statusText = p.status;
          let badgeClass = 'badge-info';
          if (p.status === 'Published') {
            badgeClass = 'badge-success';
          } else if (p.status === 'PendingPublish') {
            badgeClass = 'badge-warning';
            statusText = 'Review Required';
          }

          const tr = document.createElement('tr');
          tr.style.borderBottom = '1px solid var(--panel-border)';
          tr.innerHTML = `
            <td style="padding: 0.75rem; vertical-align: top; font-weight: 600; color: var(--text-primary); font-size: 0.85rem;">
              ${p.title}
            </td>
            <td style="padding: 0.75rem; vertical-align: top; font-size: 0.75rem; color: var(--text-muted); max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${p.brief}">
              ${p.brief}
            </td>
            <td style="padding: 0.75rem; vertical-align: top; font-size: 0.75rem; line-height: 1.4; color: var(--text-secondary);">
              <strong>${creatorSchool?.code || 'School 1'}:</strong> ${cStudents || 'None'}<br>
              <strong>${targetSchool?.code || 'School 2'}:</strong> ${tStudents || 'None'}
            </td>
            <td style="padding: 0.75rem; vertical-align: middle;">
              <span class="badge ${badgeClass}" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">${statusText}</span>
            </td>
            <td style="padding: 0.75rem; vertical-align: middle;">
              ${isPendingAction ? `
                <button class="btn btn-warning btn-small alert-pulse" onclick="app.openReviewProjectModal('${p.id}')" style="font-weight: 700; padding: 0.4rem 0.85rem; font-size: 0.75rem;">
                  Review & Authorize
                </button>
              ` : `
                <button class="btn btn-secondary btn-small" onclick="app.openReviewProjectModal('${p.id}')" style="padding: 0.4rem 0.85rem; font-size: 0.75rem;">
                  Review Details
                </button>
              `}
            </td>
          `;
          activeTbody.appendChild(tr);
        });
      }
    }
  }

  handleProjectLaunch(e) {
    e.preventDefault();
    const teacher = this.getLoggedTeacher();
    if (!teacher) return;

    const titleInput = document.getElementById('launch-proj-title');
    const briefInput = document.getElementById('launch-proj-brief');
    const targetSchoolSelect = document.getElementById('launch-proj-school');

    if (!titleInput || !briefInput || !targetSchoolSelect) return;

    const selectedCheckboxes = document.querySelectorAll('#launch-proj-students-list input[name="launch-student"]:checked');
    const selectedStudentIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (selectedStudentIds.length === 0) {
      alert('Please select at least one local student to launch the project.');
      return;
    }

    const proj = {
      title: titleInput.value.trim(),
      brief: briefInput.value.trim(),
      creatorSchoolId: teacher.schoolId,
      targetSchoolId: targetSchoolSelect.value,
      creatorSchoolStudentIds: selectedStudentIds,
      targetSchoolStudentIds: [],
      status: 'Proposed'
    };

    window.db.addProject(proj);
    
    // Reset form
    document.getElementById('launch-project-form').reset();
    
    alert('Project proposal launched successfully! Sent to target partner school for review.');
    this.refreshUI();
  }

  acceptProject(projectId) {
    const teacher = this.getLoggedTeacher();
    if (!teacher) return;

    const selectedCheckboxes = document.querySelectorAll(`.chk-accept-${projectId}:checked`);
    const selectedStudentIds = Array.from(selectedCheckboxes).map(cb => cb.value);

    if (selectedStudentIds.length === 0) {
      alert('Please select at least one local student to join the project.');
      return;
    }

    const project = window.db.getProject(projectId);
    if (!project) return;

    window.db.updateProject(projectId, {
      targetSchoolStudentIds: selectedStudentIds,
      status: 'Active'
    });

    // Add a system log message in the group chat
    window.db.addProjectMessage(
      projectId,
      'system',
      'System',
      `Project accepted by coordinator ${teacher.name}. Added student(s): ${selectedStudentIds.map(sid => window.db.getStudent(sid)?.name || '').filter(Boolean).join(', ')}.`
    );

    alert('Proposal accepted! The project is now active for students of both schools.');
    this.refreshUI();
  }

  openReviewProjectModal(projectId) {
    const project = window.db.getProject(projectId);
    if (!project) return;

    const teacher = this.getLoggedTeacher();
    if (!teacher) return;
    const schoolId = teacher.schoolId;

    const modalContent = document.getElementById('project-review-content');
    if (!modalContent) return;

    modalContent.innerHTML = '';

    let badgeClass = 'badge-info';
    if (project.status === 'Published') {
      badgeClass = 'badge-success';
    } else if (project.status === 'PendingPublish') {
      badgeClass = 'badge-warning';
    }

    const creatorSchool = window.db.getSchool(project.creatorSchoolId);
    const targetSchool = window.db.getSchool(project.targetSchoolId);

    const creatorSchoolName = creatorSchool ? creatorSchool.name : 'Creator School';
    const targetSchoolName = targetSchool ? targetSchool.name : 'Target School';

    const creatorApproved = project.creatorSchoolApproved;
    const targetApproved = project.targetSchoolApproved;

    const isMySchoolApproved = (project.creatorSchoolId === schoolId) ? creatorApproved : targetApproved;
    const showApproveButton = project.status === 'PendingPublish' && !isMySchoolApproved;

    // Chat log history render
    const chatMsgs = window.db.getProjectMessages().filter(m => m.projectId === project.id);
    let chatHTML = '';
    if (chatMsgs.length === 0) {
      chatHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.75rem; padding: 0.5rem 0;">No messages yet.</div>`;
    } else {
      chatMsgs.forEach(msg => {
        chatHTML += `
          <div style="font-size: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.02); padding: 0.25rem 0; line-height: 1.4;">
            <strong style="color: var(--text-primary);">${msg.senderName}:</strong> 
            <span style="color: var(--text-secondary);">${msg.text}</span>
            <span style="float: right; color: var(--text-muted); font-size: 0.65rem;">
              ${new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        `;
      });
    }

    modalContent.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h4 style="margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--text-primary);">${project.title}</h4>
            <span class="badge ${badgeClass}" style="margin-top: 0.35rem; font-size: 0.7rem; padding: 0.15rem 0.5rem;">${project.status}</span>
          </div>
        </div>

        <div style="background: rgba(6, 182, 212, 0.03); border: 1px solid rgba(6, 182, 212, 0.1); border-radius: 12px; padding: 0.75rem; font-size: 0.8rem; line-height: 1.5;">
          <strong style="color: var(--secondary);">📋 Project Brief:</strong> ${project.brief}
        </div>

        <div style="border-top: 1px solid var(--panel-border); padding-top: 0.75rem;">
          <h5 style="margin: 0 0 0.5rem 0; font-size: 0.85rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.5px;">✍️ Student Presentation Article</h5>
          <div style="background: rgba(0, 0, 0, 0.2); border: 1px solid var(--panel-border); border-radius: 12px; padding: 1rem; max-height: 180px; overflow-y: auto;">
            <h6 style="margin: 0 0 0.5rem 0; font-size: 0.85rem; font-weight: 700; color: var(--text-primary);">${project.articleTitle || 'Untitled Article'}</h6>
            ${project.articlePhotoUrl ? `
              <div style="margin-bottom: 0.75rem; border-radius: 8px; overflow: hidden; height: 110px; border: 1px solid var(--panel-border);">
                <img src="${project.articlePhotoUrl}" style="width:100%; height:100%; object-fit:cover;">
              </div>
            ` : ''}
            <p style="font-size: 0.8rem; line-height: 1.5; color: var(--text-secondary); margin: 0; white-space: pre-wrap;">${project.articleContent || 'No content written yet.'}</p>
          </div>
        </div>

        <div style="border-top: 1px solid var(--panel-border); padding-top: 0.75rem;">
          <h5 style="margin: 0 0 0.5rem 0; font-size: 0.85rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.5px;">💬 Chat Audit Log</h5>
          <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--panel-border); border-radius: 12px; padding: 0.75rem; max-height: 120px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.25rem;">
            ${chatHTML}
          </div>
        </div>

        <div style="border-top: 1px solid var(--panel-border); padding-top: 0.75rem; display: flex; flex-direction: column; gap: 0.75rem;">
          <h5 style="margin: 0; font-size: 0.85rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.5px;">🔑 Coordinator Approvals</h5>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; font-size: 0.8rem;">
            <div style="padding: 0.6rem; border-radius: 8px; border: 1px solid ${creatorApproved ? 'rgba(16, 185, 129, 0.2)' : 'var(--panel-border)'}; background: ${creatorApproved ? 'rgba(16, 185, 129, 0.05)' : 'rgba(0,0,0,0.1)'};">
              <strong>${creatorSchoolName} (UK):</strong><br>
              ${creatorApproved ? '<span style="color: #34d399; font-weight: 600;">✅ Authorized</span>' : '<span style="color: var(--text-muted);">⏳ Pending sign-off</span>'}
            </div>
            <div style="padding: 0.6rem; border-radius: 8px; border: 1px solid ${targetApproved ? 'rgba(16, 185, 129, 0.2)' : 'var(--panel-border)'}; background: ${targetApproved ? 'rgba(16, 185, 129, 0.05)' : 'rgba(0,0,0,0.1)'};">
              <strong>${targetSchoolName} (DE):</strong><br>
              ${targetApproved ? '<span style="color: #34d399; font-weight: 600;">✅ Authorized</span>' : '<span style="color: var(--text-muted);">⏳ Pending sign-off</span>'}
            </div>
          </div>

          <!-- Action button -->
          ${showApproveButton ? `
            <button class="btn btn-primary" onclick="app.authorizeProjectPublication('${project.id}', true)" style="width: 100%; font-weight: 700; padding: 0.6rem 0; margin-top: 0.5rem;">
              Authorize & Approve Publication
            </button>
          ` : `
            <div style="text-align: center; font-size: 0.8rem; color: var(--text-muted); padding: 0.5rem; background: rgba(255,255,255,0.02); border-radius: 8px;">
              ${project.status === 'Published' ? '🎉 Fully published!' : 'Approval pending student publication submission.'}
            </div>
          `}
        </div>
      </div>
    `;

    document.getElementById('review-project-modal').classList.add('active');
  }

  authorizeProjectPublication(projectId, approve) {
    const teacher = this.getLoggedTeacher();
    if (!teacher) return;

    window.db.authorizeProject(projectId, teacher.id, approve);
    this.closeModal('review-project-modal');
    alert('Project authorized successfully!');
    this.refreshUI();
  }

  switchProjectSubtab(subtabId) {
    const panels = ['article', 'chat', 'brief'];
    panels.forEach(p => {
      const el = document.getElementById(`proj-panel-${p}`);
      if (el) {
        el.style.display = 'none';
      }
    });

    const targetEl = document.getElementById(`proj-panel-${subtabId}`);
    if (targetEl) {
      targetEl.style.display = 'flex';
      if (subtabId === 'chat') {
        const feed = document.getElementById('proj-chat-message-feed');
        if (feed) feed.scrollTop = feed.scrollHeight;
      }
    }

    panels.forEach(p => {
      const btn = document.getElementById(`proj-subtab-${p}`);
      if (btn) {
        btn.classList.remove('active');
      }
    });

    const targetBtn = document.getElementById(`proj-subtab-${subtabId}`);
    if (targetBtn) {
      targetBtn.classList.add('active');
    }
  }

  // ================== LOGIN / LOGOUT PORTAL HELPERS ==================

  populateLoginScreen() {
    const studentSelect = document.getElementById('login-student-select');
    if (!studentSelect) return;
    studentSelect.innerHTML = '';
    
    const students = window.db.getStudents();
    students.forEach(s => {
      const school = window.db.getSchool(s.schoolId);
      const schoolName = school ? school.name : 'Unknown School';
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.age} y/o, ${s.gender} • ${schoolName})`;
      studentSelect.appendChild(opt);
    });
  }

  loginAsStudent(studentId) {
    this.isLoggedIn = true;
    this.switchRole('student', studentId);
    document.getElementById('login-screen').style.display = 'none';
    document.querySelector('.app-container').style.setProperty('display', 'flex', 'important');
  }

  loginAsStaff(value) {
    this.isLoggedIn = true;
    if (value === 'admin') {
      this.switchRole('admin');
    } else {
      this.switchRole('teacher', null, value);
    }
    document.getElementById('login-screen').style.display = 'none';
    document.querySelector('.app-container').style.setProperty('display', 'flex', 'important');
  }

  logout() {
    this.isLoggedIn = false;
    this.currentRole = null;
    document.getElementById('login-screen').style.setProperty('display', 'flex', 'important');
    document.querySelector('.app-container').style.setProperty('display', 'none', 'important');
    this.populateLoginScreen();
  }
}

// Global coordinator initialization
window.app = new App();
