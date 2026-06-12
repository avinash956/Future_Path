const API_BASE =window.BASE_URL ||"http://127.0.0.1:5000";

const token = localStorage.getItem("token");

/* =========================================
IMAGE PREVIEW
========================================= */

document
.getElementById("profilePic")
.addEventListener(
"change",
function(event){

const file = event.target.files[0];

if(file){

const reader = new FileReader();

reader.onload = function(e){

document.getElementById(
"imagePreview"
).innerHTML = `
<img
src="${e.target.result}"
class="preview-image">
`;

};

reader.readAsDataURL(file);

}

});


/* =========================================
LOAD PROFILE
========================================= */

async function loadProfile(){

try{

const response = await fetch(
`${API_BASE}/api/profile/get-profile`,
{
headers:{
Authorization:`Bearer ${token}`
}
}
);

const data = await response.json();

if(!data.success){

console.log(data.message);
return;

}

document.getElementById(
"name"
).value = data.name || "";

document.getElementById(
"mobile"
).value = data.mobile || "";

document.getElementById(
"email"
).value = data.email || "";

if(data.image){

document.getElementById(
"imagePreview"
).innerHTML = `
<img
src="${API_BASE}/uploads/${data.image}"
class="preview-image">
`;

}

}catch(error){

console.log(
"Load Profile Error:",
error
);

}

}


/* =========================================
UPDATE PROFILE
========================================= */

document
.getElementById(
"registerForm"
)
.addEventListener(
"submit",
async function(e){

e.preventDefault();

const responseMessage =
document.getElementById(
"responseMessage"
);

responseMessage.innerHTML =
"Updating Profile...";

const formData =
new FormData();

formData.append(
"name",
document.getElementById(
"name"
).value
);

formData.append(
"mobile",
document.getElementById(
"mobile"
).value
);

formData.append(
"email",
document.getElementById(
"email"
).value
);

const imageFile =
document.getElementById(
"profilePic"
).files[0];

if(imageFile){

formData.append(
"profilePic",
imageFile
);

}

try{

const response =
await fetch(
`${API_BASE}/api/profile/update-profile`,
{
method:"PUT",
headers:{
Authorization:
`Bearer ${token}`
},
body:formData
}
);

const data =
await response.json();

responseMessage.innerHTML =
data.message;

if(data.success){

loadProfile();

}

}catch(error){

console.log(error);

responseMessage.innerHTML =
"Profile Update Failed";

}

});


/* =========================================
INIT
========================================= */

document.addEventListener(
"DOMContentLoaded",
function(){

if(!token){

window.location.href =
"login.html";

return;

}

loadProfile();

}
);