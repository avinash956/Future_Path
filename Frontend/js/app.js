// ================================
// CONTACT FORM GOOGLE SHEET
// ================================

const contactForm =
document.getElementById(
"contactForm"
);

if(contactForm){

contactForm.addEventListener(

"submit",

async function(e){

e.preventDefault();

const responseMessage =
document.getElementById(
"responseMessage"
);

// ====================================
// FORM DATA
// ====================================

const data = {

name:
document.getElementById("name").value,

email:
document.getElementById("email").value,

mobile:
document.getElementById("mobile").value,

message:
document.getElementById("message").value

};

// ====================================
// GOOGLE APPS SCRIPT URL
// ====================================

const scriptURL ="https://script.google.com/macros/s/AKfycbydGzYo6g6UFu5Glki2hEsbbsoWyIRl3yGkEvyApT0b2I2mBRIEPu-PfoYCf4Fv_DbnYg/exec";

// ====================================
// SEND DATA
// ====================================

try{

// ====================================
// 1. SEND TO GOOGLE SHEET
// ====================================

await fetch(scriptURL,

{

method:"POST",

body:JSON.stringify(data),

headers:{
"Content-Type":
"application/json"
}

}

);

// ====================================
// 2. SEND TO MONGODB BACKEND
// ====================================
const API_BASE = window.BASE_URL;
await fetch(API_BASE + "/contact/send",
{

method:"POST",

headers:{
"Content-Type":
"application/json"
},

body:JSON.stringify(data)

}

);

// ====================================
// SUCCESS
// ====================================

responseMessage.style.color =
"green";

responseMessage.innerText =
"Message Sent Successfully!";

contactForm.reset();

}
catch(error){

responseMessage.style.color =
"red";

responseMessage.innerText =
"Network Error!";

console.log(error);

}

});

}