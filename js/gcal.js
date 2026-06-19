import {STATE} from './state.js';
import {db} from './db.js';
import {empNombre} from './utils.js';

const GCAL_CLIENT_ID='210892137089-5dbi1s6njrlaoed8pkjksrgu9shrli5j.apps.googleusercontent.com';
const GCAL_SCOPE='https://www.googleapis.com/auth/calendar.events';
let gcalToken=null;

export function gcalGetToken(callback){
  if(gcalToken){callback();return;}
  if(typeof google==="undefined"||!google.accounts||!google.accounts.oauth2){
    alert("La libreria de Google no esta disponible. Recarga la pagina e intenta de nuevo.");return;
  }
  const client=google.accounts.oauth2.initTokenClient({
    client_id:GCAL_CLIENT_ID,
    scope:GCAL_SCOPE,
    hint:'rbariandaran@gmail.com',
    callback:(resp)=>{
      if(resp.error){alert("Error al conectar con Google Calendar: "+resp.error);return;}
      gcalToken=resp.access_token;
      callback();
    }
  });
  client.requestAccessToken();
}

export async function gcalEnviarTarea(tareaId){
  const t=STATE.tareas.find(x=>x.id===tareaId);
  if(!t){alert('Tarea no encontrada.');return;}
  if(!t.fecha_fin){alert('Esta tarea no tiene fecha límite. Agregá una fecha límite para enviarla al calendario.');return;}
  const btn=document.getElementById('gcal-btn-'+tareaId);
  if(btn){btn.classList.add('gcal-loading');btn.disabled=true;}
  gcalGetToken(async()=>{
    try{
      const empresa=empNombre(t.empresa_id);
      const fechaISO=t.fecha_fin;
      const evento={
        summary:`[${empresa}] ${t.descripcion||'Tarea sin descripción'}`,
        description:`Empresa: ${empresa}\nTarea: ${t.descripcion||''}\nEstado: ${t.estado||'pendiente'}`,
        start:{dateTime:fechaISO+'T09:00:00',timeZone:'America/Argentina/Buenos_Aires'},
        end:{dateTime:fechaISO+'T10:00:00',timeZone:'America/Argentina/Buenos_Aires'},
        reminders:{useDefault:false,overrides:[{method:'popup',minutes:1440}]}
      };
      const resp=await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events',{
        method:'POST',
        headers:{'Authorization':'Bearer '+gcalToken,'Content-Type':'application/json'},
        body:JSON.stringify(evento)
      });
      if(!resp.ok){const err=await resp.json();throw new Error(err.error?.message||'Error Google Calendar');}
      await db.patch('tareas',tareaId,{calendario_google:true});
      STATE.tareas=STATE.tareas.map(x=>x.id===tareaId?{...x,calendario_google:true}:x);
      if(btn){btn.classList.remove('gcal-loading');btn.classList.add('gcal-enviado');btn.disabled=false;btn.title='Ya en Google Calendar';btn.innerHTML='<i class="ti ti-calendar-check"></i>';}
    }catch(e){
      if(btn){btn.classList.remove('gcal-loading');btn.disabled=false;}
      alert('Error al crear evento: '+e.message);
    }
  });
}
