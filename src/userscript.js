// TODO(HiDeoo) userscript comments

;(function () {
  'use strict'

  const comments = [...document.querySelectorAll('.pull-discussion-timeline .timeline-comment')]

  /**
   * @param {Element | null} element
   * @param {string} text
   */
  function isElementTextEqual(element, text) {
    return element instanceof HTMLElement && element.innerText === text
  }

  const houstonBotComments = comments.filter((comment) =>
    isElementTextEqual(comment.querySelector('.timeline-comment-header .author'), 'astrobot-houston'),
  )

  if (houstonBotComments.length === 0) return

  const lunariaComment = houstonBotComments.find((comment) =>
    isElementTextEqual(comment.querySelector('.comment-body > h2:first-child'), 'Lunaria Status Overview'),
  )

  if (!lunariaComment) return

  // FIXME(HiDeoo)
  console.error('🚨 [userscript.js:28] lunariaComment:', lunariaComment)
})()
