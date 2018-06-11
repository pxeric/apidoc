/**
 *
 * Api接口自动提交
 *
 */

'use strict';

/**
 * 版本号比较
 * @param {String} a 版本号a
 * @param {String} b 版本号b
 * @returns {number} -1:小于，0:等于，1:大于
 */
function versionStringCompare(a, b) {
    const aparts = a.split('.');
    const bparts = b.split('.');
    if (aparts[0] === bparts[0]){
       if (aparts.length === 1 && bparts.length === 1) {
           return 0;
       }
       return versionStringCompare(aparts.slice(1).join('.'), bparts.slice(1).join('.'));
    } else {
        return parseInt(aparts[0]) - parseInt(bparts[0]);
    }
}

const MIN_ASYNC_VERSION = '7.7.3';

const libPath = versionStringCompare(process.version.slice(1), MIN_ASYNC_VERSION) > 0 ? './lib/apidoc' : './outlib/apidoc';
console.log(`NodeVersion: ${process.version}, libPath: ${libPath}`);

module.exports = require(libPath);