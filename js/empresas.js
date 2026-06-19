import {STATE} from './state.js';
import {db} from './db.js';
import {empNombre, fmtPeso, badgeEstado, populateFiltros} from './utils.js';
import {openModal} from './modales.js';

export function renderEmpresas(){
  const filtro=document.getElementById('f-emp-holding').value;
  let emps=STATE.empresas;
  if(filtro==='holding')emps=emps.filter(e=>e.es_holding);
  if(filtro==='subsidiaria')emps=emps.filter(e=>e.holding_id);
  const el=document.getElementById('emp-list');
  if(!emps.length){el.innerHTML='<p class="muted" style="padding:.5rem 0;color:var(--text3)">No hay empresas. Creá la primera.</p>';return;}

  const holdings=emps.filter(e=>e.es_holding).sort((a,b)=>a.nombre.localeCompare(b.nombre,'es'));
  const sinHolding=emps.filter(e=>!e.es_holding&&!e.holding_id).sort((a,b)=>a.nombre.localeCompare(b.nombre,'es'));
  const filas=[];
  holdings.forEach(h=>{
    filas.push({...h,_esHolding:true});
    const subs=emps.filter(e=>e.holding_id==h.id).sort((a,b)=>a.nombre.localeCompare(b.nombre,'es'));
    subs.forEach(s=>filas.push({...s,_esHolding:false,_sub:true}));
  });
  sinHolding.forEach(e=>filas.push({...e,_esHolding:false,_sub:false}));

  const btnAcciones=(e)=>`
    <button class="btn btn-sm btn-primary" onclick="abrirFichaEmpresa(${e.id})" title="Ver ficha"><i class="ti ti-eye"></i> Ver</button>
    <button class="btn btn-sm" onclick="editEmpresa(${e.id})" title="Editar"><i class="ti ti-pencil"></i></button>
    <button class="btn btn-sm btn-danger" onclick="delEmpresa(${e.id})" title="Eliminar"><i class="ti ti-trash"></i></button>`;

  el.innerHTML=`<table class="data-table">
    <thead><tr><th>Nombre</th><th>Rubro</th><th>CUIT</th><th>Responsable</th><th>Tipo</th><th></th></tr></thead>
    <tbody>${filas.map(e=>{
      const tipo=e._esHolding
        ?'<span class="badge badge-holding">Holding</span>'
        :'<span class="badge" style="background:var(--bg2);color:var(--text3)">Empresa</span>';
      const indent=e._sub?'padding-left:18px;border-left:3px solid var(--teal);margin-left:4px':'';
      const nombre=e._esHolding
        ?`<strong style="font-size:14px">${e.nombre}</strong>`
        :`<span style="${indent};display:block">${e.nombre}</span>`;
      const bgRow=e._esHolding?'background:var(--bg2)':'';
      return`<tr style="${bgRow}">
        <td style="padding-left:${e._sub?'24px':'12px'}">${nombre}${e.domicilio&&e._esHolding?`<div class="muted" style="font-size:11px">${e.domicilio}</div>`:''}</td>
        <td class="muted">${e.rubro||'—'}</td>
        <td class="muted">${e.cuit||'—'}</td>
        <td class="muted">${e.responsable||'—'}${e.mail?`<br><span style="font-size:11px">${e.mail}</span>`:''}</td>
        <td>${tipo}</td>
        <td style="white-space:nowrap">${btnAcciones(e)}</td>
      </tr>`;
    }).join('')}</tbody>
  </table>`;
}

export async function delEmpresa(id){
  if(!confirm('¿Eliminar empresa? Se eliminarán también sus tareas, proyectos y períodos.'))return;
  try{
    await db.del('empresas',id);
    STATE.empresas=STATE.empresas.filter(e=>e.id!==id);
    populateFiltros();renderEmpresas();
  }catch(e){alert('Error al eliminar empresa: '+e.message);}
}

export function editEmpresa(id){
  const e=STATE.empresas.find(x=>x.id===id);
  if(e)openModal('empresa',e);
}

export function abrirFichaEmpresa(id){
  document.querySelectorAll('.pg').forEach(p=>p.style.display='none');
  document.getElementById('pg-ficha-empresa').style.display='block';
  document.getElementById('topTitle').textContent='Ficha de Empresa';
  renderFichaEmpresa(id);
}

export function renderFichaEmpresa(id){
  const e=STATE.empresas.find(x=>x.id==id);
  if(!e)return;
  const el=document.getElementById('ficha-empresa-content');
  const tareas=STATE.tareas.filter(t=>t.empresa_id==id);
  const notas=STATE.notas.filter(n=>n.empresa_id==id);
  const proyectos=STATE.proyectos.filter(p=>p.empresa_id==id);
  const directivos=STATE.directivos.filter(d=>d.empresa_id==id);

  const dirHTML=directivos.length
    ?`<table class="data-table"><thead><tr><th>Nombre</th><th>Cargo</th><th>Celular</th><th>Mail</th></tr></thead><tbody>
      ${directivos.map(d=>`<tr>
        <td><strong>${d.nombre||'—'}</strong></td>
        <td class="muted">${d.cargo||'—'}</td>
        <td class="muted">${d.celular?`<a href="tel:${d.celular}">${d.celular}</a>`:'—'}</td>
        <td class="muted">${d.mail?`<a href="mailto:${d.mail}">${d.mail}</a>`:'—'}</td>
      </tr>`).join('')}</tbody></table>`
    :'<p class="muted" style="color:var(--text3)">Sin directivos registrados.</p>';

  const tarHTML=tareas.length
    ?`<table class="data-table"><thead><tr><th>Descripción</th><th>Responsable</th><th>Inicio</th><th>Vence</th><th>Estado</th></tr></thead><tbody>
      ${tareas.map(t=>`<tr>
        <td>${t.descripcion||'—'}</td>
        <td class="muted">${t.responsable||'—'}</td>
        <td class="muted">${t.fecha_inicio||'—'}</td>
        <td class="muted">${t.fecha_fin||'—'}</td>
        <td>${badgeEstado(t.estado)}</td>
      </tr>`).join('')}</tbody></table>`
    :'<p class="muted" style="color:var(--text3)">Sin tareas registradas.</p>';

  const proyHTML=proyectos.length
    ?`<table class="data-table"><thead><tr><th>Proyecto</th><th>Estado</th><th>Inicio</th><th>Fin</th><th>Presupuesto</th><th>Avance</th></tr></thead><tbody>
      ${proyectos.map(p=>{
        const certs=STATE.certificaciones.filter(c=>c.proyecto_id===p.id);
        const avance=certs.length?certs.reduce((a,c)=>new Date(c.fecha)>=new Date(a.fecha)?c:a).avance_fisico:0;
        return`<tr>
          <td><strong>${p.nombre||'—'}</strong><div class="muted" style="font-size:11px">${p.detalle||''}</div></td>
          <td>${badgeEstado(p.estado)}</td>
          <td class="muted">${p.fecha_inicio||'—'}</td>
          <td class="muted">${p.fecha_fin||'—'}</td>
          <td class="muted">${fmtPeso(p.presupuesto)} ${p.moneda||''}</td>
          <td>
            <div style="display:flex;align-items:center;gap:6px">
              <div style="flex:1;background:var(--bg2);border-radius:3px;height:8px;min-width:60px">
                <div style="width:${avance}%;height:100%;background:var(--teal);border-radius:3px"></div>
              </div>
              <span style="font-size:11px;color:var(--text2)">${avance}%</span>
            </div>
          </td>
        </tr>`;
      }).join('')}</tbody></table>`
    :'<p class="muted" style="color:var(--text3)">Sin proyectos registrados.</p>';

  const notHTML=notas.length
    ?notas.sort((a,b)=>b.fecha_input?.localeCompare(a.fecha_input||'')).map(n=>`
      <div style="padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="font-size:11px;color:var(--text3);margin-bottom:4px">${n.fecha_input||''}${n.tema?` · <span style="color:var(--teal)">${n.tema}</span>`:''}</div>
        <div style="font-size:13px;color:var(--text1)">${n.texto||''}</div>
      </div>`).join('')
    :'<p class="muted" style="color:var(--text3)">Sin notas registradas.</p>';

  const holding=e.holding_id?`<span style="font-size:12px;color:var(--text3)"> · Holding: ${empNombre(e.holding_id)}</span>`:'';
  const tipo=e.es_holding?'<span class="badge badge-holding">Holding</span>':'<span class="badge" style="background:var(--bg2);color:var(--text3)">Empresa</span>';

  el.innerHTML=`
    <div class="card" style="margin-bottom:16px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:8px">
        <div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <h2 style="margin:0;font-size:20px">${e.nombre}</h2>
            ${tipo}${holding}
          </div>
          <div style="display:flex;gap:24px;flex-wrap:wrap;margin-top:8px">
            ${e.rubro?`<span style="font-size:12px;color:var(--text3)"><i class="ti ti-tag"></i> ${e.rubro}</span>`:''}
            ${e.cuit?`<span style="font-size:12px;color:var(--text3)"><i class="ti ti-id-badge"></i> CUIT: ${e.cuit}</span>`:''}
            ${e.domicilio?`<span style="font-size:12px;color:var(--text3)"><i class="ti ti-map-pin"></i> ${e.domicilio}</span>`:''}
            ${e.mail?`<span style="font-size:12px;color:var(--text3)"><i class="ti ti-mail"></i> ${e.mail}</span>`:''}
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-sm" onclick="editEmpresa(${e.id});"><i class="ti ti-pencil"></i> Editar</button>
        </div>
      </div>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card-header"><div class="card-title"><i class="ti ti-users"></i> Directivos <span style="font-size:12px;color:var(--text3);font-weight:400">(${directivos.length})</span></div></div>
      ${dirHTML}
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card-header"><div class="card-title"><i class="ti ti-checkbox"></i> Tareas <span style="font-size:12px;color:var(--text3);font-weight:400">(${tareas.length})</span></div></div>
      ${tarHTML}
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card-header"><div class="card-title"><i class="ti ti-briefcase"></i> Proyectos <span style="font-size:12px;color:var(--text3);font-weight:400">(${proyectos.length})</span></div></div>
      ${proyHTML}
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card-header"><div class="card-title"><i class="ti ti-notes"></i> Notas <span style="font-size:12px;color:var(--text3);font-weight:400">(${notas.length})</span></div></div>
      ${notHTML}
    </div>
  `;
}
