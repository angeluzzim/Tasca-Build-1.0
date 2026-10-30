'use strict';
window.onerror=(m,s,l)=>{const v=document.querySelector('#view');if(v)v.innerHTML='<div class="empty">Errore: '+m+' (riga '+l+')</div>'};
/* Tasca – logica. Dati salvati nel browser (localStorage), esportabili da Impostazioni. */
const KEY='tasca.v1',COL=['mint','lav','peach','sky','butter','rose'];
const DEF=()=>({cfg:{cur:'EUR',theme:'system',names:{home:'Panoramica',income:'Entrate',exp:'Spese',savings:'Risparmi',piggy:'Salvadanaio',goals:'Obiettivi',profile:'Profilo',settings:'Impostazioni'},cats:['Stipendio','Freelance','Regali','Rimborsi','Altro'],hide:[],xcats:['Casa','Spesa','Trasporti','Svago','Salute','Abbonamenti','Altro'],budget:0,sync:''},income:[],exp:[],savings:[],piggy:{target:0,coins:[]},goals:[],profile:{}});
const CODES='AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BRL BSD BTN BWP BYN BZD CAD CDF CHF CLP CNY COP CRC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SOS SRD SSP STN SVC SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD UYU UZS VES VND VUV WST XAF XCD XOF XPF YER ZAR ZMW ZWL'.split(' ');
const TOPC=['EUR','USD','GBP','CHF','JPY','CAD','AUD','CNY'];
const OLDCUR={'€':'EUR','$':'USD','£':'GBP','¥':'JPY','₹':'INR','Fr':'CHF'};
const norm=s=>{const d=DEF();s={...d,...s};s.cfg={...d.cfg,...s.cfg};s.cfg.names={...d.cfg.names,...s.cfg.names};s.profile={...d.profile,...s.profile};
  if(!CODES.includes(s.cfg.cur))s.cfg.cur=OLDCUR[s.cfg.cur]||'EUR';
  if(!['light','dark','system'].includes(s.cfg.theme))s.cfg.theme='system';return s};
let S=(()=>{try{return norm(JSON.parse(localStorage.getItem(KEY))||{})}catch(_){return DEF()}})();
let MON=null;

/* ---------- utilità ---------- */
const $=q=>document.querySelector(q);
const e=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9);
const today=()=>new Date().toISOString().slice(0,10);
const mk=()=>today().slice(0,7);
const NF={};
const money=n=>{const c=S.cfg.cur;try{return(NF[c]=NF[c]||new Intl.NumberFormat('it-IT',{style:'currency',currency:c})).format(+n)}catch(_){return c+' '+(+n).toFixed(2)}};
const curName=c=>{try{return new Intl.DisplayNames(['it'],{type:'currency'}).of(c)}catch(_){return c}};
const curSym=c=>{try{return new Intl.NumberFormat('it-IT',{style:'currency',currency:c,currencyDisplay:'narrowSymbol'}).formatToParts(0).find(p=>p.type=='currency').value}catch(_){return c}};
const curOpt=c=>{const n=curName(c),y=curSym(c);return `<option value="${c}" ${c==S.cfg.cur?'selected':''}>${c} – ${e(n)}${y&&y!=c?' ('+e(y)+')':''}</option>`};

/* tema: chiaro / scuro / di sistema */
const MQ=window.matchMedia?matchMedia('(prefers-color-scheme: dark)'):null;
function applyTheme(){const t=S.cfg.theme,dk=t=='dark'||(t=='system'&&MQ&&MQ.matches);
  document.documentElement.dataset.theme=dk?'dark':'light';
  const m=document.querySelector('meta[name=theme-color]');if(m)m.content=dk?'#14151D':'#DCD6F2'}
if(MQ){const f=()=>S.cfg.theme=='system'&&applyTheme();MQ.addEventListener?MQ.addEventListener('change',f):MQ.addListener(f)}
applyTheme();

/* animazione di caricamento */
let LC=1;
const showLoad=m=>{LC++;const l=$('#loader');if(!l)return;$('#lmsg').textContent=m||'Caricamento…';l.classList.add('on')};
const hideLoad=()=>{LC=Math.max(0,LC-1);const l=$('#loader');if(l&&!LC)l.classList.remove('on')};
const busy=(p,m)=>{showLoad(m);return Promise.resolve(p).finally(()=>setTimeout(hideLoad,350))};

/* icone */
const IC={menu:'M4 6h16M4 12h16M4 18h16',home:'M3 11l9-8 9 8M5 10v10h14V10',income:'M12 4v12m0 0l-5-5m5 5l5-5M4 20h16',exp:'M12 20V8m0 0l-5 5m5-5l5 5M4 4h16',savings:'M3 9l9-5 9 5M5 9v9M10 9v9M14 9v9M19 9v9M3 20h18',piggy:'M12 3a9 9 0 100 18 9 9 0 000-18zM9.5 9.5h4a1.5 1.5 0 010 3h-3a1.5 1.5 0 000 3h4M12 7v10',goals:'M12 3a9 9 0 100 18 9 9 0 000-18zM12 8a4 4 0 100 8 4 4 0 000-8z',profile:'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6',settings:'M4 7h10M18 7h2M4 17h2M10 17h10M16 5v4M8 15v4'};
const ico=k=>`<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${IC[k]}"/></svg>`;
const initials=()=>{const p=S.profile;return ((p.nome||'')[0]||'')+((p.cognome||'')[0]||'')};
const avaHTML=()=>S.profile.photo?`<img src="${e(S.profile.photo)}" alt="">`:(initials()?e(initials().toUpperCase()):ico('profile'));
const sum=a=>a.reduce((s,x)=>s+x,0);
const N=()=>S.cfg.names;
const find=(L,i)=>S[L].find(x=>x.id==i);
let warned=0;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch{if(!warned++)toast('Memoria del browser non disponibile: i dati non verranno salvati')}render()};
const toast=t=>{const o=$('#toast');o.textContent=t;o.className='on';setTimeout(()=>o.className='',2200)};
const bar=(p,c)=>`<div class="bar"><i style="width:${Math.max(0,Math.min(100,p||0))}%;background:var(--${c})"></i></div>`;
const last=n=>[...Array(n)].map((_,i)=>{const d=new Date();d.setDate(1);d.setHours(12);d.setMonth(d.getMonth()-(n-1-i));return d.toISOString().slice(0,7)});
const inM=(m,L='income')=>S[L].filter(x=>x.d.slice(0,7)==m||(x.rep=='Ogni mese'&&x.d.slice(0,7)<=m));
const del=(L,i)=>confirm('Eliminare questo elemento?')&&(S[L]=S[L].filter(x=>x.id!=i),save());
const xs=m=>sum(inM(m,'exp').map(x=>x.a));
const empty=t=>`<div class="empty">${t}</div>`;

/* ---------- modulo generico (aggiungere/modificare qualsiasi cosa) ---------- */
function form(title,fields,vals,ok){
  const f=$('#frm');
  f.innerHTML=`<h2>${e(title)}</h2>`+fields.map(x=>{
    const v=vals[x.k];
    if(x.t==='select'){const o=x.o.includes(v)||v==null?x.o:[v,...x.o];
      return `<label>${e(x.l)}<select name="${x.k}">${o.map(y=>`<option ${y==v?'selected':''}>${e(y)}</option>`).join('')}</select></label>`}
    return `<label>${e(x.l)}<input name="${x.k}" type="${x.t||'text'}" ${x.t==='number'?'step="0.01"':''} value="${e(v==null?'':v)}" ${x.r?'required':''}></label>`}).join('')
    +`<div class="row"><button value="cancel" formnovalidate>Annulla</button><button value="ok" class="pri">Salva</button></div>`;
  f.onsubmit=ev=>{
    if(!ev.submitter||ev.submitter.value!=='ok')return;
    const d={};fields.forEach(x=>{const v=f.elements[x.k].value;d[x.k]=x.t==='number'?(parseFloat(v)||0):v});ok(d)};
  $('#dlg').showModal();
}

/* ---------- viste ---------- */
const V={};

V.home=()=>{
  const m=mk(),inc=sum(inM(m).map(x=>x.a)),sv=sum(S.savings.map(x=>x.bal)),pg=sum(S.piggy.coins.map(x=>x.a)),gs=sum(S.goals.map(x=>x.saved));
  const dep=sum([].concat.apply([],S.savings.map(a=>a.mov)).filter(x=>x.d.slice(0,7)==m&&x.a>0).map(x=>x.a));
  const xc={};inM(m,'exp').forEach(x=>xc[x.c]=(xc[x.c]||0)+x.a);const xt=xs(m),B=S.cfg.budget;
  const ms=last(6),vals=ms.map(k=>sum(inM(k).map(x=>x.a))),mx=Math.max(...vals,1);
  const card=(l,v,c)=>`<div class="card ${c}"><small>${l}</small><p class="big">${money(v)}</p></div>`;
  return `<h1>${e(N().home)}</h1>${S.profile.nome?`<p class="mute" style="margin:-12px 0 18px">Ciao, ${e(S.profile.nome)}!</p>`:''}
  <div class="grid">${card('Patrimonio (risparmi + salvadanaio)',sv+pg,'mint')}${card('Entrate del mese',inc,'sky')}${card('Spese del mese',xt,'rose')}${card('Saldo del mese',inc-xt,'butter')}${card('Risparmiato questo mese',dep,'lav')}${card('Messo negli obiettivi',gs,'peach')}</div>
  <h2>Entrate degli ultimi 6 mesi</h2>
  <div class="chart">${ms.map((k,i)=>`<div title="${money(vals[i])}"><span style="height:${vals[i]/mx*100}%"></span><small>${k.slice(5)}</small></div>`).join('')}</div>
  <h2>Entrate e spese</h2>
  <div class="chart">${ms.map(k=>{const a=sum(inM(k).map(x=>x.a)),b=xs(k),M=Math.max(...ms.map(z=>Math.max(sum(inM(z).map(x=>x.a)),xs(z))),1);return `<div title="${k}"><div class="pair"><span style="height:${a/M*100}%"></span><span class="ex" style="height:${b/M*100}%"></span></div><small>${k.slice(5)}</small></div>`}).join('')}</div>
  <small>Lavanda: entrate · Rosa: spese</small>
  <h2>Dove vanno le spese</h2>
  ${xt?`<div class="stack">${Object.entries(xc).map(([c,v],i)=>`<i title="${e(c)}" style="flex:${v};background:var(--${COL[i%6]})"></i>`).join('')}</div><div class="row">${Object.entries(xc).map(([c,v],i)=>`<small><b class="dot" style="background:var(--${COL[i%6]})"></b> ${e(c)} ${Math.round(v/xt*100)}%</small>`).join('')}</div>`:empty('Nessuna spesa registrata questo mese.')}
  ${B?`<h2>Budget del mese</h2><div class="card">${bar(xt/B*100,xt>B?'rose':'mint')}<small>${money(xt)} di ${money(B)} · ${xt>B?'sforato di '+money(xt-B):'restano '+money(B-xt)}</small></div>`:''}
  <h2>Regola 50/30/20 sulle entrate del mese</h2>
  <div class="grid">
    <div class="card"><h3>Necessità · 50%</h3><p class="big">${money(inc*.5)}</p><small>Affitto, bollette, spesa.</small></div>
    <div class="card"><h3>Desideri · 30%</h3><p class="big">${money(inc*.3)}</p><small>Svago, ristoranti, hobby.</small></div>
    <div class="card butter"><h3>Risparmio · 20%</h3><p class="big">${money(inc*.2)}</p>${bar(inc?dep/(inc*.2)*100:0,'ink')}<small>${money(dep)} già messi da parte</small></div>
  </div>
  <h2>Obiettivi in corso</h2>
  ${S.goals.length?S.goals.slice(0,3).map((g,i)=>`<div class="card ${COL[i%6]}" style="margin-bottom:10px"><h3>${e(g.name)}</h3>${bar(g.target?g.saved/g.target*100:0,'ink')}<small>${money(g.saved)} di ${money(g.target)}</small></div>`).join(''):empty('Nessun obiettivo ancora. Creane uno dalla sezione Obiettivi.')}`;
};

V.income=()=>{
  const m=MON||mk(),L=inM(m).sort((a,b)=>b.d.localeCompare(a.d)),tot=sum(L.map(x=>x.a));
  const cats={};L.forEach(x=>cats[x.c]=(cats[x.c]||0)+x.a);
  return `<div class="top"><h1 style="margin:0">${e(N().income)}</h1><div class="row" style="margin:0"><input type="month" data-m value="${m}"><button class="pri" data-a="addInc">Aggiungi entrata</button></div></div>
  <div class="card sky"><small>Totale del mese</small><p class="big">${money(tot)}</p></div>
  <h2>Per categoria</h2>
  ${Object.keys(cats).length?`<div class="card">${Object.entries(cats).map(([c,v])=>`<div><div class="top" style="margin:0"><span>${e(c)}</span><b>${money(v)}</b></div>${bar(tot?v/tot*100:0,'lav')}</div>`).join('')}</div>`:empty('Nessuna categoria in questo mese.')}
  <h2>Movimenti</h2>
  ${L.length?`<div class="list">${L.map(x=>`<div class="item"><div class="t"><b>${e(x.n)}</b><span class="chip">${e(x.c)}</span>${x.rep=='Ogni mese'?'<span class="chip" style="background:var(--butter)">ogni mese</span>':''}<br><small>${x.d}</small></div><span class="amt">${money(x.a)}</span><button class="x" data-a="editInc" data-i="${x.id}">Modifica</button><button class="x" data-a="delInc" data-i="${x.id}">Elimina</button></div>`).join('')}</div>`:empty('Nessuna entrata in questo mese. Aggiungi la prima.')}`;
};

V.exp=()=>{
  const m=MON||mk(),L=inM(m,'exp').sort((a,b)=>b.d.localeCompare(a.d)),tot=sum(L.map(x=>x.a)),B=S.cfg.budget,cats={};
  L.forEach(x=>cats[x.c]=(cats[x.c]||0)+x.a);
  return `<div class="top"><h1 style="margin:0">${e(N().exp)}</h1><div class="row" style="margin:0"><input type="month" data-m value="${m}"><button class="pri" data-a="addExp">Aggiungi spesa</button></div></div>
  <div class="card rose"><small>Totale del mese</small><p class="big">${money(tot)}</p>${B?bar(tot/B*100,'ink')+`<small>${tot>B?'Budget sforato di '+money(tot-B):'Restano '+money(B-tot)+' di budget'}</small>`:'<small>Imposta un budget mensile in Impostazioni.</small>'}</div>
  <h2>Per categoria</h2>
  ${Object.keys(cats).length?`<div class="card">${Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<div><div class="top" style="margin:0"><span>${e(c)}</span><b>${money(v)} · ${Math.round(v/tot*100)}%</b></div>${bar(v/tot*100,'rose')}</div>`).join('')}</div>`:empty('Nessuna categoria in questo mese.')}
  <h2>Movimenti</h2>
  ${L.length?`<div class="list">${L.map(x=>`<div class="item"><div class="t"><b>${e(x.n)}</b><span class="chip" style="background:var(--rose)">${e(x.c)}</span>${x.rep=='Ogni mese'?'<span class="chip" style="background:var(--butter)">ogni mese</span>':''}<br><small>${x.d}</small></div><span class="amt">−${money(x.a)}</span><button class="x" data-a="editExp" data-i="${x.id}">Modifica</button><button class="x" data-a="delExp" data-i="${x.id}">Elimina</button></div>`).join('')}</div>`:empty('Nessuna spesa in questo mese. Aggiungi la prima.')}`;
};

V.savings=()=>`<div class="top"><h1 style="margin:0">${e(N().savings)}</h1><button class="pri" data-a="addAcc">Aggiungi conto</button></div>
  ${S.savings.length?`<div class="grid">${S.savings.map((a,i)=>`<article class="card ${COL[i%6]}"><h3>${e(a.name)}</h3><p class="big">${money(a.bal)}</p>
  ${a.goal?bar(a.bal/a.goal*100,'ink')+`<small>Traguardo ${money(a.goal)}</small>`:''}
  <div class="row"><button data-a="mv" data-i="${a.id}" data-v="1">Deposita</button><button data-a="mv" data-i="${a.id}" data-v="-1">Preleva</button></div>
  <div class="row"><button class="x" data-a="editAcc" data-i="${a.id}">Modifica</button><button class="x" data-a="delAcc" data-i="${a.id}">Elimina</button></div>
  ${a.mov.slice(0,3).map(x=>`<small style="display:block;margin-top:6px">${x.d} · ${x.a>0?'+':''}${money(x.a)} ${e(x.n||'')}</small>`).join('')}</article>`).join('')}</div>`
  :empty('Crea un conto o un “barattolo” (fondo emergenza, vacanze, casa) e comincia a depositare.')}`;

V.piggy=()=>{
  const c=S.piggy.coins,t=sum(c.map(x=>x.a)),g=S.piggy.target,fill=g?Math.round(Math.min(1,t/g)*40):Math.min(40,c.length);
  return `<div class="top"><h1 style="margin:0">${e(N().piggy)}</h1><button data-a="target">Imposta traguardo</button></div>
  <div class="card peach"><small>Dentro il salvadanaio</small><p class="big">${money(t)}</p>
  <div class="pig">${[...Array(40)].map((_,i)=>`<i class="${i<fill?'f':''}"></i>`).join('')}</div>
  <small>${g?`${Math.round(t/g*100)}% del traguardo di ${money(g)}`:'Nessun traguardo: ogni quadretto è una moneta.'}</small>
  <div class="row">${[.5,1,2,5,10].map(v=>`<button data-a="coin" data-v="${v}">+${v}</button>`).join('')}<button data-a="coinX">Altro importo</button><button class="pri" data-a="breakPig">Rompi salvadanaio</button></div></div>
  <h2>Ultime monete</h2>
  ${c.length?`<div class="list">${c.slice(0,8).map(x=>`<div class="item"><span class="t">${x.d}</span><span class="amt">${money(x.a)}</span><button class="x" data-a="delCoin" data-i="${x.id}">Elimina</button></div>`).join('')}</div>`:empty('Vuoto. Aggiungi gli spiccioli o gli arrotondamenti della giornata.')}`;
};

V.goals=()=>`<div class="top"><h1 style="margin:0">${e(N().goals)}</h1><button class="pri" data-a="addGoal">Aggiungi obiettivo</button></div>
  ${S.goals.length?`<div class="grid">${S.goals.map((g,i)=>{
    const rem=Math.max(0,g.target-g.saved),mo=g.due?Math.max(1,Math.ceil((new Date(g.due)-new Date())/2.63e9)):0;
    return `<article class="card ${COL[i%6]}"><h3>${e(g.name)}</h3><p class="big">${money(g.saved)}</p>${bar(g.target?g.saved/g.target*100:0,'ink')}
    <small>${rem?`Mancano ${money(rem)}`:'Obiettivo raggiunto'}${g.due?` · entro ${g.due}`:''}</small>
    ${g.due&&rem?`<small style="display:block">Servono ${money(rem/mo)} al mese</small>`:''}
    <div class="row"><button data-a="contrib" data-i="${g.id}">Aggiungi fondi</button><button class="x" data-a="editGoal" data-i="${g.id}">Modifica</button><button class="x" data-a="delGoal" data-i="${g.id}">Elimina</button></div></article>`}).join('')}</div>`
  :empty('Dai un nome a un sogno (viaggio, laptop, caparra) e fissa importo e scadenza.')}`;

V.settings=()=>{const th=[['light','Chiaro'],['dark','Scuro'],['system','Di sistema']];
  return `<h1>${e(N().settings)}</h1>
  <h2 style="margin-top:0">Aspetto</h2>
  <div class="card"><small>Tema dell’app</small><div class="row" style="margin-top:6px"><div class="seg" role="group" aria-label="Tema">${th.map(([k,l])=>`<button class="${S.cfg.theme==k?'on':''}" data-a="theme" data-v="${k}" aria-pressed="${S.cfg.theme==k}">${l}</button>`).join('')}</div></div></div>
  <h2>Preferenze</h2>
  <div class="card"><label>Valuta<select data-s="cur"><optgroup label="Più usate">${TOPC.map(curOpt).join('')}</optgroup><optgroup label="Tutte le valute">${CODES.filter(c=>!TOPC.includes(c)).map(curOpt).join('')}</optgroup></select></label>
  <label>Categorie delle entrate (separate da virgola)<input data-s="cats" value="${e(S.cfg.cats.join(', '))}"></label>
  <label>Categorie delle spese (separate da virgola)<input data-s="xcats" value="${e(S.cfg.xcats.join(', '))}"></label>
  <label>Budget mensile per le spese (0 = nessuno)<input type="number" step="0.01" data-s="bud" value="${S.cfg.budget}"></label></div>
  <h2>Sincronizzazione online</h2>
  <div class="card"><label>Indirizzo del tuo server (accetta GET e PUT di un file JSON)<input data-s="url" placeholder="https://…" value="${e(S.cfg.sync)}"></label>
  <div class="row"><button data-a="push">Invia i dati</button><button data-a="pull">Scarica i dati</button></div>
  <small>Su un nuovo dispositivo scarica prima di inviare, per non sovrascrivere i dati.</small></div>
  <h2>Sezioni: nome e visibilità</h2>
  <div class="card">${Object.keys(N()).filter(k=>k!='settings').map(k=>`<label>Nome<input data-s="n:${k}" value="${e(N()[k])}"></label>${['home','profile'].includes(k)?'':`<label class="chk"><input type="checkbox" data-s="h:${k}" ${S.cfg.hide.includes(k)?'':'checked'}> Mostra nel menu</label>`}`).join('')}</div>
  <h2>Dati</h2>
  <div class="row"><button data-a="exp">Esporta (JSON)</button><button data-a="csv">Esporta (CSV)</button><label class="chk" style="margin:0"><span>Importa</span><input type="file" accept=".json" data-f></label><button data-a="reset">Cancella tutto</button></div>
  <p class="mute" style="margin-top:12px">I dati restano solo in questo browser. Esporta un backup ogni tanto.</p>`};

/* ---------- profilo ---------- */
const PF=[
 ['Dati anagrafici',[['nome','Nome'],['cognome','Cognome'],['nascita','Data di nascita','date'],['luogoNascita','Luogo di nascita'],['sesso','Sesso','select',['','Donna','Uomo','Altro','Preferisco non indicarlo']],['cf','Codice fiscale / ID fiscale']]],
 ['Contatti',[['email','Email','email'],['tel','Telefono','tel']]],
 ['Residenza',[['via','Indirizzo'],['cap','CAP'],['citta','Città'],['prov','Provincia / Stato'],['paese','Paese']]],
 ['Lavoro e finanze',[['lavoro','Professione'],['azienda','Datore di lavoro / azienda'],['reddito','Reddito netto mensile','number'],['banca','Banca principale'],['iban','IBAN']]]
];
const PFK=PF.flatMap(g=>g[1].map(f=>f[0]));
V.profile=()=>{const p=S.profile,fld=([k,l,t,o])=>{const v=p[k]==null?'':p[k];
  if(t=='select')return `<label>${e(l)}<select name="${k}">${o.map(x=>`<option value="${e(x)}" ${x==v?'selected':''}>${e(x||'—')}</option>`).join('')}</select></label>`;
  return `<label>${e(k=='reddito'?l+' ('+S.cfg.cur+')':l)}<input name="${k}" type="${t||'text'}" ${t=='number'?'step="0.01" min="0"':''} value="${e(v)}"></label>`};
  return `<h1>${e(N().profile)}</h1>
  <div class="card lav"><div class="phead"><div class="ava">${avaHTML()}</div><div><h3>${e((p.nome||'')+' '+(p.cognome||'')).trim()||'Il tuo profilo'}</h3><small>${e(p.email||'Aggiungi i tuoi dati qui sotto')}</small>
  <div class="row"><label class="chk" style="margin:0"><span class="mute">Foto</span><input type="file" accept="image/*" data-av></label>${p.photo?'<button class="x" data-a="rmPhoto">Rimuovi foto</button>':''}</div></div></div></div>
  <form id="pf">${PF.map(([g,fs],i)=>`<h2>${g}</h2><div class="card"><div class="fgrid">${fs.map(fld).join('')}</div></div>`).join('')}
  <h2>Note</h2><div class="card"><label>Altre informazioni<textarea name="note" rows="3" style="resize:vertical">${e(p.note||'')}</textarea></label></div>
  <div class="row"><button class="pri" type="submit">Salva profilo</button></div></form>
  <p class="mute" style="margin-top:12px">Questi dati restano solo in questo browser (e nel backup che esporti).</p>`};

/* ---------- render ---------- */
let LASTV=null;
const NAVIC={home:'home',income:'income',exp:'exp',savings:'savings',piggy:'piggy',goals:'goals',profile:'profile',settings:'settings'};
function render(){
  const ids=['home','income','exp','savings','piggy','goals','profile','settings'].filter(k=>['home','profile','settings'].includes(k)||!S.cfg.hide.includes(k));
  let v=location.hash.slice(1);if(!ids.includes(v))v='home';
  const link=k=>`<a href="#${k}" class="${k==v?'on':''}">${ico(NAVIC[k])}<span>${e(N()[k])}</span></a>`;
  $('#nav').innerHTML=`<div class="logo"><img src="icon-192.png" alt="">Tasca</div>`+ids.filter(k=>k!='profile'&&k!='settings').map(link).join('')+`<i class="sp"></i>`+link('profile')+link('settings');
  $('#avatar').innerHTML=avaHTML();
  const vw=$('#view');vw.classList.toggle('anim',v!==LASTV);LASTV=v;
  vw.innerHTML=V[v]();
}
/* menù a comparsa: icona, passaggio del mouse sul bordo sinistro, Esc */
let navHover=false,navT=0;
function navOpen(on,byHover){clearTimeout(navT);const n=$('#nav');n.classList.toggle('open',on);$('#scrim').classList.toggle('on',on&&!byHover);$('#menu').setAttribute('aria-expanded',on);navHover=on&&!!byHover}
$('#menu').onclick=()=>navOpen(!$('#nav').classList.contains('open'));
$('#scrim').onclick=()=>navOpen(false);
$('#edge').onmouseenter=()=>navOpen(true,true);
$('#nav').onmouseleave=$('#edge').onmouseleave=()=>{if(navHover)navT=setTimeout(()=>navOpen(false),250)};
$('#nav').onmouseenter=()=>clearTimeout(navT);
$('#nav').onclick=ev=>{if(ev.target.closest('a'))navOpen(false)};
document.addEventListener('keydown',ev=>{if(ev.key=='Escape')navOpen(false)});

/* ---------- azioni ---------- */
const incF=()=>[{k:'n',l:'Descrizione',r:1},{k:'a',l:'Importo',t:'number',r:1},{k:'d',l:'Data',t:'date',r:1},{k:'c',l:'Categoria',t:'select',o:S.cfg.cats},{k:'rep',l:'Ripetizione',t:'select',o:['Mai','Ogni mese']}];
const expF=()=>[{k:'n',l:'Descrizione',r:1},{k:'a',l:'Importo',t:'number',r:1},{k:'d',l:'Data',t:'date',r:1},{k:'c',l:'Categoria',t:'select',o:S.cfg.xcats},{k:'rep',l:'Ripetizione',t:'select',o:['Mai','Ogni mese']}];
const accF=[{k:'name',l:'Nome del conto',r:1},{k:'bal',l:'Saldo',t:'number'},{k:'goal',l:'Traguardo (0 = nessuno)',t:'number'}];
const goalF=[{k:'name',l:'Nome obiettivo',r:1},{k:'target',l:'Importo da raggiungere',t:'number',r:1},{k:'saved',l:'Già messo da parte',t:'number'},{k:'due',l:'Scadenza (facoltativa)',t:'date'}];
const A={
  addInc:()=>form('Nuova entrata',incF(),{d:today(),c:S.cfg.cats[0],rep:'Mai'},d=>{S.income.push({id:uid(),...d});save()}),
  editInc:i=>{const x=find('income',i);form('Modifica entrata',incF(),x,d=>{Object.assign(x,d);save()})},
  delInc:i=>del('income',i),
  addExp:()=>form('Nuova spesa',expF(),{d:today(),c:S.cfg.xcats[0],rep:'Mai'},d=>{S.exp.push({id:uid(),...d});save()}),
  editExp:i=>{const x=find('exp',i);form('Modifica spesa',expF(),x,d=>{Object.assign(x,d);save()})},
  delExp:i=>del('exp',i),
  push:()=>{if(!S.cfg.sync)return toast('Inserisci prima l’indirizzo');busy(fetch(S.cfg.sync,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(S)}).then(r=>toast(r.ok?'Dati inviati':'Errore '+r.status)).catch(()=>toast('Server non raggiungibile')),'Invio dei dati…')},
  pull:()=>{if(!S.cfg.sync)return toast('Inserisci prima l’indirizzo');busy(fetch(S.cfg.sync).then(r=>r.json()).then(j=>{const u=S.cfg.sync;S=norm(j);S.cfg.sync=u;applyTheme();save();toast('Dati scaricati')}).catch(()=>toast('Download non riuscito')),'Scarico i dati…')},
  theme:(_,v)=>{S.cfg.theme=v;applyTheme();save()},
  rmPhoto:()=>{S.profile.photo='';save()},
  csv:()=>{const q=v=>'"'+String(v).replace(/"/g,'""')+'"',R=[['tipo','data','descrizione','categoria','importo'],...S.income.map(x=>['entrata',x.d,x.n,x.c,x.a]),...S.exp.map(x=>['spesa',x.d,x.n,x.c,x.a])];const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([R.map(l=>l.map(q).join(',')).join('\n')],{type:'text/csv'}));a.download='tasca.csv';a.click()},
  addAcc:()=>form('Nuovo conto',accF,{bal:0,goal:0},d=>{S.savings.push({id:uid(),mov:[],...d});save()}),
  editAcc:i=>{const x=find('savings',i);form('Modifica conto',accF,x,d=>{Object.assign(x,d);save()})},
  delAcc:i=>del('savings',i),
  mv:(i,s)=>{const a=find('savings',i),k=+s;form(k>0?'Deposita':'Preleva',[{k:'a',l:'Importo',t:'number',r:1},{k:'n',l:'Nota'}],{},d=>{
    const v=d.a*k;if(a.bal+v<0)return toast('Saldo insufficiente');a.bal+=v;a.mov.unshift({d:today(),a:v,n:d.n});save()})},
  coin:(_,v)=>{S.piggy.coins.unshift({id:uid(),d:today(),a:+v});save()},
  coinX:()=>form('Aggiungi al salvadanaio',[{k:'a',l:'Importo',t:'number',r:1}],{},d=>{S.piggy.coins.unshift({id:uid(),d:today(),a:d.a});save()}),
  delCoin:i=>{S.piggy.coins=S.piggy.coins.filter(x=>x.id!=i);save()},
  target:()=>form('Traguardo del salvadanaio',[{k:'t',l:'Importo (0 = nessun traguardo)',t:'number'}],{t:S.piggy.target},d=>{S.piggy.target=d.t;save()}),
  breakPig:()=>{const t=sum(S.piggy.coins.map(x=>x.a));if(!t)return toast('Il salvadanaio è vuoto');
    form('Rompi il salvadanaio',[{k:'to',l:`Sposta ${money(t)} in`,t:'select',o:[...S.savings.map(a=>a.name),'Nuovo conto']}],{},d=>{
      let a=S.savings.find(x=>x.name==d.to);if(!a){a={id:uid(),name:'Dal salvadanaio',bal:0,goal:0,mov:[]};S.savings.push(a)}
      a.bal+=t;a.mov.unshift({d:today(),a:t,n:'dal salvadanaio'});S.piggy.coins=[];save();toast('Spostato nei risparmi')})},
  addGoal:()=>form('Nuovo obiettivo',goalF,{saved:0,due:''},d=>{S.goals.push({id:uid(),...d});save()}),
  editGoal:i=>{const x=find('goals',i);form('Modifica obiettivo',goalF,x,d=>{Object.assign(x,d);save()})},
  delGoal:i=>del('goals',i),
  contrib:i=>{const g=find('goals',i);form('Aggiungi fondi',[{k:'a',l:'Importo (negativo per togliere)',t:'number',r:1}],{},d=>{g.saved=Math.max(0,g.saved+d.a);save()})},
  exp:()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,2)],{type:'application/json'}));a.download='tasca-backup.json';a.click()},
  reset:()=>{if(confirm('Cancellare tutti i dati? Non si può annullare.')){localStorage.removeItem(KEY);S=DEF();applyTheme();save()}}
};

document.addEventListener('click',ev=>{const b=ev.target.closest('[data-a]');if(b&&A[b.dataset.a])A[b.dataset.a](b.dataset.i,b.dataset.v)});
document.addEventListener('change',ev=>{
  const t=ev.target;
  if(t.dataset.m!==undefined){MON=t.value||null;return render()}
  if(t.dataset.f!==undefined){t.files[0]&&busy(t.files[0].text().then(x=>{try{S=norm(JSON.parse(x));applyTheme();save();toast('Dati importati')}catch(_){toast('File non valido')}}),'Importo i dati…');return}
  if(t.dataset.av!==undefined){const f=t.files[0];if(!f)return;
    busy(new Promise((ok,ko)=>{const u=URL.createObjectURL(f),im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=256;const m=Math.min(im.width,im.height);c.getContext('2d').drawImage(im,(im.width-m)/2,(im.height-m)/2,m,m,0,0,256,256);URL.revokeObjectURL(u);ok(c.toDataURL('image/jpeg',.85))};im.onerror=ko;im.src=u})
      .then(d=>{S.profile.photo=d;save();toast('Foto aggiornata')}).catch(()=>toast('Immagine non valida')),'Elaboro la foto…');return}
  const s=t.dataset.s;if(!s)return;
  if(s=='cur')S.cfg.cur=CODES.includes(t.value)?t.value:'EUR';
  else if(s=='cats')S.cfg.cats=t.value.split(',').map(x=>x.trim()).filter(Boolean);
  else if(s=='xcats')S.cfg.xcats=t.value.split(',').map(x=>x.trim()).filter(Boolean);
  else if(s=='bud')S.cfg.budget=Math.max(0,parseFloat(t.value)||0);
  else if(s=='url')S.cfg.sync=t.value.trim();
  else if(s[0]=='n')S.cfg.names[s.slice(2)]=t.value||N()[s.slice(2)];
  else if(s[0]=='h'){const k=s.slice(2);S.cfg.hide=t.checked?S.cfg.hide.filter(x=>x!=k):[...S.cfg.hide,k]}
  save();
});
document.addEventListener('submit',ev=>{if(ev.target.id!='pf')return;ev.preventDefault();
  const fd=new FormData(ev.target);PFK.forEach(k=>{const v=(fd.get(k)||'').toString().trim();S.profile[k]=k=='reddito'?(parseFloat(v)||0):v});S.profile.note=(fd.get('note')||'').toString().trim();save();toast('Profilo salvato')});
window.addEventListener('hashchange',()=>{render();scrollTo(0,0)});
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
render();
window.addEventListener('load',()=>setTimeout(hideLoad,600));
if(document.readyState=='complete')setTimeout(hideLoad,600);
