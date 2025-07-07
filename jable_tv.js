
var WidgetMetadata = {
    id: "jable.tv",
    title: "Jable TV",
    description: "一个用于浏览 Jable TV 的 ForwardWidget 模块。",
    author: "Gemini",
    site: "https://jable.tv/",
    version: "1.1.0",
    requiredVersion: "0.0.1",
    detailCacheDuration: 600,
    modules: [
        {
            title: "热门影片",
            description: "当前最热门的影片",
            requiresWebView: false,
            functionName: "loadPage",
            sectionMode: true,
            cacheDuration: 3600,
            params: [
                { name: "url", type: "constant", value: "https://jable.tv/hot/" },
                { name: "title", type: "constant", value: "热门影片" },
                { name: "page", title: "页码", type: "page", value: 1 }
            ]
        },
        {
            title: "最新上市影片",
            description: "最新发布的影片",
            requiresWebView: false,
            functionName: "loadPage",
            sectionMode: true,
            cacheDuration: 3600,
            params: [
                { name: "url", type: "constant", value: "https://jable.tv/latest-updates/" },
                { name: "title", type: "constant", value: "最新上市影片" },
                { name: "page", title: "页码", type: "page", value: 1 }
            ]
        }
    ],
    search: {
        title: "搜索",
        functionName: "search",
        params: [
            { name: "keyword", title: "关键词", type: "input" },
            { name: "page", title: "页码", type: "page", value: 1 }
        ]
    }
};

async function loadPage(params = {}) {
    const page = params.page > 1 ? `page/${params.page}/` : '';
    const url = `${params.url}${page}`;
    const items = await parseVideoList(url);
    return [{ 
        title: params.title, 
        childItems: items 
    }];
}

async function search(params = {}) {
    const keyword = encodeURIComponent(params.keyword || "");
    const page = params.page || 1;
    // Jable's search uses a `from` parameter for pagination, not a path like other pages.
    const url = `https://jable.tv/search/${keyword}/?from=${page}`;
    // Search results are a flat list, not a section.
    return await parseVideoList(url);
}

async function parseVideoList(url) {
    try {
        const response = await Widget.http.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
        });

        const $ = Widget.html.load(response.data);
        const result = [];

        $('div.card.h-100').each((i, el) => {
            const element = $(el);
            const titleAnchor = element.find('h6.card-title a');
            const link = titleAnchor.attr('href');
            
            if (!link || !link.includes('/videos/')) return;

            const id = link.split('/videos/')[1].replace('/', '');
            const title = titleAnchor.text();
            const coverUrl = element.find('div.card-img-top img').attr('src');
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
        
        return result;

    } catch (error) {
        console.error(`解析视频列表失败: ${url}`, error);
        throw error;
    }
}

async function loadDetail(link) {
    try {
        const response = await Widget.http.get(link, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": "https://jable.tv/"
            },
        });

        const match = response.data.match(/var hlsUrl = '(.*?)';/);
        if (!match || !match[1]) {
            throw new Error("无法在页面中找到 hlsUrl");
        }
        const hlsUrl = match[1];

        return {
            videoUrl: hlsUrl,
            customHeaders: {
                "Referer": link
            }
        };
    } catch (error) {
        console.error(`加载详情页失败: ${link}`, error);
        throw error;
    }
}
