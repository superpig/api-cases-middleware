const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');

module.exports = function (caseConfig) {

    return function (req, res, next) {
        // 如果没有配置文件，直接透传
        if (!caseConfig) {
            next();
            return;
        }
        
        delete require.cache[path.resolve(caseConfig)];
        const config = require(path.resolve(caseConfig));
        const requestPath = req.swagger.pathName;
        const originalUrl = req.originalUrl;
        const mockDir = config.mockDir;
        const basePath = config.basePath;
        const configPaths = config.path;
        let apiCaseFiles = [];

        try {
            apiCaseFiles = fs.readdirSync(mockDir);
        } catch (error) {
            console.log('读取目录 mock 出错');
            next();
            return;
        }

        if (apiCaseFiles.length !== 0) {
            const matchedPath = hasPathConfig(configPaths, requestPath, originalUrl, basePath);
            
            if (matchedPath) {
                const caseNum = configPaths[matchedPath];
                const composeFileName = matchedPath.substr(1).replace(/\//g, '-') + '.json';

                // 如果caseNum为0或者不传，则透传接口
                if (!caseNum) {
                    next();
                    return;
                }

                for (let i = 0, len = apiCaseFiles.length; i < len; i++) {
                    const fileName = apiCaseFiles[i];
                    if (fileName === composeFileName) {
                        const CASE_FILE = mockDir + fileName;
                        let fileObj = {};

                        try {
                            fileObj = fse.readJsonSync(CASE_FILE)
                        } catch (error) {
                            console.log('读取 cases 文件 出错');
                            next();
                            return;      
                        }

                        const requestCase = fileObj.cases[caseNum - 1];
                        return res.status(200).json(requestCase);
                    }
                }
            } 
        }
        next();
    }
};

function hasPathConfig (pathsObj, requestPath, originalUrl, basePath) {
    for (let key in pathsObj) {
        const entirePath = basePath + key;
        if (requestPath === key || requestPath ===  entirePath  || 
            originalUrl === key || originalUrl === entirePath){
            return key;
        }
    }
    return false;
}