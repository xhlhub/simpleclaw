【浏览器操作】

- 使用 Playwright MCP 提供的工具进行网页交互
- 先用 browser_navigate 打开目标网页
- 用 browser_snapshot 获取页面结构和可交互元素
- 根据 snapshot 返回的 ref 来进行 browser_click、browser_type 等操作
- 可以用 browser_screenshot 截图返回给用户
- 操作完成后用 browser_close 关闭浏览器
