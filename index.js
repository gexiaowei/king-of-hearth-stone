var request = require('request');
var async = require('async');
var cheerio = require('cheerio');

var ProgressBar = require('progress');

var util = require('util');
var fs = require('fs');

var destArticles = require('./articles.json');
var articles = [];
var articleDOMs = [];

var bar;

var count = 1;
var total = 1;
var isFinish = false;

var htmlPage = cheerio.load(fs.readFileSync('index.html', {encoding: 'utf-8'}), {decodeEntities: false});
var htmlList = htmlPage('#list');

var startTime = Date.now();

async.whilst(function () {
    return count <= total && !isFinish;
}, function (cb) {
    request('http://www.zhangyoubao.com/lscs/news/list-0/' + count, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(body);
            if (total === 1) {
                total = parseInt($('.page-num').last().text());
            }
            if (!bar) {
                bar = new ProgressBar('[:bar] :percent :etas', {
                    complete: '=',
                    incomplete: ' ',
                    width: 100,
                    total: total
                });
            }
            var items = $('.art-link.nail');
            for (var i = 0; i < items.length; i++) {
                var current = $(items[i]);
                var title = current.find('h3').text();
                var link = current.attr('href');
                if (title.indexOf('炉石王') !== -1) {
                    if (destArticles.length !== 0 && destArticles[0].link === link) {
                        isFinish = true;
                        cb();
                        return;
                    }
                    articles.push({
                        title: title,
                        link: link
                    });
                    articleDOMs.push(current);
                }
            }
            bar.tick();
            count++;
        }
        cb();
    });
}, function () {
    writeArticlesHTML();
    writeArticles(articles);
    console.log(util.format('总耗时:%sms', Date.now() - startTime));
});


function writeArticles(articles) {
    fs.writeFile('articles.json', JSON.stringify(articles.concat(destArticles)), function (err) {
        console.log(err ? err : '写入articles.json成功');
    });
}


function writeArticlesHTML() {
    articleDOMs.reverse().forEach(function (articleDOM) {
        articleDOM.prependTo(htmlList);
    });
    fs.writeFile('index.html', htmlPage.html(), function (err) {
        console.log(err ? err : '写入index.html成功');
    });
}