const fs = require('fs');
const path = require('path');
const axios = require('axios').default;

const obj = {
    routes: {}
};

/**
 * 查询资源
 * @param {string} name - 要查询的名称
 * @param {Array.<string>} routes - 指定要使用的路由
 * @returns {Object.<string, Array.<{name: string, url: string}>>}
 */
async function search (name, routes) {
    const result = {};
    let keys = Object.keys(obj.routes);

    if(routes && routes.length > 0) {
        keys = keys.filter(k=>routes.indexOf(k) !== -1);
    }

    await Promise.all(keys.map(async k=>{
        const p = obj.routes[k];
        let r = p.search(name);
        if(r instanceof Promise) r = await r;
        result[k] = r;
    }));

    return result;
}

/**
 *
 * @param {string} name - 要使用的目标路由名
 * @param {{name: string, url: string}} target - 要解析的目标数据
 */
async function extract (name, target) {
    return await obj.routes[name].extract(target);
}

async function analysis (name, url) {
    let download_url_list = await obj.routes[name].analysis(url);
    if(download_url_list instanceof String) {
        download_url_list = [download_url_list];
    }
    return download_url_list;
}

function init () {
    // 初始化路由
    const files = fs.readdirSync(path.join(__dirname, 'routes'));
    files.forEach(f=>{
        obj.routes[f] = require(path.join(__dirname, 'routes', f));
    });
    // 设置axios默认超时
    axios.defaults.timeout = 1000 * 5;
}

init();

module.exports = {
    search,
    extract,
    analysis,
};