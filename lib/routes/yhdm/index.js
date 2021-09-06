const axios = require('axios').default;
const cheerio = require('cheerio');

const domain = 'http://www.yhdm.so';
const name = '樱花动漫';

async function search (name) {
    const r = await axios.get(`${domain}/search/${encodeURIComponent(name)}/`);
    const $ = cheerio.load(r.data);
    const result = [];

    $('div.lpic > ul > li').each((_,e)=>{
        result.push({
            name: $(e).find('h2 > a').attr('title'),
            url : `${domain}${$(e).find('a').attr('href')}`,
        });
    });

    return result;
}

/**
 * @param {{name: string, url: string}} t - 要解析的目标数据
 */
async function extract (t) {
    const r = await axios.get(t.url);
    const $ = cheerio.load(r.data);
    const result = [];
    $('#main0 > div > ul > li > a').each((_,e)=>{
        result.push({
            name: $(e).text(),
            url : `${domain}${$(e).attr('href')}`
        });
    });
    return result;
}

async function analysis (url) {
    const r = await axios.get(url);
    const $ = cheerio.load(r.data);
    let result = $('div.bofang > div').attr('data-vid');
    if(result.endsWith('$mp4')) {
        result = result.slice(0, result.length - 4);
    }
    return result;
}

module.exports = {
    domain,
    name,
    search,
    extract,
    analysis,
};