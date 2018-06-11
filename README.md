## Api接口信息自动提交工具

### Sample

#### 安装
直接将apidoc放到node_modules目录下

#### 获取 项目ID 和 更新token
打开项目配置页: http://yapi.host/project/1/setting

#### 在package.json 配置 apiConfig,scripts

```json
{
  "scripts":{
    "apidoc": "apidoc test/**/*.js controller/**/*.js"
  },
  "apiConfig": {
    "project_id": 1,
    "token": "token"
  }
}
```

scripts.apidoc 配置格式为：apidoc path1 [path2] [pathn...]

##### 将apidoc.cmd文件放在需要使用apidoc项目的node_modules/.bin文件夹下


#### 使用
```bash
  $ npm run apidoc
```

#### Api接口注释规则

示例：
```javascript
/**
* 获取新闻列表
* 
* @name 获取新闻列表
* @category 公共分类
* @httpverbs GET
* @path /userlist
* @author laoyi
* 
* @param {Object} req - request
* @param {Number} req.query.type - 新闻类别
* @param {Number} [req.query.page=1] - 页码
* @param {Number} [req.query.size=20] - 每页数量
* 
* @param {Object} res -response
* @param {Function} next - next Handle Function
* 
* @returns {json}
* {
*   "code": 0,
*   "message":"获取成功",
*   "data":{
*     "total": 100,
*     "list":[{
*       "id": 1,
*       "title": "新闻标题",
*       "date": "日期"
*       }]
*   }
* }
*/
function getNewsList(req, res, next) {
  ...
}

```

1. @description 内容，可以多行，与其他内容保留一行间隔
2. @name 接口名称
3. @category 接口分类，默认为 `公共分类`；非JSDoc标准标签
4. @httpvers HTTP Method
        * 支持 GET,POST,PUT,DELETE,OPTIONS,HEAD
        * 非JSDoc标准标签，因@method等同于@name，所以采用此标签
5. @path HTTP path; 非JSDoc标准标签
6. @author 作者
7. @param 参数
    * 请求参数必须按  `@param {类型} 参数名 - 描述` 格式注释
    * 类型支持 Number, String, Boolean, Object, Array, Function
    * HTTP 参数名称结构 `req.[position].[key]`
        - req.params.[key]           表明参数在url的path中
        - req.query.[key]            表明参数在url的query字符串中
        - req.body.[key]             表明参数在body中
        - req.cookies.[key]          表明参数在cookies中
        - req.headers.[key]          表明参数在headers中
        - req.query.ctype=native      表明query参数ctype有默认值native
        - [req.quer.keyword]        表明query参数keyword可选
        - [req.query.page=1]        表明query参数page可选且有默认值1
    * 参数描述包含多荐信息用 竖线 '|' 隔开；描述过长支持换行
    * 参数描述中建议包含示例，表达式 exp:示例值，例如：exp:sw
    * 参数如果为枚举值用 `key:含义,key2:含义2` 格式说明
    * 详细说明参考：<span style="color:#0A0AFF;">http://www.css88.com/doc/jsdoc/tags-param.html</span>
7. @returns 接口返回内容
    * 注释格式 `@returns {type} 描述`, 描述部分另起一行
    * {type} 可以为 Json，Raw；Json表示 Content-Type=application/json; Raw暂不支持
    * 如果是文件下载或者其他返回内容需在@description说明；非JSDoc标准标签
    * 基于mockjs 和 json5，使用注释方式写参数说明
    

### Test
`npm run test`