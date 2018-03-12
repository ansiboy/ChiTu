# 页面事件

## 页面的创建

```mermaid
graph TD
    page_constructor[构造函数] --> load_action[加载 action]
    load_action --> is_load_success{加载成功}
    is_load_success --> |NO|throw_exception[抛出异常]
    throw_exception --> finish
    is_load_success --> |YES| on_load[load 事件]
    on_load --> execute_action[调用 action]
    execute_action --> load_complete
    load_complete --> finish
end
```

```mermaid
sequenceDiagram
    participant John
    participant Alice
    Alice->>John: Hello John, how are you?
    John-->>Alice: Great!
````