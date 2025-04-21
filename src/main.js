import axios from 'axios';

// Variables globales
const API_KEY = localStorage.getItem('weatheryn_api_key') || 'b55a4a30fa067e687caeb099d2b62dd6';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Idioma actual - valor predeterminado: español
let currentLanguage = localStorage.getItem('weatheryn_language') || 'es';

// Función para establecer el idioma
function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('weatheryn_language', lang);
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}

// Función para obtener una traducción
function t(key, lang = currentLanguage) {
    const translations = {
        es: {
            search: 'Buscar una ubicación...',
            currentLocation: 'Ubicación actual',
            sunrise: 'Amanecer',
            sunset: 'Atardecer',
            daylight: 'de luz solar'
        },
        en: {
            search: 'Search for a location...',
            currentLocation: 'Current Location',
            sunrise: 'Sunrise',
            sunset: 'Sunset',
            daylight: 'of daylight'
        },
        fr: {
            search: 'Rechercher un lieu...',
            currentLocation: 'Position actuelle',
            sunrise: 'Lever du soleil',
            sunset: 'Coucher du soleil',
            daylight: 'de lumière du jour'
        },
        pt: {
            search: 'Buscar um local...',
            currentLocation: 'Localização atual',
            sunrise: 'Nascer do sol',
            sunset: 'Pôr do sol',
            daylight: 'de luz solar'
        },
        de: {
            search: 'Einen Ort suchen...',
            currentLocation: 'Aktueller Standort',
            sunrise: 'Sonnenaufgang',
            sunset: 'Sonnenuntergang',
            daylight: 'Tageslicht'
        }
    };
    
    if (translations[lang] && translations[lang][key]) {
        return translations[lang][key];
    }
    
    // Fallback a español
    return translations.es[key] || key;
}

// Sistema de internacionalización
const translations = {
    es: {
        search: 'Buscar una ubicación...',
        currentLocation: 'Ubicación actual',
        feelsLike: 'Sensación térmica',
        wind: 'Viento',
        humidity: 'Humedad',
        visibility: 'Visibilidad',
        pressure: 'Presión',
        hourlyForecast: 'Pronóstico por hora',
        now: 'Ahora',
        airQuality: 'Calidad del aire',
        airQualityGood: 'Buena',
        airQualityModerate: 'Moderada',
        airQualityUnhealthySensitive: 'Mala para sensibles',
        airQualityUnhealthy: 'Mala',
        airQualityVeryUnhealthy: 'Muy mala',
        airQualityDesc1: 'La calidad del aire es considerada satisfactoria y la contaminación del aire presenta poco o ningún riesgo.',
        airQualityDesc2: 'La calidad del aire es aceptable, aunque puede haber preocupación para un pequeño número de personas sensibles.',
        airQualityDesc3: 'Los miembros de grupos sensibles pueden experimentar efectos en la salud. El público en general no suele verse afectado.',
        airQualityDesc4: 'Todos pueden comenzar a experimentar efectos en la salud. Los grupos sensibles pueden experimentar efectos más graves.',
        airQualityDesc5: 'Alerta sanitaria: todos pueden experimentar efectos más graves en la salud.',
        sunrise: 'Amanecer',
        sunset: 'Atardecer',
        daylightHours: 'horas',
        daylightMinutes: 'minutos de luz solar',
        forecastDays: ['Hoy', 'Miér', 'Jue', 'Vie', 'Sáb', 'Dom', 'Lun'],
        weatherRadar: 'Radar Meteorológico',
        interactiveMapLoading: 'Cargando mapa interactivo...',
        animation: 'Animación',
        fullScreen: 'Pantalla completa',
        weatherNews: 'Noticias del tiempo',
        terms: 'Términos',
        privacy: 'Privacidad',
        help: 'Ayuda',
        contact: 'Contacto',
        weatherData: 'Datos meteorológicos proporcionados por OpenWeather',
        lastUpdated: 'Última actualización',
        noResults: 'No se encontraron ciudades con',
        tryAnother: 'Prueba con otro nombre o escribe al menos 3 letras',
        searchingCities: 'Buscando ciudades...',
        resultsFor: 'Resultados para',
        popular: 'Popular',
        searchMore: 'Buscar más ciudades con',
        searchingMore: 'Buscando más ciudades...',
        noMoreCities: 'No se encontraron más ciudades',
        errorSearching: 'Error al buscar más ciudades',
        backToResults: 'Volver a resultados principales',
        extendedResults: 'Resultados extendidos para'
    },
    en: {
        search: 'Search for a location...',
        currentLocation: 'Current Location',
        feelsLike: 'Feels like',
        wind: 'Wind',
        humidity: 'Humidity',
        visibility: 'Visibility',
        pressure: 'Pressure',
        hourlyForecast: 'Hourly Forecast',
        now: 'Now',
        airQuality: 'Air Quality',
        airQualityGood: 'Good',
        airQualityModerate: 'Moderate',
        airQualityUnhealthySensitive: 'Unhealthy for Sensitive Groups',
        airQualityUnhealthy: 'Unhealthy',
        airQualityVeryUnhealthy: 'Very Unhealthy',
        airQualityDesc1: 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
        airQualityDesc2: 'Air quality is acceptable; however, there may be a concern for some people who are unusually sensitive to air pollution.',
        airQualityDesc3: 'Members of sensitive groups may experience health effects. The general public is not likely to be affected.',
        airQualityDesc4: 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.',
        airQualityDesc5: 'Health warnings of emergency conditions. The entire population is more likely to be affected.',
        sunrise: 'Sunrise',
        sunset: 'Sunset',
        daylightHours: 'hours',
        daylightMinutes: 'minutes of daylight',
        forecastDays: ['Today', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon'],
        weatherRadar: 'Weather Radar',
        interactiveMapLoading: 'Interactive Map Loading...',
        animation: 'Animation',
        fullScreen: 'Full Screen',
        weatherNews: 'Weather News',
        terms: 'Terms',
        privacy: 'Privacy',
        help: 'Help',
        contact: 'Contact',
        weatherData: 'Weather data provided by OpenWeather',
        lastUpdated: 'Last updated',
        noResults: 'No cities found with',
        tryAnother: 'Try another name or type at least 3 letters',
        searchingCities: 'Searching cities...',
        resultsFor: 'Results for',
        popular: 'Popular',
        searchMore: 'Search more cities with',
        searchingMore: 'Searching more cities...',
        noMoreCities: 'No more cities found',
        errorSearching: 'Error searching for more cities',
        backToResults: 'Back to main results',
        extendedResults: 'Extended results for'
    },
    fr: {
        search: 'Rechercher un lieu...',
        currentLocation: 'Position actuelle',
        feelsLike: 'Ressenti',
        wind: 'Vent',
        humidity: 'Humidité',
        visibility: 'Visibilité',
        pressure: 'Pression',
        hourlyForecast: 'Prévisions horaires',
        now: 'Maintenant',
        airQuality: 'Qualité de l\'air',
        airQualityGood: 'Bonne',
        airQualityModerate: 'Modérée',
        airQualityUnhealthySensitive: 'Mauvaise pour les sensibles',
        airQualityUnhealthy: 'Mauvaise',
        airQualityVeryUnhealthy: 'Très mauvaise',
        airQualityDesc1: 'La qualité de l\'air est considérée comme satisfaisante et la pollution de l\'air présente peu ou pas de risque.',
        airQualityDesc2: 'La qualité de l\'air est acceptable, mais il peut y avoir des préoccupations pour un petit nombre de personnes sensibles.',
        airQualityDesc3: 'Les membres des groupes sensibles peuvent subir des effets sur leur santé. Le grand public n\'est généralement pas affecté.',
        airQualityDesc4: 'Tout le monde peut commencer à ressentir des effets sur la santé. Les groupes sensibles peuvent subir des effets plus graves.',
        airQualityDesc5: 'Alerte sanitaire: tout le monde peut subir des effets plus graves sur la santé.',
        sunrise: 'Lever du soleil',
        sunset: 'Coucher du soleil',
        daylightHours: 'heures',
        daylightMinutes: 'minutes de lumière du jour',
        forecastDays: ['Auj.', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim', 'Lun'],
        weatherRadar: 'Radar Météo',
        interactiveMapLoading: 'Chargement de la carte interactive...',
        animation: 'Animation',
        fullScreen: 'Plein écran',
        weatherNews: 'Actualités météo',
        terms: 'Conditions',
        privacy: 'Confidentialité',
        help: 'Aide',
        contact: 'Contact',
        weatherData: 'Données météo fournies par OpenWeather',
        lastUpdated: 'Dernière mise à jour',
        noResults: 'Aucune ville trouvée avec',
        tryAnother: 'Essayez un autre nom ou tapez au moins 3 lettres',
        searchingCities: 'Recherche de villes...',
        resultsFor: 'Résultats pour',
        popular: 'Populaire',
        searchMore: 'Rechercher plus de villes avec',
        searchingMore: 'Recherche de plus de villes...',
        noMoreCities: 'Aucune autre ville trouvée',
        errorSearching: 'Erreur lors de la recherche de villes',
        backToResults: 'Retour aux résultats principaux',
        extendedResults: 'Résultats étendus pour'
    },
    pt: {
        search: 'Buscar um local...',
        currentLocation: 'Localização atual',
        feelsLike: 'Sensação térmica',
        wind: 'Vento',
        humidity: 'Umidade',
        visibility: 'Visibilidade',
        pressure: 'Pressão',
        hourlyForecast: 'Previsão por hora',
        now: 'Agora',
        airQuality: 'Qualidade do ar',
        airQualityGood: 'Boa',
        airQualityModerate: 'Moderada',
        airQualityUnhealthySensitive: 'Ruim para sensíveis',
        airQualityUnhealthy: 'Ruim',
        airQualityVeryUnhealthy: 'Muito ruim',
        airQualityDesc1: 'A qualidade do ar é considerada satisfatória e a poluição do ar apresenta pouco ou nenhum risco.',
        airQualityDesc2: 'A qualidade do ar é aceitável, mas pode haver preocupação para um pequeno número de pessoas sensíveis.',
        airQualityDesc3: 'Os membros de grupos sensíveis podem sentir efeitos na saúde. O público em geral normalmente não é afetado.',
        airQualityDesc4: 'Todos podem começar a sentir efeitos na saúde. Grupos sensíveis podem sentir efeitos mais graves.',
        airQualityDesc5: 'Alerta de saúde: todos podem sentir efeitos mais graves na saúde.',
        sunrise: 'Nascer do sol',
        sunset: 'Pôr do sol',
        daylightHours: 'horas',
        daylightMinutes: 'minutos de luz solar',
        forecastDays: ['Hoje', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom', 'Seg'],
        weatherRadar: 'Radar Meteorológico',
        interactiveMapLoading: 'Carregando mapa interativo...',
        animation: 'Animação',
        fullScreen: 'Tela cheia',
        weatherNews: 'Notícias do tempo',
        terms: 'Termos',
        privacy: 'Privacidade',
        help: 'Ajuda',
        contact: 'Contato',
        weatherData: 'Dados meteorológicos fornecidos por OpenWeather',
        lastUpdated: 'Última atualização',
        noResults: 'Nenhuma cidade encontrada com',
        tryAnother: 'Tente outro nome ou digite pelo menos 3 letras',
        searchingCities: 'Procurando cidades...',
        resultsFor: 'Resultados para',
        popular: 'Popular',
        searchMore: 'Buscar mais cidades com',
        searchingMore: 'Buscando mais cidades...',
        noMoreCities: 'Não foram encontradas mais cidades',
        errorSearching: 'Erro ao buscar mais cidades',
        backToResults: 'Voltar aos resultados principais',
        extendedResults: 'Resultados estendidos para'
    },
    de: {
        search: 'Einen Ort suchen...',
        currentLocation: 'Aktueller Standort',
        feelsLike: 'Gefühlt wie',
        wind: 'Wind',
        humidity: 'Luftfeuchtigkeit',
        visibility: 'Sichtweite',
        pressure: 'Luftdruck',
        hourlyForecast: 'Stündliche Vorhersage',
        now: 'Jetzt',
        airQuality: 'Luftqualität',
        airQualityGood: 'Gut',
        airQualityModerate: 'Mäßig',
        airQualityUnhealthySensitive: 'Ungesund für empfindliche Gruppen',
        airQualityUnhealthy: 'Ungesund',
        airQualityVeryUnhealthy: 'Sehr ungesund',
        airQualityDesc1: 'Die Luftqualität wird als zufriedenstellend angesehen und die Luftverschmutzung stellt wenig oder kein Risiko dar.',
        airQualityDesc2: 'Die Luftqualität ist akzeptabel, es kann jedoch Bedenken für eine kleine Anzahl sensibler Personen geben.',
        airQualityDesc3: 'Mitglieder sensibler Gruppen können gesundheitliche Auswirkungen verspüren. Die breite Öffentlichkeit ist in der Regel nicht betroffen.',
        airQualityDesc4: 'Jeder kann gesundheitliche Auswirkungen verspüren. Sensible Gruppen können schwerwiegendere Auswirkungen verspüren.',
        airQualityDesc5: 'Gesundheitswarnung: Jeder kann schwerwiegendere gesundheitliche Auswirkungen verspüren.',
        sunrise: 'Sonnenaufgang',
        sunset: 'Sonnenuntergang',
        daylightHours: 'Stunden',
        daylightMinutes: 'Minuten Tageslicht',
        forecastDays: ['Heute', 'Mi', 'Do', 'Fr', 'Sa', 'So', 'Mo'],
        weatherRadar: 'Wetterradar',
        interactiveMapLoading: 'Interaktive Karte wird geladen...',
        animation: 'Animation',
        fullScreen: 'Vollbild',
        weatherNews: 'Wetternachrichten',
        terms: 'Bedingungen',
        privacy: 'Datenschutz',
        help: 'Hilfe',
        contact: 'Kontakt',
        weatherData: 'Wetterdaten bereitgestellt von OpenWeather',
        lastUpdated: 'Zuletzt aktualisiert',
        noResults: 'Keine Städte gefunden mit',
        tryAnother: 'Versuchen Sie einen anderen Namen oder geben Sie mindestens 3 Buchstaben ein',
        searchingCities: 'Suche nach Städten...',
        resultsFor: 'Ergebnisse für',
        popular: 'Beliebt',
        searchMore: 'Weitere Städte suchen mit',
        searchingMore: 'Suche nach weiteren Städten...',
        noMoreCities: 'Keine weiteren Städte gefunden',
        errorSearching: 'Fehler bei der Suche nach weiteren Städten',
        backToResults: 'Zurück zu den Hauptergebnissen',
        extendedResults: 'Erweiterte Ergebnisse für'
    }
};

// Función para obtener el idioma actual
function getCurrentLanguage() {
    return localStorage.getItem('weatheryn_language') || 'es';
}

// Función para actualizar la interfaz con el idioma seleccionado
function updateUILanguage(lang) {
    // Actualizar elementos de la interfaz
    const elements = {
        'input[type="text"]': { attr: 'placeholder', key: 'search' },
        'button .material-symbols-outlined + span': { text: 'currentLocation' },
        '.font-bold.text-lg:contains("Hourly")': { text: 'hourlyForecast' },
        '.font-bold.text-lg:contains("Air")': { text: 'airQuality' },
        '.font-bold.text-lg:contains("Sunrise")': { text: 'sunrise' },
        '.font-bold.text-xl:contains("7-Day")': { text: 'forecastDays[0]' },
        '.font-bold.text-lg:contains("Weather Radar")': { text: 'weatherRadar' },
        '.font-bold.text-lg:contains("Weather News")': { text: 'weatherNews' },
        'footer a:contains("Terms")': { text: 'terms' },
        'footer a:contains("Privacy")': { text: 'privacy' },
        'footer a:contains("Help")': { text: 'help' },
        'footer a:contains("Contact")': { text: 'contact' }
    };

    // Actualizar idioma del selector
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.value = lang;
    }
    
    // Actualizar textos de la interfaz en función del idioma seleccionado
    document.querySelectorAll('.text-gray-600.text-sm:contains("hours")').forEach(el => {
        const text = el.textContent;
        const match = text.match(/(\d+)\s+hours\s+(\d+)\s+minutes/);
        if (match) {
            const hours = match[1];
            const minutes = match[2];
            el.textContent = `${hours} ${t('daylightHours')} ${minutes} ${t('daylightMinutes')}`;
        }
    });
    
    // Actualizar los días de la semana en el pronóstico de 7 días
    const weekdayElements = document.querySelectorAll('.grid.grid-cols-7.gap-2.font-medium.text-sm > div');
    if (weekdayElements.length === 7) {
        weekdayElements.forEach((el, index) => {
            el.textContent = t(`forecastDays[${index}]`);
        });
    }
}

// Sistema de caché para datos meteorológicos
class WeatherCache {
    static CACHE_DURATION = 30 * 60 * 1000; // 30 minutos en milisegundos
    
    static getCacheKey(type, identifier) {
        return `weatherCache_${type}_${identifier}`;
    }
    
    static getTimestampKey(cacheKey) {
        return `${cacheKey}_timestamp`;
    }
    
    static set(type, identifier, data) {
        try {
            const cacheKey = this.getCacheKey(type, identifier);
            const timestampKey = this.getTimestampKey(cacheKey);
            
            // Almacenar los datos
            localStorage.setItem(cacheKey, JSON.stringify(data));
            localStorage.setItem(timestampKey, Date.now().toString());
            
            console.log(`Datos almacenados en caché: ${type} para ${identifier}`);
            return true;
        } catch (error) {
            console.warn('Error al almacenar en caché:', error);
            this.clearCache(); // Intentar limpiar la caché si hay error de almacenamiento
            return false;
        }
    }
    
    static get(type, identifier) {
        try {
            const cacheKey = this.getCacheKey(type, identifier);
            const timestampKey = this.getTimestampKey(cacheKey);
            
            const cachedData = localStorage.getItem(cacheKey);
            const timestamp = localStorage.getItem(timestampKey);
            
            if (!cachedData || !timestamp) {
                return null;
            }
            
            // Verificar si la caché ha expirado
            const age = Date.now() - parseInt(timestamp);
            if (age > this.CACHE_DURATION) {
                console.log(`Caché expirada para ${type} ${identifier}`);
                this.remove(type, identifier);
                return null;
            }
            
            console.log(`Datos recuperados de caché: ${type} para ${identifier}`);
            return JSON.parse(cachedData);
        } catch (error) {
            console.warn('Error al recuperar de caché:', error);
            return null;
        }
    }
    
    static remove(type, identifier) {
        try {
            const cacheKey = this.getCacheKey(type, identifier);
            const timestampKey = this.getTimestampKey(cacheKey);
            
            localStorage.removeItem(cacheKey);
            localStorage.removeItem(timestampKey);
        } catch (error) {
            console.warn('Error al eliminar de caché:', error);
        }
    }
    
    static clearCache() {
        try {
            const keys = Object.keys(localStorage);
            const cacheKeys = keys.filter(key => key.startsWith('weatherCache_'));
            
            cacheKeys.forEach(key => {
                localStorage.removeItem(key);
            });
            
            console.log('Caché limpiada completamente');
        } catch (error) {
            console.warn('Error al limpiar caché:', error);
        }
    }
    
    static async getWithUpdate(type, identifier, fetchFunction) {
        try {
            // Intentar obtener datos de la caché
            const cachedData = this.get(type, identifier);
            if (cachedData) {
                // Si hay datos en caché, usarlos inmediatamente
                console.log(`Usando datos en caché para ${type} ${identifier}`);
                
                // Actualizar la caché en segundo plano
                this.updateCacheInBackground(type, identifier, fetchFunction);
                
                return cachedData;
            }
            
            // Si no hay datos en caché, hacer la petición
            console.log(`Obteniendo nuevos datos para ${type} ${identifier}`);
            const freshData = await fetchFunction();
            
            // Almacenar en caché si la petición fue exitosa
            if (freshData) {
                this.set(type, identifier, freshData);
            }
            
            return freshData;
        } catch (error) {
            console.error(`Error en getWithUpdate para ${type} ${identifier}:`, error);
            throw error;
        }
    }
    
    static async updateCacheInBackground(type, identifier, fetchFunction) {
        try {
            const freshData = await fetchFunction();
            if (freshData) {
                this.set(type, identifier, freshData);
                console.log(`Caché actualizada en segundo plano para ${type} ${identifier}`);
            }
        } catch (error) {
            console.warn(`Error al actualizar caché en segundo plano para ${type} ${identifier}:`, error);
        }
    }
}

// Sistema de preferencias del usuario
class UserPreferences {
    static STORAGE_KEY = 'weatheryn_preferences';
    
    static defaultPreferences = {
        theme: 'light',
        temperatureUnit: 'C',
        lastCity: 'Madrid'
    };
    
    static get() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? { ...this.defaultPreferences, ...JSON.parse(stored) } : this.defaultPreferences;
        } catch (error) {
            console.warn('Error al cargar preferencias:', error);
            return this.defaultPreferences;
        }
    }
    
    static set(preferences) {
        try {
            const current = this.get();
            const updated = { ...current, ...preferences };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
            return true;
        } catch (error) {
            console.warn('Error al guardar preferencias:', error);
            return false;
        }
    }
    
    static setTheme(theme) {
        const root = document.querySelector('[data-theme]');
        const themeSwitch = document.querySelector('.theme-switch');
        
        if (root) {
            root.dataset.theme = theme;
            if (themeSwitch) {
                themeSwitch.dataset.active = theme === 'dark' ? 'true' : 'false';
            }
            
            // Actualizar clases y estilos según el tema
            const elements = {
                header: document.querySelector('header'),
                cards: document.querySelectorAll('.bg-white'),
                text: document.querySelectorAll('.text-gray-800, .text-gray-600'),
                borders: document.querySelectorAll('.border-gray-100, .border-gray-200')
            };
            
            if (theme === 'dark') {
                root.classList.remove('from-indigo-100', 'to-blue-200');
                root.classList.add('from-gray-900', 'to-gray-800');
                
                elements.cards.forEach(card => {
                    card.classList.remove('bg-white');
                });
            }
        }
    }
}

// Clase de utilidades para animaciones
class Animator {
    static fadeIn(element, duration = 500) {
        if (!element) return;
        
        // Guardar el estilo de visualización original
        const originalDisplay = window.getComputedStyle(element).display === 'none' ? 'block' : window.getComputedStyle(element).display;
        
        // Configurar para la animación
        element.style.opacity = '0';
        element.style.display = originalDisplay;
        element.style.transition = `opacity ${duration}ms ease-in-out`;
        
        // Forzar un reflow para que la transición funcione
        element.offsetHeight;
        
        // Iniciar la animación
        element.style.opacity = '1';
    }
    
    static fadeOut(element, duration = 500) {
        if (!element) return;
        
        // Configurar para la animación
        element.style.opacity = '1';
        element.style.transition = `opacity ${duration}ms ease-in-out`;
        
        // Iniciar la animación
        element.style.opacity = '0';
        
        // Ocultar el elemento al finalizar
        setTimeout(() => {
            element.style.display = 'none';
        }, duration);
    }
    
    static slideIn(element, direction = 'right', duration = 500) {
        if (!element) return;
        
        // Guardar el estilo de visualización original
        const originalDisplay = window.getComputedStyle(element).display === 'none' ? 'block' : window.getComputedStyle(element).display;
        
        // Configurar para la animación
        element.style.display = originalDisplay;
        element.style.overflow = 'hidden';
        
        const startTransform = direction === 'right' ? 'translateX(100%)' : 
                              direction === 'left' ? 'translateX(-100%)' : 
                              direction === 'up' ? 'translateY(-100%)' : 'translateY(100%)';
        
        element.style.transform = startTransform;
        element.style.transition = `transform ${duration}ms ease-in-out`;
        
        // Forzar un reflow para que la transición funcione
        element.offsetHeight;
        
        // Iniciar la animación
        element.style.transform = 'translate(0, 0)';
    }
    
    static pulse(element, scale = 1.05, duration = 300) {
        if (!element) return;
        
        element.style.transition = `transform ${duration/2}ms ease-in-out`;
        element.style.transform = `scale(${scale})`;
        
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, duration/2);
    }
    
    static addLoadingEffect(container, text = 'Cargando...') {
        if (!container) return;
        
        // Guardar el contenido original
        const originalContent = container.innerHTML;
        container.dataset.originalContent = originalContent;
        
        // Crear y añadir efecto de carga
        const loadingElement = document.createElement('div');
        loadingElement.className = 'flex flex-col items-center justify-center w-full h-full min-h-[100px]';
        loadingElement.innerHTML = `
            <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mb-2"></div>
            <p class="text-sm text-gray-600">${text}</p>
        `;
        
        container.innerHTML = '';
        container.appendChild(loadingElement);
        
        return () => {
            // Función para restaurar el contenido original
            container.innerHTML = container.dataset.originalContent;
            delete container.dataset.originalContent;
        };
    }
}

async function getWeatherData(city) {
    try {
        // Mostrar animación de carga en el contenedor principal
        const mainContainer = document.querySelector('.bg-gradient-to-r.from-amber-400');
        const removeLoading = mainContainer ? Animator.addLoadingEffect(mainContainer, 'Obteniendo datos del clima...') : null;
        
        // Función para obtener datos frescos de la API
        const fetchFreshData = async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            try {
                const response = await axios.get(`${BASE_URL}/weather`, {
                    params: {
                        q: city,
                        appid: API_KEY,
                        units: 'metric'
                    },
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                return response.data;
            } catch (requestError) {
                clearTimeout(timeoutId);
                throw requestError;
            }
        };
        
        try {
            // Intentar obtener datos de la caché o hacer una nueva petición
            const weatherData = await WeatherCache.getWithUpdate('weather', city, fetchFreshData);
            
            // Restaurar contenido y aplicar animación
            if (removeLoading) {
                removeLoading();
                Animator.fadeIn(mainContainer);
            }
            
            return weatherData;
        } catch (requestError) {
            // Restaurar contenido para evitar carga infinita
            if (removeLoading) {
                removeLoading();
            }
            
            throw requestError;
        }
    } catch (error) {
        console.error('Error al obtener datos del clima:', error);
        
        // Mostrar mensaje de error más específico al usuario
        if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
            alert('La solicitud ha tardado demasiado tiempo. Por favor, inténtalo de nuevo.');
        } else if (error.response && error.response.status === 404) {
            alert('No se pudo encontrar la ciudad. Por favor, verifica el nombre e inténtalo de nuevo.');
        } else {
            alert('Error al obtener datos del clima. Por favor, inténtalo de nuevo más tarde.');
        }
        
        // En caso de error, intentar cargar datos por defecto si no hay datos actuales
        const currentTempElement = document.querySelector('.text-6xl');
        if (!currentTempElement || !currentTempElement.textContent || currentTempElement.textContent === '') {
            console.log('Intentando cargar datos de Madrid como fallback...');
            try {
                // Intentar obtener datos de Madrid desde la caché primero
                const cachedMadridData = WeatherCache.get('weather', 'Madrid');
                if (cachedMadridData) {
                    return cachedMadridData;
                }
                
                // Si no hay caché, hacer la petición
                const fallbackResponse = await axios.get(`${BASE_URL}/weather`, {
                    params: {
                        q: 'Madrid',
                        appid: API_KEY,
                        units: 'metric'
                    },
                    timeout: 5000
                });
                
                // Almacenar los datos de fallback en caché
                if (fallbackResponse.data) {
                    WeatherCache.set('weather', 'Madrid', fallbackResponse.data);
                }
                
                return fallbackResponse.data;
            } catch (fallbackError) {
                console.error('Error al cargar datos de fallback:', fallbackError);
            }
        }
        
        return null;
    }
}

async function getForecastData(city) {
    try {
        // Función para obtener datos frescos del pronóstico
        const fetchFreshForecast = async () => {
            // Primero, intentamos con la API de pronóstico de 5 días/3 horas
            const response = await axios.get(`${BASE_URL}/forecast`, {
                params: {
                    q: city,
                    appid: API_KEY,
                    units: 'metric'
                }
            });
            
            // Intentar obtener datos de OneCall API si están disponibles las coordenadas
            if (response.data && response.data.city && response.data.city.coord) {
                const { lat, lon } = response.data.city.coord;
                
                try {
                    const oneCallResponse = await axios.get('https://api.openweathermap.org/data/3.0/onecall', {
                        params: {
                            lat: lat,
                            lon: lon,
                            exclude: 'current,minutely,hourly,alerts',
                            appid: API_KEY,
                            units: 'metric'
                        }
                    });
                    
                    if (oneCallResponse.data && oneCallResponse.data.daily) {
                        console.log('Usando datos de OneCall API para pronóstico de 7 días');
                        return {
                            ...response.data,
                            oneCallData: oneCallResponse.data
                        };
                    }
                } catch (oneCallError) {
                    console.log('Error al obtener datos de OneCall API, usando datos estándar:', oneCallError);
                }
            }
            
            return response.data;
        };
        
        // Intentar obtener datos de la caché o hacer una nueva petición
        return await WeatherCache.getWithUpdate('forecast', city, fetchFreshForecast);
    } catch (error) {
        console.error('Error al obtener pronóstico:', error);
        
        // Intentar obtener datos de la caché incluso si la petición falla
        const cachedData = WeatherCache.get('forecast', city);
        if (cachedData) {
            console.log('Usando datos en caché después de error en la petición');
            return cachedData;
        }
        
        return null;
    }
}

// Función para obtener datos de calidad del aire
async function getAirQualityData(lat, lon) {
    try {
        const locationKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
        
        // Función para obtener datos frescos de calidad del aire
        const fetchFreshAirQuality = async () => {
            const response = await axios.get(`${BASE_URL}/air_pollution`, {
                params: {
                    lat: lat,
                    lon: lon,
                    appid: API_KEY
                }
            });
            return response.data;
        };
        
        // Intentar obtener datos de la caché o hacer una nueva petición
        return await WeatherCache.getWithUpdate('airQuality', locationKey, fetchFreshAirQuality);
    } catch (error) {
        console.error('Error al obtener datos de calidad del aire:', error);
        
        // Intentar obtener datos de la caché incluso si la petición falla
        const locationKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;
        const cachedData = WeatherCache.get('airQuality', locationKey);
        if (cachedData) {
            console.log('Usando datos en caché de calidad del aire después de error en la petición');
            return cachedData;
        }
        
        return null;
    }
}

// Obtener zona horaria y hora local de la ubicación
async function getTimezoneData(lat, lon) {
    try {
        const response = await axios.get('https://api.openweathermap.org/data/2.5/onecall', {
            params: {
                lat: lat,
                lon: lon,
                exclude: 'minutely,hourly,daily,alerts',
                appid: API_KEY
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error al obtener datos de zona horaria:', error);
        return null;
    }
}

// Función para obtener noticias meteorológicas
async function getWeatherNews(country = 'es') {
    try {
        // Intentamos primero con NewsAPI - si falla, tenemos fallback
        let response;
        
        try {
            // Intento con la API de GNews (limitado a 100 solicitudes por día)
            response = await axios.get('https://gnews.io/api/v4/search', {
                params: {
                    q: 'weather OR climate OR meteorology',
                    lang: 'es',
                    country: country,
                    max: 10,
                    apikey: '98d5caf2f8d7c1eac98eefc2de9b3493' // API key de GNews (gratuita, limitada)
                },
                timeout: 3000 // timeout de 3 segundos para evitar esperas largas
            });
            
            if (response.data && response.data.articles && response.data.articles.length > 0) {
                return response.data;
            }
        } catch (apiError) {
            console.log('Error con la API de noticias principal, usando alternativa:', apiError);
        }
        
        // Si falla la primera opción, intentamos con una alternativa
        try {
            // Alternativa: RSS feed con proxy CORS
            const rssUrl = 'https://api.rss2json.com/v1/api.json?rss_url=https://www.climatechangenews.com/feed/';
            response = await axios.get(rssUrl);
            
            if (response.data && response.data.items) {
                // Convertir al formato esperado
                return {
                    articles: response.data.items.map(item => ({
                        title: item.title,
                        description: item.description.replace(/<[^>]*>?/gm, '').substring(0, 150), // quitar HTML
                        url: item.link,
                        publishedAt: item.pubDate,
                        source: { name: response.data.feed.title || 'Noticias del Clima' }
                    }))
                };
            }
        } catch (rssError) {
            console.log('Error con la fuente RSS, usando noticias simuladas:', rssError);
        }
        
        // Si todo falla, devolvemos noticias simuladas
        console.log('Usando noticias simuladas...');
        return {
            articles: [
                {
                    title: 'Ola de calor extrema afecta el sur de Europa',
                    description: 'Las temperaturas han alcanzado niveles récord en varias ciudades, causando preocupación por incendios forestales y problemas de salud.',
                    image: 'https://via.placeholder.com/100',
                    publishedAt: new Date().toISOString(),
                    source: { name: 'Noticias Meteorológicas' },
                    url: '#'
                },
                {
                    title: 'Científicos alertan sobre el impacto del cambio climático en patrones meteorológicos',
                    description: 'Un nuevo estudio revela cómo el calentamiento global está alterando los sistemas climáticos tradicionales en todo el mundo.',
                    image: 'https://via.placeholder.com/100',
                    publishedAt: new Date(Date.now() - 86400000).toISOString(),
                    source: { name: 'Revista Científica' },
                    url: '#'
                },
                {
                    title: country === 'es' ? 'El nivel del mar aumentará más rápido de lo previsto' : 'Sea levels rising faster than expected',
                    description: country === 'es' ? 'Según un nuevo informe, el aumento del nivel del mar está acelerándose debido al derretimiento de los glaciares y casquetes polares.' : 'According to a new report, sea level rise is accelerating due to melting glaciers and ice caps.',
                    image: 'https://via.placeholder.com/100',
                    publishedAt: new Date(Date.now() - 172800000).toISOString(),
                    source: { name: country === 'es' ? 'Instituto Oceanográfico' : 'Oceanographic Institute' },
                    url: '#'
                }
            ]
        };
    } catch (error) {
        console.error('Error al obtener noticias meteorológicas:', error);
        
        // Si falla todo, devolvemos noticias simuladas como último recurso
        return {
            articles: [
                {
                    title: 'Ola de calor extrema afecta el sur de Europa',
                    description: 'Las temperaturas han alcanzado niveles récord en varias ciudades, causando preocupación por incendios forestales y problemas de salud.',
                    image: 'https://via.placeholder.com/100',
                    publishedAt: new Date().toISOString(),
                    source: { name: 'Noticias Meteorológicas' },
                    url: '#'
                },
                {
                    title: 'Científicos alertan sobre el impacto del cambio climático en patrones meteorológicos',
                    description: 'Un nuevo estudio revela cómo el calentamiento global está alterando los sistemas climáticos tradicionales en todo el mundo.',
                    image: 'https://via.placeholder.com/100',
                    publishedAt: new Date(Date.now() - 86400000).toISOString(),
                    source: { name: 'Revista Científica' },
                    url: '#'
                }
            ]
        };
    }
}

// Función para actualizar la sección de noticias meteorológicas
async function updateWeatherNews(country) {
    try {
        // Buscar el contenedor de noticias meteorológicas
        let newsContainer = null;
        const allSections = document.querySelectorAll('h3.font-bold.text-lg.text-gray-800');
        
        for (let i = 0; i < allSections.length; i++) {
            if (allSections[i].textContent.includes('Weather News')) {
                newsContainer = allSections[i].closest('.bg-white.rounded-xl.p-5');
                break;
            }
        }
        
        // Si no lo encontramos con el título, tomamos la última sección
        if (!newsContainer) {
            const allContainers = document.querySelectorAll('.bg-white.rounded-xl.p-5');
            if (allContainers.length > 0) {
                newsContainer = allContainers[allContainers.length - 1];
            }
        }
        
        if (!newsContainer) {
            console.error('No se encontró el contenedor de noticias meteorológicas');
            return;
        }
        
        // Mostrar animación de carga
        const removeLoading = Animator.addLoadingEffect(newsContainer, 'Actualizando noticias...');
        
        // Obtener noticias basadas en el país
        const countryCode = country ? country.toLowerCase() : 'es';
        const newsData = await getWeatherNews(countryCode);
        
        // Quitar animación de carga
        removeLoading();
        
        if (!newsData || !newsData.articles || newsData.articles.length === 0) {
            console.error('No se pudieron obtener noticias');
            return;
        }
        
        // Cambiar el título para reflejar que son noticias locales
        const newsTitle = newsContainer.querySelector('h3.font-bold');
        if (newsTitle) {
            newsTitle.textContent = `Noticias meteorológicas ${country === 'es' ? 'de España' : `de ${country}`}`;
            Animator.pulse(newsTitle);
        }
        
        // Seleccionar el contenedor de artículos de noticias
        const newsItemsContainer = newsContainer.querySelector('.space-y-4');
        if (!newsItemsContainer) {
            console.error('No se encontró el contenedor de elementos de noticias');
            return;
        }
        
        // Limpiar contenedor con animación
        newsItemsContainer.style.opacity = '0';
        setTimeout(() => {
            newsItemsContainer.innerHTML = '';
            
            // Añadir las dos primeras noticias
            const articlesToShow = newsData.articles.slice(0, 2);
            
            // Iconos según el contenido de la noticia
            const getIconForNews = (title, description) => {
                const content = (title + ' ' + description).toLowerCase();
                if (content.includes('lluvia') || content.includes('tormenta') || content.includes('precipitación')) {
                    return 'water';
                } else if (content.includes('calor') || content.includes('temperatura') || content.includes('verano')) {
                    return 'thermostat';
                } else if (content.includes('nieve') || content.includes('frío') || content.includes('hielo')) {
                    return 'ac_unit';
                } else if (content.includes('viento') || content.includes('huracán') || content.includes('ciclón')) {
                    return 'air';
                } else if (content.includes('inundación') || content.includes('diluvio')) {
                    return 'flood';
                } else {
                    return 'cloud';
                }
            };
            
            // Colores según el icono
            const getColorForIcon = (icon) => {
                const colorMap = {
                    'water': 'blue',
                    'thermostat': 'amber',
                    'ac_unit': 'cyan',
                    'air': 'indigo',
                    'flood': 'purple',
                    'cloud': 'gray'
                };
                
                return colorMap[icon] || 'blue';
            };
            
            articlesToShow.forEach((article, index) => {
                const icon = getIconForNews(article.title, article.description || '');
                const color = getColorForIcon(icon);
                const date = new Date(article.publishedAt);
                const formattedDate = date.toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short'
                });
                
                // Crear elemento de noticia
                const newsItem = document.createElement('div');
                newsItem.className = `flex items-start ${index < articlesToShow.length - 1 ? 'border-b border-gray-100 pb-3' : ''}`;
                newsItem.style.opacity = '0';
                newsItem.style.transform = 'translateY(20px)';
                newsItem.style.transition = `all 500ms ease-out ${index * 200}ms`;
                
                newsItem.innerHTML = `
                    <div class="bg-${color}-100 rounded w-16 h-16 flex-shrink-0 flex items-center justify-center">
                        <span class="material-symbols-outlined text-${color}-500 text-2xl">${icon}</span>
                    </div>
                    <div class="ml-3">
                        <a href="${article.url}" target="_blank" class="block">
                            <h4 class="font-medium text-gray-800">${article.title}</h4>
                            <p class="text-gray-600 text-sm mt-1">${article.description ? article.description.substring(0, 80) + '...' : 'Sin descripción disponible'}</p>
                            <p class="text-gray-400 text-xs mt-1">${formattedDate} • ${article.source.name}</p>
                        </a>
                    </div>
                `;
                
                newsItemsContainer.appendChild(newsItem);
                
                // Aplicar animación después de un breve retraso
                setTimeout(() => {
                    newsItem.style.opacity = '1';
                    newsItem.style.transform = 'translateY(0)';
                }, 50);
            });
            
            // Mostrar el contenedor con animación
            newsItemsContainer.style.opacity = '1';
        }, 300);
        
        console.log('Noticias meteorológicas actualizadas correctamente');
    } catch (error) {
        console.error('Error al actualizar noticias meteorológicas:', error);
    }
}

// Actualizar la hora local basada en la zona horaria de la ubicación
function updateLocalTime(timezoneOffset) {
    const now = new Date();
    // Guardar el offset de zona horaria para uso posterior
    window.currentTimezoneOffset = timezoneOffset;
    // Convertir a milisegundos y ajustar según la zona horaria
    const localTime = new Date(now.getTime() + (timezoneOffset * 1000) + (now.getTimezoneOffset() * 60000));
    
    // Opciones de formato para fecha y hora
    const dateOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    
    // Formatear fecha y hora según la configuración regional española
    const formattedDate = localTime.toLocaleDateString('es-ES', dateOptions);
    const formattedTime = localTime.toLocaleTimeString('es-ES', timeOptions);
    
    // Capitalizar primera letra de la fecha
    const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    
    const dateElement = document.querySelector('.text-white\\/90.text-lg');
    if (dateElement) {
        // Guardar el texto actual para comparar
        const currentText = dateElement.textContent;
        const newText = `${capitalizedDate} - ${formattedTime}`;
        
        // Solo animar si el texto cambia
        if (currentText !== newText) {
            // Aplicar animación de transición
            dateElement.style.transition = 'opacity 300ms ease-in-out';
            dateElement.style.opacity = '0';
            
            setTimeout(() => {
                dateElement.textContent = newText;
                dateElement.style.opacity = '1';
            }, 300);
        }
    } else {
        console.error('No se encontró el elemento para la fecha');
    }
    
    // Mostrar fecha y hora en consola para debug
    console.log(`Fecha y hora local actualizada: ${capitalizedDate} - ${formattedTime}`);
    
    // Iniciar reloj en tiempo real para esta zona horaria
    if (window.clockInterval) {
        clearInterval(window.clockInterval);
    }
    
    // Actualizar la hora cada minuto
    window.clockInterval = setInterval(() => {
        const now = new Date();
        const updatedLocalTime = new Date(now.getTime() + (timezoneOffset * 1000) + (now.getTimezoneOffset() * 60000));
        
        const updatedFormattedTime = updatedLocalTime.toLocaleTimeString('es-ES', timeOptions);
        
        const clockElement = document.querySelector('.text-white\\/90.text-lg');
        if (clockElement) {
            // Solo actualizar la parte de la hora, mantener la fecha
            const currentText = clockElement.textContent;
            const datePart = currentText.split(' - ')[0];
            
            // Aplicar animación sutil solo a la parte de la hora
            clockElement.innerHTML = `${datePart} - <span class="time-part">${updatedFormattedTime}</span>`;
            
            const timePart = clockElement.querySelector('.time-part');
            Animator.pulse(timePart, 1.05, 200);
        }
    }, 60000);
    
    // Si está abierto el radar, actualizar también la hora ahí
    const radarContainer = document.querySelector('[data-lat]');
    if (radarContainer) {
        const currentLat = parseFloat(radarContainer.dataset.lat);
        const currentLon = parseFloat(radarContainer.dataset.lon);
        const currentLayer = radarContainer.dataset.layer;
        const currentZoom = parseInt(radarContainer.dataset.zoom);
        
        // Actualizar el radar para reflejar la nueva hora
        updateWeatherRadar(currentLat, currentLon, currentLayer, currentZoom);
    }
}

// Función para actualizar la interfaz de usuario con datos del clima
function updateWeatherUI(data) {
    if (!data) return;

    try {
        console.log('Actualizando UI con datos:', data);
        
        // Aplicar animación de entrada al contenedor principal
        const mainContainer = document.querySelector('.bg-gradient-to-r.from-amber-400');
        if (mainContainer) {
            Animator.fadeIn(mainContainer);
        }
        
        // Actualizar la información principal
        const cityElement = document.querySelector('h2');
        if (cityElement) {
            // Animar el cambio de ciudad
            cityElement.style.transition = 'opacity 300ms ease-in-out';
            cityElement.style.opacity = '0';
            
            setTimeout(() => {
                cityElement.textContent = `${data.name}, ${data.sys.country}`;
                cityElement.style.opacity = '1';
            }, 300);
        } else {
            console.error('No se encontró el elemento h2 para la ciudad');
        }
        
        // Actualizar fecha y hora inmediatamente con la zona horaria de la ubicación
        if (data.timezone !== undefined) {
            updateLocalTime(data.timezone);
        }
        
        const tempElement = document.querySelector('.text-6xl');
        if (tempElement) {
            // Animar el cambio de temperatura
            const currentTemp = tempElement.textContent;
            const newTemp = `${Math.round(data.main.temp)}°`;
            
            if (currentTemp !== newTemp) {
                Animator.pulse(tempElement, 1.1);
                
                tempElement.style.transition = 'opacity 300ms ease-in-out';
                tempElement.style.opacity = '0';
                
                setTimeout(() => {
                    tempElement.textContent = newTemp;
                    tempElement.style.opacity = '1';
                }, 300);
            }
        } else {
            console.error('No se encontró el elemento para la temperatura');
        }
        
        const feelsLikeElement = document.querySelector('.text-white\\/90:not(.text-lg)');
        if (feelsLikeElement) {
            feelsLikeElement.textContent = `Sensación térmica: ${Math.round(data.main.feels_like)}°`;
        }
        
        const weatherDescElement = document.querySelector('.text-white.font-medium');
        if (weatherDescElement) {
            // Traducir la descripción del clima al español
            const weatherDescriptions = {
                'Clear': 'Despejado',
                'Clouds': 'Nuboso',
                'Rain': 'Lluvia',
                'Drizzle': 'Llovizna',
                'Thunderstorm': 'Tormenta',
                'Snow': 'Nieve',
                'Mist': 'Neblina',
                'Fog': 'Niebla',
                'Haze': 'Bruma',
                'Smoke': 'Humo',
                'Dust': 'Polvo',
                'Sand': 'Arena',
                'Ash': 'Ceniza',
                'Squall': 'Chubasco',
                'Tornado': 'Tornado'
            };
            
            const weatherDesc = data.weather[0].main;
            const translatedDesc = weatherDescriptions[weatherDesc] || weatherDesc;
            
            weatherDescElement.textContent = translatedDesc;
            Animator.pulse(weatherDescElement);
        } else {
            console.error('No se encontró el elemento para la descripción del clima');
        }
        
        // Actualizar detalles adicionales con animaciones
        const windElement = document.querySelector('[data-wind]');
        if (windElement) {
            windElement.textContent = `Viento: ${data.wind.speed} m/s`;
            Animator.pulse(windElement.parentElement);
        } else {
            console.error('No se encontró el elemento para el viento');
        }
        
        const humidityElement = document.querySelector('[data-humidity]');
        if (humidityElement) {
            humidityElement.textContent = `Humedad: ${data.main.humidity}%`;
            Animator.pulse(humidityElement.parentElement);
        } else {
            console.error('No se encontró el elemento para la humedad');
        }
        
        const pressureElement = document.querySelector('[data-pressure]');
        if (pressureElement) {
            pressureElement.textContent = `Presión: ${data.main.pressure} hPa`;
            Animator.pulse(pressureElement.parentElement);
        } else {
            console.error('No se encontró el elemento para la presión');
        }
        
        // Actualizar amanecer y atardecer con la hora local de la ubicación
        updateSunriseSunset(data.sys.sunrise, data.sys.sunset, data.timezone);
        
        // Obtener y actualizar calidad del aire
        getAirQualityData(data.coord.lat, data.coord.lon)
            .then(airQualityData => {
                updateAirQuality(airQualityData);
            });
            
        // Actualizar zona horaria y hora local
        getTimezoneData(data.coord.lat, data.coord.lon)
            .then(timezoneData => {
                if (timezoneData) {
                    // Actualizar fecha y hora según la ubicación
                    updateLocalTime(timezoneData.timezone_offset);
                    
                    // Establecer intervalo para actualizar la hora cada minuto
                    if (window.timeInterval) {
                        clearInterval(window.timeInterval);
                    }
                    window.timeInterval = setInterval(() => {
                        updateLocalTime(timezoneData.timezone_offset);
                    }, 60000);
                }
            });
        
        // Actualizar icono según el clima
        updateWeatherIcon(data.weather[0].icon);
        
        // Actualizar radar meteorológico
        updateWeatherRadar(data.coord.lat, data.coord.lon);
        
        // Actualizar noticias meteorológicas según el país
        updateWeatherNews(data.sys.country);
        
        // Actualizar el pie de página con la hora de actualización
        updateFooter();
    } catch (error) {
        console.error('Error al actualizar la interfaz:', error);
    }
}

// Actualizar el pie de página con la fecha y hora actual
function updateFooter() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    // Utilizar zona horaria local para el pie de página
    const formattedDate = now.toLocaleDateString('es-ES', options);
    
    const footerTimestamp = document.querySelector('footer p');
    if (footerTimestamp) {
        footerTimestamp.textContent = `Datos meteorológicos proporcionados por OpenWeather • Última actualización: ${formattedDate}`;
    }
    
    console.log('Pie de página actualizado con fecha actual:', formattedDate);
}

// Actualizar información de amanecer y atardecer
function updateSunriseSunset(sunriseTimestamp, sunsetTimestamp, timezoneOffset) {
    // Convertir timestamps a hora local
    const sunriseLocal = new Date(sunriseTimestamp * 1000);
    const sunsetLocal = new Date(sunsetTimestamp * 1000);

    // Formatear las horas para mostrar según el idioma actual
    const localeMap = {
        es: 'es-ES',
        en: 'en-US',
        fr: 'fr-FR',
        pt: 'pt-PT',
        de: 'de-DE'
    };
    
    const locale = localeMap[currentLanguage] || 'es-ES';
    const sunriseTime = sunriseLocal.toLocaleTimeString(locale, { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: currentLanguage === 'en' 
    });
    const sunsetTime = sunsetLocal.toLocaleTimeString(locale, { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: currentLanguage === 'en'
    });

    // Actualizar los elementos HTML con las horas
    const sunriseTimeEl = document.getElementById('sunrise-time');
    const sunsetTimeEl = document.getElementById('sunset-time');
    
    if (sunriseTimeEl) sunriseTimeEl.textContent = sunriseTime;
    if (sunsetTimeEl) sunsetTimeEl.textContent = sunsetTime;

    // Función para actualizar la barra de progreso
    function updateProgressBar() {
        const now = new Date();
        const currentTime = now.getTime();
        const sunriseTime = sunriseLocal.getTime();
        const sunsetTime = sunsetLocal.getTime();

        // Obtener los elementos de la barra de progreso
        const progressBar = document.querySelector('.sun-progress-bar');
        const sunIcon = document.querySelector('.sun-icon');
        const progressFill = progressBar.querySelector('div');
        
        if (!progressBar || !sunIcon || !progressFill) {
            console.error('No se encontraron elementos de la barra de progreso');
            return;
        }

        let progress = 0;
        let gradientColor = '';

        // Calcular el progreso basado en la hora actual
        if (currentTime < sunriseTime) {
            // Antes del amanecer (noche)
            progress = 0;
            gradientColor = 'linear-gradient(to right, #1a1a2e, #16213e, #0f3460)';
        } else if (currentTime > sunsetTime) {
            // Después del atardecer (noche)
            progress = 100;
            gradientColor = 'linear-gradient(to right, #0f3460, #16213e, #1a1a2e)';
        } else {
            // Durante el día
            progress = ((currentTime - sunriseTime) / (sunsetTime - sunriseTime)) * 100;
            
            // Definir colores según la hora del día
            if (progress < 20) {
                // Amanecer
                gradientColor = `linear-gradient(to right, #1a1a2e, #16213e, #0f3460, #ff7e5f, #feb47b)`;
            } else if (progress < 40) {
                // Mañana
                gradientColor = `linear-gradient(to right, #feb47b, #ff7e5f, #ffd194, #ffd194)`;
            } else if (progress < 60) {
                // Mediodía
                gradientColor = `linear-gradient(to right, #ffd194, #ffd194, #ffd194, #ffd194)`;
            } else if (progress < 80) {
                // Tarde
                gradientColor = `linear-gradient(to right, #ffd194, #ffd194, #ff7e5f, #feb47b)`;
            } else {
                // Atardecer
                gradientColor = `linear-gradient(to right, #feb47b, #ff7e5f, #0f3460, #16213e, #1a1a2e)`;
            }
        }

        // Aplicar el progreso y el color con una transición suave
        progressBar.style.transition = 'background 1s ease-in-out';
        progressBar.style.background = 'linear-gradient(to right, #e5e7eb, #e5e7eb)';
        
        // Actualizar el ancho y el color del relleno
        progressFill.style.transition = 'width 1s ease-in-out, background 1s ease-in-out';
        progressFill.style.width = `${progress}%`;
        progressFill.style.background = gradientColor;
        
        // Mover el ícono del sol con una transición suave
        sunIcon.style.transition = 'left 1s ease-in-out';
        sunIcon.style.left = `${progress}%`;
        
        // Actualizar la clase del ícono del sol según la hora del día
        if (progress === 0 || progress === 100) {
            sunIcon.classList.remove('day');
            sunIcon.classList.add('night');
            sunIcon.style.background = '#f5f5f5';
        } else {
            sunIcon.classList.remove('night');
            sunIcon.classList.add('day');
            sunIcon.style.background = '#ffd700';
        }
        
        console.log(`Barra de progreso actualizada: ${progress.toFixed(1)}%`);
    }

    // Actualizar inmediatamente
    updateProgressBar();

    // Configurar actualización cada minuto
    const intervalId = setInterval(updateProgressBar, 60000);

    // Limpiar el intervalo anterior si existe
    if (window.sunProgressInterval) {
        clearInterval(window.sunProgressInterval);
    }
    window.sunProgressInterval = intervalId;
    
    // Calcular duración del día en horas y minutos
    const dayDurationMs = (sunsetTimestamp - sunriseTimestamp) * 1000;
    const dayDurationHours = Math.floor(dayDurationMs / (1000 * 60 * 60));
    const dayDurationMinutes = Math.floor((dayDurationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    // Actualizar el texto de duración del día
    const dayDurationElement = document.querySelector('.text-sm.text-gray-600.text-center');
    if (dayDurationElement) {
        dayDurationElement.textContent = `${dayDurationHours} horas ${dayDurationMinutes} minutos ${t('daylight')}`;
    }
}

// Actualizar información de calidad del aire
function updateAirQuality(airQualityData) {
    if (!airQualityData || !airQualityData.list || airQualityData.list.length === 0) {
        console.error('Datos de calidad del aire no válidos');
        return;
    }
    
    const airQuality = airQualityData.list[0];
    const aqi = airQuality.main.aqi; // Índice de 1 (Bueno) a 5 (Muy malo)
    
    // Mapear AQI a texto y color
    const aqiInfo = {
        1: { text: 'Buena', color: 'green-500', width: '1/4' },
        2: { text: 'Moderada', color: 'yellow-500', width: '2/4' },
        3: { text: 'Mala para sensibles', color: 'orange-500', width: '3/4' },
        4: { text: 'Mala', color: 'red-500', width: '3/4' },
        5: { text: 'Muy mala', color: 'purple-500', width: 'full' }
    };
    
    const info = aqiInfo[aqi] || aqiInfo[1];
    
    // Buscar la sección de calidad del aire
    const airQualitySection = document.querySelector('h3.font-bold.text-lg.text-gray-800');
    let airQualityContainer = null;
    
    // Buscar el título "Air Quality" y obtener su contenedor
    if (airQualitySection) {
        const allSections = document.querySelectorAll('h3.font-bold.text-lg.text-gray-800');
        for (let i = 0; i < allSections.length; i++) {
            if (allSections[i].textContent.includes('Air Quality')) {
                airQualityContainer = allSections[i].closest('.bg-white.rounded-xl.p-5');
                break;
            }
        }
    }
    
    if (!airQualityContainer) {
        console.error('No se pudo encontrar el contenedor de calidad del aire');
        return;
    }
    
    // Ahora podemos buscar elementos dentro del contenedor específico
    const aqiBarElement = airQualityContainer.querySelector('.h-2.flex-1.bg-gray-200 .h-full');
    const aqiTextElement = airQualityContainer.querySelector('.ml-3.font-bold');
    const aqiDescElement = airQualityContainer.querySelector('.text-gray-600.text-sm');
    
    if (aqiBarElement) {
        aqiBarElement.className = `h-full w-${info.width} bg-${info.color} rounded-full`;
    }
    
    if (aqiTextElement) {
        aqiTextElement.textContent = info.text;
        aqiTextElement.className = `ml-3 font-bold text-${info.color}`;
    }
    
    if (aqiDescElement) {
        const descriptions = {
            1: 'La calidad del aire es considerada satisfactoria y la contaminación del aire presenta poco o ningún riesgo.',
            2: 'La calidad del aire es aceptable, aunque puede haber preocupación para un pequeño número de personas sensibles.',
            3: 'Los miembros de grupos sensibles pueden experimentar efectos en la salud. El público en general no suele verse afectado.',
            4: 'Todos pueden comenzar a experimentar efectos en la salud. Los grupos sensibles pueden experimentar efectos más graves.',
            5: 'Alerta sanitaria: todos pueden experimentar efectos más graves en la salud.'
        };
        
        aqiDescElement.textContent = descriptions[aqi] || descriptions[1];
    }
}

function updateWeatherIcon(iconCode) {
    try {
        console.log('Actualizando icono del clima:', iconCode);
        
        // Mapeo de códigos de iconos a Material Symbols
        const iconMap = {
            '01d': 'wb_sunny',           // día despejado
            '01n': 'nightlight',         // noche despejada
            '02d': 'partly_cloudy_day',  // pocas nubes de día
            '02n': 'partly_cloudy_night', // pocas nubes de noche
            '03d': 'cloud',              // nubes dispersas
            '03n': 'cloud',
            '04d': 'cloudy',             // nubes rotas
            '04n': 'cloudy',
            '09d': 'rainy',              // lluvia ligera
            '09n': 'rainy',
            '10d': 'rainy_light',        // lluvia de día
            '10n': 'rainy_light',        // lluvia de noche
            '11d': 'thunderstorm',       // tormenta
            '11n': 'thunderstorm',
            '13d': 'ac_unit',            // nieve
            '13n': 'ac_unit',
            '50d': 'foggy',              // niebla
            '50n': 'foggy'
        };
        
        // Puede ser SVG o que ya lo hayamos reemplazado por un span
        const iconElement = document.querySelector('.w-32.h-32.text-white') || 
                             document.querySelector('svg.w-32.h-32') || 
                             document.querySelector('.material-symbols-outlined.w-32.h-32');
        
        if (iconElement) {
            const icon = iconMap[iconCode] || 'wb_sunny';
            
            console.log('Elemento icono encontrado, reemplazando con:', icon);
            
            // Reemplazar el SVG con el icono de Material Symbols
            iconElement.outerHTML = `<span class="material-symbols-outlined w-32 h-32 text-white text-8xl">${icon}</span>`;
        } else {
            console.error('No se encontró el elemento para el icono del clima');
        }
    } catch (error) {
        console.error('Error al actualizar el icono del clima:', error);
    }
}

function updateHourlyForecast(forecastData) {
    try {
        if (!forecastData || !forecastData.list) {
            console.error('Datos de pronóstico no válidos:', forecastData);
            return;
        }
        
        console.log('Actualizando pronóstico por horas:', forecastData);
        
        const hourlyContainer = document.querySelector('.flex.overflow-x-auto.pb-2.space-x-6');
        if (!hourlyContainer) {
            console.error('No se encontró el contenedor para el pronóstico por horas');
            return;
        }
        
        hourlyContainer.innerHTML = ''; // Limpiar contenido existente
        
        // Obtener las próximas 5 horas de pronóstico
        const hourlyForecasts = forecastData.list.slice(0, 5);
        
        hourlyForecasts.forEach((forecast, index) => {
            const time = index === 0 ? 'Ahora' : new Date(forecast.dt * 1000).getHours() + ':00';
            const temp = Math.round(forecast.main.temp);
            const iconCode = forecast.weather[0].icon;
            
            // Mapeo de códigos de iconos a Material Symbols (versión simplificada)
            const iconMap = {
                '01d': 'wb_sunny', '01n': 'nightlight',
                '02d': 'partly_cloudy_day', '02n': 'partly_cloudy_night',
                '03d': 'cloud', '03n': 'cloud',
                '04d': 'cloudy', '04n': 'cloudy',
                '09d': 'rainy', '09n': 'rainy',
                '10d': 'rainy_light', '10n': 'rainy_light',
                '11d': 'thunderstorm', '11n': 'thunderstorm',
                '13d': 'ac_unit', '13n': 'ac_unit',
                '50d': 'foggy', '50n': 'foggy'
            };
            
            const icon = iconMap[iconCode] || 'wb_sunny';
            
            // Crear elemento para el pronóstico por hora
            const hourlyItem = document.createElement('div');
            hourlyItem.className = 'flex flex-col items-center min-w-[60px]';
            hourlyItem.innerHTML = `
                <span class="text-gray-600">${time}</span>
                <span class="material-symbols-outlined my-2 text-amber-500">${icon}</span>
                <span class="font-bold">${temp}°</span>
            `;
            
            hourlyContainer.appendChild(hourlyItem);
        });
        
        console.log('Pronóstico por horas actualizado correctamente');
    } catch (error) {
        console.error('Error al actualizar el pronóstico por horas:', error);
    }
}

// Función para actualizar el pronóstico de 7 días
function update7DayForecast(forecastData) {
    try {
        if (!forecastData) {
            console.error('Datos de pronóstico no válidos para 7 días');
            return;
        }
        
        console.log('Actualizando pronóstico de 7 días');
        
        let dailyForecasts = [];
        
        // Primero intentamos usar los datos de OneCall si están disponibles
        if (forecastData.oneCallData && forecastData.oneCallData.daily) {
            console.log('Usando datos de OneCall para el pronóstico de 7 días');
            
            // OneCall API ya proporciona datos diarios
            dailyForecasts = forecastData.oneCallData.daily.slice(0, 7).map(day => ({
                date: new Date(day.dt * 1000),
                temp_max: day.temp.max,
                temp_min: day.temp.min,
                weather: day.weather[0],
                pop: day.pop // Probabilidad de precipitación
            }));
        } else {
            // Usamos el método anterior si OneCall no está disponible
            console.log('Usando datos de pronóstico estándar');
            
            // Obtener pronóstico para los próximos 7 días (un elemento por día)
            const processedDates = new Set();
            
            // Agrupar pronósticos por día
            if (forecastData.list) {
                // Primero, encontrar temp_max y temp_min reales por día
                const dailyTemps = {};
                
                forecastData.list.forEach(forecast => {
                    const date = new Date(forecast.dt * 1000);
                    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
                    
                    if (!dailyTemps[dateString]) {
                        dailyTemps[dateString] = {
                            temps: [],
                            weather: [],
                            pop: [] // Probabilidad de precipitación
                        };
                    }
                    
                    dailyTemps[dateString].temps.push(forecast.main.temp);
                    dailyTemps[dateString].weather.push(forecast.weather[0]);
                    dailyTemps[dateString].pop.push(forecast.pop || 0);
                });
                
                // Ahora obtenemos el pronóstico para cada día con temperaturas reales
                forecastData.list.forEach(forecast => {
                    const date = new Date(forecast.dt * 1000);
                    const dateString = date.toISOString().split('T')[0];
                    
                    // Si ya tenemos un pronóstico para este día, omitir
                    if (processedDates.has(dateString)) {
                        return;
                    }
                    
                    // Agregar este día al conjunto de días procesados
                    processedDates.add(dateString);
                    
                    // Encontrar temperatura máxima y mínima real para este día
                    const temps = dailyTemps[dateString].temps;
                    const temp_max = Math.max(...temps);
                    const temp_min = Math.min(...temps);
                    
                    // Encontrar el clima más representativo (el que más se repite)
                    const weatherCounts = {};
                    dailyTemps[dateString].weather.forEach(w => {
                        weatherCounts[w.id] = (weatherCounts[w.id] || 0) + 1;
                    });
                    
                    let mostFrequentWeatherId = forecast.weather[0].id;
                    let maxCount = 0;
                    
                    for (const [id, count] of Object.entries(weatherCounts)) {
                        if (count > maxCount) {
                            maxCount = count;
                            mostFrequentWeatherId = parseInt(id);
                        }
                    }
                    
                    const representativeWeather = dailyTemps[dateString].weather.find(w => w.id === mostFrequentWeatherId) || forecast.weather[0];
                    
                    // Probabilidad de precipitación promedio
                    const avgPop = dailyTemps[dateString].pop.reduce((sum, pop) => sum + pop, 0) / dailyTemps[dateString].pop.length;
                    
                    // Agregar el pronóstico a nuestra lista
                    dailyForecasts.push({
                        date: date,
                        temp_max: temp_max,
                        temp_min: temp_min,
                        weather: representativeWeather,
                        pop: avgPop
                    });
                    
                    // Si ya tenemos 7 días, detenernos
                    if (dailyForecasts.length >= 7) {
                        return;
                    }
                });
            }
            
            // Si tenemos menos de 7 días, crear los días restantes con datos simulados
            while (dailyForecasts.length < 7) {
                const lastDay = dailyForecasts[dailyForecasts.length - 1];
                const nextDate = new Date(lastDay.date);
                nextDate.setDate(nextDate.getDate() + 1);
                
                dailyForecasts.push({
                    date: nextDate,
                    temp_max: lastDay.temp_max,
                    temp_min: lastDay.temp_min,
                    weather: { ...lastDay.weather },
                    pop: lastDay.pop || 0
                });
            }
        }
        
        // Mapeo de códigos de iconos a Material Symbols
        const iconMap = {
            '01d': 'wb_sunny', '01n': 'nightlight',
            '02d': 'partly_cloudy_day', '02n': 'partly_cloudy_night',
            '03d': 'cloud', '03n': 'cloud',
            '04d': 'cloudy', '04n': 'cloudy',
            '09d': 'rainy', '09n': 'rainy',
            '10d': 'rainy_light', '10n': 'rainy_light',
            '11d': 'thunderstorm', '11n': 'thunderstorm',
            '13d': 'ac_unit', '13n': 'ac_unit',
            '50d': 'foggy', '50n': 'foggy'
        };
        
        // Encontrar los contenedores para el pronóstico de 7 días
        const daysContainer = document.querySelector('.grid.grid-cols-7.gap-2.font-medium.text-sm.text-gray-500');
        const forecastContainer = document.querySelector('.grid.grid-cols-7.gap-2.text-center');
        
        if (!daysContainer || !forecastContainer) {
            console.error('No se encontraron los contenedores para el pronóstico de 7 días');
            return;
        }
        
        // Actualizar los nombres de los días
        const dayNames = daysContainer.querySelectorAll('div');
        dailyForecasts.forEach((forecast, index) => {
            if (dayNames[index]) {
                // Primer día es "Hoy", el resto son abreviaturas de día
                if (index === 0) {
                    dayNames[index].textContent = 'Hoy';
                } else {
                    const options = { weekday: 'short' };
                    dayNames[index].textContent = forecast.date.toLocaleDateString('es-ES', options);
                }
            }
        });
        
        // Actualizar las celdas de pronóstico
        const forecastCells = forecastContainer.querySelectorAll('.bg-gradient-to-b');
        
        dailyForecasts.forEach((forecast, index) => {
            if (forecastCells[index]) {
                const icon = iconMap[forecast.weather.icon] || 'wb_sunny';
                
                // Asegurarnos de que las temperaturas están en Celsius y redondeadas
                let tempMax = Math.round(forecast.temp_max);
                let tempMin = Math.round(forecast.temp_min);
                
                const iconElement = forecastCells[index].querySelector('.material-symbols-outlined');
                const tempMaxElement = forecastCells[index].querySelector('.font-bold');
                const tempMinElement = forecastCells[index].querySelector('.text-gray-600');
                
                console.log(`Día ${index} (${forecast.date.toDateString()}): max=${tempMax}°C, min=${tempMin}°C, clima=${forecast.weather.main}, pop=${forecast.pop ? Math.round(forecast.pop * 100) : 0}%`);
                
                if (iconElement) iconElement.textContent = icon;
                if (tempMaxElement) tempMaxElement.textContent = `${tempMax}°`;
                if (tempMinElement) tempMinElement.textContent = `${tempMin}°`;
                
                // Actualizar el fondo según el clima
                let bgClass = 'bg-gradient-to-b';
                
                // Ajustar el color según el clima y la probabilidad de precipitación
                if (forecast.pop > 0.3 || forecast.weather.main === 'Rain' || forecast.weather.main === 'Drizzle') {
                    // Lluvia o alta probabilidad de precipitación
                    forecastCells[index].className = `${bgClass} from-blue-100 to-indigo-200 p-3 rounded-lg transform hover:scale-105 transition-all`;
                } else if (forecast.weather.main === 'Clear') {
                    forecastCells[index].className = `${bgClass} from-amber-100 to-amber-200 p-3 rounded-lg transform hover:scale-105 transition-all`;
                } else if (forecast.weather.main === 'Clouds') {
                    if (forecast.weather.description && (forecast.weather.description.includes('few') || forecast.weather.description.includes('scattered'))) {
                        forecastCells[index].className = `${bgClass} from-blue-100 to-blue-200 p-3 rounded-lg transform hover:scale-105 transition-all`;
                    } else {
                        forecastCells[index].className = `${bgClass} from-gray-100 to-gray-200 p-3 rounded-lg transform hover:scale-105 transition-all`;
                    }
                } else if (forecast.weather.main === 'Thunderstorm') {
                    forecastCells[index].className = `${bgClass} from-purple-100 to-purple-200 p-3 rounded-lg transform hover:scale-105 transition-all`;
                } else if (forecast.weather.main === 'Snow') {
                    forecastCells[index].className = `${bgClass} from-blue-50 to-blue-100 p-3 rounded-lg transform hover:scale-105 transition-all`;
                }
            }
        });
        
        console.log('Pronóstico de 7 días actualizado correctamente');
    } catch (error) {
        console.error('Error al actualizar el pronóstico de 7 días:', error);
    }
}

// Función para obtener mapa de radar meteorológico
async function getWeatherMap(lat, lon, zoom = 6, layer = 'precipitation_new') {
    // OpenWeatherMap ofrece diferentes capas: precipitation_new, radar, temp_new, wind_new, clouds_new, pressure_new
    try {
        // Generar URL para el mapa estático basado en las coordenadas
        const tileX = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
        const tileY = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
        const mapUrl = `https://tile.openweathermap.org/map/${layer}/${zoom}/${tileX}/${tileY}.png?appid=${API_KEY}`;
        
        // Para la versión interactiva, crear URL basada en OpenLayers o Leaflet
        const interactiveMapUrl = `https://openweathermap.org/weathermap?basemap=map&cities=true&layer=${layer}&lat=${lat}&lon=${lon}&zoom=${zoom}`;
        
        return { 
            staticMapUrl: mapUrl,
            interactiveMapUrl: interactiveMapUrl,
            layer: layer,
            zoom: zoom,
            tileX: tileX,
            tileY: tileY
        };
    } catch (error) {
        console.error('Error al generar URL del mapa meteorológico:', error);
        return null;
    }
}

// Función para actualizar el radar meteorológico
async function updateWeatherRadar(lat, lon, layer = 'precipitation_new', zoom = 6) {
    try {
        // Buscar el contenedor del radar meteorológico
        let radarContainer = null;
        const allSections = document.querySelectorAll('h3.font-bold.text-lg.text-gray-800');
        
        for (let i = 0; i < allSections.length; i++) {
            if (allSections[i].textContent.includes('Weather Radar')) {
                radarContainer = allSections[i].closest('.bg-gradient-to-br');
                break;
            }
        }
        
        if (!radarContainer) {
            console.error('No se encontró el contenedor del radar meteorológico');
            return;
        }
        
        // Obtener los datos del mapa
        const mapData = await getWeatherMap(lat, lon, zoom, layer);
        if (!mapData) {
            console.error('No se pudieron obtener datos del mapa');
            return;
        }
        
        // Encontrar el contenedor del mapa interactivo
        const mapContainer = radarContainer.querySelector('.aspect-video');
        
        if (!mapContainer) {
            console.error('No se encontró el contenedor del mapa');
            return;
        }
        
        // Guardar las coordenadas para uso posterior
        radarContainer.dataset.lat = lat.toString();
        radarContainer.dataset.lon = lon.toString();
        radarContainer.dataset.layer = layer;
        radarContainer.dataset.zoom = zoom.toString();
        
        // Obtener la hora local para mostrarla en el mapa
        const now = new Date();
        // Si tenemos datos de zona horaria, usarlos para calcular la hora local
        let localTime = now;
        
        if (window.currentTimezoneOffset !== undefined) {
            localTime = new Date(now.getTime() + (window.currentTimezoneOffset * 1000) + (now.getTimezoneOffset() * 60000));
        }
        
        const timeString = localTime.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
        });
        
        // Capas disponibles y sus nombres en español
        const availableLayers = {
            'precipitation_new': 'Precipitación',
            'clouds_new': 'Nubosidad',
            'pressure_new': 'Presión',
            'wind_new': 'Viento',
            'temp_new': 'Temperatura'
        };
        
        // Crear elementos de control si no existen
        if (!radarContainer.querySelector('.layer-selector')) {
            // 1. Selector de capas
            const layerSelector = document.createElement('div');
            layerSelector.className = 'flex flex-wrap gap-1 mt-2';
            layerSelector.classList.add('layer-selector');
            
            // Crear botones para cada capa
            Object.entries(availableLayers).forEach(([layerKey, layerName]) => {
                const layerButton = document.createElement('button');
                layerButton.className = `text-xs px-2 py-1 rounded ${layerKey === layer ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600'} transition-colors duration-200`;
                layerButton.textContent = layerName;
                layerButton.dataset.layer = layerKey;
                
                layerButton.addEventListener('click', async () => {
                    // Actualizar estilo de botones
                    radarContainer.querySelectorAll('.layer-selector button').forEach(btn => {
                        btn.className = 'text-xs px-2 py-1 rounded bg-white text-indigo-600 transition-colors duration-200';
                    });
                    layerButton.className = 'text-xs px-2 py-1 rounded bg-indigo-600 text-white transition-colors duration-200';
                    
                    // Actualizar radar con nueva capa
                    const currentLat = parseFloat(radarContainer.dataset.lat);
                    const currentLon = parseFloat(radarContainer.dataset.lon);
                    const currentZoom = parseInt(radarContainer.dataset.zoom);
                    await updateWeatherRadar(currentLat, currentLon, layerKey, currentZoom);
                });
                
                layerSelector.appendChild(layerButton);
            });
            
            // 2. Controles de zoom
            const zoomControls = document.createElement('div');
            zoomControls.className = 'flex items-center gap-2 mt-2';
            zoomControls.classList.add('zoom-controls');
            
            // Botón de zoom out
            const zoomOutBtn = document.createElement('button');
            zoomOutBtn.className = 'bg-white text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center shadow-sm';
            zoomOutBtn.innerHTML = '<span class="material-symbols-outlined text-sm">remove</span>';
            zoomOutBtn.addEventListener('click', async () => {
                const currentLat = parseFloat(radarContainer.dataset.lat);
                const currentLon = parseFloat(radarContainer.dataset.lon);
                const currentLayer = radarContainer.dataset.layer;
                const currentZoom = parseInt(radarContainer.dataset.zoom);
                
                // Limitar el nivel mínimo de zoom a 3
                if (currentZoom > 3) {
                    await updateWeatherRadar(currentLat, currentLon, currentLayer, currentZoom - 1);
                }
            });
            
            // Nivel de zoom actual
            const zoomLevel = document.createElement('span');
            zoomLevel.className = 'text-xs font-medium text-gray-700';
            zoomLevel.textContent = `Zoom: ${zoom}`;
            zoomLevel.classList.add('zoom-level');
            
            // Botón de zoom in
            const zoomInBtn = document.createElement('button');
            zoomInBtn.className = 'bg-white text-indigo-600 rounded-full w-6 h-6 flex items-center justify-center shadow-sm';
            zoomInBtn.innerHTML = '<span class="material-symbols-outlined text-sm">add</span>';
            zoomInBtn.addEventListener('click', async () => {
                const currentLat = parseFloat(radarContainer.dataset.lat);
                const currentLon = parseFloat(radarContainer.dataset.lon);
                const currentLayer = radarContainer.dataset.layer;
                const currentZoom = parseInt(radarContainer.dataset.zoom);
                
                // Limitar el nivel máximo de zoom a 10
                if (currentZoom < 10) {
                    await updateWeatherRadar(currentLat, currentLon, currentLayer, currentZoom + 1);
                }
            });
            
            zoomControls.appendChild(zoomOutBtn);
            zoomControls.appendChild(zoomLevel);
            zoomControls.appendChild(zoomInBtn);
            
            // Añadir selector de capas y controles de zoom al contenedor
            const buttonContainer = radarContainer.querySelector('.flex.justify-between');
            if (buttonContainer) {
                buttonContainer.parentNode.insertBefore(layerSelector, buttonContainer.nextSibling);
                buttonContainer.parentNode.insertBefore(zoomControls, layerSelector.nextSibling);
            }
        } else {
            // Actualizar botones de capa activa
            radarContainer.querySelectorAll('.layer-selector button').forEach(btn => {
                btn.className = `text-xs px-2 py-1 rounded ${btn.dataset.layer === layer ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600'} transition-colors duration-200`;
            });
            
            // Actualizar nivel de zoom
            const zoomLevel = radarContainer.querySelector('.zoom-level');
            if (zoomLevel) {
                zoomLevel.textContent = `Zoom: ${zoom}`;
            }
        }
        
        // Actualizar el contenido del mapa
        mapContainer.innerHTML = `
            <div class="absolute inset-0 flex items-center justify-center">
                <div class="w-full h-full relative overflow-hidden">
                    <img src="${mapData.staticMapUrl}" alt="Mapa meteorológico" class="w-full h-full object-cover" />
                    <div class="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-indigo-900/50 to-transparent flex justify-between items-center">
                        <span class="text-white text-xs font-medium">${availableLayers[layer] || 'Radar meteorológico'}</span>
                        <span class="text-white text-xs font-medium">${timeString}</span>
                    </div>
                    <div class="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-indigo-900/50 to-transparent text-center">
                        <span class="text-white text-xs font-medium">Coordenadas: ${lat.toFixed(2)}, ${lon.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;
        
        // Actualizar botones para que sean funcionales
        const buttons = radarContainer.querySelectorAll('.flex.justify-between button');
        
        if (buttons.length >= 2) {
            // Botón de animación
            buttons[0].addEventListener('click', () => {
                // Alternar animación
                const mapImg = mapContainer.querySelector('img');
                if (mapImg) {
                    if (mapImg.classList.contains('animate-pulse')) {
                        mapImg.classList.remove('animate-pulse');
                        buttons[0].querySelector('span').textContent = 'play_arrow';
                    } else {
                        mapImg.classList.add('animate-pulse');
                        buttons[0].querySelector('span').textContent = 'pause';
                    }
                }
            });
            
            // Botón de pantalla completa/abrir mapa interactivo
            buttons[1].addEventListener('click', () => {
                window.open(mapData.interactiveMapUrl, '_blank');
            });
        }
        
        console.log('Radar meteorológico actualizado correctamente para', lat, lon, 'con capa', layer, 'y zoom', zoom);
    } catch (error) {
        console.error('Error al actualizar el radar meteorológico:', error);
    }
}

// Cargar datos iniciales
async function loadInitialData() {
    try {
        // Prevenir múltiples intentos de carga iniciales
        if (window.initialDataLoaded) {
            console.log('Los datos iniciales ya fueron cargados, omitiendo...');
            return;
        }
        
        // Definir una ciudad por defecto (Madrid)
        const defaultCity = 'Madrid';
        
        // Primero cargar los datos de la ciudad por defecto
        const weatherData = await getWeatherData(defaultCity);
        if (weatherData) {
            // Marcar como cargado para evitar cargas duplicadas
            window.initialDataLoaded = true;
            
            updateWeatherUI(weatherData);
            
            // Obtener datos adicionales usando coordenadas
            const lat = weatherData.coord.lat;
            const lon = weatherData.coord.lon;
            
            // Obtener pronóstico
            const forecastData = await getForecastData(defaultCity);
            updateHourlyForecast(forecastData);
            update7DayForecast(forecastData);
            
            // Actualizar el radar meteorológico
            updateWeatherRadar(lat, lon);
        } else {
            // Si no se pudieron cargar los datos, mostrar un mensaje de error
            console.error('No se pudieron cargar los datos iniciales');
            
            // Mostrar mensaje de error en la UI en lugar de pantalla de carga
            const mainContainer = document.querySelector('.bg-gradient-to-r.from-amber-400');
            if (mainContainer) {
                mainContainer.innerHTML = `
                    <div class="flex flex-col items-center justify-center p-8 text-center">
                        <span class="material-symbols-outlined text-5xl text-white mb-4">error</span>
                        <h2 class="text-white text-xl font-bold mb-2">Error de conexión</h2>
                        <p class="text-white/90 mb-4">No se pudo conectar con el servidor meteorológico.</p>
                        <button class="bg-white text-orange-500 px-4 py-2 rounded-lg shadow-md hover:bg-orange-100 transition-colors duration-300" 
                                onclick="window.location.reload()">
                            Reintentar
                        </button>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        
        // Mostrar mensaje de error en la UI
        const mainContainer = document.querySelector('.bg-gradient-to-r.from-amber-400');
        if (mainContainer) {
            mainContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center p-8 text-center">
                    <span class="material-symbols-outlined text-5xl text-white mb-4">error</span>
                    <h2 class="text-white text-xl font-bold mb-2">Error de conexión</h2>
                    <p class="text-white/90 mb-4">No se pudo conectar con el servidor meteorológico: ${error.message}</p>
                    <button class="bg-white text-orange-500 px-4 py-2 rounded-lg shadow-md hover:bg-orange-100 transition-colors duration-300" 
                            onclick="window.location.reload()">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
}

// Función para actualizar el reloj en tiempo real
function startClock() {
    // Actualizar la fecha y hora inmediatamente
    updateDateTime();
    
    // Actualizar cada minuto
    setInterval(updateDateTime, 60000);
}

// Actualizar solo la fecha y hora en la interfaz
function updateDateTime() {
    const now = new Date();
    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    
    const dateElement = document.querySelector('.text-white\\/90.text-lg');
    if (dateElement) {
        dateElement.textContent = `${now.toLocaleDateString('es-ES', dateOptions)} - ${now.toLocaleTimeString('es-ES', timeOptions)}`;
    }
}

// Lista de ciudades populares para sugerencias rápidas
const popularCities = [
    { name: 'Madrid', country: 'ES' },
    { name: 'Barcelona', country: 'ES' },
    { name: 'Valencia', country: 'ES' },
    { name: 'Sevilla', country: 'ES' },
    { name: 'Málaga', country: 'ES' },
    { name: 'París', country: 'FR' },
    { name: 'Londres', country: 'GB' },
    { name: 'Nueva York', country: 'US' },
    { name: 'Tokio', country: 'JP' },
    { name: 'Berlín', country: 'DE' },
    { name: 'Roma', country: 'IT' },
    { name: 'Ámsterdam', country: 'NL' },
    { name: 'Buenos Aires', country: 'AR' },
    { name: 'México DF', country: 'MX' },
    { name: 'Bogotá', country: 'CO' },
    { name: 'Santiago', country: 'CL' },
    { name: 'Lima', country: 'PE' }
];

// Función para buscar ciudades con la API de GeoDB Cities (alternativa gratuita a la API de OpenWeather)
async function searchCities(query) {
    if (!query || query.length < 2) return [];
    
    try {
        // Primero intentamos con las ciudades populares para resultados instantáneos
        const localResults = popularCities
            .filter(city => 
                city.name.toLowerCase().includes(query.toLowerCase()) ||
                `${city.name}, ${city.country}`.toLowerCase().includes(query.toLowerCase())
            )
            .map(city => ({
                name: city.name,
                country: city.country,
                displayName: `${city.name}, ${city.country}`
            }));
        
        // Si tenemos suficientes resultados locales, también consultamos la API para enriquecer resultados
        // pero ya no retornamos inmediatamente solo con resultados locales
        
        try {
            // Usar API de GeoDB Cities (gratuita con límite de 10 solicitudes por segundo)
            const response = await axios.get('https://wft-geo-db.p.rapidapi.com/v1/geo/cities', {
                params: {
                    namePrefix: query,
                    limit: 10,
                    sort: '-population'
                },
                headers: {
                    'X-RapidAPI-Key': '38cbb68abemshae8b091404cd1e0p12dad0jsn4e35bc60ac5d',
                    'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
                },
                timeout: 3000 // Timeout de 3 segundos
            });
            
            if (response.data && response.data.data) {
                const apiResults = response.data.data.map(city => ({
                    name: city.name,
                    country: city.countryCode,
                    displayName: `${city.name}, ${city.countryCode}`,
                    population: city.population || 0  // Añadimos la población para mejor ordenamiento
                }));
                
                // Combinar resultados locales y de API, eliminar duplicados
                const allResults = [...localResults];
                
                apiResults.forEach(apiCity => {
                    if (!allResults.some(localCity => 
                        localCity.name === apiCity.name && localCity.country === apiCity.country
                    )) {
                        allResults.push(apiCity);
                    }
                });
                
                // Ordenar resultados: primero populares, luego por población
                const sortedResults = allResults.sort((a, b) => {
                    // Verificar si es una ciudad popular (está en localResults)
                    const aIsPopular = localResults.some(city => city.name === a.name && city.country === a.country);
                    const bIsPopular = localResults.some(city => city.name === b.name && city.country === b.country);
                    
                    // Si ambas son populares o ambas no son populares, ordenar por relevancia al query
                    if (aIsPopular === bIsPopular) {
                        // Si el nombre de la ciudad comienza exactamente con el query, darle prioridad
                        const aStartsWith = a.name.toLowerCase().startsWith(query.toLowerCase());
                        const bStartsWith = b.name.toLowerCase().startsWith(query.toLowerCase());
                        
                        if (aStartsWith && !bStartsWith) return -1;
                        if (!aStartsWith && bStartsWith) return 1;
                        
                        // Si no, ordenar por población si está disponible
                        if (a.population && b.population) {
                            return b.population - a.population;
                        }
                        return 0;
                    }
                    
                    // Priorizar ciudades populares
                    return aIsPopular ? -1 : 1;
                });
                
                return sortedResults.slice(0, 8); // Aumentamos a 8 resultados para mostrar más opciones
            }
        } catch (apiError) {
            console.log('Error con la API externa de ciudades, usando solo resultados locales:', apiError);
            
            // Intentamos con OpenWeather como fallback si GeoDB falla
            try {
                const openWeatherResponse = await axios.get(`${BASE_URL}/find`, {
                    params: {
                        q: query,
                        appid: API_KEY,
                        limit: 5,
                        type: 'like'
                    },
                    timeout: 3000
                });
                
                if (openWeatherResponse.data && openWeatherResponse.data.list) {
                    const owResults = openWeatherResponse.data.list.map(city => ({
                        name: city.name,
                        country: city.sys.country,
                        displayName: `${city.name}, ${city.sys.country}`,
                        population: city.population || 0
                    }));
                    
                    // Combinar con resultados locales
                    const allResults = [...localResults];
                    
                    owResults.forEach(owCity => {
                        if (!allResults.some(localCity => 
                            localCity.name === owCity.name && localCity.country === owCity.country
                        )) {
                            allResults.push(owCity);
                        }
                    });
                    
                    return allResults.slice(0, 8);
                }
            } catch (owError) {
                console.log('Error con OpenWeather como fallback:', owError);
            }
        }
        
        // Si ambas APIs fallan o no devuelven resultados, usamos solo los resultados locales
        return localResults.slice(0, 8);
    } catch (error) {
        console.error('Error al buscar ciudades:', error);
        return [];
    }
}

// Inicializar autocompletado para el campo de búsqueda
function initializeAutocomplete() {
    const searchInput = document.querySelector('input[type="text"]');
    
    if (!searchInput) {
        console.error('No se encontró el campo de búsqueda');
        return;
    }
    
    // Crear contenedor para sugerencias si no existe
    let autocompleteContainer = document.getElementById('autocomplete-container');
    if (!autocompleteContainer) {
        autocompleteContainer = document.createElement('div');
        autocompleteContainer.id = 'autocomplete-container';
        autocompleteContainer.className = 'absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden';
        autocompleteContainer.style.display = 'none';
        autocompleteContainer.style.opacity = '0';
        autocompleteContainer.style.transition = 'opacity 300ms ease';
        searchInput.parentNode.appendChild(autocompleteContainer);
    }
    
    // Variable para el temporizador de debounce
    let debounceTimer;
    
    // Escuchar eventos de input
    searchInput.addEventListener('input', async (e) => {
        const query = e.target.value.trim();
        
        // Limpiar el temporizador anterior
        clearTimeout(debounceTimer);
        
        // Si el input está vacío, ocultar las sugerencias
        if (query.length < 2) {
            autocompleteContainer.style.opacity = '0';
            setTimeout(() => {
                autocompleteContainer.style.display = 'none';
                autocompleteContainer.innerHTML = '';
            }, 300);
            return;
        }
        
        // Esperar 300ms antes de buscar para no sobrecargar la API
        debounceTimer = setTimeout(async () => {
            // Mostrar indicador de carga
            autocompleteContainer.style.display = 'block';
            autocompleteContainer.innerHTML = `
                <div class="p-3 text-center">
                    <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-primary-500 mx-auto mb-1"></div>
                    <span class="text-gray-600 text-sm">Buscando ciudades...</span>
                </div>
            `;
            autocompleteContainer.style.opacity = '1';
            
            // Buscar ciudades
            const cities = await searchCities(query);
            
            // Actualizar contenedor de sugerencias
            if (cities.length > 0) {
                autocompleteContainer.innerHTML = '';
                
                // Añadir texto informativo
                const headerInfo = document.createElement('div');
                headerInfo.className = 'p-2 bg-gray-50 text-xs text-gray-500 font-medium border-b border-gray-100';
                headerInfo.textContent = `Resultados para "${query}"`;
                autocompleteContainer.appendChild(headerInfo);
                
                cities.forEach((city, index) => {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.className = `p-3 border-b border-gray-100 hover:bg-primary-50 cursor-pointer transition-colors ${index === 0 ? 'suggestion-active' : ''}`;
                    
                    // Determinar si es una ciudad popular para destacarla
                    const isPopular = popularCities.some(c => c.name === city.name && c.country === city.country);
                    const popularBadge = isPopular ? `<span class="ml-2 text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">Popular</span>` : '';
                    
                    suggestionItem.innerHTML = `
                        <div class="flex items-center">
                            <span class="material-symbols-outlined text-gray-400 mr-2 text-sm">location_city</span>
                            <span class="font-medium">${city.name}</span>
                            <span class="text-gray-500 ml-1 text-sm">${city.country}</span>
                            ${popularBadge}
                        </div>
                    `;
                    
                    // Animar entrada de la sugerencia
                    suggestionItem.style.opacity = '0';
                    suggestionItem.style.transform = 'translateY(10px)';
                    
                    suggestionItem.addEventListener('click', () => {
                        searchInput.value = city.name;
                        autocompleteContainer.style.display = 'none';
                        
                        // Simular presionar Enter para buscar
                        searchInput.dispatchEvent(new KeyboardEvent('keypress', {
                            key: 'Enter',
                            code: 'Enter',
                            bubbles: true
                        }));
                    });
                    
                    autocompleteContainer.appendChild(suggestionItem);
                    
                    // Animar aparición con delay
                    setTimeout(() => {
                        suggestionItem.style.transition = 'opacity 300ms, transform 300ms';
                        suggestionItem.style.opacity = '1';
                        suggestionItem.style.transform = 'translateY(0)';
                    }, index * 50);
                });
                
                // Añadir botón "Buscar más" si es necesario
                if (query.length >= 3) {
                    const searchMoreBtn = document.createElement('div');
                    searchMoreBtn.className = 'p-3 text-center text-primary-600 hover:bg-primary-50 cursor-pointer font-medium transition-colors';
                    searchMoreBtn.innerHTML = `
                        <div class="flex items-center justify-center">
                            <span class="material-symbols-outlined text-sm mr-1">search</span>
                            Buscar más ciudades con "${query}"
                        </div>
                    `;
                    
                    searchMoreBtn.addEventListener('click', async () => {
                        // Cambiar a indicador de carga
                        searchMoreBtn.innerHTML = `
                            <div class="flex items-center justify-center">
                                <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-primary-500 mr-2"></div>
                                Buscando más ciudades...
                            </div>
                        `;
                        
                        try {
                            // Intentar buscar con OpenWeather directamente
                            const response = await axios.get(`${BASE_URL}/find`, {
                                params: {
                                    q: query,
                                    appid: API_KEY,
                                    limit: 10,
                                    type: 'like'
                                },
                                timeout: 4000
                            });
                            
                            if (response.data && response.data.list && response.data.list.length > 0) {
                                // Formatear resultados y actualizar la lista
                                const moreResults = response.data.list.map(city => ({
                                    name: city.name,
                                    country: city.sys.country,
                                    displayName: `${city.name}, ${city.sys.country}`
                                }));
                                
                                // Limpiar el contenedor actual
                                autocompleteContainer.innerHTML = '';
                                
                                // Añadir texto informativo
                                const headerInfo = document.createElement('div');
                                headerInfo.className = 'p-2 bg-primary-50 text-xs text-primary-700 font-medium border-b border-gray-100';
                                headerInfo.textContent = `Resultados extendidos para "${query}"`;
                                autocompleteContainer.appendChild(headerInfo);
                                
                                // Mostrar resultados
                                moreResults.forEach((city, index) => {
                                    const suggestionItem = document.createElement('div');
                                    suggestionItem.className = `p-3 border-b border-gray-100 hover:bg-primary-50 cursor-pointer transition-colors ${index === 0 ? 'suggestion-active' : ''}`;
                                    
                                    suggestionItem.innerHTML = `
                                        <div class="flex items-center">
                                            <span class="material-symbols-outlined text-gray-400 mr-2 text-sm">location_city</span>
                                            <span class="font-medium">${city.name}</span>
                                            <span class="text-gray-500 ml-1 text-sm">${city.country}</span>
                                        </div>
                                    `;
                                    
                                    suggestionItem.addEventListener('click', () => {
                                        searchInput.value = city.name;
                                        autocompleteContainer.style.display = 'none';
                                        
                                        // Simular presionar Enter para buscar
                                        searchInput.dispatchEvent(new KeyboardEvent('keypress', {
                                            key: 'Enter',
                                            code: 'Enter',
                                            bubbles: true
                                        }));
                                    });
                                    
                                    autocompleteContainer.appendChild(suggestionItem);
                                });
                                
                                // Añadir botón para volver a resultados principales
                                const backBtn = document.createElement('div');
                                backBtn.className = 'p-2 text-center text-gray-500 hover:bg-gray-50 cursor-pointer text-sm transition-colors';
                                backBtn.innerHTML = `
                                    <div class="flex items-center justify-center">
                                        <span class="material-symbols-outlined text-xs mr-1">arrow_back</span>
                                        Volver a resultados principales
                                    </div>
                                `;
                                
                                backBtn.addEventListener('click', async () => {
                                    // Volver a mostrar los resultados originales
                                    const originalCities = await searchCities(query);
                                    updateAutocompleteResults(originalCities, query, autocompleteContainer);
                                });
                                
                                autocompleteContainer.appendChild(backBtn);
                            } else {
                                // Si no hay resultados
                                searchMoreBtn.innerHTML = `
                                    <div class="flex items-center justify-center text-gray-500">
                                        <span class="material-symbols-outlined text-sm mr-1">info</span>
                                        No se encontraron más ciudades
                                    </div>
                                `;
                                
                                // Restaurar después de 2 segundos
                                setTimeout(() => {
                                    searchMoreBtn.innerHTML = `
                                        <div class="flex items-center justify-center">
                                            <span class="material-symbols-outlined text-sm mr-1">search</span>
                                            Buscar más ciudades con "${query}"
                                        </div>
                                    `;
                                }, 2000);
                            }
                        } catch (error) {
                            console.error('Error al buscar más ciudades:', error);
                            searchMoreBtn.innerHTML = `
                                <div class="flex items-center justify-center text-red-500">
                                    <span class="material-symbols-outlined text-sm mr-1">error</span>
                                    Error al buscar más ciudades
                                </div>
                            `;
                            
                            // Restaurar después de 2 segundos
                            setTimeout(() => {
                                searchMoreBtn.innerHTML = `
                                    <div class="flex items-center justify-center">
                                        <span class="material-symbols-outlined text-sm mr-1">search</span>
                                        Buscar más ciudades con "${query}"
                                    </div>
                                `;
                            }, 2000);
                        }
                    });
                    
                    autocompleteContainer.appendChild(searchMoreBtn);
                }
            } else {
                autocompleteContainer.innerHTML = `
                    <div class="p-3 text-center text-gray-500">
                        <span class="material-symbols-outlined text-gray-400 block mx-auto mb-1">search_off</span>
                        No se encontraron ciudades con "${query}"
                        <div class="text-xs mt-1 text-gray-400">Prueba con otro nombre o escribe al menos 3 letras</div>
                    </div>
                `;
            }
        }, 300);
    });
    
    // Navegar por las sugerencias con el teclado
    searchInput.addEventListener('keydown', (e) => {
        if (!autocompleteContainer.style.display || autocompleteContainer.style.display === 'none') {
            return;
        }
        
        const suggestions = autocompleteContainer.querySelectorAll('div[class*="hover:bg-primary-50"]');
        const activeIndex = Array.from(suggestions).findIndex(item => item.classList.contains('suggestion-active'));
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (suggestions.length > 0) {
                    // Remover clase active del actual
                    if (activeIndex >= 0) {
                        suggestions[activeIndex].classList.remove('suggestion-active');
                    }
                    
                    // Añadir clase active al siguiente, o al primero si estamos al final
                    const nextIndex = activeIndex < suggestions.length - 1 ? activeIndex + 1 : 0;
                    suggestions[nextIndex].classList.add('suggestion-active');
                    
                    // Asegurarse de que sea visible
                    suggestions[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                break;
            
            case 'ArrowUp':
                e.preventDefault();
                if (suggestions.length > 0) {
                    // Remover clase active del actual
                    if (activeIndex >= 0) {
                        suggestions[activeIndex].classList.remove('suggestion-active');
                    }
                    
                    // Añadir clase active al anterior, o al último si estamos al inicio
                    const prevIndex = activeIndex > 0 ? activeIndex - 1 : suggestions.length - 1;
                    suggestions[prevIndex].classList.add('suggestion-active');
                    
                    // Asegurarse de que sea visible
                    suggestions[prevIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                break;
            
            case 'Enter':
                if (activeIndex >= 0) {
                    e.preventDefault();
                    const activeSuggestion = suggestions[activeIndex];
                    const cityName = activeSuggestion.querySelector('.font-medium').textContent;
                    searchInput.value = cityName;
                    autocompleteContainer.style.display = 'none';
                    
                    // Simular búsqueda de la ciudad seleccionada
                    searchInput.dispatchEvent(new KeyboardEvent('keypress', {
                        key: 'Enter',
                        code: 'Enter',
                        bubbles: true
                    }));
                }
                break;
            
            case 'Escape':
                autocompleteContainer.style.opacity = '0';
                setTimeout(() => {
                    autocompleteContainer.style.display = 'none';
                }, 300);
                break;
        }
    });
    
    // Cerrar sugerencias al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !autocompleteContainer.contains(e.target)) {
            autocompleteContainer.style.opacity = '0';
            setTimeout(() => {
                autocompleteContainer.style.display = 'none';
            }, 300);
        }
    });
    
    // Función auxiliar para actualizar resultados del autocompletado
    function updateAutocompleteResults(cities, query, container) {
        container.innerHTML = '';
        
        // Añadir texto informativo
        const headerInfo = document.createElement('div');
        headerInfo.className = 'p-2 bg-gray-50 text-xs text-gray-500 font-medium border-b border-gray-100';
        headerInfo.textContent = `Resultados para "${query}"`;
        container.appendChild(headerInfo);
        
        cities.forEach((city, index) => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = `p-3 border-b border-gray-100 hover:bg-primary-50 cursor-pointer transition-colors ${index === 0 ? 'suggestion-active' : ''}`;
            
            // Determinar si es una ciudad popular para destacarla
            const isPopular = popularCities.some(c => c.name === city.name && c.country === city.country);
            const popularBadge = isPopular ? `<span class="ml-2 text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">Popular</span>` : '';
            
            suggestionItem.innerHTML = `
                <div class="flex items-center">
                    <span class="material-symbols-outlined text-gray-400 mr-2 text-sm">location_city</span>
                    <span class="font-medium">${city.name}</span>
                    <span class="text-gray-500 ml-1 text-sm">${city.country}</span>
                    ${popularBadge}
                </div>
            `;
            
            suggestionItem.addEventListener('click', () => {
                searchInput.value = city.name;
                container.style.display = 'none';
                
                // Simular presionar Enter para buscar
                searchInput.dispatchEvent(new KeyboardEvent('keypress', {
                    key: 'Enter',
                    code: 'Enter',
                    bubbles: true
                }));
            });
            
            container.appendChild(suggestionItem);
        });
        
        // Añadir botón "Buscar más" si es necesario
        if (query.length >= 3) {
            const searchMoreBtn = document.createElement('div');
            searchMoreBtn.className = 'p-3 text-center text-primary-600 hover:bg-primary-50 cursor-pointer font-medium transition-colors';
            searchMoreBtn.innerHTML = `
                <div class="flex items-center justify-center">
                    <span class="material-symbols-outlined text-sm mr-1">search</span>
                    Buscar más ciudades con "${query}"
                </div>
            `;
            
            searchMoreBtn.addEventListener('click', async () => {
                // Implementación igual que antes...
                // Este código es duplicado, se podría optimizar con una función
                searchMoreBtn.innerHTML = `
                    <div class="flex items-center justify-center">
                        <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-primary-500 mr-2"></div>
                        Buscando más ciudades...
                    </div>
                `;
                
                try {
                    // Intentar buscar con OpenWeather directamente
                    const response = await axios.get(`${BASE_URL}/find`, {
                        params: {
                            q: query,
                            appid: API_KEY,
                            limit: 10,
                            type: 'like'
                        },
                        timeout: 4000
                    });
                    
                    if (response.data && response.data.list && response.data.list.length > 0) {
                        // Formatear resultados y actualizar la lista
                        const moreResults = response.data.list.map(city => ({
                            name: city.name,
                            country: city.sys.country,
                            displayName: `${city.name}, ${city.sys.country}`
                        }));
                        
                        // Limpiar el contenedor actual
                        container.innerHTML = '';
                        
                        // Añadir texto informativo
                        const headerInfo = document.createElement('div');
                        headerInfo.className = 'p-2 bg-primary-50 text-xs text-primary-700 font-medium border-b border-gray-100';
                        headerInfo.textContent = `Resultados extendidos para "${query}"`;
                        container.appendChild(headerInfo);
                        
                        // Mostrar resultados
                        moreResults.forEach((city, index) => {
                            const suggestionItem = document.createElement('div');
                            suggestionItem.className = `p-3 border-b border-gray-100 hover:bg-primary-50 cursor-pointer transition-colors ${index === 0 ? 'suggestion-active' : ''}`;
                            
                            suggestionItem.innerHTML = `
                                <div class="flex items-center">
                                    <span class="material-symbols-outlined text-gray-400 mr-2 text-sm">location_city</span>
                                    <span class="font-medium">${city.name}</span>
                                    <span class="text-gray-500 ml-1 text-sm">${city.country}</span>
                                </div>
                            `;
                            
                            suggestionItem.addEventListener('click', () => {
                                searchInput.value = city.name;
                                container.style.display = 'none';
                                
                                // Simular presionar Enter para buscar
                                searchInput.dispatchEvent(new KeyboardEvent('keypress', {
                                    key: 'Enter',
                                    code: 'Enter',
                                    bubbles: true
                                }));
                            });
                            
                            container.appendChild(suggestionItem);
                        });
                        
                        // Añadir botón para volver a resultados principales
                        const backBtn = document.createElement('div');
                        backBtn.className = 'p-2 text-center text-gray-500 hover:bg-gray-50 cursor-pointer text-sm transition-colors';
                        backBtn.innerHTML = `
                            <div class="flex items-center justify-center">
                                <span class="material-symbols-outlined text-xs mr-1">arrow_back</span>
                                Volver a resultados principales
                            </div>
                        `;
                        
                        backBtn.addEventListener('click', async () => {
                            // Volver a mostrar los resultados originales
                            updateAutocompleteResults(cities, query, container);
                        });
                        
                        container.appendChild(backBtn);
                    } else {
                        // Si no hay resultados
                        searchMoreBtn.innerHTML = `
                            <div class="flex items-center justify-center text-gray-500">
                                <span class="material-symbols-outlined text-sm mr-1">info</span>
                                No se encontraron más ciudades
                            </div>
                        `;
                        
                        // Restaurar después de 2 segundos
                        setTimeout(() => {
                            searchMoreBtn.innerHTML = `
                                <div class="flex items-center justify-center">
                                    <span class="material-symbols-outlined text-sm mr-1">search</span>
                                    Buscar más ciudades con "${query}"
                                </div>
                            `;
                        }, 2000);
                    }
                } catch (error) {
                    console.error('Error al buscar más ciudades:', error);
                    searchMoreBtn.innerHTML = `
                        <div class="flex items-center justify-center text-red-500">
                            <span class="material-symbols-outlined text-sm mr-1">error</span>
                            Error al buscar más ciudades
                        </div>
                    `;
                    
                    // Restaurar después de 2 segundos
                    setTimeout(() => {
                        searchMoreBtn.innerHTML = `
                            <div class="flex items-center justify-center">
                                <span class="material-symbols-outlined text-sm mr-1">search</span>
                                Buscar más ciudades con "${query}"
                            </div>
                        `;
                    }, 2000);
                }
            });
            
            container.appendChild(searchMoreBtn);
        }
    }
    
    // Mostrar sugerencias al enfocar el input si hay texto
    searchInput.addEventListener('focus', async (e) => {
        const query = e.target.value.trim();
        if (query.length >= 2) {
            const cities = await searchCities(query);
            if (cities.length > 0) {
                updateAutocompleteResults(cities, query, autocompleteContainer);
                autocompleteContainer.style.display = 'block';
                autocompleteContainer.style.opacity = '1';
            }
        }
    });
}

// Inicializar la aplicación
function initApp() {
    // Obtener elementos del DOM
    const searchInput = document.querySelector('input[type="text"]');
    const currentLocationBtn = document.querySelector('button');
    const languageSelect = document.getElementById('language-select');
    
    // Añadir enfoque automático al buscador
    document.addEventListener('keydown', (event) => {
        // Verificar si la tecla presionada es una letra (a-z, A-Z)
        if (/^[a-zA-Z]$/.test(event.key)) {
            // Verificar que el foco no esté ya en el buscador
            if (document.activeElement !== searchInput) {
                searchInput.focus();
                // Añadir el carácter presionado al valor del input
                searchInput.value += event.key;
            }
        }
    });

    console.log('DOM cargado. Inicializando aplicación...');
    
    // Inicializar selector de idioma
    if (languageSelect) {
        console.log('Selector de idioma encontrado');
        languageSelect.addEventListener('change', (e) => {
            console.log(`Cambiando idioma a: ${e.target.value}`);
            setLanguage(e.target.value);
            updateTexts();
        });
        
        // Establecer idioma inicial
        languageSelect.value = currentLanguage;
    }
    
    // Función para actualizar textos según el idioma
    function updateTexts() {
        // Actualizar campo de búsqueda
        if (searchInput) {
            searchInput.placeholder = t('search');
        }
        
        // Actualizar botón de ubicación actual
        if (currentLocationBtn) {
            const buttonText = currentLocationBtn.lastChild;
            if (buttonText && buttonText.nodeType === Node.TEXT_NODE) {
                buttonText.textContent = ` ${t('currentLocation')}`;
            }
        }
        
        // Actualizar títulos de tarjetas
        document.querySelectorAll('.font-bold.text-lg.text-gray-800').forEach(el => {
            if (el.textContent.includes('Sunrise') || el.textContent.includes('Amanecer')) {
                el.textContent = `${t('sunrise')} & ${t('sunset')}`;
            }
        });
    }
    
    // Actualizar textos iniciales
    updateTexts();
    
    // Inicializar autocompletado
    initializeAutocomplete();
    
    // Cargar datos iniciales
    loadInitialData();
    
    // Iniciar reloj
    startClock();
    
    // Botón de ubicación actual
    if (currentLocationBtn) {
        currentLocationBtn.addEventListener('click', async () => {
            console.log('Obteniendo ubicación actual...');
            
            try {
                // Efecto de carga sobre el botón
                currentLocationBtn.classList.add('opacity-75');
                currentLocationBtn.disabled = true;
                
                // Solicitar geolocalización
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        console.log(`Ubicación obtenida: ${latitude}, ${longitude}`);
                        
                        // Obtener datos del clima por coordenadas
                        try {
                            const weatherData = await getWeatherByCoordinates(latitude, longitude);
                            updateWeatherUI(weatherData);
                            
                            // Obtener y actualizar pronóstico
                            const forecastData = await getForecastByCoordinates(latitude, longitude);
                            updateHourlyForecast(forecastData);
                            update7DayForecast(forecastData);
                            
                            // Actualizar el radar meteorológico
                            updateWeatherRadar(latitude, longitude);
                        } catch (error) {
                            console.error('Error al obtener datos del clima por coordenadas:', error);
                        }
                        
                        // Restaurar botón
                        currentLocationBtn.classList.remove('opacity-75');
                        currentLocationBtn.disabled = false;
                    },
                    (error) => {
                        console.error('Error al obtener ubicación:', error);
                        
                        // Restaurar botón
                        currentLocationBtn.classList.remove('opacity-75');
                        currentLocationBtn.disabled = false;
                        
                        // Mostrar error
                        alert('No se pudo obtener tu ubicación. Verifica que hayas dado permiso para acceder a tu ubicación.');
                    },
                    {
                        enableHighAccuracy: false,
                        timeout: 5000,
                        maximumAge: 0
                    }
                );
            } catch (error) {
                console.error('Error al solicitar geolocalización:', error);
                currentLocationBtn.classList.remove('opacity-75');
                currentLocationBtn.disabled = false;
            }
        });
    } else {
        console.error('No se encontró el botón de ubicación actual');
    }
    
    // Campo de búsqueda
    if (searchInput) {
        searchInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const city = e.target.value;
                console.log('Buscando ciudad:', city);
                
                // Animar búsqueda
                const searchIcon = searchInput.nextElementSibling;
                if (searchIcon) {
                    Animator.pulse(searchIcon, 1.2, 400);
                }
                
                // Limpiar el campo de búsqueda
                e.target.value = '';
                
                try {
                    const weatherData = await getWeatherData(city);
                    if (weatherData) {
                        // Actualizar la interfaz principal
                        updateWeatherUI(weatherData);
                        
                        // Obtener y actualizar pronósticos
                        const forecastData = await getForecastData(city);
                        updateHourlyForecast(forecastData);
                        update7DayForecast(forecastData);
                    }
                } catch (error) {
                    console.error('Error al buscar ciudad:', error);
                }
            }
        });
    } else {
        console.error('No se encontró el campo de búsqueda');
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', initApp); 