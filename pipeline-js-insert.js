
  // ══════════════════════════════════════════════════
  //  PIPELINE — 6-stage client funding task system
  // ══════════════════════════════════════════════════

  var PIPELINE_STAGES = [
    { name: 'Initial Setup / Credit Review',
      client:   ['Upload Experian Login Credentials','Confirm Personal Information','Upload ID + Proof of Address','Complete Onboarding Form'],
      internal: ['Pull Experian Report','Analyze Credit Profile','Identify Negative Items','Identify Inquiries','Calculate DTI'] },
    { name: 'Credit Optimization',
      client:   ['Confirm Dispute Authorization','Avoid New Credit Applications','Pay Down High Utilization Accounts'],
      internal: ['Remove Inquiries','Send Dispute Letters','Track Bureau Responses','Update Credit Status'] },
    { name: 'Funding Strategy',
      client:   ['Confirm Business Information','Provide Business Details','Approve Funding Plan'],
      internal: ['Build Funding Sequence','Select Target Banks','Set Application Order','Determine Application Numbers'] },
    { name: 'Bank Relationships',
      client:   ['Open Business Bank Account','Deposit Required Funds','Confirm Account Opened','Maintain Required Balance'],
      internal: ['Assign Target Banks','Track Account Open Dates','Track Deposit Amounts','Monitor Relationship Age'] },
    { name: 'Application Phase',
      client:   ['Attend Bank Appointment','Confirm Submission','Upload Requested Documents'],
      internal: ['Introduce Client to BRM','Submit Applications','Track Application Dates','Handle Reconsideration Calls'] },
    { name: 'Decision / Results',
      client:   ['Accept Offer','Upload Approval Letters','Confirm Card Received'],
      internal: ['Log Approval Amounts','Update Funding Dashboard','Send Congratulations','Request Referrals'] }
  ];

  function getClientTasks(id) {
    try { return JSON.parse(localStorage.getItem('cq_tasks_' + id) || 'null'); } catch(e) { return null; }
  }
  function saveClientTasks(id, data) { localStorage.setItem('cq_tasks_' + id, JSON.stringify(data)); }
  function initClientTasks(id) {
    var t = getClientTasks(id);
    if (!t) { t = { stage: 0, checked: {}, assigned: {} }; saveClientTasks(id, t); }
    if (!t.assigned) { t.assigned = {}; saveClientTasks(id, t); }
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

  function renderPipeline() {
    var wrap = document.getElementById('pipeline-board-wrap');
    if (!wrap) return;
    var active = clients.filter(function(c){ return !c.archived; });
    var unstarted = active.filter(function(c){ return !getClientTasks(c.id); });

    var cols = PIPELINE_STAGES.map(function(stage, si) {
      var stageClients = active.filter(function(c){
        var t = getClientTasks(c.id);
        return t && t.stage === si;
      });
      var cards = stageClients.length
        ? stageClients.map(function(c) {
            var p = plGetProgress(c.id, si);
            var pct = p.total ? Math.round(p.done/p.total*100) : 0;
            return '<div class="pl-card" onclick="openTaskModal(\'' + c.id + '\')">'
              + '<div class="pl-card-name">' + c.fname + ' ' + c.lname + '</div>'
              + '<div class="pl-card-sub">' + (c.fico ? 'FICO ' + c.fico : c.email || '—') + '</div>'
              + '<div class="pl-prog-bar"><div class="pl-prog-fill" style="width:' + pct + '%"></div></div>'
              + '<div class="pl-prog-label">' + p.done + '/' + p.total + ' tasks</div>'
              + '</div>';
          }).join('')
        : '<div style="font-size:11px;color:var(--gray-400);text-align:center;padding:12px 0">No clients</div>';
      return '<div class="pl-col"><div class="pl-col-head"><span style="font-size:9px">' + stage.name + '</span><span class="pl-col-badge">S' + (si+1) + '</span></div>' + cards + '</div>';
    }).join('');

    var unCol = '<div class="pl-col" style="border-color:#e2e8f0">'
      + '<div class="pl-col-head"><span>Not Started</span><span class="pl-col-badge" style="background:var(--gray-400)">—</span></div>'
      + (unstarted.length
          ? unstarted.map(function(c){
              return '<div class="pl-card" onclick="openTaskModal(\'' + c.id + '\')">'
                + '<div class="pl-card-name">' + c.fname + ' ' + c.lname + '</div>'
                + '<div class="pl-card-sub">' + (c.fico ? 'FICO ' + c.fico : c.email || '—') + '</div>'
                + '<div style="font-size:11px;color:var(--blue);font-weight:600;margin-top:4px">Start Pipeline &#x2192;</div>'
                + '</div>';
            }).join('')
          : '<div style="font-size:11px;color:var(--gray-400);text-align:center;padding:12px 0">All assigned</div>')
      + '</div>';

    wrap.innerHTML = '<div class="pl-board">' + unCol + cols + '</div>';
  }

  function openTaskModal(clientId) { renderTaskModal(clientId, initClientTasks(clientId).stage); }

  function renderTaskModal(clientId, viewStage) {
    var old = document.getElementById('pl-modal-bg');
    if (old) old.remove();
    var c = getClient(clientId);
    var t2 = initClientTasks(clientId);

    var stageNav = PIPELINE_STAGES.map(function(s, si) {
      var p = plGetProgress(clientId, si);
      var allDone = p.total > 0 && p.done === p.total;
      var cls = si === viewStage ? 'active' : (allDone ? 'done' : '');
      return '<span class="pl-stage-pill ' + cls + '" onclick="renderTaskModal(\'' + clientId + '\',' + si + ')">S' + (si+1) + '</span>';
    }).join('');

    var stage = PIPELINE_STAGES[viewStage];
    var assigned = t2.assigned[viewStage] || [];
    var p = plGetProgress(clientId, viewStage);
    var isCurrentStage = viewStage === t2.stage;
    var allInternalDone = stage.internal.every(function(_,i){ return t2.checked['s'+viewStage+'i'+i]; });
    var allClientDone   = assigned.length === 0 || assigned.every(function(i){ return t2.checked['s'+viewStage+'c'+i]; });
    var canAdvance = isCurrentStage && allInternalDone && allClientDone;
    var isFinal = viewStage === PIPELINE_STAGES.length - 1;

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
      : '<div style="font-size:12px;color:var(--gray-400);font-style:italic;padding:4px 0">No client tasks assigned yet</div>';

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
      + '<div class="pl-modal-head">'
      + '<div><div style="font-family:var(--font-h);font-size:17px;font-weight:800;color:var(--navy)">' + c.fname + ' ' + c.lname + '</div>'
      + '<div style="font-size:12px;color:var(--gray-400);margin-top:2px">Stage ' + (t2.stage+1) + ' of 6</div></div>'
      + '<button onclick="document.getElementById(\'pl-modal-bg\').remove()" style="width:32px;height:32px;border-radius:8px;border:none;background:var(--gray-100);cursor:pointer;font-size:18px;color:var(--gray-500)">&#x00D7;</button>'
      + '</div>'
      + '<div class="pl-stages-nav">' + stageNav + '</div>'
      + '<div class="pl-section-body">'
      + '<div style="font-family:var(--font-h);font-size:14px;font-weight:800;color:var(--navy);margin-bottom:14px">S' + (viewStage+1) + ': ' + stage.name + '</div>'
      + '<div class="pl-group-label"><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#f59e0b" stroke-width="2.5"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg> Internal Tasks <span style="font-size:10px;font-weight:600;color:var(--gray-400)">(auto)</span></div>'
      + intRows
      + '<div class="pl-group-label" style="margin-top:16px"><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#6366f1" stroke-width="2.5"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> Client Tasks <span style="font-size:10px;font-weight:600;color:var(--gray-400)">(you assign)</span></div>'
      + '<div id="pl-assign-dd-' + viewStage + '" style="display:none" class="pl-assign-dd">' + ddRows + '</div>'
      + '<div class="pl-assign-btn" onclick="plToggleAssignDD(' + viewStage + ')">'
      + '<svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg> Assign Client Tasks</div>'
      + clientRows
      + '</div>'
      + '<button class="pl-advance-btn"' + (canAdvance ? '' : ' disabled') + ' onclick="plAdvance(\'' + clientId + '\',' + viewStage + ')">'
      + (isFinal ? 'Mark Complete &#x1F389;' : 'Complete Stage &#x2192; Advance to S' + (viewStage+2))
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
    renderTaskModal(clientId, viewStage);
    renderPipeline();
  }

  function plAdvance(clientId, currentStage) {
    var t = initClientTasks(clientId);
    if (currentStage < PIPELINE_STAGES.length - 1) {
      t.stage = currentStage + 1;
      saveClientTasks(clientId, t);
      renderTaskModal(clientId, t.stage);
    } else {
      t.stage = currentStage;
      saveClientTasks(clientId, t);
      document.getElementById('pl-modal-bg').remove();
    }
    renderPipeline();
  }
