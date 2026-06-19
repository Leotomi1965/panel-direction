import {STATE, app} from './state.js';
import {empNombre, fmtPeso} from './utils.js';

export function openExport(){document.getElementById('export-overlay').classList.add('open');}
export function closeExport(){document.getElementById('export-overlay').classList.remove('open');}
export function selFmt(f){
  app.exportFmt=f;
  ['xlsx','csv','pdf'].forEach(x=>{
    const el=document.getElementById('fmt-'+x);
    el.style.borderColor=x===f?'var(--teal)':'';
    el.style.color=x===f?'var(--teal)':'';
  });
}
export function doExport(){
  const incEmps=document.getElementById('ex-empresas').checked;
  const incTar=document.getElementById('ex-tareas').checked;
  const incProy=document.getElementById('ex-proyectos').checked;
  const incNot=document.getElementById('ex-notas').checked;
  const incFin=document.getElementById('ex-finanzas').checked;
  if(app.exportFmt==='xlsx')exportXLSX(incEmps,incTar,incProy,incNot,incFin);
  else if(app.exportFmt==='csv')exportCSV(incEmps,incTar,incProy,incNot,incFin);
  else if(app.exportFmt==='pdf')exportPDF(incEmps,incTar,incProy,incNot,incFin);
  closeExport();
}

export function exportXLSX(incEmps,incTar,incProy,incNot,incFin){
  const wb=XLSX.utils.book_new();
  if(incEmps){
    const rows=[['Nombre','Rubro','CUIT','Domicilio','Responsable','Celular','Email','Es Holding','Holding Padre']];
    STATE.empresas.forEach(e=>rows.push([e.nombre,e.rubro,e.cuit,e.domicilio,e.responsable,e.celular,e.mail,e.es_holding?'Sí':'No',e.holding_id?empNombre(e.holding_id):'']));
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),'Empresas');
  }
  if(incTar){
    const rows=[['Empresa','Descripción','Responsable','Estado','Fecha Input','Fecha Inicio','Fecha Fin']];
    STATE.tareas.forEach(t=>rows.push([empNombre(t.empresa_id),t.descripcion,t.responsable,t.estado,t.fecha_input,t.fecha_inicio,t.fecha_fin]));
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),'Tareas');
  }
  if(incProy){
    const rows=[['Empresa','Proyecto','Detalle','Estado','Fecha Inicio','Fecha Fin','Presupuesto','Moneda','Avance %','Certificado','Saldo']];
    STATE.proyectos.forEach(p=>{
      const certs=STATE.certificaciones.filter(c=>c.proyecto_id===p.id);
      const avance=certs.length?certs.reduce((a,c)=>new Date(c.fecha)>=new Date(a.fecha)?c:a).avance_fisico:0;
      const cert=certs.reduce((s,c)=>s+(c.monto_certificado||0),0);
      rows.push([empNombre(p.empresa_id),p.nombre,p.detalle,p.estado,p.fecha_inicio,p.fecha_fin,p.presupuesto,p.moneda,avance,cert,(p.presupuesto||0)-cert]);
    });
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),'Proyectos');
  }
  if(incNot){
    const rows=[['Fecha','Empresa','Texto']];
    STATE.notas.forEach(n=>rows.push([n.fecha_input,empNombre(n.empresa_id),n.texto]));
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),'Notas');
  }
  if(incFin){
    const rows=[['Empresa','Período','TC','Ventas','CV','CF','Otros','EBIT','Rdo Financiero','IIGG','Net Profit']];
    STATE.periodos.forEach(p=>{const mb=p.ventas-p.cv;const ebit=mb-p.cf+(p.otros||0);const np=ebit+(p.resultado_financiero||0)-(p.iigg||0);rows.push([empNombre(p.empresa_id),p.label,p.tc,p.ventas,p.cv,p.cf,p.otros||0,ebit,p.resultado_financiero||0,p.iigg||0,np]);});
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rows),'Finanzas');
  }
  XLSX.writeFile(wb,`andra_panel_${new Date().toISOString().slice(0,10)}.xlsx`);
}

export function exportCSV(incEmps,incTar,incProy,incNot,incFin){
  const esc=v=>{const s=String(v==null?'':v);return s.includes(',')||s.includes('"')||s.includes('\n')?'"'+s.replace(/"/g,'""')+'"':s;};
  const row=cols=>cols.map(esc).join(',')+'\n';
  let csv='';
  if(incEmps){
    csv+='EMPRESAS\n';
    csv+=row(['Nombre','Rubro','CUIT','Domicilio','Responsable','Celular','Email','Es Holding','Holding Padre']);
    STATE.empresas.forEach(e=>csv+=row([e.nombre,e.rubro,e.cuit,e.domicilio,e.responsable,e.celular,e.mail,e.es_holding?'Sí':'No',e.holding_id?empNombre(e.holding_id):'']));
    csv+='\n';
  }
  if(incTar){
    csv+='TAREAS\n';
    csv+=row(['Empresa','Descripción','Responsable','Estado','Fecha Input','Fecha Inicio','Fecha Fin']);
    STATE.tareas.forEach(t=>csv+=row([empNombre(t.empresa_id),t.descripcion,t.responsable,t.estado,t.fecha_input,t.fecha_inicio,t.fecha_fin]));
    csv+='\n';
  }
  if(incProy){
    csv+='PROYECTOS\n';
    csv+=row(['Empresa','Proyecto','Detalle','Estado','Fecha Inicio','Fecha Fin','Presupuesto','Moneda','Avance %','Certificado','Saldo']);
    STATE.proyectos.forEach(p=>{
      const certs=STATE.certificaciones.filter(c=>c.proyecto_id===p.id);
      const avance=certs.length?certs.reduce((a,c)=>new Date(c.fecha)>=new Date(a.fecha)?c:a).avance_fisico:0;
      const cert=certs.reduce((s,c)=>s+(c.monto_certificado||0),0);
      csv+=row([empNombre(p.empresa_id),p.nombre,p.detalle,p.estado,p.fecha_inicio,p.fecha_fin,p.presupuesto,p.moneda,avance,cert,(p.presupuesto||0)-cert]);
    });
    csv+='\n';
  }
  if(incNot){
    csv+='NOTAS\n';
    csv+=row(['Fecha','Empresa','Texto']);
    STATE.notas.forEach(n=>csv+=row([n.fecha_input,empNombre(n.empresa_id),n.texto]));
    csv+='\n';
  }
  if(incFin){
    csv+='FINANZAS\n';
    csv+=row(['Empresa','Período','TC','Ventas','CV','CF','Otros','EBIT','Rdo Financiero','IIGG','Net Profit']);
    STATE.periodos.forEach(p=>{const mb=p.ventas-p.cv;const ebit=mb-p.cf+(p.otros||0);const np=ebit+(p.resultado_financiero||0)-(p.iigg||0);csv+=row([empNombre(p.empresa_id),p.label,p.tc,p.ventas,p.cv,p.cf,p.otros||0,ebit,p.resultado_financiero||0,p.iigg||0,np]);});
    csv+='\n';
  }
  const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=`andra_panel_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPDF(incEmps,incTar,incProy,incNot,incFin){
  const w=window.open('','_blank');
  let html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ANDRA PANEL</title>
  <style>body{font-family:Arial,sans-serif;font-size:12px;color:#1a1a18;margin:2cm}h1{font-size:20px;color:#1D9E75;margin-bottom:4px}h2{font-size:14px;margin:20px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px;color:#444}table{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:11px}th{background:#f5f5f3;text-align:left;padding:5px 8px;border:0.5px solid #ddd}td{padding:5px 8px;border:0.5px solid #eee}.meta{font-size:10px;color:#888}@media print{body{margin:1cm}}</style></head><body>`;
  html+=`<h1>ANDRA PANEL</h1><p class="meta">Exportado el ${new Date().toLocaleDateString('es-AR')} · Moneda: ${app.CUR}</p>`;
  if(incEmps){html+=`<h2>Empresas</h2><table><tr><th>Nombre</th><th>Rubro</th><th>CUIT</th><th>Tipo</th></tr>`;STATE.empresas.forEach(e=>{html+=`<tr><td>${e.nombre}</td><td>${e.rubro||''}</td><td>${e.cuit||''}</td><td>${e.es_holding?'Holding':'Empresa'}</td></tr>`;});html+='</table>';}
  if(incTar){html+=`<h2>Tareas</h2><table><tr><th>Empresa</th><th>Descripción</th><th>Estado</th><th>Vence</th></tr>`;STATE.tareas.forEach(t=>{html+=`<tr><td>${empNombre(t.empresa_id)}</td><td>${t.descripcion||''}</td><td>${t.estado||''}</td><td>${t.fecha_fin||''}</td></tr>`;});html+='</table>';}
  if(incProy){html+=`<h2>Proyectos</h2><table><tr><th>Empresa</th><th>Proyecto</th><th>Estado</th><th>Presupuesto</th><th>Avance</th></tr>`;STATE.proyectos.forEach(p=>{const certs=STATE.certificaciones.filter(c=>c.proyecto_id===p.id);const avance=certs.length?certs.reduce((a,c)=>new Date(c.fecha)>=new Date(a.fecha)?c:a).avance_fisico:0;html+=`<tr><td>${empNombre(p.empresa_id)}</td><td>${p.nombre||''}</td><td>${p.estado||''}</td><td>${fmtPeso(p.presupuesto)} ${p.moneda||''}</td><td>${avance}%</td></tr>`;});html+='</table>';}
  if(incNot){html+=`<h2>Notas</h2><table><tr><th>Fecha</th><th>Empresa</th><th>Texto</th></tr>`;STATE.notas.forEach(n=>{html+=`<tr><td>${n.fecha_input||''}</td><td>${empNombre(n.empresa_id)}</td><td>${(n.texto||'').slice(0,200)}</td></tr>`;});html+='</table>';}
  html+=`<script>window.onload=()=>window.print()<\/script></body></html>`;
  w.document.write(html);w.document.close();
}
