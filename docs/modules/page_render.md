# 页面的呈现

为了更好的理解页面呈现的原理，下面讲解一下页面呈现的工作流程

* 监听 URL，在创建完成 Application 对象后，调用 run 方法，Application 对象会监听 URL 的变化
* 解释 URL，Application 对 URL 进行解释成，解释的结果有两部份，name 和 data，例如：

    `html
    index.html#product?id=123
    `

    经过解释后，得到

    `html
    name = product
    data = { id: 123 }
    `
* 根据解释得到的 name ，检索 siteMap 中匹配的节点，提取节点中 action
* 创建 HTML 元素，Application 对象调用 createElement 方法，创建 HTML 元素
* 创建 Page 对象，并且把 name，data，action，html 元素传递给 Page 对象。
* 呈现页面。Page 对象调用 action 方法来呈现页面。如果 action 是字符串而不是函数，通过字符串加载 js 脚本，获取 action 函数。

以上就是页面的呈现流程