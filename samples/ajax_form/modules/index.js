define(["exports"], function (exports) {
    /**
     * 
     * @param {chitu.Page} page 
     */
    function action(page) {
        page.element.innerHTML = "<h1>AJAX 调用示例</h1>"

        let dataContainer = document.createElement("div")
        page.element.appendChild(dataContainer)

        let service = page.createService(chitu.Service);

        let url = "http://service.alinq.cn/UserSite/Home/GetHomeProducts?pageIndex=0"
        service.ajax(url, {
            headers: {
                'Application-Key': '59a0d63ab58cf427f90c7d3e'
            }
        }).then(data => {
            for (let i = 0; i < data.length; i++) {
                let element = document.createElement('div')
                element.innerHTML = data[i].Name
                dataContainer.appendChild(element)
            }

        })
    }

    exports.default = action
});

