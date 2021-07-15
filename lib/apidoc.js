'use strict';

const jsDoc          = require('jsdoc-api');
const request        = require('request-promise');
const GenerateSchema = require('generate-schema');

let apiConfig = {
  token_field: '_yapi_project_token',
  host       : 'http://127.0.0.1:1027'
};

const ALLOW_PARAM_TYPE  = ['headers', 'params', 'query', 'body', 'cookies'];
const API_COMPARE_FIELD = [
  {field: 'req_params', type: 'array', checkFields: ['name', 'example', 'desc']},
  {field: 'req_query', type: 'array', checkFields: ['name', 'example', 'desc', 'required']},
  {field: 'req_headers', type: 'array', checkFields: ['name', 'example', 'desc', 'required']},
  {field: 'req_body_form', type: 'array', checkFields: ['name', 'example', 'desc', 'required']},
  'title', 'desc', 'method', 'path', 'res_body_type', 'res_body', 'catid'
];

let _apiFiles = [];

/**
 * 判断对象是否改变了
 * @param {Object} newApi - 新接口信息
 * @param {Object} oldApi - 旧接口信息
 * @param {Object} checkConfig
 * @returns {Boolean}
 */
function isApiChange(newApi, oldApi, checkConfig) {
  for (let i = 0; i < checkConfig.length; i++) {
    const checkInfo = checkConfig[i];
    if (typeof checkInfo === 'string') {
      if (newApi[checkInfo] !== oldApi[checkInfo]) {
        return true;
      }
    } else if (typeof checkInfo === 'object') {
      if (checkInfo.type === 'array') {
        if (newApi[checkInfo.field].length !== oldApi[checkInfo.field].length) {
          return true;
        }
        for (let j = 0; j < newApi[checkInfo.field].length; j++) {
          if (isApiChange(newApi[checkInfo.field][j], oldApi[checkInfo.field][j], checkInfo.checkFields)) {
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
    method : 'POST',
    uri    : `${apiConfig.host}${uri}`,
    body,
    headers: {
      Cookie      : `${apiConfig.token_field}=${apiConfig.token}`,
      'User-Agent': 'ApiDoc'
    },
    json   : true
  });
}

function getAllInterface() {
  return request({
    uri    : `${apiConfig.host}/api/interface/list_menu`,
    qs     : {
      project_id: apiConfig.project_id
    },
    headers: {
      Cookie      : `${apiConfig.token_field}=${apiConfig.token}`,
      'User-Agent': 'ApiDoc'
    },
    json   : true
  }).then((data) => {
    if (data.errcode !== 0) {
      return data;
    }
    const catDict = {};
    const apiDict = {};
    data.data.forEach((catItem) => {
      if (!{}.hasOwnProperty.call(catDict, catItem.name)) {
        catDict[catItem.name] = {
          _id       : catItem._id,
          name      : catItem.name,
          project_id: catItem.project_id,
          desc      : catItem.desc,
          uid       : catItem.uid
        };
      }
      catItem.list.forEach((apiItem) => {
        const key    = `${apiItem.method}@${apiItem.path}`;
        apiDict[key] = apiItem;
      })
    });

    console.log('Get_Old_Interface Info Success.');
    return {
      errcode: 0,
      errmsg : data.errmsg,
      catDict,
      apiDict
    };
  }).catch((err) => {
    console.log('error:', err);
    return {
      errcode: 1001,
      errmsg : `getMenuList Error: ${err.message}`
    }
  })
}

function convertParamInfo(param) {
  const nameParts = param.name.split('.');
  //参数名错误
  if (nameParts.length !== 3 || ALLOW_PARAM_TYPE.indexOf(nameParts[1]) === -1) {
    return {rightParam: false};
  }

  let descParts  = param.description.split(/[\||\n]/).map(x => x.trim());
  let example    = {}.hasOwnProperty.call(param, 'defaultvalue') ? param.defaultvalue.toString() : '';
  let val        = example;
  let param_type = 'text';

  //挑出desc中的示例并将示例从desc中移除
  descParts = descParts.filter((x) => {
    if (x.indexOf('exp:') === 0) {
      example = x.slice('4');
      return false;
    }
    return true;
  });

  //挑出desc中的value并将示例从value中移除
  descParts = descParts.filter((x) => {
    if (x.indexOf('value:') === 0) {
      val = x.slice('6');
      return false;
    }
    return true;
  });

  //添加默认值说明到desc
  if ({}.hasOwnProperty.call(param, 'defaultvalue')) {
    descParts.splice(1, 0, `defaultValue: ${param.defaultvalue}`);
  }

  //添加参数类型到desc
  if ({}.hasOwnProperty.call(param, 'type') && {}.hasOwnProperty.call(param.type, 'names')) {
    let _type = param.type.names.join(',');
    if (_type.toUpperCase() === 'FILE') {
      param_type = 'file';
    }
    descParts.splice(1, 0, `type:${_type}`);
  }

  const result = {
    rightParam: true,
    paramType : nameParts[1],
    paramInfo : {
      name : nameParts[2],
      example,
      desc : descParts.join(' | '),
      value: val,
      type : param_type
    }
  };

  //URL path参数没有required属性
  if (result.paramType !== 'params') {
    result.paramInfo.required = param.optional === true ? '0' : '1';
  }
  return result;
}

function convertDoclet(doclet) {
  const apiObj  = {
    category     : '公共分类',
    method       : 'GET',
    req_params   : [],
    req_query    : [],
    req_headers  : [],
    req_body_form: [],
    title        : doclet.name,
    res_body_type: 'json',
    res_body     : '',
    switch_notice: false,
    message      : ' ',
    desc         : ''
  };
  let descLines = [`author: ${doclet.author && doclet.author.join(',')}`];
  if (doclet.description) {
    descLines   = descLines.concat(doclet.description.split('\n'));
    apiObj.desc = descLines.join('<br/>');
  }
  if (doclet.tags instanceof Array) {
    //处理自定义tag
    doclet.tags.forEach((tag) => {
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
          console.log(`Unkown Tag: ${tag.title} - ${tag.value}`);
      }
    });
  }

  let hasFile = false;
  if (doclet.params instanceof Array) {
    //处理params
    doclet.params.forEach((paramItem) => {
      const param = convertParamInfo(paramItem);
      if (param.rightParam) {
        switch (param.paramType) {
          case 'params':
            apiObj.req_params.push(param.paramInfo);
            break;
          case 'query':
            apiObj.req_query.push(param.paramInfo);
            break;
          case 'headers':
            apiObj.req_headers.push(param.paramInfo);
            break;
          case 'body':
            apiObj.req_body_form.push(param.paramInfo);
            if (!hasFile)
              hasFile = param.paramInfo.type.toUpperCase() === 'FILE';
            break;
          default:
            console.log(`Unkown Param: ${paramItem.name} = ${paramItem.description}`);
        }
      }
    });
  }

  if (doclet.returns instanceof Array && doclet.returns.length > 0) {
    const returnInfo     = doclet.returns[0];
    apiObj.res_body_type = (returnInfo.type && returnInfo.type.names[0].toLowerCase() === 'raw') ? 'raw' : 'json';
    apiObj.res_body      = returnInfo.description;
    if (returnInfo.type && returnInfo.type.names[0].toLowerCase() === 'jsonschema') {
      let schema      = GenerateSchema.json(JSON.parse(returnInfo.description));
      apiObj.res_body = JSON.stringify(schema);
    } else {
      apiObj.res_body = returnInfo.description;
      apiObj.res_body_is_json_schema = false;
    }
  }

  if (apiObj.method.toUpperCase() === 'POST' || apiObj.req_body_form.length > 0) {
    apiObj.req_body_type = 'form';
    apiObj.req_headers.push({
      name    : 'Content-Type',
      desc    : '编码类型',
      value   : hasFile ? 'multipart/form-data' : 'application/x-www-form-urlencoded',
      required: '1'
    });
  }
  return apiObj;
}

function getDocApis() {
  let result = jsDoc.explainSync({
    files: _apiFiles
  });
  result     = result.filter((doclet) => {
    return doclet.tags && doclet.tags.some((tag) => {
      return tag.title === 'path';
    });
  }).map(convertDoclet).filter(api => api.method && api.path);
  console.log('Get DocInfo Success.');
  return result;
}

/**
 * 更新API文档到Yapi
 * @param {Array} files -扫描数组
 * @param {Object} apiConf - apiConfig
 */
async function updateApi(files, apiConf) {
  try {
    if (!apiConf.project_id || !apiConf.token) {
      console.error('must set project_id & token');
      return;
    }
    _apiFiles     = files;
    apiConfig     = Object.assign(apiConfig, apiConf);
    const oldApis = await getAllInterface();
    if (oldApis.errcode !== 0) {
      console.error(`Get Project Interface Error: ${oldApis.errcode} - ${oldApis.errmsg}`);
      return;
    }
    const apiList         = getDocApis();
    let changeApiCount    = 0;
    let updateFailedCount = 0;
    for (let i = 0; i < apiList.length; i++) {
      const api = apiList[i];
      const key = `${api.method}@${api.path}`;
      //console.log(`Start To Update Interface: ${key}`);

      let catInfo = oldApis.catDict[api.category];
      if (!catInfo) {
        //创建分类
        const addCatResult = await postYapi('/api/interface/add_cat', {
          name      : api.category,
          desc      : api.category,
          project_id: apiConfig.project_id
        });
        if (addCatResult.errcode !== 0) {
          console.log(`Add Cat Error: ${api.category} - ${addCatResult.errmsg}`);
          updateFailedCount++;
          continue;
        }
        catInfo                       = addCatResult.data;
        oldApis.catDict[api.category] = catInfo;
      }

      let oldApiInfo = oldApis.apiDict[key];
      if (!oldApiInfo) {
        //新建接口
        const addApiResult = await postYapi('/api/interface/add', {
          method    : api.method,
          catid     : catInfo._id,
          title     : api.title,
          path      : api.path,
          project_id: apiConfig.project_id
        });
        if (addApiResult.errcode !== 0) {
          console.log(`Add Interface Error: ${key} - ${addApiResult.errmsg}`);
          updateFailedCount++;
          continue;
        }
        oldApiInfo = addApiResult.data;
      }

      delete api.category;
      api.catid  = catInfo._id;
      api.status = oldApiInfo.status;
      api.id     = oldApiInfo._id;

      //未改变跳过更新
      if (!isApiChange(api, oldApiInfo, API_COMPARE_FIELD)) {
        console.log(`Interface No Change, Skip it: ${key}`);
        continue;
      }

      const upApiResult = await postYapi('/api/interface/up', api);
      if (upApiResult.errcode !== 0) {
        console.log(`Update Interface Error: ${key} - ${upApiResult.errmsg}`);
        updateFailedCount++;
      }
      console.log(`Update Interface Success: ${key}`);
      changeApiCount++;
    }
    console.log(`Update Interface Flish, all: ${apiList.length}, success: ${changeApiCount}, failed: ${updateFailedCount}`);
  } catch (err) {
    console.log('Update Interface to Yapi Failed:', err);
  }
}

module.exports = updateApi;
