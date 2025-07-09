WidgetMetadata = {
    id: "ddys_mov",
    title: "低端影视 (DDYS)",
    description: "获取低端影视的电影和电视剧内容",
    author: "ForwardWidget",
    site: "https://ddys.mov",
    version: "1.0.0",
    requiredVersion: "0.0.1",
    detailCacheDuration: 60,
    modules: [
        {
            title: "最新电影",
            description: "获取最新上映的电影",
            functionName: "getLatestMovies",
            cacheDuration: 3600,
            params: [
                {
                    name: "page",
                    title: "页码",
                    type: "page",
                    description: "页码数字",
                    value: "1"
                }
            ]
        },
        {
            title: "最新剧集",
            description: "获取最新更新的电视剧",
            functionName: "getLatestTVShows",
            cacheDuration: 3600,
            params: [
                {
                    name: "page",
                    title: "页码",
                    type: "page",
                    description: "页码数字",
                    value: "1"
                }
            ]
        },
        {
            title: "电影分类",
            description: "按地区分类浏览电影",
            functionName: "getMoviesByCategory",
            cacheDuration: 3600,
            params: [
                {
                    name: "category",
                    title: "分类",
                    type: "enumeration",
                    description: "选择电影分类",
                    value: "western-movie",
                    enumOptions: [
                        {
                            title: "欧美电影",
                            value: "western-movie"
                        },
                        {
                            title: "日韩电影",
                            value: "asian-movie"
                        },
                        {
                            title: "华语电影",
                            value: "chinese-movie"
                        }
                    ]
                },
                {
                    name: "page",
                    title: "页码",
                    type: "page",
                    description: "页码数字",
                    value: "1"
                }
            ]
        },
        {
            title: "剧集分类",
            description: "按地区分类浏览剧集",
            functionName: "getDramasByCategory",
            cacheDuration: 3600,
            params: [
                {
                    name: "category",
                    title: "分类",
                    type: "enumeration",
                    description: "选择剧集分类",
                    value: "western-drama",
                    enumOptions: [
                        {
                            title: "欧美剧",
                            value: "western-drama"
                        },
                        {
                            title: "日剧",
                            value: "jp-drama"
                        },
                        {
                            title: "韩剧",
                            value: "kr-drama"
                        },
                        {
                            title: "华语剧",
                            value: "cn-drama"
                        },
                        {
                            title: "其他地区",
                            value: "other"
                        }
                    ]
                },
                {
                    name: "page",
                    title: "页码",
                    type: "page",
                    description: "页码数字",
                    value: "1"
                }
            ]
        },
        {
            title: "动画/新番",
            description: "动画和本季新番",
            functionName: "getAnime",
            cacheDuration: 3600,
            params: [
                {
                    name: "type",
                    title: "类型",
                    type: "enumeration",
                    description: "选择动画类型",
                    value: "anime",
                    enumOptions: [
                        {
                            title: "所有动画",
                            value: "anime"
                        },
                        {
                            title: "本季新番",
                            value: "new-bangumi"
                        }
                    ]
                },
                {
                    name: "page",
                    title: "页码",
                    type: "page",
                    description: "页码数字",
                    value: "1"
                }
            ]
        }
    ],
    search: {
        title: "搜索",
        functionName: "searchContent",
        params: [
            {
                name: "keyword",
                title: "关键词",
                type: "input",
                description: "输入电影或电视剧名称"
            },
            {
                name: "type",
                title: "类型",
                type: "enumeration",
                description: "搜索类型",
                enumOptions: [
                    {
                        title: "全部",
                        value: "all"
                    },
                    {
                        title: "电影",
                        value: "movie"
                    },
                    {
                        title: "电视剧",
                        value: "tv"
                    },
                    {
                        title: "综艺",
                        value: "variety"
                    },
                    {
                        title: "动漫",
                        value: "anime"
                    }
                ]
            },
            {
                name: "page",
                title: "页码",
                type: "page",
                description: "页码数字",
                value: "1"
            }
        ]
    }
};

// 通用的HTTP请求函数
async function makeRequest(url, options = {}) {
    try {
        console.log("🌐 请求URL:", url);
        
        const response = await Widget.http.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": "https://ddys.mov/",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
                ...options.headers
            }
        });

        if (!response || !response.data) {
            throw new Error("获取页面数据失败");
        }

        console.log("📏 响应数据长度:", response.data.length);
        return response.data;
    } catch (error) {
        console.error("❌ 请求失败:", error);
        throw error;
    }
}

// 通用的HTML解析函数
function parseMovieList(htmlContent) {
    try {
        const $ = Widget.html.load(htmlContent);
        if (!$) {
            throw new Error("HTML解析失败");
        }

        console.log("✅ HTML解析成功");

        const results = [];
        
        // 根据实际HTML结构使用正确的选择器
        const container = $(".post-box-list");
        const items = container.find("article.post-box");

        console.log(`📋 找到 ${items.length} 个内容项`);

        items.each((index, element) => {
            try {
                const $item = $(element);
                
                // 获取链接 - 从 data-href 属性
                const link = $item.attr("data-href");
                
                if (!link) {
                    console.log(`⚠️ 跳过无链接项: ${index + 1}`);
                    return;
                }

                // 构建完整URL
                const fullLink = link.startsWith('http') ? link : `https://ddys.mov${link}`;
                
                // 获取标题
                const titleElement = $item.find(".post-box-title a");
                const title = titleElement.text().trim();

                // 获取封面 - 从 background-image 样式中提取
                const imageElement = $item.find(".post-box-image");
                let coverUrl = "";
                const bgStyle = imageElement.attr("style");
                if (bgStyle) {
                    const urlMatch = bgStyle.match(/background-image:\s*url\(['"]?(.*?)['"]?\)/);
                    if (urlMatch && urlMatch[1]) {
                        coverUrl = urlMatch[1];
                    }
                }

                // 获取分类信息
                const categoryElements = $item.find(".post-box-meta a");
                const categories = [];
                categoryElements.each((i, el) => {
                    categories.push($(el).text().trim());
                });
                const category = categories.join("、");

                // 获取描述信息（如果有）
                const descElement = $item.find(".post-box-text p");
                const description = descElement.text().trim() || title;

                // 提取ID - 从URL中提取文章slug
                const urlMatch = link.match(/\/([^\/]+)\/?$/);
                const id = urlMatch ? urlMatch[1] : link;

                // 判断是否为推荐内容
                const isRecommended = $item.find(".fa-star").length > 0;

                // 判断媒体类型
                let mediaType = "movie";
                if (title.includes("更新至") || 
                    title.includes("第") && title.includes("季") || 
                    title.includes("连载") ||
                    category.includes("剧") ||
                    category.includes("动画") ||
                    category.includes("新番")) {
                    mediaType = "tv";
                }

                const item = {
                    id: id,
                    type: "link",  // 需要通过loadDetail获取播放链接
                    title: title,
                    posterPath: coverUrl,
                    backdropPath: coverUrl,
                    link: fullLink,
                    description: description,
                    genreTitle: category,
                    mediaType: mediaType,
                    recommended: isRecommended
                };

                results.push(item);
                console.log(`✅ 解析成功: ${title.substring(0, 30)}...`);

            } catch (itemError) {
                console.error("❌ 解析单项失败:", itemError);
            }
        });

        console.log(`🎉 解析完成，共获取 ${results.length} 个内容`);
        return results;

    } catch (error) {
        console.error("❌ HTML解析失败:", error);
        return [];
    }
}

// 获取最新电影
async function getLatestMovies(params = {}) {
    try {
        const page = params.page || 1;
        console.log("🎬 获取最新电影", { page });

        // 根据实际网站结构使用正确的URL
        const url = page === 1 ? 
            "https://ddys.mov/category/movie/" : 
            `https://ddys.mov/category/movie/page/${page}/`;

        const htmlContent = await makeRequest(url);
        const results = parseMovieList(htmlContent);
        
        // 过滤出电影类型
        const movies = results.filter(item => item.mediaType === "movie");
        console.log(`✅ 成功获取最新电影: ${movies.length} 部`);
        return movies;

    } catch (error) {
        console.error("❌ 获取最新电影失败:", error);
        return [];
    }
}

// 获取最新剧集（热映中）
async function getLatestTVShows(params = {}) {
    try {
        const page = params.page || 1;
        console.log("📺 获取最新剧集", { page });

        // 根据HTML中看到的"连载剧集"分类
        const url = page === 1 ? 
            "https://ddys.mov/category/airing/" : 
            `https://ddys.mov/category/airing/page/${page}/`;

        const htmlContent = await makeRequest(url);
        const results = parseMovieList(htmlContent);
        
        console.log(`✅ 成功获取最新剧集: ${results.length} 部`);
        return results;

    } catch (error) {
        console.error("❌ 获取最新剧集失败:", error);
        return [];
    }
}

// 按分类获取电影
async function getMoviesByCategory(params = {}) {
    try {
        const category = params.category || "western-movie";
        const page = params.page || 1;
        console.log("🎭 按分类获取电影", { category, page });

        // 根据HTML导航菜单的实际分类路径
        const url = page === 1 ? 
            `https://ddys.mov/category/movie/${category}/` : 
            `https://ddys.mov/category/movie/${category}/page/${page}/`;

        const htmlContent = await makeRequest(url);
        const results = parseMovieList(htmlContent);
        
        console.log(`✅ 成功获取${category}分类: ${results.length} 部`);
        return results;

    } catch (error) {
        console.error("❌ 按分类获取电影失败:", error);
        return [];
    }
}

// 按分类获取剧集
async function getDramasByCategory(params = {}) {
    try {
        const category = params.category || "western-drama";
        const page = params.page || 1;
        console.log("📺 按分类获取剧集", { category, page });

        // 根据HTML导航菜单的实际分类路径
        const url = page === 1 ? 
            `https://ddys.mov/category/drama/${category}/` : 
            `https://ddys.mov/category/drama/${category}/page/${page}/`;

        const htmlContent = await makeRequest(url);
        const results = parseMovieList(htmlContent);
        
        console.log(`✅ 成功获取${category}剧集: ${results.length} 部`);
        return results;

    } catch (error) {
        console.error("❌ 按分类获取剧集失败:", error);
        return [];
    }
}

// 获取动画/新番
async function getAnime(params = {}) {
    try {
        const type = params.type || "anime";
        const page = params.page || 1;
        console.log("🎨 获取动画", { type, page });

        // 根据HTML导航菜单的实际分类路径
        let url;
        if (type === "new-bangumi") {
            url = page === 1 ? 
                "https://ddys.mov/category/anime/new-bangumi/" : 
                `https://ddys.mov/category/anime/new-bangumi/page/${page}/`;
        } else {
            url = page === 1 ? 
                "https://ddys.mov/category/anime/" : 
                `https://ddys.mov/category/anime/page/${page}/`;
        }

        const htmlContent = await makeRequest(url);
        const results = parseMovieList(htmlContent);
        
        console.log(`✅ 成功获取${type}动画: ${results.length} 部`);
        return results;

    } catch (error) {
        console.error("❌ 获取动画失败:", error);
        return [];
    }
}

// 搜索功能
async function searchContent(params = {}) {
    try {
        const keyword = params.keyword;
        const type = params.type || "all";
        const page = params.page || 1;

        if (!keyword || keyword.trim() === "") {
            throw new Error("搜索关键词不能为空");
        }

        console.log("🔍 搜索内容", { keyword, type, page });

        const encodedKeyword = encodeURIComponent(keyword.trim());
        
        // 根据HTML中的搜索表单结构构建搜索URL
        let url;
        if (page === 1) {
            url = `https://ddys.mov/?s=${encodedKeyword}&post_type=post`;
        } else {
            url = `https://ddys.mov/page/${page}/?s=${encodedKeyword}&post_type=post`;
        }

        const htmlContent = await makeRequest(url);
        let results = parseMovieList(htmlContent);
        
        // 根据类型过滤
        if (type !== "all") {
            results = results.filter(item => {
                switch (type) {
                    case "movie":
                        return item.mediaType === "movie";
                    case "tv":
                        return item.mediaType === "tv";
                    case "anime":
                        return item.genreTitle && item.genreTitle.includes("动画");
                    case "variety":
                        return item.genreTitle && item.genreTitle.includes("综艺");
                    default:
                        return true;
                }
            });
        }
        
        console.log(`✅ 搜索成功: ${results.length} 个结果`);
        return results;

    } catch (error) {
        console.error("❌ 搜索失败:", error);
        return [];
    }
}

// 加载详情和播放链接
async function loadDetail(link) {
    try {
        console.log("🎬 获取播放链接:", link);

        const htmlContent = await makeRequest(link);
        const $ = Widget.html.load(htmlContent);

        if (!$) {
            throw new Error("详情页解析失败");
        }

        // 查找播放器容器
        let videoUrl = "";

        // 方法1: 查找Video.js播放器配置（根据HTML中的video.js引用）
        const videoPatterns = [
            /var\s+player_data\s*=\s*({.*?});/s,
            /video\.src\(\s*['"](.*?)['"]\s*\)/,
            /player\.src\(\s*['"](.*?)['"]\s*\)/,
            /"src"\s*:\s*"(.*?)"/,
            /hlsUrl\s*=\s*['"](.*?)['"]/,
            /videoUrl\s*=\s*['"](.*?)['"]/
        ];

        for (const pattern of videoPatterns) {
            const match = htmlContent.match(pattern);
            if (match) {
                if (pattern.source.includes('player_data')) {
                    // 解析JSON配置
                    try {
                        const configStr = match[1];
                        const config = JSON.parse(configStr);
                        if (config.src) {
                            videoUrl = config.src;
                        } else if (config.sources && config.sources[0]) {
                            videoUrl = config.sources[0].src;
                        }
                    } catch (e) {
                        continue;
                    }
                } else if (match[1]) {
                    videoUrl = match[1];
                }
                
                if (videoUrl) {
                    console.log("🎯 找到视频配置:", videoUrl);
                    break;
                }
            }
        }

        // 方法2: 查找iframe播放器
        if (!videoUrl) {
            const iframes = $("iframe");
            iframes.each((i, iframe) => {
                const src = $(iframe).attr("src");
                if (src && (src.includes("player") || src.includes("play") || src.includes("video"))) {
                    videoUrl = src.startsWith('http') ? src : `https://ddys.mov${src}`;
                    console.log("🎯 找到iframe播放器:", videoUrl);
                    return false; // 跳出循环
                }
            });
        }

        // 方法3: 查找Video.js播放器容器
        if (!videoUrl) {
            const videoContainer = $("#vjsp, .video-js, [data-setup]");
            if (videoContainer.length > 0) {
                const dataSetup = videoContainer.attr("data-setup");
                if (dataSetup) {
                    try {
                        const setup = JSON.parse(dataSetup);
                        if (setup.sources && setup.sources[0]) {
                            videoUrl = setup.sources[0].src;
                            console.log("🎯 找到data-setup配置:", videoUrl);
                        }
                    } catch (e) {
                        // 忽略JSON解析错误
                    }
                }
            }
        }

        // 方法4: 查找页面中的播放链接按钮或数据
        if (!videoUrl) {
            const playElements = $("[data-src], [data-url], .play-btn");
            playElements.each((i, el) => {
                const url = $(el).attr("data-src") || $(el).attr("data-url") || $(el).attr("href");
                if (url && (url.includes(".m3u8") || url.includes(".mp4") || url.includes("play"))) {
                    videoUrl = url;
                    console.log("🎯 找到播放链接:", videoUrl);
                    return false;
                }
            });
        }

        if (!videoUrl) {
            console.log("❌ 未找到视频链接，返回详情页链接");
            return {
                videoUrl: link // 返回原链接，让用户在浏览器中打开
            };
        }

        // 处理相对URL
        if (!videoUrl.startsWith('http')) {
            if (videoUrl.startsWith('//')) {
                videoUrl = `https:${videoUrl}`;
            } else {
                videoUrl = `https://ddys.mov${videoUrl}`;
            }
        }

        return {
            id: link,
            type: "detail", 
            videoUrl: videoUrl,
            mediaType: "movie",
            customHeaders: {
                "Referer": link,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept": "*/*"
            }
        };

    } catch (error) {
        console.error("❌ 获取播放链接失败:", error);
        return {
            videoUrl: link // 出错时返回原链接
        };
    }
} 
