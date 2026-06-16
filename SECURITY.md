安全指引（简短）

- 切勿将长期有效的 API Key、私钥或凭证存放在客户端代码、静态页面或 localStorage 中。
- 推荐做法：在服务端托管密钥，提供受控的代理接口或短期会话令牌（OAuth、短期签名）。
- 若必须在客户端使用临时 key：使用短寿命、一次性或在页面刷新后清除，并在服务端限制权限与来源。
- 在提交代码前使用 secrets 扫描（grep/预提交钩子）并将敏感日志加入 .gitignore。

项目说明：
- 本仓库中部分文件（src/aifs/static/nodes.js，garden-sandbox、heritage-walk 的设置页面）会引导用户输入 API Key。请改用后端代理或在 README 中说明如何安全保管与使用。
