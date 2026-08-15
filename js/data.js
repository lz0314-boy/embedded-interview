const DATA_PART1 = [
  {
    id: "c-lang", name: "C语言基础", icon: "📘",
    questions: [
      {
        id: "c-1", tags: ["高频","基础"],
        q: "static关键字有哪些用法？分别有什么作用？",
        a: `<p><strong>static关键字在C语言中有三种用法：</strong></p>
<ul>
<li><strong>修饰局部变量</strong>：将变量的存储位置从栈区改到静态存储区(.data或.bss段)，生命周期延长到整个程序运行期间。变量只在第一次调用时初始化，后续调用保留上一次的值。默认初始化为0。</li>
<li><strong>修饰全局变量</strong>：将变量的链接属性从external改为internal，该变量仅在当前源文件内可见。其他文件即使使用extern声明也无法访问。不同文件可以定义同名的static全局变量，互不影响。</li>
<li><strong>修饰函数</strong>：将函数的链接属性从external改为internal，该函数只能在声明它的源文件中调用，其他文件不可引用。用于隐藏模块内部实现细节，是实现封装的重要手段。</li>
</ul>
<pre><code class="language-c">void count_calls(void) {
    static int counter = 0;  // 只初始化一次，每次调用保留值
    counter++;
    printf("Called %d times\\n", counter);
}

static int file_private = 42;  // 仅当前文件可见
static void internal_func(void) { /* 仅当前文件可调用 */ }</code></pre>`
      },
      {
        id: "c-2", tags: ["高频","基础"],
        q: "const关键字修饰指针时有哪几种情况？如何区分？",
        a: `<p><strong>const修饰指针有四种情况，记忆口诀：const离谁近就修饰谁。</strong></p>
<table><tr><th>声明</th><th>含义</th></tr>
<tr><td><code>const int *p</code></td><td>常量指针——<strong>指针可变，指向的内容不可（const在*左边，修饰int，内容只读）</strong></td></tr>
<tr><td><code>int const *p</code></td><td>同上，完全等价</td></tr>
<tr><td><code>int * const p</code></td><td>指针常量——<strong>指针本身不可变，指向的内容可变（const在*右边，修饰p，指针只读）</strong></td></tr>
<tr><td><code>const int * const p</code></td><td>指向常量的指针常量——<strong>指针和内容都不可变</strong></td></tr></table>
<p>const修饰的对象通常会被编译器放入只读段（如<code>.rodata</code>）；该段最终位于Flash还是启动时搬到RAM，取决于链接脚本、存储架构和是否需要运行时重定位，不能仅凭<code>const</code>绝对判断。函数参数使用const可明确表达“只读”语义，增强可读性和接口约束。</p>`
      },
      {
        id: "c-3", tags: ["高频","必考"],
        q: "volatile关键字的作用是什么？哪些场景必须使用？",
        a: `<p><strong>volatile告诉编译器：不要对该变量进行任何优化，每次访问都必须从内存地址重新读取。</strong></p>
<p>编译器优化通常会把变量缓存到寄存器中以加速访问，但在嵌入式场景下会导致读取"脏数据"。volatile有三个特性：易变性（每次从内存重新读取）、不可优化性、顺序性（volatile变量之间执行顺序不会被编译器重排）。</p>
<p><strong>三个必须使用volatile的场景：</strong></p>
<ul>
<li><strong>硬件寄存器映射</strong>：<code>#define GPIO_DATA (*(volatile unsigned int*)0x40020000)</code></li>
<li><strong>中断ISR中修改的全局变量</strong>：<code>volatile int flag = 0;</code>（中断中置1，主循环轮询）</li>
<li><strong>多任务共享变量</strong>：被多个线程/任务读写的变量</li>
</ul>
<pre><code class="language-c">// 向绝对地址0x56a00写入0x55aa
*(volatile unsigned int *)0x56a00 = 0x55aa;
// volatile防止编译器优化掉对绝对地址的操作</code></pre>`
      },
      {
        id: "c-4", tags: ["进阶"],
        q: "const和volatile可以同时修饰一个变量吗？为什么？",
        a: `<p><strong>可以同时使用，典型场景是只读状态寄存器。</strong></p>
<p><code>const volatile uint32_t *status_reg;</code> 中：const表示程序代码不应通过该指针修改寄存器值（编译时写入会报错，提供软件保护）；volatile表示硬件可能随时改变该寄存器的值，禁止编译器优化（如将多次读取优化为一次），确保每次读取获得最新的硬件状态。</p>
<p>在嵌入式系统中，硬件状态寄存器是只读的（软件不应修改），但其值会随硬件状态变化而改变。const+volatile组合恰好表达了这一特性。另一个典型场景是定时器计数器寄存器：程序只读取它来判断时间，但从不在软件中修改它。</p>
<pre><code class="language-c">// 只读硬件状态寄存器
const volatile uint32_t *status_reg =
    (const volatile uint32_t *)0x40020004;
uint32_t current = *status_reg;  // 每次从硬件读取最新值</code></pre>`
      },
      {
        id: "c-5", tags: ["高频","基础"],
        q: "指针和数组有什么区别？",
        a: `<p><strong>核心区别：</strong></p>
<ul>
<li><strong>sizeof运算</strong>：<code>sizeof(指针)</code>返回4(32位)或8(64位)字节；<code>sizeof(数组)</code>返回整个数组占用的字节数。</li>
<li><strong>&操作</strong>：<code>&指针</code>取得指针变量自身的地址；数组名本身是首元素地址常量，<code>&数组名</code>得到的是整个数组的地址（数值相同，类型不同）。</li>
<li><strong>赋值操作</strong>：指针可以重新赋值指向不同地址；数组名是地址常量，不能作为左值。</li>
<li><strong>函数参数退化</strong>：数组作为函数参数时会退化为指针，丢失长度信息。<code>void func(int arr[])</code>等价于<code>void func(int *arr)</code>，函数内sizeof(arr)是指针大小而非数组大小。</li>
<li><strong>内存分配</strong>：数组内存在编译时确定（静态/栈上）；指针指向的内存可以动态分配（堆上）。</li>
</ul>`
      },
      {
        id: "c-6", tags: ["基础"],
        q: "什么是野指针？如何避免？",
        a: `<p><strong>野指针是指向"不可用内存"的指针，访问野指针会导致未定义行为（段错误、HardFault、数据破坏等）。</strong></p>
<p><strong>产生场景：</strong></p>
<ul>
<li><strong>未初始化</strong>：<code>int *p;</code>（p的值不确定，随机指向）</li>
<li><strong>释放后未置空</strong>：<code>free(p);</code>后p仍指向已释放的内存，成为悬挂指针</li>
<li><strong>返回局部变量地址</strong>：函数返回后局部变量已销毁，但仍持有其地址</li>
<li><strong>数组越界访问</strong>：通过指针越界读写不属于自己的内存</li>
</ul>
<p><strong>避免方法：</strong></p>
<ul>
<li>声明指针时初始化为NULL</li>
<li>free/delete后立即置NULL</li>
<li>不返回局部变量的地址</li>
<li>使用静态分析工具（PC-lint、Coverity）扫描潜在问题</li>
<li>在嵌入式系统中使用MPU做内存访问保护</li>
</ul>`
      },
      {
        id: "c-7", tags: ["进阶"],
        q: "函数指针如何定义和使用？举例说明应用场景。",
        a: `<p><strong>定义格式：</strong><code>返回类型 (*指针名)(参数列表);</code></p>
<p>函数指针可指向与签名匹配的函数，调用方式：<code>(*ptr)(args)</code>或简洁的<code>ptr(args)</code>。</p>
<p><strong>嵌入式中的典型应用场景：</strong></p>
<ul>
<li><strong>回调函数</strong>：如FreeRTOS中<code>xTaskCreate(taskFunc, ...)</code>传入任务函数指针</li>
<li><strong>状态机跳转表</strong>：定义<code>void (*state_handler[])(void) = {state1_handler, state2_handler};</code>通过数组索引快速分发</li>
<li><strong>驱动框架多态</strong>：结构体中内嵌函数指针表实现统一接口，不同硬件实现不同函数</li>
<li><strong>跳转到绝对地址</strong>：<code>((void (*)(void))0x10000000)();</code>用于Bootloader跳转到App</li>
</ul>
<pre><code class="language-c">// 跳转到绝对地址0x10000000执行程序
typedef void (*app_func_t)(void);
app_func_t app_entry = (app_func_t)0x10000000;
app_entry();  // 永远不会返回</code></pre>`
      },
      {
        id: "c-8", tags: ["高频","基础"],
        q: "sizeof和strlen的区别？",
        a: `<p><strong>sizeof是运算符（编译期求值），strlen是C标准库函数（运行期求值）。</strong></p>
<ul>
<li><strong>求值时机</strong>：sizeof在编译期就已确定（除VLA外），不消耗运行时间；strlen在运行时遍历字符串计数</li>
<li><strong>计算对象</strong>：sizeof计算类型或变量所占内存的总大小（包括'\\0'）；strlen计算字符串中字符个数（到'\\0'为止，不包含'\\0'）</li>
<li><strong>参数要求</strong>：sizeof可接受类型名或表达式；strlen必须接收指向有效C字符串的指针（末尾有'\\0'），否则会越界</li>
<li><strong>典型陷阱</strong>：<code>sizeof(数组名)</code>是数组总大小；数组作函数参数退化为指针后，<code>sizeof(参数名)</code>是指针大小（4/8字节）</li>
</ul>
<pre><code class="language-c">char buf[100] = "hello";
sizeof(buf);   // 100（编译期）
strlen(buf);   // 5（运行期）
char *p = buf;
sizeof(p);     // 4或8（指针大小）</code></pre>`
      },
      {
        id: "c-9", tags: ["高频","进阶"],
        q: "结构体内存对齐的规则是什么？为什么需要内存对齐？",
        a: `<p><strong>对齐规则：</strong></p>
<ul>
<li>每个成员的偏移量必须是自身类型大小的整数倍（如int偏移需4的倍数）</li>
<li>结构体总大小必须是最大成员大小的整数倍（含嵌套结构体）</li>
<li>可通过<code>#pragma pack(n)</code>或<code>__attribute__((packed))</code>强制修改对齐</li>
</ul>
<p><strong>需要对齐的原因：</strong>CPU按对齐边界访问内存效率最高（一次总线周期完成）。非对齐访问需要多次总线周期拼接数据，某些架构（如ARM Cortex-M0）甚至不支持非对齐访问，会触发UsageFault。</p>
<p><strong>优化策略：</strong>将占用空间大的成员放在前面，小的成员放在后面，或按类型大小从大到小排列，减少内部填充（padding）。在嵌入式通信协议解析中注意<code>#pragma pack(1)</code>的使用。</p>
<pre><code class="language-c">// 不优化的结构体：共12字节（char后3字节padding，char后3字节padding）
struct Bad { char c; int i; char c2; };
// 优化后：共8字节（两个char紧邻，尾部2字节padding）
struct Good { int i; char c; char c2; };</code></pre>`
      },
      {
        id: "c-10", tags: ["高频","基础"],
        q: "堆和栈的区别？",
        a: `<table><tr><th>特征</th><th>栈(Stack)</th><th>堆(Heap)</th></tr>
<tr><td>分配方式</td><td>系统自动分配/释放（函数的进入/退出）</td><td>程序员手动malloc/free</td></tr>
<tr><td>大小限制</td><td>较小（嵌入式通常几KB~几十KB）</td><td>较大（受限于可用RAM）</td></tr>
<tr><td>内存碎片</td><td>无碎片（LIFO）</td><td>有碎片问题</td></tr>
<tr><td>分配效率</td><td>快（仅移动SP指针）</td><td>慢（分配算法搜索空闲块）</td></tr>
<tr><td>增长方向</td><td>高地址向低地址增长</td><td>低地址向高地址增长</td></tr>
<tr><td>线程安全</td><td>各线程有独立栈，天然安全</td><td>多线程malloc需加锁保护</td></tr>
</table>
<p>在嵌入式RTOS中，每个任务有独立的栈（在创建任务时指定大小），而堆是全局共享的。栈溢出是嵌入式最常见的bug之一，需合理估算栈大小并开启栈溢出检测。</p>`
      },
      {
        id: "c-11", tags: ["进阶"],
        q: "内存泄漏如何判断和定位？如何避免？",
        a: `<p><strong>判断方法：</strong></p>
<ul>
<li><strong>长时间运行观察</strong>：系统运行久了内存持续减少，最终OOM</li>
<li><strong>工具检测</strong>：Linux下用Valgrind（memcheck）、mtrace；嵌入式下可hook malloc/free统计未释放次数</li>
<li><strong>嵌入式特有方法</strong>：周期性打印剩余堆空间（<code>uxTaskGetFreeHeapSize()</code>），观察趋势是否持续下降</li>
</ul>
<p><strong>避免方法：</strong></p>
<ul>
<li>每个malloc必须有对应的free，建立"谁分配谁释放"原则</li>
<li>函数出口集中释放（goto cleanup模式）</li>
<li>嵌入式系统中推荐静态分配（编译期确定内存）或内存池，避免运行时malloc</li>
<li>使用RAII（C++智能指针）或静态分析工具扫描</li>
<li>代码审查时重点检查错误路径是否遗漏释放</li>
</ul>`
      },
      {
        id: "c-12", tags: ["基础"],
        q: "什么是大端模式和小端模式？如何用代码检测？",
        a: `<p><strong>大端(Big-Endian)</strong>：高字节存在低地址（人类阅读顺序），网络字节序采用大端。<strong>小端(Little-Endian)</strong>：低字节存在低地址（便于CPU做不同长度的数据访问），x86和STM32默认采用小端。ARM架构可通过寄存器配置切换大小端。</p>
<p><strong>检测方法：</strong></p>
<pre><code class="language-c">// 方法1：union法（类型安全）
int is_little_endian(void) {
    union { int i; char c[4]; } test;
    test.i = 1;
    return test.c[0] == 1;  // 小端返回1
}

// 方法2：指针强制转换
int is_little_endian(void) {
    int i = 1;
    return *(char *)&i == 1;
}</code></pre>
<p>网络编程中，发送数据前需将主机字节序转换为网络字节序：<code>htons()、htonl()、ntohs()、ntohl()</code>。</p>`
      },
      {
        id: "c-13", tags: ["基础"],
        q: "typedef和#define的区别？",
        a: `<table><tr><th>特性</th><th>typedef</th><th>#define</th></tr>
<tr><td>处理阶段</td><td>编译期（真正创建类型别名）</td><td>预处理期（文本替换）</td></tr>
<tr><td>类型安全</td><td>有类型检查</td><td>无类型检查，纯文本替换</td></tr>
<tr><td>作用域</td><td>遵循C语言作用域规则</td><td>从定义行到文件尾或#undef</td></tr>
<tr><td>指针修饰</td><td><code>typedef int* PTR;</code>后<code>PTR a,b;</code>都是指针</td><td><code>#define PTR int*</code>后<code>PTR a,b;</code>只有a是指针</td></tr>
</table>
<p>面试高频陷阱：<code>#define PTR int*</code>展开后是<code>int* a, b;</code>，b不是指针。而<code>typedef int* PTR;</code>后<code>PTR a,b;</code>两个都是指针。</p>`
      },
      {
        id: "c-14", tags: ["进阶"],
        q: "指针数组和数组指针的区别？",
        a: `<p><strong>记忆法则：看变量名最后和谁结合。先与[]结合→数组；先与*结合→指针。</strong></p>
<ul>
<li><strong>指针数组</strong> <code>int *arr[10];</code>：arr先与[10]结合→arr是含10个元素的数组；再与int *结合→每个元素是int*指针。本质是数组，存的是指针。</li>
<li><strong>数组指针</strong> <code>int (*p)[10];</code>：p先与*结合→p是指针；再与int [10]结合→指向含10个int的数组。本质是指针，指向整个数组。</li>
</ul>
<pre><code class="language-c">int a=1, b=2, c=3;
int *arr[3] = {&a, &b, &c};  // 指针数组：存3个指针
int arr2[3][10];
int (*p)[10] = arr2;         // 数组指针：指向每行10个int的二维数组
p++;  // 跳过一整行（10个int，即40字节）</code></pre>`
      },
      {
        id: "c-15", tags: ["进阶"],
        q: "宏函数和inline函数的区别？",
        a: `<table><tr><th>特性</th><th>宏函数(#define)</th><th>inline函数</th></tr>
<tr><td>处理阶段</td><td>预处理（文本替换）</td><td>编译期（内联展开是编译器建议）</td></tr>
<tr><td>类型检查</td><td>无（宏参数无类型）</td><td>有完整的类型检查</td></tr>
<tr><td>副作用</td><td>有（参数多次求值）</td><td>无（参数只求值一次）</td></tr>
<tr><td>调试</td><td>无法打断点</td><td>可打断点调试</td></tr>
<tr><td>作用域</td><td>无作用域概念</td><td>遵循C语言作用域</td></tr>
</table>
<pre><code class="language-c">#define MAX(a,b) ((a)>(b)?(a):(b))
MAX(i++, j++);  // 展开后i++和j++可能被执行两次，结果不可预期

inline int max(int a, int b) { return a > b ? a : b; }
max(i++, j++);  // 安全，参数只求值一次</code></pre>`
      },
      {
        id: "c-16", tags: ["基础"],
        q: "C语言编译过程分为哪四个阶段？每个阶段做什么？",
        a: `<p><strong>四个阶段：</strong></p>
<ol>
<li><strong>预处理(Preprocessing)</strong>：处理以#开头的指令——展开头文件(#include)、宏替换(#define)、去除注释、条件编译(#ifdef/#ifndef)。输出.i文件。</li>
<li><strong>编译(Compilation)</strong>：将.i文件翻译为汇编代码.s文件。包括词法分析、语法分析、语义分析、中间代码生成、代码优化、目标代码生成。</li>
<li><strong>汇编(Assembly)</strong>：将汇编代码.s文件转换为机器指令的目标文件.o（ELF格式）。生成代码段(.text)、数据段(.data)、符号表等。</li>
<li><strong>链接(Linking)</strong>：将多个.o文件和库文件合并为一个可执行文件。核心工作：符号解析（将未定义符号与定义处关联）和重定位（修正地址引用）。</li>
</ol>
<p>GCC命令：<code>gcc -E test.c -o test.i</code>（预处理）、<code>gcc -S test.c -o test.s</code>（编译）、<code>gcc -c test.c -o test.o</code>（汇编）、<code>gcc test.o -o test</code>（链接）。</p>`
      },
      {
        id: "c-17", tags: ["基础"],
        q: "全局变量和局部变量在内存中的存储位置有什么区别？",
        a: `<table><tr><th>变量类型</th><th>存储区域</th><th>生命周期</th><th>作用域</th></tr>
<tr><td>已初始化全局变量</td><td>.data段(RAM)</td><td>整个程序</td><td>所有文件（非static时）</td></tr>
<tr><td>未初始化全局变量</td><td>.bss段(RAM，启动时清0)</td><td>整个程序</td><td>所有文件（非static时）</td></tr>
<tr><td>全局const变量</td><td>.rodata段(Flash)</td><td>整个程序</td><td>同全局变量</td></tr>
<tr><td>局部变量</td><td>栈(Stack)</td><td>函数执行期间</td><td>函数内部</td></tr>
<tr><td>static局部变量</td><td>.data或.bss段(RAM)</td><td>整个程序</td><td>函数内部</td></tr>
<tr><td>字符串字面量</td><td>.rodata段(Flash)</td><td>整个程序</td><td>取决于指针作用域</td></tr>
<tr><td>malloc分配</td><td>堆(Heap/RAM)</td><td>直到free释放</td><td>取决于指针作用域</td></tr>
</table>
<p>嵌入式开发中理解内存布局至关重要：合理使用const将数据放到Flash节省RAM；控制全局变量数量减小.data/.bss段；监控栈深度防止溢出。</p>`
      },
      {
        id: "c-18", tags: ["基础"],
        q: "结构体和联合体(union)的区别？联合体的典型应用？",
        a: `<p><strong>核心区别：</strong></p>
<ul>
<li><strong>内存占用</strong>：结构体各成员各自占有独立的内存空间（总大小=所有成员大小+padding）；联合体所有成员共享同一块内存空间（总大小=最大成员的大小），同一时刻只能存储一个成员的值。</li>
<li><strong>访问时机</strong>：结构体可以同时访问所有成员；联合体访问最新写入的成员，读取其他成员得到未定义值。</li>
</ul>
<p><strong>联合体的典型应用：</strong></p>
<ul>
<li><strong>大小端检测</strong>：union{int i; char c[4];}判断字节序</li>
<li><strong>寄存器访问</strong>：32位寄存器的整体读写（整字）和位域操作共享同一段内存，便于同时支持位操作和整体赋值</li>
<li><strong>协议解析</strong>：不同格式的数据帧共享同一缓冲区，根据类型字段决定读取哪个格式</li>
<li><strong>类型双关</strong>：float和uint32_t共享union，便于将浮点数的IEEE 754表示按位解析</li>
</ul>`
      },
      {
        id: "c-19", tags: ["基础"],
        q: "C语言程序的内存布局是怎样的？",
        a: `<p><strong>从低地址到高地址的内存布局：</strong></p>
<pre><code class="language-c">低地址 ┌─────────────┐
       │  .text 代码段 │  Flash/ROM，只读，存放CPU指令
       ├─────────────┤
       │ .rodata 只读 │  Flash/ROM，const常量、字符串字面量
       ├─────────────┤
       │  .data 数据段 │  RAM，已初始化的全局/静态变量
       ├─────────────┤
       │  .bss 段     │  RAM，未初始化全局/静态变量（启动清0）
       ├─────────────┤
       │    Heap 堆   │  RAM，malloc/free动态分配，向上增长
       │     ↓       │
       │   ...空闲...  │
       │     ↑       │
       │   Stack 栈   │  RAM，局部变量/函数参数，向下增长
高地址 └─────────────┘</code></pre>
<p><strong>嵌入式特色：</strong>在MCU中，.text和.rodata通常放在Flash中。.data段的初始值也存储在Flash，启动时由启动代码拷贝到RAM。.bss段不占Flash空间（只需记录起始地址和大小），启动时由启动代码清零。</p>`
      },
      {
        id: "c-20", tags: ["基础"],
        q: "memcpy和memmove的区别？什么时候用哪个？",
        a: `<p><strong>memcpy假设源和目的内存区域不重叠</strong>，直接正向拷贝，可能会被编译器优化为SIMD指令加速。<strong>memmove处理内存重叠</strong>，内部判断重叠方向后选择正向或反向拷贝，保证正确性但稍慢。</p>
<p><strong>实现原理：</strong></p>
<ul>
<li>若dest < src（目的在源之前）：正向拷贝（从低地址到高地址），不会覆盖还未读的源数据</li>
<li>若dest > src（目的在源之后）：反向拷贝（从高地址到低地址），避免先拷贝覆盖了源数据尾部</li>
</ul>
<p><strong>选择原则：</strong>确定不重叠时用memcpy（更快）；不确定或明确可能重叠时用memmove（更安全）。在嵌入式协议栈中，环形缓冲区操作可能涉及重叠移动（如压缩缓冲区中已消费的数据），此时必须用memmove。面试常考手写两者的实现。</p>
<pre><code class="language-c">void *my_memmove(void *dst, const void *src, size_t n) {
    char *d = dst; const char *s = src;
    if (d < s) while (n--) *d++ = *s++;          // 正向
    else { d += n-1; s += n-1; while (n--) *d-- = *s--; } // 反向
    return dst;
}</code></pre>`
      },
      {
        id: "c-21", tags: ["进阶"],
        q: "嵌入式C中位域(bit field)的作用和使用注意事项？",
        a: `<p><strong>位域用于按bit级别操作数据，在嵌入式中最主要用途是硬件寄存器映射和协议帧定义。</strong></p>
<pre><code class="language-c">// 定义硬件控制寄存器（32位）
struct CTRL_REG {
    uint32_t enable    : 1;   // bit0: 使能位
    uint32_t mode      : 2;   // bit1-2: 工作模式
    uint32_t prescaler : 4;   // bit3-6: 预分频
    uint32_t reserved  : 25;  // bit7-31: 保留
};</code></pre>
<p><strong>注意事项：</strong></p>
<ul>
<li>位域的顺序依赖编译器实现（从左到右还是从右到左），跨平台移植需验证</li>
<li>位域成员不能取地址（&运算符不可用于位域）</li>
<li>位域的操作不是原子的（需要读-改-写），多任务访问需加锁保护</li>
<li>大端/小端会影响位域在内存中的实际排布</li>
<li>对于硬件寄存器映射，有些团队不推荐位域（因为编译器实现不确定），改用手动移位+掩码</li>
</ul>`
      },
      {
        id: "c-22", tags: ["基础"],
        q: "关键字extern的作用是什么？",
        a: `<p><strong>extern声明一个变量或函数在其他文件中定义</strong>，告诉编译器"这个符号存在，但它的定义在别处"。主要用于跨文件的全局变量和函数共享。</p>
<p><strong>使用场景：</strong></p>
<ul>
<li>在.c文件中定义一个全局变量，在对应的.h文件中用extern声明，其他文件include该头文件后可使用</li>
<li>函数默认是extern的（可被其他文件调用），一般不需要显式写extern</li>
<li>C++中使用<code>extern "C"</code>告诉C++编译器按C语言的函数名修饰规则（不做Name Mangling），让C++代码可以调用C编译的库函数</li>
</ul>
<pre><code class="language-c">// file1.c
int shared_counter = 0;  // 定义

// file1.h
extern int shared_counter;  // 声明，其他文件include后可用

// file2.c
#include "file1.h"
shared_counter = 10;  // 引用file1.c中定义的变量</code></pre>`
      },
      {
        id: "c-23", tags: ["基础"],
        q: "#define和枚举(enum)的区别？什么时候用枚举更好？",
        a: `<p><strong>#define是预处理文本替换，enum是真正的编译期常量类型。</strong></p>
<table><tr><th>特性</th><th>#define</th><th>enum</th></tr>
<tr><td>类型检查</td><td>无（纯文本替换）</td><td>有（enum是独立的类型）</td></tr>
<tr><td>作用域</td><td>从定义到#undef，全局</td><td>遵循C语言作用域，可限定在函数/结构体内</td></tr>
<tr><td>调试可见</td><td>调试器只看到展开后的值</td><td>调试器可显示枚举名称，便于分析</td></tr>
<tr><td>自动递增</td><td>需手动赋值</td><td>默认从0递增，可手动指定中间值</td></tr>
</table>
<p><strong>推荐使用enum的场景：</strong>一组相关的常量（状态码、错误码、模式选择），特别是需要调试器能显示名称的场合。enum的长度由编译器决定（通常为int），注意如需要控制长度可使用C语言指定枚举底层类型(int8_t/int16_t)。</p>`
      },
      {
        id: "c-24", tags: ["高频","进阶"],
        q: "嵌入式C中volatile和const同时使用在哪些场景？意义是什么？",
        a: `<p><strong>最典型的场景是只读硬件状态寄存器。</strong>在嵌入式系统中，很多硬件外设的状态寄存器对软件是只读的（写操作由硬件完成），但其值会随硬件状态变化而动态改变。</p>
<p><code>const volatile uint32_t *status_reg;</code> 表达了两个语义：</p>
<ul>
<li><strong>const</strong>：告诉程序员和编译器，通过这个指针不允许写入（编译期检查，写入会报错）。防止代码中误操作修改硬件状态。</li>
<li><strong>volatile</strong>：告诉编译器不要优化对这个地址的读取（如不能把两次读取优化成一次、不能使用寄存器缓存），每次访问必须发出总线读周期获取硬件当前值。</li>
</ul>
<p><strong>其他应用场景：</strong>输入只读的GPIO端口寄存器、定时器计数寄存器（随硬件跳动）、中断状态标志寄存器。</p>
<pre><code class="language-c">const volatile uint32_t *const TIM_CNT =
    (const volatile uint32_t *const)0x40000400;
// const+volatile: 只读且每次从硬件读取
// 最后一个const: 指针本身不可变</code></pre>`
      },
      {
        id: "c-25", tags: ["进阶"],
        q: "嵌入式C中柔性数组(flexible array member)是什么？如何使用？",
        a: `<p><strong>柔性数组是C99标准引入的特性</strong>，允许结构体的最后一个成员为不完整数组类型<code>int data[]</code>（或GCC扩展<code>int data[0]</code>），用于实现变长数据包结构。</p>
<p><strong>特点：</strong></p>
<ul>
<li>柔性数组成员不占结构体空间（sizeof不计算它）</li>
<li>必须在结构体最后一个成员，且前面至少有一个成员</li>
<li>分配时使用<code>malloc(sizeof(struct) + data_length)</code>，柔性数组获得额外分配的内存</li>
</ul>
<pre><code class="language-c">struct packet {
    uint16_t len;     // 数据长度
    uint16_t type;    // 包类型
    uint8_t data[];   // 柔性数组（不占结构体大小）
};

// 分配：结构体本身4字节 + 100字节data
struct packet *pkt = malloc(sizeof(struct packet) + 100);
pkt->len = 100;
pkt->data[0] = 0xAA;  // 通过索引访问数据区</code></pre>
<p>柔性数组相比在结构体中放指针的方案：减少一次内存分配、数据紧邻结构体（Cache友好）、释放只需一次free。在协议栈和动态内存管理中广泛应用。</p>`
      }
    ]
  }
];
const DATA_PART1B = [
  {
    id: "os-rtos", name: "操作系统与RTOS", icon: "⚙️",
    questions: [
      {
        id: "rtos-1", tags: ["高频","基础"],
        q: "进程和线程的区别是什么？",
        a: `<table><tr><th>特征</th><th>进程</th><th>线程</th></tr>
<tr><td>资源拥有</td><td>独立的内存空间、文件描述符</td><td>共享进程的地址空间和资源</td></tr>
<tr><td>调度单位</td><td>资源分配的基本单位</td><td>CPU调度的基本单位</td></tr>
<tr><td>切换开销</td><td>大（切换页表、刷新TLB）</td><td>小（仅切换寄存器+栈）</td></tr>
<tr><td>通信方式</td><td>需IPC（管道/共享内存等）</td><td>直接读写共享变量（需同步保护）</td></tr>
<tr><td>创建开销</td><td>大（fork复制地址空间）</td><td>小（仅创建栈+TCB）</td></tr>
</table>
<p>在嵌入式RTOS中没有进程概念，所有任务共享物理地址空间（类似线程），通过MPU做可选隔离。</p>`
      },
      {
        id: "rtos-2", tags: ["高频","FreeRTOS"],
        q: "FreeRTOS支持哪些任务调度方式？",
        a: `<p>FreeRTOS主要支持三种调度方式：</p>
<ul>
<li><strong>抢占式调度</strong>（configUSE_PREEMPTION=1）：高优先级任务就绪后立即抢占当前任务。保证最高优先级任务始终运行，适合硬实时场景。</li>
<li><strong>合作式调度</strong>（configUSE_PREEMPTION=0）：任务必须主动调用taskYIELD()或进入阻塞态才切换。不会随机打断，但响应延迟不确定。</li>
<li><strong>时间片轮转</strong>（configUSE_TIME_SLICING=1）：同优先级任务按时间片轮流执行，每个tick检测是否需切换。</li>
</ul>
<p>实际项目通常使用抢占式+时间片组合：不同优先级抢占，同优先级轮转。</p>`
      },
      {
        id: "rtos-3", tags: ["高频","FreeRTOS"],
        q: "vTaskDelay和vTaskDelayUntil的区别是什么？",
        a: `<p><strong>vTaskDelay(xTicksToDelay)</strong>是相对延时：从当前时刻开始延时指定tick数。缺点：实际执行周期=任务执行时间+延时时间，如果任务执行时间波动，周期会漂移。</p>
<p><strong>vTaskDelayUntil(&xLastWakeTime, xTimeIncrement)</strong>是绝对延时：基于固定的时间基准，确保任务严格按照固定周期执行。需要保存上次唤醒时间变量xLastWakeTime，每次唤醒时间=xLastWakeTime+xTimeIncrement（自动对齐）。</p>
<p><strong>选型：</strong>周期性传感器采样必须用vTaskDelayUntil（防止周期漂移）；只需保证最小间隔的场景（如按键消抖）用vTaskDelay即可。</p>
<pre><code class="language-c">TickType_t xLastWakeTime = xTaskGetTickCount();
while (1) {
    read_sensor();
    vTaskDelayUntil(&xLastWakeTime, pdMS_TO_TICKS(100)); // 精确100ms周期
}</code></pre>`
      },
      {
        id: "rtos-4", tags: ["高频","FreeRTOS"],
        q: "二值信号量、计数信号量、互斥锁(Mutex)有何区别？",
        a: `<table><tr><th>特性</th><th>二值信号量</th><th>计数信号量</th><th>互斥锁</th></tr>
<tr><td>值范围</td><td>0或1</td><td>0~最大值</td><td>0或1</td></tr>
<tr><td>所有权</td><td>无</td><td>无</td><td><strong>有</strong>（谁take谁give）</td></tr>
<tr><td>ISR中使用</td><td>可以（FromISR版本）</td><td>可以（FromISR版本）</td><td><strong>禁止</strong></td></tr>
<tr><td>优先级继承</td><td>不支持</td><td>不支持</td><td><strong>支持</strong></td></tr>
<tr><td>典型应用</td><td>任务同步、中断通知任务</td><td>管理多相同资源（如缓冲池）</td><td>保护共享资源、防止优先级反转</td></tr>
<tr><td>创建API</td><td>xSemaphoreCreateBinary()</td><td>xSemaphoreCreateCounting()</td><td>xSemaphoreCreateMutex()</td></tr>
</table>
<p><strong>关键区别：</strong>二值信号量无所有权概念，任何任务/ISR都可以give，不适合互斥访问。互斥锁有所有权+优先级继承，是保护共享资源的正确选择。</p>`
      },
      {
        id: "rtos-5", tags: ["高频","FreeRTOS"],
        q: "什么是优先级反转？FreeRTOS如何解决？",
        a: `<p><strong>优先级反转</strong>是经典RTOS问题：高优先级任务H因等待低优先级任务L持有的互斥锁而被阻塞，此时中优先级任务M抢占CPU（因为M优先级高于L），导致L无法运行释放锁，H被永久阻塞。高优先级任务实际上被中优先级任务"间接阻塞"，违反了优先级调度原则。</p>
<p><strong>真实案例：</strong>1997年NASA火星探路者号——低优先级气象任务持有总线锁→高优先级总线管理任务被阻塞→中优先级通信任务频繁抢占→看门狗超时→探测器反复重启，几乎失败。</p>
<p><strong>FreeRTOS解决方案——优先级继承：</strong>当高优先级任务等待低优先级任务持有的互斥锁时，系统临时将L的优先级提升到与等待者H相同。L快速运行完毕释放锁后，优先级自动恢复。中优先级M无法再抢占L，H得以快速获取锁并运行。这是互斥锁的默认行为（xSemaphoreCreateMutex自动启用）。</p>`
      },
      {
        id: "rtos-6", tags: ["高频","进阶"],
        q: "死锁的四个必要条件是什么？在RTOS中如何避免？",
        a: `<p><strong>死锁四个必要条件（必须全部满足才死锁）：</strong></p>
<ol><li><strong>互斥访问</strong>：资源不能同时被多个任务使用</li>
<li><strong>持有并等待</strong>：任务持有至少一个资源，同时等待其他资源</li>
<li><strong>不可剥夺</strong>：资源只能由持有者自愿释放</li>
<li><strong>循环等待</strong>：存在任务资源的环形等待链</li></ol>
<p><strong>避免方法：</strong></p>
<ul><li><strong>统一锁获取顺序</strong>（破坏循环等待）：所有任务按相同顺序获取锁，这是最实用的方法</li>
<li><strong>超时机制</strong>：使用xSemaphoreTake(xSemaphore, timeout)设置超时，获取失败则释放已有锁并重试</li>
<li><strong>避免嵌套锁</strong>：尽量一次只持有一个锁</li>
<li><strong>递归互斥锁</strong>：同一任务多次获取同一锁的场景使用xSemaphoreCreateRecursiveMutex()</li>
<li><strong>银行家算法</strong>：在资源可预知场景做静态安全分析（理论研究较多，实际嵌入式应用少）</li></ul>`
      },
      {
        id: "rtos-7", tags: ["高频","FreeRTOS"],
        q: "为什么中断服务程序(ISR)中不能使用互斥锁？",
        a: `<p><strong>三个原因：</strong></p>
<ol>
<li><strong>ISR不能阻塞</strong>：互斥锁获取失败时任务进入Blocked状态等待，但ISR不是任务，没有阻塞机制。ISR必须快速执行完毕并返回。</li>
<li><strong>优先级继承在ISR中无效</strong>：优先级继承基于任务优先级。ISR的优先级是硬件中断优先级（高于所有任务），不存在"提升ISR优先级"的概念。</li>
<li><strong>可能导致死锁</strong>：如果互斥锁被低优先级任务持有，而ISR等待该锁，ISR会永远阻塞（因为任务调度被ISR抢占），系统崩溃。</li>
</ol>
<p><strong>ISR中保护共享数据的正确方法：</strong></p>
<ul><li>临界区（taskENTER_CRITICAL_FROM_ISR / 关中断）→适合极短操作</li>
<li>原子操作（单条指令）</li>
<li>发送信号量/任务通知给任务，让任务去处理（ISR只做标志位+发通知）</li></ul>`
      },
      {
        id: "rtos-8", tags: ["FreeRTOS"],
        q: "FreeRTOS中消息队列的原理和使用场景？",
        a: `<p><strong>原理：</strong>消息队列是基于环形缓冲区的FIFO机制，通过值传递（拷贝数据，非指针传递）在任务间传输数据。核心API：xQueueCreate(队列长度, 每项大小)、xQueueSend(发送/阻塞等待)、xQueueReceive(接收/阻塞等待)。有xQueueSendFromISR用于中断中发送。</p>
<p><strong>使用场景：</strong></p>
<ul><li>中断向任务传递数据（如UART接收缓冲→队列→解析任务）</li>
<li>任务间数据通信（传感器采集→队列→数据处理）</li>
<li>缓冲生产者消费者速度差异（生产者快→队列缓冲→消费者按自身节奏消费）</li></ul>
<p><strong>设计要点：</strong>队列深度需覆盖最坏情况的数据积压；队列项大小影响内存占用（每个item是值拷贝）；发送大块数据时可传递指针（确保发送后数据生命周期仍有效）。</p>`
      },
      {
        id: "rtos-9", tags: ["FreeRTOS"],
        q: "FreeRTOS内存管理方案heap_1至heap_5各有什么特点？",
        a: `<table><tr><th>方案</th><th>特点</th><th>适用场景</th></tr>
<tr><td>heap_1</td><td>只分配不释放，最简单，无碎片</td><td>静态创建所有任务的应用</td></tr>
<tr><td>heap_2</td><td>可释放但不合并相邻空闲块（有碎片）</td><td>对碎片不敏感的简单应用</td></tr>
<tr><td>heap_3</td><td>封装标准malloc/free，需线程安全</td><td>有系统malloc的应用</td></tr>
<tr><td>heap_4</td><td>合并相邻空闲块，最佳碎片管理</td><td><strong>推荐首选</strong>，大多数应用最佳选择</td></tr>
<tr><td>heap_5</td><td>同heap_4+支持跨多内存区域分配</td><td>有外部RAM等多不连续内存区</td></tr></table>
<p>大多数嵌入式项目推荐heap_4，在碎片管理和功能之间取得最佳平衡。</p>`
      },
      {
        id: "rtos-10", tags: ["FreeRTOS","进阶"],
        q: "任务通知(Task Notification)和消息队列的对比？",
        a: `<table><tr><th>特性</th><th>任务通知</th><th>消息队列</th></tr>
<tr><td>速度</td><td>更快（每个TCB内置，零创建开销）</td><td>较慢（需创建对象+数据拷贝）</td></tr>
<tr><td>RAM占用</td><td>极低（TCB中已有的32位值）</td><td>需额外RAM（队列控制块+缓冲区）</td></tr>
<tr><td>多对一</td><td>不支持</td><td>支持</td></tr>
<tr><td>缓冲能力</td><td>无（仅32位，新值覆盖旧值）</td><td>有（可缓存多条消息）</td></tr>
<tr><td>操作类型</td><td>Set/Increment/AND/OR/带值通知</td><td>仅发送数据副本</td></tr>
</table>
<p><strong>选择建议：</strong>简单的一对一事件通知用任务通知（性能优先）；需要数据缓冲或多发送者→消费者用消息队列。</p>`
      },
      {
        id: "rtos-11", tags: ["FreeRTOS","进阶"],
        q: "FreeRTOS软件定时器的实现原理？",
        a: `<p>软件定时器通过<strong>Timer Service Task（Daemon Task）</strong>实现。定时器到期时回调函数在Timer Task的上下文中执行（而非Tick ISR），因此回调中可以阻塞等待。需要configUSE_TIMERS=1启用。</p>
<p><strong>关键实现：</strong></p>
<ul><li>定时器按到期时间排序存储（链表或跳表），tick中断只做标志位，由Timer Task检查expired定时器</li>
<li>回调函数在Timer Task中执行，因此有任务栈和优先级的概念</li>
<li>单次定时器到期后自动删除；周期定时器到期后重新插入列表</li></ul>
<p><strong>注意事项：</strong>定时器回调执行时间不能超过定时器周期；大量高频定时器会影响系统性能；xTimerStart/timerStop等操作通过命令队列异步发给Timer Task。</p>`
      },
      {
        id: "rtos-12", tags: ["FreeRTOS","进阶"],
        q: "任务栈溢出如何检测和预防？",
        a: `<p><strong>检测方法：</strong></p>
<ul><li>configCHECK_FOR_STACK_OVERFLOW=1：在任务切换时检查栈顶（当前栈指针是否越界）</li>
<li>configCHECK_FOR_STACK_OVERFLOW=2：除检查栈顶外，还在创建时用已知魔数(0xA5)填充栈底，切换时检查魔数是否被覆盖</li>
<li>uxTaskGetStackHighWaterMark()：运行时获取任务曾经使用过的最小剩余栈（高水位标记），用于调优栈大小</li></ul>
<p><strong>栈溢出预防：</strong></p>
<ul><li>合理估算栈大小：局部变量最大总大小+嵌套调用深度每层约64字节上下文+中断嵌套预留</li>
<li>先用大栈调试→运行时用uxTaskGetStackHighWaterMark监控实际用量→缩小到1.2-1.5倍余量</li>
<li>避免在任务内定义大局部数组、避免深度递归</li>
<li>使用静态栈分配（确保物理连续性）+ MPU做栈保护</li></ul>`
      },
      {
        id: "rtos-13", tags: ["FreeRTOS","进阶"],
        q: "FreeRTOS中临界区保护有哪些方式？各自适用什么场景？",
        a: `<ol>
<li><strong>taskENTER_CRITICAL()/taskEXIT_CRITICAL()</strong>：关中断（仅关可屏蔽中断，NMI等不受影响）。开销最小，适合极短临界区（微秒级，一般少于100条指令）。注意关中断时间不能超过系统实时性要求。</li>
<li><strong>vTaskSuspendAll()/xTaskResumeAll()</strong>：暂停调度器但不关中断。适合稍长的临界区，允许中断处理但禁止任务切换。中断中不可使用。</li>
<li><strong>互斥锁(xSemaphoreCreateMutex)</strong>：适合较长的共享资源保护。高开销但支持优先级继承，不关中断，对系统实时性影响最小。</li></ol>
<p><strong>选择原则：</strong>操作越短→越倾向关中断（高效）；操作越长→越倾向互斥锁（对系统影响小）；中间长度可选暂停调度器。绝对不能在持有锁时关中断（关中断期间不能阻塞）。</p>`
      },
      {
        id: "rtos-14", tags: ["高频","RT-Thread"],
        q: "RT-Thread和FreeRTOS的内核架构有什么本质区别？",
        a: `<p><strong>FreeRTOS：微内核风格。</strong>只提供最核心的调度+IPC（信号量/队列/互斥锁）。文件系统、网络协议栈、Shell等需要由第三方库补充，各组件之间缺乏统一接口标准，集成工作需要开发者自行完成。</p>
<p><strong>RT-Thread：组件化平台架构。</strong>内核+丰富中间件（设备框架rt_device/虚拟文件系统DFS/网络SAL抽象层/Finsh Shell/GUI）一体化设计。所有组件围绕内核有机整合，有统一的设备驱动模型（类似Linux），支持POSIX接口。</p>
<p><strong>核心差异：</strong>RT-Thread借鉴Linux设计哲学，具有完整的设备模型、驱动框架和组件化体系。FreeRTOS是纯粹的RTOS内核。RT-Thread开发效率更高（开箱即用的组件），FreeRTOS更轻量、认证更成熟（汽车/工业安全认证）。</p>`
      },
      {
        id: "rtos-15", tags: ["RT-Thread","进阶"],
        q: "RT-Thread内核对象模型（静态创建vs动态创建）的内部实现？",
        a: `<p>RT-Thread所有内核对象（线程/信号量/互斥量/定时器/设备等）都继承自<code>rt_object</code>基类，通过嵌入式双向链表<code>rt_list</code>统一管理。按类型分组存储在对象容器中，可通过<code>list_thread()</code>（Finsh Shell命令）遍历查看所有对象。</p>
<p><strong>静态创建：</strong>用户预先分配内存（全局数组或结构体），调用rt_thread_init/rt_sem_init等_init系列API。TCB内存由用户控制，生命周期固定。优点：确定性高、无内存分配失败风险、推荐在资源受限或安全关键场景使用。</p>
<p><strong>动态创建：</strong>调用rt_thread_create/rt_sem_create等_create系列API，内核内部从堆中通过slab/memheap分配TCB内存。优点：代码简洁、运行时灵活增减对象。缺点：有分配失败的可能、执行时间不确定。</p>
<p>内核通过<code>rt_object_allocate</code>统一分配对象，分配器根据对象类型选择合适的内存池（TCB从固定大小的slab池分配以确保碎片最少）。</p>`
      },
      {
        id: "rtos-16", tags: ["RT-Thread","进阶"],
        q: "RT-Thread线程管理：TCB结构体核心字段和线程栈分配方式？",
        a: `<p><strong>TCB(struct rt_thread)核心字段：</strong></p>
<ul><li>栈相关：stack_addr（栈起始地址）、stack_size（栈大小）、sp（当前栈指针）</li>
<li>调度相关：init_priority/current_priority（初始/当前优先级）、stat（线程状态）、tlist（同优先级就绪链表节点）</li>
<li>时间相关：init_tick/remaining_tick（时间片大小/剩余）</li>
<li>入口和参数：entry（线程入口函数）、parameter（参数）、user_data（用户数据，扩展用）</li>
<li>通用：name、object（继承自rt_object基类）、error（线程私有errno）</li></ul>
<p><strong>线程栈分配：</strong>静态分配（编译期全局数组+rt_thread_init）或动态分配（rt_thread_create→内核在堆上malloc栈空间）。RT-Thread启动时自动创建idle线程（优先级最低）和main线程（执行main函数）。</p>`
      },
      {
        id: "rtos-17", tags: ["RT-Thread","进阶"],
        q: "RT-Thread定时器HARDTIMER和SOFTTIMER模式有何区别？",
        a: `<p>RT-Thread的HARD/SOFT定时器与FreeRTOS的概念不同，是RT-Thread的独创设计：</p>
<ul><li><strong>HARDTIMER模式</strong>：定时器超时回调在<strong>系统节拍中断ISR上下文</strong>中执行。要求回调极短、不能阻塞、不能执行挂起操作。适合极低延迟的简单操作（如置标志位、发送信号量）。</li>
<li><strong>SOFTTIMER模式</strong>：定时器超时回调在<strong>独立的Timer线程</strong>上下文中执行。回调函数可以阻塞等待（sleep/信号量等），对实时性要求稍低。适合需要阻塞等待的处理。</li></ul>
<p>定时器通过<strong>跳表(Skip List)</strong>管理，查找和插入均为O(log n)。可通过menuconfig配置使用HARD或SOFT模式。</p>`
      },
      {
        id: "rtos-18", tags: ["RT-Thread"],
        q: "RT-Thread线程间同步机制有哪些？信号量和互斥量的区别？",
        a: `<p><strong>RT-Thread三大同步机制：</strong></p>
<ul><li><strong>信号量(rt_sem)</strong>：计数器机制，无所有权概念，支持ISR中使用（rt_sem_release在ISR中释放）。用于资源计数和任务同步。支持rt_sem_take(超时)、rt_sem_release。</li>
<li><strong>互斥量(rt_mutex)</strong>：所有权机制（谁take谁release，同线程释放）、支持<strong>优先级继承</strong>防止优先级反转、支持嵌套获取（类似递归锁）。不支持ISR。核心API：rt_mutex_take/release。</li>
<li><strong>事件集(rt_event)</strong>：32位事件标志（每位一个事件），支持AND/OR组合等待多事件，支持事件自动清除。适合多条件同步场景。API：rt_event_send/recv。</li></ul>
<p>RT-Thread互斥量支持prio_inherit（优先级继承）和prio_protect（优先级天花板）两种策略。</p>`
      },
      {
        id: "rtos-19", tags: ["RT-Thread","进阶"],
        q: "RT-Thread邮箱(mailbox)和消息队列(msg queue)有什么区别？",
        a: `<p><strong>邮箱(rt_mailbox)：</strong>每个邮件固定4字节（指针大小），适合传递指针或小数据。传递的是值（4字节拷贝），效率高。API：rt_mb_send/recv。典型用法：发送指向数据缓冲区的指针（需要注意指针生命周期：确保接收方处理完前数据有效）。</p>
<p><strong>消息队列(rt_messagequeue)：</strong>支持可变长度数据，通过环形缓冲区实现值传递。API：rt_mq_send/recv。适合传递不同大小的数据块。</p>
<p><strong>对比：</strong></p>
<table><tr><th>特性</th><th>邮箱</th><th>消息队列</th></tr>
<tr><td>消息大小</td><td>固定4字节</td><td>可变（创建时指定最大消息大小）</td></tr>
<tr><td>效率</td><td>更高（零拷贝传递指针）</td><td>较低（数据拷贝）</td></tr>
<tr><td>使用注意</td><td>控制指针数据生命周期</td><td>RAM占用大（缓冲区）</td></tr></table>`
      },
      {
        id: "rtos-20", tags: ["RT-Thread","进阶"],
        q: "RT-Thread内存管理(slab/memheap/mempool)各自适用什么场景？",
        a: `<ul><li><strong>slab分配器</strong>：管理多个预定义大小（如32/64/128/256/512字节等）的内存块链表。分配时取最匹配大小的块，释放时放回对应链表。适合频繁分配/释放同一大小内存的场景（如TCB分配、网络包缓冲），碎片最少。</li>
<li><strong>memheap（小内存管理）</strong>：基于伙伴算法的堆管理，适合一般用途的malloc。管理方式类似Linux伙伴系统，分配2^n个连续页。</li>
<li><strong>mempool（内存池）</strong>：预分配固定大小和数量的内存块，申请/释放为O(1)操作。适合确定用量场景（如固定数的网络连接、固定数的传感器数据缓冲），时间确定性最高，不会失败。</li></ul>
<p><strong>选择：</strong>确定用量→mempool；频繁同大小→slab；通用→memheap。小内存MCU推荐mempool+slab组合避免碎片。</p>`
      },
      {
        id: "rtos-21", tags: ["RT-Thread","进阶"],
        q: "RT-Thread中双向链表rt_list在内核对象管理中的应用？",
        a: `<p><code>rt_list</code>是RT-Thread内核最核心的数据结构，类似Linux内核的<code>list_head</code>。它是一个轻量的双向循环链表，节点仅包含prev和next两个指针。</p>
<p><strong>在内核中的核心应用：</strong></p>
<ul><li><strong>同优先级就绪队列</strong>：每个优先级有一个rt_list链表头，同优先级的线程通过TCB中的tlist节点挂在此链表上。调度器遍历时直接从此链表取下一个就绪线程。</li>
<li><strong>内核对象容器</strong>：所有类型的内核对象（线程/信号量/互斥量/定时器等）都内嵌rt_list节点，插入到对应类型的全局对象容器链表中。通过<code>rt_object_find()</code>按名称和类型查找对象。</li>
<li><strong>定时器管理</strong>：定时器通过rt_list连接在定时器跳表中</li></ul>
<p>通过<code>rt_container_of()</code>宏（类似Linux的container_of），从链表节点指针反推包含它的父结构体。这是C语言面向对象的经典设计模式。</p>`
      },
      {
        id: "rtos-22", tags: ["RT-Thread","进阶"],
        q: "RT-Thread设备驱动框架(rt_device)的设计思想？",
        a: `<p>rt_device是RT-Thread的统一设备模型，所有设备（I2C/SPI/UART/传感器/看门狗等）都继承rt_device基类。核心接口统一：<code>init/open/close/read/write/control</code>，类似Linux的file_operations。</p>
<p><strong>设计思想：</strong></p>
<ul><li><strong>接口归一化</strong>：所有设备通过统一API访问，应用程序不感知底层硬件差异</li>
<li><strong>分层架构</strong>：应用层→设备框架核心→设备驱动层→硬件，每层通过稳定接口通信</li>
<li><strong>对象管理</strong>：设备继承rt_object，通过rt_device_register注册到对象容器</li>
<li><strong>组件化</strong>：传感器框架(Sensor)、音频框架(Audio)等在rt_device之上构建，提供更高级的设备抽象</li></ul>
<pre><code class="language-c">rt_device_t dev = rt_device_find("uart1");
rt_device_open(dev, RT_DEVICE_FLAG_RDWR);
rt_device_read(dev, 0, buf, len);    // 统一接口</code></pre>`
      },
      {
        id: "rtos-23", tags: ["进阶"],
        q: "RT-Thread和FreeRTOS的驱动框架有什么不同？",
        a: `<p><strong>FreeRTOS</strong>没有标准设备驱动框架。每个开发者自行设计驱动接口（直接写寄存器或封装HAL），缺乏统一的标准接口（read/write/ioctl等）。各驱动之间接口风格不一致，移植和复用成本高。</p>
<p><strong>RT-Thread</strong>有完善的rt_device分层驱动框架：</p>
<ul><li>定义标准的6个统一接口（init/open/close/read/write/control）</li>
<li>有大量现成的第三方驱动组件（Sensor框架已支持100+传感器、DFS支持多种文件系统、SAL抽象层支持多种网络协议栈）</li>
<li>驱动可跨MCU平台复用（只需替换底层寄存器操作部分）</li></ul>
<p><strong>开发效率对比：</strong>在RT-Thread上添加一个I2C传感器仅需实现传感器ops并注册到框架；在FreeRTOS上需自己设计整个驱动架构+应用层调用方式。</p>`
      },
      {
        id: "rtos-24", tags: ["高频"],
        q: "如何选择FreeRTOS还是RT-Thread？",
        a: `<table><tr><th>场景</th><th>推荐RTOS</th><th>原因</th></tr>
<tr><td>极简MCU控制（<10KB ROM）</td><td>FreeRTOS</td><td>更精简、认证成熟（ISO26262 ASIL-D）</td></tr>
<tr><td>汽车电子安全关键</td><td>FreeRTOS</td><td>有完整的功能安全认证包SAFERTOS</td></tr>
<tr><td>IoT设备快速开发</td><td>RT-Thread</td><td>内置网络/文件系统/Shell，开箱即用</td></tr>
<tr><td>需要丰富中间件</td><td>RT-Thread</td><td>组件生态完善，开发效率高</td></tr>
<tr><td>国产MCU开发</td><td>RT-Thread</td><td>对国产芯片支持更好</td></tr>
<tr><td>Linux应用迁移到MCU</td><td>RT-Thread</td><td>POSIX兼容性好、有虚拟文件系统</td></tr>
</table>`
      },
      {
        id: "rtos-25", tags: ["RT-Thread"],
        q: "RT-Thread组件生态的优势是什么？Finsh Shell是什么？",
        a: `<p><strong>RT-Thread组件生态包含：</strong></p>
<ul><li><strong>DFS(Device File System)</strong>：支持FAT/LittleFS/NFS/ROMFS等，统一VFS接口，可同时挂载多种文件系统</li>
<li><strong>SAL(Socket Abstraction Layer)</strong>：抽象网络协议栈接口，支持lwIP/AT Socket等，应用程序无感知切换</li>
<li><strong>Finsh Shell</strong>：RT-Thread独有的交互式命令行调试工具。通过串口连接，可输入命令查看系统状态（list_thread/list_sem/list_device/free）、调用任意函数、修改变量值。类似Linux shell，是嵌入式开发调试利器</li>
<li><strong>ulog</strong>：结构化日志系统，支持多后端输出（串口/Flash/网络）</li>
<li><strong>软件包生态</strong>：400+第三方package可通过menuconfig一键集成</li></ul>`
      },
      {
        id: "rtos-26", tags: ["进阶"],
        q: "FreeRTOS和RT-Thread的POSIX兼容性对比？",
        a: `<p><strong>RT-Thread</strong>原生支持POSIX接口：pthread（线程创建/join/mutex/cond）、sem（信号量）、mqueue（POSIX消息队列）、timer（POSIX定时器）。Linux/Unix应用程序可以最小改动直接移植到RT-Thread。这对需要快速将Linux应用迁移到MCU的场景非常有价值。</p>
<p><strong>FreeRTOS</strong>需要通过FreeRTOS-Plus-POSIX附加库提供有限POSIX兼容，功能不如RT-Thread完整，且并非标准发布的一部分。</p>
<p><strong>实际影响：</strong>如果你在Linux上开发过驱动程序或应用层代码，切换到RT-Thread会感觉非常熟悉（open/read/write/ioctl的设备模型、VFS文件操作、Socket编程等都与Linux类似）。</p>`
      },
      {
        id: "rtos-27", tags: ["高频","进阶"],
        q: "优先级天花板(Priority Ceiling)和优先级继承(Priority Inheritance)的区别？",
        a: `<p><strong>优先级继承(Priority Inheritance)：</strong>运行时动态提升。仅在锁被高优先级任务争用时，才将持有者的优先级提升到等待者中的最高优先级。优点：自由度大，锁不争用时无额外开销。缺点：运行开销不确定（依赖争用情况）。FreeRTOS选择此方案。</p>
<p><strong>优先级天花板(Priority Ceiling)：</strong>静态设计。每个锁在创建时预定义一个天花板优先级（所有可能获取该锁的任务中的最高优先级+1）。任务获取锁时<strong>立即</strong>被提升到天花板优先级。优点：时间确定性高（不考虑争用动态），防死锁能力强。缺点：即使无争用也会提升，开销较大。</p>
<p><strong>选择：</strong>汽车/航空等安全关键系统推荐优先级天花板（确定性+防死锁）；一般系统推荐优先级继承（效率+灵活）。</p>`
      },
      {
        id: "rtos-28", tags: ["进阶"],
        q: "银行家算法原理？",
        a: `<p>银行家算法是Dijkstra提出的死锁避免算法，通过预判资源分配后系统是否处于"安全状态"来决定是否分配。</p>
<p><strong>核心数据结构：</strong>Available（系统剩余资源）、Max（每个进程的最大需求）、Allocation（每个进程已分配）、Need（每个进程还需=Max-Allocation）。</p>
<p><strong>安全状态判定：</strong>存在一个进程序列，使得系统能依次满足各进程的最大需求并回收资源，最终所有进程都能完成→安全状态→可以分配；否则→不安全→拒绝分配。</p>
<p><strong>在嵌入式RTOS中的应用：</strong>由于嵌入式系统资源有限且使用模式通常可预知（任务数量、资源需求在设计阶段已知），可通过静态分析验证死锁不存在的可能性，而不必在运行时执行银行家算法。银行家算法本身O(m×n²)的计算开销在MCU上难以接受。</p>`
      },
      {
        id: "rtos-29", tags: ["FreeRTOS","基础"],
        q: "FreeRTOS任务状态有哪几种？如何互相转换？",
        a: `<p><strong>四种任务状态：</strong></p>
<ul><li><strong>Running（运行态）</strong>：当前正在CPU上执行的任务，同一时刻仅一个</li>
<li><strong>Ready（就绪态）</strong>：已就绪等待调度器分配CPU，挂在该优先级就绪链表上</li>
<li><strong>Blocked（阻塞态）</strong>：等待事件（延时到期/信号量/队列/任务通知），挂在该事件的等待列表上</li>
<li><strong>Suspended（挂起态）</strong>：被vTaskSuspend()挂起，不参与调度，需vTaskResume()恢复</li></ul>
<p><strong>状态转换：</strong>Running↔Ready（调度切换）；Running→Blocked（vTaskDelay/等待信号量）；Blocked→Ready（延时到/信号量获取成功）；Running/Ready→Suspended（vTaskSuspend）；Suspended→Ready（vTaskResume）。Suspended是"冻结"状态，不占用CPU也不响应事件。</p>`
      },
      {
        id: "rtos-30", tags: ["FreeRTOS"],
        q: "configTICK_RATE_HZ的作用？如何选择合适的值？",
        a: `<p>定义SysTick定时器频率（ticks per second），决定RTOS的时间分辨率。一个tick的时间=1/configTICK_RATE_HZ。</p>
<p><strong>影响：</strong></p>
<ul><li>值越大→时间分辨率越高（vTaskDelay更精确）、定时器更准</li>
<li>值越大→tick中断更频繁→上下文切换开销增大→CPU被tick中断占用更多</li></ul>
<p><strong>典型选择：</strong>1000Hz（1ms分辨率）——通用应用首选，平衡精度和开销；100Hz（10ms）——低功耗应用；10kHz——高精度控制（电机/开关电源）。需根据系统实时性要求和功耗预算权衡选择。</p>`
      },
      {
        id: "rtos-31", tags: ["FreeRTOS","进阶"],
        q: "FreeRTOS tickless低功耗模式如何工作？",
        a: `<p>当所有任务都处于阻塞态时，没有必要继续运行SysTick（白白消耗功耗）。tickless模式在空闲时停止SysTick，让MCU进入深度睡眠，由外部事件（如RTC闹钟、外部中断）唤醒。</p>
<p><strong>工作原理：</strong></p>
<ol><li>进入idle时计算下一个任务的唤醒时间（最早到期延时）</li><li>停止SysTick，配置低功耗定时器（如LPTIM）到唤醒时间</li><li>MCU进入STOP/STANDBY模式</li><li>低功耗定时器到期或外部事件→唤醒MCU</li><li>补偿tick计数（补偿休眠期间的tick数）</li><li>调度器恢复正常运行</li></ol>
<p>configUSE_TICKLESS_IDLE=1启用。需要硬件低功耗定时器支持，且补偿逻辑需考虑唤醒后的启动延迟。</p>`
      },
      {
        id: "rtos-32", tags: ["FreeRTOS"],
        q: "抢占式调度和时间片轮转的适用场景？",
        a: `<p><strong>抢占式调度</strong>：适合实时性要求不同的多任务系统。高优先级任务（电机控制/通信协议栈处理）必须立即响应→抢占当前任务。关键任务优先级高于非关键任务，保证确定性响应。</p>
<p><strong>时间片轮转</strong>：适合同等重要的后台任务（多个同等优先级的日志/显示/状态上报任务）公平分享CPU。每个任务轮流运行一个时间片。</p>
<p><strong>实际组合使用：</strong>关键任务分配不同高优先级→抢占式；非关键后台任务分配同一低优先级→时间片轮转。FreeRTOS需configUSE_TIME_SLICING=1启用时间片，时间片长度=1个tick。</p>`
      },
      {
        id: "rtos-33", tags: ["FreeRTOS","进阶"],
        q: "FreeRTOS中如何估算任务栈空间大小？",
        a: `<p><strong>静态估算：</strong></p>
<ul><li>局部变量总和（各函数调用栈帧中局部变量累加的最大值）</li>
<li>函数嵌套调用深度×每层框架开销（ARM Cortex-M约16-64字节/层，取决于保存哪些寄存器）</li>
<li>中断嵌套预留：每个优先级可能嵌套的中断×ISR栈帧（Cortex-M自动压栈: 8个寄存器=32字节+ISR内部局部变量）</li>
<li>上下文保存帧：Cortex-M自动压栈(R0-R3,R12,LR,PC,xPSR)=32字节</li></ul>
<p><strong>动态测试（推荐）：</strong>先用大栈（如1024字）→长时间运行→uxTaskGetStackHighWaterMark()获取最小剩余栈→实际用量=总栈-剩余栈。然后设置栈为实际用量的1.5-2倍。用configCHECK_FOR_STACK_OVERFLOW=2检测栈溢出。</p>`
      },
      {
        id: "rtos-34", tags: ["FreeRTOS","进阶"],
        q: "FreeRTOS中上下文切换具体做了哪些事情？",
        a: `<p>Cortex-M上利用PendSV异常实现任务切换，充分利用了ARM的硬件自动压栈机制：</p>
<ol><li><strong>触发PendSV异常</strong>：当前任务自动硬件压栈（R0,R1,R2,R3,R12,LR,PC,xPSR）到当前任务栈</li>
<li><strong>PendSV ISR</strong>：手动压栈R4-R11（16个寄存器中的后8个），保存当前任务栈指针(PSP)到TCB</li>
<li><strong>选择新任务</strong>：调度器就绪链表选择最高优先级任务</li>
<li><strong>从新任务TCB恢复栈指针(PSP)</strong></li>
<li><strong>手动出栈</strong>R4-R11</li>
<li><strong>异常返回</strong>：硬件自动出栈R0,R1,R2,R3,R12,LR,PC,xPSR→新任务开始运行</li></ol>
<p>整个过程充分利用了Cortex-M双栈(MSP/PSP)和自动入栈出栈机制，效率极高（典型30-100个CPU周期）。</p>`
      },
      {
        id: "rtos-35", tags: ["FreeRTOS","进阶"],
        q: "SysTick中断和PendSV中断在FreeRTOS调度中各起什么作用？",
        a: `<p><strong>分工设计——两个中断各司其职：</strong></p>
<ul><li><strong>SysTick（系统节拍中断，优先级配置为较高）</strong>：提供系统心跳。每次tick中断做的事：(1)递增系统tick计数器 (2)检查是否有任务延时到期→到期则移至就绪链表 (3)检查是否需要任务切换（是否有更高优先级任务就绪）。如果需要切换，不直接切换，而是<strong>设置PendSV pending位</strong>后退出。</li>
<li><strong>PendSV（可挂起系统调用，优先级配置为最低）</strong>：<strong>执行实际的任务上下文切换</strong>。因为优先级最低，确保在所有其他ISR都处理完毕后才执行切换，不会中断正在运行的ISR。利用Cortex-M尾链优化，直接链接到异常返回。</li></ul>
<p>这种设计使任务切换永远不会在ISR中间发生（避免ISR被任务切换打断），同时利用了ARM的硬件效率。</p>`
      }
    ]
  },
  {
    id: "linux", name: "Linux嵌入式开发", icon: "🐧",
    questions: [
      {
        id: "lx-1", tags: ["高频","Linux"],
        q: "嵌入式Linux的完整启动流程是怎样的？",
        a: `<ol><li><strong>BootROM（固化在SoC内部）</strong>：上电执行第一条指令，初始化CPU和关键外设（如DRAM控制器），从启动介质（eMMC/SD/NAND）加载Uboot SPL到SRAM</li>
<li><strong>Uboot SPL</strong>：初始化DRAM→加载Full Uboot到DRAM</li>
<li><strong>Full Uboot</strong>：初始化更多外设（网口/存储/显示）、加载Linux内核zImage和DTB到DRAM、设置bootargs参数、跳转到内核入口</li>
<li><strong>Linux内核</strong>：解压→start_kernel()→架构初始化(setup_arch)→内存初始化→调度器初始化→创建init进程→挂载rootfs→执行/sbin/init</li>
<li><strong>用户空间Init</strong>：/sbin/init（BusyBox或Systemd）读取inittab→运行启动脚本→启动各服务进程→到达登录提示</li></ol>`
      },
      {
        id: "lx-2", tags: ["Linux","进阶"],
        q: "U-Boot的主要功能和启动阶段？",
        a: `<p><strong>U-Boot分为两阶段：</strong></p>
<ul><li><strong>SPL（Secondary Program Loader）</strong>：在SRAM中运行（因为DRAM尚未初始化），核心职责是初始化DRAM控制器→DDR training→DRAM可用→加载Full Uboot到DRAM。代码极简（<16KB）。</li>
<li><strong>Full U-Boot</strong>：在DRAM中运行，功能完整：硬件初始化（网口/存储/显示）、从多种介质加载内核（eMMC/SD/NAND/USB/TFTP）、提供U-Boot Shell交互（printenv/setenv/saveenv/mw/fatload）、支持设备树加载和bootargs参数传递。</li></ul>
<p>U-Boot通过<code>bootcmd</code>环境变量定义默认启动命令链，通过<code>bootargs</code>向内核传递<code>console=/ root=/ init=</code>等关键参数。</p>`
      },
      {
        id: "lx-3", tags: ["Linux","高频"],
        q: "Linux内核的启动过程经历了哪些关键步骤？",
        a: `<ol><li><strong>start_kernel()</strong>（C语言入口）：输出"Linux version..."</li>
<li><strong>setup_arch()</strong>：架构相关初始化（页表、MMU、中断控制器GIC）</li>
<li><strong>mm_init()</strong>：内存管理初始化（伙伴系统+slab分配器）</li>
<li><strong>sched_init()</strong>：调度器初始化（CFS调度类）</li>
<li><strong>rest_init()</strong>：创建内核线程kernel_init（PID=1）和kthreadd（PID=2）</li>
<li><strong>kernel_init→do_basic_setup()</strong>：加载内置驱动模块→解析设备树→probe设备→挂载rootfs→执行init程序</li></ol>
<p>内核参数通过/proc/cmdline传递（即U-Boot的bootargs），设备树dtb由U-Boot加载后传给内核物理地址。</p>`
      },
      {
        id: "lx-4", tags: ["高频","Linux"],
        q: "用户态和内核态有什么区别？如何切换？",
        a: `<p><strong>核心区别：</strong></p>
<ul><li><strong>CPU特权级</strong>：内核态（ARM SVC模式/EL1）可执行特权指令（修改系统寄存器、配置MMU/MPU）、访问所有内存和设备；用户态（ARM USR模式/EL0）受限，不能直接访问硬件（必须通过系统调用）。</li>
<li><strong>栈</strong>：内核态有独立的内核栈（通常8KB/16KB per task），用户态用用户栈</li>
<li><strong>虚拟地址空间</strong>：32位ARM Linux用户空间0-3GB，内核空间3-4GB（共享内核页表映射）</li></ul>
<p><strong>切换方式：</strong></p>
<ul><li>系统调用（SVC/SWI指令）→主动请求内核服务</li>
<li>硬件中断→自动切到内核态处理ISR</li>
<li>异常（缺页/未定义指令等）→内核异常处理</li></ul>
<p>每次切换有固定开销：模式切换+寄存器保存恢复+安全检查（copy_from_user验证用户指针合法性）。</p>`
      },
      {
        id: "lx-5", tags: ["Linux","进阶"],
        q: "系统调用的实现原理？从用户调用open()到内核执行经历了什么？",
        a: `<ol><li>应用程序调用glibc封装的<code>open()</code></li>
<li>glibc将系统调用号（__NR_openat，ARM32=322，AArch64=56）放入R7/X8寄存器，参数放入R0-R5/X0-X5</li>
<li>执行<code>SVC #0</code>（ARM32）或<code>SVC #0</code>（AArch64）→CPU切换到特权模式→跳转到异常向量表的SVC入口</li>
<li>内核SVC处理：保存用户态寄存器→查sys_call_table数组[调用号]→获取sys_openat函数指针→调用</li>
<li>sys_openat：解析路径名→查找目录项→权限检查→创建file结构体→分配文件描述符→返回fd</li>
<li>异常返回→恢复用户态寄存器→返回用户态，R0为fd</li></ol>
<p><code>strace ./app</code>可追踪程序调用的所有系统调用，是调试利器。</p>`
      },
      {
        id: "lx-6", tags: ["高频","Linux"],
        q: "Linux进程间通信(IPC)方式及对比？",
        a: `<table><tr><th>方式</th><th>特点</th><th>适用场景</th></tr>
<tr><td>管道(pipe)</td><td>单向、仅父子进程、简单</td><td>shell管道(|)串联命令</td></tr>
<tr><td>命名管道(FIFO)</td><td>双向/任意进程、文件系统可见</td><td>无亲缘进程通信</td></tr>
<tr><td>共享内存(shm)</td><td>最快（零拷贝）、需配合同步</td><td>大数据量高频通信</td></tr>
<tr><td>消息队列(msgq)</td><td>消息边界清晰、内核维护、有大小限制</td><td>结构化消息传递</td></tr>
<tr><td>信号量(sem)</td><td>进程间同步/资源计数</td><td>配合共享内存使用</td></tr>
<tr><td>信号(signal)</td><td>异步通知、信息量少(仅信号编号)</td><td>SIGTERM优雅退出、SIGCHLD子进程通知</td></tr>
<tr><td>Socket</td><td>跨网络/本机、灵活、协议无关</td><td>网络通信、C/S架构</td></tr></table>
<p>嵌入式Linux中常用：共享内存（大数据） + Socket（跨设备通信） + 信号（进程管理）。</p>`
      },
      {
        id: "lx-7", tags: ["高频","Linux"],
        q: "Linux字符设备驱动的框架是怎样的？关键接口有哪些？",
        a: `<p><strong>字符设备驱动核心三件套：</strong></p>
<ul><li><strong>cdev结构体</strong>：表示一个字符设备，记录设备号(dev_t)和file_operations</li>
<li><strong>file_operations</strong>：函数指针表，包含open/release/read/write/unlocked_ioctl/compat_ioctl/mmap/llseek等接口</li>
<li><strong>设备号</strong>：主设备号(12bit)+次设备号(20bit)，通过alloc_chrdev_region注册</li></ul>
<p><strong>开发流程：</strong>alloc_chrdev_region→cdev_init(cdev, fops)→cdev_add→class_create+device_create（创建设备节点/dev/xxx）→实现各fops接口。</p>
<p><strong>数据交换：</strong>copy_to_user/copy_from_user在用户空间和内核空间之间拷贝数据（带权限安全校验）。简单驱动可用ioremap映射硬件寄存器，通过read/write ioctl访问。</p>`
      },
      {
        id: "lx-8", tags: ["高频","Linux"],
        q: "设备树(Device Tree)的作用和基本结构？",
        a: `<p><strong>设备树(.dts文件)描述硬件拓扑信息</strong>，替代Linux 2.6时代硬编码的board文件，实现内核代码与硬件描述的解耦。同一份内核镜像配合不同.dtb可运行在不同硬件板上。</p>
<p><strong>结构：</strong></p>
<ul><li>根节点"/"：包含#address-cells, #size-cells等全局属性</li>
<li>子节点按总线层级排列：cpu/soc/i2c@xxxx/spi@xxxx等</li>
<li>关键属性：compatible（字符串，用于驱动匹配，如"arm,pl011"→匹配pl011驱动）、reg（寄存器基地址+大小）、interrupts（中断号+触发类型）、clocks（时钟源）</li>
<li>aliases节点：给设备号起别名（如serial0=&uart1）</li>
<li>chosen节点：传递启动参数（bootargs/initrd地址）</li></ul>
<p>dtc工具编译.dts→.dtb（二进制），U-Boot加载dtb地址传给内核。</p>`
      },
      {
        id: "lx-9", tags: ["高频","Linux","进阶"],
        q: "select/poll/epoll的区别和底层实现？",
        a: `<table><tr><th>特性</th><th>select</th><th>poll</th><th>epoll</th></tr>
<tr><td>fd数量</td><td>FD_SETSIZE=1024（bitmap限制）</td><td>无限制（链表）</td><td>无限制（红黑树）</td></tr>
<tr><td>复杂度</td><td>O(n) 每次遍历所有fd</td><td>O(n) 遍历所有fd</td><td>O(1) 仅取就绪fd</td></tr>
<tr><td>内核开销</td><td>每次全量拷贝fd_set到内核</td><td>每次拷贝pollfd结构数组</td><td>红黑树存所有fd仅watch一次</td></tr>
<tr><td>触发方式</td><td>水平触发(LT)</td><td>水平触发(LT)</td><td>水平触发(LT)+边沿触发(ET)</td></tr></table>
<p><strong>epoll为何快：</strong>epoll_create创建eventpoll对象（含红黑树存所有监听fd+就绪链表存活跃fd）。epoll_ctl将fd加入红黑树（一次）。epoll_wait只需从就绪链表取事件O(1)。适合万级高并发。</p>`
      },
      {
        id: "lx-10", tags: ["高频","Linux","进阶"],
        q: "什么是零拷贝(Zero Copy)？Linux中如何实现？",
        a: `<p><strong>传统I/O需要4次拷贝</strong>：磁盘→内核PageCache（DMA拷贝）→用户buffer（CPU拷贝）→内核Socket buffer（CPU拷贝）→网卡（DMA拷贝）。CPU参与了2次内存拷贝。</p>
<p><strong>零拷贝减少CPU参与：</strong></p>
<ul><li><strong>sendfile()</strong>：文件描述符→Socket描述符，数据从PageCache→Socket buffer（通过DMA scatter-gather，不经过用户空间，Linux 2.4+完全零拷贝）</li>
<li><strong>splice()</strong>：在两个文件描述符之间建立管道，零拷贝传输数据</li>
<li><strong>mmap+write</strong>：文件映射到用户空间（减少一次从内核到用户的拷贝），仅比完全零拷贝多一次CPU拷贝</li></ul>
<p><strong>嵌入式应用：</strong>视频流传输（摄像头→网络流）、日志文件转发（文件→Socket）、OTA升级包传输。零拷贝在高数据吞吐场景可显著降低CPU占用。</p>`
      },
      {
        id: "lx-11", tags: ["Linux","进阶"],
        q: "Linux内存管理中伙伴系统(Buddy)和slab分配器各自的作用？",
        a: `<p><strong>伙伴系统：</strong>管理物理页框分配（最小单位4KB）。使用2^n个连续页的伙伴算法，分配时找最小能容纳的块，释放时检查相邻伙伴是否空闲→合并为更大块。解决外部碎片问题。位于内核内存管理最底层。</p>
<p><strong>Slab分配器：</strong>建立在伙伴系统之上，缓存内核中常用的固定大小对象（如task_struct、inode、dentry）。预先从伙伴系统申请大块内存（slab），切分为固定大小的object。分配/释放为O(1)且内部碎片极少。避免频繁页分配和释放的开销。</p>
<p><strong>调用链：</strong>kmalloc(小对象)→slab→buddy→页分配器；kmalloc(大对象，超过8KB)→buddy→页分配器。嵌入式内核中，slab的缓存行对齐和着色(Cache Coloring)对性能影响显著。</p>`
      },
      {
        id: "lx-12", tags: ["Linux","进阶"],
        q: "Linux进程虚拟地址空间是如何布局的？",
        a: `<pre><code class="language-c">低地址 ┌────────────┐ 0x00000000
       │   .text    │ 代码段（只读，共享库可共享此段）
       │  .rodata   │ 只读数据（const/字符串）
       │   .data    │ 已初始化全局变量
       │   .bss     │ 未初始化全局变量（启动清零）
       ├────────────┤
       │   Heap     │ 堆(brk/sbrk，向上增长)
       │     ↓     │
       │  ...空闲... │
       │     ↑     │
       │   mmap     │ 动态库.so / mmap映射区
       │     ↓     │
       │  ...空闲... │
       │     ↑     │
       │   Stack    │ 栈(向下增长)
       ├────────────┤
       │  内核空间   │ ARM32: 3GB-4GB (固定映射)
高地址 └────────────┘</code></pre>
<p>每个进程有独立的页表（PGD），虚拟地址→物理地址通过多级页表（PGD→PMD→PTE）转换。通过cat /proc/PID/maps查看进程内存映射。</p>`
      },
      {
        id: "lx-13", tags: ["Linux","进阶"],
        q: "Linux内核自旋锁、互斥体、信号量的使用场景对比？",
        a: `<table><tr><th>锁类型</th><th>等待方式</th><th>适用场景</th><th>注意</th></tr>
<tr><td>spinlock</td><td>忙等待（自旋，不睡眠）</td><td>极短临界区、中断上下文、SMP多核</td><td>持有期间禁止睡眠/调度</td></tr>
<tr><td>mutex</td><td>睡眠阻塞</td><td>较长临界区、进程上下文</td><td>有所有者、支持优先级继承(PI)</td></tr>
<tr><td>semaphore</td><td>睡眠阻塞（多持有者）</td><td>资源池管理（允许N个同时持有）</td><td>计数型、无所有权</td></tr>
</table>
<p><strong>嵌入式驱动选择口诀：</strong>中断上下文→spinlock；进程上下文且短→spinlock（高效）；进程上下文且可能阻塞→mutex；管理多个相同资源→semaphore。永远不要在用spinlock保护的区域内调用可能睡眠的函数。</p>`
      },
      {
        id: "lx-14", tags: ["Linux","基础"],
        q: "printk的日志级别？/proc/sys/kernel/printk四个值的含义？",
        a: `<p><strong>printk日志级别（从紧急到调试）：</strong></p>
<ol start="0"><li>KERN_EMERG（系统崩溃）</li><li>KERN_ALERT（立即处理）</li>
<li>KERN_CRIT（临界条件）</li><li>KERN_ERR（错误）</li>
<li>KERN_WARNING（警告）</li><li>KERN_NOTICE（正常但值得注意）</li>
<li>KERN_INFO（信息）</li><li>KERN_DEBUG（调试信息）</li></ol>
<p>/proc/sys/kernel/printk四个值：console_loglevel（控制台输出阈值，低于等于此级别的消息输出到控制台）、default_message_loglevel（未指定级别的printk默认使用的级别）、minimum_console_loglevel、default_console_loglevel。<code>echo 8 > /proc/sys/kernel/printk</code>可显示所有调试输出。dmesg查看内核日志。</p>`
      },
      {
        id: "lx-15", tags: ["Linux","进阶"],
        q: "Linux VFS如何实现多态/面向对象设计？",
        a: `<p>VFS是C语言实现面向对象设计的经典范例。</p>
<p><strong>核心设计：</strong></p>
<ul><li><strong>基类接口</strong>：定义struct file_operations（read/write/open等函数指针）、struct inode_operations、struct super_operations等统一操作接口</li>
<li><strong>多态实现</strong>：每个具体文件系统（ext4/fat/proc/sysfs）实现各自的file_operations实例。open()根据文件路径找到对应文件系统的inode→inode->i_fop指向该文件系统的ops→后续read/write通过函数指针自动调用正确的实现</li>
<li><strong>继承关系</strong>：struct inode包含struct file_operations *i_fop，实现"一个inode绑定自己类型的操作"</li></ul>
<p>这就是"策略与机制分离"的体现：VFS定义了统一的文件操作框架（机制），各文件系统提供具体实现（策略）。应用层代码不感知底层文件系统差异。</p>`
      }
    ]
  },
  {
    id: "hardware", name: "硬件与外设", icon: "🔌",
    questions: [
      {
        id: "hw-1", tags: ["高频","硬件"],
        q: "STM32的GPIO有哪几种工作模式？上拉/下拉电阻的作用？",
        a: `<p><strong>8种模式：</strong>输入浮空、输入上拉、输入下拉、模拟输入、推挽输出、开漏输出、复用推挽、复用开漏。</p>
<p><strong>上拉电阻</strong>（约40kΩ内部）：默认拉高电平，防止引脚悬空时电平不确定（悬空引脚会因电磁干扰产生随机翻转，导致CMOS电路额外功耗）。按键检测常用输入上拉模式（按下时读低电平）。</p>
<p><strong>下拉电阻</strong>：默认拉低电平。推挽输出可输出强高/低电平（PMOS+NMOS轮流导通），驱动能力强但多个推挽输出不能并联。开漏输出只有NMOS下拉，高电平需要外部上拉电阻，支持线与逻辑（多个开漏输出可并联在一条线上，如I2C总线）。</p>`
      },
      {
        id: "hw-2", tags: ["高频","硬件"],
        q: "STM32中断处理流程？NVIC优先级分组是什么？",
        a: `<p><strong>流程：</strong>外设产生中断信号→NVIC判断优先级（是否高于当前运行的中断）→若更高优先级则接受→当前执行流被打断→硬件自动压栈（R0-R3,R12,LR,PC,xPSR）→查向量表找到ISR地址→跳转ISR→执行ISR→异常返回（硬件自动出栈恢复现场）。</p>
<p><strong>NVIC优先级分组</strong>将8位优先级寄存器分为两部分：抢占优先级（Preempt Priority）高位和子优先级（Sub Priority）低位。抢占优先级高的中断可以打断抢占优先级低的中断（嵌套）；同抢占优先级的不同子优先级只决定同时pending时的响应顺序，不嵌套。分组通过SCB->AIRCR的PRIGROUP配置，如NVIC_PriorityGroup_2（6位抢占+2位子优先级）。</p>`
      },
      {
        id: "hw-3", tags: ["高频","硬件"],
        q: "DMA(Direct Memory Access)的工作原理和优势？",
        a: `<p>DMA允许外设与内存之间绕过CPU直接传输数据。</p>
<p><strong>工作流程：</strong>CPU配置DMA控制器（源地址/目标地址/传输字节数/每次传输后的地址增量/触发源）→使能DMA通道→外设产生DMA请求（如UART收到数据/UART发送缓冲区空）→DMA控制器接管总线→在总线空闲周期完成一次数据传输→传输完成→DMA产生完成中断通知CPU。传输过程中CPU可并行执行其他任务或休眠。</p>
<p><strong>优势：</strong></p>
<ul><li>释放CPU（CPU可并行做计算，而非等待每次字节传输）</li><li>更高吞吐率（DMA突发传输更高效，每个总线周期传一个word）</li>
<li>更低功耗（CPU可休眠，DMA+DMA事件唤醒机制）</li><li>适合大数据块传输（ADC连续采样→DMA→内存缓冲区；SPI Flash读取→DMA→内存）</li></ul>`
      },
      {
        id: "hw-4", tags: ["高频","硬件"],
        q: "SPI、I2C、UART三种协议如何对比选择？",
        a: `<table><tr><th>特性</th><th>SPI</th><th>I2C</th><th>UART</th></tr>
<tr><td>线数</td><td>4线(SCK/MOSI/MISO/CS)</td><td>2线(SCL/SDA)</td><td>2线(TX/RX)+GND</td></tr>
<tr><td>全/半双工</td><td>全双工</td><td>半双工</td><td>全双工</td></tr>
<tr><td>速率</td><td>高速(>10MHz)</td><td>100k/400k/1MHz</td><td>~115200bps(最快~几Mbps)</td></tr>
<tr><td>寻址</td><td>无（片选CS线选择设备）</td><td>7位/10位地址</td><td>无（点对点）</td></tr>
<tr><td>设备数量</td><td>受CS线数限制</td><td>最多127设备(7位地址)</td><td>仅2设备点对点</td></tr>
<tr><td>典型应用</td><td>Flash/SD卡/LCD</td><td>传感器/EEPROM/RTC</td><td>调试/蓝牙/GPS/串口屏</td></tr>
</table>
<p>SPI选高速大数据量（Flash/LCD），I2C选址多低速管理（板上传感器），UART选简单点对点通信（调试/模块连接）。</p>`
      },
      {
        id: "hw-5", tags: ["硬件"],
        q: "ADC的主要性能参数有哪些？",
        a: `<p><strong>关键参数：</strong></p>
<ul><li><strong>分辨率(Resolution)</strong>：用bit表示（如12bit→4096级），决定最小可分辨的电压变化</li>
<li><strong>采样率(Sampling Rate)</strong>：每秒转换次数（sps），受转换时间和建立时间限制。SAR ADC的转换时间≈每位一个时钟周期+采样时间</li>
<li><strong>精度</strong>：INL(积分非线性)和DNL(微分非线性)描述真实转换曲线与理想曲线的偏差。DNL>1 LSB会导致丢码</li>
<li><strong>参考电压(Vref)</strong>：输入范围0~Vref，精度直接影响ADC精度</li>
<li><strong>量化误差</strong>：±0.5 LSB的理论误差</li></ul>
<p>奈奎斯特定理要求采样率≥2×信号带宽。高分辨率ADC通常需要更低采样率（逐次逼近型每bit需要一个时钟周期）。</p>`
      },
      {
        id: "hw-6", tags: ["硬件"],
        q: "PWM的工作原理和主要应用？频率和占空比由什么决定？",
        a: `<p><strong>PWM生成：</strong>定时器计数器从0递增计数→与比较寄存器(CCR)比较→计数值<CCR时输出高（或低，取决于极性配置）→≥CCR时输出低→到达自动重装载值(ARR)后归零重新开始。</p>
<p><strong>频率公式：</strong>f_PWM = f_clk / (PSC+1) / (ARR+1)。PSC是预分频器，ARR是自动重装载值（决定周期）。<strong>占空比：</strong>duty = CCR / (ARR+1)。</p>
<p><strong>应用：</strong></p>
<ul><li>LED调光（改变占空比→人眼积分感知为亮度变化）</li>
<li>舵机控制（0.5-2.5ms高电平脉宽对应0-180°位置）</li>
<li>电机速度控制（PWM+MOSFET驱动电机→占空比控制平均电压→转速）</li>
<li>配合RC低通滤波生成模拟电压（DAC功能）</li></ul>`
      },
      {
        id: "hw-7", tags: ["硬件","进阶"],
        q: "独立看门狗(IWDG)和窗口看门狗(WWDG)的区别？",
        a: `<table><tr><th>特性</th><th>IWDG</th><th>WWDG</th></tr>
<tr><td>时钟源</td><td>LSI（内部40kHz，不精确）</td><td>APB1（精确）</td></tr>
<tr><td>电源域</td><td>独立电源域（主电源掉电仍工作）</td><td>与APB1同电源域</td></tr>
<tr><td>喂狗窗口</td><td>仅上限（不能超过）</td><td>上限+下限（必须在窗口内喂）</td></tr>
<tr><td>典型超时</td><td>几ms~几s</td><td>几十μs~几ms</td></tr>
<tr><td>应用</td><td>基础防跑飞保护</td><td>精确程序时序监控</td></tr></table>
<p>WWDG的窗口机制可检测"喂得太快"（程序异常跳过某些步骤导致过快喂狗），提供更精确的异常检测。IWDG使用独立时钟（即使主时钟停振），提供最底层的安全网。</p>`
      },
      {
        id: "hw-8", tags: ["硬件","基础"],
        q: "Flash和EEPROM有什么区别？",
        a: `<table><tr><th>特性</th><th>Flash</th><th>EEPROM</th></tr>
<tr><td>擦除粒度</td><td>块/扇区（KB级），按字节写但必须按块擦</td><td>字节级（单个字节可独立擦写）</td></tr>
<tr><td>擦写寿命</td><td>1万~10万次</td><td>100万次以上</td></tr>
<tr><td>容量</td><td>MB~GB级</td><td>KB级（通常几KB~1MB）</td></tr>
<tr><td>成本/容量比</td><td>低</td><td>高</td></tr>
<tr><td>应用</td><td>代码存储+大数据</td><td>频繁修改的小配置参数</td></tr></table>
<p>对于频繁修改的配置参数（序列号/校准值/计数器），EEPROM更合适或使用Flash模拟EEPROM（在Flash中划一块区域用磨损均衡算法管理）。Flash每次写前必须先擦除整个扇区，不适合频繁单字节更新。</p>`
      },
      {
        id: "hw-9", tags: ["硬件"],
        q: "STM32的启动模式有哪几种？Bootloader是什么？",
        a: `<p><strong>三种启动模式（BOOT0/BOOT1引脚选择）：</strong></p>
<ul><li><strong>Flash启动(BOOT0=0)</strong>：0x08000000映射到0x00000000，执行用户程序。正常使用模式。</li>
<li><strong>System Memory启动(BOOT0=1,BOOT1=0)</strong>：0x1FFF0000映射到0x00000000，运行ST固化Bootloader。支持串口(USART1/USART3/DFU/I2C/SPI)下载程序(ISP)。</li>
<li><strong>SRAM启动(BOOT0=1,BOOT1=1)</strong>：0x20000000映射，调试用。</li></ul>
<p>启动时硬件取0x00000000处的MSP值→0x00000004处的PC(Reset_Handler)→跳转。芯片内部硬件会根据BOOT引脚将不同存储器映射到0x00000000，实现"硬件级别重映射"。</p>`
      },
      {
        id: "hw-10", tags: ["硬件","进阶"],
        q: "中断向量表的作用是什么？可以重定位吗？",
        a: `<p><strong>中断向量表</strong>存储所有异常/中断的入口地址（函数指针）。Cortex-M上电后硬件自动：</p>
<ol><li>从地址0x00000000读取32位→初始MSP值</li>
<li>从地址0x00000004读取32位→PC初始值（Reset_Handler地址）</li></ol>
<p>向量表默认在Flash起始(0x08000000)。可通过SCB->VTOR寄存器重映射到SRAM(0x20000000)，实现运行中动态修改向量表。</p>
<p><strong>重定位应用场景：</strong></p>
<ul><li>Bootloader+IAP：Bootloader在Flash首部有自己的向量表，跳转后App在另一起始地址有自己的向量表，通过VTOR切换</li>
<li>OTADual-bank：升级时动态切换向量表指向新固件</li></ul>`
      },
      {
        id: "hw-11", tags: ["硬件","进阶"],
        q: "什么是中断嵌套？如何配置？",
        a: `<p><strong>中断嵌套</strong>：高抢占优先级的中断可以打断正在执行的低抢占优先级ISR。Cortex-M NVIC通过抢占优先级实现此机制。</p>
<p><strong>配置：</strong>NVIC_PriorityGroupConfig设置优先级分组→NVIC_InitStructure.NVIC_IRQChannelPreemptionPriority设置抢占优先级→同抢占优先级间按子优先级排序。高抢占优先级可以在低抢占优先级ISR执行期间抢占CPU（硬件自动压栈当前ISR的上下文→执行高优先级ISR→异常返回时恢复低优先级ISR）。</p>
<p><strong>注意：</strong>嵌套层数受栈深度限制（每层嵌套消耗栈空间）。M3/M4支持尾链优化：退出一个ISR时如果下一个ISR已pending，直接链入下一个ISR而不经过额外的出栈+入栈。</p>`
      },
      {
        id: "hw-12", tags: ["高频","硬件"],
        q: "推挽输出和开漏输出的区别和应用场景？",
        a: `<p><strong>推挽输出：</strong>两个MOS管（PMOS上拉+NMOS下拉）轮流导通。高电平时PMOS导通输出强高电平；低电平时NMOS导通输出强低电平。驱动能力强（通常±20mA），适合驱动LED/继电器/普通IO。缺点：多个推挽输出不能并联（不同电平时会短路）。</p>
<p><strong>开漏输出：</strong>只有NMOS下拉管，高电平时NMOS截止→引脚高阻态（浮空），需要通过外部上拉电阻实现高电平。优点：多个开漏输出可以并联在一起（线与逻辑），任意一个拉低总线就变低，用于I2C总线的SDA/SCL。可通过上拉电阻将输出电平拉到不同电压域实现电平转换。</p>`
      },
      {
        id: "hw-13", tags: ["硬件","进阶"],
        q: "定时器输入捕获和输出比较分别用于什么场景？",
        a: `<p><strong>输入捕获：</strong>检测外部信号边沿（上升/下降/双边沿）→锁存当前计数器值到CCR寄存器。两次捕获值相减得到脉冲宽度或周期。应用：测量PWM信号的频率/占空比、超声波传感器测距（测量回波脉冲宽度）、编码器转速测量、电容触摸检测（测充放电时间）。</p>
<p><strong>输出比较：</strong>计数器值与CCR比较→匹配时触发指定动作（翻转/置高/置低/产生中断/DMA请求）。应用：产生任意时序波形、步进电机脉冲序列控制、定时触发ADC采样、音乐蜂鸣器频率控制。</p>
<p>两者都是定时器的高级功能，输入捕获面向"测量"需求，输出比较面向"生成"需求。</p>`
      },
      {
        id: "hw-14", tags: ["硬件","进阶"],
        q: "常见的硬件抗干扰和可靠性设计措施？",
        a: `<ul>
<li><strong>电源滤波</strong>：每个IC电源引脚旁接0.1μF+10μF去耦电容（滤高频+中低频），电源入口加TVS管防浪涌</li>
<li><strong>信号隔离</strong>：光耦（低速隔离）、数字隔离器（SI864x高速）、隔离DC-DC电源模块（电气隔离）</li>
<li><strong>PCB布局</strong>：数字地和模拟地分区（磁珠/0Ω电阻单点连接）、高速信号线远离干扰源、差分信号等长等距走线、大面积接地平面（降低地阻抗）</li>
<li><strong>屏蔽</strong>：金属外壳接地屏蔽辐射干扰、信号线用屏蔽层+双绞线（CAN/RS485）</li>
<li><strong>软件层面</strong>：通信协议加CRC校验+超时重传、看门狗监控、关键变量三模冗余（安全关键系统）</li>
<li><strong>静电防护（ESD）</strong>：对外接口加TVS管/ESD保护二极管</li></ul>`
      },
      {
        id: "hw-15", tags: ["硬件"],
        q: "I2C总线的起始条件和停止条件？不同速率模式？",
        a: `<p><strong>起始条件(Start)：</strong>SCL高电平期间，SDA从高→低跳变。总线从空闲→忙。</p>
<p><strong>停止条件(Stop)：</strong>SCL高电平期间，SDA从低→高跳变。总线从忙→空闲。</p>
<p><strong>数据传输：</strong>SDA在SCL低电平时变化，在SCL高电平时采样（上升沿）。每个字节（8bit）后跟第9个时钟→ACK/NACK位（接收方在第9个SCL拉低SDA表示ACK，保持高表示NACK）。</p>
<p><strong>速率模式：</strong>Standard-mode(100kbps)、Fast-mode(400kbps)、Fast-mode Plus(1Mbps)、High-speed mode(3.4Mbps)。速率由主设备SCL时钟频率控制。</p>
<p>I2C总线的开始/停止条件使得软件I2C可以在硬件上模拟（通过GPIO位操作+精确延时实现）。</p>`
      }
    ]
  }
];
const DATA_PART2 = [
  {
    id: "protocols", name: "通信协议", icon: "📡",
    questions: [
      { id: "p-1", tags: ["高频","CAN"], q: "CAN总线的仲裁机制如何工作？为什么CAN能实现无损仲裁？", a: `<p>CAN总线采用<strong>CSMA/CA+逐位仲裁</strong>机制。工作原理：</p><ol><li>发送前先监听总线（载波侦听），空闲时才发送</li><li>发送时同时监听总线（回读），逐位比较发送位和总线实际电平</li><li>显性位(逻辑0)覆盖隐性位(逻辑1)——线与逻辑</li><li>当某节点发送隐性位但检测到总线为显性位→说明有更高优先级(ID更小)节点在发送→该节点立即退出（成为接收方），等待总线空闲后重试</li></ol><p>仲裁段从ID最高位(MSB)开始逐位比较，ID越小优先级越高。仲裁失败方自动退出发送但不产生丢包，仲裁成功后继续发送剩余帧。整个过程不破坏任何数据（无损仲裁），不需要中心调度器。这是CAN区别于以太网(CSMA/CD碰撞后二进制退避)的核心特性。</p>` },
      { id: "p-2", tags: ["CAN","基础"], q: "CAN标准帧和扩展帧的区别？", a: `<p>标准帧11位ID(2^11=2032个标识符)、扩展帧29位ID(约5.36亿)。扩展帧中IDE位=1区分于标准帧IDE=0，SRR位替代标准帧RTR位。扩展帧可用于更细粒度的CAN ID映射，在大型车系(OEM+多ECU)更常用。11位ID节点收到29位ID报文会因格式错误而报错（可预先隔离网段）。</p>` },
      { id: "p-3", tags: ["CAN","进阶"], q: "CAN FD相比传统CAN有什么优势？", a: `<p>CAN FD(Flexible Data-Rate)的创新：数据场速率可从1Mbps提升到最高8Mbps（仲裁段仍用传统速率保证兼容），数据场从8字节扩展到64字节（单帧传更多数据）。满足ECU软件刷写(OTA)、ADAS传感器大数据量传输需求。BRS位控制速率切换(BRS=1→数据段高速)。兼容传统CAN（仲裁段同速率，但传统CAN节点会报错CAN FD帧中的BRS/ESI位）。</p>` },
      { id: "p-4", tags: ["CAN","进阶"], q: "CAN总线有哪几种错误类型和错误处理机制？", a: `<p>五种错误类型：位错误(发送位与回读位不符)、填充错误(检测到6个连续同极性位)、CRC错误(接收方计算CRC与帧CRC不匹配)、格式错误(固定格式位如CRC分隔符异常)、应答错误(发送方在ACK Slot未检测到显性位)。</p><p>错误处理：每个CAN节点有TEC(发送错误计数器)和REC(接收错误计数器)。错误主动(0-127)→报active error flag；错误被动(128-255)→报passive error flag；总线关闭(>255)→节点自动脱离总线。CAN节点有自动重发机制（仲裁失败和检测到错误都自动重发）。</p>` },
      { id: "p-5", tags: ["CAN","高频"], q: "为什么CAN总线两端需要120Ω终端电阻？", a: `<p>CAN总线使用特性阻抗120Ω的双绞线差分传输。若终端不匹配，信号到达总线端点时发生反射→反射波叠加到原信号上→波形畸变→接收节点采样到错误电平→通信失败。两端各接120Ω在总线端点实现阻抗匹配消除反射。终端电阻功率通常0.25W，Split termination(两个60Ω串联+中点电容接地)可同时提供共模噪声滤波。</p>` },
      { id: "p-6", tags: ["LIN","进阶"], q: "LIN总线的主从架构如何工作？调度表(Schedule Table)是什么？", a: `<p>LIN是单主多从串行通信。主节点发送帧头(Break+Sync+PID)→从节点识别PID后响应（发送数据或接收数据）。Schedule Table预定义每个时间槽发送哪个PID帧（按时间确定性调度，无仲裁）。主节点按调度表依次发送帧头。LIN速率最高20kbps。与CAN对比：LIN低速/单线(仅需UART+收发器)/无晶振(从节点通过同步段校准时钟)/成本极低。车窗/座椅/天窗/雨量传感器等非安全关键场景。</p>` },
      { id: "p-7", tags: ["LIN","高频"], q: "LIN和CAN的对比？", a: `<table><tr><th>特性</th><th>CAN</th><th>LIN</th></tr><tr><td>速率</td><td>最高1Mbps(CAN FD 8Mbps)</td><td>最高20kbps</td></tr><tr><td>物理层</td><td>双绞线差分</td><td>单线(Ground参考)</td></tr><tr><td>时钟</td><td>每个节点需要晶振</td><td>从节点通过同步段校准</td></tr><tr><td>控制</td><td>多主、仲裁</td><td>单主、调度表</td></tr><tr><td>成本</td><td>高(CAN控制器+收发器)</td><td>低(UART+收发器)</td></tr><tr><td>应用</td><td>动力总成/底盘/ADAS</td><td>车身舒适(车窗/座椅/天窗)</td></tr></table>` },
      { id: "p-8", tags: ["车载以太网","高频"], q: "什么是SOME/IP？服务发现(SD)机制如何工作？", a: `<p>SOME/IP(Scalable service-Oriented MiddlewarE over IP)是AUTOSAR制定的面向服务通信协议，用于车载以太网。核心概念：Service(服务)、Event(事件→服务端主动推送)、Method(Request/Response→客户端调用, Fire&Forget→单向)、Field(Getter/Setter/Notifier)。</p><p>SD(Service Discovery)机制：OfferService(服务端通过IP多播广播→告诉网络"我提供此服务"，含Service ID/Instance ID/端口号)→FindService(客户端IP多播搜索→"谁提供此服务？")→订阅Event→通过TCP/UDP单播进行实际数据通信。SD定时参数(TTL/Reboot/Initial Delay/Repetition)。</p>` },
      { id: "p-9", tags: ["车载以太网","高频"], q: "DoIP(Diagnostics over IP)的作用？与CAN诊断的区别？", a: `<p>DoIP基于ISO 13400，通过以太网承载UDS诊断。优势：大带宽(100M/1000Mbps)→支持大固件升级(几十MB)、大日志上传、远程诊断(VCI连接云端)。工作机制：物理层100BASE-T1单对双绞线、需车辆发现(vehicle identification request→vehicle announcement→路由激活)。与CAN诊断主要区别：DoIP需要IP地址分配(DHCP或Auto-IP)、需要TCP建立连接+UDP用于车辆发现、需路由激活(Routing Activation)建立与特定ECU的诊断通道。</p>` },
      { id: "p-10", tags: ["通信协议","基础"], q: "RS485和RS232的区别？为什么工业多用RS485？", a: `<table><tr><th>特性</th><th>RS232</th><th>RS485</th></tr><tr><td>信号</td><td>单端(GND参考)</td><td>差分(A/B线)</td></tr><tr><td>拓扑</td><td>点对点</td><td>多点(一主多从，最多32/256节点)</td></tr><tr><td>距离</td><td>15m</td><td>1.2km(低速)</td></tr><tr><td>速率</td><td>~115kbps</td><td>最高10Mbps(短距)</td></tr></table><p>RS485差分传输抗共模干扰能力强，支持多节点组网，适合工业现场总线。</p>` },
      { id: "p-11", tags: ["通信协议","进阶"], q: "Modbus RTU协议的工作机制和常用功能码？", a: `<p>Modbus是主从问答协议。RTU模式：二进制报文+CRC16校验，帧间最少3.5字符间隔标识帧边界。常用功能码：0x01读线圈(Digital Output)、0x02读离散输入、0x03读保持寄存器(模拟输出/配置参数)、0x04读输入寄存器(模拟输入)、0x05写单线圈、0x06写单保持寄存器、0x10写多保持寄存器。应用：PLC/传感器/仪表/变频器的工业通信标准。</p>` },
      { id: "p-12", tags: ["通信协议","AUTOSAR","进阶"], q: "OSEK NM和AUTOSAR CanNm的异同？", a: `<p>OSEK NM基于令牌逻辑环：节点按ID顺序传递ring报文→收到ring的节点表示自己在线→跳过离线节点→环恢复正常。AUTOSAR CanNm基于周期性NM PDU广播：每个节点定期发送NM PDU(携带源节点ID+网络状态)→所有节点监听NM PDU判断网络成员和睡眠协调。CanNm支持PN(Partial Network)→特定网段休眠而其他继续通信。目标相同(ECU协同休眠唤醒)→机制不同(令牌vs广播)。</p>` },
      { id: "p-13", tags: ["WiFi","基础"], q: "WiFi 802.11协议族各标准对比？", a: `<table><tr><th>标准</th><th>频率</th><th>最大速率</th><th>关键技术</th></tr><tr><td>802.11b</td><td>2.4GHz</td><td>11Mbps</td><td>DSSS</td></tr><tr><td>802.11g</td><td>2.4GHz</td><td>54Mbps</td><td>OFDM</td></tr><tr><td>802.11n/WiFi4</td><td>2.4+5GHz</td><td>600Mbps</td><td>MIMO(4x4)+40MHz信道</td></tr><tr><td>802.11ac/WiFi5</td><td>5GHz</td><td>6.9Gbps</td><td>MU-MIMO+80/160MHz+256QAM</td></tr><tr><td>802.11ax/WiFi6</td><td>2.4+5+6GHz</td><td>9.6Gbps</td><td>OFDMA+1024QAM+TWT(低功耗)</td></tr></table><p>WiFi6的OFDMA将一个信道分为更小子载波支持多用户并行传输，TWT(Target Wake Time)优化IoT设备功耗。802.11ah(HaLow)覆盖更远距离(900MHz频段)。</p>` },
      { id: "p-14", tags: ["WiFi","基础"], q: "WiFi AP和STA模式有什么区别？", a: `<p>AP(Access Point)模式：设备作为无线接入点(热点)→接受其他设备连接→提供DHCP分配IP→类似路由器功能。STA(Station)模式：设备作为无线客户端→扫描并连接到已有路由器→获取IP→类似手机/电脑连接WiFi。SoftAP：设备同时作为AP(其他设备连接)和STA(连接外部网络)→通常用于配网过渡状态。ESP32/ESP8266 IoT开发中常用AP模式做初始配网。</p>` },
      { id: "p-15", tags: ["WiFi","进阶"], q: "WiFi配网的常见方式？", a: `<ul><li>SmartConfig(一键配网)：手机APP通过UDP包长度编码→组播/广播→WiFi芯片处于sniffer模式抓包解析SSID/Password→TI CC3000首创</li><li>AP配网：设备进入AP模式→手机连接此热点→通过HTTP/UDP发送WiFi凭据→设备切换STA连接→最常用方式(兼容性好)</li><li>WPS：按按钮(PBC)或输入PIN码自动配对</li><li>蓝牙配网：通过BLE传输WiFi凭据(手机蓝牙→设备蓝牙→WiFi连接)</li><li>二维码配网：手机扫描设备二维码获取设备ID→云端下发配置</li></ul>` },
      { id: "p-16", tags: ["BLE","基础"], q: "BLE的GAP和GATT层次结构分别是什么？", a: `<p>GAP(Generic Access Profile)：定义设备角色(Broadcaster→仅广播/Observer→仅扫描/Peripheral→从设备/Central→主设备)、广播数据格式、扫描流程、连接建立和安全管理。GATT(Generic Attribute Profile)：建立在GAP之上(连接建立后)，定义数据交换协议。数据结构：Service(服务)包含多个Characteristic(特征)→每个Characteristic包含Properties(读/写/通知等属性)+Value(值)+可选的Descriptor(描述符如CCCD)。GATT通过ATT协议(Attribute Protocol)传输实际数据。</p>` },
      { id: "p-17", tags: ["BLE","进阶"], q: "BLE的广播/扫描/连接建立流程？", a: `<p>Broadcaster/Peripheral在3个广播信道(37/38/39ch)周期性发送ADV包(advInterval=20ms~10.24s)→Observer/Central在广播信道扫描(scanWindow/scanInterval)→Central检测到感兴趣设备→发送CONNECT_REQ(含连接间隔/跳频图等参数)→连接建立后跳频到37个数据信道(0-36ch)→Connection Event(Central发起，间隔connInterval=7.5ms~4s)→每次CE中双方交换数据→Slave Latency允许Slave跳过N个CE以省电。</p>` },
      { id: "p-18", tags: ["BLE","基础"], q: "BLE中Service和Characteristic的概念？UUID的作用？", a: `<p>Service：逻辑功能的容器(如Heart Rate Service UUID 0x180D)。Characteristic：Service中的具体数据项(如Heart Rate Measurement)，包含Properties(Read/Write/WriteWithoutResponse/Notify/Indicate)、Value(数据值)、可选的Descriptor(如CCCD使能Notify)。UUID 16-bit(SIG标准)或128-bit(厂商自定义)唯一标识每个Service和Characteristic。通过GATT发现流程(Discover Services→Discover Characteristics→Discover Descriptors)遍历设备的能力列表。</p>` },
      { id: "p-19", tags: ["BLE","进阶"], q: "BLE的MTU协商机制？ATT和GATT的关系？", a: `<p>MTU(Maximum Transmission Unit)决定一个ATT数据包最大载荷(默认23字节，ATT_MTU=23-3字节ATT头=20字节应用数据)。协商：Client发Exchange MTU Request(带Client RxMTU)→Server回复Exchange MTU Response(带Server RxMTU)→实际ATT_MTU=min(Client RxMTU, Server RxMTU)，最大517字节。ATT定义底层属性操作(读/写请求/通知)→GATT是应用层抽象将ATT操作组合为有意义的服务交互。</p>` },
      { id: "p-20", tags: ["TCP/IP","高频"], q: "TCP/IP四层模型及各层核心协议？", a: `<table><tr><th>层</th><th>核心协议</th><th>功能</th></tr><tr><td>应用层</td><td>HTTP/HTTPS、MQTT、FTP、DNS、CoAP</td><td>应用数据语义</td></tr><tr><td>传输层</td><td>TCP(可靠连接)、UDP(无连接)</td><td>端到端通信(端口复用/分用)</td></tr><tr><td>网络层</td><td>IP(路由)、ICMP(网络诊断)、ARP(地址解析)</td><td>跨网络寻址和路由</td></tr><tr><td>网络接口层</td><td>Ethernet/WiFi/PPP</td><td>同一链路内的帧传输</td></tr></table><p>嵌入式LWIP实现中netif结构体对应网络接口层。TCP/IP四层vs OSI七层：应用层(5-7层合并)、表示层和会话层在TCP/IP中由应用层自行处理。</p>` },
      { id: "p-21", tags: ["TCP/IP","高频"], q: "TCP三次握手和四次挥手详细流程？为什么挥手多一次？", a: `<p>三次握手：CLIENT→SYN(seq=x)→SERVER→SYN+ACK(seq=y, ack=x+1)→CLIENT→ACK(ack=y+1)→连接建立。握手三次因为SYN+ACK可合并在一个包(服务端在收到SYN后同意连接并同时告知自己的初始序列号)。</p><p>四次挥手：A→FIN(seq=u)→B→ACK(ack=u+1)→B→FIN(seq=v, ack=u+1)→A→ACK(ack=v+1)→A进入TIME_WAIT(2MSL等待)。挥手需四次因为TCP全双工：一方关闭后另一方可能还有数据要发，必须分开确认。TIME_WAIT原因：(1)确保最后的ACK能到达B (2)让旧连接残留包在网络中消失。</p>` },
      { id: "p-22", tags: ["TCP/IP","进阶"], q: "TCP四种拥塞控制算法？", a: `<ol><li>慢启动：cwnd从1MSS开始，每RTT翻倍(指数增长)→直到ssthresh或检测到丢包</li><li>拥塞避免：cwnd≥ssthresh后每RTT增加1MSS(线性增长)→逐步探测可用带宽</li><li>快速重传：收到3个重复ACK(非超时)立即重传丢失段，不等超时定时器</li><li>快速恢复：快速重传后不降到1MSS→ssthresh=cwnd/2→cwnd=ssthresh→进入拥塞避免(而非慢启动)，避免不必要的吞吐量大幅波动</li></ol><p>这是Tahoe→Reno→NewReno→CUBIC(当前Linux默认)的演进。嵌入式LWIP通常实现Reno。</p>` },
      { id: "p-23", tags: ["TCP/IP","高频"], q: "TCP和UDP的区别？嵌入式选型？", a: `<table><tr><th>特性</th><th>TCP</th><th>UDP</th></tr><tr><td>连接</td><td>面向连接(需握手)</td><td>无连接(直接发)</td></tr><tr><td>可靠性</td><td>可靠(确认+重传+序列号+流量控制)</td><td>不可靠(发完即忘)</td></tr><tr><td>有序性</td><td>有序交付</td><td>无序</td></tr><tr><td>开销</td><td>20字节头+连接管理</td><td>8字节头</td></tr></table><p>嵌入式选型：TCP→文件传输/固件OTA/HTTP；UDP→实时音视频/Sensor数据高频采集/DNS/DHCP/CoAP/广播场景。资源极受限设备优先UDP(轻量级LWIP UDP编译后比TCP小)。</p>` },
      { id: "p-24", tags: ["IoT","高频"], q: "MQTT协议的工作模型和QoS三级？", a: `<p>MQTT是发布/订阅模型，通过Broker(消息代理)中转，发布者(Publisher)和订阅者(Subscriber)完全解耦(不需要知道对方存在)。Topic(主题)是消息路由依据，支持通配符(+单层/#多层)。</p><p>QoS三级：QoS 0(At most once→发完即忘，不保证送达，最快)；QoS 1(At least once→PUBACK确认，至少一次，可能重复)；QoS 2(Exactly once→PUBREC/PUBREL/PUBCOMP四次握手，恰好一次，最高可靠性)。嵌入式IoT中QoS 1最常用(平衡可靠性和开销)。</p>` },
      { id: "p-25", tags: ["TCP/IP","进阶"], q: "HTTP和HTTPS的区别？TLS 1.3握手？", a: `<p>HTTP明文传输/端口80；HTTPS基于TLS加密/端口443。TLS提供：身份认证(证书链验证)、数据加密(对称加密)、完整性校验(MAC)、防重放攻击(nonce/timestamp)。</p><p>TLS 1.3握手(1-RTT)：ClientHello(支持的密码套件+Diffie-Hellman密钥分享参数)→ServerHello(选定密码套件)+证书+Finished(加密)→Client Finished(加密)→开始加密通信。比TLS 1.2(2-RTT)少一个往返。嵌入式轻量TLS库：mbedTLS、wolfSSL。</p>` }
    ]
  },
  {
    id: "arm", name: "ARM架构", icon: "🔲",
    questions: [
      { id: "arm-1", tags: ["ARM","高频"], q: "Cortex-M系列上电启动流程？", a: `<ol><li>硬件取0x00000000→MSP初始值</li><li>取0x00000004→PC(Reset_Handler地址)→跳转</li><li>Reset_Handler执行：SystemInit(配置时钟源/PLL/Flash等待周期/电源)</li><li>拷贝.data段从Flash→RAM(全局变量初始值)</li><li>清零.bss段(RAM中未初始化全局变量)</li><li>__libc_init_array(执行C++全局构造函数)</li><li>main()开始</li></ol><p>前16个向量是系统异常(Reset/NMI/HardFault/MemManage/BusFault/UsageFault/SVC/PendSV/SysTick等)。芯片上电时根据BOOT引脚将Flash/SRAM/System Memory映射到0x00000000。</p>` },
      { id: "arm-2", tags: ["ARM","进阶"], q: "ARM处理器有几种工作模式？Cortex-M和A的区别？", a: `<p>Cortex-A(ARMv7-A)9种模式：USR(用户)、SYS(系统)、SVC(超级用户)、ABT(中止)、UND(未定义)、IRQ、FIQ、MON(监控)、HYP(虚拟化)。每种有独立SP/部分私有寄存器→模式切换需要软件管理栈。</p><p>Cortex-M简化：Handler模式(异常/中断处理，使用MSP)和Thread模式(用户任务，可配置使用PSP)。自动硬件压栈/出栈(R0-R3,R12,LR,PC,xPSR)→切换开销极低且无软件管理栈开销。M系列将ARM复杂模式深度简化以适应MCU实时确定性需求。</p>` },
      { id: "arm-3", tags: ["ARM","高频","华为"], q: "Cache的作用和一致性问题？", a: `<p>Cache是CPU和慢速主存之间的高速SRAM，利用时间/空间局部性减少平均访存延迟。Cortex-M7有ICache+DCache(各4-64KB)，Cortex-A有L1(I+D)+L2。</p><p>一致性问题：多核Core1修改共享变量→仅更新了Core1的DCache→Core2的DCache持有旧副本→Core2读旧值。解决：MESI协议(硬件维护→Modified/Exclusive/Shared/Invalid状态+总线嗅探→自动一致性)或软件维护(Cache Clean写回脏数据+Cache Invalidate使无效缓存行)。DMA操作前需Clean→Invalidate确保DMA看到最新数据和CPU读取正确。</p>` },
      { id: "arm-4", tags: ["ARM","高频"], q: "MPU和MMU的区别？", a: `<table><tr><th>特性</th><th>MPU</th><th>MMU</th></tr><tr><td>功能</td><td>内存保护(区域权限检查)</td><td>虚拟内存映射+保护</td></tr><tr><td>地址转换</td><td>无(地址不变)</td><td>虚拟地址→物理地址</td></tr><tr><td>使用系列</td><td>Cortex-M3/M4/M7/R</td><td>Cortex-A</td></tr><tr><td>典型OS</td><td>RTOS(FreeRTOS/RT-Thread)</td><td>Linux</td></tr></table><p>MPU定义多个region(基地址+大小+访问权限RWX+属性)→违规产生MemManage Fault。在安全关键系统中MPU隔离任务防止相互干扰。</p>` },
      { id: "arm-5", tags: ["ARM","基础"], q: "哈佛架构和冯诺依曼架构区别？Cortex-M属于哪种？", a: `<p>冯诺依曼：指令和数据共享同一总线/存储空间，简单但瓶颈明显(冯诺依曼瓶颈)。哈佛：指令和数据分离总线(独立I-cache/D-cache)，可并行取指和数据存取。Cortex-M3/M4/M7属于改进哈佛架构：逻辑上独立I-bus和D-bus(可并行访问)，但物理上统一地址空间(D-bus也可访问代码如查Flash中的常量表)。</p>` },
      { id: "arm-6", tags: ["ARM","进阶"], q: "ARM三级流水线和冒险类型？", a: `<p>Cortex-M3三级流水线：取指(Fetch)→译码(Decode)→执行(Execute)。三种冒险：(1)数据冒险→后指令依赖前指令结果(通过前推Forwarding解决) (2)控制冒险→分支导致预取指令无效(Cortex-M3分支预测+指令取消机制) (3)结构冒险→资源冲突(哈佛架构基本消除总线冲突)。流水线的取指和访存可通过不同总线并行进行。</p>` },
      { id: "arm-7", tags: ["ARM","高频","华为"], q: "内存屏障(Memory Barrier)？DMB/DSB/ISB的区别？", a: `<ul><li>DMB(Data Memory Barrier)：保证DMB前后数据访存操作的顺序，不影响指令流。用于多核共享数据保护。</li><li>DSB(Data Synchronization Barrier)：更强，保证DSB前所有访存操作完成才执行后续。用于修改系统控制寄存器(如CP15协处理器)后。</li><li>ISB(Instruction Synchronization Barrier)：刷新CPU流水线，使后续指令重新从Cache/内存取。用于修改CP15/系统寄存器后确保新设置对后续指令生效(如启用MMU/MPU后)。</li></ul><p>弱内存序架构(ARM/Alpha)需要显式屏障保证顺序。x86是强内存序(TSO)，大部分操作自动有序。</p>` },
      { id: "arm-8", tags: ["ARM","高频"], q: "ARM异常向量表和异常处理流程？Cortex-M的硬件自动入栈？", a: `<p>向量表存异常入口地址(函数指针)。Cortex-M异常进入：硬件自动压栈R0,R1,R2,R3,R12,LR,PC,xPSR到当前栈→从向量表取异常入口地址→更新PC→LR设为EXC_RETURN(特殊值标识返回模式，如0xFFFFFFF9表示返回Thread模式用MSP)。异常返回：执行BX LR→CPU识别EXC_RETURN→硬件自动出栈恢复R0-R3,R12,LR,PC,xPSR→返回被打断的程序点。整个过程8个寄存器入栈/出栈零开销(硬件完成)，ISR切换效率极高。</p>` },
      { id: "arm-9", tags: ["ARM","进阶"], q: "AAPCS(ARM Architecture Procedure Call Standard)核心约定？", a: `<ul><li>R0-R3传前4个参数(多余参数通过栈传)</li><li>R0可用于返回32位返回值(R0-R1用于64位返回值)</li><li>R4-R11需被调用者保存(callee-saved)</li><li>R12、R0-R3可被调用者修改(caller-saved)</li><li>R13=SP、R14=LR、R15=PC</li><li>栈在函数入口必须8字节对齐(Cortex-M要求)</li></ul><p>AAPCS确保不同编译器(ARMCC/GCC/ICCARM)编译的代码可互调，是ARM生态二进制兼容的基石。</p>` },
      { id: "arm-10", tags: ["ARM","高频"], q: "Cortex-M和Cortex-A的核心区别及应用场景？", a: `<table><tr><th>特性</th><th>Cortex-M</th><th>Cortex-A</th></tr><tr><td>定位</td><td>MCU(集成Flash/SRAM)</td><td>MPU(需外部DRAM/Flash)</td></tr><tr><td>MMU</td><td>无(可选MPU)</td><td>有MMU</td></tr><tr><td>核数</td><td>单核为主(M4/M7)</td><td>多核(含big.LITTLE)</td></tr><tr><td>中断</td><td>NVIC(确定性延迟)</td><td>GIC(通用中断控制器)</td></tr><tr><td>OS</td><td>FreeRTOS/RT-Thread</td><td>Linux/Android/QNX</td></tr><tr><td>应用</td><td>传感器/电机控制/CAN/简单HMI</td><td>车载中控/ADAS/智能座舱/网关</td></tr></table><p>汽车电子中M做实时安全控制(AutoSAR CP)，A做高性能处理(AutoSAR AP+Linux域控)。</p>` }
    ]
  },
  {
    id: "architecture", name: "软件架构与设计模式", icon: "🏗️",
    questions: [
      { id: "sa-1", tags: ["架构","高频"], q: "嵌入式软件分层架构的设计思想？", a: `<p>纵向分层：应用层→业务逻辑层→中间件/协议栈→HAL硬件抽象层→驱动层→硬件。核心原则：(1)单向依赖——上层依赖下层，下层不能依赖上层 (2)接口稳定——层间通过API通信，下层变化不影响上层 (3)每层职责清晰——驱动只管操作硬件，中间件只管协议逻辑，应用只管业务。优点：可移植(换MCU只改HAL以下)、可测试(逐层Mock)、可并行开发(团队分派各层)。</p>` },
      { id: "sa-2", tags: ["架构","高频"], q: "什么是高内聚低耦合？嵌入式C语言如何实践？", a: `<p>高内聚：模块内部功能紧密相关、单一职责。低耦合：模块间依赖尽量少、接口最小化。实践：(1)每个.c文件负责一个单一功能模块 (2)头文件只暴露必要接口(static隐藏内部函数) (3)用回调函数替代模块间直接调用 (4)全局变量通过get/set访问器操作 (5)消息队列解耦生产者消费者(双方只依赖队列接口)</p>` },
      { id: "sa-3", tags: ["架构","进阶"], q: "依赖倒置(DIP)在嵌入式中的应用？", a: `<p>DIP：高层模块和低层模块都应依赖抽象，而非具体实现。嵌入式实现：定义抽象接口(函数指针表struct ops)→高层模块通过ops操作→低层模块实现ops。例如：定义sensor_ops(read/init/self_test)=>{温湿度传感器实现、IMU传感器实现}→应用层只依赖sensor_ops，换传感器无需修改应用代码。这是策略模式的基础。</p>` },
      { id: "sa-4", tags: ["设计模式","进阶"], q: "单例模式在嵌入式C语言中的实现？", a: `<p>C实现：static全局变量+获取函数。注意多任务并发创建需关中断保护。</p><pre><code class="language-c">typedef struct { int initialized; void *ctx; } I2C_Bus;
I2C_Bus* i2c_get_instance(void) {
    static I2C_Bus bus = {0};
    taskENTER_CRITICAL();
    if (!bus.initialized) { i2c_hw_init(); bus.initialized = 1; }
    taskEXIT_CRITICAL();
    return &bus;
}</code></pre><p>场景：硬件外设句柄(全局唯一的I2C/SPI总线)、系统配置管理器、日志模块。嵌入式单例通常全生命周期存在无需delete。</p>` },
      { id: "sa-5", tags: ["设计模式","进阶"], q: "观察者模式(发布/订阅)嵌入式实现？", a: `<pre><code class="language-c">typedef struct {
    void (*on_event)(void *ctx, int event_id, void *data);
    void *ctx;
} Subscriber;
Subscriber subs[MAX_SUBS];
int sub_count = 0;
void notify(int event_id, void *data) {
    for (int i = 0; i < sub_count; i++)
        subs[i].on_event(subs[i].ctx, event_id, data);
}</code></pre><p>优化：静态数组替代动态列表(确定性内存)、发布用事件标志快速通知、环形队列缓冲防丢失。场景：按键事件分发、传感器数据多消费者。</p>` },
      { id: "sa-6", tags: ["设计模式","高频"], q: "状态机模式的三种实现方式对比？", a: `<table><tr><th>方式</th><th>优点</th><th>缺点</th></tr><tr><td>switch-case</td><td>简单直观</td><td>状态多时函数巨大难维护，违反开闭原则</td></tr><tr><td>查表法</td><td>结构清晰易维护、状态转移一目了然</td><td>查表有额外开销、对空事件稍浪费</td></tr><tr><td>面向对象法</td><td>最灵活、每个状态有enter/event/exit</td><td>代码量最大、C实现繁琐</td></tr></table><p>推荐查表法(平衡可维护性和效率)：state_table[当前状态][事件]=下一个状态+动作函数指针。适合通信协议/UI/设备控制状态机。</p>` },
      { id: "sa-7", tags: ["设计模式","进阶"], q: "策略模式用于通信协议切换的C实现？", a: `<pre><code class="language-c">struct protocol_ops {
    int (*send)(void *ctx, uint8_t *data, int len);
    int (*recv)(void *ctx, uint8_t *buf, int max_len);
};
struct protocol_ops can_ops = { .send = can_send, .recv = can_recv };
struct protocol_ops lin_ops = { .send = lin_send, .recv = lin_recv };
struct protocol_ops *protocol;  // 运行时指向当前协议
int comm_send(uint8_t *d, int l) { return protocol->send(ctx, d, l); }</code></pre><p>运行时切换协议只需改变protocol指针。新增协议只需实现ops接口并注册，不修改上层代码。</p>` },
      { id: "sa-8", tags: ["设计模式","进阶"], q: "工厂模式在驱动框架中的应用？", a: `<p>定义驱动工厂：根据类型ID查找对应构造函数的注册表→调用构造函数→返回统一驱动句柄(基类ops指针)。注册机制：每个驱动模块在初始化时将{类型ID, 构造函数指针}注册到工厂表中。应用：传感器驱动管理器根据型号创建对应驱动、文件系统根据格式创建对应操作句柄。Linux设备模型(platform_driver_register)和RT-Thread设备框架(rt_device_register)都使用了工厂模式思想。</p>` },
      { id: "sa-9", tags: ["设计模式","进阶"], q: "适配器模式在HAL层的应用？", a: `<p>HAL适配不同MCU/外设到统一接口。定义hal_uart_ops→STM32 UART HAL实现、NXP LPUART HAL实现、ESP32 UART HAL实现→上层驱动调用hal_uart_ops而不感知底层硬件差异。实现方式：(1)编译时#ifdef选择不同实现 (2)链接时链接不同.o文件 (3)运行时通过函数指针注册。适配器屏蔽了不同硬件差异，实现了"写一次应用代码，多MCU编译运行"。</p>` },
      { id: "sa-10", tags: ["面向对象C","进阶"], q: "C语言中面向对象编程：结构体+函数指针表实现多态？", a: `<pre><code class="language-c">// 基类(vtable)
struct device { struct device_ops *ops; void *private_data; };
struct device_ops { int (*read)(struct device*, uint8_t*, int);
                    int (*write)(struct device*, const uint8_t*, int); };
// 子类(UART)
struct uart_dev { struct device base; USART_TypeDef *uart; };
int uart_read(struct device *d, uint8_t *b, int l) {
    struct uart_dev *u = (struct uart_dev*)d;  // 向下转型
    return uart_hw_read(u->uart, b, l);
}
// 基类第一个成员+地址一致性实现继承多态</code></pre><p>封装(不透明指针隐藏实现)、继承(父结构体为子结构体第一个成员→地址相同)、多态(函数指针表)。Linux内核大量使用此模式。</p>` },
      { id: "sa-11", tags: ["面向对象C","进阶"], q: "Linux VFS的面向对象设计？", a: `<p>VFS定义struct file_operations(read/write/open/llseek等函数指针)→每个文件系统(ext4/fat/NFS/procfs)实现各自的fops实例→open()根据文件路径找到对应inode→inode->i_fop绑定到该文件系统的fops→read()通过file->f_op->read()自动调用正确实现。这是"策略与机制分离"的经典案例——VFS定义统一文件操作框架(机制)，各文件系统提供具体实现(策略)。应用层代码open→read→close的API在任何文件系统上都一样工作。</p>` },
      { id: "sa-12", tags: ["架构","进阶"], q: "RT-Thread设备驱动框架中的组件化设计？", a: `<p>rt_device定义统一设备基类(ref_count/open_flag/ops等)→所有设备(UART/I2C/SPI/Sensor/Watchdog)继承rt_device→通过rt_device_register注册到内核对象容器→应用通过rt_device_find(按名称查找)→rt_device_open→rt_device_read/write统一访问。核心要素：(1)接口归一化(所有设备统一5个接口) (2)对象容器管理(按名称查找) (3)继承关系(高层框架如Sensor在rt_device之上构建) (4)组件化(各驱动作为独立module可编译裁剪)。</p>` },
      { id: "sa-13", tags: ["AUTOSAR","架构"], q: "AUTOSAR SWC组件模型的本质？", a: `<p>SWC将应用功能封装为独立可复用组件。每个SWC仅定义Port(数据提供/接收端口)和Interface(数据类型)，通过VFB(Virtual Functional Bus)进行逻辑通信。SWC开发者不关心通信物理路径(CAN/LIN/以太网或内部函数调用)→部署阶段RTE生成代码将逻辑通信映射到物理传输。SWC可跨ECU复用(同一SWC在不同车型配置到不同ECU)。本质是面向组件软件开发(CBSD)+模型驱动架构(MDA)在汽车嵌入式领域的工程化实践。</p>` },
      { id: "sa-14", tags: ["架构","进阶"], q: "嵌入式时间与空间权衡策略？", a: `<ul><li>空间换时间：查表替代计算(CRC查256字节表→比逐位计算快10×)、预分配内存池(免malloc耗时)、展开循环(unroll)</li><li>时间换空间：压缩数据(运行时解压/如MiniLZO)、动态加载(用到时再加载代码模块)、位域压缩存储、共享代码段</li><li>平衡：Flash充裕→查表法(启动时加载到RAM)；RAM紧缺→避免过大缓冲区、压缩存储</li></ul><p>关键：先分析系统瓶颈(CPU密集→空间换时间；存储紧缺→时间换空间)，再做明智取舍。</p>` },
      { id: "sa-15", tags: ["架构","高频"], q: "嵌入式系统可靠性设计方法？", a: `<p>多层防护体系：(1)预防层：代码审查+静态分析(PC-lint/Coverity)+编码规范(MISRA C) (2)检测层：看门狗(独立时钟源)+心跳任务(各关键任务定期上报+监控任务检测超时)+Assert断言+栈溢出检测+CRC校验 (3)恢复层：看门狗超时→硬件复位→读取Crash Dump→尝试恢复、双分区固件(AB分区OTA防变砖)、故障隔离(MPU)+安全模式降级运行 (4)记录层：故障日志写入非易失存储+复位原因寄存器(RCC_CSR)查询。</p>` },
      { id: "sa-16", tags: ["架构","基础"], q: "嵌入式软件模块化设计原则和模块边界划分？", a: `<p>原则：单一职责(每个模块只做一件事)、接口最小化(头文件只暴露必需API)、高内聚(模块内部紧密相关)、低耦合(模块间通过接口通信)、依赖方向(上层依赖下层不反向)。边界划分按功能(如按键模块/显示模块/通信模块/存储模块)或按层级(驱动层/HAL层/业务层/应用层)。好的模块化使得团队可并行开发、模块可独立测试、代码变更影响最小化。</p>` },
      { id: "sa-17", tags: ["架构","进阶"], q: "回调函数如何降低模块耦合？", a: `<p>回调将高层策略注入底层机制，实现控制反转(IoC)。例：UART驱动接收数据→调用注册的回调函数通知上层→上层在回调中解析协议。UART驱动不依赖上层头文件、不知道协议格式→解耦。实现：struct{void (*on_recv)(void*,uint8_t*,int); void *ctx;}→上层注册回调结构体→驱动调用on_recv(ctx, buff, len)。与直接函数调用的区别：驱动不依赖上层模块的头文件。</p>` },
      { id: "sa-18", tags: ["架构","进阶"], q: "消息队列在跨任务通信中的解耦作用？", a: `<p>生产者任务→发送消息到队列→消费者任务从队列取消息。双方不直接知道对方存在，只依赖队列这个"管道"。优势：(1)解耦速度差异→队列缓冲数据 (2)异步通信→不阻塞 (3)扩展方便→增加消费者只需监听同一队列。在RT-Thread(rt_mq)和FreeRTOS(xQueue)中都有标准实现。设计要点：队列深度计算(缓冲最坏情况积压)、消息大小权衡(值拷贝vs指针传递)、接收超时设计。</p>` },
      { id: "sa-19", tags: ["架构"], q: "循环缓冲区(Circular Buffer)的通用设计？", a: `<pre><code class="language-c">struct circ_buf { uint8_t *buffer; int size; volatile int head, tail; };
int circ_write(struct circ_buf *c, uint8_t b) {
    int next = (c->head + 1) % c->size;
    if (next == c->tail) return -1; // full
    c->buffer[c->head] = b; c->head = next; return 0;
}
int circ_read(struct circ_buf *c, uint8_t *b) {
    if (c->tail == c->head) return -1; // empty
    *b = c->buffer[c->tail]; c->tail = (c->tail + 1) % c->size; return 0;
}</code></pre><p>关键：(1)读写指针用volatile(ISR修改) (2)size为2的幂可用&(size-1)替代%优化 (3)空一个元素区分满/空(或使用count变量) (4)关中断保护(或单向单写单读无锁)</p>` },
      { id: "sa-20", tags: ["架构","进阶"], q: "嵌入式故障隔离与降级设计思路？", a: `<p>隔离：(1)关键任务独立看门狗监控 (2)MPU内存区域保护(任务A不能访问任务B的内存) (3)独立故障日志区(不受系统复位擦除)。降级：定义多级运行模式——Normal(全功能)→Degraded(部分功能禁用，如摄像头故障后ACC降级为仅雷达)→LimpHome(仅保留最低安全行驶能力)→SafeStop(刹车靠边停车)。设计需预设FMEA(故障模式与影响分析)确定每个故障的降级策略和安全状态。</p>` }
    ]
  },
  {
    id: "uds", name: "汽车电子-UDS诊断", icon: "🚗",
    questions: [
      { id: "uds-1", tags: ["UDS","高频"], q: "UDS协议(ISO 14229)的基础架构？", a: `<p>UDS(Unified Diagnostic Services)定义在ISO 14229，是汽车诊断通信核心应用层标准。分层：应用层(UDS服务定义，14229-1)→网络层(ISO 15765-2 DoCAN，多帧传输/数据分段/流控)→数据链路层(CAN/LIN/FlexRay/Ethernet)→物理层。UDS不依赖具体物理总线——CAN/LIN/FlexRay/Ethernet都可用相同的UDS服务和SID。核心格式：请求(SID+SubFunction+Data)→肯定响应(SID+0x40+Data)/否定响应(0x7F+SID+NRC)。</p>` },
      { id: "uds-2", tags: ["UDS","高频"], q: "UDS请求和响应的报文格式？肯定/否定响应如何区分？", a: `<p>请求：SID(+SubFunction)+Data。肯定响应：SID+0x40(+SubFunction)+Response Data。否定响应：0x7F+请求SID+NRC。例：进入扩展会话→请求0x10 0x03→肯定响应0x50 0x03 0x00 0x32 0x00 0xFA→否定响应0x7F 0x10 0x12(子功能不支持)。SubFunction的bit7=1为SuppressPosRspMsgIndicationBit(抑制肯定响应)。SID范围：0x00-0x3F为ISO保留。NRC优先级由ISO 14229-1 Annex A规定。</p>` },
      { id: "uds-3", tags: ["UDS","进阶"], q: "抑制肯定响应位(SuppressPosRsp)的使用场景？", a: `<p>SubFunction字节bit7设为1时抑制肯定响应(如0x10→0x90功能寻址扩展会话)。使用场景：功能寻址(一对多广播)→抑制肯定响应防止多个ECU同时回复导致总线拥堵。重要特性：(1)仅抑制肯定响应，NRC否定响应仍会发送 (2)不抑制功能执行(ECU仍会执行请求操作) (3)多个子功能时任一子功能支持都可能导致肯定响应发回。TP(TesterPresent)周期功能寻址通常抑制肯定响应。</p>` },
      { id: "uds-4", tags: ["UDS","高频"], q: "UDS 0x10诊断会话控制(DiagnosticSessionControl)三个会话？", a: `<table><tr><th>会话</th><th>SubFunction</th><th>用途</th></tr><tr><td>默认会话</td><td>0x01</td><td>上电默认，基本诊断功能</td></tr><tr><td>编程会话</td><td>0x02</td><td>ECU刷写/Flash编程，需在Bootloader中</td></tr><tr><td>扩展会话</td><td>0x03</td><td>高级诊断(调整参数/读写NVRAM)，通常需0x27安全解锁</td></tr></table><p>会话切换间需满足P2/P2*时序。非默认会话有S3 Server超时(通常5s)→需要TP(3E)保持。退出编程会话会自动复位或保持在此会话(取决于实现)。</p>` },
      { id: "uds-5", tags: ["UDS","基础"], q: "UDS 0x22(ReadDataByIdentifier)和0x2E(WriteDataByIdentifier)？", a: `<p>0x22通过DID(Data Identifier，2字节)读取ECU数据。例：0x22 0xF1 0x90→读取VIN码。响应包含DID+数据。0x2E通过DID写入数据(需在扩展会话中，可能需安全解锁)。DID由OEM/ECU供应商定义在ODX/CDD诊断数据库中，如0xF18C(ECU硬件版本号)、0xF190(VIN码)、0xF1A0(ECU软件版本号)。</p>` },
      { id: "uds-6", tags: ["UDS","高频"], q: "UDS 0x27(SecurityAccess)的Seed/Key解锁流程？", a: `<p>安全访问是受保护服务(写入/编程/校准)的前置条件。流程：(1)Tester发送0x27 0x01(请求Seed)→(2)ECU回复0x67 0x01+Seed(随机数，2-4字节)→(3)Tester根据Seed+内部算法(如AES/自定义算法)计算Key→(4)Tester发送0x27 0x02+Key→(5)ECU验证Key通过→回复0x67 0x02(解锁成功)；失败回复0x7F 0x27 0x35(无效Key)。安全等级：Level1(标准诊断)、Level2/3(编程/关键参数修改)。有失败尝试次数限制+延时惩罚(防暴力破解)。</p>` },
      { id: "uds-7", tags: ["UDS","高频"], q: "UDS 0x19(ReadDTCInformation)有哪些子功能？", a: `<p>0x19是最复杂的UDS服务之一，超过28种子功能。常用：0x01(reportNumberOfDTCByStatusMask→按DTC状态掩码读取匹配数量)、0x02(reportDTCByStatusMask→读取DTC列表，返回DTC+状态)、0x04(reportSnapshotRecordByDTCNumber→读取快照数据/环境数据)、0x06(reportExtendedDataRecordByDTCNumber→扩展数据如老化计数器/发生次数)、0x0A(reportSupportedDTCs→读取所有已确认DTC)。DTC格式为3字节(DTC HighByte+MiddleByte+LowByte)。</p>` },
      { id: "uds-8", tags: ["UDS","基础"], q: "UDS 0x3E(TesterPresent)的作用？如果没有TP会发生什么？", a: `<p>TesterPresent保持非默认会话活跃。切换到扩展/编程会话后如果S3 Server超时(通常5秒)内未收到任何诊断请求→ECU自动退回默认会话→安全访问锁定→所有需扩展会话的服务失效。TP发送周期应<S3 (通常2-3秒)。功能寻址TP(0x3E 0x00→抑制肯定响应减少总线负载)；物理寻址TP(0x3E 0x01→需要肯定响应)。无TP的后果：正在编程会话中刷写→突然掉回默认会话→刷写失败→可能ECU变砖。</p>` },
      { id: "uds-9", tags: ["UDS"], q: "UDS 0x14和0x85的作用？", a: `<p>0x14(ClearDiagnosticInformation)：根据DTC组清除故障码。例：0x14 0x00 0x00 0x00(清除动力总成组)→0x14 0xFF 0xFF 0xFF(清除所有)。条件：需在扩展会话中、可能需安全解锁。清除后DEM重置对应DTC状态字节(bit3-4-5等)。0x85(ControlDTCSetting)：控制DTC记录开关→0x85 0x01开启、0x85 0x02关闭。诊断/调试/生产测试时可能需要关闭DTC记录防止误导性故障。不影响FIM/DEM核心功能。</p>` },
      { id: "uds-10", tags: ["UDS","高频"], q: "NRC否定响应码的分类和优先级？列出常见NRC。", a: `<table><tr><th>NRC</th><th>含义</th><th>优先级</th></tr><tr><td>0x11</td><td>服务不支持(serviceNotSupported)</td><td>最高</td></tr><tr><td>0x12</td><td>子功能不支持(subFunctionNotSupported)</td><td>高</td></tr><tr><td>0x13</td><td>报文长度/格式错误(incorrectMessageLengthOrInvalidFormat)</td><td>高</td></tr><tr><td>0x22</td><td>条件不满足(conditionsNotCorrect，如安全未解锁)</td><td>中</td></tr><tr><td>0x31</td><td>请求超出范围(requestOutOfRange)</td><td>中</td></tr><tr><td>0x33</td><td>安全访问拒绝(securityAccessDenied)</td><td>中</td></tr><tr><td>0x7F</td><td>当前会话不支持(serviceNotSupportedInActiveSession)</td><td>低</td></tr><tr><td>0x78</td><td>请求已收到正在处理(requestCorrectlyReceived-ResponsePending)</td><td>特殊(NRC但表示延迟响应)</td></tr></table>` },
      { id: "uds-11", tags: ["UDS","进阶"], q: "DTC的3字节格式如何解析？", a: `<p>DTC 3字节=HighByte+MiddleByte+LowByte。HighByte高2bit定义系统：00=P(动力总成/Powertrain)、01=C(底盘/Chassis)、10=B(车身/Body)、11=U(网络通信/Network)。HighByte剩余bit表示DTC类型(0=ISO/SAE标准定义，1=制造商自定义)。MiddleByte高4bit=子系统(如3=点火系统)。LowByte低4bit+MiddleByte低4bit=具体故障码(Failure Code, 8bit)。例：P0301→P=0动力总成+0=ISO标准+301=3子系统(点火)+01具体故障(气缸1失火)。</p>` },
      { id: "uds-12", tags: ["UDS","高频"], q: "DTC Status字节的8个Bit含义？ConfirmedDTC如何置位？", a: `<table><tr><th>Bit</th><th>名称</th><th>含义</th></tr><tr><td>0</td><td>testFailed</td><td>最近一次测试失败</td></tr><tr><td>1</td><td>testFailedThisOperationCycle</td><td>当前操作循环测试失败过</td></tr><tr><td>2</td><td>pendingDTC</td><td>待确认DTC(首次失败但未达debounce阈值)</td></tr><tr><td>3</td><td>confirmedDTC</td><td>已确认→存储到NVM非易失存储</td></tr><tr><td>4</td><td>testNotCompletedSinceLastClear</td><td>上次清除后未完成测试</td></tr><tr><td>5</td><td>testFailedSinceLastClear</td><td>上次清除后测试失败过</td></tr><tr><td>6</td><td>testNotCompletedThisOperationCycle</td><td>当前循环未完成测试</td></tr><tr><td>7</td><td>warningIndicatorRequested</td><td>请求点亮故障警告灯(MIL)</td></tr></table><p>confirmedDTC(bit3)=1需经过debounce防抖确认后才置位(故障持续达到计数器/时间阈值)。</p>` },
      { id: "uds-13", tags: ["UDS","进阶"], q: "Debounce防抖策略：基于计数器vs基于时间？", a: `<p>基于计数器：每次testFailed→计数器+步进值(如+2)，每次testPassed→计数器-步进值(如-1)。达到阈值(如+10)→故障确认。对间歇性故障敏感→快速累加。基于时间：持续testFailed达到时间阈值(如500ms)→故障确认；持续testPassed达到时间阈值→故障消除。对稳定故障快速确认。AUTOSAR DEM支持两种防抖策略同时使用，分别配置计数值和时间阈值，任一满足即确认故障。</p>` },
      { id: "uds-14", tags: ["UDS","进阶"], q: "Aging(老化)机制如何工作？", a: `<p>Aging是故障自愈机制：confirmedDTC(bit3)置位并存储到NVM后，如果连续N个操作循环未再次触发此故障→DEM自动清除confirmedDTC(bit3→0)，但pendingDTC(bit2)可能仍置位。与Debounce的区别：Debounce确认故障(bit3 0→1)，Aging自动清除已修复故障(bit3 1→0)。Aging防止已修复老故障永久残留，确保DTC列表反映当前真实状态。Aging计数器在每次操作循环中故障未出现时递增，出现时重置。</p>` },
      { id: "uds-15", tags: ["UDS","基础"], q: "P2和P2*时序的区别？", a: `<p>P2(典型50ms)：ECU从收到请求到发送响应的最大时间(常规响应)。P2*(典型5000ms)：扩展响应时间。当ECU需要较长时间处理请求(如Flash擦除、安全算法计算)，先快速回复NRC 0x78(ResponsePending/请求正确收到正在处理)，然后在P2*时间内发送最终响应。ECU在诊断会话控制肯定响应(0x50)中返回P2/P2*的值给Tester。P2超时→Tester可能重发或断开连接；P2*超时→Tester认为ECU无响应。</p>` }
    ]
  }
];
const DATA_PART3 = [
  {
    id: "autosar", name: "汽车电子-AUTOSAR", icon: "🏭",
    questions: [
      { id: "as-1", tags: ["AUTOSAR","高频"], q: "AUTOSAR Classic Platform的四层架构是什么？", a: `<ul><li><strong>应用层(Application Layer)</strong>：SWC软件组件，独立于硬件和ECU的应用逻辑，通过Port端口+VFB逻辑通信</li><li><strong>RTE(Runtime Environment)</strong>：实现VFB概念，管理SWC间通信和SWC→BSW访问，由配置工具自动生成代码</li><li><strong>BSW基础软件层</strong>：服务层(System/Communication/Memory/Diagnostic Services)+ECU抽象层(封装ECU板上外设)+MCAL(MCU底层驱动：GPT/SPI/I2C/CAN控制器等)</li><li><strong>硬件层</strong>：CPU/CAN控制器/ADC/SPI等物理外设</li></ul><p>分层严格遵循单向依赖：应用→RTE→BSW→硬件，下层变化不影响上层。</p>` },
      { id: "as-2", tags: ["AUTOSAR","高频"], q: "RTE(Runtime Environment)的核心作用？", a: `<p>RTE是AUTOSAR架构解耦的核心。作用：(1)实现VFB概念→SWC开发者只需定义Port和Interface，不需要知道对方SWC在哪个ECU (2)管理SWC间通信(Sender-Receiver/Client-Server)——根据配置自动生成通信代码（内部函数调用或跨ECU的Com调用） (3)管理SWC访问BSW的服务(如NVM、Diagnostics) (4)负责事件触发和任务映射（Runnable→OS Task）。RTE由配置工具基于ARXML生成而非手写，类似于"M2M(Machine-to-Machine)的中间件生成器"。</p>` },
      { id: "as-3", tags: ["AUTOSAR","高频"], q: "SWC的类型和两种通信模式？", a: `<p>SWC类型：Application SWC(实现应用功能)、SensorActuator SWC(封装传感器/执行器)、Composition SWC(组合多个SWC)、Service SWC(提供BSW服务)、Parameter SWC(存储标定参数)。</p><p>通信模式：(1)Sender-Receiver→异步数据传递、一对多(多播)、周期性触发、适合信号级通信(车速/温度/开关状态等周期发送信号) (2)Client-Server→请求-响应、一对一、同步或异步触发、适合服务级通信(如"请求NVM写入"→"写入完成")。S-R适合持续数据流，C-S适合触发式操作。</p>` },
      { id: "as-4", tags: ["AUTOSAR","进阶"], q: "VFB(Virtual Functional Bus)是什么？为什么是AUTOSAR最核心抽象？", a: `<p>VFB是SWC之间通信的逻辑抽象总线。SWC开发阶段只关注VFB层面的概念(Port端口→定义提供/接收的数据、Interface接口→定义数据类型)、不需要关心：(1)对方SWC在哪个ECU(本地/跨核/跨ECU) (2)走什么总线(CAN/LIN/Ethernet) (3)信号如何打包解包(I-PDU→N-PDU→L-PDU映射) (4)任务触发方式。这些具体映射由系统配置阶段+BSW+RTE部署时完成。VFB使得SWC成为真正可复用的软件单元(跨项目/跨ECU)。</p>` },
      { id: "as-5", tags: ["AUTOSAR","进阶"], q: "BSW各层职责？MCAL和ECU抽象层的边界？", a: `<p>BSW分为三子层：服务层(System Services: OS/WdgM/ECU State Manager; Memory Services: NvM/Fee; Communication Services: Com/PduR/DCM/DEM)→ECU抽象层(封装ECU板上所有外设: CanIf/LinIf/AdcIf等，不依赖具体MCU型号)→MCAL(与具体MCU绑定的底层驱动: Can/Lin/Adc/Pwm/Gpt驱动直接操作寄存器)。</p><p>边界：MCAL≤MCU特定(如stm32f4xx_can_driver→操作CAN控制器寄存器)；ECUAL≥ECU板级通用(如CanIf→不依赖具体CAN控制器型号，通过MCAL接口操作)。换MCU只需改MCAL层。</p>` },
      { id: "as-6", tags: ["AUTOSAR","高频"], q: "DCM模块的三个子模块(DSL/DSD/DSP)的职责分工？", a: `<p>DSL(Diagnostic Session Layer)：管理诊断会话状态(默认/扩展/编程)→维护安全等级(解锁状态)→监控时序(P2/P2*/S3 Server超时)→收到TesterPresent重置S3计时器。DSD(Diagnostic Service Dispatcher)：校验SID是否支持→检查子功能→验证当前会话/安全等级是否允许此服务→派发请求给DSP→组装否定响应(权限不足时)。DSP(Diagnostic Service Processor)：真正执行诊断服务(读DID/写DID/读DTC/安全访问Seed生成/例程控制等)→通过RTE端口获取/设置数据。分工：DSL管状态→DSD管路由和权限→DSP管业务执行。</p>` },
      { id: "as-7", tags: ["AUTOSAR","高频"], q: "DEM模块核心功能和关键API？", a: `<p>DEM(Diagnostic Event Manager)管理所有诊断事件的完整生命周期。核心功能：监听事件状态(Boolean event status)→Debounce防抖(计数/时间)→管理DTC Status字节(8bit)→存储快照(Snapshot/环境数据)+扩展数据(ExtendedData/发生次数)→Aging老化(自动清除)→DTC存入NVM非易失存储。</p><p>核心API：<code>Dem_SetEventStatus(Dem_EventIdType EventId, Dem_EventStatusType EventStatus)</code>。SWC或BSW模块在检测到故障时调用Dem_SetEventStatus(EventID, DEM_EVENT_STATUS_FAILED)，故障消除时调用DEM_EVENT_STATUS_PASSED。DEM内部根据此调用驱动debounce状态机。</p>` },
      { id: "as-8", tags: ["AUTOSAR","进阶"], q: "FIM(功能抑制管理)模块的作用？与DEM的关系？", a: `<p>FIM基于DEM事件状态做出功能降级决策。流程：DEM事件状态变化→FIM查询FID(Function Identifier)映射规则→判断受此DEM事件影响的FID→抑制/释放FID对应的功能。例：电池电压传感器故障DEM事件→FIM查表→抑制SOC估算功能和里程估算功能→SOC显示为"---"、剩余里程不显示。</p><p>关系：DEM提供故障信息(事件状态)→FIM消费故障信息→决定功能降级→SWC/BSW在调用功能前检查Fim_GetFunctionPermission(FID, &permission)。FIM防止错误输入导致系统做出错误动作。</p>` },
      { id: "as-9", tags: ["AUTOSAR","高频"], q: "诊断请求从CAN总线到DCM的完整数据流路径？", a: `<p>CAN物理波形→Can驱动(Can_Receive, 接收CAN帧L-PDU)→CanIf(Controller Interface, 管理CAN控制器状态)→CanTp(Transport Protocol, 处理多帧传输: 接收SF/FF/CF→重组为完整I-PDU, 回复FC流控帧)→PduR(Pdu Router, 根据协议类型路由I-PDU: 如诊断PDU→DCM或应用PDU→Com)→Dcm_StartOfReception→DCM内部(DSL管理会话/定时→DSD校验SID和权限→DSP执行服务)。</p><p>响应原路返回：DCM→PduR→CanTp(分片为FF+CF)→CanIf→Can(Can_Write)→CAN总线。每层有清晰的职责边界和标准化API。</p>` },
      { id: "as-10", tags: ["AUTOSAR","CAN","高频"], q: "CanTp如何处理多帧传输？SF/FF/CF/FC四种帧？", a: `<p>单帧SF(Single Frame)：CAN DLC≤7字节(实际数据≤6字节+前4bit为数据长度=0-7)，直接传输完整I-PDU。</p><p>多帧(数据>7字节)：首帧FF(First Frame)前4bit=1，低4bit+第二个字节=12bit总长度(最大4095=4KB)，前6字节为数据头。接收方收到FF后回复流控帧FC(Flow Control)：FS流状态(CTS=0继续/WT=1等待/OVFLW=2溢出)+BS块大小(一次发送多少CF)+STmin(CF最小间隔)。发送方按BS和STmin发送连续帧CF(Consecutive Frame)：前4bit=2，低4bit=序号(0-15循环)。最大可传输4095字节(UDS长诊断报文)。</p>` },
      { id: "as-11", tags: ["AUTOSAR","高频"], q: "Classic AUTOSAR和Adaptive AUTOSAR的区别？", a: `<table><tr><th>特性</th><th>Classic AUTOSAR</th><th>Adaptive AUTOSAR</th></tr><tr><td>配置方式</td><td>静态预配置(编译期确定)</td><td>动态部署(运行时服务发现)</td></tr><tr><td>OS</td><td>OSEK OS(AUTOSAR OS)硬实时</td><td>POSIX(Linux/QNX/PikeOS)</td></tr><tr><td>编程语言</td><td>C</td><td>C++(C++14/17)</td></tr><tr><td>通信</td><td>信号级(Sender-Receiver基于CAN)</td><td>面向服务(SOME/IP+DDS)</td></tr><tr><td>目标MCU</td><td>MCU(单核/少核)</td><td>MPU(多核SoC)</td></tr><tr><td>应用</td><td>动力/底盘/车身控制</td><td>ADAS/自动驾驶/智能座舱/OTA</td></tr></table><p>两者可共存于异构SoC(CP+AP分不同核心)。</p>` },
      { id: "as-12", tags: ["AUTOSAR"], q: "Sender-Receiver和Client-Server通信模式的适用场景？", a: `<p>Sender-Receiver：异步数据流、一对多/多播、周期性触发、适合持续信号(车速周期广播、传感器数据、开关状态)。每个Sender定义P-Port(提供数据)、Receiver定义R-Port(接收数据)。</p><p>Client-Server：同步/异步请求-响应、一对一、触发式调用、适合服务操作(请求NVM存储数据、请求安全访问Unlock、请求读取诊断数据)。Client定义R-Port(请求方)、Server定义P-Port(服务提供方)。</p><p>S-R适合信号级持续通信(多数body/chassis应用)，C-S适合服务级触发通信(诊断/标定/OTA)。AUTOSAR中S-R和C-S可以混合使用。</p>` },
      { id: "as-13", tags: ["AUTOSAR","进阶"], q: "AUTOSAR CanNm网络管理机制？直接NM和间接NM？", a: `<p>CanNm基于周期性NM PDU广播实现ECU协同休眠和唤醒。NM PDU为独立CAN ID，包含源节点ID、控制位向量(CBV)。每个ECU周期性发送NM PDU→监听其他ECU的NM PDU→判断是否所有ECU准备好睡眠→协同进入Bus-Sleep模式。</p><p>直接NM：专门用于网络管理的CAN帧(独立CAN ID)，各ECU通过NM PDU相互告知网络状态。间接NM：利用应用层周期性报文(如车速信号/传感器数据)间接检测网络状态，无专用NM PDU。CanNm支持PN(Partial Network)→部分ECU休眠而其他继续通信，节能效果更好。</p>` },
      { id: "as-14", tags: ["AUTOSAR","进阶"], q: "AUTOSAR OS和OSEK OS的关系？增加了哪些特性？", a: `<p>AUTOSAR OS基于OSEK OS/VDX标准并完全兼容所有OSEK概念(任务/中断/资源/事件/报警/调度表)。增强特性：多核支持(多个OS Application运行在不同Core上，通过IOC跨核通信)、内存保护(MPU隔离不同OS Application防止互干扰)、时间保护(监控任务/ISR的执行时间和帧间间隔→超时触发ProtectionHook)、调度表(Schedule Table→精确时间触发的任务顺序)、Scalability Class 1-4分级别(Class1仅基础任务→Class4全特性)。</p>` },
      { id: "as-15", tags: ["AUTOSAR","进阶"], q: "AUTOSAR通信栈(ComStack)配置要点？信号到PDU到帧的映射？", a: `<p>映射过程：信号(Signal→一个物理量如车速10bit值)→信号组(Signal Group→同帧内的多个信号)→I-PDU(交互层PDU→Com模块内部完整数据单元)→N-PDU(网络层PDU→CanTp处理后可能分片)→L-PDU(数据链路层PDU→CAN帧ID+DLC+Data)。Com模块负责信号打包/解包(I-PDU↔Signal，处理字节序转换如Intel/Motorola格式、符号扩展)。配置由ARXML生成(使用工具如EB tresos/DaVinci Configurator)。关键配置项：IPDU的trigger(周期/事件)→Com发送、CAN ID分配、信号位的起始位(StartPosition)和长度。</p>` }
    ]
  },
  {
    id: "interviews", name: "大厂面试真题", icon: "🏢",
    questions: [
      { id: "iv-1", tags: ["华为","ARM","高频"], q: "[华为] Cache一致性问题如何解决？", a: `<p>多核系统每个核有独立L1 Cache→同一内存地址在不同Cache中有不同副本。硬件方案：MESI协议(Modified/Exclusive/Shared/Invalid四种状态)→通过总线嗅探(Snoop)自动维护一致性、CCI-400缓存一致性互联。软件方案：(1)将共享数据放在Non-Cacheable区域(通过MMU/MPU配置) (2)DMA缓冲区：操作前Clean→Invalidate (3)使用inner/outer shareable属性 (4)屏障指令(DMB/DSB)。华为场景：基带处理多核DSP→共享数据区域配置为Non-Cacheable或手动维护。</p>` },
      { id: "iv-2", tags: ["华为","并发","高频"], q: "[华为] 多核并发编程的注意点？", a: `<p>(1)数据竞争→spinlock保护临界区(ARM使用ldrex/strex独占指令实现原子操作) (2)死锁→统一加锁顺序+超时 (3)内存序→ARM弱内存序需DMB/DSB显式屏障，(4)Cache一致性→volatile保证不寄存器缓存+合适的内存映射属性 (5)中断亲和性(IRQ Affinity)→绑定特定中断到特定核减少Cache抖动 (6)避免false sharing→不同核访问的变量不要在同一Cache Line(通常64B)内。华为SoC有big.LITTLE架构，不同核类型间任务迁移需考虑性能兼容。</p>` },
      { id: "iv-3", tags: ["华为","ARM","高频"], q: "[华为] ARM内存模型和内存屏障？", a: `<p>ARM使用弱内存序(Relaxed Memory Order)→CPU执行的读写指令顺序可能与程序代码顺序不一致(硬件流水线+编译器优化重排)。内存屏障强制顺序约束：DMB(Data Memory Barrier→数据读写顺序保证，用于多核之间共享数据保护)、DSB(Data Sync Barrier→等待所有之前的内存访问完成才执行后续，用于修改CP15系统控制寄存器后确保生效)、ISB(Instruction Sync Barrier→刷新流水线确保后面指令重新从Cache取，用于使能MMU/MPU之后)。ARMv8还引入了Load-Acquire/Store-Release语义(比DMB更精细)。</p>` },
      { id: "iv-4", tags: ["小米","STM32","高频"], q: "[小米] STM32上电后从Flash启动到main经历了什么？", a: `<p>上电→硬件取0x08000000处MSP初始值→取0x08000004处PC(Reset_Handler)→跳转Reset_Handler→SystemInit(配置HSE/PLL/AHB/APB时钟、Flash等待周期)→拷贝.data段(已初始化全局变量)从Flash→RAM(初始值存在Flash的.data init镜像)→清零.bss段(RAM中未初始化全局变量区)→__libc_init_array(执行C++全局构造函数链接列表)→main()开始。</p><p>追问：.data为什么需要拷贝？因为Flash只适合常量和代码存储，可修改的初始值存在Flash但运行时必须在RAM。Flash擦写次数有限且有写入算法限制。</p>` },
      { id: "iv-5", tags: ["小米","FreeRTOS","高频"], q: "[小米] FreeRTOS中两个任务共享变量怎么保证安全？", a: `<p>临界区方案分级：(1)关中断(taskENTER_CRITICAL→极短操作<100指令，关可屏蔽中断) (2)互斥锁(xSemaphoreCreateMutex→适合较长临界区、支持优先级继承防止优先级反转) (3)暂停调度器(vTaskSuspendAll→不关中断但禁止任务切换，适合中等长度) (4)原子操作(单条赋值/自增在Cortex-M上通常是原子、但不保证编译器不拆分)。追问：volatile够吗？仅用于单写+单读的ISR标志位+主循环轮询场景。只要有多任务写就必须用互斥锁或关中断。</p>` },
      { id: "iv-6", tags: ["小米","C++","高频"], q: "[小米] C++虚函数实现原理和嵌入式开销？", a: `<p>编译器为有虚函数的类生成vtable(虚函数表)存储在.rodata段。每个对象头部增加vptr(指向所属类的vtable)。调用虚函数时：通过vptr→查vtable索引→间接跳转(比直接函数调用多2次访存)。开销：(1)每个对象多4/8字节vptr (2)间接调用阻止内联优化 (3)vtable占Flash空间(每个类每虚函数一个表项) (4)间接跳转可能导致分支预测失败。</p><p>嵌入式实践：性能敏感代码避免虚函数(如ISR相关的类/高频循环内)。可以用CRTP(奇异递归模板模式)实现编译期多态替代虚函数。</p>` },
      { id: "iv-7", tags: ["比亚迪","CAN","高频"], q: "[比亚迪] CAN总线Bus Load如何计算和优化？", a: `<p>Bus Load=单位时间内总线占用时间/单位时间总时间×100%。一帧时间=(数据位+CRC+ACK+EOF+IFS+填充位)/波特率。填充位约+10%。典型CAN 500kbps下一帧约200-250μs。</p><p>Bus Load>50%→低优先级帧延迟增大，>80%→偶发丢帧(仲裁失败队列满)。优化：(1)提高波特率500k→1Mbps(检查线缆和节点能力) (2)合并同一接收方的多信号到一帧减少帧数 (3)延长非关键信号的发送周期 (4)用CAN FD 64字节数据场 (5)事件触发替代周期发送(仅在数据变化时发送)。优化前需用CANoe/CANalyzer测量实际Bus Load。</p>` },
      { id: "iv-8", tags: ["比亚迪","稳定性","高频"], q: "[比亚迪] 如何保证ECU系统稳定性和容错？", a: `<p>多层保障体系：(1)硬件层-独立看门狗(独立时钟源+独立电源域)、电源监控(BOR/POR)、EMC/ESD防护 (2)软件层-关键任务监控(任务心跳+独立看门狗监控任务)、MPU内存保护(任务隔离)、栈溢出检测+栈哨兵 (3)通信层-CAN错误帧处理(自动重发/错误计数/离线恢复)、E2E端到端保护(CRC+AliveCounter+Timeout) (4)恢复策略-异常复位保存Crash Dump(RAM热区保存关键变量)→启动后读取→尝试恢复；AB双分区固件+回滚机制(OTA防变砖)；安全状态降级(故障灯亮但保证基本功能如制动可用)。</p>` },
      { id: "iv-9", tags: ["蔚来","RTOS","高频"], q: "[蔚来/小鹏] RTOS中如何设计多任务系统保证实时性？", a: `<p>(1)优先级分级：硬实时任务(电机FOC控制/ABS制动→最高优先级100μs周期)→软实时任务(CAN通信处理→中优先级1-10ms)→后台任务(诊断/日志/状态上报→低优先级) (2)任务周期设计：vTaskDelayUntil固定周期避免漂移、周期=信号采集频率 (3)关中断时间<系统最苛刻实时要求(如50μs)——极短ISR→长处理通过消息队列下放任务 (4)关键任务独立栈+uxTaskGetStackHighWaterMark监控 (5)时间触发机制：硬件定时器触发高优先级任务(而非tick轮询)保证确定性。举例：电机FOC任务用定时器触发→ADC采样→DMA传输→中断通知→执行控制算法。</p>` },
      { id: "iv-10", tags: ["大疆","传感器","高频"], q: "[大疆] 多传感器时间同步方案？", a: `<p>(1)硬件同步：所有传感器共享同一参考时钟源(如GPS PPS秒脉冲+高精度TCXO振荡器)，用SYNC脉冲信号同时触发各传感器采样(如IMU+相机+GPS同步触发) (2)软件时间戳：每个传感器数据到来时用定时器捕获当前系统时间→打上时间戳→后续融合时按时间戳插值对齐 (3)插值预测：当各传感器采样时刻不同时，用EKF/UKF状态预测模型将各传感器数据推算到同一时间点 (4)同步信号：MCU周期产生SYNC脉冲同时触发IMU和Camera的同步线。大疆重点：IMU(1kHz)+Camera(30-60Hz)+GPS(10Hz)+磁罗盘(100Hz)的异构多频率融合。</p>` },
      { id: "iv-11", tags: ["大疆","图像","进阶"], q: "[大疆] 嵌入式图像处理性能优化方法？", a: `<p>算法级：轻量网络(MobileNet/ShuffleNet)、降低分辨率/帧率、模型量化(INT8量化)。内存级：DMA双缓冲(Ping-Pong Buffer)减少数据拷贝、TCM紧耦合内存放关键函数和查找表、Cache预取指令。计算加速：CMSIS-DSP库函数、SIMD/NEON指令加速(一次处理4个16bit 或16个8bit)、FPU硬浮点单元加速浮点运算。硬件加速：STM32 Chrom-ART(DMA2D加速图像拷贝/填充/调色板转换)、专用ISP/GPU/NPU。DSP优化：循环展开、数据对齐(AXI Burst)、避免除法和分支。</p>` },
      { id: "iv-12", tags: ["车企","OTA","高频"], q: "[车企] 汽车OTA升级技术方案？AB分区机制？", a: `<p>Flash分为A区(当前运行固件)和B区(升级目标固件)。OTA流程：(1)云端推送固件→网关下载→通过DoIP/CAN分发给目标ECU→ECU将固件写入B区 (2)写入过程持续校验(CRC32→ECDSA数字签名验证) (3)写入完成后ECU设升级标志位→Ack网关→全网ECU协同重启 (4)Bootloader检测升级标志→验证B区固件完整性(SHA256+签名) (5)验证通过→切换B区为活动区→启动B区 (6)启动后确认：健康检查通过(通信正常+功能自测)→固件提交→A区变为下次升级备区。</p><p>防变砖：Bootloader独立不可升级。若B区启动失败(超时或校验失败)→自动回滚A区。</p>` },
      { id: "iv-13", tags: ["OPPO","低功耗"], q: "[OPPO/vivo] 嵌入式低功耗设计策略？", a: `<p>(1)硬件选型：低功耗MCU(Cortex-M0+/STM32L)+低功耗外设 (2)时钟管理：不用的外设关时钟、动态降低主频、空闲切低速内部振荡器(HSI→LSI) (3)休眠模式：空闲进Sleep(WFI等待中断)、长时间空闲进Stop(保留SRAM+GPIO状态)/Standby(仅唤醒源RTC/WKUP)。RTOS的tickless模式+MCU深度睡眠。 (4)软件优化：中断替代轮询(省CPU)、DMA传输时CPU休眠(仅在DMA完成中断才唤醒)、减少唤醒频率(合并事件批量处理) (5)无线：BLE调节发射功率+增加连接间隔(connInterval>100ms)、数据压缩减少空中传输时间(越短越省电)。</p>` },
      { id: "iv-14", tags: ["海康","视频"], q: "[海康/大华] 视频数据实时传输方案？", a: `<p>前端采集：摄像头Sensor→MIPI/DVP并行接口→DMA→内存帧缓冲→ISP处理(去马赛克/白平衡/降噪/宽动态)→编码器(H.264/H.265/MJPEG硬件编码器)→RTP分包→UDP Socket发送。优化要点：(1)硬件编码器(比软件快100倍、功耗低) (2)帧缓冲池预分配(防malloc碎片) (3)UDP零拷贝发送(sendfile/WSASend) (4)自适应码率(根据网络带宽探测动态调整分辨率/帧率/量化参数) (5)双码流(主码流高分辨率存储/子码流低分辨率实时预览) (6)关键帧间隔(I-frame interval)权衡带宽尖峰和随机接入速度。协议：RTSP(实时流)、RTMP(推流)、WebRTC(低延迟视频通话)。</p>` },
      { id: "iv-15", tags: ["HR","面试技巧","高频"], q: "[面试官常问] 项目中遇到最大技术难点？如何解决？(STAR法则)", a: `<p>用STAR法则回答：Situation(什么项目、做什么功能、你的角色)→Task(具体要解决的问题、技术约束：RAM/Flash/实时性)→Action(分析问题的步骤、尝试过的方案、为什么选择最终方案、技术决策的权衡)→Result(量化效果：性能提升X%、bug率下降X%、故障修复时间从X降到Y)。</p><p>推荐话题：内存泄漏排查(使用hook+可视化定位)、优先级反转(从发现到优先级继承方案的效果)、CAN Bus Load优化(从数据采集→分析→帧合并掉线降低)、栈溢出排查(从hardfault到coredump分析到修复)。关键：展示分析能力和系统性思维，而非罗列做了什么功能。</p>` },
      { id: "iv-16", tags: ["调试","高频"], q: "[面试官常问] 客户现场程序偶发崩溃如何排查？", a: `<p>(1)现场信息收集：获取串口日志(看最后输出)、coredump/Crash Dump(如保存在Flash特定区域)、故障指示灯信号、复位原因寄存器(RCC_CSR)确认是看门狗还是HardFault (2)能否复现：能→实验室尝试复现+缩小变量范围；不能→仅从现场数据逆向分析 (3)硬件排查：测电源电压纹波、复位引脚波形、时钟输出、看门狗触发时间线 (4)软件分析：检查CFSR/HFSR HardFault寄存器判断异常类型(IMPRECISERR→可能栈溢出/MemManage→MPU违规)、查看栈高水位值、内存哨兵标记被篡改 (5)定位后修复+加监控：增加异常上下文保存(异常时的PC/LR/SP/寄存器记录到Flash)、加assert和参数合法性检查。</p>` },
      { id: "iv-17", tags: ["行业认知","高频"], q: "[面试官常问] 你如何看待汽车电子行业发展趋势？", a: `<p>四大趋势：(1)SDV(软件定义汽车)→OTA持续升级+软件订阅付费模式(特斯拉FSD/奔驰后轮转向订阅)→软件成为汽车价值核心 (2)电子电气架构演进→从分布式100+独立ECU走向集中域控(动力域/座舱域/智驾域/车身域)→最终中央计算平台(Zonal Architecture) (3)自动驾驶加速→L2+高速NOA已量产、L3有条件自动驾驶法规逐步开放、传感器融合(视觉+毫米波+激光雷达)+高精地图+车路协同 (4)车载网络升级→CAN FD/100BASE-T1/1000BASE-T1替代传统CAN→SOME/IP+DoIP实现面向服务架构→TSN(时间敏感网络)满足实时性。嵌入式工程师需从单MCU思维升级到异构SoC+通信系统+OTA整体方案思维。</p>` },
      { id: "iv-18", tags: ["HR","面试技巧"], q: "[面试官常问] 你对我们公司/岗位了解多少？为什么想来？", a: `<p>准备策略：(1)提前研究公司产品线、技术栈、行业地位 (2)找到自身技能与岗位匹配点 (3)表达行业热情+学习意愿+长期发展意向。示例回答框架："贵公司(具体产品/技术)在行业是头部，我在(技术方向)有(经验/项目)。我看了贵司的JD希望招(具体能力)，我在(具体项目)中积累了这些能力。此外我对(行业趋势)非常感兴趣，希望能在一个有深度的平台上长期成长。"避免泛泛而谈，要具体到公司技术细节和自身能力映射。</p>` },
      { id: "iv-19", tags: ["蔚来","车载以太网"], q: "[蔚来/理想] 车载以太网相比CAN的优势和挑战？", a: `<p>优势：带宽百倍提升(100M-1Gbps vs CAN 1Mbps)、全双工通信、星型/树型拓扑更灵活(不需要CAN的线性总线)、支持SOME/IP面向服务架构、OTA速度质的飞跃、TSN时间敏感网络提供确定性。</p><p>挑战：每节点需PHY收发器+Switch芯片(成本高于CAN收发器)、单对双绞线需要更好的屏蔽和EMC设计(信号完整性)、实时性保障需AVB/TSN协议栈(增加了复杂度)、网络管理和睡眠唤醒设计更复杂。CAN和以太网是互补关系：CAN保持实时控制(几ms级别确定性)，以太网承担大数据(传感器原始数据/Flash升级包/音视频流)。</p>` },
      { id: "iv-20", tags: ["代码规范"], q: "[综合] 从嵌入式软件工程师角度看什么是好代码？", a: `<p>(1)正确性→正确实现功能规格(基本面) (2)可读性→命名自解释(变量名/函数名一眼看懂做什么)、注释解释WHY而非WHAT、代码风格统一(ClangFormat自动格式化) (3)可靠性→边界条件处理、返回值检查、看门狗保护、MISRA C规范、栈/堆安全监控 (4)可维护性→模块化+单一职责、接口稳定、避免硬编码(宏定义替代魔数)、预判扩展点 (5)效率→理解底层硬件(Cache Line对齐、DMA对齐、避免浮点/除法)、CPU/空间权衡 (6)可测试性→支持依赖注入、输出可通过串口/日志观察、可分模块单元测试。总之：写给人看(可维护)+写给机器跑(高效可靠)。</p>` }
    ]
  },
  {
    id: "coding", name: "手写代码与数据结构", icon: "💻",
    questions: [
      { id: "cd-1", tags: ["手写代码","高频"], q: "手写memcpy实现（考虑内存对齐优化）", a: `<p>基础版本逐字节拷贝。优化版：先逐字节拷贝到4字节对齐边界→再用uint32_t批量拷贝→剩余尾字节逐字节拷贝。</p><pre><code class="language-c">void *my_memcpy(void *dst, const void *src, size_t n) {
    if (!dst || !src || n == 0) return dst;
    char *d = (char *)dst;
    const char *s = (const char *)src;
    // 快通道：4字节对齐且剩余>=4字节
    while (n >= 4 && ((uintptr_t)d & 3) == 0 && ((uintptr_t)s & 3) == 0) {
        *(uint32_t *)d = *(const uint32_t *)s;
        d += 4; s += 4; n -= 4;
    }
    // 慢通道：逐字节
    while (n--) *d++ = *s++;
    return dst;
}</code></pre><p>注意：若用户保证无重叠用memcpy；可能重叠需用memmove。返回dst以支持链式调用。</p>` },
      { id: "cd-2", tags: ["手写代码","高频"], q: "手写strcpy实现，并说明空指针、越界和内存重叠边界", a: `<pre><code class="language-c">char *my_strcpy(char *dst, const char *src) {
    char *ret = dst;
    while ((*dst++ = *src++) != '\\0') {
        /* copy including the terminating null byte */
    }
    return ret;
}</code></pre><p><strong>边界：</strong>标准<code>strcpy</code>要求源串以<code>'\\0'</code>结尾、目标缓冲区足够大，传入空指针或源/目标内存重叠都属于未定义行为。可能重叠时应使用<code>memmove</code>思路并显式传入长度；需要限制目标容量时应设计带长度和返回码的项目接口，而不是假装<code>strcpy</code>能自行知道缓冲区大小。返回原始<code>dst</code>支持链式调用。</p>` },
      { id: "cd-3", tags: ["手写代码","高频"], q: "单链表反转（迭代+递归）", a: `<pre><code class="language-c">struct ListNode { int val; struct ListNode *next; };
// 迭代法：三指针法 O(n)/O(1)
struct ListNode* reverse_iter(struct ListNode *head) {
    struct ListNode *prev = NULL, *curr = head, *next;
    while (curr) {
        next = curr->next;   // 保存下一节点
        curr->next = prev;   // 翻转指向
        prev = curr;         // prev前进
        curr = next;         // curr前进
    }
    return prev;
}
// 递归法 O(n)/O(n)
struct ListNode* reverse_recur(struct ListNode *head) {
    if (!head || !head->next) return head;   // base: 空或单节点
    struct ListNode *new_head = reverse_recur(head->next);
    head->next->next = head;  // 后节点指回当前
    head->next = NULL;        // 当前变尾
    return new_head;
}</code></pre>` },
      { id: "cd-4", tags: ["手写代码","高频"], q: "二分查找（非递归+递归）", a: `<pre><code class="language-c">// 非递归 O(log n)/O(1)
int binary_search(int arr[], int n, int target) {
    int left = 0, right = n - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2; // 防溢出
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}
// 递归 O(log n)/O(log n)
int binary_search_recur(int arr[], int left, int right, int target) {
    if (left > right) return -1;
    int mid = left + (right - left) / 2;
    if (arr[mid] == target) return mid;
    else if (arr[mid] < target) return binary_search_recur(arr, mid+1, right, target);
    else return binary_search_recur(arr, left, mid-1, target);
}</code></pre><p>注意mid计算用left+(right-left)/2防溢出，不能用(left+right)/2。</p>` },
      { id: "cd-5", tags: ["手写代码","高频"], q: "快速排序C语言实现", a: `<pre><code class="language-c">void swap(int *a, int *b) { int t = *a; *a = *b; *b = t; }
int partition(int arr[], int low, int high) {
    int pivot = arr[high];  // 选最右元素为基准
    int i = low - 1;        // i标记小于pivot的区域边界
    for (int j = low; j < high; j++) {
        if (arr[j] <= pivot) { i++; swap(&arr[i], &arr[j]); }
    }
    swap(&arr[i + 1], &arr[high]);
    return i + 1;
}
void quick_sort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quick_sort(arr, low, pi - 1);
        quick_sort(arr, pi + 1, high);
    }
}</code></pre><p>优化：三数取中选pivot防最坏O(n²)、小数组(<20)转插入排序、尾递归优化。</p>` },
      { id: "cd-6", tags: ["手写代码"], q: "大小端检测程序（两种方法）", a: `<pre><code class="language-c">// 方法1：union（类型安全）
int is_little_endian(void) {
    union { int i; char c[4]; } test;
    test.i = 1;
    return test.c[0] == 1; // little: 0x01,0x00,0x00,0x00
}
// 方法2：指针强制转换
int is_little_endian2(void) {
    int i = 1;
    return *(char *)&i == 1;
}
// 使用
if (is_little_endian()) printf("Little Endian\\n");
else printf("Big Endian\\n");</code></pre><p>方法1通过union共用同一块内存来访问int的各个字节，避免了指针类型转换的严格别名规则问题。</p>` },
      { id: "cd-7", tags: ["手写代码"], q: "循环队列(Circular Queue)完整实现", a: `<pre><code class="language-c">#define Q_SIZE 64
typedef struct {
    uint8_t buf[Q_SIZE];
    volatile int head;  // 写指针（volatile: ISR可能修改）
    volatile int tail;  // 读指针
} CircQueue;
int cq_is_full(CircQueue *q) { return ((q->head+1)%Q_SIZE) == q->tail; }
int cq_is_empty(CircQueue *q) { return q->head == q->tail; }
int cq_enqueue(CircQueue *q, uint8_t data) {
    if (cq_is_full(q)) return -1;
    q->buf[q->head] = data;
    q->head = (q->head + 1) % Q_SIZE;
    return 0;
}
int cq_dequeue(CircQueue *q, uint8_t *data) {
    if (cq_is_empty(q)) return -1;
    *data = q->buf[q->tail];
    q->tail = (q->tail + 1) % Q_SIZE;
    return 0;
}</code></pre><p>空一个元素区分满/空。若Q_SIZE为2的幂可用&(Q_SIZE-1)替代%优化。</p>` },
      { id: "cd-8", tags: ["手写代码"], q: "位操作实现乘除法（不用*/运算符）", a: `<pre><code class="language-c">// 乘法：a * b，用移位累加
int bit_multiply(int a, int b) {
    int result = 0, sign = 1;
    if (a < 0) { a = -a; sign = -sign; }
    if (b < 0) { b = -b; sign = -sign; }
    while (b > 0) {
        if (b & 1) result += a;  // b当前位为1则加a
        a <<= 1;                  // a左移=乘以2
        b >>= 1;                  // b右移=检查下一位
    }
    return sign > 0 ? result : -result;
}
// 除法：a / b，用移位减法
int bit_divide(int dividend, int divisor) {
    if (divisor == 0) return 0; // 避免除零
    int quot = 0, sign = 1;
    if (dividend < 0) { dividend = -dividend; sign = -sign; }
    if (divisor < 0) { divisor = -divisor; sign = -sign; }
    for (int i = 31; i >= 0; i--) {
        if ((dividend >> i) >= divisor) {
            quot |= (1 << i);
            dividend -= (divisor << i);
        }
    }
    return sign > 0 ? quot : -quot;
}</code></pre>` },
      { id: "cd-9", tags: ["手写代码"], q: "生产者-消费者模型(使用FreeRTOS API)", a: `<pre><code class="language-c">#define BUF_SIZE 10
typedef struct {
    int buf[BUF_SIZE]; int in, out;
    SemaphoreHandle_t mutex;           // 保护buf
    SemaphoreHandle_t empty_slots;     // 空闲槽位数(初始BUF_SIZE)
    SemaphoreHandle_t filled_slots;    // 已填入数据数(初始0)
} PC_Buffer;
void producer(PC_Buffer *pc, int item) {
    xSemaphoreTake(pc->empty_slots, portMAX_DELAY); // 等待空闲槽
    xSemaphoreTake(pc->mutex, portMAX_DELAY);
    pc->buf[pc->in] = item;
    pc->in = (pc->in + 1) % BUF_SIZE;
    xSemaphoreGive(pc->mutex);
    xSemaphoreGive(pc->filled_slots);  // 通知有数据
}
int consumer(PC_Buffer *pc) {
    xSemaphoreTake(pc->filled_slots, portMAX_DELAY); // 等待数据
    xSemaphoreTake(pc->mutex, portMAX_DELAY);
    int item = pc->buf[pc->out];
    pc->out = (pc->out + 1) % BUF_SIZE;
    xSemaphoreGive(pc->mutex);
    xSemaphoreGive(pc->empty_slots);   // 释放一个空槽
    return item;
}</code></pre><p>使用两个信号量(empty_slots/filled_slots)+一个互斥锁实现阻塞等待和并发安全。</p>` },
      { id: "cd-10", tags: ["手写代码"], q: "字符串中单词反转('hello world'→'world hello')", a: `<pre><code class="language-c">void reverse_chars(char *s, int start, int end) {
    while (start < end) {
        char t = s[start]; s[start] = s[end]; s[end] = t;
        start++; end--;
    }
}
void reverse_words(char *s) {
    if (!s || !*s) return;
    int len = strlen(s);
    // 第一步：整体翻转 "hello world"→"dlrow olleh"
    reverse_chars(s, 0, len - 1);
    // 第二步：逐个单词翻转 "dlrow olleh"→"world hello"
    int start = 0;
    for (int i = 0; i <= len; i++) {
        if (s[i] == ' ' || s[i] == '\\0') {
            reverse_chars(s, start, i - 1);
            start = i + 1; // 跳过空格
        }
    }
}</code></pre><p>两次翻转法：整体翻转→逐个单词翻转。O(n)时间/O(1)空间。注意处理连续空格和首尾空格（跳过空单词）。</p>` }
    ]
  }
];

// EMBEDDED_DATA 在 data_resume.js 末尾定义，因此处已能引用所有 DATA_PART 和 DATA_RESUME
