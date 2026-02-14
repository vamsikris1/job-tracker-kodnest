(function () {
  var routes = {
    '/': 'Landing',
    '/dashboard': 'Dashboard',
    '/saved': 'Saved',
    '/digest': 'Digest',
    '/settings': 'Settings',
    '/proof': 'Proof',
    '/jt/07-test': 'JT Test',
    '/jt/08-ship': 'JT Ship',
    '/jt/proof': 'JT Proof'
  };

  var nav = document.querySelector('.app-nav');
  var navLinks = document.querySelectorAll('[data-route-link]');
  var toggleButton = document.querySelector('.app-nav__toggle');
  var pageContainer = document.querySelector('[data-page-container]');
  var jobs = window.JOB_NOTIFICATION_DATA || [];
  var STORAGE_KEY = 'jobNotificationTracker.savedJobIds';
  var PREFS_KEY = 'jobTrackerPreferences';
  var STATUS_KEY = 'jobTrackerStatus';
  var STATUS_HISTORY_KEY = 'jobTrackerStatusHistory';
  var TEST_KEY = 'jobTrackerTestChecklist';
  var PROOF_KEY = 'jobTrackerProof';

  function normalisePath(path) {
    if (!path || path === '') {
      return '/';
    }
    return path;
  }

  function setActiveLink(path) {
    navLinks.forEach(function (link) {
      var href = link.getAttribute('href');
      if (href === path) {
        link.classList.add('app-nav__link--active');
      } else {
        link.classList.remove('app-nav__link--active');
      }
    });
  }

  function getRawPreferences() {
    try {
      var raw = window.localStorage.getItem(PREFS_KEY);
      if (!raw) {
        return null;
      }
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  function getPreferences() {
    var raw = getRawPreferences() || {};
    var prefs = {
      roleKeywords: Array.isArray(raw.roleKeywords) ? raw.roleKeywords : [],
      preferredLocations: Array.isArray(raw.preferredLocations) ? raw.preferredLocations : [],
      preferredModes: Array.isArray(raw.preferredModes) ? raw.preferredModes : [],
      experienceLevel: raw.experienceLevel || '',
      skills: Array.isArray(raw.skills) ? raw.skills : [],
      minMatchScore: typeof raw.minMatchScore === 'number' ? raw.minMatchScore : 40
    };
    if (prefs.minMatchScore < 0) {
      prefs.minMatchScore = 0;
    } else if (prefs.minMatchScore > 100) {
      prefs.minMatchScore = 100;
    }
    return prefs;
  }

  function savePreferences(prefs) {
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (e) {
      // Ignore storage errors
    }
  }

  function getSavedJobIds() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveJobIds(ids) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch (e) {
      // Ignore storage errors in this version
    }
  }

  function getSavedJobs() {
    var ids = getSavedJobIds();
    if (!ids.length) {
      return [];
    }
    return jobs.filter(function (job) {
      return ids.indexOf(job.id) !== -1;
    });
  }

  function getJobById(id) {
    for (var i = 0; i < jobs.length; i++) {
      if (jobs[i].id === id) {
        return jobs[i];
      }
    }
    return null;
  }

  function formatPostedDays(days) {
    if (days === 0) {
      return 'Today';
    }
    if (days === 1) {
      return '1 day ago';
    }
    return String(days) + ' days ago';
  }

  function getSalaryValue(job) {
    var text = job && job.salaryRange ? String(job.salaryRange) : '';
    var match = text.match(/([\d]+)\s*([kK])?/);
    if (!match) {
      return 0;
    }
    var value = parseInt(match[1], 10);
    if (!value || isNaN(value)) {
      return 0;
    }
    var isThousands = !!match[2];
    if (isThousands) {
      return (value * 12) / 100;
    }
    return value;
  }

  function buildScoringPreferences(prefs) {
    function normaliseList(list) {
      if (!Array.isArray(list)) {
        return [];
      }
      var result = [];
      for (var i = 0; i < list.length; i++) {
        var item = String(list[i] || '').toLowerCase().trim();
        if (item) {
          result.push(item);
        }
      }
      return result;
    }

    var scoring = {
      roleKeywords: normaliseList(prefs.roleKeywords),
      preferredLocations: Array.isArray(prefs.preferredLocations) ? prefs.preferredLocations.slice() : [],
      preferredModes: Array.isArray(prefs.preferredModes) ? prefs.preferredModes.slice() : [],
      experienceLevel: prefs.experienceLevel || '',
      skills: normaliseList(prefs.skills),
      minMatchScore: prefs.minMatchScore
    };

    return scoring;
  }

  function hasScoringPreferences(scoringPrefs) {
    if (!scoringPrefs) {
      return false;
    }
    if (scoringPrefs.roleKeywords && scoringPrefs.roleKeywords.length) {
      return true;
    }
    if (scoringPrefs.preferredLocations && scoringPrefs.preferredLocations.length) {
      return true;
    }
    if (scoringPrefs.preferredModes && scoringPrefs.preferredModes.length) {
      return true;
    }
    if (scoringPrefs.experienceLevel) {
      return true;
    }
    if (scoringPrefs.skills && scoringPrefs.skills.length) {
      return true;
    }
    return false;
  }

  function getTestChecklist() {
    try {
      var raw = window.localStorage.getItem(TEST_KEY);
      var base = {
        preferencesPersist: false,
        matchScoreCorrect: false,
        toggleWorks: false,
        savePersists: false,
        applyOpens: false,
        statusPersists: false,
        statusFilter: false,
        digestTop10: false,
        digestPersists: false,
        noConsoleErrors: false
      };
      if (!raw) {
        return base;
      }
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return base;
      }
      for (var key in base) {
        if (Object.prototype.hasOwnProperty.call(base, key)) {
          if (typeof parsed[key] === 'boolean') {
            base[key] = parsed[key];
          }
        }
      }
      return base;
    } catch (e) {
      return {
        preferencesPersist: false,
        matchScoreCorrect: false,
        toggleWorks: false,
        savePersists: false,
        applyOpens: false,
        statusPersists: false,
        statusFilter: false,
        digestTop10: false,
        digestPersists: false,
        noConsoleErrors: false
      };
    }
  }

  function saveTestChecklist(state) {
    try {
      window.localStorage.setItem(TEST_KEY, JSON.stringify(state));
    } catch (e) {
      // ignore
    }
  }

  function countTestChecklist(state) {
    var s = state || getTestChecklist();
    var total = 0;
    var passed = 0;
    for (var key in s) {
      if (Object.prototype.hasOwnProperty.call(s, key)) {
        total += 1;
        if (s[key]) {
          passed += 1;
        }
      }
    }
    return { passed: passed, total: total };
  }

  function allTestsPassed() {
    var counts = countTestChecklist();
    return counts.total > 0 && counts.passed === counts.total;
  }

  function getProofData() {
    try {
      var raw = window.localStorage.getItem(PROOF_KEY);
      var base = {
        lovableLink: '',
        githubLink: '',
        deployedUrl: '',
        shipped: false
      };
      if (!raw) {
        return base;
      }
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return base;
      }
      return {
        lovableLink: String(parsed.lovableLink || ''),
        githubLink: String(parsed.githubLink || ''),
        deployedUrl: String(parsed.deployedUrl || ''),
        shipped: !!parsed.shipped
      };
    } catch (e) {
      return {
        lovableLink: '',
        githubLink: '',
        deployedUrl: '',
        shipped: false
      };
    }
  }

  function saveProofData(data) {
    try {
      window.localStorage.setItem(PROOF_KEY, JSON.stringify(data));
    } catch (e) {
      // ignore
    }
  }

  function isValidUrl(url) {
    try {
      var str = String(url || '').trim();
      if (!str) {
        return false;
      }
      new URL(str);
      return true;
    } catch (e) {
      return false;
    }
  }

  function allLinksProvided(proof) {
    var p = proof || getProofData();
    return (
      isValidUrl(p.lovableLink) &&
      isValidUrl(p.githubLink) &&
      isValidUrl(p.deployedUrl)
    );
  }

  function canShip() {
    return allTestsPassed() && allLinksProvided();
  }

  function getProjectStatus() {
    var proof = getProofData();
    if (proof.shipped) {
      return 'Shipped';
    }
    if (allLinksProvided() || allTestsPassed()) {
      return 'In Progress';
    }
    return 'Not Started';
  }

  function computeMatchScore(job, scoringPrefs) {
    if (!job) {
      return 0;
    }
    var prefs = scoringPrefs || buildScoringPreferences(getPreferences());

    var score = 0;
    var titleLower = String(job.title || '').toLowerCase();
    var descriptionLower = String(job.description || '').toLowerCase();

    var hasRoleKeywords = prefs.roleKeywords && prefs.roleKeywords.length > 0;
    if (hasRoleKeywords) {
      var titleMatch = false;
      var descMatch = false;
      for (var i = 0; i < prefs.roleKeywords.length; i++) {
        var keyword = prefs.roleKeywords[i];
        if (!titleMatch && titleLower.indexOf(keyword) !== -1) {
          titleMatch = true;
        }
        if (!descMatch && descriptionLower.indexOf(keyword) !== -1) {
          descMatch = true;
        }
        if (titleMatch && descMatch) {
          break;
        }
      }
      if (titleMatch) {
        score += 25;
      }
      if (descMatch) {
        score += 15;
      }
    }

    if (prefs.preferredLocations && prefs.preferredLocations.length > 0) {
      if (prefs.preferredLocations.indexOf(job.location) !== -1) {
        score += 15;
      }
    }

    if (prefs.preferredModes && prefs.preferredModes.length > 0) {
      if (prefs.preferredModes.indexOf(job.mode) !== -1) {
        score += 10;
      }
    }

    if (prefs.experienceLevel) {
      if (job.experience === prefs.experienceLevel) {
        score += 10;
      }
    }

    if (prefs.skills && prefs.skills.length > 0 && job.skills && job.skills.length > 0) {
      var jobSkillsLower = [];
      for (var j = 0; j < job.skills.length; j++) {
        jobSkillsLower.push(String(job.skills[j] || '').toLowerCase().trim());
      }
      var overlap = false;
      for (var k = 0; k < prefs.skills.length; k++) {
        if (jobSkillsLower.indexOf(prefs.skills[k]) !== -1) {
          overlap = true;
          break;
        }
      }
      if (overlap) {
        score += 15;
      }
    }

    if (typeof job.postedDaysAgo === 'number' && job.postedDaysAgo <= 2) {
      score += 5;
    }

    if (job.source === 'LinkedIn') {
      score += 5;
    }

    if (score > 100) {
      score = 100;
    }
    if (score < 0) {
      score = 0;
    }

    return score;
  }

  function getStatusMap() {
    try {
      var raw = window.localStorage.getItem(STATUS_KEY);
      if (!raw) {
        return {};
      }
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  function saveStatusMap(map) {
    try {
      window.localStorage.setItem(STATUS_KEY, JSON.stringify(map));
    } catch (e) {
      // ignore
    }
  }

  function getJobStatus(jobId) {
    var map = getStatusMap();
    var raw = map[jobId];
    if (!raw) {
      return 'Not Applied';
    }
    return raw;
  }

  function pushStatusHistory(jobId, status) {
    try {
      var raw = window.localStorage.getItem(STATUS_HISTORY_KEY);
      var history = [];
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          history = parsed;
        }
      }
      var entry = {
        jobId: jobId,
        status: status,
        changedAt: new Date().toISOString()
      };
      history.unshift(entry);
      if (history.length > 30) {
        history = history.slice(0, 30);
      }
      window.localStorage.setItem(STATUS_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      // ignore
    }
  }

  function setJobStatus(jobId, status) {
    var map = getStatusMap();
    map[jobId] = status;
    saveStatusMap(map);

    if (status === 'Applied' || status === 'Rejected' || status === 'Selected') {
      pushStatusHistory(jobId, status);
      showToast('Status updated: ' + status);
    } else {
      showToast('Status updated: ' + status);
    }
  }

  var toastTimeoutId = null;

  function showToast(message) {
    var toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('toast--visible');
    if (toastTimeoutId) {
      window.clearTimeout(toastTimeoutId);
    }
    toastTimeoutId = window.setTimeout(function () {
      toast.classList.remove('toast--visible');
    }, 2000);
  }

  function renderJobList(list, container, context, scoresMap) {
    if (!container) {
      return;
    }

    if (!list.length) {
      container.innerHTML = '';
      return;
    }

    var savedIds = getSavedJobIds();
    var statusMap = getStatusMap();
    var html = list.map(function (job) {
      var isSaved = savedIds.indexOf(job.id) !== -1;
      var postedText = formatPostedDays(job.postedDaysAgo);
      var score = scoresMap && typeof scoresMap[job.id] === 'number' ? scoresMap[job.id] : null;
      var status = statusMap[job.id] || 'Not Applied';

      var scoreBadgeClass = 'badge';
      if (score !== null) {
        if (score >= 80) {
          scoreBadgeClass += ' badge--success';
        } else if (score >= 60) {
          scoreBadgeClass += ' badge--warning';
        } else if (score >= 40) {
          scoreBadgeClass += ' badge--neutral';
        } else {
          scoreBadgeClass += ' badge--muted';
        }
      }

      var scoreBadge = '';
      if (score !== null) {
        scoreBadge = '<span class="' + scoreBadgeClass + '">' + String(score) + '% match</span>';
      }

      var statusBadgeClass = 'badge badge--status-not-applied';
      if (status === 'Applied') {
        statusBadgeClass = 'badge badge--status-applied';
      } else if (status === 'Rejected') {
        statusBadgeClass = 'badge badge--status-rejected';
      } else if (status === 'Selected') {
        statusBadgeClass = 'badge badge--status-selected';
      }

      var actions = '';
      if (context === 'dashboard') {
        actions =
          '<button class="btn btn--tertiary btn--sm" type="button" data-job-action="view" data-job-id="' + job.id + '">View</button>' +
          '<button class="btn btn--secondary btn--sm" type="button" data-job-action="save" data-job-id="' + job.id + '"' + (isSaved ? ' disabled' : '') + '>' + (isSaved ? 'Saved' : 'Save') + '</button>' +
          '<button class="btn btn--primary btn--sm" type="button" data-job-action="apply" data-job-id="' + job.id + '">Apply</button>';
      } else {
        actions =
          '<button class="btn btn--tertiary btn--sm" type="button" data-job-action="view" data-job-id="' + job.id + '">View</button>' +
          '<button class="btn btn--primary btn--sm" type="button" data-job-action="apply" data-job-id="' + job.id + '">Apply</button>';
      }

      return '' +
        '<article class="card job-card" data-job-id="' + job.id + '">' +
        '  <div class="job-card__header">' +
        '    <div>' +
        '      <h2 class="job-card__title">' + job.title + '</h2>' +
        '      <div class="job-card__company">' + job.company + '</div>' +
        '    </div>' +
        '    <div class="job-card__meta">' + job.salaryRange + '</div>' +
        '  </div>' +
        '  <div class="job-card__meta">' +
        '    ' + job.location + ' \u00b7 ' + job.mode + ' \u00b7 ' + job.experience + ' years' +
        '  </div>' +
        '  <div class="job-card__tags">' +
        '    ' + (scoreBadge || '') +
        '    <span class="badge badge--accent">' + job.source + '</span>' +
        '  </div>' +
        '  <div class="job-card__status">' +
        '    <span class="job-card__status-label">Status:</span>' +
        '    <span class="' + statusBadgeClass + '" data-job-status-badge="' + job.id + '">' + status + '</span>' +
        '    <select class="job-card__status-select" data-job-status-select="' + job.id + '">' +
        '      <option value="Not Applied"' + (status === 'Not Applied' ? ' selected' : '') + '>Not Applied</option>' +
        '      <option value="Applied"' + (status === 'Applied' ? ' selected' : '') + '>Applied</option>' +
        '      <option value="Rejected"' + (status === 'Rejected' ? ' selected' : '') + '>Rejected</option>' +
        '      <option value="Selected"' + (status === 'Selected' ? ' selected' : '') + '>Selected</option>' +
        '    </select>' +
        '  </div>' +
        '  <div class="job-card__footer">' +
        '    <div class="job-card__posted">' + postedText + '</div>' +
        '    <div class="job-card__actions">' + actions + '</div>' +
        '  </div>' +
        '</article>';
    }).join('');

    container.innerHTML = html;
  }

  function openJobModal(job, scopeElement) {
    if (!scopeElement) {
      return;
    }

    var modal = scopeElement.querySelector('[data-job-modal]');
    if (!modal) {
      return;
    }

    var title = modal.querySelector('[data-modal-title]');
    var subtitle = modal.querySelector('[data-modal-subtitle]');
    var description = modal.querySelector('[data-modal-description]');
    var skills = modal.querySelector('[data-modal-skills]');

    if (title) {
      title.textContent = job.title;
    }
    if (subtitle) {
      subtitle.textContent = job.company + ' \u00b7 ' + job.location + ' \u00b7 ' + job.mode;
    }
    if (description) {
      description.textContent = job.description;
    }
    if (skills) {
      var skillsHtml = (job.skills || []).map(function (skill) {
        return '<span class="badge">' + skill + '</span>';
      }).join('');
      skills.innerHTML = skillsHtml;
    }

    modal.classList.add('job-modal--open');
  }

  function closeJobModal(scopeElement) {
    if (!scopeElement) {
      return;
    }
    var modal = scopeElement.querySelector('[data-job-modal]');
    if (!modal) {
      return;
    }
    modal.classList.remove('job-modal--open');
  }

  function initialiseDashboardRoute() {
    if (!pageContainer) {
      return;
    }

    var scope = pageContainer;
    var container = scope.querySelector('[data-jobs-container]');
    if (!container) {
      return;
    }

    var keywordInput = scope.querySelector('[data-filter-keyword]');
    var locationSelect = scope.querySelector('[data-filter-location]');
    var modeSelect = scope.querySelector('[data-filter-mode]');
    var experienceSelect = scope.querySelector('[data-filter-experience]');
    var sourceSelect = scope.querySelector('[data-filter-source]');
    var sortSelect = scope.querySelector('[data-filter-sort]');
    var statusSelect = scope.querySelector('[data-filter-status]');
    var matchesToggle = scope.querySelector('[data-toggle-matches]');
    var preferencesBanner = scope.querySelector('[data-preferences-banner]');

    function unique(values) {
      var set = {};
      var result = [];
      for (var i = 0; i < values.length; i++) {
        var value = values[i];
        if (!value) {
          continue;
        }
        if (!set[value]) {
          set[value] = true;
          result.push(value);
        }
      }
      return result;
    }

    function populateSelect(select, values, placeholder) {
      if (!select) {
        return;
      }
      var options = '<option value="">' + placeholder + '</option>';
      var sorted = values.slice().sort();
      for (var i = 0; i < sorted.length; i++) {
        options += '<option value="' + sorted[i] + '">' + sorted[i] + '</option>';
      }
      select.innerHTML = options;
    }

    populateSelect(locationSelect, unique(jobs.map(function (j) { return j.location; })), 'All locations');
    populateSelect(modeSelect, unique(jobs.map(function (j) { return j.mode; })), 'Any mode');
    populateSelect(experienceSelect, unique(jobs.map(function (j) { return j.experience; })), 'Any experience');
    populateSelect(sourceSelect, unique(jobs.map(function (j) { return j.source; })), 'All sources');

    if (sortSelect) {
      sortSelect.value = 'latest';
    }

    (function initialiseBanner() {
      var prefs = getPreferences();
      var scoringPrefs = buildScoringPreferences(prefs);
      if (preferencesBanner) {
        preferencesBanner.style.display = hasScoringPreferences(scoringPrefs) ? 'none' : '';
      }
    })();

    function applyFilters() {
      var prefs = getPreferences();
      var scoringPrefs = buildScoringPreferences(prefs);
      var scores = {};
      for (var i = 0; i < jobs.length; i++) {
        var job = jobs[i];
        scores[job.id] = computeMatchScore(job, scoringPrefs);
      }

      var keyword = keywordInput ? keywordInput.value.toLowerCase().trim() : '';
      var locationValue = locationSelect ? locationSelect.value : '';
      var modeValue = modeSelect ? modeSelect.value : '';
      var experienceValue = experienceSelect ? experienceSelect.value : '';
      var sourceValue = sourceSelect ? sourceSelect.value : '';
      var sortValue = sortSelect ? sortSelect.value : 'latest';
      var matchesOnly = matchesToggle ? !!matchesToggle.checked : false;
      var threshold = typeof prefs.minMatchScore === 'number' ? prefs.minMatchScore : 40;

      var filtered = jobs.filter(function (job) {
        var score = scores[job.id];
        var status = getJobStatus(job.id);

        if (keyword && job.title.toLowerCase().indexOf(keyword) === -1 && job.company.toLowerCase().indexOf(keyword) === -1) {
          return false;
        }
        if (locationValue && job.location !== locationValue) {
          return false;
        }
        if (modeValue && job.mode !== modeValue) {
          return false;
        }
        if (experienceValue && job.experience !== experienceValue) {
          return false;
        }
        if (sourceValue && job.source !== sourceValue) {
          return false;
        }
        if (statusSelect && statusSelect.value) {
          if (status !== statusSelect.value) {
            return false;
          }
        }
        if (matchesOnly && typeof score === 'number' && score < threshold) {
          return false;
        }
        return true;
      });

      if (!filtered.length) {
        container.innerHTML =
          '<div class="page-empty page-empty--centered">' +
          '  <h2 class="page-empty__title">No roles match your criteria.</h2>' +
          '  <p class="page-empty__body">Adjust filters or lower your match threshold.</p>' +
          '</div>';
        return;
      }

      filtered.sort(function (a, b) {
        if (sortValue === 'match') {
          var scoreA = scores[a.id];
          var scoreB = scores[b.id];
          if (scoreA === scoreB) {
            return a.postedDaysAgo - b.postedDaysAgo;
          }
          return scoreB - scoreA;
        }
        if (sortValue === 'salary') {
          var salaryA = getSalaryValue(a);
          var salaryB = getSalaryValue(b);
          return salaryB - salaryA;
        }
        if (sortValue === 'oldest') {
          return b.postedDaysAgo - a.postedDaysAgo;
        }
        return a.postedDaysAgo - b.postedDaysAgo;
      });

      renderJobList(filtered, container, 'dashboard', scores);
    }

    if (keywordInput) {
      keywordInput.addEventListener('input', applyFilters);
    }
    if (locationSelect) {
      locationSelect.addEventListener('change', applyFilters);
    }
    if (modeSelect) {
      modeSelect.addEventListener('change', applyFilters);
    }
    if (experienceSelect) {
      experienceSelect.addEventListener('change', applyFilters);
    }
    if (sourceSelect) {
      sourceSelect.addEventListener('change', applyFilters);
    }
    if (sortSelect) {
      sortSelect.addEventListener('change', applyFilters);
    }
    if (matchesToggle) {
      matchesToggle.addEventListener('change', applyFilters);
    }
    if (statusSelect) {
      statusSelect.addEventListener('change', applyFilters);
    }

    container.addEventListener('click', function (event) {
      var target = event.target;
      var button = target && target.closest('[data-job-action]');
      if (!button) {
        return;
      }
      var action = button.getAttribute('data-job-action');
      var jobId = button.getAttribute('data-job-id');
      if (!jobId) {
        return;
      }
      var job = getJobById(jobId);
      if (!job) {
        return;
      }

      if (action === 'view') {
        openJobModal(job, scope);
      } else if (action === 'save') {
        var ids = getSavedJobIds();
        if (ids.indexOf(jobId) === -1) {
          ids.push(jobId);
          saveJobIds(ids);
          button.textContent = 'Saved';
          button.disabled = true;
        }
      } else if (action === 'apply') {
        window.open(job.applyUrl, '_blank', 'noopener');
      }
    });

    container.addEventListener('change', function (event) {
      var target = event.target;
      if (!target || !target.hasAttribute('data-job-status-select')) {
        return;
      }
      var jobId = target.getAttribute('data-job-status-select');
      if (!jobId) {
        return;
      }
      var newStatus = target.value || 'Not Applied';
      setJobStatus(jobId, newStatus);

      var badge = scope.querySelector('[data-job-status-badge="' + jobId + '"]');
      if (badge) {
        badge.textContent = newStatus;
        badge.className = 'badge';
        if (newStatus === 'Applied') {
          badge.className += ' badge--status-applied';
        } else if (newStatus === 'Rejected') {
          badge.className += ' badge--status-rejected';
        } else if (newStatus === 'Selected') {
          badge.className += ' badge--status-selected';
        } else {
          badge.className += ' badge--status-not-applied';
        }
      }
    });

    var modal = scope.querySelector('[data-job-modal]');
    if (modal) {
      modal.addEventListener('click', function (event) {
        var target = event.target;
        if (target.hasAttribute('data-modal-close')) {
          closeJobModal(scope);
        }
      });
    }

    applyFilters();
  }

  function initialiseSavedRoute() {
    if (!pageContainer) {
      return;
    }

    var scope = pageContainer;
    var container = scope.querySelector('[data-saved-container]');
    var emptyState = scope.querySelector('[data-saved-empty]');

    if (!container) {
      return;
    }

    function refreshSaved() {
      var savedJobs = getSavedJobs();
      if (!savedJobs.length) {
        if (emptyState) {
          emptyState.style.display = '';
        }
        container.innerHTML = '';
        return;
      }

      if (emptyState) {
        emptyState.style.display = 'none';
      }

      var prefs = getPreferences();
      var scoringPrefs = buildScoringPreferences(prefs);
      var scores = {};
      for (var i = 0; i < savedJobs.length; i++) {
        var job = savedJobs[i];
        scores[job.id] = computeMatchScore(job, scoringPrefs);
      }

      savedJobs.sort(function (a, b) {
        return a.postedDaysAgo - b.postedDaysAgo;
      });

      renderJobList(savedJobs, container, 'saved', scores);
    }

    container.addEventListener('click', function (event) {
      var target = event.target;
      var button = target && target.closest('[data-job-action]');
      if (!button) {
        return;
      }
      var action = button.getAttribute('data-job-action');
      var jobId = button.getAttribute('data-job-id');
      if (!jobId) {
        return;
      }
      var job = getJobById(jobId);
      if (!job) {
        return;
      }

      if (action === 'view') {
        openJobModal(job, scope);
      } else if (action === 'apply') {
        window.open(job.applyUrl, '_blank', 'noopener');
      }
    });

    container.addEventListener('change', function (event) {
      var target = event.target;
      if (!target || !target.hasAttribute('data-job-status-select')) {
        return;
      }
      var jobId = target.getAttribute('data-job-status-select');
      if (!jobId) {
        return;
      }
      var newStatus = target.value || 'Not Applied';
      setJobStatus(jobId, newStatus);

      var badge = scope.querySelector('[data-job-status-badge="' + jobId + '"]');
      if (badge) {
        badge.textContent = newStatus;
        badge.className = 'badge';
        if (newStatus === 'Applied') {
          badge.className += ' badge--status-applied';
        } else if (newStatus === 'Rejected') {
          badge.className += ' badge--status-rejected';
        } else if (newStatus === 'Selected') {
          badge.className += ' badge--status-selected';
        } else {
          badge.className += ' badge--status-not-applied';
        }
      }
    });

    var modal = scope.querySelector('[data-job-modal]');
    if (modal) {
      modal.addEventListener('click', function (event) {
        var target = event.target;
        if (target.hasAttribute('data-modal-close')) {
          closeJobModal(scope);
        }
      });
    }

    refreshSaved();
  }

  function initialiseSettingsRoute() {
    if (!pageContainer) {
      return;
    }

    var scope = pageContainer;
    var form = scope.querySelector('[data-settings-form]');
    if (!form) {
      return;
    }

    var roleInput = form.querySelector('[data-pref-role-keywords]');
    var locationsSelect = form.querySelector('[data-pref-locations]');
    var modeCheckboxes = form.querySelectorAll('[data-pref-mode]');
    var experienceSelect = form.querySelector('[data-pref-experience]');
    var skillsInput = form.querySelector('[data-pref-skills]');
    var minScoreInput = form.querySelector('[data-pref-min-score]');
    var minScoreLabel = form.querySelector('[data-pref-min-score-label]');

    function unique(values) {
      var set = {};
      var result = [];
      for (var i = 0; i < values.length; i++) {
        var value = values[i];
        if (!value) {
          continue;
        }
        if (!set[value]) {
          set[value] = true;
          result.push(value);
        }
      }
      return result;
    }

    if (locationsSelect) {
      var locations = unique(jobs.map(function (j) { return j.location; }));
      var options = '';
      var sortedLocations = locations.slice().sort();
      for (var li = 0; li < sortedLocations.length; li++) {
        options += '<option value="' + sortedLocations[li] + '">' + sortedLocations[li] + '</option>';
      }
      locationsSelect.innerHTML = options;
    }

    function parseCommaList(value) {
      var text = String(value || '');
      if (!text) {
        return [];
      }
      var parts = text.split(',');
      var result = [];
      for (var i = 0; i < parts.length; i++) {
        var item = parts[i].trim();
        if (item) {
          result.push(item);
        }
      }
      return result;
    }

    function readPreferencesFromForm() {
      var roleKeywords = roleInput ? parseCommaList(roleInput.value) : [];
      var preferredLocations = [];
      if (locationsSelect && locationsSelect.options) {
        for (var i = 0; i < locationsSelect.options.length; i++) {
          var opt = locationsSelect.options[i];
          if (opt.selected && opt.value) {
            preferredLocations.push(opt.value);
          }
        }
      }

      var preferredModes = [];
      if (modeCheckboxes && modeCheckboxes.length) {
        for (var j = 0; j < modeCheckboxes.length; j++) {
          var cb = modeCheckboxes[j];
          if (cb.checked && cb.value) {
            preferredModes.push(cb.value);
          }
        }
      }

      var experienceLevel = experienceSelect ? experienceSelect.value : '';
      var skills = skillsInput ? parseCommaList(skillsInput.value) : [];
      var minScore = minScoreInput ? parseInt(minScoreInput.value, 10) : 40;
      if (isNaN(minScore)) {
        minScore = 40;
      }
      if (minScore < 0) {
        minScore = 0;
      } else if (minScore > 100) {
        minScore = 100;
      }

      return {
        roleKeywords: roleKeywords,
        preferredLocations: preferredLocations,
        preferredModes: preferredModes,
        experienceLevel: experienceLevel,
        skills: skills,
        minMatchScore: minScore
      };
    }

    function applyPreferencesToForm(prefs) {
      if (roleInput) {
        roleInput.value = (prefs.roleKeywords || []).join(', ');
      }
      if (locationsSelect && locationsSelect.options && prefs.preferredLocations) {
        for (var i = 0; i < locationsSelect.options.length; i++) {
          var opt = locationsSelect.options[i];
          opt.selected = prefs.preferredLocations.indexOf(opt.value) !== -1;
        }
      }
      if (modeCheckboxes && modeCheckboxes.length && prefs.preferredModes) {
        for (var j = 0; j < modeCheckboxes.length; j++) {
          var cb = modeCheckboxes[j];
          cb.checked = prefs.preferredModes.indexOf(cb.value) !== -1;
        }
      }
      if (experienceSelect) {
        experienceSelect.value = prefs.experienceLevel || '';
      }
      if (skillsInput) {
        skillsInput.value = (prefs.skills || []).join(', ');
      }
      if (minScoreInput) {
        minScoreInput.value = String(prefs.minMatchScore);
      }
      if (minScoreLabel) {
        minScoreLabel.textContent = String(prefs.minMatchScore);
      }
    }

    var initialPrefs = getPreferences();
    applyPreferencesToForm(initialPrefs);

    function handleFormChange() {
      var updated = readPreferencesFromForm();
      savePreferences(updated);
      if (minScoreLabel) {
        minScoreLabel.textContent = String(updated.minMatchScore);
      }
    }

    form.addEventListener('change', handleFormChange);
    if (minScoreInput) {
      minScoreInput.addEventListener('input', handleFormChange);
    }
  }

  function initialiseTestRoute() {
    if (!pageContainer) {
      return;
    }

    var scope = pageContainer;
    var list = scope.querySelector('[data-test-list]');
    if (!list) {
      return;
    }

    var state = getTestChecklist();

    function updateSummary() {
      var counts = countTestChecklist(state);
      var countEl = scope.querySelector('[data-test-passed-count]');
      var warningEl = scope.querySelector('[data-test-warning]');
      if (countEl) {
        countEl.textContent = String(counts.passed) + ' / ' + String(counts.total);
      }
      if (warningEl) {
        warningEl.style.display = counts.passed === counts.total ? 'none' : '';
      }
    }

    var checkboxes = list.querySelectorAll('[data-test-id]');
    checkboxes.forEach(function (cb) {
      var id = cb.getAttribute('data-test-id');
      if (!id) {
        return;
      }
      if (Object.prototype.hasOwnProperty.call(state, id)) {
        cb.checked = !!state[id];
      }
      cb.addEventListener('change', function () {
        state[id] = !!cb.checked;
        saveTestChecklist(state);
        updateSummary();
      });
    });

    var resetButton = scope.querySelector('[data-test-reset]');
    if (resetButton) {
      resetButton.addEventListener('click', function () {
        state = {
          preferencesPersist: false,
          matchScoreCorrect: false,
          toggleWorks: false,
          savePersists: false,
          applyOpens: false,
          statusPersists: false,
          statusFilter: false,
          digestTop10: false,
          digestPersists: false,
          noConsoleErrors: false
        };
        saveTestChecklist(state);
        checkboxes.forEach(function (cb) {
          cb.checked = false;
        });
        updateSummary();
        showToast('Test checklist reset.');
      });
    }

    updateSummary();
  }

  function initialiseProofRoute() {
    if (!pageContainer) {
      return;
    }

    var scope = pageContainer;
    var lovableInput = scope.querySelector('[data-proof-lovable]');
    var githubInput = scope.querySelector('[data-proof-github]');
    var deployInput = scope.querySelector('[data-proof-deploy]');
    var copyButton = scope.querySelector('[data-proof-copy]');
    var shipButton = scope.querySelector('[data-proof-ship]');
    var statusBadge = scope.querySelector('[data-proof-status]');
    var summary = scope.querySelector('[data-proof-summary]');

    if (!lovableInput || !githubInput || !deployInput) {
      return;
    }

    var proof = getProofData();

    function updateStatusDisplay() {
      var currentProof = getProofData();
      var status = getProjectStatus();
      
      if (statusBadge) {
        statusBadge.textContent = status;
        statusBadge.className = 'proof__status-badge proof__status-' + status.toLowerCase().replace(' ', '-');
      }

      if (copyButton) {
        copyButton.disabled = !allLinksProvided(currentProof);
      }

      if (shipButton) {
        shipButton.disabled = !canShip();
      }

      if (summary && currentProof.shipped) {
        summary.textContent = 'Project 1 Shipped Successfully.';
        summary.style.display = '';
      } else if (summary) {
        summary.style.display = 'none';
      }
    }

    function loadInputsFromLocalStorage() {
      lovableInput.value = proof.lovableLink || '';
      githubInput.value = proof.githubLink || '';
      deployInput.value = proof.deployedUrl || '';
      updateStatusDisplay();
    }

    function saveInputs() {
      var updated = {
        lovableLink: lovableInput.value.trim(),
        githubLink: githubInput.value.trim(),
        deployedUrl: deployInput.value.trim(),
        shipped: proof.shipped
      };
      proof = updated;
      saveProofData(updated);
      updateStatusDisplay();
    }

    lovableInput.addEventListener('blur', saveInputs);
    githubInput.addEventListener('blur', saveInputs);
    deployInput.addEventListener('blur', saveInputs);

    if (copyButton) {
      copyButton.addEventListener('click', function () {
        if (!allLinksProvided(proof)) {
          showToast('Please provide all required links first.');
          return;
        }

        var text = '' +
          '-- Job Notification Tracker — Final Submission --\n\n' +
          'Lovable Project:\n' +
          proof.lovableLink + '\n\n' +
          'GitHub Repository:\n' +
          proof.githubLink + '\n\n' +
          'Live Deployment:\n' +
          proof.deployedUrl + '\n\n' +
          'Core Features:\n' +
          '- Intelligent match scoring\n' +
          '- Daily digest simulation\n' +
          '- Status tracking\n' +
          '- Test checklist enforced\n';

        if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            showToast('Submission copied to clipboard.');
          }).catch(function () {
            showToast('Copy failed. Please try again.');
          });
        } else {
          showToast('Clipboard not available.');
        }
      });
    }

    if (shipButton) {
      shipButton.addEventListener('click', function () {
        if (!canShip()) {
          showToast('Complete all tests and provide all links to ship.');
          return;
        }

        proof.shipped = true;
        saveProofData(proof);
        updateStatusDisplay();
        showToast('Project 1 Shipped Successfully.');
      });
    }

    loadInputsFromLocalStorage();
  }

  function initialiseDigestRoute() {
    if (!pageContainer) {
      return;
    }

    var scope = pageContainer;
    var content = scope.querySelector('[data-digest-content]');
    var generateButton = scope.querySelector('[data-digest-generate]');
    var copyButton = scope.querySelector('[data-digest-copy]');
    var emailButton = scope.querySelector('[data-digest-email]');
    var dateLabel = scope.querySelector('[data-digest-date]');

    if (!content || !generateButton || !copyButton || !emailButton) {
      return;
    }

    var today = new Date();
    var dateDisplay = today.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    if (dateLabel) {
      dateLabel.textContent = dateDisplay;
    }

    function getTodayDigestKey() {
      var year = today.getFullYear();
      var month = String(today.getMonth() + 1).padStart(2, '0');
      var day = String(today.getDate()).padStart(2, '0');
      return 'jobTrackerDigest_' + year + '-' + month + '-' + day;
    }

    function loadTodayDigest() {
      var key = getTodayDigestKey();
      try {
        var raw = window.localStorage.getItem(key);
        if (!raw) {
          return null;
        }
        var parsed = JSON.parse(raw);
        if (!parsed || !Array.isArray(parsed.jobs)) {
          return null;
        }
        return parsed.jobs;
      } catch (e) {
        return null;
      }
    }

    function saveTodayDigest(entries) {
      var key = getTodayDigestKey();
      try {
        window.localStorage.setItem(key, JSON.stringify({ jobs: entries }));
      } catch (e) {
        // ignore
      }
    }

    var currentEntries = [];

    function renderDigest(entries, scoringPrefs) {
      currentEntries = entries.slice();

      if (!entries.length) {
        content.innerHTML =
          '<div class="page-empty page-empty--centered">' +
          '  <h2 class="page-empty__title">No matching roles today. Check again tomorrow.</h2>' +
          '</div>';
        copyButton.disabled = true;
        emailButton.disabled = true;
        return;
      }

      var htmlItems = [];
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        var job = getJobById(entry.id);
        if (!job) {
          continue;
        }
        var score = typeof entry.score === 'number' ? entry.score : computeMatchScore(job, scoringPrefs);
        htmlItems.push(
          '<article class="digest__item">' +
          '  <div class="digest__item-main">' +
          '    <h2 class="digest__item-title">' + job.title + '</h2>' +
          '    <div class="digest__item-meta">' + job.company + ' \u00b7 ' + job.location + ' \u00b7 ' + job.experience + ' years</div>' +
          '  </div>' +
          '  <div class="digest__item-side">' +
          '    <span class="badge badge--accent">' + String(score) + '% match</span>' +
          '    <button class="btn btn--primary btn--sm" type="button" data-digest-apply-id="' + job.id + '">Apply</button>' +
          '  </div>' +
          '</article>'
        );
      }

      if (!htmlItems.length) {
        content.innerHTML =
          '<div class="page-empty page-empty--centered">' +
          '  <h2 class="page-empty__title">No matching roles today. Check again tomorrow.</h2>' +
          '</div>';
        copyButton.disabled = true;
        emailButton.disabled = true;
        return;
      }

      var updatesHtml = '';
      try {
        var rawHistory = window.localStorage.getItem(STATUS_HISTORY_KEY);
        var history = rawHistory ? JSON.parse(rawHistory) : [];
        if (Array.isArray(history) && history.length) {
          var items = [];
          for (var h = 0; h < Math.min(history.length, 10); h++) {
            var record = history[h];
            var histJob = getJobById(record.jobId);
            if (!histJob) {
              continue;
            }
            var date = new Date(record.changedAt);
            var dateText = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
            items.push(
              '<li class="digest__updates-item">' +
              '<span>' + histJob.title + ' \u2014 ' + histJob.company + '</span>' +
              '<span>' + record.status + ' \u00b7 ' + dateText + '</span>' +
              '</li>'
            );
          }
          if (items.length) {
            updatesHtml =
              '<section class="digest__updates">' +
              '  <h2 class="page-empty__title">Recent Status Updates</h2>' +
              '  <ul class="digest__updates-list">' +
              items.join('') +
              '  </ul>' +
              '</section>';
          }
        }
      } catch (e) {
        // ignore history issues
      }

      content.innerHTML =
        '<div class="digest__list">' +
        htmlItems.join('') +
        '</div>' +
        (updatesHtml || '');

      copyButton.disabled = false;
      emailButton.disabled = false;
    }

    function buildDigestText(entries) {
      var lines = [];
      lines.push('Top 10 Jobs For You \u2014 9AM Digest');
      lines.push(dateDisplay);
      lines.push('');

      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        var job = getJobById(entry.id);
        if (!job) {
          continue;
        }
        var score = typeof entry.score === 'number' ? entry.score : computeMatchScore(job, buildScoringPreferences(getPreferences()));
        lines.push(String(i + 1) + ') ' + job.title + ' \u2014 ' + job.company);
        lines.push('   Location: ' + job.location);
        lines.push('   Experience: ' + job.experience + ' years');
        lines.push('   Match Score: ' + String(score) + '%');
        lines.push('   Apply: ' + job.applyUrl);
        lines.push('');
      }

      lines.push('This digest was generated based on your preferences.');
      lines.push('Demo Mode: Daily 9AM trigger simulated manually.');
      return lines.join('\n');
    }

    var prefs = getPreferences();
    var scoringPrefs = buildScoringPreferences(prefs);
    var hasPrefs = hasScoringPreferences(scoringPrefs);

    if (!hasPrefs) {
      content.innerHTML =
        '<div class="page-empty page-empty--centered">' +
        '  <h2 class="page-empty__title">Set preferences to generate a personalized digest.</h2>' +
        '</div>';
      generateButton.disabled = true;
      copyButton.disabled = true;
      emailButton.disabled = true;
      return;
    }

    generateButton.disabled = false;
    copyButton.disabled = true;
    emailButton.disabled = true;

    var existing = loadTodayDigest();
    if (existing && existing.length) {
      renderDigest(existing, scoringPrefs);
    }

    generateButton.addEventListener('click', function () {
      var currentPrefs = getPreferences();
      var currentScoringPrefs = buildScoringPreferences(currentPrefs);

      var existingNow = loadTodayDigest();
      if (existingNow && existingNow.length) {
        renderDigest(existingNow, currentScoringPrefs);
        return;
      }

      var scored = [];
      for (var i = 0; i < jobs.length; i++) {
        var job = jobs[i];
        var score = computeMatchScore(job, currentScoringPrefs);
        scored.push({ job: job, score: score });
      }

      scored = scored.filter(function (entry) {
        return entry.score > 0;
      });

      if (!scored.length) {
        renderDigest([], currentScoringPrefs);
        saveTodayDigest([]);
        return;
      }

      scored.sort(function (a, b) {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.job.postedDaysAgo - b.job.postedDaysAgo;
      });

      var top = scored.slice(0, 10);
      var entries = top.map(function (entry) {
        return { id: entry.job.id, score: entry.score };
      });

      saveTodayDigest(entries);
      renderDigest(entries, currentScoringPrefs);
    });

    copyButton.addEventListener('click', function () {
      if (!currentEntries.length) {
        return;
      }
      var text = buildDigestText(currentEntries);
      if (!text) {
        return;
      }
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function () {
          // ignore clipboard failure
        });
      }
    });

    emailButton.addEventListener('click', function () {
      if (!currentEntries.length) {
        return;
      }
      var text = buildDigestText(currentEntries);
      if (!text) {
        return;
      }
      var subject = encodeURIComponent('My 9AM Job Digest');
      var body = encodeURIComponent(text);
      window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
    });

    content.addEventListener('click', function (event) {
      var target = event.target;
      var button = target && target.closest('[data-digest-apply-id]');
      if (!button) {
        return;
      }
      var jobId = button.getAttribute('data-digest-apply-id');
      if (!jobId) {
        return;
      }
      var job = getJobById(jobId);
      if (!job) {
        return;
      }
      window.open(job.applyUrl, '_blank', 'noopener');
    });
  }

  function initialiseRoute(path) {
    if (path === '/dashboard') {
      initialiseDashboardRoute();
    } else if (path === '/saved') {
      initialiseSavedRoute();
    } else if (path === '/settings') {
      initialiseSettingsRoute();
    } else if (path === '/digest') {
      initialiseDigestRoute();
    } else if (path === '/jt/07-test') {
      initialiseTestRoute();
    } else if (path === '/jt/proof') {
      initialiseProofRoute();
    }
  }

  function getView(path) {
    if (path === '/') {
      return '' +
        '<section class="hero" aria-labelledby="landing-title">' +
        '  <h1 id="landing-title" class="hero__title">Stop Missing The Right Jobs.</h1>' +
        '  <p class="hero__subtitle">Precision-matched job discovery delivered daily at 9AM.</p>' +
        '  <div class="hero__actions">' +
        '    <button class="btn btn--primary" type="button" data-route-to="/settings">Start Tracking</button>' +
        '  </div>' +
        '</section>';
    }

    if (path === '/settings') {
      return '' +
        '<section class="settings" aria-labelledby="settings-title">' +
        '  <h1 id="settings-title" class="settings__title">Settings</h1>' +
        '  <p class="settings__subtitle">Tell Job Notification Tracker what you are looking for so that matches feel intentional rather than noisy.</p>' +
        '  <form class="settings__form" data-settings-form novalidate>' +
        '    <div class="settings__group">' +
        '      <label class="settings__label" for="settings-role-keywords">Role keywords</label>' +
        '      <input id="settings-role-keywords" class="settings__input" type="text" placeholder="e.g. SDE Intern, React Developer, Data Analyst" data-pref-role-keywords />' +
        '      <p class="settings__hint">Comma-separated roles you actively want to track.</p>' +
        '    </div>' +
        '    <div class="settings__group">' +
        '      <label class="settings__label" for="settings-locations">Preferred locations</label>' +
        '      <select id="settings-locations" class="settings__select" multiple data-pref-locations></select>' +
        '      <p class="settings__hint">Select one or more cities or regions that work for you.</p>' +
        '    </div>' +
        '    <div class="settings__group">' +
        '      <span class="settings__label">Mode</span>' +
        '      <p class="settings__hint">You can choose more than one preferred work mode.</p>' +
        '      <label class="settings__hint">' +
        '        <input type="checkbox" value="Remote" data-pref-mode /> Remote' +
        '      </label>' +
        '      <label class="settings__hint">' +
        '        <input type="checkbox" value="Hybrid" data-pref-mode /> Hybrid' +
        '      </label>' +
        '      <label class="settings__hint">' +
        '        <input type="checkbox" value="Onsite" data-pref-mode /> Onsite' +
        '      </label>' +
        '    </div>' +
        '    <div class="settings__group">' +
        '      <label class="settings__label" for="settings-experience">Experience level</label>' +
        '      <select id="settings-experience" class="settings__select" data-pref-experience>' +
        '        <option value="">Any</option>' +
        '        <option value="Fresher">Fresher</option>' +
        '        <option value="0-1">0-1</option>' +
        '        <option value="1-3">1-3</option>' +
        '        <option value="3-5">3-5</option>' +
        '      </select>' +
        '      <p class="settings__hint">Select the level that best matches what you are targeting.</p>' +
        '    </div>' +
        '    <div class="settings__group">' +
        '      <label class="settings__label" for="settings-skills">Skills</label>' +
        '      <input id="settings-skills" class="settings__input" type="text" placeholder="e.g. Java, React, SQL, Python" data-pref-skills />' +
        '      <p class="settings__hint">Comma-separated skills you want the role to lean on.</p>' +
        '    </div>' +
        '    <div class="settings__group">' +
        '      <label class="settings__label" for="settings-min-score">Minimum match score</label>' +
        '      <input id="settings-min-score" class="settings__input" type="range" min="0" max="100" step="5" data-pref-min-score />' +
        '      <p class="settings__hint">Current threshold: <span data-pref-min-score-label>40</span>%</p>' +
        '    </div>' +
        '  </form>' +
        '</section>';
    }

    if (path === '/dashboard') {
      return '' +
        '<section class="dashboard" aria-labelledby="dashboard-title">' +
        '  <div class="dashboard__header">' +
        '    <h1 id="dashboard-title" class="app-page__title">Dashboard</h1>' +
        '    <p class="app-page__subtitle">Browse today\u2019s matches and keep track of roles that matter.</p>' +
        '  </div>' +
        '  <div class="page-empty" data-preferences-banner>' +
        '    <p class="page-empty__body">Set your preferences to activate intelligent matching.</p>' +
        '  </div>' +
        '  <div class="dashboard__filters filter-bar" aria-label="Job filters">' +
        '    <div class="filter-bar__group">' +
        '      <label class="filter-bar__label" for="filter-keyword">Keyword</label>' +
        '      <input id="filter-keyword" class="filter-bar__control" type="search" placeholder="Search by title or company" data-filter-keyword />' +
        '    </div>' +
        '    <div class="filter-bar__group">' +
        '      <label class="filter-bar__label" for="filter-location">Location</label>' +
        '      <select id="filter-location" class="filter-bar__control" data-filter-location></select>' +
        '    </div>' +
        '    <div class="filter-bar__group">' +
        '      <label class="filter-bar__label" for="filter-mode">Mode</label>' +
        '      <select id="filter-mode" class="filter-bar__control" data-filter-mode></select>' +
        '    </div>' +
        '    <div class="filter-bar__group">' +
        '      <label class="filter-bar__label" for="filter-experience">Experience</label>' +
        '      <select id="filter-experience" class="filter-bar__control" data-filter-experience></select>' +
        '    </div>' +
        '    <div class="filter-bar__group">' +
        '      <label class="filter-bar__label" for="filter-source">Source</label>' +
        '      <select id="filter-source" class="filter-bar__control" data-filter-source></select>' +
        '    </div>' +
        '    <div class="filter-bar__group">' +
        '      <label class="filter-bar__label" for="filter-sort">Sort</label>' +
        '      <select id="filter-sort" class="filter-bar__control" data-filter-sort>' +
        '        <option value="latest">Latest</option>' +
        '        <option value="match">Match score</option>' +
        '        <option value="salary">Salary (high to low)</option>' +
        '        <option value="oldest">Oldest</option>' +
        '      </select>' +
        '    </div>' +
        '    <div class="filter-bar__group">' +
        '      <label class="filter-bar__label" for="filter-status">Status</label>' +
        '      <select id="filter-status" class="filter-bar__control" data-filter-status>' +
        '        <option value="">All</option>' +
        '        <option value="Not Applied">Not Applied</option>' +
        '        <option value="Applied">Applied</option>' +
        '        <option value="Rejected">Rejected</option>' +
        '        <option value="Selected">Selected</option>' +
        '      </select>' +
        '    </div>' +
        '    <div class="filter-bar__group">' +
        '      <label class="filter-bar__label">' +
        '        <input type="checkbox" data-toggle-matches /> Show only jobs above my threshold' +
        '      </label>' +
        '    </div>' +
        '  </div>' +
        '  <div class="dashboard__results" data-jobs-container></div>' +
        '  <div class="job-modal" data-job-modal>' +
        '    <div class="job-modal__dialog">' +
        '      <h2 class="job-modal__title" data-modal-title></h2>' +
        '      <p class="job-modal__subtitle" data-modal-subtitle></p>' +
        '      <div>' +
        '        <div class="job-modal__section-title">Role overview</div>' +
        '        <div class="job-modal__description" data-modal-description></div>' +
        '      </div>' +
        '      <div>' +
        '        <div class="job-modal__section-title">Key skills</div>' +
        '        <div class="job-modal__skills" data-modal-skills></div>' +
        '      </div>' +
        '      <div class="job-modal__footer">' +
        '        <button class="btn btn--tertiary btn--sm" type="button" data-modal-close>Close</button>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</section>';
    }

    if (path === '/saved') {
      return '' +
        '<section class="saved" aria-labelledby="saved-title">' +
        '  <div class="saved__header">' +
        '    <h1 id="saved-title" class="app-page__title">Saved jobs</h1>' +
        '    <p class="app-page__subtitle">Keep roles you care about in one calm, focused view.</p>' +
        '  </div>' +
        '  <div class="page-empty page-empty--centered" data-saved-empty>' +
        '    <h2 class="page-empty__title">Nothing saved yet</h2>' +
        '    <p class="page-empty__body">As you mark roles to revisit, they will appear here for a more intentional review session.</p>' +
        '  </div>' +
        '  <div class="dashboard__results" data-saved-container></div>' +
        '  <div class="job-modal" data-job-modal>' +
        '    <div class="job-modal__dialog">' +
        '      <h2 class="job-modal__title" data-modal-title></h2>' +
        '      <p class="job-modal__subtitle" data-modal-subtitle></p>' +
        '      <div>' +
        '        <div class="job-modal__section-title">Role overview</div>' +
        '        <div class="job-modal__description" data-modal-description></div>' +
        '      </div>' +
        '      <div>' +
        '        <div class="job-modal__section-title">Key skills</div>' +
        '        <div class="job-modal__skills" data-modal-skills></div>' +
        '      </div>' +
        '      <div class="job-modal__footer">' +
        '        <button class="btn btn--tertiary btn--sm" type="button" data-modal-close>Close</button>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</section>';
    }

    if (path === '/digest') {
      return '' +
        '<section class="digest" aria-labelledby="digest-title">' +
        '  <div class="digest__card">' +
        '    <header class="digest__header">' +
        '      <h1 id="digest-title" class="app-page__title">Top 10 Jobs For You \u2014 9AM Digest</h1>' +
        '      <p class="app-page__subtitle" data-digest-date></p>' +
        '    </header>' +
        '    <p class="digest__note">Demo Mode: Daily 9AM trigger simulated manually.</p>' +
        '    <div class="digest__actions">' +
        '      <button class="btn btn--primary btn--sm" type="button" data-digest-generate>Generate Today\'s 9AM Digest (Simulated)</button>' +
        '      <button class="btn btn--secondary btn--sm" type="button" data-digest-copy disabled>Copy Digest to Clipboard</button>' +
        '      <button class="btn btn--tertiary btn--sm" type="button" data-digest-email disabled>Create Email Draft</button>' +
        '    </div>' +
        '    <div class="digest__content" data-digest-content></div>' +
        '    <footer class="digest__footer">' +
        '      <p class="page-empty__body">This digest was generated based on your preferences.</p>' +
        '    </footer>' +
        '  </div>' +
        '</section>';
    }

    if (path === '/jt/07-test') {
  var counts = countTestChecklist();
  var summaryText = counts.passed + ' / ' + counts.total;

  function testItem(id, text, hint) {
    return '' +
      '<li class="card test-checklist__item">' +
      '  <label class="test-checklist__label" style="display:flex;justify-content:space-between;align-items:center;width:100%;">' +
      '    <span>' +
      '      <input type="checkbox" class="test-checklist__checkbox" data-test-id="' + id + '" /> ' + text +
      '    </span>' +
      '    <span class="test-checklist__hint" title="' + hint + '">How to test</span>' +
      '  </label>' +
      '</li>';
  }

  return '' +
    '<section class="test-checklist" aria-labelledby="test-title">' +
    '  <div class="test-checklist__card">' +
    '    <header class="test-checklist__header">' +
    '      <h1 id="test-title" class="app-page__title">Built-In Test Checklist</h1>' +
    '      <p class="test-checklist__summary">Tests Passed: <span data-test-passed-count>' + summaryText + '</span></p>' +
    '    </header>' +
    '    <p class="test-checklist__warning" data-test-warning>Resolve all issues before shipping.</p>' +
    '    <ul class="test-checklist__list" data-test-list>' +

      testItem('preferencesPersist','Preferences persist after refresh','Set preferences, refresh, and confirm they are still filled in.') +
      testItem('matchScoreCorrect','Match score calculates correctly','Use a simple preference set and verify scores match the documented rules.') +
      testItem('toggleWorks','"Show only matches" toggle works','Turn toggle on/off and verify filtering.') +
      testItem('savePersists','Save job persists after refresh','Save job and refresh page.') +
      testItem('applyOpens','Apply opens in new tab','Click Apply and confirm new tab.') +
      testItem('statusPersists','Status update persists after refresh','Change status and refresh.') +
      testItem('statusFilter','Status filter works correctly','Filter by each status.') +
      testItem('digestTop10','Digest generates top 10 by score','Verify highest scoring roles appear first.') +
      testItem('digestPersists','Digest persists for the day','Generate digest and refresh.') +
      testItem('noConsoleErrors','No console errors on main pages','Open DevTools and check console.') +

    '    </ul>' +
    '    <div class="test-checklist__actions">' +
    '      <button class="btn btn--tertiary btn--sm" type="button" data-test-reset>Reset Test Status</button>' +
    '    </div>' +
    '  </div>' +
    '</section>';
    }

    if (path === '/jt/proof') {
      var proof = getProofData();
      var testCounts = countTestChecklist();
      var projectStatus = getProjectStatus();
      
      var stepsHtml = '' +
        '<div class="proof__section">' +
        '  <h2 class="proof__section-title">Step Completion Summary</h2>' +
        '  <ul class="proof__steps">' +
        '    <li class="proof__step"><span class="proof__step-label">1. Dashboard & Filtering</span><span class="proof__step-status">✓ Completed</span></li>' +
        '    <li class="proof__step"><span class="proof__step-label">2. Saved Jobs</span><span class="proof__step-status">✓ Completed</span></li>' +
        '    <li class="proof__step"><span class="proof__step-label">3. Preferences & Settings</span><span class="proof__step-status">✓ Completed</span></li>' +
        '    <li class="proof__step"><span class="proof__step-label">4. Status Tracking</span><span class="proof__step-status">✓ Completed</span></li>' +
        '    <li class="proof__step"><span class="proof__step-label">5. Digest Generation</span><span class="proof__step-status">✓ Completed</span></li>' +
        '    <li class="proof__step"><span class="proof__step-label">6. Persistent State</span><span class="proof__step-status">✓ Completed</span></li>' +
        '    <li class="proof__step"><span class="proof__step-label">7. Test Checklist</span><span class="proof__step-status">' + (testCounts.passed === testCounts.total ? '✓ Completed' : '⊘ ' + testCounts.passed + '/' + testCounts.total) + '</span></li>' +
        '    <li class="proof__step"><span class="proof__step-label">8. Proof & Submission</span><span class="proof__step-status">In Progress</span></li>' +
        '  </ul>' +
        '</div>';

      var linksHtml = '' +
        '<div class="proof__section">' +
        '  <h2 class="proof__section-title">Artifact Collection</h2>' +
        '  <div class="proof__inputs">' +
        '    <div class="proof__input-group">' +
        '      <label class="proof__label" for="proof-lovable">Lovable Project Link</label>' +
        '      <input id="proof-lovable" class="proof__input" type="url" placeholder="https://lovable.dev/..." data-proof-lovable />' +
        '      <p class="proof__hint">Link to your Lovable project.</p>' +
        '    </div>' +
        '    <div class="proof__input-group">' +
        '      <label class="proof__label" for="proof-github">GitHub Repository Link</label>' +
        '      <input id="proof-github" class="proof__input" type="url" placeholder="https://github.com/..." data-proof-github />' +
        '      <p class="proof__hint">Link to your GitHub repository.</p>' +
        '    </div>' +
        '    <div class="proof__input-group">' +
        '      <label class="proof__label" for="proof-deploy">Deployed URL</label>' +
        '      <input id="proof-deploy" class="proof__input" type="url" placeholder="https://..." data-proof-deploy />' +
        '      <p class="proof__hint">Live deployment URL (Vercel or equivalent).</p>' +
        '    </div>' +
        '  </div>' +
        '</div>';

      var actionsHtml = '' +
        '<div class="proof__actions">' +
        '  <button class="btn btn--secondary btn--sm" type="button" data-proof-copy' + (!allLinksProvided(proof) ? ' disabled' : '') + '>Copy Final Submission</button>' +
        '  <button class="btn btn--primary btn--sm" type="button" data-proof-ship' + (!canShip() ? ' disabled' : '') + '>Mark as Shipped</button>' +
        '</div>';

      return '' +
        '<section class="proof" aria-labelledby="proof-title">' +
        '  <div class="proof__card">' +
        '    <header class="proof__header">' +
        '      <h1 id="proof-title" class="app-page__title">Project 1 — Job Notification Tracker</h1>' +
        '      <p class="proof__subtitle">' +
        '        Status: <span class="proof__status-badge proof__status-' + projectStatus.toLowerCase().replace(' ', '-') + '" data-proof-status>' + projectStatus + '</span>' +
        '      </p>' +
        '      <p class="proof__summary" data-proof-summary style="display:none; margin-top: 8px; color: var(--color-text-secondary);">Project 1 Shipped Successfully.</p>' +
        '    </header>' +
        stepsHtml +
        linksHtml +
        actionsHtml +
        '  </div>' +
        '</section>';
    }

    if (path === '/jt/08-ship') {
      if (!allTestsPassed()) {
        return '' +
          '<section class="test-checklist" aria-labelledby="ship-locked-title">' +
          '  <div class="test-checklist__card">' +
          '    <h1 id="ship-locked-title" class="app-page__title">Ship Step Locked</h1>' +
          '    <p class="app-page__subtitle">Complete all items in the Built-In Test Checklist before shipping.</p>' +
          '    <p class="page-empty__body">Go to <code>/jt/07-test</code> to review and complete the test checklist.</p>' +
          '  </div>' +
          '</section>';
      }

      return '' +
        '<section class="test-checklist" aria-labelledby="ship-title">' +
        '  <div class="test-checklist__card">' +
        '    <h1 id="ship-title" class="app-page__title">Ready to Ship</h1>' +
        '    <p class="app-page__subtitle">All built-in tests have passed. You can confidently move this build towards shipping.</p>' +
        '  </div>' +
        '</section>';
    }
    if (path === '/proof') {
      return '' +
        '<section class="proof" aria-labelledby="proof-title">' +
        '  <h1 id="proof-title" class="proof__title">Proof of performance</h1>' +
        '  <p class="proof__body">This page will collect artifacts that show how well Job Notification Tracker is working \u2014 links, screenshots, and notes. For now, it\u2019s a placeholder only.</p>' +
        '</section>';
    }

    return '' +
      '<section class="page-empty page-empty--centered" aria-labelledby="not-found-title">' +
      '  <h1 id="not-found-title" class="page-empty__title">Page not found</h1>' +
      '  <p class="page-empty__body">This route is not configured yet.</p>' +
      '</section>';
  }

  function render(path) {
    if (!pageContainer) {
      return;
    }

    var normalised = normalisePath(path);
    var exists = !!routes[normalised];

    if (!exists) {
      normalised = '/';
      history.replaceState({}, '', '/');
    }

    pageContainer.innerHTML = getView(normalised);
    setActiveLink(normalised);
    initialiseRoute(normalised);
  }

  function handleLinkClick(event) {
    event.preventDefault();
    var link = event.currentTarget;
    var targetPath = link.getAttribute('href');

    if (!targetPath) {
      return;
    }

    if (window.location.pathname !== targetPath) {
      history.pushState({}, '', targetPath);
    }
    render(targetPath);

    if (nav && nav.classList.contains('app-nav--open')) {
      nav.classList.remove('app-nav--open');
    }
  }

  navLinks.forEach(function (link) {
    link.addEventListener('click', handleLinkClick);
  });

  window.addEventListener('popstate', function () {
    render(window.location.pathname);
  });

  if (toggleButton && nav) {
    toggleButton.addEventListener('click', function () {
      nav.classList.toggle('app-nav--open');
    });
  }

  document.addEventListener('click', function (event) {
    if (!nav) {
      return;
    }

    if (!nav.contains(event.target) && nav.classList.contains('app-nav--open')) {
      nav.classList.remove('app-nav--open');
    }
  });

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.hasAttribute('data-route-to')) {
      return;
    }

    var targetPath = target.getAttribute('data-route-to');
    if (!targetPath) {
      return;
    }

    event.preventDefault();

    if (window.location.pathname !== targetPath) {
      history.pushState({}, '', targetPath);
    }

    render(targetPath);
  });

  render(window.location.pathname);
})();
