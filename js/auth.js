import {SB_URL, SB_ANON, SESSION_KEY} from './config.js';

export const authState = {token: null};

export async function checkSession(){
  const token=sessionStorage.getItem(SESSION_KEY);
  if(!token)return;
  const r=await fetch(`${SB_URL}/auth/v1/user`,{headers:{'apikey':SB_ANON,'Authorization':'Bearer '+token}});
  if(r.ok){authState.token=token;document.getElementById('login-screen').classList.add('hidden');window.load();}
  else sessionStorage.removeItem(SESSION_KEY);
}

export async function doLogin(){
  const email=document.getElementById('login-email').value.trim();
  const pass=document.getElementById('login-pass').value;
  const errEl=document.getElementById('login-err');
  const btn=document.querySelector('.login-btn');
  errEl.textContent='';
  if(btn){btn.disabled=true;btn.textContent='ENTRANDO…';}
  try{
    const r=await fetch(`${SB_URL}/auth/v1/token?grant_type=password`,{
      method:'POST',
      headers:{'apikey':SB_ANON,'Content-Type':'application/json'},
      body:JSON.stringify({email,password:pass})
    });
    const d=await r.json();
    if(!r.ok)throw new Error(d.error_description||d.msg||'Credenciales incorrectas');
    authState.token=d.access_token;
    sessionStorage.setItem(SESSION_KEY,authState.token);
    document.getElementById('login-screen').classList.add('hidden');
    window.load();
  }catch(e){
    errEl.textContent=e.message;
    document.getElementById('login-pass').value='';
    document.getElementById('login-pass').focus();
    if(btn){btn.disabled=false;btn.textContent='INGRESAR';}
  }
}

export async function doLogout(){
  if(!confirm('¿Cerrar sesión?'))return;
  if(authState.token)await fetch(`${SB_URL}/auth/v1/logout`,{method:'POST',headers:{'apikey':SB_ANON,'Authorization':'Bearer '+authState.token}}).catch(()=>{});
  authState.token=null;
  sessionStorage.removeItem(SESSION_KEY);
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('login-email').value='';
  document.getElementById('login-pass').value='';
}
