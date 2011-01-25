require("./long-stack-traces");

function initSecondTimeout() {
    setTimeout(function secondTimeout() {
        try {
            throw new Error();
        } catch (e) {
            console.log(e.stack)
        }
    }, 1000);
}

function onload() {
    // function f() {
    //     throw new Error('foo');
    // }
    // setTimeout(f, Math.random()*1000);
    // setTimeout(f, Math.random()*1000);

    setTimeout(function firstTimeout() {
        initSecondTimeout();
    }, 1000);
}

onload();
