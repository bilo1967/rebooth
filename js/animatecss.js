/*
 * From: https://github.com/daneden/animate.css 
 * (see there for full documentation, examples, ...)
 *
 * Usage:
 * 
 * First, load animate.min.css (see GitHub to download or get CDN location)
 * Then, use animations like this:
 *
 *   animateCSS('.my-element', 'bounce')
 * 
 * or
 * 
 *   animateCSS('.my-element', 'bounce', function() {
 *     // Do something after animation
 *   })
 */
/* 
function animateCSS(element, animationName, iterations=1, callback) {
    const node = document.querySelector(element)
    node.classList.add('animated', animationName)
    
    var c = node.style.animationIterationCount
    node.style.animationIterationCount = iterations;

    function handleAnimationEnd() {
        node.classList.remove('animated', animationName)
        node.removeEventListener('animationend', handleAnimationEnd)
        node.style.animationIterationCount = c;    

        if (typeof callback === 'function') callback()
    }

    node.addEventListener('animationend', handleAnimationEnd)
}
*/
const animateCSS = (element, animation, prefix = 'animate__') =>
  // We create a Promise and return it
  new Promise((resolve, reject) => {
      
    const animationName = `${prefix}${animation}`;
    const node = document.querySelector(element);

    node.classList.add(`${prefix}animated`, animationName);

    // When the animation ends, we clean the classes and resolve the Promise
    function handleAnimationEnd() {
      node.classList.remove(`${prefix}animated`, animationName);
      node.removeEventListener('animationend', handleAnimationEnd);

      resolve('Animation ended');
    }

    node.addEventListener('animationend', handleAnimationEnd);
});
