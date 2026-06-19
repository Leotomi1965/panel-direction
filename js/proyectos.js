import {STATE, app} from './state.js';
import {db} from './db.js';
import {empNombre, fmtPeso, badgeEstado, badgeMoneda, getEstadosPills} from './utils.js';
import {openModal} from './modales.js';

export function renderProyectos(){
  const empId=document.getElementById('f-proy-empresa').value;
  const estados=getEstadosPills('f-proy-estados');
  let proy=STATE.proyectos;
  if(empId)proy=proy.filter(p=>p.empresa_id==empId);
  if(estados.length)proy=proy.filter(p=>estados.includes(p.estado||'pendiente'));
  if(app.vistaProyectos==='tabla')renderProyectosTabla(proy);
  else renderProyectosGantt(proy);
}

export function renderProyectosTabla(proy){
  document.getElementById('proy-tabla').style.display='block';
  document.getElementById('proy-gantt').style.display='none';
  const el=document.getElementById('proy-tabla');
  if(!proy.length){el.innerHTML='<p style="color:var(--text3);padding:.5rem 0">No hay proyectos.</p>';return;}
  el.innerHTML=`<table class="data-table">
    <thead><tr><th>Empresa</th><th>Proyecto</th><th>Inicio</th><th>Fin</th><th>Presupuesto</th><th>Avance</th><th>Estado</th><th></th></tr></thead>
    <tbody>${proy.map(p=>{
      const certs=STATE.certificaciones.filter(c=>c.proyecto_id===p.id);
      const avanceFis=certs.length?certs.reduce((a,c)=>new Date(c.fecha)>=new Date(a.fecha)?c:a).avance_fisico:0;
      const montoCert=certs.reduce((s,c)=>s+(c.monto_certificado||0),0);
      return`<tr>
        <td class="muted">${empNombre(p.empresa_id)}</td>
        <td><strong>${p.nombre||'—'}</strong>${p.detalle?`<div class="muted" style="font-size:11px">${p.detalle.slice(0,60)}${p.detalle.length>60?'…':''}</div>`:''}</td>
        <td class="muted">${p.fecha_inicio||'—'}</td>
        <td class="muted">${p.fecha_fin||'—'}</td>
        <td class="muted">${fmtPeso(p.presupuesto)} ${badgeMoneda(p.moneda)}</td>
        <td>
          <div style="font-size:12px">${avanceFis}%</div>
          <div class="cert-bar-wrap"><div class="cert-bar" style="width:${avanceFis}%"></div></div>
        </td>
        <td>${badgeEstado(p.estado)}</td>
        <td style="white-space:nowrap">
          <button class="btn btn-sm" onclick="verDetalle(${p.id})" title="Ver certificaciones"><i class="ti ti-eye"></i></button>
          <button class="btn btn-sm" onclick="editProyecto(${p.id})" title="Editar"><i class="ti ti-pencil"></i></button>
          <button class="btn btn-sm btn-danger" onclick="delProyecto(${p.id})"><i class="ti ti-trash"></i></button>
        </td>
      </tr>`;
    }).join('')}</tbody>
  </table>`;
}

export function renderProyectosGantt(proy){
  document.getElementById('proy-tabla').style.display='none';
  document.getElementById('proy-gantt').style.display='block';
  const el=document.getElementById('proy-gantt');
  const conFechas=proy.filter(p=>p.fecha_inicio&&p.fecha_fin);
  if(!conFechas.length){el.innerHTML='<p style="color:var(--text3);padding:.5rem 0">Los proyectos necesitan fechas de inicio y fin para mostrar Gantt.</p>';return;}
  const fechas=conFechas.flatMap(p=>[new Date(p.fecha_inicio),new Date(p.fecha_fin)]);
  const minD=new Date(Math.min(...fechas));
  const maxD=new Date(Math.max(...fechas));
  const totalDias=(maxD-minD)/86400000||1;
  const colors=['#1D9E75','#185FA5','#BA7517','#534AB7','#E24B4A','#0F6E56'];
  el.innerHTML=`<div style="min-width:600px">
    <div style="display:flex;gap:8px;margin-bottom:12px;padding-left:220px">
      <span style="font-size:11px;color:var(--text3)">${minD.toLocaleDateString('es-AR')}</span>
      <div style="flex:1"></div>
      <span style="font-size:11px;color:var(--text3)">${maxD.toLocaleDateString('es-AR')}</span>
    </div>
    ${conFechas.map((p,i)=>{
      const ini=(new Date(p.fecha_inicio)-minD)/86400000;
      const dur=(new Date(p.fecha_fin)-new Date(p.fecha_inicio))/86400000+1;
      const left=(ini/totalDias*100).toFixed(1);
      const width=Math.max((dur/totalDias*100),2).toFixed(1);
      const certs=STATE.certificaciones.filter(c=>c.proyecto_id===p.id);
      const avance=certs.length?certs.reduce((a,c)=>new Date(c.fecha)>=new Date(a.fecha)?c:a).avance_fisico:0;
      const color=colors[i%colors.length];
      return`<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <div style="width:210px;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text)" title="${p.nombre}">${p.nombre}</div>
        <div style="flex:1;background:var(--bg2);border-radius:4px;height:28px;position:relative">
          <div style="position:absolute;left:${left}%;width:${width}%;height:100%;background:${color};border-radius:4px;opacity:0.85;display:flex;align-items:center;padding:0 6px">
            <span style="font-size:11px;color:#fff">${avance}%</span>
          </div>
        </div>
        <div style="width:40px;font-size:11px;color:var(--text3);text-align:right">${avance}%</div>
      </div>`;
    }).join('')}
  </div>`;
}

export function setVistaProyectos(v){
  app.vistaProyectos=v;
  document.getElementById('btn-proy-tabla').style.cssText=v==='tabla'?'background:var(--teal);color:#fff':'';
  document.getElementById('btn-proy-gantt').style.cssText=v==='gantt'?'background:var(--teal);color:#fff':'';
  renderProyectos();
}

export function verDetalle(id){
  app.proyectoActivoId=id;
  const p=STATE.proyectos.find(x=>x.id===id);
  if(!p)return;
  document.getElementById('proy-detalle').style.display='block';
  document.getElementById('proy-det-titulo').textContent=p.nombre;
  const certs=STATE.certificaciones.filter(c=>c.proyecto_id===id);
  const montoCert=certs.reduce((s,c)=>s+(c.monto_certificado||0),0);
  const saldo=(p.presupuesto||0)-montoCert;
  const avance=certs.length?certs.reduce((a,c)=>new Date(c.fecha)>=new Date(a.fecha)?c:a).avance_fisico:0;
  document.getElementById('proy-det-info').innerHTML=`
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:1rem">
      <div class="sc"><div class="sc-num">${fmtPeso(p.presupuesto)}</div><div class="sc-lbl">Presupuesto ${p.moneda||'ARS'}</div></div>
      <div class="sc"><div class="sc-num">${fmtPeso(montoCert)}</div><div class="sc-lbl">Certificado</div></div>
      <div class="sc"><div class="sc-num" style="color:var(--amber)">${fmtPeso(saldo)}</div><div class="sc-lbl">Saldo remanente</div></div>
      <div class="sc"><div class="sc-num">${avance}%</div><div class="sc-lbl">Avance físico</div></div>
    </div>
    <div class="cert-bar-wrap" style="height:16px;margin-bottom:1rem"><div class="cert-bar" style="width:${avance}%"></div></div>
    <p style="font-size:13px;color:var(--text2)">${p.detalle||''}</p>`;
  renderCertificaciones(id);
  document.getElementById('proy-detalle').scrollIntoView({behavior:'smooth'});
}

export function cerrarDetalle(){
  document.getElementById('proy-detalle').style.display='none';
  app.proyectoActivoId=null;
}

export function renderCertificaciones(proyId){
  const certs=STATE.certificaciones.filter(c=>c.proyecto_id===proyId)
    .sort((a,b)=>a.fecha>b.fecha?-1:1);
  const p=STATE.proyectos.find(x=>x.id===proyId);
  const el=document.getElementById('cert-list');
  if(!certs.length){el.innerHTML='<p style="color:var(--text3);padding:.5rem 0">No hay certificaciones aún.</p>';return;}
  const certsAsc=[...certs].sort((a,b)=>a.fecha>b.fecha?1:-1);
  let acumMonto=0;
  const certsConSaldo=certsAsc.map(c=>{
    acumMonto+=(c.monto_certificado||0);
    return{...c,saldo:(p?.presupuesto||0)-acumMonto,acum:acumMonto};
  }).reverse();
  el.innerHTML=`<table class="data-table">
    <thead><tr><th>Fecha</th><th>Avance físico</th><th>Monto certificado</th><th>Acumulado</th><th>Saldo remanente</th><th>Descripción</th><th></th></tr></thead>
    <tbody>${certsConSaldo.map(c=>`<tr>
        <td class="muted">${c.fecha||'—'}</td>
        <td>
          <div>${c.avance_fisico||0}%</div>
          <div class="cert-bar-wrap"><div class="cert-bar" style="width:${c.avance_fisico||0}%"></div></div>
        </td>
        <td>${fmtPeso(c.monto_certificado)} <span class="muted">${p?.moneda||'ARS'}</span></td>
        <td class="muted">${fmtPeso(c.acum)} <span class="muted">${p?.moneda||'ARS'}</span></td>
        <td style="color:${c.saldo>=0?'var(--amber)':'var(--red)'}">${fmtPeso(c.saldo)}</td>
        <td class="muted">${c.descripcion||'—'}</td>
        <td><button class="btn btn-sm btn-danger" onclick="delCert(${c.id})"><i class="ti ti-trash"></i></button></td>
      </tr>`).join('')}</tbody>
  </table>`;
}

export async function delProyecto(id){
  if(!confirm('¿Eliminar proyecto y sus certificaciones?'))return;
  try{
    await db.del('proyectos',id);
    STATE.proyectos=STATE.proyectos.filter(p=>p.id!==id);
    STATE.certificaciones=STATE.certificaciones.filter(c=>c.proyecto_id!==id);
    renderProyectos();
  }catch(e){alert('Error al eliminar proyecto: '+e.message);}
}
export function editProyecto(id){
  const p=STATE.proyectos.find(x=>x.id===id);
  if(p)openModal('proyecto',p);
}
export async function delCert(id){
  if(!confirm('¿Eliminar certificación?'))return;
  try{
    await db.del('certificaciones',id);
    STATE.certificaciones=STATE.certificaciones.filter(c=>c.id!==id);
    if(app.proyectoActivoId)renderCertificaciones(app.proyectoActivoId);
  }catch(e){alert('Error al eliminar certificación: '+e.message);}
}
