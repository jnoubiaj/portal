
  // ══════════════════════════════════════════════════
  //  PIPELINE — 6-stage client funding task system
  // ══════════════════════════════════════════════════

  var PIPELINE_STAGES = [
    { name: 'Initial Setup',       sub: 'Credit Review',
      color: '#3b82f6', light: '#eff6ff', border: '#bfdbfe', dark: '#1d4ed8',
      client:   ['Upload Experian Login Credentials','Confirm Personal Information','Upload ID + Proof of Address','Complete Onboarding Form'],
      internal: ['Pull Experian Report','Analyze Credit Profile','Identify Negative Items','Identify Inquiries','Calculate DTI'] },
    { name: 'Credit Optimization', sub: 'Remove & Repair',
      color: '#8b5cf6', light: '#f5f3ff', border: '#ddd6fe', dark: '#6d28d9',
      client:   ['Confirm Dispute Authorization','Avoid New Credit Applications','Pay Down High Utilization Accounts'],
      internal: ['Remove Inquiries','Send Dispute Letters','Track Bureau Responses','Update Credit Status'] },
    { name: 'Funding Strategy',    sub: 'Plan & Sequence',
      color: '#f59e0b', light: '#fffbeb', border: '#fde68a', dark: '#b45309',
      client:   ['Confirm Business Information','Provide Business Details','Approve Funding Plan'],
      internal: ['Build Funding Sequence','Select Target Banks','Set Application Order','Determine Application Numbers'] },
    { name: 'Bank Relationships',  sub: 'Open Accounts',
      color: '#10b981', light: '#ecfdf5', border: '#a7f3d0', dark: '#047857',
      client:   ['Open Business Bank Account','Deposit Required Funds','Confirm Account Opened','Maintain Required Balance'],
      internal: ['Assign Target Banks','Track Account Open Dates','Track Deposit Amounts','Monitor Relationship Age'] },
    { name: 'Application Phase',   sub: 'Submit & Track',
      color: '#f97316', light: '#fff7ed', border: '#fed7aa', dark: '#c2410c',
      client:   ['Attend Bank Appointment','Confirm Submission','Upload Requested Documents'],
      internal: ['Introduce Client to BRM','Submit Applications','Track Application Dates','Handle Reconsideration Calls'] },
    { name: 'Decision / Results',  sub: 'Approved & Funded',
      color: '#059669', light: '#ecfdf5', border: '#6ee7b7', dark: '#065f46',
      client:   ['Accept Offer','Upload Approval Letters','Confirm Card Received'],
      internal: ['Log Approval Amounts','Update Funding Dashboard','Send Congratulations','Request Referrals'] }
  ];

  function getClientTasks(id) {
    try { return JSON.parse(localStorage.getItem('cq_tasks_' + id) || 'null'); } catch(e) { return null; }
  }
  function saveClientTasks(id, data) { localStorage.setItem('cq_tasks_' + id, JSON.stringify(data)); }
  function initClientTasks(id) {
    var t = getClientTasks(id);
    if (!t) { t = { stage: 0, checked: {}, assigned: {}, stageStartedAt: {} }; t.stageStartedAt[0] = Date.now(); }
    if (!t.assigned) t.assigned = {};
    if (!t.stageStartedAt) { t.stageStartedAt = {}; t.stageStartedAt[t.stage] = Date.now(); }
    // Auto-assign ALL client tasks for current stage if not yet assigned
    if (!t.assigned[t.stage] || t.assigned[t.stage].length === 0) {
      t.assigned[t.stage] = PIPELINE_STAGES[t.stage].client.map(function(_,i){ return i; });
    }
    saveClientTasks(id, t);
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
    if (!t || !t.stageStartedAt || !t.stageStartedAt[stageIdx]) return 0;
    return Math.floor((Date.now() - t.stageStartedAt[stageIdx]) / 86400000);
  }

  function plDaysBadge(days) {
    if (days <= 2) return '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:#f1f5f9;color:#64748b">' + days + 'd</span>';
    if (days <= 6) return '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:#fef3c7;color:#92400e">' + days + 'd &#x26A0;</span>';
    return '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:#fee2e2;color:#991b1b">' + days + 'd &#x26A0;</span>';
  }

  function plInitials(c) {
    return ((c.fname||'?')[0] + (c.lname||'?')[0]).toUpperCase();
  }

  function renderPipeline() {
    var wrap = document.getElementById('pipeline-board-wrap');
    if (!wrap) return;
    var active = clients.filter(function(c){ return !c.archived; });
    var unstarted = active.filter(function(c){ return !getClientTasks(c.id); });

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
        totalTasks += p.total; doneTasks += p.done;
      });
    });
    var overallPct = totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) : 0;

    var summaryBar = '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;align-items:center">'
      + '<div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:10px 18px;display:flex;align-items:center;gap:10px">'
      + '<span style="font-size:26px;font-weight:800;color:#0f2044;font-family:var(--font-h);line-height:1">' + totalActive + '</span>'
      + '<span style="font-size:11px;font-weight:600;color:#64748b;line-height:1.4">Active<br>Clients</span></div>'
      + PIPELINE_STAGES.map(function(s, si){
          return '<div style="background:' + s.light + ';border:1.5px solid ' + s.border + ';border-radius:12px;padding:10px 14px;display:flex;align-items:center;gap:8px;cursor:pointer;transition:opacity .15s" onmouseover="this.style.opacity=\'.8\'" onmouseout="this.style.opacity=\'1\'" onclick="document.querySelectorAll(\'.pl-col\')[' + (si+1) + '].scrollIntoView({behavior:\'smooth\',inline:\'center\'})">'
            + '<span style="width:24px;height:24px;border-radius:8px;background:' + s.color + ';color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center">S' + (si+1) + '</span>'
            + '<div><div style="font-size:16px;font-weight:800;color:#0f2044;font-family:var(--font-h);line-height:1">' + stageCounts[si] + '</div>'
            + '<div style="font-size:10px;color:#64748b;white-space:nowrap;line-height:1.3">' + s.name + '</div></div></div>';
        }).join('')
      + '<div style="margin-left:auto;background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:10px 18px;min-width:150px">'
      + '<div style="font-size:10px;font-weight:700;color:#64748b;margin-bottom:6px;text-transform:uppercase;letter-spacing:.05em">Pipeline Progress</div>'
      + '<div style="height:6px;background:#e2e8f0;border-radius:99px;overflow:hidden;margin-bottom:5px"><div style="height:100%;background:linear-gradient(90deg,#3b82f6,#8b5cf6);border-radius:99px;width:' + overallPct + '%;transition:width .4s"></div></div>'
      + '<div style="font-size:13px;font-weight:800;color:#0f2044">' + overallPct + '% <span style="font-size:10px;font-weight:500;color:#94a3b8">complete</span></div>'
      + '</div></div>';

    var cols = PIPELINE_STAGES.map(function(stage, si) {
      var stageClients = active.filter(function(c){ var t=getClientTasks(c.id); return t && t.stage===si; });
      var cards = stageClients.length
        ? stageClients.map(function(c) {
            var p = plGetProgress(c.id, si);
            var pct = p.total ? Math.round(p.done/p.total*100) : 0;
            var days = plDaysInStage(c.id, si);
            return '<div class="pl-card" onclick="openTaskModal(\'' + c.id + '\')" style="border-left:3px solid ' + stage.color + '">'
              + '<div style="display:flex;align-items:center;gap:9px;margin-bottom:9px">'
              + '<div style="width:32px;height:32px;border-radius:9px;background:' + stage.light + ';color:' + stage.color + ';font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">' + plInitials(c) + '</div>'
              + '<div style="flex:1;min-width:0">'
              + '<div class="pl-card-name">' + c.fname + ' ' + c.lname + '</div>'
              + '<div style="font-size:10px;color:#94a3b8">' + (c.fico ? 'FICO ' + c.fico : c.email||'—') + '</div></div>'
              + plDaysBadge(days) + '</div>'
              + '<div class="pl-prog-bar"><div class="pl-prog-fill" style="width:' + pct + '%;background:' + stage.color + '"></div></div>'
              + '<div style="display:flex;justify-content:space-between;margin-top:5px">'
              + '<span style="font-size:10px;color:#94a3b8">' + p.done + ' / ' + p.total + ' tasks</span>'
              + '<span style="font-size:10px;font-weight:700;color:' + stage.color + '">' + pct + '%</span></div>'
              + '</div>';
          }).join('')
        : '<div style="font-size:11px;color:#cbd5e1;text-align:center;padding:20px 0;font-style:italic">No clients</div>';

      return '<div class="pl-col" style="border-top:3px solid ' + stage.color + '">'
        + '<div class="pl-col-head">'
        + '<div><div style="font-size:11px;font-weight:800;color:#0f2044">' + stage.name + '</div>'
        + '<div style="font-size:10px;color:#94a3b8;margin-top:2px">' + stage.sub + '</div></div>'
        + '<span class="pl-col-badge" style="background:' + stage.color + '">' + stageClients.length + '</span></div>'
        + cards + '</div>';
    }).join('');

    var unCards = unstarted.length
      ? unstarted.map(function(c){
          return '<div class="pl-card" onclick="openTaskModal(\'' + c.id + '\')">'
            + '<div style="display:flex;align-items:center;gap:9px">'
            + '<div style="width:32px;height:32px;border-radius:9px;background:#f1f5f9;color:#94a3b8;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">' + plInitials(c) + '</div>'
            + '<div><div class="pl-card-name">' + c.fname + ' ' + c.lname + '</div>'
            + '<div style="font-size:10px;color:#94a3b8">' + (c.fico ? 'FICO ' + c.fico : c.email||'—') + '</div></div></div>'
            + '<div style="font-size:11px;color:#3b82f6;font-weight:700;margin-top:9px">Start Pipeline &#x2192;</div></div>';
        }).join('')
      : '<div style="font-size:11px;color:#cbd5e1;text-align:center;padding:20px 0;font-style:italic">All in pipeline</div>';

    var unCol = '<div class="pl-col" style="border-top:3px solid #cbd5e1">'
      + '<div class="pl-col-head"><div><div style="font-size:11px;font-weight:800;color:#0f2044">Not Started</div>'
      + '<div style="font-size:10px;color:#94a3b8;margin-top:2px">Awaiting kickoff</div></div>'
      + '<span class="pl-col-badge" style="background:#94a3b8">' + unstarted.length + '</span></div>'
      + unCards + '</div>';

    wrap.innerHTML = summaryBar + '<div class="pl-board">' + unCol + cols + '</div>';
  }

  function openTaskModal(clientId) { renderTaskModal(clientId, initClientTasks(clientId).stage); }

  function renderTaskModal(clientId, viewStage) {
    var old = document.getElementById('pl-modal-bg');
    if (old) old.remove();
    var c = getClient(clientId);
    var t2 = initClientTasks(clientId);
    var stage = PIPELINE_STAGES[viewStage];
    var assigned = t2.assigned[viewStage] || [];
    var p = plGetProgress(clientId, viewStage);
    var pct = p.total ? Math.round(p.done / p.total * 100) : 0;
    var days = plDaysInStage(clientId, viewStage);
    var isCurrentStage = viewStage === t2.stage;
    var allInternalDone = stage.internal.every(function(_,i){ return t2.checked['s'+viewStage+'i'+i]; });
    var allClientDone   = assigned.length === 0 || assigned.every(function(i){ return t2.checked['s'+viewStage+'c'+i]; });
    var canAdvance = isCurrentStage && allInternalDone && allClientDone;
    var isFinal = viewStage === PIPELINE_STAGES.length - 1;

    // Stage nav pills
    var stageNav = PIPELINE_STAGES.map(function(s, si) {
      var sp = plGetProgress(clientId, si);
      var isDone = sp.total > 0 && sp.done === sp.total;
      var isActive = si === viewStage;
      var bg = isActive ? s.color : (isDone ? '#d1fae5' : '#f8fafc');
      var color = isActive ? '#fff' : (isDone ? '#065f46' : '#64748b');
      var border = isActive ? s.color : (isDone ? '#6ee7b7' : '#e2e8f0');
      return '<span style="padding:5px 13px;border-radius:20px;border:1.5px solid ' + border + ';background:' + bg + ';font-size:11px;font-weight:700;color:' + color + ';cursor:pointer;white-space:nowrap;transition:all .15s" onclick="renderTaskModal(\'' + clientId + '\',' + si + ')">'
        + (isDone && !isActive ? '&#x2713; ' : '') + 'S' + (si+1) + '</span>';
    }).join('');

    // Task row builder
    function taskRow(key, label, checked, onchange, onremove) {
      return '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;margin-bottom:4px;background:' + (checked ? stage.light : '#f8fafc') + ';border:1.5px solid ' + (checked ? stage.border : '#f1f5f9') + ';cursor:pointer;transition:all .15s" onclick="' + onchange + '">'
        + '<div style="width:20px;height:20px;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border:2px solid ' + (checked ? stage.color : '#cbd5e1') + ';background:' + (checked ? stage.color : '#fff') + ';transition:all .15s">'
        + (checked ? '<svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#fff" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : '')
        + '</div>'
        + '<span style="flex:1;font-size:13px;font-weight:' + (checked ? '500' : '600') + ';color:' + (checked ? '#94a3b8' : '#0f2044') + ';' + (checked ? 'text-decoration:line-through' : '') + '">' + label + '</span>'
        + (onremove ? '<span onclick="event.stopPropagation();' + onremove + '" title="Remove task" style="width:18px;height:18px;border-radius:5px;display:flex;align-items:center;justify-content:center;background:#fee2e2;color:#ef4444;cursor:pointer;font-size:11px;font-weight:700;flex-shrink:0">&#x2715;</span>' : '')
        + '</div>';
    }

    var intRows = stage.internal.map(function(task, i) {
      var key = 's' + viewStage + 'i' + i;
      var chk = !!t2.checked[key];
      return taskRow(key, task, chk, 'plToggle(\'' + clientId + '\',\'' + key + '\',' + viewStage + ')', null);
    }).join('');

    var clientRows = assigned.length
      ? assigned.map(function(idx) {
          var key = 's' + viewStage + 'c' + idx;
          var chk = !!t2.checked[key];
          return taskRow(key, stage.client[idx], chk,
            'plToggle(\'' + clientId + '\',\'' + key + '\',' + viewStage + ')',
            'plRemoveAssigned(\'' + clientId + '\',' + viewStage + ',' + idx + ')'
          );
        }).join('')
      : '<div style="font-size:12px;color:#94a3b8;font-style:italic;padding:8px 12px;background:#f8fafc;border-radius:10px;border:1.5px dashed #e2e8f0">No client tasks — click below to add</div>';

    // Unassigned tasks for "add" dropdown
    var unassigned = stage.client.map(function(_,i){ return i; }).filter(function(i){ return assigned.indexOf(i) === -1; });
    var addRows = unassigned.map(function(idx) {
      return '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:8px;cursor:pointer;transition:background .1s" onmouseover="this.style.background=\'#f8fafc\'" onmouseout="this.style.background=\'\'" onclick="plToggleAssign(\'' + clientId + '\',' + viewStage + ',' + idx + ')">'
        + '<div style="width:16px;height:16px;border-radius:4px;border:2px solid #cbd5e1;background:#fff;flex-shrink:0"></div>'
        + '<span style="font-size:13px;color:#0f2044">' + stage.client[idx] + '</span></div>';
    }).join('');

    // Circular progress SVG (40px)
    var r = 16; var circ = 2 * Math.PI * r;
    var dash = (pct / 100) * circ;
    var progressRing = '<svg width="40" height="40" viewBox="0 0 40 40" style="transform:rotate(-90deg)">'
      + '<circle cx="20" cy="20" r="' + r + '" fill="none" stroke="#e2e8f0" stroke-width="3"/>'
      + '<circle cx="20" cy="20" r="' + r + '" fill="none" stroke="' + stage.color + '" stroke-width="3" stroke-dasharray="' + dash.toFixed(1) + ' ' + circ.toFixed(1) + '" stroke-linecap="round"/>'
      + '</svg>';

    var bg = document.createElement('div');
    bg.id = 'pl-modal-bg';
    bg.className = 'pl-modal-bg';
    bg.onclick = function(e){ if(e.target === bg) bg.remove(); };

    bg.innerHTML = '<div class="pl-modal" style="border-top:4px solid ' + stage.color + '">'

      // ── Header ────────────────────────────────────────────────────────────
      + '<div class="pl-modal-head">'
      + '<div style="display:flex;align-items:center;gap:12px">'
      + '<div style="width:44px;height:44px;border-radius:12px;background:' + stage.light + ';color:' + stage.color + ';font-size:15px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">' + plInitials(c) + '</div>'
      + '<div>'
      + '<div style="font-family:var(--font-h);font-size:17px;font-weight:800;color:#0f2044;line-height:1.2">' + c.fname + ' ' + c.lname + '</div>'
      + '<div style="font-size:12px;color:#64748b;margin-top:3px;display:flex;align-items:center;gap:6px">'
      + '<span style="background:' + stage.color + ';color:#fff;font-size:10px;font-weight:700;padding:1px 8px;border-radius:20px">S' + (t2.stage+1) + '</span>'
      + PIPELINE_STAGES[t2.stage].name + ' &nbsp;' + plDaysBadge(days) + '</div></div></div>'
      + '<div style="display:flex;align-items:center;gap:10px">'
      + '<div style="text-align:center;position:relative">'
      + '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:' + stage.color + '">' + pct + '%</div>'
      + progressRing + '</div>'
      + '<button onclick="document.getElementById(\'pl-modal-bg\').remove()" style="width:32px;height:32px;border-radius:8px;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;font-size:16px;color:#94a3b8;display:flex;align-items:center;justify-content:center">&#x2715;</button>'
      + '</div></div>'

      // ── Stage nav ─────────────────────────────────────────────────────────
      + '<div style="display:flex;gap:6px;padding:14px 24px 0;overflow-x:auto;flex-wrap:nowrap;scrollbar-width:none">' + stageNav + '</div>'

      // ── Stage title ───────────────────────────────────────────────────────
      + '<div style="padding:16px 24px 0">'
      + '<div style="background:' + stage.light + ';border:1.5px solid ' + stage.border + ';border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:12px">'
      + '<div style="width:36px;height:36px;border-radius:10px;background:' + stage.color + ';color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0">S' + (viewStage+1) + '</div>'
      + '<div><div style="font-size:14px;font-weight:800;color:#0f2044">' + stage.name + '</div>'
      + '<div style="font-size:11px;color:#64748b;margin-top:1px">' + stage.sub + ' &nbsp;&#xB7;&nbsp; ' + p.done + ' of ' + p.total + ' tasks complete</div></div>'
      + '<div style="margin-left:auto;height:6px;width:80px;background:#e2e8f0;border-radius:99px;overflow:hidden;flex-shrink:0"><div style="height:100%;background:' + stage.color + ';width:' + pct + '%;transition:width .3s;border-radius:99px"></div></div>'
      + '</div></div>'

      // ── Body ──────────────────────────────────────────────────────────────
      + '<div class="pl-section-body">'

      // Internal tasks
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;margin-top:4px">'
      + '<div style="font-size:10px;font-weight:800;color:' + stage.color + ';text-transform:uppercase;letter-spacing:.07em;display:flex;align-items:center;gap:6px">'
      + '<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>'
      + 'Internal Tasks</div>'
      + '<span style="font-size:10px;color:#94a3b8">' + stage.internal.filter(function(_,i){ return t2.checked['s'+viewStage+'i'+i]; }).length + '/' + stage.internal.length + ' done</span></div>'
      + intRows

      // Client tasks
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;margin-top:20px">'
      + '<div style="font-size:10px;font-weight:800;color:' + stage.color + ';text-transform:uppercase;letter-spacing:.07em;display:flex;align-items:center;gap:6px">'
      + '<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>'
      + 'Client Tasks</div>'
      + '<span style="font-size:10px;color:#94a3b8">' + assigned.filter(function(i){ return t2.checked['s'+viewStage+'c'+i]; }).length + '/' + assigned.length + ' done</span></div>'
      + clientRows

      // Add task button (only shows if unassigned tasks exist)
      + (unassigned.length ? '<div style="margin-top:8px"><div style="position:relative">'
        + '<div onclick="var dd=document.getElementById(\'pl-add-dd-' + viewStage + '\');dd.style.display=dd.style.display===\'none\'?\'block\':\'none\'" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border:1.5px dashed ' + stage.border + ';border-radius:8px;background:' + stage.light + ';color:' + stage.color + ';font-size:12px;font-weight:700;cursor:pointer">'
        + '<svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg> Add Task</div>'
        + '<div id="pl-add-dd-' + viewStage + '" style="display:none;position:absolute;z-index:9999;background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.12);padding:8px;margin-top:6px;min-width:280px">' + addRows + '</div>'
        + '</div></div>' : '')

      + '</div>'

      // ── Advance button ────────────────────────────────────────────────────
      + '<div style="padding:0 24px 20px">'
      + '<button class="pl-advance-btn" ' + (canAdvance ? '' : 'disabled ') + 'onclick="plAdvance(\'' + clientId + '\',' + viewStage + ')" style="' + (canAdvance ? 'background:linear-gradient(135deg,' + stage.color + ',' + stage.dark + ');box-shadow:0 4px 14px ' + stage.color + '44' : '') + '">'
      + (isFinal
          ? '&#x1F389;&nbsp; Mark Complete — Client Funded!'
          : (canAdvance ? '&#x2705;&nbsp; All Done — Advancing to S' + (viewStage+2) + '...' : 'Complete all tasks to advance to S' + (viewStage+2)))
      + '</button></div></div>';

    document.body.appendChild(bg);
  }

  function plRemoveAssigned(clientId, stageIdx, taskIdx) {
    var t = initClientTasks(clientId);
    if (!t.assigned[stageIdx]) return;
    var pos = t.assigned[stageIdx].indexOf(taskIdx);
    if (pos !== -1) t.assigned[stageIdx].splice(pos, 1);
    saveClientTasks(clientId, t);
    renderTaskModal(clientId, stageIdx);
    renderPipeline();
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
        setTimeout(function() { plAdvance(clientId, viewStage); }, 700);
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
      // Auto-assign all client tasks for the new stage
      if (!t.assigned[t.stage] || t.assigned[t.stage].length === 0) {
        t.assigned[t.stage] = PIPELINE_STAGES[t.stage].client.map(function(_,i){ return i; });
      }
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
