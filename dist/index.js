'use strict';

var fs = require('fs');
var fse = require('fs-extra');
var path = require('path');

module.exports = function (caseConfig) {

    return function (req, res, next) {
        // 如果没有配置文件，直接透传
        if (!caseConfig) {
            next();
            return;
        }

        delete require.cache[path.resolve(caseConfig)];
        var config = require(path.resolve(caseConfig));
        var requestPath = req.swagger.pathName;
        var originalUrl = req.originalUrl;
        var mockDir = config.mockDir;
        var basePath = config.basePath;
        var configPaths = config.path;
        var apiCaseFiles = [];

        try {
            apiCaseFiles = fs.readdirSync(mockDir);
        } catch (error) {
            console.log('读取目录 mock 出错');
            next();
            return;
        }

        if (apiCaseFiles.length !== 0) {
            var matchedPath = hasPathConfig(configPaths, requestPath, originalUrl, basePath);

            if (matchedPath) {
                var caseNum = configPaths[matchedPath];
                var composeFileName = matchedPath.substr(1).replace(/\//g, '-') + '.json';

                // 如果caseNum为0或者不传，则透传接口
                if (!caseNum) {
                    next();
                    return;
                }

                for (var i = 0, len = apiCaseFiles.length; i < len; i++) {
                    var fileName = apiCaseFiles[i];
                    if (fileName === composeFileName) {
                        var CASE_FILE = mockDir + fileName;
                        var fileObj = {};

                        try {
                            fileObj = fse.readJsonSync(CASE_FILE);
                        } catch (error) {
                            console.log('读取 cases 文件 出错');
                            next();
                            return;
                        }

                        var requestCase = fileObj.cases[caseNum - 1];
                        return res.status(200).json(requestCase);
                    }
                }
            }
        }
        next();
    };
};

function hasPathConfig(pathsObj, requestPath, originalUrl, basePath) {
    for (var key in pathsObj) {
        var entirePath = basePath + key;
        if (requestPath === key || requestPath === entirePath || originalUrl === key || originalUrl === entirePath) {
            return key;
        }
    }
    return false;
}