import {STATE} from './state.js';
import {db} from './db.js';
import {empNombre} from './utils.js';
import {openModal} from './modales.js';

export function renderNotas(){
  const empId=document.getElementById('f-not-empresa').value;
  const texto=document.getElementById('f-not-texto').value.toLowerCase();
  const desde=document.getElementById('f-not-desde').value;
  let not=STATE.notas;
  if(empId)not=not.filter(n=>n.empresa_id==empId);
  if(texto)not=not.filter(n=>(n.texto||'').toLowerCase().includes(texto));
  if(desde)not=not.filter(n=>n.fecha_input>=desde);
  const el=document.getElementById('not-list');
  if(!not.length){el.innerHTML='<p style="color:var(--text3);padding:.5rem 0">No hay notas.</p>';return;}
  el.innerHTML=not.map(n=>`
    <div style="padding:1rem 0;border-bottom:0.5px solid var(--border)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.5rem">
        <div>
          <span style="font-size:12px;color:var(--text3)">${n.fecha_input||'—'}</span>
          ${n.empresa_id?`<span style="font-size:12px;color:var(--teal);margin-left:8px">· ${empNombre(n.empresa_id)}</span>`:''}
          ${n.tema?`<span style="font-size:12px;color:var(--teal);margin-left:8px">· ${n.tema}</span>`:''}
          ${n.link?`<a href="${n.link}" target="_blank" style="font-size:12px;color:var(--teal);margin-left:8px;text-decoration:none" title="Abrir archivo"><i class="ti ti-paperclip"></i> archivo</a>`:''}
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm" onclick="editNota(${n.id})"><i class="ti ti-pencil"></i></button>
          <button class="btn btn-sm btn-danger" onclick="delNota(${n.id})"><i class="ti ti-trash"></i></button>
        </div>
      </div>
      <div style="font-size:13px;color:var(--text);white-space:pre-wrap">${n.texto||''}</div>
    </div>
  `).join('');
}
export function clearFiltrosNotas(){
  document.getElementById('f-not-empresa').value='';
  document.getElementById('f-not-texto').value='';
  document.getElementById('f-not-desde').value='';
  renderNotas();
}
export async function delNota(id){
  if(!confirm('¿Eliminar nota?'))return;
  try{
    await db.del('notas',id);
    STATE.notas=STATE.notas.filter(n=>n.id!==id);
    renderNotas();
  }catch(e){alert('Error al eliminar nota: '+e.message);}
}
export function editNota(id){
  const n=STATE.notas.find(x=>x.id===id);
  if(n)openModal('nota',n);
}
