!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define("clients",[],t):"object"==typeof exports?exports.clients=t():e.clients=t()}(this,(()=>(()=>{let e=1,t=5,n=0,a="";async function o(e,t,n,a,o){const c=document.querySelector("#clients-table tbody"),i=document.querySelector(".clients-table__range");c.style="opacity: 40%;",document.querySelectorAll(".pagination-arrow").forEach((e=>{e.classList.add("disabled")}));const r=localStorage.getItem("authToken");let l=`https://xrux-avyn-v7a8.n7d.xano.io/api:4o1s7k_j/clients?page=${t}&per_page=${n}&offset=${a}`;o&&(l+=`&search=${encodeURIComponent(o)}`);try{const a=await fetch(l,{method:"GET",headers:{Authorization:`Bearer ${r}`,"Content-Type":"application/json"}});if(!a.ok)throw new Error(`HTTP error! status: ${a.status}`);const o=await a.json();e&&(document.querySelectorAll(".clients-number").forEach((e=>{e.textContent=o.clients.itemsTotal})),document.querySelector(".clients-table__loader").remove()),null===o.clients.nextPage?document.querySelector(".pagination-arrow.right").classList.add("disabled"):document.querySelector(".pagination-arrow.right").classList.remove("disabled"),null===o.clients.prevPage?document.querySelector(".pagination-arrow.left").classList.add("disabled"):document.querySelector(".pagination-arrow.left").classList.remove("disabled");let s="";0===o.clients.items.length?s='\n<tr>\n<td colspan="8" class="no-data-message">No data</td>\n</tr>':o.clients.items.forEach((e=>{s+=`\n<tr>\n<td class="dark">${e.full_name}</td>\n<td class="light">${e.company_name}</td>\n<td><a href="${e.website}" target="_blank" class="website-link">${e.website}</a></td>\n<td><a href="mailto:${e.email}" class="email-link">${e.email}</a></td>\n<td class="light">${e.phone_number}</td>\n<td class="light">${new Date(e.created_at).toLocaleDateString()}</td>\n<td><img class="edit-client__btn" src="https://cdn.prod.website-files.com/66eab8d4420be36698ed221a/6706654e169e0a1ab9a12e73_pencil-icon.svg"></td>\n</tr>`})),c.innerHTML=s,c.style="opacity: 100%;",document.querySelector(".clients-section").style="opacity: 1;";const d=(t-1)*n+1,u=Math.min(d+o.clients.items.length-1,o.clients.itemsTotal);i.textContent=`${d}-${u}`}catch(e){console.error("Error fetching clients:",e)}}return o(!0,e,t,n,a),document.querySelector(".pagination-arrow.right").addEventListener("click",(function(){e+=1,n=0,o(!1,e,t,n,a)})),document.querySelector(".pagination-arrow.left").addEventListener("click",(function(){e-=1,n=0,o(!1,e,t,n,a)})),document.querySelector(".clients-perpage__input").addEventListener("change",(function(n){t=parseInt(n.target.value),e=1,o(!1,e,t,0,a)})),document.querySelector("#client-search").addEventListener("input",(function(n){a=n.target.value,e=1,o(!1,e,t,0,a)})),{}})()));