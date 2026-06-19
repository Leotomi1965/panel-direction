import {SB_URL, SB_ANON} from './config.js';
import {authState} from './auth.js';

export function getH(){
  return{'apikey':SB_ANON,'Authorization':'Bearer '+(authState.token||SB_ANON),'Content-Type':'application/json','Prefer':'return=representation'};
}

export const db={
  async get(t,q=''){const r=await fetch(`${SB_URL}/rest/v1/${t}?${q}`,{headers:getH()});const d=await r.json();if(!r.ok)throw new Error(d.message||d.error||`Error ${r.status}`);return d;},
  async post(t,b){const r=await fetch(`${SB_URL}/rest/v1/${t}`,{method:'POST',headers:getH(),body:JSON.stringify(b)});const d=await r.json();if(!r.ok)throw new Error(d.message||d.error||`Error ${r.status}`);return d;},
  async patch(t,id,b){const r=await fetch(`${SB_URL}/rest/v1/${t}?id=eq.${id}`,{method:'PATCH',headers:getH(),body:JSON.stringify(b)});const d=await r.json();if(!r.ok)throw new Error(d.message||d.error||`Error ${r.status}`);return d;},
  async del(t,id){const r=await fetch(`${SB_URL}/rest/v1/${t}?id=eq.${id}`,{method:'DELETE',headers:getH()});if(!r.ok){const d=await r.json().catch(()=>({}));throw new Error(d.message||d.error||`Error ${r.status}`);}}
};
