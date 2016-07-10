$(document).on 'ready page:load', ->
  $('.mobile-menu-button').on "click", ->
    $(this).toggleClass('open')
    $('.topbar ul').toggleClass('open')
    $('.content').toggleClass('open')