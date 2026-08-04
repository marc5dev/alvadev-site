// A tiny bit of JavaScript so you can see JS deploys too.

// 1. Put the current year in the footer.
document.getElementById("year").textContent = new Date().getFullYear();

// 2. Light/dark theme toggle.
var toggle = document.getElementById("theme-toggle");
toggle.addEventListener("click", function () {
  var root = document.documentElement;
  var isDark = root.getAttribute("data-theme") === "dark";
  root.setAttribute("data-theme", isDark ? "light" : "dark");
});
