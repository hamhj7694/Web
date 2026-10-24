// Map SDK is loaded from server configuration, not a key committed to Git.
(async () => {
    try {
        const response = await fetch('../backend/api/kakao_maps_config.php', { cache: 'no-store' });
        const config = await response.json();
        if (!response.ok || !config.success || !config.appKey) throw new Error('Map configuration missing');
        const sdk = document.createElement('script');
        sdk.src = 'https://dapi.kakao.com/v2/maps/sdk.js?appkey=' +
            encodeURIComponent(config.appKey) + '&libraries=services&autoload=false';
        sdk.onload = () => {
            const app = document.createElement('script');
            app.src = '../js/map.js';
            document.body.appendChild(app);
        };
        sdk.onerror = () => { throw new Error('Map SDK failed to load'); };
        document.head.appendChild(sdk);
    } catch (error) {
        console.error('Map initialization unavailable:', error.message);
        const map = document.querySelector('#map');
        if (map) map.textContent = '지도 설정 또는 네트워크를 확인해 주세요.';
    }
})();
