// 天气模块 - OpenWeatherMap版（实时天气）
const WeatherModule = {
    // 🔑 填入你的 API Key（从 openweathermap.org 获取）
    OWM_KEY: '311da53d8d31486813b6e205a5c41e49',
    
    // 校区坐标
    campusCoords: {
        '学院路': { lat: 39.9804, lon: 116.3487, name: '北航学院路校区' },
        '沙河': { lat: 40.0750, lon: 116.3080, name: '北航沙河校区' }
    },
    
    // 天气图标映射
    weatherMap: {
        '01d': { name: '晴', icon: '☀️', suitable: true, tip: '适合骑行' },
        '01n': { name: '晴', icon: '🌙', suitable: true, tip: '适合骑行' },
        '02d': { name: '多云', icon: '⛅', suitable: true, tip: '适合骑行' },
        '02n': { name: '多云', icon: '☁️', suitable: true, tip: '适合骑行' },
        '03d': { name: '阴', icon: '☁️', suitable: true, tip: '适合骑行' },
        '03n': { name: '阴', icon: '☁️', suitable: true, tip: '适合骑行' },
        '04d': { name: '阴', icon: '☁️', suitable: true, tip: '适合骑行' },
        '04n': { name: '阴', icon: '☁️', suitable: true, tip: '适合骑行' },
        '09d': { name: '小雨', icon: '🌧️', suitable: false, tip: '建议短途或室内' },
        '09n': { name: '小雨', icon: '🌧️', suitable: false, tip: '建议短途或室内' },
        '10d': { name: '雨', icon: '🌧️', suitable: false, tip: '不建议骑行' },
        '10n': { name: '雨', icon: '🌧️', suitable: false, tip: '不建议骑行' },
        '11d': { name: '雷阵雨', icon: '⛈️', suitable: false, tip: '禁止骑行' },
        '11n': { name: '雷阵雨', icon: '⛈️', suitable: false, tip: '禁止骑行' },
        '13d': { name: '雪', icon: '❄️', suitable: false, tip: '不建议骑行' },
        '13n': { name: '雪', icon: '❄️', suitable: false, tip: '不建议骑行' },
        '50d': { name: '雾', icon: '🌫️', suitable: false, tip: '能见度低，谨慎骑行' },
        '50n': { name: '雾', icon: '🌫️', suitable: false, tip: '能见度低，谨慎骑行' }
    },
    
    // 获取实时天气
    async getWeather(campus = '学院路') {
        const coords = this.campusCoords[campus];
        
        try {
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${this.OWM_KEY}&units=metric&lang=zh_cn`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.cod === 200) {
                const weatherInfo = this.weatherMap[data.weather[0].icon] || { 
                    name: data.weather[0].description, 
                    icon: '🌡️', 
                    suitable: true, 
                    tip: '请查看详情' 
                };
                
                const temp = Math.round(data.main.temp);
                const windSpeed = data.wind.speed;
                
                // 判断骑行适宜度
                let suitable = weatherInfo.suitable;
                let tip = weatherInfo.tip;
                
                if (temp > 35) {
                    suitable = false;
                    tip = '高温酷暑，避免中暑';
                } else if (temp < 0) {
                    suitable = false;
                    tip = '气温过低，注意保暖';
                }
                
                if (windSpeed > 10) {
                    suitable = false;
                    tip = '风力过大，不建议骑行';
                }
                
                return {
                    condition: weatherInfo.name,
                    temperature: temp,
                    humidity: data.main.humidity,
                    windpower: Math.round(windSpeed * 1.944),
                    winddirection: this.degToCompass(data.wind.deg),
                    icon: weatherInfo.icon,
                    suitable: suitable,
                    tip: tip,
                    source: 'OpenWeatherMap',
                    updateTime: new Date(data.dt * 1000).toLocaleString('zh-CN')
                };
            } else {
                throw new Error(data.message || '获取天气失败');
            }
        } catch (error) {
            console.error('天气API错误:', error);
            // 返回错误状态
            return {
                condition: '获取失败',
                temperature: '--',
                humidity: '--',
                windpower: '--',
                winddirection: '--',
                icon: '❓',
                suitable: false,
                tip: '请检查API Key是否正确，或等待10分钟后再试（新Key需要激活时间）',
                source: '错误',
                updateTime: new Date().toLocaleString('zh-CN')
            };
        }
    },
    
    // 风向角度转文字
    degToCompass(deg) {
        if (deg == null) return '未知';
        const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
        return dirs[Math.round(deg / 45) % 8];
    },
    
    // 渲染天气板块
    renderWeather(weather, campus) {
        const container = document.getElementById('weatherSection');
        if (!container) return;
        
        const coords = this.campusCoords[campus];
        const suitableClass = weather.suitable ? 'suitable' : 'unsuitable';
        const suitableText = weather.suitable ? '✅ 适宜骑行' : '⚠️ 谨慎骑行';
        
        container.innerHTML = `
            <div class="weather-card ${suitableClass}">
                <div class="weather-header">
                    <div class="weather-location">
                        <span class="location-icon">📍</span>
                        <span>${coords.name}</span>
                    </div>
                    <div class="weather-source">${weather.source}</div>
                </div>
                
                <div class="weather-main">
                    <div class="weather-icon">${weather.icon}</div>
                    <div class="weather-info">
                        <div class="weather-temp">${weather.temperature}°C</div>
                        <div class="weather-condition">${weather.condition}</div>
                    </div>
                    <div class="weather-suitable ${suitableClass}">
                        ${suitableText}
                    </div>
                </div>
                
                <div class="weather-details">
                    <div class="detail-item">
                        <span class="detail-label">湿度</span>
                        <span class="detail-value">${weather.humidity}%</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">风力</span>
                        <span class="detail-value">${weather.winddirection} ${weather.windpower}级</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">更新时间</span>
                        <span class="detail-value">${weather.updateTime}</span>
                    </div>
                </div>
                
                <div class="weather-tip">
                    💡 ${weather.tip}
                </div>
            </div>
        `;
    },
    
    // 根据天气过滤路线
    filterRoutesByWeather(routes, weather) {
        if (weather.suitable) {
            return routes.sort((a, b) => {
                const aSuitable = a.weather_suitable.includes(weather.condition) ? 1 : 0;
                const bSuitable = b.weather_suitable.includes(weather.condition) ? 1 : 0;
                return bSuitable - aSuitable;
            });
        } else {
            const suitable = routes.filter(r => r.weather_suitable.includes(weather.condition));
            if (suitable.length > 0) {
                return suitable;
            }
            return routes.map(r => ({ ...r, weatherWarning: true }));
        }
    }
};
