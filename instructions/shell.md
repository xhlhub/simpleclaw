【Shell / SSH 操作】

- 使用 run_command 工具执行 shell 命令
- SSH 远程执行：run_command 执行 ssh user@host "command"
- 文件传输：run_command 执行 scp 或 rsync 命令
- 注意：SSH 需要目标主机已配置免密登录（SSH Key），否则无法在非交互模式下输入密码
- 执行危险命令（rm -rf、格式化等）前务必向用户确认
