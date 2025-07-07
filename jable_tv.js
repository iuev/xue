
var WidgetMetadata = {
    id: "jable.tv",
    title: "Jable TV",
    description: "Jable TV 的非官方 ForwardWidget 模块",
    author: "Gemini",
    site: "https://jable.tv/",
    version: "1.0.0",
    requiredVersion: "0.0.1",
    detailCacheDuration: 600, // 详情缓存10分钟
    modules: [
        {
            title: "热门影片",
            description: "当前最热门的影片",
            requiresWebView: false,
            functionName: "getHotVideos",
            sectionMode: true,
            cacheDuration: 3600, // 缓存1小时
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
            cacheDuration: 3600, // 缓存1小时
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

        const docId = Widget.dom.parse(response.data);
        const videoElements = Widget.dom.select(docId, 'div.card.h-100');

        const result = videoElements.map((element) => {
            const titleElement = Widget.dom.select(element, 'h6.card-title a')[0];
            const title = Widget.dom.text(titleElement);
            const link = Widget.dom.attr(titleElement, 'href');
            
            // 从链接中提取唯一ID，例如 https://jable.tv/videos/ssis-932/ -> ssis-932
            const id = link.split('/videos/')[1].replace('/', '');

            const coverUrl = Widget.dom.attr(Widget.dom.select(element, 'div.card-img-top img')[0], 'src');
            
            // 尝试获取发布日期，第二个span通常是日期
            let releaseDate = '';
            try {
                 releaseDate = Widget.dom.text(Widget.dom.select(element, 'div.d-flex.justify-content-between span.text-truncate')[1]);
            } catch(e) {
                console.log("无法解析发布日期");
            }

            return {
                id: id,
                type: 'url', // ID 是从 URL 来的
                title: title,
                posterPath: coverUrl,
                backdropPath: coverUrl, // 列表页没有横向封面，暂时用同一个
                link: link,
                releaseDate: releaseDate.trim(),
                mediaType: 'movie' // 假设所有内容都是 movie 类型
            };
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
    // Jable TV 的热门影片分页URL结构为 /hot/page/2/
    const url = `https://jable.tv/hot/${page > 1 ? 'page/' + page + '/' : ''}`;
    return await parseVideoList(url);
}

/**
 * 获取最新上市影片
 * @param {object} params - 包含 page 参数
 */
async function getLatestVideos(params = {}) {
    const page = params.page || 1;
    // Jable TV 的最新上市影片分页URL结构为 /latest-updates/page/2/
    const url = `https://jable.tv/latest-updates/${page > 1 ? 'page/' + page + '/' : ''}`;
    return await parseVideoList(url);
}
