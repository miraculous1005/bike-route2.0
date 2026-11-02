// 主应用逻辑 - 美化版
const App = {
    currentWeather: null,
    currentCampus: '学院路',
    
    // 初始化
    async init() {
        console.log('🚴 北航骑行路线推荐系统启动');
        
        // 初始化滑块样式
        this.initSlider();
        
        // 初始化天气
        await this.initWeather();
        
        // 绑定事件
        this.bindEvents();
        
        console.log('✅ 初始化完成');
    },
    
    // 初始化滑块
    initSlider() {
        const slider = document.getElementById('duration');
        if (slider) {
            this.updateSliderProgress(slider);
        }
    },
    
    // 更新滑块进度条
    updateSliderProgress(slider) {
        const min = parseInt(slider.min);
        const max = parseInt(slider.max);
        const val = parseInt(slider.value);
        const progress = ((val - min) / (max - min)) * 100;
        slider.style.setProperty('--progress', progress + '%');
    },
    
    // 初始化天气
    async initWeather() {
        const campus = this.getSelectedCampus();
        this.currentCampus = campus;
        
        try {
            this.currentWeather = await WeatherModule.getWeather(campus);
            WeatherModule.renderWeather(this.currentWeather, campus);
        } catch (error) {
            console.error('天气初始化失败:', error);
            this.currentWeather = WeatherModule.getMockWeather();
            WeatherModule.renderWeather(this.currentWeather, campus);
        }
    },
    
    // 绑定事件
    bindEvents() {
        // 滑块联动
        const durationSlider = document.getElementById('duration');
        const durationValEl = document.getElementById('durationVal');
        
        if (durationSlider && durationValEl) {
            durationSlider.addEventListener('input', function() {
                durationValEl.textContent = this.value + ' 分钟';
                App.updateSliderProgress(this);
            });
        }
        
        // 校区切换时更新天气
        document.querySelectorAll('input[name="campus"]').forEach(radio => {
            radio.addEventListener('change', async (e) => {
                this.currentCampus = e.target.value;
                await this.initWeather();
            });
        });
        
        // 表单提交
        const form = document.getElementById('routeForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSubmit();
            });
        }
    },
    
    // 获取选中的校区
    getSelectedCampus() {
        const campusEl = document.querySelector('input[name="campus"]:checked');
        return campusEl ? campusEl.value : '学院路';
    },
    
    // 处理表单提交
    handleSubmit() {
        const formData = this.getFormData();
        
        if (typeof routes === 'undefined') {
            alert('路线数据未加载，请检查 data.js');
            return;
        }
        
        // 获取推荐路线
        let results = this.recommendRoutes(formData);
        
        // 根据天气过滤
        if (this.currentWeather) {
            results = WeatherModule.filterRoutesByWeather(results, this.currentWeather);
        }
        
        // 渲染结果
        this.renderResults(results, this.currentWeather, formData.campus);
    },
    
    // 获取表单数据
    getFormData() {
        const campus = this.getSelectedCampus();
        const duration = parseInt(document.getElementById('duration').value);
        const pace = document.getElementById('pace').value;
        
        const scenery = [];
        document.querySelectorAll('input[name="scenery"]:checked').forEach(cb => {
            scenery.push(cb.value);
        });
        
        const shops = [];
        document.querySelectorAll('input[name="shops"]:checked').forEach(cb => {
            shops.push(cb.value);
        });
        
        return { campus, duration, pace, scenery, shops };
    },
    
    // 推荐路线算法
    recommendRoutes(formData) {
        // 按校区筛选
        let candidates = routes.filter(r => r.campus === formData.campus);
        
        // 按时长筛选（±30%）
        const min = formData.duration * 0.7;
        const max = formData.duration * 1.3;
        candidates = candidates.filter(r => r.duration >= min && r.duration <= max);
        
        // 按配速筛选
        if (formData.pace === '休闲') {
            candidates = candidates.filter(r => r.difficulty === '休闲');
        } else if (formData.pace === '较快') {
            candidates = candidates.filter(r => r.difficulty !== '休闲');
        }
        
        // 计算评分
        candidates.forEach(r => {
            r.score = 0;
            
            // 风景偏好匹配（+10分）
            formData.scenery.forEach(s => {
                if (r.scenery.includes(s)) r.score += 10;
            });
            
            // 商店偏好匹配（+5分）
            formData.shops.forEach(s => {
                if (r.shops.includes(s)) r.score += 5;
            });
            
            // 天气适宜加分（+15分）
            if (this.currentWeather && r.weather_suitable.includes(this.currentWeather.condition)) {
                r.score += 15;
            }
            
            // 时长接近度加分（最高+10分）
            const durationDiff = Math.abs(r.duration - formData.duration);
            r.score += Math.max(0, 10 - durationDiff / 10);
        });
        
        // 排序并返回前5
        candidates.sort((a, b) => b.score - a.score);
        return candidates.slice(0, 5);
    },
    
    // 渲染结果
    renderResults(results, weather, campus) {
        const container = document.querySelector('.container');
        
        let html = '<a href="#" class="back-btn" onclick="location.reload(); return false;">← 返回修改</a>';
        
        // 天气提示条
        if (weather) {
            const weatherClass = weather.suitable ? 'weather-good' : 'weather-bad';
            const weatherIcon = weather.suitable ? '✅' : '⚠️';
            html += `
                <div class="weather-bar ${weatherClass}">
                    <span class="weather-icon">${weather.icon}</span>
                    <span class="weather-text">
                        ${weatherIcon} ${weather.condition} ${weather.temperature}°C · ${weather.tip}
                    </span>
                </div>
            `;
        }
        
        html += `<h2 style="margin-bottom:24px;">🎯 为你推荐 ${results.length} 条路线（${campus}校区）</h2>`;
        
        if (results.length === 0) {
            html += `
                <div class="no-results">
                    <p>😅 没有找到完全匹配的路线</p>
                    <p style="font-size:14px; color:#888; margin-top:12px;">
                        建议：放宽时长范围或减少筛选条件
                    </p>
                </div>
            `;
        } else {
            results.forEach((r, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
                const weatherWarning = r.weatherWarning ? '<div class="weather-warning">⚠️ 当前天气可能不适合此路线，请谨慎选择</div>' : '';
                
                // 难度标签样式
                const difficultyClass = r.difficulty === '休闲' ? 'difficulty-休闲' : 
                                       r.difficulty === '适中' ? 'difficulty-适中' : 'difficulty-较快';
                
                html += `
                    <div class="route-card" style="animation: fadeInUp 0.5s ease-out ${index * 0.1}s both;">
                        <div class="route-header">
                            <span class="route-rank">${medal}</span>
                            <h3>${r.name}</h3>
                        </div>
                        
                        ${weatherWarning}
                        
                        <div class="route-meta">
                            <span>🚴 往返 ${r.distance} km</span>
                            <span>⏱ 约 ${r.duration} 分钟</span>
                            <span class="${difficultyClass}">${r.difficulty}</span>
                        </div>
                        
                        <div class="route-tags">
                            ${r.scenery.map(s => `<span class="tag tag-scenery">🌿 ${s}</span>`).join('')}
                            ${r.shops.map(s => `<span class="tag tag-shop">🛒 ${s}</span>`).join('')}
                        </div>
                        
                        <p class="route-desc">${r.description}</p>
                        
                        <div class="route-tips">💡 ${r.tips}</div>
                        
                        <a href="nav.html?id=${r.id}" class="nav-btn">📍 查看导航 →</a>
                    </div>
                `;
            });
        }
        
        container.innerHTML = html;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
