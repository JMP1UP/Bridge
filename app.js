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
      <h3 style="font-family: var(--font-title); font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.75rem;">${(window.app && window.app.translate) ? window.app.translate('system_notification', 'System Notification') : 'System Notification'}</h3>
      <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.75rem; font-family: var(--font-body);">${message}</p>
      <div style="display: flex; justify-content: center;">
        <button class="btn btn-primary" style="padding: 0.65rem 2.5rem; min-width: 120px; border-radius: 10px; font-weight: 600;">${(window.app && window.app.translate) ? window.app.translate('dismiss_btn', 'Dismiss') : 'Dismiss'}</button>
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
    this.activeSlideIndex = 0;
    this.projectsSubTab = 'gallery';
    this.selectedProjectBroadcastIds = [];
    this.broadcastTarget = 'selected';
    this.activeModeratedProjectId = null;
    this.safeguardFilter = 'open';
    this.adminSafeguardFilter = 'open';
    this.projectCardSlideIndices = {};
    
    // Bind listeners
    window.addEventListener('DOMContentLoaded', () => this.init());
  }

  translate(key, defaultText) {
    const lang = this.interfaceLang || 'en';
    if (window.translator && window.translator.UI_TRANSLATIONS[lang] && window.translator.UI_TRANSLATIONS[lang][key]) {
      return window.translator.UI_TRANSLATIONS[lang][key];
    }
    return defaultText;
  }

  translateGender(gender) {
    if (!gender) return '';
    const key = `gender_${gender.toLowerCase()}`;
    return this.translate(key, gender);
  }

  translateYearGroup(yg) {
    if (!yg) return '';
    if (this.interfaceLang === 'de') {
      return yg.replace(/Year/i, 'Klasse');
    }
    if (this.interfaceLang === 'fr') {
      return yg.replace(/Year/i, 'Classe');
    }
    return yg;
  }

  formatTeacherName(name) {
    if (!name) return '';
    if (name.startsWith('Teacher ')) {
      const bareName = name.substring(8);
      return `${this.translate('teacher_label', 'Teacher')} ${bareName}`;
    }
    return name;
  }

  getStudentDisplayName(stud) {
    if (!stud) return 'Unknown';
    let viewerSchoolId = 'school_1';
    if (this.currentRole === 'student') {
      const viewerStudent = window.db.getStudent(this.currentStudentId);
      if (viewerStudent) viewerSchoolId = viewerStudent.schoolId;
    } else if (this.currentRole === 'teacher') {
      const viewerTeacher = this.getLoggedTeacher();
      if (viewerTeacher) viewerSchoolId = viewerTeacher.schoolId;
    } else if (this.currentRole === 'admin') {
      return stud.name;
    }
    
    if (stud.schoolId === viewerSchoolId) {
      return stud.name;
    } else {
      return stud.name.split(' ')[0];
    }
  }

  getLogonDisplay(level) {
    if (level === 'High') return this.translate('activity_today', 'Today');
    if (level === 'Medium') return this.translate('activity_2days', '2 days ago');
    if (level === 'Low') return this.translate('activity_8days', '8 days ago');
    return this.translate('activity_never', 'Never');
  }

  getSchoolFlag(country, size = 'small') {
    if (!country) return '🏫';
    const c = country.toLowerCase();
    let code = '';
    if (c.includes('germany') || c.includes('deutschland')) code = 'de';
    else if (c.includes('united kingdom') || c.includes('uk') || c.includes('britain') || c.includes('england')) code = 'gb';
    else if (c.includes('france')) code = 'fr';
    else if (c.includes('spain')) code = 'es';
    
    if (code) {
      const width = size === 'large' ? 32 : 18;
      const height = size === 'large' ? 24 : 13;
      return `<img src="https://flagcdn.com/w40/${code}.png" width="${width}" height="${height}" alt="${country}" style="vertical-align: middle; border-radius: 2px; box-shadow: 0 1px 2px rgba(0,0,0,0.25); display: inline-block;">`;
    }
    return '🏫';
  }

  getSchoolFlagEmoji(country) {
    if (!country) return '🏫';
    const c = country.toLowerCase();
    if (c.includes('germany') || c.includes('deutschland')) return '🇩🇪';
    if (c.includes('united kingdom') || c.includes('uk') || c.includes('britain') || c.includes('england')) return '🇬🇧';
    if (c.includes('france')) return '🇫🇷';
    if (c.includes('spain')) return '🇪🇸';
    if (c.includes('united states') || c.includes('usa') || c.includes('us')) return '🇺🇸';
    return '🏫';
  }

  init() {
    this.isLoggedIn = false;

    // Populate interface language selector dynamically based on translator dictionaries
    const langSelect = document.getElementById('ui-lang-selector');
    if (langSelect && window.translator && window.translator.UI_TRANSLATIONS) {
      langSelect.innerHTML = '';
      Object.keys(window.translator.UI_TRANSLATIONS).forEach(lang => {
        const option = document.createElement('option');
        option.value = lang;
        option.textContent = window.translator.UI_TRANSLATIONS[lang]["language_name"] || lang.toUpperCase();
        langSelect.appendChild(option);
      });
    }

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

    this.initStaffArticleListeners();

    // Theme Toggle
    document.getElementById('theme-toggle-btn').addEventListener('click', () => this.toggleTheme());
    
    // Localization
    const uiLangSelector = document.getElementById('ui-lang-selector');
    if (uiLangSelector) {
      uiLangSelector.addEventListener('change', (e) => {
        this.setLanguage(e.target.value);
      });
    }

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
        devToggle.textContent = this.translate('collapse_btn', 'Collapse ▲');
      } else {
        devBody.style.display = 'none';
        devToggle.textContent = this.translate('expand_btn', 'Expand ▼');
      }
    });

    // Reset database action
    document.getElementById('dev-reset-db-btn').addEventListener('click', () => {
      window.db.reset();
      this.init();
      alert(this.translate('db_reset_success', 'Local Storage Database has been reset to defaults.'));
    });

    // Article submit listener
    const artForm = document.getElementById('article-submission-form');
    if (artForm) {
      artForm.addEventListener('submit', (e) => this.handleArticleSubmit(e));
    }

    // Connection Request form submission
    const connForm = document.getElementById('connect-request-form');
    if (connForm) {
      connForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const targetSchoolId = document.getElementById('connect-target-school-id').value;
        const requestorBio = document.getElementById('connect-requestor-bio').value.trim();
        const requestMessage = document.getElementById('connect-personalised-msg').value.trim();
        const teacher = this.getLoggedTeacher();
        const schoolId = teacher ? teacher.schoolId : 'school_1';

        window.db.addSchoolConnection({
          fromSchoolId: schoolId,
          toSchoolId: targetSchoolId,
          requestMessage,
          requestorBio
        });

        // Add audit log
        const name = teacher ? teacher.name : this.translate('teacher_label', 'Teacher');
        const targetSchool = window.db.getSchool(targetSchoolId);
        window.db.addLog('Connection Requested', `Sent connection request to ${targetSchool ? targetSchool.name : 'another school'}.`, name);

        alert(this.translate('connection_request_sent_success', 'Connection request sent successfully!'));
        this.closeModal('connect-request-modal');
        this.refreshUI();
        this.renderSchoolConnections();
      });
    }

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
      teachTextarea.addEventListener('input', () => {
        if (this.teacherAutoTranslateEnabled) {
          this.handleTeacherAutoTranslate();
        }
      });
    }

    // Translation helper draft compose
    document.getElementById('translate-compose-btn').addEventListener('click', () => this.draftTranslation());

    // Coordinator translation helper draft compose
    const teachTranslateBtn = document.getElementById('teacher-translate-compose-btn');
    if (teachTranslateBtn) {
      teachTranslateBtn.addEventListener('click', () => this.draftTeacherTranslation());
    }

    // Coordinator auto-translate initialization
    this.teacherAutoTranslateEnabled = localStorage.getItem('bridge_teacher_auto_translate') === 'true';
    const teachAutoToggle = document.getElementById('teacher-auto-translate-toggle');
    if (teachAutoToggle) {
      teachAutoToggle.checked = this.teacherAutoTranslateEnabled;
      if (teachTranslateBtn) {
        teachTranslateBtn.disabled = this.teacherAutoTranslateEnabled;
        teachTranslateBtn.style.opacity = this.teacherAutoTranslateEnabled ? '0.4' : '1';
        teachTranslateBtn.style.cursor = this.teacherAutoTranslateEnabled ? 'not-allowed' : 'pointer';
      }
      teachAutoToggle.addEventListener('change', (e) => {
        this.teacherAutoTranslateEnabled = e.target.checked;
        localStorage.setItem('bridge_teacher_auto_translate', this.teacherAutoTranslateEnabled);
        if (teachTranslateBtn) {
          teachTranslateBtn.disabled = this.teacherAutoTranslateEnabled;
          teachTranslateBtn.style.opacity = this.teacherAutoTranslateEnabled ? '0.4' : '1';
          teachTranslateBtn.style.cursor = this.teacherAutoTranslateEnabled ? 'not-allowed' : 'pointer';
        }
        if (this.teacherAutoTranslateEnabled) {
          this.handleTeacherAutoTranslate();
        } else {
          const previewSpan = document.getElementById('teacher-compose-translation-preview');
          if (previewSpan) {
            previewSpan.textContent = '';
            previewSpan.removeAttribute('data-draft');
          }
        }
        this.renderTeacherMessages();
      });
    }

    // Coordinator conversation-translate initialization
    this.teacherConversationTranslateEnabled = localStorage.getItem('bridge_teacher_conversation_translate') === 'true';
    const teachConvToggle = document.getElementById('teacher-conversation-translate-toggle');
    if (teachConvToggle) {
      teachConvToggle.checked = this.teacherConversationTranslateEnabled;
      teachConvToggle.addEventListener('change', (e) => {
        this.teacherConversationTranslateEnabled = e.target.checked;
        localStorage.setItem('bridge_teacher_conversation_translate', this.teacherConversationTranslateEnabled);
        this.renderTeacherMessages();
      });
    }


    // Auto-translate toggle event listener
    this.autoTranslateEnabled = localStorage.getItem('bridge_auto_translate') === 'true';
    const autoToggle = document.getElementById('auto-translate-toggle');
    if (autoToggle) {
      autoToggle.checked = this.autoTranslateEnabled;
      autoToggle.addEventListener('change', (e) => {
        this.autoTranslateEnabled = e.target.checked;
        localStorage.setItem('bridge_auto_translate', this.autoTranslateEnabled);
        const translateBtn = document.getElementById('translate-compose-btn');
        if (translateBtn) {
          translateBtn.disabled = this.autoTranslateEnabled;
          translateBtn.style.opacity = this.autoTranslateEnabled ? '0.4' : '1';
          translateBtn.style.cursor = this.autoTranslateEnabled ? 'not-allowed' : 'pointer';
        }
        if (this.autoTranslateEnabled) {
          this.handleAutoTranslate();
        }
        this.renderStudentChat();
      });
    }

    // Key input listener on textarea for auto translation
    const textarea = document.getElementById('chat-textarea');
    if (textarea) {
      textarea.addEventListener('input', () => {
        if (this.autoTranslateEnabled) {
          this.handleAutoTranslate();
        }
      });
    }

    // Report safety concern form listener
    document.getElementById('student-report-btn').addEventListener('click', () => this.openModal('report-concern-modal'));
    document.getElementById('report-concern-form').addEventListener('submit', (e) => this.handleReportConcern(e));
    document.getElementById('report-project-concern-form').addEventListener('submit', (e) => this.handleReportProjectConcern(e));

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

    // School logo custom upload handlers
    const logoUploadBtn = document.getElementById('school-logo-upload-btn');
    const logoUploadInput = document.getElementById('school-logo-upload');
    const logoPreview = document.getElementById('school-logo-preview');
    const logoPlaceholder = document.getElementById('school-logo-placeholder');
    const logoRemoveBtn = document.getElementById('school-logo-remove-btn');

    if (logoUploadBtn && logoUploadInput) {
      logoUploadBtn.addEventListener('click', () => logoUploadInput.click());
      logoUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 1.5 * 1024 * 1024) {
            alert(this.translate('image_too_large_alert', 'Image file is too large. Please select an image smaller than 1.5MB.'));
            logoUploadInput.value = '';
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            logoPreview.src = event.target.result;
            logoPreview.style.display = 'block';
            if (logoPlaceholder) logoPlaceholder.style.display = 'none';
            if (logoRemoveBtn) logoRemoveBtn.style.display = 'inline-block';
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (logoRemoveBtn) {
      logoRemoveBtn.addEventListener('click', () => {
        logoPreview.src = '';
        logoPreview.style.display = 'none';
        if (logoPlaceholder) logoPlaceholder.style.display = 'block';
        logoRemoveBtn.style.display = 'none';
        if (logoUploadInput) logoUploadInput.value = '';
      });
    }

    // School photo custom upload handlers
    const photoUploadBtn = document.getElementById('school-photo-upload-btn');
    const photoUploadInput = document.getElementById('school-photo-upload');
    const photoPreview = document.getElementById('school-photo-preview');
    const photoPlaceholder = document.getElementById('school-photo-placeholder');
    const photoRemoveBtn = document.getElementById('school-photo-remove-btn');

    if (photoUploadBtn && photoUploadInput) {
      photoUploadBtn.addEventListener('click', () => photoUploadInput.click());
      photoUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 1.5 * 1024 * 1024) {
            alert(this.translate('image_too_large_alert', 'Image file is too large. Please select an image smaller than 1.5MB.'));
            photoUploadInput.value = '';
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            photoPreview.src = event.target.result;
            photoPreview.style.display = 'block';
            if (photoPlaceholder) photoPlaceholder.style.display = 'none';
            if (photoRemoveBtn) photoRemoveBtn.style.display = 'inline-block';
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (photoRemoveBtn) {
      photoRemoveBtn.addEventListener('click', () => {
        photoPreview.src = '';
        photoPreview.style.display = 'none';
        if (photoPlaceholder) photoPlaceholder.style.display = 'block';
        photoRemoveBtn.style.display = 'none';
        if (photoUploadInput) photoUploadInput.value = '';
      });
    }

    // Coordinator profile photo custom upload handlers
    const coordUploadBtn = document.getElementById('coordinator-photo-upload-btn');
    const coordUploadInput = document.getElementById('coordinator-photo-upload');
    const coordPreview = document.getElementById('coordinator-photo-preview');
    const coordPlaceholder = document.getElementById('coordinator-photo-placeholder');
    const coordRemoveBtn = document.getElementById('coordinator-photo-remove-btn');

    if (coordUploadBtn && coordUploadInput) {
      coordUploadBtn.addEventListener('click', () => coordUploadInput.click());
      coordUploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 1.5 * 1024 * 1024) {
            alert(this.translate('image_too_large_alert', 'Image file is too large. Please select an image smaller than 1.5MB.'));
            coordUploadInput.value = '';
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            coordPreview.src = event.target.result;
            coordPreview.style.display = 'block';
            if (coordPlaceholder) coordPlaceholder.style.display = 'none';
            if (coordRemoveBtn) coordRemoveBtn.style.display = 'inline-block';
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (coordRemoveBtn) {
      coordRemoveBtn.addEventListener('click', () => {
        coordPreview.src = '';
        coordPreview.style.display = 'none';
        if (coordPlaceholder) coordPlaceholder.style.display = 'block';
        coordRemoveBtn.style.display = 'none';
        if (coordUploadInput) coordUploadInput.value = '';
      });
    }

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
          alert(this.translate('image_too_large_alert', 'Image file is too large. Please select an image smaller than 1.5MB.'));
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

    // Toggle login screen sections for registration
    const showRegisterBtn = document.getElementById('login-show-register-btn');
    const cancelRegisterBtn = document.getElementById('login-register-cancel-btn');
    const loginPortalSections = document.getElementById('login-portal-sections');
    const loginRegisterSection = document.getElementById('login-register-section');

    if (showRegisterBtn && cancelRegisterBtn && loginPortalSections && loginRegisterSection) {
      showRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginPortalSections.style.display = 'none';
        loginRegisterSection.style.display = 'block';
      });

      cancelRegisterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loginRegisterSection.style.display = 'none';
        loginPortalSections.style.display = 'flex';
      });
    }

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
      reqSchoolCountry.addEventListener('change', updateGeneratedCode);
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
    const projArtPhotoRemoveBtn = document.getElementById('proj-art-photo-remove-btn');
    if (projArtPhotoInput) {
      projArtPhotoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 1.5 * 1024 * 1024) {
            alert(this.translate('image_too_large_alert', 'Image file is too large. Please select an image smaller than 1.5MB.'));
            projArtPhotoInput.value = '';
            this.currentProjArticlePhotoDataUrl = '';
            projArtPhotoPreview.style.display = 'none';
            projArtPhotoPlaceholder.style.display = 'block';
            if (projArtPhotoRemoveBtn) projArtPhotoRemoveBtn.style.display = 'none';
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            this.currentProjArticlePhotoDataUrl = event.target.result;
            projArtPhotoPreview.src = event.target.result;
            projArtPhotoPreview.style.display = 'block';
            projArtPhotoPlaceholder.style.display = 'none';
            if (projArtPhotoRemoveBtn) projArtPhotoRemoveBtn.style.display = 'block';

            // Auto-switch layout to split if it was text-only
            const project = window.db.getProject(this.activeProjectId);
            const activeSlide = project?.slides[this.activeSlideIndex];
            if (activeSlide && activeSlide.layout === 'text-only') {
              activeSlide.layout = 'split';
              this.saveProjectSlideStateSilent('split');
              this.renderStudentProjects();
            } else {
              this.saveProjectSlideStateSilent();
            }
          };
          reader.readAsDataURL(file);
        } else {
          this.currentProjArticlePhotoDataUrl = '';
          projArtPhotoPreview.style.display = 'none';
          projArtPhotoPlaceholder.style.display = 'block';
          if (projArtPhotoRemoveBtn) projArtPhotoRemoveBtn.style.display = 'none';
        }
      });
    }

    if (projArtPhotoRemoveBtn) {
      projArtPhotoRemoveBtn.addEventListener('click', () => {
        this.currentProjArticlePhotoDataUrl = '';
        if (projArtPhotoInput) projArtPhotoInput.value = '';
        if (projArtPhotoPreview) {
          projArtPhotoPreview.src = '';
          projArtPhotoPreview.style.display = 'none';
        }
        if (projArtPhotoPlaceholder) projArtPhotoPlaceholder.style.display = 'block';
        projArtPhotoRemoveBtn.style.display = 'none';
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

    // Check if we are on the signup/welcome flow via query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token && token.startsWith('welcome_')) {
      const studentId = token.replace('welcome_', '');
      const student = window.db.getStudent(studentId);
      if (student) {
        // Activate student
        window.db.updateStudent(studentId, { active: true, invitationStatus: 'Active' });
        // Log in
        this.loginAsStudent(studentId);
        // Clear URL search params and signup route path without reloading
        window.history.replaceState({}, document.title, window.location.origin + '/');
        // Welcome notification
        alert(`Welcome to Bridge, ${student.name}! Your account has been successfully activated.`);
      }
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
        roleEl.textContent = `${this.translateYearGroup(stud.yearGroup)} • ${window.db.getSchool(stud.schoolId)?.name}`;
        avatarEl.textContent = stud.name.split(' ').map(n => n[0]).join('');
      }
    } else if (this.currentRole === 'teacher') {
      const coordinators = window.db.getCoordinators();
      const coord = coordinators.find(c => c.id === this.currentCoordinatorId) || coordinators[0];
      const isAdmin = coord ? coord.isSchoolAdmin : false;
      const school = coord ? window.db.getSchool(coord.schoolId) : null;
      nameEl.textContent = coord ? coord.name : 'Mrs. Smith';
      roleEl.textContent = `${this.translate('languages_coordinator_label', 'Languages Coordinator')} ${isAdmin ? '• ' + this.translate('school_admin_label', 'School Admin') : ''} (${school ? school.code : ''})`;
      avatarEl.textContent = coord ? coord.name.split(' ').map(n => n[0]).join('') : 'MS';
    } else if (this.currentRole === 'admin') {
      nameEl.textContent = this.translate('system_admin_label', 'System Admin');
      roleEl.textContent = this.translate('platform_administrator_label', 'Platform Administrator');
      avatarEl.textContent = 'AD';
    } else if (this.currentRole === 'new-coordinator') {
      nameEl.textContent = this.translate('unregistered_teacher_label', 'Unregistered Teacher');
      roleEl.textContent = this.translate('awaiting_school_connect_label', 'Awaiting School Connect');
      avatarEl.textContent = 'UT';
    }

    // Make the avatar card clickable to open their own profile modal if student
    const badgeEl = document.querySelector('.user-profile-badge');
    if (badgeEl) {
      if (this.currentRole === 'student') {
        badgeEl.style.cursor = 'pointer';
        badgeEl.title = 'View My Profile';
        badgeEl.onclick = () => {
          this.openTeacherStudentProfileModal(this.currentStudentId);
        };
      } else {
        badgeEl.style.cursor = '';
        badgeEl.title = '';
        badgeEl.onclick = null;
      }
    }

    // Dynamic brand/logo subtitle based on active role
    const brandDescEl = document.querySelector('.brand > span');
    if (brandDescEl) {
      if (this.currentRole === 'student') {
        brandDescEl.textContent = this.translate('student_portal_subtitle', 'Student Portal');
      } else if (this.currentRole === 'teacher') {
        brandDescEl.textContent = this.translate('teacher_portal_subtitle', 'Teacher Portal');
      } else if (this.currentRole === 'admin') {
        brandDescEl.textContent = this.translate('admin_portal_subtitle', 'Admin Portal');
      } else if (this.currentRole === 'new-coordinator') {
        brandDescEl.textContent = this.translate('onboarding_portal_subtitle', 'Onboarding Portal');
      } else {
        brandDescEl.textContent = this.translate('connecting_students_subtitle', 'connecting schools & teachers worldwide');
      }
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

    const titleEl = document.getElementById('view-title');
    const subtitleEl = document.getElementById('view-subtitle');

    let translationKey = tabId.replace('-', '_');
    if (tabId === 'teach-roster') translationKey = 'teach_students';
    if (tabId === 'teach-messages') translationKey = 'staff_messages';

    const localizedTitle = window.translator.UI_TRANSLATIONS[this.interfaceLang][translationKey];
    titleEl.textContent = localizedTitle || tabId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    if (this.currentRole === 'student') {
      const student = window.db.getStudent(this.currentStudentId);
      const template = window.translator.UI_TRANSLATIONS[this.interfaceLang].welcome_subtitle_student || "Welcome, {name}! Connect with your cultural exchange partner.";
      subtitleEl.textContent = template.replace('{name}', student?.name || 'Student');
    } else if (this.currentRole === 'teacher') {
      subtitleEl.textContent = '';
    } else if (this.currentRole === 'admin') {
      subtitleEl.textContent = '';
    } else if (this.currentRole === 'new-coordinator') {
      subtitleEl.textContent = '';
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
      btn.textContent = `☀️ ${this.translate('light_mode_btn', 'Light Mode')}`;
    } else {
      this.theme = 'dark';
      document.documentElement.removeAttribute('data-theme');
      btn.textContent = `🌙 ${this.translate('dark_mode_btn', 'Dark Mode')}`;
    }
  }

  // Set Language for localization
  setLanguage(lang) {
    this.interfaceLang = lang;
    
    // Ensure selector value stays in sync
    const langSelect = document.getElementById('ui-lang-selector');
    if (langSelect) {
      langSelect.value = lang;
    }
    
    // Apply UI translation dictionary definitions
    document.querySelectorAll('[data-localize]').forEach(el => {
      const key = el.getAttribute('data-localize');
      if (window.translator.UI_TRANSLATIONS[lang] && window.translator.UI_TRANSLATIONS[lang][key]) {
        const translatedText = window.translator.UI_TRANSLATIONS[lang][key];
        
        if (el.hasAttribute('placeholder')) {
          el.setAttribute('placeholder', translatedText);
        } else if (el.tagName === 'INPUT' && (el.type === 'button' || el.type === 'submit')) {
          el.value = translatedText;
        } else if (el.tagName === 'A' && el.querySelector('span')) {
          el.querySelector('span').textContent = translatedText;
        } else {
          el.textContent = translatedText;
        }
      }
    });

    // Programmatically translate core header elements (cache-safe)
    const interfaceLabel = document.querySelector('#ui-lang-selector-container span');
    if (interfaceLabel) {
      interfaceLabel.textContent = this.translate('interface_language_label', 'Interface:');
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.innerHTML = `🚪 ${this.translate('logout_btn', 'Logout')}`;
    }

    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      if (this.theme === 'light') {
        themeBtn.textContent = `☀️ ${this.translate('light_mode_btn', 'Light Mode')}`;
      } else {
        themeBtn.textContent = `🌙 ${this.translate('dark_mode_btn', 'Dark Mode')}`;
      }
    }

    // Refresh user badge to localize brand subtitle
    this.updateUserBadge();

    // Update headings/labels
    const activeLink = document.querySelector('.nav-link.active');
    if (activeLink) {
      this.switchTab(activeLink.getAttribute('data-tab'));
    } else {
      this.refreshUI();
    }
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
    } else if (role === 'teacher') {
      this.currentCoordinatorId = coordId || 'coord_1';
      const teacher = window.db.getCoordinator(this.currentCoordinatorId);
      if (teacher) {
        const school = window.db.getSchool(teacher.schoolId);
        if (school && school.language) {
          this.setLanguage(school.language);
          document.getElementById('ui-lang-selector').value = school.language;
        } else {
          this.setLanguage('en');
          document.getElementById('ui-lang-selector').value = 'en';
        }
      } else {
        this.setLanguage('en');
        document.getElementById('ui-lang-selector').value = 'en';
      }
    } else {
      this.setLanguage('en');
      document.getElementById('ui-lang-selector').value = 'en';
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
      const student = window.db.getStudent(this.currentStudentId);
      this.renderStudentDashboard();
      this.renderStudentChat();
      this.renderLanguageWidget();
      this.populateStudentSettings();
      this.renderStudentProjects();
      this.updateStudentUnreadBadge();
      if (student) this.renderDiscoveriesBoard(student);
    } else if (this.currentRole === 'teacher') {
      this.renderTeacherDashboard();
      this.renderStudentRoster();
      this.renderTeacherMatching();
      this.renderTeacherSafeguarding();
      this.renderTeacherEditorDesk();
      this.populateTeacherSettings();
      this.renderTeacherMessages();
      this.updateStaffUnreadBadge();
      this.renderTeacherProjects();
      this.renderSchoolConnections();
    } else if (this.currentRole === 'admin') {
      this.renderAdminDashboard();
      this.renderAdminSchools();
    } else if (this.currentRole === 'new-coordinator') {
      this.renderNewCoordinatorOnboarding();
    }
  }

  updateStaffUnreadBadge() {
    const teacher = this.getLoggedTeacher();
    if (!teacher) return;
    const myId = teacher.id;
    const unreadCount = window.db.getCoordinatorMessages().filter(m => 
      m.receiverId === myId && !m.read
    ).length;

    const badge = document.getElementById('staff-unread-message-count');
    if (badge) {
      if (unreadCount > 0) {
        badge.style.display = 'inline-flex';
        badge.textContent = unreadCount;
      } else {
        badge.style.display = 'none';
      }
    }
  }

  updateStudentUnreadBadge() {
    if (this.currentRole !== 'student' || !this.currentStudentId) return;
    const student = window.db.getStudent(this.currentStudentId);
    if (!student) return;

    // Get active matches for this student
    const activeMatches = window.db.getMatches().filter(m => m.active && m.studentIds.includes(student.id));
    let unreadCount = 0;
    if (activeMatches.length > 0) {
      unreadCount = window.db.getMessages().filter(m => 
        m.matchId === activeMatches[0].id && m.senderId !== student.id && !m.read
      ).length;
    }

    const badge = document.getElementById('student-sidebar-unread-count');
    if (badge) {
      if (unreadCount > 0) {
        badge.style.display = 'inline-flex';
        badge.textContent = unreadCount;
      } else {
        badge.style.display = 'none';
      }
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
      
      const titleText = `${translations.welcome_title_matched || "Your Pen Pal is"} <span class="clickable-partner-link" style="cursor: pointer; text-decoration: underline;" onclick="app.openStudentDetailModal('${partner?.id}')" title="Click to view partner profile">${this.getStudentDisplayName(partner)}</span>`;
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
        connectionLevel = translations.level_great_connections || "Great Connections! 🌟";
        levelBadgeColor = "rgba(245, 158, 11, 0.15)";
        levelTextColor = "#fbbf24";
        levelBorderColor = "rgba(245, 158, 11, 0.25)";
      } else if (msgCount >= 3) {
        connectionLevel = translations.level_chatty_friends || "Chatty Friends! 💬";
        levelBadgeColor = "rgba(59, 130, 246, 0.15)";
        levelTextColor = "#60a5fa";
        levelBorderColor = "rgba(59, 130, 246, 0.25)";
      }

      // Retrieve unread count for this match
      const unreadCount = window.db.getMessages().filter(m => m.matchId === matches[0].id && m.senderId !== student.id && !m.read).length;
      let finalSendMsgText = sendMsgBtnText;
      if (unreadCount > 0) {
        finalSendMsgText = `${sendMsgBtnText} <span class="badge badge-danger alert-pulse" style="font-size: 0.72rem; padding: 0.15rem 0.35rem; border-radius: 10px; margin-left: 0.5rem; line-height: 1; display: inline-flex; align-items: center; justify-content: center;">${unreadCount}</span>`;
      }

      welcomeContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 0.5rem;">
          <div style="display: flex; gap: 0.75rem; align-items: center;">
            <div class="user-avatar" style="width: 36px; height: 36px; font-size: 0.9rem; font-weight: 700; cursor: pointer;" onclick="app.openStudentDetailModal('${partner?.id}')" title="Click to view partner profile">
              ${partner?.name.split(' ').map(n => n[0]).join('') || '?'}
            </div>
            <div style="min-width: 0; flex-grow: 1;">
              <h4 style="font-size: 0.9rem; font-weight: 700; margin: 0; color: var(--text-color); cursor: pointer;" onclick="app.openStudentDetailModal('${partner?.id}')">${partner?.name}</h4>
              <div style="display: flex; align-items: center; gap: 0.3rem; font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.15rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${this.getSchoolFlag(school?.country)} <span class="clickable-school-link" onclick="app.openSchoolDetail('${school?.id}')" style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${school ? school.name : 'Unknown School'}</span>
              </div>
            </div>
          </div>
          <button class="btn btn-primary btn-small w-full" style="justify-content: center; display: flex; align-items: center; margin-top: 0.25rem;" onclick="app.switchTab('stud-chat')">${finalSendMsgText}</button>
        </div>
      `;
    } else {
      badge.className = "badge badge-warning";
      badge.textContent = translations.awaiting_match_status || "Awaiting Match";
      
      const noMatchTitle = translations.welcome_title_unmatched || "You don't have a pen pal match yet!";
      const noMatchDesc = translations.welcome_desc_unmatched || "Your languages teacher will match you with a student from a partner school shortly.";
      const writeArtBtnText = translations.write_article_btn || "Write a Culture Article";

      welcomeContainer.innerHTML = `
        <div style="margin-top: 0.5rem;">
          <h4 style="font-size: 0.9rem; font-weight: 700; color: var(--text-color); margin: 0;">${noMatchTitle}</h4>
          <p style="color: var(--text-secondary); font-size: 0.75rem; margin-top: 0.25rem; line-height: 1.35;">${noMatchDesc}</p>
        </div>
      `;
    }

    // News Feed rendering (specific to student's school, posted by their teacher)
    const newsContainer = document.getElementById('student-news-feed');
    const news = window.db.getNews().filter(n => n.schoolId === student.schoolId);
    
    newsContainer.innerHTML = '';
    news.forEach(item => {
      const card = document.createElement('div');
      card.className = 'panel news-card';
      card.style.padding = '1rem';
      card.style.background = 'rgba(255,255,255,0.01)';
      card.style.border = '1px solid var(--panel-border)';
      
      // Look up if this news item is for an article or project and has a photo
      let photoHtml = '';
      if (item.title.startsWith('Published: ')) {
        const artTitle = item.title.replace('Published: ', '').trim();
        const art = window.db.getArticles().find(a => a.title === artTitle);
        if (art && art.photoUrl) {
          photoHtml = `<img src="${art.photoUrl}" alt="${art.title} image" style="width: 100%; height: 140px; object-fit: cover; border-radius: 8px; margin-bottom: 0.75rem;">`;
        }
      } else if (item.title.startsWith('Project Published: ')) {
        const projTitle = item.title.replace('Project Published: ', '').trim();
        const proj = window.db.getProjects().find(p => p.title === projTitle);
        if (proj && proj.slides && proj.slides[0] && proj.slides[0].photoUrl) {
          photoHtml = `<img src="${proj.slides[0].photoUrl}" alt="${proj.title} image" style="width: 100%; height: 140px; object-fit: cover; border-radius: 8px; margin-bottom: 0.75rem;">`;
        }
      }

      const translations = window.translator.UI_TRANSLATIONS[this.interfaceLang];
      const byAuthorText = translations.by_author || "By";
      card.innerHTML = `
        ${photoHtml}
        <h4 style="font-weight: 700; font-size: 1rem; margin-bottom: 0.25rem;">${item.title}</h4>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">${item.content}</p>
        <div class="news-card-meta">
          <span>${byAuthorText}: ${this.formatTeacherName(item.postedBy)}</span>
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
        if (art.status === 'Approved') statusBadge = `<span class="badge badge-success">${this.translate('approved_status', 'Approved')}</span>`;
        else if (art.status === 'Pending') statusBadge = `<span class="badge badge-warning">${this.translate('pending_status', 'Pending')}</span>`;
        else statusBadge = `<span class="badge badge-danger">${this.translate('rejected_status', 'Rejected')}</span>`;

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

    // Render the recent 5 approved articles from connected schools (including own school)
    const dbDiscoveriesContainer = document.getElementById('student-dashboard-recent-discoveries-list');
    if (dbDiscoveriesContainer) {
      const connections = window.db.getSchoolConnections().filter(c => 
        c.status === 'Connected' && (c.fromSchoolId === student.schoolId || c.toSchoolId === student.schoolId)
      );
      const linkedSchoolIds = [student.schoolId, ...connections.map(c => c.fromSchoolId === student.schoolId ? c.toSchoolId : c.fromSchoolId)];

      // Query approved articles written by others in linked schools
      const recentArticles = window.db.getArticles().filter(a => 
        a.status === 'Approved' && 
        a.authorId !== student.id && 
        linkedSchoolIds.includes(a.schoolId)
      );

      // Sort by date descending and slice top 5
      const sortedRecent = [...recentArticles].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)).slice(0, 5);

      dbDiscoveriesContainer.innerHTML = '';
      if (sortedRecent.length === 0) {
        const noRecentText = this.interfaceLang === 'de' ? 'Keine neuen Beiträge vorhanden.' : 'No recent articles available.';
        dbDiscoveriesContainer.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 1.5rem; border: 1px dashed var(--panel-border); border-radius: 8px;">${noRecentText}</p>`;
      } else {
        sortedRecent.forEach(art => {
          const item = document.createElement('div');
          item.style.padding = '0.75rem';
          item.style.background = 'rgba(255,255,255,0.02)';
          item.style.border = '1px solid var(--panel-border)';
          item.style.borderRadius = '8px';
          item.style.display = 'flex';
          item.style.alignItems = 'center';
          item.style.gap = '0.75rem';
          item.style.cursor = 'pointer';
          item.className = 'dashboard-article-item';
          item.title = 'Click to read article';
          item.addEventListener('click', () => this.openStudentArticleDetail(art.id));

          const school = window.db.getSchool(art.schoolId);
          const flag = this.getSchoolFlag(school?.country);

          const photoHtml = art.photoUrl
            ? `<img src="${art.photoUrl}" alt="Article thumb" style="width: 42px; height: 42px; object-fit: cover; border-radius: 6px; flex-shrink: 0;">`
            : '<div style="width: 42px; height: 42px; background: rgba(0,0,0,0.15); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0; color: var(--text-muted);">📷</div>';

          item.innerHTML = `
            ${photoHtml}
            <div style="min-width: 0; flex-grow: 1;">
              <h5 style="font-size: 0.85rem; font-weight: 600; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-color);">${art.title}</h5>
              <div style="display: flex; align-items: center; gap: 0.3rem; font-size: 0.7rem; color: var(--text-muted); margin-top: 0.15rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${flag} <span style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${school ? school.name : 'Unknown School'}</span>
              </div>
            </div>
            <div style="font-size: 1rem; flex-shrink: 0;">➡️</div>
          `;
          dbDiscoveriesContainer.appendChild(item);
        });
      }
    }

    // Render staff notices/messages
    const noticesContainer = document.getElementById('student-staff-notices');
    if (noticesContainer) {
      const allMsgs = window.db.getStaffStudentMessages();
      const notices = allMsgs.filter(m => m.recipientId === student.id);
      const translations = window.translator.UI_TRANSLATIONS[this.interfaceLang] || window.translator.UI_TRANSLATIONS['en'];
      
      // Auto-mark unread messages as Read when displayed (unless they require agreement, which requires click)
      let changed = false;
      notices.forEach(notice => {
        if (notice.status === 'Unread' && !notice.requireAgreement) {
          notice.status = 'Read';
          changed = true;
        }
      });
      if (changed) {
        window.db.saveTable('staffStudentMessages', allMsgs);
      }

      noticesContainer.innerHTML = '';
      if (notices.length === 0) {
        noticesContainer.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 1.5rem; border: 1px dashed var(--panel-border); border-radius: 8px;">${translations.no_staff_notices || 'No staff messages received.'}</p>`;
      } else {
        const sortedNotices = [...notices].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        sortedNotices.forEach(notice => {
          const item = document.createElement('div');
          item.style.padding = '0.75rem';
          item.style.borderRadius = '8px';
          item.style.display = 'flex';
          item.style.flexDirection = 'column';
          item.style.gap = '0.35rem';
          item.style.fontSize = '0.85rem';
          
          let borderStyle = '1px solid var(--panel-border)';
          let bgStyle = 'rgba(255,255,255,0.01)';
          let statusBadgeHtml = '';

          if (notice.requireAgreement) {
            if (notice.status === 'Agreed') {
              statusBadgeHtml = `<span class="badge badge-success" style="font-size: 0.65rem; font-weight: 700; margin-left: auto;">${translations.agreed_badge || 'Read & Agreed'}</span>`;
            } else {
              borderStyle = '1px solid var(--warning)';
              bgStyle = 'rgba(245, 158, 11, 0.03)';
              statusBadgeHtml = `
                <span class="badge badge-warning" style="font-size: 0.65rem; font-weight: 700; margin-left: auto;">${translations.action_required_badge || 'Action Required'}</span>
                <button class="btn btn-primary btn-small" style="margin-top: 0.4rem; padding: 0.2rem 0.5rem; font-size: 0.75rem; font-weight: 600; width: fit-content;" onclick="app.agreeToStaffMessage('${notice.id}')">${translations.agree_btn || 'I Read & Agree'}</button>
              `;
            }
          } else {
            statusBadgeHtml = `<span class="badge badge-info" style="font-size: 0.65rem; font-weight: 700; margin-left: auto;">${translations.notice_badge || 'Notice'}</span>`;
          }

          item.style.border = borderStyle;
          item.style.background = bgStyle;

          item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; border-bottom: 1px dashed var(--panel-border); padding-bottom: 0.25rem;">
              <strong style="color: var(--secondary); font-size: 0.8rem;">${translations.from_label || 'From'}: ${this.formatTeacherName(notice.senderName)}</strong>
              <span style="font-size: 0.7rem; color: var(--text-muted);">${new Date(notice.timestamp).toLocaleString()}</span>
            </div>
            <p style="margin: 0.25rem 0; line-height: 1.4; color: var(--text-secondary); text-align: justify;">${notice.text}</p>
            <div style="display: flex; align-items: center; margin-top: 0.15rem; width: 100%;">
              ${statusBadgeHtml}
            </div>
          `;
          noticesContainer.appendChild(item);
        });
      }
    }

    // Render partner schools card
    const partnerSchoolsContainer = document.getElementById('student-dashboard-partner-schools-list');
    if (partnerSchoolsContainer) {
      const partnerSchools = window.db.getSchools().filter(s => s.id !== student.schoolId);
      partnerSchoolsContainer.innerHTML = '';
      if (partnerSchools.length === 0) {
        partnerSchoolsContainer.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 1rem;">${this.translate('no_partner_schools', 'No partner schools connected yet.')}</p>`;
      } else {
        partnerSchools.forEach(sch => {
          const item = document.createElement('div');
          item.style.padding = '0.65rem';
          item.style.background = 'rgba(255,255,255,0.015)';
          item.style.border = '1px solid var(--panel-border)';
          item.style.borderRadius = '8px';
          item.style.display = 'flex';
          item.style.justifyContent = 'space-between';
          item.style.alignItems = 'center';
          item.style.cursor = 'pointer';
          item.style.transition = 'all 0.2s';
          item.addEventListener('mouseenter', () => item.style.background = 'rgba(255,255,255,0.04)');
          item.addEventListener('mouseleave', () => item.style.background = 'rgba(255,255,255,0.015)');
          item.addEventListener('click', () => this.openSchoolDetail(sch.id));

          item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              ${this.getSchoolFlag(sch.country)}
              <strong style="font-size: 0.75rem; color: var(--text-primary); text-decoration: underline;">${sch.name}</strong>
            </div>
            <span style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600;">${sch.city}</span>
          `;
          partnerSchoolsContainer.appendChild(item);
        });
      }
    }
  }

  // Student agrees to a direct message from staff
  agreeToStaffMessage(messageId) {
    const list = window.db.getStaffStudentMessages();
    const idx = list.findIndex(m => m.id === messageId);
    if (idx !== -1) {
      list[idx].status = 'Agreed';
      list[idx].agreedAt = new Date().toISOString();
      window.db.saveTable('staffStudentMessages', list);
      
      const student = window.db.getStudent(list[idx].recipientId);
      const studentName = student ? student.name : 'Student';
      window.db.addLog('Staff Notice Agreed', `Student ${studentName} agreed to notice: "${list[idx].text.substring(0, 30)}..."`, studentName);
      
      alert('Thank you! Your confirmation has been registered and your teacher has been notified.');
      this.refreshUI();
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
        statusBanner.textContent = this.translate('biography_pending_review', '⏳ Biography pending teacher review. Partners will not see edits until approved.');
      } else if (student.personalBiogStatus === 'Approved') {
        statusBanner.style.display = 'block';
        statusBanner.style.padding = '0.5rem 0.75rem';
        statusBanner.style.borderRadius = '6px';
        statusBanner.style.background = 'rgba(16, 185, 129, 0.1)';
        statusBanner.style.border = '1px solid rgba(16, 185, 129, 0.2)';
        statusBanner.style.color = '#34d399';
        statusBanner.textContent = this.translate('biography_approved', '✅ Biography approved and visible to your connection.');
      } else if (student.personalBiogStatus === 'Rejected') {
        statusBanner.style.display = 'block';
        statusBanner.style.padding = '0.5rem 0.75rem';
        statusBanner.style.borderRadius = '6px';
        statusBanner.style.background = 'rgba(239, 68, 68, 0.1)';
        statusBanner.style.border = '1px solid rgba(239, 68, 68, 0.2)';
        statusBanner.style.color = '#f87171';
        statusBanner.textContent = this.translate('biography_declined', '❌ Biography declined by teacher. Please revise and resubmit.');
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
    alert(this.translate('bio_submitted_alert', 'Biography submitted successfully for teacher review.'));
    this.refreshUI();
  }

  // Renders Student Chat messaging panels
  renderStudentChat() {
    const student = window.db.getStudent(this.currentStudentId);
    if (!student) return;

    const chatListContainer = document.getElementById('student-chat-list');
    const chatEmptyState = document.getElementById('chat-empty-state');
    const chatActiveState = document.getElementById('chat-active-state');

    if (!chatListContainer || !chatEmptyState || !chatActiveState) return;

    // Get matches for this student
    const activeMatches = window.db.getMatches().filter(m => m.active && m.studentIds.includes(student.id));

    // Clear sidebar list
    chatListContainer.innerHTML = '';

    // Set default active view to first match if none selected
    if (!this.activeMatchId || this.activeMatchId === 'discoveries_board') {
      this.activeMatchId = activeMatches[0]?.id || null;
    }

    // Auto-mark unread messages as read for active match
    if (this.activeMatchId) {
      const allMsgs = window.db.getMessages();
      let changed = false;
      allMsgs.forEach(m => {
        if (m.matchId === this.activeMatchId && m.senderId !== student.id && !m.read) {
          m.read = true;
          changed = true;
        }
      });
      if (changed) {
        window.db.saveTable('messages', allMsgs);
        this.updateStudentUnreadBadge();
      }
    }

    // 2. Render matched penpals in sidebar list
    if (activeMatches.length === 0) {
      const emptyNote = document.createElement('p');
      emptyNote.style.fontSize = '0.8rem';
      emptyNote.style.color = 'var(--text-muted)';
      emptyNote.style.padding = '1rem';
      emptyNote.style.textAlign = 'center';
      emptyNote.textContent = this.translate('no_matched_pen_pals', 'No active connections yet.');
      chatListContainer.appendChild(emptyNote);
    } else {
      activeMatches.forEach(match => {
        const partnerId = match.studentIds.find(id => id !== student.id);
        const partner = window.db.getStudent(partnerId);
        const partnerName = this.getStudentDisplayName(partner);
        const messages = window.db.getMessages().filter(m => m.matchId === match.id);
        const lastMsg = messages[messages.length - 1];
        const matchUnreadCount = messages.filter(m => m.senderId !== student.id && !m.read).length;

        const item = document.createElement('div');
        item.className = `chat-item ${this.activeMatchId === match.id ? 'active' : ''}`;
        
        let badgeStatus = '';
        if (match.paused) {
          badgeStatus = `<span class="badge badge-danger btn-small" style="font-size: 0.6rem; padding: 0.1rem 0.35rem;">${this.translate('paused_status', 'Paused')}</span>`;
        } else if (matchUnreadCount > 0) {
          badgeStatus = `<span class="badge badge-danger alert-pulse" style="font-size: 0.6rem; padding: 0.1rem 0.35rem; border-radius: 10px; line-height: 1;">${matchUnreadCount}</span>`;
        }

        const partnerSchool = partner ? window.db.getSchool(partner.schoolId) : null;
        const flag = partnerSchool ? this.getSchoolFlag(partnerSchool.country) : '';
        item.innerHTML = `
          <div class="user-avatar" style="width: 32px; height: 32px; font-size: 0.8rem;">
            ${partnerName.split(' ').map(n => n[0]).join('') || '?'}
          </div>
          <div class="chat-item-meta">
            <div class="chat-item-name" style="display: flex; align-items: center; gap: 0.25rem;">
              <span>${flag} ${partnerName}</span>
              ${badgeStatus}
            </div>
            <div class="chat-item-preview">${lastMsg ? lastMsg.text : this.translate('start_chatting_placeholder', 'Start chatting...')}</div>
          </div>
        `;

        item.addEventListener('click', () => {
          this.activeMatchId = match.id;
          this.renderStudentChat();
        });

        chatListContainer.appendChild(item);
      });
    }

    // 3. Render appropriate main view
    // Render active chat
    const currentMatch = activeMatches.find(m => m.id === this.activeMatchId);
    if (currentMatch) {
      chatEmptyState.style.display = 'none';
      chatActiveState.style.display = 'flex';

      const partnerId = currentMatch.studentIds.find(id => id !== student.id);
      const partner = window.db.getStudent(partnerId);
      const partnerSchool = window.db.getSchool(partner?.schoolId);
      const partnerName = this.getStudentDisplayName(partner);

      const partnerFlag = partnerSchool ? this.getSchoolFlag(partnerSchool.country) : '';
      document.getElementById('chat-partner-avatar').textContent = partnerName.split(' ').map(n => n[0]).join('') || '?';
      document.getElementById('chat-partner-name').innerHTML = `<span style="display: inline-flex; align-items: center; gap: 0.35rem;">${partnerFlag} <span>${partnerName}</span></span>`;
      document.getElementById('chat-partner-school').textContent = `${partnerSchool?.name} • ${partnerSchool?.country}`;

      // Paused Banner and composing settings
      const safetyBanner = document.getElementById('chat-safety-banner');
      const composeArea = document.getElementById('chat-compose-area');
      
      const settings = window.db.getSettings();
      const translationEnabled = settings.translationEnabled !== false;

      const translationBar = composeArea ? composeArea.querySelector('.translation-bar') : null;
      const toggleAssistantBtn = document.getElementById('toggle-assistant-btn');
      const assistantPanel = document.getElementById('student-language-widget-panel');
      if (translationBar) translationBar.style.display = translationEnabled ? 'flex' : 'none';
      if (toggleAssistantBtn) toggleAssistantBtn.style.display = translationEnabled ? 'inline-block' : 'none';
      if (!translationEnabled && assistantPanel) assistantPanel.style.display = 'none';

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
        document.getElementById('translate-compose-btn').disabled = this.autoTranslateEnabled;
      }

      // Configure auto-translate initial UI state
      const autoToggle = document.getElementById('auto-translate-toggle');
      if (autoToggle) {
        autoToggle.checked = this.autoTranslateEnabled;
      }
      const translateBtn = document.getElementById('translate-compose-btn');
      if (translateBtn) {
        const isButtonDisabled = this.autoTranslateEnabled || currentMatch.paused;
        translateBtn.disabled = isButtonDisabled;
        translateBtn.style.opacity = isButtonDisabled ? '0.4' : '1';
        translateBtn.style.cursor = isButtonDisabled ? 'not-allowed' : 'pointer';
      }

      // Populate Message Feed bubbles
      const feed = document.getElementById('chat-message-feed');
      if (feed) feed.innerHTML = '';
      
      const messages = window.db.getMessages().filter(m => m.matchId === currentMatch.id);
      messages.forEach(msg => {
        const row = document.createElement('div');
        const isSent = msg.senderId === student.id;
        row.className = `message-row ${isSent ? 'sent' : 'received'}`;
        
        let transRow = '';
        if (msg.translation && translationEnabled && this.autoTranslateEnabled) {
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
    } else {
      chatEmptyState.style.display = 'flex';
      chatActiveState.style.display = 'none';
    }
  }

  renderDiscoveriesBoard(student) {
    const container = document.getElementById('new-discoveries-board-container');
    if (!container) return;

    // Get linked schools: own school + formally connected schools
    const connections = window.db.getSchoolConnections().filter(c => 
      c.status === 'Connected' && (c.fromSchoolId === student.schoolId || c.toSchoolId === student.schoolId)
    );
    const linkedSchoolIds = [student.schoolId, ...connections.map(c => c.fromSchoolId === student.schoolId ? c.toSchoolId : c.fromSchoolId)];

    // Get approved articles from linked schools
    const approvedArticles = window.db.getArticles().filter(a => a.status === 'Approved' && linkedSchoolIds.includes(a.schoolId));
    
    // Get published projects from linked schools
    const publishedProjects = window.db.getProjects().filter(p => p.status === 'Published' && (linkedSchoolIds.includes(p.creatorSchoolId) || linkedSchoolIds.includes(p.targetSchoolId)));

    // Combine articles and projects
    const combinedDiscoveries = [
      ...approvedArticles.map(art => ({
        ...art,
        feedType: 'article',
        date: art.submittedAt
      })),
      ...publishedProjects.map(proj => ({
        ...proj,
        feedType: 'project',
        date: proj.createdAt || proj.timestamp || new Date().toISOString()
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (combinedDiscoveries.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 3rem; font-size: 0.9rem;">
          <span style="font-size: 2.5rem; display: block; margin-bottom: 0.75rem;">📖</span>
          No cultural articles or group projects published from your linked schools yet.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem;">
        ${combinedDiscoveries.map(item => {
          if (item.feedType === 'article') {
            const art = item;
            const school = window.db.getSchool(art.schoolId);
            let authorName = '';
            if (art.authorType === 'staff') {
              const staffObj = window.db.getCoordinators().find(c => c.id === art.authorId);
              authorName = staffObj ? `${staffObj.name} (${this.translate('staff_label', 'Staff')})` : this.translate('unknown_staff_author', 'Staff Member');
            } else {
              const author = window.db.getStudent(art.authorId);
              authorName = this.getStudentDisplayName(author);
            }
            const schoolFlag = this.getSchoolFlag(school?.country);
            const dateStr = new Date(art.submittedAt).toLocaleDateString();
            const photoHtml = art.photoUrl
              ? `<img src="${art.photoUrl}" alt="${art.title} photo" style="width: 100%; height: 110px; object-fit: cover; border-top-left-radius: 12px; border-top-right-radius: 12px;">`
              : `<div style="width: 100%; height: 110px; background: rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: var(--text-muted); border-top-left-radius: 12px; border-top-right-radius: 12px;">📷</div>`;

            return `
              <div class="panel article-board-card" style="display: flex; flex-direction: column; background: rgba(255,255,255,0.015); border: 1px solid var(--panel-border); border-radius: 12px; overflow: hidden; height: 100%; cursor: pointer;" onclick="app.openStudentArticleDetail('${art.id}')">
                ${photoHtml}
                <div style="padding: 0.85rem; display: flex; flex-direction: column; flex-grow: 1; justify-content: space-between; gap: 0.6rem;">
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                      <span class="badge badge-success" style="font-size: 0.65rem; padding: 0.15rem 0.4rem; background: rgba(16, 185, 129, 0.15); border: 1px solid var(--success); color: var(--success); border-radius: 4px; font-weight: 700;">🟢 Article</span>
                    </div>
                    <h4 style="font-weight: 700; font-size: 0.95rem; margin: 0 0 0.25rem 0; color: var(--text-primary); line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${art.title}">${art.title}</h4>
                    <div style="display: flex; align-items: center; gap: 0.3rem; font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.5rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      ${schoolFlag} <span style="text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${school?.name || 'Unknown School'}">${school?.name || 'Unknown School'}</span> • <span title="${authorName}">${authorName}</span>
                    </div>
                    <p style="font-size: 0.78rem; line-height: 1.45; color: var(--text-secondary); margin: 0; text-align: justify; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                      ${art.content}
                    </p>
                  </div>
                  
                  <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--panel-border); padding-top: 0.5rem; margin-top: 0.4rem;" onclick="event.stopPropagation()">
                    <span style="font-size: 0.65rem; color: var(--text-muted);">${dateStr}</span>
                    <div style="display: flex; gap: 0.4rem; align-items: center;">
                      <button class="btn btn-secondary btn-small" onclick="app.likeArticleFromBoard('${art.id}')" style="display: flex; align-items: center; gap: 0.2rem; padding: 0.2rem 0.4rem; font-size: 0.7rem; border-radius: 6px; font-weight: 600;">
                        ❤️ <span>${art.likes || 0}</span>
                      </button>
                      <button class="btn btn-primary btn-small" onclick="app.openStudentArticleDetail('${art.id}')" style="padding: 0.2rem 0.45rem; font-size: 0.7rem; border-radius: 6px; font-weight: 600;">${this.translate('read_full_btn', 'Read Full')}</button>
                    </div>
                  </div>
                </div>
              </div>
            `;
          } else {
            const proj = item;
            const slides = proj.slides || [];
            const slideIndex = this.projectCardSlideIndices[proj.id] || 0;
            const currentSlide = slides[slideIndex];
            
            const creatorSchool = window.db.getSchool(proj.creatorSchoolId);
            const targetSchool = window.db.getSchool(proj.targetSchoolId);
            
            const creatorFlag = creatorSchool ? this.getSchoolFlag(creatorSchool.country) : '';
            const targetFlag = targetSchool ? this.getSchoolFlag(targetSchool.country) : '';

            let miniCarouselHtml = '';
            if (currentSlide) {
              const slideAuthorStudent = window.db.getStudents().find(st => st.name.trim().toLowerCase() === (currentSlide.author || '').trim().toLowerCase());
              const slideAuthorCountry = slideAuthorStudent ? window.db.getSchool(slideAuthorStudent.schoolId)?.country : undefined;
              const slideFlag = slideAuthorCountry ? this.getSchoolFlag(slideAuthorCountry) : '';

              miniCarouselHtml = `
                <div class="mini-carousel-container" style="position: relative; width: 100%; height: 130px; background: #0b0f19; border-radius: 10px; overflow: hidden; border: 1px solid var(--panel-border); margin-bottom: 0.6rem; display: flex; flex-direction: column; justify-content: space-between; padding: 0.65rem;" onclick="event.stopPropagation()">
                  ${currentSlide.photoUrl ? `
                    <div style="position: absolute; inset: 0; width: 100%; height: 100%;">
                      <img src="${currentSlide.photoUrl}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.25;" />
                    </div>
                  ` : ''}
                  
                  <div style="position: relative; z-index: 2; display: flex; flex-direction: column; justify-content: space-between; height: 100%; width: 100%;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                      <h5 style="font-size: 0.72rem; font-weight: 700; color: #fff; margin: 0; max-width: 70%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${currentSlide.title || 'Untitled Card'}
                      </h5>
                      <span style="font-size: 0.58rem; color: var(--text-secondary); font-weight: 600; background: rgba(0,0,0,0.5); padding: 0.05rem 0.25rem; border-radius: 3px;">
                        ${slideIndex + 1}/${slides.length}
                      </span>
                    </div>

                    <div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center; margin: 0.15rem 0;">
                      <p style="font-size: 0.68rem; color: #cbd5e1; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.35; font-style: italic;">
                        "${currentSlide.content || 'No content entered.'}"
                      </p>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; font-size: 0.62rem; color: var(--text-muted);">
                      <span style="display: flex; align-items: center; gap: 0.25rem;">
                        👤 ${currentSlide.author || 'Student'}
                      </span>
                      ${slideFlag}
                    </div>
                  </div>

                  <!-- Navigation controls on hover -->
                  ${slides.length > 1 ? `
                    <div class="carousel-hover-controls" style="position: absolute; inset-x: 0.35rem; top: 50%; transform: translateY(-50%); display: flex; justify-content: space-between; z-index: 10; pointer-events: none;">
                      <button onclick="app.prevCardSlide('${proj.id}', event)" ${slideIndex === 0 ? 'disabled' : ''} style="pointer-events: auto; width: 20px; height: 20px; border-radius: 50%; border: 1px solid var(--panel-border); background: rgba(0,0,0,0.85); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; cursor: ${slideIndex === 0 ? 'not-allowed' : 'pointer'}; opacity: ${slideIndex === 0 ? '0.2' : '1'};">&lt;</button>
                      <button onclick="app.nextCardSlide('${proj.id}', event)" ${slideIndex === slides.length - 1 ? 'disabled' : ''} style="pointer-events: auto; width: 20px; height: 20px; border-radius: 50%; border: 1px solid var(--panel-border); background: rgba(0,0,0,0.85); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 0.6rem; cursor: ${slideIndex === slides.length - 1 ? 'not-allowed' : 'pointer'}; opacity: ${slideIndex === slides.length - 1 ? '0.2' : '1'};">&gt;</button>
                    </div>
                  ` : ''}
                </div>
              `;
            } else {
              miniCarouselHtml = `
                <div style="width: 100%; height: 130px; background: rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: var(--text-muted); border-radius: 10px; border: 1px dashed var(--panel-border); margin-bottom: 0.6rem; font-style: italic;">
                  No slides available
                </div>
              `;
            }

            return `
              <div class="panel project-board-card" style="display: flex; flex-direction: column; background: rgba(255,255,255,0.015); border: 1px solid var(--panel-border); border-radius: 12px; overflow: hidden; height: 100%; cursor: pointer;" onclick="app.openReadOnlyProjectPreview('${proj.id}')">
                <div style="padding: 0.85rem; display: flex; flex-direction: column; flex-grow: 1; justify-content: space-between; gap: 0.5rem;">
                  <div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                      <span class="badge badge-purple" style="font-size: 0.65rem; padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 700;">🟣 Group Project</span>
                      <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 600;">${slides.length} ${slides.length === 1 ? 'Card' : 'Cards'}</span>
                    </div>

                    ${miniCarouselHtml}

                    <h4 style="font-weight: 700; font-size: 0.95rem; margin: 0 0 0.25rem 0; color: var(--text-primary); line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${proj.title}">${proj.title}</h4>
                    <p style="font-size: 0.78rem; line-height: 1.45; color: var(--text-secondary); margin: 0; text-align: justify; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                      ${proj.brief}
                    </p>
                  </div>
                  
                  <!-- Cooperating Schools Section -->
                  <div style="display: flex; flex-direction: column; gap: 0.25rem; border-top: 1px dashed var(--panel-border); padding-top: 0.5rem; margin-top: 0.35rem;" onclick="event.stopPropagation()">
                    <div style="font-size: 0.58rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.1rem;">${this.translate('cooperating_schools', 'Cooperating Schools')}</div>
                    <div style="display: flex; flex-direction: column; gap: 0.15rem;">
                      ${creatorSchool ? `
                        <div style="display: flex; align-items: center; gap: 0.25rem; font-size: 0.7rem; color: var(--text-secondary);">
                          ${creatorFlag} <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">${creatorSchool.name}</span>
                        </div>
                      ` : ''}
                      ${targetSchool ? `
                        <div style="display: flex; align-items: center; gap: 0.25rem; font-size: 0.7rem; color: var(--text-secondary);">
                          ${targetFlag} <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">${targetSchool.name}</span>
                        </div>
                      ` : ''}
                    </div>
                  </div>

                </div>
              </div>
            `;
          }
        }).join('')}
      </div>
    `;
  }

  likeArticleFromBoard(articleId) {
    const articles = window.db.getArticles();
    const art = articles.find(a => a.id === articleId);
    if (art) {
      art.likes = (art.likes || 0) + 1;
      window.db.saveTable('articles', articles);
      
      // Add Audit log
      const student = window.db.getStudent(this.currentStudentId);
      const studentName = student ? student.name : 'Student';
      window.db.addLog('Article Liked', `Student ${studentName} liked article "${art.title}".`, 'Student');
      
      if (student) this.renderDiscoveriesBoard(student);
    }
  }

  // Draft Translation button logic
  async draftTranslation() {
    const textarea = document.getElementById('chat-textarea');
    const previewSpan = document.getElementById('compose-translation-preview');
    const student = window.db.getStudent(this.currentStudentId);
    
    if (!textarea || !textarea.value.trim() || !student) return;

    const text = textarea.value.trim();
    const sourceLang = student.language;
    const targetLang = sourceLang === 'en' ? 'de' : 'en';

    previewSpan.textContent = this.interfaceLang === 'de' ? 'Übersetze...' : 'Translating...';
    previewSpan.removeAttribute('data-draft');
    previewSpan.title = '';

    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
      const response = await fetch(url);
      const data = await response.json();
      const translated = data.responseData?.translatedText || text;

      previewSpan.textContent = `Draft: ${translated}`;
      previewSpan.setAttribute('data-draft', translated);
      previewSpan.title = translated;
    } catch (err) {
      console.error("Real translation failed, falling back to mock:", err);
      const translated = window.translator.mockTranslate(text, sourceLang, targetLang);
      previewSpan.textContent = `Draft: ${translated}`;
      previewSpan.setAttribute('data-draft', translated);
      previewSpan.title = translated;
    }
  }

  // Handle auto translate (debounced)
  handleAutoTranslate() {
    if (!this.autoTranslateEnabled) return;

    const textarea = document.getElementById('chat-textarea');
    const previewSpan = document.getElementById('compose-translation-preview');
    if (!textarea || !previewSpan) return;

    if (this.autoTranslateTimeout) {
      clearTimeout(this.autoTranslateTimeout);
    }

    const text = textarea.value.trim();
    if (!text) {
      previewSpan.textContent = '';
      previewSpan.removeAttribute('data-draft');
      previewSpan.title = '';
      return;
    }

    this.autoTranslateTimeout = setTimeout(() => {
      this.draftTranslation();
    }, 800);
  }

  async draftTeacherTranslation() {
    const textarea = document.getElementById('teacher-chat-textarea');
    const previewSpan = document.getElementById('teacher-compose-translation-preview');
    const teacher = this.getLoggedTeacher();
    
    if (!textarea || !textarea.value.trim() || !teacher || !this.activeCoordinatorId) return;

    const text = textarea.value.trim();
    const ownSchool = window.db.getSchool(teacher.schoolId);
    const sourceLang = ownSchool ? (ownSchool.country.toLowerCase().includes('germany') ? 'de' : ownSchool.country.toLowerCase().includes('france') ? 'fr' : 'en') : 'en';

    const activeCoord = window.db.getCoordinators().find(c => c.id === this.activeCoordinatorId);
    const partnerSchool = activeCoord ? window.db.getSchool(activeCoord.schoolId) : null;
    const targetLang = partnerSchool ? (partnerSchool.country.toLowerCase().includes('germany') ? 'de' : partnerSchool.country.toLowerCase().includes('france') ? 'fr' : 'en') : 'en';

    if (sourceLang === targetLang) {
      previewSpan.textContent = '';
      previewSpan.removeAttribute('data-draft');
      return;
    }

    previewSpan.textContent = this.interfaceLang === 'de' ? 'Übersetze...' : 'Translating...';
    previewSpan.removeAttribute('data-draft');
    previewSpan.title = '';

    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
      const response = await fetch(url);
      const data = await response.json();
      const translated = data.responseData?.translatedText || text;

      previewSpan.textContent = `Draft: ${translated}`;
      previewSpan.setAttribute('data-draft', translated);
      previewSpan.title = translated;
    } catch (err) {
      console.error("Real translation failed, falling back to mock:", err);
      const translated = window.translator.mockTranslate(text, sourceLang, targetLang);
      previewSpan.textContent = `Draft: ${translated}`;
      previewSpan.setAttribute('data-draft', translated);
      previewSpan.title = translated;
    }
  }

  handleTeacherAutoTranslate() {
    if (!this.teacherAutoTranslateEnabled) return;

    const textarea = document.getElementById('teacher-chat-textarea');
    const previewSpan = document.getElementById('teacher-compose-translation-preview');
    if (!textarea || !previewSpan) return;

    if (this.teacherAutoTranslateTimeout) {
      clearTimeout(this.teacherAutoTranslateTimeout);
    }

    const text = textarea.value.trim();
    if (!text) {
      previewSpan.textContent = '';
      previewSpan.removeAttribute('data-draft');
      previewSpan.title = '';
      return;
    }

    this.teacherAutoTranslateTimeout = setTimeout(() => {
      this.draftTeacherTranslation();
    }, 800);
  }

  async translateCoordinatorMessageOnTheFly(msg, sourceLang, targetLang) {
    if (!this.currentlyTranslatingMsgIds) {
      this.currentlyTranslatingMsgIds = new Set();
    }
    if (this.currentlyTranslatingMsgIds.has(msg.id)) return;
    this.currentlyTranslatingMsgIds.add(msg.id);

    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(msg.text)}&langpair=${sourceLang}|${targetLang}`;
      const response = await fetch(url);
      const data = await response.json();
      const translated = data.responseData?.translatedText || msg.text;

      // Fail-safe: if the translation contains error keywords, trigger mock fallback
      if (translated.includes('INVALID') || translated.includes('LANGPAIR') || translated.includes('SUPPORTED')) {
        throw new Error("MyMemory API returned an error: " + translated);
      }

      const allMsgs = window.db.getCoordinatorMessages();
      const dbMsg = allMsgs.find(m => m.id === msg.id);
      if (dbMsg) {
        dbMsg.translation = translated;
        window.db.saveTable('coordinatorMessages', allMsgs);
        this.renderTeacherMessages();
      }
    } catch (err) {
      console.error("On-the-fly translation failed, using mock:", err);
      const translated = window.translator.mockTranslate(msg.text, sourceLang, targetLang);
      const allMsgs = window.db.getCoordinatorMessages();
      const dbMsg = allMsgs.find(m => m.id === msg.id);
      if (dbMsg) {
        dbMsg.translation = translated;
        window.db.saveTable('coordinatorMessages', allMsgs);
        this.renderTeacherMessages();
      }
    } finally {
      this.currentlyTranslatingMsgIds.delete(msg.id);
    }
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
    previewSpan.title = '';

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
    
    alert(this.translate('chat_paused_report_alert', 'Thank you for reporting this concern. Your teachers have been notified and the chat is paused until review.'));
    
    this.refreshUI();
  }

  handleReportProjectConcern(e) {
    e.preventDefault();
    const reason = document.getElementById('report-project-reason').value;
    const details = document.getElementById('report-project-details').value;
    const student = window.db.getStudent(this.currentStudentId);

    if (!this.activeProjectId || !student) return;

    // Create flag and pause project
    window.db.updateProject(this.activeProjectId, { paused: true });
    
    // Register safeguarding alert
    const flags = window.db.getFlags();
    const newFlag = {
      id: 'flag_proj_' + Date.now(),
      projectId: this.activeProjectId,
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
    window.db.addLog('Project Concern Flagged', `Student ${student.name} flagged project. Reason: ${reason}`, student.name);

    this.closeModal('report-project-concern-modal');
    document.getElementById('report-project-concern-form').reset();
    
    alert(this.translate('project_suspended_report_alert', 'Thank you for reporting this concern. Your teachers have been notified and the project workspace is suspended until review.'));
    
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

    alert(this.translate('article_submitted_alert', 'Your article has been submitted for teacher review! Once approved, it will appear on the school news feeds.'));
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
    const teacher = this.getLoggedTeacher();
    const ownSchoolId = teacher ? teacher.schoolId : null;

    const allStudents = window.db.getStudents();
    const students = ownSchoolId ? allStudents.filter(s => s.schoolId === ownSchoolId) : allStudents;
    const unmatched = students.filter(s => s.matchStatus === 'unmatched');

    const allFlags = window.db.getFlags().filter(f => f.status === 'Pending');
    const flags = ownSchoolId ? allFlags.filter(f => {
      const student = window.db.getStudent(f.studentId);
      return student && student.schoolId === ownSchoolId;
    }) : allFlags;

    const allArticles = window.db.getArticles().filter(a => a.status === 'Pending');
    const pendingArticles = ownSchoolId ? allArticles.filter(a => a.schoolId === ownSchoolId) : allArticles;
    const pendingBiogs = students.filter(s => s.personalBiogStatus === 'Pending');

    document.getElementById('stat-total-students').textContent = students.length;
    document.getElementById('stat-unmatched-students').textContent = unmatched.length;
    document.getElementById('stat-flagged-concerns').textContent = flags.length;
    document.getElementById('stat-pending-articles').textContent = pendingArticles.length + pendingBiogs.length;

    // Programmatic translations for stats card labels (cache-safe overlay)
    const statTotalLabel = document.getElementById('stat-total-students').nextElementSibling;
    if (statTotalLabel) statTotalLabel.textContent = this.translate('total_students', 'Total Students');

    const statUnmatchedLabel = document.getElementById('stat-unmatched-students').nextElementSibling;
    if (statUnmatchedLabel) statUnmatchedLabel.textContent = this.translate('unmatched_students', 'Unmatched Students');

    const statFlaggedLabel = document.getElementById('stat-flagged-concerns').nextElementSibling;
    if (statFlaggedLabel) statFlaggedLabel.textContent = this.translate('flagged_issues', 'Flagged Issues');

    const statPendingLabel = document.getElementById('stat-pending-articles').nextElementSibling;
    if (statPendingLabel) statPendingLabel.textContent = this.translate('pending_reviews', 'Pending Reviews');

    // Programmatic translations for panel headings
    const spotlightTitle = document.querySelector('#teacher-school-spotlight-panel .panel-title span');
    if (spotlightTitle) spotlightTitle.textContent = this.translate('my_school_spotlight', 'My School Spotlight');

    const editProfileBtn = document.querySelector('#teacher-school-spotlight-panel .panel-header button');
    if (editProfileBtn) editProfileBtn.textContent = this.translate('edit_profile', 'Edit Profile');

    const announcementsTitle = document.querySelector('#teacher-announcements-panel .panel-title span');
    if (announcementsTitle) announcementsTitle.textContent = this.translate('announcements_manager', 'School Announcements Manager');

    const postAnnouncementBtn = document.querySelector('#teacher-announcements-panel .panel-header button span');
    if (postAnnouncementBtn) postAnnouncementBtn.textContent = this.translate('post_announcement_btn', 'Post Announcement');

    const safetyTitle = document.querySelector('#view-teach-dashboard .news-grid .panel:nth-child(1) .panel-title span');
    if (safetyTitle) safetyTitle.textContent = this.translate('safeguarding_immediate_concerns', 'Immediate Safeguarding Concerns');
    
    const safetyBtn = document.querySelector('#view-teach-dashboard .news-grid .panel:nth-child(1) .panel-header button');
    if (safetyBtn) safetyBtn.textContent = this.translate('view_hub_btn', 'View Hub');

    const articlesTitle = document.querySelector('#view-teach-dashboard .news-grid .panel:nth-child(2) .panel-title span');
    if (articlesTitle) articlesTitle.textContent = this.translate('articles_awaiting_approval_header', 'Articles Awaiting Editorial Approval');
    
    const articlesBtn = document.querySelector('#view-teach-dashboard .news-grid .panel:nth-child(2) .panel-header button');
    if (articlesBtn) articlesBtn.textContent = this.translate('view_desk_btn', 'View desk');

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
      safeguardTeaser.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 1rem;">${this.translate('dashboard_no_safety_concerns', 'No safety concerns pending review.')}</p>`;
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
            <h5 style="font-size: 0.85rem; font-weight: 600; color: #f87171;">${this.translate('dashboard_flagged_alert_from', 'Flagged Alert from')} ${sender ? sender.name : flag.reportedBy || this.translate('student_label_default', 'Student')}</h5>
            <p style="font-size: 0.75rem; color: var(--text-secondary); max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">"${msg ? msg.text : flag.reason}"</p>
          </div>
          <button class="btn btn-danger btn-small" onclick="app.switchTab('teach-safeguarding')">${this.translate('review_btn', 'Review')}</button>
        `;
        safeguardTeaser.appendChild(item);
      });
    }

    const articlesTeaser = document.getElementById('teacher-articles-teaser');
    articlesTeaser.innerHTML = '';
    
    if (pendingArticles.length === 0) {
      articlesTeaser.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 1rem;">${this.translate('dashboard_no_articles_review', 'No articles awaiting review.')}</p>`;
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
            <span style="font-size: 0.75rem; color: var(--text-secondary);">${this.translate('by_author', 'By')} ${author ? author.name : this.translate('student_label_default', 'Student')}</span>
          </div>
          <button class="btn btn-secondary btn-small" onclick="app.switchTab('teach-editor')">${this.translate('approve_desk_btn', 'Approve Desk')}</button>
        `;
        articlesTeaser.appendChild(item);
      });
    }
    
    this.renderTeacherSchoolSpotlight();
    this.renderTeacherAnnouncements();
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
      : `<div style="height: 150px; background: rgba(0,0,0,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--text-muted);">${this.translate('no_campus_photo', 'No campus photo added')}</div>`;

    const leftCol = `
      <div style="display: flex; flex-direction: column;">
        ${photoHtml}
        <div style="display: flex; align-items: center; gap: 0.75rem; margin-top: 0.5rem;">
          ${logoHtml}
          <div>
            <h4 style="font-weight: 700; font-size: 1.1rem; margin: 0; line-height: 1.2;">
              <span style="cursor: pointer; text-decoration: underline; color: var(--secondary);" onclick="app.openSchoolDetail('${school.id}')">${school.name}</span>
            </h4>
            <span style="font-size: 0.8rem; color: var(--text-secondary);">${this.translate(school.city.toLowerCase(), school.city)}, ${this.translate(school.country.toLowerCase(), school.country)}</span>
          </div>
        </div>
        <p style="font-size: 0.85rem; line-height: 1.5; color: var(--text-secondary); margin-top: 0.75rem; text-align: justify;">
          ${this.translate(school.id + '_desc', school.description) || this.translate('no_school_description', 'No school description set yet.')}
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
          <h5 style="margin: 0; font-weight: 600;">${this.translate('no_linked_partners', 'No Linked Partner Schools')}</h5>
          <p style="font-size: 0.75rem; margin-top: 0.25rem;">${this.translate('propose_matches_desc', 'Propose matches with other schools in the matching center.')}</p>
        </div>
      `;
    } else {
      linksHtml = `
        <div style="display: flex; flex-direction: column; gap: 1rem; height: 100%;">
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 0.25rem; border-bottom: 1px solid var(--panel-border); padding-bottom: 0.5rem;">
            ${this.translate('active_partnerships', 'Active Partnerships')} (${linkedSchools.length})
          </h4>
          <div style="display: flex; flex-direction: column; gap: 0.75rem; overflow-y: auto; max-height: 240px;">
            ${linkedSchools.map(item => {
              const partnerLogo = item.school.logoUrl 
                ? `<img src="${item.school.logoUrl}" alt="${item.school.name} logo" style="height: 36px; width: 36px; object-fit: contain; border-radius: 4px;">` 
                : '<div style="height: 36px; width: 36px; background: rgba(255,255,255,0.05); border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;">🏫</div>';
              
              const linkedLabel = this.translate('linked_students_badge', 'Linked Student(s)');
              const activeLabel = this.translate('active_link_badge', 'Active Link');

              return `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; background: rgba(255,255,255,0.02); border: 1px solid var(--panel-border); border-radius: 12px; transition: all 0.2s;">
                  <div style="display: flex; align-items: center; gap: 0.75rem;">
                    ${partnerLogo}
                    <div>
                      <h5 style="font-weight: 700; font-size: 0.9rem; margin: 0;">
                        <span style="cursor: pointer; text-decoration: underline; color: var(--secondary);" onclick="app.openSchoolDetail('${item.school.id}')">${item.school.name}</span>
                      </h5>
                      <span style="font-size: 0.75rem; color: var(--text-muted);">${this.translate(item.school.city.toLowerCase(), item.school.city)}, ${this.translate(item.school.country.toLowerCase(), item.school.country)}</span>
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span class="badge badge-info">${item.count} ${linkedLabel}</span>
                    <span class="badge badge-success" style="font-size: 0.65rem;">${activeLabel}</span>
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

  switchStudentsSubtab(subTab) {
    this.studentsSubTab = subTab;
    this.renderStudentRoster();
  }

  // Renders teacher list of students
  renderStudentRoster() {
    // Default subtab if not set
    if (!this.studentsSubTab) {
      this.studentsSubTab = 'roster';
    }

    const subtabRoster = document.getElementById('subtab-btn-students-roster');
    const subtabAnnouncements = document.getElementById('subtab-btn-students-announcements');
    const rosterView = document.getElementById('students-roster-subview');
    const announcementsView = document.getElementById('students-announcements-subview');

    if (subtabRoster && subtabAnnouncements && rosterView && announcementsView) {
      if (this.studentsSubTab === 'roster') {
        subtabRoster.classList.add('active');
        subtabAnnouncements.classList.remove('active');
        rosterView.style.display = 'block';
        announcementsView.style.display = 'none';
      } else {
        subtabRoster.classList.remove('active');
        subtabAnnouncements.classList.add('active');
        rosterView.style.display = 'none';
        announcementsView.style.display = 'block';
      }
    }

    // Reset selection list on re-render to prevent off-screen stale selections
    this.selectedRosterStudentIds = [];
    const masterCheckbox = document.getElementById('roster-select-all');
    if (masterCheckbox) {
      masterCheckbox.checked = false;
      masterCheckbox.indeterminate = false;
    }
    this.updateRosterSelectionUI();

    const tbody = document.getElementById('student-roster-tbody');
    const teacher = this.getLoggedTeacher();
    const schoolId = teacher ? teacher.schoolId : 'school_1';
    const students = window.db.getStudents().filter(s => s.schoolId === schoolId).sort((a, b) => {
      const aUnmatched = a.matchStatus === 'unmatched';
      const bUnmatched = b.matchStatus === 'unmatched';
      if (aUnmatched && !bUnmatched) return -1;
      if (!aUnmatched && bUnmatched) return 1;
      return a.name.localeCompare(b.name);
    });
    
    tbody.innerHTML = '';
    students.forEach(stud => {
      const school = window.db.getSchool(stud.schoolId);
      
      let statusBadge = '';
      if (stud.matchStatus === 'matched') {
        const myActiveMatches = window.db.getMatches().filter(m => m.active && m.studentIds.includes(stud.id));
        const count = myActiveMatches.length;
        const partnerNamesList = myActiveMatches.map(m => {
          const partnerId = m.studentIds.find(id => id !== stud.id);
          const partner = window.db.getStudent(partnerId || '');
          if (!partner) return '';
          const partnerSchool = window.db.getSchool(partner.schoolId);
          let emojiFlag = '🏫';
          if (partnerSchool) {
            const c = partnerSchool.country.toLowerCase();
            if (c.includes('germany') || c.includes('deutschland')) emojiFlag = '🇩🇪';
            else if (c.includes('united kingdom') || c.includes('uk') || c.includes('britain') || c.includes('england')) emojiFlag = '🇬🇧';
            else if (c.includes('france')) emojiFlag = '🇫🇷';
            else if (c.includes('spain')) emojiFlag = '🇪🇸';
            else if (c.includes('italy')) emojiFlag = '🇮🇹';
            else if (c.includes('united states') || c.includes('us')) emojiFlag = '🇺🇸';
            else if (c.includes('canada')) emojiFlag = '🇨🇦';
          }
          const firstName = partner.name.split(' ')[0];
          return `${emojiFlag} ${firstName}`;
        }).filter(name => name !== '');
        const tooltipText = partnerNamesList.length > 0 ? `${this.translate('matched_status_badge', 'Matched')} with: ${partnerNamesList.join(', ')}` : '';
        statusBadge = `<span class="badge badge-success" title="${tooltipText}" style="cursor: help;">${count} ${count === 1 ? this.translate('match_label', 'Match') : this.translate('matches_label', 'Matches')}</span>`;
      } else {
        statusBadge = `<span class="badge badge-warning">${this.translate('unmatched_status_badge', 'Unmatched')}</span>`;
      }

      let activeBadge = '';
      if (stud.invitationStatus === 'Active') activeBadge = `<span class="badge badge-success">${this.translate('active_status', 'Active')}</span>`;
      else if (stud.invitationStatus === 'Archived') activeBadge = `<span class="badge badge-danger">${this.translate('archived_status', 'Archived')}</span>`;
      else if (stud.invitationStatus === 'Suspended') activeBadge = `<span class="badge badge-warning" style="background: #f59e0b; color: #0b0f19;">${this.translate('suspended_status', 'Suspended')}</span>`;
      else activeBadge = `<span class="badge badge-info">${this.translate('invited_status', 'Invited')}</span>`;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="width: 40px; text-align: center; vertical-align: middle; padding: 0.75rem 0.5rem;">
          <input type="checkbox" class="roster-student-checkbox" value="${stud.id}" style="cursor: pointer; width: 16px; height: 16px; accent-color: var(--secondary);" onchange="app.handleRosterCheckboxChange(this)">
        </td>
        <td style="font-weight: 600; vertical-align: middle;">
          <span class="clickable-student-roster-name" style="cursor: pointer; text-decoration: underline; color: var(--secondary);" onclick="app.openTeacherStudentProfileModal('${stud.id}')">${stud.name}</span>
          <br><span style="font-size: 0.75rem; font-weight: normal; color: var(--text-secondary);">${stud.email}</span>
        </td>
        <td style="vertical-align: middle;">${stud.age} • ${this.translateGender(stud.gender)}</td>
        <td style="vertical-align: middle;">${this.translateYearGroup(stud.yearGroup)}</td>
        <td style="vertical-align: middle;">${statusBadge}</td>
        <td style="vertical-align: middle;">
          <span style="font-size: 0.85rem;">${this.getLogonDisplay(stud.activityLevel)}</span>
        </td>
        <td style="vertical-align: middle;">${activeBadge}</td>
        <td style="min-width: 250px; vertical-align: middle;">
          <div style="display: flex; gap: 0.5rem; align-items: center; justify-content: flex-start; width: 100%;">
            ${stud.invitationStatus === 'Invited' 
              ? `<button class="btn btn-secondary" style="width: 125px; justify-content: center; text-align: center; white-space: nowrap; padding: 0.45rem 0.2rem; font-size: 1rem;" onclick="app.simulateInviteResend('${stud.id}')" title="${this.translate('resend_invite_code_title', 'Resend Invite Code')}">${this.translate('resend_invite_btn', 'Resend invite')}</button>` 
              : stud.invitationStatus === 'Active' 
                ? `<button class="btn btn-secondary" style="width: 125px; justify-content: center; text-align: center; white-space: nowrap; padding: 0.45rem 0.2rem; font-size: 1rem;" onclick="app.simulateResetPassword('${stud.id}')" title="${this.translate('reset_student_password_title', 'Reset Student Password')}">${this.translate('reset_pw_btn', 'Reset PW')}</button>` 
                : `<div style="width: 125px;"></div>`}
            <button class="btn btn-danger" style="width: 95px; justify-content: center; text-align: center; padding: 0.45rem 0.2rem; font-size: 1rem;" onclick="app.removeStudentAccount('${stud.id}')">${this.translate('archive_btn', 'Archive')}</button>
          </div>
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
      const flag = this.getSchoolFlagEmoji(school.country);
      option.textContent = `${flag} ${school.name} (${school.country})`;
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
      const flag = this.getSchoolFlagEmoji(school.country);
      option.textContent = `${flag} ${school.name} (${school.country})`;
      schoolSelect.appendChild(option);
    });

    this.openModal('bulk-upload-modal');
  }

  // Render a visual preview of the sent email in the student's local language
  renderEmailPreview(student, inviteLink) {
    const previewEl = document.getElementById('invite-email-preview');
    if (!previewEl) return;

    const lang = student.language || 'en';
    const templates = {
      en: {
        subject: 'Bridge Invite: Collaborate with international classrooms!',
        title: 'Bridge',
        subtitle: 'Global Cultural Exchange',
        greeting: `Hello ${student.name},`,
        body1: 'Your teacher has invited you to join <strong>Bridge</strong>, our international classroom exchange platform!',
        body2: 'Use Bridge to collaborate with classrooms worldwide, build shared project slide decks, chat with partners, and translate messages automatically.',
        button: 'Join Your Classroom',
        footer: `If the button above does not work, copy and paste this link into your browser:<br><a href="${inviteLink}" style="color: #3b82f6; word-break: break-all;">${inviteLink}</a>`
      },
      de: {
        subject: 'Bridge Einladung: Arbeite mit internationalen Klassen zusammen!',
        title: 'Bridge',
        subtitle: 'Globaler Kulturaustausch',
        greeting: `Hallo ${student.name},`,
        body1: 'Dein Lehrer hat dich eingeladen, <strong>Bridge</strong> beizutreten, unserer Plattform für den internationalen Klassenaustausch!',
        body2: 'Nutze Bridge, um mit Klassen weltweit zusammenzuarbeiten, gemeinsame Projekt-Präsentationen zu erstellen, mit Partnern zu chatten und Nachrichten automatisch zu übersetzen.',
        button: 'Deiner Klasse beitreten',
        footer: `Wenn die Schaltfläche oben nicht funktioniert, kopiere diesen Link in deinen Browser:<br><a href="${inviteLink}" style="color: #3b82f6; word-break: break-all;">${inviteLink}</a>`
      },
      fr: {
        subject: 'Invitation Bridge : Collabore avec des classes internationales !',
        title: 'Bridge',
        subtitle: 'Échange Culturel Mondial',
        greeting: `Bonjour ${student.name},`,
        body1: "Ton enseignant t'a invité à rejoindre <strong>Bridge</strong>, notre plateforme d'échange scolaire international !",
        body2: 'Utilise Bridge pour collaborer avec des classes du monde entier, créer des diaporamas de projet partagés, discuter avec tes partenaires et traduire automatiquement les messages.',
        button: 'Rejoindre ta classe',
        footer: `Si le bouton ci-dessus ne fonctionne pas, copie et colle ce lien dans ton navigateur :<br><a href="${inviteLink}" style="color: #3b82f6; word-break: break-all;">${inviteLink}</a>`
      },
      es: {
        subject: 'Invitación de Bridge: ¡Colabora con clases internacionales!',
        title: 'Bridge',
        subtitle: 'Intercambio Cultural Global',
        greeting: `Hola ${student.name},`,
        body1: '¡Tu profesor te ha invitado a unirte a <strong>Bridge</strong>, nuestra plataforma de intercambio escolar internacional!',
        body2: 'Utiliza Bridge para colaborar con clases de todo el mundo, crear presentaciones de proyectos compartidos, chatear con compañeros y traducir mensajes automáticamente.',
        button: 'Unirse a tu clase',
        footer: `Si el botón de arriba no funciona, copia y pega este enlace en tu navegador:<br><a href="${inviteLink}" style="color: #3b82f6; word-break: break-all;">${inviteLink}</a>`
      }
    };

    const t = templates[lang.toLowerCase()] || templates.en;

    previewEl.innerHTML = `
      <div style="font-weight: 700; color: var(--primary); margin-bottom: 0.75rem; border-bottom: 1px dashed var(--panel-border); padding-bottom: 0.5rem; display: flex; justify-content: space-between; font-size: 0.8rem; letter-spacing: 0.5px;">
        <span>📧 SENT EMAIL PREVIEW (${lang.toUpperCase()})</span>
        <span style="font-weight: 400; color: var(--text-secondary);">${student.email}</span>
      </div>
      <div style="background: rgba(255, 255, 255, 0.03); color: var(--text-primary); border: 1px solid var(--panel-border); border-radius: 8px; padding: 1.25rem; font-size: 0.85rem; line-height: 1.6; font-family: var(--font-body);">
        <div style="text-align: center; margin-bottom: 1.25rem; border-bottom: 1px solid var(--panel-border); padding-bottom: 1rem;">
          <h4 style="color: var(--primary); margin: 0; font-size: 1.25rem; font-family: var(--font-title); font-weight: 700;">${t.title}</h4>
          <p style="color: var(--text-secondary); margin: 2px 0 0 0; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px;">${t.subtitle}</p>
        </div>
        <p style="font-weight: 600; margin: 0 0 0.75rem 0; color: var(--text-primary);">${t.greeting}</p>
        <p style="margin: 0 0 0.75rem 0; color: var(--text-secondary);">${t.body1}</p>
        <p style="margin: 0 0 1.25rem 0; color: var(--text-secondary);">${t.body2}</p>
        <div style="text-align: center; margin: 1.5rem 0;">
          <a href="${inviteLink}" target="_blank" style="background-color: var(--primary); color: #ffffff; padding: 8px 16px; font-size: 0.8rem; font-weight: 600; text-decoration: none; border-radius: 6px; display: inline-block; transition: background 0.2s;">${t.button}</a>
        </div>
        <p style="font-size: 0.75rem; color: var(--text-muted); margin: 1.25rem 0 0 0; border-top: 1px solid var(--panel-border); padding-top: 0.75rem;">${t.footer}</p>
      </div>
    `;
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

    // Render localized email preview in UI
    this.renderEmailPreview(newStudent, inviteLink);

    // Dispatch real email via Vercel serverless function
    this.sendInviteEmail(newStudent, inviteLink);

    // Reset form inputs to clear them for next invite
    document.getElementById('invite-student-form').reset();

    this.renderStudentRoster();
  }

  // Dispatch secure invite signup email to student using Vercel Resend API
  async sendInviteEmail(student, inviteLink) {
    try {
      const response = await fetch('/api/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: student.email,
          studentName: student.name,
          inviteLink: inviteLink,
          lang: student.language || 'en'
        })
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Failed to dispatch invite email:', data.error);
      } else {
        console.log('Invite email successfully dispatched via Resend API:', data.id);
      }
    } catch (err) {
      console.error('Error dispatching invite email:', err);
    }
  }

  // Copy invitation link to clipboard
  copyInviteLink() {
    const input = document.getElementById('invite-link-input');
    input.select();
    input.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(input.value);
    alert(this.translate('copied_signup_link_alert', 'Copied secure sign-up link: ') + input.value);
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
      const inviteLink = `${window.location.origin}/signup?token=welcome_${newStudent.id}`;
      this.sendInviteEmail(newStudent, inviteLink);
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
      const inviteLink = `${window.location.origin}/signup?token=welcome_${stud.id}`;
      this.sendInviteEmail(stud, inviteLink);
      window.db.addLog('Invitation Resent', `Resent sign-up email invitation to ${stud.name}.`, 'Teacher');
      this.refreshUI();
      alert(`Invitation link successfully resent to ${stud.email}`);
    }
  }

  // Simulate password reset action
  simulateResetPassword(studentId) {
    const stud = window.db.getStudent(studentId);
    if (stud) {
      const inviteLink = `${window.location.origin}/signup?token=welcome_${stud.id}`;
      this.sendInviteEmail(stud, inviteLink);
      window.db.addLog('Password Reset Initiated', `Resent password reset invitation link to student ${stud.name}.`, 'Teacher');
      alert(`Password reset invitation link successfully resent to ${stud.email}`);
    }
  }

  // Archive / Delete student account
  removeStudentAccount(studentId) {
    const stud = window.db.getStudent(studentId);
    if (stud && confirm(this.translate('archive_student_confirm_prompt', 'Are you sure you want to archive student account: {name}?').replace('{name}', stud.name))) {
      window.db.updateStudent(studentId, { active: false, invitationStatus: 'Archived', matchStatus: 'unmatched' });
      
      // Cleanup matches
      const activeMatches = window.db.getMatches().filter(m => m.active && m.studentIds.includes(studentId));
      activeMatches.forEach(m => window.db.deleteMatch(m.id));

      window.db.addLog('Student Archived', `Archived account of student ${stud.name}.`, 'Teacher');
      this.refreshUI();
    }
  }

  handleRosterCheckboxChange(checkbox) {
    if (!this.selectedRosterStudentIds) {
      this.selectedRosterStudentIds = [];
    }
    const studentId = checkbox.value;
    if (checkbox.checked) {
      if (!this.selectedRosterStudentIds.includes(studentId)) {
        this.selectedRosterStudentIds.push(studentId);
      }
    } else {
      this.selectedRosterStudentIds = this.selectedRosterStudentIds.filter(id => id !== studentId);
    }
    this.updateRosterSelectionUI();
  }

  toggleSelectAllRoster(masterCheckbox) {
    this.selectedRosterStudentIds = [];
    const checkboxes = document.querySelectorAll('.roster-student-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = masterCheckbox.checked;
      if (cb.checked) {
        this.selectedRosterStudentIds.push(cb.value);
      }
    });
    this.updateRosterSelectionUI();
  }

  updateRosterSelectionUI() {
    if (!this.selectedRosterStudentIds) {
      this.selectedRosterStudentIds = [];
    }
    const count = this.selectedRosterStudentIds.length;
    const standardActions = document.getElementById('roster-standard-actions');
    const bulkActions = document.getElementById('roster-bulk-actions');
    const selectedCountLabel = document.getElementById('roster-selected-count');
    const masterCheckbox = document.getElementById('roster-select-all');

    if (selectedCountLabel) {
      selectedCountLabel.textContent = count;
    }

    if (count > 0) {
      if (standardActions) standardActions.style.display = 'none';
      if (bulkActions) bulkActions.style.display = 'flex';
    } else {
      if (standardActions) standardActions.style.display = 'flex';
      if (bulkActions) bulkActions.style.display = 'none';
    }

    // Update master checkbox check state
    if (masterCheckbox) {
      const checkboxes = document.querySelectorAll('.roster-student-checkbox');
      if (checkboxes.length > 0) {
        masterCheckbox.checked = (count === checkboxes.length);
        masterCheckbox.indeterminate = (count > 0 && count < checkboxes.length);
      } else {
        masterCheckbox.checked = false;
        masterCheckbox.indeterminate = false;
      }
    }
  }

  openRosterBulkMessageModal() {
    if (!this.selectedRosterStudentIds || this.selectedRosterStudentIds.length === 0) return;
    
    const namesContainer = document.getElementById('roster-bulk-message-recipients');
    if (namesContainer) {
      const names = this.selectedRosterStudentIds.map(id => {
        const s = window.db.getStudent(id);
        return s ? s.name : 'Unknown';
      }).join(', ');
      namesContainer.textContent = names;
    }
    
    const textarea = document.getElementById('roster-bulk-message-text');
    if (textarea) textarea.value = '';

    this.openModal('roster-bulk-message-modal');
  }

  handleRosterBulkMessageSubmit(event) {
    event.preventDefault();
    if (!this.selectedRosterStudentIds || this.selectedRosterStudentIds.length === 0) return;

    const textarea = document.getElementById('roster-bulk-message-text');
    if (!textarea) return;
    
    const text = textarea.value.trim();
    if (!text) return;

    this.sendRosterBulkMessage(this.selectedRosterStudentIds, text);
    this.closeModal('roster-bulk-message-modal');
    
    // Clear selection
    this.selectedRosterStudentIds = [];
    const masterCheckbox = document.getElementById('roster-select-all');
    if (masterCheckbox) masterCheckbox.checked = false;
    this.updateRosterSelectionUI();
    this.refreshUI();
  }

  sendRosterBulkMessage(studentIds, text) {
    const teacher = this.getLoggedTeacher();
    const senderId = teacher ? teacher.id : 'coord_1';
    const senderName = teacher ? teacher.name : 'Teacher';
    const list = window.db.getStaffStudentMessages();

    studentIds.forEach((studentId, index) => {
      const newMsg = {
        id: 'ssm_' + (Date.now() + index),
        senderId,
        senderName,
        recipientId: studentId,
        text,
        timestamp: new Date().toISOString(),
        requireAgreement: false,
        status: 'Unread',
        agreedAt: null
      };
      list.push(newMsg);

      const student = window.db.getStudent(studentId);
      const name = student ? student.name : 'Student';
      window.db.addLog('Staff Notice Sent', `Teacher ${senderName} sent bulk notice to student ${name}.`, senderName);
    });

    window.db.saveTable('staffStudentMessages', list);
    alert(this.translate('bulk_message_sent_success', 'Bulk message sent to selected students successfully.'));
  }

  suspendSelectedStudents() {
    if (!this.selectedRosterStudentIds || this.selectedRosterStudentIds.length === 0) return;
    
    const count = this.selectedRosterStudentIds.length;
    if (confirm(this.translate('suspend_selected_students_prompt', 'Are you sure you want to suspend the {count} selected student accounts?').replace('{count}', count))) {
      const teacher = this.getLoggedTeacher();
      const senderName = teacher ? teacher.name : 'Teacher';

      this.selectedRosterStudentIds.forEach(studentId => {
        window.db.updateStudent(studentId, { invitationStatus: 'Suspended' });
        const student = window.db.getStudent(studentId);
        const name = student ? student.name : 'Student';
        window.db.addLog('Student Suspended', `Suspended account of student ${name}.`, senderName);
      });

      this.selectedRosterStudentIds = [];
      const masterCheckbox = document.getElementById('roster-select-all');
      if (masterCheckbox) masterCheckbox.checked = false;
      this.updateRosterSelectionUI();
      this.refreshUI();
    }
  }

  archiveSelectedStudents() {
    if (!this.selectedRosterStudentIds || this.selectedRosterStudentIds.length === 0) return;

    const count = this.selectedRosterStudentIds.length;
    if (confirm(this.translate('archive_selected_students_prompt', 'Are you sure you want to delete / archive the {count} selected student accounts? This will end their matches.').replace('{count}', count))) {
      const teacher = this.getLoggedTeacher();
      const senderName = teacher ? teacher.name : 'Teacher';

      this.selectedRosterStudentIds.forEach(studentId => {
        window.db.updateStudent(studentId, { active: false, invitationStatus: 'Archived', matchStatus: 'unmatched' });
        
        // Cleanup matches
        const activeMatches = window.db.getMatches().filter(m => m.active && m.studentIds.includes(studentId));
        activeMatches.forEach(m => window.db.deleteMatch(m.id));

        const student = window.db.getStudent(studentId);
        const name = student ? student.name : 'Student';
        window.db.addLog('Student Archived', `Archived account of student ${name}.`, senderName);
      });

      this.selectedRosterStudentIds = [];
      const masterCheckbox = document.getElementById('roster-select-all');
      if (masterCheckbox) masterCheckbox.checked = false;
      this.updateRosterSelectionUI();
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
      nameEl.innerHTML = `${this.getSchoolFlag(school.country)} ${school.name}`;
      metaEl.textContent = `${this.translate(school.country.toLowerCase(), school.country)} • ${this.translate(school.city.toLowerCase(), school.city)}`;
      descEl.textContent = this.translate(school.id + '_desc', school.description) || this.translate('no_description_available_default', 'No description available for this school.');
      
      // Calculate unmatched students count
      const students = window.db.getStudents();
      const unmatchedCount = students.filter(s => s.schoolId === schoolId && s.matchStatus === 'unmatched').length;
      countEl.textContent = unmatchedCount;
    } else {
      const selectEl = document.getElementById('partner-school-select');
      if (selectEl && selectEl.options.length === 0) {
        nameEl.innerHTML = `<span style="color: var(--danger);">${this.translate('no_connected_partner_schools', '⚠️ No Connected Partner Schools')}</span>`;
        metaEl.textContent = this.translate('action_required', 'Action Required');
        descEl.innerHTML = this.translate('no_connected_partner_schools_desc', 'You cannot suggest matches until you connect with a school. Please go to the <strong>School Partnerships</strong> tab to find partner schools and establish a connection.');
        countEl.textContent = this.translate('not_applicable', 'N/A');
      } else {
        nameEl.textContent = this.translate('no_school_selected', 'No School Selected');
        metaEl.textContent = '';
        descEl.textContent = this.translate('choose_partner_school_desc', 'Please choose a partner school from the dropdown to continue.');
        countEl.textContent = '0';
      }
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

    // Translate own school heading in matching
    const ownSchoolTitleEl = document.getElementById('matching-own-school-title');
    if (ownSchoolTitleEl && schoolId) {
      const ownSchool = window.db.getSchool(schoolId);
      if (ownSchool) {
        ownSchoolTitleEl.innerHTML = `🏫 ${ownSchool.name} (${this.translate(ownSchool.country.toLowerCase(), ownSchool.country)})`;
      }
    }

    // Populate the year filter select options
    const yearFilterSelect = document.getElementById('match-year-filter');
    let selectedYear = 'all';
    if (yearFilterSelect) {
      const currentSelected = yearFilterSelect.value || 'all';
      const schoolStudents = students.filter(s => s.schoolId === schoolId);
      const uniqueYears = [...new Set(schoolStudents.map(s => s.yearGroup).filter(Boolean))].sort();
      
      let optionsHtml = `<option value="all">${this.translate('all_years_filter', 'All Years')}</option>`;
      uniqueYears.forEach(yg => {
        const localizedYG = this.translateYearGroup(yg);
        optionsHtml += `<option value="${yg}">${localizedYG}</option>`;
      });
      yearFilterSelect.innerHTML = optionsHtml;
      
      // Try to restore selection, default to 'all' if no longer exists
      yearFilterSelect.value = currentSelected;
      if (!yearFilterSelect.value) {
        yearFilterSelect.value = 'all';
      }
      selectedYear = yearFilterSelect.value;
    }

    // Show all local students (matched and unmatched) filtered and sorted: unmatched first, then alphabetically
    let myStudents = students.filter(s => s.schoolId === schoolId);
    if (selectedYear !== 'all') {
      myStudents = myStudents.filter(s => s.yearGroup === selectedYear);
    }
    myStudents.sort((a, b) => {
      const aUnmatched = a.matchStatus === 'unmatched';
      const bUnmatched = b.matchStatus === 'unmatched';
      if (aUnmatched && !bUnmatched) return -1;
      if (!aUnmatched && bUnmatched) return 1;
      return a.name.localeCompare(b.name);
    });

    // Reset selection tracking variables
    this.selectedMatchIds = [];
    document.getElementById('propose-match-btn').disabled = true;

    colEn.innerHTML = '';
    if (myStudents.length === 0) {
      colEn.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem; font-size: 0.85rem;">${this.translate('no_students_found_for_school', 'No students found for your school.')}</div>`;
    } else {
      myStudents.forEach(stud => {
        const card = document.createElement('div');
        card.className = `match-card`;
        card.setAttribute('data-id', stud.id);
        card.style.display = 'flex';
        card.style.alignItems = 'center';
        card.style.gap = '0.75rem';
        card.style.padding = '0.75rem 1rem';
        card.style.cursor = 'pointer';
        
        const myActiveMatches = window.db.getMatches().filter(m => m.active && m.studentIds.includes(stud.id));
        let matchStatusText = '';
        let badgeClass = '';
        let tooltipAttr = '';
        if (myActiveMatches.length > 0) {
          const count = myActiveMatches.length;
          matchStatusText = `${count} ${count === 1 ? this.translate('match_label', 'Match') : this.translate('matches_label', 'Matches')}`;
          badgeClass = 'badge-success';
          
          const partnerNamesList = myActiveMatches.map(m => {
            const partnerId = m.studentIds.find(id => id !== stud.id);
            const partner = window.db.getStudent(partnerId || '');
            if (!partner) return '';
            const partnerSchool = window.db.getSchool(partner.schoolId);
            let emojiFlag = '🏫';
            if (partnerSchool) {
              const c = partnerSchool.country.toLowerCase();
              if (c.includes('germany') || c.includes('deutschland')) emojiFlag = '🇩🇪';
              else if (c.includes('united kingdom') || c.includes('uk') || c.includes('britain') || c.includes('england')) emojiFlag = '🇬🇧';
              else if (c.includes('france')) emojiFlag = '🇫🇷';
              else if (c.includes('spain')) emojiFlag = '🇪🇸';
              else if (c.includes('italy')) emojiFlag = '🇮🇹';
              else if (c.includes('united states') || c.includes('us')) emojiFlag = '🇺🇸';
              else if (c.includes('canada')) emojiFlag = '🇨🇦';
            }
            const firstName = partner.name.split(' ')[0];
            return `${emojiFlag} ${firstName}`;
          }).filter(name => name !== '');
          if (partnerNamesList.length > 0) {
            tooltipAttr = `title="${this.translate('matched_status_badge', 'Matched')} with: ${partnerNamesList.join(', ')}" style="cursor: help;"`;
          }
        } else {
          const myProposals = window.db.getMatches().filter(m => !m.active && m.status === 'Proposed' && m.studentIds.includes(stud.id));
          if (myProposals.length > 0) {
            matchStatusText = `${this.translate('proposed_status', 'Proposed')} (${myProposals.length})`;
            badgeClass = 'badge-warning';
          } else {
            matchStatusText = this.translate('unmatched_status_badge', 'Unmatched');
            badgeClass = 'badge-info';
          }
        }

        card.innerHTML = `
          <input type="checkbox" class="match-select-checkbox" value="${stud.id}" id="chk-match-${stud.id}" style="cursor: pointer; width: 16px; height: 16px;">
          <div style="flex-grow: 1;">
            <h4 style="font-weight:600; font-size: 0.9rem; margin: 0; color: var(--text-primary); display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; width: 100%;">
              <span>${stud.name} (${stud.age} ${this.translate('years_old_suffix', 'y/o')})</span>
              <span class="badge ${badgeClass}" ${tooltipAttr} style="font-size: 0.65rem; padding: 0.1rem 0.35rem; border-radius: 4px; font-weight: 700; white-space: nowrap;">${matchStatusText}</span>
            </h4>
            <p style="font-size: 0.75rem; color: var(--text-secondary); margin: 0.2rem 0 0 0;">${this.translateGender(stud.gender)} • ${this.translateYearGroup(stud.yearGroup)}</p>
          </div>
        `;

        const checkbox = card.querySelector('.match-select-checkbox');
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            card.classList.add('selected');
            if (!this.selectedMatchIds.includes(stud.id)) {
              this.selectedMatchIds.push(stud.id);
            }
          } else {
            card.classList.remove('selected');
            this.selectedMatchIds = this.selectedMatchIds.filter(id => id !== stud.id);
          }
          const partnerSchoolSelect = document.getElementById('partner-school-select');
          document.getElementById('propose-match-btn').disabled = this.selectedMatchIds.length === 0 || !partnerSchoolSelect.value;
        });

        card.addEventListener('click', (e) => {
          if (e.target.tagName !== 'INPUT') {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
          }
        });

        colEn.appendChild(card);
      });
    }

    // Populate partner school dropdown
    const partnerSelect = document.getElementById('partner-school-select');
    const previousVal = partnerSelect.value;
    partnerSelect.innerHTML = '';

    const connections = window.db.getSchoolConnections().filter(c => 
      c.status === 'Connected' && (c.fromSchoolId === schoolId || c.toSchoolId === schoolId)
    );
    const connectedSchoolIds = connections.map(c => 
      c.fromSchoolId === schoolId ? c.toSchoolId : c.fromSchoolId
    );
    const schools = window.db.getSchools().filter(s => connectedSchoolIds.includes(s.id));
    schools.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      const flag = this.getSchoolFlagEmoji(s.country);
      opt.textContent = `${flag} ${s.name} (${s.country})`;
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
          <h4 style="font-family: var(--font-title); font-weight: 700; font-size: 0.95rem; margin: 0; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; max-width: 180px; display: flex; align-items: center; gap: 0.35rem;">${this.getSchoolFlag(ownSchool.country)} <span>${ownSchool.name}</span></h4>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="info-icon-btn" onclick="event.stopPropagation(); app.openSchoolDetail('${ownSchool.id}')" title="View School Profile">ℹ️</span>
            <span style="font-size: 1.25rem;">📊</span>
          </div>
        </div>
        <div style="font-size: 1.5rem; font-weight: 800; font-family: var(--font-title); color: var(--accent); margin: 0.25rem 0;">
          ${overallMatchRate}% <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-secondary);">${this.translate('of_students_paired', 'of students paired')}</span>
        </div>
        <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem; font-weight: 500;">
          ${matchedMyStudents} ${this.translate('of_label_lowercase', 'of')} ${totalMyStudents} ${this.translate('students_paired_label', 'students paired')}
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">
          ${totalPendingProposals === 1 ? this.translate('pending_request_singular', '1 pending request') : this.translate('pending_requests_plural', '{count} pending requests').replace('{count}', totalPendingProposals)}
        </div>
        <div class="metric-progress-track">
          <div class="metric-progress-fill" style="width: 0%;" data-value="${overallMatchRate}%"></div>
        </div>
      </div>
    `;

    // 2. Partner Schools Cards (Only show connected partner schools)
    const connections = window.db.getSchoolConnections().filter(c => 
      c.status === 'Connected' && (c.fromSchoolId === ownSchoolId || c.toSchoolId === ownSchoolId)
    );
    const connectedSchoolIds = connections.map(c => 
      c.fromSchoolId === ownSchoolId ? c.toSchoolId : c.fromSchoolId
    );
    const partnerSchools = schools.filter(s => s.id !== ownSchoolId && connectedSchoolIds.includes(s.id));
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
      let statusText = this.translate('no_connection_status', 'No Connection');
      let badgeStyle = 'background: rgba(255,255,255,0.05); color: var(--text-muted);';

      if (activeCount > 0) {
        statusClass = 'active-link';
        statusText = this.translate('active_link_status', 'Active Link');
        badgeStyle = 'background: rgba(16, 185, 129, 0.12); color: var(--success);';
      } else if (pendingCount > 0) {
        statusClass = 'pending-link';
        statusText = this.translate('pending_proposal_status', 'Pending Proposal');
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
              <h4 style="font-family: var(--font-title); font-weight: 700; font-size: 0.95rem; margin: 0; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; display: flex; align-items: center; gap: 0.35rem;">${this.getSchoolFlag(partner.country)} <span>${partner.name}</span></h4>
            </div>
            <div style="display: flex; align-items: center; gap: 0.35rem; margin-left: auto;">
              <span class="info-icon-btn" onclick="event.stopPropagation(); app.openSchoolDetail('${partner.id}')" title="View School Profile">ℹ️</span>
              <span style="font-size: 0.65rem; font-weight: 600; padding: 0.15rem 0.45rem; border-radius: 6px; ${badgeStyle}">${statusText}</span>
            </div>
          </div>
          <div style="font-size: 1.5rem; font-weight: 800; font-family: var(--font-title); color: ${activeCount > 0 ? 'var(--success)' : 'var(--text-secondary)'}; margin: 0.25rem 0;">
            ${activeCount} <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-secondary);">${activeCount === 1 ? this.translate('active_connection_singular', 'active connection') : this.translate('active_connections_plural', 'active connections')}</span>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem; font-weight: 500;">
            ${pendingCount > 0 
              ? `<span style="color: var(--warning);">⚡ ${pendingCount === 1 ? this.translate('pending_request_singular', '1 pending request') : this.translate('pending_requests_plural', '{count} pending requests').replace('{count}', pendingCount)}</span>` 
              : this.translate('no_pending_requests', 'No pending requests')}
          </div>
        </div>
      `;
    });

    // Add a dashed shortcut card to request new connections
    html += `
      <div class="metric-card" onclick="app.switchTab('teach-partnerships')" style="border: 2px dashed var(--panel-border); background: transparent; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 120px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.borderColor='var(--primary)'; this.style.background='rgba(var(--primary-rgb), 0.03)'" onmouseout="this.style.borderColor='var(--panel-border)'; this.style.background='transparent'">
        <div style="text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; height: 100%;">
          <span style="font-size: 1.6rem; line-height: 1; display: block; margin: 0;">🔗</span>
          <span style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary); display: block; line-height: 1.2;">${this.translate('establish_new_connection', 'Establish a New Connection')}</span>
          <span style="font-size: 0.7rem; color: var(--text-muted); display: block; line-height: 1.2;">${this.translate('find_other_schools', 'Find other schools on Bridge')}</span>
        </div>
      </div>
    `;

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
  // Create proposed matches from teacher portal
  proposeMatch() {
    if (!this.selectedMatchIds || this.selectedMatchIds.length === 0) return;
    const partnerSchoolId = document.getElementById('partner-school-select').value;
    if (!partnerSchoolId) return;

    const teacher = this.getLoggedTeacher();
    const ownSchoolId = teacher ? teacher.schoolId : 'school_1';

    // Loop through all selected student IDs and propose a match for each
    this.selectedMatchIds.forEach(studentId => {
      window.db.proposeMatch('1-to-1', [studentId, null], ownSchoolId, partnerSchoolId);
    });

    alert(`Successfully sent match proposals for ${this.selectedMatchIds.length} student(s)! The partner school coordinator will review and assign connections.`);
    
    this.selectedMatchIds = [];
    this.refreshUI();
  }

  confirmProposal(matchId) {
    const assignedStudentId = this.tempAssignments[matchId];
    if (!assignedStudentId) {
      alert('Please select a student from your school to assign to this match proposal.');
      return;
    }

    const teacher = this.getLoggedTeacher();
    const teacherName = teacher ? `${this.translate('teacher_label', 'Teacher')} ${teacher.name}` : `${this.translate('teacher_label', 'Teacher')} Mrs. Smith`;

    window.db.confirmMatch(matchId, assignedStudentId, teacherName);
    delete this.tempAssignments[matchId];
    alert('Match proposal approved! The connection link is now active and students can message each other.');
    this.refreshUI();
  }

  declineProposal(matchId) {
    if (confirm(this.translate('decline_match_confirm_prompt', 'Are you sure you want to decline/withdraw this match suggestion?'))) {
      const teacher = this.getLoggedTeacher();
      const teacherName = teacher ? `${this.translate('teacher_label', 'Teacher')} ${teacher.name}` : `${this.translate('teacher_label', 'Teacher')} Mrs. Smith`;
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

    const schoolName = partnerSchool ? partnerSchool.name : this.translate('exchange_school_fallback', 'Exchange School');
    const age = partnerStudent ? `${partnerStudent.age} ${this.translate('years_old_suffix', 'y/o')}` : 'Unknown';
    const gender = partnerStudent ? partnerStudent.gender : 'Unknown';
    const biog = partnerStudent ? (partnerStudent.personalBiog || this.translate('no_biography_text_available', 'No biography text available.')) : this.translate('no_details_available', 'No details available.');
    const partnerFirstName = partnerStudent ? partnerStudent.name.split(' ')[0] : 'Partner';

    const country = partnerSchool ? partnerSchool.country : '';
    const flag = this.getSchoolFlag(country, 'large');

    const proposerInfo = document.getElementById('assign-proposer-info');
    if (proposerInfo) {
      proposerInfo.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
          <div style="font-size: 2.25rem;">${flag}</div>
          <div>
            <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">${partnerFirstName} (${schoolName})</div>
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
        return a.name.localeCompare(b.name);
      });

      if (sortedStudents.length === 0) {
        studentsListContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 1rem;">${this.translate('no_local_students_found', 'No local students found.')}</div>`;
      } else {
        sortedStudents.forEach(s => {
          const item = document.createElement('div');
          item.className = 'assign-student-item';
          item.setAttribute('data-student-id', s.id);
          
          let statusBadge = '';
          if (s.matchStatus === 'unmatched') {
            statusBadge = `<span class="badge" style="background: rgba(40, 167, 69, 0.15); color: #28a745; border: 1px solid rgba(40, 167, 69, 0.3);">${this.translate('unmatched_status_badge', 'Unmatched')}</span>`;
          } else if (s.matchStatus === 'proposed') {
            statusBadge = `<span class="badge" style="background: rgba(255, 193, 7, 0.15); color: #ffc107; border: 1px solid rgba(255, 193, 7, 0.3);">${this.translate('proposed_match_status', 'Proposed Match')}</span>`;
          } else if (s.matchStatus === 'matched') {
            statusBadge = `<span class="badge" style="background: rgba(23, 162, 184, 0.15); color: #17a2b8; border: 1px solid rgba(23, 162, 184, 0.3);">${this.translate('matched_status_badge', 'Matched')}</span>`;
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
              <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">${s.age} ${this.translate('years_old_suffix', 'y/o')} • ${s.gender}</div>
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

    const teacher = this.getLoggedTeacher();
    const ownSchoolId = teacher ? teacher.schoolId : 'school_1';

    const matches = window.db.getMatches().filter(m => m.status === 'Proposed');

    incomingTbody.innerHTML = '';
    sentTbody.innerHTML = '';

    let hasIncoming = false;
    let hasSent = false;
    let incomingCount = 0;

    matches.forEach(match => {
      const myStudentId = match.studentIds.find(id => id && window.db.getStudent(id)?.schoolId === ownSchoolId);
      const partnerStudentId = match.studentIds.find(id => id && window.db.getStudent(id)?.schoolId !== ownSchoolId);
      const partnerStudent = partnerStudentId ? window.db.getStudent(partnerStudentId) : null;
      const partnerSchoolId = match.proposedBySchoolId !== ownSchoolId ? match.proposedBySchoolId : match.pendingApprovalFromSchoolId;
      const partnerSchool = window.db.getSchool(partnerSchoolId);

      const dateStr = match.createdAt ? new Date(match.createdAt).toLocaleDateString() : 'N/A';

      if (match.pendingApprovalFromSchoolId === ownSchoolId) {
        hasIncoming = true;
        incomingCount++;

        const age = partnerStudent ? `${partnerStudent.age} ${this.translate('years_old_suffix', 'y/o')}` : 'Unknown';
        const gender = partnerStudent ? partnerStudent.gender : 'Unknown';
        const schoolName = partnerSchool ? `${this.getSchoolFlag(partnerSchool.country)} ${partnerSchool.name}` : this.translate('exchange_school_fallback', 'Exchange School');
        const firstName = partnerStudent ? partnerStudent.name.split(' ')[0] : 'Unknown';

        const assignedStudentId = this.tempAssignments[match.id];
        const assignedStudent = assignedStudentId ? window.db.getStudent(assignedStudentId) : null;

        let assignHtml = '';
        if (assignedStudent) {
          assignHtml = `
            <div style="display: flex; flex-direction: column; gap: 0.2rem; min-width: 160px;">
              <span style="font-weight: 700; font-size: 0.95rem; color: var(--secondary);">${assignedStudent.name}</span>
              <span style="font-size: 0.75rem; color: var(--text-muted);">${assignedStudent.age} ${this.translate('years_old_suffix', 'y/o')} • ${assignedStudent.gender}</span>
              <a href="#" onclick="app.openAssignStudentModal('${match.id}'); return false;" style="font-size: 0.75rem; color: var(--text-muted); text-decoration: underline; margin-top: 0.15rem; display: inline-block;">${this.translate('change_student_link', 'Change Student')}</a>
            </div>
          `;
        } else {
          assignHtml = `
            <button class="btn btn-secondary btn-small" onclick="app.openAssignStudentModal('${match.id}')" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">${this.translate('select_student_btn', 'Select Student...')}</button>
          `;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
              <div>
                <strong style="color: var(--text-primary); font-size: 0.95rem;">${firstName}</strong>
                <span style="font-size: 0.8rem; color: var(--text-secondary); margin-left: 0.25rem;">(${gender} • ${age})</span>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">${this.translate('school_label', 'School')}: ${schoolName}</div>
              </div>
              <button class="btn btn-secondary btn-small" onclick="app.openBioModal('${partnerStudentId}')" style="padding: 0.25rem 0.55rem; font-size: 0.7rem; font-weight: 600; border-radius: 6px;">${this.translate('read_bio_btn', '📖 Read Bio')}</button>
            </div>
          </td>
          <td>${assignHtml}</td>
          <td>${dateStr}</td>
          <td>
            <button class="btn btn-primary btn-small" ${!assignedStudent ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''} onclick="app.confirmProposal('${match.id}')">${this.translate('confirm_match_btn', 'Confirm Match')}</button>
            <button class="btn btn-secondary btn-small" onclick="app.declineProposal('${match.id}')" style="color:var(--danger); border-color:var(--danger);">${this.translate('decline_btn', 'Decline')}</button>
          </td>
        `;
        incomingTbody.appendChild(row);
      } else if (match.proposedBySchoolId === ownSchoolId) {
        hasSent = true;
        const myStudent = myStudentId ? window.db.getStudent(myStudentId) : null;

        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="font-weight: 600;">${myStudent ? myStudent.name : 'Unknown'}<br><span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">${myStudent?.gender} • ${myStudent?.age} ${this.translate('years_old_suffix', 'y/o')}</span></td>
          <td>
            <div style="font-weight: 600;">${partnerSchool ? `${this.getSchoolFlag(partnerSchool.country)} ${partnerSchool.name}` : this.translate('matching_partner_school', 'Partner School')}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${this.translate('awaiting_assignment_status', 'Awaiting Assignment')}</div>
          </td>
          <td>${dateStr}</td>
          <td><span class="badge badge-warning">${this.translate('awaiting_partner_approval_status', 'Awaiting Partner Approval')}</span></td>
          <td>
            <button class="btn btn-secondary btn-small" onclick="app.declineProposal('${match.id}')" style="color:var(--danger); border-color:var(--danger);">${this.translate('withdraw_suggestion_btn', 'Withdraw Suggestion')}</button>
          </td>
        `;
        sentTbody.appendChild(row);
      }
    });

    if (!hasIncoming) {
      incomingTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">${this.translate('no_incoming_requests', 'No incoming match requests awaiting approval.')}</td></tr>`;
    }
    if (!hasSent) {
      sentTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">${this.translate('no_sent_suggestions', 'No sent suggestions pending.')}</td></tr>`;
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

  switchMatchingSubtab(subtab) {
    this.currentMatchingSubtab = subtab;
    const pairBtn = document.getElementById('subtab-pair-btn');
    const reqBtn = document.getElementById('subtab-requests-btn');
    const activeBtn = document.getElementById('subtab-active-btn');
    const connBtn = document.getElementById('subtab-connections-btn');
    
    const pairDiv = document.getElementById('matching-subtab-pair');
    const reqDiv = document.getElementById('matching-subtab-requests');
    const activeDiv = document.getElementById('matching-subtab-active');
    const connDiv = document.getElementById('matching-subtab-connections');
    const metricsDiv = document.getElementById('matching-metrics-summary');

    if (!pairBtn || !reqBtn || !activeBtn || !pairDiv || !reqDiv || !activeDiv) return;

    pairBtn.classList.remove('active');
    reqBtn.classList.remove('active');
    activeBtn.classList.remove('active');
    if (connBtn) connBtn.classList.remove('active');
    
    pairDiv.style.display = 'none';
    reqDiv.style.display = 'none';
    activeDiv.style.display = 'none';
    if (connDiv) connDiv.style.display = 'none';

    if (subtab === 'pair') {
      pairBtn.classList.add('active');
      pairDiv.style.display = 'block';
      if (metricsDiv) metricsDiv.style.display = 'none';
    } else if (subtab === 'requests') {
      reqBtn.classList.add('active');
      reqDiv.style.display = 'block';
      if (metricsDiv) metricsDiv.style.display = 'none';
    } else if (subtab === 'active') {
      activeBtn.classList.add('active');
      activeDiv.style.display = 'block';
      if (metricsDiv) metricsDiv.style.display = 'block';
      this.renderActiveMatches();
    } else if (subtab === 'connections') {
      if (connBtn) connBtn.classList.add('active');
      if (connDiv) {
        connDiv.style.display = 'block';
        this.renderSchoolConnections();
      }
      if (metricsDiv) metricsDiv.style.display = 'none';
    }
  }

  renderActiveMatches() {
    const tbody = document.getElementById('active-matches-tbody');
    if (!tbody) return;

    const teacher = this.getLoggedTeacher();
    const ownSchoolId = teacher ? teacher.schoolId : 'school_1';

    const students = window.db.getStudents();
    const myStudents = students.filter(s => s.schoolId === ownSchoolId);
    const activeMatches = window.db.getMatches().filter(m => 
      m.active && m.studentIds.some(id => myStudents.some(ms => ms.id === id))
    );

    const selectAllCheckbox = document.getElementById('select-all-active-matches');
    if (selectAllCheckbox) selectAllCheckbox.checked = false;
    this.updateBulkActiveMatchesState();

    tbody.innerHTML = '';
    if (activeMatches.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">${this.translate('no_active_matches', 'No active matches connected yet.')}</td></tr>`;
      return;
    }

    activeMatches.forEach(match => {
      const myStudentId = match.studentIds.find(id => myStudents.some(ms => ms.id === id));
      const partnerStudentId = match.studentIds.find(id => !myStudents.some(ms => ms.id === id));
      
      const myStudent = myStudentId ? window.db.getStudent(myStudentId) : null;
      const partnerStudent = partnerStudentId ? window.db.getStudent(partnerStudentId) : null;
      const partnerSchool = partnerStudent ? window.db.getSchool(partnerStudent.schoolId) : null;

      const dateStr = match.createdAt ? new Date(match.createdAt).toLocaleDateString() : 'N/A';
      const partnerFirstName = partnerStudent ? partnerStudent.name.split(' ')[0] : 'Unknown';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td style="padding: 0.5rem;"><input type="checkbox" class="match-select-checkbox" value="${match.id}" onclick="app.updateBulkActiveMatchesState()"></td>
        <td style="font-weight: 600; font-size: 1rem; vertical-align: middle;">
          ${myStudent ? myStudent.name : 'Unknown'}<br>
          <span style="font-size: 0.95rem; color: var(--text-secondary); font-weight: normal;">${myStudent?.gender} • ${myStudent?.age} ${this.translate('years_old_suffix', 'y/o')}</span>
        </td>
        <td style="vertical-align: middle;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
            <div>
              <strong style="color: var(--text-primary); font-size: 1rem; display: block;">${partnerFirstName}</strong>
              <span style="font-size: 0.95rem; color: var(--text-secondary); font-weight: normal; display: block; white-space: nowrap;">${partnerStudent?.gender} • ${partnerStudent?.age} ${this.translate('years_old_suffix', 'y/o')}</span>
            </div>
            <button class="btn btn-secondary" onclick="app.openBioModal('${partnerStudentId}')" style="padding: 0.4rem 0.75rem; font-size: 0.95rem; font-weight: 600; border-radius: 6px; white-space: nowrap; flex-shrink: 0;">${this.translate('read_bio_btn', '📖 Read Bio')}</button>
          </div>
        </td>
        <td style="vertical-align: middle; font-size: 1rem;">
          <div style="font-weight: 600;">
            ${partnerSchool ? `${this.getSchoolFlag(partnerSchool.country)} ${partnerSchool.name}` : this.translate('matching_partner_school', 'Partner School')}
          </div>
          <span style="font-size: 0.95rem; color: var(--text-muted);">${partnerSchool ? partnerSchool.city + ', ' + partnerSchool.country : ''}</span>
        </td>
        <td style="vertical-align: middle; font-size: 1rem; color: var(--text-secondary);">${dateStr}</td>
        <td style="vertical-align: middle;">
          <button class="btn btn-secondary" onclick="app.deleteActiveMatch('${match.id}')" style="color: var(--danger); border-color: var(--danger); font-weight: 600; font-size: 0.95rem; padding: 0.4rem 0.75rem; white-space: nowrap;">${this.translate('disband_match_btn', 'Break Connection')}</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  deleteActiveMatch(matchId) {
    if (confirm(this.translate('disband_confirm_prompt', 'Are you sure you want to disband this connection match? This will unlink the students and reset them to unmatched.'))) {
      window.db.deleteMatch(matchId);
      alert(this.translate('disband_success_msg', 'Match disbanded successfully.'));
      this.refreshUI();
    }
  }

  toggleSelectAllActiveMatches(masterCheckbox) {
    const checkboxes = document.querySelectorAll('.match-select-checkbox');
    checkboxes.forEach(cb => cb.checked = masterCheckbox.checked);
    this.updateBulkActiveMatchesState();
  }

  updateBulkActiveMatchesState() {
    const selected = document.querySelectorAll('.match-select-checkbox:checked');
    const btn = document.getElementById('bulk-disband-selected-btn');
    if (btn) {
      btn.disabled = selected.length === 0;
    }
  }

  disbandSelectedMatches() {
    const selected = document.querySelectorAll('.match-select-checkbox:checked');
    if (selected.length === 0) return;
    if (confirm(this.translate('disband_selected_confirm_prompt', 'Are you sure you want to disband the {count} selected matches? This will unlink the student pairs.').replace('{count}', selected.length))) {
      selected.forEach(cb => {
        window.db.deleteMatch(cb.value);
      });
      alert(this.translate('selected_matches_disbanded_success', 'Selected matches disbanded successfully.'));
      this.refreshUI();
    }
  }

  disbandAllMatches() {
    const teacher = this.getLoggedTeacher();
    const ownSchoolId = teacher ? teacher.schoolId : 'school_1';
    const students = window.db.getStudents();
    const myStudents = students.filter(s => s.schoolId === ownSchoolId);
    const activeMatches = window.db.getMatches().filter(m => 
      m.active && m.studentIds.some(id => myStudents.some(ms => ms.id === id))
    );

    if (activeMatches.length === 0) {
      alert(this.translate('no_matches_to_disband', 'No active matches to disband.'));
      return;
    }

    if (confirm(this.translate('disband_all_confirm_prompt', '⚠️ END OF YEAR WARNING: Are you sure you want to disband ALL {count} active matches for your school? This will unlink all student pairs and reset them for the new school year.').replace('{count}', activeMatches.length))) {
      activeMatches.forEach(match => {
        window.db.deleteMatch(match.id);
      });
      alert(this.translate('all_matches_disbanded_success', 'All active matches disbanded successfully.'));
      this.refreshUI();
    }
  }

  // Renders the School Connections management tab for teachers
  renderSchoolConnections() {
    const teacher = this.getLoggedTeacher();
    const schoolId = teacher ? teacher.schoolId : 'school_1';
    
    // 1. Populate unconnected target schools dropdown select
    const selectEl = document.getElementById('connect-target-school-select');
    if (selectEl) {
      const connections = window.db.getSchoolConnections();
      const connectedOrRequestedSchoolIds = connections.filter(c => 
        c.fromSchoolId === schoolId || c.toSchoolId === schoolId
      ).map(c => c.fromSchoolId === schoolId ? c.toSchoolId : c.fromSchoolId);
      
      const unconnectedSchools = window.db.getSchools().filter(s => 
        s.id !== schoolId && !connectedOrRequestedSchoolIds.includes(s.id)
      );

      selectEl.innerHTML = `<option value="">${this.translate('choose_school_to_connect', '-- Choose school to connect --')}</option>` +
        unconnectedSchools.map(s => `<option value="${s.id}">${s.name} (${s.country})</option>`).join('');
    }

    // 2. Populate partnerships directory
    const directoryEl = document.getElementById('linked-partnerships-directory');
    if (!directoryEl) return;

    const connections = window.db.getSchoolConnections();
    const established = connections.filter(c => c.status === 'Connected' && (c.fromSchoolId === schoolId || c.toSchoolId === schoolId));
    const incoming = connections.filter(c => c.status === 'Pending' && c.toSchoolId === schoolId);
    const sent = connections.filter(c => c.status === 'Pending' && c.fromSchoolId === schoolId);

    let html = '';

    // A. Pending Incoming Requests
    if (incoming.length > 0) {
      html += `
        <div style="margin-bottom: 0.5rem; display: flex; flex-direction: column; gap: 0.75rem;">
          <h3 style="font-size: 0.9rem; font-weight: 700; color: var(--primary); margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">📥 ${this.translate('incoming_requests_header', 'Incoming Requests')} (${incoming.length})</h3>
          ${incoming.map(c => {
            const school = window.db.getSchool(c.fromSchoolId);
            const flag = this.getSchoolFlag(school?.country);
            const sender = window.db.getCoordinators().find(co => co.schoolId === c.fromSchoolId) || { name: 'Unknown Coordinator', email: '' };
            return `
              <div class="panel" style="padding: 1rem; background: rgba(6, 182, 212, 0.03); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 8px; display: flex; flex-direction: column; gap: 0.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                  <div>
                    <h4 style="font-weight: 700; font-size: 0.9rem; margin: 0; color: var(--text-primary); display: flex; align-items: center; gap: 0.35rem;">
                      ${flag} ${school?.name}
                    </h4>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${school?.city}, ${school?.country}</span>
                  </div>
                  <div style="display: flex; gap: 0.35rem;">
                    <button class="btn btn-primary btn-small" onclick="app.acceptConnectionRequest('${c.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">${this.translate('accept_btn', 'Accept')}</button>
                    <button class="btn btn-secondary btn-small" style="color: var(--danger); border-color: rgba(239, 68, 68, 0.2); padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="app.declineConnectionRequest('${c.id}')">${this.translate('decline_btn', 'Decline')}</button>
                  </div>
                </div>
                <div style="background: rgba(0,0,0,0.1); border-radius: 6px; padding: 0.5rem; font-size: 0.75rem;">
                  <div style="font-weight: 600; color: var(--secondary); margin-bottom: 0.15rem;">${this.translate('from_label', 'From')}: ${sender.name} (<a href="mailto:${sender.email}" style="color: var(--secondary); text-decoration: underline;">${sender.email}</a>)</div>
                  <div style="font-style: italic; color: var(--text-secondary); line-height: 1.4;">"${c.requestMessage || this.translate('no_request_message_note', 'No request message note.')}"</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // B. Outgoing Sent Requests
    if (sent.length > 0) {
      html += `
        <div style="margin-bottom: 0.5rem; display: flex; flex-direction: column; gap: 0.75rem;">
          <h3 style="font-size: 0.9rem; font-weight: 700; color: var(--text-secondary); margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">📤 ${this.translate('sent_requests_header', 'Sent Requests')} (${sent.length})</h3>
          ${sent.map(c => {
            const school = window.db.getSchool(c.toSchoolId);
            const flag = this.getSchoolFlag(school?.country);
            return `
              <div class="panel" style="padding: 0.75rem 1rem; background: rgba(255,255,255,0.01); display: flex; justify-content: space-between; align-items: center; border-radius: 8px; border: 1px solid var(--panel-border);">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="font-size: 1.25rem;">🏫</span>
                  <div>
                    <h5 style="font-weight: 700; font-size: 0.85rem; margin: 0; color: var(--text-primary); display: flex; align-items: center; gap: 0.25rem;">
                      ${flag} ${school?.name}
                    </h5>
                    <span style="font-size: 0.7rem; color: var(--text-muted);">${school?.city}, ${school?.country}</span>
                  </div>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span class="badge badge-warning" style="font-size: 0.65rem; padding: 0.15rem 0.35rem;">${this.translate('pending_status', 'Pending')}</span>
                  <button class="btn btn-secondary btn-small" style="color: var(--text-muted); padding: 0.25rem 0.5rem; font-size: 0.75rem;" onclick="app.declineConnectionRequest('${c.id}')">${this.translate('cancel_btn', 'Cancel')}</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // C. Active Partnerships Directory
    if (established.length === 0) {
      if (incoming.length === 0 && sent.length === 0) {
        html += `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; color: var(--text-muted); text-align: center; border: 1px dashed var(--panel-border); border-radius: 8px; padding: 1.5rem;">
            <span style="font-size: 2rem; margin-bottom: 0.5rem;">🤝</span>
            <h4 style="margin: 0; font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">${this.translate('no_school_partnerships', 'No School Partnerships')}</h4>
            <p style="font-size: 0.75rem; margin-top: 0.25rem; color: var(--text-secondary);">${this.translate('no_school_partnerships_desc', 'Use the "New Connection" panel on the left to link with partner schools.')}</p>
          </div>
        `;
      }
    } else {
      html += established.map(c => {
        const partnerSchoolId = c.fromSchoolId === schoolId ? c.toSchoolId : c.fromSchoolId;
        const school = window.db.getSchool(partnerSchoolId);
        if (!school) return '';

        const flag = this.getSchoolFlag(school.country);
        const partnerCoordinator = window.db.getCoordinators().find(co => co.schoolId === partnerSchoolId);

        // Metrics calculations
        const myStudents = window.db.getStudents().filter(s => s.schoolId === schoolId);
        const linkedStudentsCount = window.db.getMatches().filter(m => 
          m.active && 
          m.studentIds.some(sid => myStudents.some(ms => ms.id === sid)) &&
          m.studentIds.some(sid => {
            const studentObj = window.db.getStudent(sid);
            return studentObj && studentObj.schoolId === partnerSchoolId;
          })
        ).length;

        const sharedProjectsCount = window.db.getProjects().filter(p => 
          p.status !== 'Cancelled' &&
          ((p.creatorSchoolId === schoolId && p.targetSchoolId === partnerSchoolId) ||
           (p.creatorSchoolId === partnerSchoolId && p.targetSchoolId === schoolId))
        ).length;

        let coordHtml = '';
        if (partnerCoordinator) {
          coordHtml = `
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; border-top: 1px solid rgba(255, 255, 255, 0.04); padding-top: 0.75rem; margin-top: 0.75rem; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--panel-border); overflow: hidden; background: rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.95rem; font-weight: bold; color: var(--text-muted);">
                  ${partnerCoordinator.photoUrl ? `<img src="${partnerCoordinator.photoUrl}" alt="${partnerCoordinator.name}" style="width: 100%; height: 100%; object-fit: cover;" />` : partnerCoordinator.name.charAt(0)}
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.15rem; line-height: 1.35;">
                  <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">${this.translate('school_coordinator_label', 'School Coordinator')}</span>
                  <strong style="font-size: 1.05rem; color: var(--text-primary);">${partnerCoordinator.name}</strong>
                  ${partnerCoordinator.email ? `<span style="font-size: 0.95rem; color: var(--text-muted);">✉️ <a href="mailto:${partnerCoordinator.email}" style="color: var(--secondary); text-decoration: underline;">${partnerCoordinator.email}</a></span>` : ''}
                </div>
              </div>
              <button class="btn btn-secondary" style="font-size: 0.95rem; font-weight: 600; padding: 0.4rem 0.85rem;" onclick="app.messageCoordinatorFromGallery('${partnerCoordinator.id}')">
                💬 <span data-localize="message_coordinator_btn">Message</span>
              </button>
            </div>
          `;
        }

        return `
          <div class="panel" style="padding: 1.25rem; background: var(--panel-bg); border: 1px solid var(--panel-border); border-radius: 8px; display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.75rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;" onclick="app.openSchoolDetail('${school.id}')">
                <span style="font-size: 1.75rem;">🏫</span>
                <div>
                  <h4 style="font-weight: 800; font-size: 1.15rem; margin: 0; color: var(--text-primary); text-decoration: underline;">
                    ${flag} ${school.name}
                  </h4>
                  <span style="font-size: 0.95rem; color: var(--text-muted);">📍 ${school.city}, ${school.country}</span>
                </div>
              </div>
              
              <button 
                class="btn btn-secondary"
                style="color: var(--danger); border-color: rgba(239, 68, 68, 0.25); padding: 0.4rem 0.85rem; font-size: 0.95rem;"
                onclick="app.removeSchoolConnection('${c.id}')"
              >
                ${this.translate('disconnect_btn', 'Disconnect')}
              </button>
            </div>

            <p style="font-size: 0.95rem; color: var(--text-secondary); margin: 0; line-height: 1.45;">
              ${school.description || this.translate('no_description_provided_by_school', 'No description provided by school.')}
            </p>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; background: rgba(255, 255, 255, 0.02); padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid var(--panel-border);">
              <div style="display: flex; flex-direction: column; gap: 0.15rem;">
                <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">${this.translate('linked_students_metric', 'Linked Students')}</span>
                <strong style="font-size: 1.05rem; color: var(--secondary);">${linkedStudentsCount} ${this.translate('pairings_suffix', 'Pairing(s)')}</strong>
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.15rem;">
                <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">${this.translate('shared_group_projects_metric', 'Shared Group Projects')}</span>
                <strong style="font-size: 1.05rem; color: var(--secondary);">${sharedProjectsCount} ${this.translate('projects_suffix', 'Project(s)')}</strong>
              </div>
            </div>

            ${coordHtml}
          </div>
        `;
      }).join('');
    }

    directoryEl.innerHTML = html;
  }

  handleSendConnectionRequest(event) {
    event.preventDefault();
    const selectEl = document.getElementById('connect-target-school-select');
    const msgEl = document.getElementById('connect-message-note');
    const targetSchoolId = selectEl.value;
    const requestMessage = msgEl.value.trim();

    if (!targetSchoolId) return;

    const teacher = this.getLoggedTeacher();
    const schoolId = teacher ? teacher.schoolId : 'school_1';
    const requestorBio = teacher ? (teacher.bio || '') : '';

    window.db.addSchoolConnection({
      fromSchoolId: schoolId,
      toSchoolId: targetSchoolId,
      requestMessage,
      requestorBio
    });

    // Add audit log
    const name = teacher ? teacher.name : this.translate('teacher_label', 'Teacher');
    const targetSchool = window.db.getSchool(targetSchoolId);
    window.db.addLog('Connection Requested', `Sent connection request to ${targetSchool ? targetSchool.name : 'another school'}.`, name);

    alert(this.translate('connection_request_sent_success', 'Connection request sent successfully!'));
    msgEl.value = '';
    this.refreshUI();
  }

  openDiscoverSchoolsModal() {
    const teacher = this.getLoggedTeacher();
    const schoolId = teacher ? teacher.schoolId : 'school_1';

    const connections = window.db.getSchoolConnections();
    const connectedOrRequestedSchoolIds = connections.filter(c => 
      c.fromSchoolId === schoolId || c.toSchoolId === schoolId
    ).map(c => c.fromSchoolId === schoolId ? c.toSchoolId : c.fromSchoolId);

    const unconnectedSchools = window.db.getSchools().filter(s => 
      s.id !== schoolId && !connectedOrRequestedSchoolIds.includes(s.id)
    );

    const galleryContainer = document.getElementById('discover-schools-gallery');
    if (!galleryContainer) return;

    galleryContainer.innerHTML = '';

    if (unconnectedSchools.length === 0) {
      galleryContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 3rem; font-size: 0.9rem;">
          ${this.translate('no_new_schools_available', 'All available schools are already connected or have pending requests!')}
        </div>
      `;
    } else {
      unconnectedSchools.forEach(s => {
        const coords = window.db.getCoordinators().filter(c => c.schoolId === s.id);
        const coord = coords[0]; // Primary coordinator
        const coordText = coord ? `${coord.name} (${coord.email})` : this.translate('no_coordinator_registered', 'No coordinator registered');

        const card = document.createElement('div');
        card.className = 'panel';
        card.style.cssText = 'display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--panel-border); border-radius: 12px; background: rgba(255,255,255,0.01); transition: transform 0.2s, box-shadow 0.2s; box-sizing: border-box; text-align: left;';
        
        const campusPhoto = s.campusPhotoUrl || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=400&q=80';
        const schoolLogo = s.logoUrl || 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=100&q=80';

        card.innerHTML = `
          <div style="position: relative; height: 120px; background: var(--bg-dark);">
            <img src="${campusPhoto}" alt="${s.name}" style="width: 100%; height: 100%; object-fit: cover; opacity: 0.7;">
            <img src="${schoolLogo}" alt="${s.name} logo" style="position: absolute; bottom: -15px; left: 1rem; width: 44px; height: 44px; border-radius: 8px; border: 2px solid var(--panel-bg); object-fit: cover; background: var(--bg-dark);">
          </div>
          <div style="padding: 1.25rem 1rem 1rem 1rem; flex-grow: 1; display: flex; flex-direction: column; gap: 0.75rem; margin-top: 5px; box-sizing: border-box;">
            <div>
              <h4 style="font-weight: 700; font-size: 1.15rem; margin: 0; color: var(--text-primary); display: flex; align-items: center; gap: 0.35rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">
                ${this.getSchoolFlag(s.country)} ${s.name}
              </h4>
              <span style="font-size: 0.95rem; color: var(--text-secondary); font-weight: 500;">${s.city}, ${s.country}</span>
            </div>
            
            <p style="font-size: 1rem; line-height: 1.5; color: var(--text-muted); margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; height: 4.5em;">
              ${this.translate(s.id + '_desc', s.description) || this.translate('no_description_available', 'No biography available for this school.')}
            </p>
            
            <div style="margin-top: auto; border-top: 1px solid var(--panel-border); padding-top: 0.75rem; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.4;">
              <strong style="color: var(--text-primary); font-size: 0.95rem;">${this.translate('coordinator_label', 'Coordinator')}:</strong><br>
              ${coordText}
            </div>
            
            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
              ${coord ? `<button class="btn btn-secondary" onclick="app.messageCoordinatorFromGallery('${coord.id}')" style="flex: 1; justify-content: center; font-size: 1rem; padding: 0.55rem 1rem;">💬 ${this.translate('message_btn', 'Message')}</button>` : ''}
              <button class="btn btn-primary" onclick="app.requestConnectionFromGallery('${s.id}')" style="flex: 1.2; justify-content: center; font-size: 1rem; padding: 0.55rem 1rem; color: #0b0f19;" onmouseover="this.style.filter='brightness(1.15)'" onmouseout="this.style.filter='none'">🤝 ${this.translate('connect_action_btn', 'Connect')}</button>
            </div>
          </div>
        `;
        galleryContainer.appendChild(card);
      });
    }

    this.openModal('discover-schools-modal');
  }

  messageCoordinatorFromGallery(coordId) {
    this.closeModal('discover-schools-modal');
    this.activeCoordinatorId = coordId;
    this.switchTab('teach-messages');
  }

  requestConnectionFromGallery(targetSchoolId) {
    this.closeModal('discover-schools-modal');
    this.openConnectRequestModal(targetSchoolId);
  }

  // Opens connection request modal
  openConnectRequestModal(targetSchoolId) {
    const school = window.db.getSchool(targetSchoolId);
    if (!school) return;

    const teacher = this.getLoggedTeacher();
    const bioText = teacher ? (teacher.bio || '') : '';

    document.getElementById('connect-target-school-id').value = targetSchoolId;
    document.getElementById('connect-target-school-name').textContent = school.name;
    document.getElementById('connect-target-school-meta').innerHTML = `${this.getSchoolFlag(school.country)} ${school.city}, ${school.country}`;
    document.getElementById('connect-requestor-bio').value = bioText;
    document.getElementById('connect-personalised-msg').value = '';

    this.openModal('connect-request-modal');
  }

  // Accepts incoming request
  acceptConnectionRequest(requestId) {
    window.db.updateSchoolConnection(requestId, { status: 'Connected', connectedAt: new Date().toISOString() });
    
    // Add audit log
    const conn = window.db.getSchoolConnections().find(c => c.id === requestId);
    const teacher = this.getLoggedTeacher();
    const name = teacher ? teacher.name : this.translate('teacher_label', 'Teacher');
    const otherSchool = window.db.getSchool(conn ? conn.fromSchoolId : '');
    window.db.addLog('School Connected', `Accepted connection request from ${otherSchool ? otherSchool.name : 'another school'}.`, name);

    alert(this.translate('connection_accepted_success', 'Connection accepted successfully! You can now pair students with this school.'));
    this.refreshUI();
    this.renderSchoolConnections();
  }

  // Declines / Cancels a request
  declineConnectionRequest(requestId) {
    window.db.deleteSchoolConnection(requestId);
    alert(this.translate('connection_request_removed', 'Connection request removed.'));
    this.refreshUI();
    this.renderSchoolConnections();
  }

  // Disconnects an established link gracefully
  removeSchoolConnection(connectionId) {
    const conn = window.db.getSchoolConnections().find(c => c.id === connectionId);
    if (!conn) return;

    const teacher = this.getLoggedTeacher();
    const ownSchoolId = teacher ? teacher.schoolId : 'school_1';
    const partnerSchoolId = conn.fromSchoolId === ownSchoolId ? conn.toSchoolId : conn.fromSchoolId;
    const partnerSchool = window.db.getSchool(partnerSchoolId);
    const partnerName = partnerSchool ? partnerSchool.name : 'this school';

    // Count active matches with this school
    const matches = window.db.getMatches().filter(m => m.active && 
      m.studentIds.some(id => {
        const stud = window.db.getStudent(id);
        return stud && stud.schoolId === ownSchoolId;
      }) &&
      m.studentIds.some(id => {
        const stud = window.db.getStudent(id);
        return stud && stud.schoolId === partnerSchoolId;
      })
    );

    let msg = this.translate('disconnect_confirm_base', 'Are you sure you want to disconnect from {partnerName}? You will no longer be able to propose new match suggestions.').replace('{partnerName}', partnerName);
    if (matches.length > 0) {
      msg += '\n\n' + this.translate('disconnect_confirm_matches_count', 'There are currently {count} active connection matches between your schools.').replace('{count}', matches.length);
    }

    if (confirm(msg)) {
      let disbandMatches = false;
      if (matches.length > 0) {
        disbandMatches = confirm(this.translate('disconnect_confirm_disband_option', 'Do you also want to immediately DISBAND the {count} active student matches with {partnerName}?\n\n- Click OK to disconnect and end all matches.\n- Click Cancel to disconnect but keep existing matches active.').replace('{count}', matches.length).replace('{partnerName}', partnerName));
      }

      if (disbandMatches) {
        matches.forEach(m => {
          window.db.deleteMatch(m.id);
        });
      }

      window.db.deleteSchoolConnection(connectionId);
      
      const name = teacher ? teacher.name : this.translate('teacher_label', 'Teacher');
      window.db.addLog('School Disconnected', `Removed school connection with ${partnerName}. Disbanded matches: ${disbandMatches ? 'Yes' : 'No'}`, name);

      alert(this.translate('disconnect_success', 'Successfully disconnected from {partnerName}.{disband_info}').replace('{partnerName}', partnerName).replace('{disband_info}', disbandMatches ? ' ' + this.translate('disconnect_disband_info', 'All student matches were disbanded.') : ''));
      this.refreshUI();
      this.renderSchoolConnections();
    }
  }

  openBioModal(studentId) {
    const student = window.db.getStudent(studentId);
    if (!student) return;

    const firstName = student.name.split(' ')[0];
    const biog = student.personalBiog || student.pendingBiog || this.translate('no_biography_written', 'No biography text written by this student yet.');

    const titleEl = document.getElementById('bio-modal-title');
    const bodyEl = document.getElementById('bio-modal-body');

    if (titleEl && bodyEl) {
      titleEl.textContent = this.translate('student_biography_title', "{name}'s Biography").replace('{name}', firstName);
      bodyEl.textContent = `"${biog}"`;
      this.openModal('view-bio-modal');
    }
  }

  // Renders safeguarding control table
  setSafeguardFilter(filter) {
    this.safeguardFilter = filter;
    this.renderTeacherSafeguarding();
  }

  renderTeacherSafeguarding() {
    const tbody = document.getElementById('safeguarding-alerts-tbody');
    const teacher = this.getLoggedTeacher();
    const mySchoolId = teacher?.schoolId;
    
    const allFlags = window.db.getFlags();
    const flags = allFlags.filter(flag => {
      const { schoolId1, schoolId2 } = window.db.getSchoolsForFlag(flag);
      return schoolId1 === mySchoolId || schoolId2 === mySchoolId;
    });

    const openFlags = flags.filter(flag => {
      const resolutions = window.db.getFlagResolutions(flag);
      return (resolutions[mySchoolId]?.status !== 'Resolved');
    });
    const resolvedFlags = flags.filter(flag => {
      const resolutions = window.db.getFlagResolutions(flag);
      return (resolutions[mySchoolId]?.status === 'Resolved');
    });

    // Update counts in sub-tabs UI
    const countOpenEl = document.getElementById('safeguard-count-open');
    const countResolvedEl = document.getElementById('safeguard-count-resolved');
    if (countOpenEl) countOpenEl.textContent = openFlags.length;
    if (countResolvedEl) countResolvedEl.textContent = resolvedFlags.length;

    // Update sub-tabs UI active state
    const btnOpen = document.getElementById('safeguard-tab-open');
    const btnResolved = document.getElementById('safeguard-tab-resolved');
    if (btnOpen && btnResolved) {
      if (this.safeguardFilter === 'open') {
        btnOpen.style.background = 'rgba(239, 68, 68, 0.15)';
        btnOpen.style.borderColor = 'var(--danger)';
        btnOpen.style.color = 'var(--danger)';
        btnResolved.style.background = 'transparent';
        btnResolved.style.borderColor = 'var(--panel-border)';
        btnResolved.style.color = 'var(--text-secondary)';
      } else {
        btnOpen.style.background = 'transparent';
        btnOpen.style.borderColor = 'var(--panel-border)';
        btnOpen.style.color = 'var(--text-secondary)';
        btnResolved.style.background = 'rgba(16, 185, 129, 0.15)';
        btnResolved.style.borderColor = 'var(--success)';
        btnResolved.style.color = 'var(--success)';
      }
    }

    const displayFlags = this.safeguardFilter === 'open' ? openFlags : resolvedFlags;

    tbody.innerHTML = '';
    if (displayFlags.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">${this.safeguardFilter === 'open' ? this.translate('safeguarding_no_open_alerts', 'No open safeguarding alerts pending review.') : this.translate('safeguarding_no_resolved_alerts', 'No resolved safeguarding alerts recorded.')}</td></tr>`;
      return;
    }

    // Sort: Date descending
    const sortedFlags = [...displayFlags].sort((a, b) => {
      const aResolutions = window.db.getFlagResolutions(a);
      const bResolutions = window.db.getFlagResolutions(b);
      const aMyPending = (aResolutions[mySchoolId]?.status !== 'Resolved');
      const bMyPending = (bResolutions[mySchoolId]?.status !== 'Resolved');
      
      if (aMyPending && !bMyPending) return -1;
      if (!aMyPending && bMyPending) return 1;
      return new Date(b.flaggedAt) - new Date(a.flaggedAt);
    });

    sortedFlags.forEach(flag => {
      // Get resolutions
      const resolutions = window.db.getFlagResolutions(flag);
      const myResolution = resolutions[mySchoolId] || { status: 'Pending' };
      
      // Identify other school
      const { schoolId1, schoolId2 } = window.db.getSchoolsForFlag(flag);
      const otherSchoolId = schoolId1 === mySchoolId ? schoolId2 : schoolId1;
      const otherSchool = otherSchoolId ? window.db.getSchool(otherSchoolId) : null;
      const otherResolution = otherSchoolId ? resolutions[otherSchoolId] : null;

      let statusBadgeHtml = `
        <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-start; min-width: 155px; line-height: 1.35;">
          <!-- Your School Status -->
          <div style="display: flex; flex-direction: column; gap: 0.2rem; width: 100%;">
            <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px;">${this.translate('your_school_label', 'Your School')}</span>
            <div>
              ${myResolution.status === 'Resolved' 
                ? `<span class="badge badge-success" style="font-size: 0.75rem; padding: 0.15rem 0.45rem; font-weight: 600;">${this.translate('resolved_status', 'Resolved')}</span>`
                : `<span class="badge badge-danger" style="font-size: 0.75rem; padding: 0.15rem 0.45rem; font-weight: 600;">${this.translate('safeguarding_unresolved_badge', 'Unresolved')}</span>`}
            </div>
          </div>
      `;

      if (otherSchool) {
        const flagImg = this.getSchoolFlag(otherSchool.country);
        statusBadgeHtml += `
          <!-- Partner School Status -->
          <div style="display: flex; flex-direction: column; gap: 0.2rem; border-top: 1px solid var(--panel-border); padding-top: 0.4rem; width: 100%;">
            <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px; display: flex; align-items: center; gap: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 155px;" title="${otherSchool.name}">
              ${flagImg} ${otherSchool.name}
            </span>
            <div>
              ${otherResolution && otherResolution.status === 'Resolved'
                ? `<span class="badge badge-success" style="font-size: 0.75rem; padding: 0.15rem 0.45rem; font-weight: 600;">${this.translate('resolved_status', 'Resolved')}</span>
                   <div style="font-size: 0.7rem; color: var(--text-muted); font-style: italic; margin-top: 0.15rem; line-height: 1.35;">"${otherResolution.resolutionNotes || this.translate('safeguarding_no_comment', 'No comment')}"</div>`
                : `<span class="badge badge-danger" style="font-size: 0.75rem; padding: 0.15rem 0.45rem; font-weight: 600;">${this.translate('safeguarding_unresolved_badge', 'Unresolved')}</span>`}
            </div>
          </div>
        `;
      }
      statusBadgeHtml += `</div>`;

      const isProjectFlag = !!flag.projectId;
      let flagTitle = '';
      let flagSubtitle = '';
      let flagReasonText = '';
      let flagDetailsText = '';

      if (isProjectFlag) {
        const proj = window.db.getProject(flag.projectId);
        flagTitle = flag.reportedBy || this.translate('student_label_default', 'Student');
        flagSubtitle = `<span style="font-size: 0.75rem; font-weight: normal; color: var(--text-muted);">	ext{${this.translate('culture_post_project', 'Project')}}: 	ext{${proj ? proj.title : 'N/A'}}</span>`;
        flagReasonText = `${this.translate('project_concern_label', 'Project Concern')}: ${flag.reason || this.translate('safety_alert_label', 'Safety Alert')}`;
        flagDetailsText = flag.details || '';
      } else {
        const msg = window.db.getMessages().find(m => m.id === flag.messageId);
        const sender = msg ? window.db.getStudent(msg.senderId) : null;
        const match = msg ? window.db.getMatches().find(m => m.id === msg.matchId) : null;
        flagTitle = sender ? sender.name : flag.reportedBy || this.translate('student_label_default', 'Student');
        flagSubtitle = `<span style="font-size: 0.75rem; font-weight: normal; color: var(--text-muted);">Match ID: ${match ? match.id : 'N/A'}</span>`;
        flagReasonText = `${this.translate('safeguarding_reason_label', 'Reason:')} ${flag.reason || msg?.flagReason || this.translate('triggered_keyword_alert', 'Triggered Keyword alert')}`;
        flagDetailsText = msg ? msg.text : 'N/A';
      }

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${new Date(flag.flaggedAt).toLocaleString()}</td>
        <td style="font-weight: 600;">
          ${flagTitle}<br>
          ${flagSubtitle}
        </td>
        <td>
          <strong style="color: var(--danger); font-size: 0.8rem;">${flagReasonText}</strong>
          <div style="font-size: 0.85rem; font-style: italic; background: rgba(0,0,0,0.1); padding: 0.5rem; border-radius: 6px; margin-top: 0.25rem;">
            "${flagDetailsText}"
          </div>
        </td>
        <td>${statusBadgeHtml}</td>
        <td>
          ${myResolution.status !== 'Resolved'
            ? `<button class="btn btn-danger btn-small" onclick="app.openResolveFlagModal('${flag.id}')">${this.translate('review_take_action_btn', 'Review & Take Action')}</button>`
            : `<div style="display: flex; flex-direction: column; gap: 0.35rem;">
                 <span style="font-size: 0.75rem; color: var(--text-muted);">${this.translate('resolved_by_label', 'Resolved by')}:<br>${myResolution.reviewedBy}<br>${this.translate('action_label', 'Action')}: ${myResolution.actionTaken}</span>
                 <button class="btn btn-secondary btn-small" style="font-size: 0.7rem; padding: 0.2rem 0.4rem;" onclick="app.openResolveFlagModal('${flag.id}')">${this.translate('view_details', 'View Details')}</button>
               </div>`}
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  openResolveFlagModal(flagId, tabId = 'details') {
    const flag = window.db.getFlags().find(f => f.id === flagId);
    if (!flag) return;

    const isProjectFlag = !!flag.projectId;
    let chatContextMarkup = '';
    let slidesMarkup = '';
    let participantsMarkup = '';
    let sender = null;
    let match = null;
    let proj = null;

    let projectChatMarkup = '';
    if (isProjectFlag) {
      proj = window.db.getProject(flag.projectId);
      if (proj) {
        if (proj.slides) {
          slidesMarkup = proj.slides.map((s, idx) => {
            let imgMarkup = '';
            if (s.photoUrl) {
              imgMarkup = `
                <div style="width: 100%; height: 80px; background: rgba(0,0,0,0.2); border-radius: 4px; overflow: hidden; margin-top: 0.25rem; border: 1px solid var(--panel-border); display: flex; align-items: center; justify-content: center;">
                  <img src="${s.photoUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                </div>
              `;
            }
            const editBadge = s.editableByOthers !== false ? '🔓 Group Editable' : '🔒 Author Locked';
            return `
              <div id="flag-proj-slide-${s.id}" style="padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.01); border: 1px solid var(--panel-border); border-radius: 6px; margin-bottom: 0.4rem; font-size: 0.8rem; display: flex; flex-direction: column; gap: 0.25rem;">
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: bold;">
                  <span style="color: var(--text-primary);">Slide ${idx + 1}: ${s.title || 'Untitled'}</span>
                  <span style="font-weight: normal; color: var(--text-muted); font-size: 0.7rem;">by ${s.author} • ${editBadge}</span>
                </div>
                <div style="font-size: 0.75rem; color: var(--text-secondary); white-space: pre-wrap; line-height: 1.4;">${s.content || '(Empty content)'}</div>
                ${imgMarkup}
                <div style="display: flex; justify-content: flex-end; margin-top: 0.2rem;">
                  <button type="button" class="btn btn-secondary btn-small" style="font-size: 0.7rem; padding: 0.15rem 0.4rem; height: auto;" onclick="app.startEditingSlideInline('${flag.id}', '${proj.id}', '${s.id}')">✏️ Edit Content</button>
                </div>
              </div>
            `;
          }).join('');
        }

        // Prepare project chat history
        const projMsgs = window.db.getMessages().filter(m => m.projectId === flag.projectId);
        if (projMsgs.length === 0) {
          projectChatMarkup = `<p style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">${this.translate('no_group_messages_yet', 'No messages in group chat yet.')}</p>`;
        } else {
          projectChatMarkup = projMsgs.map(m => {
            const senderName = window.db.getStudent(m.senderId)?.name || m.senderName || this.translate('student_label_default', 'Student');
            const country = window.db.getStudent(m.senderId) ? window.db.getSchool(window.db.getStudent(m.senderId).schoolId)?.country : '';
            const flagSvg = country ? app.getSchoolFlag(country) : '';
            return `
              <div style="font-size: 0.75rem; line-height: 1.4; margin-bottom: 0.3rem;">
                <strong>${flagSvg} <span style="color: var(--text-primary);">${senderName}:</span></strong>
                <span style="color: var(--text-secondary);">${m.text}</span>
                ${m.translation ? `<div style="font-size: 0.7rem; color: var(--text-muted); padding-left: 0.5rem; font-style: italic;">📝 ${m.translation}</div>` : ''}
              </div>
            `;
          }).join('');
        }
      }
        
      if (proj) {
        const studentIds = [...proj.creatorSchoolStudentIds, ...proj.targetSchoolStudentIds];
        participantsMarkup = studentIds.map(sid => {
          const s = window.db.getStudent(sid);
          if (!s) return '';
          return `
            <label style="display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; cursor: pointer; margin-right: 0.75rem; color: var(--text-primary);">
              <input type="checkbox" name="proj-flag-recipient" value="${sid}" checked>
              <span>${s.name.split(' ')[0]}</span>
            </label>
          `;
        }).join('');
      }
    } else {
      const msg = window.db.getMessages().find(m => m.id === flag.messageId);
      sender = msg ? window.db.getStudent(msg.senderId) : null;
      match = msg ? window.db.getMatches().find(m => m.id === msg.matchId) : null;
      
      // Get chat context (last 4 messages before flagged one)
      if (match) {
        const matchMsgs = window.db.getMessages().filter(m => m.matchId === match.id);
        const flaggedIdx = matchMsgs.findIndex(m => m.id === msg.id);
        
        const contextStart = Math.max(0, flaggedIdx - 3);
        const contextMsgs = matchMsgs.slice(contextStart, flaggedIdx + 1);

        chatContextMarkup = contextMsgs.map(m => {
          const isFlagged = m.id === msg.id;
          const senderName = window.db.getStudent(m.senderId)?.name || this.translate('student_label_default', 'Student');
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
    }

    const teacher = this.getLoggedTeacher();
    const mySchoolId = teacher?.schoolId;
    const resolutions = window.db.getFlagResolutions(flag);
    const myResolution = resolutions[mySchoolId] || { status: 'Pending' };

    const { schoolId1, schoolId2 } = window.db.getSchoolsForFlag(flag);
    const otherSchoolId = schoolId1 === mySchoolId ? schoolId2 : schoolId1;
    const otherSchool = otherSchoolId ? window.db.getSchool(otherSchoolId) : null;
    const otherResolution = otherSchoolId ? resolutions[otherSchoolId] : null;

    let partnerSchoolStatusMarkup = '';
    if (otherSchool) {
      const otherFlagImg = this.getSchoolFlag(otherSchool.country);
      if (otherResolution && otherResolution.status === 'Resolved') {
        partnerSchoolStatusMarkup = `
          <div class="panel" style="padding: 0.75rem; background: rgba(255,255,255,0.02); border-color: var(--panel-border); margin-bottom: 0.75rem;">
            <h5 style="font-size: 0.8rem; font-weight: 700; color: var(--success); margin: 0 0 0.25rem 0; display: flex; align-items: center; gap: 0.3rem;">
              ${otherFlagImg} ${this.translate('partner_school_label', 'Partner School')} (${otherSchool.name}) ${this.translate('resolution_label_lowercase', 'resolution')}:
            </h5>
            <p style="font-size: 0.75rem; color: var(--text-secondary); margin: 0 0 0.25rem 0;">
              ${this.translate('status_label', 'Status')}: <strong>${this.translate('resolved_status', 'Resolved')}</strong> ${this.translate('by_author_lowercase', 'by')} <strong>${otherResolution.reviewedBy}</strong> ${this.translate('on_label', 'on')} <strong>${new Date(otherResolution.reviewedAt).toLocaleString()}</strong>
            </p>
            <p style="font-size: 0.75rem; color: var(--text-secondary); margin: 0 0 0.25rem 0;">
              ${this.translate('action_taken_label', 'Action Taken')}: <span class="badge badge-success" style="font-size: 0.65rem; padding: 0.05rem 0.25rem;">${otherResolution.actionTaken}</span>
            </p>
            <p style="font-size: 0.75rem; color: var(--text-primary); background: rgba(0,0,0,0.15); padding: 0.4rem; border-radius: 4px; margin: 0.25rem 0 0 0; font-style: italic;">
              Comment: "${otherResolution.resolutionNotes || this.translate('safeguarding_no_comment', 'No comment')}"
            </p>
          </div>
        `;
      } else {
        partnerSchoolStatusMarkup = `
          <div class="panel" style="padding: 0.75rem; background: rgba(255,255,255,0.01); border-color: var(--panel-border); margin-bottom: 0.75rem;">
            <h5 style="font-size: 0.8rem; font-weight: 700; color: var(--warning); margin: 0 0 0.25rem 0; display: flex; align-items: center; gap: 0.3rem;">
              ${otherFlagImg} ${this.translate('partner_school_label', 'Partner School')} (${otherSchool.name}) ${this.translate('resolution_label_lowercase', 'resolution')}:
            </h5>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0;">
              ${this.translate('status_label', 'Status')}: <strong>${this.translate('pending_partner_review', 'Pending review / Unresolved by partner school')}</strong>
            </p>
          </div>
        `;
      }
    }

    let actionsMarkup = '';
    if (myResolution.status === 'Resolved') {
      actionsMarkup = `
        <div class="panel" style="padding: 1rem; border-color: rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.02); margin-bottom: 0.75rem; display: flex; flex-direction: column; gap: 0.35rem;">
          <h4 style="font-size: 0.85rem; color: var(--success); font-weight: bold; margin: 0; display: flex; align-items: center; gap: 0.35rem;">${this.translate('safeguarding_resolved_you_school', '✔ Safeguarding Violation Resolved by Your School')}</h4>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0;">
            ${this.translate('resolved_by_label', 'Resolved by')} <strong>${myResolution.reviewedBy}</strong> ${this.translate('on_label', 'on')} <strong>${new Date(myResolution.reviewedAt).toLocaleString()}</strong>.
          </p>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0;">
            ${this.translate('action_taken_label', 'Action Taken')}: <span class="badge badge-success" style="font-size: 0.65rem; padding: 0.05rem 0.25rem;">${myResolution.actionTaken}</span>
          </p>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 0;">
            ${this.translate('notes_label', 'Notes')}: <span style="font-style: italic; color: var(--text-primary);">"${myResolution.resolutionNotes || ''}"</span>
          </p>
        </div>
        ${partnerSchoolStatusMarkup}
        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem;">
          <button class="btn btn-secondary btn-small" onclick="app.closeModal('resolve-flag-modal')">${this.translate('close_btn', 'Close')}</button>
        </div>
      `;
    } else {
      actionsMarkup = `
        ${partnerSchoolStatusMarkup}
        <div>
          <!-- Project-specific messaging forms if it is a project flag -->
          ${isProjectFlag ? `
            <div class="panel" style="padding: 1rem; border-color: var(--panel-border); background: rgba(255, 255, 255, 0.01); margin-bottom: 0.75rem; display: flex; flex-direction: column; gap: 0.75rem;">
              <h4 style="font-size: 0.85rem; font-weight: bold; margin: 0; color: var(--text-primary);">${this.translate('teacher_action_desk_header', 'Teacher Action Desk')}</h4>
              
              <!-- 1. Send Message to Project Group Chat -->
              <div style="display: flex; flex-direction: column; gap: 0.35rem;">
                <label style="font-size: 0.8rem; font-weight: bold; color: var(--text-secondary);">${this.translate('send_project_warning_label', 'Send Warning Message to Project Group Chat:')}</label>
                <div style="display: flex; gap: 0.5rem;">
                  <input type="text" id="flag-project-group-msg-input" class="form-control" style="font-size: 0.8rem; padding: 0.35rem;" placeholder="${this.translate('project_warning_placeholder', 'Type message to the whole project team...')}">
                  <button type="button" class="btn btn-primary" onclick="app.sendProjectFlagGroupMessage('${flag.id}')" style="font-size: 0.8rem; padding: 0 1rem;">${this.translate('send_btn', 'Send')}</button>
                </div>
              </div>

              <!-- 2. Send Message to Individual Students -->
              <div style="display: flex; flex-direction: column; gap: 0.35rem; border-top: 1px dashed var(--panel-border); padding-top: 0.75rem;">
                <label style="font-size: 0.8rem; font-weight: bold; color: var(--text-secondary);">${this.translate('send_individual_warning_label', 'Send Warning Notice to Individual Students:')}</label>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.25rem;">
                  ${participantsMarkup}
                </div>
                <textarea id="flag-project-individual-msg-text" class="form-control" style="height: 50px; font-size: 0.8rem; resize: none;" placeholder="${this.translate('individual_warning_placeholder', 'Type warning notice text...')}"></textarea>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.2rem;">
                  <label style="display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; cursor: pointer; color: var(--text-primary);">
                    <input type="checkbox" id="flag-project-individual-msg-agree">
                    <span>${this.translate('require_agreement_label', 'Require student agreement & confirmation')}</span>
                  </label>
                  <button type="button" class="btn btn-secondary btn-small" onclick="app.sendProjectFlagIndividualMessage('${flag.id}')" style="margin-left: auto;">${this.translate('send_notices_btn', 'Send Notices')}</button>
                </div>
              </div>
            </div>
          ` : ''}

          <div class="form-group" style="margin-bottom: 1.25rem;">
            <label for="flag-resolution-notes" style="font-size: 0.85rem; font-weight: 600; margin-bottom: 0.4rem; display: block; color: var(--text-primary);">${this.translate('resolution_notes_label', 'Action Taken / Resolution Notes (Your School):')}</label>
            <textarea class="form-control" id="flag-resolution-notes" style="height: 75px; font-size: 0.85rem; resize: vertical;" placeholder="${this.translate('resolution_notes_placeholder', 'Describe the action taken (e.g. discussed with student, monitored future messages)...')}" required></textarea>
          </div>
          <h4 style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; margin-bottom: 0.75rem;">${this.translate('select_resolution_action', 'Select Resolution Action:')}</h4>
          <div style="display: flex; gap: 0.5rem; justify-content: flex-end; flex-wrap: wrap;">
            <button class="btn btn-secondary btn-small" onclick="app.closeModal('resolve-flag-modal')">${this.translate('close_btn', 'Close')}</button>
            ${isProjectFlag ? `
              <button class="btn btn-secondary btn-small" style="color: var(--danger); border-color: rgba(239, 68, 68, 0.2);" onclick="app.submitFlagResolution('${flag.id}', 'Cancel Project')">${this.translate('cancel_project_btn', 'Cancel Project')}</button>
              <button class="btn btn-secondary btn-small" style="color: var(--warning); border-color: rgba(245, 158, 11, 0.2);" onclick="app.submitFlagResolution('${flag.id}', 'Suspend Project')">${this.translate('suspend_project_btn', 'Suspend Project')}</button>
            ` : `
              <button class="btn btn-secondary btn-small" style="color: var(--danger); border-color: rgba(239, 68, 68, 0.2);" onclick="app.submitFlagResolution('${flag.id}', 'Cancel Link')">${this.translate('cancel_student_link_btn', 'Cancel Student Link')}</button>
              <button class="btn btn-secondary btn-small" style="color: var(--warning); border-color: rgba(245, 158, 11, 0.2);" onclick="app.submitFlagResolution('${flag.id}', 'Suspend Chat')">${this.translate('suspend_chat_btn', 'Suspend Chat')}</button>
            `}
            <button class="btn btn-primary btn-small" onclick="app.submitFlagResolution('${flag.id}', 'Mark as Resolved')">	ext{${this.translate('mark_resolved_btn', 'Mark as Resolved')}}</button>
            <button class="btn btn-secondary btn-small" style="border-color: var(--success); color: var(--success);" onclick="app.submitFlagResolution('${flag.id}', 'Dismissed')">	ext{${this.translate('dismiss_safe_btn', 'Dismiss / Safe')}}</button>
          </div>
        </div>
      `;
    }

    let detailContentHtml = '';
    if (isProjectFlag) {
      detailContentHtml = `
        <div>
          <h4 style="font-size: 0.9rem; margin-bottom: 0.5rem; color: var(--text-primary);">${this.translate('project_slide_outline_header', 'Project Slide Outline:')}</h4>
          <div style="max-height: 180px; overflow-y: auto; padding-right: 0.25rem; margin-bottom: 0.75rem;">
            ${slidesMarkup || `<p style="font-size: 0.8rem; color: var(--text-muted);">${this.translate('no_slides_found', 'No slides found.')}</p>`}
          </div>
          
          <h4 style="font-size: 0.9rem; margin-bottom: 0.5rem; color: var(--text-primary);">${this.translate('project_chat_history_header', 'Project Group Chat History:')}</h4>
          <div style="max-height: 120px; overflow-y: auto; padding: 0.5rem; border: 1px solid var(--panel-border); border-radius: 6px; background: rgba(0,0,0,0.1); padding-right: 0.25rem;">
            ${projectChatMarkup}
          </div>
        </div>
      `;
    } else {
      detailContentHtml = `
        <div>
          <h4 style="font-size: 0.9rem; margin-bottom: 0.5rem; color: var(--text-primary);">${this.translate('recent_chat_history_header', 'Recent Chat History context:')}</h4>
          <div style="max-height: 200px; overflow-y: auto; padding-right: 0.25rem;">
            ${chatContextMarkup || `<p style="font-size: 0.8rem; color: var(--text-muted);">${this.translate('no_chat_context_loaded', 'No chat context loaded.')}</p>`}
          </div>
        </div>
      `;
    }

    const activeTab = tabId || 'details';

    // Premium navigation switcher tabs row
    const tabsRowMarkup = `
      <div style="display: flex; gap: 0.35rem; border-bottom: 1px solid var(--panel-border); padding-bottom: 0.75rem; margin-bottom: 0.75rem;">
        <button type="button" 
                style="background: ${activeTab === 'details' ? 'rgba(var(--primary-rgb), 0.12)' : 'none'}; 
                       border: 1px solid ${activeTab === 'details' ? 'var(--primary)' : 'transparent'}; 
                       color: ${activeTab === 'details' ? 'var(--text-primary)' : 'var(--text-secondary)'}; 
                       font-weight: 600; font-size: 0.8rem; cursor: pointer; padding: 0.4rem 0.85rem; border-radius: 8px; transition: all 0.2s; outline: none;"
                onclick="app.openResolveFlagModal('${flag.id}', 'details')">
          🛡️ ${this.translate('alert_details_tab', 'Alert Details')}
        </button>
        <button type="button" 
                style="background: ${activeTab === 'content' ? 'rgba(var(--primary-rgb), 0.12)' : 'none'}; 
                       border: 1px solid ${activeTab === 'content' ? 'var(--primary)' : 'transparent'}; 
                       color: ${activeTab === 'content' ? 'var(--text-primary)' : 'var(--text-secondary)'}; 
                       font-weight: 600; font-size: 0.8rem; cursor: pointer; padding: 0.4rem 0.85rem; border-radius: 8px; transition: all 0.2s; outline: none;"
                onclick="app.openResolveFlagModal('${flag.id}', 'content')">
          📁 ${this.translate('flagged_content_tab', 'Flagged Content')}
        </button>
        <button type="button" 
                style="background: ${activeTab === 'actions' ? 'rgba(var(--primary-rgb), 0.12)' : 'none'}; 
                       border: 1px solid ${activeTab === 'actions' ? 'var(--primary)' : 'transparent'}; 
                       color: ${activeTab === 'actions' ? 'var(--text-primary)' : 'var(--text-secondary)'}; 
                       font-weight: 600; font-size: 0.8rem; cursor: pointer; padding: 0.4rem 0.85rem; border-radius: 8px; transition: all 0.2s; outline: none;"
                onclick="app.openResolveFlagModal('${flag.id}', 'actions')">
          ⚡ ${this.translate('take_action_tab', 'Take Action')}
        </button>
      </div>
    `;

    let activeBodyMarkup = '';
    if (activeTab === 'details') {
      activeBodyMarkup = `
        <div style="font-size: 0.8rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.35rem;">
          <div>${this.translate('alert_type_label', 'Alert Type')}: <strong>${isProjectFlag ? this.translate('project_concern_label', 'Project Safeguarding Concern') : this.translate('chat_keyword_alert', 'Chat Sensitive Keyword Alert')}</strong></div>
          <div>${this.translate('alert_timestamp_label', 'Alert Timestamp')}: <strong>${new Date(flag.flaggedAt).toLocaleString()}</strong></div>
          <div>${this.translate('reporter_label', 'Reporter')}: <strong>${flag.reportedBy || (sender ? sender.name : this.translate('system_safeguard_reporter', 'System Safeguard'))}</strong></div>
        </div>
        
        <div class="panel" style="padding: 1rem; border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.02); margin-top: 0.5rem;">
          <h4 style="font-size: 0.9rem; color: var(--danger); font-weight: bold; margin-bottom: 0.5rem; margin-top: 0;">${this.translate('flagged_violation_reason_header', 'Flagged Violation Reason:')}</h4>
          <p style="font-size: 0.85rem; font-weight: 500; color: var(--text-primary); margin: 0;">${flag.reason || this.translate('sensitive_keyword_alert_default', 'Sensitive Keyword alert')}</p>
          ${flag.details ? `<p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.5rem; background: rgba(0,0,0,0.1); padding: 0.5rem; border-radius: 6px; margin-bottom: 0;">${this.translate('details_prefix', 'Details:')} ${flag.details}</p>` : ''}
        </div>

        <div style="margin-top: 0.5rem;">
          ${partnerSchoolStatusMarkup}
        </div>
      `;
    } else if (activeTab === 'content') {
      activeBodyMarkup = detailContentHtml;
    } else {
      activeBodyMarkup = actionsMarkup;
    }

    const container = document.getElementById('flag-detail-content');
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${tabsRowMarkup}
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          ${activeBodyMarkup}
        </div>
      </div>
    `;

    this.openModal('resolve-flag-modal');
  }

  // Teacher submits safeguarding resolution with validation
  submitFlagResolution(flagId, action) {
    const notesInput = document.getElementById('flag-resolution-notes');
    const notes = notesInput ? notesInput.value.trim() : '';
    if (notes.length < 5) {
      alert(this.translate('validation_resolution_notes', 'Please enter the action taken / resolution notes (minimum 5 characters) before resolving this flag.'));
      return;
    }
    this.executeFlagAction(flagId, action, notes);
  }

  sendProjectFlagGroupMessage(flagId) {
    const flag = window.db.getFlags().find(f => f.id === flagId);
    if (!flag || !flag.projectId) return;

    const input = document.getElementById('flag-project-group-msg-input');
    const text = input ? input.value.trim() : '';
    if (!text) {
      alert(this.translate('validation_enter_message', 'Please enter a message.'));
      return;
    }

    const teacher = this.getLoggedTeacher();
    const senderId = teacher ? teacher.id : 'coord_1';
    const senderName = teacher ? teacher.name : this.translate('teacher_label', 'Teacher');

    window.db.addProjectMessage(flag.projectId, senderId, senderName, text);
    
    if (input) input.value = '';
    alert(this.translate('msg_project_chat_sent', 'Warning message sent to project group chat.'));
  }

  sendProjectFlagIndividualMessage(flagId) {
    const flag = window.db.getFlags().find(f => f.id === flagId);
    if (!flag || !flag.projectId) return;

    const checkboxes = document.querySelectorAll('input[name="proj-flag-recipient"]:checked');
    const recipientIds = Array.from(checkboxes).map(cb => cb.value);
    
    if (recipientIds.length === 0) {
      alert(this.translate('validation_select_recipient', 'Please select at least one student recipient.'));
      return;
    }

    const textarea = document.getElementById('flag-project-individual-msg-text');
    const text = textarea ? textarea.value.trim() : '';
    if (!text) {
      alert(this.translate('validation_enter_warning_text', 'Please enter warning notice text.'));
      return;
    }

    const agreeCheckbox = document.getElementById('flag-project-individual-msg-agree');
    const requireAgreement = agreeCheckbox ? agreeCheckbox.checked : false;

    const teacher = this.getLoggedTeacher();
    const senderId = teacher ? teacher.id : 'coord_1';
    const senderName = teacher ? teacher.name : this.translate('teacher_label', 'Teacher');

    const list = window.db.getStaffStudentMessages();
    recipientIds.forEach(sid => {
      const newMsg = {
        id: 'ssm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        senderId,
        senderName,
        recipientId: sid,
        text,
        timestamp: new Date().toISOString(),
        requireAgreement,
        status: 'Unread',
        agreedAt: null
      };
      list.push(newMsg);

      const student = window.db.getStudent(sid);
      const studentName = student ? student.name : 'Student';
      window.db.addLog('Staff Notice Sent', `Teacher ${senderName} sent notice to student ${studentName}. Require Agreement: ${requireAgreement}`, senderName);
    });

    window.db.saveTable('staffStudentMessages', list);

    if (textarea) textarea.value = '';
    if (agreeCheckbox) agreeCheckbox.checked = false;
    alert(this.translate('msg_individual_notices_sent', 'Warning notices sent to selected students successfully.'));
  }

  // Teacher submits safeguarding resolution
  executeFlagAction(flagId, action, notes = '') {
    const teacher = this.getLoggedTeacher();
    const reviewer = teacher ? `${this.translate('teacher_label', 'Teacher')} ${teacher.name}` : 'System Admin';
    const schoolId = teacher ? teacher.schoolId : 'school_1';
    
    const flag = window.db.getFlags().find(f => f.id === flagId);
    
    if (flag) {
      window.db.resolveFlagForSchool(flagId, schoolId, reviewer, action, notes);
      
      if (flag.projectId) {
        if (action === 'Cancel Project') {
          window.db.updateProject(flag.projectId, { status: 'Cancelled', paused: false });
        } else if (action === 'Suspend Project') {
          window.db.updateProject(flag.projectId, { paused: true });
        } else if (action === 'Mark as Resolved' || action === 'Dismissed') {
          window.db.updateProject(flag.projectId, { paused: false });
        }
      } else {
        const msg = window.db.getMessages().find(m => m.id === flag.messageId);
        if (msg) {
          if (action === 'Cancel Link') {
            window.db.deleteMatch(msg.matchId);
          } else if (action === 'Suspend Chat') {
            window.db.pauseMatch(msg.matchId, true);
          } else if (action === 'Mark as Resolved' || action === 'Dismissed') {
            window.db.pauseMatch(msg.matchId, false);
          }
        }
      }

      this.closeModal('resolve-flag-modal');
      this.refreshUI();
      alert(this.translate('msg_issue_resolved', 'Safeguarding issue resolved. Action registered: {action}').replace('{action}', action));
    }
  }

  // Renders student article editorial desk submissions
  renderTeacherEditorDesk() {
    if (!this.editorialSubTab) {
      this.editorialSubTab = 'student';
    }
    const studentBtn = document.getElementById('subtab-btn-editor-student');
    const staffBtn = document.getElementById('subtab-btn-editor-staff');
    const studentView = document.getElementById('editor-student-subview');
    const staffView = document.getElementById('editor-staff-subview');
    if (studentBtn && staffBtn && studentView && staffView) {
      studentBtn.classList.remove('active');
      staffBtn.classList.remove('active');
      studentView.style.display = 'none';
      staffView.style.display = 'none';
      if (this.editorialSubTab === 'student') {
        studentBtn.classList.add('active');
        studentView.style.display = 'block';
      } else {
        staffBtn.classList.add('active');
        staffView.style.display = 'block';
        this.renderStaffPublications();
        return;
      }
    }

    const container = document.getElementById('editorial-desk-list');
    if (!container) return;

    const teacher = this.getLoggedTeacher();
    const ownSchoolId = teacher ? teacher.schoolId : null;

    const allArticles = window.db.getArticles();
    const articles = ownSchoolId ? allArticles.filter(a => a.schoolId === ownSchoolId) : allArticles;

    const allStudents = window.db.getStudents();
    const students = ownSchoolId ? allStudents.filter(s => s.schoolId === ownSchoolId) : allStudents;
    const pendingBiogs = students.filter(s => s.personalBiogStatus === 'Pending');

    // Draw main structural wrapper for Articles and Biographies
    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
        <!-- Left Column: Articles Review -->
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          <h3 style="font-size: 1.1rem; font-weight: 700; border-bottom: 1px solid var(--panel-border); padding-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            📰 ${this.translate('student_articles_review_header', 'Student Articles Review')}
          </h3>
          <div id="editor-articles-sublist" style="display: flex; flex-direction: column; gap: 1rem;">
            <!-- Loaded below -->
          </div>
        </div>

        <!-- Right Column: Biographies Review -->
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          <h3 style="font-size: 1.1rem; font-weight: 700; border-bottom: 1px solid var(--panel-border); padding-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            👤 ${this.translate('biography_approvals_header', 'Biography Approvals')}
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
      articlesContainer.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 1.5rem;">${this.translate('no_articles_in_database', 'No articles in database.')}</p>`;
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
        if (art.status === 'Approved') statusBadge = `<span class="badge badge-success">${this.translate('approved_status', 'Approved')}</span>`;
        else if (art.status === 'Pending') statusBadge = `<span class="badge badge-warning">${this.translate('awaiting_approval_status', 'Awaiting Approval')}</span>`;
        else statusBadge = `<span class="badge badge-danger">${this.translate('rejected_status', 'Rejected')}</span>`;

        const card = document.createElement('div');
        card.className = 'panel';
        card.style.background = 'rgba(255,255,255,0.01)';
        card.style.border = '1px solid var(--panel-border)';
        card.style.padding = '1.25rem';
        card.style.cursor = 'pointer';
        card.style.transition = 'background-color 0.2s';
        card.onclick = () => this.openStudentArticleDetail(art.id);
        card.onmouseover = () => { card.style.background = 'rgba(255, 255, 255, 0.03)'; };
        card.onmouseout = () => { card.style.background = 'rgba(255, 255, 255, 0.01)'; };
        
        let reviewActionsRow = '';
        if (art.status === 'Pending') {
          reviewActionsRow = `
            <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--panel-border);">
              <button class="btn btn-secondary btn-small" style="color: var(--danger); border-color: var(--danger);" onclick="event.stopPropagation(); app.executeArticleReview('${art.id}', 'Rejected')">${this.translate('reject_btn', 'Reject')}</button>
              <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); app.executeArticleReview('${art.id}', 'Approved')">${this.translate('approve_publish_btn', 'Approve & Publish')}</button>
            </div>
          `;
        } else {
          reviewActionsRow = `
            <div style="font-size: 0.75rem; text-align: right; color: var(--text-muted); margin-top: 1rem; border-top: 1px dashed var(--panel-border); padding-top: 0.5rem;">
              ${this.translate('reviewed_by_label', 'Reviewed by')}: ${art.reviewedBy} ${this.translate('on_label', 'on')} ${new Date(art.reviewedAt).toLocaleDateString()}
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
              <span style="font-size: 0.7rem; color: var(--text-secondary);">${this.translate('by_author', 'By')} ${author?.name || this.translate('student_label_default', 'Student')} • ${school?.name} (${art.language.toUpperCase()})</span>
            </div>
            <div>${statusBadge}</div>
          </div>
          ${photoHtml}
          <p style="font-size: 0.85rem; font-family: var(--font-body); background: rgba(0,0,0,0.05); padding: 0.75rem; border-radius: 6px; line-height: 1.5; margin: 0; color: var(--text-primary);">
            ${art.content}
          </p>
          ${reviewActionsRow}
        `;
        articlesContainer.appendChild(card);
      });
    }

    // 2. Populate Biographies Review
    if (pendingBiogs.length === 0) {
      biogsContainer.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 1.5rem;">${this.translate('no_biographies_awaiting_review', 'No student biographies awaiting review.')}</p>`;
    } else {
      pendingBiogs.forEach(stud => {
        const school = window.db.getSchool(stud.schoolId);

        const card = document.createElement('div');
        card.className = 'panel';
        card.style.background = 'rgba(255,255,255,0.01)';
        card.style.border = '1px solid var(--panel-border)';
        card.style.padding = '1.25rem';

        const approvedBiogHtml = stud.personalBiog 
          ? `<div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem;"><strong>${this.translate('current_approved_biography', 'Current Approved Biography:')}</strong><br>"${stud.personalBiog}"</div>` 
          : '';

        card.innerHTML = `
          <div class="panel-header" style="margin-bottom: 0.5rem;">
            <div>
              <h4 style="font-weight: 700; font-size: 0.95rem; margin: 0;">${stud.name}</h4>
              <span style="font-size: 0.7rem; color: var(--text-secondary);">${this.translateYearGroup(stud.yearGroup)} • ${school ? school.name : this.translate('unknown_school', 'Unknown School')}</span>
            </div>
            <span class="badge badge-warning">${this.translate('pending_review_status', 'Pending Review')}</span>
          </div>
          <div style="background: rgba(0,0,0,0.05); padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem;">
            ${approvedBiogHtml}
            <div style="font-size: 0.8rem; line-height: 1.5; color: var(--text-primary);">
              <strong>${this.translate('submitted_biography', 'Submitted Biography:')}</strong><br>
              "${stud.pendingBiog}"
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem; justify-content: flex-end; border-top: 1px solid var(--panel-border); padding-top: 0.75rem;">
            <button class="btn btn-secondary btn-small" style="color: var(--danger); border-color: var(--danger);" onclick="app.executeBiographyReview('${stud.id}', 'Rejected')">${this.translate('reject_btn', 'Reject')}</button>
            <button class="btn btn-primary btn-small" onclick="app.executeBiographyReview('${stud.id}', 'Approved')">${this.translate('approve_btn', 'Approve')}</button>
          </div>
        `;
        biogsContainer.appendChild(card);
      });
    }
  }

  // Teacher submits biography review approval/rejection
  executeBiographyReview(studentId, status) {
    const reviewer = `${this.translate('teacher_label', 'Teacher')} Mrs. Smith`;
    if (status === 'Approved') {
      window.db.approveStudentBiog(studentId, reviewer);
    } else {
      window.db.rejectStudentBiog(studentId, reviewer);
    }

    this.refreshUI();
    alert(this.translate('bio_review_submitted', 'Biography review submitted: {status}').replace('{status}', this.translate(status.toLowerCase() + '_status', status)));
  }

  // Teacher submits article review approval/rejection
  executeArticleReview(id, status) {
    const reviewer = `${this.translate('teacher_label', 'Teacher')} Mrs. Smith`;
    window.db.reviewArticle(id, status, reviewer);
    
    // If approved, dynamically create a news announcement to students
    if (status === 'Approved') {
      const art = window.db.getArticles().find(a => a.id === id);
      const author = window.db.getStudent(art?.authorId);
      
      window.db.addNews({
        title: `Published: ${art?.title}`,
        content: `Read a new cultural article by student ${author ? author.name : 'Exchange Connection'}: "${art?.content.slice(0, 100)}..."`,
        postedBy: reviewer,
        schoolId: art?.schoolId
      });
    }

    this.refreshUI();
    alert(this.translate('article_reviewed', 'Article reviewed: {status}').replace('{status}', this.translate(status.toLowerCase() + '_status', status)));
  }

  switchEditorialSubtab(subtabName) {
    this.editorialSubTab = subtabName;
    const studentBtn = document.getElementById('subtab-btn-editor-student');
    const staffBtn = document.getElementById('subtab-btn-editor-staff');
    
    const studentView = document.getElementById('editor-student-subview');
    const staffView = document.getElementById('editor-staff-subview');

    if (!studentBtn || !staffBtn || !studentView || !staffView) return;

    studentBtn.classList.remove('active');
    staffBtn.classList.remove('active');
    
    studentView.style.display = 'none';
    staffView.style.display = 'none';

    if (subtabName === 'student') {
      studentBtn.classList.add('active');
      studentView.style.display = 'block';
      this.renderTeacherEditorDesk();
    } else if (subtabName === 'staff') {
      staffBtn.classList.add('active');
      staffView.style.display = 'block';
      this.renderStaffPublications();
    }
  }

  renderStaffPublications() {
    const listContainer = document.getElementById('published-staff-articles-list');
    if (!listContainer) return;

    const teacher = this.getLoggedTeacher();
    const ownSchoolId = teacher ? teacher.schoolId : 'school_1';

    const staffArticles = window.db.getArticles().filter(a => a.schoolId === ownSchoolId && a.authorType === 'staff');

    if (staffArticles.length === 0) {
      listContainer.innerHTML = `<p style="font-size: 0.95rem; color: var(--text-muted); padding: 1rem 0;">${this.translate('no_published_staff_articles', 'No staff articles published yet.')}</p>`;
      return;
    }

    listContainer.innerHTML = staffArticles.map(art => {
      const dateStr = new Date(art.submittedAt).toLocaleDateString();
      const photoHtml = art.photoUrl ? `<img src="${art.photoUrl}" alt="article photo" style="width: 100px; height: 75px; object-fit: cover; border-radius: 6px;" />` : '';
      return `
        <div style="display: flex; gap: 1rem; align-items: center; padding: 1rem; background: rgba(255,255,255,0.01); border: 1px solid var(--panel-border); border-radius: 8px;">
          ${photoHtml}
          <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 0.25rem;">
            <h4 style="font-weight: 700; font-size: 1.1rem; margin: 0; color: var(--text-primary);">${art.title}</h4>
            <span style="font-size: 0.85rem; color: var(--text-muted);">${this.translate('published_on', 'Published on')} ${dateStr}</span>
            <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.4; margin: 0.25rem 0 0 0;">${art.content.substring(0, 150)}...</p>
          </div>
          <button class="btn btn-secondary btn-small" style="color: var(--danger); border-color: rgba(239, 68, 68, 0.2);" onclick="app.deleteStaffArticle('${art.id}')">
            ${this.translate('delete_btn', 'Delete')}
          </button>
        </div>
      `;
    }).join('');
  }

  handleStaffArticleSubmit(e) {
    e.preventDefault();
    const title = document.getElementById('staff-article-title').value.trim();
    const content = document.getElementById('staff-article-content').value.trim();
    
    if (!title || !content) return;

    const teacher = this.getLoggedTeacher();
    const ownSchoolId = teacher ? teacher.schoolId : 'school_1';
    const authorId = teacher ? teacher.id : 'coord_1';

    const newArticle = {
      id: 'art_' + Date.now(),
      title,
      content,
      photoUrl: this.currentStaffArticlePhotoDataUrl || '',
      schoolId: ownSchoolId,
      authorId,
      authorType: 'staff',
      submittedAt: new Date().toISOString(),
      status: 'Approved',
      reviewedBy: teacher ? teacher.name : 'System'
    };

    const articles = window.db.getArticles();
    articles.push(newArticle);
    window.db.saveTable('articles', articles);

    // Add log
    window.db.addLog(
      'Staff Article Published',
      `Published staff article: "${title}"`,
      `${this.translate('teacher_label', 'Teacher')} ${teacher ? teacher.name : 'Unknown'}`
    );

    alert(this.translate('staff_article_published_success', 'Staff article published successfully!'));
    
    // Reset form
    document.getElementById('staff-article-form').reset();
    this.currentStaffArticlePhotoDataUrl = '';
    const previewImg = document.getElementById('staff-article-photo-preview');
    if (previewImg) {
      previewImg.src = '';
      previewImg.style.display = 'none';
    }
    const placeholderSpan = document.getElementById('staff-article-photo-placeholder');
    if (placeholderSpan) placeholderSpan.style.display = 'block';
    const removeBtn = document.getElementById('staff-article-photo-remove-btn');
    if (removeBtn) removeBtn.style.display = 'none';

    this.renderStaffPublications();
    this.refreshUI();
  }

  deleteStaffArticle(id) {
    if (confirm(this.translate('delete_article_confirm', 'Are you sure you want to delete this staff article?'))) {
      const articles = window.db.getArticles().filter(a => a.id !== id);
      window.db.saveTable('articles', articles);
      this.renderStaffPublications();
      this.refreshUI();
    }
  }

  initStaffArticleListeners() {
    const uploadBtn = document.getElementById('staff-article-photo-upload-btn');
    const uploadInput = document.getElementById('staff-article-photo-upload');
    const previewImg = document.getElementById('staff-article-photo-preview');
    const placeholderSpan = document.getElementById('staff-article-photo-placeholder');
    const removeBtn = document.getElementById('staff-article-photo-remove-btn');

    this.currentStaffArticlePhotoDataUrl = '';

    if (uploadBtn && uploadInput) {
      uploadBtn.addEventListener('click', () => uploadInput.click());
      uploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          if (file.size > 1.5 * 1024 * 1024) {
            alert(this.translate('image_too_large_alert', 'Image file is too large. Please select an image smaller than 1.5MB.'));
            uploadInput.value = '';
            this.currentStaffArticlePhotoDataUrl = '';
            previewImg.style.display = 'none';
            if (placeholderSpan) placeholderSpan.style.display = 'block';
            if (removeBtn) removeBtn.style.display = 'none';
            return;
          }
          const reader = new FileReader();
          reader.onload = (event) => {
            this.currentStaffArticlePhotoDataUrl = event.target.result;
            previewImg.src = event.target.result;
            previewImg.style.display = 'block';
            if (placeholderSpan) placeholderSpan.style.display = 'none';
            if (removeBtn) removeBtn.style.display = 'inline-block';
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        this.currentStaffArticlePhotoDataUrl = '';
        previewImg.src = '';
        previewImg.style.display = 'none';
        if (placeholderSpan) placeholderSpan.style.display = 'block';
        removeBtn.style.display = 'none';
        if (uploadInput) uploadInput.value = '';
      });
    }
  }

  // Load teacher settings form
  populateTeacherSettings() {
    this.switchSettingsSubtab(this.settingsSubTab || 'profile');
    const settings = window.db.getSettings();
    document.getElementById('flagged-words-input').value = settings.flaggedKeywords.join(', ');
    document.getElementById('attachments-toggle').checked = settings.attachmentsEnabled;
    const transToggle = document.getElementById('translation-toggle');
    if (transToggle) {
      transToggle.checked = settings.translationEnabled !== false;
    }

    const teacher = this.getLoggedTeacher();
    const schoolId = teacher ? teacher.schoolId : 'school_1';
    if (teacher) {
      const nameInput = document.getElementById('coordinator-name-input');
      if (nameInput) {
        nameInput.value = teacher.name || '';
      }
      document.getElementById('coordinator-bio-input').value = teacher.bio || '';
      document.getElementById('coordinator-subjects-input').value = teacher.subjects || '';
      document.getElementById('coordinator-interests-input').value = teacher.interests || '';
      
      // Coordinator Photo Preview
      const coordPreview = document.getElementById('coordinator-photo-preview');
      const coordPlaceholder = document.getElementById('coordinator-photo-placeholder');
      const coordRemoveBtn = document.getElementById('coordinator-photo-remove-btn');
      if (coordPreview) {
        if (teacher.photoUrl) {
          coordPreview.src = teacher.photoUrl;
          coordPreview.style.display = 'block';
          if (coordPlaceholder) coordPlaceholder.style.display = 'none';
          if (coordRemoveBtn) coordRemoveBtn.style.display = 'inline-block';
        } else {
          coordPreview.src = '';
          coordPreview.style.display = 'none';
          if (coordPlaceholder) coordPlaceholder.style.display = 'block';
          if (coordRemoveBtn) coordRemoveBtn.style.display = 'none';
        }
      }
    }
    const school = window.db.getSchool(schoolId);
    if (school) {
      document.getElementById('school-desc-input').value = school.description || '';
      
      // Logo Preview
      const logoPreview = document.getElementById('school-logo-preview');
      const logoPlaceholder = document.getElementById('school-logo-placeholder');
      const logoRemoveBtn = document.getElementById('school-logo-remove-btn');
      if (school.logoUrl) {
        logoPreview.src = school.logoUrl;
        logoPreview.style.display = 'block';
        if (logoPlaceholder) logoPlaceholder.style.display = 'none';
        if (logoRemoveBtn) logoRemoveBtn.style.display = 'inline-block';
      } else {
        logoPreview.src = '';
        logoPreview.style.display = 'none';
        if (logoPlaceholder) logoPlaceholder.style.display = 'block';
        if (logoRemoveBtn) logoRemoveBtn.style.display = 'none';
      }

      // Campus Photo Preview
      const photoPreview = document.getElementById('school-photo-preview');
      const photoPlaceholder = document.getElementById('school-photo-placeholder');
      const photoRemoveBtn = document.getElementById('school-photo-remove-btn');
      if (school.photoUrl) {
        photoPreview.src = school.photoUrl;
        photoPreview.style.display = 'block';
        if (photoPlaceholder) photoPlaceholder.style.display = 'none';
        if (photoRemoveBtn) photoRemoveBtn.style.display = 'inline-block';
      } else {
        photoPreview.src = '';
        photoPreview.style.display = 'none';
        if (photoPlaceholder) photoPlaceholder.style.display = 'block';
        if (photoRemoveBtn) photoRemoveBtn.style.display = 'none';
      }
    }
    this.populateTeacherStaffDirectory();
  }

  switchSettingsSubtab(subtabName) {
    this.settingsSubTab = subtabName;
    const profileBtn = document.getElementById('subtab-btn-settings-profile');
    const preferencesBtn = document.getElementById('subtab-btn-settings-preferences');
    const directoryBtn = document.getElementById('subtab-btn-settings-directory');
    
    const profileView = document.getElementById('settings-profile-subview');
    const preferencesView = document.getElementById('settings-preferences-subview');
    const directoryView = document.getElementById('school-staff-directory-panel');

    if (!profileBtn || !preferencesBtn || !directoryBtn || !profileView || !preferencesView || !directoryView) return;

    profileBtn.classList.remove('active');
    preferencesBtn.classList.remove('active');
    directoryBtn.classList.remove('active');
    
    profileView.style.display = 'none';
    preferencesView.style.display = 'none';
    directoryView.style.display = 'none';

    if (subtabName === 'profile') {
      profileBtn.classList.add('active');
      profileView.style.display = 'block';
    } else if (subtabName === 'preferences') {
      preferencesBtn.classList.add('active');
      preferencesView.style.display = 'block';
    } else if (subtabName === 'directory') {
      directoryBtn.classList.add('active');
      directoryView.style.display = 'block';
    }
  }

  // Save teacher configuration preferences
  saveTeacherSettings() {
    const text = document.getElementById('flagged-words-input').value;
    const attachments = document.getElementById('attachments-toggle').checked;
    const transToggle = document.getElementById('translation-toggle');
    const translation = transToggle ? transToggle.checked : true;

    const keywords = text.split(',').map(k => k.trim()).filter(k => k.length > 0);
    
    window.db.saveSettings({
      flaggedKeywords: keywords,
      attachmentsEnabled: attachments,
      translationEnabled: translation
    });

    alert(this.translate('safeguard_settings_updated', 'Settings updated successfully! SafeGuard configuration updated.'));
    this.refreshUI();
  }

  // Save teacher's school profile description, logo, and photo
  handleSchoolProfileSubmit(e) {
    e.preventDefault();
    const description = document.getElementById('school-desc-input').value.trim();
    
    // Read logo image URL/base64 from preview
    let logoUrl = '';
    const logoPreview = document.getElementById('school-logo-preview');
    if (logoPreview && logoPreview.style.display !== 'none' && logoPreview.src) {
      logoUrl = logoPreview.src;
      if (logoUrl.startsWith(window.location.origin)) {
        logoUrl = logoUrl.substring(window.location.origin.length);
      }
    }

    // Read photo image URL/base64 from preview
    let photoUrl = '';
    const photoPreview = document.getElementById('school-photo-preview');
    if (photoPreview && photoPreview.style.display !== 'none' && photoPreview.src) {
      photoUrl = photoPreview.src;
      if (photoUrl.startsWith(window.location.origin)) {
        photoUrl = photoUrl.substring(window.location.origin.length);
      }
    }

    let coordPhotoUrl = '';
    const coordPreview = document.getElementById('coordinator-photo-preview');
    if (coordPreview && coordPreview.style.display !== 'none' && coordPreview.src) {
      coordPhotoUrl = coordPreview.src;
      if (coordPhotoUrl.startsWith(window.location.origin)) {
        coordPhotoUrl = coordPhotoUrl.substring(window.location.origin.length);
      }
    }

    const nameInput = document.getElementById('coordinator-name-input');
    const name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
      alert(this.translate('provide_name_warning', 'Please provide your name.'));
      return;
    }

    const bio = document.getElementById('coordinator-bio-input').value.trim();
    const subjects = document.getElementById('coordinator-subjects-input').value.trim();
    const interests = document.getElementById('coordinator-interests-input').value.trim();

    const teacher = this.getLoggedTeacher();
    const schoolId = teacher ? teacher.schoolId : 'school_1';
    window.db.updateSchool(schoolId, { description, logoUrl, photoUrl });
    if (teacher) {
      window.db.updateCoordinator(teacher.id, { name, bio, photoUrl: coordPhotoUrl, subjects, interests });
    }

    alert(this.translate('school_profile_updated', 'School profile updated successfully! Matches and exchange partner students will see the updated spotlight.'));
    this.refreshUI();
  }

  // Populate School Staff Directory Panel
  populateTeacherStaffDirectory() {
    const container = document.getElementById('school-staff-directory-panel');
    if (!container) return;

    const teacher = this.getLoggedTeacher();
    if (!teacher) return;
    const schoolId = teacher.schoolId;

    const coordinators = window.db.getCoordinators().filter(c => c.schoolId === schoolId);

    let rowsHtml = '';
    coordinators.forEach(coord => {
      const isSelf = coord.id === teacher.id;
      const roleBadge = coord.isSchoolAdmin ? `<span class="badge badge-success text-xs font-bold" style="padding: 0.15rem 0.4rem; border-radius: 4px;">${this.translate('admin_role', 'Admin')}</span>` : `<span class="badge badge-neutral text-xs" style="padding: 0.15rem 0.4rem; border-radius: 4px; border: 1px solid var(--panel-border); background: rgba(255,255,255,0.02);">${this.translate('staff_role', 'Staff')}</span>`;

      let actionsHtml = '';
      if (teacher.isSchoolAdmin) {
        if (!isSelf) {
          actionsHtml = `
            <button class="btn btn-secondary btn-small" style="font-size: 0.75rem; padding: 0.2rem 0.5rem;" onclick="app.toggleStaffAdminInsideSettings('${coord.id}')">
              ${coord.isSchoolAdmin ? this.translate('demote_btn', 'Demote') : this.translate('promote_btn', 'Promote')}
            </button>
            <button class="btn btn-secondary btn-small" style="font-size: 0.75rem; padding: 0.2rem 0.5rem; color: var(--danger); border-color: rgba(239,68,68,0.2);" onclick="app.deleteStaffInsideSettings('${coord.id}')">
              ${this.translate('remove_btn', 'Remove')}
            </button>
          `;
        } else {
          actionsHtml = `<span style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">${this.translate('no_actions', 'No actions')}</span>`;
        }
      } else {
        actionsHtml = `<span style="font-size: 0.75rem; color: var(--text-muted);">${this.translate('readonly_role', 'Read-Only')}</span>`;
      }

      rowsHtml += `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
          <td style="padding: 0.75rem 0.5rem; font-size: 0.85rem; font-weight: 600;">
            ${coord.name} ${isSelf ? '<span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">' + this.translate('you_label_suffix', '(You)') + '</span>' : ''}
          </td>
          <td style="padding: 0.75rem 0.5rem; font-size: 0.85rem; color: var(--text-secondary);"><a href="mailto:${coord.email}" style="color: var(--secondary); text-decoration: underline;">${coord.email}</a></td>
          <td style="padding: 0.75rem 0.5rem;">${roleBadge}</td>
          <td style="padding: 0.75rem 0.5rem; text-align: right;">
            <div style="display: inline-flex; gap: 0.5rem; justify-content: flex-end;">
              ${actionsHtml}
            </div>
          </td>
        </tr>
      `;
    });

    let addFormHtml = '';
    if (teacher.isSchoolAdmin) {
      addFormHtml = `
        <form id="add-staff-settings-form" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; padding: 1.25rem; background: rgba(255,255,255,0.01); border: 1px solid var(--panel-border); border-radius: 8px;" onsubmit="app.addStaffInsideSettings(event)">
          <h4 style="font-size: 0.9rem; font-weight: 700; margin: 0;">➕ ${this.translate('add_new_coordinator_title', 'Add New Coordinator')}</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group" style="margin: 0;">
              <label style="font-size: 0.75rem; font-weight: 600; display: block; margin-bottom: 0.25rem;">${this.translate('full_name_label', 'Full Name:')}</label>
              <input 
                type="text" 
                id="new-staff-name-input" 
                class="form-control" 
                style="font-size: 0.8rem; padding: 0.4rem 0.75rem;" 
                placeholder="${this.translate('watson_placeholder', 'e.g. Dr. John Watson')}" 
                required
              >
            </div>
            <div class="form-group" style="margin: 0;">
              <label style="font-size: 0.75rem; font-weight: 600; display: block; margin-bottom: 0.25rem;">${this.translate('email_address_label', 'Email Address:')}</label>
              <input 
                type="email" 
                id="new-staff-email-input" 
                class="form-control" 
                style="font-size: 0.8rem; padding: 0.4rem 0.75rem;" 
                placeholder="${this.translate('watson_email_placeholder', 'e.g. watson@leicesterhigh.edu')}" 
                required
              >
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <input 
                type="checkbox" 
                id="new-staff-admin-input" 
                style="width: 16px; height: 16px; cursor: pointer;"
              >
              <label for="new-staff-admin-input" style="font-size: 0.8rem; font-weight: 600; cursor: pointer;">
                ${this.translate('grant_admin_rights_label', 'Grant Administrator Rights')}
              </label>
            </div>
            <button type="submit" class="btn btn-primary btn-small" style="padding: 0.4rem 1rem;">
              ${this.translate('register_staff_member_btn', 'Register Staff Member')}
            </button>
          </div>
        </form>
      `;
    } else {
      addFormHtml = `
        <div style="font-size: 0.8rem; color: var(--text-muted); font-style: italic; text-align: center; padding: 1rem; background: rgba(255,255,255,0.01); border: 1px dashed var(--panel-border); border-radius: 8px;">
          🔒 ${this.translate('only_admins_manage_staff', 'Only school administrators can invite or manage other staff members.')}
        </div>
      `;
    }

    container.innerHTML = `
      <div class="panel-header" style="border-bottom: 1px solid var(--panel-border); padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
        <h2 class="panel-title" style="font-size: 1.1rem; font-weight: 700;">👥 ${this.translate('school_staff_directory_title', 'School Staff Directory')}</h2>
      </div>
      <span style="font-size: 1rem; color: var(--text-secondary); margin-bottom: 1rem; display: block;">
        ${this.translate('invite_manage_coordinators_desc', 'Invite and manage other staff members for your school.')}
      </span>

      <div style="overflow-x: auto; margin-bottom: 1.5rem;">
        <table style="width: 100%; text-align: left; border-collapse: collapse; min-width: 500px;">
          <thead>
            <tr style="border-bottom: 1px solid var(--panel-border);">
              <th style="padding: 0.75rem 0.5rem; font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">${this.translate('th_name', 'Name')}</th>
              <th style="padding: 0.75rem 0.5rem; font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">${this.translate('th_email', 'Email')}</th>
              <th style="padding: 0.75rem 0.5rem; font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">${this.translate('th_role', 'Role')}</th>
              <th style="padding: 0.75rem 0.5rem; font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; text-align: right;">${this.translate('th_actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>

      ${addFormHtml}
    `;
  }

  toggleStaffAdminInsideSettings(staffId) {
    const teacher = this.getLoggedTeacher();
    if (staffId === teacher?.id) {
      alert(this.translate('cannot_change_own_admin_warning', 'You cannot change your own admin rights.'));
      return;
    }
    const currentCoords = window.db.getCoordinators();
    const idx = currentCoords.findIndex(c => c.id === staffId);
    if (idx !== -1) {
      currentCoords[idx].isSchoolAdmin = !currentCoords[idx].isSchoolAdmin;
      window.db.saveTable('coordinators', currentCoords);
      window.db.addLog(
        'Coordinator Admin Toggled',
        `Toggled Admin rights for staff ${currentCoords[idx].name} to ${currentCoords[idx].isSchoolAdmin ? 'Granted' : 'Revoked'}.`,
        `${this.translate('teacher_label', 'Teacher')} ${teacher.name}`
      );
      this.populateTeacherStaffDirectory();
      alert(this.translate('admin_status_updated', 'Admin status updated for {name}.').replace('{name}', currentCoords[idx].name));
    }
  }

  deleteStaffInsideSettings(staffId) {
    const teacher = this.getLoggedTeacher();
    if (staffId === teacher?.id) {
      alert(this.translate('cannot_remove_self_warning', 'You cannot remove yourself from the school staff roster.'));
      return;
    }
    const currentCoords = window.db.getCoordinators();
    const staff = currentCoords.find(c => c.id === staffId);
    if (!staff) return;

    if (confirm(this.translate('remove_coordinator_confirm_prompt', 'Are you sure you want to remove coordinator "{name}" ({email})? They will no longer have access to this school\'s portal.').replace('{name}', staff.name).replace('{email}', staff.email))) {
      const filtered = currentCoords.filter(c => c.id !== staffId);
      window.db.saveTable('coordinators', filtered);
      window.db.addLog(
        'Coordinator Removed',
        `Removed staff member ${staff.name} (${staff.email}) from school staff roster.`,
        `${this.translate('teacher_label', 'Teacher')} ${teacher.name}`
      );
      this.populateTeacherStaffDirectory();
      alert(this.translate('staff_member_removed', 'Staff member "{name}" has been removed.').replace('{name}', staff.name));
    }
  }

  addStaffInsideSettings(e) {
    e.preventDefault();
    const teacher = this.getLoggedTeacher();
    if (!teacher) return;
    const name = document.getElementById('new-staff-name-input').value.trim();
    const email = document.getElementById('new-staff-email-input').value.trim();
    const isSchoolAdmin = document.getElementById('new-staff-admin-input').checked;

    if (!name || !email) {
      alert(this.translate('provide_name_email_warning', 'Please provide both name and email.'));
      return;
    }

    const currentCoords = window.db.getCoordinators();
    if (currentCoords.some(c => c.email.toLowerCase() === email.toLowerCase())) {
      alert(this.translate('coordinator_already_registered_warning', 'A coordinator with this email is already registered.'));
      return;
    }

    const newStaff = {
      id: 'coord_' + Date.now(),
      name,
      email,
      schoolId: teacher.schoolId,
      isSchoolAdmin,
      bio: ''
    };

    currentCoords.push(newStaff);
    window.db.saveTable('coordinators', currentCoords);
    window.db.addLog(
      'Coordinator Added',
      `Added staff member ${newStaff.name} (${newStaff.email}) as ${newStaff.isSchoolAdmin ? 'Admin' : 'Staff'}.`,
      `${this.translate('teacher_label', 'Teacher')} ${teacher.name}`
    );

    this.populateTeacherStaffDirectory();
    alert(this.translate('staff_member_added', 'Staff member {name} added successfully!').replace('{name}', name));
  }




  // ================== ADMIN PORTAL RENDERERS ==================

  renderAdminDashboard() {
    this.switchAdminSubtab(this.adminSubTab || 'requests');
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

  switchAdminSubtab(subtabName) {
    this.adminSubTab = subtabName;
    const requestsBtn = document.getElementById('subtab-btn-admin-requests');
    const safeguardingBtn = document.getElementById('subtab-btn-admin-safeguarding');
    const auditBtn = document.getElementById('subtab-btn-admin-audit');
    
    const requestsView = document.getElementById('admin-requests-subview');
    const safeguardingView = document.getElementById('admin-safeguarding-subview');
    const auditView = document.getElementById('admin-audit-subview');

    if (!requestsBtn || !safeguardingBtn || !auditBtn || !requestsView || !safeguardingView || !auditView) return;

    requestsBtn.classList.remove('active');
    safeguardingBtn.classList.remove('active');
    auditBtn.classList.remove('active');
    
    requestsView.style.display = 'none';
    safeguardingView.style.display = 'none';
    auditView.style.display = 'none';

    if (subtabName === 'requests') {
      requestsBtn.classList.add('active');
      requestsView.style.display = 'block';
    } else if (subtabName === 'safeguarding') {
      safeguardingBtn.classList.add('active');
      safeguardingView.style.display = 'block';
    } else if (subtabName === 'audit') {
      auditBtn.classList.add('active');
      auditView.style.display = 'block';
    }
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
      alert(this.translate('school_code_registered_warning', 'A school with code {code} is already registered!').replace('{code}', code));
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
    
    alert(this.translate('school_registered_success', 'Partner school registered successfully! Ready to invite teachers and students.'));
    
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
      listEl.innerHTML = `<p style="font-size: 0.75rem; color: var(--text-muted); text-align: center; padding: 1rem 0;">${this.translate('no_matching_schools', 'No matching schools found.')}</p>`;
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

    // Populate registration application summary if elements exist
    const sumName = document.getElementById('onboard-summary-school-name');
    const sumCode = document.getElementById('onboard-summary-school-code');
    const sumLoc = document.getElementById('onboard-summary-school-loc');
    const sumCoord = document.getElementById('onboard-summary-coord-name');
    const sumEmail = document.getElementById('onboard-summary-coord-email');
    if (sumName && sumCode && sumLoc && sumCoord && sumEmail) {
      const requests = window.db.getSchoolRequests();
      // Find the most recent pending request, or fallback to the latest request
      const pendingReq = requests.filter(r => r.status === 'Pending').pop() || requests[requests.length - 1];
      if (pendingReq) {
        sumName.textContent = pendingReq.name;
        sumCode.textContent = pendingReq.code;
        sumLoc.textContent = `${pendingReq.city}, ${pendingReq.country}`;
        sumCoord.textContent = pendingReq.coordinatorName;
        sumEmail.textContent = pendingReq.coordinatorEmail;
      }
    }
  }

  // Form submit handler for coordinator requesting school registration
  handleSchoolRegistrationRequest(e) {
    e.preventDefault();
    const descEl = document.getElementById('req-school-desc');
    const req = {
      name: document.getElementById('req-school-name').value.trim(),
      country: document.getElementById('req-school-country').value.trim(),
      city: document.getElementById('req-school-city').value.trim(),
      language: document.getElementById('req-school-lang').value,
      code: document.getElementById('req-school-code').value.trim().toUpperCase(),
      coordinatorName: document.getElementById('req-coord-name').value.trim(),
      coordinatorEmail: document.getElementById('req-coord-email').value.trim(),
      description: descEl ? descEl.value.trim() : ''
    };

    const schools = window.db.getSchools();
    if (schools.some(s => s.code === req.code)) {
      alert(this.translate('school_exists_warning', 'A school with code {code} already exists on the platform. Please check the code or contact support.').replace('{code}', req.code));
      return;
    }

    const requests = window.db.getSchoolRequests();
    if (requests.some(r => r.code === req.code && r.status === 'Pending')) {
      alert(this.translate('registration_pending_warning', 'A registration request for school code {code} is already pending review.').replace('{code}', req.code));
      return;
    }

    window.db.addSchoolRequest(req);
    document.getElementById('request-school-registration-form').reset();
    alert(this.translate('registration_submitted_success', 'Your school registration request has been submitted successfully! The System Admin will review it shortly.'));
    
    // Switch login screen back to portal select view
    const loginPortalSections = document.getElementById('login-portal-sections');
    const loginRegisterSection = document.getElementById('login-register-section');
    if (loginPortalSections && loginRegisterSection) {
      loginRegisterSection.style.display = 'none';
      loginPortalSections.style.display = 'flex';
    }

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
        <td><strong>${req.coordinatorName}</strong><br><span style="font-size: 0.75rem; color: var(--text-muted);"><a href="mailto:${req.coordinatorEmail}" style="color: var(--secondary); text-decoration: underline;">${req.coordinatorEmail}</a></span></td>
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
        alert(this.translate('registration_approved_success', 'School Registration Approved! {name} is now registered. The requesting coordinator has been granted School Admin rights.').replace('{name}', newSchool.name));
      }
    } else if (action === 'decline') {
      window.db.declineSchoolRequest(requestId, reviewer);
      alert(this.translate('registration_declined_success', 'School Registration Request declined.'));
    }
    this.refreshUI();
  }

  setAdminSafeguardFilter(filter) {
    this.adminSafeguardFilter = filter;
    this.renderAdminSafeguarding();
  }

  // Renders global safeguarding alerts in the admin dashboard
  renderAdminSafeguarding() {
    const tbody = document.getElementById('admin-safeguarding-tbody');
    const flags = window.db.getFlags();

    const openFlags = flags.filter(flag => flag.status === 'Pending');
    const resolvedFlags = flags.filter(flag => flag.status !== 'Pending');

    // Update counts in admin sub-tabs UI
    const countOpenEl = document.getElementById('admin-safeguard-count-open');
    const countResolvedEl = document.getElementById('admin-safeguard-count-resolved');
    if (countOpenEl) countOpenEl.textContent = openFlags.length;
    if (countResolvedEl) countResolvedEl.textContent = resolvedFlags.length;

    // Update admin sub-tabs UI active state
    const btnOpen = document.getElementById('admin-safeguard-tab-open');
    const btnResolved = document.getElementById('admin-safeguard-tab-resolved');
    if (btnOpen && btnResolved) {
      if (this.adminSafeguardFilter === 'open') {
        btnOpen.style.background = 'rgba(239, 68, 68, 0.15)';
        btnOpen.style.borderColor = 'var(--danger)';
        btnOpen.style.color = 'var(--danger)';
        btnResolved.style.background = 'transparent';
        btnResolved.style.borderColor = 'var(--panel-border)';
        btnResolved.style.color = 'var(--text-secondary)';
      } else {
        btnOpen.style.background = 'transparent';
        btnOpen.style.borderColor = 'var(--panel-border)';
        btnOpen.style.color = 'var(--text-secondary)';
        btnResolved.style.background = 'rgba(16, 185, 129, 0.15)';
        btnResolved.style.borderColor = 'var(--success)';
        btnResolved.style.color = 'var(--success)';
      }
    }

    const displayFlags = this.adminSafeguardFilter === 'open' ? openFlags : resolvedFlags;

    tbody.innerHTML = '';
    if (displayFlags.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No ${this.adminSafeguardFilter === 'open' ? 'open' : 'resolved'} safeguarding alerts logged.</td></tr>`;
      return;
    }

    // Sort: Pending flags first, then by date descending
    const sortedFlags = [...displayFlags].sort((a, b) => {
      if (a.status === 'Pending' && b.status !== 'Pending') return -1;
      if (a.status !== 'Pending' && b.status === 'Pending') return 1;
      return new Date(b.flaggedAt) - new Date(a.flaggedAt);
    });

    sortedFlags.forEach(flag => {
      const msg = window.db.getMessages().find(m => m.id === flag.messageId);
      const sender = msg ? window.db.getStudent(msg.senderId) : null;
      const school = sender ? window.db.getSchool(sender.schoolId) : null;
      
      let statusBadge = '';
      if (flag.status === 'Pending') statusBadge = `<span class="badge badge-danger">${this.translate('unresolved_status', 'Unresolved')}</span>`;
      else statusBadge = `<span class="badge badge-success">${this.translate('resolved_status', 'Resolved')}</span>`;

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
            ? `<button class="btn btn-danger btn-small" onclick="app.openResolveFlagModal('${flag.id}')">${this.translate('review_take_action_btn', 'Review & Take Action')}</button>`
            : `<div style="display: flex; flex-direction: column; gap: 0.35rem;">
                 <span style="font-size: 0.75rem; color: var(--text-muted);">${this.translate('resolved_by_label', 'Resolved by:')}<br>${flag.reviewedBy}<br>${this.translate('action_taken_label', 'Action:')} ${flag.actionTaken}</span>
                 <button class="btn btn-secondary btn-small" style="font-size: 0.7rem; padding: 0.2rem 0.4rem;" onclick="app.openResolveFlagModal('${flag.id}')">${this.translate('view_details_btn', 'View Details')}</button>
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
      : `<div style="height: 160px; background: rgba(0,0,0,0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.85rem; border: 1px dashed var(--panel-border);">${this.translate('no_campus_photo_added', 'No campus photograph added')}</div>`;

    // Renders coordinators/staff list with toggle controls
    let coordinatorsHtml = '';
    if (schoolCoords.length === 0) {
      coordinatorsHtml = `<p style="font-size: 0.8rem; color: var(--text-muted); font-style: italic; padding: 0.5rem 0;">${this.translate('no_coordinators_registered', 'No coordinators registered for this school.')}</p>`;
    } else {
      coordinatorsHtml = `
        <div class="table-container" style="max-height: 180px; overflow-y: auto; margin-top: 0.5rem; border: 1px solid var(--panel-border); border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 1rem;">
            <thead>
              <tr style="background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--panel-border);">
                <th style="padding: 0.65rem 0.5rem; text-align: left;">${this.translate('th_name', 'Name')}</th>
                <th style="padding: 0.65rem 0.5rem; text-align: left;">${this.translate('th_email', 'Email')}</th>
                <th style="padding: 0.65rem 0.5rem; text-align: left;">${this.translate('th_status', 'Status')}</th>
                <th style="padding: 0.65rem 0.5rem; text-align: left;">${this.translate('th_actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              ${schoolCoords.map(c => {
                const adminBadge = c.isSchoolAdmin 
                  ? `<span class="badge badge-success" style="font-size: 0.85rem; padding: 0.2rem 0.5rem;">${this.translate('admin_role', 'Admin')}</span>` 
                  : `<span class="badge badge-secondary" style="font-size: 0.85rem; padding: 0.2rem 0.5rem;">${this.translate('staff_role', 'Staff')}</span>`;
                
                const isSystemAdmin = this.currentRole === 'admin';
                const isOwnSchoolTeacher = this.currentRole === 'teacher' && schoolId === 'school_1';
                
                let actionsHtml = '';
                if (isSystemAdmin || isOwnSchoolTeacher) {
                  const btnLabel = c.isSchoolAdmin ? this.translate('revoke_admin_btn', 'Revoke Admin') : this.translate('grant_admin_btn', 'Grant Admin');
                  const btnClass = c.isSchoolAdmin ? 'btn-secondary' : 'btn-primary';
                  actionsHtml = `<button class="btn ${btnClass} btn-small" style="font-size: 0.9rem; padding: 0.35rem 0.75rem;" onclick="app.toggleCoordinatorAdminInsideModal('${c.id}', '${schoolId}')">${btnLabel}</button>`;
                } else if (this.currentRole === 'teacher' && schoolId !== 'school_1') {
                  actionsHtml = `<button class="btn btn-primary btn-small" style="font-size: 0.9rem; padding: 0.35rem 0.75rem;" onclick="app.startCoordinatorChat('${c.id}')">💬 ${this.translate('message_btn', 'Message')}</button>`;
                }
                
                return `
                  <tr style="border-bottom: 1px solid var(--panel-border);">
                    <td style="padding: 0.65rem 0.5rem; font-weight: 600; line-height: 1.45;">
                      <div>${c.name}</div>
                      ${c.subjects ? `<div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.2rem; font-weight: normal;">📚 <strong>Subjects:</strong> ${c.subjects}</div>` : ''}
                      ${c.interests ? `<div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.1rem; font-weight: normal;">🌟 <strong>Interests:</strong> ${c.interests}</div>` : ''}
                    </td>
                    <td style="padding: 0.65rem 0.5rem; color: var(--text-secondary);"><a href="mailto:${c.email}" style="color: var(--secondary); text-decoration: underline;">${c.email}</a></td>
                    <td style="padding: 0.65rem 0.5rem;">${adminBadge}</td>
                    <td style="padding: 0.65rem 0.5rem;">
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

    const loggedTeacher = this.getLoggedTeacher();
    const loggedTeacherSchoolId = loggedTeacher ? loggedTeacher.schoolId : null;
    const isOwnSchool = this.currentRole === 'admin' || (this.currentRole === 'teacher' && schoolId === loggedTeacherSchoolId);

    let rosterHtml = '';
    if (students.length === 0) {
      rosterHtml = `<p style="font-size: 0.8rem; color: var(--text-muted); font-style: italic; padding: 0.5rem 0;">${this.translate('no_students_registered_school', 'No students registered for this school.')}</p>`;
    } else {
      rosterHtml = `
        <div class="table-container" style="max-height: 150px; overflow-y: auto; margin-top: 0.5rem; border: 1px solid var(--panel-border); border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
            <thead>
              <tr style="background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--panel-border);">
                <th style="padding: 0.5rem; text-align: left;">${this.translate('th_name', 'Name')}</th>
                <th style="padding: 0.5rem; text-align: left;">${this.translate('th_email', 'Email')}</th>
                <th style="padding: 0.5rem; text-align: left;">${this.translate('th_age_year', 'Age/Year')}</th>
                <th style="padding: 0.5rem; text-align: left;">${this.translate('th_match_status', 'Match Status')}</th>
              </tr>
            </thead>
            <tbody>
              ${students.map(s => {
                const badgeClass = s.matchStatus === 'matched' ? 'badge-success' : (s.matchStatus === 'proposed' ? 'badge-warning' : 'badge-secondary');
                let matchStatusText = s.matchStatus;
                let tooltipAttr = '';
                if (s.matchStatus === 'matched') {
                  const myActiveMatches = window.db.getMatches().filter(m => m.active && m.studentIds.includes(s.id));
                  const count = myActiveMatches.length;
                  matchStatusText = `${count} ${count === 1 ? this.translate('match_label', 'Match') : this.translate('matches_label', 'Matches')}`;
                  
                  const partnerNamesList = myActiveMatches.map(m => {
                    const partnerId = m.studentIds.find(id => id !== s.id);
                    const partner = window.db.getStudent(partnerId || '');
                    if (!partner) return '';
                    const partnerSchool = window.db.getSchool(partner.schoolId);
                    let emojiFlag = '🏫';
                    if (partnerSchool) {
                      const c = partnerSchool.country.toLowerCase();
                      if (c.includes('germany') || c.includes('deutschland')) emojiFlag = '🇩🇪';
                      else if (c.includes('united kingdom') || c.includes('uk') || c.includes('britain') || c.includes('england')) emojiFlag = '🇬🇧';
                      else if (c.includes('france')) emojiFlag = '🇫🇷';
                      else if (c.includes('spain')) emojiFlag = '🇪🇸';
                      else if (c.includes('italy')) emojiFlag = '🇮🇹';
                      else if (c.includes('united states') || c.includes('us')) emojiFlag = '🇺🇸';
                      else if (c.includes('canada')) emojiFlag = '🇨🇦';
                    }
                    const firstName = partner.name.split(' ')[0];
                    return `${emojiFlag} ${firstName}`;
                  }).filter(name => name !== '');
                  if (partnerNamesList.length > 0) {
                    tooltipAttr = `title="${this.translate('matched_status_badge', 'Matched')} with: ${partnerNamesList.join(', ')}" style="cursor: help;"`;
                  }
                }
                const displayName = isOwnSchool ? s.name : s.name.split(' ')[0];
                const displayEmail = isOwnSchool ? s.email : '[Hidden - GDPR]';
                return `
                  <tr style="border-bottom: 1px solid var(--panel-border);">
                    <td style="padding: 0.5rem; font-weight: 600;">${displayName}</td>
                    <td style="padding: 0.5rem; color: var(--text-secondary);">${displayEmail}</td>
                    <td style="padding: 0.5rem;">${this.translate('age_label', 'Age')} ${s.age} (${this.translateYearGroup(s.yearGroup)})</td>
                    <td style="padding: 0.5rem;"><span class="badge ${badgeClass}" ${tooltipAttr}>${matchStatusText}</span></td>
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
    if (this.currentRole === 'student') {
      if (schoolCoords.length > 0) {
        coordinatorsSection = `
          <div style="margin-top: 0.5rem; border-top: 1px dashed var(--panel-border); padding-top: 0.75rem;">
            <h5 style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">${this.translate('school_coordinators_title', 'School Coordinator(s)')}</h5>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              ${schoolCoords.map(coord => {
                const photoMarkup = coord.photoUrl 
                  ? `<img src="${coord.photoUrl}" alt="${coord.name}" style="width: 100%; height: 100%; object-fit: cover;">`
                  : `<span style="font-size: 1.1rem;">👤</span>`;
                  
                const bioMarkup = coord.bio 
                  ? `<p style="font-size: 0.75rem; color: var(--text-muted); font-style: italic; margin-top: 0.15rem; line-height: 1.35; white-space: pre-wrap;">"${coord.bio}"</p>`
                  : '';
                  
                return `
                  <div style="display: flex; gap: 0.75rem; padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.01); border: 1px solid var(--panel-border); border-radius: 8px;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--panel-border); overflow: hidden; background: rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                      ${photoMarkup}
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 0.1rem; text-align: left;">
                      <strong style="font-size: 0.8rem; color: var(--text-primary);">${coord.name}</strong>
                      <span style="font-size: 0.7rem; color: var(--text-secondary);"><a href="mailto:${coord.email}" style="color: var(--secondary); text-decoration: underline;">${coord.email}</a></span>
                      ${bioMarkup}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }
    } else {
      coordinatorsSection = `
        <div style="margin-top: 0.5rem; border-top: 1px dashed var(--panel-border); padding-top: 0.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <h5 style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin: 0;">${this.translate('registered_coordinators_label', 'Registered Coordinators')} (${schoolCoords.length})</h5>
            <button class="btn btn-secondary btn-small" onclick="document.getElementById('add-modal-coord-form-container').style.display = 'block'">+ ${this.translate('add_coordinator_btn', 'Add Coordinator')}</button>
          </div>
          
          <!-- Add Coordinator Form (Hidden by default) -->
          <div id="add-modal-coord-form-container" style="display: none; background: rgba(0,0,0,0.15); padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem; border: 1px solid var(--panel-border);">
            <form onsubmit="app.addCoordinatorToSchool(event, '${school.id}')">
              <h6 style="font-size: 0.8rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--text-primary);">${this.translate('add_coordinator_info_btn', 'Add Coordinator Info')}</h6>
              <div class="form-group" style="margin-bottom: 0.5rem;">
                <input type="text" id="new-modal-coord-name" class="form-control" style="font-size: 0.75rem; padding: 0.35rem 0.65rem;" placeholder="${this.translate('full_name_label', 'Full Name')}" required>
              </div>
              <div class="form-group" style="margin-bottom: 0.5rem;">
                <input type="email" id="new-modal-coord-email" class="form-control" style="font-size: 0.75rem; padding: 0.35rem 0.65rem;" placeholder="${this.translate('email_address_label', 'Email Address')}" required>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                <label style="font-size: 0.75rem; display: flex; align-items: center; gap: 0.25rem;">
                  <input type="checkbox" id="new-modal-coord-admin"> ${this.translate('grant_admin_rights_label', 'Grant School Admin Rights')}
                </label>
                <div style="display: flex; gap: 0.5rem;">
                  <button type="button" class="btn btn-secondary btn-small" onclick="document.getElementById('add-modal-coord-form-container').style.display = 'none'">${this.translate('cancel_btn', 'Cancel')}</button>
                  <button type="submit" class="btn btn-primary btn-small">${this.translate('add_btn', 'Add')}</button>
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
          <h4 style="font-weight: 700; font-size: 1.25rem; margin: 0; color: var(--text-primary);">${this.getSchoolFlag(school.country)} ${school.name}</h4>
          <span style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 500;">
            📍 ${school.city}, ${school.country} • Code: <strong style="color: var(--secondary);">${school.code}</strong>
          </span>
        </div>
      </div>

      <div class="panel" style="padding: 1rem; background: var(--bg-color); border-color: var(--panel-border); margin-top: 0.5rem;">
        <h5 style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">${this.translate('school_biography', 'School Biography')}</h5>
        <p style="font-size: 0.85rem; line-height: 1.5; color: var(--text-secondary); margin: 0; text-align: justify;">
          ${school.description || this.translate('no_school_description', 'No school description set yet.')}
        </p>
      </div>

      ${coordinatorsSection}
      ${rosterSection}

      <div style="display: flex; justify-content: flex-end; margin-top: 1rem; border-top: 1px solid var(--panel-border); padding-top: 1rem;">
        <button class="btn btn-secondary" onclick="app.closeModal('school-detail-modal')">${this.translate('close_details_btn', 'Close Details')}</button>
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
    
    const displayName = this.getStudentDisplayName(student);
    const initials = displayName.split(' ').map(n => n[0]).join('');
    const biogToShow = student.personalBiogStatus === 'Approved' && student.personalBiog
      ? student.personalBiog
      : `<em>${this.translate('no_biography_shared', 'No biography shared yet.')}</em>`;

    const modalContent = document.querySelector('#student-profile-modal .modal-content');
    if (modalContent) {
      modalContent.style.maxWidth = '500px';
    }

    const container = document.getElementById('student-profile-content');
    if (!container) return;

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem; text-align: center; margin-top: 0.5rem;">
        <div class="user-avatar" style="width: 72px; height: 72px; font-size: 1.8rem; background: linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%);">
          ${initials}
        </div>
        <div>
          <h4 style="font-weight: 700; font-size: 1.35rem; margin: 0; color: var(--text-primary);">${displayName}</h4>
          <span class="badge badge-info" style="margin-top: 0.35rem;">${this.translate('age_label', 'Age')} ${student.age} • ${this.translateYearGroup(student.yearGroup)}</span>
        </div>
      </div>

      <div class="panel" style="padding: 1rem; background: var(--bg-color); border-color: var(--panel-border);">
        <h5 style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">${this.translate('school_connection_title', 'School Connection')}</h5>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="font-size: 1.5rem;">${this.getSchoolFlag(school?.country)}</div>
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

      <div class="panel" style="padding: 1rem; background: var(--bg-color); border-color: var(--panel-border);">
        <h5 style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">${this.translate('personal_biography_title', 'Personal Biography')}</h5>
        <p style="font-size: 0.85rem; line-height: 1.5; color: var(--text-secondary); margin: 0; text-align: justify; font-style: ${student.personalBiog ? 'normal' : 'italic'};">
          ${biogToShow}
        </p>
      </div>

      <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem; border-top: 1px solid var(--panel-border); padding-top: 1rem;">
        <button class="btn btn-secondary" onclick="app.closeModal('student-profile-modal')">${this.translate('close_profile_btn', 'Close Profile')}</button>
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

  // Opens detailed student profile inspector modal for teachers
  openTeacherStudentProfileModal(studentId) {
    const student = window.db.getStudent(studentId);
    if (!student) return;
    const school = window.db.getSchool(student.schoolId);

    const isStaff = this.currentRole === 'teacher' || this.currentRole === 'admin';
    const modalContent = document.querySelector('#student-profile-modal .modal-content');
    if (modalContent) {
      modalContent.style.maxWidth = isStaff ? '700px' : '400px';
    }

    const container = document.getElementById('student-profile-content');
    if (!container) return;

    const biogText = student.personalBiog || student.pendingBiog || 'No biography details provided.';

    if (!isStaff) {
      container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1.25rem; text-align: center; align-items: center; padding: 0.5rem 0;">
          <div class="user-avatar" style="width: 64px; height: 64px; font-size: 1.5rem; margin: 0 auto; background: linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%); display: flex; align-items: center; justify-content: center; border-radius: 50%; color: #fff;">
            ${student.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h4 style="font-weight: 700; font-size: 1.2rem; margin: 0; color: var(--text-primary);">${student.name}</h4>
            <div style="font-size: 0.85rem; color: var(--secondary); margin-top: 0.25rem; font-weight: 600;">
              ${school ? school.name : ''}
            </div>
          </div>
          
          <div style="display: flex; gap: 1rem; width: 100%; justify-content: space-around; padding: 0.75rem; border: 1px solid var(--panel-border); border-radius: 8px; background: rgba(255,255,255,0.01); font-size: 0.85rem; box-sizing: border-box;">
            <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
              <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500;">${this.translate('th_age', 'Age')}</span>
              <span style="font-weight: bold; color: var(--text-primary); margin-top: 0.15rem;">${student.age}</span>
            </div>
            <div style="border-right: 1px solid var(--panel-border);"></div>
            <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
              <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500;">${this.translate('th_gender', 'Gender')}</span>
              <span style="font-weight: bold; color: var(--text-primary); margin-top: 0.15rem;">${this.translateGender(student.gender)}</span>
            </div>
            <div style="border-right: 1px solid var(--panel-border);"></div>
            <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
              <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500;">${this.translate('th_year', 'Year')}</span>
              <span style="font-weight: bold; color: var(--text-primary); margin-top: 0.15rem;">${this.translateYearGroup(student.yearGroup)}</span>
            </div>
          </div>
          
          <div style="width: 100%; text-align: left;">
            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: bold; text-transform: uppercase; display: block; margin-bottom: 0.25rem;">${this.translate('th_biography', 'Biography')}</span>
            <p style="font-size: 0.85rem; line-height: 1.4; color: var(--text-secondary); margin: 0; padding: 0.75rem; border: 1px solid var(--panel-border); border-radius: 8px; background: var(--bg-color); font-style: italic;">
              "${biogText}"
            </p>
          </div>
        </div>
        <div style="display: flex; justify-content: flex-end; margin-top: 1rem; border-top: 1px solid var(--panel-border); padding-top: 0.75rem; width: 100%;">
          <button class="btn btn-secondary" onclick="app.closeModal('student-profile-modal')">${this.translate('close_profile_btn', 'Close Profile')}</button>
        </div>
      `;
      this.openModal('student-profile-modal');
      return;
    }

    // 1. Get matched students info
    const matches = window.db.getMatches().filter(m => m.active && m.studentIds.includes(studentId));
    let matchesHtml = '';
    if (matches.length === 0) {
      matchesHtml = `
        <div style="font-size: 0.85rem; color: var(--text-muted); padding: 0.5rem 0; font-style: italic;">
          ${this.translate('no_matched_pen_pals', 'No active connections yet.')}
        </div>
      `;
    } else {
      matchesHtml = matches.map(match => {
        const partnerId = match.studentIds.find(id => id !== studentId);
        const partner = window.db.getStudent(partnerId);
        const partnerSchool = partner ? window.db.getSchool(partner.schoolId) : null;
        if (!partner) return '';

        const partnerFirstName = partner.name.split(' ')[0]; // GDPR
        const partnerBiog = partner.personalBiog || partner.pendingBiog || 'No biography text written by this student yet.';
        
        return `
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--panel-border); padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 0.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.25rem;">
              <div>
                <strong style="color: var(--secondary); font-size: 0.9rem;">${partnerFirstName}</strong>
                <span style="font-size: 0.75rem; color: var(--text-secondary);">(${partner.gender} • ${partner.age} y/o)</span>
              </div>
              <span class="badge badge-success" style="font-size: 0.65rem; padding: 0.1rem 0.35rem; border-radius: 4px; font-weight: 700;">${this.translate('active_match_status', 'Active Match')}</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem;">School: ${partnerSchool ? partnerSchool.name : 'Unknown School'}</div>
            <div style="font-size: 0.8rem; font-style: italic; color: var(--text-secondary); background: rgba(0,0,0,0.1); padding: 0.5rem; border-radius: 4px;">
              "${partnerBiog}"
            </div>
          </div>
        `;
      }).join('');
    }

    // 2. Get student's articles
    const articles = window.db.getArticles().filter(a => a.authorId === studentId);
    let articlesHtml = '';
    if (articles.length === 0) {
      articlesHtml = `
        <div style="font-size: 0.85rem; color: var(--text-muted); padding: 0.5rem 0; font-style: italic;">
          ${this.translate('no_articles_submitted', 'No articles submitted yet.')}
        </div>
      `;
    } else {
      articlesHtml = `
        <div style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 180px; overflow-y: auto; padding-right: 0.25rem;">
          ${articles.map(art => {
            let badgeClass = art.status === 'Approved' ? 'badge-success' : (art.status === 'Pending' ? 'badge-warning' : 'badge-danger');
            return `
              <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.01); border: 1px solid var(--panel-border); padding: 0.5rem 0.75rem; border-radius: 6px; gap: 0.5rem;">
                <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-grow: 1;">
                  <strong style="font-size: 0.85rem; color: var(--text-primary);">${art.title}</strong>
                  <span class="badge ${badgeClass}" style="font-size: 0.6rem; padding: 0.05rem 0.25rem; margin-left: 0.35rem;">${art.status}</span>
                </div>
                <button class="btn btn-secondary btn-small" onclick="app.loadArticleFromProfile('${art.id}')" style="padding: 0.2rem 0.45rem; font-size: 0.7rem; font-weight: 600; border-radius: 4px;">${this.translate('load_btn', 'Load')}</button>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    // 3. Get student's projects
    const projects = window.db.getProjects().filter(p => p.creatorSchoolStudentIds.includes(studentId) || p.targetSchoolStudentIds.includes(studentId));
    let projectsHtml = '';
    if (projects.length === 0) {
      projectsHtml = `
        <div style="font-size: 0.85rem; color: var(--text-muted); padding: 0.5rem 0; font-style: italic;">
          ${this.translate('no_projects_found', 'No projects found.')}
        </div>
      `;
    } else {
      projectsHtml = `
        <div style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 180px; overflow-y: auto; padding-right: 0.25rem;">
          ${projects.map(proj => {
            return `
              <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.01); border: 1px solid var(--panel-border); padding: 0.5rem 0.75rem; border-radius: 6px; gap: 0.5rem;">
                <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-grow: 1;">
                  <strong style="font-size: 0.85rem; color: var(--text-primary);">${proj.title}</strong>
                  <span class="badge badge-info" style="font-size: 0.6rem; padding: 0.05rem 0.25rem; margin-left: 0.35rem;">${proj.status}</span>
                </div>
                <button class="btn btn-secondary btn-small" onclick="app.loadProjectFromProfile('${proj.id}')" style="padding: 0.2rem 0.45rem; font-size: 0.7rem; font-weight: 600; border-radius: 4px;">${this.translate('load_btn', 'Load')}</button>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
    container.innerHTML = `
      <div style="display: flex; gap: 1rem; align-items: center; border-bottom: 1px solid var(--panel-border); padding-bottom: 0.75rem;">
        <div class="user-avatar" style="width: 54px; height: 54px; font-size: 1.4rem; background: linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%);">
          ${student.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <h4 style="font-weight: 700; font-size: 1.2rem; margin: 0; color: var(--text-primary);">${student.name}</h4>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.15rem; font-weight: 500;">
            ${student.email} • ${this.translate('age_label', 'Age')} ${student.age} • ${this.translateGender(student.gender)} • ${this.translateYearGroup(student.yearGroup)}
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">
            Last Logon: <strong>${this.getLogonDisplay(student.activityLevel)}</strong> | Status: <strong>${student.invitationStatus}</strong>
          </div>
        </div>
      </div>

      <!-- Biography Section -->
      <div class="panel" style="padding: 0.85rem; background: rgba(255,255,255,0.01); border-color: var(--panel-border); margin-top: 0.5rem;">
        <h5 style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.35rem; margin-top: 0;">${this.translate('student_biography_title', 'Student Biography')}</h5>
        <p style="font-size: 0.85rem; line-height: 1.4; color: var(--text-secondary); margin: 0; text-align: justify; font-style: ${student.personalBiog ? 'normal' : 'italic'};">
          "${biogText}"
        </p>
      </div>

      ${isStaff ? `
      <!-- Matched Pen Pals Section -->
      <div style="margin-top: 0.5rem;">
        <h5 style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.35rem;">${this.translate('matched_pen_pals_label', 'Connected Partners')} (${matches.length})</h5>
        ${matchesHtml}
      </div>

      <!-- Two Column Layout for Articles and Projects -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 0.75rem; border-top: 1px dashed var(--panel-border); padding-top: 0.75rem;">
        <div>
          <h5 style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.35rem; margin-top: 0;">${this.translate('articles_title', 'Articles')}</h5>
          ${articlesHtml}
        </div>
        <div>
          <h5 style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.35rem; margin-top: 0;">${this.translate('projects_title', 'Projects')}</h5>
          ${projectsHtml}
        </div>
      </div>

      <!-- Staff Notices & Messages Section -->
      <div style="margin-top: 0.75rem; border-top: 1px dashed var(--panel-border); padding-top: 0.75rem;">
        <h5 style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.35rem;">${this.translate('direct_notices_messages_title', 'Direct Notices & Messages to Student')}</h5>
        
        <!-- List of past notices sent to this student -->
        <div id="staff-student-messages-list-${studentId}" style="display: flex; flex-direction: column; gap: 0.5rem; max-height: 180px; overflow-y: auto; margin-bottom: 0.75rem; padding-right: 0.25rem;">
          <!-- Populated by JS -->
        </div>

        <!-- Compose new notice -->
        <div class="panel" style="padding: 0.75rem; background: rgba(255,255,255,0.01); border-color: var(--panel-border);">
          <h6 style="font-size: 0.8rem; font-weight: 700; margin: 0 0 0.4rem 0; color: var(--text-primary);">${this.translate('send_direct_message_label', 'Send Direct Message / Notice:')}</h6>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <textarea id="new-staff-student-msg-text" class="form-control" style="height: 60px; font-size: 0.8rem; resize: vertical;" placeholder="Type message or guidance for student here..." required></textarea>
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
              <label style="display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; font-weight: 600; cursor: pointer; color: var(--text-secondary);">
                <input type="checkbox" id="new-staff-student-msg-agree" style="width: 15px; height: 15px; cursor: pointer;">
                ${this.translate('require_read_agree_label', "Require 'Read & Agree' confirmation")}
              </label>
              <button class="btn btn-primary btn-small" onclick="app.sendStaffStudentMessage('${studentId}')" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; font-weight: 600; border-radius: 4px;">${this.translate('send_message_btn', 'Send Message')}</button>
            </div>
          </div>
        </div>
      </div>
      ` : ''}

      <div style="display: flex; justify-content: flex-end; margin-top: 1rem; border-top: 1px solid var(--panel-border); padding-top: 0.75rem;">
        <button class="btn btn-secondary" onclick="app.closeModal('student-profile-modal')">${this.translate('close_profile_btn', 'Close Profile')}</button>
      </div>
    `;

    this.openModal('student-profile-modal');
    if (isStaff) {
      this.renderStaffStudentMessagesList(studentId);
    }
  }

  renderStaffStudentMessagesList(studentId) {
    const listContainer = document.getElementById(`staff-student-messages-list-${studentId}`);
    if (!listContainer) return;
    
    const messages = window.db.getStaffStudentMessages().filter(m => m.recipientId === studentId);
    listContainer.innerHTML = '';
    
    if (messages.length === 0) {
      listContainer.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-muted); font-style: italic; padding: 0.25rem 0;">${this.translate('no_previous_direct_messages', 'No previous direct messages sent.')}</div>`;
      return;
    }
    
    // Sort by timestamp descending
    const sorted = [...messages].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    sorted.forEach(msg => {
      const item = document.createElement('div');
      item.style.padding = '0.5rem';
      item.style.background = 'rgba(255,255,255,0.01)';
      item.style.border = '1px solid var(--panel-border)';
      item.style.borderRadius = '6px';
      item.style.fontSize = '0.85rem';
      
      let statusHtml = '';
      if (msg.requireAgreement) {
        if (msg.status === 'Agreed') {
          statusHtml = `<span class="badge badge-success" style="font-size: 0.75rem; padding: 0.1rem 0.3rem; font-weight: 700; margin-left: auto;">${this.translate('agreed_badge', 'Read & Agreed')} (${this.translate('at_time_label', 'at')} ${new Date(msg.agreedAt).toLocaleString()})</span>`;
        } else {
          statusHtml = `<span class="badge badge-warning" style="font-size: 0.75rem; padding: 0.1rem 0.3rem; font-weight: 700; margin-left: auto;">${this.translate('awaiting_agreement_status', 'Awaiting Agreement')}</span>`;
        }
      } else {
        statusHtml = `<span class="badge badge-info" style="font-size: 0.75rem; padding: 0.1rem 0.3rem; font-weight: 700; margin-left: auto;">${this.translate('sent_notice_status', 'Sent / Notice')}</span>`;
      }
      
      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; border-bottom: 1px dashed var(--panel-border); padding-bottom: 0.15rem;">
          <strong style="color: var(--text-secondary);">Sent by: ${msg.senderName}</strong>
          <span style="color: var(--text-muted); font-size: 0.75rem;">${new Date(msg.timestamp).toLocaleString()}</span>
        </div>
        <p style="margin: 0.15rem 0; color: var(--text-primary); text-align: justify; line-height: 1.3;">${msg.text}</p>
        <div style="display: flex; align-items: center; margin-top: 0.15rem;">
          ${statusHtml}
        </div>
      `;
      listContainer.appendChild(item);
    });
  }

  sendStaffStudentMessage(studentId) {
    const textInput = document.getElementById('new-staff-student-msg-text');
    const text = textInput ? textInput.value.trim() : '';
    if (!text) {
      alert(this.translate('type_message_warning', 'Please type a message before sending.'));
      return;
    }
    
    const agreeCheckbox = document.getElementById('new-staff-student-msg-agree');
    const requireAgreement = agreeCheckbox ? agreeCheckbox.checked : false;
    
    const teacher = this.getLoggedTeacher();
    const senderId = teacher ? teacher.id : 'coord_1';
    const senderName = teacher ? teacher.name : this.translate('teacher_label', 'Teacher');
    
    const newMsg = {
      id: 'ssm_' + Date.now(),
      senderId,
      senderName,
      recipientId: studentId,
      text,
      timestamp: new Date().toISOString(),
      requireAgreement,
      status: 'Unread',
      agreedAt: null
    };
    
    const list = window.db.getStaffStudentMessages();
    list.push(newMsg);
    window.db.saveTable('staffStudentMessages', list);
    
    // Add audit log
    const student = window.db.getStudent(studentId);
    const studentName = student ? student.name : 'Student';
    window.db.addLog('Staff Notice Sent', `Teacher ${senderName} sent notice to student ${studentName}. Require Agreement: ${requireAgreement}`, senderName);
    
    // Reset inputs
    if (textInput) textInput.value = '';
    if (agreeCheckbox) agreeCheckbox.checked = false;
    
    alert(this.translate('message_sent_success', 'Message sent to student successfully.'));
    
    // Re-render list and refresh UI
    this.renderStaffStudentMessagesList(studentId);
    this.refreshUI();
  }

  loadArticleFromProfile(articleId) {
    this.closeModal('student-profile-modal');
    setTimeout(() => {
      this.openStudentArticleDetail(articleId);
    }, 150);
  }

  loadProjectFromProfile(projectId) {
    this.closeModal('student-profile-modal');
    setTimeout(() => {
      this.openReviewProjectModal(projectId);
    }, 150);
  }

  // Opens detailed student article modal
  openStudentArticleDetail(articleId) {
    const art = window.db.getArticles().find(a => a.id === articleId);
    if (!art) return;
    let authorName = '';
    if (art.authorType === 'staff') {
      const staffObj = window.db.getCoordinators().find(c => c.id === art.authorId);
      authorName = staffObj ? `${staffObj.name} (${this.translate('staff_label', 'Staff')})` : 'Staff Member';
    } else {
      const author = window.db.getStudent(art.authorId);
      authorName = author ? this.getStudentDisplayName(author) : 'Unknown Author';
    }
    const school = window.db.getSchool(art.schoolId);

    const container = document.getElementById('article-detail-content');
    if (!container) return;

    let statusBadge = '';
    if (art.status === 'Approved') statusBadge = `<span class="badge badge-success">${this.translate('approved_status', 'Approved')}</span>`;
    else if (art.status === 'Pending') statusBadge = `<span class="badge badge-warning">${this.translate('pending_review_status', 'Pending Review')}</span>`;
    else statusBadge = `<span class="badge badge-danger">${this.translate('rejected_status', 'Rejected')}</span>`;

    const photoHtml = art.photoUrl
      ? `<img src="${art.photoUrl}" alt="${art.title} photo" style="width: 100%; height: 200px; object-fit: cover; border-radius: 12px; margin-bottom: 0.5rem;">`
      : '';

    container.innerHTML = `
      ${photoHtml}
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
        <div>
          <h4 style="font-weight: 700; font-size: 1.25rem; margin: 0; color: var(--text-primary);">${art.title}</h4>
          <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 500;">
            By ${authorName} • ${school ? school.name : 'Unknown School'} ${art.language ? `(${art.language.toUpperCase()})` : ''}
          </span>
        </div>
        <div>${statusBadge}</div>
      </div>

      <div class="panel" style="padding: 1.25rem; background: rgba(0,0,0,0.15); border-color: var(--panel-border); margin-top: 0.75rem; border-radius: 8px;">
        <p style="font-size: 0.9rem; font-family: var(--font-body); line-height: 1.6; color: var(--text-primary); margin: 0; white-space: pre-wrap;">
          ${art.content}
        </p>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; border-top: 1px solid var(--panel-border); padding-top: 1rem;">
        <span style="font-size: 0.75rem; color: var(--text-muted);">Submitted on: ${new Date(art.submittedAt).toLocaleDateString()}</span>
        <button class="btn btn-secondary" onclick="app.closeModal('article-detail-modal')">${this.translate('close_details_btn', 'Close Details')}</button>
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
      alert(this.translate('fill_all_fields_warning', 'Please fill out all fields.'));
      return;
    }

    const coordinators = window.db.getCoordinators();
    if (coordinators.some(c => c.email === email)) {
      alert(this.translate('coordinator_email_exists_warning', 'A coordinator with this email address is already registered on the platform.'));
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

    alert(this.translate('coordinator_added_success', 'Coordinator {name} added successfully!').replace('{name}', name));
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
    const settings = window.db.getSettings();
    if (settings.translationEnabled === false) return;

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

  // Toggles display of the special character keyboard
  toggleCharKeyboard() {
    const panel = document.getElementById('char-keyboard-panel');
    const btn = document.getElementById('toggle-char-keyboard-btn');
    if (panel.style.display === 'none' || !panel.style.display) {
      panel.style.display = 'block';
      btn.classList.add('active');
      if (!this.charKeyboardTab) {
        this.charKeyboardTab = 'de';
      }
      this.renderCharKeyboardChars();
    } else {
      panel.style.display = 'none';
      btn.classList.remove('active');
    }
  }

  // Switches language tab in special character keyboard
  switchCharKeyboardTab(tab) {
    this.charKeyboardTab = tab;
    // Update active class on tab labels
    const tabs = ['de', 'fr', 'es', 'symbols'];
    tabs.forEach(t => {
      const el = document.getElementById(`char-tab-${t}`);
      if (el) {
        if (t === tab) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }
    });
    this.renderCharKeyboardChars();
  }

  // Renders keyboard character keys dynamically
  renderCharKeyboardChars() {
    const grid = document.getElementById('char-keyboard-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const charsMap = {
      de: ['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'],
      fr: ['é', 'è', 'à', 'ç', 'ù', 'â', 'ê', 'î', 'ô', 'û', 'ë', 'ï', 'œ', 'É', 'È', 'À', 'Ç'],
      es: ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¡', '¿', 'Á', 'É', 'Í', 'Ó', 'Ú', 'Ñ'],
      symbols: ['€', '£', '¥', '«', '»', '“', '”', '—']
    };

    const chars = charsMap[this.charKeyboardTab || 'de'] || [];
    chars.forEach(char => {
      const keyBtn = document.createElement('button');
      keyBtn.type = 'button';
      keyBtn.className = 'char-key';
      keyBtn.textContent = char;
      keyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.insertChar(char);
      });
      grid.appendChild(keyBtn);
    });
  }

  // Inserts a character at the cursor position in the student direct chat textarea
  insertChar(char) {
    const textarea = document.getElementById('chat-textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newText = before + char + after;
      textarea.value = newText;

      // Trigger input event to update translation previews / auto-translate
      const inputEvent = new Event('input', { bubbles: true });
      textarea.dispatchEvent(inputEvent);

      // Focus back and position cursor after inserted character
      textarea.focus();
      textarea.setSelectionRange(start + char.length, start + char.length);
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
    
    // Filter active chat partners: chatted with OR currently selected to start a new chat
    const messages = window.db.getCoordinatorMessages();
    const chattedCoordinatorIds = new Set(
      messages.filter(m => m.senderId === myId || m.receiverId === myId)
              .map(m => m.senderId === myId ? m.receiverId : m.senderId)
    );

    const messagePartners = otherCoordinators.filter(c => 
      chattedCoordinatorIds.has(c.id) || c.id === this.activeCoordinatorId
    );
    
    if (messagePartners.length === 0) {
      chatListContainer.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted); padding: 1.5rem; text-align: center; line-height: 1.4;">${this.translate('no_active_chats_yet', 'No active chats yet. Use the "Discover Schools" gallery to find connection partners and start a conversation!')}</p>`;
      chatEmptyState.style.display = 'flex';
      chatActiveState.style.display = 'none';
      return;
    }

    // Set first partner as default if none active or active is not in messagePartners
    if (!this.activeCoordinatorId || !messagePartners.some(p => p.id === this.activeCoordinatorId)) {
      this.activeCoordinatorId = messagePartners[0].id;
    }

    // Auto-mark unread messages as read for active coordinator
    if (this.activeCoordinatorId) {
      const allMsgs = window.db.getCoordinatorMessages();
      let changed = false;
      allMsgs.forEach(m => {
        if (m.senderId === this.activeCoordinatorId && m.receiverId === myId && !m.read) {
          m.read = true;
          changed = true;
        }
      });
      if (changed) {
        window.db.saveTable('coordinatorMessages', allMsgs);
        this.updateStaffUnreadBadge();
      }
    }

    messagePartners.forEach(coord => {
      const msgs = window.db.getCoordinatorMessages().filter(m => 
        (m.senderId === myId && m.receiverId === coord.id) || 
        (m.senderId === coord.id && m.receiverId === myId)
      );
      const lastMsg = msgs[msgs.length - 1];
      const school = window.db.getSchool(coord.schoolId);
      const flag = school ? this.getSchoolFlag(school.country) : '';
      const unreadCount = window.db.getCoordinatorMessages().filter(m => 
        m.senderId === coord.id && m.receiverId === myId && !m.read
      ).length;

      const item = document.createElement('div');
      item.className = `chat-item ${this.activeCoordinatorId === coord.id ? 'active' : ''}`;
      
      item.innerHTML = `
        <div class="user-avatar" style="width: 32px; height: 32px; font-size: 0.8rem; background: var(--accent); flex-shrink: 0;">
          ${coord.name.split(' ').map(n => n[0]).join('') || '?'}
        </div>
        <div class="chat-item-meta" style="flex: 1; min-width: 0;">
          <div class="chat-item-name" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <span style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 130px;">${coord.name}</span>
            ${unreadCount > 0 ? `<span class="badge badge-danger alert-pulse" style="font-size: 0.75rem; padding: 0.15rem 0.35rem; border-radius: 10px; margin-left: auto; flex-shrink: 0; line-height: 1;">${unreadCount}</span>` : ''}
          </div>
          <div style="font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.25rem; margin-top: 0.15rem; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            <span>${flag}</span>
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${school ? school.name : this.translate('staff_label', 'Staff')}</span>
          </div>
          <div class="chat-item-preview" style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;">${lastMsg ? lastMsg.text : this.translate('start_chatting_placeholder', 'Start chatting...')}</div>
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

      const previewSpan = document.getElementById('teacher-compose-translation-preview');
      if (previewSpan) {
        previewSpan.textContent = '';
        previewSpan.removeAttribute('data-draft');
      }

      const settings = window.db.getSettings();
      const translationEnabled = settings.translationEnabled !== false;

      const composeArea = document.getElementById('teacher-chat-compose-area');
      const translationBar = composeArea ? composeArea.querySelector('.translation-bar') : null;
      if (translationBar) {
        translationBar.style.display = translationEnabled ? 'flex' : 'none';
      }

      const partnerSchool = window.db.getSchool(activeCoord.schoolId);
      const partnerFlag = partnerSchool ? this.getSchoolFlag(partnerSchool.country) : '';
      document.getElementById('teacher-chat-partner-avatar').textContent = activeCoord.name.split(' ').map(n => n[0]).join('') || '?';
      document.getElementById('teacher-chat-partner-name').textContent = activeCoord.name;
      
      const schoolEl = document.getElementById('teacher-chat-partner-school');
      schoolEl.innerHTML = partnerSchool ? `${partnerFlag} ${partnerSchool.name} • ${partnerSchool.country}` : 'Unknown School';
      if (partnerSchool) {
        schoolEl.style.cursor = 'pointer';
        schoolEl.style.textDecoration = 'underline';
        schoolEl.style.color = 'var(--secondary)';
        schoolEl.title = this.translate('click_view_school_profile', 'Click to view school profile');
        schoolEl.onclick = () => {
          this.openSchoolDetail(partnerSchool.id);
        };
      } else {
        schoolEl.style.cursor = '';
        schoolEl.style.textDecoration = '';
        schoolEl.style.color = '';
        schoolEl.onclick = null;
      }

      // Render feed
      const feed = document.getElementById('teacher-chat-message-feed');
      feed.innerHTML = '';
      
      const msgs = window.db.getCoordinatorMessages().filter(m => 
        (m.senderId === myId && m.receiverId === activeCoord.id) || 
        (m.senderId === activeCoord.id && m.receiverId === myId)
      );

      msgs.forEach(msg => {
        // Self-healing: clear any invalid MyMemory error responses from database
        if (msg.translation && (msg.translation.includes('INVALID') || msg.translation.includes('LANGPAIR') || msg.translation.includes('SUPPORTED'))) {
          msg.translation = '';
          const allMsgs = window.db.getCoordinatorMessages();
          const dbMsg = allMsgs.find(m => m.id === msg.id);
          if (dbMsg) {
            dbMsg.translation = '';
            window.db.saveTable('coordinatorMessages', allMsgs);
          }
        }

        const row = document.createElement('div');
        const isSent = msg.senderId === myId;
        row.className = `message-row ${isSent ? 'sent' : 'received'}`;
        
        let transRow = '';
        const cleanOriginal = msg.text.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"");
        const cleanTranslated = msg.translation ? msg.translation.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"") : '';
        const shouldShowTranslation = msg.translation && (cleanOriginal !== cleanTranslated);

        if (shouldShowTranslation && translationEnabled && this.teacherConversationTranslateEnabled) {
          transRow = `<div class="message-translation" style="font-size: 0.82rem; color: var(--secondary); margin-top: 0.25rem; font-style: italic; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 0.25rem;">📝 ${msg.translation}</div>`;
        } else if (!msg.translation && translationEnabled && this.teacherConversationTranslateEnabled) {
          const ownSchool = window.db.getSchool(teacher.schoolId);
          const myLang = ownSchool ? (ownSchool.country.toLowerCase().includes('germany') ? 'de' : ownSchool.country.toLowerCase().includes('france') ? 'fr' : 'en') : 'en';
          const partnerSchool = window.db.getSchool(activeCoord.schoolId);
          const partnerLang = partnerSchool ? (partnerSchool.country.toLowerCase().includes('germany') ? 'de' : partnerSchool.country.toLowerCase().includes('france') ? 'fr' : 'en') : 'en';

          let needsTranslation = false;
          let detectedSourceLang = myLang;

          if (!isSent) {
            needsTranslation = true;
            detectedSourceLang = partnerLang;
            
            // Refine detection for received messages
            const lower = msg.text.toLowerCase();
            const germanWords = ['danke', 'bitte', 'hallo', 'guten', 'tag', 'wie', 'geht', 'ist', 'gut', 'ja', 'nein'];
            const hasGerman = germanWords.some(w => new RegExp('\\b' + w + '\\b').test(lower));
            const hasGermanChars = /[äöüß]/i.test(msg.text);
            const frenchWords = ['bonjour', 'merci', 's\'il', 'vous', 'plaît', 'oui', 'non', 'salut', 'ça', 'va'];
            const hasFrench = frenchWords.some(w => new RegExp('\\b' + w + '\\b').test(lower));
            const hasFrenchChars = /[éèàùçâêîôûëïüÿœæ]/i.test(msg.text);
            if (hasGerman || hasGermanChars) {
              detectedSourceLang = 'de';
            } else if (hasFrench || hasFrenchChars) {
              detectedSourceLang = 'fr';
            }
          } else {
            const lower = msg.text.toLowerCase();
            const germanWords = ['danke', 'bitte', 'hallo', 'guten', 'tag', 'wie', 'geht', 'ist', 'gut', 'ja', 'nein'];
            const hasGerman = germanWords.some(w => new RegExp('\\b' + w + '\\b').test(lower));
            const hasGermanChars = /[äöüß]/i.test(msg.text);
            const frenchWords = ['bonjour', 'merci', 's\'il', 'vous', 'plaît', 'oui', 'non', 'salut', 'ça', 'va'];
            const hasFrench = frenchWords.some(w => new RegExp('\\b' + w + '\\b').test(lower));
            const hasFrenchChars = /[éèàùçâêîôûëïüÿœæ]/i.test(msg.text);
            
            if (myLang === 'en') {
              if (hasGerman || hasGermanChars) {
                detectedSourceLang = 'de';
                needsTranslation = true;
              } else if (hasFrench || hasFrenchChars) {
                detectedSourceLang = 'fr';
                needsTranslation = true;
              }
            } else if (myLang === 'de') {
              const englishWords = ['hello', 'hi', 'test', 'thanks', 'thank', 'you', 'please', 'good', 'morning', 'yes', 'no'];
              const hasEnglish = englishWords.some(w => new RegExp('\\b' + w + '\\b').test(lower));
              if (hasEnglish) {
                detectedSourceLang = 'en';
                needsTranslation = true;
              }
            }
          }

          if (needsTranslation && detectedSourceLang !== myLang) {
            transRow = `<div class="message-translation" style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.25rem; font-style: italic; border-top: 1px dashed rgba(255,255,255,0.15); padding-top: 0.25rem;">⏳ Translating...</div>`;
            this.translateCoordinatorMessageOnTheFly(msg, detectedSourceLang, myLang);
          }
        }

        row.innerHTML = `
          <div class="message-bubble">
            <div>${msg.text}</div>
            ${transRow}
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
    const previewSpan = document.getElementById('teacher-compose-translation-preview');
    if (!textarea || !textarea.value.trim() || !this.activeCoordinatorId) return;

    const teacher = this.getLoggedTeacher();
    const myId = teacher ? teacher.id : 'coord_1';
    const text = textarea.value.trim();
    const draftTranslation = previewSpan ? (previewSpan.getAttribute('data-draft') || '') : '';

    window.db.addCoordinatorMessage(myId, this.activeCoordinatorId, text, draftTranslation);
    textarea.value = '';
    
    if (previewSpan) {
      previewSpan.textContent = '';
      previewSpan.removeAttribute('data-draft');
      previewSpan.title = '';
    }
    
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
      p.status !== 'Cancelled' && (
        p.creatorSchoolStudentIds.includes(student.id) || 
        p.targetSchoolStudentIds.includes(student.id)
      )
    );

    if (projects.length === 0) {
      chatListContainer.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted); padding: 1rem; text-align: center;">${this.translate('no_projects_found', 'No projects found.')}</p>`;
      projectEmptyState.style.display = 'flex';
      projectActiveState.style.display = 'none';
      return;
    }

    // Set first project as default if none active or active not in list
    if (!this.activeProjectId || !projects.some(p => p.id === this.activeProjectId)) {
      this.activeProjectId = projects[0].id;
      this.activeSlideIndex = 0;
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

      let badgeStatus = `<span class="badge ${badgeClass}" style="font-size: 0.75rem; padding: 0.15rem 0.4rem;">${statusText}</span>`;
      if (project.paused) {
        badgeStatus += ` <span class="badge badge-warning" style="font-size: 0.75rem; padding: 0.15rem 0.4rem; color: #fbbf24; background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.25);">${this.translate('suspended_status', 'Suspended')}</span>`;
      }

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
        this.activeSlideIndex = 0;
        const activeProject = window.db.getProject(project.id);
        this.currentProjArticlePhotoDataUrl = (activeProject?.slides && activeProject.slides[0]) ? activeProject.slides[0].photoUrl || '' : '';
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
      const targets = activeProject.targetSchoolIds || (activeProject.targetSchoolId ? [activeProject.targetSchoolId] : []);
      const allSchools = [activeProject.creatorSchoolId, ...targets]
        .map(sid => window.db.getSchool(sid))
        .filter(Boolean);
      const schoolText = allSchools.map(sch => {
        const flag = this.getSchoolFlag(sch.country);
        return `${flag} ${sch.name}`;
      }).join(' & ');

      // Get member names
      const allStudentIds = [...activeProject.creatorSchoolStudentIds, ...activeProject.targetSchoolStudentIds];
      const memberNamesHtml = allStudentIds.map(sid => {
        const s = window.db.getStudent(sid);
        if (!s) return 'Unknown';
        const school = window.db.getSchool(s.schoolId);
        const flag = this.getSchoolFlag(school?.country);
        const displayName = this.getStudentDisplayName(s);
        return `<span style="display: inline-flex; align-items: center; gap: 0.25rem; vertical-align: middle;">${flag} ${displayName}</span>`;
      }).join(', ');

      document.getElementById('project-meta').innerHTML = `${schoolText} • ${memberNamesHtml}`;

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

      // Chat Panel Participant List
      const chatParticipantsList = document.getElementById('proj-chat-participants-list');
      if (chatParticipantsList) {
        chatParticipantsList.innerHTML = '';
        const teamLabel = document.createElement('span');
        teamLabel.style.fontWeight = '600';
        teamLabel.style.fontSize = '0.75rem';
        teamLabel.style.color = 'var(--text-muted)';
        teamLabel.style.marginRight = '0.25rem';
        teamLabel.textContent = this.translate('team_label', 'Team:');
        chatParticipantsList.appendChild(teamLabel);

        allStudentIds.forEach(sid => {
          const s = window.db.getStudent(sid);
          if (!s) return;
          const school = window.db.getSchool(s.schoolId);
          const flag = school ? this.getSchoolFlag(school.country) : '🏫';
          const displayName = this.getStudentDisplayName(s);
          const isMe = sid === student.id;

          const chip = document.createElement('span');
          chip.style.display = 'inline-flex';
          chip.style.alignItems = 'center';
          chip.style.gap = '0.25rem';
          chip.style.background = 'var(--panel-bg)';
          chip.style.color = 'var(--text-primary)';
          chip.style.padding = '0.15rem 0.5rem';
          chip.style.borderRadius = '6px';
          chip.style.border = '1px solid var(--panel-border)';
          chip.style.fontSize = '0.75rem';
          chip.innerHTML = `${flag} <span style="${isMe ? 'font-weight: bold; color: var(--primary);' : 'font-weight: normal; color: var(--text-primary);'}">${displayName}${isMe ? ' ' + this.translate('you_label_suffix', '(You)') : ''}</span>`;
          chatParticipantsList.appendChild(chip);
        });
      }

      // Brief Panel Participant List
      const briefParticipantsList = document.getElementById('proj-brief-participants-list');
      if (briefParticipantsList) {
        briefParticipantsList.innerHTML = '';
        allStudentIds.forEach(sid => {
          const s = window.db.getStudent(sid);
          if (!s) return;
          const school = window.db.getSchool(s.schoolId);
          const flag = school ? this.getSchoolFlag(school.country) : '🏫';
          const displayName = this.getStudentDisplayName(s);
          const isMe = sid === student.id;

          const row = document.createElement('div');
          row.style.display = 'flex';
          row.style.alignItems = 'center';
          row.style.justifyContent = 'space-between';
          row.style.padding = '0.5rem 0.75rem';
          row.style.borderRadius = '8px';
          row.style.border = '1px solid var(--panel-border)';
          row.style.background = 'var(--panel-bg)';
          row.style.fontSize = '0.85rem';

          row.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              ${flag}
              <span style="${isMe ? 'font-weight: bold; color: var(--primary);' : 'font-weight: 600; color: var(--text-primary);'} cursor: pointer; text-decoration: underline;" onclick="app.openStudentDetailModal('${sid}')">
                ${displayName} ${isMe ? '(You)' : ''}
              </span>
            </div>
            <span style="font-size: 0.75rem; color: var(--text-muted); cursor: pointer; text-decoration: underline;" onclick="app.openSchoolDetail('${school?.id}')">${school ? school.name : 'Unknown School'}</span>
          `;
          briefParticipantsList.appendChild(row);
        });
      }

      // Brief Panel Participating Schools List
      const briefSchoolsList = document.getElementById('proj-brief-schools-list');
      if (briefSchoolsList) {
        briefSchoolsList.innerHTML = '';
        const schoolIds = Array.from(new Set([activeProject.creatorSchoolId, activeProject.targetSchoolId]));
        schoolIds.forEach(schoolId => {
          const school = window.db.getSchool(schoolId);
          if (!school) return;
          const flag = this.getSchoolFlag(school.country);

          const row = document.createElement('div');
          row.style.display = 'flex';
          row.style.alignItems = 'center';
          row.style.justifyContent = 'space-between';
          row.style.padding = '0.55rem 0.85rem';
          row.style.borderRadius = '8px';
          row.style.border = '1px solid var(--panel-border)';
          row.style.background = 'rgba(255,255,255,0.02)';
          row.style.fontSize = '0.85rem';
          row.style.cursor = 'pointer';
          row.style.transition = 'all 0.2s';
          row.className = 'school-hover-row';
          row.setAttribute('onclick', `app.openSchoolDetail('${school.id}')`);

          row.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              ${flag}
              <span style="font-weight: 600; color: var(--text-primary);">${school.name}</span>
            </div>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${school.city}, ${school.country} ℹ️</span>
          `;
          briefSchoolsList.appendChild(row);
        });
      }

      // Migrate project slides if using old database schema
      if (!activeProject.slides) {
        activeProject.slides = [
          {
            id: 'slide_1',
            layout: activeProject.articlePhotoUrl ? 'split' : 'text-only',
            title: activeProject.articleTitle || 'Untitled Slide',
            content: activeProject.articleContent || '',
            photoUrl: activeProject.articlePhotoUrl || '',
            author: activeProject.articleLastUpdatedBy || 'Student',
            editableByOthers: true
          }
        ];
        window.db.updateProject(activeProject.id, { slides: activeProject.slides });
      }

      // Bounds check activeSlideIndex
      if (this.activeSlideIndex >= activeProject.slides.length) {
        this.activeSlideIndex = activeProject.slides.length - 1;
      }
      if (this.activeSlideIndex < 0) {
        this.activeSlideIndex = 0;
      }

      const activeSlide = activeProject.slides[this.activeSlideIndex];
      const isReadOnly = activeProject.status === 'Published' || activeProject.status === 'PendingPublish' || activeProject.paused;

      // Toggle display modes (Editor vs Carousel Viewer)
      const deckEditor = document.getElementById('proj-deck-editor');
      const deckViewer = document.getElementById('proj-deck-viewer');

      if (isReadOnly) {
        // Show Presentation Carousel Viewer
        if (deckEditor) deckEditor.style.display = 'none';
        if (deckViewer) deckViewer.style.display = 'flex';

        // Render current slide view
        const viewerCard = document.getElementById('proj-viewer-card');
        if (viewerCard && activeSlide) {
          const authorName = activeSlide.author || 'Student';
          const authorStudent = window.db.getStudents().find(st => st.name.trim().toLowerCase() === authorName.trim().toLowerCase());
          let country = authorStudent ? window.db.getSchool(authorStudent.schoolId)?.country : undefined;
          if (!country) {
            const lowerAuthor = authorName.toLowerCase();
            if (
              lowerAuthor.includes('harriet') || 
              lowerAuthor.includes('emily') || 
              lowerAuthor.includes('jessica') || 
              lowerAuthor.includes('chloe') || 
              lowerAuthor.includes('tabitha') || 
              lowerAuthor.includes('sophia')
            ) country = 'United Kingdom';
            else if (
              lowerAuthor.includes('lukas') || 
              lowerAuthor.includes('hanna') || 
              lowerAuthor.includes('jonas') || 
              lowerAuthor.includes('mia') || 
              lowerAuthor.includes('sophie') || 
              lowerAuthor.includes('leon')
            ) country = 'Germany';
          }
          const flagHtml = country ? this.getSchoolFlag(country) : '';

          if (activeSlide.layout === 'split') {
            viewerCard.innerHTML = `
              <div style="display: grid; grid-template-columns: 1fr 1fr; height: 100%; width: 100%;">
                <div style="background: rgba(0,0,0,0.1); border-right: 1px solid var(--panel-border); height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                  ${activeSlide.photoUrl ? `<img src="${activeSlide.photoUrl}" style="width: 100%; height: 100%; object-fit: cover;">` : `<span style="font-size: 0.85rem; color: var(--text-muted);">${this.translate('no_image_uploaded', 'No image uploaded')}</span>`}
                </div>
                <div style="padding: 1.5rem; display: flex; flex-direction: column; overflow-y: auto; justify-content: center;">
                  <h4 class="viewer-card-title" style="font-size: 1.15rem;">${activeSlide.title || 'Untitled Slide'}</h4>
                  <p style="font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary); margin: 0; white-space: pre-wrap;">${activeSlide.content || 'No content written yet.'}</p>
                  ${activeSlide.author ? `<span style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 1rem; font-style: italic; display: flex; align-items: center; gap: 0.25rem;">${this.translate('by_author', 'By')} ${flagHtml} ${activeSlide.author}</span>` : ''}
                </div>
              </div>
            `;
          } else {
            viewerCard.innerHTML = `
              <div style="padding: 2rem 2.5rem; display: flex; flex-direction: column; overflow-y: auto; justify-content: center; height: 100%; width: 100%;">
                <h4 class="viewer-card-title" style="font-size: 1.45rem; text-align: center; margin-bottom: 1rem;">${activeSlide.title || 'Untitled Slide'}</h4>
                <p style="font-size: 1.05rem; line-height: 1.7; color: var(--text-secondary); margin: 0; white-space: pre-wrap; text-align: center; max-width: 480px; margin-left: auto; margin-right: auto;">${activeSlide.content || 'No content written yet.'}</p>
                ${activeSlide.author ? `<span style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 1.5rem; font-style: italic; text-align: center; display: flex; align-items: center; justify-content: center; gap: 0.25rem;">By ${flagHtml} ${activeSlide.author}</span>` : ''}
              </div>
            `;
          }
        }

        // Update progress bar
        const progressEl = document.getElementById('proj-viewer-progress');
        if (progressEl) {
          progressEl.textContent = this.translate('card_progress_label', 'Card {current} of {total}').replace('{current}', this.activeSlideIndex + 1).replace('{total}', activeProject.slides.length);
        }

      } else {
        // Show Slides Editor
        if (deckEditor) deckEditor.style.display = 'flex';
        if (deckViewer) deckViewer.style.display = 'none';

        // Render Slides Horizontal Selection carousel bar
        const carouselBar = document.getElementById('proj-slides-carousel-bar');
        if (carouselBar) {
          carouselBar.innerHTML = '';
          activeProject.slides.forEach((slide, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `slide-thumb ${this.activeSlideIndex === idx ? 'active' : ''}`;
            btn.innerHTML = `
              <span>Slide ${idx + 1}</span>
              <span style="font-size: 0.75rem; opacity: 0.8; font-weight: 500;">(${slide.layout === 'split' ? '📷' : '📝'})</span>
            `;
            btn.addEventListener('click', () => {
              this.switchProjectSlide(idx);
            });
            carouselBar.appendChild(btn);
          });

          // Add slide card button
          const addBtn = document.createElement('button');
          addBtn.type = 'button';
          addBtn.className = 'slide-thumb slide-thumb-add';
          addBtn.style.display = 'inline-flex';
          addBtn.style.alignItems = 'center';
          addBtn.style.gap = '0.25rem';
          addBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>${this.translate('add_card_btn', 'Add Card')}</span>
          `;
          addBtn.addEventListener('click', () => {
            this.addProjectSlide();
          });
          carouselBar.appendChild(addBtn);
        }

        // Populate slide editor inputs
        const titleInput = document.getElementById('proj-art-title');
        const contentInput = document.getElementById('proj-art-content');
        const photoInput = document.getElementById('proj-art-photo-input');
        const saveBtn = document.getElementById('proj-art-save-btn');
        const publishBtn = document.getElementById('proj-art-publish-btn');
        const deleteBtn = document.getElementById('proj-slide-delete-btn');

        if (titleInput && contentInput && activeSlide) {
          titleInput.value = activeSlide.title || '';
          contentInput.value = activeSlide.content || '';

          // Display Author Display text and Editable Toggle
          const authorDisplay = document.getElementById('proj-slide-author-display');
          const editableLabel = document.getElementById('proj-slide-editable-label');
          const editableToggle = document.getElementById('proj-slide-editable-toggle');
          if (authorDisplay) {
            const authorName = activeSlide.author || 'Student';
            const authorStudent = window.db.getStudents().find(st => st.name.trim().toLowerCase() === authorName.trim().toLowerCase());
            let country = authorStudent ? window.db.getSchool(authorStudent.schoolId)?.country : undefined;
            if (!country) {
              const lowerAuthor = authorName.toLowerCase();
              if (
                lowerAuthor.includes('harriet') || 
                lowerAuthor.includes('emily') || 
                lowerAuthor.includes('jessica') || 
                lowerAuthor.includes('chloe') || 
                lowerAuthor.includes('tabitha') || 
                lowerAuthor.includes('sophia')
              ) country = 'United Kingdom';
              else if (
                lowerAuthor.includes('lukas') || 
                lowerAuthor.includes('hanna') || 
                lowerAuthor.includes('jonas') || 
                lowerAuthor.includes('mia') || 
                lowerAuthor.includes('sophie') || 
                lowerAuthor.includes('leon')
              ) country = 'Germany';
            }
            const flagHtml = country ? this.getSchoolFlag(country) : '';
            authorDisplay.innerHTML = `<span style="display: flex; align-items: center; gap: 0.25rem;">Author: ${flagHtml} <strong>${authorName}</strong></span>`;
          }

          const isAuthor = activeSlide.author === student.name;
          const isEditable = isAuthor || activeSlide.editableByOthers !== false;

          if (editableLabel && editableToggle) {
            if (isAuthor && activeProject.status !== 'Published' && activeProject.status !== 'PendingPublish') {
              editableLabel.style.display = 'flex';
              editableToggle.checked = activeSlide.editableByOthers !== false;
              editableToggle.disabled = false;
            } else {
              editableLabel.style.display = 'none';
              editableToggle.disabled = true;
            }
          }

          titleInput.readOnly = !isEditable;
          contentInput.readOnly = !isEditable;

          if (photoInput) photoInput.disabled = !isEditable;
          if (saveBtn) {
            saveBtn.disabled = !isEditable;
            saveBtn.style.opacity = isEditable ? '1' : '0.4';
          }
          if (publishBtn) {
            publishBtn.disabled = !isEditable;
            publishBtn.style.opacity = isEditable ? '1' : '0.4';
          }

          // Toggle layout button active highlights
          const splitBtn = document.getElementById('layout-split-btn');
          const textBtn = document.getElementById('layout-text-btn');
          if (splitBtn) splitBtn.style.pointerEvents = isEditable ? 'auto' : 'none';
          if (textBtn) textBtn.style.pointerEvents = isEditable ? 'auto' : 'none';

          if (activeSlide.layout === 'split') {
            if (splitBtn) splitBtn.classList.add('active-layout');
            if (textBtn) textBtn.classList.remove('active-layout');
            document.getElementById('proj-slide-photo-group').style.display = 'block';
          } else {
            if (textBtn) textBtn.classList.add('active-layout');
            if (splitBtn) splitBtn.classList.remove('active-layout');
            document.getElementById('proj-slide-photo-group').style.display = 'none';
          }

          // Show/hide slide delete button
          if (deleteBtn) {
            deleteBtn.style.display = (activeProject.slides.length > 1 && isAuthor) ? 'block' : 'none';
          }
        }

        // Render photo preview
        const previewEl = document.getElementById('proj-article-photo-preview');
        const placeholderEl = document.getElementById('proj-article-photo-placeholder');
        const removeBtnEl = document.getElementById('proj-art-photo-remove-btn');
        if (previewEl && placeholderEl && activeSlide) {
          const isAuthor = activeSlide.author === student.name;
          const isEditable = isAuthor || activeSlide.editableByOthers !== false;
          this.currentProjArticlePhotoDataUrl = activeSlide.photoUrl || '';
          if (activeSlide.photoUrl) {
            previewEl.src = activeSlide.photoUrl;
            previewEl.style.display = 'block';
            placeholderEl.style.display = 'none';
            if (removeBtnEl) removeBtnEl.style.display = isEditable ? 'block' : 'none';
          } else {
            previewEl.src = '';
            previewEl.style.display = 'none';
            placeholderEl.style.display = 'block';
            if (removeBtnEl) removeBtnEl.style.display = 'none';
          }
        }
      }

      // Update Last Updated Text
      const lastUpdatedEl = document.getElementById('proj-article-last-updated');
      if (lastUpdatedEl) {
        if (activeProject.articleLastUpdatedAt) {
          const timeStr = new Date(activeProject.articleLastUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const dateStr = new Date(activeProject.articleLastUpdatedAt).toLocaleDateString();
          lastUpdatedEl.textContent = this.translate('last_updated_by_on_at', 'Last updated by {name} on {date} at {time}').replace('{name}', activeProject.articleLastUpdatedBy || 'system').replace('{date}', dateStr).replace('{time}', timeStr);
        } else {
          lastUpdatedEl.textContent = this.translate('last_updated_not_saved', 'Last updated: Not saved yet');
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
            const sender = window.db.getStudent(msg.senderId);
            const senderSchool = sender ? window.db.getSchool(sender.schoolId) : null;
            const flag = senderSchool ? this.getSchoolFlag(senderSchool.country) : '';
            const displayName = sender ? this.getStudentDisplayName(sender) : msg.senderName;
            senderHeader = `<div class="message-sender" style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.25rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.3rem; vertical-align: middle;"><span style="cursor: pointer; text-decoration: underline;" onclick="app.openStudentDetailModal('${msg.senderId}')">${flag} ${displayName}</span></div>`;
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

      // Render or remove suspended warning banner
      let banner = document.getElementById('project-suspended-banner');
      if (activeProject.paused) {
        if (!banner) {
          banner = document.createElement('div');
          banner.id = 'project-suspended-banner';
          banner.style.cssText = 'background: rgba(239, 68, 68, 0.15); border-bottom: 1px solid rgba(239, 68, 68, 0.3); color: var(--danger); padding: 0.75rem 1.25rem; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; justify-content: center;';
          banner.innerHTML = `<span>⚠️ ${this.translate('project_suspended_notice', 'This project has been suspended for safeguarding review. Slide editing and messaging are locked.')}</span>`;
          projectActiveState.insertBefore(banner, projectActiveState.firstChild);
        }
      } else {
        if (banner) {
          banner.remove();
        }
      }

      // Disable/enable chat composer
      const chatTextarea = document.getElementById('proj-chat-textarea');
      const chatSendBtn = document.getElementById('proj-chat-send-btn');
      if (chatTextarea && chatSendBtn) {
        if (activeProject.paused) {
          chatTextarea.disabled = true;
          chatTextarea.placeholder = this.translate('chat_locked_during_suspension', 'Chat is locked during suspension...');
          chatSendBtn.disabled = true;
          chatSendBtn.style.opacity = '0.4';
        } else {
          chatTextarea.disabled = false;
          chatTextarea.placeholder = this.translate('type_message_project_team', 'Type a message to your project team...');
          chatSendBtn.disabled = false;
          chatSendBtn.style.opacity = '1';
        }
      }
    }
  }

  // Preview draft before submitting for review
  previewSubmittedArticle() {
    const titleInput = document.getElementById('art-title');
    const contentInput = document.getElementById('art-content');
    const langSelect = document.getElementById('art-lang');
    const previewImg = document.getElementById('article-photo-preview');

    const title = titleInput ? titleInput.value.trim() : '';
    const content = contentInput ? contentInput.value.trim() : '';
    const lang = langSelect ? langSelect.value.toUpperCase() : 'EN';
    
    if (!title || !content) {
      alert(this.translate('title_content_preview_warning', 'Please enter a title and content before previewing.'));
      return;
    }

    const student = window.db.getStudent(this.currentStudentId);
    const school = student ? window.db.getSchool(student.schoolId) : null;
    const authorName = student ? student.name : 'Unknown Author';
    const schoolName = school ? school.name : 'Unknown School';

    const container = document.getElementById('article-detail-content');
    if (!container) return;

    const photoHtml = (previewImg && previewImg.style.display !== 'none' && previewImg.src)
      ? `<img src="${previewImg.src}" alt="${title} photo" style="width: 100%; height: 200px; object-fit: cover; border-radius: 12px; margin-bottom: 0.5rem;">`
      : '';

    container.innerHTML = `
      ${photoHtml}
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
        <div>
          <h4 style="font-weight: 700; font-size: 1.25rem; margin: 0; color: var(--text-primary);">${title}</h4>
          <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 500;">
            By ${authorName} • ${schoolName} (${lang})
          </span>
        </div>
        <div><span class="badge badge-warning">${this.translate('draft_preview_title', 'Draft Preview')}</span></div>
      </div>

      <div class="panel" style="padding: 1rem; background: rgba(255,255,255,0.01); border-color: var(--panel-border); margin-top: 0.5rem;">
        <p style="font-size: 0.9rem; line-height: 1.6; color: var(--text-secondary); margin: 0; text-align: justify; white-space: pre-wrap;">
          ${content}
        </p>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; border-top: 1px solid var(--panel-border); padding-top: 1rem;">
        <span style="font-size: 0.75rem; color: var(--text-muted);">${this.translate('preview_mode_label', 'Preview Mode')}</span>
        <button class="btn btn-secondary" onclick="app.closeModal('article-detail-modal')">${this.translate('close_preview_btn', 'Close Preview')}</button>
      </div>
    `;

    this.openModal('article-detail-modal');
  }

  // Open and initialize project deck preview modal
  previewProjectDeck() {
    if (!this.activeProjectId) return;

    // Save current slide state silently before previewing
    this.saveProjectSlideStateSilent();

    const project = window.db.getProject(this.activeProjectId);
    if (!project || !project.slides || project.slides.length === 0) return;

    this.previewSlideIndex = 0;
    this.renderPreviewProjectSlide();
    this.openModal('project-deck-preview-modal');
  }

  // Render a specific preview slide in the modal
  renderPreviewProjectSlide() {
    if (!this.activeProjectId) return;
    const project = window.db.getProject(this.activeProjectId);
    if (!project || !project.slides) return;

    const slides = project.slides;
    if (this.previewSlideIndex >= slides.length) this.previewSlideIndex = slides.length - 1;
    if (this.previewSlideIndex < 0) this.previewSlideIndex = 0;

    const slide = slides[this.previewSlideIndex];
    const viewerCard = document.getElementById('proj-preview-viewer-card');
    const progressEl = document.getElementById('proj-preview-viewer-progress');

    if (viewerCard && slide) {
      const authorName = slide.author || 'Student';
      const authorStudent = window.db.getStudents().find(st => st.name.trim().toLowerCase() === authorName.trim().toLowerCase());
      let country = authorStudent ? window.db.getSchool(authorStudent.schoolId)?.country : undefined;
      
      if (!country) {
        const lowerAuthor = authorName.toLowerCase();
        if (lowerAuthor.includes('harriet') || lowerAuthor.includes('emily') || lowerAuthor.includes('jessica')) country = 'United Kingdom';
        else if (lowerAuthor.includes('lukas') || lowerAuthor.includes('hanna') || lowerAuthor.includes('jonas')) country = 'Germany';
      }
      
      const flagHtml = country ? this.getSchoolFlag(country) : '';

      if (slide.layout === 'split') {
        viewerCard.innerHTML = `
          <div style="display: grid; grid-template-columns: 1fr 1fr; height: 100%; width: 100%;">
            <div style="background: rgba(0,0,0,0.1); border-right: 1px solid var(--panel-border); height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden;">
              ${slide.photoUrl ? `<img src="${slide.photoUrl}" style="width: 100%; height: 100%; object-fit: cover;">` : `<span style="font-size: 0.85rem; color: var(--text-muted);">${this.translate('no_image_uploaded', 'No image uploaded')}</span>`}
            </div>
            <div style="padding: 1.5rem; display: flex; flex-direction: column; overflow-y: auto; justify-content: center;">
              <h4 class="viewer-card-title" style="font-size: 1.15rem;">${slide.title || this.translate('untitled_slide_label', 'Untitled Slide')}</h4>
              <p style="font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary); margin: 0; white-space: pre-wrap;">${slide.content || this.translate('no_content_written_yet', 'No content written yet.')}</p>
              <span style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 1rem; font-style: italic; display: flex; align-items: center; gap: 0.25rem;">${this.translate('by_author', 'By')} ${flagHtml} ${authorName}</span>
            </div>
          </div>
        `;
      } else {
        viewerCard.innerHTML = `
          <div style="padding: 2rem 2.5rem; display: flex; flex-direction: column; overflow-y: auto; justify-content: center; height: 100%; width: 100%;">
            <h4 class="viewer-card-title" style="font-size: 1.45rem; text-align: center; margin-bottom: 1rem;">${slide.title || this.translate('untitled_slide_label', 'Untitled Slide')}</h4>
            <p style="font-size: 1.05rem; line-height: 1.7; color: var(--text-secondary); margin: 0; white-space: pre-wrap; text-align: center; max-width: 480px; margin-left: auto; margin-right: auto;">${slide.content || this.translate('no_content_written_yet', 'No content written yet.')}</p>
            <span style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 1.5rem; font-style: italic; text-align: center; display: flex; align-items: center; justify-content: center; gap: 0.25rem;">${this.translate('by_author', 'By')} ${flagHtml} ${authorName}</span>
          </div>
        `;
      }
    }

    if (progressEl) {
      progressEl.textContent = this.translate('card_progress_label', 'Card {current} of {total}').replace('{current}', this.previewSlideIndex + 1).replace('{total}', slides.length);
    }
  }

  // Previous slide in preview
  prevPreviewProjectSlide() {
    if (this.previewSlideIndex > 0) {
      this.previewSlideIndex--;
      this.renderPreviewProjectSlide();
    }
  }

  // Next slide in preview
  nextPreviewProjectSlide() {
    if (!this.activeProjectId) return;
    const project = window.db.getProject(this.activeProjectId);
    if (project && project.slides && this.previewSlideIndex < project.slides.length - 1) {
      this.previewSlideIndex++;
      this.renderPreviewProjectSlide();
    }
  }

  saveProjectSlideStateSilent(layoutOverride = null) {
    if (!this.activeProjectId) return;
    const project = window.db.getProject(this.activeProjectId);
    if (!project || project.status === 'Published' || project.status === 'PendingPublish') return;

    const titleInput = document.getElementById('proj-art-title');
    const contentInput = document.getElementById('proj-art-content');
    if (!titleInput || !contentInput) return;

    const activeSlide = project.slides[this.activeSlideIndex];
    if (activeSlide) {
      const student = window.db.getStudent(this.currentStudentId);
      const isAuthor = !activeSlide.author || activeSlide.author === (student ? student.name : '');
      const isEditable = isAuthor || activeSlide.editableByOthers !== false;
      if (!isEditable) return;

      activeSlide.title = titleInput.value.trim();
      activeSlide.content = contentInput.value.trim();
      activeSlide.photoUrl = this.currentProjArticlePhotoDataUrl || '';
      if (layoutOverride) {
        activeSlide.layout = layoutOverride;
      }
      
      if (!activeSlide.author) {
        activeSlide.author = student ? student.name : 'Student';
      }
      
      if (isAuthor) {
        const editableToggle = document.getElementById('proj-slide-editable-toggle');
        if (editableToggle) {
          activeSlide.editableByOthers = editableToggle.checked;
        }
      }

      project.articleLastUpdatedBy = student ? student.name : 'Student';
      project.articleLastUpdatedAt = new Date().toISOString();
      window.db.updateProject(this.activeProjectId, { 
        slides: project.slides,
        articleLastUpdatedBy: project.articleLastUpdatedBy,
        articleLastUpdatedAt: project.articleLastUpdatedAt
      });
    }
  }

  switchProjectSlide(index) {
    this.saveProjectSlideStateSilent();
    this.activeSlideIndex = index;
    const project = window.db.getProject(this.activeProjectId);
    if (project && project.slides[index]) {
      this.currentProjArticlePhotoDataUrl = project.slides[index].photoUrl || '';
    } else {
      this.currentProjArticlePhotoDataUrl = '';
    }
    const fileInput = document.getElementById('proj-art-photo-input');
    if (fileInput) fileInput.value = '';
    this.renderStudentProjects();
    this.switchProjectSubtab('article');
  }

  addProjectSlide() {
    if (!this.activeProjectId) return;
    const project = window.db.getProject(this.activeProjectId);
    if (!project) return;

    this.saveProjectSlideStateSilent();

    const student = window.db.getStudent(this.currentStudentId);
    const newSlide = {
      id: 'slide_' + Date.now(),
      layout: 'split',
      title: '',
      content: '',
      photoUrl: '',
      author: student ? student.name : 'Student',
      editableByOthers: true
    };
    project.slides.push(newSlide);
    window.db.updateProject(this.activeProjectId, { slides: project.slides });

    this.activeSlideIndex = project.slides.length - 1;
    this.currentProjArticlePhotoDataUrl = '';
    const fileInput = document.getElementById('proj-art-photo-input');
    if (fileInput) fileInput.value = '';
    this.renderStudentProjects();
  }

  deleteProjectSlide() {
    if (!this.activeProjectId) return;
    const project = window.db.getProject(this.activeProjectId);
    if (!project || project.slides.length <= 1) return;

    if (!confirm(this.translate('delete_slide_confirm_prompt', 'Are you sure you want to delete this slide? This action cannot be undone.'))) {
      return;
    }

    project.slides.splice(this.activeSlideIndex, 1);
    window.db.updateProject(this.activeProjectId, { slides: project.slides });

    if (this.activeSlideIndex >= project.slides.length) {
      this.activeSlideIndex = project.slides.length - 1;
    }
    const activeSlide = project.slides[this.activeSlideIndex];
    this.currentProjArticlePhotoDataUrl = activeSlide ? activeSlide.photoUrl || '' : '';
    const fileInput = document.getElementById('proj-art-photo-input');
    if (fileInput) fileInput.value = '';
    this.renderStudentProjects();
  }

  setProjectSlideLayout(layoutType) {
    if (!this.activeProjectId) return;
    const project = window.db.getProject(this.activeProjectId);
    if (!project) return;

    const activeSlide = project.slides[this.activeSlideIndex];
    if (activeSlide) {
      this.saveProjectSlideStateSilent(layoutType);
      this.renderStudentProjects();
    }
  }

  prevProjectSlide() {
    if (!this.activeProjectId) return;
    const project = window.db.getProject(this.activeProjectId);
    if (!project) return;

    if (this.activeSlideIndex > 0) {
      this.activeSlideIndex--;
      this.renderStudentProjects();
    }
  }

  nextProjectSlide() {
    if (!this.activeProjectId) return;
    const project = window.db.getProject(this.activeProjectId);
    if (!project) return;

    if (this.activeSlideIndex < project.slides.length - 1) {
      this.activeSlideIndex++;
      this.renderStudentProjects();
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

    const activeSlide = project.slides[this.activeSlideIndex];
    if (activeSlide) {
      activeSlide.title = titleInput.value.trim();
      activeSlide.content = contentInput.value.trim();
      activeSlide.photoUrl = this.currentProjArticlePhotoDataUrl || '';
      activeSlide.author = student ? student.name : 'Student';
    }

    const updates = {
      slides: project.slides,
      articleLastUpdatedBy: student ? student.name : 'Student',
      articleLastUpdatedAt: new Date().toISOString()
    };

    window.db.updateProject(this.activeProjectId, updates);
    alert(this.translate('draft_saved_success', 'Draft saved successfully!'));
    this.renderStudentProjects();
  }

  publishProject() {
    if (!this.activeProjectId) return;
    const project = window.db.getProject(this.activeProjectId);
    if (!project) return;

    this.saveProjectSlideStateSilent();

    const incomplete = project.slides.some(s => !s.title.trim() || !s.content.trim());
    if (incomplete) {
      alert(this.translate('fill_slides_before_publishing_warning', 'Please fill out the title and content for all slides before publishing.'));
      return;
    }

    if (!confirm(this.translate('publish_project_confirm_prompt', 'Are you sure you want to publish this project? This will submit the Story Deck to both coordinators for review.'))) {
      return;
    }

    const student = window.db.getStudent(this.currentStudentId);
    const updates = {
      status: 'PendingPublish',
      creatorSchoolApproved: false,
      targetSchoolApproved: false,
      articleLastUpdatedBy: student ? student.name : 'Student',
      articleLastUpdatedAt: new Date().toISOString()
    };

    window.db.updateProject(this.activeProjectId, updates);

    // Add a system log message in the group chat
    window.db.addProjectMessage(
      this.activeProjectId,
      'system',
      'System',
      `${student ? student.name : 'A student'} submitted the project Story Deck for coordinator authorization.`
    );

    alert(this.translate('project_submitted_auth_success', 'Project submitted for authorization! Coordinators from both schools must approve before publication.'));
    this.activeSlideIndex = 0;
    this.renderStudentProjects();
  }

  sendProjectChatMessage() {
    if (!this.activeProjectId) return;
    const project = window.db.getProject(this.activeProjectId);
    if (project?.paused) {
      alert(this.translate('project_suspended_safeguarding_warning', 'This project is suspended for safeguarding review.'));
      return;
    }
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

    // 1. Populate partner schools checklist in Launch Project Form
    const partnerSchoolsList = document.getElementById('launch-proj-schools-list');
    if (partnerSchoolsList) {
      partnerSchoolsList.innerHTML = '';
      const schools = window.db.getSchools().filter(s => s.id !== schoolId);
      if (schools.length === 0) {
        partnerSchoolsList.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted); padding: 0.5rem; display: block;">No partner schools connected.</span>`;
      } else {
        schools.forEach(s => {
          const flag = this.getSchoolFlag(s.country);
          const div = document.createElement('div');
          div.style.display = 'flex';
          div.style.alignItems = 'center';
          div.style.gap = '0.5rem';
          div.style.padding = '0.2rem 0';
          div.innerHTML = `
            <input type="checkbox" name="launch-school" value="${s.id}" id="chk-launch-school-${s.id}" style="cursor: pointer;">
            <label for="chk-launch-school-${s.id}" style="font-size: 0.8rem; cursor: pointer; color: var(--text-primary); margin: 0;">
              ${flag} ${s.name} (${s.city}, ${s.country})
            </label>
          `;
          partnerSchoolsList.appendChild(div);
        });
      }
    }

    // 2. Populate student checkbox list in Launch Project Form
    const launchStudentsList = document.getElementById('launch-proj-students-list');
    if (launchStudentsList) {
      launchStudentsList.innerHTML = '';
      const localStudents = window.db.getStudents().filter(s => s.schoolId === schoolId);
      if (localStudents.length === 0) {
        launchStudentsList.innerHTML = `<span style="font-size: 0.8rem; color: var(--text-muted); padding: 0.5rem; display: block;">${this.translate('no_students_registered_for_school', 'No students registered for your school.')}</span>`;
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
              ${s.name} (${s.age} ${this.translate('years_old_suffix', 'y/o')})
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
      const proposals = window.db.getProjects().filter(p => p.status === 'Proposed' && (p.targetSchoolId === schoolId || (p.targetSchoolIds && p.targetSchoolIds.includes(schoolId))));
      
      if (proposals.length === 0) {
        proposalsTbody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
              ${this.translate('no_pending_project_proposals', 'No pending project proposals from partner schools.')}
            </td>
          </tr>
        `;
      } else {
        proposals.forEach(p => {
          const creatorSchool = window.db.getSchool(p.creatorSchoolId);
          let participantsText = '';
          if (p.isStaffProject) {
            const creatorCoords = window.db.getCoordinators().filter(c => c.schoolId === p.creatorSchoolId);
            participantsText = `${this.translate('creator_staff_label', 'Staff')}: ${creatorCoords.map(c => c.name).join(', ')}`;
          } else {
            const creatorStudents = p.creatorSchoolStudentIds.map(sid => window.db.getStudent(sid)?.name || 'Unknown').join(', ');
            participantsText = `${this.translate('students_label', 'Students')}: ${creatorStudents}`;
          }
          
          let checkboxesHTML = '';
          if (p.isStaffProject) {
            checkboxesHTML = `<div style="font-size: 1rem; font-weight: 600; color: var(--secondary);">${this.translate('staff_collaboration_status', 'Staff Collaboration')}</div>`;
          } else {
            const localStudents = window.db.getStudents().filter(s => s.schoolId === schoolId);
            if (localStudents.length === 0) {
              checkboxesHTML = `<span style="font-size: 0.95rem; color: var(--text-muted);">${this.translate('no_local_students_available', 'No local students available')}</span>`;
            } else {
              localStudents.forEach(s => {
                checkboxesHTML += `
                  <div style="display: flex; align-items: center; gap: 0.35rem; padding: 0.15rem 0;">
                    <input type="checkbox" class="chk-accept-${p.id}" value="${s.id}" id="chk-acc-${p.id}-${s.id}" style="cursor: pointer;">
                    <label for="chk-acc-${p.id}-${s.id}" style="font-size: 1rem; cursor: pointer; color: var(--text-primary); margin: 0;">
                      ${s.name}
                    </label>
                  </div>
                `;
              });
            }
          }

          const tr = document.createElement('tr');
          tr.style.borderBottom = '1px solid var(--panel-border)';
          tr.innerHTML = `
            <td style="padding: 0.75rem; vertical-align: top; font-size: 1rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                ${p.isStaffProject ? `
                  <span class="badge" style="font-size: 0.65rem; padding: 0.15rem 0.35rem; font-weight: 700; color: var(--accent-light, #a78bfa); background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.25); border-radius: 4px;">🟣 Staff Collaboration</span>
                ` : `
                  <span class="badge" style="font-size: 0.65rem; padding: 0.15rem 0.35rem; font-weight: 700; color: #60a5fa; background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.25); border-radius: 4px;">👥 Student Exchange</span>
                `}
              </div>
              <div style="font-weight: 700; color: var(--text-primary); font-size: 1.05rem;">${p.title}</div>
              <div style="font-size: 1rem; color: var(--text-muted); margin-top: 0.2rem; line-height: 1.4; max-width: 250px;">
                ${p.brief}
              </div>
            </td>
            <td style="padding: 0.75rem; vertical-align: top; font-size: 1rem;">
              <div style="font-weight: 600; color: var(--secondary); font-size: 1rem;">${creatorSchool?.name || 'Partner School'}</div>
              <div style="font-size: 1rem; color: var(--text-secondary); margin-top: 0.15rem;">
                ${participantsText}
              </div>
            </td>
            <td style="padding: 0.75rem; vertical-align: top; font-size: 1rem;">
              <div style="max-height: 120px; overflow-y: auto; border: 1px solid var(--panel-border); border-radius: 8px; padding: 0.4rem; background: rgba(0,0,0,0.15); width: 180px;">
                ${checkboxesHTML}
              </div>
            </td>
            <td style="padding: 0.75rem; vertical-align: middle; font-size: 1rem;">
              <button class="btn btn-primary btn-small" onclick="app.acceptProject('${p.id}')" style="padding: 0.4rem 0.85rem; font-weight: 600; font-size: 0.75rem;">
                ${this.translate('accept_proposal_btn', 'Accept Proposal')}
              </button>
            </td>
          `;
          proposalsTbody.appendChild(tr);
        });
      }
    }

    // 3.5. Populate Outgoing Project Proposals
    const sentTbody = document.getElementById('teach-sent-projects-tbody');
    if (sentTbody) {
      sentTbody.innerHTML = '';
      const sentProposals = window.db.getProjects().filter(p => p.status === 'Proposed' && p.creatorSchoolId === schoolId);
      
      if (sentProposals.length === 0) {
        sentTbody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
              ${this.translate('no_sent_project_proposals', 'No outgoing project proposals sent by your school.')}
            </td>
          </tr>
        `;
      } else {
        sentProposals.forEach(p => {
          const targetSchool = window.db.getSchool(p.targetSchoolId);
          let participantsText = '';
          if (p.isStaffProject) {
            const creatorCoords = window.db.getCoordinators().filter(c => c.schoolId === p.creatorSchoolId);
            participantsText = `${this.translate('creator_staff_label', 'Staff')}: ${creatorCoords.map(c => c.name).join(', ')}`;
          } else {
            const creatorStudents = p.creatorSchoolStudentIds.map(sid => window.db.getStudent(sid)?.name || 'Unknown').join(', ');
            participantsText = `${this.translate('students_label', 'Students')}: ${creatorStudents}`;
          }

          const tr = document.createElement('tr');
          tr.style.borderBottom = '1px solid var(--panel-border)';
          tr.innerHTML = `
            <td style="padding: 0.75rem; vertical-align: top; font-size: 1rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                ${p.isStaffProject ? `
                  <span class="badge" style="font-size: 0.65rem; padding: 0.15rem 0.35rem; font-weight: 700; color: var(--accent-light, #a78bfa); background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.25); border-radius: 4px;">🟣 Staff Collaboration</span>
                ` : `
                  <span class="badge" style="font-size: 0.65rem; padding: 0.15rem 0.35rem; font-weight: 700; color: #60a5fa; background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.25); border-radius: 4px;">👥 Student Exchange</span>
                `}
              </div>
              <div style="font-weight: 700; color: var(--text-primary); font-size: 1.05rem;">${p.title}</div>
              <div style="font-size: 1rem; color: var(--text-muted); margin-top: 0.2rem; line-height: 1.4; max-width: 250px;">
                ${p.brief}
              </div>
            </td>
            <td style="padding: 0.75rem; vertical-align: top; font-size: 1rem;">
              <div style="font-weight: 600; color: var(--secondary); font-size: 1rem;">${targetSchool?.name || 'Partner School'}</div>
            </td>
            <td style="padding: 0.75rem; vertical-align: top; font-size: 1rem;">
              <div style="font-size: 1rem; color: var(--text-secondary);">
                ${participantsText}
              </div>
            </td>
            <td style="padding: 0.75rem; vertical-align: middle; font-size: 1rem;">
              <span class="badge badge-warning" style="font-size: 0.8rem; padding: 0.25rem 0.5rem; font-weight: 700; color: #fbbf24; background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.25);">⏳ Awaiting Approval</span>
            </td>
          `;
          sentTbody.appendChild(tr);
        });
      }
    }

    // 4. Update Projects Subtabs UI and Render Lists
    const subtabGallery = document.getElementById('subtab-btn-gallery');
    const subtabProposals = document.getElementById('subtab-btn-proposals');
    const subtabLaunch = document.getElementById('subtab-btn-launch');
    const subtabCancelled = document.getElementById('subtab-btn-cancelled');

    const galleryView = document.getElementById('teach-projects-gallery-subview');
    const proposalsView = document.getElementById('teach-projects-proposals-subview');
    const launchView = document.getElementById('teach-projects-launch-subview');
    const cancelledView = document.getElementById('teach-projects-cancelled-subview');

    // Default to 'gallery' if invalid
    if (!['gallery', 'proposals', 'launch', 'cancelled'].includes(this.projectsSubTab)) {
      this.projectsSubTab = 'gallery';
    }

    const subtabDefs = [
      { btn: subtabGallery, view: galleryView, name: 'gallery' },
      { btn: subtabProposals, view: proposalsView, name: 'proposals' },
      { btn: subtabLaunch, view: launchView, name: 'launch' },
      { btn: subtabCancelled, view: cancelledView, name: 'cancelled' }
    ];

    subtabDefs.forEach(t => {
      if (!t.btn) return;
      t.btn.removeAttribute('style'); // Remove hardcoded inline styling
      if (this.projectsSubTab === t.name) {
        t.btn.classList.add('active');
        if (t.view) t.view.style.display = 'flex';
      } else {
        t.btn.classList.remove('active');
        if (t.view) t.view.style.display = 'none';
      }
    });

    // Update pending proposals count badge on proposals subtab button
    const proposals = window.db.getProjects().filter(p => p.status === 'Proposed' && (p.targetSchoolId === schoolId || (p.targetSchoolIds && p.targetSchoolIds.includes(schoolId))));
    const badgeEl = document.getElementById('proposals-badge');
    if (badgeEl) {
      if (proposals.length > 0) {
        badgeEl.textContent = proposals.length;
        badgeEl.style.display = 'inline-flex';
      } else {
        badgeEl.style.display = 'none';
      }
    }

    // Render Active Gallery Grid
    const galleryGrid = document.getElementById('teach-projects-gallery-grid');
    if (galleryGrid) {
      galleryGrid.innerHTML = '';
      
      const schoolFilterSelect = document.getElementById('proj-filter-school');
      if (schoolFilterSelect && (!schoolFilterSelect.dataset.initialized || schoolFilterSelect.dataset.lastTeacherId !== teacher.id)) {
        const currentVal = schoolFilterSelect.value;
        const allProjs = window.db.getProjects().filter(p => (p.creatorSchoolId === schoolId || p.targetSchoolId === schoolId || (p.targetSchoolIds && p.targetSchoolIds.includes(schoolId))) && p.status !== 'Cancelled');
        const partnerSchoolIds = Array.from(new Set(allProjs.flatMap(p => {
          const targets = p.targetSchoolIds || (p.targetSchoolId ? [p.targetSchoolId] : []);
          return [p.creatorSchoolId, ...targets].filter(sid => sid !== schoolId);
        })));
        
        schoolFilterSelect.innerHTML = `<option value="all">All Schools</option>`;
        partnerSchoolIds.forEach(psId => {
          const sch = window.db.getSchool(psId);
          if (sch) {
            const flag = this.getSchoolFlagEmoji(sch.country);
            const opt = document.createElement('option');
            opt.value = psId;
            opt.textContent = `${flag} ${sch.name}`;
            schoolFilterSelect.appendChild(opt);
          }
        });
        schoolFilterSelect.value = currentVal || 'all';
        if (schoolFilterSelect.selectedIndex === -1) {
          schoolFilterSelect.value = 'all';
        }
        schoolFilterSelect.dataset.initialized = 'true';
        schoolFilterSelect.dataset.lastTeacherId = teacher.id;
      }

      const searchQuery = document.getElementById('proj-filter-search')?.value.trim().toLowerCase() || '';
      const filterType = document.getElementById('proj-filter-type')?.value || 'all';
      const filterSchool = document.getElementById('proj-filter-school')?.value || 'all';
      const filterStatus = document.getElementById('proj-filter-status')?.value || 'all';

      let activeProjects = window.db.getProjects()
        .filter(p => (p.creatorSchoolId === schoolId || p.targetSchoolId === schoolId || (p.targetSchoolIds && p.targetSchoolIds.includes(schoolId))) && p.status !== 'Cancelled');

      // Filter by search query (title, partner school, brief text)
      if (searchQuery) {
        activeProjects = activeProjects.filter(p => {
          const targets = p.targetSchoolIds || (p.targetSchoolId ? [p.targetSchoolId] : []);
          const allPartners = [p.creatorSchoolId, ...targets].filter(sid => sid !== schoolId);
          const partnerNames = allPartners.map(sid => window.db.getSchool(sid)?.name.toLowerCase() || '');
          return p.title.toLowerCase().includes(searchQuery) ||
                 partnerNames.some(name => name.includes(searchQuery)) ||
                 p.brief.toLowerCase().includes(searchQuery);
        });
      }

      // Filter by type
      if (filterType === 'student') {
        activeProjects = activeProjects.filter(p => !p.isStaffProject);
      } else if (filterType === 'staff') {
        activeProjects = activeProjects.filter(p => p.isStaffProject);
      }

      // Filter by partner school
      if (filterSchool !== 'all') {
        activeProjects = activeProjects.filter(p => {
          const targets = p.targetSchoolIds || (p.targetSchoolId ? [p.targetSchoolId] : []);
          return p.creatorSchoolId === filterSchool || targets.includes(filterSchool);
        });
      }

      // Filter by status
      if (filterStatus === 'active') {
        activeProjects = activeProjects.filter(p => p.status !== 'Proposed' && !p.paused);
      } else if (filterStatus === 'proposed') {
        activeProjects = activeProjects.filter(p => p.status === 'Proposed');
      } else if (filterStatus === 'paused') {
        activeProjects = activeProjects.filter(p => p.status !== 'Proposed' && p.paused);
      }

      // Sort by priority weight
      activeProjects.sort((a, b) => {
        const getWeight = (x) => {
          if (x.status === 'Proposed') {
            const targets = x.targetSchoolIds || (x.targetSchoolId ? [x.targetSchoolId] : []);
            return (x.targetSchoolId === schoolId || targets.includes(schoolId)) ? 0 : 3;
          }
          return x.paused ? 2 : 1;
        };
        return getWeight(a) - getWeight(b);
      });

      // Update Broadcast Targeting UI elements
      const countEl = document.getElementById('broadcast-selected-count');
      const labelTicked = document.getElementById('broadcast-selected-count-label');
      const labelAll = document.getElementById('broadcast-all-count-label');
      const btnSelectAll = document.getElementById('broadcast-select-all-btn');
      const btnSubmit = document.getElementById('broadcast-submit-btn');
      
      const radioSelected = document.getElementById('broadcast-target-selected');
      const radioAll = document.getElementById('broadcast-target-all');
      
      if (radioSelected && radioAll) {
        radioSelected.checked = (this.broadcastTarget === 'selected');
        radioAll.checked = (this.broadcastTarget === 'all');
      }

      if (labelTicked) labelTicked.textContent = this.selectedProjectBroadcastIds.length;
      if (labelAll) labelAll.textContent = activeProjects.length;

      if (countEl) {
        if (this.broadcastTarget === 'all') {
          countEl.textContent = this.translate('all_projects_targeted', 'All projects targeted');
        } else {
          countEl.textContent = `${this.selectedProjectBroadcastIds.length} ${this.translate('selected_suffix', 'selected')}`;
        }
      }

      if (btnSelectAll) {
        btnSelectAll.disabled = (this.broadcastTarget === 'all');
        btnSelectAll.style.opacity = (this.broadcastTarget === 'all') ? 0.5 : 1;
        btnSelectAll.style.cursor = (this.broadcastTarget === 'all') ? 'not-allowed' : 'pointer';
        
        btnSelectAll.textContent = (this.selectedProjectBroadcastIds.length === activeProjects.length && this.selectedProjectBroadcastIds.length > 0)
          ? this.translate('deselect_all_btn', 'Deselect All')
          : this.translate('select_all_btn', 'Select All');
      }

      if (btnSubmit) {
        const isMsgEmpty = !document.getElementById('broadcast-message-textarea')?.value.trim();
        const noSelection = (this.broadcastTarget === 'selected' && this.selectedProjectBroadcastIds.length === 0);
        btnSubmit.disabled = isMsgEmpty || noSelection;
        btnSubmit.style.opacity = (isMsgEmpty || noSelection) ? 0.5 : 1;
        btnSubmit.style.cursor = (isMsgEmpty || noSelection) ? 'not-allowed' : 'pointer';
        btnSubmit.textContent = (this.broadcastTarget === 'all') ? this.translate('send_broadcast_to_all_btn', 'Send Broadcast to All') : this.translate('send_broadcast_to_selected_btn', 'Send Broadcast to Selected');
      }

      if (activeProjects.length === 0) {
        galleryGrid.innerHTML = `
          <div style="grid-column: span 3; text-align: center; color: var(--text-muted); padding: 2rem; font-style: italic;">
            ${this.translate('no_active_shared_projects', 'No active shared projects found.')}
          </div>
        `;
      } else {
        activeProjects.forEach(p => {
          const isCreator = p.creatorSchoolId === schoolId;
          const isSelected = this.selectedProjectBroadcastIds.includes(p.id);

          // Get target schools array safely
          const targets = p.targetSchoolIds || (p.targetSchoolId ? [p.targetSchoolId] : []);
          let partnerSchoolIds = [];
          if (isCreator) {
            partnerSchoolIds = targets;
          } else {
            partnerSchoolIds = [p.creatorSchoolId, ...targets.filter(tid => tid !== schoolId)];
          }

          const partnerSchoolsList = partnerSchoolIds.map(tid => window.db.getSchool(tid)).filter(Boolean);
          const partnerSchoolsHTML = partnerSchoolsList.map(sch => {
            const flag = this.getSchoolFlag(sch.country);
            return `${flag} ${sch.name}`;
          }).join(', ');

          let localStudentNames = '';
          let partnerStudentNames = '';
          let myStaffNames = '';
          let partnerStaffNames = '';

          if (p.isStaffProject) {
            const creatorSchoolCoords = window.db.getCoordinators().filter(c => c.schoolId === p.creatorSchoolId);
            const targetSchoolCoords = window.db.getCoordinators().filter(c => targets.includes(c.schoolId));

            if (isCreator) {
              myStaffNames = creatorSchoolCoords.map(c => c.name).join(', ');
              partnerStaffNames = targetSchoolCoords.map(c => c.name).join(', ');
            } else {
              myStaffNames = window.db.getCoordinators().filter(c => c.schoolId === schoolId).map(c => c.name).join(', ');
              partnerStaffNames = [
                ...creatorSchoolCoords.map(c => c.name),
                ...window.db.getCoordinators().filter(c => targets.includes(c.schoolId) && c.schoolId !== schoolId).map(c => c.name)
              ].join(', ');
            }
          } else {
            // Local students (our school)
            localStudentNames = (isCreator ? p.creatorSchoolStudentIds : p.targetSchoolStudentIds.filter(sid => {
              const stud = window.db.getStudent(sid);
              return stud && stud.schoolId === schoolId;
            })).map(sid => window.db.getStudent(sid)?.name || 'Unknown').join(', ');

            // Partner students (all other participant schools)
            partnerStudentNames = (isCreator ? p.targetSchoolStudentIds : [
              ...p.creatorSchoolStudentIds,
              ...p.targetSchoolStudentIds.filter(sid => {
                const stud = window.db.getStudent(sid);
                return stud && stud.schoolId !== schoolId;
              })
            ]).map(sid => window.db.getStudent(sid)?.name || 'Unknown').join(', ');

            if (p.status === 'Proposed') {
              if (isCreator) {
                partnerStudentNames = this.translate('awaiting_partner_selection_status', 'Awaiting partner assignment');
              } else {
                localStudentNames = this.translate('awaiting_your_selection_status', 'Awaiting your assignment');
              }
            }
          }

          const card = document.createElement('div');
          card.className = 'panel';
          card.style.padding = '1.25rem';
          card.style.display = 'flex';
          card.style.flexDirection = 'column';
          card.style.gap = '0.75rem';
          card.style.position = 'relative';
          
          if (p.status === 'Proposed') {
            card.style.opacity = '0.65';
            card.style.border = '1px dashed var(--panel-border)';
            card.style.background = 'rgba(255,255,255,0.01)';
          } else {
            card.style.border = p.paused ? '1px solid rgba(245,158,11,0.3)' : '1px solid var(--panel-border)';
            card.style.background = p.paused ? 'rgba(245,158,11,0.02)' : 'var(--panel-bg)';
          }

          let participantsHTML = '';
          if (p.isStaffProject) {
            participantsHTML = `
              <div><strong>${this.translate('your_staff_label', 'Your Staff:')}</strong> ${myStaffNames || 'None'}</div>
              <div><strong>${this.translate('partner_staff_label', 'Partner Staff:')}</strong> ${partnerStaffNames || 'None'}</div>
            `;
          } else {
            participantsHTML = `
              <div><strong>${this.translate('your_students_label', 'Your Students:')}</strong> ${localStudentNames || 'None'}</div>
              <div><strong>${this.translate('partner_students_label', 'Partner Students:')}</strong> ${partnerStudentNames || 'None'}</div>
            `;
          }

          let statusBadgeHTML = '';
          if (p.status === 'Proposed') {
            if (isCreator) {
              statusBadgeHTML = `<span class="badge" style="font-size: 0.85rem; padding: 0.25rem 0.5rem; font-weight: 700; color: #9ca3af; background: rgba(156,163,175,0.1); border: 1px solid rgba(156,163,175,0.25);">⏳ ${this.translate('awaiting_approval_status', 'Awaiting Approval')}</span>`;
            } else {
              statusBadgeHTML = `<span class="badge badge-warning" style="font-size: 0.85rem; padding: 0.25rem 0.5rem; font-weight: 700; color: #fbbf24; background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.25);">📥 ${this.translate('action_required_status', 'Action Required')}</span>`;
            }
          } else if (p.paused) {
            statusBadgeHTML = `<span class="badge badge-warning" style="font-size: 0.85rem; padding: 0.25rem 0.5rem; font-weight: 700; color: #fbbf24; background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.25);">🔒 ${this.translate('suspended_status', 'Suspended')}</span>`;
          } else {
            statusBadgeHTML = `<span class="badge badge-success" style="font-size: 0.85rem; padding: 0.25rem 0.5rem; font-weight: 700; color: #34d399; background: rgba(52,211,153,0.12); border: 1px solid rgba(52,211,153,0.25);">✓ ${this.translate('active_status', 'Active')}</span>`;
          }

          let actionButtonsHTML = '';
          if (p.status === 'Proposed') {
            if (!isCreator) {
              actionButtonsHTML = `
                <button class="btn btn-primary" onclick="app.acceptProject('${p.id}')" style="grid-column: span 2; font-size: 0.95rem; justify-content: center; display: flex; padding: 0.5rem 1rem; font-weight: 700;">
                  📥 ${this.translate('accept_proposal_btn', 'Accept Proposal')}
                </button>
                <button class="btn btn-secondary" onclick="app.cancelProject('${p.id}')" style="grid-column: span 2; font-size: 0.95rem; color: var(--danger); border-color: rgba(239,68,68,0.2); padding: 0.4rem 0.75rem; justify-content: center; display: flex;">
                  🚫 ${this.translate('reject_proposal_btn', 'Reject Proposal')}
                </button>
              `;
            } else {
              actionButtonsHTML = `
                <button class="btn btn-secondary" onclick="app.cancelProject('${p.id}')" style="grid-column: span 2; font-size: 0.95rem; color: var(--danger); border-color: rgba(239,68,68,0.2); padding: 0.5rem 1rem; justify-content: center; display: flex;">
                  🚫 ${this.translate('withdraw_proposal_btn', 'Withdraw Proposal')}
                </button>
              `;
            }
          } else {
            actionButtonsHTML = `
              <button class="btn btn-secondary" onclick="app.toggleSuspendProject('${p.id}', ${!!p.paused})" style="font-size: 0.95rem; color: ${p.paused ? 'var(--text-primary)' : '#f59e0b'}; border-color: ${p.paused ? 'rgba(59,130,246,0.2)' : 'rgba(245,158,11,0.2)'}; padding: 0.4rem 0.75rem;">
                ${p.paused ? this.translate('unsuspend_btn', 'Unsuspend') : this.translate('suspend_btn', 'Suspend')}
              </button>
              <button class="btn btn-secondary" onclick="app.cancelProject('${p.id}')" style="font-size: 0.95rem; color: var(--danger); border-color: rgba(239,68,68,0.2); padding: 0.4rem 0.75rem;">
                🚫 ${this.translate('cancel_btn', 'Cancel')}
              </button>
              <button class="btn btn-primary" onclick="app.openProjectModerationChat('${p.id}')" style="grid-column: span 2; font-size: 0.95rem; justify-content: center; display: flex; padding: 0.5rem 1rem;">
                💬 ${p.isStaffProject ? this.translate('collaborate_edit_workspace_btn', 'Collaborate & Edit Workspace') : this.translate('moderate_chat_cards_btn', 'Moderate Chat & Cards')}
              </button>
            `;
          }

          card.innerHTML = `
            <!-- Broadcast Checkbox -->
            <div style="position: absolute; top: 1rem; right: 1rem; display: ${p.status === 'Proposed' ? 'none' : 'block'};">
              <input type="checkbox" id="chk-broadcast-${p.id}" style="width: 16px; height: 16px; cursor: ${this.broadcastTarget === 'all' ? 'not-allowed' : 'pointer'}; opacity: ${this.broadcastTarget === 'all' ? 0.6 : 1};" ${(this.broadcastTarget === 'all' || isSelected) ? 'checked' : ''} ${this.broadcastTarget === 'all' ? 'disabled' : ''} onclick="app.toggleProjectBroadcastSelect('${p.id}')">
            </div>

            <div style="padding-right: 1.5rem; display: flex; flex-direction: column; gap: 0.25rem; align-items: flex-start;">
              ${p.isStaffProject ? `
                <span class="badge" style="font-size: 0.72rem; padding: 0.15rem 0.45rem; font-weight: 700; color: var(--accent-light, #a78bfa); background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.25); border-radius: 4px;">🟣 Staff Collaboration</span>
              ` : `
                <span class="badge" style="font-size: 0.72rem; padding: 0.15rem 0.45rem; font-weight: 700; color: #60a5fa; background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.25); border-radius: 4px;">👥 Student Exchange</span>
              `}
              <h4 style="font-size: 1.15rem; font-weight: 800; margin: 0; color: var(--text-primary);">${p.title}</h4>
              <span style="font-size: 1rem; color: var(--text-muted);">${this.translate('partner_label', 'Partner')}: ${partnerSchoolsHTML || this.translate('unknown_school', 'Unknown School')}</span>
            </div>

            <p style="font-size: 1rem; color: var(--text-secondary); margin: 0; line-height: 1.45;">
              ${p.brief}
            </p>

            <div style="display: flex; flex-direction: column; gap: 0.5rem; border-top: 1px solid rgba(255,255,255,0.03); padding-top: 0.75rem; font-size: 1rem; color: var(--text-secondary);">
              ${participantsHTML}
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.03); padding-top: 0.75rem; margin-top: auto;">
              ${statusBadgeHTML}
              <span style="font-size: 0.95rem; color: var(--text-muted);">${this.translate('cards_count_label', 'Cards:')} ${p.slides ? p.slides.length : 0}</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 0.5rem;">
              ${actionButtonsHTML}
            </div>
          `;
          galleryGrid.appendChild(card);
        });
      }
    }

    // Render Cancelled List
    const cancelledList = document.getElementById('teach-projects-cancelled-list');
    if (cancelledList) {
      cancelledList.innerHTML = '';
      const cancelledProjects = window.db.getProjects()
        .filter(p => (p.creatorSchoolId === schoolId || p.targetSchoolId === schoolId) && p.status === 'Cancelled');

      if (cancelledProjects.length === 0) {
        cancelledList.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); padding: 2rem; font-style: italic; background: rgba(255,255,255,0.01); border: 1px dashed var(--panel-border); border-radius: 8px;">
            ${this.translate('no_cancelled_projects', 'No cancelled projects in desk.')}
          </div>
        `;
      } else {
        cancelledProjects.forEach(p => {
          const isCreator = p.creatorSchoolId === schoolId;
          const partnerSchoolId = isCreator ? p.targetSchoolId : p.creatorSchoolId;
          const partnerSchool = window.db.getSchool(partnerSchoolId);

          const item = document.createElement('div');
          item.className = 'panel';
          item.style.padding = '1rem';
          item.style.display = 'flex';
          item.style.justifyContent = 'space-between';
          item.style.alignItems = 'center';
          item.style.gap = '1rem';
          item.style.flexWrap = 'wrap';

          item.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 0.25rem; align-items: flex-start;">
              ${p.isStaffProject ? `
                <span class="badge" style="font-size: 0.65rem; padding: 0.15rem 0.35rem; font-weight: 700; color: var(--accent-light, #a78bfa); background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.25); border-radius: 4px;">🟣 Staff Collaboration</span>
              ` : `
                <span class="badge" style="font-size: 0.65rem; padding: 0.15rem 0.35rem; font-weight: 700; color: #60a5fa; background: rgba(59,130,246,0.12); border: 1px solid rgba(59,130,246,0.25); border-radius: 4px;">👥 Student Exchange</span>
              `}
              <h4 style="font-size: 1.15rem; font-weight: 800; margin: 0; color: var(--text-primary);">${p.title}</h4>
              <span style="font-size: 1rem; color: var(--text-muted);">${this.translate('partner_label', 'Partner')}: ${partnerSchool ? partnerSchool.name : this.translate('unknown_school', 'Unknown School')}</span>
              <p style="font-size: 1rem; color: var(--text-secondary); margin: 0.25rem 0 0 0; line-height: 1.45;">${p.brief}</p>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button class="btn btn-secondary" onclick="app.reinstateProject('${p.id}')" style="font-size: 0.95rem; padding: 0.4rem 0.75rem;">
                🔄 ${this.translate('reinstate_btn', 'Reinstate')}
              </button>
              <button class="btn btn-secondary" onclick="app.deleteProjectPermanently('${p.id}')" style="font-size: 0.95rem; color: var(--danger); border-color: rgba(239,68,68,0.25); padding: 0.4rem 0.75rem;">
                🗑️ ${this.translate('delete_permanently_btn', 'Delete Permanently')}
              </button>
            </div>
          `;
          cancelledList.appendChild(item);
        });
      }
    }
  }

  switchProjectsSubtab(tabName) {
    this.projectsSubTab = tabName;
    this.selectedProjectBroadcastIds = [];
    const schoolFilterSelect = document.getElementById('proj-filter-school');
    if (schoolFilterSelect) {
      schoolFilterSelect.removeAttribute('data-initialized');
    }
    this.renderTeacherProjects();
  }

  handleProjectFiltersChange() {
    this.renderTeacherProjects();
  }

  toggleProjectBroadcastSelect(projectId) {
    const idx = this.selectedProjectBroadcastIds.indexOf(projectId);
    if (idx === -1) {
      this.selectedProjectBroadcastIds.push(projectId);
    } else {
      this.selectedProjectBroadcastIds.splice(idx, 1);
    }
    
    // Update count display
    const countEl = document.getElementById('broadcast-selected-count');
    if (countEl) {
      countEl.textContent = `${this.selectedProjectBroadcastIds.length} ${this.translate('selected_suffix', 'selected')}`;
    }
  }

  toggleSelectAllBroadcast() {
    const teacher = this.getLoggedTeacher();
    if (!teacher) return;
    const schoolId = teacher.schoolId;

    const activeProjs = window.db.getProjects()
      .filter(p => (p.creatorSchoolId === schoolId || p.targetSchoolId === schoolId) && p.status !== 'Cancelled' && p.status !== 'Proposed');
    const activeIds = activeProjs.map(p => p.id);

    if (this.selectedProjectBroadcastIds.length === activeIds.length) {
      this.selectedProjectBroadcastIds = [];
    } else {
      this.selectedProjectBroadcastIds = activeIds;
    }
    this.renderTeacherProjects();
  }

  setBroadcastTarget(target) {
    this.broadcastTarget = target;
    this.renderTeacherProjects();
  }

  updateBroadcastSubmitButton() {
    const textEl = document.getElementById('broadcast-message-textarea');
    const btnSubmit = document.getElementById('broadcast-submit-btn');
    if (textEl && btnSubmit) {
      const text = textEl.value.trim();
      const isMsgEmpty = !text;
      const noSelection = (this.broadcastTarget === 'selected' && this.selectedProjectBroadcastIds.length === 0);
      btnSubmit.disabled = isMsgEmpty || noSelection;
      btnSubmit.style.opacity = (isMsgEmpty || noSelection) ? 0.5 : 1;
      btnSubmit.style.cursor = (isMsgEmpty || noSelection) ? 'not-allowed' : 'pointer';
    }
  }

  openBroadcastModal() {
    const modal = document.getElementById('bulk-broadcast-modal');
    if (!modal) return;

    // Clear message textarea
    const textEl = document.getElementById('broadcast-message-textarea');
    if (textEl) textEl.value = '';

    // Reset selection defaults
    const radioSelected = document.getElementById('broadcast-target-selected');
    if (radioSelected) radioSelected.checked = true;
    this.broadcastTarget = 'selected';

    this.updateBroadcastSubmitButton();
    modal.classList.add('active');
  }

  sendBulkBroadcast() {
    const textEl = document.getElementById('broadcast-message-textarea');
    if (!textEl) return;
    const text = textEl.value.trim();
    if (!text) {
      alert(this.translate('type_broadcast_warning', 'Please type a message to broadcast.'));
      return;
    }

    const teacher = this.getLoggedTeacher();
    if (!teacher) return;
    const schoolId = teacher.schoolId;

    const activeProjs = window.db.getProjects()
      .filter(p => (p.creatorSchoolId === schoolId || p.targetSchoolId === schoolId || (p.targetSchoolIds && p.targetSchoolIds.includes(schoolId))) && p.status !== 'Cancelled' && p.status !== 'Proposed');
    
    const targetProjectIds = this.broadcastTarget === 'all'
      ? activeProjs.map(p => p.id)
      : this.selectedProjectBroadcastIds;

    if (targetProjectIds.length === 0) {
      alert(this.translate('select_project_warning', 'Please select at least one project.'));
      return;
    }

    const teacherName = `${this.translate('teacher_label', 'Teacher')} ${teacher.name}`;

    targetProjectIds.forEach(pid => {
      window.db.addProjectMessage(pid, teacher.id, teacherName, text);
    });

    window.db.addLog(
      'Broadcast Message Sent',
      `Sent broadcast message to ${targetProjectIds.length} projects.`,
      teacherName
    );

    alert(this.translate('broadcast_sent_success', 'Broadcast message sent successfully to {count} projects.').replace('{count}', targetProjectIds.length));
    textEl.value = '';
    this.selectedProjectBroadcastIds = [];
    this.broadcastTarget = 'selected';
    this.closeModal('bulk-broadcast-modal');
    this.refreshUI();
  }

  toggleSuspendProject(projectId, currentPaused) {
    const teacher = this.getLoggedTeacher();
    const teacherName = teacher ? `${this.translate('teacher_label', 'Teacher')} ${teacher.name}` : 'Teacher';
    const project = window.db.getProject(projectId);
    if (!project) return;

    window.db.updateProject(projectId, { paused: !currentPaused });
    
    window.db.addLog(
      !currentPaused ? 'Project Suspended' : 'Project Unsuspended',
      `${teacherName} ${!currentPaused ? 'suspended' : 'unsuspended'} project "${project.title}".`,
      teacherName
    );

    this.refreshUI();
  }

  cancelProject(projectId) {
    const teacher = this.getLoggedTeacher();
    const teacherName = teacher ? `${this.translate('teacher_label', 'Teacher')} ${teacher.name}` : 'Teacher';
    const project = window.db.getProject(projectId);
    if (!project) return;

    window.db.updateProject(projectId, { status: 'Cancelled' });
    
    window.db.addLog(
      'Project Cancelled',
      `${teacherName} cancelled project "${project.title}". It is now hidden from students.`,
      teacherName
    );

    this.refreshUI();
  }

  reinstateProject(projectId) {
    const teacher = this.getLoggedTeacher();
    const teacherName = teacher ? `${this.translate('teacher_label', 'Teacher')} ${teacher.name}` : 'Teacher';
    const project = window.db.getProject(projectId);
    if (!project) return;

    window.db.updateProject(projectId, { status: 'Published', paused: false });
    
    window.db.addLog(
      'Project Reinstated',
      `${teacherName} reinstated project "${project.title}".`,
      teacherName
    );

    this.refreshUI();
  }

  deleteProjectPermanently(projectId) {
    const teacher = this.getLoggedTeacher();
    const teacherName = teacher ? `${this.translate('teacher_label', 'Teacher')} ${teacher.name}` : 'Teacher';
    const project = window.db.getProject(projectId);
    if (!project) return;

    if (confirm(this.translate('delete_project_confirm_prompt', 'Are you sure you want to permanently delete the project "{title}"? This will delete all project cards, slides, and group messages. This action cannot be undone.').replace('{title}', project.title))) {
      window.db.deleteProject(projectId);
      
      window.db.addLog(
        'Project Permanently Deleted',
        `${teacherName} permanently deleted project "${project.title}".`,
        teacherName
      );

      this.refreshUI();
    }
  }

  openProjectModerationChat(projectId) {
    const project = window.db.getProject(projectId);
    if (!project) return;

    this.activeModeratedProjectId = projectId;
    this.editingTeacherSlideId = null;

    const modal = document.getElementById('teacher-project-moderation-modal');
    const titleEl = document.getElementById('moderation-modal-title');
    const chatInput = document.getElementById('moderation-chat-input');
    const addSlideBtn = document.getElementById('teach-add-slide-btn');

    if (!modal) return;

    if (project.isStaffProject) {
      titleEl.textContent = `💬 Collaborative Workspace: ${project.title}`;
    } else {
      titleEl.textContent = `💬 Moderating Project: ${project.title}`;
    }

    if (addSlideBtn) {
      addSlideBtn.style.display = project.isStaffProject ? 'inline-block' : 'none';
    }

    if (chatInput) chatInput.value = '';

    // Render workspace
    this.renderTeacherWorkspace(project);

    // Show modal
    modal.classList.add('active');
  }

  renderTeacherWorkspace(project) {
    const slidesContainer = document.getElementById('moderation-slides-container');
    if (!slidesContainer) return;

    slidesContainer.innerHTML = '';
    if (project.slides && project.slides.length > 0) {
      project.slides.forEach((s, index) => {
        const div = document.createElement('div');
        div.style.padding = '0.65rem';
        div.style.background = 'rgba(255,255,255,0.02)';
        div.style.border = '1px solid var(--panel-border)';
        div.style.borderRadius = '8px';
        div.style.marginBottom = '0.5rem';

        if (project.isStaffProject) {
          if (this.editingTeacherSlideId === s.id) {
            div.innerHTML = `
              <div style="display: flex; flex-direction: column; gap: 0.35rem;">
                <div style="font-size: 0.7rem; color: var(--text-muted);">Editing Card ${index + 1}</div>
                <input type="text" id="edit-slide-title-${s.id}" class="form-control" style="font-size: 0.8rem; padding: 0.25rem 0.5rem;" value="${s.title.replace(/"/g, '&quot;')}" placeholder="Card Title">
                <textarea id="edit-slide-content-${s.id}" class="form-control" style="font-size: 0.75rem; padding: 0.25rem 0.5rem; height: 80px; resize: vertical;" placeholder="Card Content">${s.content}</textarea>
                <div style="display: flex; gap: 0.35rem; justify-content: flex-end; margin-top: 0.25rem;">
                  <button class="btn btn-primary btn-small" style="font-size: 0.7rem; padding: 0.15rem 0.35rem;" onclick="app.saveTeacherSlideInline('${project.id}', '${s.id}')">Save</button>
                  <button class="btn btn-secondary btn-small" style="font-size: 0.7rem; padding: 0.15rem 0.35rem;" onclick="app.cancelTeacherSlideInline('${project.id}')">Cancel</button>
                </div>
              </div>
            `;
          } else {
            div.innerHTML = `
              <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.15rem;">
                <span>Card ${index + 1}</span>
                <strong>By ${s.author}</strong>
              </div>
              <h5 style="margin: 0 0 0.2rem 0; font-size: 0.8rem; color: var(--text-primary); font-weight: 700;">${s.title || 'Untitled Card'}</h5>
              <p style="margin: 0; font-size: 0.75rem; color: var(--text-secondary); white-space: pre-wrap;">${s.content || '(No content yet)'}</p>
              <div style="display: flex; gap: 0.35rem; margin-top: 0.5rem; justify-content: flex-end; border-top: 1px dashed rgba(255,255,255,0.05); padding-top: 0.35rem;">
                <button class="btn btn-secondary btn-small" style="font-size: 0.7rem; padding: 0.15rem 0.35rem; color: var(--secondary);" onclick="app.editTeacherSlideInline('${project.id}', '${s.id}')">✏️ Edit</button>
                <button class="btn btn-secondary btn-small" style="font-size: 0.7rem; padding: 0.15rem 0.35rem; color: var(--danger);" onclick="app.deleteTeacherSlideInline('${project.id}', '${s.id}')">🗑️ Delete</button>
              </div>
            `;
          }
        } else {
          div.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.15rem;">
              <span>Card ${index + 1}</span>
              <strong>By ${s.author}</strong>
            </div>
            <h5 style="margin: 0 0 0.2rem 0; font-size: 0.8rem; color: var(--text-primary); font-weight: 700;">${s.title}</h5>
            <p style="margin: 0; font-size: 0.75rem; color: var(--text-secondary); white-space: pre-wrap;">${s.content}</p>
          `;
        }
        slidesContainer.appendChild(div);
      });
    } else {
      slidesContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-style: italic; font-size: 0.8rem; padding: 1rem;">${this.translate('no_slides_created', 'No slides created yet.')}</div>`;
    }

    // Render Chat
    this.renderModerationChat();
  }

  addTeacherProjectSlide() {
    const projectId = this.activeModeratedProjectId;
    if (!projectId) return;
    const project = window.db.getProject(projectId);
    if (!project) return;

    const teacher = this.getLoggedTeacher();
    const newSlide = {
      id: 'slide_' + Date.now(),
      layout: 'split',
      title: '',
      content: '',
      photoUrl: '',
      author: teacher ? teacher.name : 'Teacher',
      editableByOthers: true
    };
    if (!project.slides) project.slides = [];
    project.slides.push(newSlide);
    window.db.updateProject(projectId, { slides: project.slides });

    this.editingTeacherSlideId = newSlide.id;
    this.renderTeacherWorkspace(project);
    this.renderTeacherProjects(); 
  }

  editTeacherSlideInline(projectId, slideId) {
    const project = window.db.getProject(projectId);
    if (!project) return;
    this.editingTeacherSlideId = slideId;
    this.renderTeacherWorkspace(project);
  }

  cancelTeacherSlideInline(projectId) {
    const project = window.db.getProject(projectId);
    if (!project) return;
    this.editingTeacherSlideId = null;
    this.renderTeacherWorkspace(project);
  }

  saveTeacherSlideInline(projectId, slideId) {
    const project = window.db.getProject(projectId);
    if (!project) return;

    const titleInput = document.getElementById(`edit-slide-title-${slideId}`);
    const contentInput = document.getElementById(`edit-slide-content-${slideId}`);

    if (titleInput && contentInput) {
      const slide = project.slides.find(s => s.id === slideId);
      if (slide) {
        slide.title = titleInput.value.trim();
        slide.content = contentInput.value.trim();
        window.db.updateProject(projectId, { slides: project.slides });
      }
    }

    this.editingTeacherSlideId = null;
    this.renderTeacherWorkspace(project);
  }

  deleteTeacherSlideInline(projectId, slideId) {
    const project = window.db.getProject(projectId);
    if (!project) return;

    if (!confirm(this.translate('delete_slide_confirm_prompt', 'Are you sure you want to delete this card? This action cannot be undone.'))) {
      return;
    }

    project.slides = project.slides.filter(s => s.id !== slideId);
    window.db.updateProject(projectId, { slides: project.slides });

    if (this.editingTeacherSlideId === slideId) {
      this.editingTeacherSlideId = null;
    }

    this.renderTeacherWorkspace(project);
    this.renderTeacherProjects(); 
  }

  renderModerationChat() {
    const projectId = this.activeModeratedProjectId;
    if (!projectId) return;

    const chatHistory = document.getElementById('moderation-chat-history');
    if (!chatHistory) return;

    chatHistory.innerHTML = '';
    const msgs = window.db.getProjectMessages().filter(m => m.projectId === projectId);

    if (msgs.length === 0) {
      chatHistory.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-style: italic; font-size: 0.8rem; padding: 2rem; margin: auto;">${this.translate('no_messages_in_chat', 'No messages in this chat yet.')}</div>`;
    } else {
      msgs.forEach(m => {
        const isTeacher = m.senderName && m.senderName.startsWith('Teacher');
        const msgDiv = document.createElement('div');
        msgDiv.style.display = 'flex';
        msgDiv.style.flexDirection = 'column';
        msgDiv.style.alignSelf = isTeacher ? 'flex-end' : 'flex-start';
        msgDiv.style.maxWidth = '85%';
        msgDiv.style.padding = '0.4rem 0.65rem';
        msgDiv.style.borderRadius = '12px';
        msgDiv.style.background = isTeacher ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.04)';
        msgDiv.style.border = isTeacher ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255,255,255,0.03)';
        msgDiv.style.marginBottom = '0.25rem';
        
        msgDiv.innerHTML = `
          <span style="font-size: 0.65rem; font-weight: 700; color: ${isTeacher ? '#60a5fa' : 'var(--text-secondary)'};">${m.senderName}</span>
          <span style="font-size: 0.75rem; margin-top: 0.1rem; color: var(--text-primary);">${m.text}</span>
          <span style="font-size: 0.6rem; color: var(--text-muted); align-self: flex-end; margin-top: 0.1rem;">${new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        `;
        chatHistory.appendChild(msgDiv);
      });
      chatHistory.scrollTop = chatHistory.scrollHeight;
    }
  }

  sendProjectModerationMessage() {
    const projectId = this.activeModeratedProjectId;
    if (!projectId) return;

    const input = document.getElementById('moderation-chat-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const teacher = this.getLoggedTeacher();
    const senderId = teacher ? teacher.id : 'coord_1';
    const senderName = teacher ? `${this.translate('teacher_label', 'Teacher')} ${teacher.name}` : 'Teacher';

    window.db.addProjectMessage(projectId, senderId, senderName, text);
    input.value = '';
    
    // Rerender chat
    this.renderModerationChat();
    // Keep parent UI in sync if messages count changed
    this.refreshUI();
  }

  handleProjectLaunch(e) {
    e.preventDefault();
    const teacher = this.getLoggedTeacher();
    if (!teacher) return;

    const titleInput = document.getElementById('launch-proj-title');
    const briefInput = document.getElementById('launch-proj-brief');
    const projTypeSelect = document.getElementById('launch-proj-type');

    if (!titleInput || !briefInput) return;

    // Get checked target partner schools
    const checkedSchools = document.querySelectorAll('#launch-proj-schools-list input[name="launch-school"]:checked');
    const selectedSchoolIds = Array.from(checkedSchools).map(cb => cb.value);

    if (selectedSchoolIds.length === 0) {
      alert(this.translate('select_school_launch_project_warning', 'Please select at least one target partner school to launch the project.'));
      return;
    }

    const isStaffProj = projTypeSelect ? projTypeSelect.value === 'staff' : false;

    let selectedStudentIds = [];
    if (!isStaffProj) {
      const selectedCheckboxes = document.querySelectorAll('#launch-proj-students-list input[name="launch-student"]:checked');
      selectedStudentIds = Array.from(selectedCheckboxes).map(cb => cb.value);

      if (selectedStudentIds.length === 0) {
        alert(this.translate('select_student_launch_project_warning', 'Please select at least one local student to launch the project.'));
        return;
      }
    }

    const proj = {
      title: titleInput.value.trim(),
      brief: briefInput.value.trim(),
      creatorSchoolId: teacher.schoolId,
      targetSchoolId: selectedSchoolIds[0], // backward compatibility
      targetSchoolIds: selectedSchoolIds,  // new array field supporting multi-school scaling
      creatorSchoolStudentIds: selectedStudentIds,
      targetSchoolStudentIds: [],
      isStaffProject: isStaffProj,
      status: 'Proposed'
    };

    window.db.addProject(proj);
    
    // Reset form
    document.getElementById('launch-project-form').reset();
    this.handleProjectTypeChange('student');
    
    alert(this.translate('project_proposal_launched_success', 'Project proposal launched successfully! It has been sent to the partner school for review and can be tracked in the Proposals tab under "Our Sent Proposals".'));
    this.projectsSubTab = 'proposals';
    this.refreshUI();
  }

  handleProjectTypeChange(value) {
    const container = document.getElementById('launch-proj-students-container');
    if (container) {
      container.style.display = value === 'staff' ? 'none' : 'block';
    }
  }

  acceptProject(projectId) {
    const teacher = this.getLoggedTeacher();
    if (!teacher) return;

    const project = window.db.getProject(projectId);
    if (!project) return;

    let selectedStudentIds = [];
    if (!project.isStaffProject) {
      const selectedCheckboxes = document.querySelectorAll(`.chk-accept-${projectId}:checked`);
      selectedStudentIds = Array.from(selectedCheckboxes).map(cb => cb.value);

      if (selectedStudentIds.length === 0) {
        alert(this.translate('select_student_join_project_warning', 'Please select at least one local student to join the project.'));
        return;
      }
    }

    const currentStudents = project.targetSchoolStudentIds || [];
    const updatedStudents = Array.from(new Set([...currentStudents, ...selectedStudentIds]));

    window.db.updateProject(projectId, {
      targetSchoolStudentIds: updatedStudents,
      status: 'Active'
    });

    // Add a system log message in the group chat
    const addedText = project.isStaffProject 
      ? 'Staff-to-staff collaboration established.'
      : `Added student(s): ${selectedStudentIds.map(sid => window.db.getStudent(sid)?.name || '').filter(Boolean).join(', ')}.`;

    window.db.addProjectMessage(
      projectId,
      'system',
      'System',
      `Project accepted by coordinator ${teacher.name}. ${addedText}`
    );

    alert(this.translate('proposal_accepted_success', 'Proposal accepted! The project is now active.'));
    this.projectsSubTab = 'gallery';
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

    // Initialize slide index for review modal
    this.reviewSlideIndex = 0;

    // Chat log history render
    const chatMsgs = window.db.getProjectMessages().filter(m => m.projectId === project.id);
    let chatHTML = '';
    if (chatMsgs.length === 0) {
      chatHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.75rem; padding: 0.5rem 0;">${this.translate('no_messages_yet', 'No messages yet.')}</div>`;
    } else {
      chatMsgs.forEach(msg => {
        const sender = window.db.getStudent(msg.senderId);
        const school = sender ? window.db.getSchool(sender.schoolId) : null;
        const flag = school ? this.getSchoolFlag(school.country) : '';
        chatHTML += `
          <div style="font-size: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.02); padding: 0.25rem 0; line-height: 1.4; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 0.25rem; flex-wrap: wrap;">
              ${flag}
              <strong style="color: var(--text-primary);">${msg.senderName}:</strong> 
              <span style="color: var(--text-secondary);">${msg.text}</span>
            </div>
            <span style="color: var(--text-muted); font-size: 0.7rem; flex-shrink: 0;">
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
            <span class="badge ${badgeClass}" style="margin-top: 0.35rem; font-size: 0.75rem; padding: 0.15rem 0.5rem;">${project.status}</span>
          </div>
        </div>

        <div style="background: rgba(6, 182, 212, 0.03); border: 1px solid rgba(6, 182, 212, 0.1); border-radius: 12px; padding: 0.75rem; font-size: 0.8rem; line-height: 1.5;">
          <strong style="color: var(--secondary);">📋 Project Brief:</strong> ${project.brief}
        </div>

        <div style="border-top: 1px solid var(--panel-border); padding-top: 0.75rem; display: flex; flex-direction: column; align-items: center;">
          <h5 style="align-self: flex-start; margin: 0 0 0.5rem 0; font-size: 0.85rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.5px;">✍️ Student Presentation Slides</h5>
          
          <!-- Presentation viewer inside review modal -->
          <div id="proj-review-viewer-card" style="width: 100%; height: 260px; background: rgba(0,0,0,0.25); border: 1px solid var(--panel-border); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; transition: all 0.3s;">
            <!-- Populated dynamically by renderReviewModalCarousel -->
          </div>
          
          <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 280px; margin-top: 0.5rem;">
            <button class="btn btn-secondary btn-small" onclick="app.prevReviewSlide('${project.id}')" style="padding: 0.25rem 0.65rem; font-weight: bold; border-radius: 6px; display: inline-flex; align-items: center; gap: 0.25rem;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg><span>${this.translate('prev_btn', 'Prev')}</span></button>
            <span id="proj-review-viewer-progress" style="font-size: 0.85rem; font-weight: 700; color: var(--text-secondary);">${this.translate('card_progress_label', 'Card {current} of {total}').replace('{current}', 1).replace('{total}', 1)}</span>
            <button class="btn btn-primary btn-small" onclick="app.nextReviewSlide('${project.id}')" style="padding: 0.25rem 0.65rem; font-weight: bold; border-radius: 6px; display: inline-flex; align-items: center; gap: 0.25rem;"><span>${this.translate('next_btn', 'Next')}</span><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
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

    this.renderReviewModalCarousel(projectId);
    document.getElementById('review-project-modal').classList.add('active');
  }

  renderReviewModalCarousel(projectId) {
    const project = window.db.getProject(projectId);
    if (!project) return;

    if (!project.slides) {
      project.slides = [
        {
          id: 'slide_1',
          layout: project.articlePhotoUrl ? 'split' : 'text-only',
          title: project.articleTitle || 'Untitled Slide',
          content: project.articleContent || '',
          photoUrl: project.articlePhotoUrl || '',
          author: project.articleLastUpdatedBy || 'Student'
        }
      ];
      window.db.updateProject(project.id, { slides: project.slides });
    }

    const card = document.getElementById('proj-review-viewer-card');
    if (!card) return;

    const slide = project.slides[this.reviewSlideIndex];
    if (!slide) return;

    const authorName = slide.author || 'Student';
    const authorStudent = window.db.getStudents().find(st => st.name.trim().toLowerCase() === authorName.trim().toLowerCase());
    let country = authorStudent ? window.db.getSchool(authorStudent.schoolId)?.country : undefined;
    if (!country) {
      const lowerAuthor = authorName.toLowerCase();
      if (
        lowerAuthor.includes('harriet') || 
        lowerAuthor.includes('emily') || 
        lowerAuthor.includes('jessica') || 
        lowerAuthor.includes('chloe') || 
        lowerAuthor.includes('tabitha') || 
        lowerAuthor.includes('sophia')
      ) country = 'United Kingdom';
      else if (
        lowerAuthor.includes('lukas') || 
        lowerAuthor.includes('hanna') || 
        lowerAuthor.includes('jonas') || 
        lowerAuthor.includes('mia') || 
        lowerAuthor.includes('sophie') || 
        lowerAuthor.includes('leon')
      ) country = 'Germany';
    }
    const flagHtml = country ? this.getSchoolFlag(country) : '';

    if (slide.layout === 'split') {
      card.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; height: 100%; width: 100%;">
          <div style="background: rgba(0,0,0,0.1); border-right: 1px solid var(--panel-border); height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden;">
            ${slide.photoUrl ? `<img src="${slide.photoUrl}" style="width:100%; height:100%; object-fit:cover;">` : `<span style="font-size:0.85rem; color:var(--text-muted);">${this.translate('no_image_uploaded', 'No image uploaded')}</span>`}
          </div>
          <div style="padding: 1.5rem; display: flex; flex-direction: column; overflow-y: auto; justify-content: center;">
            <h5 style="margin:0 0 0.5rem 0; font-family:var(--font-title); font-weight:800; color:var(--text-primary); font-size:1.1rem;">${slide.title || this.translate('untitled_slide_label', 'Untitled Slide')}</h5>
            <p style="font-size: 0.9rem; line-height: 1.6; color: var(--text-secondary); margin: 0; white-space: pre-wrap;">${slide.content || this.translate('no_content_written_yet', 'No content written yet.')}</p>
            ${slide.author ? `<span style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 1rem; font-style: italic; display: flex; align-items: center; gap: 0.25rem;">${this.translate('by_author', 'By')} ${flagHtml} ${slide.author}</span>` : ''}
          </div>
        </div>
      `;
    } else {
      card.innerHTML = `
        <div style="padding: 2rem 2.5rem; display: flex; flex-direction: column; overflow-y: auto; justify-content: center; height: 100%; width: 100%;">
          <h5 style="margin:0 0 0.75rem 0; font-family:var(--font-title); font-weight:800; color:var(--text-primary); font-size:1.25rem; text-align:center;">${slide.title || this.translate('untitled_slide_label', 'Untitled Slide')}</h5>
          <p style="font-size: 0.95rem; line-height: 1.7; color: var(--text-secondary); margin: 0; white-space: pre-wrap; text-align: center; max-width: 420px; margin-left: auto; margin-right: auto;">${slide.content || this.translate('no_content_written_yet', 'No content written yet.')}</p>
          ${slide.author ? `<span style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 1.5rem; font-style: italic; text-align: center; display: flex; align-items: center; justify-content: center; gap: 0.25rem;">${this.translate('by_author', 'By')} ${flagHtml} ${slide.author}</span>` : ''}
        </div>
      `;
    }

    const progress = document.getElementById('proj-review-viewer-progress');
    if (progress) {
      progress.textContent = this.translate('card_progress_label', 'Card {current} of {total}').replace('{current}', this.reviewSlideIndex + 1).replace('{total}', project.slides.length);
    }
  }

  prevReviewSlide(projectId) {
    if (this.reviewSlideIndex > 0) {
      this.reviewSlideIndex--;
      this.renderReviewModalCarousel(projectId);
    }
  }

  nextReviewSlide(projectId) {
    const project = window.db.getProject(projectId);
    if (project && this.reviewSlideIndex < project.slides.length - 1) {
      this.reviewSlideIndex++;
      this.renderReviewModalCarousel(projectId);
    }
  }

  authorizeProjectPublication(projectId, approve) {
    const teacher = this.getLoggedTeacher();
    if (!teacher) return;

    window.db.authorizeProject(projectId, teacher.id, approve);
    this.closeModal('review-project-modal');
    alert(this.translate('project_authorized_success', 'Project authorized successfully!'));
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

  startEditingSlideInline(flagId, projectId, slideId) {
    const proj = window.db.getProject(projectId);
    const slide = proj.slides.find(s => s.id === slideId);
    if (!slide) return;
    
    const container = document.getElementById(`flag-proj-slide-${slideId}`);
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.4rem; width: 100%; padding: 0.25rem 0;">
        <div style="font-size: 0.75rem; font-weight: bold; color: var(--primary);">${this.translate('editing_card_content_title', 'Editing Card Content')}</div>
        <div style="display: flex; flex-direction: column; gap: 0.15rem;">
          <label style="font-size: 0.7rem; color: var(--text-secondary); font-weight: bold;">${this.translate('title_label', 'Title')}</label>
          <input type="text" id="edit-slide-title-${slideId}" class="form-control" style="font-size: 0.8rem; padding: 0.2rem 0.4rem; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); border-radius: 4px;" value="${slide.title || ''}">
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.15rem;">
          <label style="font-size: 0.7rem; color: var(--text-secondary); font-weight: bold;">${this.translate('content_body_label', 'Content Body')}</label>
          <textarea id="edit-slide-content-${slideId}" class="form-control" style="height: 60px; font-size: 0.8rem; padding: 0.2rem 0.4rem; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); border-radius: 4px; resize: vertical;">${slide.content || ''}</textarea>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.15rem;">
          <label style="font-size: 0.7rem; color: var(--text-secondary); font-weight: bold;">${this.translate('photo_url_optional_label', 'Photo URL (Optional)')}</label>
          <input type="text" id="edit-slide-photo-${slideId}" class="form-control" style="font-size: 0.8rem; padding: 0.2rem 0.4rem; background: var(--bg-color); color: var(--text-primary); border: 1px solid var(--panel-border); border-radius: 4px;" value="${slide.photoUrl || ''}">
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.4rem; margin-top: 0.35rem;">
          <button type="button" class="btn btn-secondary btn-small" style="font-size: 0.7rem; padding: 0.15rem 0.4rem; height: auto;" onclick="app.openResolveFlagModal('${flagId}', 'content')">${this.translate('cancel_btn', 'Cancel')}</button>
          <button type="button" class="btn btn-primary btn-small" style="font-size: 0.7rem; padding: 0.15rem 0.4rem; height: auto;" onclick="app.saveSlideInline('${flagId}', '${projectId}', '${slideId}')">${this.translate('save_changes_btn', 'Save Changes')}</button>
        </div>
      </div>
    `;
  }

  saveSlideInline(flagId, projectId, slideId) {
    const projects = window.db.getProjects();
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;
    const slide = proj.slides.find(s => s.id === slideId);
    if (!slide) return;
    
    const titleVal = document.getElementById(`edit-slide-title-${slideId}`).value.trim();
    const contentVal = document.getElementById(`edit-slide-content-${slideId}`).value.trim();
    const photoVal = document.getElementById(`edit-slide-photo-${slideId}`).value.trim();
    
    slide.title = titleVal;
    slide.content = contentVal;
    slide.photoUrl = photoVal;
    
    window.db.saveTable('projects', projects);
    
    const teacher = this.getLoggedTeacher();
    const teacherName = teacher ? teacher.name : this.translate('teacher_label', 'Teacher');
    window.db.addAuditLog("Project Content Moderated", `Teacher ${teacherName} edited slide "${slide.title}" in project "${proj.title}" to moderate content.`, teacherName);
    
    // Refresh modal
    this.openResolveFlagModal(flagId, 'content');
  }

  // ================== NEW BREAK STUDENT LINKS MODAL METHODS ==================

  openBreakStudentLinksModal() {
    const teacher = this.getLoggedTeacher();
    const ownSchoolId = teacher ? teacher.schoolId : 'school_1';
    
    const students = window.db.getStudents();
    const myStudents = students.filter(s => s.schoolId === ownSchoolId);
    const matchedMyStudents = myStudents.filter(s => s.matchStatus === 'matched');
    
    const listContainer = document.getElementById('break-links-student-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    
    const selectAllCheckbox = document.getElementById('break-links-select-all');
    if (selectAllCheckbox) selectAllCheckbox.checked = false;
    
    if (matchedMyStudents.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.85rem; font-style: italic;">
          ${this.translate('no_currently_matched_students', 'No currently matched students in your school.')}
        </div>
      `;
      const submitBtn = document.getElementById('break-links-submit-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        submitBtn.style.cursor = 'not-allowed';
        submitBtn.textContent = this.translate('break_selected_links_btn', 'Break Selected Links ({count})').replace('{count}', 0);
      }
      this.openModal('break-student-links-modal');
      return;
    }
    
    const matches = window.db.getMatches();
    
    matchedMyStudents.forEach(stud => {
      const studentMatches = matches.filter(m => m.active && m.studentIds.includes(stud.id));
      const partnerNamesList = studentMatches.map(m => {
        const partnerId = m.studentIds.find(id => id !== stud.id);
        const partner = window.db.getStudent(partnerId);
        if (!partner) return '';
        const partnerSchool = window.db.getSchool(partner.schoolId);
        const flag = this.getSchoolFlag(partnerSchool?.country);
        return `${flag} ${partner.name}`;
      }).filter(n => n !== '');
      
      const div = document.createElement('div');
      div.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.02); border: 1px solid var(--panel-border); border-radius: 6px;';
      div.innerHTML = `
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.85rem; color: var(--text-primary);">
          <input type="checkbox" class="break-link-checkbox" value="${stud.id}" onclick="app.updateBreakLinksSubmitBtn()">
          <strong>${stud.name}</strong> (${this.translateYearGroup(stud.yearGroup)})
        </label>
        <span style="font-size: 0.75rem; color: var(--text-secondary);">
          Matched with: ${partnerNamesList.join(', ')}
        </span>
      `;
      listContainer.appendChild(div);
    });
    
    this.updateBreakLinksSubmitBtn();
    this.openModal('break-student-links-modal');
  }

  updateBreakLinksSubmitBtn() {
    const checkboxes = document.querySelectorAll('.break-link-checkbox');
    const checked = document.querySelectorAll('.break-link-checkbox:checked');
    const submitBtn = document.getElementById('break-links-submit-btn');
    const selectAllCheckbox = document.getElementById('break-links-select-all');
    
    if (selectAllCheckbox && checkboxes.length > 0) {
      selectAllCheckbox.checked = checked.length === checkboxes.length;
    }
    
    if (submitBtn) {
      submitBtn.disabled = checked.length === 0;
      submitBtn.style.opacity = checked.length === 0 ? '0.5' : '1';
      submitBtn.style.cursor = checked.length === 0 ? 'not-allowed' : 'pointer';
      submitBtn.textContent = this.translate('break_selected_links_btn', 'Break Selected Links ({count})').replace('{count}', checked.length);
    }
  }

  toggleSelectAllBreakLinks(selectAllCb) {
    const checkboxes = document.querySelectorAll('.break-link-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = selectAllCb.checked;
    });
    this.updateBreakLinksSubmitBtn();
  }

  submitBreakSelectedLinks() {
    const checked = document.querySelectorAll('.break-link-checkbox:checked');
    if (checked.length === 0) return;
    
    if (confirm(this.translate('break_selected_links_confirm_prompt', 'Are you sure you want to end active connection links for the {count} selected student(s)? This will unlink them and reset them to Unmatched status.').replace('{count}', checked.length))) {
      const teacher = this.getLoggedTeacher();
      const teacherName = teacher ? teacher.name : this.translate('teacher_label', 'Teacher');
      const selectedIds = Array.from(checked).map(cb => cb.value);
      
      let count = 0;
      selectedIds.forEach(studentId => {
        const match = window.db.getMatches().find(m => m.active && m.studentIds.includes(studentId));
        if (match) {
          window.db.deleteMatch(match.id);
          count++;
        }
      });
      
      if (count > 0) {
        window.db.addLog('Selective Links Terminated', `Ended match links for ${count} student(s) at end of school year.`, `Teacher ${teacherName}`);
        alert(this.translate('links_ended_success', 'Successfully ended {count} student link(s).').replace('{count}', count));
        this.closeModal('break-student-links-modal');
        this.refreshUI();
      }
    }
  }

  // ================== SCHOOL ANNOUNCEMENTS METHODS ==================

  openAnnouncementModal() {
    const titleInput = document.getElementById('announcement-title');
    const contentInput = document.getElementById('announcement-content');
    if (titleInput) titleInput.value = '';
    if (contentInput) contentInput.value = '';
    this.openModal('post-announcement-modal');
  }

  submitPostAnnouncement(e) {
    e.preventDefault();
    const title = document.getElementById('announcement-title').value.trim();
    const content = document.getElementById('announcement-content').value.trim();
    const teacher = this.getLoggedTeacher();
    const ownSchoolId = teacher ? teacher.schoolId : 'school_1';

    if (!title || !content) {
      alert(this.translate('enter_title_content_warning', 'Please enter both title and content.'));
      return;
    }

    const postedBy = `${this.translate('teacher_label', 'Teacher')} ${teacher ? teacher.name : this.translate('unknown_label', 'Unknown')}`;
    window.db.addNews({
      title,
      content,
      postedBy,
      schoolId: ownSchoolId,
      timestamp: new Date().toISOString()
    });

    window.db.addLog('Announcement Posted', `Posted school announcement: "${title}".`, postedBy);
    alert(this.translate('announcement_posted_success', 'Announcement posted successfully.'));
    this.closeModal('post-announcement-modal');
    this.refreshUI();
  }

  deleteAnnouncement(id) {
    if (confirm(this.translate('delete_announcement_confirm_prompt', 'Are you sure you want to delete this announcement?'))) {
      const teacher = this.getLoggedTeacher();
      const teacherName = teacher ? teacher.name : this.translate('teacher_label', 'Teacher');
      window.db.deleteNews(id);
      window.db.addLog('Announcement Deleted', `Deleted school announcement ID: ${id}.`, `Teacher ${teacherName}`);
      alert(this.translate('announcement_deleted_success', 'Announcement deleted successfully.'));
      this.refreshUI();
    }
  }

  renderTeacherAnnouncements() {
    const teacher = this.getLoggedTeacher();
    const ownSchoolId = teacher ? teacher.schoolId : 'school_1';
    const container = document.getElementById('teacher-announcements-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    const myAnnouncements = window.db.getNews().filter(n => n.schoolId === ownSchoolId);
    
    if (myAnnouncements.length === 0) {
      container.innerHTML = `
        <p style="font-size: 1rem; color: var(--text-muted); text-align: center; padding: 2rem; margin: 0;">
          ${this.translate('no_announcements_posted', 'No announcements posted for your school yet.')}
        </p>
      `;
      return;
    }
    
    myAnnouncements
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .forEach(ann => {
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; justify-content: space-between; align-items: flex-start; padding: 1rem; background: rgba(255,255,255,0.02); border: 1px solid var(--panel-border); border-radius: 8px;';
        div.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 0.35rem; flex: 1; margin-right: 1rem;">
            <h4 style="font-size: 1.15rem; font-weight: 700; margin: 0; color: var(--text-primary);">${ann.title}</h4>
            <span style="font-size: 1rem; color: var(--text-muted);">
              ${this.translate('posted_by', 'Posted by')} ${ann.postedBy} ${this.translate('on_label', 'on')} ${new Date(ann.timestamp).toLocaleString()}
            </span>
            <p style="font-size: 1rem; color: var(--text-secondary); margin: 0.25rem 0 0 0; white-space: pre-wrap; line-height: 1.45;">
              ${ann.content}
            </p>
          </div>
          <button class="btn btn-secondary" style="color: var(--danger); border-color: rgba(239,68,68,0.2); padding: 0.4rem 0.75rem; font-size: 0.95rem;" onclick="app.deleteAnnouncement('${ann.id}')">${this.translate('delete_btn', 'Delete')}</button>
        `;
        container.appendChild(div);
      });
  }

  // ================== CAROUSEL SLIDE CONTROL METHODS ==================

  prevCardSlide(projectId, event) {
    if (event) event.stopPropagation();
    const slides = window.db.getProject(projectId)?.slides || [];
    let idx = this.projectCardSlideIndices[projectId] || 0;
    if (idx > 0) {
      this.projectCardSlideIndices[projectId] = idx - 1;
      const student = window.db.getStudent(this.currentStudentId);
      if (student) this.renderDiscoveriesBoard(student);
    }
  }

  nextCardSlide(projectId, event) {
    if (event) event.stopPropagation();
    const slides = window.db.getProject(projectId)?.slides || [];
    let idx = this.projectCardSlideIndices[projectId] || 0;
    if (idx < slides.length - 1) {
      this.projectCardSlideIndices[projectId] = idx + 1;
      const student = window.db.getStudent(this.currentStudentId);
      if (student) this.renderDiscoveriesBoard(student);
    }
  }

  openReadOnlyProjectPreview(projectId) {
    const project = window.db.getProject(projectId);
    if (!project || !project.slides || project.slides.length === 0) return;

    this.activeProjectId = projectId;
    this.previewSlideIndex = 0;
    this.renderPreviewProjectSlide();
    this.openModal('project-deck-preview-modal');
  }
}

// Global coordinator initialization
window.app = new App();
