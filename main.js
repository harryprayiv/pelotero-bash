// output/Main/foreign.js
function setHTML(html) {
  return () => {
    document.body.innerHTML = html;
  };
}

// output/Data.Array/foreign.js
var replicateFill = function(count, value) {
  if (count < 1) {
    return [];
  }
  var result = new Array(count);
  return result.fill(value);
};
var replicatePolyfill = function(count, value) {
  var result = [];
  var n = 0;
  for (var i = 0; i < count; i++) {
    result[n++] = value;
  }
  return result;
};
var replicateImpl = typeof Array.prototype.fill === "function" ? replicateFill : replicatePolyfill;
var fromFoldableImpl = function() {
  function Cons(head, tail) {
    this.head = head;
    this.tail = tail;
  }
  var emptyList = {};
  function curryCons(head) {
    return function(tail) {
      return new Cons(head, tail);
    };
  }
  function listToArray(list) {
    var result = [];
    var count = 0;
    var xs = list;
    while (xs !== emptyList) {
      result[count++] = xs.head;
      xs = xs.tail;
    }
    return result;
  }
  return function(foldr2, xs) {
    return listToArray(foldr2(curryCons)(emptyList)(xs));
  };
}();
var sortByImpl = function() {
  function mergeFromTo(compare2, fromOrdering, xs1, xs2, from, to) {
    var mid;
    var i;
    var j;
    var k;
    var x;
    var y;
    var c;
    mid = from + (to - from >> 1);
    if (mid - from > 1)
      mergeFromTo(compare2, fromOrdering, xs2, xs1, from, mid);
    if (to - mid > 1)
      mergeFromTo(compare2, fromOrdering, xs2, xs1, mid, to);
    i = from;
    j = mid;
    k = from;
    while (i < mid && j < to) {
      x = xs2[i];
      y = xs2[j];
      c = fromOrdering(compare2(x)(y));
      if (c > 0) {
        xs1[k++] = y;
        ++j;
      } else {
        xs1[k++] = x;
        ++i;
      }
    }
    while (i < mid) {
      xs1[k++] = xs2[i++];
    }
    while (j < to) {
      xs1[k++] = xs2[j++];
    }
  }
  return function(compare2, fromOrdering, xs) {
    var out;
    if (xs.length < 2)
      return xs;
    out = xs.slice(0);
    mergeFromTo(compare2, fromOrdering, out, xs.slice(0), 0, xs.length);
    return out;
  };
}();

// output/Data.Semigroup/foreign.js
var concatString = function(s1) {
  return function(s2) {
    return s1 + s2;
  };
};
var concatArray = function(xs) {
  return function(ys) {
    if (xs.length === 0)
      return ys;
    if (ys.length === 0)
      return xs;
    return xs.concat(ys);
  };
};

// output/Data.Semigroup/index.js
var semigroupString = {
  append: concatString
};
var semigroupArray = {
  append: concatArray
};
var append = function(dict) {
  return dict.append;
};

// output/Data.Bounded/foreign.js
var topChar = String.fromCharCode(65535);
var bottomChar = String.fromCharCode(0);
var topNumber = Number.POSITIVE_INFINITY;
var bottomNumber = Number.NEGATIVE_INFINITY;

// output/Data.Maybe/index.js
var Nothing = /* @__PURE__ */ function() {
  function Nothing2() {
  }
  ;
  Nothing2.value = new Nothing2();
  return Nothing2;
}();
var Just = /* @__PURE__ */ function() {
  function Just2(value0) {
    this.value0 = value0;
  }
  ;
  Just2.create = function(value0) {
    return new Just2(value0);
  };
  return Just2;
}();
var maybe = function(v) {
  return function(v1) {
    return function(v2) {
      if (v2 instanceof Nothing) {
        return v;
      }
      ;
      if (v2 instanceof Just) {
        return v1(v2.value0);
      }
      ;
      throw new Error("Failed pattern match at Data.Maybe (line 237, column 1 - line 237, column 51): " + [v.constructor.name, v1.constructor.name, v2.constructor.name]);
    };
  };
};

// output/Data.Monoid/index.js
var mempty = function(dict) {
  return dict.mempty;
};

// output/Data.Array.ST/foreign.js
var sortByImpl2 = function() {
  function mergeFromTo(compare2, fromOrdering, xs1, xs2, from, to) {
    var mid;
    var i;
    var j;
    var k;
    var x;
    var y;
    var c;
    mid = from + (to - from >> 1);
    if (mid - from > 1)
      mergeFromTo(compare2, fromOrdering, xs2, xs1, from, mid);
    if (to - mid > 1)
      mergeFromTo(compare2, fromOrdering, xs2, xs1, mid, to);
    i = from;
    j = mid;
    k = from;
    while (i < mid && j < to) {
      x = xs2[i];
      y = xs2[j];
      c = fromOrdering(compare2(x)(y));
      if (c > 0) {
        xs1[k++] = y;
        ++j;
      } else {
        xs1[k++] = x;
        ++i;
      }
    }
    while (i < mid) {
      xs1[k++] = xs2[i++];
    }
    while (j < to) {
      xs1[k++] = xs2[j++];
    }
  }
  return function(compare2, fromOrdering, xs) {
    if (xs.length < 2)
      return xs;
    mergeFromTo(compare2, fromOrdering, xs, xs.slice(0), 0, xs.length);
    return xs;
  };
}();

// output/Data.Foldable/foreign.js
var foldrArray = function(f) {
  return function(init) {
    return function(xs) {
      var acc = init;
      var len = xs.length;
      for (var i = len - 1; i >= 0; i--) {
        acc = f(xs[i])(acc);
      }
      return acc;
    };
  };
};
var foldlArray = function(f) {
  return function(init) {
    return function(xs) {
      var acc = init;
      var len = xs.length;
      for (var i = 0; i < len; i++) {
        acc = f(acc)(xs[i]);
      }
      return acc;
    };
  };
};

// output/Data.Foldable/index.js
var foldr = function(dict) {
  return dict.foldr;
};
var foldl = function(dict) {
  return dict.foldl;
};
var foldMapDefaultR = function(dictFoldable) {
  var foldr2 = foldr(dictFoldable);
  return function(dictMonoid) {
    var append3 = append(dictMonoid.Semigroup0());
    var mempty2 = mempty(dictMonoid);
    return function(f) {
      return foldr2(function(x) {
        return function(acc) {
          return append3(f(x))(acc);
        };
      })(mempty2);
    };
  };
};
var foldableArray = {
  foldr: foldrArray,
  foldl: foldlArray,
  foldMap: function(dictMonoid) {
    return foldMapDefaultR(foldableArray)(dictMonoid);
  }
};

// output/Data.Traversable/foreign.js
var traverseArrayImpl = function() {
  function array1(a) {
    return [a];
  }
  function array2(a) {
    return function(b) {
      return [a, b];
    };
  }
  function array3(a) {
    return function(b) {
      return function(c) {
        return [a, b, c];
      };
    };
  }
  function concat2(xs) {
    return function(ys) {
      return xs.concat(ys);
    };
  }
  return function(apply2) {
    return function(map2) {
      return function(pure2) {
        return function(f) {
          return function(array) {
            function go(bot, top2) {
              switch (top2 - bot) {
                case 0:
                  return pure2([]);
                case 1:
                  return map2(array1)(f(array[bot]));
                case 2:
                  return apply2(map2(array2)(f(array[bot])))(f(array[bot + 1]));
                case 3:
                  return apply2(apply2(map2(array3)(f(array[bot])))(f(array[bot + 1])))(f(array[bot + 2]));
                default:
                  var pivot = bot + Math.floor((top2 - bot) / 4) * 2;
                  return apply2(map2(concat2)(go(bot, pivot)))(go(pivot, top2));
              }
            }
            return go(0, array.length);
          };
        };
      };
    };
  };
}();

// output/Data.Array/index.js
var foldl2 = /* @__PURE__ */ foldl(foldableArray);

// output/Form/index.js
var append2 = /* @__PURE__ */ append(semigroupString);
var append1 = /* @__PURE__ */ append(semigroupArray);
var Attr = /* @__PURE__ */ function() {
  function Attr2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  Attr2.create = function(value0) {
    return function(value1) {
      return new Attr2(value0, value1);
    };
  };
  return Attr2;
}();
var Input = /* @__PURE__ */ function() {
  function Input2(value0, value1, value2) {
    this.value0 = value0;
    this.value1 = value1;
    this.value2 = value2;
  }
  ;
  Input2.create = function(value0) {
    return function(value1) {
      return function(value2) {
        return new Input2(value0, value1, value2);
      };
    };
  };
  return Input2;
}();
var Form = /* @__PURE__ */ function() {
  function Form2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  Form2.create = function(value0) {
    return function(value1) {
      return new Form2(value0, value1);
    };
  };
  return Form2;
}();
var WidgetNode = /* @__PURE__ */ function() {
  function WidgetNode2(value0, value1) {
    this.value0 = value0;
    this.value1 = value1;
  }
  ;
  WidgetNode2.create = function(value0) {
    return function(value1) {
      return new WidgetNode2(value0, value1);
    };
  };
  return WidgetNode2;
}();
var submit = /* @__PURE__ */ function() {
  return new Input("submit", Nothing.value, "Submit");
}();
var renderAttr = function(v) {
  return " " + (v.value0 + ('="' + (v.value1 + '"')));
};
var formWidget = /* @__PURE__ */ function() {
  return new Form("post", "https://httpbin.org/post");
}();
var foldAcc = function(fn) {
  return function(s) {
    var $20 = append2(s);
    return function($21) {
      return $20(fn($21));
    };
  };
};
var tag = function(content) {
  return function(name) {
    return function(attrs) {
      var attrs$prime = foldl2(foldAcc(renderAttr))("")(attrs);
      return "<" + (name + (attrs$prime + (">" + (content + ("</" + (name + ">"))))));
    };
  };
};
var renderElement = function(el) {
  return function(ct) {
    var tag$prime = tag(ct);
    if (el instanceof Form) {
      return tag$prime("form")([new Attr("method", el.value0), new Attr("action", el.value1)]);
    }
    ;
    if (el instanceof Input && el.value2 === "") {
      return tag$prime("input")(append1([new Attr("type", el.value0)])(maybe([])(function(n$prime) {
        return [new Attr("name", n$prime)];
      })(el.value1)));
    }
    ;
    if (el instanceof Input) {
      return tag(el.value2 + renderElement(new Input(el.value0, el.value1, ""))(""))("label")([]);
    }
    ;
    throw new Error("Failed pattern match at Form (line 41, column 44 - line 44, column 77): " + [el.constructor.name]);
  };
};
var render = function(v) {
  var ct = foldl2(foldAcc(render))("")(v.value1);
  return renderElement(v.value0)(ct);
};
var address = /* @__PURE__ */ function() {
  return new Input("text", new Just("wallet"), "Wallet");
}();
var form = /* @__PURE__ */ function() {
  return new WidgetNode(formWidget, [new WidgetNode(address, []), new WidgetNode(submit, [])]);
}();

// output/Main/index.js
var main = /* @__PURE__ */ setHTML(/* @__PURE__ */ render(form));

// <stdin>
main();
