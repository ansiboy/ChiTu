define(function () {
    /**
     * @param {HTMLElement} page 
     */
    function main(element) {
        console.assert(location.hash.length > 1)
        let sample_name = location.hash.substr(1);
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
    }

    return main
});