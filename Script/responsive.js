document.addEventListener('DOMContentLoaded', () => {
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const mobileNavMenu = document.getElementById('mobile-nav-menu');
    const downloadLinkMobile = mobileNavMenu.querySelector('.mobile-download-link');

    hamburgerMenu.addEventListener('click', () => {
        mobileNavMenu.classList.toggle('nav-active');
        // Toggle icon for accessibility
        const icon = hamburgerMenu.querySelector('i');
        if (mobileNavMenu.classList.contains('nav-active')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
            hamburgerMenu.setAttribute('aria-expanded', 'true');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
            hamburgerMenu.setAttribute('aria-expanded', 'false');
        }
    });

    // Smooth scroll for mobile download link
    if (downloadLinkMobile) {
        downloadLinkMobile.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = downloadLinkMobile.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
                // Close the menu after clicking a link
                mobileNavMenu.classList.remove('nav-active');
                hamburgerMenu.querySelector('i').classList.remove('fa-times');
                hamburgerMenu.querySelector('i').classList.add('fa-bars');
                hamburgerMenu.setAttribute('aria-expanded', 'false');
            }
        });
    }


    // Close mobile menu when a navigation link is clicked (excluding download link, which has its own handler)
    mobileNavMenu.querySelectorAll('.nav-list li a:not(.mobile-download-link)').forEach(link => {
        link.addEventListener('click', () => {
            mobileNavMenu.classList.remove('nav-active');
            hamburgerMenu.querySelector('i').classList.remove('fa-times');
            hamburgerMenu.querySelector('i').classList.add('fa-bars');
            hamburgerMenu.setAttribute('aria-expanded', 'false');
        });
    });
});