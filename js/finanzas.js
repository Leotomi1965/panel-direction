import {STATE, app} from './state.js';
import {db} from './db.js';
import {fmt, fmtPeso, today} from './utils.js';

export function getEmpresasDelGrupo(empId, consolidar){
  const emp=STATE.empresas.find(e=>e.id==empId);
  if(!emp)return empId?[parseInt(empId)]:[];
  if(consolidar&&emp.es_holding){
    const subs=STATE.empresas.filter(e=>e.holding_id==emp.id).map(e=>e.id);
    return[emp.id,...subs];
  }
  return[emp.id];
}

function getLabelsConsolidados(ids){
  const labels=[...new Set(STATE.periodos.filter(p=>ids.includes(p.empresa_id)).map(p=>p.label))];
  labels.sort((a,b)=>a.localeCompare(b));
  return labels;
}

function consolidarPeriodo(ids,label){
  const pers=STATE.periodos.filter(p=>ids.includes(p.empresa_id)&&p.label===label);
  if(!pers.length)return null;
  const sum=(field)=>pers.reduce((acc,p)=>acc+(p[field]||0),0);
  const tc=pers[0].tc||1;
  return{
    label,tc,
    ventas:sum('ventas'),cv:sum('cv'),cf:sum('cf'),otros:sum('otros'),
    resultado_financiero:sum('resultado_financiero'),iigg:sum('iigg'),
    caja:sum('caja'),cred:sum('cred'),inv:sum('inv'),bu:sum('bu'),
    dc:sum('dc'),dfcp:sum('dfcp'),dflp:sum('dflp'),pn:sum('pn'),
    _consolidado:true,_empresas:pers.length
  };
}

export function onCambioEmpresaFin(modulo){
  const selId={eerr:'sel-eerr-emp',balance:'sel-bal-emp',kpis:'sel-kpi-emp'}[modulo];
  const empId=document.getElementById(selId).value;
  const emp=STATE.empresas.find(e=>e.id==empId);
  const esHolding=emp&&emp.es_holding;
  document.getElementById('chk-cons-'+modulo).style.display=esHolding?'flex':'none';
  document.getElementById('consolidar-'+modulo).checked=false;
  if(modulo==='eerr')loadPeriodosEERR();
  if(modulo==='balance')loadPeriodosBalance();
  if(modulo==='kpis')loadPeriodosKPI();
}

export function loadPeriodosEERR(){
  const empId=document.getElementById('sel-eerr-emp').value;
  const consolidar=document.getElementById('consolidar-eerr').checked;
  const ids=getEmpresasDelGrupo(empId,consolidar);
  const labels=consolidar&&ids.length>1?getLabelsConsolidados(ids):[...new Set(STATE.periodos.filter(p=>p.empresa_id==empId).map(p=>p.label))];
  ['sel-p1','sel-p2'].forEach(id=>{
    const el=document.getElementById(id);
    el.innerHTML='<option value="">—</option>'+labels.map(l=>`<option value="${empId}|${l}">${l}</option>`).join('');
  });
  renderEERR();
}
export function loadPeriodosBalance(){
  const empId=document.getElementById('sel-bal-emp').value;
  const consolidar=document.getElementById('consolidar-balance').checked;
  const ids=getEmpresasDelGrupo(empId,consolidar);
  const labels=consolidar&&ids.length>1?getLabelsConsolidados(ids):[...new Set(STATE.periodos.filter(p=>p.empresa_id==empId).map(p=>p.label))];
  const el=document.getElementById('sel-bal');
  el.innerHTML='<option value="">—</option>'+labels.map(l=>`<option value="${empId}|${l}">${l}</option>`).join('');
  renderBalance();
}
export function loadPeriodosKPI(){
  const empId=document.getElementById('sel-kpi-emp').value;
  const consolidar=document.getElementById('consolidar-kpis').checked;
  const ids=getEmpresasDelGrupo(empId,consolidar);
  const labels=consolidar&&ids.length>1?getLabelsConsolidados(ids):[...new Set(STATE.periodos.filter(p=>p.empresa_id==empId).map(p=>p.label))];
  const el=document.getElementById('sel-kpi');
  el.innerHTML='<option value="">—</option>'+labels.map(l=>`<option value="${empId}|${l}">${l}</option>`).join('');
  renderKPIs();
}

function resolverPeriodo(selectorId,moduloConsolidarId){
  const val=document.getElementById(selectorId).value;
  if(!val)return null;
  const parts=val.split('|');
  if(parts.length<2||!parts[0]||!parts[1])return null;
  const[empId,label]=parts;
  const consolidar=document.getElementById(moduloConsolidarId).checked;
  const ids=getEmpresasDelGrupo(empId,consolidar);
  if(consolidar&&ids.length>1)return consolidarPeriodo(ids,label);
  return STATE.periodos.find(p=>p.empresa_id==empId&&p.label===label);
}

export function renderEERR(){
  const p1=resolverPeriodo('sel-p1','consolidar-eerr');
  const p2=resolverPeriodo('sel-p2','consolidar-eerr');
  const tc=p1?.tc||1;
  if(!p1){document.getElementById('eerr-stats').innerHTML='';document.getElementById('eerr-tbl').innerHTML='';return;}
  const mb1=p1.ventas-p1.cv;
  const ebit1=mb1-p1.cf+(p1.otros||0);
  const rdofin1=p1.resultado_financiero||0;
  const iigg1=p1.iigg||0;
  const netprofit1=ebit1+rdofin1-iigg1;
  const stats=document.getElementById('eerr-stats');
  const badgeCons=p1._consolidado?`<div class="sc" style="background:var(--teal);color:#fff;border-radius:8px"><div class="sc-num" style="font-size:12px;color:#fff">CONSOLIDADO</div><div class="sc-lbl" style="color:rgba(255,255,255,0.8)">${p1._empresas} empresas</div></div>`:'';
  stats.innerHTML=badgeCons+`
    <div class="sc"><div class="sc-num">${fmt(p1.ventas,tc)}</div><div class="sc-lbl">Ventas</div></div>
    <div class="sc"><div class="sc-num">${fmt(mb1,tc)}</div><div class="sc-lbl">Margen Contribución</div></div>
    <div class="sc"><div class="sc-num" style="color:var(--teal)">${fmt(ebit1,tc)}</div><div class="sc-lbl">EBIT</div></div>
    <div class="sc"><div class="sc-num" style="color:${netprofit1>=0?'var(--teal)':'var(--red,#e53)'};font-weight:700">${fmt(netprofit1,tc)}</div><div class="sc-lbl">NET PROFIT</div></div>
    <div class="sc"><div class="sc-num">${p1.ventas?(netprofit1/p1.ventas*100).toFixed(1):0}%</div><div class="sc-lbl">% Net Profit</div></div>`;
  const ebit2=p2?p2.ventas-p2.cv-p2.cf+(p2.otros||0):null;
  const np2=ebit2!=null?ebit2+(p2.resultado_financiero||0)-(p2.iigg||0):null;
  const rows=[
    ['Ventas netas',p1.ventas,p2?.ventas,'sub'],
    ['— Costos variables',p1.cv,p2?.cv,''],
    ['Contribución Marginal',mb1,p2?p2.ventas-p2.cv:null,'sub'],
    ['— Costos fijos',p1.cf,p2?.cf,''],
    ['Otros ingresos/egresos',p1.otros||0,p2?.otros||0,''],
    ['EBIT',ebit1,ebit2,'tot'],
    ['Resultado financiero',rdofin1,p2?.resultado_financiero||0,''],
    ['— IIGG',iigg1,p2?.iigg||0,''],
    ['NET PROFIT',netprofit1,np2,'tot'],
  ];
  let html=`<thead><tr><th>Concepto</th><th>${p1.label}</th>${p2?`<th>${p2.label}</th><th>Δ%</th>`:''}</tr></thead><tbody>`;
  rows.forEach(([lbl,v1,v2,cls])=>{
    const delta=v2&&v2?((v1-v2)/Math.abs(v2)*100).toFixed(1):null;
    const dClass=delta>0?'dp':'dn';
    html+=`<tr class="${cls}"><td>${lbl}</td><td>${fmt(v1,tc)}</td>${p2?`<td>${v2!=null?fmt(v2,p2.tc||1):'—'}</td><td class="${dClass}">${delta?delta+'%':'—'}</td>`:''}</tr>`;
  });
  document.getElementById('eerr-tbl').innerHTML=html+'</tbody>';
  const ctx=document.getElementById('chartEERR').getContext('2d');
  if(app.chartEERR)app.chartEERR.destroy();
  const empIdG=document.getElementById('sel-eerr-emp').value;
  const consolidarG=document.getElementById('consolidar-eerr').checked;
  const idsG=getEmpresasDelGrupo(empIdG,consolidarG);
  const labelsG=[...new Set(STATE.periodos.filter(p=>idsG.includes(p.empresa_id)).map(p=>p.label))].sort((a,b)=>a.localeCompare(b));
  const ventas=labelsG.map(l=>{const pd=consolidarG&&idsG.length>1?consolidarPeriodo(idsG,l):STATE.periodos.find(p=>p.empresa_id==empIdG&&p.label===l);return pd?(app.CUR==='USD'?pd.ventas/(pd.tc||1):pd.ventas):0;});
  const ebits=labelsG.map(l=>{const pd=consolidarG&&idsG.length>1?consolidarPeriodo(idsG,l):STATE.periodos.find(p=>p.empresa_id==empIdG&&p.label===l);if(!pd)return 0;const mb=pd.ventas-pd.cv;const e=mb-pd.cf+(pd.otros||0);return app.CUR==='USD'?e/(pd.tc||1):e;});
  const netprofits=labelsG.map(l=>{const pd=consolidarG&&idsG.length>1?consolidarPeriodo(idsG,l):STATE.periodos.find(p=>p.empresa_id==empIdG&&p.label===l);if(!pd)return 0;const mb=pd.ventas-pd.cv;const e=mb-pd.cf+(pd.otros||0);const np=e+(pd.resultado_financiero||0)-(pd.iigg||0);return app.CUR==='USD'?np/(pd.tc||1):np;});
  app.chartEERR=new Chart(ctx,{type:'bar',data:{labels:labelsG,datasets:[{label:'Ventas',data:ventas,backgroundColor:'#E1F5EE',borderColor:'#1D9E75',borderWidth:1},{label:'EBIT',data:ebits,backgroundColor:'#1D9E75',borderColor:'#0F6E56',borderWidth:1},{label:'Net Profit',data:netprofits,backgroundColor:'#0F6E56',borderColor:'#0a4d3c',borderWidth:1}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:true}}}});
}

export function renderBalance(){
  const p=resolverPeriodo('sel-bal','consolidar-balance');
  const tc=p?.tc||1;
  if(!p){document.getElementById('tbl-activo').innerHTML='';document.getElementById('tbl-pasivo').innerHTML='';return;}
  const acC=p.caja+p.cred+p.inv,acNC=p.bu,acT=acC+acNC;
  const pasC=p.dc+p.dfcp,pasLP=p.dflp,pasT=pasC+pasLP;
  document.getElementById('tbl-activo').innerHTML=`<thead><tr><th>Activo</th><th>${app.CUR}</th></tr></thead><tbody>
    <tr class="sub"><td>Activo corriente</td><td>${fmt(acC,tc)}</td></tr>
    <tr><td>· Caja y bancos</td><td>${fmt(p.caja,tc)}</td></tr>
    <tr><td>· Créditos</td><td>${fmt(p.cred,tc)}</td></tr>
    <tr><td>· Bs de Cambio</td><td>${fmt(p.inv,tc)}</td></tr>
    <tr class="sub"><td>Activo no corriente</td><td>${fmt(acNC,tc)}</td></tr>
    <tr><td>· Bienes de uso</td><td>${fmt(p.bu,tc)}</td></tr>
    <tr class="tot"><td>TOTAL ACTIVO</td><td>${fmt(acT,tc)}</td></tr>
  </tbody>`;
  document.getElementById('tbl-pasivo').innerHTML=`<thead><tr><th>Pasivo y PN</th><th>${app.CUR}</th></tr></thead><tbody>
    <tr class="sub"><td>Pasivo corriente</td><td>${fmt(pasC,tc)}</td></tr>
    <tr><td>· Deudas comerciales</td><td>${fmt(p.dc,tc)}</td></tr>
    <tr><td>· Deuda fin. CP</td><td>${fmt(p.dfcp,tc)}</td></tr>
    <tr class="sub"><td>Pasivo no corriente</td><td>${fmt(pasLP,tc)}</td></tr>
    <tr><td>· Deuda fin. LP</td><td>${fmt(p.dflp,tc)}</td></tr>
    <tr class="sub"><td>Patrimonio neto</td><td>${fmt(p.pn,tc)}</td></tr>
    <tr class="tot"><td>PAS + PN</td><td>${fmt(pasT+p.pn,tc)}</td></tr>
  </tbody>`;
}

export function renderKPIs(){
  const p=resolverPeriodo('sel-kpi','consolidar-kpis');
  if(!p){document.getElementById('kpi-grid').innerHTML='';return;}
  const mb=p.ventas-p.cv,ebit=mb-p.cf+(p.otros||0);
  const rdofin=p.resultado_financiero||0,iigg=p.iigg||0;
  const netprofit=ebit+rdofin-iigg;
  const acC=p.caja+p.cred+p.inv,acNC=p.bu,acT=acC+acNC;
  const pasC=p.dc+p.dfcp,pasLP=p.dflp,dT=p.dc+p.dfcp+p.dflp;
  const capInv=p.pn+p.dflp;
  const kpis=[
    {n:'% CM / Ventas',v:(p.ventas?(mb/p.ventas*100):0).toFixed(1)+'%',ref:'>40% ideal',ok:p.ventas&&mb/p.ventas>0.4?'kok':p.ventas&&mb/p.ventas>0.2?'kwarn':'kbad'},
    {n:'% EBIT / Ventas',v:(p.ventas?(ebit/p.ventas*100):0).toFixed(1)+'%',ref:'>10% ideal',ok:p.ventas&&ebit/p.ventas>0.1?'kok':p.ventas&&ebit/p.ventas>0.05?'kwarn':'kbad'},
    {n:'% CF / Ventas',v:(p.ventas?(p.cf/p.ventas*100):0).toFixed(1)+'%',ref:'<30% ideal',ok:p.ventas&&p.cf/p.ventas<0.3?'kok':p.ventas&&p.cf/p.ventas<0.5?'kwarn':'kbad'},
    {n:'% Net Profit / Ventas',v:(p.ventas?(netprofit/p.ventas*100):0).toFixed(1)+'%',ref:'>5% ideal',ok:p.ventas&&netprofit/p.ventas>0.05?'kok':p.ventas&&netprofit/p.ventas>0?'kwarn':'kbad'},
    {n:'ROE %',v:p.pn?(netprofit/p.pn*100).toFixed(1)+'%':'—',ref:'>15% ideal',ok:p.pn&&netprofit/p.pn>0.15?'kok':p.pn&&netprofit/p.pn>0.08?'kwarn':'kbad'},
    {n:'ROA %',v:acT?(ebit/acT*100).toFixed(1)+'%':'—',ref:'>8% ideal',ok:acT&&ebit/acT>0.08?'kok':acT&&ebit/acT>0.04?'kwarn':'kbad'},
    {n:'ROI %',v:capInv?(netprofit/capInv*100).toFixed(1)+'%':'—',ref:'>10% ideal',ok:capInv&&netprofit/capInv>0.1?'kok':capInv&&netprofit/capInv>0.05?'kwarn':'kbad'},
    {n:'Rot. Cobranzas (días)',v:p.ventas?(p.cred/(p.ventas/365)).toFixed(0)+' días':'—',ref:'<60 días ideal',ok:p.ventas&&p.cred/(p.ventas/365)<60?'kok':p.ventas&&p.cred/(p.ventas/365)<90?'kwarn':'kbad'},
    {n:'Rot. Bs de Cambio (días)',v:p.cv?(p.inv/(p.cv/365)).toFixed(0)+' días':'—',ref:'<45 días ideal',ok:p.cv&&p.inv/(p.cv/365)<45?'kok':p.cv&&p.inv/(p.cv/365)<90?'kwarn':'kbad'},
    {n:'Leverage',v:p.pn?(acT/p.pn).toFixed(2)+'x':'—',ref:'<3x ideal',ok:p.pn&&acT/p.pn<3?'kok':p.pn&&acT/p.pn<5?'kwarn':'kbad'},
    {n:'Liquidez corriente',v:pasC?(acC/pasC).toFixed(2):'—',ref:'>1.5 ideal',ok:pasC&&acC/pasC>1.5?'kok':pasC&&acC/pasC>1?'kwarn':'kbad'},
    {n:'Liquidez ácida',v:pasC?((p.caja+p.cred)/pasC).toFixed(2):'—',ref:'>1 ideal',ok:pasC&&(p.caja+p.cred)/pasC>1?'kok':pasC&&(p.caja+p.cred)/pasC>0.7?'kwarn':'kbad'},
    {n:'Endeudamiento %',v:p.pn?(dT/p.pn*100).toFixed(0)+'%':'—',ref:'<100% ideal',ok:p.pn&&dT/p.pn<1?'kok':p.pn&&dT/p.pn<2?'kwarn':'kbad'},
    {n:'Deuda / EBIT',v:ebit>0?(dT/ebit).toFixed(1)+'x':'—',ref:'<3x ideal',ok:ebit>0&&dT/ebit<3?'kok':ebit>0&&dT/ebit<5?'kwarn':'kbad'},
    {n:'Capital de trabajo',v:fmt(acC-pasC,p.tc||1),ref:'Positivo ideal',ok:acC-pasC>0?'kok':acC-pasC>-p.ventas*0.1?'kwarn':'kbad'},
  ];
  document.getElementById('kpi-grid').innerHTML=kpis.map(k=>`
    <div class="kpi-card">
      <div class="kpi-name">${k.n}</div>
      <div class="kpi-val ${k.ok}">${k.v}</div>
      <div class="kpi-ref">${k.ref}</div>
    </div>`).join('');
}

export async function guardarPeriodo(){
  const empId=document.getElementById('c-empresa').value;
  if(!empId){alert('Seleccioná una empresa');return;}
  const mes=document.getElementById('c-mes').value;
  const anio=document.getElementById('c-anio').value;
  const label=`${mes} ${anio}`;
  const tc=parseFloat(document.getElementById('c-tc').value)||1;
  const body={empresa_id:parseInt(empId),label,tc,
    ventas:parseFloat(document.getElementById('f-ventas').value)||0,
    cv:parseFloat(document.getElementById('f-cv').value)||0,
    cf:parseFloat(document.getElementById('f-cf').value)||0,
    otros:parseFloat(document.getElementById('f-otros').value)||0,
    resultado_financiero:parseFloat(document.getElementById('f-rdo-fin').value)||0,
    iigg:parseFloat(document.getElementById('f-iigg').value)||0,
    caja:parseFloat(document.getElementById('f-caja').value)||0,
    cred:parseFloat(document.getElementById('f-cred').value)||0,
    inv:parseFloat(document.getElementById('f-inv').value)||0,
    bu:parseFloat(document.getElementById('f-bu').value)||0,
    dc:parseFloat(document.getElementById('f-dc').value)||0,
    dfcp:parseFloat(document.getElementById('f-dfcp').value)||0,
    dflp:parseFloat(document.getElementById('f-dflp').value)||0,
    pn:parseFloat(document.getElementById('f-pn').value)||0,
  };
  const existe=STATE.periodos.find(p=>p.empresa_id==empId&&p.label===label);
  try{
    if(existe){await db.patch('periodos',existe.id,body);STATE.periodos=STATE.periodos.map(p=>p.id===existe.id?{...p,...body}:p);}
    else{const result=await db.post('periodos',body);if(Array.isArray(result))STATE.periodos.push(...result);}
    document.getElementById('save-msg').textContent='✓ Guardado';
    setTimeout(()=>document.getElementById('save-msg').textContent='',2500);
  }catch(e){alert('Error al guardar período: '+e.message);}
}
