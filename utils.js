async function sha1Hex(input){
  const data=new TextEncoder().encode(input);
  const hash=await crypto.subtle.digest("SHA-1",data);
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("").toUpperCase();
}
function debounce(fn,wait=300){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),wait)};}
function scorePassword(pw){
  if(!pw)return 0;let s=0;
  if(pw.length>=12)s+=2; else if(pw.length>=8)s+=1;
  const v=[/[a-z]/,/[A-Z]/,/\d/,/[^A-Za-z0-9]/].map(r=>r.test(pw)).filter(Boolean).length;
  if(v>=3)s+=2; else if(v===2)s+=1;
  if(/password|qwerty|admin|welcome|iloveyou/i.test(pw))s=Math.max(0,s-2);
  return Math.max(0,Math.min(4,s));
}
function suggestImprovements(pw){
  const s=[];
  if(pw.length<12)s.push("Make it at least 12 characters.");
  if(!/[A-Z]/.test(pw))s.push("Add uppercase.");
  if(!/[a-z]/.test(pw))s.push("Add lowercase.");
  if(!/\d/.test(pw))s.push("Include numbers.");
  if(!/[^A-Za-z0-9]/.test(pw))s.push("Add special chars.");
  return s;
}
function generateStrongerVariant(base){
  if(!base||/password|qwerty|admin/i.test(base))return createRandomPass();
  return leetify(base)+randSep()+randYear()+randSym();
}
function leetify(s){return s.replace(/a/gi,"@").replace(/e/gi,"3").replace(/i/gi,"1").replace(/o/gi,"0").replace(/s/gi,"$");}
function randSep(){return["-","_",".",":","|"][Math.floor(Math.random()*5)];}
function randSym(){return["!","?","#","$","%","&","*"][Math.floor(Math.random()*7)];}
function randYear(){return(2000+Math.floor(Math.random()*26)).toString();}
function createRandomPass(){return"Rand"+randSep()+"Pass"+randYear()+randSym();}
window.pwUtils={sha1Hex,debounce,scorePassword,suggestImprovements,generateStrongerVariant,createRandomPass};