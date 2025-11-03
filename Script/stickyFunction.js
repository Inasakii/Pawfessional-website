// Sticky
window.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector("header");
    const logo = document.getElementById("logo");
    const downloadBtn = document.getElementById("downloadBtn");
    const homeLink = document.getElementById("homeLink");
    const downloadSection = document.getElementById("downloadSection");
    // Sticky header effect
    window.addEventListener("scroll", function () {
        if (window.scrollY > 50) {
            header.classList.add("sticky");
            logo.src = "../Assets/Images/WhitePaw.png";
        } else {
            header.classList.remove("sticky");
            logo.src = "../Assets/Images/PawLogo.png";
        }
});
// Smooth scroll to download section
if (downloadBtn && downloadSection) {
    downloadBtn.addEventListener("click", function (event) {
        event.preventDefault();
        const headerHeight = header.offsetHeight;
        const targetPosition = downloadSection.offsetTop - headerHeight;
        window.scrollTo({
            top: targetPosition,
            behavior: "smooth"
        });
    });
}
// Smooth scroll to top for Home button
if (homeLink) {
    homeLink.addEventListener("click", function (event) {
        event.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
    }
});
const scrollBtn = document.querySelector('.floating-btn');
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}
window.addEventListener('scroll', function () {
    if (window.pageYOffset > 300) { // show only after scrolling down 300px
        scrollBtn.style.display = 'flex';
    } else {
        scrollBtn.style.display = 'none';
    }
});
scrollBtn.addEventListener('click', scrollToTop);
scrollBtn.style.display = 'none';