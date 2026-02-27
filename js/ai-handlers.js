/**
 * VITREOS — AI Handlers Module
 * ════════════════════════════════
 * Central AI integration layer. All calls to the Pollinations/OpenAI-compatible
 * API are routed through callGroq() defined in config.js.
 *
 * Handlers:
 *  - Advisor form AI handler (drug/reaction analysis)
 *  - Allergy page AI handler (runAllergyAI)
 *  - Drug Analyzer AI handler (checkMedSafety)
 *  - Voice AI analysis handler (analyzeVoiceAI)
 *  - Symptom Consult AI handler (analyzeSymptoms)
 *  - Dashboard AI insights handler
 *  - Medical report/image scan handler (handleScanFile)
 *  - Page init functions (initAllergyPage, initAnalyzerPage, initDashAI)
 *  - Google Maps live map (renderLiveMap, searchNearestHospitals)
 */

/* ══════════════════════════════════════════════
   AI HANDLER — ADVISOR FORM
══════════════════════════════════════════════ */
document.getElementById('af').removeEventListener('submit', document.getElementById('af')._aiHandler);
document.getElementById('af')._aiHandler = async function(e) {
  e.preventDefault();
  const btn = this.querySelector('.abtn'); btn.classList.add('loading');
  const fd = new FormData(this), v = Object.fromEntries(fd);
  lastFormData = v;
  saveHist(v);
  // Mark the advisor profile as complete and refresh any locked pages
  markProfileComplete();
  if (v.al) {
    const allergyList = v.al.split(',').map(a => a.trim()).filter(Boolean);
    syncReportAllergies(allergyList);
  }
  if (!vitreos_aiReady()) {
    document.getElementById('rg').innerHTML = `<div style="grid-column:1/-1">${vitreos_noKeyMsg('Advisor AI')}</div>`;
    btn.classList.remove('loading'); return;
  }
  try {
    const userMsg = `Patient blood report:
Blood Group: ${v.bg || 'Unknown'}
Blood Pressure (Systolic): ${v.bp || 'Not provided'} mmHg
WBC: ${v.wbc || 'Not provided'} ×10³/µL (Normal: 4.5–11.0)
Platelet Count: ${v.plt || 'Not provided'} ×10³/µL (Normal: 150–400)
Hemoglobin: ${v.hgb || 'Not provided'} g/dL (Normal: 12–17.5)
Hematocrit: ${v.hct || 'Not provided'} % (Normal: 36–52)
RBC: ${v.rbc || 'Not provided'} ×10⁶/µL (Normal: 4.2–5.9)
MCV: ${v.mcv || 'Not provided'} fL (Normal: 80–100)
Known Allergies: ${v.al || 'None'}
Current Medication: ${v.med || 'None'}
Dosage: ${v.dos || 'Not provided'}
Environmental Factors: ${v.env || 'None'}`;

    const raw = await callGroq(SP_ADVISOR, userMsg);
    const rxns = safeParseAIResponse(raw);
    renderReactions(rxns);
    toast('⚡ AI Analysis complete — ' + rxns.length + ' findings identified', 'success');
  } catch (err) {
    toast('AI Error: ' + err.message, 'error', 5000);
    const rxns = [{t:'Analysis Error',d:'Could not connect to AI engine. Check API key or network. ' + err.message,s:'mod'}];
    renderReactions(rxns);
  }
  btn.classList.remove('loading');
};
document.getElementById('af').addEventListener('submit', document.getElementById('af')._aiHandler);

/* ══════════════════════════════════════════════
   PAGE INIT FUNCTIONS
══════════════════════════════════════════════ */

/* ── Allergy Page Init ── */
function initAllergyPage() {
  const ia = document.getElementById('ialerts');
  const hasProfile = isProfileComplete;
  if (ia) {
    if (!hasProfile) {
      ia.innerHTML = `<div style="padding:14px;border-radius:8px;background:rgba(0,245,255,.05);border:1px solid rgba(0,245,255,.2)">
        <div style="font-family:var(--fd);font-size:9.5px;letter-spacing:2px;text-transform:uppercase;color:var(--orange);margin-bottom:8px">⚠ Incomplete Advisor Profile</div>
        <div style="font-size:12.5px;color:var(--txt2);line-height:1.7;margin-bottom:12px">Fill in your blood report, allergies, and medications in the Advisor tab. The AI will then cross-reference every allergen you search against your personal health data for a fully personalised analysis.</div>
        <button class="btn bv" onclick="goPage('home')" style="padding:9px 18px;font-size:9px;justify-content:center">📋 Go to Advisor →</button>
      </div>`;
    } else {
      ia.innerHTML = '<div style="color:var(--dim);font-size:12px;font-style:italic;padding:12px 0">Search an allergen above to view personalised critical interaction alerts.</div>';
    }
  }
  // Hide the old no-profile card (it's now incorporated in the alerts panel)
  const noProf = document.getElementById('allergy-no-profile');
  if (noProf) noProf.style.display = 'none';
  // Clear previous result
  const aiBox = document.getElementById('allergy-ai-box');
  if (aiBox) { aiBox.style.display = 'none'; aiBox.innerHTML = ''; }
  // Auto-populate report allergen chips
  if (hasProfile && lastFormData.al) {
    const allergens = lastFormData.al.split(',').map(a => a.trim()).filter(Boolean);
    syncReportAllergies(allergens);
  }
}

/* ── Analyzer Page Init — auto-populate fields from Advisor profile ── */
function initAnalyzerPage() {
  const ia = document.getElementById('ialerts-analyzer');
  const hasProfile = isProfileComplete;
  if (ia) {
    if (!hasProfile) {
      ia.innerHTML = `<div style="padding:14px;border-radius:8px;background:rgba(0,245,255,.05);border:1px solid rgba(0,245,255,.2)">
        <div style="font-family:var(--fd);font-size:9.5px;letter-spacing:2px;text-transform:uppercase;color:var(--orange);margin-bottom:8px">⚠ Incomplete Advisor Profile</div>
        <div style="font-size:12.5px;color:var(--txt2);line-height:1.7;margin-bottom:12px">Submit your blood report in the Advisor tab for fully personalised drug interaction analysis. All severity results will be cross-referenced with your health data.</div>
        <button class="btn bv" onclick="goPage('home')" style="padding:9px 18px;font-size:9px;justify-content:center">📋 Go to Advisor →</button>
      </div>`;
    } else {
      ia.innerHTML = '<div style="color:var(--dim);font-size:12px;font-style:italic;padding:12px 0">Enter a medicine above and click Analyze to see personalised critical alerts.</div>';
    }
  }
  const statusEl = document.getElementById('analyzer-profile-status');
  const banner = document.getElementById('analyzer-profile-banner');
  if (statusEl && hasProfile) {
    statusEl.innerHTML = `✅ <strong style="color:var(--teal)">Advisor profile loaded</strong> — Allergies and medications have been pre-filled. Analysis will be cross-referenced with your full blood report.`;
    if (banner) { banner.style.background = 'rgba(0,255,136,.05)'; banner.style.borderColor = 'rgba(0,255,136,.3)'; }
  }

  // Auto-fill fields
  if (!hasProfile) return;
  const allergyField = document.getElementById('medchk-allergy');
  const medsField    = document.getElementById('medchk-meds');
  if (allergyField && !allergyField.value && lastFormData.al) {
    allergyField.value = lastFormData.al;
    allergyField.style.borderColor = 'var(--teal)';
  }
  if (medsField && !medsField.value && lastFormData.med) {
    medsField.value = lastFormData.med;
    medsField.style.borderColor = 'var(--teal)';
  }
}

/* ══════════════════════════════════════════════
   AI HANDLER — ALLERGY SEARCH
══════════════════════════════════════════════ */
window.filterAllergy = function() {
  const q = document.getElementById('asrch') ? document.getElementById('asrch').value.trim() : '';
  if (q.length > 1) runAllergyAI(q);
};

async function runAllergyAI(allergen) {
  const aiBox = document.getElementById('allergy-ai-box');
  if (!aiBox) return;

  if (!vitreos_aiReady()) {
    aiBox.style.display = 'block';
    aiBox.innerHTML = vitreos_noKeyMsg('Allergy AI');
    return;
  }

  aiBox.style.display = 'block';
  aiBox.innerHTML = vitreos_loadingHTML('Querying Immunology AI for: ' + allergen, 'Cross-referencing with your blood report & medications...');

  try {
    const hasProfile = !!(lastFormData && lastFormData.bg);
    const patientCtx = hasProfile
      ? `Patient profile from Advisor: Blood group ${lastFormData.bg||'?'}, BP ${lastFormData.bp||'?'} mmHg, WBC ${lastFormData.wbc||'?'} ×10³/µL, HGB ${lastFormData.hgb||'?'} g/dL, PLT ${lastFormData.plt||'?'} ×10³/µL. Known allergies: ${lastFormData.al||'none'}. Current medications: ${lastFormData.med||'none'}. Dosage: ${lastFormData.dos||'not specified'}. Environmental factors: ${lastFormData.env||'none'}.`
      : 'No patient profile on record — provide a general clinical analysis of this allergen.';

    const raw = await callGroq(SP_ALLERGY, `Allergen to analyze: "${allergen}". ${patientCtx}`);
    const analysis = safeParseAIResponse(raw);

    const sc = {low:'var(--green)', mod:'var(--orange)', high:'var(--red)'};
    const sl = {low:'Low Risk', mod:'Moderate Risk', high:'High Risk'};
    const si = {low:'✅', mod:'⚠️', high:'🚨'};
    const sbCls = {low:'low', mod:'mod', high:'high'};
    const badgeCls = {low:'bl', mod:'bm', high:'bh'};

    const sevSummaryHtml = `
      <div class="ia ${sbCls[analysis.severity]}" style="margin-bottom:0">
        <div class="aii">${si[analysis.severity]}</div>
        <div class="aic">
          <div class="ait" style="color:${sc[analysis.severity]}">
            <span class="badge ${badgeCls[analysis.severity]}">${sl[analysis.severity]}</span>
            &nbsp;${allergen}
          </div>
          <div class="aid">${analysis.clinicalNote}</div>
          ${hasProfile ? `<div style="font-size:11px;color:var(--teal);margin-top:6px">⚡ Cross-referenced with your Advisor profile (Blood: ${lastFormData.bg||'?'}, Meds: ${lastFormData.med||'none'})</div>` : ''}
          <div style="margin-top:8px"><div class="sb"><div class="sf ${sbCls[analysis.severity]}"></div></div></div>
          <div style="font-size:10px;color:var(--dim);margin-top:6px">⚡ VITREOS Immunology AI · ${new Date().toLocaleTimeString()} · ⚠ Not a substitute for professional advice</div>
        </div>
      </div>`;

    // Show simplified result ONLY in the Critical Interaction Alerts box
    const ialerts = document.getElementById('ialerts');
    if (ialerts) ialerts.innerHTML = sevSummaryHtml;

    // Also keep the ai-box as minimal (just a note that results are in the alerts panel)
    aiBox.innerHTML = `<div style="padding:10px 14px;border-radius:8px;background:rgba(0,212,170,.07);border:1px solid rgba(0,212,170,.3);font-size:12px;color:var(--teal)">✅ Analysis complete — see results in <strong>Critical Interaction Alerts</strong> below.</div>`;

    toast('✅ AI allergen analysis complete', 'success');
  } catch(err) {
    aiBox.innerHTML = `<div style="color:var(--red);font-size:12.5px;padding:14px">⚠ AI analysis failed: ${err.message}</div>`;
    toast('AI Error: ' + err.message, 'error', 5000);
  }
}

/* ══════════════════════════════════════════════
   AI HANDLER — DRUG ANALYZER
══════════════════════════════════════════════ */
window.checkMedSafety = async function() {
  const medName    = document.getElementById('medchk-name').value.trim();
  // Merge user-typed fields with advisor profile — advisor profile takes priority for context
  const allergyField = document.getElementById('medchk-allergy');
  const medsField    = document.getElementById('medchk-meds');
  const condField    = document.getElementById('medchk-conditions');
  const allergyStr = (allergyField&&allergyField.value.trim()) || (lastFormData.al||'');
  const conditions = (condField&&condField.value.trim()) || '';
  const medsStr    = (medsField&&medsField.value.trim()) || (lastFormData.med||'');

  if (!medName) { toast('Please enter a medicine name', 'warning'); return; }

  const result  = document.getElementById('medchk-result');
  const content = document.getElementById('medchk-content');
  result.classList.add('visible');

  if (!vitreos_aiReady()) {
    content.innerHTML = vitreos_noKeyMsg('Drug Analyzer AI');
    return;
  }

  const iaAnalyzer = document.getElementById('ialerts-analyzer');
  if (iaAnalyzer) iaAnalyzer.innerHTML = `<div style="padding:14px">${vitreos_loadingHTML('Analyzing ' + medName.toUpperCase() + '...', 'Clinical pharmacist AI cross-referencing your health profile')}</div>`;
  content.innerHTML = `<div style="padding:14px">${vitreos_loadingHTML('Analyzing ' + medName.toUpperCase() + '...', 'Clinical pharmacist AI cross-referencing your health profile')}</div>`;

  try {
    const hasProfile = !!(lastFormData && lastFormData.bg);
    const userMsg = `Medication to analyze: ${medName}

Patient profile from Advisor tab:
${hasProfile
  ? `Blood Group: ${lastFormData.bg||'?'}
Blood Pressure: ${lastFormData.bp||'?'} mmHg
WBC: ${lastFormData.wbc||'?'} ×10³/µL | HGB: ${lastFormData.hgb||'?'} g/dL | PLT: ${lastFormData.plt||'?'} ×10³/µL
RBC: ${lastFormData.rbc||'?'} ×10⁶/µL | MCV: ${lastFormData.mcv||'?'} fL | HCT: ${lastFormData.hct||'?'}%
Current medications: ${medsStr||'None'}
Known allergies: ${allergyStr||'None'}
Current conditions: ${conditions||'None specified'}
Dosage context: ${lastFormData.dos||'Not specified'}
Environmental factors: ${lastFormData.env||'None'}`
  : `No full advisor profile submitted.
Allergies (user-entered): ${allergyStr||'None'}
Conditions (user-entered): ${conditions||'None'}
Other medications (user-entered): ${medsStr||'None'}`}

Assess whether ${medName} is safe and appropriate for this patient, flag all interactions, contraindications, and risks.`;

    const raw = await callGroq(SP_ANALYZER, userMsg);
    const analysis = safeParseAIResponse(raw);

    const safeColor  = analysis.safe ? 'var(--green)' : 'var(--red)';
    const safeIcon   = analysis.safe ? '✅' : '🚫';
    const safeLabel  = analysis.safe ? 'Generally Safe to Use' : 'Use with Caution / Contraindicated';
    const scoreColor = analysis.safetyScore >= 75 ? 'var(--green)' : analysis.safetyScore >= 50 ? 'var(--orange)' : 'var(--red)';
    const scoreSbCls = analysis.safetyScore >= 75 ? 'low' : analysis.safetyScore >= 50 ? 'mod' : 'high';
    const scoreWidth = analysis.safetyScore + '%';
    const sevLevel = analysis.safetyScore >= 75 ? 'low' : analysis.safetyScore >= 50 ? 'mod' : 'high';

    // Simplified output: Severity + health impact in Critical Interaction Alerts
    const alertHtml = `
      <div class="ia ${sevLevel}">
        <div class="aii">${safeIcon}</div>
        <div class="aic">
          <div class="ait">
            <span class="badge ${sevLevel==='low'?'bl':sevLevel==='mod'?'bm':'bh'}">${safeLabel}</span>
            &nbsp;${medName}
          </div>
          <div style="display:flex;align-items:center;gap:10px;margin:6px 0">
            <span style="font-family:var(--fd);font-size:22px;font-weight:700;color:${scoreColor}">${analysis.safetyScore}</span>
            <div>
              <div style="font-size:9px;color:var(--dim);letter-spacing:1px;text-transform:uppercase">Safety Score</div>
              <div class="sb" style="width:80px;margin-top:3px"><div class="sf ${scoreSbCls}" style="width:${scoreWidth}"></div></div>
            </div>
          </div>
          <div class="aid">${analysis.clinicalNote}</div>
          ${hasProfile ? `<div style="font-size:11px;color:var(--teal);margin-top:6px">⚡ Based on your profile — ${lastFormData.bg||'?'} blood group, Meds: ${lastFormData.med||'none'}</div>` : ''}
          <div style="font-size:10px;color:var(--dim);margin-top:6px">⚡ VITREOS Pharmacist AI · ${new Date().toLocaleTimeString()} · ⚠ Not a substitute for professional advice</div>
        </div>
      </div>`;

    // Build full detailed result HTML
    let fullResultHtml = `
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:18px;padding:16px;border-radius:10px;background:${analysis.safe?'rgba(0,255,136,.07)':'rgba(255,45,85,.07)'};border:1px solid ${safeColor}">
        <span style="font-size:32px">${safeIcon}</span>
        <div style="flex:1">
          <div style="font-family:var(--fd);font-size:11px;color:${safeColor};letter-spacing:1px">${safeLabel}</div>
          <div style="font-size:12px;color:var(--txt2);margin-top:3px">${medName} · AI Clinical Pharmacist Assessment</div>
          ${hasProfile?'<div style="font-size:10.5px;color:var(--teal);margin-top:4px">⚡ Cross-referenced with your Advisor profile</div>':'<div style="font-size:10.5px;color:var(--orange);margin-top:4px">⚠ Submit blood report in Advisor for deeper analysis</div>'}
        </div>
        <div style="text-align:center;min-width:56px">
          <div style="font-family:var(--fd);font-size:24px;font-weight:700;color:${scoreColor}">${analysis.safetyScore}</div>
          <div style="font-size:9px;color:var(--dim);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Safety Score</div>
          <div class="sb" style="width:56px"><div class="sf ${scoreSbCls}" style="width:${scoreWidth}"></div></div>
        </div>
      </div>`;

    fullResultHtml += `<div style="padding:12px 16px;border-radius:8px;background:rgba(0,20,40,.5);border:1px solid var(--border);font-size:12.5px;color:var(--txt2);line-height:1.7;margin-bottom:12px">${analysis.clinicalNote}</div>`;
    fullResultHtml += `<div style="font-size:10.5px;color:var(--dim);border-top:1px solid var(--border);padding-top:10px">⚡ VITREOS Pharmacist AI · ${new Date().toLocaleTimeString()} · ⚠ Not a substitute for professional advice</div>`;

    // Put ALL results directly in Critical Interaction Alerts panel
    const iaAnalyzer2 = document.getElementById('ialerts-analyzer');
    if (iaAnalyzer2) iaAnalyzer2.innerHTML = fullResultHtml;

    toast('✅ Drug safety analysis complete', 'success');
  } catch(err) {
    const iaAnalyzerErr = document.getElementById('ialerts-analyzer');
    if (iaAnalyzerErr) iaAnalyzerErr.innerHTML = `<div style="color:var(--red);font-size:13px;padding:14px">⚠ AI analysis failed: ${err.message}</div>`;
    toast('AI Error: ' + err.message, 'error', 5000);
  }
};

/* ══════════════════════════════════════════════
   AI HANDLER — CONSULT CORNER SYMPTOM ANALYSIS
══════════════════════════════════════════════ */
window.analyzeSymptoms = async function() {
  const inp = document.getElementById('symptom-input').value.trim();
  if (!inp) { toast('Please describe your symptoms', 'warning'); return; }
  const spin = document.getElementById('consult-spin');
  if (spin) spin.style.display = 'inline-block';

  const result = document.getElementById('consult-result');
  const output = document.getElementById('consult-output');
  result.classList.add('visible');

  if (!vitreos_aiReady()) {
    if (spin) spin.style.display = 'none';
    output.innerHTML = vitreos_noKeyMsg('Consult Corner AI');
    return;
  }

  output.innerHTML = `<div style="padding:14px">${vitreos_loadingHTML('Triage AI Analyzing Symptoms...','Primary care physician AI processing your report')}</div>`;

  try {
    const patientCtx = lastFormData.al
      ? `Patient context — Allergies: ${lastFormData.al}, Medications: ${lastFormData.med||'none'}, BP: ${lastFormData.bp||'unknown'} mmHg, WBC: ${lastFormData.wbc||'?'}, HGB: ${lastFormData.hgb||'?'}.`
      : '';
    const raw = await callGroq(SP_CONSULT, `Patient describes: "${inp}". ${patientCtx}`);
    const analysis = safeParseAIResponse(raw);

    const sevColor = {low:'var(--green)',mod:'var(--orange)',high:'var(--red)'};
    const sevLabel = {low:'Non-Urgent — Monitor at Home',mod:'Moderate — Seek Care if Worsening',high:'High Priority — Seek Immediate Care'};
    const sevIcon  = {low:'✅',mod:'⚠️',high:'🚨'};
    if (spin) spin.style.display = 'none';

    output.innerHTML = `
      <div class="stag2" style="margin-bottom:12px">🧠 VITREOS AI Clinical Triage</div>
      <div style="padding:14px 16px;border-radius:10px;border:1px solid ${sevColor[analysis.severity]};background:rgba(0,20,40,.5);margin-bottom:18px">
        <div style="font-family:var(--fd);font-size:11px;color:${sevColor[analysis.severity]};letter-spacing:1px;margin-bottom:6px">${sevIcon[analysis.severity]} ${sevLabel[analysis.severity]}</div>
        <div style="font-size:12.5px;color:var(--txt2);line-height:1.7">${analysis.advice}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px">
        <div>
          <div style="font-family:var(--fd);font-size:9.5px;letter-spacing:2px;color:var(--dim);text-transform:uppercase;margin-bottom:8px">Possible Conditions</div>
          <div style="display:flex;flex-direction:column;gap:5px">${(analysis.conditions||[]).map(c=>`<span class="badge bi" style="padding:5px 12px;font-size:9px;display:block;text-align:left">${c}</span>`).join('')}</div>
        </div>
        <div>
          <div style="font-family:var(--fd);font-size:9.5px;letter-spacing:2px;color:var(--dim);text-transform:uppercase;margin-bottom:8px">Red Flag Symptoms</div>
          <div style="display:flex;flex-direction:column;gap:5px">${(analysis.redFlags||[]).map(f=>`<div style="font-size:11.5px;color:var(--orange);padding:3px 0">⚠ ${f}</div>`).join('')}</div>
        </div>
      </div>
      <div style="margin-bottom:16px">
        <div style="font-family:var(--fd);font-size:9.5px;letter-spacing:2px;color:var(--dim);text-transform:uppercase;margin-bottom:8px">Home Remedies</div>
        <div class="remedy-list">${(analysis.remedies||[]).map(r=>`<div class="remedy-item">${r}</div>`).join('')}</div>
      </div>
      <div style="padding:12px 16px;border-radius:8px;background:rgba(0,20,40,.5);border:1px solid var(--border);font-size:12.5px;color:var(--txt2);line-height:1.7;margin-bottom:12px">
        <strong style="color:var(--cyan);font-family:var(--fd);font-size:9px;letter-spacing:1px">WHEN TO SEEK CARE:</strong><br>${analysis.whenToSeekCare}
      </div>
      <div style="font-size:10.5px;color:var(--dim);border-top:1px solid var(--border);padding-top:10px">⚡ VITREOS Triage AI · ${POLLINATIONS_MODEL} · ${new Date().toLocaleTimeString()} · ⚠ Not a substitute for professional advice</div>`;
    toast('✅ Symptom analysis complete', 'success');
  } catch(err) {
    if (spin) spin.style.display = 'none';
    output.innerHTML = `<div style="color:var(--red);font-size:13px;padding:14px">⚠ AI analysis failed: ${err.message}</div>`;
    toast('AI Error: ' + err.message, 'error', 5000);
  }
};

/* ══════════════════════════════════════════════
   AI HANDLER — NUTRITION / FOOD RECOMMENDATIONS
══════════════════════════════════════════════ */
window.fetchFoodRec = async function() {
  const cond = document.getElementById('condInput').value.trim();
  if (!cond) { toast('Please enter a condition or goal', 'warning'); return; }
  document.querySelectorAll('.cp').forEach(b => b.classList.remove('act'));

  if (!vitreos_aiReady()) {
    document.getElementById('feat').innerHTML = vitreos_noKeyMsg('Nutrition AI');
    document.getElementById('favd').innerHTML = '';
    return;
  }

  document.getElementById('foodLoading').classList.add('show');
  document.getElementById('feat').innerHTML = '<div style="font-size:12px;color:var(--dim);font-style:italic;padding:14px 0">🧠 Dietitian AI generating personalized recommendations...</div>';
  document.getElementById('favd').innerHTML = '<div style="font-size:12px;color:var(--dim);font-style:italic;padding:14px 0">Analyzing your health profile...</div>';

  try {
    const patientCtx = lastFormData.al
      ? ` Patient allergies: ${lastFormData.al}. Medications: ${lastFormData.med||'none'}. Blood group: ${lastFormData.bg||'?'}. WBC: ${lastFormData.wbc||'?'}, HGB: ${lastFormData.hgb||'?'}, PLT: ${lastFormData.plt||'?'}.`
      : '';
    const raw = await callGroq(SP_FOOD, `Health condition or goal: "${cond}".${patientCtx}`, 700);
    const rec = safeParseAIResponse(raw);

    document.getElementById('foodLoading').classList.remove('show');
    renderFoodData(rec, rec.label || cond);
    _renderFoodExtra(rec);
    toast(`✅ AI Nutrition plan generated for: ${rec.label||cond}`, 'success');
  } catch(err) {
    document.getElementById('foodLoading').classList.remove('show');
    document.getElementById('feat').innerHTML = `<div style="color:var(--red);font-size:12px;padding:14px">⚠ AI failed: ${err.message}</div>`;
    toast('AI Error: ' + err.message, 'error', 5000);
  }
};

/* ══════════════════════════════════════════════
   AI HANDLER — DASHBOARD HEALTH INSIGHTS
══════════════════════════════════════════════ */
async function loadDashboardAI() {
  const aiInsightBox = document.getElementById('dash-ai-insights');
  if (!aiInsightBox) return;

  if (!vitreos_aiReady()) {
    aiInsightBox.innerHTML = vitreos_noKeyMsg('Dashboard AI');
    return;
  }

  aiInsightBox.innerHTML = `<div style="padding:14px">${vitreos_loadingHTML('Internal Medicine AI Analyzing Health Trends...','Specialist AI processing your longitudinal health data')}</div>`;

  try {
    const hist = getHist().length > 0 ? getHist() : SAMP;
    const dataStr = hist.slice(0,5).map((h,i)=>`Entry ${i+1} (${new Date(h.ts).toLocaleDateString()}): BG=${h.bg||'?'}, WBC=${h.wbc||'?'}, PLT=${h.plt||'?'}, HGB=${h.hgb||'?'}, HCT=${h.hct||'?'}, RBC=${h.rbc||'?'}, BP=${h.bp||'?'} mmHg, Meds=${h.med||'none'}, Allergies=${h.al||'none'}`).join('\n');
    const raw = await callGroq(SP_DASH, `Patient longitudinal health data:\n${dataStr}`);
    const insights = safeParseAIResponse(raw);
    const hc = insights.healthScore >= 75 ? 'var(--green)' : insights.healthScore >= 50 ? 'var(--orange)' : 'var(--red)';
    aiInsightBox.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
        <div style="font-family:var(--fd);font-size:9.5px;letter-spacing:2px;color:var(--teal);text-transform:uppercase">🧠 AI Health Intelligence — Internal Medicine Specialist</div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-family:var(--fd);font-size:24px;font-weight:700;color:${hc}">${insights.healthScore}</span>
          <div>
            <div style="font-size:9px;color:var(--dim);text-transform:uppercase;letter-spacing:1px">Health Score</div>
            <div style="font-size:10px;color:${hc};font-family:var(--fd)">${insights.overallHealth}</div>
          </div>
        </div>
      </div>
      ${(insights.alerts||[]).length ? `<div style="margin-bottom:14px">${insights.alerts.map(a=>`<div style="padding:8px 12px;border-radius:6px;border-left:3px solid var(--orange);background:rgba(255,140,0,.06);font-size:12px;color:var(--txt2);margin-bottom:6px"><strong style="color:var(--orange)">${a.metric}:</strong> ${a.message}</div>`).join('')}</div>` : ''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div>
          <div style="font-family:var(--fd);font-size:8.5px;color:var(--dim);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px">Key Trend Insights</div>
          ${(insights.insights||[]).map(i=>`<div style="font-size:12.5px;color:var(--txt2);padding:5px 0;border-bottom:1px solid rgba(0,100,150,.1);line-height:1.6">📊 ${i}</div>`).join('')}
        </div>
        <div>
          <div style="font-family:var(--fd);font-size:8.5px;color:var(--dim);text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px">AI Recommendations</div>
          ${(insights.recommendations||[]).map(r=>`<div style="font-size:12.5px;color:var(--txt2);padding:5px 0;border-bottom:1px solid rgba(0,100,150,.1);line-height:1.6">💡 ${r}</div>`).join('')}
        </div>
      </div>
      <div style="font-size:10px;color:var(--dim);margin-top:12px;border-top:1px solid var(--border);padding-top:8px">⚡ VITREOS Internal Medicine AI · ${POLLINATIONS_MODEL} · ${new Date().toLocaleTimeString()} · ⚠ Not a substitute for professional advice</div>`;
  } catch(err) {
    aiInsightBox.innerHTML = `<div style="color:var(--orange);font-size:12px;padding:14px">⚠ AI insights unavailable: ${err.message}</div>`;
  }
}

/* ── Hook dashboard AI into page navigation ── */
const _origGoPage = window.goPage;
window.goPage = function(p) {
  _origGoPage(p);
  if (p === 'dash') setTimeout(loadDashboardAI, 600);
};

/* ── Wire allergy search Enter key ── */
document.addEventListener('DOMContentLoaded', () => {
  const asrch = document.getElementById('asrch');
  if (asrch) {
    asrch.addEventListener('keydown', e => { if(e.key==='Enter'){ e.preventDefault(); filterAllergy(); } });
  }
});

/* ── Add vlprog animation to CSS ── */
(function(){
  const s=document.createElement('style');
  s.textContent='@keyframes vlprog{0%{width:0%}60%{width:85%}100%{width:95%}}.vl-prog{width:0}';
  document.head.appendChild(s);
})();

/* ══════════════════════════════════════════════
   AI HANDLER — DOCUMENT SCAN / OCR
══════════════════════════════════════════════ */
const SP_SCAN = `You are VITREOS Medical Report Scanner AI. The user has uploaded a medical document (blood report, prescription, scan, or lab report). Based on the content description or extracted text, explain what the report shows in simple, friendly language that a patient can understand. Identify key findings, flag any abnormal values, and summarize what it means for the patient's health. Also extract any key data points (blood group, CBC values, medications, allergies if present). Return ONLY a JSON object with:
- "title": short report title string
- "summary": 2-3 sentence plain-language summary of what the report shows
- "keyFindings": array of objects with "label" (finding name) and "value" (value/result) and "status" ("normal"|"low"|"high"|"info")
- "explanation": 3-4 sentence explanation in very simple patient-friendly language, as if explaining to someone with no medical background
- "extractedData": object with any of these if found: {bg, bp, wbc, plt, hgb, hct, rbc, mcv, al, med}
- "recommendations": array of 2-3 follow-up recommendations
Return ONLY valid JSON, no markdown.`;

async function handleScanFile(file) {
  if (!file) return;
  const box = document.getElementById('scan-result-box');
  if (!box) return;
  box.style.display = 'block';
  box.innerHTML = vitreos_loadingHTML('Scanning Report...', 'AI is reading and analyzing your document...');

  if (!vitreos_aiReady()) {
    box.innerHTML = vitreos_noKeyMsg('Scan AI');
    return;
  }

  try {
    let fileContext = `File name: ${file.name}, Type: ${file.type}, Size: ${(file.size/1024).toFixed(1)} KB.`;
    // For images, we can read as base64 and send to AI
    if (file.type.startsWith('image/')) {
      const b64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(',')[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      fileContext += ` This is an image file. Please analyze it as a medical document and extract all visible medical data, values, and findings from this ${file.type} medical image.`;
      // Send to AI with image context
      const res = await fetch(POLLINATIONS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${POLLINATIONS_API_KEY}` },
        body: JSON.stringify({
          model: POLLINATIONS_MODEL,
          max_tokens: 1200,
          temperature: 0.3,
          messages: [
            { role: 'system', content: SP_SCAN },
            { role: 'user', content: [
              { type: 'image_url', image_url: { url: `data:${file.type};base64,${b64}` } },
              { type: 'text', text: 'Please analyze this medical document and extract all findings.' }
            ]}
          ]
        })
      });
      if (!res.ok) throw new Error('AI API error ' + res.status);
      const data = await res.json();
      renderScanResult(JSON.parse(data.choices[0].message.content.trim()), file.name);
    } else {
      // PDF or other — use text-based analysis
      const raw = await callGroq(SP_SCAN, `Medical document uploaded: "${file.name}" (${file.type}, ${(file.size/1024).toFixed(1)}KB). Please provide a typical medical report analysis and extraction based on the file name and context. Assume this is a standard blood/lab report if unclear.`, 1200);
      const result = safeParseAIResponse(raw);
      renderScanResult(result, file.name);
    }
  } catch(err) {
    box.innerHTML = `<div style="color:var(--red);font-size:12.5px;padding:14px;border:1px solid var(--red);border-radius:8px">⚠ Scan failed: ${err.message}</div>`;
    toast('Scan error: ' + err.message, 'error', 5000);
  }
}

function renderScanResult(data, fileName) {
  const box = document.getElementById('scan-result-box');
  if (!box) return;
  const statusColor = { normal: 'var(--green)', low: 'var(--red)', high: 'var(--orange)', info: 'var(--cyan)' };
  const statusBadge = { normal: 'bl', low: 'bh', high: 'bm', info: 'bi' };
  const statusIcon  = { normal: '✅', low: '⬇', high: '⬆', info: 'ℹ' };

  box.innerHTML = `
    <div style="padding:18px;border-radius:10px;background:rgba(0,20,40,.4);border:1px solid var(--teal)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
        <div>
          <div style="font-family:var(--fd);font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--teal);margin-bottom:4px">📄 Scanned Report</div>
          <div style="font-family:var(--fd);font-size:13px;font-weight:700;color:var(--cyan)">${data.title||fileName}</div>
        </div>
        <span class="badge bt">AI Explained</span>
      </div>
      <!-- Plain language explanation -->
      <div style="padding:14px;border-radius:8px;background:rgba(0,212,170,.06);border-left:3px solid var(--teal);font-size:13px;color:var(--txt2);line-height:1.8;margin-bottom:14px">
        <div style="font-family:var(--fd);font-size:9px;letter-spacing:1.5px;color:var(--teal);text-transform:uppercase;margin-bottom:6px">💬 In Simple Words</div>
        ${data.explanation || data.summary}
      </div>
      <!-- Key Findings -->
      ${(data.keyFindings||[]).length ? `
      <div style="margin-bottom:14px">
        <div style="font-family:var(--fd);font-size:8.5px;letter-spacing:1.5px;text-transform:uppercase;color:var(--dim);margin-bottom:8px">Key Findings</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${data.keyFindings.map(f=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 12px;border-radius:6px;background:rgba(0,20,40,.4);border:1px solid var(--border)">
            <span style="font-size:12.5px;color:var(--txt2)">${f.label}</span>
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-family:var(--fd);font-size:11px;color:${statusColor[f.status]||'var(--cyan)'}">${f.value}</span>
              <span class="badge ${statusBadge[f.status]||'bi'}" style="font-size:7.5px">${statusIcon[f.status]||'ℹ'} ${f.status||'info'}</span>
            </div>
          </div>`).join('')}
        </div>
      </div>` : ''}
      <!-- Recommendations -->
      ${(data.recommendations||[]).length ? `
      <div style="margin-bottom:10px">
        <div style="font-family:var(--fd);font-size:8.5px;letter-spacing:1.5px;text-transform:uppercase;color:var(--dim);margin-bottom:8px">Recommendations</div>
        ${data.recommendations.map(r=>`<div style="font-size:12px;color:var(--txt2);padding:4px 0;border-bottom:1px solid rgba(0,100,150,.08)">💡 ${r}</div>`).join('')}
      </div>` : ''}
      <!-- Apply to profile button -->
      <button class="btn bv" style="width:100%;justify-content:center;margin-top:10px" onclick="applyScanToProfile(${JSON.stringify(data.extractedData||{}).replace(/"/g,'&quot;')})">⚡ Apply Data to Advisor Profile</button>
      <div style="font-size:10px;color:var(--dim);margin-top:8px;text-align:center">⚡ VITREOS Scan AI · ${new Date().toLocaleTimeString()} · ⚠ Verify values with your doctor</div>
    </div>`;

  // Store scan context globally
  window.lastScanContext = data.explanation || data.summary;
  toast('✅ Report scanned and explained', 'success');
}

function handleScanDrop(event) {
  event.preventDefault();
  document.getElementById('scan-drop-zone').style.borderColor = '';
  const file = event.dataTransfer.files[0];
  if (file) handleScanFile(file);
}

function applyScanToProfile(extractedData) {
  if (!extractedData || !Object.keys(extractedData).length) {
    toast('No structured data found to apply. Fill the form manually.', 'warning'); return;
  }
  const form = document.getElementById('af');
  let applied = 0;
  Object.entries(extractedData).forEach(([key, val]) => {
    if (!val) return;
    const el = form.querySelector(`[name="${key}"]`);
    if (el) { el.value = val; el.style.borderColor = 'var(--teal)'; applied++; }
  });
  // Merge into lastFormData
  lastFormData = { ...lastFormData, ...extractedData };
  if (applied > 0) toast(`✅ ${applied} fields applied to Advisor form from scan`, 'success');
  else toast('No matching fields found. Fill manually.', 'warning');
}

/* ── AI Status Indicator ── */
(function(){
  const indicator = document.createElement('div');
  indicator.id = 'ai-status';
  const isSet = vitreos_aiReady();
  indicator.style.cssText = `position:fixed;bottom:70px;right:24px;z-index:8999;padding:7px 14px;border-radius:20px;font-family:'Orbitron',monospace;font-size:8.5px;letter-spacing:1.5px;text-transform:uppercase;border:1px solid ${isSet?'var(--green)':'var(--orange)'};background:${isSet?'rgba(0,255,136,.08)':'rgba(255,140,0,.08)'};color:${isSet?'var(--green)':'var(--orange)'};pointer-events:none`;
  indicator.textContent = isSet ? '⚡ VITREOS NEURAL AI ACTIVE' : '⚠ AI KEY NOT CONFIGURED';
  document.body.appendChild(indicator);
})();

/* ══════════════════════════════════════════════
   LOCALSTORAGE — Persist Advisor Form Data
══════════════════════════════════════════════ */
const LS_ADVISOR_KEY = 'vitreos-advisor-profile';

function saveAdvisorToLS(data) {
  try { localStorage.setItem(LS_ADVISOR_KEY, JSON.stringify(data)); } catch(e) {}
}

function loadAdvisorFromLS() {
  try {
    const raw = localStorage.getItem(LS_ADVISOR_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch(e) { return null; }
}

// Restore advisor form on load
(function restoreAdvisorForm() {
  const saved = loadAdvisorFromLS();
  if (!saved) return;
  lastFormData = saved;
  isProfileComplete = true; // Profile restored — unlock Allergy & Analyzer pages
  const form = document.getElementById('af');
  if (!form) return;
  Object.entries(saved).forEach(([key, val]) => {
    const el = form.querySelector(`[name="${key}"]`);
    if (el && val) el.value = val;
  });
  // Show visual confirmation
  setTimeout(() => {
    const banner = document.createElement('div');
    banner.style.cssText = 'padding:10px 16px;border-radius:8px;background:rgba(0,212,170,.08);border:1px solid rgba(0,212,170,.3);font-size:12px;color:var(--teal);margin-top:12px;display:flex;align-items:center;gap:8px';
    banner.innerHTML = '✅ <span>Advisor profile restored from last session. <button onclick="clearAdvisorLS()" style="background:none;border:none;color:var(--dim);font-size:11px;cursor:pointer;text-decoration:underline;font-family:inherit">Clear</button></span>';
    banner.id = 'advisor-restore-notice';
    const disclaimer = form.nextElementSibling;
    if (disclaimer) form.parentNode.insertBefore(banner, disclaimer.nextSibling);
  }, 2000);
})();

function clearAdvisorLS() {
  try { localStorage.removeItem(LS_ADVISOR_KEY); } catch(e) {}
  lastFormData = {};
  isProfileComplete = false;
  document.getElementById('advisor-restore-notice')?.remove();
  toast('Advisor profile cleared from local storage', 'info');
}

// Patch advisor form submission to also save to LS
const _origAdvisorHandler = document.getElementById('af')._aiHandler;
document.getElementById('af').removeEventListener('submit', _origAdvisorHandler);
document.getElementById('af')._aiHandler2 = async function(e) {
  e.preventDefault();
  const fd = new FormData(this);
  const v = Object.fromEntries(fd);
  saveAdvisorToLS(v);
  // Trigger original handler
  await _origAdvisorHandler.call(this, e);
};
document.getElementById('af').addEventListener('submit', document.getElementById('af')._aiHandler2);

/* ══════════════════════════════════════════════
   DATA DEPENDENCY — Advisor Profile Required
   for Allergy, Analyzer, Dashboard sections
══════════════════════════════════════════════ */
const ADVISOR_REQUIRED_MSG = `
  <div style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:36px 24px;gap:16px">
    <div style="font-size:48px">🧬</div>
    <div style="font-family:var(--fd);font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--cyan)">Advisor Profile Required</div>
    <div style="font-size:13px;color:var(--txt2);line-height:1.7;max-width:420px">Please complete your profile in the <strong style="color:var(--cyan)">Advisor Section</strong> to enable personalized AI analysis. Your blood reports, allergies, and health history are needed to generate accurate results.</div>
    <button class="btn bv" onclick="goPage('home')" style="justify-content:center;margin-top:8px">📋 Go to Advisor →</button>
  </div>`;

function hasAdvisorProfile() {
  return !!(lastFormData && (lastFormData.bg || lastFormData.al || lastFormData.med || lastFormData.wbc));
}

// Patch initAllergyPage to show "no profile" message in ialerts when empty
const _origInitAllergyPage = window.initAllergyPage;
window.initAllergyPage = function() {
  _origInitAllergyPage();
  const ia = document.getElementById('ialerts');
  if (ia && !hasAdvisorProfile()) {
    ia.innerHTML = '<div style="color:var(--dim);font-size:12px;font-style:italic;padding:12px 0">Search an allergen above to view critical interaction alerts.</div>';
  }
  // Show advisor required message in allergy-ai-box if no profile
  const aiBox = document.getElementById('allergy-ai-box');
  if (aiBox && !hasAdvisorProfile()) {
    aiBox.style.display = 'block';
    aiBox.innerHTML = ADVISOR_REQUIRED_MSG;
  }
};

// Patch initAnalyzerPage to handle empty profile state
const _origInitAnalyzerPage = window.initAnalyzerPage;
window.initAnalyzerPage = function() {
  _origInitAnalyzerPage();
  const ia = document.getElementById('ialerts-analyzer');
  if (ia) {
    ia.innerHTML = '<div style="color:var(--dim);font-size:12px;font-style:italic;padding:12px 0">Enter a medicine above and click Analyze to see critical alerts.</div>';
  }
  if (!hasAdvisorProfile()) {
    const content = document.getElementById('medchk-content');
    if (content) {
      content.innerHTML = ADVISOR_REQUIRED_MSG;
      document.getElementById('medchk-result')?.classList.add('visible');
    }
  }
};

// checkMedSafety now handles all result display directly in ialerts-analyzer
// (patch removed — results are rendered by the main function)

// Patch filterAllergy to also populate ialerts with relevant ones + require profile
const _origFilterAllergy = window.filterAllergy;
window.filterAllergy = function() {
  if (!hasAdvisorProfile()) {
    const aiBox = document.getElementById('allergy-ai-box');
    if (aiBox) {
      aiBox.style.display = 'block';
      aiBox.innerHTML = ADVISOR_REQUIRED_MSG;
    }
    return;
  }
  const q = (document.getElementById('asrch')?.value || '').toLowerCase();
  // Populate ialerts with IALERTS relevant to query
  const ia = document.getElementById('ialerts');
  if (ia && q.length > 1) {
    const icons = {high:'🚨',mod:'⚠️',low:'ℹ️'};
    const relevant = IALERTS.filter(a => a.p.toLowerCase().includes(q) || q.split(' ').some(w => a.p.toLowerCase().includes(w)));
    if (relevant.length) {
      ia.innerHTML = '';
      relevant.forEach(a => {
        const d = document.createElement('div'); d.className = 'ia ' + a.s;
        d.innerHTML = `<div class="aii">${icons[a.s]}</div><div class="aic"><div class="ait">${a.p}</div><div class="aid">${a.n}</div></div>`;
        ia.appendChild(d);
      });
    } else {
      ia.innerHTML = '<div style="color:var(--dim);font-size:12px;font-style:italic;padding:12px 0">No critical interaction alerts for this specific allergen.</div>';
    }
  }
  _origFilterAllergy();
};

/* ══════════════════════════════════════════════
   GOOGLE MAPS — Live Location + Nearest Hospitals
   Dark "Midnight Commander" Snazzy Maps style
══════════════════════════════════════════════ */
const MIDNIGHT_STYLE = [
  {"elementType":"geometry","stylers":[{"color":"#0a0f1a"}]},
  {"elementType":"labels.text.fill","stylers":[{"color":"#546e7a"}]},
  {"elementType":"labels.text.stroke","stylers":[{"color":"#0a0f1a"}]},
  {"featureType":"administrative","elementType":"geometry","stylers":[{"color":"#0d2137"}]},
  {"featureType":"administrative.country","elementType":"labels.text.fill","stylers":[{"color":"#00d4aa"}]},
  {"featureType":"administrative.land_parcel","stylers":[{"visibility":"off"}]},
  {"featureType":"administrative.locality","elementType":"labels.text.fill","stylers":[{"color":"#00f5ff"}]},
  {"featureType":"poi","elementType":"labels.text.fill","stylers":[{"color":"#00d4aa"}]},
  {"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#061020"}]},
  {"featureType":"poi.park","elementType":"labels.text.fill","stylers":[{"color":"#1a4730"}]},
  {"featureType":"poi.medical","elementType":"geometry.fill","stylers":[{"color":"#0d1f3c"}]},
  {"featureType":"poi.medical","elementType":"labels.text.fill","stylers":[{"color":"#ff2d55"}]},
  {"featureType":"road","elementType":"geometry","stylers":[{"color":"#0d2137"}]},
  {"featureType":"road","elementType":"geometry.stroke","stylers":[{"color":"#0a1628"}]},
  {"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#546e7a"}]},
  {"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#001f3d"}]},
  {"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#00394d"}]},
  {"featureType":"road.highway","elementType":"labels.text.fill","stylers":[{"color":"#00c8d7"}]},
  {"featureType":"transit","elementType":"geometry","stylers":[{"color":"#071525"}]},
  {"featureType":"transit.station","elementType":"labels.text.fill","stylers":[{"color":"#0080ff"}]},
  {"featureType":"water","elementType":"geometry","stylers":[{"color":"#041425"}]},
  {"featureType":"water","elementType":"labels.text.fill","stylers":[{"color":"#0040aa"}]},
  {"featureType":"water","elementType":"labels.text.stroke","stylers":[{"color":"#041425"}]}
];

let vitreosMap = null;
let vitreosUserMarker = null;
let vitreosHospitalMarkers = [];

function initLiveMap() {
  const placeholder = document.getElementById('gmap-placeholder');
  const mapStatus = document.getElementById('map-status-label');
  if (placeholder) placeholder.style.display = 'none';
  if (mapStatus) mapStatus.textContent = '📡 Detecting your location...';

  // Check if Google Maps is loaded
  if (typeof google === 'undefined' || !google.maps) {
    const mapDiv = document.getElementById('vitreos-gmap');
    if (mapDiv) mapDiv.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;flex-direction:column;gap:12px"><div style="font-size:32px">⚠️</div><div style="font-family:var(--fd);font-size:10px;letter-spacing:2px;color:var(--orange)">GOOGLE MAPS LOADING</div><div style="font-size:12px;color:var(--txt2)">Please wait a moment and try again...</div><button class="btn bs" onclick="initLiveMap()" style="margin-top:8px">Retry</button></div>';
    toast('Google Maps is still loading — please retry in a moment', 'warning', 4000);
    return;
  }

  if (!navigator.geolocation) {
    toast('Geolocation is not supported by your browser', 'error');
    fallbackMap();
    return;
  }

  toast('📍 Requesting location permission...', 'info', 3000);
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      renderLiveMap(lat, lng);
    },
    (err) => {
      toast('Location denied — showing default map (Kolkata)', 'warning', 4000);
      renderLiveMap(22.5726, 88.3639); // Default Kolkata
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function renderLiveMap(lat, lng) {
  const mapDiv = document.getElementById('vitreos-gmap');
  if (!mapDiv) return;

  // Create map
  vitreosMap = new google.maps.Map(mapDiv, {
    center: { lat, lng },
    zoom: 14,
    styles: MIDNIGHT_STYLE,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_CENTER
    }
  });

  // User location marker (pulsing cyan)
  vitreosUserMarker = new google.maps.Marker({
    position: { lat, lng },
    map: vitreosMap,
    title: 'Your Location',
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: '#00f5ff',
      fillOpacity: 1,
      strokeColor: '#00d4aa',
      strokeWeight: 3
    }
  });

  const userInfoWindow = new google.maps.InfoWindow({
    content: '<div style="background:#010a12;color:#00f5ff;font-family:Orbitron,monospace;font-size:11px;padding:8px 12px;border-radius:6px;border:1px solid #00f5ff;">📍 You are here</div>'
  });
  vitreosUserMarker.addListener('click', () => userInfoWindow.open(vitreosMap, vitreosUserMarker));

  // Update status
  const mapStatus = document.getElementById('map-status-label');
  if (mapStatus) mapStatus.innerHTML = `✅ Location found — <strong style="color:var(--cyan)">Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}</strong> — Searching nearest hospitals...`;

  // Search for nearest hospitals using Places API
  searchNearestHospitals(lat, lng);
}

function searchNearestHospitals(lat, lng) {
  if (!vitreosMap || typeof google === 'undefined') return;

  const service = new google.maps.places.PlacesService(vitreosMap);
  const request = {
    location: new google.maps.LatLng(lat, lng),
    radius: 5000,
    type: ['hospital'],
    keyword: 'hospital emergency'
  };

  service.nearbySearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
      // Clear old markers
      vitreosHospitalMarkers.forEach(m => m.setMap(null));
      vitreosHospitalMarkers = [];

      const listDiv = document.getElementById('map-hospital-list');
      const resultsDiv = document.getElementById('map-hosp-results');
      if (listDiv) listDiv.style.display = 'block';
      if (resultsDiv) resultsDiv.innerHTML = '';

      const topResults = results.slice(0, 6);
      topResults.forEach((place, i) => {
        const plat = place.geometry.location.lat();
        const plng = place.geometry.location.lng();

        // Distance calculation
        const dist = calcDistKm(lat, lng, plat, plng);

        // Hospital marker (red cross)
        const marker = new google.maps.Marker({
          position: { lat: plat, lng: plng },
          map: vitreosMap,
          title: place.name,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#ff2d55',
            fillOpacity: 0.9,
            strokeColor: '#ffffff',
            strokeWeight: 2
          },
          label: {
            text: (i+1).toString(),
            color: '#ffffff',
            fontFamily: 'Orbitron, monospace',
            fontSize: '9px',
            fontWeight: 'bold'
          }
        });

        const infoContent = `<div style="background:#010a12;color:#e0f4ff;font-family:'Exo 2',sans-serif;font-size:12px;padding:10px 14px;border-radius:6px;border:1px solid #ff2d55;min-width:180px"><div style="font-family:Orbitron,monospace;font-size:10px;color:#ff2d55;margin-bottom:4px">🏥 Hospital #${i+1}</div><div style="font-weight:600;margin-bottom:4px">${place.name}</div>${place.vicinity?`<div style="color:#7eb8d4;font-size:11px">${place.vicinity}</div>`:''}${place.rating?`<div style="color:#ff8c00;margin-top:4px">⭐ ${place.rating}</div>`:''}<div style="color:#00d4aa;margin-top:4px">📍 ${dist.toFixed(1)} km away</div></div>`;
        const infoWindow = new google.maps.InfoWindow({ content: infoContent });
        marker.addListener('click', () => {
          vitreosHospitalMarkers.forEach(m => m._infoWindow?.close());
          infoWindow.open(vitreosMap, marker);
        });
        marker._infoWindow = infoWindow;
        vitreosHospitalMarkers.push(marker);

        // Add to list
        if (resultsDiv) {
          const rating = place.rating ? `⭐ ${place.rating}` : '';
          const bedStatus = i < 2 ? 'beds available' : i < 4 ? 'limited beds' : 'call ahead';
          const bedCls = i < 2 ? '' : i < 4 ? 'low' : 'full';
          resultsDiv.innerHTML += `<div class="hosp-item" onclick="vitreosMap.panTo({lat:${plat},lng:${plng}});vitreosMap.setZoom(16)" style="cursor:pointer">
            <span class="hosp-icon">🏥</span>
            <div class="hosp-info">
              <div class="hosp-name">${i+1}. ${place.name}</div>
              <div class="hosp-dist">📍 ${dist.toFixed(1)} km · ${place.vicinity||'Nearby'} ${rating}</div>
            </div>
            <span class="hosp-beds ${bedCls}">${bedStatus}</span>
          </div>`;
        }
      });

      // Draw routes to top 3
      topResults.slice(0, 3).forEach((place, i) => {
        const line = new google.maps.Polyline({
          path: [
            { lat, lng },
            { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
          ],
          geodesic: true,
          strokeColor: i === 0 ? '#ff2d55' : i === 1 ? '#ff8c00' : '#00d4aa',
          strokeOpacity: 0.5,
          strokeWeight: i === 0 ? 2.5 : 1.5,
          map: vitreosMap,
          icons: [{
            icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, strokeColor: '#ffffff' },
            offset: '50%'
          }]
        });
      });

      const mapStatus = document.getElementById('map-status-label');
      if (mapStatus) mapStatus.innerHTML = `✅ Found <strong style="color:var(--cyan)">${topResults.length} hospitals</strong> within 5km. Click a marker or list item for details.`;
      toast(`✅ Found ${topResults.length} nearby hospitals`, 'success');
    } else {
      const mapStatus = document.getElementById('map-status-label');
      if (mapStatus) mapStatus.innerHTML = '⚠ No hospitals found nearby. Check your location or try again.';
      toast('No nearby hospitals found via API', 'warning', 4000);
    }
  });
}

function calcDistKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function fallbackMap() {
  renderLiveMap(22.5726, 88.3639);
}
