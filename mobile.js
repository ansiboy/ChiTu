export default class Mobile {
    /**
     * 创建 Mobile 对象
     * @param {HTMLElement} element 
     */
    constructor(element) {
        this.element = element;
    }

    init() {
        console.assert(location.hash.length > 1)
        let sample_name = location.hash.substr(1);
        let element = this.element;
        element.className = element.className + ' marvel-device iphone5c blue'
        element.innerHTML = `
<div class="top-bar"></div>
<div class="sleep"></div>
<div class="volume"></div>
<div class="camera"></div>
<div class="sensor"></div>
<div class="speaker"></div>
<div class="screen mobile-page">
<iframe src="samples/${sample_name}/#index"></iframe>
</div>
<div class="home"></div>
<div class="bottom-bar"></div>
        `
        let width = element.parentElement.offsetWidth //window.innerWidth
        let padding = 50
        let inner_width = width - padding
        const mobile_width = element.offsetWidth
        if (inner_width <= mobile_width) {
            let scale = new Number(inner_width / mobile_width).toFixed(2)
            element.style.transform = `scale(${scale},${scale})`
        }
    }
}