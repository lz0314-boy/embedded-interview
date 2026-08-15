/* Linux + I.MX6ULL 专项路线：理论、板端实验、验收产物和面试表达。 */
const DATA_LINUX_LAB = [
  {
    id: "linux-imx6ull-lab",
    name: "Linux + I.MX6ULL 实战",
    icon: "terminal",
    track: "foundation",
    desc: "以正点原子阿尔法 V2.4 为实验平台，从串口、Shell、系统编程走到 U-Boot、设备树、字符设备和应用服务。",
    pace: "完整路线 6 周，每周 10～12 小时；时间紧时先执行 14 天面试冲刺。",
    sprint: "14 天冲刺：板卡上手、进程线程、Socket/epoll、启动链、字符驱动和一次故障定位。",
    plan: [
      { phase: "P0", title: "环境与保命", duration: "2 天", deliverable: "串口登录、网络互通、备份启动参数，能交叉编译并运行 hello。", firstQuestion: "imx-board-baseline" },
      { phase: "P1", title: "Linux 基础与系统调用", duration: "6 天", deliverable: "熟悉文件/进程/权限/内存，完成可靠的文件 I/O 和进程管理程序。", firstQuestion: "imx-shell-filesystem" },
      { phase: "P2", title: "并发、IPC、网络与调试", duration: "6 天", deliverable: "完成 pthread + eventfd + epoll TCP 小服务，并用 strace/gdb 定位问题。", firstQuestion: "imx-process-exec" },
      { phase: "P3", title: "启动链与构建系统", duration: "6 天", deliverable: "画出 ROM→U-Boot→Kernel→DTB→rootfs，能用 TFTP/NFS 做一次迭代。", firstQuestion: "imx-boot-chain" },
      { phase: "P4", title: "驱动开发闭环", duration: "10 天", deliverable: "完成模块、字符设备、platform/设备树、GPIO/IRQ/poll 和 I2C 实验。", firstQuestion: "imx-module" },
      { phase: "P5", title: "综合项目与面试", duration: "10 天", deliverable: "完成板端监控服务，留下代码、日志、测试表和 3 分钟讲解。", firstQuestion: "imx-app-service" }
    ],
    questions: [
      {
        id: "imx-plan", priority: "must", difficulty: "base", tags: ["学习路线", "6周", "14天冲刺"],
        q: "Linux 基础薄弱，如何用 I.MX6ULL 制定一条面向驱动和应用岗位的学习路线？",
        brief: "先建立可恢复的板端环境，再按系统调用、并发网络、启动构建、驱动框架和综合项目递进；每周留下可运行产物和故障记录。",
        a: `<p><strong>完整路线：</strong>P0 环境与保命（2 天）→ P1 Shell/C/系统调用（6 天）→ P2 进程线程、IPC、Socket、调试（6 天）→ P3 U-Boot、Kernel、设备树、rootfs（6 天）→ P4 字符设备、platform、GPIO/IRQ、I2C（10 天）→ P5 综合项目和面试（10 天）。每天固定“30 分钟理论 + 60 分钟板端实验 + 30 分钟记录”，周末做一次从编译到上板的完整回归。</p><p><strong>14 天冲刺：</strong>第 1～2 天串口/网络/交叉编译；第 3～4 天文件、进程、信号；第 5～6 天 pthread、pipe、eventfd；第 7～8 天 TCP/epoll/strace；第 9～10 天启动链、TFTP/NFS；第 11～12 天字符设备和 copy_to_user；第 13 天 GPIO/IRQ/poll；第 14 天完成一个小服务并录制 3 分钟讲解。</p><p>每个实验固定记录：目标、命令/代码、串口或日志证据、失败现象、根因、修复和复现步骤。面试官问“怎么调试”时，直接沿这张记录展开。</p>`,
        followups: [{ q: "为什么不先背内核八股？", a: "驱动和应用岗位都要求把概念落到进程、fd、设备节点、dmesg 和代码；先做最小实验，再把其中的概念整理成八股，记忆更稳。" }, { q: "每天只有两小时怎么办？", a: "保留理论 20 分钟、实验 70 分钟、记录 30 分钟；优先完成字符设备 + epoll 小项目，其他内容按闪卡补齐。" }],
        evidence: "每周 Git 提交、串口日志、实验 README、故障复盘表和最终演示视频",
        boundary: "路线给出目标实现，不替代对具体 BSP、芯片手册和板卡版本的核对。",
        caution: "涉及 eMMC/SD 写入前先备份启动参数和原镜像，优先使用 TFTP/NFS 做迭代。"
      },
      {
        id: "imx-board-baseline", priority: "must", difficulty: "base", tags: ["I.MX6ULL", "串口", "板卡上手"],
        q: "第一次拿到正点原子阿尔法 V2.4，如何完成板卡基线？",
        brief: "先确认供电、串口、启动介质和网络，再记录硬件/BSP/内核版本；任何刷写动作前保留可恢复路径。",
        a: `<ol><li>按手册确认供电、拨码/启动介质、USB-TTL 电平和串口线序；终端先尝试配套资料给出的波特率，若无输出先查电源和 TX/RX/GND，不直接刷系统。</li><li>登录后记录 <code>cat /proc/cpuinfo</code>、<code>uname -a</code>、<code>cat /proc/cmdline</code>、<code>mount</code>、<code>ip addr</code> 和 <code>dmesg | head -80</code>，保存到 baseline 目录。</li><li>配置网络后由 PC 和板卡双向 ping，用 <code>ip -s link</code> 记录链路错误和丢包。</li><li>在 U-Boot 中保存 <code>printenv</code> 输出，确认当前启动介质、kernel/DTB/rootfs 路径后再做实验。</li></ol><p>验收不是“能进 Linux”，而是能从串口日志指出每个启动阶段和版本。</p>`,
        followups: [{ q: "串口没有输出怎么排查？", a: "按供电、拨码、串口电平、线序、终端参数、启动介质顺序排查；用示波器/逻辑分析仪确认 TX 是否有波形。" }, { q: "为什么不先刷最新镜像？", a: "先建立可恢复基线，避免把硬件、BSP 和操作问题混在一起；新 U-Boot、DTB 和分区表可能改变启动路径。" }],
        evidence: "baseline 命令输出、串口启动日志、板卡照片、BSP/内核 Git 版本和备份",
        boundary: "阿尔法 V2.4 的存储、引脚和 BSP 版本以手头实物与配套资料为准。",
        caution: "未确认目标设备时不要执行 dd、flash_erase 或 U-Boot 擦写。"
      },
      {
        id: "imx-cross-compile", priority: "must", difficulty: "base", tags: ["交叉编译", "工具链", "应用"],
        q: "I.MX6ULL 的交叉编译环境如何搭建和验证？",
        brief: "区分 host、target、交叉工具链和 sysroot；先编译静态 hello，再动态链接并确认目标端库和 ABI。",
        a: `<p>先按 BSP 确认工具链前缀，不凭教程猜。编译后用 <code>file hello</code> 和 <code>readelf -h hello</code> 确认是 ARM 32-bit，再检查动态解释器和 ABI。静态程序先排除动态库问题；动态程序再用 <code>readelf -d</code>、目标端库目录和 sysroot 排查。</p><pre><code>arm-linux-gnueabihf-gcc -O2 -Wall hello.c -o hello\narm-linux-gnueabihf-gcc -static hello.c -o hello-static\nfile hello\nreadelf -h hello\nscp hello root@BOARD_IP:/tmp/</code></pre><p>项目中记录工具链版本、编译参数和依赖库，使环境可复现。</p>`,
        followups: [{ q: "host 程序为什么不能在板上运行？", a: "架构、ABI、动态链接器或 libc 版本可能不匹配；用 file/readelf 检查，不只看文件名。" }, { q: "sysroot 有什么作用？", a: "提供目标系统的头文件、库和动态链接器，让编译器按 target ABI 解析依赖。" }],
        evidence: "工具链版本、Makefile、readelf/file 输出和目标端日志",
        boundary: "工具链前缀以当前 BSP SDK 为准，换 rootfs 后重新核对 ABI。",
        caution: "内核模块还必须匹配内核源码、配置和 vermagic。"
      },
      {
        id: "imx-shell-filesystem", priority: "must", difficulty: "base", tags: ["Shell", "文件系统", "权限"],
        q: "Linux 应用岗位必须熟悉哪些文件系统、权限和排查命令？",
        brief: "把一切皆文件落到普通文件、设备节点、proc/sysfs、标准输入输出、挂载和权限模型上。",
        a: `<p>掌握 <code>/bin /sbin /etc /dev /proc /sys /tmp /var</code> 的用途；用 <code>findmnt</code> 看挂载，<code>df -h</code> 看文件系统空间，<code>du -xhd1</code> 找目录占用，<code>ls -l/stat</code> 看权限、inode、时间和链接。权限要说清 UID/GID、rwx、umask、chmod/chown 和设备节点主次设备号。</p><p>板端实验：创建非 root 用户，让它只能写自己的日志目录；再观察串口、GPIO 或 I2C 设备节点权限，解释应用应使用组权限和 udev/mdev 规则，而不是长期用 root 掩盖问题。</p>`,
        followups: [{ q: "df 和 du 不一致怎么查？", a: "先查已删除但仍被进程持有的文件，使用 <code>lsof | grep deleted</code>；再检查挂载点、overlayfs 和 inode。" }, { q: "为什么 /proc 和 /sys 不是普通文件？", a: "它们是内核导出的伪文件系统，读写由内核回调实现，用于观察和配置运行状态。" }],
        evidence: "命令记录、权限实验、设备节点和挂载拓扑",
        boundary: "BusyBox 命令选项可能更少，以板端 --help 和实际输出为准。",
        caution: "不要在根文件系统上随意递归删除或修改 /etc 关键配置。"
      },
      {
        id: "imx-syscall-fd", priority: "must", difficulty: "base", tags: ["系统调用", "文件描述符", "C"],
        q: "Linux 文件描述符是什么？open/read/write/close 如何用于嵌入式应用？",
        brief: "fd 是进程 fd 表中的整数索引，统一代表普通文件、设备、管道、socket、timerfd 等 I/O 对象。",
        a: `<p>open 得到 fd，内核创建或引用 file 对象，随后 read/write/ioctl/poll 映射到文件系统或驱动回调，close 释放引用。0/1/2 默认是 stdin/stdout/stderr。代码必须处理 errno、短读写、EINTR、非阻塞 EAGAIN，并设置 O_CLOEXEC 防止 exec 后泄漏。</p><pre><code>int fd = open("/dev/my_led", O_WRONLY | O_CLOEXEC);\nif (fd &lt; 0) { perror("open"); return 1; }\nchar value = '1';\nif (write(fd, &amp;value, 1) != 1) perror("write");\nif (close(fd) &lt; 0) perror("close");</code></pre>`,
        followups: [{ q: "read 为什么可能小于请求长度？", a: "管道、串口、socket 和部分设备只返回当前可用数据；应用要按协议累计，不能把一次 read 当成一帧。" }, { q: "fork 后 fd 如何变化？", a: "父子 fd 表项指向同一个 open file description，共享文件偏移和状态；close 一个 fd 不一定关闭底层对象。" }],
        evidence: "file_io.c、strace 输出和 /proc/PID/fd",
        boundary: "阻塞语义由具体文件系统或驱动决定，不能把普通文件行为套到字符设备。",
        caution: "不要忽略 close、短写、EINTR 和 O_CLOEXEC。"
      },
      {
        id: "imx-process-exec", priority: "must", difficulty: "base", tags: ["进程", "fork", "exec", "僵尸"],
        q: "fork、exec、waitpid 的关系是什么？如何避免僵尸进程？",
        brief: "fork 复制进程上下文，exec 替换当前进程映像，父进程用 waitpid 回收退出状态。",
        a: `<p>fork 返回两次：父进程拿到子 PID，子进程得到 0，页表采用写时复制。子进程关闭无关 fd 后调用 execve/execvp，exec 成功不返回。父进程必须 waitpid，否则子进程退出后留下僵尸。</p><pre><code>pid_t pid = fork();\nif (pid == 0) { execl("/bin/echo", "echo", "child", NULL); _exit(127); }\nif (pid &gt; 0) { int status; waitpid(pid, &amp;status, 0); }</code></pre><p>实验中故意不 wait，用 <code>ps -o pid,ppid,state,cmd</code> 观察 Z，再用 SIGCHLD + 非阻塞 waitpid 循环修复。</p>`,
        followups: [{ q: "子进程 exec 失败为什么用 _exit？", a: "fork 后父子可能复制 stdio 缓冲区，exit 会重复 flush；_exit 直接进入内核退出路径。" }, { q: "Supervisor 如何退避重启？", a: "回收 SIGCHLD 并记录退出原因；短时间连续崩溃时指数退避并进入 degraded，避免无限 fork。" }],
        evidence: "fork_exec.c、ps 状态、退出码和 SIGCHLD 日志",
        boundary: "多线程中 fork 还有锁状态和异步信号安全问题，复杂服务可用 posix_spawn。",
        caution: "不要在 SIGCHLD handler 里做复杂 I/O。"
      },
      {
        id: "imx-pthread", priority: "must", difficulty: "advanced", tags: ["pthread", "mutex", "条件变量"],
        q: "pthread 线程如何安全共享数据？mutex 与 condition variable 怎么配合？",
        brief: "mutex 保护共享不变量，条件变量通知状态变化；等待必须放在 while 中重新检查条件。",
        a: `<p>生产者/消费者队列由 mutex 保护，生产者入队后 signal，消费者用 pthread_cond_wait 原子释放锁并睡眠，被唤醒后重新抢锁并检查条件。必须用 while 防止虚假唤醒和多个消费者竞争。持锁期间不做阻塞 I/O。</p><pre><code>pthread_mutex_lock(&amp;lock);\nwhile (queue_empty() &amp;&amp; !stopping)\n    pthread_cond_wait(&amp;not_empty, &amp;lock);\nif (!queue_empty()) item = pop_item();\npthread_mutex_unlock(&amp;lock);</code></pre>`,
        followups: [{ q: "mutex 和 semaphore 怎么选？", a: "mutex 表示所有权和互斥；semaphore 表示资源计数或同步。保护共享结构优先 mutex。" }, { q: "怎么查死锁？", a: "统一锁顺序，给锁操作加持有者日志；gdb attach 后用 thread apply all bt 看互相等待。" }],
        evidence: "pthread 队列、线程日志和 gdb 全线程栈",
        boundary: "优先级继承和 robust mutex 必须显式配置，不能默认存在。",
        caution: "持锁做 I/O、外部回调或反向拿锁是高风险设计。"
      },
      {
        id: "imx-ipc", priority: "must", difficulty: "advanced", tags: ["IPC", "eventfd", "共享内存"],
        q: "Linux IPC 如何选择？什么时候用 pipe、eventfd、Unix socket 和共享内存？",
        brief: "pipe 传字节流，eventfd 传轻量计数/唤醒，Unix socket 传结构化进程消息，共享内存传大块数据但需要同步协议。",
        a: `<p>父子进程输出用 pipe；只通知 epoll 主循环“有工作”用 eventfd；双向、可扩展消息用 Unix domain socket；图像/大缓冲区用共享内存，但必须用 mutex、sem 或 futex 保护所有权。设计前先写清谁创建、谁写、谁读、何时释放、崩溃后如何恢复。</p><p>实验：采集线程用 eventfd 唤醒保存线程，快照放入固定缓冲并带版本、长度、CRC；强杀写线程后验证下次启动能丢弃半写记录。</p>`,
        followups: [{ q: "eventfd 和 pipe 区别？", a: "eventfd 是 64 位计数器，适合 epoll 唤醒；pipe 是有缓冲的字节流，适合传数据。" }, { q: "共享内存为什么还要锁？", a: "共享内存只提供共同可见字节，不提供写入顺序和所有权；没有同步会读到半写数据。" }],
        evidence: "IPC 拓扑、eventfd/pipe 代码和强杀恢复日志",
        boundary: "跨进程共享指针没有意义，指针只在各自地址空间中有效。",
        caution: "共享内存必须设计崩溃恢复和版本兼容。"
      },
      {
        id: "imx-epoll", priority: "must", difficulty: "advanced", tags: ["epoll", "事件循环", "应用"],
        q: "如何用 epoll 设计 I.MX6ULL 上的非阻塞应用主循环？",
        brief: "把设备、socket、timerfd、eventfd、signalfd 统一成 fd 事件；慢 I/O 交给线程或队列。",
        a: `<p>所有数据 fd 设置 O_NONBLOCK 并注册到 epoll。收到可读事件后循环 read 到 EAGAIN；timerfd 做周期统计，eventfd 消费队列，signalfd 做有序退出。水平触发易入门，但仍要 drain 避免重复唤醒。主循环只做轻量解析，SD 写入和网络阻塞任务通过有界队列下放。</p><pre><code>for (;;) {\n    int n = epoll_wait(epfd, events, MAX_EVENTS, -1);\n    for (int i = 0; i &lt; n; ++i) dispatch(events[i].data.fd);\n}</code></pre>`,
        followups: [{ q: "LT 和 ET 怎么选？", a: "LT 更易保证正确；ET 减少重复通知但必须读到 EAGAIN，并严格处理 fd 状态。" }, { q: "为什么不能在主循环写 SD？", a: "SD I/O 可能长时间阻塞，导致设备、网络和心跳事件无法及时处理。" }],
        evidence: "epoll 主循环、fd 拓扑、队列水位和 loop latency",
        boundary: "epoll 解决等待多个 fd，不等于线程池，也不保证实时性。",
        caution: "EAGAIN 是本轮读取完成，不是设备故障。"
      },
      {
        id: "imx-socket", priority: "must", difficulty: "base", tags: ["Socket", "TCP/UDP", "网络"],
        q: "I.MX6ULL 应用中 TCP/UDP 怎么选？如何处理粘包和断线？",
        brief: "TCP 是可靠字节流，应用必须定义帧边界；UDP 保留报文边界但需要序号、超时和重传策略。",
        a: `<p>设备配置、日志和固件传输通常用 TCP，实时状态广播可用 UDP。TCP 一次 recv 不等于一帧，应用要用长度前缀、固定帧或分隔符累计解析，send 也处理短写。断线后用状态机和指数退避重连，不在主循环无限阻塞 connect。</p><p>实验：PC 开 TCP server，板端每 100 ms 发带序号帧；故意断网，记录 socket 错误和重连时间。UDP 版增加序号/CRC/超时，比较丢包。</p>`,
        followups: [{ q: "网络字节序怎么处理？", a: "整数通过 htons/ntohs/htonl/ntohl 转换，结构体和浮点不要直接裸传。" }, { q: "TCP 半包如何解析？", a: "维护接收缓冲，先累计头，再按长度判断完整帧，处理异常长度和超时。" }],
        evidence: "协议文档、tcpdump、断线重连日志和序号统计",
        boundary: "TCP 可靠只覆盖传输层，不代表业务已处理或数据已落盘。",
        caution: "不要用 sleep 轮询连接，优先非阻塞 fd + epoll + timerfd。"
      },
      {
        id: "imx-debug-app", priority: "must", difficulty: "advanced", tags: ["gdb", "strace", "应用调试"],
        q: "应用在板端偶发崩溃或卡死，怎样定位？",
        brief: "保留现场后区分系统调用阻塞、内存错误、竞态和资源耗尽；gdb、strace、/proc 与日志形成证据链。",
        a: `<ol><li>崩溃：保留调试符号和 core，用 <code>gdb app core</code> 执行 bt full、info registers、thread apply all bt。</li><li>系统调用：<code>strace -ff -tt -T -o trace.log ./app</code> 看 fd、超时、权限和 EPIPE；<code>lsof -p PID</code> 查 fd 泄漏。</li><li>资源：top -H、/proc/PID/status、/proc/meminfo 看线程、RSS 和内存趋势。</li><li>卡死：gdb attach 抓全部线程栈，并对齐 dmesg、看门狗和心跳。</li></ol><p>修复后建立最小复现和次数回归，不只“再跑一次”。</p>`,
        followups: [{ q: "没有 core 怎么办？", a: "检查 ulimit、core_pattern、目录权限和 OOM/SIGKILL；再使用 gdbserver 或低扰动现场日志。" }, { q: "strace 会改变时序吗？", a: "会，尤其高频系统调用；它是定位线索，不是性能结论。" }],
        evidence: "core/gdb、strace、/proc 快照和复现脚本",
        boundary: "BusyBox 可能缺少完整工具，需要交叉部署或主机远程调试。",
        caution: "不要让 core 或 debug 日志写满根分区。"
      },
      {
        id: "imx-user-kernel", priority: "must", difficulty: "advanced", tags: ["用户态", "内核态", "系统调用"],
        q: "用户态调用 read 后如何进入内核？模式切换和进程切换是一回事吗？",
        brief: "libc 包装系统调用号和参数，通过异常指令进入内核，VFS 找到 file_operations；返回用户态不一定发生进程切换。",
        a: `<p>应用的 read 通常先进入 libc 包装，再按 ARM EABI 放置系统调用号和参数，通过 SVC 进入内核。CPU 保存用户现场、切换到特权态和内核栈，系统调用分发到 sys_read/ksys_read，经 fd 表找到 file，再进入 VFS 或驱动的 read 回调，最后把返回值和 errno 语义带回用户态。</p><p><strong>模式切换</strong>是同一任务从用户态进入内核态；<strong>上下文切换</strong>是调度器换成另一个任务，需要切换寄存器、内核栈和可能的地址空间。系统调用可能阻塞并触发调度，但二者不等价。用 strace 可观察系统调用，用 perf/ftrace 观察更深路径。</p>`,
        followups: [{ q: "为什么应用不能直接访问设备寄存器？", a: "用户态受 MMU 权限隔离，寄存器通常映射在内核地址空间；驱动负责时钟、并发、权限和生命周期。" }, { q: "系统调用一定很慢吗？", a: "有模式切换和检查成本，但是否成为瓶颈取决于频率和数据量；批量 I/O、mmap 或 io_uring 等优化必须先有测量。" }],
        evidence: "strace、/proc/PID/syscall、ftrace function_graph 和驱动 read 日志",
        boundary: "具体异常入口和 syscall 实现随 ARM ABI 与内核版本变化，面试重点是完整路径。",
        caution: "不要把 libc 函数、系统调用和驱动回调混成同一层。"
      },
      {
        id: "imx-virtual-memory", priority: "must", difficulty: "advanced", tags: ["虚拟内存", "MMU", "页表"],
        q: "I.MX6ULL 的虚拟内存、进程地址空间和页故障如何理解？",
        brief: "每个进程看到独立虚拟地址，MMU/TLB 按页表映射物理页并检查权限；缺页由内核分配、装入或发出 SIGSEGV。",
        a: `<p>进程地址空间通常包括 text、rodata、data/bss、heap、mmap 区、共享库和用户栈；相同虚拟地址在不同进程可映射到不同物理页。CPU 访问先查 TLB，未命中时走页表；映射不存在或权限不符产生 page fault，内核可按需分配、从文件装入或发送 SIGSEGV。</p><p>板端用 <code>cat /proc/PID/maps</code> 看区域，用 <code>pmap</code> 或 <code>/proc/PID/smaps</code> 看 RSS/PSS；写一个 malloc 后不触碰、逐页写入的程序，观察虚拟大小和 RSS 的差异。mmap 设备内存必须由驱动限制范围和缓存属性。</p>`,
        followups: [{ q: "malloc 100 MB 为什么 RSS 不一定立即增加？", a: "分配器先保留虚拟地址，物理页常在首次访问缺页时按需分配。" }, { q: "TLB 有什么作用？", a: "缓存虚拟页到物理页的翻译和权限，减少每次访存都走多级页表。" }],
        evidence: "/proc/PID/maps/smaps、缺页计数和 malloc/mmap 对照程序",
        boundary: "32 位 ARM 用户/内核地址划分和高端内存配置取决于内核配置。",
        caution: "虚拟地址连续不代表物理地址连续，DMA 不可直接使用普通用户指针。"
      },
      {
        id: "imx-scheduler", priority: "must", difficulty: "base", tags: ["调度", "进程状态", "上下文切换"],
        q: "Linux 进程状态、调度和上下文切换怎样联系起来？",
        brief: "R 表示运行/可运行，S/D 是可中断/不可中断睡眠，T 停止，Z 僵尸；调度器从可运行队列选择任务。",
        a: `<p>任务等待 fd、mutex 或定时器时睡眠并让出 CPU，事件到达后被唤醒进入可运行队列。R 不等于正在 CPU 上执行，也可能在排队；S 可被信号打断，D 常用于不可中断 I/O 等待，长时间 D 需要查设备/存储；Z 已退出但未被父进程 wait。</p><p>板端用 <code>ps -eLo pid,tid,psr,stat,pri,ni,comm</code>、<code>top -H</code>、<code>vmstat 1</code> 观察线程、CPU、运行队列和上下文切换。nice 影响普通调度权重，不是硬实时保证；实时策略需要权限并防止饿死系统线程。</p>`,
        followups: [{ q: "进程长期处于 D 能 kill -9 吗？", a: "信号会挂起但任务要等不可中断 I/O 返回才处理；应定位底层存储、NFS 或驱动超时。" }, { q: "线程切换一定比进程切换快吗？", a: "同进程线程通常共享地址空间，少了页表相关开销，但实际成本还受 Cache、TLB、CPU 亲和和工作集影响。" }],
        evidence: "ps/top/vmstat 记录、阻塞实验和调度 trace",
        boundary: "CFS/实时调度细节随内核版本演进，基础回答先保证状态和因果正确。",
        caution: "不要通过盲目提高优先级掩盖忙循环、锁竞争或无超时 I/O。"
      },
      {
        id: "imx-dma-cache", priority: "must", difficulty: "advanced", tags: ["DMA", "Cache一致性", "Cortex-A7"],
        q: "I.MX6ULL Cortex-A7 上 DMA 与 Cache 一致性为什么重要？驱动如何处理？",
        brief: "CPU Cache 与 DMA 设备观察的内存可能不一致；使用 Linux DMA API 获取地址并按方向完成映射/同步。",
        a: `<p>CPU 写入的数据可能只在 Cache，DMA 读内存会拿到旧值；DMA 写内存后，CPU Cache 也可能仍保留旧副本。驱动不能用 virt_to_phys 或手写 flush 代替 DMA API。小型长期描述符/缓冲可用 <code>dma_alloc_coherent</code>；流式缓冲使用 <code>dma_map_single</code>/<code>dma_unmap_single</code>，按 DMA_TO_DEVICE、DMA_FROM_DEVICE 或 BIDIRECTIONAL 指明方向；重复拥有权切换时使用 dma_sync_* API。</p><p>还要保证缓冲生命周期、长度、对齐和设备 DMA mask，映射成功后把 dma_addr_t 给设备，不把 CPU 虚拟地址写进寄存器。实验可构造 CPU 填充 → DMA 发送、DMA 接收 → CPU 校验并统计 CRC。</p>`,
        followups: [{ q: "coherent 是否表示完全没有 Cache？", a: "它表示 CPU 与设备对该 DMA 缓冲的一致性由平台/DMA 层保证，不代表所有访问都无缓存或不需要内存顺序。" }, { q: "为什么 volatile 不能解决 DMA Cache？", a: "volatile 只约束编译器访问，不能清理或失效 CPU Cache，也不建立设备所有权协议。" }],
        evidence: "DMA API 代码、缓冲 CRC、方向/长度日志和压力测试",
        boundary: "具体一致性由 SoC、总线和内核 DMA 实现决定，始终走 DMA API。",
        caution: "不要把用户态 malloc 地址或普通 kmalloc 虚拟地址直接交给 DMA 控制器。"
      },
      {
        id: "imx-boot-chain", priority: "must", difficulty: "base", tags: ["启动链", "U-Boot", "Kernel", "rootfs"],
        q: "I.MX6ULL 从上电到用户态应用启动经历了什么？",
        brief: "ROM 加载初始代码，U-Boot 初始化并加载 Kernel/DTB/rootfs，Kernel 建立内存与驱动后执行 init。",
        a: `<p>典型链路：SoC Boot ROM → SPL/初始加载代码 → U-Boot → Linux kernel + DTB → root filesystem → /sbin/init/BusyBox init → 应用。U-Boot 设置 bootargs 并从 MMC/TFTP 加载镜像；Kernel 建页表、调度器，解析 DTB、驱动 probe，挂 rootfs 后执行 init。</p><p>排查按阶段：无串口查供电/启动介质；停 U-Boot 查环境和存储；kernel panic 查 bootargs/rootfs；驱动不 probe 查 DTB、时钟、pinctrl；用户态失败查 init、动态链接器和挂载。</p>`,
        followups: [{ q: "设备树为什么由 Bootloader 传入？", a: "同一内核可适配不同板卡，Bootloader 选择对应 DTB，避免把板级硬件硬编码进内核。" }, { q: "rootfs 只是一堆文件吗？", a: "还必须有 init、设备管理、动态链接器、库、挂载和权限。" }],
        evidence: "串口日志、printenv、bootargs、DTB 反编译和 rootfs 目录",
        boundary: "不同 BSP 的 SPL 和启动命令不同，按实际镜像验证。",
        caution: "不要把 Cortex-M 启动流程套到 Cortex-A7 Linux。"
      },
      {
        id: "imx-signal", priority: "must", difficulty: "advanced", tags: ["信号", "signalfd", "退出"],
        q: "SIGTERM、SIGINT、SIGKILL 如何用于应用退出？为什么推荐 signalfd？",
        brief: "SIGTERM/SIGINT 是可处理的退出请求，SIGKILL 不可捕获；signalfd 可把信号统一接入 epoll。",
        a: `<p>主线程先用 sigprocmask 阻塞 SIGTERM/SIGINT/SIGCHLD，再创建 signalfd 加入 epoll。读到信号后停止接收、唤醒线程、flush 日志、关闭设备和 socket，最后返回退出码。这样不会在异步 handler 中调用 malloc、printf 或锁等非异步安全函数。</p><p>SIGKILL 无法捕获，所以一致性不能依靠退出回调，要使用追加日志、临时文件 + rename、周期 fsync 和启动恢复扫描。</p>`,
        followups: [{ q: "多线程进程由谁收信号？", a: "信号可投递给未屏蔽它的线程；统一在所有线程屏蔽，再由专门线程读取 signalfd。" }, { q: "SIGKILL 后怎样避免日志损坏？", a: "用版本、长度、CRC 或原子替换，启动时扫描尾记录，不能依赖 signal handler。" }],
        evidence: "signalfd/epoll 代码、TERM 退出日志和 KILL 恢复测试",
        boundary: "SIGSTOP 和 SIGKILL 不能捕获，不能笼统说所有信号都可处理。",
        caution: "signal handler 中不要调用 printf、malloc、pthread_mutex_lock。"
      },
      {
        id: "imx-uboot", priority: "must", difficulty: "advanced", tags: ["U-Boot", "TFTP", "NFS"],
        q: "如何用 U-Boot 的 TFTP/NFS 做安全的快速迭代？",
        brief: "临时配置网络，先从 TFTP 加载 Kernel/DTB 到 DRAM，再用 NFS rootfs 验证；稳定后才固化环境。",
        a: `<p>先用 printenv 保存环境，临时 setenv ipaddr/serverip 并 ping 主机；根据当前 U-Boot 环境选择 loadaddr/fdt_addr，再 tftp 加载 zImage 和 DTB。bootargs 明确 console、root、nfsroot 和 ip，使用 BSP 匹配的 bootz/bootm。NFS 适合快速改应用/rootfs，TFTP 适合换 Kernel/DTB，避免每次写 eMMC。</p><p>若 TFTP 失败，检查 serverip、主机防火墙、TFTP 根目录、文件名并抓包；NFS 卡住则核对 export 权限、NFS 版本和 bootargs。</p>`,
        followups: [{ q: "为什么先不 saveenv？", a: "临时变量验证失败后重启即可恢复；saveenv 会改变持久启动路径，必须在命令和地址都验证后使用。" }, { q: "load address 能照抄教程吗？", a: "不能，必须结合当前 DRAM 范围、U-Boot 环境和镜像大小，避免覆盖 U-Boot、DTB 或 ramdisk。" }],
        evidence: "printenv、TFTP/NFS 服务日志、bootargs 和串口启动日志",
        boundary: "load address、boot 命令和 NFS 参数以当前 BSP 为准。",
        caution: "任何 saveenv 或存储擦写前保留旧环境和恢复入口。"
      },
      {
        id: "imx-build-kernel", priority: "must", difficulty: "advanced", tags: ["内核编译", "Kconfig", "模块"],
        q: "如何为 I.MX6ULL 编译内核并保证模块能够加载？",
        brief: "使用匹配的 BSP、交叉工具链和 defconfig；区分 built-in/module，安装 modules 后核对 vermagic。",
        a: `<p>确认源码 commit 和工具链，使用板卡 defconfig 后再 menuconfig，编译 zImage、dtbs、modules，并把模块安装到临时 rootfs。开发驱动先选 m 便于卸载，根文件系统启动前必须使用的存储/控制台驱动选 y。</p><pre><code>make ARCH=arm CROSS_COMPILE=arm-linux-gnueabihf- &lt;board_defconfig&gt;\nmake ARCH=arm CROSS_COMPILE=arm-linux-gnueabihf- -j4 zImage dtbs modules\nmake ARCH=arm CROSS_COMPILE=arm-linux-gnueabihf- INSTALL_MOD_PATH=ROOTFS modules_install\nmodinfo my_driver.ko</code></pre><p><code>&lt;board_defconfig&gt;</code> 是占位符，必须替换为配套 BSP 实际目标。Invalid module format 时先看 dmesg、modinfo vermagic、内核 config 和符号依赖。</p>`,
        followups: [{ q: "built-in 与 module 怎么选？", a: "启动关键依赖用 built-in；可选设备和开发中驱动用 module，便于独立验证。" }, { q: "配置改了但行为没变怎么办？", a: "确认启动的是新 zImage/DTB、模块目录匹配，并从运行系统核对版本和 config。" }],
        evidence: "源码 commit、.config、构建日志、镜像校验和与 dmesg",
        boundary: "defconfig 名称和内核版本由 ALPHA V2.4 当前 BSP 决定。",
        caution: "不要混用不同源码、配置、DTB 和模块目录。"
      },
      {
        id: "imx-dts", priority: "must", difficulty: "advanced", tags: ["设备树", "pinctrl", "probe"],
        q: "设备树如何描述 I.MX6ULL 外设？驱动如何取得资源？",
        brief: "compatible 匹配驱动，reg/irq/gpio/clock/pinctrl 描述资源；probe 通过内核资源 API 获取。",
        a: `<p>节点用 compatible 匹配，reg 描述寄存器，interrupts 描述中断，clocks/resets/pinctrl 描述依赖，status 控制启用。新内核可用 devm_platform_ioremap_resource、platform_get_irq、devm_gpiod_get、devm_clk_get；较老 BSP 常用 platform_get_resource + devm_ioremap_resource，以及 of_get_named_gpio 等旧接口。依赖未就绪返回 -EPROBE_DEFER。</p><p>面试优先解释资源模型，再根据运行内核选 API。排查时反编译实际生效 DTB，并查看 /sys/firmware/devicetree/base；不要只看源码目录里某个 dts。</p>`,
        followups: [{ q: "节点存在但 probe 不调用怎么办？", a: "查 status、compatible、驱动是否加载、实际 DTB、模块 vermagic，再看 dmesg 匹配日志。" }, { q: "为何不硬编码寄存器地址？", a: "硬编码破坏跨板复用，也容易遗漏时钟、pinctrl 和安全资源；驱动应消费固件描述。" }],
        evidence: "DTS patch、DTB 反编译、probe 日志和 sysfs",
        boundary: "phandle 和 binding 写法以 I.MX6ULL BSP 文档为准。",
        caution: "改 pinctrl 前确认不会抢占 UART、SD/eMMC、LCD 或网络引脚。"
      },
      {
        id: "imx-rootfs", priority: "must", difficulty: "base", tags: ["rootfs", "BusyBox", "init"],
        q: "如何理解并制作一个能启动的嵌入式 Linux rootfs？",
        brief: "rootfs 必须包含 init、动态链接器/库、devtmpfs 或设备管理、配置和应用依赖。",
        a: `<p>最小 rootfs 包含 /sbin/init、/bin/sh、/dev、/proc、/sys、/etc、动态链接器和库。BusyBox 提供最小命令，init 脚本挂载 proc/sys/dev、配置网络并启动服务。开发阶段先用 NFS rootfs 快速迭代，稳定后再制作 ext4/UBI 镜像。</p><p>程序存在却无法运行时，用 readelf 检查 interpreter，再查库、权限、工作目录和挂载，不能只 chmod 777。</p>`,
        followups: [{ q: "/dev 节点谁创建？", a: "devtmpfs 提供内核设备节点，udev/mdev 补权限和符号链接；极简系统也可静态 mknod。" }, { q: "PID 1 为什么特殊？", a: "它启动服务、收养孤儿并处理系统退出；退出通常使系统不可用。" }],
        evidence: "rootfs 目录、init 脚本、动态链接器、NFS 和启动日志",
        boundary: "BusyBox init、systemd、Buildroot/Yocto 机制不同，先确认项目方案。",
        caution: "不要未经审查复制宿主机库、配置和设备节点。"
      },
      {
        id: "imx-module", priority: "must", difficulty: "base", tags: ["内核模块", "insmod", "dmesg"],
        q: "Linux 内核模块的加载、卸载和调试流程是什么？",
        brief: "模块 init 注册资源，exit 反向释放；编译必须匹配目标内核源码、配置、架构和工具链。",
        a: `<p>最小模块包含 module_init、module_exit、MODULE_LICENSE。用目标内核 build 目录编译，板端 insmod、lsmod、dmesg -w、rmmod 验证。insmod 直接插入 .ko，不自动处理依赖；modprobe 根据 modules.dep 加载依赖。</p><pre><code>static int __init demo_init(void) { pr_info("demo init\\n"); return 0; }\nstatic void __exit demo_exit(void) { pr_info("demo exit\\n"); }\nmodule_init(demo_init);\nmodule_exit(demo_exit);\nMODULE_LICENSE("GPL");</code></pre>`,
        followups: [{ q: "Invalid module format 怎么查？", a: "看 dmesg 的 vermagic、架构、签名和 unknown symbol，再核对运行内核与 build 目录。" }, { q: "为什么 rmmod 可能失败？", a: "模块仍有引用、设备被打开、工作队列/线程未停止或资源没有注销。" }],
        evidence: "模块 Makefile、modinfo、加载卸载日志和错误复现",
        boundary: "能加载仅证明生命周期入口正常，不代表硬件与并发路径完整。",
        caution: "高频 pr_info 会显著改变串口和实时路径。"
      },
      {
        id: "imx-char-driver", priority: "must", difficulty: "advanced", tags: ["字符设备", "file_operations", "设备节点"],
        q: "如何从零实现一个字符设备驱动？",
        brief: "申请设备号、注册 cdev/fops、创建 class/device，再实现 open/read/write/ioctl/release 和反向清理。",
        a: `<p>顺序是 alloc_chrdev_region → cdev_init/cdev_add → class_create → device_create；退出严格反向。open 建立上下文，read/write 处理数据，unlocked_ioctl 传结构化命令，release 释放每次打开状态。先用内核环形缓冲验证框架，再接 GPIO，能把框架错误与硬件问题分离。</p><pre><code>static const struct file_operations fops = {\n    .owner = THIS_MODULE, .open = demo_open, .read = demo_read,\n    .write = demo_write, .unlocked_ioctl = demo_ioctl,\n    .release = demo_release,\n};</code></pre>`,
        followups: [{ q: "cdev、class、device 各做什么？", a: "cdev 绑定设备号和 fops；class 形成 sysfs 类；device 创建具体对象并触发 /dev 节点。" }, { q: "多进程同时 open 怎么处理？", a: "明确并发策略，用 mutex/refcount 保护共享状态，或独占时返回 -EBUSY。" }],
        evidence: "源码、/proc/devices、/sys/class、/dev 节点和应用日志",
        boundary: "字符设备是用户接口框架，不等于某个具体硬件驱动。",
        caution: "用户指针必须通过 copy_to_user/copy_from_user。"
      },
      {
        id: "imx-usercopy", priority: "must", difficulty: "advanced", tags: ["copy_to_user", "ioctl", "安全"],
        q: "驱动如何安全地和用户态交换数据？ioctl 怎么设计？",
        brief: "内核与用户地址空间隔离，使用 usercopy；ioctl 命令要编码方向、类型、序号和结构长度。",
        a: `<p>用户指针可能无效或被并发修改，不能直接解引用。copy_from_user/copy_to_user 返回未复制字节数，非零转为 -EFAULT。ioctl 用 _IO/_IOR/_IOW/_IOWR，结构体采用固定宽度字段和 version/size，检查范围和权限。</p><pre><code>struct demo_cfg { __u32 version; __u32 period_ms; __u8 enable; };\nif (copy_from_user(&amp;cfg, argp, sizeof(cfg))) return -EFAULT;\nif (cfg.period_ms == 0) return -EINVAL;</code></pre><p>用 NULL、错误长度、超大参数做错误注入，驱动应返回错误而不是 Oops。</p>`,
        followups: [{ q: "为什么不能 memcpy 用户指针？", a: "用户页可能无效、换出或没有权限，还可能造成内核地址泄漏和崩溃。" }, { q: "copy_to_user 返回什么？", a: "返回未复制字节数，非零表示部分失败，不是可直接返回的 errno。" }],
        evidence: "UAPI 头文件、ioctl 表和错误注入脚本",
        boundary: "UAPI 发布后要考虑兼容性，不能暴露内核私有结构。",
        caution: "ioctl 不要做无超时、不可取消的长阻塞操作。"
      },
      {
        id: "imx-platform", priority: "must", difficulty: "advanced", tags: ["platform_driver", "probe", "devm"],
        q: "platform_driver 和字符设备是什么关系？probe/remove 如何组织？",
        brief: "platform_driver 绑定设备树硬件资源；字符设备可在 probe 中注册，作为用户态接口。",
        a: `<p>platform_driver 的 of_match_table 通过 compatible 匹配。probe 获取 clock、pinctrl、reg、irq、gpio，初始化硬件后可注册 cdev/class/device；remove 停止硬件、唤醒等待者、注销接口和资源。devm API 简化错误路径，但不能代替线程停机和并发同步。</p><p>依赖未准备好返回 -EPROBE_DEFER，参数错误返回 -EINVAL，不把所有失败都吞成成功。</p>`,
        followups: [{ q: "probe 失败后资源怎么释放？", a: "devm 自动释放受管资源，手动资源按申请反序释放；每步都要有清晰 cleanup。" }, { q: "platform 是电气总线吗？", a: "不是，它是 Linux 表示不能被常规枚举的板级设备及其资源的一种设备模型。" }],
        evidence: "platform_driver、of_match、probe/remove 日志和 DTS",
        boundary: "用户接口可选字符设备、input、IIO、LED 等合适子系统。",
        caution: "probe 创建线程后必须在 remove 中停止并等待退出。"
      },
      {
        id: "imx-gpio", priority: "must", difficulty: "base", tags: ["GPIO", "pinctrl", "LED/按键"],
        q: "如何在阿尔法 V2.4 上做设备树驱动的 LED/按键实验？",
        brief: "先核对原理图和 BSP pinctrl/GPIO，用 gpiod 获取资源，应用通过设备接口访问。",
        a: `<p>先在原理图确认 LED/按键连接，再在 DTS 配置 pinctrl、GPIO 极性和节点。新内核优先用 devm_gpiod_get 描述符接口；若配套旧 BSP 只有 of_get_named_gpio/gpio_request，则按该版本实现并能说明新旧 API 的资源管理差异。LED write 0/1 控制，按键通过 IRQ 形成事件；第二版再对比 Linux LED/input 子系统。</p><p>用示波器或万用表确认实际电平，检查 pinctrl 是否抢占 UART/SD。逻辑极性在驱动层统一，用户态不感知 active-low。</p>`,
        followups: [{ q: "电平反了怎么办？", a: "查 active_low、上拉/下拉和共阳/共阴；在 gpiod 层统一逻辑极性。" }, { q: "为什么 GPIO API 有 cansleep？", a: "部分 GPIO 控制器访问可睡眠，不能在硬 IRQ 中调用这类 API。" }],
        evidence: "原理图、DTS/pinctrl、驱动日志和波形",
        boundary: "V2.4 引脚必须用实物、手册和 BSP 三方核对。",
        caution: "不要从其他板卡教程抄 GPIO 编号。"
      },
      {
        id: "imx-irq", priority: "must", difficulty: "advanced", tags: ["中断", "线程化IRQ", "去抖"],
        q: "Linux 驱动如何处理中断？硬中断、线程化中断和按键去抖怎么做？",
        brief: "上半部只确认和保存最小现场，耗时或可睡眠工作放 threaded IRQ/workqueue；按键需去抖。",
        a: `<p>用 devm_request_threaded_irq 注册 top handler 和 thread_fn。top 读取/清状态、保存时间戳并返回 IRQ_WAKE_THREAD；thread_fn 可做 I2C、事件组包和唤醒。按键可按时间阈值丢弃 10～30 ms 内抖动，或定时器延迟确认。记录总 IRQ、有效和去抖丢弃计数。</p>`,
        followups: [{ q: "中断状态不清会怎样？", a: "电平中断会重复进入，CPU 占满；按手册正确清状态并确认读写顺序。" }, { q: "为什么 IRQ 中不能 mutex_lock？", a: "硬中断不能睡眠，mutex 可能阻塞；用自旋/原子或转线程上下文。" }],
        evidence: "IRQ 代码、/proc/interrupts、去抖计数和波形",
        boundary: "触发类型和清除方式以 GPIO 控制器手册/binding 为准。",
        caution: "不要在高频 IRQ 中 printk。"
      },
      {
        id: "imx-poll", priority: "must", difficulty: "advanced", tags: ["poll", "等待队列", "阻塞I/O"],
        q: "如何让字符设备支持阻塞 read、非阻塞 read 和 poll/epoll？",
        brief: "状态变化时唤醒 waitqueue；read 按 O_NONBLOCK 返回 EAGAIN 或睡眠，poll 将条件接入 epoll。",
        a: `<p>驱动维护环形缓冲和 wait_queue_head_t。无数据且 O_NONBLOCK 时 read 返回 -EAGAIN，阻塞模式用 wait_event_interruptible 等待“有数据或 stopping”。生产者入队后 wake_up_interruptible。poll 回调先 poll_wait 注册队列，再按当前状态返回 POLLIN。应用收到 epoll 事件后 read 到 EAGAIN。</p><p>remove 前设置 stopping、唤醒所有等待者、阻止新 open 并等待引用释放。</p>`,
        followups: [{ q: "poll 为什么还要检查条件？", a: "poll_wait 只登记队列，返回掩码才表示现在是否可读；不检查会忙循环或漏事件。" }, { q: "rmmod 时阻塞 read 怎么办？", a: "设置停机状态并唤醒，read 返回错误，等待打开者退出后再注销。" }],
        evidence: "waitqueue/poll 代码、非阻塞测试、epoll 和 rmmod 回归",
        boundary: "poll 只做通知，不负责消息边界和队列溢出策略。",
        caution: "更新条件后再 wake，并用锁保证可见性。"
      },
      {
        id: "imx-i2c", priority: "should", difficulty: "advanced", tags: ["I2C", "传感器", "regmap"],
        q: "I.MX6ULL 上 I2C 设备如何从设备树走到用户态验证？",
        brief: "确认物理链路后由 DT 创建 client，驱动 probe 读芯片 ID，再选择 IIO/input/hwmon 或字符接口。",
        a: `<p>先确认电源、地址、SDA/SCL 上拉和速率；DT 提供 compatible、reg、interrupts。I2C core 创建 client 并匹配驱动，probe 读 ID、配置量程/采样率。寄存器规则稳定时使用 regmap。调试顺序：i2c-tools（确认设备允许扫描）、dmesg、逻辑分析仪抓地址/ACK、读 ID、检查数据转换。</p>`,
        followups: [{ q: "总线被拉低怎么查？", a: "断电隔离器件，查上拉、电平转换、复位和 pinctrl；必要时按控制器手册做 bus recovery。" }, { q: "为什么 IRQ 里不直接读 I2C？", a: "I2C 可能睡眠且耗时，应在线程化 IRQ/workqueue 读取。" }],
        evidence: "DTS、probe、i2c-tools、逻辑分析仪和原始寄存器",
        boundary: "总线号、地址和器件型号以手头板卡/BSP 为准。",
        caution: "未知器件不要连续写寄存器，先确认写入副作用。"
      },
      {
        id: "imx-device-debug", priority: "must", difficulty: "advanced", tags: ["dmesg", "ftrace", "内核调试"],
        q: "驱动 probe 失败或内核异常时，如何建立调试证据链？",
        brief: "从 dmesg、实际 DTB、sysfs/procfs 到 dynamic_debug、ftrace 和 Oops 符号定位逐层缩小。",
        a: `<ol><li>dmesg -w 看 probe、-EPROBE_DEFER、资源冲突和 Oops。</li><li>查 /sys/bus/platform/devices、/sys/class、/proc/interrupts、/proc/iomem 与实际 DTB。</li><li>用 dynamic_debug 控制日志，用 ftrace/function_graph 测量 probe、IRQ 和 read。</li><li>Oops 保存 PC/LR/Call Trace/寄存器，用带符号 vmlinux + addr2line 定位。</li></ol><p>/dev/mem 只用于受控读寄存器实验，不替代驱动，更不能随意写硬件。</p>`,
        followups: [{ q: "-EPROBE_DEFER 一直出现怎么办？", a: "定位缺少的 regulator/clock/pinctrl/GPIO supplier，确认其驱动与 DT 状态，不能改成 0 掩盖。" }, { q: "Oops 和 Segfault 区别？", a: "Oops 是内核 call trace，应用 Segfault 在用户态，可用 core/gdb 分析。" }],
        evidence: "dmesg、DTB、sysfs/procfs、ftrace 和 vmlinux 符号",
        boundary: "工具可用性取决于 CONFIG_DEBUG_INFO/FTRACE 等内核配置。",
        caution: "不要用大量 printk 代替状态和错误码设计。"
      },
      {
        id: "imx-app-service", priority: "must", difficulty: "advanced", tags: ["综合项目", "守护进程", "驱动应用"],
        q: "如何用 I.MX6ULL 做一个同时展示驱动和应用能力的综合项目？",
        brief: "做 board-monitor：驱动提供板端事件，daemon 用 epoll 采集、可靠落盘和网络上报，并完成故障注入。",
        a: `<p><strong>架构：</strong>DTS → platform/字符驱动输出 /dev/board_event → daemon 用非阻塞 fd + epoll 读取，timerfd 周期统计，signalfd 退出，pthread 写有界日志队列，TCP/Unix socket 提供查询，由 init/Supervisor 拉起。</p><p><strong>故障：</strong>无数据、队列满、I2C NACK、断网、日志目录只读、SIGKILL、设备节点晚到。每种异常记录 errno、重试、退避和状态。日志带版本/长度/CRC 或临时文件 + rename。</p><p><strong>验收：</strong>连续 2 小时；断网重连；强杀后日志可恢复；驱动卸载和服务 stop 不死锁；脚本重复 100 次并保存结果。</p>`,
        followups: [{ q: "为什么不 mmap 寄存器？", a: "绕过驱动会失去权限、并发、DT 和资源管理，也难跨板复用。" }, { q: "怎么证明主循环没被阻塞？", a: "记录 epoll loop latency、队列水位和写盘耗时，在慢 SD/断网下验证。" }],
        evidence: "架构图、驱动/daemon、测试脚本、日志、故障注入和讲解视频",
        boundary: "先选一块确认过的板载资源完成闭环，再扩展其他外设。",
        caution: "综合项目价值在异常恢复和可验证性，不在堆 API。"
      },
      {
        id: "imx-interview-driver", priority: "must", difficulty: "advanced", tags: ["驱动面试", "probe", "排查"],
        q: "面试官问‘怎样定位 probe 失败’，如何回答？",
        brief: "按驱动加载、DT 匹配、资源依赖、硬件可达性和用户接口分层，每层给命令和证据。",
        a: `<p>先拿 dmesg 错误码，确认模块和 compatible 匹配；反编译实际 DTB，看 status/reg/irq/pinctrl/clock/reset/supplier。probe 每步输出结构化错误，区分 -ENODEV、-EPROBE_DEFER、-EINVAL 和总线超时。资源成功后用逻辑分析仪确认 I2C/SPI/GPIO，最后检查设备节点权限和应用 open/read。</p><p>每次只改一个变量，保存 dmesg、DTS diff、内核 commit 和回归结果。</p>`,
        followups: [{ q: "没有示波器怎么办？", a: "先用 dmesg、sysfs、i2c-tools、/proc/interrupts 和最小程序缩小范围，把波形列为待补证据。" }, { q: "如何避免日志影响时序？", a: "降低频率、用 dynamic_debug/trace buffer 或 GPIO 打点。" }],
        evidence: "probe 清单、命令、DTS diff、波形/计数和回归",
        boundary: "方法可复用，具体根因要以当前实验为准。",
        caution: "不要把‘重编后好了’当成根因。"
      },
      {
        id: "imx-interview-app", priority: "must", difficulty: "advanced", tags: ["应用面试", "可靠性", "性能"],
        q: "应用岗位问‘怎样保证板端服务长期运行’，应该覆盖什么？",
        brief: "覆盖资源、并发、I/O、恢复、可观测、升级和测试，给指标与故障注入。",
        a: `<ul><li>资源：fd/线程/堆/日志有上限和周期统计，正确处理短读写、EINTR、EAGAIN。</li><li>并发：明确队列所有权、锁顺序、超时和退出，慢 I/O 不阻塞事件循环。</li><li>恢复：网络退避、子进程回收、原子文件、半写记录扫描。</li><li>观测：日志、心跳、状态机、错误码、版本和计数可查询。</li><li>性能：loop latency、队列水位、CPU/RSS、写盘和丢弃计数。</li><li>测试：断网、只读文件系统、强杀、资源耗尽和长稳。</li></ul>`,
        followups: [{ q: "watchdog 怎么配合？", a: "主循环确认各关键子系统心跳后才喂狗；卡死线程不能替整个系统喂。" }, { q: "内存泄漏怎么查？", a: "主机侧 ASan/Valgrind，板端 RSS/heap 趋势和分配计数，二分功能并长稳回归。" }],
        evidence: "服务状态机、资源统计、watchdog 策略和故障矩阵",
        boundary: "长期运行验证不等于功能安全认证，要说明场景和时长。",
        caution: "watchdog 不能修复死锁、泄漏和数据损坏。"
      },
      {
        id: "imx-capstone", priority: "must", difficulty: "base", tags: ["验收", "作品集", "复盘"],
        q: "专项结束后，怎样判断自己达到驱动/应用岗位的基础线？",
        brief: "能解释启动链、写系统调用应用、完成最小驱动和 epoll 服务，并用真实日志复盘故障。",
        a: `<p><strong>最低验收：</strong>10 分钟完成串口/网络/版本记录；不看教程解释启动链；写出 open/read/write/epoll/pthread 并处理错误；从零编译加载字符设备并解释 cdev/fops/usercopy/waitqueue；用 DTS + platform 驱动一块确认过的资源；用 gdb/strace/dmesg/ftrace 定位一次真实故障；完成 board-monitor 和测试矩阵。</p><p><strong>面试材料：</strong>README、接线/架构图、BSP/内核版本、DTS patch、驱动、应用、Makefile、测试脚本、串口日志、故障复盘和 3 分钟视频。每个项目准备 30 秒结论、2 分钟架构、1 个故障、1 段代码和 1 个边界。</p>`,
        followups: [{ q: "现场写字符设备怎么办？", a: "先写资源生命周期和 fops 骨架，再补安全 read/write；边写边说明 usercopy、并发和错误路径。" }, { q: "后续补什么？", a: "按 JD 选：应用补网络/线程池，驱动补 DMA/电源管理，系统补 Buildroot/Yocto 和性能分析。" }],
        evidence: "专项 Git、实验记录、测试矩阵、复盘视频和自测分数",
        boundary: "验收线表示有基础闭环，不等于掌握所有 Linux 子系统。",
        caution: "照教程成功一次不算独立完成，必须能从空目录重建关键步骤。"
      }
    ]
  }
];
