import {STATE, app} from './state.js';

export const PAGE_TITLES={empresas:'Empresas',tareas:'Tareas',notas:'Notas',proyectos:'Proyectos',eerr:'Estado de Resultados',balance:'Balance',kpis:'KPIs',carga:'Cargar datos financieros'};

export function empNombre(id){return STATE.empresas.find(e=>e.id==id)?.nombre||'—';}
export function fmt(n,tc){if(!n)return'0';const v=app.CUR==='USD'?n/tc:n;return v.toLocaleString('es-AR',{maximumFractionDigits:0});}
export function fmtPeso(n){return(n||0).toLocaleString('es-AR',{maximumFractionDigits:0});}
export function today(){return new Date().toISOString().slice(0,10);}
export function badgeEstado(e){return`<span class="badge badge-${e||'pendiente'}">${e||'pendiente'}</span>`;}
export function badgeMoneda(m){return`<span class="badge badge-${(m||'ARS').toLowerCase()}">${m||'ARS'}</span>`;}

export function syncStatus(s){
  const el=document.getElementById('syncStatus');
  if(s==='ok'){el.className='sync-bar sync-ok';el.innerHTML='<span class="sync-dot"></span> Conectado';}
  else if(s==='err'){el.className='sync-bar sync-err';el.innerHTML='<span class="sync-dot"></span> Error';}
  else{el.className='sync-bar sync-load';el.innerHTML='<span class="sync-dot"></span> Cargando…';}
}

export function populateFiltros(){
  const emps=STATE.empresas;
  ['f-tar-empresa','f-not-empresa','f-proy-empresa'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el)return;
    const val=el.value;
    el.innerHTML='<option value="">Todas</option>'+emps.map(e=>`<option value="${e.id}">${e.nombre}${e.es_holding?' 🏢':''}</option>`).join('');
    if(val)el.value=val;
  });
  ['sel-eerr-emp','sel-bal-emp','sel-kpi-emp','c-empresa'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el)return;
    const val=el.value;
    el.innerHTML='<option value="">— seleccionar empresa —</option>'+emps.map(e=>`<option value="${e.id}">${e.nombre}${e.es_holding?' 🏢':''}</option>`).join('');
    if(val)el.value=val;
  });
}

export function getEstadosPills(containerId){
  const pills=document.querySelectorAll('#'+containerId+' .estado-pill');
  const activos=[];
  pills.forEach(p=>{if(p.querySelector('input').checked)activos.push(p.dataset.val);});
  return activos;
}
export function updatePillClass(el){
  const chk=el.querySelector('input');
  const val=el.dataset.val;
  if(chk.checked){el.className='estado-pill on-'+val;}
  else{el.className='estado-pill off';}
}
export function resetPills(containerId,defaults){
  document.querySelectorAll('#'+containerId+' .estado-pill').forEach(p=>{
    const val=p.dataset.val;
    const on=defaults.includes(val);
    p.querySelector('input').checked=on;
    p.className=on?'estado-pill on-'+val:'estado-pill off';
  });
}

export function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('mobOverlay').classList.toggle('open');
}
export function closeSidebar(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('mobOverlay').classList.remove('open');
}
