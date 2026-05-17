import fetch from 'node-fetch';

export async function getWeatherAndDewProbability(city) {
    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`);
        const geoData = await geoRes.json();
        
        if (!geoData.results || geoData.results.length === 0) {
            return { error: `City '${city}' not found.` };
        }
        
        const { latitude, longitude } = geoData.results[0];
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m`);
        const weatherData = await weatherRes.json();
        
        const temp = weatherData.current.temperature_2m;
        const humidity = weatherData.current.relative_humidity_2m;
        
        let dewProbability = "Low";
        if (humidity > 70 && temp < 25) dewProbability = "High";
        else if (humidity > 60) dewProbability = "Medium";
        
        return {
            city,
            temperature: temp,
            humidity: humidity,
            dewProbability
        };
    } catch (err) {
        return { error: err.message };
    }
}
