!function(e,o){"object"==typeof exports&&"object"==typeof module?module.exports=o():"function"==typeof define&&define.amd?define("navbar",[],o):"object"==typeof exports?exports.navbar=o():e.navbar=o()}(this,(()=>(document.querySelector(".logout-btn").addEventListener("click",(function(e){e.preventDefault(),localStorage.removeItem("authToken"),window.location.href="/login"})),{})));