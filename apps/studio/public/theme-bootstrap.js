;(function () {
  var theme

  try {
    theme = window.localStorage.getItem('theme')
  } catch {
    theme = undefined
  }

  var prefersDark = false
  try {
    prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    prefersDark = false
  }

  var resolvedTheme = theme === 'dark' || (theme !== 'light' && prefersDark) ? 'dark' : 'light'
  var root = document.documentElement

  root.classList.remove('light', 'dark')
  root.classList.add(resolvedTheme)
  root.style.colorScheme = resolvedTheme
})()
