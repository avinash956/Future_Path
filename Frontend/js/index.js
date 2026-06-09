/* =========================
   CONFIG
========================= */

const API_URL = "http://localhost:5000/api/achievements";


/* =========================
   MENU
========================= */

function toggleMenu(){

document
.getElementById("dropdownMenu")
.classList
.toggle("active");

}

document.addEventListener("click", function(e){

let menu = document.getElementById("dropdownMenu");
let btn = document.querySelector(".menu-toggle");

if(
menu &&
btn &&
!menu.contains(e.target) &&
!btn.contains(e.target)
){
menu.classList.remove("active");
}

});


/* =========================
   CLOCK
========================= */

function startClock(){

function updateClock(){
const now = new Date();
document.getElementById("liveClock").innerHTML =
now.toLocaleTimeString();
}

updateClock();
setInterval(updateClock,1000);

}


/* =========================
   COURSE NAV
========================= */

function openCourse(type){
window.location.href = `courses.html?type=${type}`;
}


/* =========================
   INIT PAGE
========================= */

function initializeHomePage(){

startClock();

fixOldAnnouncements();
loadAnnouncements();
loadAchievements(); // ✅ MongoDB

const role = localStorage.getItem("role");

/* announcement admin */
if(role === "admin" || role === "management"){
document.getElementById("announcementAdminPanel").style.display = "block";
}

/* achievement admin */
if(role === "admin" || role === "management"){
document.getElementById("achievementAdminPanel").style.display = "block";
}

startRevealAnimation();

}


/* =====================================================
   ANNOUNCEMENTS
===================================================== */

function fixOldAnnouncements(){

let announcements =
JSON.parse(localStorage.getItem("announcements")) || [];

announcements = announcements.map(item => {
if(typeof item === "string"){
return {
text:item,
date:"Old Announcement",
isNew:false
};
}
return item;
});

localStorage.setItem("announcements", JSON.stringify(announcements));

}


/* =========================
   SAVE ANNOUNCEMENT
========================= */

function saveAnnouncement(){

const input = document.getElementById("announcementInput");
const text = input.value.trim();

if(!text) return;

let announcements =
JSON.parse(localStorage.getItem("announcements")) || [];

announcements = announcements.map(a => {
a.isNew = false;
return a;
});

announcements.unshift({
text:text,
date:new Date().toLocaleString(),
isNew:true
});

localStorage.setItem("announcements", JSON.stringify(announcements));

input.value = "";
loadAnnouncements();

}


/* =========================
   LOAD ANNOUNCEMENTS
========================= */

function loadAnnouncements(){

const container =
document.getElementById("announcementContainer");

let announcements =
JSON.parse(localStorage.getItem("announcements")) || [];

container.innerHTML = "";

if(announcements.length === 0){

container.innerHTML = `
<div class="announcement-card">
<i class="fa-solid fa-bullhorn"></i>
<p>No announcements available currently.</p>
</div>
`;
return;
}

announcements.forEach((item,index)=>{

const role = localStorage.getItem("role");

container.innerHTML += `
<div class="announcement-card reveal-card">

<i class="fa-solid fa-bullhorn"></i>

<div class="announcement-top">
<div class="announcement-date">${item.date}</div>
${item.isNew ? `<div class="new-badge">NEW</div>` : ""}
</div>

<p>${item.text}</p>

${
(role === "admin" || role === "management")
?
`<button class="delete-btn" onclick="deleteAnnouncement(${index})">Delete</button>`
: ""
}

</div>
`;
});

startRevealAnimation();

}


/* =========================
   DELETE ANNOUNCEMENT
========================= */

function deleteAnnouncement(index){

let announcements =
JSON.parse(localStorage.getItem("announcements")) || [];

announcements.splice(index,1);

localStorage.setItem("announcements", JSON.stringify(announcements));

loadAnnouncements();

}


/* =====================================================
   🏆 ACHIEVEMENTS (MONGODB)
===================================================== */

/* LOAD FROM BACKEND */

async function loadAchievements(){

const container =
document.getElementById("achievementContainer");

if(!container) return;

/* Loading State */

container.innerHTML = `

<div class="achievement-loading">

    <i class="fa-solid fa-spinner fa-spin"></i>

    <p>Loading achievements...</p>

</div>

`;

try{

const res = await fetch(API_URL);

if(!res.ok){
throw new Error("Failed to load achievements");
}

const data = await res.json();

container.innerHTML = "";

if(!data || data.length === 0){

container.innerHTML = `

<div class="achievement-placeholder">

    <div class="placeholder-icon">
        <i class="fa-solid fa-trophy"></i>
    </div>

    <h3>First Milestone Coming Soon</h3>

    <p>
        Future Path EduTech Institute has started its journey.
        Student achievements, competitive exam selections,
        certifications, projects, placements, and success
        stories will appear here soon.
    </p>

</div>

`;

startRevealAnimation();

return;
}

/* Random Premium Icons */

const icons = [
"fa-trophy",
"fa-medal",
"fa-award",
"fa-star",
"fa-graduation-cap"
];

data.forEach(item => {

const role =
localStorage.getItem("role");

const icon =
icons[Math.floor(Math.random() * icons.length)];

container.innerHTML += `

<div class="achievement-card reveal-card">

    <div class="achievement-glow"></div>

    <div class="achievement-icon">

        <i class="fa-solid ${icon}"></i>

    </div>

    <h3>${item.title || "Achievement"}</h3>

    <p>${item.desc || ""}</p>

    ${
    (role === "admin" || role === "management")
    ?
    `
    <button
        class="achievement-delete-btn"
        onclick="deleteAchievement('${item._id}')">

        <i class="fa-solid fa-trash"></i>
        Delete

    </button>
    `
    :
    ""
    }

</div>

`;

});

startRevealAnimation();

}catch(err){

console.error(
"Achievement load error:",
err
);

container.innerHTML = `

<div class="achievement-placeholder">

    <div class="placeholder-icon">
        <i class="fa-solid fa-triangle-exclamation"></i>
    </div>

    <h3>Unable to Load Achievements</h3>

    <p>
        Something went wrong while loading data.
        Please try again later.
    </p>

</div>

`;

startRevealAnimation();

}

}


/* =========================
   ADD ACHIEVEMENT (ADMIN)
========================= */

async function addAchievement(){

const role =
localStorage.getItem("role");

if(
role !== "admin" &&
role !== "management"
){
alert("Not authorized");
return;
}

const title =
prompt(
"Enter Achievement Title:"
)?.trim();

if(!title) return;

const desc =
prompt(
"Enter Achievement Description:"
)?.trim();

if(!desc) return;

try{

const res = await fetch(
API_URL,
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
title,
desc
})
}
);

if(!res.ok){
throw new Error(
"Failed to save achievement"
);
}

loadAchievements();

}catch(err){

console.error(err);

alert(
"Unable to save achievement."
);

}

}


/* =========================
   DELETE ACHIEVEMENT
========================= */

async function deleteAchievement(id){

const confirmDelete =
confirm(
"Delete this achievement permanently?"
);

if(!confirmDelete){
return;
}

try{

const res = await fetch(
`${API_URL}/${id}`,
{
method:"DELETE"
}
);

if(!res.ok){
throw new Error(
"Delete failed"
);
}

loadAchievements();

}catch(err){

console.error(err);

alert(
"Unable to delete achievement."
);

}

}


/* =========================
   SCROLL REVEAL ANIMATION
========================= */

function startRevealAnimation(){

const observer =
new IntersectionObserver(

(entries)=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

entry.target.style.opacity = "1";

entry.target.style.transform =
"translateY(0)";

}

});

},

{
threshold:0.15
}

);

document.querySelectorAll(

".announcement-card,\
.course-card,\
.contact-card,\
.achievement-card,\
.achievement-placeholder"

).forEach(el=>{

el.style.opacity = "0";

el.style.transform =
"translateY(40px)";

el.style.transition =
"all 0.8s ease";

observer.observe(el);

});

}