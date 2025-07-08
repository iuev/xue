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

        console.log("响应数据长度:", response.data.length);

        // 解析HTML
        const $ = Widget.html.load(response.data);
        if (!$) {
            throw new Error("解析HTML失败");
        }

        // 查找视频项
        const videoItems = $(".video-img-box");
        console.log("找到视频项数量:", videoItems.length);
        
        if (videoItems.length === 0) {
            console.log("未找到视频项，查看页面内容前500字符:", response.data.substring(0, 500));
        }

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
        
        // 根据排序类型构建不同的URL
        let baseUrl = "https://jable.tv/hot/";
        
        // 添加异步参数
        let url = `${baseUrl}?mode=async&function=get_block&block_id=list_videos_common_videos_list`;
        
        // 添加排序参数
        if (sortType !== "video_viewed_week") {
            url += `&sort_by=${sortType}`;
        }
        
        // 添加分页参数
        if (page > 1) {
            url += `&from=${page}`;
        }
        
        console.log("热门视频URL:", url);
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
        
        let url = `https://jable.tv/latest-updates/?mode=async&function=get_block&block_id=list_videos_common_videos_list`;
        if (page > 1) {
            url += `&from=${page}`;
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
        let url = `https://jable.tv/search/${encodedKeyword}/?mode=async&function=get_block&block_id=list_videos_common_videos_list`;
        if (page > 1) {
            url += `&from=${page}`;
        }
        
        console.log("搜索URL:", url);
        
        return await parseVideoList(url);
    } catch (error) {
        console.error("搜索视频失败:", error);
        throw error;
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
