/**
 * 获取新闻列表
 *
 * @name 获取新闻列表
 * @category 公共分类
 * @httpverbs GET
 * @path /newslist
 * @author laoyi
 *
 * @param {Object} req - request
 * @param {Number} req.query.type - 新闻类别
 * @param {Number} [req.query.page=1] - 页索引
 * @param {Number} [req.query.size=20] - 每页数量
 * @param {Object} res -response
 * @param {Function} next - next Handle Function
 *
 * @returns {raw}
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

}