// CES Las Vegas 2026 - Landing Page JavaScript
// Desenvolvido para BMS Consultoria Tributária

document.addEventListener('DOMContentLoaded', function() {
    console.log('CES Las Vegas 2026 - Landing Page iniciada');

    // Inicializar componentes
    initCountdown();
    initFormHandlers();
    initScrollAnimations();
    initCTAHandlers();
    initNavigation();

    // Configurar Google Analytics se disponível
    if (typeof gtag !== 'undefined') {
        gtag('config', 'GA_MEASUREMENT_ID', {
            page_title: 'CES Las Vegas 2026 - Landing Page',
            page_location: window.location.href
        });
    }
});

// Countdown Timer até 4 de Janeiro de 2026 (início do CES 2026)
function initCountdown() {
    const targetDate = new Date('January 4, 2026 00:00:00').getTime();
    
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = targetDate - now;
        
        if (distance < 0) {
            document.getElementById('countdown').innerHTML = '<div class="text-2xl font-bold text-red-400">Inscrições encerradas</div>';
            return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        document.getElementById('days').textContent = days.toString().padStart(3, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Manipuladores de formulário
function initFormHandlers() {
    const form = document.getElementById('registration-form');

    if (form) {
        form.addEventListener('submit', handleFormSubmit);

        // Validação em tempo real
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', validateField);
            input.addEventListener('input', clearErrors);
        });

        // Formatação automática do telefone
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', formatPhone);
        }

        // Formatação do LinkedIn
        // const linkedinInput = document.getElementById('linkedin');
        // if (linkedinInput) {
        //     linkedinInput.addEventListener('blur', formatLinkedIn);
        // }

        // Formatação do Instagram
        const instagramInput = document.getElementById('instagram');
        if (instagramInput) {
            instagramInput.addEventListener('input', formatInstagram);
        }
    }
}

// Submissão do formulário
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Validação completa
    if (!validateForm(data)) {
        return;
    }
    
    // Mostrar loading
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processando...';
    submitButton.disabled = true;
    
    try {
        // Salvar no Google Apps Script (substitua pela sua URL do Web App)
        const scriptURL = 'https://script.google.com/macros/s/AKfycbx-KLwpX-uOg21XRr9q86BpBH5SWLRYbV760EerrE3ezu6Eca49eLdfLzZwBaNGPDMg/exec';

        // Montar FormData conforme esperado pelo doPost(e) do Apps Script
        const payload = new FormData();
        payload.append('name', data.name || '');
        payload.append('email', data.email || '');
        payload.append('phone', data.phone || '');
        payload.append('company', data.company || '');
        payload.append('position', data.position || '');
        payload.append('created_at', new Date().toISOString());

        const response = await fetch(scriptURL, {
            method: "POST",
            mode: "no-cors",
            body: payload
        });

        // Com no-cors não conseguimos ler a resposta; considerar como sucesso otimista
        if (response && (response.ok || true)) {
            showSuccessMessage();
            form.reset();

            // Tracking de conversão
            trackConversion('registration_submit', {
                nome: data.name,
                email: data.email,
                empresa: data.company,
                telefone: data.phone
            });

            // Não abrir WhatsApp automaticamente; apenas mensagem de sucesso
            
        } else {
            throw new Error('Erro ao processar inscrição');
        }
        
    } catch (error) {
        console.error('Erro na submissão:', error);
        showErrorMessage('Ocorreu um erro ao processar sua inscrição. Tente novamente ou entre em contato conosco.');
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// Validação de formulário
function validateForm(data) {
    let isValid = true;

    // Validar nome
    if (!data.name || data.name.trim().length < 2) {
        showFieldError('name', 'Nome deve ter pelo menos 2 caracteres');
        isValid = false;
    }

    // Validar cargo
    if (!data.position || data.position.trim().length < 2) {
        showFieldError('position', 'Cargo ou posição é obrigatório');
        isValid = false;
    }

    // Validar empresa
    if (!data.company || data.company.trim().length < 2) {
        showFieldError('company', 'Nome da empresa é obrigatório');
        isValid = false;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
        showFieldError('email', 'Digite um e-mail válido');
        isValid = false;
    }

    // Validar telefone
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    if (!data.phone || !phoneRegex.test(data.phone)) {
        showFieldError('phone', 'Digite um telefone válido (11) 99999-9999');
        isValid = false;
    }

    return isValid;
}

// Validação individual de campos
function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    clearFieldError(field.id);
    
    switch (field.id) {
        case 'name':
            if (value.length < 2) {
                showFieldError('name', 'Nome muito curto');
            }
            break;
            
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (value && !emailRegex.test(value)) {
                showFieldError('email', 'E-mail inválido');
            }
            break;
            
        case 'phone':
            const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
            if (value && !phoneRegex.test(value)) {
                showFieldError('phone', 'Formato: (11) 99999-9999');
            }
            break;
    }
}

// Formatação automática do telefone
function formatPhone(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length >= 2) {
        value = value.replace(/^(\d{2})(\d)/, '($1) $2');
    }
    
    if (value.length >= 10) {
        value = value.replace(/(\d{4})(\d{4})$/, '$1-$2');
    } else if (value.length >= 9) {
        value = value.replace(/(\d{5})(\d{4})$/, '$1-$2');
    }
    
    e.target.value = value;
}

// Formatação automática do Instagram
function formatInstagram(e) {
    let value = e.target.value;
    // Remove @ duplicados e espaços
    value = value.replace(/[@\s]/g, '');
    // Adiciona @ no início se não estiver vazio
    if (value.length > 0) {
        e.target.value = '@' + value;
    }
}

// Mostrar erro no campo
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.createElement('div');
    errorElement.className = 'text-red-400 text-sm mt-1 field-error';
    errorElement.textContent = message;
    
    clearFieldError(fieldId);
    field.parentNode.appendChild(errorElement);
    field.classList.add('border-red-400');
}

// Limpar erro do campo
function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    field.classList.remove('border-red-400');
}

// Limpar erros ao digitar
function clearErrors(e) {
    clearFieldError(e.target.id);
}

// Mostrar mensagem de sucesso
function showSuccessMessage() {
    const message = document.createElement('div');
    message.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 success-message';
    message.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-check-circle mr-3 text-xl"></i>
            <div>
                <div class="font-bold">Inscrição realizada com sucesso!</div>
                <div class="text-sm">Em breve entraremos em contato pelo seu e-mail/WhatsApp.</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 5000);
}

// Mostrar mensagem de erro
function showErrorMessage(text) {
    const message = document.createElement('div');
    message.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50 error-message';
    message.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-exclamation-triangle mr-3 text-xl"></i>
            <div>
                <div class="font-bold">Erro na inscrição</div>
                <div class="text-sm">${text}</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 8000);
}

// Manipuladores dos CTAs
function initCTAHandlers() {
    const ctaButtons = document.querySelectorAll('#header-cta, #main-cta, #mobile-cta');

    ctaButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();

            // Scroll suave para o formulário
            const form = document.getElementById('registration-form');
            if (form) {
                form.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

                // Focar no primeiro campo após o scroll
                setTimeout(() => {
                    document.getElementById('name')?.focus();
                }, 800);

                // Tracking do clique no CTA
                trackEvent('cta_click', {
                    button_id: button.id,
                    section: button.closest('section')?.className || 'unknown'
                });
            }
        });
    });
}

// Animações de scroll
function initScrollAnimations() {
    // Intersection Observer para animações
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
            }
        });
    }, observerOptions);
    
    // Observar elementos que devem animar
    const animatedElements = document.querySelectorAll('.grid > div, blockquote');
    animatedElements.forEach(el => observer.observe(el));
    
    // Remover qualquer transformação aplicada previamente ao hero
    const hero = document.querySelector('.gradient-bg');
    if (hero) {
        hero.style.transform = '';
    }
}

// Navegação e Menu Mobile
function initNavigation() {
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('open');
        });

        // Fechar menu ao clicar em um link
        const navLinks = mobileMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
            });
        });

        // Fechar menu ao clicar fora dele
        document.addEventListener('click', (e) => {
            if (!mobileMenuButton.contains(e.target) && !mobileMenu.contains(e.target)) {
                mobileMenu.classList.remove('open');
            }
        });
    }

    // Mobile CTA handler
    const mobileCTA = document.getElementById('mobile-cta');
    if (mobileCTA) {
        mobileCTA.addEventListener('click', (e) => {
            if (mobileMenu) mobileMenu.classList.remove('open');
            // Scroll suave para o formulário
            const form = document.getElementById('registration-form');
            if (form) {
                form.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });

                // Focar no primeiro campo após o scroll
                setTimeout(() => {
                    document.getElementById('name')?.focus();
                }, 800);
            }
        });
    }

    // Scroll spy - destacar link ativo com base na seção visível
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    function updateActiveNavLink() {
        const scrollY = window.pageYOffset;

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 80; // Offset para navbar
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }

    // Atualizar link ativo ao scroll
    window.addEventListener('scroll', updateActiveNavLink);

    // Atualizar link ativo ao carregar a página
    updateActiveNavLink();

    // Smooth scrolling personalizado para âncoras
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId.length > 1) { // Não é apenas "#"
                e.preventDefault();

                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const offsetTop = targetElement.offsetTop - 64; // Compensar navbar fixa

                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });

                    // Atualizar URL sem reload
                    history.replaceState(null, null, targetId);
                }
            }
        });
    });

    // Manter link ativo na primeira seção quando no topo
    window.addEventListener('scroll', () => {
        if (window.pageYOffset < 100) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#home') {
                    link.classList.add('active');
                }
            });
        }
    });
}

// Utilitários
function generateUniqueId() {
    return 'reg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function trackEvent(eventName, parameters = {}) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, parameters);
    }
    
    // Console log para debug
    console.log('Event tracked:', eventName, parameters);
}

function trackConversion(conversionType, data = {}) {
    // Tracking de conversão
    trackEvent('conversion', {
        conversion_type: conversionType,
        value: 1,
        currency: 'BRL'
    });
    
    // Facebook Pixel se disponível
    if (typeof fbq !== 'undefined') {
        fbq('track', 'Lead', {
            content_name: 'CES Las Vegas 2026',
            content_category: 'Event Registration'
        });
    }
}

// Adicionar estilos para animações
const style = document.createElement('style');
style.textContent = `
    .animate-fade-in {
        animation: fadeInUp 0.8s ease-out forwards;
        opacity: 0;
        transform: translateY(30px);
    }
    
    @keyframes fadeInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .success-message, .error-message {
        animation: slideDown 0.3s ease-out;
    }
    
    @keyframes slideDown {
        from {
            transform: translate(-50%, -100%);
            opacity: 0;
        }
        to {
            transform: translate(-50%, 0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
