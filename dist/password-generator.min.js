/*! password-generator - v0.2.1 (2013-04-28)
* -----------------
* Copyright(c) 2013 Bermi Ferrer <bermi@bermilabs.com>
* MIT Licensed
*/
(function(e){var t,n,r,i,s;r=/[a-zA-Z]$/,s=/[aeiouAEIOU]$/,n=/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]$/,t=e.localPasswordGeneratorLibraryName||"generatePassword",i=function(e,t,r,o){var u,a;return e==null&&(e=10),t==null&&(t=!0),r==null&&(r=/\w/),o==null&&(o=""),o.length>=e?o:(t&&(o.match(n)?r=s:r=n),a=Math.floor(Math.random()*100)%94+33,u=String.fromCharCode(a),t&&(u=u.toLowerCase()),u.match(r)?i(e,t,r,""+o+u):i(e,t,r,o))},(typeof exports!="undefined"?exports:e)[t]=i,typeof exports!="undefined"&&typeof module!="undefined"&&module.exports&&(module.exports=i)})(this);