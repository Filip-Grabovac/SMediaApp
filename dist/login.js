!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define("login",[],t):"object"==typeof exports?exports.login=t():e.login=t()}(this,(()=>(()=>{let e=document.querySelector(".password-login-input");const t=document.getElementById("email"),o=document.querySelector(".main-button");let n=document.querySelector(".password-eye-icon.show"),s=document.querySelector(".password-eye-icon.hide");const a=document.querySelector(".error-message"),i=document.querySelectorAll(".login-input");function c(){"password"===e.type?(e.type="text",n.style.display="block",s.style.display="none"):(e.type="password",n.style.display="none",s.style.display="block")}function l(){const n=t.value,s=e.value;(function(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)})(n)&&s.length>0?o.classList.add("active"):o.classList.remove("active")}return n.addEventListener("click",c),s.addEventListener("click",c),t.addEventListener("input",(()=>{l(),a.classList.add("hidden"),i.forEach((e=>{e.classList.remove("invalid")}))})),e.addEventListener("input",(()=>{l(),a.classList.add("hidden"),i.forEach((e=>{e.classList.remove("invalid")}))})),document.getElementById("login-btn").addEventListener("click",(function(e){e.preventDefault();const t={email:document.getElementById("email").value,password:document.getElementById("Password").value};fetch("https://xrux-avyn-v7a8.n7d.xano.io/api:7eX5OyVa/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)}).then((e=>e.json())).then((e=>{if(e.authToken)localStorage.setItem("authToken",e.authToken),0===e.clients_length?window.location.href="/clients":window.location.href="/";else{const e=document.querySelector(".error-message"),t=document.querySelectorAll(".login-input");e.classList.remove("hidden"),t.forEach((e=>{e.classList.add("invalid")}))}})).catch((e=>{console.error("Error:",e)}))})),function(){const e=localStorage.getItem("authToken");e&&fetch("https://xrux-avyn-v7a8.n7d.xano.io/api:7eX5OyVa/auth/me",{method:"GET",headers:{Authorization:`Bearer ${e}`,"Content-Type":"application/json"}}).then((e=>e.json())).then((e=>{"ERROR_CODE_UNAUTHORIZED"!==e.code?window.location.href="/":localStorage.removeItem("authToken")})).catch((e=>{console.error("Error:",e)}))}(),{}})()));