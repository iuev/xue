WidgetMetadata = {
    id: "jable_tv",
    title: "Jable.TV",
    description: "获取 Jable.TV 的视频内容",
    author: "ForwardWidget",
    site: "https://jable.tv",
    version: "1.0.1",
    requiredVersion: "0.0.1",
    detailCacheDuration: 60,
    modules: [
        {
            title: "热门影片",
            description: "获取热门视频列表",
            functionName: "getHotVideos",
            sectionMode: false,
            cacheDuration: 3600,
            params: [
                {
                    name: "page",
                    title: "页码",
                    type: "page",
                    description: "页码数字",
                    value: "1"
                },
                {
                    name: "sort_type",
                    title: "排序方式",
                    type: "enumeration",
                    description: "选择热门排序方式",
                    value: "video_viewed_week",
                    enumOptions: [
                        {
                            title: "本周热门",
                            value: "video_viewed_week"
                        },
                        {
                            title: "本月热门", 
                            value: "video_viewed_month"
                        },
                        {
                            title: "今日热门",
                            value: "video_viewed_today"
                        },
                        {
                            title: "所有时间",
                            value: "video_viewed"
                        }
                    ]
                }
            ]
        },
        {
            title: "最新影片",
            description: "获取最新上传的视频",
            functionName: "getLatestVideos", 
            sectionMode: false,
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
        }
    ],
    search: {
        title: "搜索",
        functionName: "searchVideos",
        params: [
            {
                name: "keyword",
                title: "关键词",
                type: "input",
                description: "输入要搜索的关键词",
                value: ""
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

// 解析视频时长
function parseDuration(durationText) {
    if (!durationText) return 0;
    
    const parts = durationText.split(':');
    let seconds = 0;
    
    if (parts.length === 3) {
        // HH:MM:SS format
        seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    } else if (parts.length === 2) {
        // MM:SS format  
        seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    
    return seconds;
}

// 解析观看次数
function parseViewCount(viewText) {
    if (!viewText) return 0;
    
    // 移除逗号和空格
    const cleanText = viewText.replace(/,/g, '').replace(/\s/g, '');
    return parseInt(cleanText) || 0;
}

// 通用的视频列表解析函数
async function parseVideoList(url, headers = {}) {
    try {
        console.log("请求URL:", url);
        
        const response = await Widget.http.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": "https://jable.tv/",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
                ...headers
            }
        });

        if (!response || !response.data) {
            throw new Error("获取页面数据失败");
        }

        console.log("页面数据长度:", response.data.length);

        // 解析HTML
        const $ = Widget.html.load(response.data);
        if (!$) {
            throw new Error("解析HTML失败");
        }

        // 查找视频项
        const videoItems = $(".video-img-box");
        console.log("找到视频项数量:", videoItems.length);

        const results = [];
        
        videoItems.each((index, element) => {
            try {
                const $item = $(element);
                
                // 获取链接
                const linkElement = $item.find(".img-box a").first();
                const link = linkElement.attr("href");
                if (!link) return;
                
                // 构建完整URL
                const fullLink = link.startsWith('http') ? link : `https://jable.tv${link}`;
                
                // 获取标题
                const titleElement = $item.find(".title a").first();
                const title = titleElement.text().trim();
                if (!title) return;
                
                // 获取封面图片
                const imgElement = $item.find(".img-box img").first();
                let coverUrl = imgElement.attr("data-src") || imgElement.attr("src");
                if (coverUrl && !coverUrl.startsWith('http')) {
                    coverUrl = `https://assets-cdn.jable.tv${coverUrl}`;
                }
                
                // 获取预览视频链接
                let previewUrl = imgElement.attr("data-preview");
                if (previewUrl && !previewUrl.startsWith('http')) {
                    previewUrl = `https://assets-cdn.jable.tv${previewUrl}`;
                }
                
                // 获取时长
                const durationElement = $item.find(".label").first();
                const durationText = durationElement.text().trim();
                
                // 获取观看次数和收藏数
                const subTitle = $item.find(".sub-title").text();
                const viewMatch = subTitle.match(/(\d[\d,\s]*)/);
                const viewCount = viewMatch ? parseViewCount(viewMatch[1]) : 0;
                
                // 提取视频ID
                const urlMatch = link.match(/\/videos\/([^\/]+)\//);
                const videoId = urlMatch ? urlMatch[1] : link;
                
                const videoItem = {
                    id: videoId,
                    type: "link",  // 改为link类型，需要通过loadDetail获取真实播放链接
                    title: title,
                    posterPath: coverUrl,
                    backdropPath: coverUrl,
                    previewUrl: previewUrl, // 添加预览链接
                    link: fullLink,
                    duration: parseDuration(durationText),
                    durationText: durationText,
                    description: title,
                    mediaType: "movie"
                };

                results.push(videoItem);
            } catch (itemError) {
                console.error("解析视频项失败:", itemError);
            }
        });

        console.log("成功解析视频数量:", results.length);
        return results;
        
    } catch (error) {
        console.error("获取视频列表失败:", error);
        throw error;
    }
}

// 获取热门视频
async function getHotVideos(params = {}) {
    try {
        const page = params.page || 1;
        const sortType = params.sort_type || "video_viewed_week";
        
        let url = "https://jable.tv/hot/";
        if (page > 1) {
            url = `https://jable.tv/hot/${page}/`;
        }
        
        return await parseVideoList(url);
    } catch (error) {
        console.error("获取热门视频失败:", error);
        throw error;
    }
}

// 获取最新视频  
async function getLatestVideos(params = {}) {
    try {
        const page = params.page || 1;
        
        let url = "https://jable.tv/latest-updates/";
        if (page > 1) {
            url = `https://jable.tv/latest-updates/${page}/`;
        }
        
        return await parseVideoList(url);
    } catch (error) {
        console.error("获取最新视频失败:", error);
        throw error;
    }
}

// 搜索视频
async function searchVideos(params = {}) {
    try {
        const keyword = params.keyword;
        const page = params.page || 1;
        
        if (!keyword || keyword.trim() === "") {
            throw new Error("搜索关键词不能为空");
        }
        
        // URL编码关键词
        const encodedKeyword = encodeURIComponent(keyword.trim());
        
        // 构建搜索URL
        let url = `https://jable.tv/search/${encodedKeyword}/`;
        if (page > 1) {
            url = `https://jable.tv/search/${encodedKeyword}/${page}/`;
        }
        
        console.log("搜索URL:", url);
        
        return await parseVideoList(url);
    } catch (error) {
        console.error("搜索视频失败:", error);
        throw error;
    }
}

// 加载视频详情（如果需要播放链接）
async function loadDetail(link) {
    try {
        console.log("加载视频详情:", link);
        
        const response = await Widget.http.get(link, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": "https://jable.tv/",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
                "Cache-Control": "no-cache",
            }
        });

        if (!response || !response.data) {
            throw new Error("获取视频详情失败");
        }

        console.log("视频详情页面数据长度:", response.data.length);

        const $ = Widget.html.load(response.data);
        if (!$) {
            throw new Error("解析视频详情页面失败");
        }

        let videoUrl = "";
        
        // 方法1: 查找hlsUrl配置
        try {
            const scriptTexts = $("script").map((i, el) => $(el).html()).get();
            for (const scriptText of scriptTexts) {
                if (scriptText && scriptText.includes('hlsUrl')) {
                    // 查找hlsUrl配置
                    const hlsMatch = scriptText.match(/hlsUrl\s*[:=]\s*['"](https?:\/\/[^'"]+\.m3u8[^'"]*)['"]/);
                    if (hlsMatch) {
                        videoUrl = hlsMatch[1];
                        console.log("找到HLS链接:", videoUrl);
                        break;
                    }
                }
            }
        } catch (e) {
            console.log("方法1失败:", e);
        }
        
        // 方法2: 查找其他配置变量
        if (!videoUrl) {
            try {
                const scriptTexts = $("script").map((i, el) => $(el).html()).get();
                for (const scriptText of scriptTexts) {
                    if (scriptText) {
                        // 查找可能的视频配置
                        const patterns = [
                            /videoUrl\s*[:=]\s*['"](https?:\/\/[^'"]+)['"]/,
                            /src\s*[:=]\s*['"](https?:\/\/[^'"]+\.mp4[^'"]*)['"]/,
                            /file\s*[:=]\s*['"](https?:\/\/[^'"]+)['"]/,
                            /video\s*[:=]\s*['"](https?:\/\/[^'"]+)['"]/,
                            /url\s*[:=]\s*['"](https?:\/\/[^'"]+\.m3u8[^'"]*)['"]/
                        ];
                        
                        for (const pattern of patterns) {
                            const match = scriptText.match(pattern);
                            if (match) {
                                videoUrl = match[1];
                                console.log("找到视频链接:", videoUrl);
                                break;
                            }
                        }
                        if (videoUrl) break;
                    }
                }
            } catch (e) {
                console.log("方法2失败:", e);
            }
        }
        
        // 方法3: 查找video标签
        if (!videoUrl) {
            try {
                const videoElement = $("video");
                if (videoElement.length > 0) {
                    videoUrl = videoElement.attr("src") || 
                              videoElement.find("source").attr("src") ||
                              videoElement.attr("data-src");
                    if (videoUrl) {
                        console.log("从video标签找到链接:", videoUrl);
                    }
                }
            } catch (e) {
                console.log("方法3失败:", e);
            }
        }
        
        // 方法4: 查找iframe中的视频
        if (!videoUrl) {
            try {
                const iframes = $("iframe");
                for (let i = 0; i < iframes.length; i++) {
                    const src = $(iframes[i]).attr("src");
                    if (src && (src.includes("player") || src.includes("video"))) {
                        videoUrl = src;
                        console.log("从iframe找到链接:", videoUrl);
                        break;
                    }
                }
            } catch (e) {
                console.log("方法4失败:", e);
            }
        }
        
        // 如果所有方法都失败，尝试返回详情页面链接
        if (!videoUrl) {
            console.log("未找到视频链接，返回详情页面链接");
            videoUrl = link;
        }

        return {
            videoUrl: videoUrl
        };
        
    } catch (error) {
        console.error("加载视频详情失败:", error);
        return {
            videoUrl: link // 出错时返回原链接
        };
    }
} 
