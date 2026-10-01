// ==UserScript==
// @name         Astro Docs Preview Links
// @version      0.1.4
// @namespace    https://hideoo.dev/
// @description  Adds preview links of tracked files in GitHub pull requests to the Astro and Starlight documentation.
// @tag          productivity
// @license      MIT
// @author       HiDeoo (https://github.com/hideoo)
// @homepageURL  https://github.com/HiDeoo/userscript-astro-docs-preview-links
// @supportURL   https://github.com/HiDeoo/userscript-astro-docs-preview-links/issues
// @iconURL      https://raw.githubusercontent.com/primer/octicons/refs/heads/main/icons/link-24.svg
//
// @match        https://github.com/*
// @run-at       document-end
// ==/UserScript==

;(function () {
  'use strict'

  const docsPullRequestRegex = /^https:\/\/github\.com\/withastro\/(?:docs|starlight)\/pull\/\d+\/?$/
  const validExtensionsRegex = /\.mdx?$/

  /**
   * @param {Element[]} comments
   * @param {string} author
   * @returns {Element[]}
   */
  function getCommentsFromAuthor(comments, author) {
    return comments.filter((comment) =>
      isElementTextEqual(comment.querySelector('.timeline-comment-header .author'), author),
    )
  }

  /**
   * @param {Element | null} element
   * @param {string} text
   * @returns {boolean}
   */
  function isElementTextEqual(element, text) {
    return element instanceof HTMLElement && element.innerText === text
  }

  /**
   * @param {string} path
   * @returns {string}
   */
  function stripExtension(path) {
    const periodIndex = path.lastIndexOf('.')
    return path.slice(0, periodIndex > -1 ? periodIndex : undefined)
  }

  /**
   * @param {string} locale
   * @returns {boolean}
   */
  function isRootLocale(locale) {
    return location.href.startsWith('https://github.com/withastro/starlight/pull/') && locale === 'en'
  }

  /**
   * @param {string} url
   * @returns {boolean}
   */
  function isDocsPullRequestPage(url) {
    return docsPullRequestRegex.test(url.split(/[#?]/)[0] ?? url)
  }

  /**
   * @returns {boolean}
   */
  function addLinks() {
    const comments = [...document.querySelectorAll('.pull-discussion-timeline .timeline-comment')]

    const deployComment = getCommentsFromAuthor(comments, 'netlify').find((comment) => {
      const title = comment.querySelector('.comment-body > h3:first-child')
      return title instanceof HTMLElement && title.innerText.includes('Deploy Preview for')
    })
    if (!deployComment) return false

    const deployPreviewRow = [...deployComment.querySelectorAll('.comment-body td')].find((cell) =>
      isElementTextEqual(cell, '😎 Deploy Preview'),
    )?.parentElement
    if (!deployPreviewRow) return false

    const deployPreviewUrl = deployPreviewRow.querySelector('a')?.href
    if (!deployPreviewUrl) return false

    const lunariaComment = getCommentsFromAuthor(comments, 'astrobot-houston').find((comment) =>
      isElementTextEqual(comment.querySelector('.comment-body > h2:first-child'), 'Lunaria Status Overview'),
    )
    if (!lunariaComment) return false

    const trackedFileTable = lunariaComment.querySelector('.comment-body > h3 ~ markdown-accessiblity-table')
    if (!trackedFileTable) return true
    const trackedFilesRows = [...trackedFileTable.querySelectorAll('table > tbody > tr')]

    /** @type {Set<string>} */
    const trackedFiles = new Set()

    for (const row of trackedFilesRows) {
      const cells = [...row.querySelectorAll('td')]
      let path

      if (cells.length === 2) {
        // Lunaria versions >= 0.2.0 merge the locale into the displayed path.
        const href = cells[0]?.querySelector('a')?.href
        if (href) path = decodeURIComponent(href).split('/src/content/docs/')[1]
      } else {
        const [locale, localePath] = cells.map((cell) => cell.innerText)
        if (locale && localePath) path = `${isRootLocale(locale) ? '' : `${locale}/`}${localePath}`
      }

      if (!path || !validExtensionsRegex.test(path)) continue
      trackedFiles.add(`${stripExtension(path)}/`)
    }

    if (trackedFiles.size === 0) return true

    const linksRow = document.createElement('tr')

    const linksTitleCell = document.createElement('td')
    linksTitleCell.setAttribute('align', 'center')
    linksTitleCell.setAttribute('style', 'vertical-align: top;')
    linksTitleCell.innerText = '⚡ Tracked links'

    const linksContentCell = document.createElement('td')
    linksContentCell.append(
      ...[...trackedFiles].flatMap((pathname, index) => {
        if (pathname.endsWith('index/')) pathname = pathname.replace(/index\/$/, '')

        const link = document.createElement('a')
        link.href = deployPreviewUrl + pathname
        link.innerText = `/${pathname}`

        return index < trackedFiles.size - 1 ? [link, document.createElement('br')] : link
      }),
    )

    linksRow.append(linksTitleCell, linksContentCell)
    deployPreviewRow.after(linksRow)

    return true
  }

  function handlePagination() {
    const paginationButton = /** @type {HTMLButtonElement?} */ (
      document.querySelector('.ajax-pagination-form button.ajax-pagination-btn')
    )
    if (!paginationButton) return

    paginationButton.form?.addEventListener(
      'click',
      () => paginationButton.form?.addEventListener('page:loaded', run, { once: true }),
      { once: true },
    )
  }

  function run() {
    if (isDocsPullRequestPage(location.href)) {
      const didAddLinks = addLinks()
      if (!didAddLinks) handlePagination()
    }
  }

  run()

  document.addEventListener('turbo:render', run)
})()
