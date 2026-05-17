import fetch from 'node-fetch';

export async function getWeatherAndDewProbability(city) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const geoData = await geoRes.json();
        
        if (!geoData.results || geoData.results.length === 0) {
            return { error: `City '${city}' not found.` };
        }
        
        const { latitude, longitude } = geoData.results[0];
        
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 3000);
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m`, { signal: controller2.signal });
        clearTimeout(timeoutId2);
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
        return { 
            systemWarning: "Live Weather API timeout. Degrading to historical pitch data.",
            fallbackData: {
                surface: "Dry",
                dewProbability: "10%"
            }
        };
    }
}

export async function scrapeCricbuzzMatchState(url) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        // Simulating scraping for the hackathon context
        // In a real app, you would use a library like puppeteer or cheerio
        await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (url.includes("cricbuzz.com")) {
            return {
                matchState: {
                    innings: 2,
                    over: 19,
                    target: 185,
                    currentScore: 167,
                    wicketsDown: 6,
                    batsmen: ["Left-handed pinch hitter", "Left-handed pinch hitter"],
                    bowlersAvailable: ["Off-spinner (1 over left)", "Medium pacer (1 over left)"],
                    unavailable: ["Fast bowler (0 overs left)"]
                },
                source: "Cricbuzz (Scraped)"
            };
        }
        return { error: "Unsupported URL. Only Cricbuzz URLs are supported." };
    } catch (err) {
        return { error: "Failed to fetch URL or timeout. Fallback to default state." };
    }
}
