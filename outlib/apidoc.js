'use strict';

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * 更新API文档到Yapi
 * @param {Array} files -扫描数组
 * @param {Object} apiConf - apiConfig
 */
var updateApi = function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/_regenerator2.default.mark(function _callee(files, apiConf) {
    var oldApis, apiList, changeApiCount, updateFailedCount, i, api, key, catInfo, addCatResult, oldApiInfo, addApiResult, upApiResult;
    return _regenerator2.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            if (!(!apiConf.project_id || !apiConf.token)) {
              _context.next = 4;
              break;
            }

            console.error('must set project_id & token');
            return _context.abrupt('return');

          case 4:
            _apiFiles = files;
            apiConfig = Object.assign(apiConfig, apiConf);
            _context.next = 8;
            return getAllInterface();

          case 8:
            oldApis = _context.sent;

            if (!(oldApis.errcode !== 0)) {
              _context.next = 12;
              break;
            }

            console.error('Get Project Interface Error: ' + oldApis.errcode + ' - ' + oldApis.errmsg);
            return _context.abrupt('return');

          case 12:
            apiList = getDocApis();
            changeApiCount = 0;
            updateFailedCount = 0;
            i = 0;

          case 16:
            if (!(i < apiList.length)) {
              _context.next = 57;
              break;
            }

            api = apiList[i];
            key = api.method + '@' + api.path;

            console.log('Start_To Update Interface: ' + key);

            catInfo = oldApis.catDict[api.category];

            if (catInfo) {
              _context.next = 31;
              break;
            }

            _context.next = 24;
            return postYapi('/api/interface/add_cat', {
              name: api.category,
              desc: api.category,
              project_id: apiConfig.project_id
            });

          case 24:
            addCatResult = _context.sent;

            if (!(addCatResult.errcode !== 0)) {
              _context.next = 29;
              break;
            }

            console.log('Add_Cat Error: ' + api.category + ' - ' + addCatResult.errmsg);
            updateFailedCount++;
            return _context.abrupt('continue', 54);

          case 29:
            catInfo = addCatResult.data;
            oldApis.catDict[api.category] = catInfo;

          case 31:
            oldApiInfo = oldApis.apiDict[key];

            if (oldApiInfo) {
              _context.next = 41;
              break;
            }

            _context.next = 35;
            return postYapi('/api/interface/add', {
              method: api.method,
              catid: catInfo._id,
              title: api.title,
              path: api.path,
              project_id: apiConfig.project_id
            });

          case 35:
            addApiResult = _context.sent;

            if (!(addApiResult.errcode !== 0)) {
              _context.next = 40;
              break;
            }

            console.log('Add_Interface Error: ' + key + ' - ' + addApiResult.errmsg);
            updateFailedCount++;
            return _context.abrupt('continue', 54);

          case 40:
            oldApiInfo = addApiResult.data;

          case 41:

            delete api.category;
            api.catid = catInfo._id;
            api.status = oldApiInfo.status;
            api.id = oldApiInfo._id;

            //未改变跳过更新

            if (isApiChange(api, oldApiInfo, API_COMPARE_FIELD)) {
              _context.next = 48;
              break;
            }

            console.log('Interface_No Change, Skip it: ' + key);
            return _context.abrupt('continue', 54);

          case 48:
            _context.next = 50;
            return postYapi('/api/interface/up', api);

          case 50:
            upApiResult = _context.sent;

            if (upApiResult.errcode !== 0) {
              console.log('Update_Interface Error: ' + key + ' - ' + upApiResult.errmsg);
              updateFailedCount++;
            }
            console.log('Update_Interface Success: ' + key);
            changeApiCount++;

          case 54:
            i++;
            _context.next = 16;
            break;

          case 57:
            console.log('Update Interface Flish, all: ' + apiList.length + ', change: ' + changeApiCount + ', failed: ' + updateFailedCount);
            _context.next = 63;
            break;

          case 60:
            _context.prev = 60;
            _context.t0 = _context['catch'](0);

            console.log('Update Interface to Yapi Failed:', _context.t0);

          case 63:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[0, 60]]);
  }));

  return function updateApi(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var jsDoc = require('jsdoc-api');
var request = require('request-promise');
var GenerateSchema = require('generate-schema');

var apiConfig = {
  YAPI_TOKEN_FIELD: '_yapi_project_token',
  YAPI_HOST: 'http://127.0.0.1:1027'
};

var ALLOW_PARAM_TYPE = ['headers', 'params', 'query', 'body', 'cookies'];
var API_COMPARE_FIELD = [{ field: 'req_params', type: 'array', checkFields: ['name', 'example', 'desc'] }, { field: 'req_query', type: 'array', checkFields: ['name', 'example', 'desc', 'required'] }, { field: 'req_headers', type: 'array', checkFields: ['name', 'example', 'desc', 'required'] }, { field: 'req_body_form', type: 'array', checkFields: ['name', 'example', 'desc', 'required'] }, 'title', 'desc', 'method', 'path', 'res_body_type', 'res_body', 'catid'];

var _apiFiles = [];

/**
 * 判断对象是否改变了
 * @param {Object} newApi - 新接口信息
 * @param {Object} oldApi - 旧接口信息
 * @param {Object} checkConfig
 * @returns {Boolean}
 */
function isApiChange(newApi, oldApi, checkConfig) {
  for (var i = 0; i < checkConfig.length; i++) {
    var checkInfo = checkConfig[i];
    if (typeof checkInfo === 'string') {
      if (newApi[checkInfo] !== oldApi[checkInfo]) {
        return true;
      }
    } else if ((typeof checkInfo === 'undefined' ? 'undefined' : _typeof(checkInfo)) === 'object') {
      if (checkInfo.type === 'array') {
        var _newapi = newApi[checkInfo.field] || [];
        var _oldapi = oldApi[checkInfo.field] || [];
        if (_newapi.length !== _oldapi.length) {
          return true;
        }
        for (var j = 0; j < _newapi.length; j++) {
          if (isApiChange(_newapi[j], _oldapi[j], checkInfo.checkFields)) {
            return true;
          }
        }
      } else if (checkInfo.type === 'object') {
        if (isApiChange(newApi[checkInfo.field], oldApi[checkInfo.field], checkInfo.checkFields)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Post到yapi接口
 * @param {String} uri - 接口路径
 * @param {Object} body - 内容
 */
function postYapi(uri, body) {
  return request({
    method: 'POST',
    uri: '' + apiConfig.YAPI_HOST + uri,
    body: body,
    headers: {
      Cookie: apiConfig.YAPI_TOKEN_FIELD + '=' + apiConfig.token,
      'User-Agent': 'ApiDoc'
    },
    json: true
  });
}

function getAllInterface() {
  return request({
    uri: apiConfig.YAPI_HOST + '/api/interface/list_menu',
    qs: {
      project_id: apiConfig.project_id
    },
    headers: {
      Cookie: apiConfig.YAPI_TOKEN_FIELD + '=' + apiConfig.token,
      'User-Agent': 'ApiDoc'
    },
    json: true
  }).then(function (data) {
    if (data.errcode !== 0) {
      return data;
    }
    var catDict = {};
    var apiDict = {};
    data.data.forEach(function (catItem) {
      if (!{}.hasOwnProperty.call(catDict, catItem.name)) {
        catDict[catItem.name] = {
          _id: catItem._id,
          name: catItem.name,
          project_id: catItem.project_id,
          desc: catItem.desc,
          uid: catItem.uid
        };
      }
      catItem.list.forEach(function (apiItem) {
        var key = apiItem.method + '@' + apiItem.path;
        apiDict[key] = apiItem;
      });
    });

    console.log('Get_Old_Interface Info Success.');
    return {
      errcode: 0,
      errmsg: data.errmsg,
      catDict: catDict,
      apiDict: apiDict
    };
  }).catch(function (err) {
    console.log('error:', err);
    return {
      errcode: 1001,
      errmsg: 'getMenuList Error: ' + err.message
    };
  });
}

function convertParamInfo(param) {
  var nameParts = param.name.split('.');
  //参数名错误
  if (nameParts.length !== 3 || ALLOW_PARAM_TYPE.indexOf(nameParts[1]) === -1) {
    return { rightParam: false };
  }

  var descParts = param.description.split(/[\||\n]/).map(function (x) {
    return x.trim();
  });
  var example = {}.hasOwnProperty.call(param, 'defaultvalue') ? param.defaultvalue.toString() : '';

  //挑出desc中的示例并将示例从desc中移除
  descParts = descParts.filter(function (x) {
    if (x.indexOf('exp:') === 0) {
      example = x.slice('4');
      return false;
    }
    return true;
  });

  //添加默认值说明到desc
  if ({}.hasOwnProperty.call(param, 'defaultvalue')) {
    descParts.splice(1, 0, 'defaultValue: ' + param.defaultvalue);
  }

  //添加参数类型到desc
  if ({}.hasOwnProperty.call(param, 'type') && {}.hasOwnProperty.call(param.type, 'names')) {
    descParts.splice(1, 0, 'type:' + param.type.names.join(','));
  }

  var result = {
    rightParam: true,
    paramType: nameParts[1],
    paramInfo: {
      name: nameParts[2],
      example: example,
      desc: descParts.join(' | ')
    }
  };

  //URL path参数没有required属性
  if (result.paramType !== 'params') {
    result.paramInfo.required = param.optional === true ? '0' : '1';
  }
  return result;
}

function convertDoclet(doclet) {
  var apiObj = {
    category: '公共分类',
    method: 'GET',
    req_params: [],
    req_query: [],
    req_headers: [],
    req_body_form: [],
    title: doclet.name,
    res_body_type: 'json',
    res_body: '',
    switch_notice: false
    //message      : '',
    //desc         : ''
  };
  var descLines = ['author: ' + (doclet.author && doclet.author.join(','))];
  if (doclet.description) {
    descLines = descLines.concat(doclet.description.split('\n'));
    apiObj.desc = descLines.join('<br/>');
  }
  if (doclet.tags instanceof Array) {
    //处理自定义tag
    doclet.tags.forEach(function (tag) {
      switch (tag.title) {
        case 'category':
          apiObj.category = tag.value;
          break;
        case 'httpverbs':
          apiObj.method = tag.value;
          break;
        case 'path':
          apiObj.path = tag.value;
          break;
        default:
          console.log('Unkown_Tag: ' + tag.title + ' - ' + tag.value);
      }
    });
  }

  if (doclet.params instanceof Array) {
    //处理params
    doclet.params.forEach(function (paramItem) {
      var param = convertParamInfo(paramItem);
      if (param.rightParam) {
        switch (param.paramType) {
          case 'params':
            apiObj.req_params.push(param.paramInfo);
            break;
          case 'query':
            apiObj.req_query.push(param.paramInfo);
            break;
          case 'headers':
            apiObj.req_query.push(param.paramInfo);
            break;
          case 'body':
            apiObj.req_query.push(param.paramInfo);
            break;
          default:
            console.log('Unkown_Param: ' + paramItem.name + ' = ' + paramItem.description);
        }
      }
    });
  }

  if (doclet.returns instanceof Array && doclet.returns.length > 0) {
    var returnInfo = doclet.returns[0];
    apiObj.res_body_type = returnInfo.type && returnInfo.type.names[0].toLowerCase() === 'raw' ? 'raw' : 'json';
    apiObj.res_body = returnInfo.description;
    if (returnInfo.type && returnInfo.type.names[0].toLowerCase() === 'jsonschema') {
      var schema = GenerateSchema.json(JSON.parse(returnInfo.description));
      apiObj.res_body = JSON.stringify(schema);
    } else {
      apiObj.res_body = returnInfo.description;
    }
  }
  return apiObj;
}

function getDocApis() {
  var result = jsDoc.explainSync({
    files: _apiFiles
  });
  result = result.filter(function (doclet) {
    return doclet.tags && doclet.tags.some(function (tag) {
      return tag.title === 'path';
    });
  }).map(convertDoclet).filter(function (api) {
    return api.method && api.path;
  });
  console.log('Get_DocInfo Success.');
  return result;
}

module.exports = updateApi;