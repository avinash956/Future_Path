// ======================================
// ABOUT DATA
// ======================================

let aboutData = [];

// ======================================
// CHECK ADMIN MODE
// ======================================

const isEdit =
new URLSearchParams(
window.location.search
).get("edit");


// ======================================
// LOAD DATA FROM BACKEND
// ======================================

async function fetchAboutData(){

try{

const response = await fetch(window.API_BASE + "/about/"
);

aboutData =
await response.json();

if(isEdit === "1"){

document.getElementById(
"adminPanel"
).style.display = "block";

loadEditor();

}
else{

renderPublicPage();

}

}
catch(error){

console.log(
"About Fetch Error:",
error
);

}

}


// ======================================
// LOAD EDITOR
// ======================================

function loadEditor(){

const editor =
document.getElementById(
"editor"
);

if(!editor) return;

editor.innerHTML = "";

aboutData.forEach((item, i) => {

editor.innerHTML += `

<div style="
border:1px solid #ccc;
margin:10px;
padding:10px;
">

<input
value="${item.title}"
onchange="
update(
${i},
'title',
this.value
)
">

<textarea
onchange="
update(
${i},
'desc',
this.value
)
">${item.desc}</textarea>

<input
value="${item.icon}"
onchange="
update(
${i},
'icon',
this.value
)
">

<button onclick="
removeCard(${i})
">
Delete
</button>

</div>

`;

});

}


// ======================================
// UPDATE DATA
// ======================================

function update(i, key, value){

aboutData[i][key] = value;

}


// ======================================
// ADD CARD
// ======================================

function addCard(){

aboutData.push({

title: "New Section",

desc: "Description here",

icon: "fa-solid fa-star"

});

loadEditor();

}


// ======================================
// REMOVE CARD
// ======================================

function removeCard(i){

aboutData.splice(i, 1);

loadEditor();

}


// ======================================
// SAVE TO MONGODB
// ======================================

async function saveData(){

try{

const response = await fetch(window.API_BASE + "/about/save",
{

method:"POST",

headers:{
"Content-Type":
"application/json"
},

body: JSON.stringify(
aboutData
)

}

);

const result =
await response.json();

alert(result.message);

location.reload();

}
catch(error){

console.log(
"Save Error:",
error
);

alert("Save Failed");

}

}


// ======================================
// PUBLIC RENDER
// ======================================

function renderPublicPage(){

const container =
document.getElementById(
"aboutContainer"
);

if(!container) return;

container.innerHTML =

aboutData.map(i => `

<div class="about-card">

<i class="${i.icon}"></i>

<h3>${i.title}</h3>

<p>${i.desc}</p>

</div>

`).join("");

}


// ======================================
// START
// ======================================

window.addEventListener(
"DOMContentLoaded",

fetchAboutData
);