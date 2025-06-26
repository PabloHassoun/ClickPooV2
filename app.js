// ClickPoo Ultimate - Jeu mobile pixel art 8-bit complet
class ClickPooUltimate {
    constructor() {
        // État du jeu avec données JSON
        this.gameState = {
            score: 0,
            coins: 0,
            level: 1,
            xp: 0,
            profileLevel: 1,
            profileXP: 0,
            totalClicks: 0,
            manualClicks: 0,
            totalCoinsEarned: 0,
            maxLevel: 1,
            maxCombo: 1.0,
            playTime: 0,
            comboMultiplier: 1,
            comboTimer: 0,
            boostActive: false,
            boostTimer: 0,
            boostCooldown: 0,
            lastBoostTime: 0,
            autoClickers: {},
            achievements: {},
            clicksPerSecond: 0,
            lastClickTime: 0,
            recentClicks: [],
            bestScore: 0,
            bestLevel: 1,
            bestCombo: 1.0,
            totalPlayTime: 0,
            activeChallenges: {},
            completedChallenges: {},
            hasNotifications: false,
            coinDrops: []
        };

        // Configuration avec données JSON intégrées
        this.config = {
            levels: [
                {name: "Niveau 1", threshold: 0, xpRequired: 200},
                {name: "Niveau 2", threshold: 400, xpRequired: 500},
                {name: "Niveau 3", threshold: 1200, xpRequired: 1200},
                {name: "Niveau 4", threshold: 3000, xpRequired: 2500},
                {name: "Niveau 5", threshold: 7500, xpRequired: 5000}
            ],
            autoClickers: [
                {name: "Seau", icon: "🪣", speed: 2000, baseCost: 20, cacasPerSec: 0.5},
                {name: "Toilette", icon: "🚽", speed: 1500, baseCost: 40, cacasPerSec: 0.67},
                {name: "Deux Toilettes", icon: "🚽🚽", speed: 1000, baseCost: 80, cacasPerSec: 1.0},
                {name: "Trois Toilettes", icon: "🚽🚽🚽", speed: 500, baseCost: 160, cacasPerSec: 2.0},
                {name: "Quatre Toilettes", icon: "🚽🚽🚽🚽", speed: 333, baseCost: 320, cacasPerSec: 3.0}
            ],
            challenges: [
                {id: "tap7", name: "Tape en 7 secondes", description: "10 clics en 7 secondes", target: 10, timeLimit: 7, reward: 10, type: "temporal"},
                {id: "tap10", name: "Tape en 10 secondes", description: "15 clics en 10 secondes", target: 15, timeLimit: 10, reward: 15, type: "temporal"},
                {id: "clicks200", name: "200 Clics", description: "Effectuer 200 clics totaux", target: 200, reward: 25, type: "cumulative"},
                {id: "combo3", name: "Combo x3", description: "Atteindre un combo de x3", target: 3, reward: 15, type: "combo"},
                {id: "level5", name: "Niveau 5", description: "Atteindre le niveau 5", target: 5, reward: 50, type: "level"}
            ],
            achievements: [
                {id: "first_click", name: "Premier Caca", description: "Faire votre premier clic", icon: "💩", threshold: 1, type: "clicks"},
                {id: "hundred_clicks", name: "Cent Cacas", description: "Faire 100 clics", icon: "💯", threshold: 100, type: "clicks"},
                {id: "first_auto", name: "Premier Auto", description: "Acheter votre premier auto-clicker", icon: "🤖", threshold: 1, type: "autoClickers"},
                {id: "level_5", name: "Niveau 5", description: "Atteindre le niveau 5", icon: "🎯", threshold: 5, type: "level"},
                {id: "rich", name: "Plein aux As", description: "Posséder 100 pièces", icon: "💰", threshold: 100, type: "coins"},
                {id: "combo_master", name: "Maître du Combo", description: "Atteindre un combo x5", icon: "🔥", threshold: 5, type: "combo"}
            ]
        };

        // Éléments DOM
        this.elements = {};
        this.currentScreen = 'welcome';
        
        // Audio Context
        this.audioContext = null;
        this.soundEnabled = true;
        this.audioInitialized = false;

        // Timers
        this.gameTimer = null;
        this.comboInterval = null;
        this.boostInterval = null;
        this.autoClickerIntervals = {};
        this.challengeTimers = {};
        this.cpsCalculationInterval = null;
        this.coinDropInterval = null;

        // Particles
        this.particles = [];
        this.maxParticles = 100;
        this.notifications = [];

        // Système de sons de pet avec variantes
        this.fartSounds = [
            { file: 'pet.wav', pitch: 1.0, rate: 1.0, volume: 0.3 },    // Normal
            { file: 'pet.wav', pitch: 1.2, rate: 1.1, volume: 0.25 },   // Plus aigu
            { file: 'pet.wav', pitch: 1.4, rate: 1.2, volume: 0.2 },    // Très aigu
            { file: 'pet.wav', pitch: 0.8, rate: 0.9, volume: 0.35 },   // Plus grave
            { file: 'pet.wav', pitch: 0.6, rate: 0.8, volume: 0.4 },    // Très grave
            { file: 'pet.wav', pitch: 1.1, rate: 1.3, volume: 0.25 },   // Rapide et aigu
            { file: 'pet.wav', pitch: 0.9, rate: 0.7, volume: 0.35 }    // Lent et grave
        ];

        // Musique de fond (libre de droit)
        this.backgroundMusic = null;
        this.musicStarted = false;

        this.init();
    }

    init() {
        this.loadGameState();
        this.initElements();
        this.setupEventListeners();
        this.setupGameTimer();
        this.setupCpsCalculation();
        this.setupCoinDrops();
        this.updateDisplay();
        this.showScreen('welcome');
        this.initChallenges();
        this.updateStatsPreview();
        this.renderProfile();
        this.initAudio();
        this.restoreAutoClickers();
        
        // Gestion d'erreur pour l'image PNG
        this.handleImageErrors();
    }

    initAudio() {
        this.initAudioContext = () => {
            if (!this.audioInitialized) {
                try {
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    this.audioInitialized = true;
                } catch (e) {
                    this.soundEnabled = false;
                }
            }
        };
    }

    playSound(type) {
        if (!this.audioInitialized) {
            this.initAudioContext();
        }

        if (!this.audioContext || !this.soundEnabled || !this.audioInitialized) return;

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        // Si c'est un clic MANUEL, jouer un son de pet avec variante aléatoire
        if (type === 'click') {
            this.playFartVariant();
            return;
        }

        // Les auto-clickers ne font plus de sons de pet
        if (type === 'autoClick') {
            // Pas de son pour les auto-clickers
            return;
        }

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            const baseVolume = type === 'autoClick' ? 0.02 : 0.08;

            switch (type) {
                case 'coin':
                    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.2);
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
                    break;
                case 'purchase':
                    oscillator.frequency.setValueAtTime(523, this.audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
                    break;
                case 'levelUp':
                    oscillator.frequency.setValueAtTime(1047, this.audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
                    break;
            }
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);
        } catch (e) {
            console.warn('Audio playback failed:', e);
        }
    }

    // Nouvelle méthode pour jouer des variantes de pet
    playFartVariant(isAutoClick = false) {
        const variant = this.fartSounds[Math.floor(Math.random() * this.fartSounds.length)];
        
        // Charger le fichier audio
        fetch(variant.file)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                // Créer les nœuds audio
                const source = this.audioContext.createBufferSource();
                const gainNode = this.audioContext.createGain();
                
                // Appliquer les modifications
                source.buffer = audioBuffer;
                source.playbackRate.value = variant.rate;
                
                // Volume normal pour les clics manuels
                gainNode.gain.value = variant.volume;
                
                // Connecter les nœuds
                source.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                // Jouer le son
                source.start(0);
            })
            .catch(e => {
                console.warn('Impossible de jouer le son de pet:', e);
                // Fallback vers la méthode simple
                const fartAudio = new Audio('pet.wav');
                fartAudio.volume = 0.3;
                fartAudio.playbackRate = variant.rate;
                fartAudio.play().catch(err => console.warn('Fallback audio failed:', err));
            });
    }

    initElements() {
        // Écrans
        this.elements.welcomeScreen = document.getElementById('welcome-screen');
        this.elements.gameScreen = document.getElementById('game-screen');
        this.elements.shopScreen = document.getElementById('shop-screen');
        this.elements.profileScreen = document.getElementById('profile-screen');

        // Boutons de navigation principaux
        this.elements.newGameBtn = document.getElementById('new-game-btn');
        this.elements.continueGameBtn = document.getElementById('continue-game-btn');
        this.elements.highScoreBtn = document.getElementById('high-score-btn');
        
        // Navigation en bas
        this.elements.homeBtn = document.getElementById('home-btn');
        this.elements.gameBtn = document.getElementById('game-btn');
        this.elements.shopBtn = document.getElementById('shop-btn');
        this.elements.profileBtn = document.getElementById('profile-btn');
        this.elements.backFromShop = document.getElementById('back-from-shop');
        this.elements.backFromProfile = document.getElementById('back-from-profile');

        // Point rouge notification
        this.elements.notificationDot = document.getElementById('notification-dot');

        // Modal High Score
        this.elements.highScoreModal = document.getElementById('high-score-modal');
        this.elements.closeHighScore = document.getElementById('close-high-score');
        this.elements.bestScore = document.getElementById('best-score');
        this.elements.bestLevel = document.getElementById('best-level');
        this.elements.bestCombo = document.getElementById('best-combo');
        this.elements.totalTime = document.getElementById('total-time');

        // Éléments de jeu
        this.elements.mainClicker = document.getElementById('main-clicker');
        this.elements.mainIcon = document.getElementById('main-icon');
        this.elements.score = document.getElementById('score');
        this.elements.coins = document.getElementById('coins');
        this.elements.level = document.getElementById('level');
        this.elements.xpProgress = document.getElementById('xp-progress');
        this.elements.currentXp = document.getElementById('current-xp');
        this.elements.neededXp = document.getElementById('needed-xp');

        // Stats rapides
        this.elements.totalClicksDisplay = document.getElementById('total-clicks-display');
        this.elements.clicksPerSecond = document.getElementById('clicks-per-second');

        // Particules et effets
        this.elements.particles = document.getElementById('particles');
        this.elements.boostBanner = document.getElementById('boost-banner');
        this.elements.boostTimer = document.getElementById('boost-timer-value');
        this.elements.comboDisplay = document.getElementById('combo-display');
        this.elements.comboMultiplier = document.getElementById('combo-multiplier');
        this.elements.notificationsContainer = document.getElementById('notifications-container');

        // Auto-clickers et couleurs
        this.elements.autoClickersList = document.getElementById('auto-clickers-list');
        console.log('[initElements] autoClickersList:', this.elements.autoClickersList);
        this.elements.gameAutoClickersList = document.getElementById('game-auto-clickers-list');
        console.log('[initElements] gameAutoClickersList:', this.elements.gameAutoClickersList);
        this.elements.activeAutoClickers = document.getElementById('active-auto-clickers');
        console.log('[initElements] activeAutoClickers:', this.elements.activeAutoClickers);

        // Défis
        this.elements.challengesList = document.getElementById('challenges-list');

        // Boutique
        this.elements.shopCoinsValue = document.getElementById('shop-coins-value');
        console.log('[initElements] shopCoinsValue:', this.elements.shopCoinsValue);
        
        // Profil
        this.elements.profileLevel = document.getElementById('profile-level');
        this.elements.playTime = document.getElementById('play-time');
        this.elements.totalClicks = document.getElementById('total-clicks');
        this.elements.manualClicks = document.getElementById('manual-clicks');
        this.elements.totalCoinsEarned = document.getElementById('total-coins-earned');
        this.elements.maxLevel = document.getElementById('max-level');
        this.elements.maxCombo = document.getElementById('max-combo');
        this.elements.achievementsList = document.getElementById('achievements-list');

        // Autres
        this.elements.confirmOverlay = document.getElementById('confirm-overlay');
        this.elements.confirmNewGame = document.getElementById('confirm-new-game');
        this.elements.cancelNewGame = document.getElementById('cancel-new-game');

        // Stats preview
        this.elements.savedScore = document.getElementById('saved-score');
        this.elements.savedLevel = document.getElementById('saved-level');
        this.elements.savedCoins = document.getElementById('saved-coins');
    }

    setupEventListeners() {
        // Navigation principale
        if (this.elements.newGameBtn) {
            this.elements.newGameBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.initAudioContext();
                this.showNewGameConfirm();
            });
        }
        if (this.elements.continueGameBtn) {
            this.elements.continueGameBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.initAudioContext();
                this.startGame();
                this.showScreen('game');
            });
        }
        if (this.elements.highScoreBtn) {
            this.elements.highScoreBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.initAudioContext();
                this.showHighScore();
            });
        }
        
        // Navigation en bas - CORRECTION DES LIENS
        if (this.elements.homeBtn) {
            this.elements.homeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showScreen('welcome');
            });
            this.elements.homeBtn.querySelectorAll('*').forEach(child => {
                child.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showScreen('welcome');
                });
            });
        }
        if (this.elements.gameBtn) {
            this.elements.gameBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showScreen('game');
            });
            this.elements.gameBtn.querySelectorAll('*').forEach(child => {
                child.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showScreen('game');
                });
            });
        }
        if (this.elements.shopBtn) {
            // Supprime tous les anciens event listeners (sécurité)
            this.elements.shopBtn.replaceWith(this.elements.shopBtn.cloneNode(true));
            this.elements.shopBtn = document.getElementById('shop-btn');
            this.elements.shopBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showScreen('shop');
            });
            this.elements.shopBtn.querySelectorAll('*').forEach(child => {
                child.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showScreen('shop');
                });
            });
        }
        if (this.elements.profileBtn) {
            // Supprime tous les anciens event listeners (sécurité)
            this.elements.profileBtn.replaceWith(this.elements.profileBtn.cloneNode(true));
            this.elements.profileBtn = document.getElementById('profile-btn');
            this.elements.profileBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showScreen('profil');
            });
            this.elements.profileBtn.querySelectorAll('*').forEach(child => {
                child.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showScreen('profil');
                });
            });
        }
        if (this.elements.backFromShop) {
            this.elements.backFromShop.addEventListener('click', (e) => {
                e.preventDefault();
                this.showScreen('game');
            });
        }
        if (this.elements.backFromProfile) {
            this.elements.backFromProfile.addEventListener('click', (e) => {
                e.preventDefault();
                this.showScreen('game');
            });
        }

        // High Score Modal
        if (this.elements.closeHighScore) {
            this.elements.closeHighScore.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideHighScore();
            });
        }
        if (this.elements.highScoreModal) {
            this.elements.highScoreModal.addEventListener('click', (e) => {
                if (e.target === this.elements.highScoreModal) {
                    this.hideHighScore();
                }
            });
        }

        // Clic principal avec support tactile
        if (this.elements.mainClicker) {
            this.elements.mainClicker.addEventListener('click', (e) => {
                e.preventDefault();
                this.initAudioContext();
                this.handleMainClick(e);
            });
            this.elements.mainClicker.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.initAudioContext();
                this.handleMainClick(e);
            });
        }

        // Nouvelle partie
        if (this.elements.confirmNewGame) {
            this.elements.confirmNewGame.addEventListener('click', (e) => {
                e.preventDefault();
                this.newGame();
                this.showScreen('game');
            });
        }
        if (this.elements.cancelNewGame) {
            this.elements.cancelNewGame.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideNewGameConfirm();
            });
        }
        if (this.elements.confirmOverlay) {
            this.elements.confirmOverlay.addEventListener('click', (e) => {
                if (e.target === this.elements.confirmOverlay) {
                    this.hideNewGameConfirm();
                }
            });
        }

        // Auto-activation audio
        document.addEventListener('click', () => {
            this.initAudioContext();
        });
        
        document.addEventListener('touchstart', () => {
            this.initAudioContext();
        });
    }

    setupGameTimer() {
        this.gameTimer = setInterval(() => {
            if (this.currentScreen === 'game') {
                this.gameState.playTime++;
                this.gameState.totalPlayTime++;
                this.updateCombo();
                this.updateBoostCooldown();
                this.updateChallengeTimers();
                this.saveGameState();
            }
        }, 1000);
    }

    setupCpsCalculation() {
        this.cpsCalculationInterval = setInterval(() => {
            const now = Date.now();
            this.gameState.recentClicks = this.gameState.recentClicks.filter(
                clickTime => now - clickTime < 5000
            );
            this.gameState.clicksPerSecond = this.gameState.recentClicks.length / 5;
            this.updateClicksPerSecondDisplay();
        }, 100);
    }

    setupCoinDrops() {
        this.coinDropInterval = setInterval(() => {
            if (this.currentScreen === 'game' && Math.random() < 0.1) {
                this.createCoinDrop();
            }
        }, 5000);
    }

    createCoinDrop() {
        if (!this.elements.mainClicker) return;
        
        const rect = this.elements.mainClicker.getBoundingClientRect();
        const x = rect.left + Math.random() * rect.width;
        const y = rect.top + Math.random() * rect.height;
        
        this.createCoinParticle(x, y);
        this.gameState.coins += 5;
        this.gameState.totalCoinsEarned += 5;
        this.playSound('coin');
        this.updateDisplay();
    }

    createCoinParticle(x, y) {
        if (!this.elements.particles) return;
        
        const particle = document.createElement('img');
        particle.className = 'particle';
        particle.src = 'icone.png';
        particle.alt = 'Pièce';
        particle.draggable = false;
        particle.style.width = '32px';
        particle.style.height = '32px';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.animation = 'coinFloat 3s ease-out forwards';
        particle.style.filter = 'drop-shadow(1px 2px 0 #DAA520)';
        
        // Appliquer la couleur sélectionnée si c'est un span (fallback)
        if (particle.tagName === 'SPAN') {
            particle.style.color = '#8B4513';
        }
        
        // Animation pixel art chute
        particle.style.animation = 'poopDrop 1.2s steps(6) forwards';
        this.elements.particles.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 3000);
    }

    // Système de défis
    initChallenges() {
        this.config.challenges.forEach(challenge => {
            if (!this.gameState.completedChallenges[challenge.id]) {
                this.gameState.activeChallenges[challenge.id] = {
                    progress: 0,
                    startTime: null,
                    active: false
                };
            }
        });
        this.renderChallenges();
    }

    startChallenge(challengeId) {
        const challenge = this.config.challenges.find(c => c.id === challengeId);
        if (!challenge || this.gameState.completedChallenges[challengeId]) return;

        this.gameState.activeChallenges[challengeId] = {
            progress: 0,
            startTime: Date.now(),
            active: true
        };

        if (challenge.type === 'temporal') {
            this.challengeTimers[challengeId] = setTimeout(() => {
                this.failChallenge(challengeId);
            }, challenge.timeLimit * 1000);
        }

        this.renderChallenges();
        this.showNotification(`🎯 Défi "${challenge.name}" commencé !`);
    }

    updateChallengeProgress(challengeId, amount = 1) {
        if (!this.gameState.activeChallenges[challengeId] || this.gameState.completedChallenges[challengeId]) return;

        const challenge = this.config.challenges.find(c => c.id === challengeId);
        if (!challenge) return;

        if (challenge.type === 'cumulative') {
            this.gameState.activeChallenges[challengeId].progress = this.gameState.totalClicks;
        } else if (challenge.type === 'combo') {
            this.gameState.activeChallenges[challengeId].progress = Math.floor(this.gameState.maxCombo);
        } else if (challenge.type === 'level') {
            this.gameState.activeChallenges[challengeId].progress = this.gameState.maxLevel;
        } else {
            this.gameState.activeChallenges[challengeId].progress += amount;
        }
        
        if (this.gameState.activeChallenges[challengeId].progress >= challenge.target) {
            this.completeChallenge(challengeId);
        }
    }

    completeChallenge(challengeId) {
        const challenge = this.config.challenges.find(c => c.id === challengeId);
        if (!challenge) return;

        this.gameState.completedChallenges[challengeId] = true;
        this.gameState.coins += challenge.reward;
        this.gameState.totalCoinsEarned += challenge.reward;

        if (this.challengeTimers[challengeId]) {
            clearTimeout(this.challengeTimers[challengeId]);
            delete this.challengeTimers[challengeId];
        }

        this.playSound('coin');
        this.showNotification(`✅ Défi terminé ! +${challenge.reward} pièces`);
        this.renderChallenges();
        this.updateDisplay();
    }

    failChallenge(challengeId) {
        const challenge = this.config.challenges.find(c => c.id === challengeId);
        if (!challenge) return;

        this.gameState.activeChallenges[challengeId] = {
            progress: 0,
            startTime: null,
            active: false
        };

        this.showNotification(`❌ Défi "${challenge.name}" échoué !`);
        this.renderChallenges();
    }

    updateChallengeTimers() {
        Object.keys(this.gameState.activeChallenges).forEach(challengeId => {
            const challengeState = this.gameState.activeChallenges[challengeId];
            const challenge = this.config.challenges.find(c => c.id === challengeId);
            
            if (challengeState.active && challenge.type === 'temporal' && challengeState.startTime) {
                const elapsed = (Date.now() - challengeState.startTime) / 1000;
                const remaining = challenge.timeLimit - elapsed;
                
                if (remaining <= 0) {
                    this.failChallenge(challengeId);
                }
            }
        });
    }

    renderChallenges() {
        if (!this.elements.challengesList) return;

        this.elements.challengesList.innerHTML = '';
        this.config.challenges.forEach(challenge => {
            const completed = this.gameState.completedChallenges[challenge.id];
            const challengeState = this.gameState.activeChallenges[challenge.id];
            const active = challengeState && challengeState.active;

            const item = document.createElement('div');
            item.className = `challenge-item ${completed ? 'completed' : ''} ${active ? 'active' : ''}`;
            
            let content = `
                <div class="challenge-name">${challenge.name}</div>
                <div class="challenge-description">${challenge.description}</div>
                <div class="challenge-reward">Récompense: ${challenge.reward} 🪙</div>
            `;

            if (completed) {
                content += '<div class="challenge-progress">✅ Terminé</div>';
            } else if (active) {
                if (challenge.type === 'temporal' && challengeState.startTime) {
                    const elapsed = (Date.now() - challengeState.startTime) / 1000;
                    const remaining = Math.max(0, challenge.timeLimit - elapsed);
                    content += `<div class="challenge-timer">${remaining.toFixed(1)}s</div>`;
                }
                content += `<div class="challenge-progress">${challengeState.progress}/${challenge.target}</div>`;
            } else {
                content += '<div class="challenge-progress">Défi automatique</div>';
            }

            item.innerHTML = content;

            this.elements.challengesList.appendChild(item);
        });
    }

    startGame() {
        this.showScreen('game');
        this.renderShop();
        this.renderGameAutoClickers();
        this.renderActiveAutoClickers();
        this.renderChallenges();
        this.renderProfile();
        this.updateDisplay();
    }

    showScreen(screenName) {
        console.log('[showScreen] Appel avec', screenName);
        // Masquer tous les écrans
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Désactiver tous les boutons de navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('nav-btn--active');
        });

        // Afficher l'écran cible
        const targetScreen = document.getElementById(`${screenName}-screen`);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
            // Scroll en haut du container principal
            if (targetScreen.querySelector('.game-main')) {
                targetScreen.querySelector('.game-main').scrollTop = 0;
            }
            if (targetScreen.querySelector('.shop-main')) {
                targetScreen.querySelector('.shop-main').scrollTop = 0;
            }
            if (targetScreen.querySelector('.profile-main')) {
                targetScreen.querySelector('.profile-main').scrollTop = 0;
            }
            console.log('[showScreen] Ecran affiché :', targetScreen.id);
        } else {
            console.warn('[showScreen] Ecran non trouvé pour', screenName);
        }

        // Nettoyer les particules si on quitte la page de jeu
        if (screenName !== 'game') {
            this.cleanupParticles();
        }

        // Activer le bon bouton de navigation
        if (screenName === 'welcome') {
            this.elements.homeBtn?.classList.add('nav-btn--active');
        } else if (screenName === 'game') {
            this.elements.gameBtn?.classList.add('nav-btn--active');
        } else if (screenName === 'shop') {
            this.elements.shopBtn?.classList.add('nav-btn--active');
        } else if (screenName === 'profil') {
            this.elements.profileBtn?.classList.add('nav-btn--active');
        }

        // Mettre à jour le contenu spécifique à chaque écran
        if (screenName === 'shop') {
            console.log('[showScreen] Appel de renderShop() pour l\'écran boutique');
            this.renderShop();
        } else if (screenName === 'profil') {
            console.log('[showScreen] Appel de renderProfile() pour l\'écran profil');
            this.renderProfile();
        } else if (screenName === 'welcome') {
            console.log('[showScreen] Appel de updateStatsPreview() pour l\'écran accueil');
            this.updateStatsPreview();
        } else if (screenName === 'game') {
            console.log('[showScreen] Appel de renderGameAutoClickers() pour l\'écran jeu');
            this.renderGameAutoClickers();
        }
    }

    // Nouvelle méthode pour nettoyer les particules
    cleanupParticles() {
        if (this.elements.particles) {
            this.elements.particles.innerHTML = '';
        }
        this.particles = [];
    }

    showNewGameConfirm() {
        if (this.elements.confirmOverlay) {
            this.elements.confirmOverlay.classList.add('active');
        }
    }

    hideNewGameConfirm() {
        if (this.elements.confirmOverlay) {
            this.elements.confirmOverlay.classList.remove('active');
        }
    }

    showHighScore() {
        if (this.elements.bestScore) {
            this.elements.bestScore.textContent = this.formatNumber(Math.floor(this.gameState.bestScore));
        }
        if (this.elements.bestLevel) {
            this.elements.bestLevel.textContent = this.gameState.bestLevel;
        }
        if (this.elements.bestCombo) {
            this.elements.bestCombo.textContent = this.gameState.bestCombo.toFixed(1);
        }
        if (this.elements.totalTime) {
            this.elements.totalTime.textContent = this.formatTime(this.gameState.totalPlayTime);
        }
        if (this.elements.highScoreModal) {
            this.elements.highScoreModal.classList.add('active');
        }
    }

    hideHighScore() {
        if (this.elements.highScoreModal) {
            this.elements.highScoreModal.classList.remove('active');
        }
    }

    handleMainClick(e) {
        const currentTime = Date.now();
        const clickPower = this.gameState.boostActive ? 10 : 1;
        const finalPower = clickPower * this.gameState.comboMultiplier;
        
        this.gameState.score += finalPower;
        this.gameState.totalClicks++;
        this.gameState.manualClicks++;
        this.gameState.xp += finalPower;
        this.gameState.profileXP += finalPower;
        this.gameState.coins += 1;
        this.gameState.totalCoinsEarned += 1;

        // Suivi des clics pour CPS
        this.gameState.recentClicks.push(currentTime);
        this.gameState.lastClickTime = currentTime;

        // Mise à jour des défis automatiquement
        this.updateChallengeProgress('clicks200');
        
        // Défis de vitesse - déclenchement automatique
        Object.keys(this.gameState.activeChallenges).forEach(challengeId => {
            const challengeState = this.gameState.activeChallenges[challengeId];
            const challenge = this.config.challenges.find(c => c.id === challengeId);
            
            if (challengeState.active && challenge.type === 'temporal') {
                this.updateChallengeProgress(challengeId);
            }
        });

        // Vérifier les défis de vitesse automatiquement
        this.checkSpeedChallenges();

        // Son et effets
        this.playSound('click');
        
        // Particules avec couleur sélectionnée
        const particleCount = this.gameState.boostActive ? 8 : Math.floor(Math.random() * 6) + 5;
        const rect = this.elements.mainClicker.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        this.createParticles(centerX, centerY, particleCount, 'manual');
        
        this.animateClickEffect();

        // Combo
        this.updateComboMultiplier();

        // Vérification du niveau
        this.checkLevelUp();
        this.checkAchievements();
        this.updateDisplay();
    }

    updateComboMultiplier() {
        this.gameState.comboTimer = 3;
        this.gameState.comboMultiplier = Math.min(this.gameState.comboMultiplier + 0.2, 5);
        
        this.gameState.maxCombo = Math.max(this.gameState.maxCombo, this.gameState.comboMultiplier);
        
        // Mise à jour des défis de combo
        this.updateChallengeProgress('combo3');
        
        if (this.gameState.comboMultiplier > 1 && this.elements.comboDisplay && this.elements.comboMultiplier) {
            this.elements.comboDisplay.classList.add('active');
            this.elements.comboMultiplier.textContent = this.gameState.comboMultiplier.toFixed(1);
        }
    }

    updateCombo() {
        if (this.gameState.comboTimer > 0) {
            this.gameState.comboTimer--;
        } else {
            this.gameState.comboMultiplier = 1;
            if (this.elements.comboDisplay) {
                this.elements.comboDisplay.classList.remove('active');
            }
        }
    }

    updateBoostCooldown() {
        const currentTime = Date.now();
        const timeSinceLastBoost = currentTime - this.gameState.lastBoostTime;
        const cooldownTime = 5 * 60 * 1000;
        
        if (timeSinceLastBoost >= cooldownTime && !this.gameState.boostActive) {
            this.gameState.boostCooldown = 0;
        } else {
            this.gameState.boostCooldown = Math.max(0, cooldownTime - timeSinceLastBoost);
        }
    }

    checkLevelUp() {
        const levelData = this.config.levels.find(l => l.name === `Niveau ${this.gameState.level + 1}`);
        if (levelData && this.gameState.xp >= levelData.threshold) {
            const oldLevel = this.gameState.level;
            this.gameState.level++;
            this.gameState.maxLevel = Math.max(this.gameState.maxLevel, this.gameState.level);
            
            if (this.gameState.level > oldLevel) {
                this.activateBoost();
                this.playSound('levelUp');
                this.showNotification('🎉 Niveau supérieur !');
                this.updateChallengeProgress('level5');
                
                // Démarrer la musique au niveau 10
                if (this.gameState.level === 10 && !this.musicStarted) {
                    this.startBackgroundMusic();
                }
            }
        }
    }

    activateBoost() {
        const currentTime = Date.now();
        const timeSinceLastBoost = currentTime - this.gameState.lastBoostTime;
        const cooldownTime = 5 * 60 * 1000;
        
        if (timeSinceLastBoost < cooldownTime) {
            return;
        }
        
        this.gameState.boostActive = true;
        this.gameState.boostTimer = 30;
        this.gameState.lastBoostTime = currentTime;
        
        if (this.elements.boostBanner) {
            this.elements.boostBanner.classList.add('active');
        }
        
        this.boostInterval = setInterval(() => {
            this.gameState.boostTimer--;
            if (this.elements.boostTimer) {
                this.elements.boostTimer.textContent = this.gameState.boostTimer;
            }
            
            if (this.gameState.boostTimer <= 0) {
                this.deactivateBoost();
            }
        }, 1000);
    }

    deactivateBoost() {
        this.gameState.boostActive = false;
        if (this.elements.boostBanner) {
            this.elements.boostBanner.classList.remove('active');
        }
        if (this.boostInterval) {
            clearInterval(this.boostInterval);
            this.boostInterval = null;
        }
    }

    createParticles(x, y, count, type = 'manual') {
        if (!this.elements.particles || this.currentScreen !== 'game') return;
        const container = this.elements.particles;
        
        // Jouer un son de pet SEULEMENT pour les clics manuels
        if (type === 'manual') {
            this.playFartVariant();
        }
        
        // Limiter le nombre de particules pour les auto-clickers
        const maxParticlesForType = type === 'auto' ? 50 : this.maxParticles;
        
        for (let i = 0; i < count && this.particles.length < maxParticlesForType; i++) {
            const particle = document.createElement('img');
            particle.className = 'particle pixel-poop';
            particle.src = 'icone.png';
            particle.alt = 'Caca pixel art';
            particle.draggable = false;
            
            // Position X aléatoire sur la largeur de l'écran
            const screenW = window.innerWidth;
            const px = Math.random() * (screenW - 40) + 20;
            particle.style.left = px + 'px';
            particle.style.top = '-48px';
            particle.style.width = '40px';
            particle.style.height = '40px';
            particle.style.position = 'fixed';
            particle.style.zIndex = '2000';
            particle.style.filter = 'drop-shadow(2px 4px 0 #7c5a2a)';
            
            // Appliquer la couleur sélectionnée si c'est un span (fallback)
            if (particle.tagName === 'SPAN') {
                particle.style.color = '#8B4513';
            }
            
            // Animation pixel art chute (plus courte pour les auto-clickers)
            const animationDuration = type === 'auto' ? '0.8s' : '1.2s';
            particle.style.animation = `poopDrop ${animationDuration} steps(6) forwards`;
            container.appendChild(particle);
            this.particles.push(particle);
            
            // Nettoyage plus rapide pour les auto-clickers
            const cleanupTime = type === 'auto' ? 800 : 1200;
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
                this.particles = this.particles.filter(p => p !== particle);
            }, cleanupTime);
        }
    }

    animateClickEffect() {
        if (this.elements.mainClicker) {
            const effect = this.elements.mainClicker.querySelector('.click-effect');
            if (effect) {
                effect.classList.remove('animate');
                effect.offsetHeight;
                effect.classList.add('animate');
            }
        }
    }

    // Auto-clickers
    purchaseAutoClicker(index) {
        const autoClicker = this.config.autoClickers[index];
        const owned = this.gameState.autoClickers[index] || 0;
        const cost = autoClicker.baseCost * Math.pow(2, owned);
        
        if (this.gameState.coins >= cost) {
            this.gameState.coins -= cost;
            this.gameState.autoClickers[index] = owned + 1;
            
            this.playSound('purchase');
            this.setupAutoClicker(index);
            this.checkAchievements();
            this.renderShop();
            this.renderGameAutoClickers();
            this.renderActiveAutoClickers();
            this.updateDisplay();
            this.showNotification(`${autoClicker.name} acheté !`);
        }
    }

    setupAutoClicker(index) {
        const autoClicker = this.config.autoClickers[index];
        const intervalKey = `auto_${index}`;
        
        console.log(`[setupAutoClicker] Configuration de ${autoClicker.name} (index: ${index})`);
        
        if (this.autoClickerIntervals[intervalKey]) {
            console.log(`[setupAutoClicker] Nettoyage de l'ancien intervalle pour ${autoClicker.name}`);
            clearInterval(this.autoClickerIntervals[intervalKey]);
        }
        
        // Cache la position du bouton pour éviter getBoundingClientRect() répété
        let cachedRect = null;
        let lastRectUpdate = 0;
        
        this.autoClickerIntervals[intervalKey] = setInterval(() => {
            // Vérification stricte de l'écran actif
            if (this.currentScreen !== 'game') {
                console.log(`[setupAutoClicker] ${autoClicker.name} ignoré - écran actuel: ${this.currentScreen}`);
                return;
            }
            
            console.log(`[setupAutoClicker] ${autoClicker.name} génère un clic automatique`);
            
            // Calcul du bonus de boost
            const boostMultiplier = this.gameState.boostActive ? 10 : 1;
            const finalPoints = 1 * boostMultiplier;
            
            this.gameState.score += finalPoints;
            this.gameState.xp += finalPoints;
            this.gameState.profileXP += finalPoints;
            this.gameState.totalClicks++;
            this.gameState.coins += 1;
            this.gameState.totalCoinsEarned += 1;
            
            // Optimisation : cache la position du bouton (mise à jour toutes les 2 secondes)
            const now = Date.now();
            if (!cachedRect || now - lastRectUpdate > 2000) {
                cachedRect = this.elements.mainClicker?.getBoundingClientRect();
                lastRectUpdate = now;
            }
            
            // Particules des auto-clickers (optimisées)
            if (cachedRect) {
                const centerX = cachedRect.left + cachedRect.width / 2 + (Math.random() - 0.5) * 80;
                const centerY = cachedRect.top + cachedRect.height / 2 + (Math.random() - 0.5) * 80;
                this.createParticles(centerX, centerY, 1, 'auto'); // Réduit à 1 particule
            }
            
            this.checkLevelUp();
            this.updateDisplay();
        }, autoClicker.speed);
        
        console.log(`[setupAutoClicker] ${autoClicker.name} configuré avec intervalle de ${autoClicker.speed}ms`);
    }

    restoreAutoClickers() {
        Object.keys(this.gameState.autoClickers).forEach(index => {
            if (this.gameState.autoClickers[index] > 0) {
                this.setupAutoClicker(parseInt(index));
            }
        });
    }

    renderShop() {
        console.log('[renderShop] Début du rendu de la boutique');
        
        if (!this.elements.shopCoinsValue) {
            console.error('[renderShop] shopCoinsValue non trouvé');
            return;
        }
        
        console.log('[renderShop] Mise à jour des pièces:', this.gameState.coins);
        this.elements.shopCoinsValue.textContent = this.formatNumber(this.gameState.coins);
        
        if (!this.elements.autoClickersList) {
            console.error('[renderShop] autoClickersList non trouvé');
            return;
        }
        
        console.log('[renderShop] Génération des auto-clickers');
        this.elements.autoClickersList.innerHTML = '';
        this.config.autoClickers.forEach((autoClicker, index) => {
            const owned = this.gameState.autoClickers[index] || 0;
            const cost = autoClicker.baseCost * Math.pow(2, owned);
            const canAfford = this.gameState.coins >= cost;
            
            console.log(`[renderShop] ${autoClicker.name}: possédés=${owned}, coût=${cost}, peutAcheter=${canAfford}`);
            
            const item = document.createElement('div');
            item.className = 'shop-item';
            
            const iconDiv = document.createElement('div');
            iconDiv.className = 'shop-item-icon';
            iconDiv.textContent = autoClicker.icon;
            
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'shop-item-details';
            detailsDiv.innerHTML = `
                <h4>${autoClicker.name}</h4>
                <p>${autoClicker.cacasPerSec} cacas/sec • Possédés: ${owned}</p>
            `;
            
            const priceDiv = document.createElement('div');
            priceDiv.className = 'shop-item-price';
            priceDiv.innerHTML = `💰 ${this.formatNumber(cost)}`;
            
            const button = document.createElement('button');
            button.className = `btn ${canAfford ? 'btn--primary' : 'btn--secondary'}`;
            button.textContent = 'Acheter';
            button.disabled = !canAfford;
            
            if (canAfford) {
                const handlePurchase = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`[renderShop] Achat de ${autoClicker.name}`);
                    this.purchaseAutoClicker(index);
                };
                button.addEventListener('click', handlePurchase);
                button.addEventListener('touchend', handlePurchase);
            }
            
            item.appendChild(iconDiv);
            item.appendChild(detailsDiv);
            item.appendChild(priceDiv);
            item.appendChild(button);
            this.elements.autoClickersList.appendChild(item);
        });
        
        console.log('[renderShop] Rendu terminé');
    }

    renderProfile() {
        if (!this.elements.profileLevel) return;
        
        this.elements.profileLevel.textContent = this.gameState.profileLevel;
        if (this.elements.playTime) {
            this.elements.playTime.textContent = this.formatTime(this.gameState.playTime);
        }
        if (this.elements.totalClicks) {
            this.elements.totalClicks.textContent = this.formatNumber(this.gameState.totalClicks);
        }
        if (this.elements.manualClicks) {
            this.elements.manualClicks.textContent = this.formatNumber(this.gameState.manualClicks);
        }
        if (this.elements.totalCoinsEarned) {
            this.elements.totalCoinsEarned.textContent = this.formatNumber(this.gameState.totalCoinsEarned);
        }
        if (this.elements.maxLevel) {
            this.elements.maxLevel.textContent = this.gameState.maxLevel;
        }
        if (this.elements.maxCombo) {
            this.elements.maxCombo.textContent = this.gameState.maxCombo.toFixed(1) + 'x';
        }
        
        if (this.elements.achievementsList) {
            this.elements.achievementsList.innerHTML = '';
            this.config.achievements.forEach(achievement => {
                const completed = this.checkAchievementCompletion(achievement);
                const item = document.createElement('div');
                item.className = `achievement-item ${completed ? 'completed' : ''}`;
                item.innerHTML = `
                    <div class="achievement-name">${achievement.icon} ${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                `;
                this.elements.achievementsList.appendChild(item);
            });
        }
        
        // Rendre les défis dans le profil
        this.renderChallenges();
        
        this.renderActiveAutoClickers();
    }

    renderActiveAutoClickers() {
        if (!this.elements.activeAutoClickers) return;
        
        const activeEntries = Object.entries(this.gameState.autoClickers).filter(([, count]) => count > 0);
        
        if (activeEntries.length === 0) {
            this.elements.activeAutoClickers.innerHTML = '<p class="no-active">Aucun auto-clicker actif</p>';
        } else {
            this.elements.activeAutoClickers.innerHTML = '';
            activeEntries.forEach(([index, count]) => {
                const autoClicker = this.config.autoClickers[parseInt(index)];
                const baseRate = autoClicker.cacasPerSec * count;
                const boostMultiplier = this.gameState.boostActive ? 10 : 1;
                const totalRate = (baseRate * boostMultiplier).toFixed(1);
                const item = document.createElement('div');
                item.className = 'active-item';
                
                let boostIndicator = '';
                if (this.gameState.boostActive) {
                    boostIndicator = ' 🔥';
                }
                
                item.innerHTML = `
                    <span>${autoClicker.icon} ${autoClicker.name}</span>
                    <span>×${count} (${totalRate}/s${boostIndicator})</span>
                `;
                this.elements.activeAutoClickers.appendChild(item);
            });
        }
    }

    checkAchievements() {
        this.config.achievements.forEach(achievement => {
            if (!this.gameState.achievements[achievement.id]) {
                if (this.checkAchievementCompletion(achievement)) {
                    this.gameState.achievements[achievement.id] = true;
                    this.showNotification(`🏆 ${achievement.name} !`);
                }
            }
        });
    }

    checkAchievementCompletion(achievement) {
        switch (achievement.type) {
            case 'clicks':
                return this.gameState.totalClicks >= achievement.threshold;
            case 'autoClickers':
                const totalAutoClickers = Object.values(this.gameState.autoClickers).reduce((sum, count) => sum + count, 0);
                return totalAutoClickers >= achievement.threshold;
            case 'level':
                return this.gameState.maxLevel >= achievement.threshold;
            case 'combo':
                return this.gameState.maxCombo >= achievement.threshold;
            case 'coins':
                return this.gameState.coins >= achievement.threshold;
            default:
                return false;
        }
    }

    showNotification(message) {
        this.gameState.hasNotifications = true;
        this.updateNotificationDot();
        
        if (!this.elements.notificationsContainer) return;
        
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        this.elements.notificationsContainer.appendChild(notification);
        this.notifications.push(notification);
        
        setTimeout(() => {
            notification.classList.add('slide-out');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                this.notifications = this.notifications.filter(n => n !== notification);
            }, 300);
        }, 2500);
    }

    updateNotificationDot() {
        if (this.elements.notificationDot) {
            if (this.gameState.hasNotifications) {
                this.elements.notificationDot.classList.remove('hidden');
            } else {
                this.elements.notificationDot.classList.add('hidden');
            }
        }
    }

    updateDisplay() {
        if (this.elements.score) {
            this.elements.score.textContent = this.formatNumber(Math.floor(this.gameState.score));
        }
        if (this.elements.coins) {
            this.elements.coins.textContent = this.formatNumber(this.gameState.coins);
        }
        if (this.elements.level) {
            this.elements.level.textContent = this.gameState.level;
        }
        
        if (this.elements.totalClicksDisplay) {
            this.elements.totalClicksDisplay.textContent = this.formatNumber(this.gameState.totalClicks);
        }
        
        // Barre XP
        if (this.elements.xpProgress && this.elements.currentXp && this.elements.neededXp) {
            const currentLevel = this.config.levels.find(l => l.name === `Niveau ${this.gameState.level}`);
            const nextLevel = this.config.levels.find(l => l.name === `Niveau ${this.gameState.level + 1}`);
            
            if (currentLevel && nextLevel) {
                const currentThreshold = currentLevel.threshold;
                const nextThreshold = nextLevel.threshold;
                const progress = ((this.gameState.xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
                
                this.elements.xpProgress.style.width = Math.max(0, Math.min(100, progress)) + '%';
                this.elements.currentXp.textContent = this.formatNumber(this.gameState.xp - currentThreshold);
                this.elements.neededXp.textContent = this.formatNumber(nextThreshold - currentThreshold);
            }
        }

        // Mettre à jour les auto-clickers sur la page de jeu si on est sur cette page
        if (this.currentScreen === 'game') {
            this.renderGameAutoClickers();
        }

        this.gameState.bestScore = Math.max(this.gameState.bestScore, this.gameState.score);
        this.gameState.bestLevel = Math.max(this.gameState.bestLevel, this.gameState.maxLevel);
        this.gameState.bestCombo = Math.max(this.gameState.bestCombo, this.gameState.maxCombo);
    }

    updateClicksPerSecondDisplay() {
        if (this.elements.clicksPerSecond) {
            this.elements.clicksPerSecond.textContent = this.gameState.clicksPerSecond.toFixed(1);
        }
    }

    updateStatsPreview() {
        if (this.elements.savedScore) {
            this.elements.savedScore.textContent = this.formatNumber(Math.floor(this.gameState.score));
        }
        if (this.elements.savedLevel) {
            this.elements.savedLevel.textContent = this.gameState.level;
        }
        if (this.elements.savedCoins) {
            this.elements.savedCoins.textContent = this.formatNumber(this.gameState.coins);
        }
    }

    formatNumber(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    newGame() {
        const savedAchievements = {...this.gameState.achievements};
        const savedBestScore = this.gameState.bestScore;
        const savedBestLevel = this.gameState.bestLevel;
        const savedBestCombo = this.gameState.bestCombo;
        const savedTotalTime = this.gameState.totalPlayTime;
        
        this.gameState = {
            score: 0,
            coins: 0,
            level: 1,
            xp: 0,
            profileLevel: 1,
            profileXP: 0,
            totalClicks: 0,
            manualClicks: 0,
            totalCoinsEarned: 0,
            maxLevel: 1,
            maxCombo: 1.0,
            playTime: 0,
            comboMultiplier: 1,
            comboTimer: 0,
            boostActive: false,
            boostTimer: 0,
            boostCooldown: 0,
            lastBoostTime: 0,
            autoClickers: {},
            achievements: savedAchievements,
            clicksPerSecond: 0,
            lastClickTime: 0,
            recentClicks: [],
            bestScore: savedBestScore,
            bestLevel: savedBestLevel,
            bestCombo: savedBestCombo,
            totalPlayTime: savedTotalTime,
            activeChallenges: {},
            completedChallenges: {},
            hasNotifications: false,
            coinDrops: []
        };
        
        Object.values(this.autoClickerIntervals).forEach(interval => {
            clearInterval(interval);
        });
        this.autoClickerIntervals = {};
        
        Object.values(this.challengeTimers).forEach(timer => {
            clearTimeout(timer);
        });
        this.challengeTimers = {};
        
        this.deactivateBoost();
        
        this.cleanupParticles();
        if (this.elements.notificationsContainer) {
            this.elements.notificationsContainer.innerHTML = '';
        }
        this.notifications = [];
        
        this.initChallenges();
        this.updateNotificationDot();
        this.saveGameState();
        this.updateDisplay();
        this.hideNewGameConfirm();
        this.startGame();
    }

    saveGameState() {
        try {
            localStorage.setItem('clickPooUltimate', JSON.stringify(this.gameState));
        } catch (e) {
            console.warn('Unable to save game state');
        }
    }

    loadGameState() {
        try {
            const saved = localStorage.getItem('clickPooUltimate');
            if (saved) {
                const loadedState = JSON.parse(saved);
                this.gameState = {...this.gameState, ...loadedState};
                
                // Validation des données
                if (!this.gameState.recentClicks) this.gameState.recentClicks = [];
                if (!this.gameState.activeChallenges) this.gameState.activeChallenges = {};
                if (!this.gameState.completedChallenges) this.gameState.completedChallenges = {};
                if (!this.gameState.hasNotifications) this.gameState.hasNotifications = false;
                if (!this.gameState.coinDrops) this.gameState.coinDrops = [];
            }
        } catch (e) {
            console.warn('Unable to load game state');
        }
    }

    destroy() {
        if (this.gameTimer) clearInterval(this.gameTimer);
        if (this.boostInterval) clearInterval(this.boostInterval);
        if (this.cpsCalculationInterval) clearInterval(this.cpsCalculationInterval);
        if (this.coinDropInterval) clearInterval(this.coinDropInterval);
        Object.values(this.autoClickerIntervals).forEach(interval => {
            clearInterval(interval);
        });
        Object.values(this.challengeTimers).forEach(timer => {
            clearTimeout(timer);
        });
        if (this.audioContext) {
            this.audioContext.close();
        }
        // Arrêter la musique de fond
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic = null;
        }
    }

    // Méthode pour démarrer la musique de fond
    startBackgroundMusic() {
        if (this.musicStarted) return;
        
        // Musique libre de droit (8-bit style)
        const musicUrl = 'https://opengameart.org/sites/default/files/8bit-music.mp3';
        
        this.backgroundMusic = new Audio(musicUrl);
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = 0.2;
        
        this.backgroundMusic.play().then(() => {
            this.musicStarted = true;
            this.showNotification('🎵 Musique de fond activée !');
        }).catch(e => {
            console.warn('Impossible de démarrer la musique:', e);
            // Fallback vers une musique alternative
            this.backgroundMusic = new Audio('https://opengameart.org/sites/default/files/8bit-adventure.mp3');
            this.backgroundMusic.loop = true;
            this.backgroundMusic.volume = 0.2;
            this.backgroundMusic.play().catch(err => console.warn('Musique alternative échouée:', err));
        });
    }

    // Nouvelle méthode pour gérer les erreurs d'images
    handleImageErrors() {
        const mainIcon = this.elements.mainIcon;
        if (mainIcon) {
            mainIcon.onerror = () => {
                console.warn('Impossible de charger icone.png, utilisation du fallback emoji');
                mainIcon.style.display = 'none';
                const fallback = document.createElement('span');
                fallback.textContent = '💩';
                fallback.style.fontSize = 'clamp(60px, 20vw, 100px)';
                fallback.style.color = '#7c5a2a';
                fallback.style.textShadow = '2px 2px #fff';
                mainIcon.parentNode.appendChild(fallback);
            };
        }

        // Gestion des erreurs pour toutes les images de navigation
        const navImages = document.querySelectorAll('.nav-icon[src]');
        navImages.forEach(img => {
            img.onerror = () => {
                console.warn(`Impossible de charger ${img.src}, utilisation du fallback emoji`);
                const fallback = document.createElement('span');
                fallback.textContent = this.getFallbackEmoji(img.src);
                fallback.style.fontSize = 'clamp(16px, 4vw, 24px)';
                fallback.style.filter = 'drop-shadow(1px 1px 0 rgba(0,0,0,0.3))';
                img.parentNode.replaceChild(fallback, img);
            };
        });

        // Gestion des erreurs pour les boutons de retour
        const backImages = document.querySelectorAll('.back-icon[src]');
        backImages.forEach(img => {
            img.onerror = () => {
                console.warn(`Impossible de charger ${img.src}, utilisation du fallback emoji`);
                const fallback = document.createElement('span');
                fallback.textContent = '⬅️';
                fallback.style.fontSize = 'clamp(16px, 4vw, 24px)';
                fallback.style.filter = 'drop-shadow(1px 1px 0 rgba(0,0,0,0.3))';
                img.parentNode.replaceChild(fallback, img);
            };
        });

        // Gestion des erreurs pour l'image d'accueil
        const welcomeImage = document.querySelector('.welcome-image');
        if (welcomeImage) {
            welcomeImage.onerror = () => {
                console.warn('Impossible de charger accueil.png, utilisation du fallback emoji');
                welcomeImage.style.display = 'none';
                const fallback = document.createElement('span');
                fallback.textContent = '🏠';
                fallback.style.fontSize = 'clamp(60px, 20vw, 100px)';
                fallback.style.filter = 'drop-shadow(3px 3px 0 rgba(0,0,0,0.3))';
                welcomeImage.parentNode.appendChild(fallback);
            };
        }
    }

    // Méthode pour obtenir l'emoji de fallback approprié
    getFallbackEmoji(src) {
        if (src.includes('accueil.png')) return '🏠';
        if (src.includes('jeu.png')) return '🎮';
        if (src.includes('profil.png')) return '👤';
        if (src.includes('fleche.png')) return '⬅️';
        return '❓';
    }

    // Nouvelle méthode pour vérifier les défis de vitesse automatiquement
    checkSpeedChallenges() {
        // Défi "Tape en 7 secondes" - se déclenche automatiquement après 5 clics
        if (this.gameState.manualClicks >= 5 && !this.gameState.activeChallenges['tap7']?.active && !this.gameState.completedChallenges['tap7']) {
            this.startChallenge('tap7');
        }
        
        // Défi "Tape en 10 secondes" - se déclenche automatiquement après 10 clics
        if (this.gameState.manualClicks >= 10 && !this.gameState.activeChallenges['tap10']?.active && !this.gameState.completedChallenges['tap10']) {
            this.startChallenge('tap10');
        }
    }

    // Nouvelle méthode pour rendre les auto-clickers sur la page de jeu
    renderGameAutoClickers() {
        if (!this.elements.gameAutoClickersList) return;
        
        this.elements.gameAutoClickersList.innerHTML = '';
        this.config.autoClickers.forEach((autoClicker, index) => {
            const owned = this.gameState.autoClickers[index] || 0;
            const cost = autoClicker.baseCost * Math.pow(2, owned);
            const canAfford = this.gameState.coins >= cost;
            
            const card = document.createElement('div');
            card.className = `auto-clicker-card ${!canAfford ? 'disabled' : ''}`;
            
            card.innerHTML = `
                <span class="auto-clicker-icon">${autoClicker.icon}</span>
                <div class="auto-clicker-name">${autoClicker.name}</div>
                <div class="auto-clicker-rate">${autoClicker.cacasPerSec}/sec</div>
                <div class="auto-clicker-price">💰 ${this.formatNumber(cost)}</div>
                <div class="auto-clicker-owned">Possédés: ${owned}</div>
            `;
            
            if (canAfford) {
                const handlePurchase = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.purchaseAutoClicker(index);
                };
                card.addEventListener('click', handlePurchase);
                card.addEventListener('touchend', handlePurchase);
            }
            
            this.elements.gameAutoClickersList.appendChild(card);
        });
    }
}

// Initialisation du jeu
let game;

document.addEventListener('DOMContentLoaded', () => {
    console.log('[INIT] DOMContentLoaded');
    game = new ClickPooUltimate();
});

window.addEventListener('beforeunload', () => {
    if (game) {
        game.saveGameState();
        game.destroy();
    }
});

// Gestion des événements tactiles pour mobile
document.addEventListener('touchstart', function(e) {
    if (e.touches.length > 1) {
        e.preventDefault();
    }
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, { passive: false });