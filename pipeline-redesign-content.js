
  // ══════════════════════════════════════════════════
  //  PIPELINE — 6-stage client funding task system
  // ══════════════════════════════════════════════════

  var PIPELINE_STAGES = [
    { name: 'Initial Setup',      sub: 'Credit Review',
      color: '#3b82f6', light: '#eff6ff', border: '#bfdbfe',
      client:   ['Upload Experian Login Credentials','Confirm Personal Information','Upload ID + Proof of Address','Complete Onboarding Form'],
      internal: ['Pull Experian Report','Analyze Credit Profile','Identify Negative Items','Identify Inquiries','Calculate DTI'] },
    { name: 'Credit Optimization', sub: 'Remove & Repair',
      color: '#8b5cf6', light: '#f5f3ff', border: '#ddd6fe',
      client:   ['Confirm Dispute Authorization','Avoid New Credit Applications','Pay Down High Utilization Accounts'],
      internal: ['Remove Inquiries','Send Dispute Letters','Track Bureau Responses','Update Credit Status'] },
    { name: 'Funding Strategy',    sub: 'Plan & Sequence',
      color: '#f59e0b', light: '#fffbeb', border: '#fde68a',
      client:   ['Confirm Business Information','Provide Business Details','Approve Funding Plan'],
      internal: ['Build Funding Sequence','Select Target Banks','Set Application Order','Determine Application Numbers'] },
    { name: 'Bank Relationships',  sub: 'Open Accounts',
      color: '#10b981', light: '#ecfdf5', border: '#a7f3d0',
      client:   ['Open Business Bank Account','Deposit Required Funds','Confirm Account Opened','Maintain Required Balance'],
      internal: ['Assign Target Banks','Track Account Open Dates','Track Deposit Amounts','Monitor Relationship Age'] },
    { name: 'Application Phase',   sub: 'Submit & Track',
      color: '#f97316', light: '#fff7ed', border: '#fed7aa',
      client:   ['Attend Bank Appointment','Confirm Submission','Upload Requested Documents'],
      internal: ['Introduce Client to BRM','Submit Applications','Track Application Dates','Handle Reconsideration Calls'] },
    { name: 'Decision / Results',  sub: 'Approved & Funded',
      color: '#059669', light: '#ecfdf5', border: '#6ee7b7',
      client:   ['Accept Offer','Upload Approval Letters','Confirm Card Received'],
      internal: ['Log Approval Amounts','Update Funding Dashboard','Send Congratulations','Request Referrals'] }
  ];

  function getClientTasks(id) {
    try { return JSON.parse(localStorage.getItem('cq_tasks_' + id) || 'null'); } catch(e) { return null; }
  }
  function saveClientTasks(id, data) { localStorage.setItem('cq_tasks_' + id, JSON.stringify(data)); }
  function initClientTasks(id) {
    var t = getClientTasks(id);
    if (!t) { t = { stage: 0, checked: {}, assigned: {}, stageStartedAt: {} }; t.stageStartedAt[0] = Date.now(); saveClientTasks(id, t); }
    if (!t.assigned) { t.assigned = {}; saveClientTasks(id, t); }
    if (!t.stageStartedAt) { t.stageStartedAt = {}; t.stageStartedAt[t.stage] = Date.now(); saveClientTasks(id, t); }
    return t;
  }

  function plGetProgress(id, stageIdx) {
    var t = initClientTasks(id);
    var s = PIPELINE_STAGES[stageIdx];
    var assigned = t.assigned[stageIdx] || [];
    var total = assigned.length + s.internal.length;
    var done = 0;
    assigned.forEach(function(i){ if(t.checked['s'+stageIdx+'c'+i]) done++; });
    s.internal.forEach(function(_,i){ if(t.checked['s'+stageIdx+'i'+i]) done++; });
    return { total: total, done: done };
  }

  function plDaysInStage(id, stageIdx) {
    var t = getClientTasks(id);
    if (!t || !t.stageStartedAt || !t.stageStartedAt[stageIdx]) return null;
    return Math.floor((Date.now() - t.stageStartedAt[stageIdx]) / 86400000);
  }

  function plDaysBadge(days) {
    if (days === null) return '';
    if (days <= 2) return '<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:#f1f5f9;color:#64748b">' + days + 'd</span>';
    if (days <= 6) return '<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:#fef3c7;color:#92400e">' + days + 'd &#x26A0;</span>';
    return '<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px;background:#fee2e2;color:#991b1b">' + days + 'd &#x26A0;</span>';
  }

  function plInitials(c) {
    return ((c.fname||'?')[0] + (c.lname||'?')[0]).toUpperCase();
  }

  function renderPipeline() {
    var wrap = document.getElementById('pipeline-board-wrap');
    if (!wrap) return;
    var active = clients.filter(function(c){ return !c.archived; });
    var unstarted = active.filter(function(c){ return !getClientTasks(c.id); });

    // ── Summary bar ───────────────────────────────────────────────────────
    var totalActive = active.length;
    var stageCounts = PIPELINE_STAGES.map(function(_, si){
      return active.filter(function(c){ var t=getClientTasks(c.id); return t && t.stage===si; }).length;
    });
    var totalTasks = 0, doneTasks = 0;
    active.forEach(function(c){
      var t = getClientTasks(c.id);
      if (!t) return;
      PIPELINE_STAGES.forEach(function(_, si){
        var p = plGetProgress(c.id, si);
        totalTasks += p.total;
        doneTasks  += p.done;
      });
    });
    var overallPct = totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) : 0;

    var summaryBar = '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;align-items:center">'
      + '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:10px;padding:8px 16px;display:flex;align-items:center;gap:8px">'
      + '<span style="font-size:22px;font-weight:800;color:#0f2044;font-family:var(--font-h)">' + totalActive + '</span>'
      + '<span style="font-size:11px;font-weight:600;color:#64748b;line-height:1.3">Active<br>Clients</span></div>'
      + PIPELINE_STAGES.map(function(s, si){
          return '<div style="background:' + s.light + ';border:1.5px solid ' + s.border + ';border-radius:10px;padding:8px 14px;display:flex;align-items:center;gap:7px;cursor:pointer" onclick="document.querySelectorAll(\'.pl-col\')[' + (si+1) + '].scrollIntoView({behavior:\'smooth\',inline:\'center\'})">'
            + '<span style="font-size:11px;font-weight:800;color:' + s.color + ';background:' + s.color + '22;padding:2px 7px;border-radius:12px">S' + (si+1) + '</span>'
            + '<span style="font-size:11px;font-weight:600;color:#0f2044">' + stageCounts[si] + '</span>'
            + '<span style="font-size:10px;color:#64748b;white-space:nowrap">' + s.name + '</span></div>';
        }).join('')
      + '<div style="margin-left:auto;background:#fff;border:1.5px solid #e2e8f0;border-radius:10px;padding:8px 16px;min-width:130px">'
      + '<div style="font-size:10px;font-weight:700;color:#64748b;margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em">Overall Progress</div>'
      + '<div style="height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;margin-bottom:4px"><div style="height:100%;background:#3b82f6;border-radius:99px;width:' + overallPct + '%"></div></div>'
      + '<div style="font-size:12px;font-weight:700;color:#0f2044">' + overallPct + '% complete</div>'
      + '</div>'
      + '</div>';

    // ── Stage columns ─────────────────────────────────────────────────────
    var cols = PIPELINE_STAGES.map(function(stage, si) {
      var stageClients = active.filter(function(c){
        var t = getClientTasks(c.id);
        return t && t.stage === si;
      });
      var cards = stageClients.length
        ? stageClients.map(function(c) {
            var p = plGetProgress(c.id, si);
            var pct = p.total ? Math.round(p.done/p.total*100) : 0;
            var days = plDaysInStage(c.id, si);
            var daysBadge = plDaysBadge(days);
            var initials = plInitials(c);
            return '<div class="pl-card" onclick="openTaskModal(\'' + c.id + '\')" style="border-left:3px solid ' + stage.color + '">'
              + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:7px">'
              + '<div style="width:30px;height:30px;border-radius:8px;background:' + stage.light + ';color:' + stage.color + ';font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">' + initials + '</div>'
              + '<div style="flex:1;min-width:0"><div class="pl-card-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + c.fname + ' ' + c.lname + '</div>'
              + '<div style="font-size:10px;color:#64748b">' + (c.fico ? 'FICO ' + c.fico : c.email || '—') + '</div></div>'
              + daysBadge + '</div>'
              + '<div class="pl-prog-bar"><div class="pl-prog-fill" style="width:' + pct + '%;background:' + stage.color + '"></div></div>'
              + '<div style="display:flex;justify-content:space-between;margin-top:4px"><span class="pl-prog-label">' + p.done + '/' + p.total + ' tasks</span><span style="font-size:10px;font-weight:700;color:' + stage.color + '">' + pct + '%</span></div>'
              + '</div>';
          }).join('')
        : '<div style="font-size:11px;color:#94a3b8;text-align:center;padding:16px 0;font-style:italic">No clients</div>';

      return '<div class="pl-col" style="border-top:3px solid ' + stage.color + '">'
        + '<div class="pl-col-head" style="margin-bottom:12px">'
        + '<div><div style="font-size:11px;font-weight:800;color:#0f2044">' + stage.name + '</div>'
        + '<div style="font-size:10px;color:#94a3b8;margin-top:1px">' + stage.sub + '</div></div>'
        + '<span class="pl-col-badge" style="background:' + stage.color + '">' + stageClients.length + '</span>'
        + '</div>' + cards + '</div>';
    }).join('');

    // ── Not started column ────────────────────────────────────────────────
    var unCards = unstarted.length
      ? unstarted.map(function(c){
          return '<div class="pl-card" onclick="openTaskModal(\'' + c.id + '\')">'
            + '<div style="display:flex;align-items:center;gap:8px">'
            + '<div style="width:30px;height:30px;border-radius:8px;background:#f1f5f9;color:#64748b;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">' + plInitials(c) + '</div>'
            + '<div><div class="pl-card-name">' + c.fname + ' ' + c.lname + '</div>'
            + '<div style="font-size:10px;color:#94a3b8">' + (c.fico ? 'FICO ' + c.fico : c.email || '—') + '</div></div></div>'
            + '<div style="font-size:11px;color:#3b82f6;font-weight:700;margin-top:8px">Start Pipeline &#x2192;</div>'
            + '</div>';
        }).join('')
      : '<div style="font-size:11px;color:#94a3b8;text-align:center;padding:16px 0;font-style:italic">All in pipeline</div>';

    var unCol = '<div class="pl-col" style="border-top:3px solid #94a3b8">'
      + '<div class="pl-col-head" style="margin-bottom:12px">'
      + '<div><div style="font-size:11px;font-weight:800;color:#0f2044">Not Started</div>'
      + '<div style="font-size:10px;color:#94a3b8;margin-top:1px">Awaiting kickoff</div></div>'
      + '<span class="pl-col-badge" style="background:#94a3b8">' + unstarted.length + '</span>'
      + '</div>' + unCards + '</div>';

    wrap.innerHTML = summaryBar + '<div class="pl-board">' + unCol + cols + '</div>';
  }

  function openTaskModal(clientId) { renderTaskModal(clientId, initClientTasks(clientId).stage); }

  function renderTaskModal(clientId, viewStage) {
    var old = document.getElementById('pl-modal-bg');
    if (old) old.remove();
    var c = getClient(clientId);
    var t2 = initClientTasks(clientId);
    var stage = PIPELINE_STAGES[viewStage];

    var stageNav = PIPELINE_STAGES.map(function(s, si) {
      var p = plGetProgress(clientId, si);
      var allDone = p.total > 0 && p.done === p.total;
      var cls = si === viewStage ? 'active' : (allDone ? 'done' : '');
      var style = si === viewStage ? 'background:' + s.color + ';border-color:' + s.color + ';color:#fff' : '';
      return '<span class="pl-stage-pill ' + cls + '" style="' + style + '" onclick="renderTaskModal(\'' + clientId + '\',' + si + ')">S' + (si+1) + '</span>';
    }).join('');

    var assigned = t2.assigned[viewStage] || [];
    var p = plGetProgress(clientId, viewStage);
    var isCurrentStage = viewStage === t2.stage;
    var allInternalDone = stage.internal.every(function(_,i){ return t2.checked['s'+viewStage+'i'+i]; });
    var allClientDone   = assigned.length === 0 || assigned.every(function(i){ return t2.checked['s'+viewStage+'c'+i]; });
    var canAdvance = isCurrentStage && allInternalDone && allClientDone;
    var isFinal = viewStage === PIPELINE_STAGES.length - 1;
    var days = plDaysInStage(clientId, viewStage);
    var pct = p.total ? Math.round(p.done/p.total*100) : 0;

    var intRows = stage.internal.map(function(task, i) {
      var key = 's' + viewStage + 'i' + i;
      var chk = t2.checked[key];
      return '<div class="pl-task-row' + (chk ? ' done' : '') + '" onclick="plToggle(\'' + clientId + '\',\'' + key + '\',' + viewStage + ')">'
        + '<input type="checkbox" id="plt-' + key + '"' + (chk ? ' checked' : '') + ' onchange="plToggle(\'' + clientId + '\',\'' + key + '\',' + viewStage + ')" onclick="event.stopPropagation()">'
        + '<label for="plt-' + key + '">' + task + '</label></div>';
    }).join('');

    var clientRows = assigned.length
      ? assigned.map(function(idx) {
          var key = 's' + viewStage + 'c' + idx;
          var chk = t2.checked[key];
          return '<div class="pl-task-row' + (chk ? ' done' : '') + '" onclick="plToggle(\'' + clientId + '\',\'' + key + '\',' + viewStage + ')">'
            + '<input type="checkbox" id="plt-' + key + '"' + (chk ? ' checked' : '') + ' onchange="plToggle(\'' + clientId + '\',\'' + key + '\',' + viewStage + ')" onclick="event.stopPropagation()">'
            + '<label for="plt-' + key + '">' + stage.client[idx] + '</label></div>';
        }).join('')
      : '<div style="font-size:12px;color:#94a3b8;font-style:italic;padding:4px 0">No client tasks assigned yet</div>';

    var ddRows = stage.client.map(function(task, idx) {
      var isAssigned = assigned.indexOf(idx) !== -1;
      return '<div class="pl-assign-dd-row" onclick="plToggleAssign(\'' + clientId + '\',' + viewStage + ',' + idx + ')">'
        + '<input type="checkbox"' + (isAssigned ? ' checked' : '') + ' onchange="plToggleAssign(\'' + clientId + '\',' + viewStage + ',' + idx + ')" onclick="event.stopPropagation()">'
        + '<label>' + task + '</label></div>';
    }).join('');

    var bg = document.createElement('div');
    bg.id = 'pl-modal-bg';
    bg.className = 'pl-modal-bg';
    bg.onclick = function(e){ if(e.target === bg) bg.remove(); };
    bg.innerHTML = '<div class="pl-modal">'
      + '<div class="pl-modal-head" style="border-top:4px solid ' + stage.color + '">'
      + '<div style="display:flex;align-items:center;gap:12px">'
      + '<div style="width:40px;height:40px;border-radius:10px;background:' + stage.light + ';color:' + stage.color + ';font-size:14px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">' + plInitials(c) + '</div>'
      + '<div><div style="font-family:var(--font-h);font-size:17px;font-weight:800;color:var(--navy)">' + c.fname + ' ' + c.lname + '</div>'
      + '<div style="font-size:12px;color:#64748b;margin-top:2px;display:flex;align-items:center;gap:6px">Stage ' + (t2.stage+1) + ' of 6: ' + PIPELINE_STAGES[t2.stage].name
      + (days !== null ? ' &nbsp;' + plDaysBadge(days) : '') + '</div></div></div>'
      + '<button onclick="document.getElementById(\'pl-modal-bg\').remove()" style="width:32px;height:32px;border-radius:8px;border:none;background:#f1f5f9;cursor:pointer;font-size:18px;color:#64748b">&#x00D7;</button>'
      + '</div>'
      // Progress bar inside modal header
      + '<div style="height:4px;background:#e2e8f0"><div style="height:100%;background:' + stage.color + ';width:' + pct + '%;transition:width .3s"></div></div>'
      + '<div class="pl-stages-nav">' + stageNav + '</div>'
      + '<div class="pl-section-body">'
      + '<div style="font-family:var(--font-h);font-size:14px;font-weight:800;color:var(--navy);margin-bottom:14px;display:flex;align-items:center;gap:8px">'
      + '<span style="background:' + stage.color + ';color:#fff;font-size:11px;padding:3px 10px;border-radius:20px">S' + (viewStage+1) + '</span>'
      + stage.name + ' <span style="font-size:12px;font-weight:400;color:#94a3b8">— ' + stage.sub + '</span></div>'

      + '<div class="pl-group-label" style="color:' + stage.color + '"><svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg> INTERNAL TASKS <span style="font-size:10px;font-weight:600;color:#94a3b8">(admin completes)</span></div>'
      + intRows

      + '<div class="pl-group-label" style="margin-top:18px;color:' + stage.color + '"><svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> CLIENT TASKS <span style="font-size:10px;font-weight:600;color:#94a3b8">(you assign)</span></div>'
      + '<div class="pl-assign-btn" onclick="plToggleAssignDD(' + viewStage + ')" style="border-color:' + stage.color + ';color:' + stage.color + ';background:' + stage.light + '">'
      + '<svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg> Assign Client Tasks</div>'
      + '<div id="pl-assign-dd-' + viewStage + '" style="display:none" class="pl-assign-dd">' + ddRows + '</div>'
      + clientRows
      + '</div>'
      + '<button class="pl-advance-btn"' + (canAdvance ? '' : ' disabled') + ' onclick="plAdvance(\'' + clientId + '\',' + viewStage + ')" style="' + (canAdvance ? 'background:' + stage.color : '') + '">'
      + (isFinal ? '&#x1F389; Mark Complete — Client Funded!' : '&#x2705; Complete Stage &#x2192; Advance to S' + (viewStage+2))
      + '</button>'
      + '</div>';
    document.body.appendChild(bg);
  }

  function plToggleAssignDD(si) {
    var dd = document.getElementById('pl-assign-dd-' + si);
    if (dd) dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
  }

  function plToggleAssign(clientId, stageIdx, taskIdx) {
    var t = initClientTasks(clientId);
    if (!t.assigned[stageIdx]) t.assigned[stageIdx] = [];
    var arr = t.assigned[stageIdx];
    var pos = arr.indexOf(taskIdx);
    if (pos === -1) arr.push(taskIdx); else arr.splice(pos, 1);
    saveClientTasks(clientId, t);
    renderTaskModal(clientId, stageIdx);
    renderPipeline();
  }

  function plToggle(clientId, key, viewStage) {
    var t = initClientTasks(clientId);
    t.checked[key] = !t.checked[key];
    saveClientTasks(clientId, t);
    if (viewStage === t.stage) {
      var stage = PIPELINE_STAGES[viewStage];
      var assigned = t.assigned[viewStage] || [];
      var allInternalDone = stage.internal.every(function(_,i){ return t.checked['s'+viewStage+'i'+i]; });
      var allClientDone   = assigned.length === 0 || assigned.every(function(i){ return t.checked['s'+viewStage+'c'+i]; });
      if (allInternalDone && allClientDone) {
        setTimeout(function() { plAdvance(clientId, viewStage); }, 600);
        return;
      }
    }
    renderTaskModal(clientId, viewStage);
    renderPipeline();
  }

  function plAdvance(clientId, currentStage) {
    var t = initClientTasks(clientId);
    if (currentStage < PIPELINE_STAGES.length - 1) {
      t.stage = currentStage + 1;
      if (!t.stageStartedAt) t.stageStartedAt = {};
      t.stageStartedAt[t.stage] = Date.now();
      saveClientTasks(clientId, t);
      var d = getDashData(clientId);
      d.currentStage = t.stage + 1;
      saveDashData(clientId, d);
      renderTaskModal(clientId, t.stage);
    } else {
      t.stage = currentStage;
      saveClientTasks(clientId, t);
      var df = getDashData(clientId);
      df.currentStage = PIPELINE_STAGES.length;
      saveDashData(clientId, df);
      document.getElementById('pl-modal-bg').remove();
    }
    renderPipeline();
  }
