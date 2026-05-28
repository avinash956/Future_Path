document.getElementById(
"registerForm"
).addEventListener(
"submit",
async function(e){

e.preventDefault();

const userData = {

name:
document.getElementById(
"name"
).value,

mobile:
document.getElementById(
"mobile"
).value,

email:
document.getElementById(
"email"
).value,

role:
document.getElementById(
"role"
).value,

password:
document.getElementById(
"password"
).value

};

const response =
await fetch("http://localhost:5000/api/register",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(userData)
}
);

const data =
await response.json();

document.getElementById(
"registerMessage"
).innerHTML =
data.message;

});