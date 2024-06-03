class ArrayUtils {
    static removeElement(object, array) {
        const isEqual = (element) => element === object;
        var index = array.findIndex(isEqual);
        if (index != -1) {
            array.splice(index, 1);
        }
    }

    static contains(array, object) {
        const isEqual = (element) => element === object;
        return array.findIndex(isEqual) != -1;
    }
}

class Tools {
    static ofType(a) {
        var type = arguments[0];
        if (typeof type !== "string") return;
        if (arguments.length <= 1) return;

        //Array
        if (Array.isArray(arguments[1])) {
            var allEqual = true;

            for (var i = 1; i < arguments[1].length; i++) {
                if (typeof arguments[i] !== type) {
                    allEqual = false;
                }
            }
            return allEqual;
        }

        //Mulitple
        for (var i = 1; i < arguments.length; i++) {
            if (typeof arguments[i] !== type) {
                return false;
            }
        }
        return true;
    }

    static ofInstance(a) {
        var type = arguments[0];
        if (typeof type !== "object") return;
        if (arguments.length === 1) return;

        //Array
        if (Array.isArray(arguments[1])) {
            var allEqual = true;

            for (var i = 1; i < arguments[1].length; i++) {
                if (!(arguments[i] instanceof a)) {
                    allEqual = false;
                }
            }
            return allEqual;
        }

        //Mulitple
        for (var i = 1; i < arguments.length; i++) {
            if (!(arguments[i] instanceof a)) {
                return false;
            }
        }
        return true;
    }

    /*
    Works on both positive and negative numbers
    */
    static round(x) {
        return (x + (x < 0) ? -0.5 : 0.5) << 0;
    }

    /*
    Quicker than round, but it only work on positive numbers 
    */
    static positiveRound(x) {
        return (x + 0.5) << 0;
    }
}

class HTMLUtils {
    static center(element, horizontally, vertically) {
        if (!horizontally && !vertically) return;
        element.style.position = "absolute";

        if (horizontally && vertically) {
            element.style.left = "50%";
            element.style.top = "50%";
            element.style.transform = "translate(-50%, -50%)";
        } else if (vertically) {
            element.style.top = "50%";
            element.style.transform = "translate(0, -50%)";
        } else if (horizontally) {
            element.style.left = "50%";
            element.style.transform = "translate(-50%, 0)";
        }
    }

    static style(element, property, value) {
        element.style.setProperty(property, value);
    }

    static setPosition(el, x, y) {
        el.style.position = "absolute";
        el.style.left = x + "px";
        el.style.top = y + "px";
    }
}

// Inspired by: https://gist.github.com/blixt/f17b47c62508be59987b
class Random {
    constructor(seed_) {
        this.setSeed(seed_);
    }

    /**
     * Returns a value between 1 and 2^32 - 2.
     */
    next() {
        this.seed = (this.seed * 97882) % 2147483647;
        return this.seed;
    }
    
    /**
     * Returns a number in the range [0, 1>.
     */
    nextFloat() {
        return (this.next() - 1) / 2147483646;
    }

    setSeed(seed_) {
        if(typeof seed_ === "number" && !Number.isNaN(seed_)) {
            this.seed = seed_ % 2147483647;
            if (this.seed <= 0) this.seed += 2147483646;
        } else {
            this.seed = Math.random() * 2147483647;
        }
    }
}

class Timer {
    constructor(callback, delay /*delay in milliseconds*/) {
        this.startTime = performance.now();
        if (arguments.length > 0) {
            this.timeoutID = setTimeout(callback, delay);
        }
    }

    millis() {
        let now = performance.now();
        return now - this.startTime;
    }

    seconds() {
        return this.millis() / 1000;
    }

    cancel() {
        clearTimeout(this.timeoutID);
    }
}
export { Timer, Tools, Random, ArrayUtils, HTMLUtils };
