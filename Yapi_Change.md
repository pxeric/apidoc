### Yapi安装说明（使用版本：1.3.16）

一、执行 yapi server 启动可视化部署程序，输入相应的配置和点击开始部署，就能完成整个网站的部署。部署完成之后，可按照提示信息，执行 node/{网站路径/server/app.js} 启动服务器。在浏览器打开指定url, 点击登录输入您刚才设置的管理员邮箱，默认密码(ymfe.org) 登录系统（默认密码可在个人中心修改）。

```bash
npm install -g yapi-cli --registry https://registry.npm.taobao.org
yapi server
```



二、修改以下代码

#####1、server/models/project.js

1.1、projectModel增加属性update_token: String，位置在getSchema()中，可增加在color:String的下方

1.2、增加方法：

```javascript
findByUpdateToken(token) {
    return this.model.findOne({
        update_token: token
    });
}
```

1.3、getBaseInfo(id, select)方法替换为如下代码：

```javascript
getBaseInfo(id, needToken) {
    let fileds = '_id uid name basepath switch_notice desc group_id project_type env icon color add_time up_time pre_script after_script';
    if(needToken === true){
        fileds += ' update_token';
    }
    return this.model.findOne({
        _id: id
    }).select(fileds)
        .exec()
}
```



#####2、server/controllers/base.js

2.1、async checkLogin(ctx)方法替换如下代码：

```javascript
async checkLogin(ctx) {
    let token = ctx.cookies.get('_yapi_token');
    let uid = ctx.cookies.get('_yapi_uid');
    let project_token = ctx.cookies.get('_yapi_project_token');
    try {
        if (token && uid) {
            let userInst = yapi.getInst(userModel); //创建user实体
            let result = await userInst.findById(uid);
            let decoded = jwt.verify(token, result.passsalt);

            if (decoded.uid == uid) {
                this.$uid = uid;
                this.$auth = true;
                this.$user = result;
                return true;
            }
        } else if (project_token && project_token.length > 5) {
            let projectInst = yapi.getInst(projectModel);
            let projectObj = await projectInst.findByUpdateToken(project_token);
            //console.log(`project_obj: ${projectObj}，project_token：${project_token}`);
            if (projectObj) {
                let userInst = yapi.getInst(userModel);
                let result = await userInst.findByEmail(yapi.WEBCONFIG.tokenEditor);
                console.log(`project_token: ${project_token}, ${projectObj._id}, ${projectObj.name}`);
                if (result) {
                    this.$uid = result._id;
                    this.$auth = false;
                    this.$user = result;
                    this.$project = projectObj;
                    return true;
                }
            }
        }
        return false;
    } catch(e){
        return false;
    }
}
```



2.2、async checkAuth(id, type, action)方法的开头处增加如下代码

```javascript
//token 所属项目和验证项目一致
if(this.$project && this.$project._id === id){
    return true;
}
```



##### 3、server/controllers/project.js

3.1、创建项目时随机生成token，在color: params.color下方增加 update_token: yapi.commons.randStr(),

3.2、async get(ctx)方法替换为以下代码

```javascript
async get(ctx) {
    let params = ctx.params;
    let result = await this.Model.getBaseInfo(params.id, true);

    if (!result) {
        return (ctx.body = yapi.commons.resReturn(null, 400, '不存在的项目'));
    }
    if (result.project_type === 'private') {
        if ((await this.checkAuth(result._id, 'project', 'view')) !== true) {
            return (ctx.body = yapi.commons.resReturn(null, 406, '没有权限'));
        }
    }
    result = result.toObject();
    if(await this.checkAuth(result._id, 'project', 'danger')!==true){
        result.update_token ='';
    }
    let catInst = yapi.getInst(interfaceCatModel);
    let cat = await catInst.list(params.id);
    result.cat = cat;
    if (result.env.length === 0) {
        result.env.push({ name: 'local', domain: 'http://127.0.0.1' });
    }
    result.role = await this.getProjectRole(params.id, 'project');

    yapi.emitHook('project_add', params.id).then();
    ctx.body = yapi.commons.resReturn(result);
}
```



##### 4、server/utils/commons.js

```javascript
if (inst.$auth === true) 
修改为
if (inst.$auth === true || (inst.$project && path.indexOf('/interface') === 0))
```



##### 5、config.json增加tokenEditor节点

5.1、config.json修改相关配置，并且增加tokenEditor节点，如："tokenEditor":  "sysuser"

5.2、mongodb中的user表增加tokenuser用户，其他属性可复制其他用户的



##### 6、client/containers/Project/Setting/ProjectMessage/ProjectMessage.js增加如下代码

可添加在const selectDisabled = projectMsg.role === 'owner' || projectMsg.role === 'admin';的上方

```html
    let token = '';
    if (projectMsg.update_token) {
    	token = (<FormItem
    	{...formItemLayout}
    	label="update_token"
    	>
          <span>{projectMsg.update_token}</span>
    	</FormItem>);
    }
```

在项目名称标签的下方增加代码

```html
{token}
```



三、npm install ykit -g 安装ykit，然后使用ykit p -m 编译项目



四、node server/app.js //启动服务器后，请访问 127.0.0.1:{config.json配置的端口}，初次运行会有个编译的过程，请耐心等候



五、浏览器打开 127.0.0.1:{config.json配置的端口}并进入管理后台，默认登录帐号：admin@admin.com 密码：ymfe.org，然后添加项目，可进入项目的设置界面查看到update_token是多少，然后在相应项目中添加配置，如：

```json
"apiConfig": {
    "project_id": 1,
    "token": "xxxxxx",
    "host": "http://127.0.0.1:3000"
  },
```

