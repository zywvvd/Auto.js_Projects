let ext = {
    /**
     * Assign some checkers to global object (all started with "$$)
     * @example
     * $$bool(0.5 === "0.5"); // false
     * $$str("1991"); // true
     * $$und(coffee); // true -- undefined
     * $$num(0); // true
     * $$num(20, "<", 28, "<=", Infinity); // true
     * $$num(20, "<", 28, ">=", 1, ">", -Infinity, "<=", -0, "=", +0); // true
     * @return void
     */
    Global() {
        let _classof = (src, chk) => {
            let _s = Object.prototype.toString.call(src).slice(8, -1);
            return chk ? _s.toUpperCase() === chk.toUpperCase() : _s;
        };
        let _keysLen = (o, n) => Object.keys(o).length === n;
        let _compare = {
            "<": (a, b) => a < b,
            "<=": (a, b) => a <= b,
            ">": (a, b) => a > b,
            ">=": (a, b) => a >= b,
            "=": (a, b) => a === b,
        };

        Object.assign(global, {
            $$0: x => x === 0,
            $$1: x => x === 1,
            $$2: x => x === 2,
            $$num(x) {
                // do not use arrow function here
                let _isNum = a => _classof(a, "Number");
                let _isStr = a => _classof(a, "String");
                let _args = arguments;
                let _len = _args.length;

                if (_len === 1) return _isNum(x);
                if (_len === 2) return x === _args[1];

                for (let i = 1; i < _len; i += 2) {
                    let _a = _args[i - 1];
                    let _opr = _args[i]; // operational symbol
                    let _b = _args[i + 1];
                    if (!_isStr(_opr) || !_isNum(_b)) return;
                    if (!(_opr in _compare)) return;
                    if (!_compare[_opr](_a, _b)) return false;
                }

                return true;
            },
            $$str(x) {
                let _isStr = a => _classof(a, "String");
                let _args = arguments;
                let _len = _args.length;
                let _args_arr = [];

                if (_len === 1) return _isStr(x);
                if (_len === 2) return x === _args[1];

                for (let i = 0; i < _len; i += 1) {
                    _args_arr[i] = _args[i].toString();
                }

                for (let i = 1; i < _len; i += 2) {
                    let _a = _args_arr[i - 1];
                    let _opr = _args_arr[i]; // operational symbol
                    let _b = _args_arr[i + 1];
                    if (!(_opr in _compare)) return;
                    if (!_compare[_opr](_a, _b)) return false;
                }

                return true;
            },
            $$bool: x => _classof(x, "Boolean"),
            // `classof(x, "Undefined")` also fine
            $$und: x => x === void 0,
            $$nul: x => _classof(x, "Null"),
            // introduced since ES6
            $$sym: x => _classof(x, "Symbol"),
            $$bigint: x => _classof(x, "BigInt"),
            // primitive (7 types including Symbol and BigInt)
            $$prim(x) {
                return this.$$num(x) || this.$$str(x) || this.$$bool(x)
                    || this.$$nul(x) || this.$$und(x) || this.$$sym(x)
                    || this.$$bigint(x);
            },
            $$func: x => _classof(x, "Function"),
            // `Array.isArray(x);` fine or not ?
            // i guess it will be fine as long as
            // the global object is not Window (for a browser)
            $$arr: x => _classof(x, "Array"),
            // Object only
            $$obj: x => _classof(x, "Object"),
            $$emptyObj: x => _classof(x, "Object") && _keysLen(x, 0),
            $$noEmptyObj: x => _classof(x, "Object") && !_keysLen(x, 0),
            // Null; Array; Object
            $$comObj: x => typeof x === "object",
            $$date: x => _classof(x, "Date"),
            $$regexp: x => _classof(x, "RegExp"),
            $$rex: x => _classof(x, "RegExp"),
            // nullish coalescing operator: ??
            $$nullish(x) {
                return this.$$nul(x) || this.$$und(x);
            },
            $$fin: x => isFinite(x),
            $$inf: x => !isFinite(x),
            $$nan: x => typeof x === "number" && isNaN(x),
            $$posNum(x) {
                return this.$$num(x) && x > 0;
            },
            $$noPosNum(x) {
                return this.$$num(x) && x <= 0;
            },
            $$natNum(x) {
                return this.$$zehNum(x) && x >= 0;
            },
            $$negNum(x) {
                return this.$$num(x) && x < 0;
            },
            $$noNegNum(x) {
                return this.$$num(x) && x >= 0;
            },
            // `Number.isInteger(x)` since ES6
            $$zehNum(x) {
                return this.$$num(x) && (x | 0) === x;
            },
            // `!~x` is also cool
            $$neg1: x => x === -1,
            $$T: x => x === true,
            $$F: x => x === false,
            $$len(x, n) {
                if (!_classof(x, "Arguments") && !_classof(x, "Array")) {
                    throw TypeError("Expected Array or Arguments rather than " + _classof(x));
                }
                if (_classof(n, "Number")) return x.length === n;
                return x.length;
            },
            // `classof(x, "JavaObject");` also fine
            __isJvo__: x => !!x["getClass"],
            _checkJvoType(x, rex) {
                return this.__isJvo__(x) && !!x.toString().match(rex);
            },
            _checkJvoClass(x, rex) {
                let _classMatch = (x, rex) => x["getClass"].toString().match(rex);
                return this.__isJvo__(x) && _classMatch(x, rex);
            },
            get $$jvo() {
                return {
                    isJvo: x => this.__isJvo__(x),
                    ScriptEngine: x => this._checkJvoType(x, /^ScriptEngine/),
                    Thread: x => this._checkJvoType(x, /^Thread/),
                    UiObject: x => this._checkJvoType(x, /UiObject/),
                    UiObjects: x => this._checkJvoType(x, /UiObjectCollection/),
                    UiGlobSel: x => this._checkJvoType(x, /UiGlobalSelector/),
                    JsRawWin: x => this._checkJvoType(x, /JsRawWindow/),
                    ImageWrapper: x => this._checkJvoType(x, /ImageWrapper/),
                    Point: x => this._checkJvoType(x, /^{.+}$/),
                    AtomicLong: x => this._checkJvoClass(x, /AtomicLong/),
                };
            },
        });
        Object.assign(global, {
            /**
             * @summary global.toast
             * @description toast a message in current screen
             * @override
             * @param {string|*} [msg=""] -
             * string (or any value with toString() method) to toast
             * @param {boolean|string|number} [if_long=0] -
             * controlling toast duration (falsy for LENGTH_SHORT; truthy for LENGTH_LONG)
             * @param {boolean|*} [if_force] -
             * controlling whether showing current new toast immediately or not
             * @example
             * // toast "Hello" for around 2 seconds
             * toast("Hello");
             * // toast "Hello" for around 3.5 seconds
             * toast("Hello", "Long");
             * // toast "Hello" for around 2 seconds
             * // after then toast "Hello again" for around 3.5 seconds
             * toast("Hello");
             * toast("Hello again", "Long");
             * // only toast "Hello again" for around 3.5 seconds
             * // because "Hello" was cancelled by "Hello again" immediately
             * toast("Hello");
             * toast("Hello again", "Long", "Force");
             * // toast "Hello" for around 1 second
             * // and then toast "Hello again" for around 3.5 seconds
             * toast("Hello");
             * sleep(1000);
             * toast("Hello again", "Long", "Force");
             * // as you imagined, toast "Hello" for around 3.5 seconds
             * // then toast "Hello again" for around 3.5 seconds
             * toast("Hello", "Long", "Force");
             * toast("Hello again", "Long");
             * // only toast "Hello again" for around 2 seconds
             * toast("Hello", "Long", "Force");
             * toast("Hello again", 0, "Force");
             */
            toast(msg, if_long, if_force) {
                let _nullish = o => o === null || o === undefined;
                let _msg = _nullish(msg) ? "" : msg.toString();
                let _if_long = (() => {
                    if (typeof if_long === "number") {
                        return +!!if_long;
                    }
                    if (typeof if_long === "string") {
                        return +!!(if_long.toUpperCase().match(/^L(ONG)?$/));
                    }
                    if (typeof if_long === "boolean") {
                        return +if_long;
                    }
                    return 0;
                })();
                let _s_handler = new android.os.Handler(
                    android.os.Looper.getMainLooper()
                );
                _s_handler.post(function () {
                    if (if_force && global["_toast_"]) {
                        global["_toast_"].cancel();
                        global["_toast_"] = null;
                    }
                    global["_toast_"] = android.widget.Toast.makeText(
                        context, _msg, _if_long
                    );
                    global["_toast_"].show();
                });
            },
        });
    },
    String() {
        if (!String["toTitleCase"]) {
            Object.defineProperty(String.prototype, "toTitleCase", {
                /**
                 * Converts all the alphabetic characters in a string to title case.
                 * @function String.prototype.toTitleCase
                 * @see String.prototype.toUpperCase
                 * @see String.prototype.toLowerCase
                 * @see String.prototype.slice
                 * @returns {string}
                 */
                value() {
                    let _str = this.toString();
                    if (!_str) {
                        return "";
                    }
                    return _str[0].toUpperCase() + _str.slice(1).toLowerCase();
                },
            });
        }
        if (!String["trimStart"]) {
            Object.defineProperty(String.prototype, "trimStart", {
                value() {
                    return this.replace(/^\s*/, "");
                },
            });
        }
        if (!String["trimEnd"]) {
            Object.defineProperty(String.prototype, "trimEnd", {
                value() {
                    return this.replace(/\s*$/, "");
                },
            });
        }
        if (!String["trimLeft"]) {
            Object.defineProperty(String.prototype, "trimLeft", {
                value() {
                    return this.trimStart();
                },
            });
        }
        if (!String["trimRight"]) {
            Object.defineProperty(String.prototype, "trimRight", {
                value() {
                    return this.trimEnd();
                },
            });
        }
        if (!String["trimBoth"]) {
            Object.defineProperty(String.prototype, "trimBoth", {
                value() {
                    return this.trimStart().trimEnd();
                },
            });
        }
    },
    Object() {
        if (!Object["values"]) {
            Object.defineProperty(Object, "values", {
                value(o) {
                    if (o !== Object(o)) {
                        throw new TypeError("Object.values called on a non-object");
                    }
                    let key;
                    let value = [];
                    for (key in o) {
                        if (o.hasOwnProperty(key)) {
                            value.push(o[key]);
                        }
                    }
                    return value;
                },
            });
        }
        if (!Object["size"]) {
            Object.defineProperty(Object, "size", {
                /**
                 * @summary Object.keys(o).length
                 * @function Object.size
                 * @param {{}} o
                 * @param {{}} [opt] - additional options
                 * @param {[]} [opt.exclude] - exclude specified keys
                 * @param {[]} [opt.include] - include specified keys ONLY, and o.exclude will be invalid
                 * @returns {number}
                 */
                value(o, opt) {
                    let _opt = opt || {};
                    let _inc = _opt.include;
                    let _exc = _opt.exclude;
                    let _cnt = 0;
                    for (let i in o) {
                        if (o.hasOwnProperty(i)) {
                            if (_inc) {
                                if (~_inc.indexOf(i)) {
                                    _cnt += 1;
                                }
                                continue;
                            }
                            if (_exc) {
                                if (~_exc.indexOf(i)) {
                                    continue;
                                }
                            }
                            _cnt += 1;
                        }
                    }
                    return _cnt;
                },
            });
        }
    },
    Array() {
        if (!Array["includes"]) {
            Object.defineProperty(Array.prototype, "includes", {
                value(x, i) {
                    return this.slice(i).some((v) => {
                        if (typeof x !== "undefined") {
                            return Number.isNaN(x) ? Number.isNaN(v) : x === v;
                        }
                    });
                },
            });
        }
    },
    Number() {
        if (!Number["clamp"]) {
            Object.defineProperty(Number.prototype, "clamp", {
                /**
                 * Returns a number clamped to inclusive range of min and max
                 * @function Number.prototype.clamp
                 * @param {...number|*} [args] -
                 * inclusive range indicated by numbers
                 * or values could be converted to numbers
                 * @example
                 * // 'clamp' often used for an alterable or random number
                 * Math.rand([-5, 9]).clamp([0, 10]);
                 * Math.rand([-5, 9]).clamp(0, 10); // also OK but not recommended
                 * // different from Math.rand([0.3, 0.5])
                 * Math.random().clamp([0.3, 0.5]);
                 * // always returns the source number itself
                 * (9).clamp(); // 9
                 * (99).clamp(); // 99
                 * // always returns the numeric value of param
                 * (9).clamp([80]); // 80 -- same as clamp([80, 80])
                 * (99).clamp(["80"]); // 80 -- +"80" -> 80
                 * // (10).clamp([false, "Hi", [-1], "7"])
                 * // -> (10).clamp([+false, +"Hi", +[-1], +"7"])
                 * // -> (10).clamp([0, NaN, -1, 7]) // numeric converted
                 * // -> (10).clamp([0, -1, 7]) // filtered
                 * // -> (10).clamp([-1, 0, 7]) // sorted, range: [-1, 7]
                 * // -> 7
                 * (10).clamp([false, "Hi", [-1], "7"]); // 7
                 * @returns {number}
                 */
                value(args) {
                    let _num = this.valueOf();
                    let _args = (!Array.isArray(args)
                        ? Array.prototype.slice.call(arguments)
                        : args)
                        .map(x => +x)
                        .filter(x => !isNaN(x))
                        .sort((x, y) => x === y ? 0 : x > y ? 1 : -1);
                    let _len = _args.length;
                    if (_len) {
                        let _min = _args[0];
                        let _max = _args[_len - 1];
                        if (_num < _min) {
                            return _min;
                        }
                        if (_num > _max) {
                            return _max;
                        }
                    }
                    return _num;
                },
            });
        }
        if (!Number["ICU"]) {
            Object.defineProperty(Number.prototype, "ICU", {
                /**
                 * 996.ICU - Developers' lives matter
                 * @name ICU
                 * @memberOf! Number#
                 * @constant
                 * @type number
                 * @example
                 * (1).ICU; // 996
                 * (80).ICU; // 996
                 * (996).ICU; // 996
                 * Math.random().ICU; // 996
                 * @default 996
                 */
                value: (() => {
                    let _working_days = 5;
                    let _weekends = 2;
                    let _health = "[your health]";
                    return Math.round(
                        "Hard working only".split(new RegExp(_health)).map((x) => (
                            !x ? 996 / _working_days / _weekends - _weekends : x.charCodeAt(0)
                        )).reduce((x, y) => x + y)
                    );
                })(),
            });
        }
        if (!Number["toFixedNum"]) {
            Object.defineProperty(Number.prototype, "toFixedNum", {
                /**
                 * Returns a number value of Number.prototype.toFixed()
                 * @function Number.prototype.toFixedNum
                 * @param {number} [num=0] -
                 * number of digits after the decimal point
                 * @see Number.prototype.toFixed
                 * @example
                 * let num_a = 9;
                 * num_a.toFixed();     // "9"    -- string
                 * num_a.toFixedNum();  //  9     -- number
                 * num_a.toFixed(1);    // "9.0"  -- string
                 * num_a.toFixedNum(1); //  9     -- number
                 * num_a.toFixed(2);    // "9.00" -- string
                 * num_a.toFixedNum(2); //  9     -- number
                 *
                 * let num_b = 9.04;
                 * num_b.toFixed();     // "9"    -- string
                 * num_b.toFixedNum();  //  9     -- number
                 * num_b.toFixed(1);    // "9.0"  -- string
                 * num_b.toFixedNum(1); //  9     -- number
                 * num_b.toFixed(2);    // "9.04" -- string
                 * num_b.toFixedNum(2); //  9.04  -- number
                 *
                 * let num_c = 9.5995;
                 * num_c.toFixed();     // "10"   -- string
                 * num_c.toFixedNum();  //  10    -- number
                 * num_c.toFixed(1);    // "9.6"  -- string
                 * num_c.toFixedNum(1); //  9.6   -- number
                 * num_c.toFixed(2);    // "9.60" -- string
                 * num_c.toFixedNum(2); //  9.6   -- number
                 * @returns {number}
                 */
                value(num) {
                    return Number(this.toFixed(num));
                },
            });
        }
    },
    Math() {
        Object.assign(Math, {
            /**
             * @return {[]}
             * @private
             */
            _parseArgs(num_arr, fraction) {
                let _arr, _fraction;
                if (Array.isArray(num_arr)) {
                    _arr = this._spreadArr(num_arr);
                    _fraction = fraction;
                } else {
                    _arr = this._spreadArr(arguments);
                }
                return [_arr, _fraction];
            },
            /**
             * @return {[]}
             * @private
             */
            _spreadArr(arr) {
                let _plain = [];
                let _len = (arr || []).length;
                for (let i = 0; i < _len; i += 1) {
                    let _e = arr[i];
                    Array.isArray(_e)
                        ? _plain = _plain.concat(this._spreadArr(_e))
                        : _plain.push(_e);
                }
                return _plain;
            },
            /**
             * @summary Random Number (zh-CN: 随机数)
             * @description Returns a pseudorandom number between min and max from the 'range' param
             * @function Math.rand
             * @param {*|number[]|number} [range=[0,1]] -
             * range could contains more than 2 numbers
             * or with one number for [0, range]
             * or left empty for [0, 1]
             * @param {number} [fraction] -
             * number of digits after the decimal point and
             * must be in the range [0, 20]
             * @see Math.random
             * @see Number.prototype.toFixed
             * @example
             * // same as Math.random()
             * Math.rand();
             * Math.rand(1);
             * Math.rand([0, 1]);
             * // Math.random() with Number.toFixedNum(x): number
             * // 'range' could be any falsy value like 0,null,undefined,""
             * // or with value like example above like 1,[0,1]
             * Math.rand(0, 2); // eg: 0.34; 0.79; 0.3 (won't be "0.30" which must be a number)
             * // returns either 0 or 1 with 50% possibility of each
             * Math.rand(0, 0); // same as Math.rand([0, 1], 0)
             * // returns an integer in range of 100-500 (both inclusive)
             * Math.rand([100, 500], 0);
             * // elements in 'range' with 'Array' type will be sorted
             * Math.rand([500, 100], 0); // same as above
             * // 'range' with 'Array' type with more than 2 elements will be picked up
             * Math.rand([500, 200, -80, 100], 0); // same as above
             * // parseInt() will be applied to each element in 'range' with 'Array' type
             * Math.rand([-8, "Hello", NaN, "123", 99], 0); // same as Math.rand([-8, 123], 0)
             * // Infinity and -Infinity were accepted (in range of Number.MIN(MAX)_SAFE_INTEGER)
             * Math.rand([-Infinity, Infinity], 2); // eg: 42398472893; -43785571; -851119.3
             * Math.rand(Infinity, 2); // same as Math.rand([0, Infinity], 2)
             * Math.rand(-Infinity, 2); // same as Math.rand([-Infinity, 0], 2)
             * // caution about right-bounded ({@see Number.prototype.toFixed})
             * Math.rand([0, 1]); // 0 <= x < 1  -- left-closed and right-open without toFixed()
             * Math.rand([0, 1], 0); // 0 <= x <= 1  -- left-closed and right-closed with toFixed()
             * Math.rand([0, 1], 2); // 0 <= x <= 1  -- left-closed and right-closed with toFixed()
             * @returns {number}
             */
            rand(range, fraction) {
                let _min, _max;
                let _gap = () => _max - _min;

                if (!Array.isArray(range)) {
                    range = [0, range || 1];
                }
                range = range
                    .map(x => typeof x === "number" && !isFinite(x) && !isNaN(x)
                        ? Object.is(0 / x, 0)
                            ? Number.MAX_SAFE_INTEGER
                            : Number.MIN_SAFE_INTEGER
                        : +x)
                    .filter(x => !isNaN(x))
                    .sort((a, b) => a === b ? 0 : a > b ? 1 : -1);
                _min = range[0];
                _max = range[range.length - 1];

                let _rand = Math.random() * _gap() + _min;
                if (typeof fraction === "undefined") {
                    return _rand;
                }
                return +_rand.toFixed(+fraction || 0);
            },
            /**
             * @summary Sum (zh-CN: 求和)
             * @description Returns a sum of numbers with (or without) fraction digits
             * @function Math.sum
             * @param {number|Array<T>} [num_arr] -
             * numbers needed to be summed up
             * @param {?number} [fraction] -
             * number of digits after the decimal point and
             * must be in the range [0, 20]
             * @template T
             * @example
             * Math.sum(); // 0
             * Math.sum(1); // 1
             * Math.sum(1, 2); // 3
             * Math.sum(1, 2, 3); // 6
             * Math.sum(1, "2", [3]); // 6
             * Math.sum(1, [2], [[3, 4], 5]); // 15
             * Math.sum(1.01, 2.02); // 3.0300000000000002
             * Math.sum([1.01, 2.02], 2); // 3.03
             * Math.sum([1.01, 2.02], 1); // 3 (won't be "3.0" which must be a number)
             * Math.sum([1.01, 2.02], 0); // 3
             * Math.sum("ABC", NaN, {a: 1}, 3, "5.2"); // 8.2 (3 and 5.2)
             * Math.sum(["ABC", NaN, {a: 1}, 3, "5.2"], 0); // 8
             * @returns {number}
             */
            sum(num_arr, fraction) {
                let [_arr, _frac] = this._parseArgs.apply(this, arguments);
                if (!_arr.length) {
                    return 0;
                }
                let _sum = _arr.reduce((a, b) => {
                    let [_a, _b] = [+a, +b].map(x => isNaN(x) ? 0 : x);
                    return _a + _b;
                });
                let _frac_num = parseInt(_frac);
                return isNaN(_frac_num) ? _sum : +_sum.toFixed(_frac_num);
            },
            /**
             * @summary Arithmetic Mean (zh-CN: 算术平均数)
             * @description Returns the average of numbers with (or without) fraction digits
             * @function Math.avg
             * @param {number|Array<T>} [num_arr] -
             * numbers needed to be averaged
             * @param {?number} [fraction] -
             * number of digits after the decimal point and
             * must be in the range [0, 20]
             * @template T
             * @example
             * Math.avg(); // NaN
             * Math.avg(1); // 1
             * Math.avg(1, 2); // 1.5
             * Math.avg(1, 2, 3); // 2 (6 / 3)
             * Math.avg(1, "2", [3]); // 2 (6 / 3)
             * Math.avg(1, [2], [[3, 4], 5]); // 3 (15 / 5)
             * Math.avg(1.01, 2.02); // 1.5150000000000001
             * Math.avg([1.01, 2.02], 2); // 1.52
             * Math.avg([1.01, 2.02], 1); // 1.5
             * Math.avg([1.01, 2.02], 0); // 2
             * Math.avg("ABC", NaN, {a: 1}, 3, "5.2"); // 4.1 ((3 + 5.2) / 2)
             * Math.avg(["ABC", NaN, {a: 1}, 3, "5.2"], 0); // 4 (4.1).toFixed(0)
             * @returns {number}
             */
            avg(num_arr, fraction) {
                let [_arr, _frac] = this._parseArgs.apply(this, arguments);
                let _filtered = _arr.filter(x => !isNaN(+x));
                if (!_filtered.length) {
                    return NaN;
                }
                let _sum = _filtered.reduce((a, b) => +a + +b);
                let _avg = _sum / _filtered.length;
                let _frac_num = parseInt(_frac);
                return isNaN(_frac_num) ? _avg : +_avg.toFixed(_frac_num);
            },
            /**
             * @summary Variance (zh-CN: 方差)
             * @description Population Variance (zh-CN: 总体方差)
             * @see Math.avg
             * @example
             * Math.var(1,2,3,4,5); // 2
             * Math.var(97,98,98,99,100,101,103,104); // 5.5
             * Math.var([97,98,98,99,100,101,103,104], 0); // 6
             * @returns {number}
             */
            var(num_arr, fraction) {
                let [_arr, _frac] = this._parseArgs.apply(this, arguments);
                if (!_arr.length) {
                    return NaN;
                }
                let _filtered = _arr.filter(x => !isNaN(+x));
                let _avg = Math.avg(_filtered);
                let _len = _filtered.length;

                let _acc = 0;
                for (let i = 0; i < _len; i += 1) {
                    _acc += Math.pow((_filtered[i] - _avg), 2);
                }
                let _var = _acc / _len;
                let _frac_num = parseInt(_frac);
                return isNaN(_frac_num) ? _var : +_var.toFixed(_frac_num);
            },
            /**
             * @summary Standard Deviation / Mean-Square Deviation (zh-CN: 标准差/均方差)
             * @description Population Standard Deviation (zh-CN: 总体标准差)
             * @see Math.var
             * @example
             * Math.std(1,2,3,4,5); // 1.4142135623730951
             * Math.std([1,2,3,4,5], 1); // 1.4
             * Math.std(97,98,98,99,100,101,103,104); // 2.345207879911715
             * Math.std([97,98,98,99,100,101,103,104], 3); // 2.345
             * @returns {number}
             */
            std(num_arr, fraction) {
                let [_arr, _frac] = this._parseArgs.apply(this, arguments);
                if (!_arr.length) {
                    return NaN;
                }
                let _filtered = _arr.filter(x => !isNaN(+x));
                let _std = Math.sqrt(Math.var(_filtered));
                let _frac_num = parseInt(_frac);
                return isNaN(_frac_num) ? _std : +_std.toFixed(_frac_num);
            },
            /**
             * @summary Coefficient of Variation (zh-CN: 变异系数/离散系数)
             * @see Math.avg
             * @example
             * Math.cv(1); // NaN
             * Math.cv(1, 1); // 0
             * Math.cv(22, 985, 3654, 98474, 698); // 2.092865807313618
             * Math.cv([22, 985, 3654, 98474, 698], 2); // 2.09
             * @returns {number} -- good reference: 0.5 (even 10, not absolutely)
             */
            cv(num_arr, fraction) {
                let [_arr, _frac] = this._parseArgs.apply(this, arguments);
                let _filtered = _arr.filter(x => !isNaN(+x));
                let _len = _filtered.length;
                if (_len < 2) {
                    return NaN;
                }

                let _avg = Math.avg(_filtered);
                let _acc = 0;
                for (let i = 0; i < _len; i += 1) {
                    _acc += Math.pow((_filtered[i] - _avg), 2);
                }
                /**
                 * Sample Standard Deviation (zh-CN: 样本标准差)
                 * @type {number}
                 * @private
                 */
                let _std_smp = Math.pow(_acc / (_len - 1), 0.5);
                let _cv = _std_smp / _avg;
                let _frac_num = parseInt(_frac);
                return isNaN(_frac_num) ? _cv : +_cv.toFixed(_frac_num);
            },
            /**
             * @summary Polyfill and extension for Math.max(...number[])
             * @description Returns the maximum element in a numeric array
             * for JavaScript engines like Rhino (maybe old versions only)
             * which doesn't support spread syntax like Math.max(...number[])
             * @function Math.maxi
             * @param {number|Array<T>} [num_arr] -
             * numbers needed to be calculated
             * @param {?number} [fraction] -
             * number of digits after the decimal point and
             * must be in the range [0, 20]
             * @template T
             * @example
             * // examples whose results are same as Math.max()
             *
             * Math.maxi(); // -Infinity (negative)
             * Math.maxi(1, 2, 3, 4); // 4
             * // false can be converted to 0
             * // "3" and [2] can be converted to 3 and 2
             * Math.maxi([3], "2", 1, false); // 3
             *
             * // examples available for Math.maxi() but NaN for Math.max()
             *
             * // array cannot be converted to a number
             * // when array was the first parameter of Math.maxi()
             * // elements inside will be spread as arguments for Math.max()
             * Math.maxi([1, 2, 3, 4]); // 4
             * Math.maxi([0.123, 0.234]); // 0.234
             * Math.maxi([0.123, 0.234], 1); // 0.2
             * // "false" isn't false which cannot be converted to a number
             * Math.maxi(3, "2", [1], "false"); // 3
             * // the last parameter 2 is the argument for 'fraction'
             * // meaning not participating the calculation
             * Math.maxi([1, {}, [1000 / 3], "4", "55"], 2); // 333.33
             * // as most customized Math functions does,
             * // calculation was supported by nesting array
             * Math.maxi(1, [[[10], 20], 83], 20, [-9], [27, 72]); // 83
             *
             * // examples whose results are not same as Math.max()
             *
             * // Math.maxi([])
             * // -> Math.max.apply({}, [])
             * // -> Math.max() -> -Infinity
             * // Math.max([])
             * // -> Math.max(+[])
             * // -> Math.max(0) -> 0
             * Math.maxi([]); // -Infinity vs 0
             * // Math.maxi([3], 4)
             * // -> +Math.max(3).toFixed(4) -> 3
             * // Math.max([3], 4)
             * // -> Math.max(+[3], 4)
             * // -> Math.max(3, 4) -> 4
             * Math.maxi([3], 4); // 3 vs 4
             * // Math.maxi([3], "5", 1, false)
             * // -> Math.maxi([3], "5") // [3] is num_arr, "5" is fraction
             * // -> Math.maxi([3], 5) -> 3
             * // Math.max([3], "5", 1, false)
             * // -> Math.max(+[3], +"5", 1, +false)
             * // -> Math.max(3, 5, 1, 0) -> 5
             * Math.maxi([3], "5", 1, false); // 3 vs 5
             * @returns {number}
             */
            maxi(num_arr, fraction) {
                let _arr, _fraction;

                if (Array.isArray(num_arr)) {
                    _arr = this._spreadArr(num_arr);
                    _fraction = fraction;
                } else {
                    _arr = this._spreadArr(arguments);
                }

                let _filtered = _arr.filter(x => !isNaN(+x));
                let _max = Math.max.apply({}, _filtered);
                let _frac = parseInt(_fraction);
                return isNaN(_frac) ? _max : +_max.toFixed(_frac);
            },
            /**
             * @summary Polyfill and extension for Math.min(...number[])
             * @description Returns the minimum element in a numeric array
             * for JavaScript engines like Rhino (maybe old versions only)
             * which doesn't support spread syntax like Math.min(...number[])
             * @function Math.mini
             * @param {number|Array<T>} [num_arr] -
             * numbers needed to be calculated
             * @param {?number} [fraction] -
             * number of digits after the decimal point and
             * must be in the range [0, 20]
             * @template T
             * @example
             * // examples whose results are same as Math.min()
             *
             * Math.mini(); // Infinity (positive)
             * Math.mini(1, 2, 3, 4); // 1
             * // false can be converted to 0
             * // "3" and [2] can be converted to 3 and 2
             * Math.mini("3", [2], 1, false); // 0
             *
             * // examples available for Math.mini() but NaN for Math.min()
             *
             * // array cannot be converted to a number
             * // when array was the first parameter of Math.mini()
             * // elements inside will be spread as arguments for Math.min()
             * Math.mini([1, 2, 3, 4]); // 1
             * Math.mini([0.123, 0.234]); // 0.123
             * Math.mini([0.123, 0.234], 1); // 0.1
             * // "false" isn't false which cannot be converted to a number
             * Math.mini(3, "2", [1], "false"); // 1
             * // the last parameter 2 is the argument for 'fraction'
             * // meaning not participating the calculation
             * Math.mini([1, {}, [1000 / 3], "4", "55"], 2); // 1
             * // as most customized Math functions does,
             * // calculation was supported by nesting array
             * Math.mini(1, [[[10], 20], 83], 20, [-9], [27, 72]); // -9
             *
             * // examples whose results are not same as Math.min()
             *
             * // Math.mini([])
             * // -> Math.min.apply({}, [])
             * // -> Math.min() -> Infinity
             * // Math.min([])
             * // -> Math.min(+[])
             * // -> Math.min(0) -> 0
             * Math.mini([]); // Infinity vs 0
             * // Math.mini([3], 2)
             * // -> +Math.min(3).toFixed(2) -> 3
             * // Math.min([3], 2)
             * // -> Math.min(+[3], 2)
             * // -> Math.min(3, 2) -> 2
             * Math.mini([3], 2); // 3 vs 2
             * // Math.mini([3], "2", 1, false)
             * // -> Math.mini([3], "2") // [3] is num_arr, "2" is fraction
             * // -> Math.mini([3], 2) -> 3
             * // Math.min([3], "2", 1, false)
             * // -> Math.min(+[3], +"2", 1, +false)
             * // -> Math.min(3, 2, 1, 0) -> 0
             * Math.mini([3], "2", 1, false); // 3 vs 0
             * @returns {number}
             */
            mini(num_arr, fraction) {
                let _arr, _fraction;

                if (Array.isArray(num_arr)) {
                    _arr = this._spreadArr(num_arr);
                    _fraction = fraction;
                } else {
                    _arr = this._spreadArr(arguments);
                }

                let _filtered = _arr.filter(x => !isNaN(+x));
                let _min = Math.min.apply({}, _filtered);
                let _frac = parseInt(_fraction);
                return isNaN(_frac) ? _min : +_min.toFixed(_frac);
            },
            /**
             * @summary Distance between two points (zh-CN: 两点间距)
             * @description Returns distance value between two points
             * @function Math.dist
             * @param {number[]} arr1 - a number array with two coordinates
             * @param {number[]} arr2 - another number array with two coordinates
             * @example
             * Math.dist(); // NaN
             * Math.dist([0, 0], [3, 4]); // 5
             * Math.dist([6, 7], [12, 15]); // 10
             * @returns {number}
             */
            dist(arr1, arr2) {
                if (!arr1 || !arr2) {
                    return NaN;
                }
                if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
                    return NaN;
                }
                if (arr1.length !== 2 || arr2.length !== 2) {
                    return NaN;
                }
                return Math.sqrt(
                    Math.pow(arr2[1] - arr1[1], 2) +
                    Math.pow(arr2[0] - arr1[0], 2)
                );
            },
            /**
             * Returns the logarithm (with both base and antilogarithm) of two numbers.
             * @function Math.logMn
             * @param base
             * @param antilogarithm
             * @param [fraction=13]
             * @example
             * console.log(Math.logMn(10, 100)); // 2 -- 10 ^ (2) = 100
             * console.log(Math.logMn(2, 1024)); // 10 -- 2 ^ (10) = 1024
             * console.log(Math.logMn(81, 9)); // 0.5 -- 81 ^ (0.5) = 9
             * @example
             * console.log(Math.logMn(3, 2187)); // 7 (with default fraction - 13)
             * console.log(Math.logMn(3, 2187, -1)); // 7.000000000000001
             * console.log(Math.logMn(3, 2187, 18)); // 7.000000000000001
             * console.log(Math.logMn(3, 2187, 5)); // 7
             * console.log(Math.logMn(3, 2187, 0)); // 7
             * @returns {number}
             */
            logMn(base, antilogarithm, fraction) {
                let _frac = typeof fraction === "number" ? fraction : 13;
                let _result = Math.log(antilogarithm) / Math.log(base);
                if (isNaN(_result) || !isFinite(_result) || ~_frac) {
                    return _result;
                }
                return Number(_result.toFixed(_frac));
            },
        });
    },
    JSON() {
        Object.assign(JSON, {
            /**
             * @function JSON.isJson
             * @param {string} str - JSON string
             * @see JSON.parse
             * @see JSON.stringify
             * @example
             * console.log(JSON.isJson('{}')); // true
             * console.log(JSON.isJson('{"a":1,"b":"2"}')); // true
             * console.log(JSON.isJson('{"a": 1, "b": "2"}')); // true -- ok with whitespace characters
             * console.log(JSON.isJson('{"a": 1, "b": "2",}')); // false -- trailing commas are not supported
             * @example
             * console.log(JSON.isJson('[]')); // true
             * console.log(JSON.isJson('[1,"2",[3]]')); // true
             * console.log(JSON.isJson('[1, "2", [3]]')); // true -- ok with whitespace characters
             * console.log(JSON.isJson('[1, "2", [3],]')); // false -- trailing commas are not supported
             * @example
             * let str_a = "{'a':1}";
             * let str_b = '{"a":1}';
             * if (JSON.isJson(str_a)) {
             *     console.log(JSON.parse(str_a));
             * }
             * if (JSON.isJson(str_b)) {
             *     console.log(JSON.parse(str_b));
             * }
             * @returns {boolean}
             */
            isJson(str) {
                if (typeof str === "string") {
                    try {
                        return this.stringify(this.parse(str)).replace(/\s*/g, "") === str.replace(/\s*/g, "");
                    } catch (e) {
                        // console.error(e);
                    }
                }
                return false;
            },
        });
    },
};

module.exports.load = function () {
    let _args_len = arguments.length;
    let _keys = [];

    if (!_args_len) {
        _keys = Object.keys(ext);
    } else {
        for (let i = 0; i < _args_len; i += 1) {
            _keys.push(arguments[i]);
        }
    }

    let _keys_len = _keys.length;
    let _toTitleCase = (str) => {
        let _head = str[0].toUpperCase();
        let _body = str.slice(1).toLowerCase();
        return _head + _body;
    };

    for (let i = 0; i < _keys_len; i += 1) {
        let _key = _toTitleCase(_keys[i]);
        if (_key in ext) {
            ext[_key]();
        }
    }
};