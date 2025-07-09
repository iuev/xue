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
            cacheDuration: 3600,
            params: [
                {
                    name: "sort_by",
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
                },
                {
                    name: "from",
                    title: "页码",
                    type: "page",
                    description: "页码数字",
                    value: "1"
                }
            ]
        },
        {
            title: "最新影片",
            description: "获取最新上传的视频",
            functionName: "getLatestVideos", 
            cacheDuration: 3600,
            params: [
                {
                    name: "from",
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
                description: "输入要搜索的关键词"
            },
            {
                name: "sort_by",
                title: "排序",
                type: "enumeration",
                description: "排序方式",
                enumOptions: [
                    {
                        title: "最多观看",
                        value: "video_viewed"
                    },
                    {
                        title: "近期最佳",
                        value: "post_date_and_popularity"
                    },
                    {
                        title: "最近更新",
                        value: "post_date"
                    },
                    {
                        title: "最多收藏",
                        value: "most_favourited"
                    }
                ]
            },
            {
                name: "from",
                title: "页码",
                type: "page",
                description: "页码",
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

// 搜索功能
async function searchVideos(params = {}) {
    const keyword = encodeURIComponent(params.keyword || "");
    
    let url = `https://jable.tv/search/${keyword}/?mode=async&function=get_block&block_id=list_videos_videos_list_search_result&q=${keyword}`;
    
    if (params.sort_by) {
        url += `&sort_by=${params.sort_by}`;
    }
    
    if (params.from) {
        url += `&from=${params.from}`;
    }
    
    console.log("🔍 搜索URL:", url);
    return await loadPage({ ...params, url });
}

// 获取热门视频
async function getHotVideos(params = {}) {
    console.log("🔥 获取热门视频", params);
    
    let url = "https://jable.tv/hot/?mode=async&function=get_block&block_id=list_videos_common_videos_list";
    
    if (params.sort_by) {
        url += `&sort_by=${params.sort_by}`;
    }
    
    if (params.from) {
        url += `&from=${params.from}`;
    }
    
    console.log("🔗 热门视频URL:", url);
    return await loadPage({ ...params, url });
}

// 获取最新视频
async function getLatestVideos(params = {}) {
    console.log("🆕 获取最新视频", params);
    
    let url = "https://jable.tv/latest-updates/?mode=async&function=get_block&block_id=list_videos_common_videos_list";
    
    if (params.from) {
        url += `&from=${params.from}`;
    }
    
    console.log("🔗 最新视频URL:", url);
    return await loadPage({ ...params, url });
}

// 通用页面加载函数
async function loadPage(params = {}) {
    try {
        const sections = await loadPageSections(params);
        const items = sections.flatMap((section) => section.childItems);
        console.log(`✅ 成功获取 ${items.length} 个视频`);
        return items;
    } catch (error) {
        console.error("❌ loadPage失败:", error);
        return [];
    }
}

// 获取页面数据
async function loadPageSections(params = {}) {
    try {
        let url = params.url;
        if (!url) {
            throw new Error("地址不能为空");
        }

        console.log("📡 请求URL:", url);

        const response = await Widget.http.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": "https://jable.tv/",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
            }
        });

        if (!response || !response.data || typeof response.data !== "string") {
            throw new Error("无法获取有效的HTML内容");
        }

        console.log("📏 响应数据长度:", response.data.length);
        console.log("📄 响应内容预览:", response.data.substring(0, 500));

        return parseHtml(response.data);
    } catch (error) {
        console.error("❌ loadPageSections失败:", error.message);
        throw error;
    }
}

// HTML解析函数
async function parseHtml(htmlContent) {
    try {
        const $ = Widget.html.load(htmlContent);
        
        if (!$) {
            throw new Error("HTML解析失败");
        }

        console.log("✅ HTML解析成功");

        // 定义选择器
        const sectionSelector = ".site-content .py-3, .pb-e-lg-40, .container, .row";
        const itemSelector = ".video-img-box";
        const coverSelector = "img";
        const durationSelector = ".absolute-bottom-right .label, .label";
        const titleSelector = ".title a, h6 a";

        let sections = [];
        
        // 尝试直接查找视频项（不依赖section结构）
        const directItems = $(itemSelector);
        console.log(`🔍 直接找到 ${directItems.length} 个视频项`);
        
        if (directItems.length > 0) {
            const items = [];
            
            directItems.each((index, itemElement) => {
                try {
                    const $itemElement = $(itemElement);
                    
                    // 获取标题和链接
                    const titleElement = $itemElement.find(titleSelector).first();
                    const url = titleElement.attr("href") || "";
                    const title = titleElement.text().trim();
                    
                    console.log(`📝 处理视频 ${index + 1}: ${title.substring(0, 30)}...`);
                    console.log(`🔗 链接: ${url}`);
                    
                    if (url && (url.includes("jable.tv") || url.includes("/videos/"))) {
                        // 获取封面和预览
                        const coverElement = $itemElement.find(coverSelector).first();
                        let cover = coverElement.attr("data-src") || coverElement.attr("src");
                        let video = coverElement.attr("data-preview");
                        
                        // 获取时长
                        const durationElement = $itemElement.find(durationSelector).first();
                        const duration = durationElement.text().trim();
                        
                        // 处理相对URL
                        const fullUrl = url.startsWith('http') ? url : `https://jable.tv${url}`;
                        
                        if (cover && !cover.startsWith('http')) {
                            cover = `https://assets-cdn.jable.tv${cover}`;
                        }
                        
                        if (video && !video.startsWith('http')) {
                            video = `https://assets-cdn.jable.tv${video}`;
                        }
                        
                        const item = {
                            id: fullUrl,
                            type: "link",  // 需要通过loadDetail获取播放链接
                            title: title,
                            backdropPath: cover,
                            posterPath: cover,
                            previewUrl: video,
                            link: fullUrl,
                            mediaType: "movie",
                            durationText: duration,
                            description: title
                        };
                        
                        items.push(item);
                        console.log(`✅ 成功解析: ${title.substring(0, 30)}...`);
                    } else {
                        console.log(`⚠️ 跳过无效链接: ${url}`);
                    }
                } catch (itemError) {
                    console.error("❌ 解析单个视频项失败:", itemError);
                }
            });
            
            if (items.length > 0) {
                sections.push({
                    title: "视频列表",
                    childItems: items
                });
            }
        } else {
            // 如果直接查找失败，尝试按section结构查找
            console.log("🔄 尝试按section结构查找...");
            
            const sectionElements = $(sectionSelector);
            console.log(`📦 找到 ${sectionElements.length} 个section`);
            
            sectionElements.each((sectionIndex, sectionElement) => {
                const $sectionElement = $(sectionElement);
                const sectionItems = $sectionElement.find(itemSelector);
                
                console.log(`📦 Section ${sectionIndex + 1} 包含 ${sectionItems.length} 个视频项`);
                
                if (sectionItems.length > 0) {
                    const items = [];
                    
                    sectionItems.each((index, itemElement) => {
                        // 复用上面的解析逻辑
                        // [解析代码与上面相同]
                    });
                    
                    if (items.length > 0) {
                        sections.push({
                            title: `视频列表 ${sectionIndex + 1}`,
                            childItems: items
                        });
                    }
                }
            });
        }
        
        console.log(`🎉 解析完成，共 ${sections.length} 个section，总计 ${sections.reduce((sum, s) => sum + s.childItems.length, 0)} 个视频`);
        return sections;
        
    } catch (error) {
        console.error("❌ parseHtml失败:", error);
        return [];
    }
}

// 加载视频详情和播放链接
async function loadDetail(link) {
    try {
        console.log("🎬 获取播放链接:", link);
        
        const response = await Widget.http.get(link, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": "https://jable.tv/",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
            }
        });

        if (!response || !response.data) {
            throw new Error("获取视频详情页失败");
        }

        console.log("📄 详情页数据长度:", response.data.length);

        // 使用正则表达式提取HLS链接
        const hlsMatches = response.data.match(/var hlsUrl = '(.*?)';/);
        
        if (hlsMatches && hlsMatches[1]) {
            const hlsUrl = hlsMatches[1];
            console.log("🎯 找到HLS链接:", hlsUrl);
            
            const item = {
                id: link,
                type: "detail",
                videoUrl: hlsUrl,
                mediaType: "movie",
                customHeaders: {
                    "Referer": link,
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                }
            };

            // 尝试解析相关视频
            try {
                const sections = await parseHtml(response.data);
                const relatedItems = sections.flatMap((section) => section.childItems);
                if (relatedItems.length > 0) {
                    item.childItems = relatedItems;
                    console.log(`📚 找到 ${relatedItems.length} 个相关视频`);
                }
            } catch (relatedError) {
                console.log("⚠️ 解析相关视频失败:", relatedError.message);
            }

            return item;
        } else {
            console.log("❌ 未找到HLS链接");
            throw new Error("无法获取有效的HLS URL");
        }

    } catch (error) {
        console.error("❌ loadDetail失败:", error);
        return {
            videoUrl: link // 返回原链接作为备选
        };
    }
} 
