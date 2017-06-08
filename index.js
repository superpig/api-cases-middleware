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
        
        const config = require(path.resolve(caseConfig));
        const requestPath = req.swagger.pathName;
        const mockDir = config.mockDir;
        const basePath = config.basePath;
        const configPaths = config.path;
        let apiCaseFiles = [];

        try {
            apiCaseFiles = fs.readdirSync(mockDir);
        } catch (error) {
            console.log('读取目录 ' + mockDir + ' 出错');
        }

        if (apiCaseFiles.length !== 0) {
            const matchedPath = hasPathConfig(configPaths, requestPath);
            
            if (matchedPath) {
                const caseNum = configPaths[matchedPath];
                const composeFileName = matchedPath.replace(/\//g, '-') + '.json';

                // 如果caseNum为0或者不传，则透传接口
                if (!caseNum) {
                    next();
                    return;
                }

                for (let i = 0, len = apiCaseFiles.length; i < len; i++) {
                    const fileName = apiCaseFiles[i];
                    if (fileName === composeFileName) {
                        const CASE_FILE = mockDir + '/' + fileName;
                        let fileObj = {};

                        try {
                            fileObj = fse.readJsonSync(CASE_FILE)
                        } catch (error) {
                            console.log('读取文件 ' + CASE_FILE + ' 出错');      
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

function hasPathConfig (pathsObj, requestPath) {
    for (let key in pathsObj) {
        if (requestPath.indexOf(key) !== -1) {
            return key;
        }
    }
    return false;
}