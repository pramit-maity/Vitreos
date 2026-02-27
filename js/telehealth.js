/**
 * VITREOS — Telehealth System Module
 * ════════════════════════════════════
 * Handles:
 *  - Region / location selector (Country → State → City → PIN)
 *  - Doctors database & listing (DOCTORS_DB)
 *  - Hospitals database (HOSPITALS_DB)
 *  - Triage level selection
 *  - Video call booking & payment modal
 *  - Video call timer & post-call rating
 *  - Emergency SOS, ambulance tracker
 *  - Appointments management (book, filter, join)
 *  - Billing / wallet & transaction history
 *  - Google Maps integration (initMap, searchNearestHospitals)
 */

/* ══════════════════════════════════════
   TELEHEALTH SYSTEM
══════════════════════════════════════ */

// ── Region Data ──
const REGIONS = {
  India: {
    states: {
      'West Bengal': { cities: { 'Kolkata': ['700001','700002','700003','700019'], 'Howrah': ['711101','711102'], 'Siliguri': ['734001'] } },
      'Maharashtra': { cities: { 'Mumbai': ['400001','400002','400051'], 'Pune': ['411001','411002'], 'Nagpur': ['440001'] } },
      'Karnataka': { cities: { 'Bengaluru': ['560001','560002','560011'], 'Mysuru': ['570001'] } },
      'Tamil Nadu': { cities: { 'Chennai': ['600001','600002','600017'], 'Coimbatore': ['641001'] } },
      'Delhi': { cities: { 'New Delhi': ['110001','110002','110003'], 'North Delhi': ['110007'] } }
    }
  },
  USA: { states: { 'California': { cities: { 'Los Angeles':['90001'] } }, 'New York': { cities: { 'New York City':['10001'] } } } },
  UK: { states: { 'England': { cities: { 'London':['EC1A'] } } } }
};

// ── Doctors Database ──
const DOCTORS_DB = [
  {id:'D001',name:'Dr. Priya Sharma',spec:'General Physician',rating:4.9,exp:'12 yrs',lang:['Hindi','Bengali'],fee:250,visits:500,avatar:'👩‍⚕️',verified:true,online:true,region:'Kolkata'},
  {id:'D002',name:'Dr. Rahul Mehta',spec:'Cardiologist',rating:4.8,exp:'15 yrs',lang:['Hindi','English'],fee:250,visits:500,avatar:'👨‍⚕️',verified:true,online:true,region:'Kolkata'},
  {id:'D003',name:'Dr. Sunita Rao',spec:'Pediatrician',rating:4.7,exp:'9 yrs',lang:['Telugu','English'],fee:250,visits:500,avatar:'👩‍⚕️',verified:true,online:false,region:'Kolkata'},
  {id:'D004',name:'Dr. Arjun Singh',spec:'Neurologist',rating:4.9,exp:'18 yrs',lang:['Hindi','Punjabi'],fee:250,visits:500,avatar:'👨‍⚕️',verified:true,online:true,region:'Mumbai'},
  {id:'D005',name:'Dr. Kavitha Nair',spec:'Dermatologist',rating:4.6,exp:'7 yrs',lang:['Malayalam','English'],fee:250,visits:500,avatar:'👩‍⚕️',verified:true,online:true,region:'Chennai'},
  {id:'D006',name:'Dr. Aditya Kumar',spec:'Orthopedic',rating:4.8,exp:'13 yrs',lang:['Hindi','English'],fee:250,visits:500,avatar:'👨‍⚕️',verified:true,online:true,region:'Kolkata'},
];

// ── Hospitals Database ──
const HOSPITALS_DB = [
  {id:'H001',name:'Kolkata Medical College',type:'Government',dist:'0.8 km',beds:42,totalBeds:200,emoji:'🏥',region:'Kolkata'},
  {id:'H002',name:'Apollo Gleneagles',type:'Multi-Speciality',dist:'1.2 km',beds:8,totalBeds:300,emoji:'🏨',region:'Kolkata'},
  {id:'H003',name:'AMRI Hospitals',type:'Private',dist:'2.1 km',beds:18,totalBeds:150,emoji:'🏩',region:'Kolkata'},
  {id:'H004',name:'Fortis Hospital',type:'Multi-Speciality',dist:'3.5 km',beds:0,totalBeds:200,emoji:'🏥',region:'Kolkata'},
];

let selectedRegion = {country:'India', state:'West Bengal', city:'Kolkata', pin:'700001'};
let selectedDoctor = null;
let selectedTriage = null;
let activeCallTimer = null;
let emergencyTriggered = false;

// ══ TELEHEALTH PAGE ══
function initTelehealthPage(){
  renderRegionSelects();
  renderDoctors('Kolkata');
}

function renderRegionSelects(){
  const wrap = document.getElementById('region-form');
  if(!wrap)return;
  const countries = Object.keys(REGIONS);
  const states = Object.keys(REGIONS[selectedRegion.country]?.states||{});
  const cities = Object.keys(REGIONS[selectedRegion.country]?.states[selectedRegion.state]?.cities||{});
  const pins = REGIONS[selectedRegion.country]?.states[selectedRegion.state]?.cities[selectedRegion.city]||[];
  wrap.innerHTML=`
    <div class="region-grid">
      <div class="region-step">
        <div class="rs-num">01</div>
        <div class="rs-label">Country</div>
        <select class="fs" onchange="updateRegion('country',this.value)" style="width:100%">
          ${countries.map(c=>`<option ${c===selectedRegion.country?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="region-step">
        <div class="rs-num">02</div>
        <div class="rs-label">State / Province</div>
        <select class="fs" onchange="updateRegion('state',this.value)" style="width:100%">
          ${states.map(s=>`<option ${s===selectedRegion.state?'selected':''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="region-step">
        <div class="rs-num">03</div>
        <div class="rs-label">City</div>
        <select class="fs" onchange="updateRegion('city',this.value)" style="width:100%">
          ${cities.map(c=>`<option ${c===selectedRegion.city?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="region-step">
        <div class="rs-num">04</div>
        <div class="rs-label">Pincode</div>
        <select class="fs" onchange="updateRegion('pin',this.value)" style="width:100%">
          ${pins.map(p=>`<option ${p===selectedRegion.pin?'selected':''}>${p}</option>`).join('')}
        </select>
      </div>
    </div>
    <div style="text-align:center;margin-bottom:10px">
      <button class="btn bs" onclick="autoGPS()" style="font-size:9px;padding:9px 18px">📍 Auto-Detect GPS Location</button>
    </div>
  `;
}

function updateRegion(key, val){
  selectedRegion[key] = val;
  if(key==='country'){selectedRegion.state=Object.keys(REGIONS[val]?.states||{})[0]||'';selectedRegion.city='';}
  if(key==='state'){selectedRegion.city=Object.keys(REGIONS[selectedRegion.country]?.states[val]?.cities||{})[0]||'';}
  renderRegionSelects();
  renderDoctors(selectedRegion.city);
}

function autoGPS(){
  toast('Detecting location via GPS...','info',2000);
  setTimeout(()=>{
    selectedRegion={country:'India',state:'West Bengal',city:'Kolkata',pin:'700001'};
    renderRegionSelects();
    renderDoctors('Kolkata');
    toast('Location detected: Kolkata, West Bengal','success');
  },1500);
}

function renderDoctors(city){
  const wrap = document.getElementById('doctors-grid');
  if(!wrap)return;
  const docs = DOCTORS_DB.filter(d=>d.region===city||!city);
  if(!docs.length){wrap.innerHTML=`<div class="re"><div class="rei">🔍</div><p>No doctors found in this region</p></div>`;return;}
  wrap.innerHTML = docs.map(d=>`
    <div class="doctor-full-card">
      <div class="dfc-top">
        <div class="dfc-avatar">${d.avatar}</div>
        <div>
          <div class="dfc-name">${d.name}</div>
          <div class="dfc-spec">${d.spec}</div>
          <div class="dfc-rating">⭐ ${d.rating} · ${d.exp} exp</div>
        </div>
      </div>
      <div class="dfc-badges">
        ${d.verified?'<span class="badge bt">✓ Verified</span>':''}
        <span class="badge ${d.online?'bl':'bm'}">${d.online?'● Online':'○ Offline'}</span>
        ${d.lang.map(l=>`<span class="badge bi" style="font-size:8px">${l}</span>`).join('')}
      </div>
      <div style="font-family:var(--fd);font-size:10px;color:var(--txt2);margin-bottom:12px">
        💰 Video: ₹250 &nbsp;|&nbsp; Visit: ₹500–600
      </div>
      <div class="dfc-actions">
        <button class="dfc-btn video" onclick="bookVideoCall('${d.id}')">📹 Video Call</button>
        <button class="dfc-btn visit" onclick="bookVisit('${d.id}')">🏥 Book Visit</button>
      </div>
    </div>
  `).join('');
}

function selectTriage(level){
  selectedTriage=level;
  document.querySelectorAll('.triage-card').forEach(c=>c.style.opacity=c.dataset.level===level?'1':'.5');
  const labels={easy:'🟢 Easy — Video Consult',moderate:'🟡 Moderate — Physical Visit',critical:'🔴 Critical — Emergency'};
  toast(`Triage Level: ${labels[level]}`,'info',3000);
  if(level==='critical'){triggerEmergencyAlert();}
}

function bookVideoCall(docId){
  selectedDoctor = DOCTORS_DB.find(d=>d.id===docId);
  document.getElementById('vc-doctor-name').textContent=selectedDoctor?.name||'Doctor';
  document.getElementById('vc-doctor-spec').textContent=selectedDoctor?.spec||'';
  document.getElementById('payment-modal').classList.add('open');
}

function bookVisit(docId){
  selectedDoctor = DOCTORS_DB.find(d=>d.id===docId);
  goPage('appointments');
  setTimeout(()=>{
    document.getElementById('new-appt-section').scrollIntoView({behavior:'smooth'});
    if(selectedDoctor){
      document.getElementById('appt-doctor-sel').value=selectedDoctor.name;
      toast(`Booking visit with ${selectedDoctor.name}`,'success');
    }
  },300);
}

// ══ PAYMENT MODAL ══
function confirmPayment(){
  document.getElementById('payment-modal').classList.remove('open');
  document.getElementById('video-call-modal').classList.add('open');
  startVideoCallTimer();
  toast('Payment successful! Connecting to doctor...','success');
}

function startVideoCallTimer(){
  let secs=0;
  const el=document.getElementById('vc-timer');
  clearInterval(activeCallTimer);
  setTimeout(()=>{
    document.getElementById('vc-status').classList.add('live');
    document.getElementById('vc-connecting').style.display='none';
    document.getElementById('vc-live-ui').style.display='flex';
    toast('Doctor connected!','success');
  },2500);
  activeCallTimer=setInterval(()=>{
    secs++;
    const m=String(Math.floor(secs/60)).padStart(2,'0');
    const s=String(secs%60).padStart(2,'0');
    if(el)el.textContent=`${m}:${s}`;
  },1000);
}

function endVideoCall(){
  clearInterval(activeCallTimer);
  document.getElementById('video-call-modal').classList.remove('open');
  document.getElementById('post-call-modal').classList.add('open');
  toast('Call ended. Duration: 12:34','info');
}

function submitRating(stars){
  document.querySelectorAll('.star-btn').forEach((b,i)=>b.style.color=i<stars?'var(--orange)':'var(--dim)');
  setTimeout(()=>{
    document.getElementById('post-call-modal').classList.remove('open');
    toast('Thank you for your feedback!','success');
    addTransaction({title:`Video Call — ${selectedDoctor?.name||'Doctor'}`,type:'debit',amount:'₹250',icon:'📹',date:new Date().toLocaleDateString()});
  },800);
}

// ══ EMERGENCY PAGE ══
const CRITICAL_SYMPTOMS=[
  {icon:'💔',name:'Severe Chest Pain',desc:'Crushing pressure, radiating to arm/jaw',sev:'CRITICAL'},
  {icon:'😮‍💨',name:'Breathing Difficulty',desc:'Unable to breathe, gasping for air',sev:'CRITICAL'},
  {icon:'🧠',name:'Stroke Symptoms',desc:'Sudden numbness, slurred speech, vision loss',sev:'CRITICAL'},
  {icon:'😵',name:'Loss of Consciousness',desc:'Unresponsive, fainting, seizure',sev:'CRITICAL'},
  {icon:'🩸',name:'Severe Hemorrhage',desc:'Uncontrolled bleeding, internal bleeding',sev:'CRITICAL'},
  {icon:'🤕',name:'Head Injury',desc:'Severe trauma, concussion symptoms',sev:'HIGH'},
  {icon:'🌡️',name:'High Fever (>104°F)',desc:'Persistent fever with severe symptoms',sev:'HIGH'},
  {icon:'💊',name:'Drug Overdose',desc:'Medication overdose, poisoning',sev:'CRITICAL'},
];

function initEmergencyPage(){
  const wrap=document.getElementById('critical-symptoms-list');
  if(!wrap)return;
  wrap.innerHTML=CRITICAL_SYMPTOMS.map((s,i)=>`
    <div class="cs-item" onclick="toggleCriticalSymptom(this,${i})" data-idx="${i}">
      <span class="cs-icon">${s.icon}</span>
      <div class="cs-text">
        <div class="cs-name">${s.name}</div>
        <div class="cs-desc">${s.desc}</div>
      </div>
      <span class="cs-severity">${s.sev}</span>
    </div>
  `).join('');
  renderHospitals();
}

let selectedCriticalSymptoms=[];
function toggleCriticalSymptom(el,idx){
  el.classList.toggle('selected');
  const sym=CRITICAL_SYMPTOMS[idx];
  if(el.classList.contains('selected')){
    selectedCriticalSymptoms.push(sym);
    if(sym.sev==='CRITICAL')triggerEmergencyAlert(sym.name);
  } else {
    selectedCriticalSymptoms=selectedCriticalSymptoms.filter(s=>s.name!==sym.name);
  }
}

function renderHospitals(){
  const wrap=document.getElementById('nearby-hospitals');
  if(!wrap)return;
  wrap.innerHTML=HOSPITALS_DB.filter(h=>h.region===selectedRegion.city||true).slice(0,4).map(h=>{
    const pct=h.beds/h.totalBeds;
    const cls=pct===0?'full':pct<0.1?'low':'';
    const bedLabel=h.beds===0?'FULL':''+h.beds+' beds free';
    return `<div class="hosp-item">
      <span class="hosp-icon">${h.emoji}</span>
      <div class="hosp-info">
        <div class="hosp-name">${h.name}</div>
        <div class="hosp-dist">📍 ${h.dist} · ${h.type}</div>
      </div>
      <span class="hosp-beds ${cls}">${bedLabel}</span>
    </div>`;
  }).join('');
}

function triggerEmergencyAlert(symptom='Critical Condition'){
  const alert=document.getElementById('emergency-alert');
  if(!alert)return;
  document.getElementById('alert-symptom').textContent=symptom;
  alert.classList.add('show');
}

function confirmEmergency(){
  document.getElementById('emergency-alert').classList.remove('show');
  emergencyTriggered=true;
  toast('🚨 EMERGENCY TRIGGERED — Ambulance dispatched!','error',5000);
  setTimeout(()=>toast('🏥 Apollo Gleneagles notified — Bed reserved','success',4000),1200);
  setTimeout(()=>toast('📱 Emergency contact SMS sent','info',3000),2400);
  setTimeout(()=>toast('📍 Live GPS tracking started','info',3000),3600);
  // Redirect to Emergency page and activate ambulance tracker
  goPage('emergency');
  setTimeout(()=>{
    const trackerSection=document.getElementById('amb-tracker-section');
    if(trackerSection){
      trackerSection.style.display='block';
      setTimeout(()=>trackerSection.scrollIntoView({behavior:'smooth'}),200);
    }
    startAmbulanceTracker();
  },400);
}

function cancelEmergency(){
  document.getElementById('emergency-alert').classList.remove('show');
}

function startAmbulanceTracker(){
  const tracker=document.getElementById('amb-tracker-section');
  if(tracker){tracker.style.display='block';tracker.scrollIntoView({behavior:'smooth'});}
  let pos=0;
  const dot=document.querySelector('.amb-dot');
  if(dot){
    const interval=setInterval(()=>{
      pos+=2;
      dot.style.left=(20+pos*0.4)+'%';
      dot.style.top=(60-pos*0.3)+'%';
      if(pos>40){clearInterval(interval);toast('🚑 Ambulance arrived!','success',4000);}
    },200);
  }
}

function callAmbulance(){triggerEmergencyAlert('Manual Ambulance Request');}
function callNearestHospital(){toast('Calling Apollo Gleneagles Emergency: +91-33-2320-3040','info',4000);}
function notifyContact(){toast('SMS sent to emergency contact: +91-98XXX-XXXXX','success',3000);}
function shareGPS(){toast('Live GPS link sent to emergency contact','success',3000);}

// ══ APPOINTMENTS PAGE ══
let appointmentsDB=[
  {id:'A001',doctor:'Dr. Priya Sharma',spec:'General Physician',type:'Video Call',date:'2026-03-05',time:'10:30 AM',status:'upcoming',fee:250},
  {id:'A002',doctor:'Dr. Rahul Mehta',spec:'Cardiologist',type:'Physical Visit',date:'2026-02-20',time:'2:00 PM',status:'completed',fee:500},
  {id:'A003',doctor:'Dr. Sunita Rao',spec:'Pediatrician',type:'Video Call',date:'2026-02-10',time:'11:00 AM',status:'completed',fee:250},
  {id:'A004',doctor:'Dr. Aditya Kumar',spec:'Orthopedic',type:'Physical Visit',date:'2026-02-28',time:'4:30 PM',status:'cancelled',fee:500},
];

function renderAppointments(filter='all'){
  const wrap=document.getElementById('appt-list');
  if(!wrap)return;
  const list=filter==='all'?appointmentsDB:appointmentsDB.filter(a=>a.status===filter);
  if(!list.length){wrap.innerHTML=`<div class="re"><div class="rei">📅</div><p>No appointments found</p></div>`;return;}
  wrap.innerHTML=list.map(a=>{
    const d=new Date(a.date);
    const day=d.getDate();
    const mon=d.toLocaleString('default',{month:'short'}).toUpperCase();
    const typeIcon=a.type==='Video Call'?'📹':'🏥';
    return `<div class="appt-item">
      <div class="appt-date-box"><div class="appt-day">${day}</div><div class="appt-month">${mon}</div></div>
      <div class="appt-info">
        <div class="appt-doc">${a.doctor}</div>
        <div class="appt-type">${typeIcon} ${a.type} · ${a.spec}</div>
        <div class="appt-time">🕐 ${a.time} &nbsp;·&nbsp; ₹${a.fee}</div>
      </div>
      <div class="appt-actions">
        <span class="appt-badge ${a.status}">${a.status}</span>
        ${a.status==='upcoming'?`<button class="dfc-btn video" style="padding:7px 12px;font-size:8.5px" onclick="joinAppt('${a.id}')">Join</button>`:''}
      </div>
    </div>`;
  }).join('');
}

function filterAppts(tab,el){
  document.querySelectorAll('.appt-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  renderAppointments(tab);
}

function joinAppt(id){
  const a=appointmentsDB.find(x=>x.id===id);
  if(a&&a.type==='Video Call'){
    const doc=DOCTORS_DB.find(d=>d.name===a.doctor)||DOCTORS_DB[0];
    bookVideoCall(doc.id);
  } else {
    toast('Generating QR check-in code...','info',2000);
    setTimeout(()=>toast('QR Code ready — Show at clinic reception','success',3000),1500);
  }
}

function bookNewAppointment(){
  const doc=document.getElementById('appt-doctor-sel').value;
  const date=document.getElementById('appt-date').value;
  const slot=document.querySelector('.time-slot.sel');
  const type=document.getElementById('appt-type-sel').value;
  if(!doc||!date||!slot){toast('Please fill all fields and select a time slot','warning');return;}
  const newAppt={
    id:'A00'+(appointmentsDB.length+1),
    doctor:doc,spec:'General',
    type:type==='video'?'Video Call':'Physical Visit',
    date,time:slot.textContent,
    status:'upcoming',fee:type==='video'?250:500
  };
  appointmentsDB.unshift(newAppt);
  renderAppointments();
  toast('Appointment booked successfully!','success');
  addTransaction({title:`Booking — ${doc}`,type:'debit',amount:'₹'+(type==='video'?250:500),icon:'📅',date:new Date().toLocaleDateString()});
}

function selectSlot(el){
  document.querySelectorAll('.time-slot').forEach(s=>s.classList.remove('sel'));
  el.classList.add('sel');
}

// ══ BILLING PAGE ══
let walletBalance=1850;
let transactions=[
  {title:'Video Call — Dr. Priya Sharma',type:'debit',amount:'₹250',icon:'📹',date:'Feb 20, 2026'},
  {title:'Physical Visit — Dr. Rahul Mehta',type:'debit',amount:'₹500',icon:'🏥',date:'Feb 15, 2026'},
  {title:'Wallet Top-up',type:'credit',amount:'₹2000',icon:'💳',date:'Feb 10, 2026'},
  {title:'Video Call — Dr. Sunita Rao',type:'debit',amount:'₹250',icon:'📹',date:'Feb 5, 2026'},
  {title:'Referral Bonus',type:'credit',amount:'₹100',icon:'🎁',date:'Jan 30, 2026'},
];

function addTransaction(txn){
  transactions.unshift(txn);
  if(txn.type==='debit'){walletBalance-=parseInt(txn.amount.replace('₹',''));}
  renderBilling();
}

function renderBilling(){
  const bal=document.getElementById('wallet-balance');
  if(bal)bal.textContent='₹'+walletBalance.toLocaleString();
  const wrap=document.getElementById('txn-list');
  if(!wrap)return;
  wrap.innerHTML=transactions.slice(0,8).map(t=>`
    <div class="txn">
      <div class="txn-icon">${t.icon}</div>
      <div class="txn-info">
        <div class="txn-title">${t.title}</div>
        <div class="txn-date">${t.date}</div>
      </div>
      <div class="txn-amount ${t.type}">${t.type==='credit'?'+':'-'}${t.amount}</div>
    </div>
  `).join('');
}

let selectedPayMethod='upi';
function selectPayMethod(method,el){
  selectedPayMethod=method;
  document.querySelectorAll('.pay-method').forEach(m=>m.classList.remove('selected'));
  el.classList.add('selected');
  el.querySelector('.pay-check').textContent='✓';
  document.querySelectorAll('.pay-method:not(.selected) .pay-check').forEach(c=>c.textContent='');
}

function addFunds(){
  const amt=parseInt(document.getElementById('topup-amount').value)||0;
  if(amt<10){toast('Minimum top-up amount is ₹10','warning');return;}
  toast(`Processing payment of ₹${amt} via ${selectedPayMethod.toUpperCase()}...`,'info',2000);
  setTimeout(()=>{
    walletBalance+=amt;
    addTransaction({title:'Wallet Top-up',type:'credit',amount:'₹'+amt,icon:'💳',date:new Date().toLocaleDateString()});
    toast('₹'+amt+' added to wallet!','success');
  },2000);
}

// ══ ADMIN MOVED TO vitreos-admin.html ══

// ══ PAGE INIT HOOKS ══ (handled in patched goPage above)
