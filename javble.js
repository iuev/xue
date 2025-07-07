
var WidgetMetadata = {
    id: "jable.tv",
    title: "Jable TV",
    description: "Jable TV 的非官方 ForwardWidget 模块",
    author: "Gemini",
    site: "https://jable.tv/",
    version: "1.0.1", // Incremented version
    requiredVersion: "0.0.1",
    detailCacheDuration: 600,
    modules: [
        {
            title: "热门影片",
            description: "当前最热门的影片",
            requiresWebView: false,
            functionName: "getHotVideos",
            sectionMode: true,
            cacheDuration: 3600,
            params: [
                {
                    name: "page",
                    title: "页码",
                    type: "page",
                    value: 1
                }
            ]
        },
        {
            title: "最新上市影片",
            description: "最新发布的影片",
            requiresWebView: false,
            functionName: "getLatestVideos",
            sectionMode: true,
            cacheDuration: 3600,
            params: [
                {
                    name: "page",
                    title: "页码",
                    type: "page",
                    value: 1
                }
            ]
        }
    ]
};

/**
 * 通用的视频列表解析函数
 * @param {string} url - 要抓取的页面URL
 * @returns {Promise<Array>} - 返回视频对象数组
 */
async function parseVideoList(url) {
    try {
        console.log(`Fetching URL: ${url}`);
        const response = await Widget.http.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });

        // 使用 Widget.html.load 获取 cheerio 实例
        const $ = Widget.html.load(response.data);
        const result = [];

        $('div.card.h-100').each((i, el) => {
            const element = $(el);
            const titleAnchor = element.find('h6.card-title a');
            
            const title = titleAnchor.text();
            const link = titleAnchor.attr('href');
            
            if (!link) {
                console.log("Skipping card without a link.");
                return; // continue to next iteration
            }

            // 从链接中提取唯一ID
            const id = link.split('/videos/')[1].replace('/', '');
            const coverUrl = element.find('div.card-img-top img').attr('src');
            
            // 第二个匹配的 span 是发布日期
            const releaseDate = element.find('div.d-flex.justify-content-between span.text-truncate').eq(1).text();

            result.push({
                id: id,
                type: 'url',
                title: title,
                posterPath: coverUrl,
                backdropPath: coverUrl,
                link: link,
                releaseDate: releaseDate.trim(),
                mediaType: 'movie'
            });
        });
        
        console.log(`Parsed ${result.length} items.`);
        return result;

    } catch (error) {
        console.error("解析视频列表失败:", error);
        throw new Error(`无法加载或解析页面: ${url}`);
    }
}

/**
 * 获取热门影片
 * @param {object} params - 包含 page 参数
 */
async function getHotVideos(params = {}) {
    const page = params.page || 1;
    const url = `https://jable.tv/hot/${page > 1 ? 'page/' + page + '/' : ''}`;
    return await parseVideoList(url);
}

/**
 * 获取最新上市影片
 * @param {object} params - 包含 page 参数
 */
async function getLatestVideos(params = {}) {
    const page = params.page || 1;
    const url = `https://jable.tv/latest-updates/${page > 1 ? 'page/' + page + '/' : ''}`;
    return await parseVideoList(url);
}
