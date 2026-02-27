/**
 * VITREOS — Advisor, Voice, Allergy, Dashboard, Food & Consult Module
 * ════════════════════════════════════════════════════════════════════
 * Handles:
 *  - Advisor form submission & renderReactions()
 *  - Voice/microphone symptom detection (Web Speech API)
 *  - Allergy search & interaction alerts
 *  - Dashboard chart initialisation (Chart.js)
 *  - Analysis history (localStorage)
 *  - PDF report generation (jsPDF)
 *  - Nutrition / food recommendations
 *  - Consult corner symptom analysis
 *  - Doctor voice call simulation
 */

/* ══ ADVISOR FORM ══ */
// RDATA removed — all analysis now handled by AI engine below

// Store last submitted form data for allergy sync
let lastFormData={};

// ── Profile Completion State ──
let isProfileComplete = false;

/**
 * Set profile as complete, update global state, and refresh any
 * open Allergy / Analyzer pages so their overlays disappear instantly.
 */
function markProfileComplete() {
  isProfileComplete = true;
  // If the user is currently on the allergy or analyzer page, re-init so
  // the "Advisor Profile Required" overlay is removed without a page reload.
  if (curPage === 'allergy')  initAllergyPage();
  if (curPage === 'analyzer') initAnalyzerPage();
}

/**
 * Robust JSON parser for all AI responses.
 * Strips markdown code fences, extracts the first { … } or [ … ] block,
 * and wraps JSON.parse in a try-catch that logs the raw string on failure.
 */
function safeParseAIResponse(rawData) {
  try {
    // 1. Remove markdown code fences and trim whitespace
    const cleanData = rawData.replace(/```json|```/g, '').trim();
    // 2. Try a direct parse first (fastest path)
    try { return JSON.parse(cleanData); } catch (_) { /* fall through */ }
    // 3. Extract the outermost JSON object { … }
    const objStart = cleanData.indexOf('{');
    const objEnd   = cleanData.lastIndexOf('}');
    if (objStart !== -1 && objEnd !== -1 && objEnd > objStart) {
      return JSON.parse(cleanData.substring(objStart, objEnd + 1));
    }
    // 4. Fallback: extract the outermost JSON array [ … ]
    const arrStart = cleanData.indexOf('[');
    const arrEnd   = cleanData.lastIndexOf(']');
    if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
      return JSON.parse(cleanData.substring(arrStart, arrEnd + 1));
    }
    throw new Error('No JSON object or array found in AI response');
  } catch (e) {
    console.error('[VITREOS] safeParseAIResponse — Parsing Error:', e.message);
    console.error('[VITREOS] Raw AI Response:', rawData);
    throw e;
  }
}

/* Static advisor handler removed — AI handler registered below */

function renderReactions(rxns){
  const g=document.getElementById('rg');g.innerHTML='';
  const lb={low:'Low Risk',mod:'Moderate',high:'High Risk'};
  rxns.forEach((r,i)=>{
    const d=document.createElement('div');d.className='gc rc fi2';d.style.animationDelay=i*.08+'s';
    d.innerHTML=`<div class="rh"><div class="rt">${r.t}</div><span class="badge b${r.s==='mod'?'m':r.s==='high'?'h':'l'}">${lb[r.s]}</span></div><p class="rd">${r.d}</p><div class="sb"><div class="sf ${r.s}" style="width:0"></div></div><div style="font-size:10.5px;color:var(--dim);margin-top:10px">⚡ AI Analysis · ${new Date().toLocaleTimeString()}</div>`;
    g.appendChild(d);
    setTimeout(()=>{const sf=d.querySelector('.sf');sf.style.width=r.s==='low'?'28%':r.s==='mod'?'62%':'94%'},80+i*80);
  });
}

/* ══ VOICE ══ */
let recog=null,isListening=false,symSet=new Set();
const SYMS=['headache','pain','fever','cough','fatigue','nausea','dizziness','shortness','rash','swelling','chest','palpitations','insomnia','anxiety','itching','burning','weakness','blurred','numbness','tingling'];
const SYMINFO={Headache:{r:'mod',n:'Could indicate tension or vascular issues. Monitor frequency.'},Fever:{r:'high',n:'Elevated temperature — potential infection. Seek care if persistent.'},Cough:{r:'mod',n:'May indicate respiratory infection or allergic reaction.'},Fatigue:{r:'low',n:'Can result from anemia, sleep issues, or medication side effects.'},Nausea:{r:'mod',n:'May be medication-induced or gastrointestinal distress.'},Dizziness:{r:'mod',n:'Possible low BP or inner ear issue. Avoid driving.'},Chest:{r:'high',n:'Chest symptoms require immediate medical evaluation.'},Rash:{r:'mod',n:'Skin reactions could indicate allergic response.'},Pain:{r:'mod',n:'Context and location important for diagnosis.'}};

(function(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  const mbtn=document.getElementById('mbtn'),ms=document.getElementById('ms'),vtr=document.getElementById('vtr'),wv=document.getElementById('wv'),vsym=document.getElementById('vsym'),mw=document.getElementById('mw');
  if(!SR){ms.textContent='Not supported – use Chrome';mbtn.disabled=true;mbtn.style.opacity='.4';return;}
  recog=new SR();recog.continuous=true;recog.interimResults=true;
  recog.onstart=()=>{mbtn.classList.add('on');mw.classList.add('on');ms.textContent='LISTENING...';ms.className='ms on';wv.classList.add('on');vtr.innerHTML=''};
  recog.onend=()=>{if(isListening)try{recog.start()}catch(e){}};
  recog.onresult=(e)=>{
    let fin='',inter='';
    for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript;e.results[i].isFinal?fin+=t:inter+=t;}
    const txt=fin||inter;vtr.innerHTML=`<span style="color:var(--txt)">${txt}</span>`;
    if(fin){SYMS.forEach(k=>{if(fin.toLowerCase().includes(k))symSet.add(k.charAt(0).toUpperCase()+k.slice(1))});
      vsym.innerHTML='';symSet.forEach(s=>{const t=document.createElement('span');t.className='symtag';t.textContent='🔬 '+s;vsym.appendChild(t)});}
  };
  recog.onerror=(e)=>{ms.textContent='Error: '+e.error;stopListen()};
  mbtn.addEventListener('click',()=>{isListening?stopListen():startListen()});
  function startListen(){isListening=true;try{recog.start()}catch(e){}}
  function stopListen(){isListening=false;recog.stop();mbtn.classList.remove('on');mw.classList.remove('on');ms.textContent='READY';ms.className='ms';wv.classList.remove('on');}
  document.getElementById('vabtn').addEventListener('click',async()=>{
    const transcriptText = document.getElementById('vtr').textContent || '';
    const hasTranscript = transcriptText && transcriptText.trim() && !transcriptText.includes('Speak to begin');
    if(!symSet.size && !hasTranscript){toast('No voice input detected yet','warning');return;}
    const btn=document.getElementById('vabtn');
    const origTxt=btn.textContent;
    btn.textContent='⏳ AI ANALYZING...';btn.disabled=true;

    const res=document.getElementById('vres'),resc=document.getElementById('vresc');
    res.style.display='block';
    resc.innerHTML=`
      <div style="display:flex;flex-direction:column;align-items:center;gap:14px;padding:24px 0;text-align:center">
        <div style="width:50px;height:50px;border-radius:50%;border:2px solid rgba(0,245,255,.3);border-top-color:var(--cyan);animation:spin 1s linear infinite"></div>
        <div style="font-family:var(--fd);font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--cyan)" id="ai-search-status">Querying Neural Network...</div>
        <div style="font-size:12px;color:var(--txt2)" id="ai-search-sub">AI NLP processing your voice query...</div>
        <div style="width:240px;height:3px;background:rgba(0,245,255,.1);border-radius:2px;overflow:hidden">
          <div id="ai-prog" style="height:100%;background:var(--cyan);width:0;border-radius:2px;transition:width 1.2s;box-shadow:0 0 6px var(--cyan)"></div>
        </div>
      </div>`;
    setTimeout(()=>{const p=document.getElementById('ai-prog');if(p)p.style.width='60%';},100);
    setTimeout(()=>{const s=document.getElementById('ai-search-status');const sb=document.getElementById('ai-search-sub');if(s)s.textContent='Generating AI Diagnosis...';if(sb)sb.textContent='AI analyzing natural language query against clinical knowledge base';const p=document.getElementById('ai-prog');if(p)p.style.width='90%';},1400);

    if(!vitreos_aiReady()){
      resc.innerHTML=vitreos_noKeyMsg('Voice AI Analysis');
      btn.textContent=origTxt;btn.disabled=false;return;
    }
    try{
      const symptoms=symSet.size ? Array.from(symSet).join(', ') : 'Not detected via keywords';
      const transcript=hasTranscript ? transcriptText : symptoms;
      // Include scan context if available
      const scanCtx = window.lastScanContext ? ` Recent scanned report context: ${window.lastScanContext}.` : '';
      const patientCtx=lastFormData.al?` Patient allergies: ${lastFormData.al}. Meds: ${lastFormData.med||'none'}. Blood: ${lastFormData.bg||'?'}, BP: ${lastFormData.bp||'?'} mmHg.${scanCtx}`:'';
      const raw=await callGroq(SP_VOICE,`Patient spoken natural language query: "${transcript}"\nDetected symptom keywords: ${symptoms}.${patientCtx}`);
      const analysis = safeParseAIResponse(raw);
      const sc={low:'var(--green)',mod:'var(--orange)',high:'var(--red)'};
      const sl={low:'Non-Urgent — Monitor at Home',mod:'Moderate — Seek Care if Worsening',high:'High Priority — Seek Immediate Care'};
      const si={low:'✅',mod:'⚠️',high:'🚨'};
      resc.innerHTML=`
        <div class="stag2" style="margin-bottom:14px">🧠 VITREOS AI Voice Analysis</div>
        <div style="padding:14px 16px;border-radius:10px;border:1px solid ${sc[analysis.severity]};background:rgba(0,20,40,.5);margin-bottom:18px">
          <div style="font-family:var(--fd);font-size:11px;color:${sc[analysis.severity]};letter-spacing:1px;margin-bottom:4px">${si[analysis.severity]} ${sl[analysis.severity]}</div>
          <div style="font-size:12.5px;color:var(--txt2);line-height:1.7">${analysis.advice}</div>
        </div>
        <div style="margin-bottom:16px">
          <div style="font-family:var(--fd);font-size:9.5px;letter-spacing:2px;color:var(--dim);text-transform:uppercase;margin-bottom:8px">Possible Conditions</div>
          <div style="display:flex;flex-wrap:wrap;gap:7px">${(analysis.conditions||[]).map(c=>`<span class="badge bi" style="padding:5px 12px;font-size:9px">${c}</span>`).join('')}</div>
        </div>
        <div style="margin-bottom:16px">
          <div style="font-family:var(--fd);font-size:9.5px;letter-spacing:2px;color:var(--dim);text-transform:uppercase;margin-bottom:8px">Suggested Remedies</div>
          <div class="remedy-list">${(analysis.remedies||[]).map(r=>`<div class="remedy-item">${r}</div>`).join('')}</div>
        </div>
        ${analysis.urgent?`<div style="padding:12px 16px;border-radius:8px;background:rgba(255,45,85,.08);border:1px solid var(--red);font-size:12.5px;color:var(--txt2);margin-bottom:12px"><strong style="color:var(--red)">🚨 URGENT:</strong> Please seek emergency care immediately.</div>`:''}
        <div style="font-size:10.5px;color:var(--dim);border-top:1px solid var(--border);padding-top:10px">⚡ VITREOS Neural AI · NLP Voice Analysis · ${new Date().toLocaleTimeString()} · ⚠ Not a substitute for professional advice</div>`;
      toast('✅ Voice AI analysis complete','success');
    }catch(err){
      resc.innerHTML=`<div style="color:var(--red);font-size:12px;padding:14px">⚠ AI analysis failed: ${err.message}</div>`;
      toast('AI Error: '+err.message,'error',5000);
    }
    btn.textContent=origTxt;btn.disabled=false;
  });
  document.getElementById('vcbtn').addEventListener('click',()=>{
    symSet.clear();vtr.innerHTML='<em style="color:var(--dim)">Speak to begin...</em>';
    document.getElementById('vsym').innerHTML='<span style="font-size:12.5px;color:var(--dim);font-style:italic">Symptoms will appear here...</span>';
    document.getElementById('vres').style.display='none';
  });
})();

/* ══ CONSULT DOCTOR NAVIGATION ══ */
function goConsultDoctor(mode){
  goPage('telehealth');
  if(mode==='voice'){
    setTimeout(()=>{
      const voiceSection=document.querySelector('#page-telehealth .nd:last-of-type');
      if(voiceSection)voiceSection.scrollIntoView({behavior:'smooth'});
    },300);
  }
  toast(`Navigating to Consult Doctor — ${mode==='video'?'Video Call':'Voice Consult'} mode`,'info',2500);
}

/* ══ VOICE CALL DOCTOR ══ */
let vcTimerInterval=null;
let vcSeconds=0;
function startVoiceCallDoctor(docName){
  const docLabel=docName||'Available Doctor';
  const callBtn=document.getElementById('vc-call-btn');
  const statusLabel=document.getElementById('vc-status-label');
  const connecting=document.getElementById('vc-connecting');
  const active=document.getElementById('vc-active');
  const prog=document.getElementById('vc-prog');
  const ring1=document.getElementById('vc-ring1');
  const ring2=document.getElementById('vc-ring2');
  if(!callBtn)return;

  // Show connecting state
  callBtn.style.display='none';
  statusLabel.textContent='CONNECTING...';
  connecting.style.display='block';
  active.style.display='none';
  toast('📞 Connecting to '+docLabel+'...','info',2000);

  // Animate progress bar
  setTimeout(()=>{if(prog)prog.style.width='100%';},100);

  setTimeout(()=>{
    connecting.style.display='none';
    active.style.display='block';
    statusLabel.textContent='ON CALL';
    statusLabel.style.color='var(--green)';
    document.getElementById('vc-doc-name').textContent='Connected to: '+docLabel;
    // Animate rings
    if(ring1){ring1.style.animation='ro 1.4s ease-out infinite';ring1.style.opacity='0.8';}
    if(ring2){ring2.style.animation='ro 1.4s ease-out infinite';ring2.style.animationDelay='.5s';ring2.style.opacity='0.8';}
    // Start timer
    vcSeconds=0;
    clearInterval(vcTimerInterval);
    vcTimerInterval=setInterval(()=>{
      vcSeconds++;
      const mm=String(Math.floor(vcSeconds/60)).padStart(2,'0');
      const ss=String(vcSeconds%60).padStart(2,'0');
      const timer=document.getElementById('vc-timer');
      if(timer)timer.textContent=mm+':'+ss;
    },1000);
    toast('✅ Connected to '+docLabel,'success',3000);
  },2800);
}

function endVoiceCallDoctor(){
  clearInterval(vcTimerInterval);
  const callBtn=document.getElementById('vc-call-btn');
  const statusLabel=document.getElementById('vc-status-label');
  const connecting=document.getElementById('vc-connecting');
  const active=document.getElementById('vc-active');
  const prog=document.getElementById('vc-prog');
  const ring1=document.getElementById('vc-ring1');
  const ring2=document.getElementById('vc-ring2');
  if(callBtn)callBtn.style.display='flex';
  if(statusLabel){statusLabel.textContent='TAP TO CALL';statusLabel.style.color='';}
  if(connecting)connecting.style.display='none';
  if(active)active.style.display='none';
  if(prog){prog.style.transition='none';prog.style.width='0';setTimeout(()=>{if(prog)prog.style.transition='width 2.5s linear';},50);}
  if(ring1)ring1.style.animation='none';
  if(ring2)ring2.style.animation='none';
  toast('Call ended. Duration: '+document.getElementById('vc-timer').textContent,'info',3000);
  // Show rating prompt
  setTimeout(()=>toast('Rate your consultation! Click ⭐ below.','success',3000),800);
}

/* ══ ALLERGY ══ */
/* ══ ALLERGY DATA — static ADB/IALERTS kept minimal for critical alerts only ══ */
const IALERTS=[
  {p:'Peanuts + MAO inhibitors',s:'high',n:'Severe hypertensive crisis possible. Strictly contraindicated.'},
  {p:'Penicillin + Warfarin',s:'high',n:'Significantly increases bleeding risk. Requires physician review.'},
  {p:'Latex + Kiwi/Banana',s:'mod',n:'Cross-reactive latex-fruit syndrome. Avoid these foods if latex-allergic.'},
  {p:'Aspirin + NSAIDs',s:'mod',n:'Additive GI bleeding risk. Use with extreme caution.'},
  {p:'Shellfish + Iodine Contrast',s:'high',n:'Iodine cross-reactivity risk during imaging. Alert radiologist.'},
];

function syncReportAllergies(allergens){
  if(!allergens||!allergens.length)return;
  // Show quick-tap chips so user can instantly AI-analyse each known allergen
  const panel=document.getElementById('allergy-report-chips');
  const wrap=document.getElementById('allergy-chips-wrap');
  if(!panel||!wrap)return;
  wrap.innerHTML='';
  allergens.filter(Boolean).forEach(a=>{
    const chip=document.createElement('button');
    chip.className='btn bs';
    chip.style.cssText='padding:6px 14px;font-size:9px;letter-spacing:1px';
    chip.textContent='🧬 '+a;
    chip.onclick=()=>{
      document.getElementById('asrch').value=a;
      filterAllergy();
    };
    wrap.appendChild(chip);
  });
  panel.style.display='block';
  toast('Report allergens loaded — click any to analyse','success');
}

let aFilt='all';
function setAFilter(btn,f){document.querySelectorAll('.fch').forEach(b=>b.classList.remove('act'));btn.classList.add('act');aFilt=f;}

function filterAllergy(){
  const q=document.getElementById('asrch')?document.getElementById('asrch').value.trim():'';
  if(q.length>1)runAllergyAI(q);
}

/* ══ MEDICINE SAFETY CHECK ══ */
/* MED_CONTRAINDICATIONS removed — all analysis done by AI */

/* checkMedSafety — defined in AI engine block */

/* ══ DASHBOARD ══ */
function initCharts(){
  const lc=document.getElementById('cline');
  if(lc)new Chart(lc,{type:'line',data:{labels:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'],datasets:[{label:'WBC (×10³/µL)',data:[6.2,7.1,5.8,9.4,7.3,8.1,6.9,7.2],borderColor:'#00f5ff',backgroundColor:'rgba(0,245,255,.06)',tension:.4,fill:true,pointBackgroundColor:'#00f5ff',pointRadius:4},{label:'Platelet (×10³/µL ÷10)',data:[15,18,14,10,9.8,11,13,9.8],borderColor:'#00d4aa',backgroundColor:'rgba(0,212,170,.04)',tension:.4,fill:true,pointBackgroundColor:'#00d4aa',pointRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#7eb8d4',font:{family:'Exo 2',size:11}}}},scales:{x:{ticks:{color:'#3a6a8a'},grid:{color:'rgba(0,100,150,.1)'}},y:{ticks:{color:'#3a6a8a'},grid:{color:'rgba(0,100,150,.1)'}}}}});
  const dc=document.getElementById('cdough');
  if(dc)new Chart(dc,{type:'doughnut',data:{labels:['Low Risk','Moderate','High Risk'],datasets:[{data:[58,30,12],backgroundColor:['rgba(0,255,136,.7)','rgba(255,140,0,.7)','rgba(255,45,85,.7)'],borderColor:['#00ff88','#ff8c00','#ff2d55'],borderWidth:1}]},options:{responsive:true,maintainAspectRatio:false,cutout:'68%',plugins:{legend:{position:'bottom',labels:{color:'#7eb8d4',font:{family:'Exo 2',size:11},padding:14}}}}});
  const hgb=document.getElementById('chgb');
  if(hgb)new Chart(hgb,{type:'line',data:{labels:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'],datasets:[{label:'Hemoglobin (g/dL)',data:[11.2,12.1,11.5,13.0,12.8,13.4,13.1,13.4],borderColor:'#ff8c00',backgroundColor:'rgba(255,140,0,.06)',tension:.4,fill:true,pointBackgroundColor:'#ff8c00',pointRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#7eb8d4',font:{family:'Exo 2',size:11}}}},scales:{x:{ticks:{color:'#3a6a8a'},grid:{color:'rgba(0,100,150,.1)'}},y:{ticks:{color:'#3a6a8a'},grid:{color:'rgba(0,100,150,.1)'}}}}});
  const rbc=document.getElementById('crbc');
  if(rbc)new Chart(rbc,{type:'line',data:{labels:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'],datasets:[{label:'RBC (×10⁶/µL)',data:[4.0,4.3,4.1,4.6,4.5,4.7,4.6,4.7],borderColor:'#00ff88',backgroundColor:'rgba(0,255,136,.04)',tension:.4,fill:true,pointBackgroundColor:'#00ff88',pointRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{labels:{color:'#7eb8d4',font:{family:'Exo 2',size:11}}}},scales:{x:{ticks:{color:'#3a6a8a'},grid:{color:'rgba(0,100,150,.1)'}},y:{ticks:{color:'#3a6a8a'},grid:{color:'rgba(0,100,150,.1)'}}}}});
  renderHistList();
}
const HIST_KEY='vitreos-hist';
function saveHist(d){const h=getHist();h.unshift({...d,ts:new Date().toISOString()});localStorage.setItem(HIST_KEY,JSON.stringify(h.slice(0,50)));}
function getHist(){try{return JSON.parse(localStorage.getItem(HIST_KEY)||'[]')}catch{return[]}}
function clearHist(){localStorage.removeItem(HIST_KEY);renderHistList();toast('History cleared','info')}
const SAMP=[{bg:'A+',wbc:'7.2',plt:'280',hgb:'13.4',med:'Metformin 500mg',ts:new Date(Date.now()-86400000).toISOString()},{bg:'A+',wbc:'9.1',plt:'195',hgb:'12.8',med:'Metformin, Atorvastatin',ts:new Date(Date.now()-86400000*5).toISOString()},{bg:'A+',wbc:'5.8',plt:'98',hgb:'11.5',med:'Metformin 500mg',ts:new Date(Date.now()-86400000*10).toISOString()},{bg:'A+',wbc:'11.4',plt:'340',hgb:'13.0',med:'Metformin, Losartan',ts:new Date(Date.now()-86400000*15).toISOString()},{bg:'A+',wbc:'7.0',plt:'260',hgb:'12.1',med:'Metformin, Losartan',ts:new Date(Date.now()-86400000*20).toISOString()}];
function renderHistList(){
  const el=document.getElementById('hlist');if(!el)return;el.innerHTML='';
  const h=getHist().length>0?getHist():SAMP;
  const lb=[['bl','Clear'],['bm','Review'],['bh','Alert']];
  h.slice(0,7).forEach((item,i)=>{
    const dt=new Date(item.ts);const d=document.createElement('div');d.className='hi';
    const wbc=item.wbc?`WBC:${item.wbc}`:'';const plt=item.plt?`PLT:${item.plt}`:'';
    d.innerHTML=`<div class="hd">${dt.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</div><div class="hin"><div class="ht">${item.bg||'General'} · ${wbc} ${plt}</div><div class="hs2">${item.med||item.medications||'General check'}</div></div><span class="badge ${lb[i%3][0]}">${lb[i%3][1]}</span>`;
    el.appendChild(d);
  });
  const tot=document.getElementById('dtot');if(tot)tot.textContent=getHist().length||12;
}
function dlReport(){
  toast('Compiling PDF report...','info',2000);
  setTimeout(()=>{
    try{
      const {jsPDF}=window.jspdf;
      const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
      const W=doc.internal.pageSize.getWidth();
      const H=doc.internal.pageSize.getHeight();
      const cyan=[0,200,220],teal=[0,180,160],red=[200,50,80],orange=[200,120,0],green=[0,180,100],dim=[80,120,140];

      // Header
      doc.setFillColor(1,10,18);
      doc.rect(0,0,W,28,'F');
      doc.setFontSize(18);doc.setFont('helvetica','bold');doc.setTextColor(...cyan);
      doc.text('VITREOS — AI Medical Report',14,13);
      doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(...dim);
      doc.text('Generated: '+new Date().toLocaleString(),14,21);
      doc.text('Confidential Medical Document',W-14,21,{align:'right'});

      let y=36;

      // Section: User Profile
      doc.setFontSize(11);doc.setFont('helvetica','bold');doc.setTextColor(...teal);
      doc.text('USER PROFILE',14,y);y+=6;
      doc.setDrawColor(...teal);doc.line(14,y,W-14,y);y+=5;
      const fd=lastFormData;
      const profileData=[
        ['Blood Group',fd.bg||'Not provided'],
        ['Blood Pressure (Systolic)',fd.bp?fd.bp+' mmHg':'Not provided'],
        ['Known Allergies',fd.al||'None recorded'],
        ['Current Medication',fd.med||'None recorded'],
        ['Dosage',fd.dos||'N/A'],
        ['WBC Count',fd.wbc?fd.wbc+' ×10³/µL':'N/A'],
        ['Hemoglobin',fd.hgb?fd.hgb+' g/dL':'N/A'],
        ['Platelet Count',fd.plt?fd.plt+' ×10³/µL':'N/A'],
        ['RBC Count',fd.rbc?fd.rbc+' ×10⁶/µL':'N/A'],
      ];
      doc.autoTable({startY:y,head:[['Parameter','Value']],body:profileData,theme:'grid',headStyles:{fillColor:[0,40,80],textColor:cyan,fontStyle:'bold',fontSize:9},bodyStyles:{textColor:[200,220,240],fillColor:[2,14,26],fontSize:9},alternateRowStyles:{fillColor:[0,20,40]},margin:{left:14,right:14}});
      y=doc.lastAutoTable.finalY+10;

      // Section: Allergy Analysis
      if(y>H-40){doc.addPage();y=20;}
      doc.setFontSize(11);doc.setFont('helvetica','bold');doc.setTextColor(...teal);
      doc.text('ALLERGY ANALYSIS',14,y);y+=6;
      doc.setDrawColor(...teal);doc.line(14,y,W-14,y);y+=5;
      const knownAllergies=(fd.al||'None recorded').split(',').map(a=>a.trim()).filter(Boolean);
      const allergyRows=knownAllergies.map(a=>[a,'From Report','MODERATE','See AI analysis in app','Report-Sync']);
      if(!allergyRows.length)allergyRows.push(['No allergens recorded','—','—','Submit Advisor profile','—']);
      doc.autoTable({startY:y,head:[['Allergen','Category','Severity','Notes','Source']],body:allergyRows,theme:'grid',headStyles:{fillColor:[0,40,80],textColor:cyan,fontStyle:'bold',fontSize:9},bodyStyles:{textColor:[200,220,240],fillColor:[2,14,26],fontSize:8},alternateRowStyles:{fillColor:[0,20,40]},margin:{left:14,right:14}});
      y=doc.lastAutoTable.finalY+10;

      // Section: Risk Summary
      if(y>H-40){doc.addPage();y=20;}
      doc.setFontSize(11);doc.setFont('helvetica','bold');doc.setTextColor(...teal);
      doc.text('ALLERGIC REACTION RISK SUMMARY',14,y);y+=6;
      doc.setDrawColor(...teal);doc.line(14,y,W-14,y);y+=5;
      const riskRows=[['Low Risk (Mild or no reaction)','58%','Normal monitoring. Minor precautions recommended.'],['Moderate Risk (Hives, swelling)','30%','Carry antihistamines. Notify care providers.'],['High Risk (Anaphylaxis risk)','12%','Carry EpiPen. Strict avoidance required.']];
      doc.autoTable({startY:y,head:[['Risk Level','Distribution','Guidance']],body:riskRows,theme:'grid',headStyles:{fillColor:[0,40,80],textColor:cyan,fontStyle:'bold',fontSize:9},bodyStyles:{textColor:[200,220,240],fillColor:[2,14,26],fontSize:9},alternateRowStyles:{fillColor:[0,20,40]},margin:{left:14,right:14}});
      y=doc.lastAutoTable.finalY+10;

      // Section: Symptom History (Sample)
      if(y>H-40){doc.addPage();y=20;}
      doc.setFontSize(11);doc.setFont('helvetica','bold');doc.setTextColor(...teal);
      doc.text('ANALYSIS HISTORY',14,y);y+=6;
      doc.setDrawColor(...teal);doc.line(14,y,W-14,y);y+=5;
      const hist=getHist().length>0?getHist():SAMP;
      const histRows=hist.slice(0,8).map(h=>[new Date(h.ts).toLocaleDateString(),h.bg||'—',h.wbc||'—',h.plt||'—',h.hgb||'—',h.med||'General check']);
      doc.autoTable({startY:y,head:[['Date','Blood Group','WBC','Platelet','Hgb','Medication']],body:histRows,theme:'grid',headStyles:{fillColor:[0,40,80],textColor:cyan,fontStyle:'bold',fontSize:9},bodyStyles:{textColor:[200,220,240],fillColor:[2,14,26],fontSize:8},alternateRowStyles:{fillColor:[0,20,40]},margin:{left:14,right:14}});
      y=doc.lastAutoTable.finalY+10;

      // Section: Critical Interaction Alerts
      if(y>H-40){doc.addPage();y=20;}
      doc.setFontSize(11);doc.setFont('helvetica','bold');doc.setTextColor(200,80,100);
      doc.text('CRITICAL INTERACTION ALERTS',14,y);y+=6;
      doc.setDrawColor(200,80,100);doc.line(14,y,W-14,y);y+=5;
      const alertRows=IALERTS.map(a=>[a.p,a.s.toUpperCase(),a.n]);
      doc.autoTable({startY:y,head:[['Interaction Pair','Severity','Advisory Note']],body:alertRows,theme:'grid',headStyles:{fillColor:[60,0,20],textColor:[255,150,170],fontStyle:'bold',fontSize:9},bodyStyles:{textColor:[200,220,240],fillColor:[2,14,26],fontSize:9},alternateRowStyles:{fillColor:[0,20,40]},margin:{left:14,right:14}});
      y=doc.lastAutoTable.finalY+10;

      // Footer on all pages
      const totalPages=doc.getNumberOfPages();
      for(let i=1;i<=totalPages;i++){
        doc.setPage(i);
        doc.setFillColor(1,10,18);doc.rect(0,H-12,W,12,'F');
        doc.setFontSize(7);doc.setFont('helvetica','normal');doc.setTextColor(...dim);
        doc.text('VITREOS AI Medical Advisor — Confidential. For informational purposes only. Not a substitute for professional medical advice.',14,H-4);
        doc.text('Page '+i+' of '+totalPages,W-14,H-4,{align:'right'});
      }

      doc.save('VITREOS_Medical_Report_'+new Date().toISOString().slice(0,10)+'.pdf');
      toast('PDF report downloaded!','success');
    }catch(err){
      console.error('PDF error:',err);
      toast('PDF generation failed. Trying fallback...','warning');
      window.print();
    }
  },800);
}

/* ══ FOOD / NUTRITION ══ */
// FD, AI_FOOD_TEMPLATES, getRecommendations removed — all recommendations now generated by AI

function renderFoodData(data,condLabel){
  function r(el,items,isAvoid){
    if(!el)return;
    el.innerHTML='';
    items.forEach(item=>{const d=document.createElement('div');d.className='fit'+(isAvoid?' avo':'');d.innerHTML=`<span class="fito">${item.i}</span><span class="fitn">${item.n}</span><span class="fitb">${item.b}</span>`;el.appendChild(d);});
  }
  r(document.getElementById('feat'),data.eat,false);
  r(document.getElementById('favd'),data.avoid,true);
  if(condLabel)toast('AI recommendations loaded for: '+condLabel,'success');
}

/* quickFood — now calls AI with health profile context */
async function quickFood(btn,c){
  document.querySelectorAll('.cp').forEach(b=>b.classList.remove('act'));
  btn.classList.add('act');
  document.getElementById('condInput').value='';
  if(!vitreos_aiReady()){
    document.getElementById('feat').innerHTML=vitreos_noKeyMsg('Nutrition AI');
    document.getElementById('favd').innerHTML='';
    return;
  }
  document.getElementById('foodLoading').classList.add('show');
  document.getElementById('feat').innerHTML='<div style="font-size:12px;color:var(--dim);font-style:italic;padding:14px 0">🧠 Neural network generating AI recommendations...</div>';
  document.getElementById('favd').innerHTML='<div style="font-size:12px;color:var(--dim);font-style:italic;padding:14px 0">Personalizing based on health profile...</div>';
  try{
    const label=c.charAt(0).toUpperCase()+c.slice(1);
    const patientCtx=lastFormData.al?` Patient allergies: ${lastFormData.al}. Meds: ${lastFormData.med||'none'}. WBC: ${lastFormData.wbc||'?'}, HGB: ${lastFormData.hgb||'?'}.`:'';
    const raw=await callGroq(SP_FOOD,`Health condition: "${label}".${patientCtx}`,700);
    const rec = safeParseAIResponse(raw);
    document.getElementById('foodLoading').classList.remove('show');
    renderFoodData(rec,rec.label||label);
    _renderFoodExtra(rec);
  }catch(err){
    document.getElementById('foodLoading').classList.remove('show');
    document.getElementById('feat').innerHTML=`<div style="color:var(--red);font-size:12px">⚠ AI failed: ${err.message}</div>`;
    toast('AI Error: '+err.message,'error',5000);
  }
}

function _renderFoodExtra(rec){
  const foodExtra=document.getElementById('food-ai-extra');
  if(!foodExtra)return;
  foodExtra.innerHTML=`
    <div class="nd"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px">
      <div class="gc" style="padding:18px">
        <div style="font-family:var(--fd);font-size:9.5px;letter-spacing:2px;color:var(--teal);margin-bottom:10px">🍽 AI MEAL PLAN</div>
        <div style="font-size:13px;color:var(--txt2);line-height:1.8">${rec.mealPlan||'Personalized meal plan based on your condition.'}</div>
      </div>
      <div class="gc" style="padding:18px">
        <div style="font-family:var(--fd);font-size:9.5px;letter-spacing:2px;color:var(--teal);margin-bottom:10px">💊 RECOMMENDED SUPPLEMENTS</div>
        ${(rec.supplements||[]).map(s=>`<div style="font-size:12.5px;color:var(--txt2);padding:5px 0;border-bottom:1px solid var(--border)">• ${s}</div>`).join('')}
      </div>
    </div>
    <div style="font-size:10px;color:var(--dim);margin-top:12px;text-align:center">⚡ VITREOS Nutrition Neural Engine · ${new Date().toLocaleTimeString()}</div>`;
}

/* ══ CONSULT CORNER ══ */
function appendSymptom(s){
  const inp=document.getElementById('symptom-input');
  inp.value=(inp.value?inp.value+', ':'')+s;
}

// CONDITION_MAP, REMEDIES_MAP removed — symptom analysis handled by AI engine

/* analyzeSymptoms — defined in AI engine block below */

function appointDoctor(type){
  const label=type==='video'?'Video Call':'Audio Call';
  toast(`Initiating ${label} appointment booking...`,'info',3000);
  setTimeout(()=>toast('Connecting to next available doctor. Avg wait: ~2 minutes.','success',4000),1200);
}

/* ══ UTILS ══ */
function delay(ms){return new Promise(r=>setTimeout(r,ms));}
