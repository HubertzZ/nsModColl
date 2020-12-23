/**
 * @NApiVersion 2.x
 */
define(["require", "exports"], function (require, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.realm = exports.token = exports.consumer = void 0;
    exports.consumer = {
        public: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        secret: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    };
    exports.token = {
        public: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
        secret: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
    };
    exports.realm = '1234567';
});
