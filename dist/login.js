!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define("login",[],t):"object"==typeof exports?exports.login=t():e.login=t()}(this,(()=>(()=>{"use strict";const e=new class{authenticate(e="/",t="/login"){const o=localStorage.getItem("authToken");o?fetch("https://xrux-avyn-v7a8.n7d.xano.io/api:7eX5OyVa/auth/me",{method:"GET",headers:{Authorization:`Bearer ${o}`,"Content-Type":"application/json"}}).then((e=>e.json())).then((o=>{if("ERROR_CODE_UNAUTHORIZED"===o.code)localStorage.removeItem("authToken"),window.location.pathname!==t&&(window.location.href=t);else{if("/clients"===window.location.pathname)return;window.location.pathname!==e&&(window.location.href=e)}})).catch((e=>{console.error("Error:",e)})):window.location.pathname!==t&&(window.location.href=t)}logIn(e){fetch("https://xrux-avyn-v7a8.n7d.xano.io/api:7eX5OyVa/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}).then((e=>e.json())).then((e=>{if(e.authToken)localStorage.setItem("authToken",e.authToken),0===e.clients_length?window.location.href="/clients":window.location.href="/";else{const e=document.querySelector(".error-message"),t=document.querySelectorAll(".login-input");e.classList.remove("hidden"),t.forEach((e=>{e.classList.add("invalid")}))}})).catch((e=>{console.error("Error:",e)}))}logOut(){localStorage.removeItem("authToken"),window.location.href="/login"}toggleUserPassVisibility(e,t,o){"password"===e.type?(e.type="text",t.style.display="block",o.style.display="none"):(e.type="password",t.style.display="none",o.style.display="block")}},t=document.getElementById("login-btn");let o=document.querySelector(".password-login-input");const n=document.getElementById("email");let i=document.querySelector(".password-eye-icon.show"),a=document.querySelector(".password-eye-icon.hide");const s=document.querySelector(".error-message"),l=document.querySelectorAll(".login-input");function c(){const e=n.value,i=o.value;(function(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)})(e)&&i.length>0?t.classList.add("active"):t.classList.remove("active")}return e.authenticate(),t.addEventListener("click",(function(t){t.preventDefault();const o={email:document.getElementById("email").value,password:document.getElementById("Password").value};e.logIn(o)})),i.addEventListener("click",(()=>{e.toggleUserPassVisibility(o,i,a)})),a.addEventListener("click",(()=>{e.toggleUserPassVisibility(o,i,a)})),n.addEventListener("input",(()=>{c(),s.classList.add("hidden"),l.forEach((e=>{e.classList.remove("invalid")}))})),o.addEventListener("input",(()=>{c(),s.classList.add("hidden"),l.forEach((e=>{e.classList.remove("invalid")}))})),{}})()));