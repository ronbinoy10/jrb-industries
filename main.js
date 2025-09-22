// Form validation and submission handling
class ContactFormHandler {
    constructor() {
        this.form = document.getElementById('contact-form');
        this.notification = null;
        this.init();
    }

    init() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            this.setupValidation();
        }
    }

    setupValidation() {
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearError(input));
        });
    }

    validateField(field) {
        const value = field.value.trim();
        const errorElement = field.parentNode.querySelector('.error-message');
        
        // Clear previous error
        this.clearError(field);

        // Validation rules
        if (field.hasAttribute('required') && !value) {
            this.showFieldError(field, 'This field is required');
            return false;
        }

        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.showFieldError(field, 'Please enter a valid email address');
                return false;
            }
        }

        if (field.type === 'tel' && value) {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(value.replace(/\s/g, ''))) {
                this.showFieldError(field, 'Please enter a valid phone number');
                return false;
            }
        }

        return true;
    }

    showFieldError(field, message) {
        const errorElement = field.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
            field.classList.add('border-red-500');
        }
    }

    clearError(field) {
        const errorElement = field.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.add('hidden');
            field.classList.remove('border-red-500');
        }
    }

    validateForm() {
        const requiredFields = this.form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            this.showNotification('Please correct the errors above', 'error');
            return;
        }

        // Show loading state
        const submitBtn = this.form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<div class="spinner"></div>Sending...';
        submitBtn.disabled = true;
        this.form.classList.add('loading');

        try {
            const formData = new FormData(this.form);
            const data = Object.fromEntries(formData);
            
            // Send to your backend or email service
            await this.sendEmail(data);
            
            this.showNotification('Thank you! Your message has been sent successfully.', 'success');
            this.form.reset();
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.showNotification('Sorry, there was an error sending your message. Please try again.', 'error');
        } finally {
            // Reset button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            this.form.classList.remove('loading');
        }
    }

    async sendEmail(data) {
        // Option 1: Using EmailJS (recommended for client-side)
        if (typeof emailjs !== 'undefined') {
            return emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', {
                from_name: data.name,
                from_email: data.email,
                phone: data.phone,
                inquiry_type: data.inquiryType,
                message: data.message,
                to_email: 'binoyjose8601@gmail.com' // Your email
            });
        }
        
        // Option 2: Send to your PHP backend
        const response = await fetch('sendmail.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Failed to send email');
        }

        return response.json();
    }

    showNotification(message, type) {
        // Remove existing notification
        if (this.notification) {
            this.notification.remove();
        }

        // Create notification
        this.notification = document.createElement('div');
        this.notification.className = `notification ${type}`;
        this.notification.innerHTML = message;
        
        document.body.appendChild(this.notification);
        
        // Show notification
        setTimeout(() => {
            this.notification.classList.add('show');
        }, 100);

        // Auto hide after 5 seconds
        setTimeout(() => {
            if (this.notification) {
                this.notification.classList.remove('show');
                setTimeout(() => {
                    if (this.notification) {
                        this.notification.remove();
                        this.notification = null;
                    }
                }, 300);
            }
        }, 5000);
    }
}
// Google Maps Integration
class GoogleMapsHandler {
    constructor() {
        this.map = null;
        this.marker = null;
        this.infoWindow = null;
        // JRB Industries location in Chalakudy, Kerala
        this.businessLocation = {
            lat: 10.3102,  // Chalakudy latitude
            lng: 76.3267   // Chalakudy longitude
        };
        this.init();
    }

    init() {
        // Load Google Maps script
        if (!window.google) {
            this.loadGoogleMapsScript();
        } else {
            this.initMap();
        }
    }

    loadGoogleMapsScript() {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBxj-r1i6eSRhFPaMvHliGoR4oehhI6rUE&callback=initMap&libraries=places`;
        script.async = true;
        script.defer = true;
        
        // Set global callback
        window.initMap = () => this.initMap();
        
        document.head.appendChild(script);
    }

    initMap() {
        // Create map container if it doesn't exist
        let mapContainer = document.getElementById('google-map');
        if (!mapContainer) {
            mapContainer = this.createMapContainer();
        }

        // Initialize map
        this.map = new google.maps.Map(mapContainer, {
            center: this.businessLocation,
            zoom: 15,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: this.getCustomMapStyles()
        });

        // Add business marker
        this.addBusinessMarker();
        
        // Add info window
        this.addInfoWindow();

        // Add click listener to marker
        this.marker.addListener('click', () => {
            this.infoWindow.open(this.map, this.marker);
        });
    }

    createMapContainer() {
        // Find contact section and add map
        const contactSection = document.getElementById('contact');
        if (contactSection) {
            const mapHTML = `
                <div class="mt-12">
                    <div class="text-center mb-6">
                        <h3 class="text-2xl font-bold text-white mb-2">Visit Our Location</h3>
                        <p class="text-blue-100">Find us in Chalakudy, Kerala</p>
                    </div>
                    <div id="google-map" class="w-full h-96 rounded-2xl shadow-2xl border-2 border-blue-300/20"></div>
                </div>
            `;
            
            const container = contactSection.querySelector('.container');
            if (container) {
                container.insertAdjacentHTML('beforeend', mapHTML);
                return document.getElementById('google-map');
            }
        }
        return null;
    }

    addBusinessMarker() {
        this.marker = new google.maps.Marker({
            position: this.businessLocation,
            map: this.map,
            title: 'JRB Industries',
            icon: {
                url: 'image/svg+xml;base64,' + btoa(`
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#1e3a8a" width="40" height="40">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                        <circle cx="12" cy="9" r="2.5" fill="white"/>
                    </svg>
                `),
                scaledSize: new google.maps.Size(40, 40),
                anchor: new google.maps.Point(20, 40)
            },
            animation: google.maps.Animation.DROP
        });
    }

    addInfoWindow() {
        const infoContent = `
            <div style="padding: 15px; max-width: 300px;">
                <h3 style="margin: 0 0 10px 0; color: #1e3a8a; font-size: 18px; font-weight: bold;">
                    JRB Industries
                </h3>
                <p style="margin: 5px 0; color: #666;">
                    <strong>Address:</strong><br>
                    Chalakudy, Kerala, India
                </p>
                <p style="margin: 5px 0; color: #666;">
                    <strong>Phone:</strong> <a href="tel:+919876543210" style="color: #1e3a8a;">+91 98765 43210</a>
                </p>
                <p style="margin: 5px 0; color: #666;">
                    <strong>Email:</strong> <a href="mailto:contact@jrbindustries.com" style="color: #1e3a8a;">contact@jrbindustries.com</a>
                </p>
                <div style="margin-top: 10px;">
                    <a href="https://maps.google.com/?q=${this.businessLocation.lat},${this.businessLocation.lng}" 
                       target="_blank" 
                       style="display: inline-block; padding: 8px 16px; background: #1e3a8a; color: white; text-decoration: none; border-radius: 4px; font-size: 14px;">
                        Get Directions
                    </a>
                </div>
            </div>
        `;

        this.infoWindow = new google.maps.InfoWindow({
            content: infoContent
        });
    }

    getCustomMapStyles() {
        return [
            {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{"color": "#e9e9e9"}, {"lightness": 17}]
            },
            {
                "featureType": "landscape",
                "elementType": "geometry",
                "stylers": [{"color": "#f5f5f5"}, {"lightness": 20}]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.fill",
                "stylers": [{"color": "#ffffff"}, {"lightness": 17}]
            },
            {
                "featureType": "road.highway",
                "elementType": "geometry.stroke",
                "stylers": [{"color": "#ffffff"}, {"lightness": 29}, {"weight": 0.2}]
            }
        ];
    }
}
// Mobile menu toggle
function initMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
        
        // Close mobile menu when clicking on links
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }
}

// Product modal functionality
function openProductModal(productType) {
    const modalContent = getProductModalContent(productType);
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-bold text-navy-800">${modalContent.title}</h2>
                    <button class="text-gray-500 hover:text-gray-700 text-2xl" onclick="closeModal(this)">×</button>
                </div>
                <div class="space-y-4">
                    ${modalContent.content}
                </div>
                <div class="mt-6 flex gap-3">
                    <button onclick="closeModal(this)" class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg">
                        Close
                    </button>
                    <a href="#contact" onclick="closeModal(this)" class="flex-1 bg-jrb-blue hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-center">
                        Get Quote
                    </a>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modal.querySelector('button'));
        }
    });
}

function getProductModalContent(productType) {
    const products = {
        cement: {
            title: 'Cement Interlocking Bricks',
            content: `
                <img src="https://placehold.co/600x300/1e3a8a/ffffff?text=Cement+Interlocking+Bricks" class="w-full rounded-lg mb-4">
                <h3 class="text-lg font-bold text-navy-800 mb-2">Technical Specifications</h3>
                <ul class="list-disc list-inside space-y-1 text-gray-700 mb-4">
                    <li>Compressive Strength: 35-40 N/mm²</li>
                    <li>Size: Available in multiple dimensions</li>
                    <li>Water Absorption: Less than 10%</li>
                    <li>Available in Double and Triple lock variants</li>
                </ul>
                <h3 class="text-lg font-bold text-navy-800 mb-2">Applications</h3>
                <p class="text-gray-700 mb-4">Perfect for residential buildings, commercial complexes, boundary walls, and industrial structures requiring superior strength and precision.</p>
                <h3 class="text-lg font-bold text-navy-800 mb-2">Benefits</h3>
                <ul class="list-disc list-inside space-y-1 text-gray-700">
                    <li>Faster construction with precise interlocking</li>
                    <li>Reduced mortar consumption</li>
                    <li>Excellent load-bearing capacity</li>
                    <li>Cost-effective solution</li>
                </ul>
            `
        },
        soil: {
            title: 'Classic Cement Bricks',
            content: `
                <img src="https://placehold.co/600x300/059669/ffffff?text=Classic+Cement+Bricks" class="w-full rounded-lg mb-4">
                <h3 class="text-lg font-bold text-navy-800 mb-2">Technical Specifications</h3>
                <ul class="list-disc list-inside space-y-1 text-gray-700 mb-4">
                    <li>Compressive Strength: 30-35 N/mm²</li>
                    <li>Made from premium cement, sand, and aggregates</li>
                    <li>Low water absorption rate</li>
                    <li>Standard brick dimensions</li>
                </ul>
                <h3 class="text-lg font-bold text-navy-800 mb-2">Applications</h3>
                <p class="text-gray-700 mb-4">Ideal for traditional construction methods, load-bearing walls, and projects requiring proven reliability at an economical price point.</p>
                <h3 class="text-lg font-bold text-navy-800 mb-2">Benefits</h3>
                <ul class="list-disc list-inside space-y-1 text-gray-700">
                    <li>Budget-friendly without compromising quality</li>
                    <li>Natural thermal insulation properties</li>
                    <li>Time-tested durability</li>
                    <li>Easy availability and handling</li>
                </ul>
            `
        },
        custom: {
            title: 'Light Weight Bricks',
            content: `
                <img src="https://placehold.co/600x300/4f46e5/ffffff?text=Light+Weight+Bricks" class="w-full rounded-lg mb-4">
                <h3 class="text-lg font-bold text-navy-800 mb-2">Technical Specifications</h3>
                <ul class="list-disc list-inside space-y-1 text-gray-700 mb-4">
                    <li>Weight: 40-50% lighter than conventional bricks</li>
                    <li>High load-bearing capacity despite low weight</li>
                    <li>Superior thermal insulation</li>
                    <li>Made with imported lightweight aggregates</li>
                </ul>
                <h3 class="text-lg font-bold text-navy-800 mb-2">Applications</h3>
                <p class="text-gray-700 mb-4">Perfect for high-rise buildings, partition walls, and projects where reduced structural load and improved insulation are priorities.</p>
                <h3 class="text-lg font-bold text-navy-800 mb-2">Benefits</h3>
                <ul class="list-disc list-inside space-y-1 text-gray-700">
                    <li>Reduced transportation and handling costs</li>
                    <li>Lower structural load on foundation</li>
                    <li>Excellent thermal and acoustic insulation</li>
                    <li>Faster construction due to easy handling</li>
                </ul>
            `
        }
    };
    
    return products[productType] || products.cement;
}

function closeModal(button) {
    const modal = button.closest('.fixed');
    if (modal) {
        modal.remove();
    }
}

// Smooth scrolling for navigation links
function initSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const offsetTop = targetElement.offsetTop - 80; // Account for fixed header
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Header scroll effect
function initHeaderScrollEffect() {
    const header = document.getElementById('header');
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            header.style.background = 'rgba(30, 41, 59, 0.95)';
            header.style.backdropFilter = 'blur(20px)';
        } else {
            header.style.background = 'rgba(30, 41, 59, 0.9)';
            header.style.backdropFilter = 'blur(15px)';
        }
        
        lastScrollY = currentScrollY;
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    new ContactFormHandler();
    new GoogleMapsHandler();
    initMobileMenu();
    initSmoothScrolling();
    initHeaderScrollEffect();
    
    console.log('JRB Industries website initialized successfully!');
});
