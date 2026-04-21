// 1. CUSTOM CURSOR & AURA LOGIC
const cursor = document.getElementById('custom-cursor');
const aura = document.getElementById('cursor-aura');
let mouseX = 0, mouseY = 0;
let cursorX = 0, cursorY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // Immediate cursor movement
    if(cursor) {
        cursor.style.left = `${mouseX}px`;
        cursor.style.top = `${mouseY}px`;
    }
    
    // Aura follows with slight delay (handled by GSAP below)
    
    // Update CSS variables for all cards (Holographic internal glow)
    document.querySelectorAll('.card').forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
});

// Smooth aura following using GSAP Ticker or fallback requestAnimationFrame
function updateAura() {
    cursorX += (mouseX - cursorX) * 0.15;
    cursorY += (mouseY - cursorY) * 0.15;
    if(aura) {
        aura.style.left = `${cursorX}px`;
        aura.style.top = `${cursorY}px`;
    }
}
if (typeof gsap !== 'undefined') {
    gsap.ticker.add(updateAura);
} else {
    function fallbackTicker() {
        updateAura();
        requestAnimationFrame(fallbackTicker);
    }
    fallbackTicker();
}

// Hover states for cursor
const interactives = document.querySelectorAll('.magnetic, .interactive-elem, button, a, input');
interactives.forEach(el => {
    el.addEventListener('mouseenter', () => { if(cursor) cursor.classList.add('hover'); });
    el.addEventListener('mouseleave', () => { if(cursor) cursor.classList.remove('hover'); });
});

// 2. MAGNETIC BUTTONS (Awwwards Style)
const magneticElems = document.querySelectorAll('.magnetic');
magneticElems.forEach(elem => {
    elem.addEventListener('mousemove', (e) => {
        const rect = elem.getBoundingClientRect();
        const hx = rect.left + rect.width / 2;
        const hy = rect.top + rect.height / 2;
        const dx = (e.clientX - hx) * 0.3; // Factor of attraction
        const dy = (e.clientY - hy) * 0.3;
        
        if (typeof gsap !== 'undefined') {
            gsap.to(elem, { x: dx, y: dy, duration: 0.3, ease: "power2.out" });
        } else {
            elem.style.transform = `translate(${dx}px, ${dy}px)`;
        }
    });

    elem.addEventListener('mouseleave', () => {
        if (typeof gsap !== 'undefined') {
            gsap.to(elem, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.3)" });
        } else {
            elem.style.transform = `translate(0px, 0px)`;
        }
    });
});

// 3. AMBIENT CANVAS (Parallax Stars / Cyber Grid)
const canvas = document.getElementById('ambient-canvas');
const ctx = canvas.getContext('2d');
let width, height;
let particles = [];

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class CyberParticle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.color = Math.random() > 0.5 ? 'rgba(0, 210, 255, 0.4)' : 'rgba(144, 43, 245, 0.3)';
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Mouse reactivity
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if(dist < 150) {
            this.x -= dx * 0.01;
            this.y -= dy * 0.01;
        }

        if (this.x > width) this.x = 0;
        if (this.x < 0) this.x = width;
        if (this.y > height) this.y = 0;
        if (this.y < 0) this.y = height;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

const maxParticles = window.innerWidth <= 768 ? 40 : 100; // FPS Boost on Mobile
for(let i=0; i<maxParticles; i++) particles.push(new CyberParticle());

function renderCanvas() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    
    // Connect nearest particles
    ctx.lineWidth = 0.5;
    for(let i=0; i<particles.length; i++) {
        for(let j=i+1; j<particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if(dist < 80) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 - dist/800})`;
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(renderCanvas);
}
renderCanvas();

// 4. GSAP ENTRY ANIMATIONS
document.addEventListener('DOMContentLoaded', () => {
    if (typeof gsap !== 'undefined') {
        gsap.fromTo('.card', 
            { opacity: 0, y: 30 },
            {
                opacity: 1,
                y: 0,
                duration: 1,
                stagger: 0.1,
                ease: "power3.out",
                clearProps: "opacity,y",
                onComplete: () => {
                        // Fill meters
                        document.querySelectorAll('.meter-fill').forEach(meter => {
                            const w = meter.style.getPropertyValue('--width');
                            gsap.to(meter, { width: w, duration: 1.5, ease: "power4.out" });
                        });
                        // NEW: Fill circular gauges
                        animateGauges();
                    }
                }
            );
        } else {
            // Fallback for meters if JS/GSAP blocks but UI is still rendered
            document.querySelectorAll('.meter-fill').forEach(meter => {
                meter.style.width = meter.style.getPropertyValue('--width');
                meter.style.transition = 'width 1.5s ease-out';
            });
            // Fallback for gauges
            document.querySelectorAll('.gauge-fill').forEach(gauge => {
                const offset = gauge.style.strokeDashoffset;
                gauge.style.strokeDashoffset = offset;
            });
        }
    });

    function animateGauges() {
        if (typeof gsap === 'undefined') return;
        document.querySelectorAll('.gauge-fill').forEach(gauge => {
            const finalOffset = gauge.style.strokeDashoffset;
            // Reset to full circle first
            gsap.fromTo(gauge, 
                { strokeDashoffset: 201 },
                { strokeDashoffset: finalOffset, duration: 2, ease: "power2.out", delay: 0.2 }
            );
        });
    }


// 5. TOGGLES LOGIC
document.querySelectorAll('.switch').forEach(sw => {
    sw.addEventListener('click', () => sw.classList.toggle('active'));
});

// 6. MODAL SYSTEM
const modal = document.getElementById('holo-modal');
const modalContainer = document.getElementById('modal-content-container');

window.openProjectModal = function(id) {
    const data = projectData[id];
    if(!data) return;

    const techTags = data.tech.map(t => `<span class="modal-tech-tag">${t}</span>`).join('');

    modalContainer.innerHTML = `
        <h2 class="text-3xl font-bold text-white mb-6 font-mono border-b border-[#2a2a35] pb-4">
            <span class="text-neon-blue">></span> ${data.title}
        </h2>
        
        <div class="space-y-6">
            <div>
                <h3 class="text-neon-purple font-mono text-sm mb-2">[ EL PROBLEMA ]</h3>
                <p class="text-gray leading-relaxed">${data.problem}</p>
            </div>
            
            <div>
                <h3 class="text-neon-purple font-mono text-sm mb-2">[ LA SOLUCIÓN ]</h3>
                <p class="text-gray leading-relaxed">${data.solution}</p>
            </div>
            
            <div>
                <h3 class="text-neon-purple font-mono text-sm mb-2">[ STACK TECNOLÓGICO ]</h3>
                <div class="flex flex-wrap mt-2">${techTags}</div>
            </div>
            
            <div class="bg-neon-blue bg-opacity-10 p-4 rounded-lg border border-neon-blue border-opacity-20 mt-4">
                <h3 class="text-neon-blue font-mono text-sm mb-1">RESULTADO:</h3>
                <p class="text-white font-semibold">${data.result}</p>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
};

window.closeProjectModal = function() {
    modal.classList.remove('active');
};

// 7. TERMINAL SUBMIT & SUPABASE + EMAIL INTEGRATION
const SUBA_URL = 'https://bgvugvzxbseqxyxajego.supabase.co';
const SUBA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJndnVndnp4YnNlcXh5eGFqZWdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzQzNzQsImV4cCI6MjA5MTk1MDM3NH0.M86cwjHCM2zpJ2IJLpN-n869zMZnuUyTMDmUfIptq48';
const supabaseClient = window.supabase ? window.supabase.createClient(SUBA_URL, SUBA_KEY) : null;
const WEB3FORMS_KEY = '49965c5e-58e7-47bb-be4d-0c28fedcc335';

const form = document.getElementById('cyber-form');
const termContent = document.getElementById('terminal-content');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('t-email').value;
    const phone = document.getElementById('t-phone').value || 'No proporcionado';
    const msg = document.getElementById('t-msg').value;

    form.innerHTML = '';
    
    const div = document.createElement('div');
    div.classList.add('mt-6');
    termContent.appendChild(div);

    const appendMsg = (html) => { div.innerHTML += html; };
    
    appendMsg(`<p><span class="text-neon-purple">enviando:~$</span> Iniciando envío seguro...</p>`);

    if (supabaseClient) {
        try {
            await new Promise(r => setTimeout(r, 600));
            appendMsg(`<p><span class="text-neon-purple">enviando:~$</span> Notificando al celular de [Erick Torres]...</p>`);
            
            // Tarea 1: Base de Datos
            const dbTask = supabaseClient
                .from('mensajes_contacto')
                .insert([{ email: email, telefono: phone, mensaje: msg }]);

            // Tarea 2: Enviar Correo al Dueño
            const emailTask = fetch("https://api.web3forms.com/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({
                    access_key: WEB3FORMS_KEY,
                    subject: "🚨 Nuevo Reclutador en la Terminal del CV",
                    from_name: "CYBER-TERMINAL",
                    email: email,
                    message: `📞 Teléfono: ${phone}\n\n💬 Motivo: ${msg}`
                })
            });

            // Promesas paralelas para máxima velocidad
            const [{ error }] = await Promise.all([dbTask, emailTask]);

            await new Promise(r => setTimeout(r, 800));

            if (error) {
                console.error("Supabase Error:", error);
                appendMsg(`<p class="text-red-500 mt-4 font-bold">> [ ERROR ] Acceso denegado a DB: ${error.message}</p>`);
            } else {
                appendMsg(`<p class="text-neon-green mt-4 font-bold">> [ TRANSMISIÓN EXITOSA ] Alerta de correo enviada a la base. Conexión cerrada.</p>`);
            }
        } catch (err) {
            console.error("Connection Error:", err);
            appendMsg(`<p class="text-red-500 mt-4 font-bold">> [ ERROR ] Pérdida de conexión de red.</p>`);
        }
    } else {
        appendMsg(`<p class="text-red-500 mt-4 font-bold">> [ ERROR ] SDK no sincronizado.</p>`);
    }
});

// 8. IMAGE MODAL GALLERY LOGIC
window.openImageModal = function(src) {
    const modal = document.getElementById('image-modal');
    const img = document.getElementById('image-modal-img');
    if(modal && img) {
        img.src = src;
        modal.classList.add('active');
    }
};

window.closeImageModal = function() {
    const modal = document.getElementById('image-modal');
    if(modal) {
        modal.classList.remove('active');
    }
};

// 9. SHORTS / REELS PLAYLIST LOGIC
// Playlists for each phone. 
// USER INSTRUCTION: Replace these file names with your actual videos in the /assets/ folder!
const phonePlaylists = {
    1: ["./assets/phone1.mp4?v=final"],
    2: ["./assets/phone2.mp4?v=final"], 
    3: ["./assets/phone3.mp4?v=final"]
};
const currentIndexes = { 1: 0, 2: 0, 3: 0 };

document.querySelectorAll('.reels-player').forEach(video => {
    video.style.transition = "opacity 0.3s ease";
    video.addEventListener('ended', (e) => {
        // Extract phone ID from id="reels-video-1"
        const phoneId = e.target.id.split('-').pop();
        nextReel(phoneId);
    });
});

// OPTIMIZATION: Lazy-play videos ONLY when they are in the viewport to save CPU/RAM.
const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if(entry.isIntersecting) {
            let p = entry.target.play();
            if(p !== undefined) {
                p.catch(e => console.log("Scroll autoplay prevented:", e));
            }
        } else {
            // Pause video to free up rendering power when out of sight
            entry.target.pause();
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.reels-player, .lazy-video').forEach(v => videoObserver.observe(v));

window.nextReel = function(phoneId) {
    const video = document.getElementById(`reels-video-${phoneId}`);
    if(!video || !phonePlaylists[phoneId] || phonePlaylists[phoneId].length === 0) return;
    
    const previousSrc = phonePlaylists[phoneId][currentIndexes[phoneId]];
    
    currentIndexes[phoneId]++;
    if (currentIndexes[phoneId] >= phonePlaylists[phoneId].length) {
        currentIndexes[phoneId] = 0; // Loop list back to start
    }
    
    const nextSrc = phonePlaylists[phoneId][currentIndexes[phoneId]];
    
    // Si la lista solo tiene 1 video (o el siguiente es el mismo), solo rebobina.
    if(previousSrc === nextSrc) {
        video.currentTime = 0;
        let p = video.play();
        if(p !== undefined) p.catch(e => console.log(e));
        return;
    }

    // Fade out para transición entre videos diferentes
    video.style.opacity = 0;
    
    setTimeout(() => {
        video.src = nextSrc;
        let playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                video.style.opacity = 1;
            }).catch(error => {
                console.log(`Autoplay prevented on phone ${phoneId}:`, error);
                video.style.opacity = 1;
            });
        } else {
            video.style.opacity = 1;
        }
    }, 300);
};

// ===========================
// AI HOLOGRAM WIDGET LOGIC
// ===========================
const aiOrb = document.getElementById('ai-orb-toggle');
const aiPanel = document.getElementById('ai-hologram-panel');
const aiTypingText = document.getElementById('ai-typing-text');

// Toggle hologram panel when orb is clicked
if (aiOrb && aiPanel) {
    aiOrb.addEventListener('click', () => {
        aiPanel.classList.toggle('open');
    });
}

// Cycling messages for the AI "typing" effect
const aiMessages = [
    'PERFIL EN LÍNEA...',
    'ANALIZANDO EXPERIENCIA...',
    'IA ACTIVA...',
    'CONEXIÓN SEGURA ✓',
    'PROCESANDO DATOS...',
    'LISTO PARA CONTACTO...',
    'IDENTIDAD VERIFICADA ✓',
    'MODO INTERACTIVO ACTIVO',
];

let aiMsgIndex = 0;
function cycleAiMessage() {
    if (!aiTypingText) return;
    aiTypingText.style.opacity = 0;
    setTimeout(() => {
        aiMsgIndex = (aiMsgIndex + 1) % aiMessages.length;
        aiTypingText.textContent = aiMessages[aiMsgIndex];
        aiTypingText.style.opacity = 1;
    }, 400);
}
aiTypingText && setInterval(cycleAiMessage, 3000);

// Auto-open after 2.5 seconds to greet visitor
setTimeout(() => {
    if (aiPanel) aiPanel.classList.add('open');
}, 2500);


// 10. ANALYTICAL HERO GRAPH ANIMATION
const pulsePaths = document.querySelectorAll('.pulse-path');
if (pulsePaths.length > 0) {
    let phase = 0;
    function animateHeroGraph() {
        phase += 0.02;
        pulsePaths.forEach((path, i) => {
            const amplitude = 30 + (i * 10);
            const frequency = 0.01 + (i * 0.005);
            let d = `M0,150 `;
            for (let x = 0; x <= 1000; x += 20) {
                // Combine sine waves for organic movement
                const y = 150 + Math.sin(x * frequency + phase + i) * amplitude 
                          + Math.cos(x * 0.02 - phase * 0.5) * (amplitude / 2);
                d += `L${x},${y} `;
            }
            path.setAttribute('d', d);
        });
        requestAnimationFrame(animateHeroGraph);
    }
    animateHeroGraph();
}
