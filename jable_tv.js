var WidgetMetadata = {
    id: "forward.jable",
    title: "Jable",
    description: "获取 Jable.tv 的热门和最新影片",
    author: "Gemini",
    site: "https://jable.tv",
    version: "1.0.1",
    requiredVersion: "0.0.1",
    detailCacheDuration: 600, // 详情缓存10分钟
    modules: [
        {
            title: "热门影片",
            functionName: "getPopularVideos",
            cacheDuration: 3600, // 列表缓存1小时
            params: [
                {
                    name: "page",
                    title: "页码",
                    type: "page"
                }
            ]
        },
        {
            title: "最新上市",
            functionName: "getLatestVideos",
            cacheDuration: 3600, // 列表缓存1小时
            params: [
                {
                    name: "page",
                    title: "页码",
                    type: "page"
                }
            ]
        }
    ],
    search: {
        title: "搜索",
        functionName: "search",
        params: [
            {
                name: "query",
                title: "关键词",
                type: "input"
            },
            {
                name: "page",
                title: "页码",
                type: "page"
            }
        ]
    }
};

/**
 * 通用的列表页面解析函数
 * @param {string} url 页面地址
 * @returns {Promise<Object[]>} 视频项目数组
 */
async function parseVideoListPage(url) {
    try {
        console.log(`请求列表页面: ${url}`);
        const response = await Widget.http.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
                "Referer": "https://jable.tv/"
            }
        });

        if (!response || !response.data) {
            console.error("获取页面数据失败或数据为空");
            throw new Error("获取页面数据失败");
        }

        console.log("Response data length:", response.data.length);
        // Log a snippet of the raw HTML to verify content
        console.log("Raw HTML snippet (first 500 chars):", response.data.substring(0, 500));

        const $ = Widget.html.load(response.data);
        console.log("HTML loaded successfully:", $ !== null);

        const videoElements = $('div.video-item');

        if (videoElements.length === 0) {
            console.log("在页面上未找到视频项目 (div.video-item)");
            return [];
        }
        console.log("Number of video elements found:", videoElements.length);

        return videoElements.map((index, element) => {
            const $el = $(element);
            const link = $el.find('a').attr('href');
            const cover = $el.find('img').attr('data-src'); // Corrected to data-src
            const title = $el.find('.detail h6.title').text().trim(); // Corrected path
            const duration = $el.find('.absolute-bottom-right .label').text().trim(); // Corrected path
            const info = $el.find('.detail p.sub-title').text().trim(); // Corrected path

            return {
                id: link,
                type: 'link',
                title: title,
                posterPath: cover,
                durationText: duration,
                description: info,
                link: link
            };
        }).get();
    } catch (error) {
        console.error(`解析列表页面失败 ${url}:`, error);
        throw error;
    }
}

/**
 * 获取热门影片
 * @param {Object} params 参数对象，包含 page
 * @returns {Promise<Object[]>}
 */
async function getPopularVideos(params = {}) {
    const page = params.page || 1;
    const url = `https://jable.tv/hot/?page=${page}`;
    return await parseVideoListPage(url);
}

/**
 * 获取最新上市影片
 * @xue/.cache/uv/archive-v0/DCJEWGSFmsTNXl3XOyfxh/fastapi/param_functions.py {Object} params 参数对象，包含 page
 * @returns {Promise<Object[]>}
 */
async function getLatestVideos(params = {}) {
    const page = params.page || 1;
    const url = `https://jable.tv/recently-updated/?page=${page}`;
    return await parseVideoListPage(url);
}

/**
 * 搜索影片
 * @param {Object} params 参数对象，包含 query 和 page
 * @returns {Promise<Object[]>}
 */
async function search(params = {}) {
    const query = encodeURIComponent(params.query || '');
    const page = params.page || 1;
    if (!query) {
        return [];
    }
    const url = `https://jable.tv/search/${query}/?page=${page}`;
    return await parseVideoListPage(url);


/**
 * 加载详情页，提取视频播放地址
 * @param {string} link 详情页链接
 * @returns {Promise<{videoUrl: string}>}
 */
async function loadDetail(link) {
    try {
        console.log(`请求详情页面: ${link}`);
        const response = await Widget.http.get(link, {
             headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
                "Referer": "https://jable.tv/"
            }
        });
        const html = response.data;

        // 更新正则表达式，以更精确地匹配播放器配置中的 m3u8 地址
        const match = html.match(/(?:url|src)['"]?\s*:\s*['"](https?:\/\/[^'"]*m3u8[^'"]*)['"]/);

        if (match && match[1]) {
            const videoUrl = match[1];
            console.log(`成功提取到 videoUrl: ${videoUrl}`);
            return {
                videoUrl: videoUrl
            };
        } else {
            console.error("在页面HTML中未找到 videoUrl");
            throw new Error("在页面中未找到 videoUrl");
        }
    } catch (error) {
        console.error(`加载详情页面失败 ${link}:`, error);
        throw error;
    }
}
