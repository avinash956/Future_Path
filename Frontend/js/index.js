/* MENU */

function toggleMenu(){

document
.getElementById("dropdownMenu")
.classList
.toggle("active");

}

document.addEventListener("click", function(e){

let menu =
document.getElementById("dropdownMenu");

let btn =
document.querySelector(".menu-toggle");

if(
menu &&
btn &&
!menu.contains(e.target) &&
!btn.contains(e.target)
){

menu.classList.remove("active");

}

});

/* CLOCK */

function startClock(){

function updateClock(){

const now = new Date();

document
.getElementById("liveClock")
.innerHTML =
now.toLocaleTimeString();

}

updateClock();

setInterval(updateClock,1000);

}

/* OPEN COURSE PAGE */

function openCourse(type){

window.location.href =
`courses.html?type=${type}`;

}

/* INITIALIZE */

function initializeHomePage(){

startClock();

fixOldAnnouncements();

loadAnnouncements();

const role =
localStorage.getItem("role");

if(
role === "admin" ||
role === "management"
){

document
.getElementById("announcementAdminPanel")
.style.display = "block";

}

/* START SCROLL ANIMATION */

startRevealAnimation();

}

/* =====================================================
FIX OLD ANNOUNCEMENTS
===================================================== */

function fixOldAnnouncements(){

let announcements =
JSON.parse(
localStorage.getItem("announcements")
) || [];

/* convert old string announcements */

announcements = announcements.map((item,index)=>{

if(typeof item === "string"){

return{

text:item,
date:"Old Announcement",
isNew:false

};

}

return item;

});

localStorage.setItem(
"announcements",
JSON.stringify(announcements)
);

}

/* =====================================================
SAVE ANNOUNCEMENT
===================================================== */

function saveAnnouncement(){

const input =
document.getElementById("announcementInput");

const text =
input.value.trim();

if(!text) return;

let announcements =
JSON.parse(
localStorage.getItem("announcements")
) || [];

/* remove NEW from old items */

announcements = announcements.map((item)=>{

item.isNew = false;

return item;

});

/* add latest announcement */

const newAnnouncement = {

text:text,

date:new Date().toLocaleString(),

isNew:true

};

announcements.unshift(newAnnouncement);

localStorage.setItem(
"announcements",
JSON.stringify(announcements)
);

input.value = "";

loadAnnouncements();

}

/* =====================================================
LOAD ANNOUNCEMENTS
===================================================== */

function loadAnnouncements(){

const container =
document.getElementById("announcementContainer");

const announcements =
JSON.parse(
localStorage.getItem("announcements")
) || [];

container.innerHTML = "";

if(announcements.length === 0){

container.innerHTML = `

<div class="announcement-card">

<i class="fa-solid fa-bullhorn"></i>

<p>
No announcements available currently.
</p>

</div>

`;

return;

}

announcements.forEach((item,index)=>{

const role =
localStorage.getItem("role");

container.innerHTML += `

<div class="announcement-card reveal-card">

<i class="fa-solid fa-bullhorn"></i>

<div class="announcement-top">

<div class="announcement-date">

${item.date}

</div>

${
item.isNew

?

`<div class="new-badge">
NEW
</div>`

:

""
}

</div>

<p>

${item.text}

</p>

${
(role === "admin" || role === "management")

?

`<button class="delete-btn"
onclick="deleteAnnouncement(${index})">

Delete

</button>`

:

""
}

</div>

`;

});

/* restart animation */

startRevealAnimation();

}

/* =====================================================
DELETE ANNOUNCEMENT
===================================================== */

function deleteAnnouncement(index){

let announcements =
JSON.parse(
localStorage.getItem("announcements")
) || [];

announcements.splice(index,1);

localStorage.setItem(
"announcements",
JSON.stringify(announcements)
);

loadAnnouncements();

}

/* =====================================================
SCROLL REVEAL ANIMATION
===================================================== */

function startRevealAnimation(){

const observer = new IntersectionObserver((entries)=>{

entries.forEach((entry)=>{

if(entry.isIntersecting){

entry.target.style.opacity = "1";

entry.target.style.transform =
"translateY(0)";

}

});

},{
threshold:0.15
});

document.querySelectorAll(
".announcement-card,.course-card,.contact-card,.stat-card"
).forEach((el)=>{

el.style.opacity = "0";

el.style.transform =
"translateY(50px)";

el.style.transition =
"0.8s ease";

observer.observe(el);

});

}