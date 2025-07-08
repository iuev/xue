WidgetMetadata = {
    id: "jable_tv",
    title: "Jable.TV",
    description: "获取 Jable.TV 的视频内容",
    author: "ForwardWidget",
    site: "https://jable.tv",
    version: "1.0.0",
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
        console.log("🔄 开始请求:", url);
        
        const response = await Widget.http.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": "https://jable.tv/",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
                ...headers
            }
        });

        console.log("📡 响应状态:", response ? "成功" : "失败");
        console.log("📏 响应数据长度:", response?.data?.length || 0);

        if (!response || !response.data) {
            throw new Error("获取页面数据失败");
        }

        // 输出前1000字符用于调试
        console.log("📄 响应内容前1000字符:", response.data.substring(0, 1000));

        // 解析HTML
        const $ = Widget.html.load(response.data);
        if (!$) {
            throw new Error("解析HTML失败");
        }

        console.log("✅ HTML解析成功");

        // 尝试多种选择器
        const selectors = [
            ".video-img-box",
            ".img-box", 
            ".cover-md",
            "a[href*='/videos/']",
            "[data-src*='contents/videos_screenshots']"
        ];

        let videoItems = null;
        let usedSelector = "";

        for (const selector of selectors) {
            const items = $(selector);
            console.log(`🔍 选择器 '${selector}' 找到 ${items.length} 个元素`);
            if (items.length > 0) {
                videoItems = items;
                usedSelector = selector;
                break;
            }
        }

        if (!videoItems || videoItems.length === 0) {
            console.log("❌ 未找到任何视频项");
            console.log("📋 页面所有class列表:", $('[class]').map((i, el) => $(el).attr('class')).get().slice(0, 20));
            throw new Error("未找到视频项");
        }

        console.log(`🎯 使用选择器 '${usedSelector}' 找到 ${videoItems.length} 个视频项`);

        const results = [];
        
        videoItems.each((index, element) => {
            try {
                const $item = $(element);
                console.log(`📝 解析第 ${index + 1} 个视频项`);
                
                // 根据不同选择器适配不同的解析方式
                let linkElement, link, titleElement, title, imgElement;
                
                if (usedSelector === ".video-img-box") {
                    // 标准的视频盒子结构
                    linkElement = $item.find(".img-box a, a").first();
                    titleElement = $item.find(".title a, h6 a").first();
                    imgElement = $item.find(".img-box img, img").first();
                } else if (usedSelector.includes("href")) {
                    // 直接是链接元素
                    linkElement = $item;
                    titleElement = $item.find("img").attr("alt") ? $item : $item.siblings().find("a");
                    imgElement = $item.find("img");
                } else {
                    // 其他情况，尝试通用方法
                    linkElement = $item.find("a").first() || $item.closest("a") || $item;
                    titleElement = $item.find("a[title], img[alt]").first();
                    imgElement = $item.find("img").first() || $item;
                }
                
                link = linkElement.attr("href");
                title = titleElement.text().trim() || titleElement.attr("title") || imgElement.attr("alt") || "";
                
                console.log(`🔗 链接: ${link}`);
                console.log(`📝 标题: ${title}`);
                
                if (!link || !link.includes('/videos/')) {
                    console.log(`⚠️ 跳过无效项: 链接=${link}`);
                    return;
                }
                
                // 构建完整URL
                const fullLink = link.startsWith('http') ? link : `https://jable.tv${link}`;
                
                // 获取封面图片
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
                const durationElement = $item.find(".label, .duration").first();
                const durationText = durationElement.text().trim();
                
                // 提取视频ID
                const urlMatch = link.match(/\/videos\/([^\/]+)\//);
                const videoId = urlMatch ? urlMatch[1] : link;
                
                const videoItem = {
                    id: videoId,
                    type: "link",  // 需要通过loadDetail获取播放链接
                    title: title,
                    posterPath: coverUrl,
                    backdropPath: coverUrl,
                    previewUrl: previewUrl, // 预览链接
                    link: fullLink, // 详情页链接
                    duration: parseDuration(durationText),
                    durationText: durationText,
                    description: title,
                    mediaType: "movie"
                };

                console.log(`✅ 成功解析视频: ${title.substring(0, 50)}...`);
                results.push(videoItem);
            } catch (itemError) {
                console.error("❌ 解析视频项失败:", itemError);
            }
        });

        console.log(`🎉 解析完成! 共获取 ${results.length} 个视频`);
        
        if (results.length > 0) {
            console.log("📊 第一个视频示例:", {
                id: results[0].id,
                title: results[0].title?.substring(0, 50) + "...",
                link: results[0].link,
                posterPath: results[0].posterPath?.substring(0, 50) + "..."
            });
        }
        
        return results;
        
    } catch (error) {
        console.error("❌ 获取视频列表失败:", error);
        console.error("📋 错误详情:", error.message);
        
        // 返回空数组以避免应用崩溃
        return [];
    }
}

// 获取热门视频
async function getHotVideos(params = {}) {
    try {
        const page = params.page || 1;
        const sortType = params.sort_type || "video_viewed_week";
        
        console.log("🚀 开始获取热门视频", { page, sortType });
        
        // 首先尝试普通页面（用于测试和调试）
        if (page === 1) {
            console.log("🧪 尝试普通页面作为备选方案");
            try {
                const normalPageUrl = "https://jable.tv/hot/";
                const normalResult = await parseVideoList(normalPageUrl);
                if (normalResult && normalResult.length > 0) {
                    console.log("✅ 普通页面获取成功，返回数据");
                    return normalResult;
                }
            } catch (normalError) {
                console.log("⚠️ 普通页面失败，尝试API:", normalError.message);
            }
        }
        
        // 使用异步API
        let baseUrl = "https://jable.tv/hot/";
        let url = `${baseUrl}?mode=async&function=get_block&block_id=list_videos_common_videos_list`;
        
        // 添加排序参数
        if (sortType && sortType !== "video_viewed_week") {
            url += `&sort_by=${sortType}`;
        }
        
        // 添加分页参数
        if (page > 1) {
            url += `&from=${page}`;
        }
        
        console.log("🔗 API URL:", url);
        return await parseVideoList(url);
    } catch (error) {
        console.error("❌ 获取热门视频失败:", error);
        console.error("📋 错误详情:", error.message);
        // 返回空数组以避免应用崩溃
        return [];
    }
}

// 获取最新视频  
async function getLatestVideos(params = {}) {
    try {
        const page = params.page || 1;
        console.log("🆕 开始获取最新视频", { page });
        
        // 首先尝试普通页面
        if (page === 1) {
            try {
                const normalPageUrl = "https://jable.tv/latest-updates/";
                const normalResult = await parseVideoList(normalPageUrl);
                if (normalResult && normalResult.length > 0) {
                    console.log("✅ 最新视频普通页面获取成功");
                    return normalResult;
                }
            } catch (normalError) {
                console.log("⚠️ 最新视频普通页面失败，尝试API:", normalError.message);
            }
        }
        
        // 使用异步API
        let url = `https://jable.tv/latest-updates/?mode=async&function=get_block&block_id=list_videos_common_videos_list`;
        if (page > 1) {
            url += `&from=${page}`;
        }
        
        console.log("🔗 最新视频API URL:", url);
        return await parseVideoList(url);
    } catch (error) {
        console.error("❌ 获取最新视频失败:", error);
        // 返回空数组而不是抛出错误，确保应用不会崩溃
        return [];
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
        let url = `https://jable.tv/search/${encodedKeyword}/?mode=async&function=get_block&block_id=list_videos_common_videos_list`;
        if (page > 1) {
            url += `&from=${page}`;
        }
        
        console.log("🔍 搜索URL:", url);
        
        return await parseVideoList(url);
    } catch (error) {
        console.error("❌ 搜索视频失败:", error);
        console.error("📋 错误详情:", error.message);
        // 返回空数组以避免应用崩溃
        return [];
    }
}

// 加载视频详情
async function loadDetail(link) {
    try {
        console.log("获取视频播放链接:", link);
        
        const response = await Widget.http.get(link, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": "https://jable.tv/",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            }
        });

        if (!response || !response.data) {
            throw new Error("获取页面失败");
        }

        // 提取HLS流媒体链接
        const hlsMatches = response.data.match(/var hlsUrl = '(.*?)';/);
        if (hlsMatches && hlsMatches[1]) {
            const hlsUrl = hlsMatches[1];
            console.log("找到HLS链接:", hlsUrl);
            return {
                videoUrl: hlsUrl
            };
        }

        // 如果没找到HLS，尝试查找其他视频链接
        const videoMatches = response.data.match(/videoUrl\s*[:=]\s*['"](https?:\/\/[^'"]+)['"]/);
        if (videoMatches && videoMatches[1]) {
            console.log("找到视频链接:", videoMatches[1]);
            return {
                videoUrl: videoMatches[1]
            };
        }

        // 如果都没找到，返回原链接
        console.log("未找到视频链接，返回原链接");
        return {
            videoUrl: link
        };

    } catch (error) {
        console.error("获取视频链接失败:", error);
        return {
            videoUrl: link
        };
    }
} 
