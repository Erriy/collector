#!/usr/bin/env node
const inquirer = require('inquirer');
const fuzzy = require('fuzzy');
const commander = require('commander');
const youtubedl = require('youtube-dl-exec');
const path = require('path');
const collector = require('../lib');

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

const program = new commander.Command('collector');

async function search_resource (name, routes) {
    const result = await collector.search(name, routes);

    const entries = {};
    for(let r in result) {
        for(let i of result[r]) {
            i.route = r;
            entries[`[${r}] ${i.name}`] = {route: r, target: i};
        }
    }

    return await new Promise((resolve, reject) => {
        inquirer.prompt([{
            type   : 'autocomplete',
            name   : 'selected',
            message: '选择要操作的资源',
            source : function (_, input) {
                const keys = Object.keys(entries);
                if(!input || '' === input) {
                    return keys;
                }
                return fuzzy.filter(input, keys).map(e=>e.string);
            }
        }]).then(function (answers) {
            return resolve(entries[answers['selected']]);
        });
    });
}

async function select_sub_data (route, target) {
    const results = await collector.extract(route, target);

    const entries = {};
    for(let r of results) {
        entries[r.name] = r.url;
    }

    return await new Promise((resolve, reject) => {
        inquirer.prompt([{
            type    : 'checkbox',
            name    : 'selected',
            default : Object.keys(entries),
            message : '选择要下载的资源',
            choices : Object.keys(entries),
            pageSize: 20,
        }]).then(function (answers) {
            return resolve(answers['selected'].reduce((p, n)=>{
                p[n] = entries[n];
                return p;
            }, {}));
        });
    });
}

/**
 * 下载资源
 * @param {string} route - 要使用的路由名
 * @param {string} res_name - 资源名
 * @param {{name: string, url: string}} dobj - 需要下载的数据
 * @param {{output: string}} options - 下载选项
 */
async function download (route, res_name, dobj, options) {
    for(let n in dobj) {
        const durl = await collector.analysis(route, dobj[n]);
        const output = path.join(options.output, res_name, `${n}.mp4`);
        try {
            await youtubedl(durl, {output});
            console.log(output, '下载完成');
        }
        catch(e) {
            console.error('下载失败，请尝试是否能打开');
            console.error('在线播放网址：', dobj[n]);
            console.error('视频资源地址：', durl);
            process.exit(-1);
        }
    }
}

program
    .argument('<name>')
    .option('-o,--output <string>', '指定下载目录', path.join(process.env.HOME || process.env.USERPROFILE, 'Downloads'))
    .option('-r,--route <...string>', '指定使用的route')
    .action(async (name, opts)=>{
        const resource = await search_resource(name, opts.route);
        const result = await select_sub_data(resource.route, resource.target);
        await download(resource.route, resource.target.name, result, opts);
    });

program.parse();