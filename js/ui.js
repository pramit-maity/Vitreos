/**
 * VITREOS — Core UI Module
 * ════════════════════════════
 * Handles:
 *  - Language / i18n switching (English, Hindi, Bengali, Tamil, etc.)
 *  - Page navigation (goPage)
 *  - Particle canvas background animation
 *  - Toast notification system
 *  - Loader / splash screen
 *  - Theme toggle (dark / light)
 *  - Mobile hamburger menu
 */

/* ══ LANGUAGE ══ */
const LANGS={
  en:{flag:'🇬🇧',keys:{bioInterface:'Biological Interface',neuralEngine:'⚕ Neural Analysis Engine',advisorSub:'Enter your medical profile for instant AI-powered drug interaction and reaction analysis.',bloodGroup:'Blood Group',bloodPressure:'Blood Pressure (Systolic)',allergies:'Known Allergies',medications:'Current Medication',dosage:'Dosage',analyzeBtn:'⚡ Analyze Reaction',disclaimer:'⚠ For informational purposes only. Consult a qualified physician.',nutritionSub:'Personalized dietary guidance based on your medical condition.',navAdvisor:'Advisor',navVoice:'Voice',navAllergies:'Allergies',navAnalyzer:'Analyzer',navConsult:'Consult Corner',navDash:'Dashboard',navNutrition:'Nutrition',dashTitle:'Medical History Dashboard',dashSub:'Track CBC health trends and review past analyses.',downloadReport:'📄 Download Report',allergyTitle:'Allergy Detection',allergySub:'Cross-reference allergies with foods, medications, and environmental triggers.',analyzerTitle:'Drug Suitability Analyzer',analyzerSub:'Check if a medicine is safe based on your allergy profile and health data.',consultTitle:'Consult Corner',consultSub:'AI-powered symptom checker with telemedicine access.',foodTitle:'Food Recommendation',voiceTitle:'Voice Medical Assistant',voiceSub:'Speak your symptoms naturally. AI listens, transcribes, and generates real-time medical analysis.'}},
  hi:{flag:'🇮🇳',keys:{bioInterface:'जैविक इंटरफेस',neuralEngine:'⚕ न्यूरल विश्लेषण इंजन',advisorSub:'त्वरित AI-संचालित विश्लेषण के लिए अपनी चिकित्सा प्रोफ़ाइल दर्ज करें।',bloodGroup:'रक्त समूह',bloodPressure:'रक्त चाप (सिस्टोलिक)',allergies:'ज्ञात एलर्जी',medications:'वर्तमान दवाएं',dosage:'खुराक',analyzeBtn:'⚡ प्रतिक्रिया विश्लेषण',disclaimer:'⚠ केवल सूचनात्मक उद्देश्यों के लिए। योग्य चिकित्सक से परामर्श करें।',nutritionSub:'आपकी चिकित्सा स्थिति के आधार पर व्यक्तिगत आहार मार्गदर्शन।',navAdvisor:'सलाहकार',navVoice:'वॉयस',navAllergies:'एलर्जी',navAnalyzer:'विश्लेषक',navConsult:'परामर्श',navDash:'डैशबोर्ड',navNutrition:'पोषण',dashTitle:'चिकित्सा इतिहास डैशबोर्ड',dashSub:'CBC स्वास्थ्य रुझान ट्रैक करें।',downloadReport:'📄 रिपोर्ट डाउनलोड',analyzeBtn:'⚡ प्रतिक्रिया विश्लेषण'}},
  bn:{flag:'🇧🇩',keys:{bioInterface:'জৈবিক ইন্টারফেস',neuralEngine:'⚕ নিউরাল বিশ্লেষণ ইঞ্জিন',advisorSub:'তাৎক্ষণিক AI-চালিত বিশ্লেষণের জন্য আপনার চিকিৎসা প্রোফাইল লিখুন।',bloodGroup:'রক্তের গ্রুপ',bloodPressure:'রক্তচাপ (সিস্টোলিক)',allergies:'পরিচিত অ্যালার্জি',medications:'বর্তমান ওষুধ',dosage:'ডোজ',analyzeBtn:'⚡ প্রতিক্রিয়া বিশ্লেষণ',disclaimer:'⚠ শুধুমাত্র তথ্যের উদ্দেশ্যে। যোগ্য চিকিৎসকের পরামর্শ নিন।',nutritionSub:'আপনার চিকিৎসা অবস্থার উপর ভিত্তি করে ব্যক্তিগত খাদ্য নির্দেশনা।',navAdvisor:'উপদেষ্টা',navVoice:'ভয়েস',navAllergies:'অ্যালার্জি',navAnalyzer:'বিশ্লেষক',navConsult:'পরামর্শ',navDash:'ড্যাশবোর্ড',navNutrition:'পুষ্টি',downloadReport:'📄 রিপোর্ট ডাউনলোড'}},
  te:{flag:'🇮🇳',keys:{bioInterface:'జీవ ఇంటర్‌ఫేస్',neuralEngine:'⚕ నాడీ విశ్లేషణ ఇంజిన్',advisorSub:'తక్షణ AI-ఆధారిత విశ్లేషణ కోసం మీ వైద్య ప్రొఫైల్ నమోదు చేయండి.',bloodGroup:'రక్త సమూహం',bloodPressure:'రక్తపోటు',allergies:'తెలిసిన అలెర్జీలు',medications:'ప్రస్తుత మందులు',dosage:'మోతాదు',analyzeBtn:'⚡ ప్రతిచర్య విశ్లేషించు',disclaimer:'⚠ సమాచార ప్రయోజనాల కోసం మాత్రమే. అర్హత గల వైద్యుడిని సంప్రదించండి.',nutritionSub:'మీ వైద్య పరిస్థితి ఆధారంగా వ్యక్తిగత ఆహార మార్గదర్శకత్వం.',navAdvisor:'సలహాదారు',navVoice:'వాయిస్',navAllergies:'అలెర్జీలు',navAnalyzer:'విశ్లేషకుడు',navConsult:'సంప్రదింపు',navDash:'డాష్‌బోర్డ్',navNutrition:'పోషణ',downloadReport:'📄 నివేదిక డౌన్‌లోడ్'}},
  mr:{flag:'🇮🇳',keys:{bioInterface:'जैविक इंटरफेस',neuralEngine:'⚕ न्यूरल विश्लेषण इंजिन',advisorSub:'त्वरित AI-चालित विश्लेषणासाठी तुमची वैद्यकीय प्रोफाइल प्रविष्ट करा.',bloodGroup:'रक्त गट',bloodPressure:'रक्तदाब',allergies:'ज्ञात ऍलर्जी',medications:'सध्याची औषधे',dosage:'डोस',analyzeBtn:'⚡ प्रतिक्रिया विश्लेषण करा',disclaimer:'⚠ केवळ माहितीच्या उद्देशाने. पात्र वैद्यांशी सल्लामसलत करा.',nutritionSub:'तुमच्या वैद्यकीय स्थितीनुसार वैयक्तिक आहार मार्गदर्शन.',navAdvisor:'सल्लागार',navVoice:'आवाज',navAllergies:'ऍलर्जी',navAnalyzer:'विश्लेषक',navConsult:'सल्ला',navDash:'डॅशबोर्ड',navNutrition:'पोषण',downloadReport:'📄 अहवाल डाउनलोड'}},
  ta:{flag:'🇮🇳',keys:{bioInterface:'உயிரியல் இடைமுகம்',neuralEngine:'⚕ நரம்பியல் பகுப்பாய்வு இயந்திரம்',advisorSub:'உடனடி AI-சார்ந்த பகுப்பாய்வுக்கு உங்கள் மருத்துவ சுயவிவரத்தை உள்ளிடவும்.',bloodGroup:'இரத்த வகை',bloodPressure:'இரத்த அழுத்தம்',allergies:'அறியப்பட்ட ஒவ்வாமைகள்',medications:'தற்போதைய மருந்துகள்',dosage:'அளவு',analyzeBtn:'⚡ எதிர்வினை பகுப்பாய்வு',disclaimer:'⚠ தகவல் நோக்கங்களுக்காக மட்டுமே. தகுதிவாய்ந்த மருத்துவரை அணுகவும்.',nutritionSub:'உங்கள் மருத்துவ நிலையின் அடிப்படையில் தனிப்பட்ட உணவு வழிகாட்டுதல்.',navAdvisor:'ஆலோசகர்',navVoice:'குரல்',navAllergies:'ஒவ்வாமை',navAnalyzer:'பகுப்பாய்வி',navConsult:'ஆலோசனை',navDash:'டாஷ்போர்டு',navNutrition:'ஊட்டம்',downloadReport:'📄 அறிக்கை பதிவிறக்கம்'}},
  es:{flag:'🇪🇸',keys:{bioInterface:'Interfaz Biológica',neuralEngine:'⚕ Motor de Análisis Neural',advisorSub:'Ingrese su perfil médico para análisis instantáneo impulsado por IA.',bloodGroup:'Grupo Sanguíneo',bloodPressure:'Presión Arterial (Sistólica)',allergies:'Alergias Conocidas',medications:'Medicación Actual',dosage:'Dosis',analyzeBtn:'⚡ Analizar Reacción',disclaimer:'⚠ Solo para fines informativos. Consulte siempre a un médico.',nutritionSub:'Orientación dietética personalizada basada en su condición médica.',navAdvisor:'Asesor',navVoice:'Voz',navAllergies:'Alergias',navAnalyzer:'Analizador',navConsult:'Consulta',navDash:'Panel',navNutrition:'Nutrición',downloadReport:'📄 Descargar Informe'}},
  fr:{flag:'🇫🇷',keys:{bioInterface:'Interface Biologique',neuralEngine:'⚕ Moteur d\'Analyse Neural',advisorSub:'Entrez votre profil médical pour une analyse IA instantanée.',bloodGroup:'Groupe Sanguin',bloodPressure:'Pression Artérielle (Systolique)',allergies:'Allergies Connues',medications:'Médicaments Actuels',dosage:'Posologie',analyzeBtn:'⚡ Analyser la Réaction',disclaimer:'⚠ À titre informatif uniquement. Consultez toujours un médecin.',nutritionSub:'Conseils diététiques personnalisés basés sur votre condition médicale.',navAdvisor:'Conseiller',navVoice:'Voix',navAllergies:'Allergies',navAnalyzer:'Analyseur',navConsult:'Consultation',navDash:'Tableau de Bord',navNutrition:'Nutrition',downloadReport:'📄 Télécharger le Rapport'}},
  de:{flag:'🇩🇪',keys:{bioInterface:'Biologisches Interface',neuralEngine:'⚕ KI-Analyse-Engine',advisorSub:'Geben Sie Ihr Medizinprofil für sofortige KI-Analyse ein.',bloodGroup:'Blutgruppe',bloodPressure:'Blutdruck (Systolisch)',allergies:'Bekannte Allergien',medications:'Aktuelle Medikamente',dosage:'Dosierung',analyzeBtn:'⚡ Reaktion Analysieren',disclaimer:'⚠ Nur zu Informationszwecken. Konsultieren Sie immer einen Arzt.',nutritionSub:'Personalisierte Ernährungsberatung basierend auf Ihrem Gesundheitszustand.',navAdvisor:'Berater',navVoice:'Stimme',navAllergies:'Allergien',navAnalyzer:'Analysator',navConsult:'Beratung',navDash:'Dashboard',navNutrition:'Ernährung',downloadReport:'📄 Bericht Herunterladen'}},
};

function setLang(l){
  const t=LANGS[l];if(!t)return;
  // Update all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const k=el.getAttribute('data-i18n');
    if(t.keys[k])el.textContent=t.keys[k];
  });
  // Update nav buttons with data-nav-i18n
  const navMap={home:'navAdvisor',voice:'navVoice',allergy:'navAllergies',analyzer:'navAnalyzer',consult:'navConsult',dash:'navDash',food:'navNutrition'};
  document.querySelectorAll('.nl button[data-p]').forEach(btn=>{
    const p=btn.dataset.p;
    const k=navMap[p];
    if(k&&t.keys[k])btn.textContent=t.keys[k];
  });
  // Update download report button
  const dlBtn=document.querySelector('[onclick="dlReport()"]');
  if(dlBtn&&t.keys.downloadReport)dlBtn.textContent=t.keys.downloadReport;
  document.documentElement.lang=l;
  toast('Language: '+t.flag+' selected','info',2000);
}

/* ══ CORE ══ */
// Particles
(function(){
  const c=document.getElementById('pc'),ctx=c.getContext('2d');
  let W,H,ps=[];
  function rsz(){W=c.width=innerWidth;H=c.height=innerHeight}rsz();
  window.addEventListener('resize',rsz);
  class P{constructor(){this.rs()}
    rs(){this.x=Math.random()*W;this.y=Math.random()*H;this.vx=(Math.random()-.5)*.28;this.vy=(Math.random()-.5)*.28;this.r=Math.random()*1.4+.4;this.a=Math.random()*.45+.1;this.h=[185,170,200,160][Math.floor(Math.random()*4)]}
    u(){this.x+=this.vx;this.y+=this.vy;if(this.x<0||this.x>W||this.y<0||this.y>H)this.rs()}
    d(){ctx.beginPath();ctx.arc(this.x,this.y,this.r,0,Math.PI*2);ctx.fillStyle=`hsla(${this.h},90%,70%,${this.a})`;ctx.fill()}
  }
  for(let i=0;i<100;i++)ps.push(new P());
  function draw(){
    ctx.clearRect(0,0,W,H);
    for(let i=0;i<ps.length;i++){
      ps[i].u();ps[i].d();
      for(let j=i+1;j<ps.length;j++){
        const dx=ps[i].x-ps[j].x,dy=ps[i].y-ps[j].y,d=Math.sqrt(dx*dx+dy*dy);
        if(d<95){ctx.beginPath();ctx.strokeStyle=`rgba(0,200,220,${(1-d/95)*.13})`;ctx.lineWidth=.5;ctx.moveTo(ps[i].x,ps[i].y);ctx.lineTo(ps[j].x,ps[j].y);ctx.stroke()}
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

// Loader
setTimeout(()=>document.getElementById('ls').classList.add('gone'),1700);

// Nav
document.getElementById('ham').addEventListener('click',function(){
  document.getElementById('nl').classList.toggle('open');
});

// Theme
document.getElementById('tbtn').addEventListener('click',function(){
  document.documentElement.classList.toggle('light-theme');
  this.textContent=document.documentElement.classList.contains('light-theme')?'🌙':'☀️';
});

// Toast
function toast(msg,type='info',ms=3200){
  const c=document.getElementById('tc'),icons={success:'✓',warning:'⚠',error:'✖',info:'ℹ'};
  const t=document.createElement('div');t.className=`toast ${type}`;t.innerHTML=`<span>${icons[type]||'ℹ'}</span><span>${msg}</span>`;
  c.appendChild(t);setTimeout(()=>{t.style.transition='opacity .3s,transform .3s';t.style.opacity='0';t.style.transform='translateX(100%)';setTimeout(()=>t.remove(),300)},ms);
}

// Page Router
let curPage='home';
let chartsInited=false;
function goPage(p){
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
  document.getElementById('page-'+p).classList.add('active');
  document.querySelectorAll('.nl button').forEach(b=>{b.classList.toggle('act',b.dataset.p===p)});
  document.getElementById('nl').classList.remove('open');
  window.scrollTo(0,0);
  curPage=p;
  if(p==='dash'&&!chartsInited){chartsInited=true;setTimeout(initCharts,100);}
  if(p==='allergy')initAllergyPage();
  if(p==='analyzer')initAnalyzerPage();
  // Telehealth system hooks
  if(p==='telehealth')initTelehealthPage();
  if(p==='emergency')initEmergencyPage();
  if(p==='appointments')renderAppointments();
  if(p==='billing')renderBilling();
}

// Animate stats
setTimeout(()=>{
  function count(el,target,suf){let cur=0;const s=target/50;const t=setInterval(()=>{cur=Math.min(cur+s,target);el.textContent=Math.floor(cur)+suf;if(cur>=target)clearInterval(t)},25)}
  count(document.getElementById('sv1'),98,'%');
  count(document.getElementById('sv2'),2400,'');
},1800);
