document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');

    function showSection(sectionId) {
        console.log('Showing section:', sectionId); // Debug line to check section ID

        // Hide all sections first
        sections.forEach(section => {
            console.log('Section ID:', section.id); // Debug line to check available sections
            section.style.display = 'none';
            section.classList.remove('active');
        });

        // Remove active class from all links
        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        // Show selected section and activate link
        const targetSection = document.getElementById(sectionId);
        const targetLink = document.querySelector(`a[href="#${sectionId}"]`);
        
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.classList.add('active');
            console.log('Section found and displayed:', sectionId); // Debug line
        } else {
            console.log('Section not found:', sectionId); // Debug line
        }
        
        if (targetLink) {
            targetLink.classList.add('active');
        }
    }

    // Add click handlers to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            console.log('Clicked link for section:', targetId); // Debug line
            showSection(targetId);
        });
    });

    // Show dashboard by default
    showSection('dashboard');
});