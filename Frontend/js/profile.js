const API_BASE = window.BASE_URL;

/* =========================================
IMAGE PREVIEW
========================================= */

document
.getElementById(
'profilePic'
)
.addEventListener(
'change',
function(event){

const file =
event.target.files[0];

if(file){

const reader =
new FileReader();

reader.onload =
function(e){

document
.getElementById(
'imagePreview'
)
.innerHTML = `

<img
src="${e.target.result}"
class="preview-image">

`;

};

reader.readAsDataURL(file);

}

});

/* =========================================
REGISTER FORM
========================================= */

document
.getElementById(
'registerForm'
)
.addEventListener(
'submit',
async function(e){

e.preventDefault();

const responseMessage =
document.getElementById(
'responseMessage'
);

responseMessage.innerHTML =
"Submitting...";

/* =========================================
FORM DATA
========================================= */

const formData =new FormData();

formData.append('name',document.getElementById('name').value);

formData.append('mobile',document.getElementById('mobile').value);

formData.append('email',document.getElementById('email').value);


/* =========================================
IMAGE
========================================= */

const imageFile =
document.getElementById('profilePic').files[0];

if(imageFile){formData.append('profilePic',imageFile);}

try{

const response =await fetch(`${API_BASE}/register`,{
method:'POST',
body:formData
});

const data =
await response.json();

responseMessage.innerHTML =
data.message;

/* =========================================
RESET FORM
========================================= */

document.getElementById('registerForm').reset();

document.getElementById('imagePreview').innerHTML = `<i class="fa-solid fa-camera"></i>`;

}catch(error){

console.log(error);
responseMessage.innerHTML ="Registration Failed";

}

});