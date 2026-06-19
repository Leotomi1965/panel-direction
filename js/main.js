import {STATE, app} from './state.js';
import {db} from './db.js';
import {checkSession, doLogin, doLogout} from './auth.js';
import {syncStatus, populateFiltros, toggleSidebar, closeSidebar, updatePillClass, resetPills, PAGE_TITLES} from './utils.js';
import {renderEmpresas, delEmpresa, editEmpresa, abrirFichaEmpresa, renderFichaEmpresa} from './empresas.js';
import {renderTareas, setVistaTareas, clearFiltrosTareas, delTarea, editTarea} from './tareas.js';
import {renderNotas, clearFiltrosNotas, delNota, editNota} from './notas.js';
import {renderProyectos, setVistaProyectos, verDetalle, cerrarDetalle, renderCertificaciones, delProyecto, editProyecto, delCert} from './proyectos.js';
import {onCambioEmpresaFin, loadPeriodosEERR, loadPeriodosBalance, loadPeriodosKPI, renderEERR, renderBalance, renderKPIs, guardarPeriodo} from './finanzas.js';
import {openModal, closeModal, saveModal} from './modales.js';
import {openExport, closeExport, selFmt, doExport} from './export.js';
import {gcalEnviarTarea} from './gcal.js';

async function load(){
  syncStatus('load');
  try{
    const[emps,tar,not,proy,cert,per,dir]=await Promise.all([
      db.get('empresas','select=*&order=nombre'),
      db.get('tareas','select=*&order=fecha_input.desc'),
      db.get('notas','select=*&order=fecha_input.desc'),
      db.get('proyectos','select=*&order=fecha_input.desc'),
      db.get('certificaciones','select=*&order=fecha.desc'),
      db.get('periodos','select=*&order=empresa_id,label'),
      db.get('directivos','select=*'),
    ]);
    STATE.empresas=Array.isArray(emps)?emps:[];
    STATE.tareas=Array.isArray(tar)?tar:[];
    STATE.notas=Array.isArray(not)?not:[];
    STATE.proyectos=Array.isArray(proy)?proy:[];
    STATE.certificaciones=Array.isArray(cert)?cert:[];
    STATE.periodos=Array.isArray(per)?per:[];
    STATE.directivos=Array.isArray(dir)?dir:[];
    populateFiltros();
    renderPage(document.querySelector('.sb-item.active')?.dataset.page||'empresas');
    syncStatus('ok');
  }catch(e){syncStatus('err');console.error('load error:',e);alert('Error al cargar los datos: '+e.message);}
}

function renderPage(page){
  document.querySelectorAll('.pg').forEach(p=>p.style.display='none');
  const pg=document.getElementById('pg-'+page);
  if(pg)pg.style.display='block';
  document.getElementById('topTitle').textContent=PAGE_TITLES[page]||page;
  if(page==='empresas')renderEmpresas();
  if(page==='tareas')renderTareas();
  if(page==='notas')renderNotas();
  if(page==='proyectos'){renderProyectos();document.getElementById('proy-detalle').style.display='none';}
  if(page==='eerr')renderEERR();
  if(page==='balance')renderBalance();
  if(page==='kpis')renderKPIs();
}

function nav(el){
  document.querySelectorAll('.sb-item').forEach(i=>i.classList.remove('active'));
  el.classList.add('active');
  renderPage(el.dataset.page);
  closeSidebar();
}

function setCurrency(c,el){
  app.CUR=c;
  document.querySelectorAll('.currency-toggle .ct-btn').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  rerender();
}
function setCurrencyMob(c){
  app.CUR=c;
  document.getElementById('mob-ars').classList.toggle('active',c==='ARS');
  document.getElementById('mob-usd').classList.toggle('active',c==='USD');
  rerender();
}
function rerender(){
  const page=document.querySelector('.sb-item.active')?.dataset.page;
  if(page)renderPage(page);
}

// Expose all functions that HTML onclick handlers reference
window.load=load;
window.nav=nav;
window.setCurrency=setCurrency;
window.setCurrencyMob=setCurrencyMob;
window.rerender=rerender;
// empresas
window.renderEmpresas=renderEmpresas;
window.delEmpresa=delEmpresa;
window.editEmpresa=editEmpresa;
window.abrirFichaEmpresa=abrirFichaEmpresa;
window.renderFichaEmpresa=renderFichaEmpresa;
// tareas
window.renderTareas=renderTareas;
window.setVistaTareas=setVistaTareas;
window.clearFiltrosTareas=clearFiltrosTareas;
window.delTarea=delTarea;
window.editTarea=editTarea;
// notas
window.renderNotas=renderNotas;
window.clearFiltrosNotas=clearFiltrosNotas;
window.delNota=delNota;
window.editNota=editNota;
// proyectos
window.renderProyectos=renderProyectos;
window.setVistaProyectos=setVistaProyectos;
window.verDetalle=verDetalle;
window.cerrarDetalle=cerrarDetalle;
window.renderCertificaciones=renderCertificaciones;
window.delProyecto=delProyecto;
window.editProyecto=editProyecto;
window.delCert=delCert;
// finanzas
window.onCambioEmpresaFin=onCambioEmpresaFin;
window.loadPeriodosEERR=loadPeriodosEERR;
window.loadPeriodosBalance=loadPeriodosBalance;
window.loadPeriodosKPI=loadPeriodosKPI;
window.renderEERR=renderEERR;
window.renderBalance=renderBalance;
window.renderKPIs=renderKPIs;
window.guardarPeriodo=guardarPeriodo;
// modales
window.openModal=openModal;
window.closeModal=closeModal;
window.saveModal=saveModal;
// export
window.openExport=openExport;
window.closeExport=closeExport;
window.selFmt=selFmt;
window.doExport=doExport;
// utils
window.toggleSidebar=toggleSidebar;
window.closeSidebar=closeSidebar;
window.updatePillClass=updatePillClass;
window.resetPills=resetPills;
// auth
window.doLogin=doLogin;
window.doLogout=doLogout;
// gcal
window.gcalEnviarTarea=gcalEnviarTarea;

checkSession();
