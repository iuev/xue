
WidgetMetadata = {
    id: "jabletv.gemini.final",
    title: "Jable TV (Corrected)",
    description: "获取 Jable 视频 (严格遵循 javdb.js 模板)",
    author: "Gemini",
    site: "https://jable.tv/",
    version: "3.0.0",
    requiredVersion: "0.0.1",
    detailCacheDuration: 3600,
    modules: [
        {
            title: "搜索",
            functionName: "search",
            params: [
                { name: "keyword", title: "关键词", type: "input" },
                {
                    name: "sort_by",
                    title: "排序",
                    type: "enumeration",
                    enumOptions: [
                        { title: "最多观看", value: "video_viewed" },
                        { title: "近期最佳", value: "post_date_and_popularity" },
                        { title: "最近更新", value: "post_date" },
                        { title: "最多收藏", value: "most_favourited" },
                    ]
                },
                { name: "from", title: "页码", type: "page", value: 1 },
            ]
        },
        {
            title: "热门影片",
            functionName: "loadPage",
            params: [
                {
                    name: "url",
                    type: "constant",
                    value: "https://jable.tv/hot/?mode=async&function=get_block&block_id=list_videos_common_videos_list"
                },
                {
                    name: "sort_by",
                    title: "排序",
                    type: "enumeration",
                    enumOptions: [
                        { title: "今日热门", value: "video_viewed_today" },
                        { title: "本周热门", value: "video_viewed_week" },
                        { title: "本月热门", value: "video_viewed_month" },
                        { title: "所有时间", value: "video_viewed" },
                    ]
                },
                { name: "from", title: "页码", type: "page", value: 1 }
            ]
        },
        {
            title: "最新上市",
            functionName: "loadPage",
            params: [
                {
                    name: "url",
                    type: "constant",
                    value: "https://jable.tv/new-release/?mode=async&function=get_block&block_id=list_videos_common_videos_list"
                },
                 {
                    name: "sort_by",
                    title: "排序",
                    type: "enumeration",
                    enumOptions: [
                        { title: "最新发布", value: "latest-updates" },
                        { title: "最多观看", value: "video_viewed" },
                        { title: "最多收藏", value: "most_favourited" },
                    ]
                },
                { name: "from", title: "页码", type: "page", value: 1 }
            ]
        }
    ]
};

async function search(params = {}) {
  const keyword = encodeURIComponent(params.keyword || "");
  let url = `https://jable.tv/search/${keyword}/?mode=async&function=get_block&block_id=list_videos_videos_list_search_result&q=${keyword}`;
  return await loadPage({ ...params, url });
}

async function loadPage(params = {}) {
  const sections = await loadPageSections(params);
  const items = sections.flatMap((section) => section.childItems);
  return items;
}

async function loadPageSections(params = {}) {
    let url = params.url;
    if (params.sort_by) {
      url += `&sort_by=${params.sort_by}`;
    }
    if (params.from) {
      url += `&from=${params.from}`;
    }

    const response = await Widget.http.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      },
    });
    return parseHtml(response.data);
}

function parseHtml(htmlContent) {
  const $ = Widget.html.load(htmlContent);
  const items = [];
  $('.video-img-box').each((i, el) => {
      const $item = $(el);
      const linkElement = $item.find('.title a').first();
      const link = linkElement.attr('href');

      if (link && link.includes('jable.tv/videos/')) {
          const imgElement = $item.find('img').first();
          const cover = imgElement.attr('data-src');
          const previewVideo = imgElement.attr('data-preview');
          const title = linkElement.text();
          const duration = $item.find('.absolute-bottom-right .label').text().trim();
          
          items.push({
              id: link,
              type: "url",
              title: title,
              posterPath: cover,
              backdropPath: cover,
              previewUrl: previewVideo,
              link: link,
              mediaType: "movie",
              durationText: duration,
              description: duration
          });
      }
  });
  // The working script returns an array containing a single section object with an empty title.
  // This is what loadPage then flattens.
  return [{ title: "", childItems: items }];
}

async function loadDetail(link) {
  const response = await Widget.http.get(link, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  });

  const match = response.data.match(/var hlsUrl = '(.*?)';/);
  if (!match || !match[1]) {
    throw new Error("无法获取 HLS URL");
  }
  const hlsUrl = match[1];

  return {
    videoUrl: hlsUrl,
    customHeaders: {
      "Referer": link,
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  };
}
