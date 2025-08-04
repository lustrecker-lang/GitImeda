document.addEventListener('DOMContentLoaded', function () {

    // --- 1. On-Scroll Blur Effect for Desktop Header ---
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 10) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- 2. Full-Screen Mobile Navigation ---
    const hamburger = document.querySelector('.hamburger');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    const closeBtn = document.querySelector('.close-btn');
    const mobileNavLinks = document.querySelectorAll('#mobile-nav-overlay .mobile-nav-links a');
    const mobileDropdownToggles = document.querySelectorAll('#mobile-nav-overlay .has-dropdown-mobile > a');

    // Function to open mobile nav
    const openMobileNav = () => {
        mobileNavOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    };

    // Function to close mobile nav
    const closeMobileNav = () => {
        mobileNavOverlay.classList.remove('active');
        document.body.style.overflow = '';
    };
    
    hamburger.addEventListener('click', openMobileNav);
    closeBtn.addEventListener('click', closeMobileNav);

    // Close mobile nav if a link is clicked (for single-page type links)
    mobileNavLinks.forEach(link => {
        if (!link.parentElement.classList.contains('has-dropdown-mobile')) {
            link.addEventListener('click', () => {
                mobileNavOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
    });

    // Mobile dropdown toggle
    mobileDropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (event) => {
            event.preventDefault(); // Prevent navigation for the main dropdown link
            const parentLi = toggle.parentElement;
            parentLi.classList.toggle('open');
        });
    });

    // --- 3. Desktop Dropdown Menu Click Handler ---
    const desktopDropdownToggles = document.querySelectorAll('.nav-links-desktop .has-dropdown > a');
    const desktopDropdowns = document.querySelectorAll('.nav-links-desktop .dropdown');

    if (desktopDropdownToggles.length > 0 && desktopDropdowns.length > 0) {
        desktopDropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', function(event) {
                event.preventDefault();
                const currentDropdown = this.nextElementSibling;

                // Close other open dropdowns
                desktopDropdowns.forEach(dd => {
                    if (dd !== currentDropdown && dd.classList.contains('open')) {
                        dd.classList.remove('open');
                    }
                });

                // Toggle current dropdown
                if (currentDropdown.classList.contains('dropdown')) {
                    currentDropdown.classList.toggle('open');
                }
            });
        });

        // Close dropdowns when clicking outside
        window.addEventListener('click', function(event) {
            let clickedInsideDropdown = false;
            desktopDropdowns.forEach(dd => {
                if (dd.contains(event.target)) {
                    clickedInsideDropdown = true;
                }
            });
            desktopDropdownToggles.forEach(toggle => {
                if (toggle.contains(event.target)) {
                    clickedInsideDropdown = true;
                }
            });

            if (!clickedInsideDropdown) {
                desktopDropdowns.forEach(dd => {
                    if (dd.classList.contains('open')) {
                        dd.classList.remove('open');
                    }
                });
            }
        });
    }

    // Initialize Splide Carousel
    const splideElements = document.querySelectorAll('.carousel-section.splide');
    if (splideElements.length > 0 && typeof Splide !== 'undefined') {
        splideElements.forEach(element => {
            new Splide(element, {
                type: 'loop',
                perPage: 4, // Show 4 slides by default
                perMove: 1,
                gap: '20px', // Space between slides
                arrows: true, // Use the custom arrows we styled
                pagination: false, // No pagination dots
                breakpoints: {
                    1024: {
                        perPage: 3,
                    },
                    768: {
                        perPage: 2,
                    },
                    576: {
                        perPage: 1,
                        gap: '10px',
                    }
                }
            }).mount();
        });
    }

    // --- 4. Stats Counter Animation --- 
    const statsSection = document.querySelector('.stats-section');
    const statNumbers = document.querySelectorAll('.stat-number');

    if (statsSection && statNumbers.length > 0) {
        const animateStat = (element, target) => {
            const duration = 2000; // Animation duration in ms
            const frameDuration = 1000 / 60; // 60 frames per second
            const totalFrames = Math.round(duration / frameDuration);
            let frame = 0;
            const initialText = element.textContent;
            const suffix = initialText.replace(/[0-9]/g, ''); // Extracts non-numeric part like '+'
            const targetNumber = parseInt(initialText.replace(suffix, ''), 10);

            const counter = setInterval(() => {
                frame++;
                const progress = frame / totalFrames;
                const currentNumber = Math.round(targetNumber * progress);

                element.textContent = currentNumber + suffix;

                if (frame === totalFrames) {
                    clearInterval(counter);
                    element.textContent = initialText; // Ensure final text is exactly as in HTML
                }
            }, frameDuration);
        };

        const observer = new IntersectionObserver((entries, observerInstance) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    statNumbers.forEach(statNumEl => {
                        animateStat(statNumEl);
                    });
                    observerInstance.unobserve(entry.target); // Animate only once
                }
            });
        }, { threshold: 0.5 }); // Trigger when 50% of the section is visible

        observer.observe(statsSection);
    }

    // Methodology Section Image Slideshow
    const methodologyImageColumn = document.querySelector('.methodology-image-column');
    if (methodologyImageColumn) {
        const images = methodologyImageColumn.querySelectorAll('img');
        let currentIndex = 0;
        const slideInterval = 3000; // 3 seconds per image

        if (images.length > 1) {
            setInterval(() => {
                images[currentIndex].classList.remove('active');
                currentIndex = (currentIndex + 1) % images.length;
                images[currentIndex].classList.add('active');
            }, slideInterval);
        }
    }

    // --- Course List Accordion for Mobile (Original, to be adapted/removed for dynamic list) ---
    // const courseItems = document.querySelectorAll('.course-list-container .course-item');
    // ... (original accordion logic here)

    // --- Full-Screen Overlay for Programme Détail (Dynamic from CSV) --- //
    const courseListContainer = document.querySelector('.course-list-container');
    const programmeDetailOverlay = document.getElementById('programme-detail-overlay');
    const devisFormOverlay = document.getElementById('devis-form-overlay'); // Added for Devis Form
    let coursesData = []; // To store parsed CSV data

    // Function to parse CSV data (revised for better quote handling)
    function parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(header => header.trim());
        console.log('CSV Headers:', headers);
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const row = [];
            let currentField = '';
            let inQuotes = false;
            const line = lines[i];

            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if (char === '"') {
                    if (inQuotes && j + 1 < line.length && line[j+1] === '"') {
                        currentField += '"';
                        j++; 
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (char === ',' && !inQuotes) {
                    row.push(currentField.trim());
                    currentField = '';
                } else {
                    currentField += char;
                }
            }
            row.push(currentField.trim());

            if (row.length === headers.length) {
                const course = {};
                headers.forEach((header, index) => {
                    let value = row[index];
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.substring(1, value.length - 1).replace(/""/g, '"');
                    }
                    course[header] = value;
                });
                data.push(course);
            } else {
                console.warn(`Row ${i + 1} skipped: Mismatch in column count. Expected ${headers.length}, got ${row.length}. Line: "${lines[i]}"`);
            }
        }
        console.log('Parsed CSV Data (first 2 rows):', data.slice(0, 2));
        return data;
    }

    function displayCoursesInList(courses) {
        if (!courseListContainer) return;
        courseListContainer.innerHTML = ''; // Clear existing items

        courses.forEach(course => {
            const courseItem = document.createElement('div');
            courseItem.classList.add('course-item');

            let listObjectif = course['Objectif Pédagogique'] || 'Objectif non disponible';
            // Removed truncation: We will display the full "Objectif Pédagogique" in the list view.
            // if (listObjectif.length > 150) {
            //     listObjectif = listObjectif.substring(0, 150) + '...';
            // }

            courseItem.innerHTML = `
                <div class="course-header">
                    <h3 class="course-name">${course['Thème de la Formation'] || 'Titre non disponible'}</h3>
                    <i class='bx bx-chevron-down accordion-icon-mobile'></i>
                </div>
                <div class="course-content">
                    <p><strong>CourseID :</strong> <span class="course-id">${course.ID || 'N/A'}</span></p>
                    <p><strong>Durée :</strong> ${course['Temps Moyen de Formation'] || 'N/A'}</p>
                    <p><strong>Lieu :</strong> ${course.Geographie || 'N/A'}</p> <!-- Using Geographie for list view -->
                    <p><strong>Prix :</strong> ${course.Prix || 'N/A'}</p>
                    <p><strong>Objectif Pédagogique :</strong> ${listObjectif}</p>
                    <div class="course-cta-container">
                        <a href="#" class="hero-cta hero-cta-primary open-programme-detail">Programme détaillé</a>
                        <a href="#" class="hero-cta hero-cta-secondary open-devis-form">Demander un devis</a>
                    </div>
                </div>
            `;
            courseListContainer.appendChild(courseItem);
        });
        // Call to initialize listeners will be added after this function in the next step
    }

    // Placeholder for the function that will initialize event listeners for dynamic content
    function initializeDynamicEventListeners() {
        console.log("Initializing dynamic event listeners...");

        // Initialize accordion for dynamically added course items
        if (courseListContainer) { // Ensure courseListContainer exists
            const dynamicCourseItems = courseListContainer.querySelectorAll('.course-item');
            if (dynamicCourseItems.length > 0) {
                dynamicCourseItems.forEach(item => {
                    const header = item.querySelector('.course-header');
                    if (header) {
                        // To prevent adding multiple listeners if this function is ever called again by mistake,
                        // we could ideally check for an existing listener or use a flag.
                        // For now, the structure assumes this runs once after list creation.
                        header.addEventListener('click', () => {
                            const wasActive = item.classList.contains('active');
                            // Optional: Close other items when one is opened
                            /*
                            dynamicCourseItems.forEach(otherItem => {
                                if (otherItem !== item && otherItem.classList.contains('active')) {
                                    otherItem.classList.remove('active');
                                }
                            });
                            */
                            if (!wasActive) {
                                item.classList.add('active');
                            } else {
                                item.classList.remove('active'); // Allows toggling off
                            }
                        });
                    }
                });
            }
        }

        // Initialize overlay open buttons for dynamically added course items
        if (courseListContainer && programmeDetailOverlay) { // Check necessary elements exist
            const dynamicOpenButtons = courseListContainer.querySelectorAll('.open-programme-detail');
            const overlayCourseTitle = programmeDetailOverlay.querySelector('#overlay-course-title'); // Ensure this ID exists in overlay HTML
            const overlayDataFields = programmeDetailOverlay.querySelectorAll('[data-field]');

            if (dynamicOpenButtons.length > 0 && overlayCourseTitle && overlayDataFields.length > 0) {
                dynamicOpenButtons.forEach(button => {
                    button.addEventListener('click', (event) => {
                        event.preventDefault();
                        const courseItem = button.closest('.course-item');
                        if (!courseItem) return;
                        const courseIdSpan = courseItem.querySelector('.course-id');
                        if (!courseIdSpan) return;
                        const currentCourseId = courseIdSpan.textContent.trim();
                        
                        console.log('Attempting to find CourseID for programme detail overlay:', currentCourseId); 
                        const course = coursesData.find(c => c.ID === currentCourseId);
                        console.log('Found course object for programme detail overlay:', course);

                        if (course) {
                            overlayCourseTitle.textContent = course['Thème de la Formation'] || 'Titre non disponible';
                            overlayDataFields.forEach(span => {
                                const fieldName = span.getAttribute('data-field');
                                span.textContent = course[fieldName] || 'Information non disponible';
                            });
                            programmeDetailOverlay.classList.add('active');
                            document.body.style.overflow = 'hidden';
                        } else {
                            console.warn('Course data not found for ID in programme detail overlay population:', currentCourseId);
                            if (overlayCourseTitle) overlayCourseTitle.textContent = 'Détails non disponibles';
                            overlayDataFields.forEach(span => span.textContent = '-');
                            programmeDetailOverlay.classList.add('active');
                            document.body.style.overflow = 'hidden';
                        }
                    });
                });
            }
        } else {
            if (!courseListContainer) console.log("courseListContainer not found for programme detail overlay buttons init.");
            if (!programmeDetailOverlay) console.log("programmeDetailOverlay not found for programme detail overlay buttons init.");
        }

        // Initialize Devis Form Overlay open buttons for dynamically added course items
        if (courseListContainer && devisFormOverlay) {
            const dynamicDevisButtons = courseListContainer.querySelectorAll('.open-devis-form');
            const devisFormCourseTitle = devisFormOverlay.querySelector('#devis-form-course-title');
            const devisCourseIdInput = devisFormOverlay.querySelector('#devis-course-id');
            const devisForm = devisFormOverlay.querySelector('#devis-form');

            if (dynamicDevisButtons.length > 0 && devisFormCourseTitle && devisCourseIdInput && devisForm) {
                dynamicDevisButtons.forEach(button => {
                    button.addEventListener('click', (event) => {
                        event.preventDefault();
                        const courseItem = button.closest('.course-item');
                        if (!courseItem) return;
                        const courseIdSpan = courseItem.querySelector('.course-id');
                        const courseNameH3 = courseItem.querySelector('.course-name');
                        
                        if (!courseIdSpan || !courseNameH3) return;

                        const currentCourseId = courseIdSpan.textContent.trim();
                        const currentCourseName = courseNameH3.textContent.trim();
                        
                        console.log('Opening Devis Form for CourseID:', currentCourseId, 'Name:', currentCourseName);

                        devisFormCourseTitle.textContent = `Demande de devis pour: ${currentCourseName}`;
                        devisCourseIdInput.value = currentCourseId;
                        devisForm.reset(); // Clear any previous form data

                        devisFormOverlay.classList.add('active');
                        document.body.style.overflow = 'hidden';
                    });
                });
            }
        } else {
            if (!courseListContainer) console.log("courseListContainer not found for devis form buttons init.");
            if (!devisFormOverlay) console.log("devisFormOverlay not found for devis form buttons init.");
        }
    }

    function updatePageHeaderTitles(courseCount) {
        const titleElement = document.querySelector('.section-header.text-left .section-title');
        const subtitleElement = document.querySelector('.section-header.text-left .page-category-subtitle');
        const activeBreadcrumb = document.querySelector('.breadcrumb-item.active');

        let categoryName = "Formations de la catégorie"; // Default/fallback category name
        if (activeBreadcrumb) {
            categoryName = activeBreadcrumb.textContent.trim();
        }

        if (titleElement) {
            titleElement.textContent = categoryName;
        }

        if (subtitleElement) {
            let subtitleText = courseCount + " "; // Start with the number
            subtitleText += (courseCount === 1) ? "Formation" : "Formations"; // Add "Formation" or "Formations"
            subtitleElement.textContent = subtitleText;
        }
    }

    async function loadCoursesData() {
        const csvPath = 'data.csv'; 
        try {
            const response = await fetch(csvPath);
            if (!response.ok) {
                console.error('Failed to fetch CSV:', response.status, response.statusText);
                return;
            }
            const csvText = await response.text();
            coursesData = parseCSV(csvText);
            console.log('coursesData populated, count:', coursesData.length);
            if (coursesData.length > 0) {
                console.log('First course object keys:', Object.keys(coursesData[0]));
                updatePageHeaderTitles(coursesData.length); // Update header titles with course count
                displayCoursesInList(coursesData);
                initializeDynamicEventListeners(); // Initialize listeners after courses are displayed
            } else {
                // Handle case with no courses, update titles accordingly
                updatePageHeaderTitles(0);
                if(courseListContainer) courseListContainer.innerHTML = '<p>Aucune formation disponible dans cette catégorie pour le moment.</p>';
            }
        } catch (error) {
            console.error('Error loading or parsing CSV:', error);
            updatePageHeaderTitles(0); // Update titles even if there's an error loading
            if(courseListContainer) courseListContainer.innerHTML = '<p>Erreur lors du chargement des formations.</p>';
        }
    }

    // Initial setup if the necessary page elements are present
    if (courseListContainer && programmeDetailOverlay) { // Also check for devisFormOverlay if it relies on courseListContainer
        loadCoursesData(); // Load data and display courses

        // Programme Detail Overlay close button and backdrop click
        const closeProgrammeDetailButton = programmeDetailOverlay.querySelector('.close-overlay-btn');
        if (closeProgrammeDetailButton) {
            closeProgrammeDetailButton.addEventListener('click', () => {
                programmeDetailOverlay.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        programmeDetailOverlay.addEventListener('click', (event) => {
            if (event.target === programmeDetailOverlay) {
                programmeDetailOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // Devis Form Overlay close button and backdrop click
        if (devisFormOverlay) {
            const closeDevisFormButton = devisFormOverlay.querySelector('.close-overlay-btn');
            if (closeDevisFormButton) {
                closeDevisFormButton.addEventListener('click', () => {
                    devisFormOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                });
            }
            devisFormOverlay.addEventListener('click', (event) => {
                if (event.target === devisFormOverlay) {
                    devisFormOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }

    } else {
      // console.log('Course list or overlay not found on this page. Skipping dynamic course loading.');
    }

});