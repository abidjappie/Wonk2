!(function (t) {
  function e(t) {
    (t.registerRegistry = Object.create(null)),
      (t.namedRegisterAliases = Object.create(null));
  }
  var r = t.System;
  e(r);
  var i,
    s,
    n = r.constructor.prototype,
    l = r.constructor,
    a = function () {
      l.call(this), e(this);
    };
  (a.prototype = n), (r.constructor = a);
  var o = n.register;
  n.register = function (t, e, r) {
    if ("string" != typeof t) return o.apply(this, arguments);
    var n = [e, r];
    return (
      (this.registerRegistry[t] = n),
      i || ((i = n), (s = t)),
      Promise.resolve().then(function () {
        (i = null), (s = null);
      }),
      o.call(this, e, r)
    );
  };
  var c = n.resolve;
  n.resolve = function (t, e) {
    try {
      return c.call(this, t, e);
    } catch (r) {
      if (t in this.registerRegistry) return this.namedRegisterAliases[t] || t;
      throw r;
    }
  };
  var u = n.instantiate;
  n.instantiate = function (t, e) {
    var r = this.registerRegistry[t];
    return r ? ((this.registerRegistry[t] = null), r) : u.call(this, t, e);
  };
  var g = n.getRegister;
  n.getRegister = function (t) {
    var e = g.call(this, t);
    s && t && (this.namedRegisterAliases[s] = t);
    var r = i || e;
    return (i = null), (s = null), r;
  };
})("undefined" != typeof self ? self : global);
//# sourceMappingURL=named-register.min.js.map
