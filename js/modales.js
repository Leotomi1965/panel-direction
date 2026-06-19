import {STATE, app} from './state.js';
import {db} from './db.js';
import {today, populateFiltros} from './utils.js';
import {renderEmpresas} from './empresas.js';
import {renderTareas} from './tareas.js';
import {renderNotas} from './notas.js';
import {renderProyectos, verDetalle} from './proyectos.js';

let modalType='';
let modalId=null;

export function openModal(type, data=null){
  modalType=type; modalId=data?.id||null;
  const box=document.getElementById('modal-box');
  const empsOpts=STATE.empresas.map(e=>`<option value="${e.id}"${data?.empresa_id==e.id?' selected':''}>${e.nombre}</option>`).join('');
  const holdingOpts=STATE.empresas.filter(e=>e.es_holding).map(e=>`<option value="${e.id}"${data?.holding_id==e.id?' selected':''}>${e.nombre}</option>`).join('');

  if(type==='empresa'){
    box.innerHTML=`<h3>${data?'Editar':'Nueva'} empresa</h3>
    <div class="form-grid" style="margin-bottom:10px">
      <div class="form-group"><label class="fl">Nombre *</label><input id="m-nombre" value="${data?.nombre||''}"/></div>
      <div class="form-group"><label class="fl">Rubro</label><input id="m-rubro" value="${data?.rubro||''}"/></div>
      <div class="form-group"><label class="fl">CUIT</label><input id="m-cuit" value="${data?.cuit||''}"/></div>
      <div class="form-group"><label class="fl">Domicilio</label><input id="m-dom" value="${data?.domicilio||''}"/></div>
      <div class="form-group"><label class="fl">Responsable</label><input id="m-resp" value="${data?.responsable||''}"/></div>
      <div class="form-group"><label class="fl">Celular</label><input id="m-cel" value="${data?.celular||''}"/></div>
      <div class="form-group"><label class="fl">Email</label><input id="m-mail" value="${data?.mail||''}"/></div>
      <div class="form-group"><label class="fl">Holding padre</label>
        <select id="m-holding"><option value="">Ninguno</option>${holdingOpts}</select></div>
    </div>
    <label style="display:flex;gap:8px;align-items:center;font-size:13px;margin-bottom:1rem">
      <input type="checkbox" id="m-es-holding"${data?.es_holding?' checked':''}> Esta empresa es cabeza de holding
    </label>
    <div class="modal-actions">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveModal()">Guardar</button>
    </div>`;
  }
  else if(type==='tarea'){
    box.innerHTML=`<h3>${data?'Editar':'Nueva'} tarea</h3>
    <div class="form-grid" style="margin-bottom:10px">
      <div class="form-group" style="grid-column:1/-1"><label class="fl">Empresa</label>
        <select id="m-empresa"><option value="">— sin empresa —</option>${empsOpts}</select></div>
      <div class="form-group" style="grid-column:1/-1"><label class="fl">Descripción *</label>
        <textarea id="m-desc">${data?.descripcion||''}</textarea></div>
      <div class="form-group"><label class="fl">Responsable</label><input id="m-resp" value="${data?.responsable||''}"/></div>
      <div class="form-group"><label class="fl">Estado</label>
        <select id="m-estado">
          <option value="pendiente"${data?.estado==='pendiente'?' selected':''}>Pendiente</option>
          <option value="en-curso"${data?.estado==='en-curso'?' selected':''}>En curso</option>
          <option value="completada"${data?.estado==='completada'?' selected':''}>Completada</option>
          <option value="cancelada"${data?.estado==='cancelada'?' selected':''}>Cancelada</option>
        </select></div>
      <div class="form-group"><label class="fl">Fecha inicio</label><input type="date" id="m-fi" value="${data?.fecha_inicio||''}"/></div>
      <div class="form-group"><label class="fl">Fecha fin / vencimiento</label><input type="date" id="m-ff" value="${data?.fecha_fin||''}"/></div>
    </div>
    <div class="modal-actions">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveModal()">Guardar</button>
    </div>`;
  }
  else if(type==='nota'){
    box.innerHTML=`<h3>${data?'Editar':'Nueva'} nota</h3>
    <div style="margin-bottom:10px">
      <div class="form-group" style="margin-bottom:10px"><label class="fl">Empresa (opcional)</label>
        <select id="m-empresa"><option value="">— sin empresa —</option>${empsOpts}</select></div>
      <div class="form-group" style="margin-bottom:10px"><label class="fl">Tema</label>
        <input id="m-tema" value="${data?.tema||''}" placeholder="Ej: Reunión, Acuerdo, Seguimiento…"/></div>
      <div class="form-group"><label class="fl">Texto *</label>
        <textarea id="m-texto" style="min-height:120px">${data?.texto||''}</textarea></div>
    </div>
    <div class="modal-actions">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveModal()">Guardar</button>
    </div>`;
  }
  else if(type==='proyecto'){
    box.innerHTML=`<h3>${data?'Editar':'Nuevo'} proyecto</h3>
    <div class="form-grid" style="margin-bottom:10px">
      <div class="form-group" style="grid-column:1/-1"><label class="fl">Empresa</label>
        <select id="m-empresa"><option value="">— sin empresa —</option>${empsOpts}</select></div>
      <div class="form-group" style="grid-column:1/-1"><label class="fl">Nombre del proyecto *</label>
        <input id="m-nombre" value="${data?.nombre||''}"/></div>
      <div class="form-group" style="grid-column:1/-1"><label class="fl">Detalle / descripción</label>
        <textarea id="m-detalle">${data?.detalle||''}</textarea></div>
      <div class="form-group"><label class="fl">Fecha inicio</label><input type="date" id="m-fi" value="${data?.fecha_inicio||''}"/></div>
      <div class="form-group"><label class="fl">Fecha fin estimada</label><input type="date" id="m-ff" value="${data?.fecha_fin||''}"/></div>
      <div class="form-group"><label class="fl">Presupuesto</label><input type="number" id="m-pres" value="${data?.presupuesto||''}"/></div>
      <div class="form-group"><label class="fl">Moneda</label>
        <select id="m-moneda">
          <option value="ARS"${data?.moneda==='ARS'||!data?' selected':''}>ARS</option>
          <option value="USD"${data?.moneda==='USD'?' selected':''}>USD</option>
        </select></div>
      <div class="form-group"><label class="fl">Estado</label>
        <select id="m-estado">
          <option value="pendiente"${data?.estado==='pendiente'||!data?' selected':''}>Pendiente</option>
          <option value="en-curso"${data?.estado==='en-curso'?' selected':''}>En curso</option>
          <option value="completada"${data?.estado==='completada'?' selected':''}>Completada</option>
          <option value="cancelada"${data?.estado==='cancelada'?' selected':''}>Cancelada</option>
        </select></div>
    </div>
    <div class="modal-actions">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveModal()">Guardar</button>
    </div>`;
  }
  else if(type==='certificacion'){
    const p=STATE.proyectos.find(x=>x.id===app.proyectoActivoId);
    box.innerHTML=`<h3>Nueva certificación — ${p?.nombre||''}</h3>
    <div class="form-grid" style="margin-bottom:10px">
      <div class="form-group"><label class="fl">Fecha</label><input type="date" id="m-fecha" value="${today()}"/></div>
      <div class="form-group"><label class="fl">Avance físico acumulado %</label><input type="number" id="m-avance" min="0" max="100" value="0"/></div>
      <div class="form-group"><label class="fl">Monto certificado (${p?.moneda||'ARS'})</label><input type="number" id="m-monto" value="0"/></div>
      <div class="form-group" style="grid-column:1/-1"><label class="fl">Descripción</label>
        <input id="m-desc" value=""/></div>
    </div>
    <div class="modal-actions">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveModal()">Guardar</button>
    </div>`;
  }
  document.getElementById('modal').classList.add('open');
}

export function closeModal(){
  document.getElementById('modal').classList.remove('open');
}

export async function saveModal(){
  let body={};let table='';
  if(modalType==='empresa'){
    const nombre=document.getElementById('m-nombre').value.trim();
    if(!nombre){alert('El nombre es obligatorio');return;}
    body={nombre,rubro:document.getElementById('m-rubro').value,
      cuit:document.getElementById('m-cuit').value,
      domicilio:document.getElementById('m-dom').value,
      responsable:document.getElementById('m-resp').value,
      celular:document.getElementById('m-cel').value,
      mail:document.getElementById('m-mail').value,
      es_holding:document.getElementById('m-es-holding').checked,
      holding_id:document.getElementById('m-holding').value||null};
    table='empresas';
  }
  else if(modalType==='tarea'){
    const desc=document.getElementById('m-desc').value.trim();
    if(!desc){alert('La descripción es obligatoria');return;}
    body={descripcion:desc,empresa_id:document.getElementById('m-empresa').value||null,
      responsable:document.getElementById('m-resp').value,
      estado:document.getElementById('m-estado').value,
      fecha_input:today(),
      fecha_inicio:document.getElementById('m-fi').value||null,
      fecha_fin:document.getElementById('m-ff').value||null};
    table='tareas';
  }
  else if(modalType==='nota'){
    const texto=document.getElementById('m-texto').value.trim();
    if(!texto){alert('El texto es obligatorio');return;}
    body={texto,tema:document.getElementById('m-tema').value.trim()||null,empresa_id:document.getElementById('m-empresa').value||null,fecha_input:today()};
    table='notas';
  }
  else if(modalType==='proyecto'){
    const nombre=document.getElementById('m-nombre').value.trim();
    if(!nombre){alert('El nombre es obligatorio');return;}
    body={nombre,empresa_id:document.getElementById('m-empresa').value||null,
      detalle:document.getElementById('m-detalle').value,
      fecha_input:today(),
      fecha_inicio:document.getElementById('m-fi').value||null,
      fecha_fin:document.getElementById('m-ff').value||null,
      presupuesto:parseFloat(document.getElementById('m-pres').value)||0,
      moneda:document.getElementById('m-moneda').value,
      estado:document.getElementById('m-estado').value};
    table='proyectos';
  }
  else if(modalType==='certificacion'){
    body={proyecto_id:app.proyectoActivoId,
      fecha:document.getElementById('m-fecha').value,
      avance_fisico:parseFloat(document.getElementById('m-avance').value)||0,
      monto_certificado:parseFloat(document.getElementById('m-monto').value)||0,
      descripcion:document.getElementById('m-desc').value};
    table='certificaciones';
  }

  const saveBtn=document.querySelector('#modal-box .btn-primary');
  if(saveBtn){saveBtn.disabled=true;saveBtn.innerHTML='<i class="ti ti-loader-2"></i> Guardando…';}
  try{
    if(modalId){
      await db.patch(table,modalId,body);
      STATE[table]=STATE[table].map(x=>x.id===modalId?{...x,...body}:x);
    } else {
      const result=await db.post(table,body);
      if(Array.isArray(result)&&result.length)STATE[table].push(result[0]);
    }
    closeModal();
    populateFiltros();
    if(modalType==='empresa')renderEmpresas();
    else if(modalType==='tarea')renderTareas();
    else if(modalType==='nota')renderNotas();
    else if(modalType==='proyecto')renderProyectos();
    else if(modalType==='certificacion'&&app.proyectoActivoId)verDetalle(app.proyectoActivoId);
  }catch(e){
    if(saveBtn){saveBtn.disabled=false;saveBtn.innerHTML='Guardar';}
    alert('Error al guardar: '+e.message);
  }
}
