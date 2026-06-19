import {STATE, app} from './state.js';
import {db} from './db.js';
import {empNombre, badgeEstado, getEstadosPills, resetPills} from './utils.js';
import {gcalEnviarTarea} from './gcal.js';
import {openModal} from './modales.js';

export function renderTareas(){
  const empId=document.getElementById('f-tar-empresa').value;
  const estados=getEstadosPills('f-tar-estados');
  const desde=document.getElementById('f-tar-desde').value;
  const hasta=document.getElementById('f-tar-hasta').value;
  let tar=STATE.tareas;
  if(empId)tar=tar.filter(t=>t.empresa_id==empId);
  if(estados.length)tar=tar.filter(t=>estados.includes(t.estado||'pendiente'));
  if(desde)tar=tar.filter(t=>t.fecha_fin>=desde);
  if(hasta)tar=tar.filter(t=>t.fecha_fin<=hasta);
  if(app.vistaTareas==='tabla')renderTareasTabla(tar);
  else renderTareasTiempo(tar);
}

export function renderTareasTabla(tar){
  document.getElementById('tar-tabla').style.display='block';
  document.getElementById('tar-tiempo').style.display='none';
  const el=document.getElementById('tar-tabla');
  if(!tar.length){el.innerHTML='<p style="color:var(--text3);padding:.5rem 0">No hay tareas que coincidan.</p>';return;}
  el.innerHTML=`<table class="data-table">
    <thead><tr><th>Empresa</th><th>Descripción</th><th>Responsable</th><th>Inicio</th><th>Vence</th><th>Estado</th><th title="Google Calendar">GCal</th><th></th></tr></thead>
    <tbody>${tar.map(t=>{
      const gcalEnviado=t.calendario_google===true;
      const gcalClass=gcalEnviado?'btn-gcal gcal-enviado':'btn-gcal';
      const gcalTitle=gcalEnviado?'Ya en Google Calendar':'Enviar al Google Calendar';
      const gcalIcon=gcalEnviado?'ti-calendar-check':'ti-calendar-plus';
      return`<tr>
      <td class="muted">${empNombre(t.empresa_id)}</td>
      <td>${t.descripcion||'—'}</td>
      <td class="muted">${t.responsable||'—'}</td>
      <td class="muted">${t.fecha_inicio||'—'}</td>
      <td class="muted">${t.fecha_fin||'—'}</td>
      <td>${badgeEstado(t.estado)}</td>
      <td style="text-align:center">
        <button id="gcal-btn-${t.id}" class="${gcalClass}" title="${gcalTitle}" onclick="gcalEnviarTarea(${t.id})" ${gcalEnviado?'disabled':''}><i class="ti ${gcalIcon}"></i></button>
      </td>
      <td style="white-space:nowrap">
        <button class="btn btn-sm" onclick="editTarea(${t.id})"><i class="ti ti-pencil"></i></button>
        <button class="btn btn-sm btn-danger" onclick="delTarea(${t.id})"><i class="ti ti-trash"></i></button>
      </td>
    </tr>`;}).join('')}</tbody>
  </table>`;
}

export function renderTareasTiempo(tar){
  document.getElementById('tar-tabla').style.display='none';
  document.getElementById('tar-tiempo').style.display='block';
  const el=document.getElementById('tar-tiempo');
  if(!tar.length){el.innerHTML='<p style="color:var(--text3);padding:.5rem 0">No hay tareas que coincidan.</p>';return;}
  const conFechas=tar.filter(t=>t.fecha_inicio&&t.fecha_fin);
  const sinFechas=tar.filter(t=>!(t.fecha_inicio&&t.fecha_fin));
  const colors={'pendiente':'var(--amber)','en-curso':'var(--blue)','completada':'var(--teal)','cancelada':'var(--text3)'};

  let timelineHTML='';
  if(!conFechas.length){
    timelineHTML='<p style="color:var(--text3);padding:.5rem 0">No hay tareas con fechas completas para mostrar en línea de tiempo.</p>';
  } else {
    const fechas=conFechas.flatMap(t=>[new Date(t.fecha_inicio),new Date(t.fecha_fin)]);
    const minD=new Date(Math.min(...fechas));
    const maxD=new Date(Math.max(...fechas));
    const totalDias=(maxD-minD)/86400000||1;
    const numMarcas=Math.min(totalDias+1,8);
    const paso=totalDias/(numMarcas-1||1);
    const marcas=Array.from({length:numMarcas},(_,i)=>{
      const d=new Date(minD.getTime()+Math.round(i*paso)*86400000);
      const pct=(Math.round(i*paso)/totalDias*100).toFixed(1);
      return{pct,label:`${d.getDate()}/${d.getMonth()+1}`};
    });
    timelineHTML=`<div style="min-width:600px">
      <div style="display:flex;align-items:flex-end;gap:10px;margin-bottom:4px">
        <div style="width:160px;flex-shrink:0"></div>
        <div style="flex:1;position:relative;height:20px;">
          ${marcas.map(m=>`<div style="position:absolute;left:${m.pct}%;transform:translateX(-50%);font-size:10px;color:var(--text3);white-space:nowrap;">${m.label}</div>`).join('')}
        </div>
        <div style="width:80px;flex-shrink:0"></div>
      </div>
      ${conFechas.map(t=>{
        const ini=(new Date(t.fecha_inicio)-minD)/86400000;
        const dur=(new Date(t.fecha_fin)-new Date(t.fecha_inicio))/86400000+1;
        const left=(ini/totalDias*100).toFixed(1);
        const width=Math.max((dur/totalDias*100),2).toFixed(1);
        const color=colors[t.estado]||'var(--teal)';
        const marcasLines=marcas.map(m=>`<div style="position:absolute;left:${m.pct}%;top:0;height:100%;width:1px;background:var(--border2);opacity:0.6"></div>`).join('');
        return`<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <div style="width:160px;flex-shrink:0;font-size:12px;color:var(--text2);text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${empNombre(t.empresa_id)}</div>
          <div style="flex:1;background:var(--bg2);border-radius:4px;height:28px;position:relative;">
            ${marcasLines}
            <div style="position:absolute;left:${left}%;width:${width}%;height:100%;background:${color};border-radius:4px;display:flex;align-items:center;padding:0 6px;min-width:6px;z-index:1">
              <span style="font-size:11px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.descripcion||''}</span>
            </div>
          </div>
          <div style="width:80px;flex-shrink:0;font-size:11px;color:var(--text3)">${t.fecha_fin||''}</div>
        </div>`;
      }).join('')}
    </div>`;
  }

  let sinFechasHTML='';
  if(sinFechas.length){
    sinFechasHTML=`<div style="margin-top:16px;border-top:1px solid var(--border2);padding-top:12px">
      <div style="font-size:11px;color:var(--amber);font-weight:600;margin-bottom:8px;display:flex;align-items:center;gap:6px">
        <i class="ti ti-alert-triangle"></i> Sin fecha de inicio — no graficables (${sinFechas.length})
      </div>
      ${sinFechas.map(t=>`
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;opacity:0.75">
          <div style="width:160px;font-size:12px;color:var(--text2);text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${empNombre(t.empresa_id)}</div>
          <div style="flex:1;font-size:12px;color:var(--text1)">${t.descripcion||''}</div>
          <div style="width:80px;font-size:11px;color:var(--text3)">${t.fecha_fin?'Vence: '+t.fecha_fin:''}</div>
          <span style="font-size:10px;background:var(--bg2);padding:2px 7px;border-radius:10px;color:${colors[t.estado]||'var(--text3)'}">${t.estado||''}</span>
        </div>`).join('')}
    </div>`;
  }
  el.innerHTML=timelineHTML+sinFechasHTML;
}

export function setVistaTareas(v){
  app.vistaTareas=v;
  document.getElementById('btn-vista-tabla').style.cssText=v==='tabla'?'background:var(--teal);color:#fff':'';
  document.getElementById('btn-vista-tiempo').style.cssText=v==='tiempo'?'background:var(--teal);color:#fff':'';
  renderTareas();
}
export function clearFiltrosTareas(){
  document.getElementById('f-tar-empresa').value='';
  ['f-tar-desde','f-tar-hasta'].forEach(id=>document.getElementById(id).value='');
  resetPills('f-tar-estados',['pendiente','en-curso']);
  renderTareas();
}
export async function delTarea(id){
  if(!confirm('¿Eliminar tarea?'))return;
  try{
    await db.del('tareas',id);
    STATE.tareas=STATE.tareas.filter(t=>t.id!==id);
    renderTareas();
  }catch(e){alert('Error al eliminar tarea: '+e.message);}
}
export function editTarea(id){
  const t=STATE.tareas.find(x=>x.id===id);
  if(t)openModal('tarea',t);
}
