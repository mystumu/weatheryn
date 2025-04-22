import axios from 'axios';
import * as L from 'leaflet';
import { config } from './config.js';

// Configuración de las API keys y URLs base
const API_KEY = localStorage.getItem('openweather_api_key');
const GNEWS_API_KEY = localStorage.getItem('gnews_api_key');
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

if (!API_KEY) {
    console.error('Error: No se ha encontrado la clave API de OpenWeather.');
    // Redirigir a la página de configuración si no hay API key
    window.location.href = 'config.html';
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
        console.log('Obteniendo datos de calidad del aire para:', { lat, lon });
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
            console.log('Datos de calidad del aire recibidos:', response.data);
            return response.data;
        };
        
        // Intentar obtener datos de la caché o hacer una nueva petición
        const data = await WeatherCache.getWithUpdate('airQuality', locationKey, fetchFreshAirQuality);
        console.log('Datos de calidad del aire (desde caché o frescos):', data);
        return data;
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
        const apiKey = localStorage.getItem('gnews_api_key');
        if (!apiKey) {
            throw new Error('API key de GNews no configurada');
        }

        const query = encodeURIComponent('weather OR climate OR meteorology');
        const url = `https://gnews.io/api/v4/search?q=${query}&lang=${country}&country=${country}&max=10&apikey=${apiKey}`;
        
        const response = await axios.get(url);
        if (response.data && response.data.articles) {
            return response.data.articles;
        }
        throw new Error('Formato de respuesta inválido');
    } catch (error) {
        console.warn('Error con la API de noticias principal:', error);
        
        // Si es un error de autenticación, redirigir a la página de configuración
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('gnews_api_key'); // Limpiar la key inválida
            window.location.href = 'config.html?error=invalid_gnews_key';
            return null;
        }
        
        // Intentar con API alternativa o mostrar mensaje de error
        return null;
    }
}

// Función para actualizar la sección de noticias meteorológicas
async function updateWeatherNews(country) {
    try {
        const newsContainer = document.getElementById('weather-news');
        if (!newsContainer) {
            console.warn('No se encontró el contenedor de noticias');
            return;
        }

        // Mostrar estado de carga
        newsContainer.innerHTML = `
            <div class="flex items-center justify-center p-4">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                <span class="ml-2 text-gray-600">Cargando noticias...</span>
            </div>
        `;

        const articles = await getWeatherNews(country);
        
        if (!articles || articles.length === 0) {
            newsContainer.innerHTML = `
                <div class="text-center p-4">
                    <span class="material-symbols-outlined text-4xl text-gray-400">news_off</span>
                    <p class="text-gray-600 mt-2">No hay noticias disponibles en este momento</p>
                </div>
            `;
            return;
        }

        // Guardar los artículos en una variable global para acceder desde showMoreNews
        window.newsArticles = articles;

        // Mostrar solo la primera noticia inicialmente
        renderNews(articles, 1);
        
        console.log('Noticias meteorológicas actualizadas correctamente');
    } catch (error) {
        console.error('Error al actualizar noticias:', error);
        if (newsContainer) {
            newsContainer.innerHTML = `
                <div class="text-center p-4">
                    <span class="material-symbols-outlined text-4xl text-red-400">error</span>
                    <p class="text-gray-600 mt-2">No se pudieron cargar las noticias</p>
                    <button onclick="updateWeatherNews('${country}')" 
                            class="mt-2 text-sm text-amber-500 hover:text-amber-600">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
}

// Función para renderizar las noticias
function renderNews(articles, numArticles) {
    const newsContainer = document.getElementById('weather-news');
    if (!newsContainer || !articles) return;

    const getIconForNews = (title, description) => {
        const text = (title + ' ' + description).toLowerCase();
        if (text.includes('lluvia') || text.includes('precipitacion')) return 'rainy';
        if (text.includes('nube')) return 'cloudy';
        if (text.includes('sol')) return 'sunny';
        if (text.includes('viento')) return 'air';
        if (text.includes('temperatura') || text.includes('calor') || text.includes('frío')) return 'device_thermostat';
        if (text.includes('tormenta')) return 'thunderstorm';
        if (text.includes('nieve')) return 'weather_snowy';
        return 'newspaper';
    };

    const getColorForIcon = (icon) => {
        switch (icon) {
            case 'rainy': return 'text-blue-500';
            case 'cloudy': return 'text-gray-500';
            case 'sunny': return 'text-amber-500';
            case 'air': return 'text-teal-500';
            case 'device_thermostat': return 'text-red-500';
            case 'thunderstorm': return 'text-purple-500';
            case 'weather_snowy': return 'text-blue-300';
            default: return 'text-gray-600';
        }
    };

    // Mostrar el número especificado de noticias
    const visibleArticles = articles.slice(0, numArticles);

    const newsHTML = visibleArticles.map(article => {
        const icon = getIconForNews(article.title, article.description);
        const iconColor = getColorForIcon(icon);
        const date = new Date(article.publishedAt).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long'
        });

        return `
            <a href="${article.url}" target="_blank" 
               class="block p-4 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100">
                <div class="flex items-start">
                    <span class="material-symbols-outlined ${iconColor} text-2xl mr-3">${icon}</span>
                    <div class="flex-1">
                        <h3 class="font-semibold text-gray-900 mb-1">${article.title}</h3>
                        <p class="text-gray-600 text-sm mb-2">${article.description}</p>
                        <div class="flex items-center text-xs text-gray-500">
                            <span class="material-symbols-outlined text-sm mr-1">calendar_today</span>
                            ${date}
                            <span class="mx-2">•</span>
                            <span class="material-symbols-outlined text-sm mr-1">public</span>
                            ${article.source.name}
                        </div>
                    </div>
                </div>
            </a>
        `;
    }).join('');

    // Añadir botón según el número de noticias mostradas
    const buttonHTML = numArticles === 1 ? `
        <div class="p-4 text-center">
            <button onclick="showMoreNews()" 
                    class="text-amber-500 hover:text-amber-600 font-medium flex items-center mx-auto">
                <span>Ver más noticias</span>
                <span class="material-symbols-outlined ml-1">expand_more</span>
            </button>
        </div>
    ` : `
        <div class="p-4 text-center">
            <button onclick="showLessNews()" 
                    class="text-amber-500 hover:text-amber-600 font-medium flex items-center mx-auto">
                <span>Ver menos</span>
                <span class="material-symbols-outlined ml-1">expand_less</span>
            </button>
        </div>
    `;

    newsContainer.innerHTML = newsHTML + buttonHTML;
}

// Función para mostrar más noticias (accesible globalmente)
window.showMoreNews = function() {
    if (window.newsArticles) {
        renderNews(window.newsArticles, 3); // Mostrar 3 noticias
    }
};

// Función para mostrar menos noticias (accesible globalmente)
window.showLessNews = function() {
    if (window.newsArticles) {
        renderNews(window.newsArticles, 1); // Mostrar solo 1 noticia
    }
};

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
async function updateWeatherUI(data) {
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
        if (data.coord) {
            console.log('Obteniendo calidad del aire para coordenadas:', data.coord);
            try {
                const airQualityData = await getAirQualityData(data.coord.lat, data.coord.lon);
                if (airQualityData) {
                    updateAirQuality(airQualityData);
                } else {
                    console.error('No se pudieron obtener datos de calidad del aire');
                }
            } catch (error) {
                console.error('Error al actualizar calidad del aire:', error);
            }
        }
        
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
        
        // Actualizar el mapa geológico con las nuevas coordenadas
        if (data.coord) {
            updateGeologicalMap(data.coord.lat, data.coord.lon);
        }

        // Añadir botón de configuración
        const weatherCard = document.querySelector('.weather-card');
        if (weatherCard) {
            const configButton = document.createElement('button');
            configButton.className = 'absolute top-4 right-4 p-2 text-gray-600 hover:text-gray-800 transition-colors duration-300';
            configButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            `;
            configButton.addEventListener('click', () => {
                window.location.href = 'config.html';
            });
            weatherCard.appendChild(configButton);
        }
    } catch (error) {
        console.error('Error al actualizar la interfaz:', error);
    }
}

// Actualizar el pie de página con la fecha y hora actual
function updateFooter() {
    const footer = document.querySelector('footer');
    if (footer) {
        footer.innerHTML = `
            <div class="container mx-auto px-4 py-4">
                <div class="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    <div class="text-sm text-gray-600">
                        © ${new Date().getFullYear()} WeatheRyn. Todos los derechos reservados.
                    </div>
                    <div class="flex space-x-6">
                        <a href="privacy.html" class="text-sm text-gray-600 hover:text-gray-800 transition-colors">
                            Privacidad
                        </a>
                        <a href="terms.html" class="text-sm text-gray-600 hover:text-gray-800 transition-colors">
                            Términos
                        </a>
                        <a href="config.html" class="text-sm text-gray-600 hover:text-gray-800 transition-colors flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                            Configuración
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
}

// Actualizar información de amanecer y atardecer
function updateSunriseSunset(sunrise, sunset, timezone = 0) {
    // Convertir timestamps a fechas locales considerando el huso horario
    const localOffset = new Date().getTimezoneOffset() * 60;
    const cityOffset = timezone || 0;
    const offsetDiff = cityOffset + localOffset;

    const sunriseTime = new Date((sunrise + offsetDiff) * 1000);
    const sunsetTime = new Date((sunset + offsetDiff) * 1000);
    
    // Convertir a hora local de la ciudad
    const sunriseLocal = sunriseTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const sunsetLocal = sunsetTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    
    // Actualizar textos
    document.querySelector('[data-sunrise]').textContent = sunriseLocal;
    document.querySelector('[data-sunset]').textContent = sunsetLocal;
    
    // Calcular duración del día
    const dayDuration = sunsetTime - sunriseTime;
    const hours = Math.floor(dayDuration / (1000 * 60 * 60));
    const minutes = Math.floor((dayDuration % (1000 * 60 * 60)) / (1000 * 60));
    document.querySelector('[data-daylight]').textContent = `${hours} horas ${minutes} minutos de luz solar`;
    
    // Limpiar cualquier intervalo anterior
    if (window.sunProgressInterval) {
        clearInterval(window.sunProgressInterval);
    }
    
    function updateProgressBar() {
        // Obtener la hora actual en la zona horaria de la ciudad
        const now = new Date();
        const cityTime = new Date(now.getTime() + (offsetDiff * 1000));
        
        const minutesSinceMidnight = cityTime.getHours() * 60 + cityTime.getMinutes();
        const sunriseMinutes = sunriseTime.getHours() * 60 + sunriseTime.getMinutes();
        const sunsetMinutes = sunsetTime.getHours() * 60 + sunsetTime.getMinutes();
        
        // Calcular el progreso basado en las 24 horas (1440 minutos)
        const progress = (minutesSinceMidnight / 1440) * 100;
        
        // Calcular las posiciones del amanecer y atardecer en la barra
        const sunrisePosition = (sunriseMinutes / 1440) * 100;
        const sunsetPosition = (sunsetMinutes / 1440) * 100;
        
        let gradient = '';
        
        // Determinar el color basado en la hora del día
        if (minutesSinceMidnight < sunriseMinutes) {
            // Noche antes del amanecer (00:00 - amanecer)
            gradient = 'from-gray-900 via-gray-800 to-gray-700';
        } else if (minutesSinceMidnight > sunsetMinutes) {
            // Noche después del atardecer (atardecer - 23:59)
            gradient = 'from-gray-700 via-gray-800 to-gray-900';
        } else {
            // Durante el día (amanecer - atardecer)
            const dayProgress = (minutesSinceMidnight - sunriseMinutes) / (sunsetMinutes - sunriseMinutes);
            
            if (dayProgress < 0.25) {
                gradient = 'from-gray-700 via-amber-300 to-amber-400';
            } else if (dayProgress < 0.5) {
                gradient = 'from-amber-300 via-amber-400 to-amber-500';
            } else if (dayProgress < 0.75) {
                gradient = 'from-amber-400 via-amber-500 to-amber-600';
            } else {
                gradient = 'from-amber-500 via-amber-600 to-amber-700';
            }
        }
        
        const progressBar = document.getElementById('sun-progress');
        const sunIndicator = document.getElementById('sun-indicator');
        const container = progressBar?.parentElement;
        
        if (progressBar && sunIndicator && container) {
            // Actualizar la barra de progreso
            progressBar.style.width = `${progress}%`;
            progressBar.className = `h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${gradient}`;
            
            // Actualizar el indicador del sol/luna
            sunIndicator.style.left = `${progress}%`;
            sunIndicator.innerHTML = minutesSinceMidnight < sunriseMinutes || minutesSinceMidnight > sunsetMinutes ? '🌙' : '☀️';
            
            // Añadir marcadores de amanecer y atardecer si no existen
            const existingSunriseMarker = container.querySelector('.sunrise-marker');
            const existingSunsetMarker = container.querySelector('.sunset-marker');
            
            if (existingSunriseMarker) {
                existingSunriseMarker.style.left = `${sunrisePosition}%`;
                existingSunriseMarker.title = `Amanecer: ${sunriseLocal}`;
            } else {
                const sunriseMarker = document.createElement('div');
                sunriseMarker.className = 'sunrise-marker absolute w-0.5 h-3 bg-amber-400 transform -translate-y-1';
                sunriseMarker.style.left = `${sunrisePosition}%`;
                sunriseMarker.title = `Amanecer: ${sunriseLocal}`;
                container.appendChild(sunriseMarker);
            }
            
            if (existingSunsetMarker) {
                existingSunsetMarker.style.left = `${sunsetPosition}%`;
                existingSunsetMarker.title = `Atardecer: ${sunsetLocal}`;
            } else {
                const sunsetMarker = document.createElement('div');
                sunsetMarker.className = 'sunset-marker absolute w-0.5 h-3 bg-amber-600 transform -translate-y-1';
                sunsetMarker.style.left = `${sunsetPosition}%`;
                sunsetMarker.title = `Atardecer: ${sunsetLocal}`;
                container.appendChild(sunsetMarker);
            }
            
            // Añadir hora actual si no existe
            const timeDisplay = container.querySelector('.time-display') || (() => {
                const div = document.createElement('div');
                div.className = 'time-display absolute -top-6 transform -translate-x-1/2 text-xs text-gray-600';
                container.appendChild(div);
                return div;
            })();
            
            // Actualizar la hora actual en la zona horaria de la ciudad
            const currentTime = cityTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            timeDisplay.textContent = currentTime;
            timeDisplay.style.left = `${progress}%`;
        }
    }
    
    // Actualizar cada minuto
    updateProgressBar();
    window.sunProgressInterval = setInterval(updateProgressBar, 60000);
}

// Actualizar información de calidad del aire
function updateAirQuality(airQualityData) {
    if (!airQualityData || !airQualityData.list || airQualityData.list.length === 0) {
        console.error('Datos de calidad del aire no válidos:', airQualityData);
        return;
    }

    // Buscar el contenedor de calidad del aire
    const airQualityContainer = document.querySelector('[data-air-quality]');
    if (!airQualityContainer) {
        console.error('No se encontró el contenedor de calidad del aire');
        return;
    }

    try {
        const aqi = airQualityData.list[0].main.aqi;
        console.log('AQI recibido:', aqi, typeof aqi);
        
        const components = airQualityData.list[0].components;
        console.log('Componentes:', components);

        // Definir los niveles de calidad del aire
        const aqiLevels = {
            1: { text: 'Buena', color: 'text-green-500', bg: 'bg-green-500/20', description: 'La calidad del aire es satisfactoria y la contaminación del aire presenta poco o ningún riesgo.' },
            2: { text: 'Moderada', color: 'text-yellow-500', bg: 'bg-yellow-500/20', description: 'La calidad del aire es aceptable. Sin embargo, puede haber un riesgo para algunos grupos sensibles.' },
            3: { text: 'Dañina para grupos sensibles', color: 'text-orange-500', bg: 'bg-orange-500/20', description: 'Los miembros de grupos sensibles pueden experimentar efectos en la salud.' },
            4: { text: 'Dañina', color: 'text-red-500', bg: 'bg-red-500/20', description: 'Algunos miembros de la población general pueden experimentar efectos en la salud.' },
            5: { text: 'Muy dañina', color: 'text-purple-500', bg: 'bg-purple-500/20', description: 'Advertencia de emergencia sanitaria. Toda la población probablemente se verá afectada.' }
        };

        // Asegurarse de que aqi es un número válido
        const validAqi = Number(aqi);
        if (isNaN(validAqi) || validAqi < 1 || validAqi > 5) {
            console.error('AQI no válido:', aqi);
            return;
        }

        const level = aqiLevels[validAqi];
        console.log('Nivel seleccionado:', level);

        if (!level) {
            console.error('No se encontró nivel para AQI:', validAqi);
            return;
        }

        // Calcular el porcentaje para la barra de progreso
        const maxAqi = 5;
        const progress = Math.min((validAqi / maxAqi) * 100, 100);
        console.log('Progreso calculado:', progress);

        // Actualizar el HTML con la información
        const html = `
            <h3 class="font-bold text-lg text-gray-800 mb-3">Calidad del Aire</h3>
            <div class="flex items-center mb-3">
                <div class="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                    <div class="h-full transition-all duration-500 ${level.bg}" style="width: ${progress}%"></div>
                </div>
                <span class="ml-3 font-bold ${level.color}">${level.text}</span>
            </div>
            <p class="text-gray-600 text-sm">${level.description}</p>
        `;

        // Actualizar el contenido
        airQualityContainer.innerHTML = html;

        // Añadir animación de entrada
        Animator.fadeIn(airQualityContainer);

        console.log('Calidad del aire actualizada:', { 
            aqi: validAqi, 
            level: level.text, 
            progress,
            components: {
                pm25: components.pm2_5,
                pm10: components.pm10,
                no2: components.no2,
                o3: components.o3
            }
        });
    } catch (error) {
        console.error('Error al actualizar la calidad del aire:', error);
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
        if (!validateApiKeys()) {
            return false;
        }

        // Inicializar elementos de la UI
        const searchInput = document.querySelector('input.w-full.pl-10');
        if (searchInput) {
            initializeAutocomplete();
        }

        // Cargar datos del clima para la ciudad por defecto
        const defaultCity = localStorage.getItem('last_city') || 'Madrid';
        const weatherData = await getWeatherData(defaultCity).catch(err => handleApiError(err, 'getWeatherData'));
        
        if (weatherData) {
            await updateWeatherUI(weatherData);
            startClock();
        } else {
            throw new Error('No se pudieron cargar los datos del clima');
        }

        return true;
    } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        return false;
    }
}

// Función para manejar el splash screen
function handleSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    if (!splashScreen) {
        console.warn('No se encontró el elemento splash-screen');
        return;
    }

    const minimumLoadingTime = 1000;
    const startTime = Date.now();

    const hideSplashScreen = () => {
        if (!splashScreen || !splashScreen.parentNode) return;
        splashScreen.classList.add('hide');
        setTimeout(() => splashScreen.remove(), 500);
    };

    // Cargar recursos principales
    Promise.race([
        loadInitialData(),
        new Promise(resolve => setTimeout(() => resolve(false), 4000))
    ])
    .then(success => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minimumLoadingTime - elapsedTime);

        if (!success) {
            const mainContainer = document.querySelector('.bg-gradient-to-r.from-amber-400');
            if (mainContainer) {
                mainContainer.innerHTML = `
                    <div class="flex flex-col items-center justify-center p-8 text-center">
                        <span class="material-symbols-outlined text-5xl text-white mb-4">error</span>
                        <h2 class="text-white text-xl font-bold mb-2">Error de Inicialización</h2>
                        <p class="text-white/90 mb-4">No se pudo cargar la aplicación correctamente.</p>
                        <button class="bg-white text-orange-500 px-4 py-2 rounded-lg shadow-md hover:bg-orange-100 transition-colors duration-300" 
                                onclick="window.location.reload()">
                            Reintentar
                        </button>
                    </div>
                `;
            }
        }

        setTimeout(hideSplashScreen, remainingTime);
    })
    .catch(error => {
        console.error('Error durante la carga:', error);
        hideSplashScreen();
    });
}

// Inicializar la aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleSplashScreen);
} else {
    handleSplashScreen();
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
                    'X-RapidAPI-Key': import.meta.env.VITE_RAPIDAPI_KEY,
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

// Iniciar la aplicación cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado. Inicializando aplicación...');
    
    // Mostrar animación de bienvenida
    const welcomeOverlay = document.createElement('div');
    welcomeOverlay.className = 'fixed inset-0 bg-primary-500 bg-opacity-90 z-50 flex flex-col items-center justify-center text-white transition-all duration-1000';
    welcomeOverlay.innerHTML = `
        <div class="text-center px-4">
            <h1 class="text-4xl font-bold mb-4">WeatheRyn</h1>
            <p class="text-lg mb-8">Tu pronóstico meteorológico en tiempo real</p>
            <div class="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white mb-4"></div>
            <p>Cargando aplicación...</p>
        </div>
    `;
    document.body.appendChild(welcomeOverlay);
    
    // Ocultar la animación después de un momento
    setTimeout(() => {
        welcomeOverlay.style.opacity = '0';
        setTimeout(() => {
            welcomeOverlay.remove();
        }, 1000);
    }, 1500);
    
    // Inicializar autocompletado
    initializeAutocomplete();
    
    // Event listeners
    const searchInput = document.querySelector('input[type="text"]');
    console.log('Campo de búsqueda:', searchInput);
    
    // Añadir event listener para el enfoque automático del buscador
    document.addEventListener('keydown', (e) => {
        // Verificar si el elemento activo es un input o si se está presionando una tecla especial
        if (document.activeElement.tagName === 'INPUT' || 
            e.ctrlKey || e.altKey || e.metaKey || 
            e.key.length !== 1) {
            return;
        }
        
        // Verificar si la tecla presionada es una letra
        const isLetter = /^[a-zA-Z]$/.test(e.key);
        
        if (isLetter) {
            // Prevenir la escritura del carácter antes del enfoque
            e.preventDefault();
            
            // Enfocar el campo de búsqueda
            searchInput.focus();
            
            // Escribir la letra presionada en el campo de búsqueda
            searchInput.value = e.key;
            
            // Disparar el evento input para activar el autocompletado
            searchInput.dispatchEvent(new Event('input'));
            
            // Mover el cursor al final del texto
            const length = searchInput.value.length;
            searchInput.setSelectionRange(length, length);
            
            // Animar suavemente el campo de búsqueda
            Animator.pulse(searchInput.parentElement, 1.02, 200);
        }
    });
    
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

    // Botón de ubicación actual
    const locationButton = document.querySelector('button');
    console.log('Botón de ubicación:', locationButton);
    
    locationButton.addEventListener('click', async () => {
        // Animar el botón
        Animator.pulse(locationButton, 1.1, 300);
        
        if (navigator.geolocation) {
            // Mostrar animación de carga en el botón
            const originalContent = locationButton.innerHTML;
            locationButton.innerHTML = `
                <div class="flex items-center">
                    <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    <span>Localizando...</span>
                </div>
            `;
            
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    // Obtener datos del clima por coordenadas
                    const response = await axios.get(`${BASE_URL}/weather`, {
                        params: {
                            lat: latitude,
                            lon: longitude,
                            appid: API_KEY,
                            units: 'metric'
                        }
                    });
                    
                    // Restaurar el botón
                    locationButton.innerHTML = originalContent;
                    
                    // Actualizar interfaz
                    updateWeatherUI(response.data);
                    
                    // Obtener y actualizar pronósticos
                    const forecastResponse = await axios.get(`${BASE_URL}/forecast`, {
                        params: {
                            lat: latitude,
                            lon: longitude,
                            appid: API_KEY,
                            units: 'metric'
                        }
                    });
                    updateHourlyForecast(forecastResponse.data);
                    update7DayForecast(forecastResponse.data);
                } catch (error) {
                    // Restaurar el botón
                    locationButton.innerHTML = originalContent;
                    
                    console.error('Error al obtener datos del clima por ubicación:', error);
                    alert('Error al obtener datos del clima. Por favor, intenta de nuevo.');
                }
            }, (error) => {
                // Restaurar el botón
                locationButton.innerHTML = originalContent;
                
                console.error('Error al obtener la ubicación:', error);
                alert('No se pudo acceder a la ubicación. Por favor, busca manualmente.');
            });
        } else {
            alert('La geolocalización no está soportada en este navegador.');
        }
    });
    
    // Cargar datos iniciales
    loadInitialData();
}); 

// Mapa Geológico
let map = null;
let geologicalLayer = null;
let isGeologyVisible = true;

function initializeGeologicalMap(lat, lon) {
    if (map) {
        map.remove();
    }

    map = L.map('geological-map').setView([lat, lon], 10);
    
    // Capa base de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Capa geológica de OpenGeoscience
    geologicalLayer = L.tileLayer('https://tiles.opengeoscience.org/geology/{z}/{x}/{y}.png', {
        attribution: '© British Geological Survey',
        opacity: 0.7
    }).addTo(map);

    // Ocultar el indicador de carga
    document.getElementById('map-loading').style.display = 'none';
}

// Función para actualizar el mapa cuando se cambia la ubicación
function updateGeologicalMap(lat, lon) {
    if (map) {
        map.setView([lat, lon], 10);
    } else {
        initializeGeologicalMap(lat, lon);
    }
}

// Eventos de los botones del mapa
document.getElementById('toggle-geology')?.addEventListener('click', () => {
    if (geologicalLayer) {
        isGeologyVisible = !isGeologyVisible;
        if (isGeologyVisible) {
            geologicalLayer.addTo(map);
            document.getElementById('toggle-geology').innerHTML = 
                '<span class="material-symbols-outlined text-sm mr-1">layers</span>Capa Geológica';
        } else {
            map.removeLayer(geologicalLayer);
            document.getElementById('toggle-geology').innerHTML = 
                '<span class="material-symbols-outlined text-sm mr-1">layers_off</span>Capa Geológica';
        }
    }
});

document.getElementById('fullscreen-map')?.addEventListener('click', () => {
    const mapContainer = document.getElementById('geological-map');
    if (mapContainer.requestFullscreen) {
        mapContainer.requestFullscreen();
    } else if (mapContainer.webkitRequestFullscreen) {
        mapContainer.webkitRequestFullscreen();
    } else if (mapContainer.msRequestFullscreen) {
        mapContainer.msRequestFullscreen();
    }
});

// Modificar la función updateWeather para incluir la actualización del mapa
async function updateWeather(city) {
    try {
        // ... existing weather update code ...
        
        // Actualizar el mapa geológico con las nuevas coordenadas
        if (data.coord) {
            updateGeologicalMap(data.coord.lat, data.coord.lon);
        }
        
        // ... rest of the existing code ...
    } catch (error) {
        console.error('Error al actualizar el clima:', error);
    }
} 

// ... existing code ...

// Función para mostrar sugerencias
function showSuggestions(suggestions) {
    const suggestionsContainer = document.getElementById('suggestions');
    if (!suggestionsContainer) return;

    if (suggestions.length === 0) {
        suggestionsContainer.innerHTML = '<div class="no-results">No se encontraron resultados</div>';
        suggestionsContainer.classList.remove('hidden');
        return;
    }

    suggestionsContainer.innerHTML = suggestions.map((suggestion, index) => `
        <div class="suggestion-item ${index === 0 ? 'active' : ''}" data-index="${index}">
            <span class="material-symbols-outlined">location_on</span>
            <div class="location-info">
                <div class="location-name">${suggestion.name}</div>
                <div class="location-country">${suggestion.country}</div>
            </div>
        </div>
    `).join('');

    suggestionsContainer.classList.remove('hidden');
}

// Función para ocultar sugerencias
function hideSuggestions() {
    const suggestionsContainer = document.getElementById('suggestions');
    if (suggestionsContainer) {
        suggestionsContainer.classList.add('hidden');
    }
}

// Evento de búsqueda
searchInput.addEventListener('input', async (e) => {
    const query = e.target.value.trim();
    if (query.length < 2) {
        hideSuggestions();
        return;
    }

    try {
        const response = await axios.get(`${GEO_URL}/direct?q=${query}&limit=5&appid=${API_KEY}`);
        showSuggestions(response.data);
    } catch (error) {
        console.error('Error al buscar ubicaciones:', error);
        hideSuggestions();
    }
});

// Evento para cerrar sugerencias al hacer clic fuera
document.addEventListener('click', (e) => {
    const suggestionsContainer = document.getElementById('suggestions');
    const searchInput = document.querySelector('input[type="text"]');
    
    if (!suggestionsContainer?.contains(e.target) && e.target !== searchInput) {
        hideSuggestions();
    }
});

// Evento para seleccionar una sugerencia
document.getElementById('suggestions')?.addEventListener('click', (e) => {
    const suggestionItem = e.target.closest('.suggestion-item');
    if (suggestionItem) {
        const index = suggestionItem.dataset.index;
        const suggestions = Array.from(document.querySelectorAll('.suggestion-item'))
            .map(item => ({
                name: item.querySelector('.location-name').textContent,
                country: item.querySelector('.location-country').textContent
            }));
        
        if (suggestions[index]) {
            updateWeather(suggestions[index].name);
            hideSuggestions();
        }
    }
});

// Evento para navegar con el teclado
document.querySelector('input[type="text"]').addEventListener('keydown', (e) => {
    const suggestions = document.querySelectorAll('.suggestion-item');
    const activeSuggestion = document.querySelector('.suggestion-item.active');
    
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = activeSuggestion ? parseInt(activeSuggestion.dataset.index) : -1;
        let newIndex;
        
        if (e.key === 'ArrowDown') {
            newIndex = currentIndex < suggestions.length - 1 ? currentIndex + 1 : 0;
        } else {
            newIndex = currentIndex > 0 ? currentIndex - 1 : suggestions.length - 1;
        }
        
        suggestions.forEach(item => item.classList.remove('active'));
        suggestions[newIndex].classList.add('active');
    } else if (e.key === 'Enter' && activeSuggestion) {
        const index = activeSuggestion.dataset.index;
        const suggestions = Array.from(document.querySelectorAll('.suggestion-item'))
            .map(item => ({
                name: item.querySelector('.location-name').textContent,
                country: item.querySelector('.location-country').textContent
            }));
        
        if (suggestions[index]) {
            updateWeather(suggestions[index].name);
            hideSuggestions();
        }
    } else if (e.key === 'Escape') {
        hideSuggestions();
    }
});

// ... existing code ...

// Registro del Service Worker y funcionalidades PWA
async function registerPWA() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: config.serviceWorker.scope
      });
      console.log('Service Worker registrado:', registration);

      // Registrar para sincronización en segundo plano
      if ('sync' in registration) {
        try {
          await registration.sync.register('sync-weather');
          console.log('Sincronización en segundo plano registrada');
        } catch (err) {
          console.log('Error al registrar sync:', err);
        }
      }

      // Configurar notificaciones push
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          try {
            const subscription = await registration.pushManager.subscribe({
              ...config.pushNotifications.defaultOptions,
              applicationServerKey: urlBase64ToUint8Array(config.vapid.publicKey)
            });
            
            // Guardar la suscripción en localStorage
            localStorage.setItem('push-subscription', JSON.stringify(subscription));
            console.log('Push subscription:', subscription);

            // Enviar la suscripción al servidor (cuando lo implementemos)
            // await sendSubscriptionToServer(subscription);
          } catch (error) {
            console.error('Error al suscribirse a notificaciones push:', error);
          }
        }
      }

      // Configurar actualización periódica del Service Worker
      setInterval(() => {
        registration.update();
      }, config.serviceWorker.updateInterval);

    } catch (error) {
      console.error('Error al registrar el Service Worker:', error);
    }
  }
}

// Función auxiliar para convertir clave VAPID
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Manejar la instalación
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  
  // Mostrar botón de instalación personalizado
  const installButton = document.createElement('button');
  installButton.textContent = 'Instalar WeatheRyn';
  installButton.classList.add(
    'install-button',
    'fixed',
    'bottom-4',
    'right-4',
    'bg-primary-500',
    'text-white',
    'px-4',
    'py-2',
    'rounded-lg',
    'shadow-lg',
    'z-50',
    'flex',
    'items-center',
    'gap-2'
  );
  
  // Añadir icono al botón
  const icon = document.createElement('span');
  icon.classList.add('material-symbols-outlined');
  icon.textContent = 'download';
  installButton.prepend(icon);
  
  installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`Usuario ${outcome === 'accepted' ? 'aceptó' : 'rechazó'} la instalación`);
      deferredPrompt = null;
      installButton.remove();
    }
  });

  document.body.appendChild(installButton);
});

// Detectar si la app fue instalada
window.addEventListener('appinstalled', (event) => {
  console.log('WeatheRyn se ha instalado correctamente');
  // Actualizar la interfaz si es necesario
  if (document.querySelector('.install-button')) {
    document.querySelector('.install-button').remove();
  }
});

// Inicializar la PWA después de cargar el contenido
document.addEventListener('DOMContentLoaded', () => {
  registerPWA();
});

// ... existing code ...

// Función para manejar errores de API
function handleApiError(error, context) {
    console.warn(`Error en ${context}:`, error);
    return null;
}

// Función para verificar API keys
function validateApiKeys() {
    const keys = {
        openweather: localStorage.getItem('openweather_api_key'),
        gnews: localStorage.getItem('gnews_api_key')
    };
    
    let missingKeys = [];
    if (!keys.openweather) missingKeys.push('OpenWeather');
    if (!keys.gnews) missingKeys.push('GNews');
    
    if (missingKeys.length > 0) {
        const container = document.querySelector('.bg-gradient-to-r.from-amber-400');
        if (container) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center p-8 text-center">
                    <span class="material-symbols-outlined text-5xl text-white mb-4">warning</span>
                    <h2 class="text-white text-xl font-bold mb-2">Configuración Incompleta</h2>
                    <p class="text-white/90 mb-4">Se requieren las siguientes API keys: ${missingKeys.join(', ')}</p>
                    <button class="bg-white text-orange-500 px-4 py-2 rounded-lg shadow-md hover:bg-orange-100 transition-colors duration-300" 
                            onclick="window.location.href='config.html'">
                        Configurar API Keys
                    </button>
                </div>
            `;
            return false;
        }
    }
    return true;
}

// ... resto del código existente ...