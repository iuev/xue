WidgetMetadata = {
    id: "ddys_debug",
    title: "DDYS调试版",
    description: "专门用于调试播放链接提取的版本",
    author: "ForwardWidget",
    site: "https://ddys.mov",
    version: "1.0.0-debug",
    requiredVersion: "0.0.1",
    detailCacheDuration: 0, // 不缓存，便于调试
    modules: [
        {
            title: "调试单个视频",
            description: "输入视频链接进行调试",
            functionName: "debugSingleVideo",
            cacheDuration: 0,
            params: [
                {
                    name: "video_url",
                    title: "视频链接",
                    type: "input",
                    description: "输入ddys.mov的视频详情页链接",
                    value: "https://ddys.mov/ballerina/"
                }
            ]
        }
    ]
};

// 调试单个视频的播放链接提取
async function debugSingleVideo(params = {}) {
    const videoUrl = params.video_url || "https://ddys.mov/ballerina/";
    
    console.log("🚀 开始调试视频:", videoUrl);
    
    try {
        const result = await loadDetailDebug(videoUrl);
        
        // 返回调试结果
        return [{
            id: "debug_result",
            type: "debug",
            title: "调试结果",
            description: `播放链接: ${result.videoUrl}`,
            link: result.videoUrl,
            videoUrl: result.videoUrl,
            mediaType: "movie"
        }];
        
    } catch (error) {
        console.error("❌ 调试失败:", error);
        return [{
            id: "debug_error",
            type: "error", 
            title: "调试失败",
            description: error.message,
            mediaType: "movie"
        }];
    }
}

// 专门用于调试的loadDetail函数
async function loadDetailDebug(link) {
    try {
        console.log("🔍 第一步: 获取详情页HTML");
        
        const response = await Widget.http.get(link, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Referer": "https://ddys.mov/",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
            }
        });

        if (!response || !response.data) {
            throw new Error("无法获取页面内容");
        }

        const htmlContent = response.data;
        console.log("✅ 页面获取成功，长度:", htmlContent.length);

        const $ = Widget.html.load(htmlContent);
        if (!$) {
            throw new Error("HTML解析失败");
        }

        console.log("✅ HTML解析成功");

        // 详细分析页面结构
        console.log("📊 页面结构分析:");
        console.log("- script标签数量:", $("script").length);
        console.log("- iframe数量:", $("iframe").length);
        console.log("- video标签数量:", $("video").length);
        console.log("- 包含'player'的元素:", $("[id*='player'], [class*='player']").length);
        console.log("- 包含'video'的元素:", $("[id*='video'], [class*='video']").length);

        let videoUrl = "";

        // 方法1: 查找WordPress播放列表配置（最重要！）
        console.log("🔍 方法1: 查找wp-playlist配置...");
        const playlistScript = $("script.wp-playlist-script[type='application/json']");
        
        if (playlistScript.length > 0) {
            console.log(`📋 找到 ${playlistScript.length} 个播放列表script标签`);
            
            try {
                const configText = playlistScript.html();
                console.log("📜 播放列表配置文本长度:", configText.length);
                console.log("📄 配置预览:", configText.substring(0, 300) + "...");
                
                const playlistConfig = JSON.parse(configText);
                console.log("✅ JSON解析成功");
                console.log("📊 配置结构:", {
                    type: playlistConfig.type,
                    tracks: playlistConfig.tracks ? playlistConfig.tracks.length : 0
                });
                
                if (playlistConfig.tracks && playlistConfig.tracks.length > 0) {
                    const track = playlistConfig.tracks[0];
                    console.log("🎵 第一个播放轨道详细信息:");
                    console.log("   src:", track.src);
                    console.log("   src0:", track.src0);
                    console.log("   src1:", track.src1);
                    console.log("   src2:", track.src2);
                    console.log("   src3:", track.src3);
                    console.log("   portn:", track.portn);
                    console.log("   srctype:", track.srctype);
                    console.log("   title:", track.title);
                    console.log("   type:", track.type);
                    
                    // 尝试多个可能的src字段
                    const possibleSrcs = [
                        { name: "src0", value: track.src0 },
                        { name: "src3", value: track.src3 },
                        { name: "src", value: track.src },
                        { name: "file", value: track.file }
                    ];
                    
                    for (const { name, value } of possibleSrcs) {
                        if (value && value !== "javascript:;" && value.includes('.mp4')) {
                            console.log(`   🎯 ${name} 包含有效的视频路径: ${value}`);
                            if (!videoUrl) {
                                videoUrl = value;
                                console.log(`   ✅ 采用 ${name} 作为播放URL`);
                                
                                // 检查是否需要端口号
                                if (track.portn && !videoUrl.includes(':' + track.portn)) {
                                    console.log(`   🔌 检测到端口号: ${track.portn}`);
                                    if (videoUrl.startsWith('/')) {
                                        const urlWithPort = `https://ddys.mov:${track.portn}${videoUrl}`;
                                        console.log(`   🔗 添加端口号后: ${urlWithPort}`);
                                        videoUrl = urlWithPort;
                                    }
                                }
                            }
                        }
                    }
                    
                    // 如果还没找到，检查加密字段
                    if (!videoUrl && track.src2) {
                        console.log(`   🔐 发现可能的加密字段 src2: ${track.src2}`);
                        console.log(`   📏 src2 长度: ${track.src2.length}`);
                        if (track.src2.length > 10) {
                            console.log("   ⚠️ src2 可能需要解密处理");
                            // 这里可以尝试解密逻辑
                        }
                    }
                }
            } catch (e) {
                console.log("❌ 播放列表JSON解析失败:", e.message);
                console.log("📄 原始文本:", playlistScript.html().substring(0, 500));
            }
        } else {
            console.log("❌ 未找到wp-playlist-script标签");
        }

        // 方法2: 详细分析所有script标签
        console.log("🔍 方法2: 分析其他script标签内容");
        const scripts = $("script");
        let scriptIndex = 0;
        
        scripts.each((i, script) => {
            const scriptContent = $(script).html();
            const className = $(script).attr("class");
            const type = $(script).attr("type");
            scriptIndex++;
            
            // 跳过已经处理的播放列表script
            if (className === "wp-playlist-script") {
                return;
            }
            
            if (scriptContent && scriptContent.length > 50) {
                console.log(`📝 Script ${scriptIndex} (${scriptContent.length}字符, class:'${className}', type:'${type}'):`);
                
                // 显示script内容的前200字符用于调试
                const preview = scriptContent.substring(0, 200).replace(/\s+/g, ' ');
                console.log(`   预览: ${preview}...`);
                
                // 查找可能的播放配置
                const patterns = [
                    { name: "player_data", regex: /var\s+player_data\s*=\s*({.*?});/s },
                    { name: "videojs_src", regex: /player\.src\(\s*['"](.*?)['"]\s*\)/ },
                    { name: "src0", regex: /src0['"]*:\s*['"](.*?)['"]/ },
                    { name: "src3", regex: /src3['"]*:\s*['"](.*?)['"]/ },
                    { name: "file_url", regex: /"file"\s*:\s*"(.*?)"/ },
                    { name: "video_url", regex: /"url"\s*:\s*"(.*?)"/ },
                    { name: "src_url", regex: /"src"\s*:\s*"(.*?)"/ },
                    { name: "m3u8_url", regex: /(https?:\/\/[^'"]*\.m3u8[^'"]*)/ },
                    { name: "mp4_url", regex: /(https?:\/\/[^'"]*\.mp4[^'"]*)/ }
                ];

                for (const pattern of patterns) {
                    const match = scriptContent.match(pattern.regex);
                    if (match && match[1] && match[1] !== "javascript:;") {
                        console.log(`   🎯 找到 ${pattern.name}: ${match[1].substring(0, 100)}...`);
                        if (!videoUrl && (match[1].includes('.m3u8') || match[1].includes('.mp4') || match[1].includes('video'))) {
                            videoUrl = match[1];
                            console.log(`   ✅ 采用此链接作为播放URL`);
                        }
                    }
                }
            }
        });

        // 方法2: 分析iframe
        if (!videoUrl) {
            console.log("🔍 方法2: 分析iframe播放器");
            const iframes = $("iframe");
            
            iframes.each((i, iframe) => {
                const src = $(iframe).attr("src");
                const id = $(iframe).attr("id");
                const className = $(iframe).attr("class");
                
                console.log(`📺 iframe ${i + 1}:`);
                console.log(`   src: ${src}`);
                console.log(`   id: ${id}`);
                console.log(`   class: ${className}`);
                
                if (src && (src.includes("player") || src.includes("play") || src.includes("video"))) {
                    const fullSrc = src.startsWith('http') ? src : `https://ddys.mov${src}`;
                    console.log(`   🎯 这个iframe可能是播放器: ${fullSrc}`);
                    if (!videoUrl) {
                        videoUrl = fullSrc;
                        console.log(`   ✅ 采用此iframe作为播放URL`);
                    }
                }
            });
        }

        // 方法3: 查找Video.js容器
        if (!videoUrl) {
            console.log("🔍 方法3: 查找Video.js容器");
            const videoContainers = $("#vjsp, .video-js, [data-setup]");
            
            videoContainers.each((i, container) => {
                const id = $(container).attr("id");
                const className = $(container).attr("class");
                const dataSetup = $(container).attr("data-setup");
                
                console.log(`🎮 Video容器 ${i + 1}:`);
                console.log(`   id: ${id}`);
                console.log(`   class: ${className}`);
                console.log(`   data-setup: ${dataSetup}`);
                
                if (dataSetup) {
                    try {
                        const setup = JSON.parse(dataSetup);
                        console.log("   📋 解析data-setup:", setup);
                        if (setup.sources && setup.sources[0]) {
                            videoUrl = setup.sources[0].src || setup.sources[0];
                            console.log(`   ✅ 从data-setup获取到URL: ${videoUrl}`);
                        }
                    } catch (e) {
                        console.log("   ❌ data-setup解析失败:", e.message);
                    }
                }
            });
        }

        // 方法4: 查找页面中所有可能的视频URL
        if (!videoUrl) {
            console.log("🔍 方法4: 搜索页面中的所有视频URL");
            
            const urlPatterns = [
                /(https?:\/\/[^'">\s]*\.m3u8[^'">\s]*)/g,
                /(https?:\/\/[^'">\s]*\.mp4[^'">\s]*)/g,
                /(https?:\/\/[^'">\s]*video[^'">\s]*)/g,
                /(https?:\/\/[^'">\s]*play[^'">\s]*)/g
            ];

            for (const pattern of urlPatterns) {
                const matches = htmlContent.match(pattern);
                if (matches) {
                    console.log(`   🔗 找到${matches.length}个潜在链接:`);
                    matches.forEach((match, index) => {
                        console.log(`     ${index + 1}. ${match}`);
                        if (!videoUrl && (match.includes('.m3u8') || match.includes('.mp4'))) {
                            videoUrl = match;
                            console.log(`     ✅ 采用此链接`);
                        }
                    });
                }
            }
        }

        // 输出最终结果
        if (videoUrl) {
            console.log("🎉 最终找到播放链接:", videoUrl);
            console.log("🔗 原始路径:", videoUrl);
            
            // 验证链接格式（基于真实页面结构）
            if (videoUrl.startsWith('http')) {
                console.log("✅ 已经是完整URL格式");
            } else {
                console.log("⚠️ 需要补全链接格式");
                const originalUrl = videoUrl;
                
                if (videoUrl.startsWith('//')) {
                    videoUrl = `https:${videoUrl}`;
                    console.log("🔗 添加协议:", videoUrl);
                } else if (videoUrl.startsWith('/')) {
                    // 根据真实页面，视频路径如 "/v/movie/Ballerina.2025.mp4"
                    videoUrl = `https://ddys.mov${videoUrl}`;
                    console.log("🔗 添加域名:", videoUrl);
                } else {
                    videoUrl = `https://ddys.mov/${videoUrl}`;
                    console.log("🔗 添加域名和斜杠:", videoUrl);
                }
                
                console.log("📊 URL转换总结:");
                console.log(`   原始: ${originalUrl}`);
                console.log(`   最终: ${videoUrl}`);
            }
            
            // 测试建议
            console.log("🧪 测试建议:");
            console.log(`   1. 直接在浏览器中访问: ${videoUrl}`);
            console.log(`   2. 检查是否需要特殊请求头`);
            console.log(`   3. 验证视频文件是否存在`);
            
            return {
                videoUrl: videoUrl,
                type: "video",
                customHeaders: {
                    "Referer": link,
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                    "Accept": "*/*",
                    "Origin": "https://ddys.mov",
                    "X-Requested-With": "XMLHttpRequest"
                }
            };
        } else {
            console.log("❌ 所有方法都未找到播放链接");
            console.log("📊 调试总结:");
            console.log("   1. 检查页面是否正确加载");
            console.log("   2. 确认播放器结构是否变化");
            console.log("   3. 查看是否有新的加密方式");
            console.log("📄 返回详情页面供手动检查");
            
            return {
                videoUrl: link,
                type: "webpage"
            };
        }

    } catch (error) {
        console.error("❌ 调试过程出错:", error);
        throw error;
    }
}

// 用于调试时直接调用
async function loadDetail(link) {
    return await loadDetailDebug(link);
} 
