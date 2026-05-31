(function () {
  var canonical = document.getElementById("canonical-url");
  if (canonical) {
    function update() {
      canonical.href = window.location.origin + window.location.pathname;
    }
    update();
    var _pushState = history.pushState;
    var _replaceState = history.replaceState;
    history.pushState = function () { _pushState.apply(this, arguments); update(); };
    history.replaceState = function () { _replaceState.apply(this, arguments); update(); };
    window.addEventListener("popstate", update);
  }

  var config = document.querySelector('meta[name="analytics-config"]');
  if (config) {
    var endpoint = config.getAttribute("data-endpoint") || "";
    var websiteId = config.getAttribute("data-website-id") || "";
    if (endpoint && endpoint.charAt(0) !== "%") {
      var s = document.createElement("script");
      s.defer = true;
      s.src = endpoint + "/umami";
      if (websiteId && websiteId.charAt(0) !== "%") {
        s.setAttribute("data-website-id", websiteId);
      }
      document.head.appendChild(s);
    }
  }
})();
